// src/lib/eventIntelligence.js
// Event intelligence system — detects active events (sports, festivals, occasions)
// and returns context for scoring + UI messaging.
// Pure functions — no React deps, no network calls.

// ── Event catalogue ────────────────────────────────────────────────
// Fields:
//   id, name, emoji, type, region
//   windows: array of { month, dayStart, dayEnd, hourStart, hourEnd, days (0=Sun) }
//   tags: meal tags to boost
//   boostWeight: added to preferenceScore for tagged meals (0–0.4)
//   messageBefore: shown 1–3 hours before window
//   messageDuring: shown during window

const EVENTS = [
  {
    id: 'ipl_evening',
    name: 'IPL match',
    emoji: '🏏',
    type: 'sports',
    region: ['IN'],
    windows: [
      // Mar–May, evening matches ~19:30–23:00
      { monthStart:3, monthEnd:5, hourStart:17, hourEnd:23, days:[0,1,2,3,4,5,6] },
    ],
    tags: ['quick','light','snack','popular'],
    boostWeight: 0.3,
    messageBefore: 'IPL match tonight?',
    messageDuring: 'Game time — quick snacks?',
  },
  {
    id: 'world_cup_evening',
    name: 'Cricket World Cup',
    emoji: '🏆',
    type: 'sports',
    region: ['IN'],
    windows: [
      { monthStart:10, monthEnd:11, hourStart:13, hourEnd:23, days:[0,1,2,3,4,5,6] },
    ],
    tags: ['quick','snack','light','popular'],
    boostWeight: 0.3,
    messageBefore: 'Big match today?',
    messageDuring: 'Match time snacks?',
  },
  {
    id: 'friday_evening',
    name: 'Friday treat',
    emoji: '🎉',
    type: 'occasion',
    region: ['IN','GB','US','AU','SG','AE'],
    windows: [
      { monthStart:1, monthEnd:12, hourStart:17, hourEnd:23, days:[5] }, // Friday
    ],
    tags: ['indulgent','special','comfort'],
    boostWeight: 0.2,
    messageBefore: null,
    messageDuring: 'Friday night — treat yourself?',
  },
  {
    id: 'weekend_brunch',
    name: 'Weekend brunch',
    emoji: '🌄',
    type: 'occasion',
    region: ['IN','GB','US','AU','SG'],
    windows: [
      { monthStart:1, monthEnd:12, hourStart:9, hourEnd:13, days:[0,6] }, // Sat, Sun
    ],
    tags: ['comfort','filling','popular'],
    boostWeight: 0.15,
    messageBefore: null,
    messageDuring: 'Weekend brunch time?',
  },
  {
    id: 'school_lunchbox',
    name: 'School day',
    emoji: '🎒',
    type: 'routine',
    region: ['IN'],
    windows: [
      // Mon–Fri, morning
      { monthStart:6, monthEnd:4, hourStart:6, hourEnd:9, days:[1,2,3,4,5] },
    ],
    tags: ['quick','light','healthy','protein'],
    boostWeight: 0.2,
    messageBefore: null,
    messageDuring: 'School day — quick breakfast?',
  },
];

// ── Detect active / upcoming events ───────────────────────────────
export function getActiveEvent({ region = 'IN', now = new Date() } = {}) {
  const month = now.getMonth() + 1;
  const hour  = now.getHours();
  const day   = now.getDay(); // 0=Sun

  for (const ev of EVENTS) {
    // Region filter
    if (ev.region && ev.region.length && !ev.region.includes(region)) continue;

    for (const w of ev.windows) {
      const inMonth = w.monthStart <= w.monthEnd
        ? (month >= w.monthStart && month <= w.monthEnd)
        : (month >= w.monthStart || month <= w.monthEnd);
      if (!inMonth) continue;

      const inDay  = !w.days || w.days.includes(day);
      if (!inDay) continue;

      const inHour = hour >= w.hourStart && hour < w.hourEnd;
      const nearHour = hour >= (w.hourStart - 2) && hour < w.hourStart; // up to 2h before

      if (inHour) {
        return { ...ev, phase: 'during', message: ev.messageDuring };
      }
      if (nearHour && ev.messageBefore) {
        return { ...ev, phase: 'before', message: ev.messageBefore };
      }
    }
  }
  return null;
}

// ── Apply event boost to a meal score ────────────────────────────
// Returns delta to add to preferenceScore (0 if no event or no tag match)
export function getEventBoost(meal, activeEvent) {
  if (!activeEvent || !meal) return 0;
  if (!activeEvent.tags || !meal.tags) return 0;
  const hasTag = activeEvent.tags.some(t => meal.tags.includes(t));
  return hasTag ? (activeEvent.boostWeight || 0) : 0;
}
