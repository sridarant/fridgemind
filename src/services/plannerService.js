// src/services/plannerService.js
// Weekly meal plan generation via /api/planner.
// No UI imports, no React deps.

/**
 * Generate a 7-day meal plan.
 * @param {object} params
 * @returns {Promise<{plan: object[], error?: string}>}
 */
export async function generatePlan({
  ingredients = [],
  diet = 'none',
  cuisine = 'any',
  mealTypes = ['breakfast', 'lunch', 'dinner'],
  servings = 2,
  language = 'en',
  units = 'metric',
  tasteProfile = null,
  goal = null,
} = {}) {
  const res = await fetch('/api/planner', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      ingredients, diet, cuisine, mealTypes, servings,
      language, units, tasteProfile,
    }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `HTTP ${res.status}`);
  }
  return res.json();
}
