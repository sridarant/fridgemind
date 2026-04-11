// src/components/common/JourneyTiles.jsx — Sprint 2 rewrite
// 5-zone intelligent home screen:
//   Zone 1 — Smart header (greeting + streak + 7-day cooking calendar)
//   Zone 2 — Featured tile (priority: festival > sports > weather > day-of-week > time)
//   Zone 3 — Personalised picks (3 tiles ranked by profile + ratings)
//   Zone 4 — Context chip row (horizontal scroll — all secondary journeys)
//   Zone 5 — "For you" carousel (after 3+ ratings exist)

import { useState, useEffect } from 'react';
import { useNavigate }         from 'react-router-dom';
import MoodSelector            from './MoodSelector.jsx';
import OrderInSheet            from './OrderInSheet.jsx';
import GoalSheet               from './GoalSheet.jsx';
import { getUpcomingFestival, getActiveSportsEvent, getDayOfWeekContext, getCurrentSeason } from '../../lib/festival.js';
import { getUserContext }      from '../../lib/weather.js';
import RetentionNudges         from './RetentionNudges.jsx';

const C = {
  jiff:'#FF4500', jiffDark:'#CC3700', ink:'#1C0A00',
  cream:'#FFFAF5', muted:'#7C6A5E',
  border:'rgba(28,10,0,0.08)', borderMid:'rgba(28,10,0,0.15)',
};

// ── Shared UI atoms ─────────────────────────────────────────────────
function Label({ children }) {
  return (
    <div style={{ fontSize:10, letterSpacing:'2px', textTransform:'uppercase', color:C.muted, fontWeight:600, marginBottom:10, marginTop:4 }}>
      {children}
    </div>
  );
}

function Tile({ emoji, label, sub, color, bg, border, oneTap, wide, onClick }) {
  const [hov, setHov] = useState(false);
  return (
    <button onClick={onClick}
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{ gridColumn:wide?'span 2':'span 1', display:'flex', flexDirection:'column', alignItems:'flex-start', gap:6, padding:'16px 14px', background:hov?(bg||'rgba(28,10,0,0.04)'):'white', border:'1.5px solid '+(hov?(border||C.borderMid):C.border), borderRadius:16, cursor:'pointer', textAlign:'left', fontFamily:"'DM Sans',sans-serif", transform:hov?'translateY(-2px)':'none', boxShadow:hov?'0 6px 20px rgba(28,10,0,0.07)':'0 1px 3px rgba(28,10,0,0.04)', transition:'all 0.14s', position:'relative', minHeight:90 }}>
      <span style={{ fontSize:26, lineHeight:1 }}>{emoji}</span>
      <span style={{ fontSize:13, fontWeight:600, color:C.ink, lineHeight:1.3 }}>{label}</span>
      {sub && <span style={{ fontSize:11, color:C.muted, fontWeight:300, lineHeight:1.4 }}>{sub}</span>}
      {oneTap && <span style={{ position:'absolute', top:10, right:10, fontSize:8, fontWeight:700, color:color||C.jiff, background:bg||'rgba(255,69,0,0.08)', border:'1px solid '+(border||'rgba(255,69,0,0.2)'), borderRadius:5, padding:'1px 5px', letterSpacing:'0.5px' }}>1-TAP</span>}
    </button>
  );
}

// Zone 2 — large featured tile (full width, prominent)
function FeaturedTile({ emoji, label, sub, color, bg, border, badge, onClick }) {
  const [hov, setHov] = useState(false);
  return (
    <button onClick={onClick}
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{ width:'100%', display:'flex', alignItems:'center', gap:16, padding:'18px 20px', background:hov?(bg||'rgba(255,69,0,0.09)'):(bg||'rgba(255,69,0,0.06)'), border:'1.5px solid '+(border||'rgba(255,69,0,0.2)'), borderRadius:18, cursor:'pointer', fontFamily:"'DM Sans',sans-serif", textAlign:'left', transform:hov?'translateY(-2px)':'none', boxShadow:hov?'0 8px 24px rgba(28,10,0,0.10)':'0 2px 8px rgba(28,10,0,0.06)', transition:'all 0.14s', marginBottom:16, position:'relative' }}>
      {badge && <span style={{ position:'absolute', top:10, right:14, fontSize:9, fontWeight:700, color:color||C.jiff, background:'white', border:'1px solid '+(border||'rgba(255,69,0,0.2)'), borderRadius:6, padding:'2px 7px', letterSpacing:'1px' }}>{badge}</span>}
      <span style={{ fontSize:36, flexShrink:0 }}>{emoji}</span>
      <div style={{ flex:1, minWidth:0 }}>
        <div style={{ fontSize:16, fontWeight:700, color:color||C.ink, marginBottom:3 }}>{label}</div>
        {sub && <div style={{ fontSize:12, color:C.muted, fontWeight:300, lineHeight:1.5 }}>{sub}</div>}
      </div>
      <span style={{ fontSize:22, color:color||C.jiff, flexShrink:0 }}>{'→'}</span>
    </button>
  );
}

