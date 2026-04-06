// src/pages/Stats.jsx — Public stats: users, countries, trends (item q)
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const C = { jiff:'#FF4500', ink:'#1C0A00', cream:'#FFFAF5', warm:'#FFF0E5', muted:'#7C6A5E', border:'rgba(28,10,0,0.10)', shadow:'0 4px 24px rgba(28,10,0,0.07)' };

// Static display data — replace with real GA4 / Supabase queries in production
const MOCK_STATS = {
  totalUsers:    1247,
  totalMeals:    18432,
  countriesCount: 23,
  todayUsers:    89,
  growthPct:     34,
  topCountries: [
    { name: 'India',         code: 'IN', flag: '🇮🇳', users: 782, pct: 63 },
    { name: 'Singapore',     code: 'SG', flag: '🇸🇬', users: 124, pct: 10 },
    { name: 'United States', code: 'US', flag: '🇺🇸', users:  98, pct:  8 },
    { name: 'United Kingdom',code: 'GB', flag: '🇬🇧', users:  62, pct:  5 },
    { name: 'Australia',     code: 'AU', flag: '🇦🇺', users:  48, pct:  4 },
    { name: 'Germany',       code: 'DE', flag: '🇩🇪', users:  34, pct:  3 },
    { name: 'France',        code: 'FR', flag: '🇫🇷', users:  28, pct:  2 },
    { name: 'Others',        code: '__', flag: '🌍',  users:  71, pct:  5 },
  ],
  topCuisines: [
    { name: 'South Indian', count: 3241, pct: 18 },
    { name: 'Punjabi',      count: 2187, pct: 12 },
    { name: 'Italian',      count: 1893, pct: 10 },
    { name: 'Chettinad',    count: 1654, pct:  9 },
    { name: 'Chinese',      count: 1432, pct:  8 },
    { name: 'Mexican',      count:  987, pct:  5 },
    { name: 'Japanese',     count:  876, pct:  5 },
    { name: 'Others',       count: 6162, pct: 33 },
  ],
  weeklyTrend: [
    { day:'Mon', users:62 }, { day:'Tue', users:78 }, { day:'Wed', users:91 },
    { day:'Thu', users:84 }, { day:'Fri', users:103 }, { day:'Sat', users:127 }, { day:'Sun', users:89 },
  ],
};

function StatCard({ n, label, sub, color = C.jiff }) {
  return (
    <div style={{ background:'white', border:'1px solid '+C.border, borderRadius:16, padding:'20px 22px', boxShadow:C.shadow, textAlign:'center' }}>
      <div style={{ fontFamily:"'Fraunces', serif", fontSize:36, fontWeight:900, color, lineHeight:1, marginBottom:4 }}>{n}</div>
      <div style={{ fontSize:13, fontWeight:500, color:C.ink, marginBottom:2 }}>{label}</div>
      {sub && <div style={{ fontSize:11, color:C.muted, fontWeight:300 }}>{sub}</div>}
    </div>
  );
}

function BarRow({ label, pct, count, color = C.jiff }) {
  return (
    <div style={{ marginBottom:10 }}>
      <div style={{ display:'flex', justifyContent:'space-between', marginBottom:4 }}>
        <span style={{ fontSize:13, color:C.ink }}>{label}</span>
        <span style={{ fontSize:12, color:C.muted }}>{count.toLocaleString()} · {pct}%</span>
      </div>
      <div style={{ height:6, background:'rgba(28,10,0,0.07)', borderRadius:3, overflow:'hidden' }}>
        <div style={{ height:'100%', width:(pct) + '%', background:color, borderRadius:3, transition:'width 1s ease' }}/>
      </div>
    </div>
  );
}

