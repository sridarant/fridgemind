// src/components/common/JourneyTiles.jsx
// 5-zone intelligent home screen.
// Zone 5 redesign: 1 prominent primary card + 2 compact alternate rows.
// Primary card surfaces meal name, time, effort, and a multi-signal "why".
// Alternates are visually subordinate — small, no-clutter rows.

import { useState, useEffect, useRef } from 'react';
import { useNavigate }         from 'react-router-dom';
import MoodSelector            from './MoodSelector.jsx';
import OrderInSheet            from './OrderInSheet.jsx';
import GoalSheet               from './GoalSheet.jsx';
import { getUpcomingFestival, getActiveSportsEvent, getDayOfWeekContext, getCurrentSeason } from '../../lib/festival.js';
import { getUserContext }      from '../../lib/weather.js';
import RetentionNudges         from './RetentionNudges.jsx';
import { getFeaturedTile, getPersonalisedPicks, getScoredForYouCards } from './journeyTileEngines.js';
import { logFeedback, syncBehaviourToProfile } from '../../services/feedbackService.js';
import { markAsShown } from '../../services/recommendationService.js';

const C = {
  jiff:'#FF4500', jiffDark:'#CC3700', ink:'#1C0A00',
  cream:'#FFFAF5', muted:'#7C6A5E',
  border:'rgba(28,10,0,0.08)', borderMid:'rgba(28,10,0,0.15)',
  softOrange:'rgba(255,69,0,0.06)', softOrangeMid:'rgba(255,69,0,0.10)',
};

// ── Shared UI atoms ──────────────────────────────────────────────────
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

// ── Zone 5: Primary "For You" card ────────────────────────────────
// Full-width prominent card. Shows meal name, time, multi-signal why.
// why = { headline, bullet2, effortLabel, effortMins }
function PrimaryForYouCard({ emoji, label, effortMins, tags, why, onCook, onNotForMe }) {
  const [hov,       setHov]       = useState(false);
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  const isQuick = effortMins <= 15;

  return (
    <div style={{ marginBottom:12, position:'relative' }}>
      {/* Card */}
      <div
        onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
        style={{
          background:  hov ? C.softOrangeMid : C.softOrange,
          border:      '1.5px solid ' + (hov ? 'rgba(255,69,0,0.30)' : 'rgba(255,69,0,0.18)'),
          borderRadius: 18,
          padding:     '18px 18px 14px',
          transition:  'all 0.14s',
          boxShadow:   hov ? '0 6px 22px rgba(255,69,0,0.10)' : '0 2px 8px rgba(28,10,0,0.05)',
          position:    'relative',
        }}>

        {/* Badge row */}
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:12 }}>
          <span style={{ fontSize:9, fontWeight:700, color:C.jiff, background:'rgba(255,69,0,0.10)', border:'1px solid rgba(255,69,0,0.22)', borderRadius:6, padding:'2px 8px', letterSpacing:'1px' }}>
            TOP PICK FOR YOU
          </span>
          {/* Dismiss — tiny, unobtrusive */}
          <button
            onClick={() => { setDismissed(true); onNotForMe && onNotForMe(); }}
            title="Not for me"
            style={{ background:'none', border:'none', cursor:'pointer', color:C.muted, fontSize:13, padding:'0 2px', lineHeight:1, opacity:0.6 }}>
            ✕
          </button>
        </div>

        {/* Meal identity */}
        <div style={{ display:'flex', alignItems:'flex-start', gap:14, marginBottom:14, cursor:'pointer' }} onClick={onCook}>
          <span style={{ fontSize:38, lineHeight:1, flexShrink:0 }}>{emoji}</span>
          <div style={{ flex:1, minWidth:0 }}>
            <div style={{ fontFamily:"'Fraunces',serif", fontSize:20, fontWeight:900, color:C.ink, lineHeight:1.2, marginBottom:5 }}>
              {label}
            </div>
            {/* Time + effort pill row */}
            <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
              <span style={{ fontSize:11, fontWeight:600, color: isQuick ? '#1D9E75' : C.jiff, background: isQuick ? 'rgba(29,158,117,0.09)' : 'rgba(255,69,0,0.08)', border:'1px solid ' + (isQuick ? 'rgba(29,158,117,0.22)' : 'rgba(255,69,0,0.20)'), borderRadius:20, padding:'2px 10px' }}>
                {'⏱ '}{effortMins}{' min'}
              </span>
              <span style={{ fontSize:11, fontWeight:400, color:C.muted, background:'rgba(28,10,0,0.04)', border:'1px solid rgba(28,10,0,0.07)', borderRadius:20, padding:'2px 10px' }}>
                {why && why.effortLabel ? why.effortLabel : (isQuick ? 'Quick' : 'Medium effort')}
              </span>
            </div>
          </div>
        </div>

        {/* Why block — the confidence section */}
        {why && why.headline && (
          <div style={{ borderTop:'1px solid rgba(255,69,0,0.12)', paddingTop:11, marginBottom:14 }}>
            {/* Headline — primary signal, bold */}
            <div style={{ fontSize:12, fontWeight:700, color:C.ink, lineHeight:1.45, marginBottom: why.bullet2 ? 5 : 0 }}>
              {'✦ '}{why.headline}
            </div>
            {/* Bullet 2 — secondary signal, muted */}
            {why.bullet2 && (
              <div style={{ fontSize:11, fontWeight:400, color:C.muted, lineHeight:1.4 }}>
                {'· '}{why.bullet2}
              </div>
            )}
          </div>
        )}

        {/* CTA */}
        <button onClick={onCook}
          style={{ width:'100%', padding:'11px', borderRadius:12, background:C.jiff, color:'white', border:'none', fontSize:13, fontWeight:700, cursor:'pointer', fontFamily:"'DM Sans',sans-serif", letterSpacing:'0.2px' }}>
          {'Cook this →'}
        </button>
      </div>
    </div>
  );
}

