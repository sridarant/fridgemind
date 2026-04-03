// src/pages/admin/tabs/analytics.jsx — Admin tab component
// Props received from AdminShell: C, Card, ADMIN_KEY, adminKey, stats, users,
//   waitlist, feedback, releases, loading, premiumStatus, lookerUrl,
//   tokenStats, rlsStatus, setStats, setUsers, setWaitlist, setFeedback,
//   setReleases, setLoading, setPremiumStatus, setLookerUrl,
//   setTokenStats, setRlsStatus, activeTab

export default function Tab_ANALYTICS({ C, Card, ADMIN_KEY, adminKey, setAdminKey,
  stats, setStats, users, setUsers, waitlist, setWaitlist,
  feedback, setFeedback, releases, setReleases, loading, setLoading,
  premiumStatus, setPremiumStatus, lookerUrl, setLookerUrl,
  tokenStats, setTokenStats, rlsStatus, setRlsStatus }) {{
  return (
    <>
  {/* GA4 property info */}
  <Card title="Google Analytics 4 — Property">
    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,marginBottom:14}}>
      {[['Measurement ID','G-ERSLLHSXCL'],['Property','Jiff (Production)'],
        ['Status','Active — tracking live'],['Version','GA4 (gtag.js)']].map(([k,v])=>(
        <div key={k} style={{background:'rgba(28,10,0,0.02)',border:'1px solid '+C.border,borderRadius:8,padding:'10px 12px'}}>
          <div style={{fontSize:10,color:C.muted,fontWeight:500,marginBottom:3,textTransform:'uppercase',letterSpacing:'1px'}}>{k}</div>
          <div style={{fontSize:12,fontWeight:500,color:C.ink}}>{v}</div>
        </div>
      ))}
    </div>
    <div style={{display:'flex',flexWrap:'wrap',gap:8}}>
      {[
        ['Open GA4 Dashboard','https://analytics.google.com/'],
        ['Realtime report','https://analytics.google.com/analytics/web/#/realtime'],
        ['Engagement report','https://analytics.google.com/analytics/web/#/report/content-pages'],
        ['Acquisition report','https://analytics.google.com/analytics/web/#/acquisition/overview'],
        ['Conversions','https://analytics.google.com/analytics/web/#/report/conversions-goals-overview'],
      ].map(([label,url])=>(
        <a key={label} href={url} target="_blank" rel="noreferrer"
          style={{display:'inline-block',padding:'7px 12px',background:'rgba(255,69,0,0.07)',
            color:C.jiff,border:'1px solid rgba(255,69,0,0.2)',borderRadius:8,
            fontSize:11,fontWeight:500,textDecoration:'none',fontFamily:"'DM Sans',sans-serif"}}>
          {label} ↗
        </a>
      ))}
    </div>
  </Card>

  {/* Looker Studio embed */}
  <Card title="Looker Studio — Embedded Report">
    <div style={{fontSize:12,color:C.muted,fontWeight:300,marginBottom:12,lineHeight:1.7}}>
      Paste a <strong style={{color:C.ink}}>Looker Studio embed URL</strong> below to display your GA4 report here.
      In Looker Studio: File → Embed report → copy the embed URL (not the share link).
      Make sure <strong style={{color:C.ink}}>Report access</strong> is set to <strong style={{color:C.ink}}>Anyone with the link → Viewer</strong>.
    </div>
    <div style={{display:'flex',gap:8,marginBottom:lookerUrl?12:0}}>
      <input
        value={lookerUrl}
        onChange={e=>setLookerUrl(e.target.value)}
        placeholder="https://lookerstudio.google.com/embed/reporting/..."
        style={{flex:1,padding:'9px 12px',border:'1.5px solid '+C.borderMid,borderRadius:8,
          fontSize:12,fontFamily:"'DM Sans',sans-serif",color:C.ink,background:C.cream}}
      />
      <button onClick={async ()=>{
        try { localStorage.setItem('jiff-looker-url', lookerUrl); } catch {}
        // Also persist to Supabase for cross-device admin access
        try {
          await fetch('/api/admin?action=save-setting', {
            method:'POST', headers:{'Content-Type':'application/json'},
            body: JSON.stringify({ key:'looker_url', value: lookerUrl, adminKey:'jiff-admin-2026' })
          });
        } catch {}
      }} style={{background:C.jiff,color:'white',border:'none',borderRadius:8,
        padding:'9px 14px',fontSize:12,fontWeight:600,cursor:'pointer',fontFamily:"'DM Sans',sans-serif",whiteSpace:'nowrap'}}>
        Save URL
      </button>
      {lookerUrl && (
        <button onClick={()=>{
          setLookerUrl('');
          try { localStorage.removeItem('jiff-looker-url'); } catch {}
        }} style={{background:'rgba(229,62,62,0.08)',color:C.red,border:'1px solid rgba(229,62,62,0.2)',
          borderRadius:8,padding:'9px 14px',fontSize:12,cursor:'pointer',fontFamily:"'DM Sans',sans-serif"}}>
          Clear
        </button>
      )}
    </div>
    {lookerUrl ? (
      <div style={{borderRadius:12,overflow:'hidden',border:'1px solid '+C.border,marginTop:8}}>
        <iframe
          src={lookerUrl}
          title="Looker Studio Analytics"
          style={{width:'100%',height:520,border:'none',display:'block'}}
          allowFullScreen
          sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
        />
      </div>
    ) : (
      <div style={{padding:'32px',textAlign:'center',background:'rgba(28,10,0,0.02)',
        border:'1px dashed rgba(28,10,0,0.12)',borderRadius:12,marginTop:8}}>
        <div style={{fontSize:28,marginBottom:8}}>📊</div>
        <div style={{fontSize:13,color:C.muted,fontWeight:300}}>No Looker Studio URL saved yet.</div>
        <div style={{fontSize:11,color:C.muted,fontWeight:300,marginTop:4}}>
          Create a free report at <a href="https://lookerstudio.google.com" target="_blank" rel="noreferrer"
            style={{color:C.jiff,textDecoration:'none'}}>lookerstudio.google.com</a> connecting your GA4 property, then paste the embed URL above.
        </div>
      </div>
    )}
  </Card>

  {/* Events we track */}
  <Card title="Events tracked in Jiff">
    <div style={{fontSize:12,color:C.muted,fontWeight:300,marginBottom:12,lineHeight:1.6}}>
      These GA4 events are fired automatically via <code style={{fontSize:11,background:'rgba(28,10,0,0.06)',padding:'1px 5px',borderRadius:3}}>window.gtag()</code> or via GA4 automatic measurement.
    </div>
    {[
      {event:'page_view',         trigger:'Every route change (GA4 automatic)',       where:'All pages'},
      {event:'session_start',     trigger:'New session begins (GA4 automatic)',       where:'App init'},
      {event:'first_visit',       trigger:'First time user visits (GA4 automatic)',   where:'Landing'},
      {event:'user_engagement',   trigger:'10s+ on page (GA4 automatic)',             where:'All pages'},
      {event:'scroll',            trigger:'90% page scroll (GA4 enhanced measurement)',where:'Landing, Pricing'},
      {event:'click (outbound)',  trigger:'External link clicks (GA4 enhanced)',      where:'All pages'},
      {event:'purchase',          trigger:'Razorpay payment success',                 where:'Pricing'},
      {event:'sign_up',           trigger:'New Supabase auth registration',           where:'Auth gate'},
      {event:'login',             trigger:'Returning user sign-in',                   where:'Auth gate'},
    ].map(ev=>(
      <div key={ev.event} style={{display:'grid',gridTemplateColumns:'160px 1fr 120px',gap:8,
        padding:'7px 0',borderBottom:'1px solid rgba(28,10,0,0.05)',fontSize:11}}>
        <code style={{color:C.jiff,fontFamily:'monospace'}}>{ev.event}</code>
        <span style={{color:C.muted,fontWeight:300}}>{ev.trigger}</span>
        <span style={{color:C.ink,fontWeight:400,fontSize:10}}>{ev.where}</span>
      </div>
    ))}
    <div style={{marginTop:12,padding:'8px 12px',background:'rgba(29,158,117,0.07)',
      border:'1px solid rgba(29,158,117,0.18)',borderRadius:8,fontSize:11,color:'#0D6B50'}}>
      💡 To add custom events (e.g. recipe_generated, cuisine_selected), call <code style={{fontSize:10}}>window._jiffGA?.('event_name', {'{'}param: value{'}'}) </code> from any component.
    </div>
  </Card>

  {/* Setup guide */}
  <Card title="Looker Studio setup — quick guide">
    {[
      ['1','Go to lookerstudio.google.com and sign in with the same Google account as your GA4 property.'],
      ['2','Click Create → Report. Add data source → Google Analytics → select your Jiff property.'],
      ['3','Design your dashboard — add Date Range, Scorecards (users, sessions, bounce rate), Line chart (sessions over time), Table (top pages).'],
      ['4','Click Share → Manage access → set to Anyone with the link → Viewer.'],
      ['5','Click File → Embed report. Copy the embed URL (starts with https://lookerstudio.google.com/embed/reporting/...).'],
      ['6','Paste the embed URL into the field above and click Save URL.'],
    ].map(([n,text])=>(
      <div key={n} style={{display:'flex',gap:10,padding:'8px 0',borderBottom:'1px solid rgba(28,10,0,0.05)'}}>
        <span style={{width:20,height:20,borderRadius:'50%',background:C.jiff,color:'white',
          fontSize:10,fontWeight:700,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,marginTop:1}}>{n}</span>
        <span style={{fontSize:12,color:C.muted,fontWeight:300,lineHeight:1.6}}>{text}</span>
      </div>
    ))}
  </Card>
    </>
  );
}
