// src/components/common/journeyTileEngines.js
// Pure functions — no React deps.
// getFeaturedTile: priority-ordered Zone 2 tile selection
// getPersonalisedPicks: Zone 3 ranked picks based on profile + ratings

// ── Priority engine — Zone 2 featured tile ──────────────────────────
function getFeaturedTile({ festival, sports, weather, dayCtx, profile, isReturning, lastFavCuisine }) {
  const h   = new Date().getHours();
  const dow = new Date().getDay();

  // 1. Festival (defers to sports during match time — afternoons/evenings)
  if (festival && !sports) return {
    emoji: festival.emoji, badge: 'FESTIVAL',
    label: festival.name + ' special',
    sub:   festival.note || 'Traditional recipes for the occasion',
    color: '#DC2626', bg:'rgba(220,38,38,0.06)', border:'rgba(220,38,38,0.2)',
    context: { type:'festival', cuisine: festival.cuisine || 'indian', mealType: festival.mealType || 'dinner' },
  };

  // Festival + Sports both active: show festival at lunch, sports at snack/dinner
  if (festival && sports) {
    const hr = new Date().getHours();
    if (hr >= 14) return {   // afternoon/evening → IPL time
      emoji: sports.emoji, badge: 'MATCH DAY',
      label: sports.label,
      sub:   sports.note,
      color: '#1D4ED8', bg:'rgba(29,78,216,0.06)', border:'rgba(29,78,216,0.2)',
      context: { type:'sports', mealType:'snack', cuisine: sports.cuisine || 'indian' },
    };
    return {                 // morning/lunch → festival
      emoji: festival.emoji, badge: 'FESTIVAL',
      label: festival.name + ' special',
      sub:   festival.note || 'Traditional recipes for the occasion',
      color: '#DC2626', bg:'rgba(220,38,38,0.06)', border:'rgba(220,38,38,0.2)',
      context: { type:'festival', cuisine: festival.cuisine || 'indian', mealType: festival.mealType || 'dinner' },
    };
  }

  // 2. Sports only
  if (sports) return {
    emoji: sports.emoji, badge: 'MATCH DAY',
    label: sports.label,
    sub:   sports.note,
    color: '#1D4ED8', bg:'rgba(29,78,216,0.06)', border:'rgba(29,78,216,0.2)',
    context: { type:'sports', mealType:'snack', cuisine: sports.cuisine || 'indian' },
  };

  // 3. Extreme weather
  if (weather?.temp > 35) return {
    emoji: '🥤', badge: 'HOT DAY',
    label: 'Cooling foods for today',
    sub:   'Aam panna · Raita · Lassi · Cold rice dishes',
    color: '#D97706', bg:'rgba(217,119,6,0.06)', border:'rgba(217,119,6,0.2)',
    context: { type:'weather', weather, mealType:'any' },
  };
  if (weather?.condition === 'rain' || weather?.condition === 'monsoon') return {
    emoji: '🌧️', badge: 'MONSOON',
    label: 'Perfect pakora weather',
    sub:   'Hot, crispy, comforting — rain demands it',
    color: '#2563EB', bg:'rgba(37,99,235,0.06)', border:'rgba(37,99,235,0.2)',
    context: { type:'weather', weather, mealType:'snack' },
  };

  // 4. Day-of-week
  if (dayCtx) {
    if (dayCtx.type === 'leftover') return {
      emoji:'♻️', label:dayCtx.label, sub:dayCtx.note,
      color:'#D97706', bg:'rgba(217,119,6,0.07)', border:'rgba(217,119,6,0.2)',
      context: { type:'leftover', mealType:'dinner' },
    };
    if (dayCtx.type === 'hosting') return {
      emoji:'🎉', label:dayCtx.label, sub:dayCtx.note,
      color:'#2563EB', bg:'rgba(37,99,235,0.07)', border:'rgba(37,99,235,0.2)',
      context: { hosting:true, servings:10, mealType:'dinner' },
    };
    if (dayCtx.type === 'planner') return {
      emoji:'📅', label:dayCtx.label, sub:dayCtx.note,
      color:'#7C3AED', bg:'rgba(124,58,237,0.07)', border:'rgba(124,58,237,0.2)',
      context: null, navTo:'/planner',
    };
    if (dayCtx.type === 'adventure') return {
      emoji:'🌍', label:dayCtx.label, sub:dayCtx.note,
      color:'#1D9E75', bg:'rgba(29,158,117,0.07)', border:'rgba(29,158,117,0.2)',
      context: { surpriseMode:true, mealType:'any' },
    };
  }

  // 5. Re-engagement — returning after 3+ days with known taste
  if (isReturning && lastFavCuisine) {
    const cuisineLabel = lastFavCuisine.replace(/_/g,' ')
      .replace(/\w/g, c => c.toUpperCase());
    return {
      emoji:'🍽️', badge:'WELCOME BACK',
      label:'Pick up where you left off',
      sub:'More ' + cuisineLabel + ' — your favourite cuisine',
      color:'#1D4ED8', bg:'rgba(29,78,216,0.06)', border:'rgba(29,78,216,0.2)',
      context: { cuisine: lastFavCuisine, mealType:'dinner' },
    };
  }

  // 6. Default — fridge (always the fallback)
  return {
    emoji:'🧊', label:"What's in my fridge?",
    sub:'Use what you have — your pantry is ready',
    color:'#FF4500', bg:'rgba(255,69,0,0.06)', border:'rgba(255,69,0,0.2)',
    context: null, isFridge: true,
  };
}

