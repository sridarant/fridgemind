// src/services/recommendationService.js
// Decision engine — scores meals and returns 1 primary + 2 alternates.
//
// Scoring formula:
//   score = (historyMatch * 0.35) + (preferenceMatch * 0.25) +
//           (contextMatch * 0.20) + (learnedBehaviour * 0.15) +
//           (varietyFactor * 0.05)
//
// Primary dominance: primaryScore *= 1.2 (ensures clear gap from alternates)
// Session adaptation: 2 consecutive rejections force cuisine + effort shift
// Repetition control: same meal blocked 3 sessions; same cuisine capped at 2 consecutive

import { parseFoodTypeIds } from '../lib/dietary.js';
import {
  getAllLearnedWeights,
  getRejectedMealNames,
  getLearnedCuisinePreferences,
  getLearnedEffortPreference,
} from './feedbackService.js';

// ── Session state (in-memory, reset on page reload) ──────────────
const SESSION_KEY_REJECTED_ROW  = 'jiff-session-reject-streak';
const SESSION_KEY_LAST_CUISINES = 'jiff-session-cuisine-history';
const SESSION_KEY_SHOWN_MEALS   = 'jiff-session-shown';

function sessionGet(key) {
  try { return JSON.parse(sessionStorage.getItem(key) || 'null'); } catch { return null; }
}
function sessionSet(key, val) {
  try { sessionStorage.setItem(key, JSON.stringify(val)); } catch {}
}

// Track consecutive rejections this session (for forced shift)
export function recordSessionRejection() {
  const n = (sessionGet(SESSION_KEY_REJECTED_ROW) || 0) + 1;
  sessionSet(SESSION_KEY_REJECTED_ROW, n);
  return n;
}
export function clearSessionRejectionStreak() {
  sessionSet(SESSION_KEY_REJECTED_ROW, 0);
}
function getSessionRejectionStreak() {
  return sessionGet(SESSION_KEY_REJECTED_ROW) || 0;
}

// Track last cuisines shown this session for consecutive limit
function getSessionCuisineHistory() {
  return sessionGet(SESSION_KEY_LAST_CUISINES) || [];
}
function appendSessionCuisine(cuisine) {
  const hist = getSessionCuisineHistory();
  hist.push(cuisine);
  sessionSet(SESSION_KEY_LAST_CUISINES, hist.slice(-6));
}

// Session shown meals (for 3-session repetition block — stored in localStorage with session TTL)
const SHOWN_KEY = 'jiff-recently-shown';
const SHOWN_TTL = 3 * 24 * 60 * 60 * 1000; // 3 session-equivalents ≈ 3 days

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
    const now   = Date.now();
    const prev  = JSON.parse(localStorage.getItem(SHOWN_KEY) || '[]').filter(e => (now - (e.ts || 0)) < SHOWN_TTL);
    const names = new Set(prev.map(e => e.name));
    mealNames.forEach(n => { if (n) names.add(n.toLowerCase()); });
    const next  = [...names].slice(0, 21).map(name => ({ name, ts: now })); // 3 sessions × 7 meals
    localStorage.setItem(SHOWN_KEY, JSON.stringify(next));
  } catch {}
}

export function clearRecentlyShown() {
  try { localStorage.removeItem(SHOWN_KEY); } catch {}
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

// ── Time utilities ────────────────────────────────────────────────
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

function getEffortBias(targetMealType) {
  const h = new Date().getHours();
  // Weekday dinner → bias quick
  if (targetMealType === 'dinner' && !isWeekend() && h >= 17 && h < 21) return 'quick';
  // Weekend → allow elaborate
  if (isWeekend()) return 'any';
  // Breakfast → quick
  if (targetMealType === 'breakfast') return 'quick';
  return 'moderate';
}

// ── Dietary filter ────────────────────────────────────────────────
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

// ── History recent set ────────────────────────────────────────────
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
  return (id || '').replace(/_/g, ' ').split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}