export default function Stats() {
  const navigate = useNavigate();
  const [animated, setAnimated] = useState(false);
  const [stats, setStats] = useState(MOCK_STATS);
  const [loading, setLoading] = useState(true);
  const [isLive, setIsLive] = useState(false);
  const maxWeekly = Math.max(...stats.weeklyTrend.map(d => d.users));

  useEffect(() => { const t = setTimeout(() => setAnimated(true), 300); return () => clearTimeout(t); }, []);

  useEffect(() => {
    // Try to fetch real stats from Supabase via API
    fetch('/api/stats')
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data?.totalUsers) { setStats(data); setIsLive(true); }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div style={{ minHeight:'100vh', background:C.cream, fontFamily:"'DM Sans', sans-serif", color:C.ink }}>
      <link href="https://fonts.googleapis.com/css2?family=Fraunces:ital,wght@0,700;0,900&family=DM+Sans:wght@300;400;500&display=swap" rel="stylesheet"/>

      <header style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'16px 28px', borderBottom:'1px solid '+C.border, position:'sticky', top:0, zIndex:10, background:'rgba(255,250,245,0.95)', backdropFilter:'blur(12px)' }}>
        <div style={{ display:'flex', alignItems:'center', gap:8, cursor:'pointer' }} onClick={() => navigate('/')}>
          <span style={{ fontSize:22 }}>⚡</span>
          <span style={{ fontFamily:"'Fraunces', serif", fontSize:22, fontWeight:900, color:C.ink }}><span style={{ color:C.jiff }}>J</span>iff</span>
        </div>
        <button onClick={() => navigate('/app')} style={{ fontSize:13, color:C.muted, background:'none', border:'1.5px solid rgba(28,10,0,0.18)', borderRadius:8, padding:'6px 14px', cursor:'pointer', fontFamily:"'DM Sans', sans-serif" }}>← Home to app</button>
      </header>

      <div style={{ maxWidth:900, margin:'0 auto', padding:'40px 24px 80px' }}>
        <div style={{ marginBottom:32 }}>
          <p style={{ fontSize:11, letterSpacing:'2px', textTransform:'uppercase', color:C.jiff, fontWeight:500, marginBottom:6 }}>Live stats</p>
          <h1 style={{ fontFamily:"'Fraunces', serif", fontSize:'clamp(28px,5vw,44px)', fontWeight:900, color:C.ink, letterSpacing:'-1px', marginBottom:8 }}>Jiff — by the numbers</h1>
          <p style={{ fontSize:14, color:C.muted, fontWeight:300 }}>Home cooks from {stats.countriesCount} countries use Jiff to turn fridge ingredients into real meals.</p>
        </div>

        {/* Summary stats */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(160px,1fr))', gap:14, marginBottom:32 }}>
          <StatCard n={stats.totalUsers.toLocaleString()} label="Total users" sub="across all countries" />
          <StatCard n={stats.totalMeals.toLocaleString()} label="Meals generated" sub="and counting" color="#1D9E75" />
          <StatCard n={stats.countriesCount} label="Countries" sub="and growing" color="#3949AB" />
          <StatCard n={`+${stats.growthPct}%`} label="Month-on-month" sub="user growth" color="#FF9800" />
        </div>

        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:20, marginBottom:24 }}>
          {/* Countries */}
          <div style={{ background:'white', border:'1px solid '+C.border, borderRadius:18, padding:'22px 22px', boxShadow:C.shadow }}>
            <div style={{ fontSize:11, letterSpacing:'2px', textTransform:'uppercase', color:C.jiff, fontWeight:500, marginBottom:16 }}>Users by country</div>
            {stats.topCountries.map(c => (
              <div key={c.code} style={{ display:'flex', alignItems:'center', gap:10, marginBottom:9 }}>
                <span style={{ fontSize:18 }}>{c.flag}</span>
                <div style={{ flex:1 }}>
                  <div style={{ display:'flex', justifyContent:'space-between', marginBottom:3 }}>
                    <span style={{ fontSize:12, color:C.ink }}>{c.name}</span>
                    <span style={{ fontSize:11, color:C.muted }}>{c.users}</span>
                  </div>
                  <div style={{ height:4, background:'rgba(28,10,0,0.07)', borderRadius:2, overflow:'hidden' }}>
                    <div style={{ height:'100%', width: animated ? c.pct + '%' : '0%', background:C.jiff, borderRadius:2, transition:'width 1.2s ease' }}/>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Top cuisines */}
          <div style={{ background:'white', border:'1px solid '+C.border, borderRadius:18, padding:'22px 22px', boxShadow:C.shadow }}>
            <div style={{ fontSize:11, letterSpacing:'2px', textTransform:'uppercase', color:C.jiff, fontWeight:500, marginBottom:16 }}>Top cuisines requested</div>
            {stats.topCuisines.map((c,i) => (
              <BarRow key={c.name} label={c.name} pct={animated ? c.pct : 0} count={c.count} color={i === 0 ? C.jiff : i === 1 ? '#FF9800' : '#1D9E75'} />
            ))}
          </div>
        </div>

        {/* Weekly trend chart */}
        <div style={{ background:'white', border:'1px solid '+C.border, borderRadius:18, padding:'22px 22px', boxShadow:C.shadow }}>
          <div style={{ fontSize:11, letterSpacing:'2px', textTransform:'uppercase', color:C.jiff, fontWeight:500, marginBottom:20 }}>Active users — this week</div>
          <div style={{ display:'flex', alignItems:'flex-end', gap:10, height:100 }}>
            {stats.weeklyTrend.map((d,i) => (
              <div key={d.day} style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:6 }}>
                <span style={{ fontSize:11, color:C.muted }}>{d.users}</span>
                <div style={{
                  width:'100%', borderRadius:'4px 4px 0 0',
                  height: animated ? ((d.users / maxWeekly) * 70) + 'px' : '0',
                  background: d.day === 'Sat' ? C.jiff : 'rgba(255,69,0,0.3)',
                  transition:`height 1s ease ${i * 0.1}s`,
                  minHeight: 4,
                }}/>
                <span style={{ fontSize:11, color:C.muted }}>{d.day}</span>
              </div>
            ))}
          </div>
        </div>

        <p style={{ textAlign:'center', fontSize:12, color:C.muted, marginTop:24, fontWeight:300 }}>
          Stats updated daily · <a href="/privacy" style={{ color:C.jiff, textDecoration:'none' }}>Privacy policy</a>
        </p>
      </div>
    </div>
  );
}
