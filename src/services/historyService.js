// src/services/historyService.js
// Meal history persistence via Supabase (through /api/admin).
// No UI imports, no React deps.

const ADMIN = '/api/admin';

/**
 * Fetch a user's meal history.
 * @param {string} userId
 * @returns {Promise<object[]>}
 */
export async function fetchHistory(userId) {
  if (!userId) return [];
  const res = await fetch(`${ADMIN}?action=meal-history&userId=${encodeURIComponent(userId)}`, {
    method: 'GET',
  });
  if (!res.ok) return [];
  const data = await res.json();
  return Array.isArray(data?.history) ? data.history : [];
}

/**
 * Save generated meals to history.
 * @param {object} params
 */
export async function saveHistory({ userId, meals, mealType, cuisine, servings, ingredients }) {
  if (!userId || !meals?.length) return;
  await fetch(`${ADMIN}?action=meal-history`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, meals, mealType, cuisine, servings, ingredients }),
  }).catch(() => {});
}

/**
 * Delete a history entry.
 * @param {string} id
 * @param {string} userId
 */
export async function deleteHistoryEntry(id, userId) {
  await fetch(`${ADMIN}?action=meal-history`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id, userId }),
  });
}

/**
 * Update a meal rating in history.
 * @param {object} params
 */
export async function updateRating({ userId, mealName, rating }) {
  if (!userId || !mealName || !rating) return;
  await fetch(`${ADMIN}?action=meal-history`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, mealName, rating }),
  }).catch(() => {});
}

/**
 * Build a ratings map from history entries.
 * @param {object[]} history
 * @returns {object} { mealName: rating }
 */
export function buildRatingsFromHistory(history) {
  const ratings = {};
  (history || []).forEach(m => {
    if (m.meal_name && m.rating) ratings[m.meal_name] = m.rating;
  });
  return ratings;
}

// ── Pantry learning ─────────────────────────────────────────────────
// Tracks how often user manually adds an ingredient in fridge card.
// After 3 sessions with the same item → suggest promoting to weekly staples.
const STAPLE_TRACK_KEY = 'jiff-staple-usage';
const PROMOTE_THRESHOLD = 3;

/**
 * Record that user added these items in fridge card this session.
 * @param {string[]} items
 */
export function trackStapleUsage(items) {
  try {
    const raw = localStorage.getItem(STAPLE_TRACK_KEY) || '{}';
    const usage = JSON.parse(raw);
    const today = new Date().toDateString();
    items.forEach(item => {
      const key = item.toLowerCase().trim();
      if (!usage[key]) usage[key] = { count:0, dates:[] };
      // Only count once per day per item
      if (!usage[key].dates.includes(today)) {
        usage[key].count++;
        usage[key].dates = [...usage[key].dates.slice(-6), today];
      }
    });
    localStorage.setItem(STAPLE_TRACK_KEY, JSON.stringify(usage));
  } catch {}
}

/**
 * Get items that have been manually added >= PROMOTE_THRESHOLD times
 * and are NOT already in the user's weekly_staples profile.
 * @param {string[]} currentStaples - user's saved weekly_staples IDs
 * @returns {string[]} item names to suggest
 */
export function getStapleSuggestions(currentStaples = []) {
  try {
    const raw = localStorage.getItem(STAPLE_TRACK_KEY) || '{}';
    const usage = JSON.parse(raw);
    const EXCLUDED_KEYWORDS = ['oil','ghee','salt','sugar','rice','dal','atta','spice','cumin','turmeric'];
    return Object.entries(usage)
      .filter(([key, data]) =>
        data.count >= PROMOTE_THRESHOLD &&
        !currentStaples.includes(key) &&
        !EXCLUDED_KEYWORDS.some(ex => key.includes(ex))
      )
      .sort((a, b) => b[1].count - a[1].count)
      .slice(0, 2)
      .map(([key]) => key.charAt(0).toUpperCase() + key.slice(1));
  } catch { return []; }
}

/**
 * Mark an item as already suggested (so we don't nag).
 * @param {string} item
 */
export function dismissStapleSuggestion(item) {
  try {
    const raw = localStorage.getItem(STAPLE_TRACK_KEY) || '{}';
    const usage = JSON.parse(raw);
    const key = item.toLowerCase().trim();
    if (usage[key]) { usage[key].suggested = true; }
    localStorage.setItem(STAPLE_TRACK_KEY, JSON.stringify(usage));
  } catch {}
}