// ── Score a single meal ───────────────────────────────────────────
function scoreMeal(meal, ctx) {
  const {
    userDietIds, userCuisines, userGoal, userSkill,
    ratings, mealHistory,
    recentHistorySet, recentlyShownSet, rejectedSet,
    targetMealType, effortBias,
    learnedWeights, learnedCuisines, learnedEffortPref,
    forceShift, forceShiftExcludedCuisines, forceShiftExcludeHeavy,
  } = ctx;

  const nameLower       = meal.name.toLowerCase().trim();
  const mealCuisineNorm = normC(meal.cuisine);

  // Hard exclusions
  if (rejectedSet.has(nameLower)) return null;
  if (forceShift && forceShiftExcludedCuisines.has(mealCuisineNorm)) return null;
  if (forceShift && forceShiftExcludeHeavy && meal.tags.includes('heavy')) return null;

  // ── 1. History match (0–1, weight 0.35) ──────────────────────
  let historyScore     = 0;
  let historyHighRate  = 0;
  let historyWhyKey    = null;

  (mealHistory || []).slice(0, 30).forEach(h => {
    const hCuisine = normC(h.cuisine);
    const rating   = (ratings && (ratings[h.meal_name] || ratings[h.meal?.name])) || h.rating || 0;
    if (hCuisine === mealCuisineNorm) {
      const boost = rating >= 4 ? 0.55 : rating >= 3 ? 0.28 : 0.1;
      historyScore = Math.min(1, historyScore + boost);
      if (rating >= 4) { historyWhyKey = 'liked_cuisine'; historyHighRate = Math.max(historyHighRate, rating); }
    }
  });

  // ── 2. Preference match (0–1, weight 0.25) ───────────────────
  const allCuisines = [...new Set([...userCuisines.map(normC), ...learnedCuisines.map(normC)])];
  const prefIdx     = allCuisines.indexOf(mealCuisineNorm);
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
  preferenceScore = Math.min(1, preferenceScore);

  // ── 3. Context match (0–1, weight 0.20) ──────────────────────
  let contextScore = 0;

  // Strict meal-type gate: breakfast → only breakfast meals
  if (targetMealType === 'breakfast') {
    if (!meal.mealType.includes('breakfast')) return null; // strict filter
  } else {
    if (meal.mealType.includes(targetMealType)) contextScore += 0.60;
  }

  // Effort bias (weekday dinner quick, etc.)
  if (effortBias === 'quick') {
    if (meal.effortMins <= 15)       contextScore += 0.30;
    else if (meal.effortMins <= 20)  contextScore += 0.15;
    else if (meal.effortMins > 30)   contextScore -= 0.15;
  } else if (effortBias === 'moderate') {
    if (meal.effortMins <= 25)       contextScore += 0.20;
  } else { // any (weekend)
    contextScore += 0.10;
  }

  const h = new Date().getHours();
  if (h >= 19 && h < 23 && meal.tags.includes('light'))  contextScore += 0.10;
  if (h >= 5  && h < 9  && meal.tags.includes('quick'))  contextScore += 0.10;

  contextScore = Math.min(1, Math.max(0, contextScore));

  // ── 4. Learned behaviour (0–1, weight 0.15) ──────────────────
  let learnedScore = 0;
  const learnedW   = learnedWeights[meal.id] || 0; // in [-1, +1]
  learnedScore     = (learnedW + 1) / 2;           // map to [0, 1]

  // Effort preference from accepted history
  if (learnedEffortPref === 'quick'    && meal.effortMins <= 15) learnedScore = Math.min(1, learnedScore + 0.30);
  if (learnedEffortPref === 'moderate' && meal.effortMins <= 25 && meal.effortMins > 15) learnedScore = Math.min(1, learnedScore + 0.20);
  if (learnedEffortPref === 'involved' && meal.effortMins > 25) learnedScore = Math.min(1, learnedScore + 0.20);

  // Learned cuisine (from behaviour, not just profile)
  if (learnedCuisines.length > 0) {
    const lnorm = learnedCuisines.map(normC);
    const lIdx  = lnorm.indexOf(mealCuisineNorm);
    if (lIdx === 0)      learnedScore = Math.min(1, learnedScore + 0.25);
    else if (lIdx === 1) learnedScore = Math.min(1, learnedScore + 0.12);
  }

  // ── 5. Variety factor (0–1, weight 0.05) ─────────────────────
  let varietyFactor = 1.0;
  if (recentlyShownSet.has(nameLower))      varietyFactor = 0.02; // blocked 3 sessions
  else if (recentHistorySet.has(nameLower)) varietyFactor = 0.25;

  // Same cuisine consecutive cap: if shown 2+ times consecutively this session → penalise
  const cuisineHist = getSessionCuisineHistory();
  const lastTwo     = cuisineHist.slice(-2);
  if (lastTwo.length === 2 && lastTwo.every(c => c === mealCuisineNorm)) {
    varietyFactor = Math.min(varietyFactor, 0.15);
  }

  // Boost under-used cuisines (not in last 5 session history)
  if (!cuisineHist.slice(-5).includes(mealCuisineNorm) && mealCuisineNorm !== 'any') {
    varietyFactor = Math.min(1, varietyFactor + 0.15);
  }

  // ── Composite ─────────────────────────────────────────────────
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
    _learnedEffortPref: learnedEffortPref,
  };
}

