// src/hooks/useRetention.js
// Sprint 3+4 — all retention state in one hook.
// Tracks: did-you-cook nudge, weekly digest, welcome-back, challenge, milestones.
// Uses localStorage only — no extra API calls. Reads on mount, writes on events.

import { useState, useEffect, useCallback } from 'react';

const K = {
  lastGenerated:    'jiff-last-generated',   // { mealName, timestamp, shown }
  lastOpen:         'jiff-last-open',         // ISO date string
  weeklyDigest:     'jiff-weekly-digest',     // { shownWeek: 'YYYY-Www' }
  challenge:        'jiff-challenge',         // { week, type, target, progress, done }
  milestones:       'jiff-milestones',        // { rating5: bool, rating15: bool }
  cookCount:        'jiff-cook-count',        // number of total cooks (rated)
};

// Weekly challenge pool — rotates by week number
const CHALLENGES = [
  { type:'pantry',   label:'Cook 3 meals from your pantry this week',    target:3 },
  { type:'cuisine',  label:'Try a new cuisine this week',                target:1 },
  { type:'breakfast',label:'Make breakfast at home 3 mornings this week',target:3 },
  { type:'rated',    label:'Rate 3 recipes this week',                   target:3 },
  { type:'leftover', label:'Rescue leftovers at least once this week',   target:1 },
];

function getWeekKey() {
  const d   = new Date();
  const jan = new Date(d.getFullYear(), 0, 1);
  const wk  = Math.ceil(((d - jan) / 86400000 + jan.getDay() + 1) / 7);
  return d.getFullYear() + '-W' + String(wk).padStart(2, '0');
}

function daysSince(isoStr) {
  if (!isoStr) return 999;
  return Math.floor((Date.now() - new Date(isoStr).getTime()) / 86400000);
}

function isMonday() { return new Date().getDay() === 1; }

function safe(key) {
  try { return JSON.parse(localStorage.getItem(key)); } catch { return null; }
}
function save(key, val) {
  try { localStorage.setItem(key, JSON.stringify(val)); } catch {}
}

