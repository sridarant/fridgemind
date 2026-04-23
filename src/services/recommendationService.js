// src/services/recommendationService.js
// Unified decision engine for all journey entry types.
//
// All journeys call getPersonalisedRecommendations(context) via buildJourneyContext().
// No UI-level filtering. No duplicate logic per entry.
//
// Scoring:
//   score = (historyMatch * 0.35) + (preferenceMatch * 0.25) +
//           (contextMatch * 0.20) + (learnedBehaviour * 0.15) +
//           (varietyFactor * 0.05)
//
// Primary dominance:  primaryScore *= 1.2
// Time pressure:      boost ≤15 min meals when flag active
// Session adaptation: streak ≥2 → force cuisine + effort shift
// Repetition control: same meal blocked 3 sessions; same cuisine capped at 2 consecutive

import { parseFoodTypeIds } from '../lib/dietary.js';
import { getActiveEvent, getEventBoost } from '../lib/eventIntelligence.js';
import {
  getAllLearnedWeights,
  getRejectedMealNames,
  getLearnedCuisinePreferences,
  getLearnedEffortPreference,
  getHouseholdPatterns,
} from './feedbackService.js';

// ── Session state ─────────────────────────────────────────────────
const SK_REJECT  = 'jiff-session-reject-streak';
const SK_CUISINE = 'jiff-session-cuisine-history';

function sessionGet(key) {
  try { return JSON.parse(sessionStorage.getItem(key) || 'null'); } catch { return null; }
}
function sessionSet(key, val) {
  try { sessionStorage.setItem(key, JSON.stringify(val)); } catch {}
}

export function recordSessionRejection() {
  const n = (sessionGet(SK_REJECT) || 0) + 1;
  sessionSet(SK_REJECT, n);
  return n;
}
export function clearSessionRejectionStreak() {
  sessionSet(SK_REJECT, 0);
}
function getSessionRejectionStreak() {
  return sessionGet(SK_REJECT) || 0;
}
function getSessionCuisineHistory() {
  return sessionGet(SK_CUISINE) || [];
}
function appendSessionCuisine(cuisine) {
  const hist = getSessionCuisineHistory();
  hist.push(cuisine);
  sessionSet(SK_CUISINE, hist.slice(-6));
}

// ── Shown-meal store (3-day rolling window) ───────────────────────
const SHOWN_KEY = 'jiff-recently-shown';
const SHOWN_TTL = 3 * 24 * 60 * 60 * 1000;

export function getRecentlyShown() {
  try {
    const raw = JSON.parse(localStorage.getItem(SHOWN_KEY) || '[]');
    if (!Array.isArray(raw)) return [];
    const now = Date.now();
    return raw.filter(e => (now - (e.ts || 0)) < SHOWN_TTL).map(e => e.name);
  } catch { return []; }
}

export function markAsShown(mealNames = []) {
  try {
    const now  = Date.now();
    const prev = JSON.parse(localStorage.getItem(SHOWN_KEY) || '[]').filter(e => (now - (e.ts || 0)) < SHOWN_TTL);
    const names = new Set(prev.map(e => e.name));
    mealNames.forEach(n => { if (n) names.add(n.toLowerCase()); });
    localStorage.setItem(SHOWN_KEY, JSON.stringify([...names].slice(0, 21).map(name => ({ name, ts: now }))));
  } catch {}
}

export function clearRecentlyShown() {
  try { localStorage.removeItem(SHOWN_KEY); } catch {}
}

// ── Time pressure detection ───────────────────────────────────────
export function getTimePressureFlag(rejectStreak = 0) {
  const h = new Date().getHours();
  // Late evening, morning rush, or user has rejected 2+ times
  if (rejectStreak >= 2) return true;
  if (h >= 21 || (h >= 7 && h < 9)) return true;  // morning rush / late night
  return false;
}

