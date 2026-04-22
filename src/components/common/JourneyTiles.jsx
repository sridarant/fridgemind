// src/components/common/JourneyTiles.jsx
// Decision-first home screen.
//
// NEW LAYOUT ORDER (top → bottom):
//   §1  Greeting (simple, one line + streak)
//   §2  Retention nudge (one nudge max, inline)
//   §3  PRIMARY RECOMMENDATION (dominates screen)
//   §4  ALTERNATES (2 compact rows, visually subordinate)
//   §5  Refine row (mood / fridge / surprise)
//   §6  Context tile (festival / sports / weather — below fold)
//   §7  Explore chips (collapsed, below fold)
//
// Everything that competed with the primary decision is moved below it.
// The primary card is the first substantial element after the greeting.

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
  border:'rgba(28,10,0,0.08)', borderMid:'rgba(28,10,0,0.14)',
  softOrange:'rgba(255,69,0,0.055)', softOrangeMid:'rgba(255,69,0,0.09)',
};

// ── Tiny label ────────────────────────────────────────────────────
function SectionLabel({ children, style }) {
  return (
    <div style={{ fontSize:10, letterSpacing:'2px', textTransform:'uppercase', color:C.muted, fontWeight:600, marginBottom:10, marginTop:4, ...style }}>
      {children}
    </div>
  );
}

// ── §3 Primary recommendation card ───────────────────────────────
// Dominates the viewport. Shows meal, time, and a confident multi-signal why.
// why = { headline, bullet2, effortLabel, effortMins }
function PrimaryCard({ emoji, label, effortMins, tags, why, onCook, onNotForMe }) {
  const [hov,       setHov]       = useState(false);
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  const isQuick = effortMins <= 15;

  return (
    <div style={{ marginBottom:16 }}>
      <div
        onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
        style={{
          background:   hov ? C.softOrangeMid : C.softOrange,
          border:      '1.5px solid ' + (hov ? 'rgba(255,69,0,0.28)' : 'rgba(255,69,0,0.16)'),
          borderRadius: 20,
          padding:     '20px 18px 16px',
          transition:  'all 0.13s',
          boxShadow:   hov ? '0 6px 24px rgba(255,69,0,0.11)' : '0 2px 10px rgba(28,10,0,0.05)',
          position:    'relative',
        }}>

        {/* Top row: badge + dismiss */}
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:14 }}>
          <span style={{ fontSize:9, fontWeight:700, color:C.jiff, background:'rgba(255,69,0,0.09)', border:'1px solid rgba(255,69,0,0.20)', borderRadius:6, padding:'2px 8px', letterSpacing:'1px' }}>
            TOP PICK FOR YOU
          </span>
          <button
            onClick={() => { setDismissed(true); onNotForMe && onNotForMe(); }}
            title="Not for me"
            style={{ background:'none', border:'none', cursor:'pointer', color:C.muted, fontSize:14, padding:'2px 4px', lineHeight:1, opacity:0.55 }}>
            ✕
          </button>
        </div>

        {/* Meal identity — clickable area */}
        <div style={{ display:'flex', alignItems:'flex-start', gap:14, marginBottom:14, cursor:'pointer' }} onClick={onCook}>
          <span style={{ fontSize:42, lineHeight:1, flexShrink:0 }}>{emoji}</span>
          <div style={{ flex:1, minWidth:0 }}>
            <div style={{ fontFamily:"'Fraunces',serif", fontSize:22, fontWeight:900, color:C.ink, lineHeight:1.15, marginBottom:8 }}>
              {label}
            </div>
            {/* Time + effort pills */}
            <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
              <span style={{ fontSize:11, fontWeight:700, color: isQuick ? '#1D9E75' : C.jiff, background: isQuick ? 'rgba(29,158,117,0.09)' : 'rgba(255,69,0,0.08)', border:'1px solid ' + (isQuick ? 'rgba(29,158,117,0.22)' : 'rgba(255,69,0,0.20)'), borderRadius:20, padding:'3px 10px' }}>
                {'⏱ '}{effortMins}{' min'}
              </span>
              <span style={{ fontSize:11, color:C.muted, background:'rgba(28,10,0,0.04)', border:'1px solid rgba(28,10,0,0.07)', borderRadius:20, padding:'3px 10px' }}>
                {why && why.effortLabel ? why.effortLabel : (isQuick ? 'Quick' : 'Medium effort')}
              </span>
            </div>
          </div>
        </div>

        {/* Why block — the confidence signal */}
        {why && why.headline && (
          <div style={{ borderTop:'1px solid rgba(255,69,0,0.11)', paddingTop:12, marginBottom:14 }}>
            <div style={{ fontSize:12, fontWeight:700, color:C.ink, lineHeight:1.5 }}>
              {'✦ '}{why.headline}
            </div>
            {why.bullet2 && (
              <div style={{ fontSize:11, color:C.muted, fontWeight:400, lineHeight:1.45, marginTop:3 }}>
                {'· '}{why.bullet2}
              </div>
            )}
          </div>
        )}

        {/* CTA */}
        <button onClick={onCook}
          style={{ width:'100%', padding:'12px', borderRadius:13, background:C.jiff, color:'white', border:'none', fontSize:14, fontWeight:700, cursor:'pointer', fontFamily:"'DM Sans',sans-serif", letterSpacing:'0.2px', transition:'background 0.12s' }}
          onMouseEnter={e => { e.currentTarget.style.background = C.jiffDark; }}
          onMouseLeave={e => { e.currentTarget.style.background = C.jiff; }}>
          {'Cook this →'}
        </button>
      </div>
    </div>
  );
}

