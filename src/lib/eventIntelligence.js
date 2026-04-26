// src/lib/eventIntelligence.js
// Event intelligence — detects active sports, festivals, and occasions.
// Pure functions, no React deps, no network calls.
// Festivals are HIGH-PRIORITY events. Sports/occasions are MEDIUM.
// Event only surfaces when it falls within a valid regional time window.

// ── Festival catalogue ────────────────────────────────────────────
// m: month (1=Jan), d1/d2: day range (inclusive)
// diet hint, region array (empty = pan-India), mealType hint
const FESTIVALS = [
  { id:'pongal',      name:'Pongal',         emoji:'🌾', m:1,  d1:13, d2:16, region:['IN'], community:['TN','KA','AP'], diet:'veg',    mealType:'breakfast', tags:['festive','mild','comfort','healthy'], note:'Traditional Pongal, Vadai, Payasam' },
  { id:'sankranti',   name:'Makar Sankranti',emoji:'🪁', m:1,  d1:14, d2:15, region:['IN'], community:['all'], diet:'veg',    mealType:'any',       tags:['festive','sweet','comfort'],        note:'Tilgul, Khichdi, Undhiyu' },
  { id:'holi',        name:'Holi',           emoji:'🎨', m:3,  d1:24, d2:26, region:['IN'], community:['all'], diet:'veg',    mealType:'any',       tags:['festive','sweet','comfort','indulgent'], note:'Gujiya, Thandai, Dahi Bhalle' },
  { id:'navratri_a',  name:'Navratri',       emoji:'🌸', m:4,  d1:2,  d2:12, region:['IN'], community:['all'], diet:'jain',   mealType:'any',       tags:['festive','mild','fasting'],         note:'Sabudana khichdi, Kuttu puri' },
  { id:'eid_fitr',    name:'Eid ul-Fitr',    emoji:'🌙', m:4,  d1:9,  d2:11, region:['IN'], community:['all'], diet:'halal',  mealType:'dinner',    tags:['festive','special','indulgent'],    note:'Sheer khurma, Biryani, Sewai' },
  { id:'onam',        name:'Onam',           emoji:'🌺', m:8,  d1:28, d2:31, region:['IN'], community:['KL'],  diet:'veg',    mealType:'lunch',     tags:['festive','healthy','mild','comfort'],note:'Avial, Sambar, Payasam, Sadya' },
  { id:'ganesh_ch',   name:'Ganesh Chaturthi',emoji:'🐘',m:9,  d1:1,  d2:12, region:['IN'], community:['MH','KA'], diet:'veg', mealType:'any',    tags:['festive','sweet','comfort'],        note:'Modak, Puran poli, Ladoo' },
  { id:'navratri_b',  name:'Navratri',       emoji:'🌸', m:10, d1:2,  d2:12, region:['IN'], community:['all'], diet:'jain',   mealType:'any',       tags:['festive','mild','fasting'],         note:'Fasting specials — sabudana, makhana' },
  { id:'diwali',      name:'Diwali',         emoji:'🪔', m:10, d1:26, d2:3,  region:['IN'], community:['all'], diet:'veg',    mealType:'dinner',    tags:['festive','sweet','indulgent','special'], note:'Ladoo, Chakli, Gulab jamun, Kheer' },
  { id:'eid_adha',    name:'Eid ul-Adha',    emoji:'🐑', m:6,  d1:16, d2:18, region:['IN'], community:['all'], diet:'halal',  mealType:'dinner',    tags:['festive','special','protein'],      note:'Mutton biryani, Seekh kebab, Haleem' },
  { id:'ramzan',      name:'Ramzan',         emoji:'🌙', m:3,  d1:1,  d2:30, region:['IN'], community:['all'], diet:'halal',  mealType:'dinner',    tags:['festive','special','protein','iftar'], note:'Haleem, Biryani, Dates, Sheer khurma' },
  { id:'christmas',   name:'Christmas',      emoji:'🎄', m:12, d1:22, d2:26, region:['IN','GB','US','AU'], community:['all'], diet:'any', mealType:'dinner', tags:['festive','special','indulgent','comfort'], note:'Plum cake, Appam, Stew, Kulkuls' },
];

