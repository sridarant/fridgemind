// src/components/common/JourneyTiles.jsx
// Decision-first home screen.
//
// LAYOUT (top → bottom, strict order):
//   §1  Greeting  — name + time-aware subline + streak
//   §2  Nudge     — one inline retention nudge (dismissible)
//   §3  PRIMARY   — dominates screen: meal, time, why, CTA
//   §4  ALTERNATES — 2 compact rows (below primary)
//   §5  REFINE    — mood / fridge / surprise
//   §6  Context tile (festival/sports/weather) — below fold
//   §7  ChallengeTracker (merged challenge + 7-day dots) — below fold
//   §8  Explore more — collapsed by default
//
// Trust layer:
//   - "Best match today" label on primary
//   - "Good choice 👍" toast on Cook this
//   - "Trying something different" signal after 2 consecutive rejections
// Analytics:
//   - primary_shown (once per render)
//   - recommendation_accepted / rejected / swapped

import { useState, useEffect, useRef } from 'react';
import { useNavigate }         from 'react-router-dom';
import MoodSelector            from './MoodSelector.jsx';
import OrderInSheet            from './OrderInSheet.jsx';
import GoalSheet               from './GoalSheet.jsx';
import RetentionNudges, { ChallengeTracker } from './RetentionNudges.jsx';
import { getUpcomingFestival, getActiveSportsEvent, getDayOfWeekContext, getCurrentSeason } from '../../lib/festival.js';
import { getUserContext }      from '../../lib/weather.js';
import { getFeaturedTile, getScoredForYouCards } from './journeyTileEngines.js';
import { logFeedback, syncBehaviourToProfile } from '../../services/feedbackService.js';
import { markAsShown } from '../../services/recommendationService.js';
import {
  trackPrimaryShown,
  trackRecommendationAccepted,
  trackRecommendationRejected,
  trackRecommendationSwapped,
} from '../../lib/analytics.js';

const C = {
  jiff:'#FF4500', jiffDark:'#CC3700', ink:'#1C0A00',
  cream:'#FFFAF5', muted:'#7C6A5E',
  border:'rgba(28,10,0,0.08)', borderMid:'rgba(28,10,0,0.14)',
  softOrange:'rgba(255,69,0,0.055)', softOrangeMid:'rgba(255,69,0,0.09)',
};

function SL({ children, mt }) {
  return (
    <div style={{ fontSize:10, letterSpacing:'2px', textTransform:'uppercase', color:C.muted, fontWeight:600, marginBottom:9, marginTop:mt || 4 }}>
      {children}
    </div>
  );
}