// ── §4 Alternate row ──────────────────────────────────────────────
// Compact, no strong CTA, visually secondary. Differs cuisine or effort from primary.
function AlternateRow({ emoji, label, effortMins, why, onCook, onNotForMe }) {
  const [dismissed, setDismissed] = useState(false);
  if (dismissed) return null;

  const whyText = why && why.headline ? why.headline.split(' • ')[0] : null;

  return (
    <div style={{ display:'flex', alignItems:'center', gap:12, padding:'10px 13px', background:'white', border:'1px solid '+C.border, borderRadius:12, marginBottom:8 }}>
      <span style={{ fontSize:22, flexShrink:0 }}>{emoji}</span>
      <div style={{ flex:1, minWidth:0 }}>
        <div style={{ fontSize:13, fontWeight:600, color:C.ink, lineHeight:1.3 }}>{label}</div>
        <div style={{ fontSize:10, color:C.muted, marginTop:2, lineHeight:1.35, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
          {effortMins + ' min'}{whyText ? ' · ' + whyText : ''}
        </div>
      </div>
      <div style={{ display:'flex', gap:6, flexShrink:0 }}>
        <button onClick={onCook}
          style={{ padding:'6px 12px', borderRadius:8, border:'1px solid rgba(255,69,0,0.22)', background:'rgba(255,69,0,0.04)', color:C.jiff, fontSize:11, fontWeight:600, cursor:'pointer', fontFamily:"'DM Sans',sans-serif", whiteSpace:'nowrap' }}>
          {'Cook →'}
        </button>
        <button onClick={() => { setDismissed(true); onNotForMe && onNotForMe(); }} title="Not for me"
          style={{ padding:'6px 8px', borderRadius:8, border:'1px solid rgba(28,10,0,0.08)', background:'white', color:C.muted, fontSize:11, cursor:'pointer', fontFamily:"'DM Sans',sans-serif", lineHeight:1 }}>
          {'✕'}
        </button>
      </div>
    </div>
  );
}

// ── §5 Refine row: three quick-escape options ─────────────────────
function RefineRow({ onMood, onFridge, onSurprise }) {
  return (
    <div style={{ display:'flex', gap:8, marginBottom:24 }}>
      {[
        { label:'Match mood', emoji:'😊', onClick: onMood },
        { label:'My fridge',  emoji:'🧊', onClick: onFridge },
        { label:'Surprise me',emoji:'✨', onClick: onSurprise },
      ].map(btn => (
        <button key={btn.label} onClick={btn.onClick}
          style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:4, padding:'10px 6px', borderRadius:12, border:'1px solid '+C.border, background:'white', cursor:'pointer', fontFamily:"'DM Sans',sans-serif", transition:'all 0.12s' }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(28,10,0,0.03)'; e.currentTarget.style.borderColor = C.borderMid; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'white'; e.currentTarget.style.borderColor = C.border; }}>
          <span style={{ fontSize:18 }}>{btn.emoji}</span>
          <span style={{ fontSize:10, fontWeight:600, color:C.muted, letterSpacing:'0.3px' }}>{btn.label}</span>
        </button>
      ))}
    </div>
  );
}

// ── §6 Context tile (festival / sports / weather) ─────────────────
function ContextTile({ emoji, label, sub, color, bg, border, badge, onClick }) {
  const [hov, setHov] = useState(false);
  return (
    <button onClick={onClick}
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{ width:'100%', display:'flex', alignItems:'center', gap:14, padding:'15px 18px', background:hov?(bg||'rgba(255,69,0,0.09)'):(bg||'rgba(255,69,0,0.05)'), border:'1.5px solid '+(border||'rgba(255,69,0,0.18)'), borderRadius:16, cursor:'pointer', fontFamily:"'DM Sans',sans-serif", textAlign:'left', transition:'all 0.13s', marginBottom:16, position:'relative' }}>
      {badge && <span style={{ position:'absolute', top:9, right:12, fontSize:8, fontWeight:700, color:color||C.jiff, background:'white', border:'1px solid '+(border||'rgba(255,69,0,0.2)'), borderRadius:5, padding:'2px 6px', letterSpacing:'1px' }}>{badge}</span>}
      <span style={{ fontSize:30, flexShrink:0 }}>{emoji}</span>
      <div style={{ flex:1, minWidth:0 }}>
        <div style={{ fontSize:14, fontWeight:700, color:color||C.ink, marginBottom:2 }}>{label}</div>
        {sub && <div style={{ fontSize:11, color:C.muted, fontWeight:300, lineHeight:1.4 }}>{sub}</div>}
      </div>
      <span style={{ fontSize:18, color:color||C.jiff, flexShrink:0 }}>{'→'}</span>
    </button>
  );
}