// Zone 4 — horizontal chip
function ContextChip({ emoji, label, onClick }) {
  const [hov, setHov] = useState(false);
  return (
    <button onClick={onClick}
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{ display:'inline-flex', alignItems:'center', gap:6, padding:'11px 14px', borderRadius:20, border:'1px solid '+(hov?C.borderMid:C.border), background:hov?'rgba(28,10,0,0.03)':'white', cursor:'pointer', fontFamily:"'DM Sans',sans-serif", fontSize:12, color:C.ink, whiteSpace:'nowrap', flexShrink:0, transition:'all 0.12s' }}>
      <span style={{ fontSize:14 }}>{emoji}</span>
      {label}
    </button>
  );
}

// Zone 5 — for-you card
function ForYouCard({ emoji, label, sub, onClick }) {
  return (
    <button onClick={onClick}
      style={{ minWidth:160, maxWidth:200, display:'flex', flexDirection:'column', gap:6, padding:'14px 14px', background:'white', border:'1px solid '+C.border, borderRadius:14, cursor:'pointer', fontFamily:"'DM Sans',sans-serif", textAlign:'left', flexShrink:0 }}>
      <span style={{ fontSize:22 }}>{emoji}</span>
      <span style={{ fontSize:12, fontWeight:600, color:C.ink, lineHeight:1.3 }}>{label}</span>
      {sub && <span style={{ fontSize:11, color:C.muted, fontWeight:300, lineHeight:1.4 }}>{sub}</span>}
    </button>
  );
}

// 7-day cooking calendar dots
function CookingCalendar({ mealHistory = [] }) {
  const days    = ['M','T','W','T','F','S','S'];
  const today   = new Date();
  const dow     = today.getDay(); // 0=Sun
  const monday  = new Date(today);
  monday.setDate(today.getDate() - (dow === 0 ? 6 : dow - 1));

  const weekDots = days.map((label, i) => {
    const d       = new Date(monday);
    d.setDate(monday.getDate() + i);
    const dateStr = d.toDateString();
    const isToday = d.toDateString() === today.toDateString();
    const cooked  = Array.isArray(mealHistory) && mealHistory.some(h => {
      const hd = h.rating && new Date(h.generated_at || h.created_at || '');
      return hd && hd.toDateString() === dateStr;
    });
    return { label, isToday, cooked };
  });

  const cookedCount = weekDots.filter(d => d.cooked).length;

  return (
    <div style={{ display:'flex', alignItems:'center', gap:8, marginTop:10 }}>
      <div style={{ display:'flex', gap:4 }}>
        {weekDots.map((d, i) => (
          <div key={i} style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:2 }}>
            <div style={{ width:10, height:10, borderRadius:'50%', background:d.cooked?C.jiff:d.isToday?'rgba(255,69,0,0.2)':C.border, border:d.isToday?('1.5px solid '+C.jiff):'none', transition:'all 0.2s' }} />
            <span style={{ fontSize:8, color:d.isToday?C.jiff:C.muted, fontWeight:d.isToday?600:400 }}>{d.label}</span>
          </div>
        ))}
      </div>
      {cookedCount > 0 && (
        <span style={{ fontSize:11, color:C.muted, fontWeight:300 }}>{cookedCount} of 7 days</span>
      )}
    </div>
  );
}

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
    color:C.jiff, bg:'rgba(255,69,0,0.06)', border:'rgba(255,69,0,0.2)',
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

