// src/services/recommendationService.js
// Scoring-based personalised meal recommendation engine.
// Pure JS — no React deps, no direct API calls.
//
// Score = (historyMatch * 0.4) + (preferenceMatch * 0.3) + (contextMatch * 0.2) + (varietyFactor * 0.1)
// + learnedWeightAdjustment (±0.3 max, from feedbackService)
//
// Output: [
//   { meal, score, why: { headline, bullets[] }, role:'primary',   generateContext },
//   { meal, score, why: { headline, bullets[] }, role:'alternate', generateContext },
//   { meal, score, why: { headline, bullets[] }, role:'alternate', generateContext },
// ]

import { parseFoodTypeIds } from '../lib/dietary.js';
import {
  getAllLearnedWeights,
  getRejectedMealNames,
  getLearnedCuisinePreferences,
  getLearnedEffortPreference,
} from './feedbackService.js';

// ─────────────────────────────────────────────────────────────────
// MEAL CATALOGUE
// ─────────────────────────────────────────────────────────────────
const MEAL_CATALOGUE = [
  // ── Breakfast ──────────────────────────────────────────────────
  { id:'poha',              name:'Poha',               emoji:'🍚', cuisine:'maharashtrian', mealType:['breakfast','snack'],          diet:['veg','vegan','jain','eggetarian'],  effortMins:15, tags:['quick','light','popular','mild'] },
  { id:'upma',              name:'Upma',               emoji:'🥣', cuisine:'south_indian',  mealType:['breakfast'],                  diet:['veg','vegan','jain','eggetarian'],  effortMins:20, tags:['quick','filling','mild'] },
  { id:'idli_sambar',       name:'Idli Sambar',        emoji:'🫓', cuisine:'tamil_nadu',    mealType:['breakfast','lunch'],          diet:['veg','vegan','jain','eggetarian'],  effortMins:10, tags:['light','popular','mild','healthy','protein'] },
  { id:'paratha',           name:'Paratha',            emoji:'🫓', cuisine:'punjabi',       mealType:['breakfast','lunch'],          diet:['veg','eggetarian'],                 effortMins:20, tags:['filling','popular','comfort'] },
  { id:'aloo_paratha',      name:'Aloo Paratha',       emoji:'🫓', cuisine:'punjabi',       mealType:['breakfast','lunch'],          diet:['veg','jain','eggetarian'],          effortMins:25, tags:['filling','popular','comfort','heavy'] },
  { id:'vermicelli',        name:'Vermicelli Upma',    emoji:'🍜', cuisine:'south_indian',  mealType:['breakfast'],                  diet:['veg','vegan','eggetarian'],         effortMins:15, tags:['quick','light','mild'] },
  { id:'oats_savory',       name:'Masala Oats',        emoji:'🥣', cuisine:'any',           mealType:['breakfast'],                  diet:['veg','vegan','jain','eggetarian'],  effortMins:10, tags:['quick','healthy','light','protein'] },
  { id:'egg_bhurji',        name:'Egg Bhurji',         emoji:'🍳', cuisine:'any',           mealType:['breakfast','snack'],          diet:['eggetarian','non-veg'],             effortMins:12, tags:['quick','protein','spicy','light'] },
  { id:'dosa',              name:'Plain Dosa',         emoji:'🥞', cuisine:'tamil_nadu',    mealType:['breakfast','snack'],          diet:['veg','vegan','eggetarian'],         effortMins:15, tags:['light','popular','mild'] },
  { id:'moong_chilla',      name:'Moong Dal Chilla',   emoji:'🥞', cuisine:'any',           mealType:['breakfast','snack'],          diet:['veg','vegan','jain','eggetarian'],  effortMins:20, tags:['healthy','protein','quick','light'] },
  { id:'pongal',            name:'Ven Pongal',         emoji:'🍲', cuisine:'tamil_nadu',    mealType:['breakfast','lunch'],          diet:['veg','jain'],                       effortMins:25, tags:['light','healthy','mild','comfort','festive'] },
  { id:'dhokla',            name:'Dhokla',             emoji:'🧆', cuisine:'gujarati',      mealType:['breakfast','snack'],          diet:['veg','vegan','eggetarian'],         effortMins:25, tags:['light','popular','healthy','mild'] },
  { id:'puttu_kadala',      name:'Puttu Kadala',       emoji:'🫙', cuisine:'kerala',        mealType:['breakfast'],                  diet:['veg','vegan'],                      effortMins:20, tags:['heavy','healthy','protein'] },

  // ── Lunch ──────────────────────────────────────────────────────
  { id:'dal_rice',          name:'Dal Rice',           emoji:'🍛', cuisine:'any',           mealType:['lunch','dinner'],             diet:['veg','vegan','jain','eggetarian'],  effortMins:25, tags:['comfort','popular','filling','protein','healthy'] },
  { id:'rajma',             name:'Rajma Chawal',       emoji:'🫘', cuisine:'punjabi',       mealType:['lunch','dinner'],             diet:['veg','vegan','jain','eggetarian'],  effortMins:30, tags:['comfort','popular','protein','heavy'] },
  { id:'curd_rice',         name:'Curd Rice',          emoji:'🍚', cuisine:'tamil_nadu',    mealType:['lunch'],                      diet:['veg','eggetarian'],                 effortMins:10, tags:['light','quick','mild','summer'] },
  { id:'khichdi',           name:'Khichdi',            emoji:'🍲', cuisine:'any',           mealType:['lunch','dinner'],             diet:['veg','vegan','jain','eggetarian'],  effortMins:20, tags:['comfort','light','healthy','mild'] },
  { id:'roti_sabzi',        name:'Roti Sabzi',         emoji:'🫓', cuisine:'any',           mealType:['lunch','dinner'],             diet:['veg','vegan','jain','eggetarian'],  effortMins:25, tags:['everyday','popular','light'] },
  { id:'sambar_rice',       name:'Sambar Rice',        emoji:'🍛', cuisine:'tamil_nadu',    mealType:['lunch'],                      diet:['veg','vegan','eggetarian'],         effortMins:20, tags:['comfort','popular','spicy','protein'] },
  { id:'chole_bhature',     name:'Chole Bhature',      emoji:'🫘', cuisine:'punjabi',       mealType:['lunch'],                      diet:['veg','vegan','jain','eggetarian'],  effortMins:30, tags:['indulgent','popular','heavy','spicy'] },
  { id:'biryani_veg',       name:'Veg Biryani',        emoji:'🍚', cuisine:'hyderabadi',    mealType:['lunch','dinner'],             diet:['veg','jain','eggetarian'],          effortMins:40, tags:['indulgent','popular','festive','spicy','heavy'] },
  { id:'misal_pav',         name:'Misal Pav',          emoji:'🌶️', cuisine:'maharashtrian', mealType:['breakfast','lunch','snack'],  diet:['veg','vegan','jain','eggetarian'],  effortMins:25, tags:['spicy','popular','protein','heavy'] },
  { id:'thepla',            name:'Thepla',             emoji:'🫓', cuisine:'gujarati',      mealType:['breakfast','lunch'],          diet:['veg','jain'],                       effortMins:20, tags:['light','quick','healthy','mild'] },
  { id:'rasam_rice',        name:'Rasam Rice',         emoji:'🍲', cuisine:'tamil_nadu',    mealType:['lunch','dinner'],             diet:['veg','vegan','eggetarian'],         effortMins:20, tags:['light','spicy','healthy','monsoon','comfort'] },

  // ── Dinner ─────────────────────────────────────────────────────
  { id:'palak_paneer',      name:'Palak Paneer',       emoji:'🥬', cuisine:'punjabi',       mealType:['dinner','lunch'],             diet:['veg','eggetarian'],                 effortMins:25, tags:['popular','healthy','comfort','protein','spicy'] },
  { id:'dal_tadka',         name:'Dal Tadka',          emoji:'🍛', cuisine:'any',           mealType:['dinner','lunch'],             diet:['veg','vegan','jain','eggetarian'],  effortMins:20, tags:['comfort','popular','everyday','protein'] },
  { id:'aloo_gobi',         name:'Aloo Gobi',          emoji:'🥦', cuisine:'punjabi',       mealType:['dinner','lunch'],             diet:['veg','vegan','jain','eggetarian'],  effortMins:25, tags:['everyday','popular','mild','light'] },
  { id:'chicken_curry',     name:'Chicken Curry',      emoji:'🍗', cuisine:'any',           mealType:['dinner','lunch'],             diet:['non-veg','halal'],                  effortMins:35, tags:['popular','protein','comfort','spicy'] },
  { id:'fish_curry',        name:'Fish Curry',         emoji:'🐟', cuisine:'bengali',       mealType:['dinner','lunch'],             diet:['non-veg','halal'],                  effortMins:30, tags:['popular','protein','spicy','comfort'] },
  { id:'butter_chicken',    name:'Butter Chicken',     emoji:'🍗', cuisine:'punjabi',       mealType:['dinner'],                     diet:['non-veg','halal'],                  effortMins:35, tags:['popular','comfort','indulgent','protein'] },
  { id:'hyderabadi_biryani',name:'Hyderabadi Biryani', emoji:'🍚', cuisine:'hyderabadi',    mealType:['lunch','dinner'],             diet:['non-veg','halal'],                  effortMins:60, tags:['special','popular','festive','spicy','heavy'] },
  { id:'macher_jhol',       name:'Macher Jhol',        emoji:'🐟', cuisine:'bengali',       mealType:['lunch','dinner'],             diet:['non-veg','halal'],                  effortMins:30, tags:['comfort','protein','spicy'] },
  { id:'avial',             name:'Avial',              emoji:'🥥', cuisine:'kerala',        mealType:['lunch','dinner'],             diet:['veg','vegan','eggetarian'],         effortMins:30, tags:['healthy','mild','festive'] },
  { id:'fish_curry_kerala', name:'Kerala Fish Curry',  emoji:'🐠', cuisine:'kerala',        mealType:['dinner','lunch'],             diet:['non-veg','halal'],                  effortMins:30, tags:['heavy','spicy','protein','comfort'] },
  { id:'sarson_saag',       name:'Sarson da Saag',     emoji:'🥬', cuisine:'punjabi',       mealType:['lunch','dinner'],             diet:['veg'],                              effortMins:30, tags:['healthy','heavy','winter','festive'] },
  { id:'palak_dal',         name:'Palak Dal',          emoji:'🥬', cuisine:'any',           mealType:['lunch','dinner'],             diet:['veg','vegan','jain','eggetarian'],  effortMins:25, tags:['healthy','protein','light','spicy'] },
  { id:'moong_soup',        name:'Moong Dal Soup',     emoji:'🥣', cuisine:'any',           mealType:['dinner','lunch'],             diet:['veg','vegan','jain','eggetarian'],  effortMins:20, tags:['light','healthy','protein','mild'] },

  // ── Snack ──────────────────────────────────────────────────────
  { id:'samosa',            name:'Samosa',             emoji:'🥟', cuisine:'any',           mealType:['snack'],                      diet:['veg','vegan','jain','eggetarian'],  effortMins:30, tags:['popular','comfort','spicy','heavy'] },
  { id:'pakora',            name:'Onion Pakora',       emoji:'🧅', cuisine:'any',           mealType:['snack'],                      diet:['veg','vegan','jain','eggetarian'],  effortMins:20, tags:['popular','monsoon','comfort','spicy'] },
  { id:'vada',              name:'Medu Vada',          emoji:'🍩', cuisine:'tamil_nadu',    mealType:['breakfast','snack'],          diet:['veg','vegan','eggetarian'],         effortMins:25, tags:['popular','crispy','protein'] },
  { id:'bread_pakora',      name:'Bread Pakora',       emoji:'🥪', cuisine:'any',           mealType:['snack','breakfast'],          diet:['veg','eggetarian'],                 effortMins:15, tags:['quick','popular','comfort','monsoon'] },
  { id:'bhel_puri',         name:'Bhel Puri',          emoji:'🥗', cuisine:'maharashtrian', mealType:['snack'],                      diet:['veg','vegan','jain'],               effortMins:10, tags:['quick','light','popular'] },
  { id:'sprouts_salad',     name:'Sprouts Salad',      emoji:'🥗', cuisine:'any',           mealType:['snack','breakfast'],          diet:['veg','vegan','jain','eggetarian'],  effortMins:10, tags:['quick','healthy','light','protein'] },

  // ── Leftover rescues ───────────────────────────────────────────
  { id:'fried_rice',        name:'Fried Rice',         emoji:'🍳', cuisine:'any',           mealType:['lunch','dinner'],             diet:['non-veg','veg','eggetarian'],       effortMins:15, tags:['quick','leftover','comfort'] },
  { id:'chapati_rolls',     name:'Chapati Rolls',      emoji:'🌯', cuisine:'any',           mealType:['lunch','snack'],              diet:['veg','non-veg'],                    effortMins:10, tags:['quick','leftover','light'] },
  { id:'dal_paratha',       name:'Dal Paratha',        emoji:'🫓', cuisine:'any',           mealType:['breakfast','lunch'],          diet:['veg'],                              effortMins:20, tags:['leftover','comfort','protein'] },
];