// ── §7 Explore chips ──────────────────────────────────────────────
function ExploreChip({ emoji, label, onClick }) {
  const [hov, setHov] = useState(false);
  return (
    <button onClick={onClick}
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{ display:'inline-flex', alignItems:'center', gap:6, padding:'9px 13px', borderRadius:20, border:'1px solid '+(hov?C.borderMid:C.border), background:hov?'rgba(28,10,0,0.025)':'white', cursor:'pointer', fontFamily:"'DM Sans',sans-serif", fontSize:12, color:C.ink, whiteSpace:'nowrap', flexShrink:0, transition:'all 0.11s' }}>
      <span style={{ fontSize:13 }}>{emoji}</span>{label}
    </button>
  );
}

// ── 7-day cooking calendar dots ───────────────────────────────────
function CookingCalendar({ mealHistory = [] }) {
  const days   = ['M','T','W','T','F','S','S'];
  const today  = new Date();
  const dow    = today.getDay();
  const monday = new Date(today);
  monday.setDate(today.getDate() - (dow === 0 ? 6 : dow - 1));

  const weekDots = days.map((label, i) => {
    const d       = new Date(monday);
    d.setDate(monday.getDate() + i);
    const isToday = d.toDateString() === today.toDateString();
    const cooked  = Array.isArray(mealHistory) && mealHistory.some(h => {
      const hd = h.rating && new Date(h.generated_at || h.created_at || '');
      return hd && hd.toDateString() === d.toDateString();
    });
    return { label, isToday, cooked };
  });

  const cookedCount = weekDots.filter(d => d.cooked).length;
  return (
    <div style={{ display:'flex', alignItems:'center', gap:8, marginTop:8, marginBottom:20 }}>
      <div style={{ display:'flex', gap:4 }}>
        {weekDots.map((d, i) => (
          <div key={i} style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:2 }}>
            <div style={{ width:9, height:9, borderRadius:'50%', background:d.cooked?C.jiff:d.isToday?'rgba(255,69,0,0.2)':C.border, border:d.isToday?'1.5px solid '+C.jiff:'none', transition:'all 0.18s' }} />
            <span style={{ fontSize:7, color:d.isToday?C.jiff:C.muted, fontWeight:d.isToday?600:400 }}>{d.label}</span>
          </div>
        ))}
      </div>
      {cookedCount > 0 && (
        <span style={{ fontSize:10, color:C.muted, fontWeight:300 }}>{cookedCount} of 7 days</span>
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
  const navigate          = useNavigate();
  const [showMood,        setShowMood]        = useState(false);
  const [showOrder,       setShowOrder]       = useState(false);
  const [showGoal,        setShowGoal]        = useState(false);
  const [showExplore,     setShowExplore]     = useState(false);
  const [weather,         setWeather]         = useState(null);
  const acceptedPrimaryRef = useRef(false);
  const feedbackCountRef   = useRef(0);

  const isIndia   = (country || 'IN') === 'IN';
  const festival  = getUpcomingFestival(profile);
  const sports    = getActiveSportsEvent();
  const dayCtx    = getDayOfWeekContext();
  const season_   = getCurrentSeason();

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

  const readyLine = () => {
    const h = new Date().getHours();
    if (h >= 5  && h < 11) return 'Ready for breakfast?';
    if (h >= 11 && h < 16) return 'Ready for lunch?';
    if (h >= 16 && h < 19) return 'Snack time?';
    return 'Ready for dinner?';
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
  const ratingCount = ratings ? Object.keys(ratings).length : 0;

  const handleFeatured = () => {
    if (featured.isFridge) { onSelectFridge && onSelectFridge(); return; }
    if (featured.navTo)    { navigate(featured.navTo); return; }
    if (featured.context)  { onGenerateDirect && onGenerateDirect(featured.context); }
  };

  // Zone 5 decision cards
  const hasSignal = ratingCount >= 1 ||
    (profile && (profile.preferred_cuisines || []).length > 0) ||
    (profile && profile.active_goal);

  const forYouCards = hasSignal
    ? getScoredForYouCards({ profile, ratings, mealHistory })
    : [];

  const primaryCard = forYouCards.find(c => c.role === 'primary') || null;
  const alternates  = forYouCards.filter(c => c.role === 'alternate');

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

  // Explore chips (below fold)
  const exploreChips = [
    profile && (profile.has_kids || profile.family_size > 2)
      ? { emoji:'🍱', label:"Kids' lunchbox", onClick:() => navigate('/little-chefs/lunchbox') } : null,
    { emoji:'🧑‍🍳', label:'Little Chefs',   onClick:() => navigate('/little-chefs') },
    { emoji:'✨',    label:'Sacred Kitchen', onClick:() => navigate('/sacred') },
    { emoji:'📅',   label:'Week plan',       onClick:() => navigate('/planner') },
    isIndia ? { emoji:'🛵', label:'Order in', onClick:() => setShowOrder(true) } : null,
  ].filter(Boolean);

  // Decision-section label
  const decisionLabel = (() => {
    if (ratingCount >= 3) return 'Based on what you love';
    if (ratingCount >= 1) return 'Because you liked that last one';
    if (profile && (profile.preferred_cuisines || []).length > 0) return 'From your cuisines';
    return 'Picked for you';
  })();

  return (
    <div style={{ maxWidth:680, margin:'0 auto', padding:'16px 16px 100px', fontFamily:"'DM Sans',sans-serif" }}>

      {/* §1 GREETING — simple, one line */}
      <div style={{ marginBottom:4 }}>
        <h2 style={{ fontFamily:"'Fraunces',serif", fontSize:'clamp(19px,5vw,24px)', fontWeight:900, color:C.ink, margin:0, lineHeight:1.2 }}>
          {greet()} ⚡
        </h2>
        <div style={{ fontSize:13, color:C.muted, fontWeight:300, marginTop:3, marginBottom:6 }}>
          {readyLine()}
        </div>

        {streak >= 2 && (
          <div style={{ display:'inline-flex', alignItems:'center', gap:4, background:'rgba(255,69,0,0.07)', border:'1px solid rgba(255,69,0,0.18)', borderRadius:20, padding:'2px 10px', fontSize:10, color:'#CC3700', fontWeight:600, marginBottom:4 }}>
            {'🔥 '}{streak}{'-day streak!'}
          </div>
        )}
      </div>

      {/* §2 RETENTION NUDGE (one max, inline — does not push primary down much) */}
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

      {/* §3 PRIMARY RECOMMENDATION */}
      {primaryCard ? (
        <>
          <SectionLabel>{decisionLabel}</SectionLabel>
          <PrimaryCard
            emoji={primaryCard.emoji}
            label={primaryCard.label}
            effortMins={primaryCard.effortMins}
            tags={primaryCard.tags || []}
            why={primaryCard.why}
            onCook={() => handleCook(primaryCard, 0)}
            onNotForMe={() => handleNotForMe(primaryCard, 0)}
          />
        </>
      ) : (
        /* Fallback when no personalisation data: fridge CTA as the hero */
        <div style={{ marginBottom:16 }}>
          <button onClick={onSelectFridge}
            style={{ width:'100%', display:'flex', alignItems:'center', gap:14, padding:'20px 18px', borderRadius:18, background:'rgba(255,69,0,0.055)', border:'1.5px solid rgba(255,69,0,0.16)', cursor:'pointer', fontFamily:"'DM Sans',sans-serif", textAlign:'left' }}>
            <span style={{ fontSize:36 }}>🧊</span>
            <div style={{ flex:1 }}>
              <div style={{ fontSize:16, fontWeight:700, color:C.ink, marginBottom:4, fontFamily:"'Fraunces',serif" }}>{"What's in my fridge?"}</div>
              <div style={{ fontSize:12, color:C.muted, fontWeight:300 }}>Tell me what you have — get a meal in 10 seconds</div>
            </div>
            <span style={{ fontSize:20, color:C.jiff }}>{'→'}</span>
          </button>
        </div>
      )}

      {/* §4 ALTERNATES — compact rows, visually secondary */}
      {alternates.length > 0 && (
        <div style={{ marginBottom:16 }}>
          <SectionLabel>{'Or try instead'}</SectionLabel>
          {alternates.map((card, i) => (
            <AlternateRow
              key={card.label + i}
              emoji={card.emoji}
              label={card.label}
              effortMins={card.effortMins}
              why={card.why}
              onCook={() => handleCook(card, i + 1)}
              onNotForMe={() => handleNotForMe(card, i + 1)}
            />
          ))}
        </div>
      )}

      {/* §5 REFINE ROW — mood / fridge / surprise */}
      <RefineRow
        onMood={()    => setShowMood(true)}
        onFridge={()  => onSelectFridge && onSelectFridge()}
        onSurprise={()=> onGenerateDirect && onGenerateDirect({ surpriseMode:true })}
      />

      {/* §6 CONTEXT TILE (festival / sports / weather) — below fold */}
      {!featured.isFridge && (
        <ContextTile
          emoji={featured.emoji} label={featured.label} sub={featured.sub}
          color={featured.color} bg={featured.bg} border={featured.border}
          badge={featured.badge} onClick={handleFeatured}
        />
      )}

      {/* 7-day calendar — below fold */}
      <CookingCalendar mealHistory={mealHistory} />

      {/* §7 EXPLORE CHIPS — collapsed by default */}
      <div style={{ marginBottom:8 }}>
        <button onClick={() => setShowExplore(v => !v)}
          style={{ display:'flex', alignItems:'center', gap:6, background:'none', border:'none', cursor:'pointer', fontSize:11, color:C.muted, fontFamily:"'DM Sans',sans-serif", fontWeight:500, padding:'4px 0', letterSpacing:'0.5px' }}>
          {showExplore ? '▲' : '▼'}{' Explore more'}
        </button>

        {showExplore && (
          <div style={{ display:'flex', gap:8, overflowX:'auto', paddingBottom:8, paddingTop:10, scrollbarWidth:'none', msOverflowStyle:'none', WebkitOverflowScrolling:'touch' }}>
            {exploreChips.map((chip, i) => (
              <ExploreChip key={i} emoji={chip.emoji} label={chip.label} onClick={chip.onClick} />
            ))}
          </div>
        )}
      </div>

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
