// src/lib/discover.js — Discover tab data logic
// Pure functions — no React, no API calls.
// Uses festival.js for season/festival/region data.
// Personalisation computed from meal history passed in.

import { getCurrentSeason, getUpcomingFestival, getFeaturedRegion, getUpcomingFestivals } from './festival.js';

/**
 * Builds the full Discover page data structure.
 * @param {Object} opts
 * @param {Array}  opts.mealHistory   — array of meal_history rows from Supabase
 * @param {Object} opts.profile       — user profile (food_type, preferred_cuisines etc.)
 * @param {String} opts.country       — ISO country code (IN, US, etc.)
 */
export function buildDiscoverData({ mealHistory = [], profile = {}, country = 'IN' } = {}) {
  const season        = getCurrentSeason();
  const festival      = getUpcomingFestival();
  const featuredRegion= getFeaturedRegion();
  const upcoming      = getUpcomingFestivals(14);

  // ── "You haven't tried" personalisation ──────────────────────────
  const triedCuisines = new Set(
    mealHistory.map(h => h.cuisine).filter(Boolean)
  );
  const ALL_CUISINES = [
    'South Indian','North Indian','Bengali','Gujarati','Punjabi',
    'Rajasthani','Kerala','Hyderabadi','Goan','Maharashtrian',
    'Kashmiri','Odia','Chettinad','Continental','Chinese','Italian',
  ];
  const untried = ALL_CUISINES.filter(c => !triedCuisines.has(c));
  const suggestUntried = untried.length > 0 ? untried[Math.floor(Math.random() * Math.min(untried.length, 5))] : null;

  // ── Trending — static for now, data-driven later ─────────────────
  const TRENDING = [
    { name:'Masala oats',        emoji:'🥣', tags:['healthy','quick','breakfast'] },
    { name:'Ragi dosa',          emoji:'🫓', tags:['healthy','South Indian','breakfast'] },
    { name:'Zucchini paratha',   emoji:'🫓', tags:['fusion','healthy','lunch'] },
    { name:'Miso soup',          emoji:'🍜', tags:['fusion','quick','light'] },
    { name:'Paneer tikka bowl',  emoji:'🥘', tags:['high-protein','lunch','popular'] },
  ];

  // ── Cooking streak context ────────────────────────────────────────
  const sortedHistory = [...mealHistory].sort((a, b) =>
    new Date(b.generated_at) - new Date(a.generated_at)
  );
  const lastCooked = sortedHistory[0] || null;
  const daysSinceLastCook = lastCooked
    ? Math.floor((Date.now() - new Date(lastCooked.generated_at)) / 86400000)
    : null;

  return {
    season,
    festival,
    featuredRegion,
    upcomingFestivals: upcoming,
    untried: suggestUntried,
    trending: TRENDING,
    lastCooked,
    daysSinceLastCook,
    country,
  };
}

/**
 * Returns a weather-aware suggestion label for the banner.
 * @param {Object} weather — { temp, condition, emoji } from weather.js
 * @param {String} season  — season label
 */
export function getWeatherSuggestion(weather, season) {
  if (!weather) return { text: 'What are you cooking today?', cta: 'Explore recipes' };

  const temp = weather.temp;
  const cond = (weather.condition || '').toLowerCase();

  if (temp >= 38) return { text: 'Very hot today — something cooling?', cta: 'Try light recipes' };
  if (temp >= 32 && cond.includes('humid')) return { text: `${temp}°C and humid — rasam and curd rice weather`, cta: 'See comfort recipes' };
  if (temp >= 28) return { text: `Warm day ahead — a good time for ${season?.items?.[0] || 'seasonal'} dishes`, cta: 'Cook seasonal' };
  if (cond.includes('rain')) return { text: 'Raining outside — perfect for something hot and crispy', cta: 'Monsoon recipes' };
  if (temp <= 18) return { text: 'Cool weather — something warm and hearty?', cta: 'Try warming dishes' };
  return { text: 'Good cooking weather today', cta: 'Explore recipes' };
}

/**
 * Maps a mood to generation context for the API prompt.
 */
export function moodToContext(moodId) {
  const MOOD_MAP = {
    tired:     { label:'Tired 😴',    prompt:'quick and comforting, minimal effort, familiar flavours, ready in under 20 minutes', cuisineWeight:'South Indian,North Indian', time:'20 min' },
    stressed:  { label:'Stressed 😤', prompt:'simple steps, calming and familiar, no complex techniques, comfort food', cuisineWeight:'any', time:'30 min' },
    happy:     { label:'Happy 😊',    prompt:'celebratory, vibrant flavours, something slightly indulgent or fun to make', cuisineWeight:'any', time:'any' },
    unwell:    { label:'Unwell 🤒',   prompt:'gentle, easy to digest, light spicing, warm and nourishing — think rasam, khichdi, congee', cuisineWeight:'South Indian,North Indian', time:'30 min' },
    energetic: { label:'Energetic 💪',prompt:'adventurous cuisine, bold flavours, something new to try, can take more time and effort', cuisineWeight:'any', time:'any' },
  };
  return MOOD_MAP[moodId] || MOOD_MAP['happy'];
}