// ─────────────────────────────────────────────────────────────────
// TIME → MEAL TYPE + EFFORT HINT
// ─────────────────────────────────────────────────────────────────
function getMealTypeFromHour(hour) {
  if (hour >= 5  && hour < 11) return 'breakfast';
  if (hour >= 11 && hour < 16) return 'lunch';
  if (hour >= 16 && hour < 19) return 'snack';
  return 'dinner';
}

function getEffortHint(hour) {
  if (hour >= 19)            return 'light';
  if (hour >= 5 && hour < 9) return 'quick';
  return 'any';
}

function getMealPeriodLabel(mealType) {
  return ({ breakfast:'this morning', lunch:'for lunch', snack:'right now', dinner:'tonight' })[mealType] || 'right now';
}

// ─────────────────────────────────────────────────────────────────
// DIETARY COMPATIBILITY
// ─────────────────────────────────────────────────────────────────
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

// ─────────────────────────────────────────────────────────────────
// RECENTLY SHOWN (localStorage rolling window — 6 meals)
// ─────────────────────────────────────────────────────────────────
const SHOWN_KEY = 'jiff-recently-shown';

export function getRecentlyShown() {
  try { return JSON.parse(localStorage.getItem(SHOWN_KEY) || '[]'); } catch { return []; }
}