// ── Journey context builder ───────────────────────────────────────
// All entry points call this to normalise into a unified context object.
// { mood, ingredients, mealType, effortPreference, continuityData, timePressureFlag }
export function buildJourneyContext({
  journeyType  = 'default',  // default|mood|ingredient|surprise|weekly|continuity|kids|leftover|hosting
  mood         = null,
  ingredients  = [],
  mealTypeOverride = null,
  profile      = null,
  mealHistory  = [],
  rejectStreak = 0,
} = {}) {
  const h = new Date().getHours();
  const autoMealType = mealTypeOverride || getMealTypeFromHour(h);

  // Continuity data: what was cooked recently (last 3 days)
  const cutoff3d = Date.now() - 3 * 86400000;
  const recent   = (mealHistory || [])
    .filter(m => new Date(m.generated_at || m.created_at || 0).getTime() > cutoff3d)
    .slice(0, 5);
  const recentCuisines = [...new Set(recent.map(m => m.cuisine).filter(Boolean))];
  const recentMeals    = recent.map(m => m.meal_name || m.meal?.name).filter(Boolean);

  const timePressureFlag = getTimePressureFlag(rejectStreak);

  // Effort preference: time pressure or morning/evening → prefer quick
  let effortPreference = 'any';
  if (timePressureFlag) effortPreference = 'quick';
  else if (autoMealType === 'breakfast') effortPreference = 'quick';
  else if (isWeekend()) effortPreference = 'any';
  else if (autoMealType === 'dinner') effortPreference = 'moderate';

  // Detect active event for context
  const activeEvent = getActiveEvent({ region: (profile && profile.country) || 'IN' });

  // Journey-type overrides
  if (journeyType === 'kids') {
    effortPreference = 'quick';  // kids meals → quick, mild
  }
  if (journeyType === 'leftover') {
    effortPreference = 'quick';  // leftovers → minimal effort
  }
  if (journeyType === 'hosting') {
    effortPreference = 'any';    // guests → allow elaborate
  }

  return {
    journeyType,
    mood,
    ingredients,
    mealType:          autoMealType,
    effortPreference,
    continuityData:    { recentCuisines, recentMeals },
    timePressureFlag,
    activeEvent,
  };
}

