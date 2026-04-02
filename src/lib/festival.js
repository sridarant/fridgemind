// src/lib/festival.js — Indian festival date detection (India-first)
// Returns the upcoming/active festival within a 3-day window, or null.
// Pure function — no React dependencies.

const FESTIVALS = [
  { name:'Pongal',    emoji:'🌾', m:1,  d1:13, d2:16, diet:'vegetarian',  note:'Ven Pongal, Sakkarai Pongal, Vadai' },
  { name:'Holi',      emoji:'🎨', m:3,  d1:24, d2:26, diet:'vegetarian',  note:'Gujiya, Thandai, Dahi Bhalle' },
  { name:'Navratri',  emoji:'🌸', m:4,  d1:1,  d2:11, diet:'vegetarian',  note:'Sabudana khichdi, Kuttu puri, Samak rice' },
  { name:'Eid',       emoji:'🌙', m:4,  d1:9,  d2:11, diet:'halal',       note:'Sheer khurma, Biryani, Sewai' },
  { name:'Onam',      emoji:'🌺', m:8,  d1:28, d2:31, diet:'vegetarian',  note:'Avial, Sambar, Payasam, Sadya' },
  { name:'Navratri',  emoji:'🌸', m:10, d1:2,  d2:12, diet:'vegetarian',  note:'Fasting specials — sabudana, singhara' },
  { name:'Diwali',    emoji:'🪔', m:10, d1:29, d2:3,  diet:'vegetarian',  note:'Ladoo, Chakli, Murukku, Kheer' },
  { name:'Christmas', emoji:'🎄', m:12, d1:22, d2:26, diet:'none',        note:'Plum cake, Appam, Stew, Fruit cake' },
];

/**
 * Returns the active or upcoming festival (within 3-day window) or null.
 * @returns {{ name, emoji, diet, note } | null}
 */
export function getUpcomingFestival() {
  const now   = new Date();
  const month = now.getMonth() + 1;
  const day   = now.getDate();

  const inRange = (m, d1, d2) => {
    if (d1 <= d2) return month === m && day >= d1 - 3 && day <= d2;
    // Spans month boundary (e.g. Oct 29 – Nov 3)
    return (month === m && day >= d1 - 3) ||
           (month === (m % 12) + 1 && day <= d2);
  };

  return FESTIVALS.find(f => inRange(f.m, f.d1, f.d2)) || null;
}