export function markAsShown(mealNames = []) {
  try {
    const prev = getRecentlyShown();
    const next = [...new Set([...mealNames.map(n => n.toLowerCase()), ...prev])].slice(0, 6);
    localStorage.setItem(SHOWN_KEY, JSON.stringify(next));
  } catch {}
}

export function clearRecentlyShown() {
  try { localStorage.removeItem(SHOWN_KEY); } catch {}
}

// ─────────────────────────────────────────────────────────────────
// HISTORY RECENT SET (7-day window from Supabase history)
// ─────────────────────────────────────────────────────────────────
function buildRecentSet(mealHistory, windowDays = 7) {
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

function normCuisine(raw) { return (raw || '').toLowerCase().replace(/[^a-z_]/g, ''); }

function capitaliseCuisine(id) {
  return (id || '').replace(/_/g, ' ').split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}

// ─────────────────────────────────────────────────────────────────
// SCORE A SINGLE MEAL
// ─────────────────────────────────────────────────────────────────
function scoreMeal(meal, {
  userDietIds, userCuisines, userGoal, userSkill,
  ratings, mealHistory,
  recentHistorySet, recentlyShownSet, rejectedSet,
  targetMealType, effortHint,
  learnedWeights, learnedCuisines, learnedEffortPref,
}) {
  const mealNameLower   = meal.name.toLowerCase().trim();
  const mealCuisineNorm = normCuisine(meal.cuisine);

  if (rejectedSet.has(mealNameLower)) return { meal, score: -1, _filtered: true };

  // ── History score (0–1) ─────────────────────────────────────
  let historyScore      = 0;
  let historyWhyKey     = null;
  let historyHighRating = 0; // highest rating found for this cuisine

  (mealHistory || []).slice(0, 30).forEach(h => {
    const hCuisine = normCuisine(h.cuisine);
    const rating   = (ratings && (ratings[h.meal_name] || ratings[h.meal?.name])) || h.rating || 0;
    if (hCuisine === mealCuisineNorm) {
      const boost = rating >= 4 ? 0.5 : rating >= 3 ? 0.25 : 0.1;
      historyScore = Math.min(1, historyScore + boost);
      if (rating >= 4) { historyWhyKey = 'liked_cuisine'; historyHighRating = Math.max(historyHighRating, rating); }
    }
  });

  // ── Preference score (0–1) ──────────────────────────────────
  let preferenceScore = 0;
  const allCuisines   = [...new Set([...userCuisines.map(normCuisine), ...learnedCuisines.map(normCuisine)])];
  const prefIdx       = allCuisines.indexOf(mealCuisineNorm);

  if (prefIdx === 0)      preferenceScore += 0.7;
  else if (prefIdx === 1) preferenceScore += 0.4;
  else if (prefIdx >= 2)  preferenceScore += 0.2;
  else if (meal.cuisine === 'any') preferenceScore += 0.15;

  if (userGoal === 'eat_healthier' && (meal.tags.includes('healthy') || meal.tags.includes('light'))) preferenceScore += 0.3;
  if (userGoal === 'cook_faster'   && meal.effortMins <= 15) preferenceScore += 0.4;
  else if (userGoal === 'cook_faster' && meal.effortMins <= 20) preferenceScore += 0.2;
  if (userGoal === 'reduce_waste'  && meal.tags.includes('leftover')) preferenceScore += 0.35;
  if (userGoal === 'reduce_waste'  && meal.effortMins <= 20)          preferenceScore += 0.1;
  if (userGoal === 'try_new_things' && !allCuisines.includes(mealCuisineNorm) && meal.cuisine !== 'any') preferenceScore += 0.35;
  if (userSkill === 'beginner' && meal.effortMins <= 20) preferenceScore += 0.1;
  if (userSkill === 'advanced' && meal.effortMins >= 30) preferenceScore += 0.1;
  if (learnedEffortPref === 'quick'    && meal.effortMins <= 15) preferenceScore += 0.2;
  if (learnedEffortPref === 'moderate' && meal.effortMins <= 25 && meal.effortMins > 15) preferenceScore += 0.2;
  if (learnedEffortPref === 'involved' && meal.effortMins > 25)  preferenceScore += 0.2;
  preferenceScore = Math.min(1, preferenceScore);

  // ── Context score (0–1) ─────────────────────────────────────
  let contextScore = 0;
  if (meal.mealType.includes(targetMealType))             contextScore += 0.6;
  if (effortHint === 'light' && meal.effortMins <= 20)   contextScore += 0.25;
  if (effortHint === 'quick' && meal.effortMins <= 15)   contextScore += 0.3;
  if (effortHint === 'any')                               contextScore += 0.1;
  const h = new Date().getHours();
  if (h >= 19 && h < 23 && meal.tags.includes('light'))  contextScore += 0.1;
  if (h >= 5  && h < 9  && meal.tags.includes('quick'))  contextScore += 0.1;
  contextScore = Math.min(1, contextScore);

  // ── Variety factor (0–1) ────────────────────────────────────
  let varietyFactor = 1.0;
  if (recentlyShownSet.has(mealNameLower))      varietyFactor = 0.05;
  else if (recentHistorySet.has(mealNameLower)) varietyFactor = 0.3;

  // ── Composite score + feedback adjustment ───────────────────
  const baseScore    = (historyScore * 0.4) + (preferenceScore * 0.3) + (contextScore * 0.2) + (varietyFactor * 0.1);
  const learnedW     = learnedWeights[meal.id] || 0;
  const adjustedScore = Math.max(0, Math.min(1, baseScore + (learnedW * 0.3)));

  return {
    meal,
    score:             adjustedScore,
    _baseScore:        baseScore,
    _learnedW:         learnedW,
    _historyWhyKey:    historyWhyKey,
    _historyHighRating:historyHighRating,
    _prefIdx:          prefIdx,
    _goal:             userGoal,
    _targetMealType:   targetMealType,
    _effortHint:       effortHint,
    _learnedCuisines:  learnedCuisines,
    _allCuisines:      allCuisines,
    _learnedEffortPref:learnedEffortPref,
  };
}

// ─────────────────────────────────────────────────────────────────
// WHY BUILDER
// Returns { headline: string, bullets: string[] }
// headline — the single strong confidence statement (shown large)
// bullets  — 1-2 specific supporting signals (shown small below)
//
// Rule: ALWAYS combine at least 2 independent signals into the why.
// Never use generic fallbacks if any real signal exists.
// ─────────────────────────────────────────────────────────────────
function buildWhyParts(item) {
  const {
    meal, _learnedW, _historyWhyKey, _historyHighRating,
    _prefIdx, _goal, _targetMealType, _effortHint,
    _learnedCuisines, _allCuisines, _learnedEffortPref, score,
  } = item;

  const signals = []; // collect all true signals, pick best 2

  // Signal: strong feedback history (accepted/completed multiple times)
  if (_learnedW >= 0.4) {
    signals.push({ weight: 100, text: "You've cooked this style before and loved it" });
  } else if (_learnedW > 0.15) {
    signals.push({ weight: 80, text: 'Matches meals you tend to enjoy' });
  }

  // Signal: explicit high rating on this cuisine
  if (_historyWhyKey === 'liked_cuisine') {
    const rStr = _historyHighRating === 5 ? '5-star' : _historyHighRating >= 4 ? 'highly rated' : 'liked';
    signals.push({ weight: 90, text: 'You ' + rStr + ' similar ' + capitaliseCuisine(meal.cuisine) + ' meals' });
  }

  // Signal: top cuisine preference
  if (_prefIdx === 0 && meal.cuisine !== 'any') {
    signals.push({ weight: 75, text: capitaliseCuisine(meal.cuisine) + ' is your top cuisine choice' });
  } else if (_prefIdx === 1 && meal.cuisine !== 'any') {
    signals.push({ weight: 55, text: capitaliseCuisine(meal.cuisine) + ' is in your top preferences' });
  }

  // Signal: learned cuisine preference (behaviour, not profile)
  if (_learnedCuisines && _learnedCuisines.length > 0) {
    const norm = _learnedCuisines.map(c => c.toLowerCase().replace(/[^a-z_]/g, ''));
    if (norm.includes(meal.cuisine) && _prefIdx < 0) {
      signals.push({ weight: 70, text: "You've been cooking " + capitaliseCuisine(meal.cuisine) + ' a lot lately' });
    }
  }

  // Signal: goal alignment
  if (_goal === 'eat_healthier' && (meal.tags.includes('healthy') || meal.tags.includes('light'))) {
    signals.push({ weight: 65, text: 'Fits your healthy eating goal' });
  }
  if (_goal === 'cook_faster' && meal.effortMins <= 15) {
    signals.push({ weight: 65, text: 'Under 15 min — matches your quick-cook goal' });
  }
  if (_goal === 'reduce_waste' && meal.tags.includes('leftover')) {
    signals.push({ weight: 65, text: 'Perfect for using up what you have' });
  }
  if (_goal === 'try_new_things' && !(_allCuisines || []).includes(meal.cuisine) && meal.cuisine !== 'any') {
    signals.push({ weight: 60, text: 'Something different — ' + capitaliseCuisine(meal.cuisine) + ' cuisine' });
  }

  // Signal: time-of-day fit
  const period = getMealPeriodLabel(_targetMealType);
  if (_targetMealType === 'breakfast' && meal.effortMins <= 15) {
    signals.push({ weight: 50, text: 'Quick and light — ideal ' + period });
  } else if (_targetMealType === 'dinner' && meal.effortMins <= 20) {
    signals.push({ weight: 50, text: 'Easy to make ' + period });
  } else if (_targetMealType === 'snack' && meal.effortMins <= 15) {
    signals.push({ weight: 50, text: 'Ready in ' + meal.effortMins + ' min — perfect for a snack' });
  } else if (meal.mealType.includes(_targetMealType)) {
    signals.push({ weight: 40, text: 'A natural fit ' + period });
  }

  // Signal: effort preference
  if (_learnedEffortPref === 'quick' && meal.effortMins <= 15) {
    signals.push({ weight: 45, text: 'Matches your preference for quick meals' });
  }

  // Signal: tags
  if (meal.tags.includes('popular')) {
    signals.push({ weight: 30, text: 'Consistently popular across India' });
  }
  if (meal.tags.includes('healthy') && !signals.some(s => s.text.includes('healthy'))) {
    signals.push({ weight: 28, text: 'A nourishing choice' });
  }
  if (meal.tags.includes('comfort') && !signals.some(s => s.text.includes('comfort'))) {
    signals.push({ weight: 25, text: 'A comforting classic' });
  }

  // Sort by weight descending, pick top 2
  signals.sort((a, b) => b.weight - a.weight);
  const top2 = signals.slice(0, 2).map(s => s.text);

  // Build headline — the single most confident statement
  let headline = '';
  if (signals.length === 0) {
    headline = 'Good match ' + period;
  } else if (signals[0].weight >= 80) {
    headline = signals[0].text;
  } else if (_historyWhyKey === 'liked_cuisine') {
    const cuisineLabel = capitaliseCuisine(meal.cuisine);
    headline = cuisineLabel !== 'Any' ? 'You\'ve liked ' + cuisineLabel + ' before' : 'Matches your taste';
  } else if (_prefIdx === 0 && meal.cuisine !== 'any') {
    headline = 'Your go-to cuisine, done right';
  } else if (_goal) {
    headline = signals[0]?.text || 'Fits your current goal';
  } else {
    headline = signals[0]?.text || ('Perfect ' + period);
  }

  // Second bullet — pick a signal NOT already used in headline
  const remaining = top2.filter(s => s !== headline);
  const bullet2   = remaining[0] || null;

  // Effort + time string always shown
  const effortLabel = meal.effortMins <= 15 ? 'Quick' : meal.effortMins <= 25 ? 'Medium effort' : 'Takes a bit longer';

  return {
    headline,
    bullet2,
    effortLabel,
    effortMins: meal.effortMins,
  };
}

// ─────────────────────────────────────────────────────────────────
// MAIN EXPORT: getPersonalisedRecommendations
// ─────────────────────────────────────────────────────────────────
export function getPersonalisedRecommendations({
  profile          = null,
  ratings          = {},
  mealHistory      = [],
  overrideMealType = null,
} = {}) {
  const h              = new Date().getHours();
  const targetMealType = overrideMealType || getMealTypeFromHour(h);
  const effortHint     = getEffortHint(h);

  const rawFoodType    = (profile && profile.food_type) || [];
  const userDietIds    = parseFoodTypeIds(rawFoodType);
  const userCuisines   = (profile && profile.preferred_cuisines) || [];
  const userGoal       = (profile && profile.active_goal)        || '';
  const userSkill      = (profile && profile.skill_level)        || 'home_cook';

  const behaviourData  = (profile && profile.behaviour_data)     || {};
  const behaviourMerge = typeof behaviourData === 'string'
    ? (() => { try { return JSON.parse(behaviourData); } catch { return {}; } })()
    : behaviourData;

  const learnedCuisines    = getLearnedCuisinePreferences();
  const learnedEffortPref  = getLearnedEffortPreference();
  const learnedWeightsRaw  = getAllLearnedWeights();

  const learnedWeights = {};
  Object.entries(learnedWeightsRaw).forEach(([id, data]) => {
    learnedWeights[id] = data.score || 0;
  });
  const persistedWeights = behaviourMerge.mealWeights || {};
  Object.entries(persistedWeights).forEach(([id, data]) => {
    if (learnedWeights[id] === undefined) learnedWeights[id] = data.score || 0;
  });

  const recentHistorySet = buildRecentSet(mealHistory, 7);
  const recentlyShownSet = new Set(getRecentlyShown());
  const rejectedSet      = getRejectedMealNames();

  const compatible = MEAL_CATALOGUE.filter(meal => isDietaryCompatible(meal, userDietIds));

  const scored = compatible.map(meal =>
    scoreMeal(meal, {
      userDietIds, userCuisines, userGoal, userSkill,
      ratings, mealHistory,
      recentHistorySet, recentlyShownSet, rejectedSet,
      targetMealType, effortHint,
      learnedWeights, learnedCuisines, learnedEffortPref,
    })
  );

  const eligible = scored.filter(s => !s._filtered && s.score >= 0);
  eligible.sort((a, b) => b.score - a.score);

  const results      = [];
  const usedCuisines = new Set();

  for (const candidate of eligible) {
    if (results.length === 3) break;
    const c = normCuisine(candidate.meal.cuisine);
    if (results.length === 0) { results.push(candidate); usedCuisines.add(c); continue; }
    if (!usedCuisines.has(c) || eligible.length < 6 || c === 'any') {
      results.push(candidate); usedCuisines.add(c);
    }
  }
  for (const candidate of eligible) {
    if (results.length === 3) break;
    if (!results.some(r => r.meal.id === candidate.meal.id)) results.push(candidate);
  }

  return results.slice(0, 3).map((item, i) => {
    const whyParts = buildWhyParts(item);
    return {
      meal:      item.meal,
      score:     Math.round(item.score * 100) / 100,
      why:       whyParts,           // { headline, bullet2, effortLabel, effortMins }
      role:      i === 0 ? 'primary' : 'alternate',
      generateContext: {
        dish:     item.meal.name,
        cuisine:  item.meal.cuisine !== 'any' ? item.meal.cuisine : undefined,
        mealType: targetMealType,
        diet:     userDietIds[0] || undefined,
        time:     item.meal.effortMins + ' min',
      },
    };
  });
}

// ─────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────
export function recommendationToContext(rec) {
  if (!rec || !rec.meal) return { surpriseMode: true };
  return {
    dish:      rec.meal.name,
    cuisine:   rec.meal.cuisine !== 'any' ? rec.meal.cuisine : undefined,
    mealType:  (rec.generateContext && rec.generateContext.mealType) || rec.meal.mealType[0] || 'any',
    time:      rec.meal.effortMins + ' min',
    _why:      rec.why,
    _role:     rec.role,
  };
}

export function getMealTypeLabel(mealType) {
  return ({
    breakfast: 'Morning ideas',
    lunch:     'Lunch ideas',
    snack:     'Snack time',
    dinner:    "Tonight's ideas",
    any:       'Ideas for you',
  })[mealType] || 'Ideas for you';
}

export function getMealCatalogue() { return MEAL_CATALOGUE; }
export { getMealTypeFromHour };