// ── Meal catalogue ────────────────────────────────────────────────
const MEAL_CATALOGUE = [
  // Breakfast
  { id:'poha',              name:'Poha',               emoji:'🍚', cuisine:'maharashtrian', mealType:['breakfast','snack'],         diet:['veg','vegan','jain','eggetarian'],  effortMins:15, tags:['quick','light','popular','mild'] },
  { id:'upma',              name:'Upma',               emoji:'🥣', cuisine:'south_indian',  mealType:['breakfast'],                 diet:['veg','vegan','jain','eggetarian'],  effortMins:20, tags:['quick','filling','mild'] },
  { id:'idli_sambar',       name:'Idli Sambar',        emoji:'🫓', cuisine:'tamil_nadu',    mealType:['breakfast','lunch'],         diet:['veg','vegan','jain','eggetarian'],  effortMins:10, tags:['light','popular','mild','healthy','protein'] },
  { id:'paratha',           name:'Paratha',            emoji:'🫓', cuisine:'punjabi',       mealType:['breakfast','lunch'],         diet:['veg','eggetarian'],                 effortMins:20, tags:['filling','popular','comfort'] },
  { id:'aloo_paratha',      name:'Aloo Paratha',       emoji:'🫓', cuisine:'punjabi',       mealType:['breakfast','lunch'],         diet:['veg','jain','eggetarian'],          effortMins:25, tags:['filling','popular','comfort','heavy'] },
  { id:'vermicelli',        name:'Vermicelli Upma',    emoji:'🍜', cuisine:'south_indian',  mealType:['breakfast'],                 diet:['veg','vegan','eggetarian'],         effortMins:15, tags:['quick','light','mild'] },
  { id:'oats_savory',       name:'Masala Oats',        emoji:'🥣', cuisine:'any',           mealType:['breakfast'],                 diet:['veg','vegan','jain','eggetarian'],  effortMins:10, tags:['quick','healthy','light','protein'] },
  { id:'egg_bhurji',        name:'Egg Bhurji',         emoji:'🍳', cuisine:'any',           mealType:['breakfast','snack'],         diet:['eggetarian','non-veg'],             effortMins:12, tags:['quick','protein','spicy','light'] },
  { id:'dosa',              name:'Plain Dosa',         emoji:'🥞', cuisine:'tamil_nadu',    mealType:['breakfast','snack'],         diet:['veg','vegan','eggetarian'],         effortMins:15, tags:['light','popular','mild'] },
  { id:'moong_chilla',      name:'Moong Dal Chilla',   emoji:'🥞', cuisine:'any',           mealType:['breakfast','snack'],         diet:['veg','vegan','jain','eggetarian'],  effortMins:20, tags:['healthy','protein','quick','light'] },
  { id:'pongal',            name:'Ven Pongal',         emoji:'🍲', cuisine:'tamil_nadu',    mealType:['breakfast','lunch'],         diet:['veg','jain'],                       effortMins:25, tags:['light','healthy','mild','comfort','festive'] },
  { id:'dhokla',            name:'Dhokla',             emoji:'🧆', cuisine:'gujarati',      mealType:['breakfast','snack'],         diet:['veg','vegan','eggetarian'],         effortMins:25, tags:['light','popular','healthy','mild'] },
  { id:'puttu_kadala',      name:'Puttu Kadala',       emoji:'🫙', cuisine:'kerala',        mealType:['breakfast'],                 diet:['veg','vegan'],                      effortMins:20, tags:['heavy','healthy','protein'] },
  // Lunch
  { id:'dal_rice',          name:'Dal Rice',           emoji:'🍛', cuisine:'any',           mealType:['lunch','dinner'],            diet:['veg','vegan','jain','eggetarian'],  effortMins:25, tags:['comfort','popular','filling','protein','healthy'] },
  { id:'rajma',             name:'Rajma Chawal',       emoji:'🫘', cuisine:'punjabi',       mealType:['lunch','dinner'],            diet:['veg','vegan','jain','eggetarian'],  effortMins:30, tags:['comfort','popular','protein','heavy'] },
  { id:'curd_rice',         name:'Curd Rice',          emoji:'🍚', cuisine:'tamil_nadu',    mealType:['lunch'],                     diet:['veg','eggetarian'],                 effortMins:10, tags:['light','quick','mild','summer'] },
  { id:'khichdi',           name:'Khichdi',            emoji:'🍲', cuisine:'any',           mealType:['lunch','dinner'],            diet:['veg','vegan','jain','eggetarian'],  effortMins:20, tags:['comfort','light','healthy','mild'] },
  { id:'roti_sabzi',        name:'Roti Sabzi',         emoji:'🫓', cuisine:'any',           mealType:['lunch','dinner'],            diet:['veg','vegan','jain','eggetarian'],  effortMins:25, tags:['everyday','popular','light'] },
  { id:'sambar_rice',       name:'Sambar Rice',        emoji:'🍛', cuisine:'tamil_nadu',    mealType:['lunch'],                     diet:['veg','vegan','eggetarian'],         effortMins:20, tags:['comfort','popular','spicy','protein'] },
  { id:'chole_bhature',     name:'Chole Bhature',      emoji:'🫘', cuisine:'punjabi',       mealType:['lunch'],                     diet:['veg','vegan','jain','eggetarian'],  effortMins:30, tags:['indulgent','popular','heavy','spicy'] },
  { id:'biryani_veg',       name:'Veg Biryani',        emoji:'🍚', cuisine:'hyderabadi',    mealType:['lunch','dinner'],            diet:['veg','jain','eggetarian'],          effortMins:40, tags:['indulgent','popular','festive','spicy','heavy'] },
  { id:'misal_pav',         name:'Misal Pav',          emoji:'🌶️', cuisine:'maharashtrian', mealType:['breakfast','lunch','snack'], diet:['veg','vegan','jain','eggetarian'],  effortMins:25, tags:['spicy','popular','protein','heavy'] },
  { id:'thepla',            name:'Thepla',             emoji:'🫓', cuisine:'gujarati',      mealType:['breakfast','lunch'],         diet:['veg','jain'],                       effortMins:20, tags:['light','quick','healthy','mild'] },
  { id:'rasam_rice',        name:'Rasam Rice',         emoji:'🍲', cuisine:'tamil_nadu',    mealType:['lunch','dinner'],            diet:['veg','vegan','eggetarian'],         effortMins:20, tags:['light','spicy','healthy','monsoon','comfort'] },
  // Dinner
  { id:'palak_paneer',      name:'Palak Paneer',       emoji:'🥬', cuisine:'punjabi',       mealType:['dinner','lunch'],            diet:['veg','eggetarian'],                 effortMins:25, tags:['popular','healthy','comfort','protein','spicy'] },
  { id:'dal_tadka',         name:'Dal Tadka',          emoji:'🍛', cuisine:'any',           mealType:['dinner','lunch'],            diet:['veg','vegan','jain','eggetarian'],  effortMins:20, tags:['comfort','popular','everyday','protein'] },
  { id:'aloo_gobi',         name:'Aloo Gobi',          emoji:'🥦', cuisine:'punjabi',       mealType:['dinner','lunch'],            diet:['veg','vegan','jain','eggetarian'],  effortMins:25, tags:['everyday','popular','mild','light'] },
  { id:'chicken_curry',     name:'Chicken Curry',      emoji:'🍗', cuisine:'any',           mealType:['dinner','lunch'],            diet:['non-veg','halal'],                  effortMins:35, tags:['popular','protein','comfort','spicy'] },
  { id:'fish_curry',        name:'Fish Curry',         emoji:'🐟', cuisine:'bengali',       mealType:['dinner','lunch'],            diet:['non-veg','halal'],                  effortMins:30, tags:['popular','protein','spicy','comfort'] },
  { id:'butter_chicken',    name:'Butter Chicken',     emoji:'🍗', cuisine:'punjabi',       mealType:['dinner'],                    diet:['non-veg','halal'],                  effortMins:35, tags:['popular','comfort','indulgent','protein'] },
  { id:'hyderabadi_biryani',name:'Hyderabadi Biryani', emoji:'🍚', cuisine:'hyderabadi',    mealType:['lunch','dinner'],            diet:['non-veg','halal'],                  effortMins:60, tags:['special','popular','festive','spicy','heavy'] },
  { id:'macher_jhol',       name:'Macher Jhol',        emoji:'🐟', cuisine:'bengali',       mealType:['lunch','dinner'],            diet:['non-veg','halal'],                  effortMins:30, tags:['comfort','protein','spicy'] },
  { id:'avial',             name:'Avial',              emoji:'🥥', cuisine:'kerala',        mealType:['lunch','dinner'],            diet:['veg','vegan','eggetarian'],         effortMins:30, tags:['healthy','mild','festive'] },
  { id:'fish_curry_kerala', name:'Kerala Fish Curry',  emoji:'🐠', cuisine:'kerala',        mealType:['dinner','lunch'],            diet:['non-veg','halal'],                  effortMins:30, tags:['heavy','spicy','protein','comfort'] },
  { id:'sarson_saag',       name:'Sarson da Saag',     emoji:'🥬', cuisine:'punjabi',       mealType:['lunch','dinner'],            diet:['veg'],                              effortMins:30, tags:['healthy','heavy','winter','festive'] },
  { id:'palak_dal',         name:'Palak Dal',          emoji:'🥬', cuisine:'any',           mealType:['lunch','dinner'],            diet:['veg','vegan','jain','eggetarian'],  effortMins:25, tags:['healthy','protein','light','spicy'] },
  { id:'moong_soup',        name:'Moong Dal Soup',     emoji:'🥣', cuisine:'any',           mealType:['dinner','lunch'],            diet:['veg','vegan','jain','eggetarian'],  effortMins:20, tags:['light','healthy','protein','mild'] },
  // Snack
  { id:'samosa',            name:'Samosa',             emoji:'🥟', cuisine:'any',           mealType:['snack'],                     diet:['veg','vegan','jain','eggetarian'],  effortMins:30, tags:['popular','comfort','spicy','heavy'] },
  { id:'pakora',            name:'Onion Pakora',       emoji:'🧅', cuisine:'any',           mealType:['snack'],                     diet:['veg','vegan','jain','eggetarian'],  effortMins:20, tags:['popular','monsoon','comfort','spicy'] },
  { id:'vada',              name:'Medu Vada',          emoji:'🍩', cuisine:'tamil_nadu',    mealType:['breakfast','snack'],         diet:['veg','vegan','eggetarian'],         effortMins:25, tags:['popular','crispy','protein'] },
  { id:'bread_pakora',      name:'Bread Pakora',       emoji:'🥪', cuisine:'any',           mealType:['snack','breakfast'],         diet:['veg','eggetarian'],                 effortMins:15, tags:['quick','popular','comfort','monsoon'] },
  { id:'bhel_puri',         name:'Bhel Puri',          emoji:'🥗', cuisine:'maharashtrian', mealType:['snack'],                     diet:['veg','vegan','jain'],               effortMins:10, tags:['quick','light','popular'] },
  { id:'sprouts_salad',     name:'Sprouts Salad',      emoji:'🥗', cuisine:'any',           mealType:['snack','breakfast'],         diet:['veg','vegan','jain','eggetarian'],  effortMins:10, tags:['quick','healthy','light','protein'] },
  // Leftover
  { id:'fried_rice',        name:'Fried Rice',         emoji:'🍳', cuisine:'any',           mealType:['lunch','dinner'],            diet:['non-veg','veg','eggetarian'],       effortMins:15, tags:['quick','leftover','comfort'] },
  { id:'chapati_rolls',     name:'Chapati Rolls',      emoji:'🌯', cuisine:'any',           mealType:['lunch','snack'],             diet:['veg','non-veg'],                    effortMins:10, tags:['quick','leftover','light'] },
  { id:'dal_paratha',       name:'Dal Paratha',        emoji:'🫓', cuisine:'any',           mealType:['breakfast','lunch'],         diet:['veg'],                              effortMins:20, tags:['leftover','comfort','protein'] },
];