// ── §3 Primary card ────────────────────────────────────────────────
function PrimaryCard({ emoji, label, effortMins, why, onCook, onNotForMe, confidenceLabel }) {
  const [hov,       setHov]       = useState(false);
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  const isQuick = effortMins <= 15;

  return (
    <div style={{ marginBottom:14 }}>
      <div
        onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
        style={{
          background:  hov ? C.softOrangeMid : C.softOrange,
          border:      '1.5px solid ' + (hov ? 'rgba(255,69,0,0.28)' : 'rgba(255,69,0,0.16)'),
          borderRadius: 20,
          padding:     '18px 18px 16px',
          transition:  'all 0.13s',
          boxShadow:   hov ? '0 6px 24px rgba(255,69,0,0.11)' : '0 2px 10px rgba(28,10,0,0.05)',
          position:    'relative',
        }}>

        {/* Top row: confidence label + dismiss */}
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:13 }}>
          <span style={{ fontSize:9, fontWeight:700, color:C.jiff, background:'rgba(255,69,0,0.09)', border:'1px solid rgba(255,69,0,0.20)', borderRadius:6, padding:'2px 8px', letterSpacing:'1px' }}>
            {confidenceLabel || 'BEST MATCH TODAY'}
          </span>
          <button
            onClick={() => { setDismissed(true); onNotForMe && onNotForMe(); }}
            title="Not for me"
            style={{ background:'none', border:'none', cursor:'pointer', color:C.muted, fontSize:14, padding:'2px 4px', lineHeight:1, opacity:0.5 }}>
            ✕
          </button>
        </div>

        {/* Identity — clickable */}
        <div style={{ display:'flex', alignItems:'flex-start', gap:13, marginBottom:13, cursor:'pointer' }} onClick={onCook}>
          <span style={{ fontSize:40, lineHeight:1, flexShrink:0 }}>{emoji}</span>
          <div style={{ flex:1, minWidth:0 }}>
            <div style={{ fontFamily:"'Fraunces',serif", fontSize:21, fontWeight:900, color:C.ink, lineHeight:1.15, marginBottom:7 }}>
              {label}
            </div>
            <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
              <span style={{ fontSize:11, fontWeight:700, color:isQuick?'#1D9E75':C.jiff, background:isQuick?'rgba(29,158,117,0.09)':'rgba(255,69,0,0.08)', border:'1px solid '+(isQuick?'rgba(29,158,117,0.22)':'rgba(255,69,0,0.20)'), borderRadius:20, padding:'3px 10px' }}>
                {'⏱ '}{effortMins}{' min'}
              </span>
              <span style={{ fontSize:11, color:C.muted, background:'rgba(28,10,0,0.04)', border:'1px solid rgba(28,10,0,0.07)', borderRadius:20, padding:'3px 10px' }}>
                {why && why.effortLabel ? why.effortLabel : (isQuick ? 'Quick' : 'Medium effort')}
              </span>
            </div>
          </div>
        </div>

        {/* Why block */}
        {why && why.headline && (
          <div style={{ borderTop:'1px solid rgba(255,69,0,0.11)', paddingTop:11, marginBottom:13 }}>
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

// ── §4 Alternate row ───────────────────────────────────────────────
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

// ── §5 Refine row ──────────────────────────────────────────────────
function RefineRow({ onMood, onFridge, onSurprise }) {
  return (
    <div style={{ display:'flex', gap:8, marginBottom:20 }}>
      {[
        { label:'Match mood', emoji:'😊', onClick: onMood },
        { label:'My fridge',  emoji:'🧊', onClick: onFridge },
        { label:'Surprise me',emoji:'✨', onClick: onSurprise },
      ].map(btn => (
        <button key={btn.label} onClick={btn.onClick}
          style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:4, padding:'10px 6px', borderRadius:12, border:'1px solid '+C.border, background:'white', cursor:'pointer', fontFamily:"'DM Sans',sans-serif", transition:'all 0.12s' }}
          onMouseEnter={e => { e.currentTarget.style.background='rgba(28,10,0,0.03)'; e.currentTarget.style.borderColor=C.borderMid; }}
          onMouseLeave={e => { e.currentTarget.style.background='white'; e.currentTarget.style.borderColor=C.border; }}>
          <span style={{ fontSize:18 }}>{btn.emoji}</span>
          <span style={{ fontSize:10, fontWeight:600, color:C.muted, letterSpacing:'0.3px' }}>{btn.label}</span>
        </button>
      ))}
    </div>
  );
}

// ── §6 Context tile ────────────────────────────────────────────────
function ContextTile({ emoji, label, sub, color, bg, border, badge, onClick }) {
  const [hov, setHov] = useState(false);
  return (
    <button onClick={onClick}
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{ width:'100%', display:'flex', alignItems:'center', gap:14, padding:'14px 16px', background:hov?(bg||'rgba(255,69,0,0.09)'):(bg||'rgba(255,69,0,0.05)'), border:'1.5px solid '+(border||'rgba(255,69,0,0.16)'), borderRadius:15, cursor:'pointer', fontFamily:"'DM Sans',sans-serif", textAlign:'left', transition:'all 0.13s', marginBottom:14, position:'relative' }}>
      {badge && <span style={{ position:'absolute', top:9, right:12, fontSize:8, fontWeight:700, color:color||C.jiff, background:'white', border:'1px solid '+(border||'rgba(255,69,0,0.2)'), borderRadius:5, padding:'2px 6px', letterSpacing:'1px' }}>{badge}</span>}
      <span style={{ fontSize:28, flexShrink:0 }}>{emoji}</span>
      <div style={{ flex:1, minWidth:0 }}>
        <div style={{ fontSize:13, fontWeight:700, color:color||C.ink, marginBottom:2 }}>{label}</div>
        {sub && <div style={{ fontSize:11, color:C.muted, fontWeight:300, lineHeight:1.4 }}>{sub}</div>}
      </div>
      <span style={{ fontSize:16, color:color||C.jiff, flexShrink:0 }}>{'→'}</span>
    </button>
  );
}

// ── §8 Explore chip ────────────────────────────────────────────────
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

