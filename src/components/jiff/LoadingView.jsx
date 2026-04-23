// src/components/jiff/LoadingView.jsx
// Smart loader with short, human context-aware messages.
// All messages under 35 chars. Smooth 3-dot animation.

import { useState, useEffect } from 'react';

const MSG_SETS = {
  mood:     ['Reading the mood…',        'Finding your vibe…',       'Almost there…',            'Got something good…'],
  hosting:  ['Impressing the guests…',   'Finding a showstopper…',   'Nearly there…',            'Got something good…'],
  leftover: ['Using what you have…',     'Rescuing the fridge…',     'Almost done…',             'Found it…'],
  kids:     ['Kid-friendly options…',    'Checking the spice…',      'Almost ready…',            'Good to go…'],
  surprise: ['Something unexpected…',    'Off the beaten path…',     'You won\'t expect this…',  'Here we go…'],
  default:  ['Looking at your taste…',   'Finding something quick…', 'Balancing effort…',        'Got something good…'],
};

function getMsgs(source) {
  return MSG_SETS[source] || MSG_SETS.default;
}

export default function LoadingView({ isPremium, PAID_RECIPE_CAP, loadingMessage, source }) {
  const msgs = getMsgs(source);
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    setPhase(0);
    const t1 = setTimeout(() => setPhase(1), 800);
    const t2 = setTimeout(() => setPhase(2), 1700);
    const t3 = setTimeout(() => setPhase(3), 2800);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, [loadingMessage, source]);

  const msg = loadingMessage || msgs[Math.min(phase, msgs.length - 1)];

  return (
    <div style={{ textAlign:'center', padding:'56px 24px 40px', maxWidth:440, margin:'0 auto', fontFamily:"'DM Sans',sans-serif" }}>
      {/* 3-dot pulse */}
      <div style={{ display:'flex', justifyContent:'center', gap:10, marginBottom:36 }}>
        {[0,1,2].map(i => (
          <div key={i} style={{
            width:11, height:11, borderRadius:'50%',
            background: i === phase % 3 ? '#FF4500' : 'rgba(255,69,0,0.18)',
            transform:  i === phase % 3 ? 'scale(1.45)' : 'scale(1)',
            transition: 'background 0.25s, transform 0.25s',
          }} />
        ))}
      </div>

      {/* Message */}
      <div style={{ fontFamily:"'Fraunces',serif", fontSize:'clamp(19px,3.5vw,24px)', fontWeight:900, color:'var(--ink,#1C0A00)', letterSpacing:'-0.4px', marginBottom:8, minHeight:32 }}>
        {msg}
      </div>
      <div style={{ fontSize:12, color:'var(--muted,#7C6A5E)', fontWeight:300 }}>
        {phase < 2 ? 'Checking your preferences…' : 'Almost ready…'}
      </div>

      {isPremium && (
        <div style={{ marginTop:20, display:'inline-flex', alignItems:'center', gap:5, background:'rgba(255,69,0,0.07)', borderRadius:20, padding:'4px 14px', fontSize:11, color:'var(--jiff,#FF4500)', fontWeight:500 }}>
          {'⚡ Generating '}{PAID_RECIPE_CAP}{' recipes'}
        </div>
      )}
    </div>
  );
}
