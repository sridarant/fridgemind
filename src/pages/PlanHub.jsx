// src/pages/PlanHub.jsx
// Simplified plan entry screen — 4 intent options that all route through
// the same recommendation engine. No complex UI, no separate flows.

import { useNavigate } from 'react-router-dom';
import { useAuth }     from '../contexts/AuthContext';
import { buildJourneyContext } from '../services/recommendationService.js';

const C = {
  jiff:'#FF4500', ink:'#1C0A00', cream:'#FFFAF5',
  muted:'#7C6A5E', border:'rgba(28,10,0,0.08)',
};

const OPTIONS = [
  {
    key:     'week',
    emoji:   '📅',
    label:   'Plan my week',
    sub:     'Smart suggestions for the days ahead',
    color:   '#2563EB',
    bg:      'rgba(37,99,235,0.07)',
    border:  'rgba(37,99,235,0.2)',
    navPath: '/planner',
  },
  {
    key:     'health',
    emoji:   '🥗',
    label:   'Eat better',
    sub:     'Lighter meals, more protein, less effort',
    color:   '#1D9E75',
    bg:      'rgba(29,158,117,0.07)',
    border:  'rgba(29,158,117,0.2)',
    journeyType: 'health',
  },
  {
    key:     'kids',
    emoji:   '🍱',
    label:   'For kids or family',
    sub:     'Safe, mild, and easy to make',
    color:   '#D97706',
    bg:      'rgba(217,119,6,0.07)',
    border:  'rgba(217,119,6,0.2)',
    journeyType: 'kids',
  },
  {
    key:     'festival',
    emoji:   '🪔',
    label:   'Special or festival',
    sub:     'Traditional, festive, or hosting guests',
    color:   '#DC2626',
    bg:      'rgba(220,38,38,0.07)',
    border:  'rgba(220,38,38,0.2)',
    journeyType: 'festival',
  },
];

export default function PlanHub() {
  const navigate             = useNavigate();
  const { profile, mealHistory } = useAuth();

  const handleOption = (opt) => {
    if (opt.navPath) {
      navigate(opt.navPath);
      return;
    }
    // All journeys route back to /app with a journeyContext in state
    const jCtx = buildJourneyContext({
      journeyType:  opt.journeyType,
      profile:      profile   || null,
      mealHistory:  mealHistory || [],
    });
    navigate('/app', { state: { journeyContext: jCtx } });
  };

  return (
    <div style={{ maxWidth:560, margin:'0 auto', padding:'20px 16px 100px', fontFamily:"'DM Sans',sans-serif" }}>
      {/* Header */}
      <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:6 }}>
        <button onClick={() => navigate(-1)}
          style={{ background:'none', border:'none', cursor:'pointer', fontSize:20, color:C.muted, padding:'4px 2px', lineHeight:1 }}>
          {'←'}
        </button>
        <div>
          <div style={{ fontFamily:"'Fraunces',serif", fontSize:22, fontWeight:900, color:C.ink, lineHeight:1.15 }}>
            {'What are you planning for?'}
          </div>
          <div style={{ fontSize:13, color:C.muted, fontWeight:300, marginTop:3 }}>
            {'Each option leads to a personalised suggestion'}
          </div>
        </div>
      </div>

      {/* Option cards */}
      <div style={{ display:'flex', flexDirection:'column', gap:12, marginTop:20 }}>
        {OPTIONS.map(opt => (
          <button key={opt.key} onClick={() => handleOption(opt)}
            style={{ display:'flex', alignItems:'center', gap:16, padding:'18px 20px', borderRadius:16, border:'1.5px solid '+(opt.border||C.border), background:opt.bg||'white', cursor:'pointer', fontFamily:"'DM Sans',sans-serif", textAlign:'left', transition:'all 0.13s', boxShadow:'0 2px 8px rgba(28,10,0,0.04)' }}
            onMouseEnter={e => { e.currentTarget.style.boxShadow='0 4px 16px rgba(28,10,0,0.10)'; }}
            onMouseLeave={e => { e.currentTarget.style.boxShadow='0 2px 8px rgba(28,10,0,0.04)'; }}>
            <span style={{ fontSize:30, flexShrink:0 }}>{opt.emoji}</span>
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ fontSize:15, fontWeight:700, color:opt.color||C.ink, marginBottom:3 }}>{opt.label}</div>
              <div style={{ fontSize:12, color:C.muted, fontWeight:300, lineHeight:1.4 }}>{opt.sub}</div>
            </div>
            <span style={{ fontSize:18, color:opt.color||C.muted, flexShrink:0, opacity:0.7 }}>{'→'}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
