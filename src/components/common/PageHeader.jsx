// src/components/common/PageHeader.jsx
// Consistent back navigation header for all secondary pages.
// Used by: History, Favs, Insights, Discover, LittleChefs, KidsDishes,
//          KidsLunchbox, SacredKitchen, Plans, PlanHub, Stats, Pricing

import { useNavigate } from 'react-router-dom';

export default function PageHeader({ title, backTo = '/app', backLabel = '← Home', action = null }) {
  const navigate = useNavigate();
  return (
    <header style={{
      display:'flex', alignItems:'center', justifyContent:'space-between',
      padding:'14px 20px',
      borderBottom:'1px solid rgba(28,10,0,0.08)',
      position:'sticky', top:0, zIndex:10,
      background:'rgba(255,250,245,0.96)',
      backdropFilter:'blur(10px)',
      fontFamily:"'DM Sans',sans-serif",
    }}>
      <button onClick={() => navigate(backTo)}
        style={{ fontSize:13, color:'#7C6A5E', background:'none', border:'1px solid rgba(28,10,0,0.10)', borderRadius:8, padding:'6px 12px', cursor:'pointer', fontFamily:"'DM Sans',sans-serif" }}>
        {backLabel}
      </button>
      <span style={{ fontFamily:"'Fraunces',serif", fontSize:17, fontWeight:700, color:'#1C0A00' }}>
        {title}
      </span>
      {action
        ? <div>{action}</div>
        : <div style={{ width:80 }} />}
    </header>
  );
}