// ── Utilities ─────────────────────────────────────────────────────
function getMealTypeFromHour(h) {
  if (h >= 5  && h < 11) return 'breakfast';
  if (h >= 11 && h < 16) return 'lunch';
  if (h >= 16 && h < 19) return 'snack';
  return 'dinner';
}

function isWeekend() {
  const d = new Date().getDay();
  return d === 0 || d === 6;
}

function isDietaryCompatible(meal, userDietIds) {
  if (!userDietIds || !userDietIds.length) return true;
  if (userDietIds.includes('non-veg')) return true;
  if (userDietIds.includes('vegan') && !userDietIds.includes('veg')) return meal.diet.includes('vegan');
  if (userDietIds.includes('jain'))       return meal.diet.includes('jain') || meal.diet.includes('veg');
  if (userDietIds.includes('halal'))      return meal.diet.includes('halal') || meal.diet.includes('veg');
  if (userDietIds.includes('eggetarian')) return meal.diet.includes('veg')  || meal.diet.includes('eggetarian');
  if (userDietIds.includes('veg'))        return meal.diet.includes('veg');
  return userDietIds.some(d => meal.diet.includes(d));
}

function buildRecentHistorySet(mealHistory, windowDays = 7) {
  const cutoff = Date.now() - windowDays * 86400000;
  const names  = new Set();
  (mealHistory || []).forEach(h => {
    const ts = new Date(h.generated_at || h.created_at || 0).getTime();
    if (ts > cutoff) {
      if (h.meal_name)  names.add(h.meal_name.toLowerCase().trim());
      if (h.meal?.name) names.add(h.meal.name.toLowerCase().trim());
    }
  });
  return names;
}

