// src/pages/admin/tabs/rls.jsx — Admin tab component
// Props received from AdminShell: C, Card, ADMIN_KEY, adminKey, stats, users,
//   waitlist, feedback, releases, loading, premiumStatus, lookerUrl,
//   tokenStats, rlsStatus, setStats, setUsers, setWaitlist, setFeedback,
//   setReleases, setLoading, setPremiumStatus, setLookerUrl,
//   setTokenStats, setRlsStatus, activeTab

export default function Tab_RLS({{ C, Card, ADMIN_KEY, adminKey, setAdminKey,
  stats, setStats, users, setUsers, waitlist, setWaitlist,
  feedback, setFeedback, releases, setReleases, loading, setLoading,
  premiumStatus, setPremiumStatus, lookerUrl, setLookerUrl,
  tokenStats, setTokenStats, rlsStatus, setRlsStatus }}) {{
  return (
    <>
<>
  <Card title="Supabase Row Level Security — live audit">
    <div style={{fontSize:12,color:C.muted,fontWeight:300,marginBottom:12,lineHeight:1.6}}>
      Tests each table with the anonymous key (what an unauthenticated attacker can see).
      Every table should return 0 rows. Run after any schema change.
    </div>
    <button onClick={async ()=>{
      const sbUrl = process.env.REACT_APP_SUPABASE_URL;
      const anonKey = process.env.REACT_APP_SUPABASE_ANON_KEY;
      if (!sbUrl || !anonKey) { setRlsStatus({error:'REACT_APP_SUPABASE_URL or REACT_APP_SUPABASE_ANON_KEY not set'}); return; }
      const tables = ['profiles','pantry','favourites','meal_history','feedback','api_keys','broadcasts','releases','video_cache','token_usage'];
      const results = await Promise.all(tables.map(async t => {
        try {
          const r = await fetch(`${sbUrl}/rest/v1/${t}?limit=1`, {
            headers: { 'apikey': anonKey, 'Authorization': `Bearer ${anonKey}` }
          });
          const data = await r.json();
          const count = Array.isArray(data) ? data.length : (data?.code ? 'ERROR' : '?');
          return { table: t, status: r.status, count, safe: r.status === 401 || (r.status === 200 && count === 0), rawCode: data?.code||'' };
        } catch(e) { return { table: t, status: 'ERR', count: 'ERR', safe: false }; }
      }));
      setRlsStatus({ results, testedAt: new Date().toLocaleTimeString() });
    }} style={{background:C.jiff,color:'white',border:'none',borderRadius:8,padding:'8px 16px',
      fontSize:12,fontWeight:600,cursor:'pointer',marginBottom:16,fontFamily:"'DM Sans',sans-serif"}}>
      Run RLS audit
    </button>

    {rlsStatus?.error && (
      <div style={{padding:'10px 14px',background:'rgba(229,62,62,0.08)',border:'1px solid rgba(229,62,62,0.2)',borderRadius:8,fontSize:12,color:C.red}}>
        {rlsStatus.error}
      </div>
    )}

    {rlsStatus?.results && (
      <>
        <div style={{fontSize:11,color:C.muted,marginBottom:10}}>
          Tested at {rlsStatus.testedAt} with anon key (no auth)
        </div>
        {rlsStatus.results.map((r,i)=>(
          <div key={i} style={{display:'grid',gridTemplateColumns:'160px 60px 80px 1fr',gap:8,
            padding:'8px 0',borderBottom:'1px solid rgba(28,10,0,0.05)',fontSize:12,alignItems:'center'}}>
            <code style={{color:C.ink,fontSize:11}}>{r.table}</code>
            <span style={{fontSize:11,color:C.muted}}>HTTP {r.status}</span>
            <span style={{fontSize:11,fontWeight:600,color:r.safe?C.green:C.red}}>
              {r.safe ? '✓ Safe' : `⚠ ${r.count} rows`}
            </span>
            <span style={{fontSize:10,color:C.muted}}>{r.safe ? 'Blocked as expected' : 'EXPOSED — add RLS policy'}</span>
          </div>
        ))}
        <div style={{marginTop:12,padding:'10px 14px',
          background: rlsStatus.results.every(r=>r.safe) ? 'rgba(29,158,117,0.08)' : 'rgba(229,62,62,0.08)',
          border: '1px solid ' + (rlsStatus.results.every(r=>r.safe) ? 'rgba(29,158,117,0.25)' : 'rgba(229,62,62,0.2)'),
          borderRadius:8,fontSize:12,
          color: rlsStatus.results.every(r=>r.safe) ? C.green : C.red}}>
          {rlsStatus.results.every(r=>r.safe)
            ? '✓ All tables protected — no data exposed to unauthenticated requests'
            : `⚠ ${rlsStatus.results.filter(r=>!r.safe).length} table(s) exposed — run Phase 8 SQL in SUPABASE_SETUP.md`}
        </div>
      </>
    )}
  </Card>

  <Card title="RLS policies — what each table should enforce">
    {[
      ['profiles',     'auth.uid() = id',                    'Users can only see their own profile'],
      ['pantry',       'auth.uid() = user_id',               'Users can only see their own pantry'],
      ['favourites',   'auth.uid() = user_id',               'Users can only see their own favourites'],
      ['meal_history', 'auth.uid() = user_id',               'Users can only see their own history'],
      ['feedback',     'Service role only',                  'Feedback write-only for users, read via service role'],
      ['api_keys',     'Service role only',                  'Never exposed to client'],
      ['broadcasts',   'SELECT: true (public read)',         'Broadcasts are readable by all authenticated users'],
      ['releases',     'SELECT: true (public read)',         'Release notes readable by all'],
      ['video_cache',  'Service role only',                  'Cache managed server-side only'],
      ['token_usage',  'Service role only',                  'Token logs never exposed to client'],
    ].map(([table,policy,note])=>(
      <div key={table} style={{display:'grid',gridTemplateColumns:'130px 220px 1fr',gap:8,
        padding:'7px 0',borderBottom:'1px solid rgba(28,10,0,0.05)',fontSize:11}}>
        <code style={{color:C.jiff}}>{table}</code>
        <code style={{color:C.muted,fontSize:10}}>{policy}</code>
        <span style={{color:C.muted,fontWeight:300}}>{note}</span>
      </div>
    ))}
    <div style={{marginTop:12,fontSize:11,color:C.muted,lineHeight:1.7}}>
      Run Phase 8 SQL from <code style={{fontSize:10,background:'rgba(28,10,0,0.06)',padding:'1px 5px',borderRadius:3}}>SUPABASE_SETUP.md</code> to create all required policies. Re-run this audit after applying.
    </div>
  </Card>

  <Card title="Security checklist — all layers">
    {[
      [true,  'ANTHROPIC_API_KEY',         'Server-side only — never in client bundle (check with browser devtools)'],
      [true,  'YOUTUBE_API_KEY',            'Server-side only — api/videos.js only'],
      [true,  'SUPABASE_SERVICE_ROLE_KEY',  'Server-side only — api/admin.js and api/suggest.js'],
      [true,  'RAZORPAY_KEY_SECRET',        'Server-side only — api/payments.js only'],
      [true,  'Content-Security-Policy',    'CSP headers set in vercel.json — blocks XSS'],
      [true,  'HTTPS only',                 'Vercel enforces HTTPS — no plain HTTP'],
      [null,  'RLS on all tables',          'Run audit above to verify — check after each schema change'],
      [null,  'Premium server-verified',    'Premium status synced to Supabase profiles — not localStorage only'],
      [null,  'Rate limiting',              'api/suggest.js enforces per-key daily limits via api_keys table'],
      [false, 'CORS headers',               'Not explicitly set — Vercel defaults allow all origins on API routes'],
    ].map(([ok,label,desc],i)=>(
      <div key={i} style={{display:'flex',gap:10,padding:'6px 0',borderBottom:'1px solid rgba(28,10,0,0.05)',fontSize:12}}>
        <span style={{fontSize:14,flexShrink:0}}>
          {ok===true?'✅':ok===false?'⚠️':'🔲'}
        </span>
        <span style={{fontWeight:500,color:C.ink,minWidth:200,flexShrink:0}}>{label}</span>
        <span style={{color:C.muted,fontWeight:300,fontSize:11}}>{desc}</span>
      </div>
    ))}
  </Card>
</>
    </>
  );
}
