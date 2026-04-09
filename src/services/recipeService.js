// src/services/recipeService.js
// All recipe generation API calls. No UI imports, no React deps.
// Used by: Jiff.jsx, LittleChefs.jsx, KidsDishes.jsx, KidsLunchbox.jsx,
//          Plans.jsx, Planner.jsx, SacredKitchen.jsx

const BASE = '/api/suggest';

/**
 * Generate recipe suggestions from ingredients.
 * @param {object} params
 * @returns {Promise<{meals: object[], error?: string}>}
 */
export async function generateRecipes({
  ingredients = [],
  time = '30 min',
  diet = 'none',
  cuisine = 'any',
  mealType = 'any',
  servings = 2,
  count = 3,
  language = 'en',
  units = 'metric',
  tasteProfile = null,
  familyMembers = [],
  moodContext = null,
  weatherContext = null,
  dish = null,
  surpriseMode = false,
  kidsMode = false,
  kidsPromptOverride = null,
  country = 'IN',
} = {}) {
  const res = await fetch(BASE, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      ingredients, time, diet, cuisine, mealType,
      defaultServings: servings, count, language, units,
      tasteProfile, familyMembers, moodContext, weatherContext,
      dish, surpriseMode, kidsMode, kidsPromptOverride, country,
    }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `HTTP ${res.status}`);
  }
  return res.json();
}

/**
 * Translate an ingredient list to English.
 * @param {string[]} items
 * @param {string} sourceLang
 * @returns {Promise<string[]>}
 */
export async function translateIngredients(items, sourceLang) {
  const res = await fetch(`${BASE}?action=translate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ items, sourceLang }),
  });
  if (!res.ok) throw new Error(`Translate failed: HTTP ${res.status}`);
  const data = await res.json();
  return data.translated || items;
}

/**
 * Detect ingredients from a photo (base64).
 * @param {string} imageBase64
 * @param {string[]} existingIngredients
 * @returns {Promise<string[]>}
 */
export async function detectIngredientsFromPhoto(imageBase64, existingIngredients = []) {
  const res = await fetch('/api/detect-ingredients', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ image: imageBase64, existingIngredients }),
  });
  if (!res.ok) throw new Error(`Photo detect failed: HTTP ${res.status}`);
  const data = await res.json();
  return data.ingredients || [];
}