function normC(raw) { return (raw || '').toLowerCase().replace(/[^a-z_]/g, ''); }

function capCuisine(id) {
  if (!id || id === 'any') return '';
  return id.replace(/_/g, ' ').split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}

// ── Score a single meal ───────────────────────────────────────────
function scoreMeal(meal, ctx) {
  const {
    userDietIds, userCuisines, userGoal, userSkill,
    ratings, mealHistory, recentHistorySet, recentlyShownSet, rejectedSet,
    targetMealType, effortBias, timePressureFlag,
    learnedWeights, learnedCuisines, learnedEffortPref,
    forceShift, forceShiftExcludedCuisines, forceShiftExcludeHeavy,
    continuityRecentCuisines, activeEvent,
  } = ctx;

  const nameLower       = meal.name.toLowerCase().trim();
  const mealCuisineNorm = normC(meal.cuisine);

  // Hard exclusions
  if (rejectedSet.has(nameLower)) return null;
  if (forceShift && forceShiftExcludedCuisines.has(mealCuisineNorm)) return null;
  if (forceShift && forceShiftExcludeHeavy && meal.tags.includes('heavy')) return null;

  // Time pressure: hard exclude slow meals
  if (timePressureFlag && meal.effortMins > 30) return null;

  // Strict breakfast gate
  if (targetMealType === 'breakfast' && !meal.mealType.includes('breakfast')) return null;

  // ── 1. History match (weight 0.35) ────────────────────────────
  let historyScore    = 0;
  let historyHighRate = 0;
  let historyWhyKey   = null;

  (mealHistory || []).slice(0, 30).forEach(h => {
    const hCuisine = normC(h.cuisine);
    const rating   = (ratings && (ratings[h.meal_name] || ratings[h.meal?.name])) || h.rating || 0;
    if (hCuisine === mealCuisineNorm) {
      const boost = rating >= 4 ? 0.55 : rating >= 3 ? 0.28 : 0.1;
      historyScore = Math.min(1, historyScore + boost);
      if (rating >= 4) { historyWhyKey = 'liked_cuisine'; historyHighRate = Math.max(historyHighRate, rating); }
    }
  });

  // ── 2. Preference match (weight 0.25) ─────────────────────────
  const allCuisines   = [...new Set([...userCuisines.map(normC), ...learnedCuisines.map(normC)])];
  const prefIdx       = allCuisines.indexOf(mealCuisineNorm);
  let preferenceScore = 0;

  if (prefIdx === 0)      preferenceScore += 0.75;
  else if (prefIdx === 1) preferenceScore += 0.45;
  else if (prefIdx >= 2)  preferenceScore += 0.20;
  else if (meal.cuisine === 'any') preferenceScore += 0.12;

  if (userGoal === 'eat_healthier' && (meal.tags.includes('healthy') || meal.tags.includes('light'))) preferenceScore += 0.30;
  if (userGoal === 'cook_faster'   && meal.effortMins <= 15) preferenceScore += 0.40;
  else if (userGoal === 'cook_faster' && meal.effortMins <= 20) preferenceScore += 0.20;
  if (userGoal === 'reduce_waste'  && meal.tags.includes('leftover')) preferenceScore += 0.35;
  if (userGoal === 'try_new_things' && !allCuisines.includes(mealCuisineNorm) && meal.cuisine !== 'any') preferenceScore += 0.35;
  if (userSkill === 'beginner' && meal.effortMins <= 20)  preferenceScore += 0.10;
  if (userSkill === 'advanced' && meal.effortMins >= 30)  preferenceScore += 0.10;
  // Event intelligence boost
  const eventBoost = getEventBoost(meal, activeEvent);
  if (eventBoost > 0) preferenceScore += eventBoost;

  preferenceScore = Math.min(1, preferenceScore);

  // ── 3. Context match (weight 0.20) ────────────────────────────
  let contextScore = 0;

  if (meal.mealType.includes(targetMealType)) contextScore += 0.60;

  if (effortBias === 'quick') {
    if (meal.effortMins <= 15)      contextScore += 0.30;
    else if (meal.effortMins <= 20) contextScore += 0.15;
    else if (meal.effortMins > 30)  contextScore -= 0.15;
  } else if (effortBias === 'moderate') {
    if (meal.effortMins <= 25)      contextScore += 0.20;
  } else {
    contextScore += 0.10;
  }

  // Time pressure bonus for very quick meals
  if (timePressureFlag && meal.effortMins <= 15) contextScore += 0.20;

  const h = new Date().getHours();
  if (h >= 19 && h < 23 && meal.tags.includes('light'))  contextScore += 0.10;
  if (h >= 5  && h < 9  && meal.tags.includes('quick'))  contextScore += 0.10;

  contextScore = Math.min(1, Math.max(0, contextScore));

  // ── 4. Learned behaviour (weight 0.15) ────────────────────────
  let learnedScore = 0;
  const learnedW   = learnedWeights[meal.id] || 0;
  learnedScore     = (learnedW + 1) / 2;

  if (learnedEffortPref === 'quick'    && meal.effortMins <= 15) learnedScore = Math.min(1, learnedScore + 0.30);
  if (learnedEffortPref === 'moderate' && meal.effortMins <= 25 && meal.effortMins > 15) learnedScore = Math.min(1, learnedScore + 0.20);
  if (learnedEffortPref === 'involved' && meal.effortMins > 25) learnedScore = Math.min(1, learnedScore + 0.20);

  if (learnedCuisines.length > 0) {
    const lnorm = learnedCuisines.map(normC);
    const lIdx  = lnorm.indexOf(mealCuisineNorm);
    if (lIdx === 0)      learnedScore = Math.min(1, learnedScore + 0.25);
    else if (lIdx === 1) learnedScore = Math.min(1, learnedScore + 0.12);
  }

  // Continuity: penalise cuisines cooked in last 3 days (encourage variety)
  if (continuityRecentCuisines.includes(mealCuisineNorm) && meal.cuisine !== 'any') {
    learnedScore = Math.max(0, learnedScore - 0.15);
  }

  // ── 5. Variety factor (weight 0.05) ───────────────────────────
  let varietyFactor = 1.0;
  if (recentlyShownSet.has(nameLower))      varietyFactor = 0.02;
  else if (recentHistorySet.has(nameLower)) varietyFactor = 0.25;

  const cuisineHist = getSessionCuisineHistory();
  const lastTwo     = cuisineHist.slice(-2);
  if (lastTwo.length === 2 && lastTwo.every(c => c === mealCuisineNorm)) {
    varietyFactor = Math.min(varietyFactor, 0.15);
  }
  if (!cuisineHist.slice(-5).includes(mealCuisineNorm) && mealCuisineNorm !== 'any') {
    varietyFactor = Math.min(1, varietyFactor + 0.15);
  }

  const score =
    (historyScore    * 0.35) +
    (preferenceScore * 0.25) +
    (contextScore    * 0.20) +
    (learnedScore    * 0.15) +
    (varietyFactor   * 0.05);

  return {
    meal, score,
    _historyWhyKey: historyWhyKey, _historyHighRate: historyHighRate,
    _prefIdx: prefIdx, _goal: userGoal, _targetMealType: targetMealType,
    _effortBias: effortBias, _learnedW: learnedW,
    _learnedCuisines: learnedCuisines, _allCuisines: allCuisines,
    _learnedEffortPref: learnedEffortPref, _timePressure: timePressureFlag,
  };
}