// ── Zone 5: Alternate "For You" row ──────────────────────────────
// Compact, visually secondary. Two alternate slots shown below primary.
function AlternateForYouCard({ emoji, label, effortMins, why, onCook, onNotForMe, index }) {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  const whyText = why && why.headline ? why.headline : null;

  return (
    <div style={{
      display:'flex', alignItems:'center', gap:12,
      padding:'11px 14px',
      background:'white',
      border:'1px solid ' + C.border,
      borderRadius:12,
      marginBottom:8,
      fontFamily:"'DM Sans',sans-serif",
    }}>
      <span style={{ fontSize:22, flexShrink:0 }}>{emoji}</span>
      <div style={{ flex:1, minWidth:0 }}>
        <div style={{ fontSize:13, fontWeight:600, color:C.ink, lineHeight:1.3 }}>{label}</div>
        <div style={{ fontSize:10, color:C.muted, marginTop:2, lineHeight:1.4 }}>
          {effortMins + ' min'}
          {whyText ? ' · ' + whyText : ''}
        </div>
      </div>
      <div style={{ display:'flex', gap:6, flexShrink:0 }}>
        <button onClick={onCook}
          style={{ padding:'6px 12px', borderRadius:8, border:'1px solid rgba(255,69,0,0.25)', background:'rgba(255,69,0,0.05)', color:C.jiff, fontSize:11, fontWeight:600, cursor:'pointer', fontFamily:"'DM Sans',sans-serif", whiteSpace:'nowrap' }}>
          {'Cook →'}
        </button>
        <button
          onClick={() => { setDismissed(true); onNotForMe && onNotForMe(); }}
          title="Not for me"
          style={{ padding:'6px 8px', borderRadius:8, border:'1px solid rgba(28,10,0,0.08)', background:'white', color:C.muted, fontSize:11, cursor:'pointer', fontFamily:"'DM Sans',sans-serif", lineHeight:1 }}>
          {'✕'}
        </button>
      </div>
    </div>
  );
}

