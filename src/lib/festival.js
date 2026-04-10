// src/lib/festival.js — Indian festival + seasonal produce (multi-religion, India-first)
// Pure functions — no React dependencies.

// ── Festival calendar — covers Hindu, Muslim, Christian, Sikh, Buddhist, Jain ──
const FESTIVALS = [
  // January
  { name:'Pongal',       emoji:'\ud83c\udf3e', m:1,  d1:13, d2:16, diet:'vegetarian', note:'Ven Pongal, Sakkarai Pongal, Vadai', community:'Tamil/South Indian' },
  { name:'Makar Sankranti', emoji:'\ud83e\ude81', m:1, d1:14, d2:15, diet:'vegetarian', note:'Tilgul laddoo, Khichdi, Undhiyu', community:'Pan-India' },
  { name:'Lohri',        emoji:'\ud83d\udd25', m:1, d1:12, d2:14, diet:'none',       note:'Sarson saag, Makki roti, Rewri, Gajak', community:'Punjabi/North Indian' },

  // February
  { name:'Vasant Panchami', emoji:'\ud83c\udf3c', m:2, d1:2, d2:4,  diet:'vegetarian', note:'Boondi ke ladoo, Kesaria bhat, Kesar kheer', community:'North/East Indian' },

  // March
  { name:'Holi',         emoji:'\ud83c\udfa8', m:3,  d1:24, d2:26, diet:'vegetarian', note:'Gujiya, Thandai, Dahi Bhalle, Malpua', community:'Pan-India' },
  { name:'Shivratri',    emoji:'\ud83d\udc00', m:3,  d1:8,  d2:9,  diet:'vegetarian', note:'Sabudana, Makhana kheer, Kuttu puri, Fruits', community:'Hindu' },

  // April
  { name:'Ugadi',        emoji:'\ud83c\udf38', m:4,  d1:1,  d2:3,  diet:'vegetarian', note:'Ugadi pachadi, Holige, Puliyogare', community:'Kannada/Telugu' },
  { name:'Gudi Padwa',   emoji:'\ud83c\udde8', m:4,  d1:1,  d2:2,  diet:'vegetarian', note:'Puran poli, Shrikhand, Aamras', community:'Maharashtrian' },
  { name:'Baisakhi',     emoji:'\ud83c\udf3e', m:4,  d1:13, d2:14, diet:'none',       note:'Makki di roti, Sarson saag, Lassi, Pinni', community:'Sikh/Punjabi' },
  { name:'Navratri',     emoji:'\ud83c\udf38', m:4,  d1:2,  d2:11, diet:'vegetarian', note:'Sabudana khichdi, Kuttu puri, Singhara halwa', community:'Hindu' },
  { name:'Eid ul-Fitr',  emoji:'\ud83c\udf19', m:4,  d1:9,  d2:11, diet:'halal',      note:'Sheer khurma, Biryani, Sewai, Phirni', community:'Muslim' },

  // July
  { name:'Eid ul-Adha',  emoji:'\ud83d\udc11', m:6, d1:16, d2:18, diet:'halal',      note:'Mutton biryani, Seekh kebab, Haleem, Kheer', community:'Muslim' },

  // August
  { name:'Janmashtami',  emoji:'\ud83d\udc5a', m:8,  d1:14, d2:16, diet:'vegetarian', note:'Panjiri, Makhana kheer, Panchamrit, Laddoo', community:'Hindu' },
  { name:'Onam',         emoji:'\ud83c\udf3a', m:8,  d1:28, d2:31, diet:'vegetarian', note:'Avial, Sambar, Payasam, Sadya thali', community:'Kerala/Malayali' },
  { name:'Raksha Bandhan',emoji:'\ud83e\uddf5', m:8, d1:19, d2:19, diet:'vegetarian', note:'Ghewar, Mohanthal, Kaju katli, Ras malai', community:'Pan-India' },

  // September
  { name:'Ganesh Chaturthi', emoji:'\ud83d\udc18', m:9, d1:1, d2:12, diet:'vegetarian', note:'Modak, Karanji, Puran poli, Ladoo', community:'Maharashtrian/South Indian' },

  // October
  { name:'Navratri',     emoji:'\ud83c\udf38', m:10, d1:2,  d2:12, diet:'vegetarian', note:'Fasting specials — sabudana, singhara, makhana', community:'Hindu' },
  { name:'Dussehra',     emoji:'\ud83c\udff9', m:10, d1:12, d2:14, diet:'none',       note:'Jalebi, Fafda, Kadhi, Kheer', community:'Pan-India' },
  { name:'Diwali',       emoji:'\ud83e\uddd1\u200d\ud83d\udca1', m:10, d1:29, d2:3,  diet:'vegetarian', note:'Ladoo, Chakli, Murukku, Gulab jamun, Kheer', community:'Pan-India' },
  { name:'Dhanteras',    emoji:'\ud83e\udea9', m:10, d1:27, d2:28, diet:'vegetarian', note:'Dhaniya panjiri, Kheel batasha, Kheer', community:'Hindu' },

  // November
  { name:'Guru Nanak Jayanti', emoji:'\u2604\ufe0f', m:11, d1:15, d2:16, diet:'vegetarian', note:'Karah prasad, Langar dal, Kadah, Pinni', community:'Sikh' },
  { name:'Chhath Puja',  emoji:'\u2600\ufe0f',  m:11, d1:7,  d2:11, diet:'vegetarian', note:'Thekua, Kheer, Kaddu bhaat, Meetha bhat', community:'Bihar/Jharkhand' },

  // December
  { name:'Christmas',    emoji:'\ud83c\udf84', m:12, d1:22, d2:26, diet:'none',       note:'Plum cake, Appam, Stew, Fruit cake, Kulkuls', community:'Christian' },
];