// ── Why builder ─── natural language, no robotic patterns ─────────
// Returns { line1, line2, effortLabel, effortMins }
// line1 → reason  ("This fits your taste")
// line2 → context ("Quick for this morning")
function buildWhyParts(item) {
  const {
    meal, _learnedW, _historyWhyKey,
    _prefIdx, _goal, _targetMealType, _effortBias,
    _learnedCuisines, _allCuisines, _learnedEffortPref, _timePressure,
  } = item;

  const period = ({ breakfast:'this morning', lunch:'for lunch', snack:'right now', dinner:'tonight' })[_targetMealType] || 'right now';

  // ── Line 1: the reason ──────────────────────────────────────────
  let line1 = '';

  if (_learnedW >= 0.4) {
    line1 = "You've liked this style before";
  } else if (_historyWhyKey === 'liked_cuisine' && meal.cuisine !== 'any') {
    line1 = "You've liked similar meals";
  } else if (_prefIdx === 0 && meal.cuisine !== 'any') {
    line1 = capCuisine(meal.cuisine) + ' is your favourite — great choice';
  } else if (_prefIdx === 1 && meal.cuisine !== 'any') {
    line1 = 'This fits your taste';
  } else if (_learnedCuisines && _learnedCuisines.length > 0 && _learnedCuisines.map(normC).includes(normC(meal.cuisine)) && _prefIdx < 0) {
    line1 = "You've been cooking " + capCuisine(meal.cuisine) + ' lately';
  } else if (_goal === 'eat_healthier' && (meal.tags.includes('healthy') || meal.tags.includes('light'))) {
    line1 = 'Supports your healthy eating goal';
  } else if (_goal === 'cook_faster' && meal.effortMins <= 15) {
    line1 = 'Ready fast — matches your goal';
  } else if (_goal === 'reduce_waste' && meal.tags.includes('leftover')) {
    line1 = 'Uses what you have';
  } else if (_goal === 'try_new_things' && !(_allCuisines || []).includes(normC(meal.cuisine)) && meal.cuisine !== 'any') {
    line1 = 'Something different for you';
  } else if (meal.tags.includes('popular')) {
    line1 = 'A favourite across India';
  } else if (meal.tags.includes('comfort')) {
    line1 = 'A classic comfort dish';
  } else if (meal.tags.includes('healthy')) {
    line1 = 'A wholesome choice';
  } else {
    line1 = 'Looks good for today';
  }

  // ── Line 2: the context ─────────────────────────────────────────
  let line2 = '';

  if (_timePressure && meal.effortMins <= 15) {
    line2 = meal.effortMins + ' min — quick for ' + period;
  } else if (_effortBias === 'quick' && meal.effortMins <= 15) {
    line2 = 'Quick for ' + period;
  } else if (_targetMealType === 'breakfast' && meal.effortMins <= 15) {
    line2 = 'Light and quick this morning';
  } else if (_targetMealType === 'dinner' && meal.effortMins <= 20) {
    line2 = 'Easy to make tonight';
  } else if (_targetMealType === 'snack') {
    line2 = 'Ready in ' + meal.effortMins + ' min';
  } else if (_learnedEffortPref === 'quick' && meal.effortMins <= 15) {
    line2 = 'Matches your preference for quick meals';
  } else if (isWeekend() && meal.effortMins >= 30) {
    line2 = 'Worth the effort this weekend';
  } else {
    line2 = meal.effortMins + ' min · good fit ' + period;
  }

  const effortLabel = meal.effortMins <= 15 ? 'Quick' : meal.effortMins <= 25 ? 'Medium effort' : 'Takes a bit longer';

  return { line1, line2, effortLabel, effortMins: meal.effortMins };
}

