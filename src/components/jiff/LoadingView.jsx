// src/components/jiff/LoadingView.jsx
// Smart text-based loader with context-aware microcopy.
// Replaces generic "Finding recipes..." with specific, human messages.

import { useState, useEffect } from 'react';

// Context-aware loading message sets
const LOADING_SETS = {
  mood:     ['Getting into your vibe…', 'Reading the mood…',       'Finding something that fits…',  'Almost there…'],
  family:   ['Planning for everyone…',  'Thinking of the whole crew…','Something for all tastes…',    'Nearly ready…'],
  hosting:  ['Impressing the guests…',  'Finding showstoppers…',    'Setting the table in my head…', 'Got something good…'],
  seasonal: ['Looking at what\'s fresh…','Checking the season…',    'Something in its prime…',       'Almost…'],
  leftover: ['Rescuing the fridge…',    'Using what you have…',     'Turning scraps into something…','Found it…'],
  kids:     ['Kid-approved ideas…',     'Checking what they\'ll like…','Balancing fun and nutrition…','Ready…'],
  surprise: ['Throwing the dice…',      'Unexpected incoming…',     'Something you haven\'t tried…', 'Surprise!'],
  quick:    ['Finding the fastest…',    'Under 15 min options…',    'Quick and satisfying…',         'Here it is…'],
  default:  ['Looking at your taste…',  'Finding something quick…', 'Balancing effort…',             'Got something good…'],
};

function getLoadingMessages(source) {
  if (!source) return LOADING_SETS.default;
  if (source === 'mood')            return LOADING_SETS.mood;
  if (source === 'family')          return LOADING_SETS.family;
  if (source === 'hosting')         return LOADING_SETS.hosting;
  if (source === 'seasonal')        return LOADING_SETS.seasonal;
  if (source === 'leftover')        return LOADING_SETS.leftover;
  if (source === 'kids')            return LOADING_SETS.kids;
  if (source === 'surprise')        return LOADING_SETS.surprise;
  if (source === 'fridge')          return LOADING_SETS.default;
  return LOADING_SETS.default;
}

export default function LoadingView({ cuisine, mealType, ingredients, isPremium, PAID_RECIPE_CAP, factIdx, loadingMessage, source }) {
  const msgs   = getLoadingMessages(source);
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    setPhase(0);
    const t1 = setTimeout(() => setPhase(1), 900);
    const t2 = setTimeout(() => setPhase(2), 1900);
    const t3 = setTimeout(() => setPhase(3), 3000);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, [loadingMessage]);

  const displayMsg = loadingMessage || msgs[Math.min(phase, msgs.length - 1)];

  return (
    <div style={{ textAlign:'center', padding:'48px 24px', maxWidth:480, margin:'0 auto', fontFamily:"'DM Sans',sans-serif" }}>
      {/* Animated dots loader — minimal, not distracting */}
      <div style={{ display:'flex', justifyContent:'center', alignItems:'center', gap:8, marginBottom:32 }}>
        {[0,1,2].map(i => (
          <div key={i} style={{
            width:10, height:10, borderRadius:'50%',
            background: i === phase % 3 ? '#FF4500' : 'rgba(255,69,0,0.2)',
            transition: 'background 0.3s, transform 0.3s',
            transform:  i === phase % 3 ? 'scale(1.4)' : 'scale(1)',
            animation:  'dotPulse 1.2s ease-in-out infinite',
            animationDelay: (i * 0.2) + 's',
          }} />
        ))}
        <style>{`@keyframes dotPulse{0%,100%{opacity:0.4}50%{opacity:1}}`}</style>
      </div>

      {/* Primary loading message — changes across phases */}
      <div style={{ fontFamily:"'Fraunces',serif", fontSize:'clamp(20px,3.5vw,26px)', fontWeight:900, color:'var(--ink)', letterSpacing:'-0.5px', marginBottom:10, minHeight:36, transition:'opacity 0.3s' }}>
        {displayMsg}
      </div>

      {/* Subtle secondary line */}
      <div style={{ fontSize:13, color:'var(--muted)', fontWeight:300, marginBottom:20 }}>
        {phase < 2 ? 'Checking your preferences…' : 'Almost ready…'}
      </div>

      {isPremium && (
        <div style={{ display:'inline-flex', alignItems:'center', gap:6, background:'rgba(255,69,0,0.08)', borderRadius:20, padding:'4px 14px', fontSize:11, color:'var(--jiff)', fontWeight:500 }}>
          {'⚡ Generating '}{PAID_RECIPE_CAP}{' recipes'}
        </div>
      )}
    </div>
  );
}