// ── Seasonal produce by month — India (primarily South/West) ──────
const SEASONAL_BY_MONTH = {
  1:  { emoji:'\ud83c\udf3e', label:'Winter harvest',       items:['fenugreek','spinach','carrots','cauliflower','green peas'],       recipes:['Methi thepla','Gajar halwa','Matar paneer','Aloo gobi'] },
  2:  { emoji:'\ud83fad', label:'Late winter greens',   items:['peas','mustard leaves','radish','beetroot','amla'],               recipes:['Sarson da saag','Matar pulao','Mooli paratha','Amla pickle'] },
  3:  { emoji:'\ud83c\udf31', label:'Spring abundance',     items:['raw mango','jackfruit','drumstick','curry leaves','ivy gourd'],   recipes:['Raw mango rice','Drumstick sambar','Murungakkai kootu','Jackfruit curry'] },
  4:  { emoji:'\ud83e\udd6d', label:'Mango season begins',  items:['raw mango','mango','kokum','wood apple','tender coconut'],        recipes:['Mango rice','Aam panna','Kokum curry','Raw mango chutney'] },
  5:  { emoji:'\ud83c\udf1e', label:'Summer peak',           items:['mango','watermelon','cucumber','ash gourd','bottle gourd'],       recipes:['Mango kulfi','Cucumber raita','Ash gourd kootu','Mango shrikhand'] },
  6:  { emoji:'\ud83c\udf27\ufe0f', label:'Monsoon comfort', items:['corn','ginger','turmeric','colocasia','raw banana'],            recipes:['Bhutta masala','Ginger rasam','Arbi fry','Raw banana chips'] },
  7:  { emoji:'\ud83c\udf3f', label:'Monsoon greens',        items:['pointed gourd','ridge gourd','snake gourd','cluster beans'],     recipes:['Parwal sabzi','Turai dal','Snake gourd kootu','Guar phali sabzi'] },
  8:  { emoji:'\ud83c\udf8b', label:'Onam harvest',          items:['yam','raw banana','bitter gourd','drumstick','ash gourd'],       recipes:['Avial','Olan','Erissery','Kaalan','Sadya thali'] },
  9:  { emoji:'\ud83c\udf42', label:'Post-monsoon produce', items:['pumpkin','sweet potato','colocasia','plantain','green papaya'],   recipes:['Kaddu ki sabzi','Sweet potato chaat','Papaya stir-fry'] },
  10: { emoji:'\ud83e\uddd1\u200d\ud83d\udca1', label:'Festival season', items:['lotus seeds','sabudana','singhara','buckwheat','sweet potato'], recipes:['Sabudana khichdi','Singhara atta puri','Makhana curry'] },
  11: { emoji:'\ud83c\udf3e', label:'Winter begins',         items:['fenugreek','peas','carrots','broccoli','beetroot','amla'],       recipes:['Methi matar malai','Gajar soup','Aloo methi','Broccoli stir-fry'] },
  12: { emoji:'\u2744\ufe0f', label:'Deep winter warmth',   items:['mustard greens','spinach','peas','cauliflower','winter melon'],   recipes:['Sarson saag','Palak dal','Gobhi paratha','Matar kachori'] },
};

