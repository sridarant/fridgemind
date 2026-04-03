// src/pages/admin/tabs/api.jsx — Admin tab component
// Props received from AdminShell: C, Card, ADMIN_KEY, adminKey, stats, users,
//   waitlist, feedback, releases, loading, premiumStatus, lookerUrl,
//   tokenStats, rlsStatus, setStats, setUsers, setWaitlist, setFeedback,
//   setReleases, setLoading, setPremiumStatus, setLookerUrl,
//   setTokenStats, setRlsStatus, activeTab

export default function Tab_API({{ C, Card, ADMIN_KEY, adminKey, setAdminKey,
  stats, setStats, users, setUsers, waitlist, setWaitlist,
  feedback, setFeedback, releases, setReleases, loading, setLoading,
  premiumStatus, setPremiumStatus, lookerUrl, setLookerUrl,
  tokenStats, setTokenStats, rlsStatus, setRlsStatus }}) {{
  return (
    <>
<Card title="API usage dashboard">
  {!apiUsage ? (
    <div style={{ color:C.muted, fontSize:13, fontWeight:300 }}>
      API usage tracking requires <code style={{ fontSize:11 }}>SUPABASE_SERVICE_ROLE_KEY</code> and the <code style={{ fontSize:11 }}>api_keys</code> table from Phase 3. <a href="/api-docs" target="_blank" style={{ color:C.jiff }}>View API docs →</a>
    </div>
  ) : (
    <>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(140px,1fr))', gap:12, marginBottom:16 }}>
        <StatPill label="Total API calls" value={apiUsage.totalCalls?.toLocaleString()} />
        <StatPill label="Today" value={apiUsage.todayCalls} />
        <StatPill label="Active keys" value={apiUsage.activeKeys} />
        <StatPill label="Errors today" value={apiUsage.errorsToday} color={C.red} />
      </div>
      {apiUsage.topKeys?.map((k,i)=>(
        <div key={i} style={{ display:'flex', alignItems:'center', gap:10, marginBottom:8, fontSize:12 }}>
          <code style={{ flex:1, color:C.ink, fontSize:11 }}>{k.key?.slice(0,16)}…</code>
          <span style={{ color:C.muted }}>{k.tier}</span>
          <span style={{ fontWeight:500 }}>{k.usage_count} calls</span>
        </div>
      ))}
    </>
  )}
</Card>
    </>
  );
}
