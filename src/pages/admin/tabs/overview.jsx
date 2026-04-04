// src/pages/admin/tabs/overview.jsx
export default function Tab_OVERVIEW({ C, Card, stats, waitlist, loading }) {

  // StatPill defined locally — was previously undefined (crash fix)
  function StatPill({ label, value, color }) {
    return (
      <div style={{ background:'white', border:'1px solid '+C.border, borderRadius:12, padding:'14px 16px' }}>
        <div style={{ fontFamily:"'Fraunces',serif", fontSize:28, fontWeight:900, color: color||C.ink, lineHeight:1 }}>
          {value ?? '—'}
        </div>
        <div style={{ fontSize:11, color:C.muted, fontWeight:400, marginTop:4, letterSpacing:'0.3px' }}>{label}</div>
      </div>
    );
  }

  return (
    <>
      {/* Stat pills grid */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(140px,1fr))', gap:12, marginBottom:20 }}>
        <StatPill label="Total users"     value={stats?.totalUsers?.toLocaleString()}  color={C.jiff}     />
        <StatPill label="Meals generated" value={stats?.totalMeals?.toLocaleString()}  color="#673AB7"    />
        <StatPill label="Active today"    value={stats?.todayUsers}                     color={C.green}    />
        <StatPill label="Countries"       value={stats?.countriesCount}                 color={C.gold}     />
        <StatPill label="Waitlist"        value={(waitlist||[]).length}                 color="#E91E63"    />
      </div>

      {!stats && !loading && (
        <div style={{ padding:'20px', textAlign:'center', color:C.muted, fontSize:13, background:'white', borderRadius:12, border:'1px solid '+C.border }}>
          Stats require Supabase. Check <code style={{ fontSize:11 }}>REACT_APP_SUPABASE_URL</code> and{' '}
          <code style={{ fontSize:11 }}>SUPABASE_SERVICE_ROLE_KEY</code> in Vercel.{' '}
          <a href="/api/stats" target="_blank" rel="noopener noreferrer" style={{ color:C.jiff }}>Test /api/stats →</a>
        </div>
      )}

      {loading && (
        <div style={{ textAlign:'center', color:C.muted, fontSize:13, padding:'20px' }}>⏳ Loading stats…</div>
      )}

      {/* Top cuisines */}
      {stats?.topCuisines?.length > 0 && (
        <Card title="Top cuisines">
          {stats.topCuisines.map(c => (
            <div key={c.name} style={{ display:'flex', alignItems:'center', gap:10, marginBottom:8 }}>
              <div style={{ fontSize:12, color:C.ink, width:130, flexShrink:0 }}>{c.name}</div>
              <div style={{ flex:1, height:6, background:'rgba(28,10,0,0.07)', borderRadius:3 }}>
                <div style={{ height:'100%', width:`${c.pct}%`, background:C.jiff, borderRadius:3, transition:'width 0.8s ease' }}/>
              </div>
              <div style={{ fontSize:11, color:C.muted, width:70, textAlign:'right' }}>{c.count?.toLocaleString()} · {c.pct}%</div>
            </div>
          ))}
        </Card>
      )}

      {/* Weekly trend bar chart */}
      {stats?.weeklyTrend?.length > 0 && (
        <Card title="Activity this week">
          <div style={{ display:'flex', alignItems:'flex-end', gap:8, height:64 }}>
            {(stats.weeklyTrend||[]).map(d => {
              const max = Math.max(...(stats.weeklyTrend||[]).map(x => x.users), 1);
              const h   = Math.round((d.users / max) * 52);
              return (
                <div key={d.day} style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:4 }}>
                  <div style={{ width:'100%', height:h||3, background:C.jiff, borderRadius:'3px 3px 0 0', minHeight:3 }}/>
                  <div style={{ fontSize:9, color:C.muted }}>{d.day}</div>
                </div>
              );
            })}
          </div>
        </Card>
      )}
    </>
  );
}
