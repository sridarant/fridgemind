// src/services/feedbackService.js
// Single service layer for all user feedback on meal recommendations.
// No direct DB calls from UI — all tracking routes through here.
//
// Actions tracked:
//   accepted   — "Cook this" tapped
//   swapped    — user chose a different option (tapped alternate after seeing primary)
//   completed  — "Done / Cooked it" confirmed
//   rejected   — "Not for me" tapped
//   saved      — heart/favourite tapped on a recommended meal
//
// Feedback shapes the recommendation engine via two mechanisms:
//   1. localStorage weights (instant, no network needed)
//   2. Supabase recommendation_log (persistent, synced to server)
//
// Profile behaviour patterns are derived from the log and stored in
// profile.behaviour_data (jsonb) via /api/admin?action=update-behaviour.

const ADMIN = '/api/admin';

// ── localStorage keys ─────────────────────────────────────────────
const FB_KEY       = 'jiff-feedback-weights';   // { [mealId]: { score, lastAction, ts } }
const REJECTED_KEY = 'jiff-rejected-meals';      // Set<mealName> — never show again soon
const PREF_KEY     = 'jiff-learned-prefs';       // { cuisines: {[id]: count}, efforts: {quick:n,...} }

// ── Score adjustments per action ─────────────────────────────────
const SCORE_DELTA = {
  accepted:  +0.25,
  completed: +0.40,
  saved:     +0.20,
  swapped:   -0.10,
  rejected:  -0.50,
};

// ── Rejected meal window (days before showing again) ─────────────
const REJECTED_TTL_DAYS = 14;

// ─────────────────────────────────────────────────────────────────
// LOCAL WEIGHT STORE
// Keeps a map of mealId → learned score delta so the recommendation
// engine can apply it on top of the base scoring formula.
// ─────────────────────────────────────────────────────────────────
function loadWeights() {
  try { return JSON.parse(localStorage.getItem(FB_KEY) || '{}'); } catch { return {}; }
}

function saveWeights(w) {
  try { localStorage.setItem(FB_KEY, JSON.stringify(w)); } catch {}
}

export function getLearnedWeight(mealId) {
  const w = loadWeights();
  return w[mealId]?.score || 0;
}

export function getAllLearnedWeights() {
  return loadWeights();
}

// ─────────────────────────────────────────────────────────────────
// REJECTED MEAL STORE
// Meals rejected by the user are suppressed for REJECTED_TTL_DAYS.
// ─────────────────────────────────────────────────────────────────
function loadRejected() {
  try {
    const raw = JSON.parse(localStorage.getItem(REJECTED_KEY) || '{}');
    const cutoff = Date.now() - REJECTED_TTL_DAYS * 86400000;
    // Prune expired entries
    const pruned = {};
    Object.entries(raw).forEach(([name, ts]) => {
      if (ts > cutoff) pruned[name] = ts;
    });
    return pruned;
  } catch { return {}; }
}

function saveRejected(r) {
  try { localStorage.setItem(REJECTED_KEY, JSON.stringify(r)); } catch {}
}

export function isRecentlyRejected(mealName) {
  const r = loadRejected();
  const cutoff = Date.now() - REJECTED_TTL_DAYS * 86400000;
  const ts = r[mealName?.toLowerCase().trim()];
  return ts && ts > cutoff;
}

export function getRejectedMealNames() {
  return new Set(Object.keys(loadRejected()));
}

// ─────────────────────────────────────────────────────────────────
// LEARNED PREFERENCE STORE
// Tracks cuisine + effort patterns derived from accepted/completed actions.
// ─────────────────────────────────────────────────────────────────
function loadLearnedPrefs() {
  try { return JSON.parse(localStorage.getItem(PREF_KEY) || '{"cuisines":{},"efforts":{}}'); }
  catch { return { cuisines: {}, efforts: {} }; }
}

function saveLearnedPrefs(p) {
  try { localStorage.setItem(PREF_KEY, JSON.stringify(p)); } catch {}
}

export function getLearnedPrefs() {
  return loadLearnedPrefs();
}

// Derive sorted cuisine preferences from learned data
// Returns array of cuisine IDs sorted by count descending
export function getLearnedCuisinePreferences() {
  const prefs = loadLearnedPrefs();
  return Object.entries(prefs.cuisines || {})
    .sort((a, b) => b[1] - a[1])
    .map(([id]) => id);
}

// Derive preferred effort level from learned data: 'quick'|'moderate'|'any'
export function getLearnedEffortPreference() {
  const prefs = loadLearnedPrefs();
  const e = prefs.efforts || {};
  const quick    = (e.quick    || 0);
  const moderate = (e.moderate || 0);
  const involved = (e.involved || 0);
  const total = quick + moderate + involved;
  if (total < 3) return 'any'; // not enough data
  if (quick / total >= 0.6) return 'quick';
  if (involved / total >= 0.5) return 'involved';
  return 'moderate';
}