// ── Why builder ────────────────────────────────────────────────────
// Returns { headline, bullet2, effortLabel, effortMins }
function buildWhyParts(item) {
  const {
    meal, _learnedW, _historyWhyKey, _historyHighRate,
    _prefIdx, _goal, _targetMealType, _effortBias,
    _learnedCuisines, _allCuisines, _learnedEffortPref,
  } = item;

  // Collect all true signals with weights
  const signals = [];

  if (_learnedW >= 0.4)  signals.push({ w:100, t:"You keep coming back to this style" });
  else if (_learnedW > 0.15) signals.push({ w:80, t:"Fits your recent cooking pattern" });

  if (_historyWhyKey === 'liked_cuisine') {
    const rStr = _historyHighRate === 5 ? '5-star' : 'highly rated';
    signals.push({ w:90, t:'You ' + rStr + ' similar ' + capCuisine(meal.cuisine) + ' meals' });
  }

  if (_prefIdx === 0 && meal.cuisine !== 'any') signals.push({ w:75, t:capCuisine(meal.cuisine) + ' is your top cuisine' });
  else if (_prefIdx === 1 && meal.cuisine !== 'any') signals.push({ w:55, t:capCuisine(meal.cuisine) + ' is in your top preferences' });

  if (_learnedCuisines && _learnedCuisines.length > 0) {
    const lnorm = _learnedCuisines.map(normC);
    if (lnorm.includes(normC(meal.cuisine)) && _prefIdx < 0) {
      signals.push({ w:70, t:"You've been cooking " + capCuisine(meal.cuisine) + ' a lot lately' });
    }
  }

  if (_goal === 'eat_healthier' && (meal.tags.includes('healthy') || meal.tags.includes('light'))) {
    signals.push({ w:65, t:'Fits your healthy eating goal' });
  }
  if (_goal === 'cook_faster' && meal.effortMins <= 15) {
    signals.push({ w:65, t:'Under 15 min — matches your quick-cook goal' });
  }
  if (_goal === 'reduce_waste' && meal.tags.includes('leftover')) {
    signals.push({ w:65, t:'Perfect for using up what you have' });
  }
  if (_goal === 'try_new_things' && !(_allCuisines || []).includes(normC(meal.cuisine)) && meal.cuisine !== 'any') {
    signals.push({ w:60, t:'Something different — ' + capCuisine(meal.cuisine) });
  }

  // Context signals
  const period = ({ breakfast:'this morning', lunch:'for lunch', snack:'right now', dinner:'tonight' })[_targetMealType] || 'right now';
  if (_effortBias === 'quick' && meal.effortMins <= 15) {
    signals.push({ w:55, t:'Quick for ' + period });
  } else if (_targetMealType === 'dinner' && meal.effortMins <= 20) {
    signals.push({ w:50, t:'Easy to make tonight' });
  } else if (_targetMealType === 'breakfast' && meal.effortMins <= 15) {
    signals.push({ w:50, t:'Quick and light for the morning' });
  } else {
    signals.push({ w:35, t:'Good fit ' + period });
  }

  if (_learnedEffortPref === 'quick' && meal.effortMins <= 15) signals.push({ w:45, t:'Matches your preference for quick meals' });
  if (meal.tags.includes('popular'))  signals.push({ w:28, t:'Consistently popular across India' });
  if (meal.tags.includes('healthy') && !signals.some(s => s.t.includes('healthy'))) signals.push({ w:26, t:'A nourishing choice' });
  if (meal.tags.includes('comfort') && !signals.some(s => s.t.includes('comfort'))) signals.push({ w:24, t:'A comforting classic' });

  signals.sort((a, b) => b.w - a.w);

  const s0 = signals[0];
  const s1 = signals.find(s => s !== s0);

  // Build confident headline combining two signals with a bullet separator
  let headline = '';
  if (s0 && s1 && s0.w >= 55 && s1.w >= 40) {
    headline = s0.t + ' • ' + s1.t;
  } else if (s0) {
    headline = s0.t;
  } else {
    headline = 'Good match ' + period;
  }

  // Second supporting point (a remaining signal not used in headline)
  const usedTexts = new Set(headline.split(' • '));
  const bullet2   = signals.find(s => !usedTexts.has(s.t) && s.w >= 25);

  const effortLabel = meal.effortMins <= 15 ? 'Quick' : meal.effortMins <= 25 ? 'Medium effort' : 'Takes a bit longer';

  return { headline, bullet2: bullet2 ? bullet2.t : null, effortLabel, effortMins: meal.effortMins };
}

