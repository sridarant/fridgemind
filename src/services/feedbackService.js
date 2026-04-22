// src/services/feedbackService.js
// Single tracking layer for all user feedback on meal recommendations.
// No direct DB calls from UI — everything routes through here.
//
// Actions: accepted | swapped | completed | rejected | saved
//
// Two storage layers:
//   1. localStorage — instant, no network
//   2. Supabase recommendation_log — persistent, async fire-and-forget

import { recordSessionRejection, clearSessionRejectionStreak } from './recommendationService.js';

const ADMIN = '/api/admin';

const FB_KEY       = 'jiff-feedback-weights';
const REJECTED_KEY = 'jiff-rejected-meals';
const PREF_KEY     = 'jiff-learned-prefs';

const SCORE_DELTA = {
  accepted:  +0.25,
  completed: +0.40,
  saved:     +0.20,
  swapped:   -0.10,
  rejected:  -0.50,
};

const REJECTED_TTL_DAYS = 14;

// ── Weight store ──────────────────────────────────────────────────
function loadWeights() {
  try { return JSON.parse(localStorage.getItem(FB_KEY) || '{}'); } catch { return {}; }
}
function saveWeights(w) {
  try { localStorage.setItem(FB_KEY, JSON.stringify(w)); } catch {}
}

export function getLearnedWeight(mealId) {
  return loadWeights()[mealId]?.score || 0;
}
export function getAllLearnedWeights() {
  return loadWeights();
}

// ── Rejected store ────────────────────────────────────────────────
function loadRejected() {
  try {
    const raw    = JSON.parse(localStorage.getItem(REJECTED_KEY) || '{}');
    const cutoff = Date.now() - REJECTED_TTL_DAYS * 86400000;
    const pruned = {};
    Object.entries(raw).forEach(([name, ts]) => { if (ts > cutoff) pruned[name] = ts; });
    return pruned;
  } catch { return {}; }
}
function saveRejected(r) {
  try { localStorage.setItem(REJECTED_KEY, JSON.stringify(r)); } catch {}
}

export function isRecentlyRejected(mealName) {
  const r      = loadRejected();
  const cutoff = Date.now() - REJECTED_TTL_DAYS * 86400000;
  const ts     = r[mealName?.toLowerCase().trim()];
  return ts && ts > cutoff;
}
export function getRejectedMealNames() {
  return new Set(Object.keys(loadRejected()));
}

// ── Learned preference store ──────────────────────────────────────
function loadLearnedPrefs() {
  try { return JSON.parse(localStorage.getItem(PREF_KEY) || '{"cuisines":{},"efforts":{}}'); }
  catch { return { cuisines: {}, efforts: {} }; }
}
function saveLearnedPrefs(p) {
  try { localStorage.setItem(PREF_KEY, JSON.stringify(p)); } catch {}
}

export function getLearnedPrefs() { return loadLearnedPrefs(); }

export function getLearnedCuisinePreferences() {
  return Object.entries(loadLearnedPrefs().cuisines || {})
    .sort((a, b) => b[1] - a[1])
    .map(([id]) => id);
}

export function getLearnedEffortPreference() {
  const e     = loadLearnedPrefs().efforts || {};
  const quick = e.quick || 0, moderate = e.moderate || 0, involved = e.involved || 0;
  const total = quick + moderate + involved;
  if (total < 3) return 'any';
  if (quick    / total >= 0.6) return 'quick';
  if (involved / total >= 0.5) return 'involved';
  return 'moderate';
}

// ── Core: logFeedback ─────────────────────────────────────────────
export function logFeedback({ meal, action, userId = null, position = null }) {
  if (!meal || !action) return;

  const mealId   = meal.id   || (meal.name || '').toLowerCase().replace(/\s+/g, '_') || 'unknown';
  const mealName = (meal.name || '').toLowerCase().trim();
  const delta    = SCORE_DELTA[action] || 0;

  // 1. Weight store
  const weights = loadWeights();
  const prev    = weights[mealId] || { score: 0, acceptCount: 0, rejectCount: 0 };
  weights[mealId] = {
    score:       Math.max(-1, Math.min(1, (prev.score || 0) + delta)),
    lastAction:  action,
    lastTs:      Date.now(),
    acceptCount: (prev.acceptCount || 0) + (action === 'accepted' || action === 'completed' ? 1 : 0),
    rejectCount: (prev.rejectCount || 0) + (action === 'rejected' ? 1 : 0),
  };
  saveWeights(weights);

  // 2. Rejected set + session streak tracking
  if (action === 'rejected') {
    const rejected = loadRejected();
    rejected[mealName] = Date.now();
    saveRejected(rejected);
    recordSessionRejection();
  } else if (action === 'accepted' || action === 'completed') {
    clearSessionRejectionStreak();
  }

  // 3. Learned prefs
  if (action === 'accepted' || action === 'completed' || action === 'saved') {
    const prefs = loadLearnedPrefs();
    if (meal.cuisine && meal.cuisine !== 'any') {
      prefs.cuisines = prefs.cuisines || {};
      prefs.cuisines[meal.cuisine] = (prefs.cuisines[meal.cuisine] || 0) + 1;
    }
    const em = meal.effortMins || 30;
    prefs.efforts = prefs.efforts || {};
    if      (em <= 15) prefs.efforts.quick    = (prefs.efforts.quick    || 0) + 1;
    else if (em <= 25) prefs.efforts.moderate = (prefs.efforts.moderate || 0) + 1;
    else               prefs.efforts.involved = (prefs.efforts.involved || 0) + 1;
    saveLearnedPrefs(prefs);
  }

  // 4. Supabase async
  _persistToSupabase({ mealId, mealName, action, userId, position, cuisine: meal.cuisine });
}

async function _persistToSupabase({ mealId, mealName, action, userId, position, cuisine }) {
  try {
    await fetch(`${ADMIN}?action=log-recommendation`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, mealId, mealName, action, position, cuisine, timestamp: new Date().toISOString() }),
    });
  } catch {}
}

// ── Admin / insights ──────────────────────────────────────────────
export async function fetchRecommendationLog(userId, { limit = 100 } = {}) {
  if (!userId) return [];
  try {
    const res = await fetch(`${ADMIN}?action=recommendation-log&userId=${encodeURIComponent(userId)}&limit=${limit}`);
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data?.log) ? data.log : [];
  } catch { return []; }
}

export async function syncBehaviourToProfile(userId) {
  if (!userId) return;
  const prefs   = loadLearnedPrefs();
  const weights = loadWeights();
  try {
    await fetch(`${ADMIN}?action=update-behaviour`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId,
        behaviourData: {
          learnedCuisines: prefs.cuisines  || {},
          learnedEfforts:  prefs.efforts   || {},
          mealWeights:     weights,
          syncedAt:        new Date().toISOString(),
        },
      }),
    });
  } catch {}
}

export function clearFeedbackData() {
  try {
    localStorage.removeItem(FB_KEY);
    localStorage.removeItem(REJECTED_KEY);
    localStorage.removeItem(PREF_KEY);
  } catch {}
}
