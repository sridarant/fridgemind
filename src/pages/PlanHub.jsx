// src/pages/PlanHub.jsx
// Plan tab hub — entry point for all planning journeys.
// Consolidates: Planner, Kids lunchbox, Little Chefs, Sacred Kitchen, Plans.

import { useNavigate } from 'react-router-dom';
import PageHeader from '../components/common/PageHeader';
import { useAuth }     from '../contexts/AuthContext';

const C = {
  jiff:'#FF4500', ink:'#1C0A00', cream:'#FFFAF5',
  muted:'#7C6A5E', border:'rgba(28,10,0,0.08)',
};

const PLAN_CARDS = [
  {
    emoji:'📅', label:'Week planner',
    sub:'Plan 7 days of meals — breakfast, lunch, dinner',
    color:'#2563EB', bg:'rgba(37,99,235,0.07)', border:'rgba(37,99,235,0.2)',
    path:'/planner',
  },
  {
    emoji:'⚡', label:'Goal-based plans',
    sub:'Weight loss, muscle gain, budget — curated 7-day meal plans',
    color:'#1D9E75', bg:'rgba(29,158,117,0.07)', border:'rgba(29,158,117,0.2)',
    path:'/plans',
  },
  {
    emoji:'🍱', label:"Kids' lunchbox",
    sub:'5-day school lunchbox plan — fun, nutritious, no complaints',
    color:'#D97706', bg:'rgba(217,119,6,0.07)', border:'rgba(217,119,6,0.2)',
    path:'/little-chefs/lunchbox',
  },
  {
    emoji:'🧑‍🍳', label:'Little Chefs',
    sub:'Age-appropriate recipes kids can cook themselves',
    color:'#DC2626', bg:'rgba(220,38,38,0.07)', border:'rgba(220,38,38,0.2)',
    path:'/little-chefs',
  },
  {
    emoji:'🍽️', label:'Dishes for kids',
    sub:'Kid-friendly meals your little ones will actually eat',
    color:'#7C3AED', bg:'rgba(124,58,237,0.07)', border:'rgba(124,58,237,0.2)',
    path:'/little-chefs/dishes',
  },
  {
    emoji:'✨', label:'Sacred Kitchen',
    sub:'Festival recipes · Sattvic · Temple food traditions',
    color:'#D97706', bg:'rgba(217,119,6,0.07)', border:'rgba(217,119,6,0.2)',
    path:'/sacred',
  },
];

function PlanCard({ emoji, label, sub, color, bg, border, onClick }) {
  return (
    <button onClick={onClick}
      style={{ display:'flex', alignItems:'center', gap:14, padding:'16px 18px', background:bg, border:'1px solid '+border, borderRadius:16, cursor:'pointer', fontFamily:"'DM Sans',sans-serif", textAlign:'left', width:'100%', transition:'all 0.14s' }}
      onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(28,10,0,0.08)'; }}
      onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'none'; }}>
      <span style={{ fontSize:28, flexShrink:0 }}>{emoji}</span>
      <div style={{ flex:1, minWidth:0 }}>
        <div style={{ fontSize:14, fontWeight:600, color, marginBottom:3 }}>{label}</div>
        <div style={{ fontSize:12, color:C.muted, fontWeight:300, lineHeight:1.4 }}>{sub}</div>
      </div>
      <span style={{ fontSize:18, color, flexShrink:0 }}>{'→'}</span>
    </button>
  );
}

export default function PlanHub() {
  const navigate   = useNavigate();
  const { profile } = useAuth();

  const hasKids = profile?.has_kids || (profile?.family_size > 2);

  // Filter kids cards based on profile
  const cards = PLAN_CARDS.filter(c => {
    if (!hasKids && (c.path.includes('lunchbox') || c.path.includes('little-chefs') || c.path.includes('dishes'))) return false;
    return true;
  });

  return (
    <div style={{ minHeight:'100vh', background:C.cream, fontFamily:"'DM Sans',sans-serif", paddingBottom:100 }}>
      <PageHeader title="Plan" />
      <div style={{ padding:'16px 20px 0', maxWidth:560, margin:'0 auto' }}>
        <p style={{ fontSize:13, color:C.muted, fontWeight:300, marginBottom:20, lineHeight:1.5 }}>
          {'Week plans, lunchboxes, special diets, and sacred recipes — all in one place.'}
        </p>

        <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
          {cards.map(card => (
            <PlanCard key={card.path} {...card} onClick={() => navigate(card.path)} />
          ))}
        </div>

        {/* Show kids section prompt if no kids in profile */}
        {!hasKids && (
          <div style={{ marginTop:20, padding:'12px 16px', borderRadius:12, background:'rgba(245,158,11,0.06)', border:'1px solid rgba(245,158,11,0.2)' }}>
            <div style={{ fontSize:12, color:'#92400E', lineHeight:1.5 }}>
              {'👶 Have kids? Update your profile to see kids lunchbox and recipe options.'}
            </div>
            <button onClick={() => navigate('/profile', { state:{ tab:'family' } })}
              style={{ marginTop:8, fontSize:11, padding:'5px 12px', borderRadius:8, background:'#D97706', color:'white', border:'none', cursor:'pointer', fontFamily:"'DM Sans',sans-serif" }}>
              {'Update profile →'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