// 7-day cooking calendar dots
function CookingCalendar({ mealHistory = [] }) {
  const days   = ['M','T','W','T','F','S','S'];
  const today  = new Date();
  const dow    = today.getDay();
  const monday = new Date(today);
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

// ── Main component ─────────────────────────────────────────────────
export function JourneyTiles({
  profile, season, streak, country,
  ratings, mealHistory,
  didYouCookNudge, weeklyDigest, welcomeBack, challenge, milestone,
  upgradeNudge, onDismissUpgrade,
  onConfirmCooked, onDismissNudge,
  onSelectFridge, onGenerateDirect, onLeftoverRescue, onWeatherGenerate,
  user,
}) {
  const navigate    = useNavigate();
  const [showMood,  setShowMood]  = useState(false);
  const [showOrder, setShowOrder] = useState(false);
  const [showGoal,  setShowGoal]  = useState(false);
  const [weather,   setWeather]   = useState(null);

  const acceptedPrimaryRef = useRef(false);
  const feedbackCountRef   = useRef(0);

  const isIndia  = (country || 'IN') === 'IN';
  const festival = getUpcomingFestival(profile);
  const sports   = getActiveSportsEvent();
  const dayCtx   = getDayOfWeekContext();
  const season_  = getCurrentSeason();

  useEffect(() => {
    getUserContext().then(ctx => setWeather(ctx ? (ctx.weather || null) : null)).catch(() => {});
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const syncBehaviour = () => {
    feedbackCountRef.current += 1;
    if (feedbackCountRef.current >= 5 && user && user.id) {
      feedbackCountRef.current = 0;
      syncBehaviourToProfile(user.id);
    }
  };

  const greet = () => {
    const h    = new Date().getHours();
    const name = profile && profile.name ? profile.name.split(' ')[0] : '';
    const base = h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
    return name ? base + ', ' + name : base;
  };

  const isReturning    = !!(welcomeBack && welcomeBack.daysAway >= 3);
  const lastFavCuisine = (() => {
    if (!Array.isArray(mealHistory)) return null;
    const hit = [...mealHistory]
      .sort((a,b) => new Date(b.generated_at||0) - new Date(a.generated_at||0))
      .find(h => h.cuisine && (ratings && ratings[h.meal_name] >= 4));
    return hit ? (hit.cuisine || null) : null;
  })();

  const featured    = getFeaturedTile({ festival, sports, weather, dayCtx, profile, isReturning, lastFavCuisine });
  const picks       = getPersonalisedPicks({ profile, ratings });
  const ratingCount = ratings ? Object.keys(ratings).length : 0;

  const handleFeatured = () => {
    if (featured.isFridge) { onSelectFridge && onSelectFridge(); return; }
    if (featured.navTo)    { navigate(featured.navTo); return; }
    if (featured.context)  { onGenerateDirect && onGenerateDirect(featured.context); }
  };

  const handlePick = (pick) => {
    if (pick.modal === 'mood') { setShowMood(true); return; }
    if (pick.modal === 'goal') { setShowGoal(true); return; }
    if (pick.context)          { onGenerateDirect && onGenerateDirect(pick.context); }
  };

  const chips = [
    profile && (profile.has_kids || profile.family_size > 2)
      ? { emoji:'🍱', label:"Kids' lunchbox", onClick:() => navigate('/little-chefs/lunchbox') } : null,
    { emoji:'🧑‍🍳', label:'Little Chefs',   onClick:() => navigate('/little-chefs') },
    { emoji:'✨',    label:'Sacred Kitchen', onClick:() => navigate('/sacred') },
    { emoji:'📅',   label:'Week plan',       onClick:() => navigate('/planner') },
    isIndia ? { emoji:'🛵', label:'Order in', onClick:() => setShowOrder(true) } : null,
  ].filter(Boolean);

  // Zone 5 — scored For You cards
  const hasPersonalisationData = ratingCount >= 1 ||
    (profile && (profile.preferred_cuisines || []).length > 0) ||
    (profile && profile.active_goal);

  const forYouCards = hasPersonalisationData
    ? getScoredForYouCards({ profile, ratings, mealHistory })
    : [];

  const primaryCard   = forYouCards.find(c => c.role === 'primary') || null;
  const alternates    = forYouCards.filter(c => c.role === 'alternate');

  useEffect(() => {
    if (forYouCards.length > 0) markAsShown(forYouCards.map(c => c.label));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleCook = (card, position) => {
    const action = (position > 0 && acceptedPrimaryRef.current) ? 'swapped' : 'accepted';
    if (position === 0) acceptedPrimaryRef.current = true;
    logFeedback({ meal: card.meal, action, userId: user ? user.id : null, position });
    syncBehaviour();
    onGenerateDirect && onGenerateDirect(card.context);
  };

  const handleNotForMe = (card, position) => {
    logFeedback({ meal: card.meal, action: 'rejected', userId: user ? user.id : null, position });
    syncBehaviour();
  };

  // Section label for Zone 5 — specific and confident
  const forYouLabel = (() => {
    if (ratingCount >= 3) return 'Based on what you love';
    if (ratingCount >= 1) return 'Because you liked that last one';
    if (profile && (profile.preferred_cuisines || []).length > 0) return 'From your cuisines';
    return 'Picked for you';
  })();

  return (
    <div style={{ maxWidth:720, margin:'0 auto', padding:'20px 16px 100px', fontFamily:"'DM Sans',sans-serif" }}>

      {/* §1 HEADER */}
      <div style={{ marginBottom:20 }}>
        <h2 style={{ fontFamily:"'Fraunces',serif", fontSize:'clamp(20px,5vw,26px)', fontWeight:900, color:C.ink, margin:0, lineHeight:1.2 }}>
          {greet()} ⚡
        </h2>

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
          lastFavCuisine={lastFavCuisine}
        />

        <CookingCalendar mealHistory={mealHistory} />
      </div>

      {/* §2 CONTEXT CARD — Zone 2 */}
      <FeaturedTile
        emoji={featured.emoji} label={featured.label} sub={featured.sub}
        color={featured.color} bg={featured.bg} border={featured.border}
        badge={featured.badge} onClick={handleFeatured}
      />

      {/* §3 QUICK DECIDE — Zone 3 */}
      <Label>{
        ratingCount >= 3 ? 'Based on your taste' :
        picks.some(p => p.id === 'family') ? 'For your family' :
        'What you can make'
      }</Label>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:10, marginBottom:20 }}>
        {picks.map((pick) => (
          <Tile key={pick.id}
            emoji={pick.emoji} label={pick.label} sub={pick.sub}
            onClick={() => handlePick(pick)}
          />
        ))}
      </div>

      {/* §4 FRIDGE CTA */}
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

      {/* §5 PLAN AHEAD — Zone 4 chips */}
      <Label>{(() => {
        const h    = new Date().getHours();
        const dow  = new Date().getDay();
        const goal = profile ? (profile.active_goal || '') : '';
        if (dow === 1) return 'Plan your week';
        if (dow === 0) return 'Something for Sunday';
        if (h >= 18 && h < 22) return 'More ideas for tonight';
        if (h >= 5  && h < 11) return 'Start your morning right';
        if (goal === 'reduce_waste')   return 'Use what you have';
        if (goal === 'eat_healthier')  return 'More healthy options';
        if (goal === 'try_new_things') return 'Explore more cuisines';
        if (goal === 'cook_faster')    return 'Quick cooking options';
        if (profile && (profile.preferred_cuisines || []).length) return 'Your other favourites';
        return 'Explore more';
      })()}</Label>
      <div style={{ display:'flex', gap:8, overflowX:'auto', paddingBottom:8, scrollbarWidth:'none', msOverflowStyle:'none', WebkitOverflowScrolling:'touch', marginBottom:20 }}>
        {chips.map((chip, i) => (
          <ContextChip key={i} emoji={chip.emoji} label={chip.label} onClick={chip.onClick} />
        ))}
      </div>

      {/* §6 FOR YOU — Zone 5 */}
      {(primaryCard || alternates.length > 0) && (
        <>
          <Label>{forYouLabel}</Label>

          {/* Primary: full-width, prominent */}
          {primaryCard && (
            <PrimaryForYouCard
              emoji={primaryCard.emoji}
              label={primaryCard.label}
              effortMins={primaryCard.effortMins}
              tags={primaryCard.tags || []}
              why={primaryCard.why}
              onCook={() => handleCook(primaryCard, 0)}
              onNotForMe={() => handleNotForMe(primaryCard, 0)}
            />
          )}

          {/* Alternates: compact rows, visually secondary */}
          {alternates.length > 0 && (
            <div style={{ marginBottom:20 }}>
              {alternates.map((card, i) => (
                <AlternateForYouCard
                  key={card.label + i}
                  emoji={card.emoji}
                  label={card.label}
                  effortMins={card.effortMins}
                  why={card.why}
                  index={i}
                  onCook={() => handleCook(card, i + 1)}
                  onNotForMe={() => handleNotForMe(card, i + 1)}
                />
              ))}
            </div>
          )}
        </>
      )}

      {/* Modals */}
      {showMood && (
        <MoodSelector
          onSelect={({ mood, context }) => { setShowMood(false); onGenerateDirect && onGenerateDirect({ mood: mood.id, moodContext: context }); }}
          onClose={() => setShowMood(false)}
        />
      )}
      {showOrder && (
        <OrderInSheet city={profile ? (profile.city || '') : ''} onClose={() => setShowOrder(false)} />
      )}
      {showGoal && (
        <GoalSheet
          onSelect={({ id, ...goal }) => { setShowGoal(false); onGenerateDirect && onGenerateDirect({ goal: id, goalContext: goal }); }}
          onClose={() => setShowGoal(false)}
        />
      )}
    </div>
  );
}
