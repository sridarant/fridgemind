// src/pages/admin/tabs/status.jsx — Admin tab component
// Props received from AdminShell: C, Card, ADMIN_KEY, adminKey, stats, users,
//   waitlist, feedback, releases, loading, premiumStatus, lookerUrl,
//   tokenStats, rlsStatus, setStats, setUsers, setWaitlist, setFeedback,
//   setReleases, setLoading, setPremiumStatus, setLookerUrl,
//   setTokenStats, setRlsStatus, activeTab

export default function Tab_STATUS({{ C, Card, ADMIN_KEY, adminKey, setAdminKey,
  stats, setStats, users, setUsers, waitlist, setWaitlist,
  feedback, setFeedback, releases, setReleases, loading, setLoading,
  premiumStatus, setPremiumStatus, lookerUrl, setLookerUrl,
  tokenStats, setTokenStats, rlsStatus, setRlsStatus }}) {{
  return (
    <>
<>
  <Card title="Service Status">
    {[
      { name:'Vercel (Hosting)',  icon:'▲', detail:'jiff-ecru.vercel.app' },
      { name:'Supabase DB',       icon:'🐘', detail:'Supabase PostgreSQL 15' },
      { name:'Anthropic API',     icon:'🤖', detail:'claude-haiku + claude-opus' },
      { name:'Razorpay',          icon:'💳', detail:'Payments — India only' },
      { name:'WhatsApp Bot',      icon:'💬', detail:'Meta WhatsApp Cloud API v18' },
    ].map((svc, i) => (
      <div key={i} style={{display:'flex',alignItems:'center',gap:12,padding:'10px 0',borderBottom:'1px solid rgba(28,10,0,0.05)'}}>
        <span style={{fontSize:20,flexShrink:0}}>{svc.icon}</span>
        <div style={{flex:1}}>
          <div style={{fontSize:13,fontWeight:500,color:C.ink}}>{svc.name}</div>
          <div style={{fontSize:11,color:C.muted,fontWeight:300}}>{svc.detail}</div>
        </div>
        <StatusBadge id={i} supabaseEnabled={supabaseEnabled} />
      </div>
    ))}
  </Card>
  <Card title="Environment">
    {[
      ['ANTHROPIC_API_KEY',         'Server-side only — verify in Vercel dashboard'],
      ['REACT_APP_SUPABASE_URL',     supabaseEnabled ? '✅ Configured' : '❌ Missing — add to Vercel env vars'],
      ['SUPABASE_SERVICE_ROLE_KEY',  supabaseEnabled ? '✅ Present (enables admin data)' : '⚠️ Missing — Users/Feedback tabs need this'],
      ['RAZORPAY_KEY_SECRET',        'Server-side only — verify in Vercel dashboard'],
      ['WHATSAPP_ACCESS_TOKEN',      'Server-side only — verify in Vercel dashboard'],
      ['MAILCHIMP_API_KEY',          'Server-side only — verify in Vercel dashboard'],
    ].map(([k,v])=>(
      <div key={k} style={{display:'flex',gap:12,padding:'8px 0',borderBottom:'1px solid rgba(28,10,0,0.04)',alignItems:'flex-start'}}>
        <code style={{fontSize:11,background:'rgba(28,10,0,0.06)',padding:'2px 8px',borderRadius:4,minWidth:180,flexShrink:0,lineHeight:1.8}}>{k}</code>
        <span style={{fontSize:12,color:v.startsWith('✅')?C.green:v.startsWith('❌')?C.red:v.startsWith('⚠️')?'#854F0B':C.muted,fontWeight:300}}>{v}</span>
      </div>
    ))}
  </Card>
</>
        )}

        {/* CI/CD */}
        {activeTab==='cicd' && (
<>
  <Card title="CI/CD Pipeline">
    <div style={{display:'flex',flexDirection:'column',gap:0}}>
      {[
        { step:'1', label:'Developer pushes to GitHub (main branch)', icon:'💻', status:'auto', detail:'git add . → git commit → git push origin main' },
        { step:'2', label:'GitHub triggers Vercel webhook', icon:'🔗', status:'auto', detail:'Automatic — Vercel listens to GitHub push events' },
        { step:'3', label:'Vercel runs npm install', icon:'📦', status:'auto', detail:'Installs 267 packages from package.json' },
        { step:'4', label:'ESLint static analysis', icon:'🔍', status:'auto', detail:'react-scripts build runs ESLint — fails on syntax errors' },
        { step:'5', label:'React production build', icon:'⚙️', status:'auto', detail:'Webpack bundles src/ → optimised static files in build/' },
        { step:'6', label:'Vercel deploys to Edge CDN', icon:'🌍', status:'auto', detail:'Deployed to 50+ edge locations globally in ~30 seconds' },
        { step:'7', label:'Serverless functions deployed', icon:'⚡', status:'auto', detail:'api/*.js → 9 Vercel serverless functions (Node.js 18)' },
        { step:'8', label:'Playwright E2E tests (optional)', icon:'🧪', status:'manual', detail:'Run manually: npx playwright test — 84 tests in tests/jiff.spec.js' },
      ].map((s,i)=>(
        <div key={i} style={{display:'flex',gap:12,padding:'12px 0',borderBottom:'1px solid rgba(28,10,0,0.05)',alignItems:'flex-start'}}>
          <div style={{width:28,height:28,borderRadius:'50%',background:s.status==='auto'?C.green:'rgba(255,184,0,0.2)',color:s.status==='auto'?'white':'#854F0B',display:'flex',alignItems:'center',justifyContent:'center',fontSize:11,fontWeight:700,flexShrink:0}}>
            {s.step}
          </div>
          <div style={{flex:1}}>
            <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:3}}>
              <span style={{fontSize:14}}>{s.icon}</span>
              <span style={{fontSize:13,fontWeight:500,color:C.ink}}>{s.label}</span>
              <span style={{fontSize:10,padding:'1px 7px',borderRadius:20,background:s.status==='auto'?'rgba(29,158,117,0.1)':'rgba(255,184,0,0.15)',color:s.status==='auto'?C.green:'#854F0B',fontWeight:500,marginLeft:'auto',flexShrink:0}}>{s.status==='auto'?'Auto':'Manual'}</span>
            </div>
            <div style={{fontSize:11,color:C.muted,fontWeight:300}}>{s.detail}</div>
          </div>
        </div>
      ))}
    </div>
  </Card>
  <Card title="GitHub Actions (Optional)">
    <div style={{fontSize:12,color:C.muted,fontWeight:300,lineHeight:1.7,marginBottom:12}}>
      The repo includes <code>.github/workflows/e2e.yml</code> for automated Playwright tests.
      To activate: add <code>VERCEL_URL</code> secret in GitHub → Settings → Secrets.
    </div>
    {[
      ['Trigger','Push to main + pull requests'],
      ['Tests','84 Playwright E2E tests'],
      ['Report','HTML report uploaded as artifact'],
      ['Status','Workflow file ready — requires VERCEL_URL secret to activate'],
    ].map(([k,v])=>(
      <div key={k} style={{display:'flex',gap:12,padding:'7px 0',borderBottom:'1px solid rgba(28,10,0,0.04)'}}>
        <span style={{fontSize:12,color:C.muted,minWidth:80,flexShrink:0,fontWeight:300}}>{k}</span>
        <span style={{fontSize:12,color:C.ink}}>{v}</span>
      </div>
    ))}
  </Card>
</>
    </>
  );
}