const REGIONS = [
  { id:'chettinad', name:'Chettinad', state:'Tamil Nadu', emoji:'\ud83c\udf36\ufe0f', description:'Bold spices, star anise, kalpasi', dishes:['Chicken Chettinad','Kavuni arisi','Paniyaram'] },
  { id:'kerala', name:'Kerala', state:'Kerala', emoji:'\ud83e\udd65', description:'Coconut, curry leaves, coastal flavours', dishes:['Fish molee','Appam stew','Puttu kadala','Avial'] },
  { id:'rajasthani', name:'Rajasthani', state:'Rajasthan', emoji:'\ud83c\udfdc\ufe0f', description:'Rich gravies, dal baati, desert cuisine', dishes:['Dal baati churma','Gatte ki sabzi','Ker sangri'] },
  { id:'punjabi', name:'Punjabi', state:'Punjab', emoji:'\ud83c\udf3e', description:'Tandoor, dairy-rich, hearty', dishes:['Butter chicken','Sarson saag','Dal makhani'] },
  { id:'bengali', name:'Bengali', state:'West Bengal', emoji:'\ud83d\udc1f', description:'Mustard oil, fish, subtle spicing', dishes:['Macher jhol','Shorshe ilish','Aloo posto'] },
  { id:'gujarati', name:'Gujarati', state:'Gujarat', emoji:'\ud83e\uded9', description:'Sweet-sour balance, fermented foods', dishes:['Dhokla','Thepla','Undhiyu','Kadhi'] },
  { id:'hyderabadi', name:'Hyderabadi', state:'Telangana', emoji:'\ud83c\udf5a', description:'Dum cooking, rich Nizami heritage', dishes:['Hyderabadi biryani','Haleem','Mirchi ka salan'] },
  { id:'maharashtrian', name:'Maharashtrian', state:'Maharashtra', emoji:'\ud83c\udf3f', description:'Dry spice blends, peanuts, kokum', dishes:['Puran poli','Misal pav','Bharli vangi'] },
  { id:'goan', name:'Goan', state:'Goa', emoji:'\ud83c\udf0a', description:'Vinegar, coconut, Portuguese influence', dishes:['Fish curry rice','Vindaloo','Xacuti','Bebinca'] },
  { id:'kashmiri', name:'Kashmiri', state:'J&K', emoji:'\ud83c\udfd4\ufe0f', description:'Fennel, dried ginger, slow cooking', dishes:['Rogan josh','Yakhni','Dum aloo'] },
  { id:'odia', name:'Odia', state:'Odisha', emoji:'\ud83d\udef0\ufe0f', description:'Temple cuisine, mild and pure', dishes:['Dalma','Pakhala','Santula'] },
  { id:'north_eastern', name:'North Eastern', state:'Assam & beyond', emoji:'\ud83c\udf43', description:'Bamboo shoot, fermented, minimal spice', dishes:['Masor tenga','Pork with bamboo shoot','Alu pitika'] },
];