// ── Sports & occasion catalogue ────────────────────────────────────
const SPORTS_EVENTS = [
  {
    id: 'ipl_evening',
    name: 'IPL',
    emoji: '🏏',
    type: 'sports',
    region: ['IN'],
    windows: [{ monthStart:3, monthEnd:5, hourStart:17, hourEnd:23, days:[0,1,2,3,4,5,6] }],
    tags: ['quick','light','snack','popular'],
    boostWeight: 0.3,
    messageBefore: 'IPL match tonight?',
    messageDuring: null,
  },
  {
    id: 'world_cup',
    name: 'Cricket World Cup',
    emoji: '🏆',
    type: 'sports',
    region: ['IN'],
    windows: [{ monthStart:10, monthEnd:11, hourStart:13, hourEnd:23, days:[0,1,2,3,4,5,6] }],
    tags: ['quick','snack','light','popular'],
    boostWeight: 0.3,
    messageBefore: 'Big match today?',
    messageDuring: null,
  },
  {
    id: 'friday_treat',
    name: 'Friday treat',
    emoji: '🎉',
    type: 'occasion',
    region: ['IN','GB','US','AU','SG','AE'],
    windows: [{ monthStart:1, monthEnd:12, hourStart:17, hourEnd:23, days:[5] }],
    tags: ['indulgent','special','comfort'],
    boostWeight: 0.2,
    messageBefore: null,
    messageDuring: null,
  },
  {
    id: 'weekend_brunch',
    name: 'Weekend brunch',
    emoji: '🌄',
    type: 'occasion',
    region: ['IN','GB','US','AU','SG'],
    windows: [{ monthStart:1, monthEnd:12, hourStart:9, hourEnd:13, days:[0,6] }],
    tags: ['comfort','filling','popular'],
    boostWeight: 0.15,
    messageBefore: null,
    messageDuring: null,
  },
];

// ── Check festival active ─────────────────────────────────────────
function getFestivalEvent({ region = 'IN', now = new Date() } = {}) {
  const month = now.getMonth() + 1;
  const day   = now.getDate();

  for (const fest of FESTIVALS) {
    // Region check — if festival has a specific region, skip for other regions
    if (fest.region && fest.region.length && !fest.region.includes(region)) continue;

    // Day range — handles month wrap (e.g. Diwali Oct 26 – Nov 3)
    let inRange = false;
    if (fest.d1 <= fest.d2) {
      inRange = month === fest.m && day >= fest.d1 && day <= fest.d2;
    } else {
      // Wraps to next month
      inRange = (month === fest.m && day >= fest.d1) ||
                (month === fest.m + 1 && day <= fest.d2);
    }
    if (!inRange) continue;

    const hour = now.getHours();
    const phase = 'during';
    const messageDuring = 'Festive ideas for ' + fest.name + '?';
    const messageBefore = fest.name + ' coming up?';

    return {
      ...fest,
      type: 'festival',
      phase,
      message: messageDuring,
      messageDuring,
      messageBefore,
      boostWeight: 0.35, // festivals always highest priority
    };
  }
  return null;
}

// ── Check sports / occasion active ───────────────────────────────
function getSportsEvent({ region = 'IN', now = new Date() } = {}) {
  const month = now.getMonth() + 1;
  const hour  = now.getHours();
  const day   = now.getDay();

  for (const ev of SPORTS_EVENTS) {
    if (ev.region && ev.region.length && !ev.region.includes(region)) continue;

    for (const w of ev.windows) {
      const inMonth = w.monthStart <= w.monthEnd
        ? (month >= w.monthStart && month <= w.monthEnd)
        : (month >= w.monthStart || month <= w.monthEnd);
      if (!inMonth) continue;
      if (w.days && !w.days.includes(day)) continue;

      const inHour   = hour >= w.hourStart && hour < w.hourEnd;
      const nearHour = hour >= (w.hourStart - 2) && hour < w.hourStart;

      if (inHour)   return { ...ev, phase:'during', message: ev.messageDuring };
      if (nearHour && ev.messageBefore) return { ...ev, phase:'before', message: ev.messageBefore };
    }
  }
  return null;
}

// ── Main export: returns highest-priority active event ────────────
// Priority: festival > sports > occasion > routine > null
export function getActiveEvent({ region = 'IN', now = new Date() } = {}) {
  const festival = getFestivalEvent({ region, now });
  if (festival) return festival;
  return getSportsEvent({ region, now });
}

// ── Boost: delta added to preferenceScore in scoring engine ──────
export function getEventBoost(meal, activeEvent) {
  if (!activeEvent || !meal) return 0;
  if (!activeEvent.tags || !meal.tags) return 0;
  const hasTag = activeEvent.tags.some(t => meal.tags.includes(t));
  return hasTag ? (activeEvent.boostWeight || 0) : 0;
}

// ── Context label for a meal based on its tags ───────────────────
// Returns one of: 'Light meal' | 'High protein' | 'Festive' | 'Kid-friendly' | null
export function getMealContextLabel(meal, journeyType = null) {
  if (!meal || !meal.tags) return null;
  if (journeyType === 'kids')      return 'Kid-friendly';
  if (meal.tags.includes('festive')) return 'Festive';
  if (meal.tags.includes('protein') && meal.tags.includes('healthy')) return 'High protein';
  if (meal.tags.includes('light'))   return 'Light meal';
  return null;
}
