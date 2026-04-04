// src/lib/festival.js — Indian festival + seasonal produce (India-first)
// Pure functions — no React dependencies.

// ── Festival calendar ─────────────────────────────────────────────
const FESTIVALS = [
  { name:'Pongal',       emoji:'🌾', m:1,  d1:13, d2:16, diet:'vegetarian', note:'Ven Pongal, Sakkarai Pongal, Vadai' },
  { name:'Holi',         emoji:'🎨', m:3,  d1:24, d2:26, diet:'vegetarian', note:'Gujiya, Thandai, Dahi Bhalle' },
  { name:'Ugadi',        emoji:'🌸', m:4,  d1:1,  d2:3,  diet:'vegetarian', note:'Ugadi pachadi, Holige, Puliyogare' },
  { name:'Navratri',     emoji:'🌸', m:4,  d1:2,  d2:11, diet:'vegetarian', note:'Sabudana khichdi, Kuttu puri, Samak rice' },
  { name:'Eid',          emoji:'🌙', m:4,  d1:9,  d2:11, diet:'halal',      note:'Sheer khurma, Biryani, Sewai' },
  { name:'Onam',         emoji:'🌺', m:8,  d1:28, d2:31, diet:'vegetarian', note:'Avial, Sambar, Payasam, Sadya' },
  { name:'Navratri',     emoji:'🌸', m:10, d1:2,  d2:12, diet:'vegetarian', note:'Fasting specials — sabudana, singhara' },
  { name:'Diwali',       emoji:'🪔', m:10, d1:29, d2:3,  diet:'vegetarian', note:'Ladoo, Chakli, Murukku, Kheer' },
  { name:'Christmas',    emoji:'🎄', m:12, d1:22, d2:26, diet:'none',       note:'Plum cake, Appam, Stew, Fruit cake' },
];

// ── Seasonal produce by month — India (primarily South/West) ──────
// items: what's in season
// recipes: suggested dishes that use them
// emoji: visual for the card
const SEASONAL_BY_MONTH = {
  1:  { emoji:'🌾', label:'Winter harvest',       items:['fenugreek','spinach','carrots','cauliflower','green peas'],       recipes:['Methi thepla','Gajar halwa','Matar paneer','Aloo gobi'] },
  2:  { emoji:'🫛', label:'Late winter greens',   items:['peas','mustard leaves','radish','beetroot','amla'],               recipes:['Sarson da saag','Matar pulao','Mooli paratha','Amla pickle'] },
  3:  { emoji:'🌱', label:'Spring abundance',     items:['raw mango','jackfruit','drumstick','curry leaves','ivy gourd'],   recipes:['Raw mango rice','Drumstick sambar','Murungakkai kootu','Jackfruit curry'] },
  4:  { emoji:'🥭', label:'Mango season begins',  items:['raw mango','mango','kokum','wood apple','tender coconut'],        recipes:['Mango rice','Aam panna','Kokum curry','Raw mango chutney','Mango lassi'] },
  5:  { emoji:'🌞', label:'Summer peak',           items:['mango','watermelon','cucumber','ash gourd','bottle gourd'],       recipes:['Mango kulfi','Cucumber raita','Ash gourd kootu','Mango shrikhand'] },
  6:  { emoji:'🌧️', label:'Monsoon comfort',       items:['corn','ginger','turmeric','colocasia','raw banana'],             recipes:['Bhutta masala','Ginger rasam','Arbi fry','Raw banana chips','Colocasia curry'] },
  7:  { emoji:'🌿', label:'Monsoon greens',        items:['pointed gourd','ridge gourd','snake gourd','cluster beans'],     recipes:['Parwal sabzi','Turai dal','Snake gourd kootu','Guar phali sabzi'] },
  8:  { emoji:'🎋', label:'Onam harvest',          items:['yam','raw banana','bitter gourd','drumstick','ash gourd'],       recipes:['Avial','Olan','Erissery','Kaalan','Sadya thali'] },
  9:  { emoji:'🍂', label:'Post-monsoon produce', items:['pumpkin','sweet potato','colocasia','plantain','green papaya'],   recipes:['Kaddu ki sabzi','Sweet potato chaat','Papaya stir-fry','Plantain curry'] },
  10: { emoji:'🪔', label:'Festival season',       items:['lotus seeds','sabudana','singhara','buckwheat','sweet potato'],  recipes:['Sabudana khichdi','Singhara atta puri','Makhana curry','Rajgira halwa'] },
  11: { emoji:'🌾', label:'Winter begins',         items:['fenugreek','peas','carrots','broccoli','beetroot','amla'],       recipes:['Methi matar malai','Gajar soup','Aloo methi','Broccoli stir-fry'] },
  12: { emoji:'❄️', label:'Deep winter warmth',   items:['mustard greens','spinach','peas','cauliflower','winter melon'],   recipes:['Sarson saag','Palak dal','Gobhi paratha','Matar kachori'] },
};