// ── Toast ──────────────────────────────────────────────────────────
function Toast({ message, visible }) {
  return (
    <div style={{
      position:'fixed', bottom:90, left:'50%', transform:'translateX(-50%) translateY(' + (visible ? 0 : 20) + 'px)',
      background:'#1C0A00', color:'white', borderRadius:24, padding:'9px 20px',
      fontSize:13, fontWeight:600, whiteSpace:'nowrap',
      opacity: visible ? 1 : 0, transition:'all 0.22s ease',
      pointerEvents:'none', zIndex:300, fontFamily:"'DM Sans',sans-serif",
      boxShadow:'0 4px 18px rgba(28,10,0,0.22)',
    }}>
      {message}
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
  const navigate = useNavigate();
  const [showMood,        setShowMood]        = useState(false);
  const [showOrder,       setShowOrder]       = useState(false);
  const [showGoal,        setShowGoal]        = useState(false);
  const [showExplore,     setShowExplore]     = useState(false);
  const [weather,         setWeather]         = useState(null);
  const [toast,           setToast]           = useState({ visible:false, message:'' });
  const [adaptationMsg,   setAdaptationMsg]   = useState(null);
  const acceptedPrimaryRef = useRef(false);
  const feedbackCountRef   = useRef(0);
  const shownTrackedRef    = useRef(false);

  const isIndia  = (country || 'IN') === 'IN';
  const festival = getUpcomingFestival(profile);
  const sports   = getActiveSportsEvent();
  const dayCtx   = getDayOfWeekContext();

  useEffect(() => {
    getUserContext().then(ctx => setWeather(ctx ? (ctx.weather || null) : null)).catch(() => {});
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const showToast = (msg, ms = 2000) => {
    setToast({ visible:true, message:msg });
    setTimeout(() => setToast({ visible:false, message:msg }), ms);
  };

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

  // Decision cards
  const hasSignal = ratingCount >= 1 ||
    (profile && (profile.preferred_cuisines || []).length > 0) ||
    (profile && profile.active_goal);

  const forYouCards = hasSignal ? getScoredForYouCards({ profile, ratings, mealHistory }) : [];
  const primaryCard = forYouCards.find(c => c.role === 'primary') || null;
  const alternates  = forYouCards.filter(c => c.role === 'alternate');

  // Track primary_shown once per render cycle
  useEffect(() => {
    if (primaryCard && !shownTrackedRef.current) {
      shownTrackedRef.current = true;
      trackPrimaryShown({
        mealId:   primaryCard.meal?.id   || primaryCard.label,
        mealName: primaryCard.label,
        cuisine:  primaryCard.cuisine,
        score:    primaryCard.score,
      });
    }
    if (forYouCards.length > 0) markAsShown(forYouCards.map(c => c.label));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Confidence label — dynamic based on data richness
  const confidenceLabel = (() => {
    if (ratingCount >= 5) return 'PICKED FOR YOU';
    if (ratingCount >= 2) return 'BEST MATCH TODAY';
    if (profile && (profile.preferred_cuisines || []).length > 0) return 'FROM YOUR CUISINES';
    return 'SUGGESTED FOR YOU';
  })();

  const handleCook = (card, position) => {
    const action = (position > 0 && acceptedPrimaryRef.current) ? 'swapped' : 'accepted';
    if (position === 0) acceptedPrimaryRef.current = true;

    // feedbackService (localStorage + Supabase)
    logFeedback({ meal: card.meal, action, userId: user ? user.id : null, position });
    syncBehaviour();

    // Analytics (GA4 + Supabase events table) — no duplicate logging
    if (action === 'accepted') {
      trackRecommendationAccepted({ mealId: card.meal?.id || card.label, mealName: card.label, cuisine: card.cuisine, position });
    } else {
      trackRecommendationSwapped({ mealId: card.meal?.id || card.label, mealName: card.label, cuisine: card.cuisine, position });
    }

    // Post-action feedback toast
    showToast('Good choice 👍');

    setAdaptationMsg(null);
    onGenerateDirect && onGenerateDirect(card.context);
  };

  const handleNotForMe = (card, position) => {
    logFeedback({ meal: card.meal, action: 'rejected', userId: user ? user.id : null, position });
    syncBehaviour();
    trackRecommendationRejected({ mealId: card.meal?.id || card.label, mealName: card.label, cuisine: card.cuisine, position });

    // Adaptation signal: show once after 2 consecutive rejections
    // feedbackService already counts the streak; we detect it via the count
    const stored = (() => {
      try { return parseInt(sessionStorage.getItem('jiff-session-reject-streak') || '0'); } catch { return 0; }
    })();
    if (stored >= 2 && !adaptationMsg) {
      setAdaptationMsg('Trying something different…');
      setTimeout(() => setAdaptationMsg(null), 3500);
    }
  };

  // Explore chips
  const exploreChips = [
    profile && (profile.has_kids || profile.family_size > 2)
      ? { emoji:'🍱', label:"Kids' lunchbox", onClick:() => navigate('/little-chefs/lunchbox') } : null,
    { emoji:'🧑‍🍳', label:'Little Chefs',   onClick:() => navigate('/little-chefs') },
    { emoji:'✨',    label:'Sacred Kitchen', onClick:() => navigate('/sacred') },
    { emoji:'📅',   label:'Week plan',       onClick:() => navigate('/planner') },
    isIndia ? { emoji:'🛵', label:'Order in', onClick:() => setShowOrder(true) } : null,
  ].filter(Boolean);

  const decisionLabel = (() => {
    if (ratingCount >= 3) return 'Based on what you love';
    if (ratingCount >= 1) return 'Because you liked that last one';
    if (profile && (profile.preferred_cuisines || []).length > 0) return 'From your cuisines';
    return 'Picked for you';
  })();

  return (
    <div style={{ maxWidth:680, margin:'0 auto', padding:'14px 16px 100px', fontFamily:"'DM Sans',sans-serif" }}>

      {/* §1 GREETING */}
      <div style={{ marginBottom:4 }}>
        <h2 style={{ fontFamily:"'Fraunces',serif", fontSize:'clamp(19px,5vw,24px)', fontWeight:900, color:C.ink, margin:0, lineHeight:1.2 }}>
          {greet()} ⚡
        </h2>
        <div style={{ fontSize:13, color:C.muted, fontWeight:300, marginTop:3, marginBottom:6 }}>
          {readyLine()}
        </div>
        {streak >= 2 && (
          <div style={{ display:'inline-flex', alignItems:'center', gap:4, background:'rgba(255,69,0,0.07)', border:'1px solid rgba(255,69,0,0.18)', borderRadius:20, padding:'2px 10px', fontSize:10, color:'#CC3700', fontWeight:600 }}>
            {'🔥 '}{streak}{'-day streak!'}
          </div>
        )}
      </div>

      {/* §2 NUDGE — one at a time, no challenge here */}
      <RetentionNudges
        welcomeBack={welcomeBack}
        weeklyDigest={weeklyDigest}
        milestone={milestone}
        didYouCookNudge={didYouCookNudge}
        upgradeNudge={upgradeNudge}
        onDismissUpgrade={onDismissUpgrade}
        onConfirmCooked={onConfirmCooked}
        onDismissNudge={onDismissNudge}
        lastFavCuisine={lastFavCuisine}
      />

      {/* Adaptation signal — shown only after 2 consecutive rejections */}
      {adaptationMsg && (
        <div style={{ marginTop:8, padding:'7px 12px', borderRadius:10, background:'rgba(29,158,117,0.07)', border:'1px solid rgba(29,158,117,0.2)', fontSize:11, color:'#065F46', fontWeight:500, textAlign:'center' }}>
          {adaptationMsg}
        </div>
      )}

      {/* §3 PRIMARY RECOMMENDATION */}
      {primaryCard ? (
        <>
          <SL mt={14}>{decisionLabel}</SL>
          <PrimaryCard
            emoji={primaryCard.emoji}
            label={primaryCard.label}
            effortMins={primaryCard.effortMins}
            tags={primaryCard.tags || []}
            why={primaryCard.why}
            confidenceLabel={confidenceLabel}
            onCook={() => handleCook(primaryCard, 0)}
            onNotForMe={() => handleNotForMe(primaryCard, 0)}
          />
        </>
      ) : (
        <div style={{ marginBottom:14, marginTop:14 }}>
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

      {/* §4 ALTERNATES */}
      {alternates.length > 0 && (
        <div style={{ marginBottom:14 }}>
          <SL>{'Or try instead'}</SL>
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

      {/* §5 REFINE */}
      <RefineRow
        onMood={()     => setShowMood(true)}
        onFridge={()   => onSelectFridge && onSelectFridge()}
        onSurprise={() => onGenerateDirect && onGenerateDirect({ surpriseMode:true })}
      />

      {/* §6 CONTEXT TILE (festival / sports / weather) */}
      {!featured.isFridge && (
        <ContextTile
          emoji={featured.emoji} label={featured.label} sub={featured.sub}
          color={featured.color} bg={featured.bg} border={featured.border}
          badge={featured.badge} onClick={handleFeatured}
        />
      )}

      {/* §7 CHALLENGE + 7-DAY TRACKER (merged, below fold) */}
      <ChallengeTracker challenge={challenge} mealHistory={mealHistory} />

      {/* §8 EXPLORE MORE — collapsed by default */}
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

      {/* Post-action toast */}
      <Toast message={toast.message} visible={toast.visible} />

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
