// src/hooks/useRecipes.js
// Encapsulates all recipe generation state and handlers.
// Jiff.jsx imports this hook — zero fetch() calls remain in the component.

import { useState, useCallback } from 'react';
import { generateRecipes } from '../services/recipeService';
import { trackGeneration } from '../lib/analytics';
import { trackGeneration } from '../lib/analytics';
import { saveHistory, fetchHistory, buildRatingsFromHistory, updateRating } from '../services/historyService';
import { updateStreak, computeNextStreak } from '../services/userService';

const TILE_MSGS = {
  magic_moment: 'Your first personalised recipe is on its way…',
  family:   'Planning for the whole family... 👨‍👩‍👧',
  hosting:  'Preparing an impressive spread... 🎉',
  mood:     'Finding something that matches your vibe... 😊',
  seasonal: "Pulling in what's fresh right now... 🌿",
  weather:  "Picking recipes for today's weather... 🌤️",
  goal:     'Finding recipes that work for your goal... 🎯',
  discover: 'Getting that recipe ready... ⚡',
  planner:  'Building your 7-day menu... 📅',
  trending: 'Grabbing a trending recipe... 🔥',
  regional: "Exploring this week's region... 🌍",
  festival: 'Bringing in the festival flavours... 🎉',
};

export function useRecipes({
  user, profile, pantry, pantryItems,
  isPremium, PAID_RECIPE_CAP,
  checkAccess, recordUsage,
  time, diet, cuisine, mealType, defaultServings,
  lang, units, country,
  setCuisine, setMealType,
  setJourneyMode,
}) {
  const [meals,          setMeals]          = useState([]);
  const [view,           setView]           = useState('input');
  const [errorMsg,       setErrorMsg]       = useState('');
  const [loadingMessage, setLoadingMessage] = useState('Finding your perfect recipes...');
  const [factIdx,        setFactIdx]        = useState(0);
  const [tileContext,    setTileContext]    = useState(null); // { type, label, emoji, color, bg }
  const [pantryNudge,    setPantryNudge]    = useState([]);
  const [ratings,        setRatings]        = useState(() => {
    try { return JSON.parse(localStorage.getItem('jiff-ratings') || '{}'); } catch { return {}; }
  });

  const handleStreak = useCallback((userId) => {
    const next = computeNextStreak(0);
    if (userId) updateStreak(userId, next);
    return next;
  }, []);

  // ── Submit from fridge/direct view ─────────────────────────────
  const handleSubmit = useCallback(async (ingredients, gateDismissCallback) => {
    if (!ingredients.length) return;
    if (!user) { gateDismissCallback?.(); return; }
    if (!checkAccess('generation')) return;

    setView('loading'); setFactIdx(0);
    setLoadingMessage('Finding your perfect recipes...');
    try {
      const count = isPremium ? PAID_RECIPE_CAP : 1;
      const data  = await generateRecipes({
        ingredients, time, diet, cuisine, mealType,
        servings: defaultServings, count, language: lang, units,
        tasteProfile: profile ? {
          spice_level: profile.spice_level,
          allergies:   profile.allergies,
          preferred_cuisines: profile.preferred_cuisines,
          skill_level: profile.skill_level,
        } : null,
      });

      if (!data.meals?.length) {
        setErrorMsg(data.error || 'Could not generate suggestions.');
        setView('error');
        return;
      }

      setMeals(Array.isArray(data.meals) ? data.meals : []);
      setView('results');
      recordUsage();
      handleStreak(user.id);

      const used = (pantry || []).filter(p =>
        data.meals[0]?.ingredients?.some(ing => ing.toLowerCase().includes(p.toLowerCase()))
      );
      if (used.length) setPantryNudge(used.slice(0, 4));

      saveHistory({
        userId: user.id, meals: data.meals,
        mealType, cuisine, servings: defaultServings, ingredients,
      });
      trackGeneration({ cuisine, mealType, diet, isPremium, source: 'fridge' });
    } catch (err) {
      setErrorMsg('Connection error. Please try again.');
      setView('error');
    }
  }, [user, isPremium, PAID_RECIPE_CAP, checkAccess, recordUsage,
      time, diet, cuisine, mealType, defaultServings, lang, units,
      profile, pantry, handleStreak]);

  // ── 1-tap tile generation ───────────────────────────────────────
  const handleGenerateDirect = useCallback(async (context = {}) => {
    const msgKey = context.mood ? 'mood' : context.seasonal ? 'seasonal'
      : context.weather ? 'weather' : context.hosting ? 'hosting'
      : context.family ? 'family' : context.goal ? 'goal'
      : context.type || 'discover';

    setLoadingMessage(TILE_MSGS[msgKey] || 'Finding your perfect recipes...');
    if (!user) return false; // caller shows gate
    if (!checkAccess('generation')) return false;

    if (context.cuisine) setCuisine(context.cuisine);
    if (context.mealType && context.mealType !== 'any') setMealType(context.mealType);

    // Apply diet override from magic moment (profile may not be loaded yet)
    if (context.dietOverride && context.type === 'magic_moment') {
      if (context.dietOverride === 'veg' || context.dietOverride === 'vegan' ||
          context.dietOverride === 'jain' || context.dietOverride === 'eggetarian') {
        // Will be picked up by the diet state already set from profile load
      }
    }
    const tileIngredients = pantryItems?.length
      ? pantryItems
      : ['rice', 'onion', 'tomato', 'oil', 'salt', 'chilli'];

    // Build context descriptor for result banner
    // Build rich context descriptor for result banner
    const CTX_MAP = {
      magic_moment: { emoji:'⚡', color:'#FF4500', bg:'rgba(255,69,0,0.06)', border:'rgba(255,69,0,0.2)',
                      label:'Your first Jiff',
                      sub:'Personalised from your preferences — rate it to make future suggestions even better' },
      mood:     { emoji: context.moodContext?.emoji || '😊', color:'#7C3AED', bg:'rgba(124,58,237,0.07)', border:'rgba(124,58,237,0.2)',
                  label: 'Mood: ' + (context.moodContext?.label || context.mood),
                  sub: context.moodContext?.description || 'Matched to your mood' },
      goal:     { emoji: context.goalContext?.emoji || '🎯', color:'#1D9E75', bg:'rgba(29,158,117,0.07)', border:'rgba(29,158,117,0.2)',
                  label: 'Goal: ' + (context.goalContext?.label || context.goal),
                  sub: context.goalContext?.description || 'Recipes that work for your goal' },
      family:   { emoji:'👨‍👩‍👧', color:'#2563EB', bg:'rgba(37,99,235,0.07)', border:'rgba(37,99,235,0.2)',
                  label:'Family meal', sub:'Suitable for all ages and dietary needs' },
      hosting:  { emoji:'🎉', color:'#D97706', bg:'rgba(217,119,6,0.07)', border:'rgba(217,119,6,0.2)',
                  label:'Hosting guests', sub:'Impressive dishes for 8–12 people, can be prepped ahead' },
      seasonal: { emoji:'🌿', color:'#16A34A', bg:'rgba(22,163,74,0.07)', border:'rgba(22,163,74,0.2)',
                  label:'In season now', sub:'Using the freshest produce available this month' },
      festival: { emoji:'🪔', color:'#DC2626', bg:'rgba(220,38,38,0.07)', border:'rgba(220,38,38,0.2)',
                  label:'Festival special', sub:'Traditional recipes for the occasion' },
      leftover: { emoji:'♻️', color:'#D97706', bg:'rgba(217,119,6,0.08)', border:'rgba(217,119,6,0.25)',
                  label:'Leftover rescue', sub:'Turning what you have into something great' },
    };
    const ctxType = context.mood ? 'mood' : context.goal ? 'goal'
      : context.hosting ? 'hosting' : context.family ? 'family'
      : context.seasonal ? 'seasonal'
      : context.type === 'festival' ? 'festival'
      : context.type === 'leftover' ? 'leftover' : null;
    setTileContext(ctxType ? CTX_MAP[ctxType] : null);
    setView('loading'); setFactIdx(0); setJourneyMode(false);
    try {
      const count = isPremium ? PAID_RECIPE_CAP : 1;
      const data  = await generateRecipes({
        ingredients: tileIngredients, time, diet,
        cuisine: context.cuisine || cuisine,
        mealType: context.mealType || mealType,
        count, country, language: lang,
      });

      if (data.error) {
        setErrorMsg(data.error);
        setView('input');
        setJourneyMode(true);
        return false;
      }

      const resultMeals = Array.isArray(data.meals) ? data.meals : data.meals?.meals || [];
      setMeals(resultMeals);
      handleStreak(user.id);
      saveHistory({ userId: user.id, meals: resultMeals, mealType, cuisine, servings: defaultServings, ingredients: tileIngredients });
      trackGeneration({ cuisine: context.cuisine || cuisine, mealType: context.mealType || mealType, diet, isPremium, source: context.type || 'tile' });
      setView('results');
      return true;
    } catch {
      setErrorMsg('Something went wrong. Please try again.');
      setView('input');
      setJourneyMode(true);
      return false;
    }
  }, [user, isPremium, PAID_RECIPE_CAP, checkAccess,
      time, diet, cuisine, mealType, defaultServings, lang, country,
      pantryItems, setCuisine, setMealType, setJourneyMode, handleStreak]);

  // ── Surprise me ─────────────────────────────────────────────────
  const handleSurprise = useCallback(async (season) => {
    if (!checkAccess('generation')) return;
    setView('loading'); setFactIdx(0);
    setLoadingMessage('Finding something you\'ll love...');
    try {
      const count = isPremium ? PAID_RECIPE_CAP : 1;
      const surpriseCuisine = profile?.preferred_cuisines?.length
        ? profile.preferred_cuisines[Math.floor(Math.random() * profile.preferred_cuisines.length)]
        : 'any';
      const data = await generateRecipes({
        ingredients: pantry?.length ? pantry : (season?.items?.slice(0, 4) || ['rice', 'dal']),
        time, diet, cuisine: surpriseCuisine, count, language: lang, units, surpriseMode: true,
      });
      if (data.meals?.length > 0) {
        setMeals(Array.isArray(data.meals) ? data.meals : []);
        setView('results');
        recordUsage();
      } else {
        setErrorMsg(data.error || 'Could not generate suggestions.');
        setView('error');
      }
    } catch {
      setErrorMsg('Connection error. Please try again.');
      setView('error');
    }
  }, [checkAccess, isPremium, PAID_RECIPE_CAP, recordUsage,
      time, diet, lang, units, pantry, profile]);

  // ── Ratings ─────────────────────────────────────────────────────
  const syncRatings = useCallback(async (userId) => {
    const history = await fetchHistory(userId);
    const remote  = buildRatingsFromHistory(history);
    if (Object.keys(remote).length) {
      setRatings(prev => {
        const merged = { ...prev, ...remote };
        try { localStorage.setItem('jiff-ratings', JSON.stringify(merged)); } catch {}
        return merged;
      });
    }
  }, []);

  const handleRate = useCallback((meal, stars, userId, mealKeyFn) => {
    const key = mealKeyFn(meal);
    setRatings(prev => {
      const next = { ...prev, [key]: stars };
      try { localStorage.setItem('jiff-ratings', JSON.stringify(next)); } catch {}
      return next;
    });
    updateRating({ userId, mealName: meal.name, rating: stars });
  }, []);

  const reset = useCallback((pantryData) => {
    setView('input'); setMeals([]); setErrorMsg('');
  }, []);

  return {
    meals, view, errorMsg, loadingMessage, factIdx, pantryNudge, ratings, tileContext,
    setView, setMeals, setErrorMsg, setFactIdx, setPantryNudge, setRatings,
    setTileContext, setLoadingMessage,
    handleSubmit, handleGenerateDirect, handleSurprise, handleRate, handleStreak,
    syncRatings, reset,
  };
}
