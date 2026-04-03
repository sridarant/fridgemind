// src/pages/admin/tabs/overview.jsx — Admin tab component
// Props received from AdminShell: C, Card, ADMIN_KEY, adminKey, stats, users,
//   waitlist, feedback, releases, loading, premiumStatus, lookerUrl,
//   tokenStats, rlsStatus, setStats, setUsers, setWaitlist, setFeedback,
//   setReleases, setLoading, setPremiumStatus, setLookerUrl,
//   setTokenStats, setRlsStatus, activeTab

export default function Tab_OVERVIEW({ C, Card, ADMIN_KEY, adminKey, setAdminKey,
  stats, setStats, users, setUsers, waitlist, setWaitlist,
  feedback, setFeedback, releases, setReleases, loading, setLoading,
  premiumStatus, setPremiumStatus, lookerUrl, setLookerUrl,
  tokenStats, setTokenStats, rlsStatus, setRlsStatus }) {{
  return (
    <>
  <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(160px,1fr))', gap:12, marginBottom:20 }}>
    <StatPill label="Total users"     value={stats?.totalUsers?.toLocaleString()} color={C.jiff} />
    <StatPill label="Meals generated" value={stats?.totalMeals?.toLocaleString()} color="#673AB7" />
    <StatPill label="Active today"    value={stats?.todayUsers} color={C.green} />
    <StatPill label="Countries"       value={stats?.countriesCount} color={C.gold} />
    <StatPill label="Waitlist"        value={waitlist.length} color="#E91E63" />
  </div>
  {!stats && !loading && (
    <div style={{ padding:'24px', textAlign:'center', color:C.muted, fontSize:13, background:'white', borderRadius:12, border:'1px solid '+C.border }}>
      Stats require Supabase. Check <code style={{ fontSize:11 }}>REACT_APP_SUPABASE_URL</code> and <code style={{ fontSize:11 }}>SUPABASE_SERVICE_ROLE_KEY</code> in Vercel. <a href="/api/stats" target="_blank" style={{ color:C.jiff }}>Test /api/stats</a>
    </div>
  )}
  {stats?.topCuisines?.length > 0 && (
    <Card title="Top cuisines">
      {stats.topCuisines.map(c=>(
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
  {stats?.weeklyTrend?.length > 0 && (
    <Card title="Activity this week">
      <div style={{ display:'flex', alignItems:'flex-end', gap:8, height:60 }}>
        {stats.weeklyTrend.map(d=>{
          const max = Math.max(...stats.weeklyTrend.map(x=>x.users), 1);
          const h = Math.round((d.users/max)*52);
          return (
            <div key={d.day} style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:4 }}>
              <div style={{ width:'100%', height:h||3, background:C.jiff, borderRadius:'3px 3px 0 0', minHeight:3 }}/>
              <div style={{ fontSize:9, color:C.muted, fontWeight:400 }}>{d.day}</div>
            </div>
          );
        })}
      </div>
    </Card>
  )}
    </>
  );
}