// ── Main export ───────────────────────────────────────────────────
export function getPersonalisedRecommendations({
  profile          = null,
  ratings          = {},
  mealHistory      = [],
  overrideMealType = null,
  journeyContext   = null,   // result of buildJourneyContext() — optional override
} = {}) {
  const h              = new Date().getHours();
  const targetMealType = (journeyContext && journeyContext.mealType) || overrideMealType || getMealTypeFromHour(h);
  const rejectStreak   = getSessionRejectionStreak();
  const timePressureFlag = (journeyContext && journeyContext.timePressureFlag) || getTimePressureFlag(rejectStreak);

  // Effort bias from journey context or auto-detect
  const effortBias = (() => {
    if (journeyContext && journeyContext.effortPreference) return journeyContext.effortPreference;
    if (timePressureFlag) return 'quick';
    if (targetMealType === 'breakfast') return 'quick';
    if (isWeekend()) return 'any';
    if (targetMealType === 'dinner') return 'moderate';
    return 'any';
  })();

  const rawFoodType  = (profile && profile.food_type) || [];
  const userDietIds  = parseFoodTypeIds(rawFoodType);
  const userCuisines = (profile && profile.preferred_cuisines) || [];
  const userGoal     = (profile && profile.active_goal)        || '';
  const userSkill    = (profile && profile.skill_level)        || 'home_cook';

  const behaviourData  = (profile && profile.behaviour_data)   || {};
  const behaviourMerge = typeof behaviourData === 'string'
    ? (() => { try { return JSON.parse(behaviourData); } catch { return {}; } })()
    : behaviourData;

  const learnedCuisines   = getLearnedCuisinePreferences();
  const learnedEffortPref = getLearnedEffortPreference();
  const learnedWeightsRaw = getAllLearnedWeights();
  const learnedWeights    = {};
  Object.entries(learnedWeightsRaw).forEach(([id, d]) => { learnedWeights[id] = d.score || 0; });
  Object.entries(behaviourMerge.mealWeights || {}).forEach(([id, d]) => {
    if (learnedWeights[id] === undefined) learnedWeights[id] = d.score || 0;
  });

  const recentHistorySet = buildRecentHistorySet(mealHistory, 7);
  const recentlyShownSet = new Set(getRecentlyShown());
  const rejectedSet      = getRejectedMealNames();

  // Session adaptation
  const forceShift = rejectStreak >= 2;
  const forceShiftExcludedCuisines = forceShift
    ? new Set(getSessionCuisineHistory().slice(-3).map(normC))
    : new Set();
  const forceShiftExcludeHeavy = forceShift;

  // Continuity: cuisines cooked in last 3 days (penalise repetition)
  const continuityRecentCuisines = journeyContext
    ? (journeyContext.continuityData?.recentCuisines || []).map(normC)
    : [];

  // Active event from journey context or auto-detect
  const activeEvent = (journeyContext && journeyContext.activeEvent)
    || getActiveEvent({ region: (profile && profile.country) || 'IN' });

  const ctx = {
    userDietIds, userCuisines, userGoal, userSkill,
    ratings, mealHistory, recentHistorySet, recentlyShownSet, rejectedSet,
    targetMealType, effortBias, timePressureFlag,
    learnedWeights, learnedCuisines, learnedEffortPref,
    forceShift, forceShiftExcludedCuisines, forceShiftExcludeHeavy,
    continuityRecentCuisines, activeEvent,
  };

  const compatible = MEAL_CATALOGUE.filter(m => isDietaryCompatible(m, userDietIds));
  const scored     = compatible.map(m => scoreMeal(m, ctx)).filter(Boolean);
  scored.sort((a, b) => b.score - a.score);

  // Primary dominance
  if (scored.length > 0) scored[0].score = Math.min(1, scored[0].score * 1.2);

  // Pick top 3 with variety
  const results      = [];
  const usedCuisines = new Set();

  for (const candidate of scored) {
    if (results.length === 3) break;
    const c = normC(candidate.meal.cuisine);
    if (results.length === 0) { results.push(candidate); usedCuisines.add(c); continue; }
    const primary    = results[0];
    const diffCuisine = !usedCuisines.has(c) || c === 'any';
    const diffEffort  = Math.abs(candidate.meal.effortMins - primary.meal.effortMins) >= 10;
    if (diffCuisine || diffEffort || scored.length < 6) {
      results.push(candidate); usedCuisines.add(c);
    }
  }
  for (const candidate of scored) {
    if (results.length >= 3) break;
    if (!results.some(r => r.meal.id === candidate.meal.id)) results.push(candidate);
  }

  if (results.length > 0) appendSessionCuisine(normC(results[0].meal.cuisine));

  return results.slice(0, 3).map((item, i) => ({
    meal:  item.meal,
    score: Math.round(item.score * 100) / 100,
    why:   buildWhyParts(item),
    role:  i === 0 ? 'primary' : 'alternate',
    timePressure: timePressureFlag,
    activeEvent,
    generateContext: {
      dish:     item.meal.name,
      cuisine:  item.meal.cuisine !== 'any' ? item.meal.cuisine : undefined,
      mealType: targetMealType,
      diet:     userDietIds[0] || undefined,
      time:     item.meal.effortMins + ' min',
    },
  }));
}

// ── Context accessor ──────────────────────────────────────────────
export function recommendationToContext(rec) {
  if (!rec || !rec.meal) return { surpriseMode: true };
  return {
    dish:     rec.meal.name,
    cuisine:  rec.meal.cuisine !== 'any' ? rec.meal.cuisine : undefined,
    mealType: (rec.generateContext && rec.generateContext.mealType) || rec.meal.mealType[0] || 'any',
    time:     rec.meal.effortMins + ' min',
    _why:     rec.why,
    _role:    rec.role,
  };
}

export function getMealTypeLabel(mealType) {
  return ({ breakfast:'Morning ideas', lunch:'Lunch ideas', snack:'Snack time', dinner:"Tonight's ideas", any:'Ideas for you' })[mealType] || 'Ideas for you';
}

export function getMealCatalogue() { return MEAL_CATALOGUE; }
export { getMealTypeFromHour };