// ── Sports calendar — IPL, India cricket, major events ──────────────
const SPORTS_EVENTS = [
  // IPL (approx March 22 – May 26 every year)
  { name:'IPL',          emoji:'🏏', m1:3, d1:22, m2:5, d2:26,
    label:'Match day snacks', note:'Quick bites for the big game',
    cuisine:'indian', mealType:'snack', type:'sports' },
  // India vs Pakistan (June – typically Champions Trophy / World Cup window)
  { name:'Ind vs Pak',   emoji:'🏏', m1:6, d1:1,  m2:6, d2:30,
    label:'Game day special', note:'Classic match-day finger food',
    cuisine:'indian', mealType:'snack', type:'sports' },
  // FIFA World Cup (Nov–Dec every 4 years — hardcoded for 2026)
  { name:'FIFA World Cup', emoji:'⚽', m1:11, d1:8, m2:12, d2:19,
    label:'World Cup snacks', note:'Global game, Indian snacks',
    cuisine:'any', mealType:'snack', type:'sports' },
  // Pro Kabaddi (typically July–October)
  { name:'Pro Kabaddi',  emoji:'🤼', m1:7, d1:1,  m2:10, d2:31,
    label:'Kabaddi night special', note:'Energising food for the match',
    cuisine:'indian', mealType:'dinner', type:'sports' },
];

/**
 * Returns the active sports event if today falls in its window, else null.
 * @returns {object|null}
 */
export function getActiveSportsEvent() {
  const now   = new Date();
  const month = now.getMonth() + 1;
  const day   = now.getDate();
  for (const ev of SPORTS_EVENTS) {
    const inRange = ev.m1 === ev.m2
      ? month === ev.m1 && day >= ev.d1 && day <= ev.d2
      : (month === ev.m1 && day >= ev.d1) || (month > ev.m1 && month < ev.m2) || (month === ev.m2 && day <= ev.d2);
    if (inRange) return ev;
  }
  return null;
}

export function getUpcomingFestival() {
  const now   = new Date();
  const month = now.getMonth() + 1;
  const day   = now.getDate();
  const inRange = (m, d1, d2) => {
    if (d1 <= d2) return month === m && day >= d1 - 2 && day <= d2;
    return (month === m && day >= d1 - 2) || (month === (m % 12) + 1 && day <= d2);
  };
  return FESTIVALS.find(f => inRange(f.m, f.d1, f.d2)) || null;
}

export function getCurrentSeason() {
  const month = new Date().getMonth() + 1;
  const data  = SEASONAL_BY_MONTH[month] || SEASONAL_BY_MONTH[1];
  return { ...data, month };
}

export function getFeaturedRegion() {
  const weekNumber = Math.floor(Date.now() / (7 * 24 * 60 * 60 * 1000));
  return REGIONS[weekNumber % REGIONS.length];
}

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

/**
 * Returns a contextual tile for the current day of week.
 * Mon=prep, Fri=hosting, Sat=adventurous, Sun=leftovers. Others: null.
 * @returns {object|null}
 */
export function getDayOfWeekContext() {
  const day = new Date().getDay(); // 0=Sun, 1=Mon ... 6=Sat
  const h   = new Date().getHours();
  const DOW = {
    0: { label:'Sunday slow cook',   emoji:'♻️', note:'Perfect day for leftover rescue or slow cooking', type:'leftover', mealType:'dinner' },
    1: { label:'Fresh week start',   emoji:'📅', note:'Plan meals for the week ahead',                  type:'planner',  mealType:'any'    },
    5: h >= 16 ? { label:'Friday treat',   emoji:'🎉', note:'Host someone or treat yourself tonight',  type:'hosting',  mealType:'dinner' } : null,
    6: { label:'Weekend special',    emoji:'🌍', note:'Try something new — you have time',              type:'adventure',mealType:'any'    },
  };
  return DOW[day] || null;
}