// ── Main export ───────────────────────────────────────────────────
export function getPersonalisedRecommendations({
  profile          = null,
  ratings          = {},
  mealHistory      = [],
  overrideMealType = null,
} = {}) {
  const h              = new Date().getHours();
  const targetMealType = overrideMealType || getMealTypeFromHour(h);
  const effortBias     = getEffortBias(targetMealType);

  const rawFoodType   = (profile && profile.food_type) || [];
  const userDietIds   = parseFoodTypeIds(rawFoodType);
  const userCuisines  = (profile && profile.preferred_cuisines) || [];
  const userGoal      = (profile && profile.active_goal)        || '';
  const userSkill     = (profile && profile.skill_level)        || 'home_cook';

  const behaviourData  = (profile && profile.behaviour_data)    || {};
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

  // Session adaptation: 2+ consecutive rejections → force shift
  const rejectStreak = getSessionRejectionStreak();
  const forceShift   = rejectStreak >= 2;
  const forceShiftExcludedCuisines = forceShift
    ? new Set(getSessionCuisineHistory().slice(-3).map(normC))
    : new Set();
  const forceShiftExcludeHeavy = forceShift;

  const ctx = {
    userDietIds, userCuisines, userGoal, userSkill,
    ratings, mealHistory,
    recentHistorySet, recentlyShownSet, rejectedSet,
    targetMealType, effortBias,
    learnedWeights, learnedCuisines, learnedEffortPref,
    forceShift, forceShiftExcludedCuisines, forceShiftExcludeHeavy,
  };

  const compatible = MEAL_CATALOGUE.filter(m => isDietaryCompatible(m, userDietIds));
  const scored     = compatible.map(m => scoreMeal(m, ctx)).filter(Boolean);
  scored.sort((a, b) => b.score - a.score);

  // Apply primary dominance: top item gets ×1.2 boost (widens gap)
  if (scored.length > 0) scored[0].score = Math.min(1, scored[0].score * 1.2);

  // Pick top 3 with cuisine variety for alternates
  const results      = [];
  const usedCuisines = new Set();

  for (const candidate of scored) {
    if (results.length === 3) break;
    const c = normC(candidate.meal.cuisine);
    if (results.length === 0) { results.push(candidate); usedCuisines.add(c); continue; }
    // Alternates must differ in cuisine OR effort from primary
    const primary     = results[0];
    const diffCuisine = !usedCuisines.has(c) || c === 'any';
    const diffEffort  = Math.abs(candidate.meal.effortMins - primary.meal.effortMins) >= 10;
    if (diffCuisine || diffEffort || scored.length < 6) {
      results.push(candidate); usedCuisines.add(c);
    }
  }
  // Fallback fill
  for (const candidate of scored) {
    if (results.length >= 3) break;
    if (!results.some(r => r.meal.id === candidate.meal.id)) results.push(candidate);
  }

  // Record primary cuisine in session history
  if (results.length > 0) appendSessionCuisine(normC(results[0].meal.cuisine));

  return results.slice(0, 3).map((item, i) => ({
    meal:  item.meal,
    score: Math.round(item.score * 100) / 100,
    why:   buildWhyParts(item),
    role:  i === 0 ? 'primary' : 'alternate',
    generateContext: {
      dish:     item.meal.name,
      cuisine:  item.meal.cuisine !== 'any' ? item.meal.cuisine : undefined,
      mealType: targetMealType,
      diet:     userDietIds[0] || undefined,
      time:     item.meal.effortMins + ' min',
    },
  }));
}

// ── Helpers ───────────────────────────────────────────────────────
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
