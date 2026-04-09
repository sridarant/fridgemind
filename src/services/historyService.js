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