// ─────────────────────────────────────────────────────────────────
// CORE: logFeedback
//
// Call this for every user action on a recommended meal.
// Updates localStorage immediately (for instant next-session impact).
// Fires to Supabase async (fire-and-forget, never blocks UI).
//
// meal: { id, name, cuisine, effortMins } — from MEAL_CATALOGUE
// action: 'accepted'|'swapped'|'completed'|'rejected'|'saved'
// userId: string|null
// ─────────────────────────────────────────────────────────────────
export function logFeedback({ meal, action, userId = null, position = null }) {
  if (!meal || !action) return;

  const mealId   = meal.id   || meal.name?.toLowerCase().replace(/\s+/g, '_') || 'unknown';
  const mealName = (meal.name || '').toLowerCase().trim();
  const delta    = SCORE_DELTA[action] || 0;

  // ── 1. Update local weight store ─────────────────────────────
  const weights = loadWeights();
  const prev    = weights[mealId] || { score: 0, acceptCount: 0, rejectCount: 0 };
  const newScore = Math.max(-1, Math.min(1, (prev.score || 0) + delta));
  weights[mealId] = {
    score:        newScore,
    lastAction:   action,
    lastTs:       Date.now(),
    acceptCount:  (prev.acceptCount || 0) + (action === 'accepted' || action === 'completed' ? 1 : 0),
    rejectCount:  (prev.rejectCount || 0) + (action === 'rejected' ? 1 : 0),
  };
  saveWeights(weights);

  // ── 2. Update rejected set ───────────────────────────────────
  if (action === 'rejected') {
    const rejected = loadRejected();
    rejected[mealName] = Date.now();
    saveRejected(rejected);
  }

  // ── 3. Update learned preferences ───────────────────────────
  if (action === 'accepted' || action === 'completed' || action === 'saved') {
    const prefs = loadLearnedPrefs();

    // Cuisine count
    if (meal.cuisine && meal.cuisine !== 'any') {
      prefs.cuisines = prefs.cuisines || {};
      prefs.cuisines[meal.cuisine] = (prefs.cuisines[meal.cuisine] || 0) + 1;
    }

    // Effort bucket
    const effortMins = meal.effortMins || 30;
    prefs.efforts = prefs.efforts || {};
    if (effortMins <= 15) {
      prefs.efforts.quick = (prefs.efforts.quick || 0) + 1;
    } else if (effortMins <= 25) {
      prefs.efforts.moderate = (prefs.efforts.moderate || 0) + 1;
    } else {
      prefs.efforts.involved = (prefs.efforts.involved || 0) + 1;
    }

    saveLearnedPrefs(prefs);
  }

  // ── 4. Persist to Supabase async (fire-and-forget) ──────────
  _persistToSupabase({ mealId, mealName, action, userId, position, cuisine: meal.cuisine });
}

async function _persistToSupabase({ mealId, mealName, action, userId, position, cuisine }) {
  try {
    await fetch(`${ADMIN}?action=log-recommendation`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId,
        mealId,
        mealName,
        action,
        position,      // 0=primary, 1=first alternate, 2=second alternate
        cuisine,
        timestamp: new Date().toISOString(),
      }),
    });
  } catch {}
  // No error handling — analytics must never break the product
}

// ─────────────────────────────────────────────────────────────────
// SUPABASE: fetch recommendation log for a user (admin / insights use)
// ─────────────────────────────────────────────────────────────────
export async function fetchRecommendationLog(userId, { limit = 100 } = {}) {
  if (!userId) return [];
  try {
    const res = await fetch(
      `${ADMIN}?action=recommendation-log&userId=${encodeURIComponent(userId)}&limit=${limit}`,
      { method: 'GET' }
    );
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data?.log) ? data.log : [];
  } catch { return []; }
}

// ─────────────────────────────────────────────────────────────────
// SYNC learned prefs to Supabase profile.behaviour_data
// Call this after a session has accumulated enough feedback.
// ─────────────────────────────────────────────────────────────────
export async function syncBehaviourToProfile(userId) {
  if (!userId) return;
  const prefs  = loadLearnedPrefs();
  const weights = loadWeights();
  try {
    await fetch(`${ADMIN}?action=update-behaviour`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId,
        behaviourData: {
          learnedCuisines:  prefs.cuisines  || {},
          learnedEfforts:   prefs.efforts   || {},
          mealWeights:      weights,
          syncedAt:         new Date().toISOString(),
        },
      }),
    });
  } catch {}
}

// ─────────────────────────────────────────────────────────────────
// RESET (for testing / account wipe)
// ─────────────────────────────────────────────────────────────────
export function clearFeedbackData() {
  try {
    localStorage.removeItem(FB_KEY);
    localStorage.removeItem(REJECTED_KEY);
    localStorage.removeItem(PREF_KEY);
  } catch {}
}