// ── Personalised picks engine — Zone 3 ─────────────────────────────
function getPersonalisedPicks({ profile, ratings }) {
  const cuisines = profile?.preferred_cuisines || [];
  const ratingCount = ratings ? Object.keys(ratings).length : 0;

  const all = [
    { id:'mood',    emoji:'😊', label:'Match my mood',   sub:'5 moods, one tap',      priority:50, modal:'mood' },
    { id:'goal',    emoji:'🎯',
      label: profile?.active_goal === 'eat_healthier' ? 'Eating healthier'
           : profile?.active_goal === 'cook_faster'   ? 'Quick meals'
           : profile?.active_goal === 'reduce_waste'  ? 'Zero waste'
           : profile?.active_goal === 'try_new_things'? 'Try something new'
           : 'My goal',
      sub: profile?.active_goal ? 'On track with your goal' : 'Plans & targets',
      priority:40, modal:'goal' },
    { id:'seasonal',emoji:'🌿', label:'In season now',    sub:'Freshest produce',      priority:35, context:{ seasonal:true, mealType:'any' } },
    { id:'family',  emoji:'👨‍👩‍👧', label:'Family meal',  sub:'Everyone covered',      priority:profile?.has_kids||profile?.family_size>2?60:20, context:{ mealType:'dinner', family:true } },
    { id:'hosting', emoji:'🎉', label:'Hosting guests',   sub:'Impress a crowd',       priority:30, context:{ hosting:true, servings:10 } },
    { id:'leftover',emoji:'♻️', label:'Leftover rescue',  sub:'Cooked too much?',      priority:new Date().getDay()===0?55:25, context:{ type:'leftover' } },
    { id:'surprise',emoji:'✨', label:'Surprise me',      sub:'Something unexpected',  priority:ratingCount>3?45:15, context:{ surpriseMode:true } },
    // Cuisine-personalised tile — shown when user has set preferred cuisines
    ...(cuisines.length > 0 ? [{
      id:'cuisine',
      emoji: cuisines[0] === 'tamil_nadu' ? '🥥'
           : cuisines[0] === 'bengali'    ? '🐟'
           : cuisines[0] === 'punjabi'    ? '🍲'
           : cuisines[0] === 'gujarati'   ? '🌿'
           : cuisines[0] === 'hyderabadi' ? '🍖'
           : '🍛',
      label: (cuisines[0].replace(/_/g,' ').replace(/\w/g,c=>c.toUpperCase())) + ' tonight',
      sub: 'Your favourite cuisine',
      priority: 70,  // High — preferred cuisine is a strong signal
      context: { cuisine: cuisines[0], mealType: 'dinner' },
    }] : []),
  ];

  // Goal-based boosts
  const goal = profile?.active_goal || '';
  if (goal === 'reduce_waste'  ) { const r = all.find(p => p.id==='leftover'); if (r) r.priority = 80; }
  if (goal === 'try_new_things') { const r = all.find(p => p.id==='surprise'); if (r) r.priority = 75; }
  if (goal === 'eat_healthier' ) { const r = all.find(p => p.id==='goal');     if (r) r.priority = 80; }
  if (goal === 'cook_faster'   ) {
    const r = all.find(p => p.id==='mood');
    if (r) { r.label = 'Quick meal'; r.sub = 'Under 20 min'; r.priority = 75;
              r.context = { mealType:'any', time:'20 min' }; delete r.modal; }
  }

  return all.sort((a, b) => b.priority - a.priority).slice(0, 3);
}


export { getFeaturedTile, getPersonalisedPicks };