// ── Regional cuisine rotation — one region per week ───────────────
const REGIONS = [
  { id:'chettinad',     name:'Chettinad',          state:'Tamil Nadu',    emoji:'🌶️', description:'Bold spices, star anise, kalpasi', dishes:['Chicken Chettinad','Kavuni arisi','Paniyaram','Kuzhi paniyaram'] },
  { id:'kerala',        name:'Kerala',              state:'Kerala',        emoji:'🥥', description:'Coconut, curry leaves, coastal flavours', dishes:['Fish molee','Appam stew','Puttu kadala','Avial'] },
  { id:'rajasthani',    name:'Rajasthani',          state:'Rajasthan',     emoji:'🏜️', description:'Rich gravies, dal baati, desert cuisine', dishes:['Dal baati churma','Gatte ki sabzi','Ker sangri','Laal maas'] },
  { id:'punjabi',       name:'Punjabi',             state:'Punjab',        emoji:'🌾', description:'Tandoor, dairy-rich, hearty', dishes:['Butter chicken','Sarson saag','Dal makhani','Amritsari kulcha'] },
  { id:'bengali',       name:'Bengali',             state:'West Bengal',   emoji:'🐟', description:'Mustard oil, fish, subtle spicing', dishes:['Macher jhol','Shorshe ilish','Aloo posto','Mishti doi'] },
  { id:'gujarati',      name:'Gujarati',            state:'Gujarat',       emoji:'🫙', description:'Sweet-sour balance, fermented foods', dishes:['Dhokla','Thepla','Undhiyu','Kadhi'] },
  { id:'hyderabadi',    name:'Hyderabadi',          state:'Telangana',     emoji:'🍚', description:'Dum cooking, rich Nizami heritage', dishes:['Hyderabadi biryani','Haleem','Mirchi ka salan','Qubani ka meetha'] },
  { id:'maharashtrian', name:'Maharashtrian',       state:'Maharashtra',   emoji:'🌿', description:'Dry spice blends, peanuts, kokum', dishes:['Puran poli','Misal pav','Bharli vangi','Thalipeeth'] },
  { id:'goan',          name:'Goan',                state:'Goa',           emoji:'🌊', description:'Vinegar, coconut, Portuguese influence', dishes:['Fish curry rice','Vindaloo','Xacuti','Bebinca'] },
  { id:'kashmiri',      name:'Kashmiri',            state:'J&K',           emoji:'🏔️', description:'Fennel, dried ginger, slow cooking', dishes:['Rogan josh','Yakhni','Dum aloo','Shab degh'] },
  { id:'odia',          name:'Odia',                state:'Odisha',        emoji:'🛕', description:'Temple cuisine, mild and pure', dishes:['Dalma','Pakhala','Santula','Chhena poda'] },
  { id:'north_eastern', name:'North Eastern',       state:'Assam & beyond',emoji:'🍃', description:'Bamboo shoot, fermented, minimal spice', dishes:['Masor tenga','Pork with bamboo shoot','Alu pitika','Khar'] },
];

/**
 * Returns the active or upcoming festival (within 3-day window) or null.
 */
export function getUpcomingFestival() {
  const now   = new Date();
  const month = now.getMonth() + 1;
  const day   = now.getDate();
  const inRange = (m, d1, d2) => {
    if (d1 <= d2) return month === m && day >= d1 - 3 && day <= d2;
    return (month === m && day >= d1 - 3) || (month === (m % 12) + 1 && day <= d2);
  };
  return FESTIVALS.find(f => inRange(f.m, f.d1, f.d2)) || null;
}

/**
 * Returns seasonal produce for the current month.
 */
export function getCurrentSeason() {
  const month = new Date().getMonth() + 1;
  const data  = SEASONAL_BY_MONTH[month] || SEASONAL_BY_MONTH[1];
  return { ...data, month };
}

/**
 * Returns the featured region for the current week (rotates weekly).
 */
export function getFeaturedRegion() {
  const weekNumber = Math.floor(Date.now() / (7 * 24 * 60 * 60 * 1000));
  return REGIONS[weekNumber % REGIONS.length];
}

/**
 * Returns all festivals for the next 30 days (for calendar view).
 */
export function getUpcomingFestivals(daysAhead = 30) {
  const now     = new Date();
  const results = [];
  for (let i = 0; i <= daysAhead; i++) {
    const d     = new Date(now.getTime() + i * 86400000);
    const month = d.getMonth() + 1;
    const day   = d.getDate();
    FESTIVALS.forEach(f => {
      if (f.m === month && f.d1 === day) {
        results.push({ ...f, date: d, daysFromNow: i });
      }
    });
  }
  return results;
}