export function useRetention({ mealHistory = [], ratings = {}, user, isPremium = false }) {
  const [didYouCookNudge, setDidYouCookNudge] = useState(null); // { mealName }
  const [weeklyDigest,    setWeeklyDigest]    = useState(null); // { cooks, cuisines, saved }
  const [welcomeBack,     setWelcomeBack]     = useState(null); // { daysAway }
  const [challenge,       setChallenge]       = useState(null); // { label, progress, target, done }
  const [milestone,       setMilestone]       = useState(null); // { type:'rating5'|'rating15' }
  const [upgradeNudge,    setUpgradeNudge]    = useState(null); // streak-based upgrade prompt

  const ratingCount = Object.keys(ratings).length;

  // ── On mount — evaluate all retention state ──────────────────────
  useEffect(() => {
    if (!user) return;

    const now    = new Date().toISOString();
    const lastOpen = safe(K.lastOpen);
    const days   = daysSince(lastOpen);
    save(K.lastOpen, now);

    // 1. Welcome-back nudge (3+ days away)
    if (days >= 3 && lastOpen) {
      setWelcomeBack({ daysAway: days });
    }

    // 2. Did-you-cook nudge (last generated meal, shown once, next open)
    const lastGen = safe(K.lastGenerated);
    if (lastGen && !lastGen.shown && daysSince(lastGen.timestamp) >= 1) {
      setDidYouCookNudge({ mealName: lastGen.mealName });
      save(K.lastGenerated, { ...lastGen, shown: true });
    }

    // 3. Weekly digest (Monday only, once per week)
    if (isMonday()) {
      const digest = safe(K.weeklyDigest);
      const thisWeek = getWeekKey();
      if (digest?.shownWeek !== thisWeek && Array.isArray(mealHistory) && mealHistory.length) {
        const weekAgo = new Date(Date.now() - 7 * 86400000);
        const weekMeals = mealHistory.filter(h => new Date(h.generated_at) > weekAgo);
        if (weekMeals.length >= 2) {
          const cuisines = [...new Set(weekMeals.map(h => h.cuisine).filter(Boolean))];
          setWeeklyDigest({
            cooks:   weekMeals.length,
            cuisines: cuisines.slice(0, 2),
            rated:   weekMeals.filter(h => h.rating).length,
          });
          save(K.weeklyDigest, { shownWeek: thisWeek });
        }
      }
    }

    // 4. Weekly challenge — refresh on Monday
    const stored = safe(K.challenge);
    const thisWeek = getWeekKey();
    if (!stored || stored.week !== thisWeek) {
      const weekNum = parseInt(thisWeek.split('-W')[1], 10);
      const ch = CHALLENGES[weekNum % CHALLENGES.length];
      const newChallenge = { week: thisWeek, ...ch, progress: 0, done: false };
      save(K.challenge, newChallenge);
      setChallenge(newChallenge);
    } else {
      setChallenge(stored);
    }

    // 5. Milestones
    const ms = safe(K.milestones) || {};
    if (ratingCount >= 5 && !ms.rating5) {
      setMilestone({ type: 'rating5' });
      save(K.milestones, { ...ms, rating5: true });
    } else if (ratingCount >= 15 && !ms.rating15) {
      setMilestone({ type: 'rating15' });
      save(K.milestones, { ...ms, rating5: true, rating15: true });
    }
  }, [user]); // eslint-disable-line

  // Streak-based upgrade nudge (separate effect — watches streak in ratings count)
  useEffect(() => {
    if (!user || isPremium) return;
    const ratingCount = Object.keys(ratings).length;
    // After 3 rated recipes: user is engaged — show upgrade nudge once
    if (ratingCount >= 3) {
      const shown = localStorage.getItem('jiff-upgrade-nudge-shown');
      if (!shown) {
        setUpgradeNudge({ reason: 'engaged', ratingCount });
        localStorage.setItem('jiff-upgrade-nudge-shown', '1');
      }
    }
  }, [user, isPremium, ratings]); // eslint-disable-line

  // ── Event triggers (called from Jiff.jsx) ────────────────────────

  // Call after a generation completes — stores last meal for did-you-cook
  const recordGeneration = useCallback((mealName) => {
    save(K.lastGenerated, {
      mealName, timestamp: new Date().toISOString(), shown: false,
    });
  }, []);

  // Call when user taps "Yes, I cooked it"
  const confirmCooked = useCallback(() => {
    setDidYouCookNudge(null);
    // Increment cook count for challenge progress
    const ch = safe(K.challenge);
    if (ch && !ch.done) {
      const updated = { ...ch, progress: Math.min(ch.progress + 1, ch.target) };
      if (updated.progress >= updated.target) updated.done = true;
      save(K.challenge, updated);
      setChallenge(updated);
    }
  }, []);

  // Call when user dismisses any nudge
  const dismissNudge = useCallback((type) => {
    if (type === 'did-you-cook')  setDidYouCookNudge(null);
    if (type === 'welcome-back')  setWelcomeBack(null);
    if (type === 'weekly-digest') setWeeklyDigest(null);
    if (type === 'milestone')     setMilestone(null);
  }, []);

  // Rating increases challenge progress for 'rated' type
  const recordRating = useCallback(() => {
    const ch = safe(K.challenge);
    if (ch?.type === 'rated' && !ch.done) {
      const updated = { ...ch, progress: Math.min(ch.progress + 1, ch.target) };
      if (updated.progress >= updated.target) updated.done = true;
      save(K.challenge, updated);
      setChallenge(updated);
    }
  }, []);

  return {
    didYouCookNudge, weeklyDigest, welcomeBack, challenge, milestone,
    setDidYouCookNudge, setWeeklyDigest, setWelcomeBack, setChallenge, setMilestone, setUpgradeNudge,
    upgradeNudge, setUpgradeNudge,
    recordGeneration, confirmCooked, dismissNudge, recordRating,
  };
}
