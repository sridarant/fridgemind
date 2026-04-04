// src/pages/admin/tabs/tokens.jsx — Admin tab component
// Props received from AdminShell: C, Card, ADMIN_KEY, adminKey, stats, users,
//   waitlist, feedback, releases, loading, premiumStatus, lookerUrl,
//   tokenStats, rlsStatus, setStats, setUsers, setWaitlist, setFeedback,
//   setReleases, setLoading, setPremiumStatus, setLookerUrl,
//   setTokenStats, setRlsStatus, activeTab

export default function Tab_TOKENS({ C, Card, ADMIN_KEY, adminKey, setAdminKey,
  stats, setStats, users, setUsers, waitlist, setWaitlist,
  feedback, setFeedback, releases, setReleases, loading, setLoading,
  premiumStatus, setPremiumStatus, lookerUrl, setLookerUrl,
  tokenStats, setTokenStats, rlsStatus, setRlsStatus }) {
  return (
    <>
  <Card title="Anthropic API — Token consumption">
    <div style={{fontSize:12,color:C.muted,fontWeight:300,marginBottom:12,lineHeight:1.6}}>
      Token usage is logged per API call to the <code style={{fontSize:11,background:'rgba(28,10,0,0.06)',padding:'1px 5px',borderRadius:3}}>token_usage</code> Supabase table.
      Each row is one Claude API call. Requires <strong style={{color:C.ink}}>SUPABASE_SERVICE_ROLE_KEY</strong> in Vercel env vars.
    </div>
    <button onClick={async ()=>{
      try {
        const url = process.env.REACT_APP_SUPABASE_URL || window._sbUrl;
        // Load from admin stats endpoint
        const r = await fetch('/api/admin?action=token-stats');
        const d = await r.json();
        setTokenStats(d);
      } catch(e) { setTokenStats({error: e.message}); }
    }} style={{background:C.jiff,color:'white',border:'none',borderRadius:8,padding:'8px 16px',
      fontSize:12,fontWeight:600,cursor:'pointer',marginBottom:16,fontFamily:"'DM Sans',sans-serif"}}>
      Load token stats
    </button>

    {tokenStats?.error && (
      <div style={{padding:'10px 14px',background:'rgba(229,62,62,0.08)',border:'1px solid rgba(229,62,62,0.2)',borderRadius:8,fontSize:12,color:C.red,marginBottom:12}}>
        {tokenStats.error} — ensure SUPABASE_SERVICE_ROLE_KEY is set and run Phase 7 SQL in SUPABASE_SETUP.md
      </div>
    )}

    {tokenStats && !tokenStats.error && (
      <>
        {/* Summary cards */}
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(140px,1fr))',gap:10,marginBottom:20}}>
          {[
            ['Total calls', tokenStats.totalCalls?.toLocaleString() || '0', C.jiff],
            ['Total tokens', tokenStats.totalTokens?.toLocaleString() || '0', C.purple],
            ['Input tokens', tokenStats.inputTokens?.toLocaleString() || '0', C.green],
            ['Output tokens', tokenStats.outputTokens?.toLocaleString() || '0', C.gold],
            ['Today calls', tokenStats.todayCalls?.toLocaleString() || '0', C.jiff],
            ['Today tokens', tokenStats.todayTokens?.toLocaleString() || '0', C.purple],
          ].map(([label,val,color])=>(
            <div key={label} style={{background:C.warm,border:'1px solid '+C.border,borderRadius:10,padding:'12px 14px'}}>
              <div style={{fontFamily:"'Fraunces',serif",fontSize:22,fontWeight:700,color}}>{val}</div>
              <div style={{fontSize:10,color:C.muted,marginTop:2}}>{label}</div>
            </div>
          ))}
        </div>

        {/* Per-endpoint breakdown */}
        {tokenStats.byEndpoint?.length > 0 && (
          <div style={{marginBottom:16}}>
            <div style={{fontSize:11,letterSpacing:'1.5px',textTransform:'uppercase',color:C.muted,fontWeight:500,marginBottom:10}}>By endpoint</div>
            {tokenStats.(byEndpoint||[]).map((row,i)=>(
              <div key={i} style={{display:'grid',gridTemplateColumns:'120px 80px 100px 100px 1fr',gap:8,
                padding:'8px 0',borderBottom:'1px solid rgba(28,10,0,0.05)',fontSize:12}}>
                <code style={{color:C.jiff}}>{row.endpoint}</code>
                <span style={{color:C.muted,fontSize:11}}>{row.calls} calls</span>
                <span style={{color:C.muted,fontSize:11}}>{row.input_tokens?.toLocaleString()} in</span>
                <span style={{color:C.muted,fontSize:11}}>{row.output_tokens?.toLocaleString()} out</span>
                <div style={{background:'rgba(28,10,0,0.06)',borderRadius:4,height:8,alignSelf:'center'}}>
                  <div style={{height:'100%',borderRadius:4,background:C.jiff,
                    width:`${Math.min(100,(row.total_tokens/(tokenStats.totalTokens||1))*100)}%`}}/>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Cost estimate */}
        <div style={{padding:'10px 14px',background:'rgba(255,184,0,0.07)',border:'1px solid rgba(255,184,0,0.2)',borderRadius:8,fontSize:12}}>
          <div style={{fontWeight:500,color:'#854F0B',marginBottom:4}}>Estimated cost (Anthropic pricing)</div>
          <div style={{color:C.muted,fontWeight:300}}>
            claude-opus-4-5: $3/M input · $15/M output &nbsp;|&nbsp;
            claude-haiku-4-5: $0.25/M input · $1.25/M output
          </div>
          {tokenStats.costEstimateUSD !== undefined && (
            <div style={{marginTop:6,fontSize:14,fontWeight:600,color:'#854F0B'}}>
              ~${tokenStats.costEstimateUSD} USD total
            </div>
          )}
        </div>
      </>
    )}
  </Card>

  {/* Setup guide */}
  <Card title="Setup — token_usage table">
    <div style={{fontSize:12,color:C.muted,fontWeight:300,lineHeight:1.7,marginBottom:10}}>
      Token usage is stored in Supabase. Run Phase 7 SQL from <code style={{fontSize:11,background:'rgba(28,10,0,0.06)',padding:'1px 5px',borderRadius:3}}>SUPABASE_SETUP.md</code> to create the table.
    </div>
    {[
      ['Table','token_usage — one row per Claude API call'],
      ['Columns','endpoint, model, input_tokens, output_tokens, total_tokens, logged_at'],
      ['Logged from','api/suggest.js (recipes) — extend to planner.js and comms.js as needed'],
      ['RLS','Service role only — no public access'],
      ['Cleanup','Add a scheduled job: DELETE FROM token_usage WHERE logged_at < now() - interval \'90 days\''],
    ].map(([k,v])=>(
      <div key={k} style={{display:'flex',gap:10,padding:'6px 0',borderBottom:'1px solid rgba(28,10,0,0.05)',fontSize:11}}>
        <span style={{minWidth:100,fontWeight:500,color:C.ink,flexShrink:0}}>{k}</span>
        <span style={{color:C.muted,fontWeight:300}}>{v}</span>
      </div>
    ))}
  </Card>
    </>
  );
}