// ── Main component ─────────────────────────────────────────────────
export function JourneyTiles({
  profile, season, streak, country,
  ratings, mealHistory,
  didYouCookNudge, weeklyDigest, welcomeBack, challenge, milestone,
  upgradeNudge, onDismissUpgrade,
  onConfirmCooked, onDismissNudge,
  onSelectFridge, onGenerateDirect, onLeftoverRescue, onWeatherGenerate,
}) {
  const navigate = useNavigate();
  const [showMood,  setShowMood]  = useState(false);
  const [showOrder, setShowOrder] = useState(false);
  const [showGoal,  setShowGoal]  = useState(false);
  const [weather,   setWeather]   = useState(null);

  const isIndia = (country || 'IN') === 'IN';
  const festival = getUpcomingFestival(profile);
  const sports   = getActiveSportsEvent();
  const dayCtx   = getDayOfWeekContext();
  const season_  = getCurrentSeason();

  useEffect(() => {
    getUserContext().then(ctx => setWeather(ctx?.weather || null)).catch(() => {});
  }, []);

  const greet = () => {
    const h    = new Date().getHours();
    const name = profile?.name?.split(' ')[0] || '';
    const base = h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
    return name ? base + ', ' + name : base;
  };

  const isReturning = !!(welcomeBack && welcomeBack.daysAway >= 3);
  const lastFavCuisine = (() => {
    if (!Array.isArray(mealHistory)) return null;
    const hit = [...mealHistory]
      .sort((a,b) => new Date(b.generated_at||0) - new Date(a.generated_at||0))
      .find(h => h.cuisine && (ratings?.[h.meal_name] >= 4));
    return hit?.cuisine || null;
  })();
  const featured = getFeaturedTile({ festival, sports, weather, dayCtx, profile, isReturning, lastFavCuisine });
  const picks    = getPersonalisedPicks({ profile, ratings, festival, sports, weather });
  const ratingCount = ratings ? Object.keys(ratings).length : 0;

  const handleFeatured = () => {
    if (featured.isFridge) { onSelectFridge?.(); return; }
    if (featured.navTo)    { navigate(featured.navTo); return; }
    if (featured.context)  { onGenerateDirect?.(featured.context); }
  };

  const handlePick = (pick) => {
    if (pick.modal === 'mood')  { setShowMood(true); return; }
    if (pick.modal === 'goal')  { setShowGoal(true); return; }
    if (pick.context)           { onGenerateDirect?.(pick.context); }
  };

  // Zone 4 chips — ordered, shown/hidden by profile
  const chips = [
    profile?.has_kids || profile?.family_size > 2
      ? { emoji:'🍱', label:"Kids' lunchbox", onClick:() => navigate('/little-chefs/lunchbox') } : null,
    { emoji:'🧑‍🍳', label:'Little Chefs',   onClick:() => navigate('/little-chefs') },
    { emoji:'✨',    label:'Sacred Kitchen', onClick:() => navigate('/sacred') },
    { emoji:'📅',   label:'Week plan',       onClick:() => navigate('/planner') },
    isIndia
      ? { emoji:'🛵', label:'Order in', onClick:() => setShowOrder(true) } : null,
  ].filter(Boolean);

  // Zone 5 "for you" cards — only shown after 3+ ratings
  const forYouCards = ratingCount >= 3 ? [
    { emoji:'⭐', label:'Based on your taste', sub:'More like what you loved', onClick:() => onGenerateDirect?.({ surpriseMode:true }) },
    season_.emoji
      ? { emoji:season_.emoji, label:'In season right now', sub:season_.label + ' · freshest picks', onClick:() => onGenerateDirect?.({ seasonal:true }) }
      : null,
    { emoji:'🔥', label:'Trending this week', sub:'Most generated in India', onClick:() => onGenerateDirect?.({ type:'trending', mealType:'any' }) },
  ].filter(Boolean) : [];

  return (
    <div style={{ maxWidth:720, margin:'0 auto', padding:'20px 16px 100px', fontFamily:"'DM Sans',sans-serif" }}>

      {/* ── Zone 1 — Smart header ─────────────────────────────────── */}
      <div style={{ marginBottom:20 }}>
        <h2 style={{ fontFamily:"'Fraunces',serif", fontSize:'clamp(20px,5vw,26px)', fontWeight:900, color:C.ink, margin:0, lineHeight:1.2 }}>
          {greet()} ⚡
        </h2>

        {/* Streak badge */}
        {streak >= 2 && (
          <div style={{ display:'inline-flex', alignItems:'center', gap:4, marginTop:8, background:'rgba(255,69,0,0.08)', border:'1px solid rgba(255,69,0,0.2)', borderRadius:20, padding:'3px 10px', fontSize:11, color:'#CC3700', fontWeight:500 }}>
            {'🔥 '}{streak}{'-day streak!'}
          </div>
        )}

        <RetentionNudges
          welcomeBack={welcomeBack}
          weeklyDigest={weeklyDigest}
          milestone={milestone}
          didYouCookNudge={didYouCookNudge}
          challenge={challenge}
          upgradeNudge={upgradeNudge}
          onDismissUpgrade={onDismissUpgrade}
          onConfirmCooked={onConfirmCooked}
          onDismissNudge={onDismissNudge}
          lastFavCuisine={(() => {
            // Find last high-rated (>=4) cuisine from mealHistory
            if (!Array.isArray(mealHistory)) return null;
            const recent = [...mealHistory]
              .sort((a,b) => new Date(b.generated_at||0) - new Date(a.generated_at||0))
              .find(h => h.cuisine && (ratings?.[h.meal_name] >= 4));
            return recent?.cuisine || null;
          })()}
        />

        {/* 7-day cooking calendar */}
        <CookingCalendar mealHistory={mealHistory} />
      </div>

      {/* ── Zone 2 — Featured tile (priority-driven) ──────────────── */}
      <FeaturedTile
        emoji={featured.emoji}
        label={featured.label}
        sub={featured.sub}
        color={featured.color}
        bg={featured.bg}
        border={featured.border}
        badge={featured.badge}
        onClick={handleFeatured}
      />

      {/* ── Zone 3 — Personalised picks (3 tiles) ────────────────── */}
      <Label>{
        ratingCount >= 3 ? 'Based on your taste' :
        picks.some(p => p.id === 'family') ? 'For your family' :
        'What you can make'
      }</Label>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:10, marginBottom:20 }}>
        {picks.map((pick, i) => (
          <Tile key={pick.id}
            emoji={pick.emoji} label={pick.label} sub={pick.sub}
            onClick={() => handlePick(pick)}
          />
        ))}
      </div>

      {/* Fridge card — always accessible even when not Zone 2 featured */}
      {!featured.isFridge && (
        <div style={{ marginBottom:20 }}>
          <button onClick={onSelectFridge}
            style={{ width:'100%', display:'flex', alignItems:'center', gap:12, padding:'12px 16px', borderRadius:12, background:'rgba(255,69,0,0.04)', border:'1px solid rgba(255,69,0,0.12)', cursor:'pointer', fontFamily:"'DM Sans',sans-serif", textAlign:'left' }}>
            <span style={{ fontSize:20 }}>🧊</span>
            <div style={{ flex:1 }}>
              <span style={{ fontSize:13, fontWeight:500, color:C.ink }}>{"What's in my fridge?"}</span>
              <span style={{ fontSize:11, color:C.muted, marginLeft:8 }}>Use what you have</span>
            </div>
            <span style={{ fontSize:13, color:C.muted }}>{'→'}</span>
          </button>
        </div>
      )}

      {/* ── Zone 4 — Context chip row (scrollable) ───────────────── */}
      <Label>{(() => {
        const h   = new Date().getHours();
        const dow = new Date().getDay();
        const goal = profile?.active_goal || '';
        if (dow === 1) return 'Plan your week';
        if (dow === 0) return 'Something for Sunday';
        if (h >= 18 && h < 22) return 'More ideas for tonight';
        if (h >= 5 && h < 11) return 'Start your morning right';
        if (goal === 'reduce_waste') return 'Use what you have';
        if (goal === 'eat_healthier') return 'More healthy options';
        if (goal === 'try_new_things') return 'Explore more cuisines';
        if (goal === 'cook_faster') return 'Quick cooking options';
        if (profile?.preferred_cuisines?.length) return 'Your other favourites';
        return 'Explore more';
      })()}</Label>
      <div style={{ display:'flex', gap:8, overflowX:'auto', paddingBottom:8, scrollbarWidth:'none', msOverflowStyle:'none', WebkitOverflowScrolling:'touch', marginBottom:20 }}>
        {chips.map((chip, i) => (
          <ContextChip key={i} emoji={chip.emoji} label={chip.label} onClick={chip.onClick} />
        ))}
      </div>

      {/* ── Zone 5 — "For you" carousel (after 3+ ratings) ─────── */}
      {forYouCards.length > 0 && (
        <>
          <Label>{'Tailored for you'}</Label>
          <div style={{ fontSize:11, color:C.muted, marginBottom:10, fontWeight:300 }}>
            {'Based on '}
            {ratingCount}
            {' recipes you\'ve rated'}
          </div>
          <div style={{ display:'flex', gap:10, overflowX:'auto', paddingBottom:8, scrollbarWidth:'none', msOverflowStyle:'none', WebkitOverflowScrolling:'touch', marginBottom:20 }}>
            {forYouCards.map((card, i) => (
              <ForYouCard key={i} emoji={card.emoji} label={card.label} sub={card.sub} onClick={card.onClick} />
            ))}
          </div>
        </>
      )}

      {/* ── Modals ──────────────────────────────────────────────── */}
      {showMood && (
        <MoodSelector
          onSelect={({ mood, context }) => { setShowMood(false); onGenerateDirect?.({ mood: mood.id, moodContext: context }); }}
          onClose={() => setShowMood(false)}
        />
      )}
      {showOrder && (
        <OrderInSheet city={profile?.city || ''} onClose={() => setShowOrder(false)} />
      )}
      {showGoal && (
        <GoalSheet
          onSelect={({ id, ...goal }) => { setShowGoal(false); onGenerateDirect?.({ goal: id, goalContext: goal }); }}
          onClose={() => setShowGoal(false)}
        />
      )}
    </div>
  );
}
