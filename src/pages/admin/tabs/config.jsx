// src/pages/admin/tabs/config.jsx — Admin tab component
// Props received from AdminShell: C, Card, ADMIN_KEY, adminKey, stats, users,
//   waitlist, feedback, releases, loading, premiumStatus, lookerUrl,
//   tokenStats, rlsStatus, setStats, setUsers, setWaitlist, setFeedback,
//   setReleases, setLoading, setPremiumStatus, setLookerUrl,
//   setTokenStats, setRlsStatus, activeTab

export default function Tab_CONFIG({ C, Card, ADMIN_KEY, adminKey, setAdminKey,
  stats, setStats, users, setUsers, waitlist, setWaitlist,
  feedback, setFeedback, releases, setReleases, loading, setLoading,
  premiumStatus, setPremiumStatus, lookerUrl, setLookerUrl,
  tokenStats, setTokenStats, rlsStatus, setRlsStatus }) {{
  return (
    <>
<div style={{display:'flex',flexDirection:'column',gap:20}}>

  {/* Vercel */}
  <div style={{background:'white',border:'1px solid '+C.border,borderRadius:16,overflow:'hidden',boxShadow:C.shadow}}>
    <div style={{padding:'14px 20px',background:'#000',display:'flex',alignItems:'center',gap:10}}>
      <span style={{fontSize:20}}>▲</span>
      <span style={{fontFamily:"'Fraunces',serif",fontSize:15,fontWeight:700,color:'white'}}>Vercel</span>
      <span style={{fontSize:11,color:'rgba(255,255,255,0.5)',marginLeft:'auto'}}>Hosting + Serverless</span>
    </div>
    <div style={{padding:'16px 20px'}}>
      <div style={{fontSize:11,letterSpacing:'1.5px',textTransform:'uppercase',color:C.muted,fontWeight:500,marginBottom:10}}>Environment Variables</div>
      {[
        ['ANTHROPIC_API_KEY','sk-ant-...','Required — recipe generation'],
        ['REACT_APP_SUPABASE_URL','https://xxx.supabase.co','Required — database'],
        ['REACT_APP_SUPABASE_ANON_KEY','eyJ...','Required — public auth'],
        ['SUPABASE_SERVICE_ROLE_KEY','eyJ...','Server-side only, NOT prefixed REACT_APP_'],
        ['RAZORPAY_KEY_ID','rzp_live_...','Payments (India)'],
        ['RAZORPAY_KEY_SECRET','...','Server-side only'],
        ['REACT_APP_RAZORPAY_KEY_ID','rzp_live_...','Client-side key'],
        ['YOUTUBE_API_KEY','AIzaSy… (see SETUP.md)','Server-side only — inline recipe videos'],
        ['WHATSAPP_ACCESS_TOKEN','EAAx...','WhatsApp bot'],
        ['WHATSAPP_VERIFY_TOKEN','jiff-whatsapp-2026','Change this'],
        ['WHATSAPP_PHONE_NUMBER_ID','123...','From Meta dashboard'],
        ['MAILCHIMP_API_KEY','abc...','Email capture'],
        ['MAILCHIMP_LIST_ID','abc123','Audience ID'],
        ['MAILCHIMP_SERVER_PREFIX','us21','e.g. us21'],
      ].map(([key, eg, note]) => (
        <div key={key} style={{display:'grid',gridTemplateColumns:'240px 180px 1fr',gap:8,padding:'7px 0',borderBottom:'1px solid rgba(28,10,0,0.04)',alignItems:'center'}}>
          <code style={{fontSize:11,background:'rgba(28,10,0,0.06)',padding:'2px 7px',borderRadius:4,fontFamily:'monospace'}}>{key}</code>
          <span style={{fontSize:11,color:C.muted,fontFamily:'monospace'}}>{eg}</span>
          <span style={{fontSize:11,color:C.muted,fontWeight:300}}>{note}</span>
        </div>
      ))}
      <div style={{marginTop:12,padding:'8px 12px',background:'rgba(0,0,0,0.03)',borderRadius:8,fontSize:11,color:C.muted}}>
        Add at: <strong>vercel.com → Project → Settings → Environment Variables</strong>. Redeploy after changes.
      </div>
    </div>
  </div>

  
  {/* YouTube API live status */}
  <div style={{background:'white',border:'1px solid '+C.border,borderRadius:16,padding:'16px 20px'}}>
    <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:10}}>
      <div>
        <div style={{fontFamily:"'Fraunces',serif",fontSize:14,fontWeight:700,color:C.ink}}>YouTube API — live status</div>
        <div style={{fontSize:11,color:C.muted,fontWeight:300,marginTop:2}}>Checks YOUTUBE_API_KEY in this Vercel deployment</div>
      </div>
      <button onClick={async()=>{
        const el=document.getElementById('yt-diag');
        if(el)el.textContent='Checking…';
        try{
          const r=await fetch('/api/videos?check=true');
          const d=await r.json();
          if(el)el.innerHTML=d.youtube_key_set
            ?'<span style="color:#1D9E75;font-weight:500">✓ Configured — '+d.key_preview+'</span>'
            :'<span style="color:#E53E3E;font-weight:500">✗ YOUTUBE_API_KEY missing from Vercel env vars</span><br><small style="color:#7C6A5E">Add: YOUTUBE_API_KEY = AIzaSyC1GBGUfhOZRBzaJVRAPmVHC_wjEn2UA7A</small>';
        }catch(e){if(el)el.textContent='Error: '+e.message;}
      }} style={{background:'#FF4500',color:'white',border:'none',borderRadius:8,padding:'7px 14px',fontSize:12,fontWeight:600,cursor:'pointer',fontFamily:"'DM Sans',sans-serif"}}>
        Check now
      </button>
    </div>
    <div id="yt-diag" style={{fontSize:12,color:'#7C6A5E',lineHeight:1.6}}>
      Click to verify. Without the key, video buttons show a YouTube search link fallback instead of inline playback.
    </div>
  </div>

  {/* Supabase */}
  <div style={{background:'white',border:'1px solid '+C.border,borderRadius:16,overflow:'hidden',boxShadow:C.shadow}}>
    <div style={{padding:'14px 20px',background:'#3ECF8E',display:'flex',alignItems:'center',gap:10}}>
      <span style={{fontSize:20}}>🐘</span>
      <span style={{fontFamily:"'Fraunces',serif",fontSize:15,fontWeight:700,color:'white'}}>Supabase</span>
      <span style={{fontSize:11,color:'rgba(255,255,255,0.75)',marginLeft:'auto'}}>Database + Auth</span>
    </div>
    <div style={{padding:'16px 20px'}}>
      <div style={{fontSize:11,letterSpacing:'1.5px',textTransform:'uppercase',color:C.muted,fontWeight:500,marginBottom:10}}>Setup Phases</div>
      {[
        ['Phase 1','profiles, pantry, favourites tables + trigger','Required'],
        ['Phase 2','meal_history table','Required'],
        ['Phase 3','feedback, api_keys tables + profile columns','For Admin'],
        ['Phase 4','broadcasts table + meal_history.rating column','For Notifications'],
        ['Phase 5','family_members, nutrition_goals columns + releases table','For v18 features'],
      ].map(([phase, desc, tag]) => (
        <div key={phase} style={{display:'flex',gap:10,padding:'8px 0',borderBottom:'1px solid rgba(28,10,0,0.04)',alignItems:'flex-start'}}>
          <span style={{fontSize:11,padding:'2px 8px',borderRadius:20,background:tag==='Required'?'rgba(62,207,142,0.12)':'rgba(28,10,0,0.06)',color:tag==='Required'?'#1a7a4a':C.muted,fontWeight:600,flexShrink:0,whiteSpace:'nowrap'}}>{phase}</span>
          <span style={{fontSize:12,color:C.ink,flex:1,fontWeight:300}}>{desc}</span>
          <span style={{fontSize:10,color:C.muted,flexShrink:0}}>{tag}</span>
        </div>
      ))}
      <div style={{marginTop:12,padding:'8px 12px',background:'rgba(62,207,142,0.07)',borderRadius:8,fontSize:11,color:'#1a7a4a'}}>
        Run SQL at: <strong>supabase.com → Project → SQL Editor</strong>. Full SQL in <code>SUPABASE_SETUP.md</code>.
      </div>
      <div style={{marginTop:8}}>
        <div style={{fontSize:11,letterSpacing:'1.5px',textTransform:'uppercase',color:C.muted,fontWeight:500,marginBottom:8,marginTop:12}}>Auth Setup</div>
        {[
          ['Google OAuth','supabase.com → Auth → Providers → Google → add Client ID + Secret from Google Cloud Console'],
          ['Email OTP','Enabled by default — users get magic link'],
          ['Redirect URL','Add: https://jiff-ecru.vercel.app/app to Supabase Auth → URL Configuration'],
        ].map(([label, desc]) => (
          <div key={label} style={{display:'flex',gap:10,padding:'7px 0',borderBottom:'1px solid rgba(28,10,0,0.04)'}}>
            <span style={{fontSize:11,fontWeight:600,color:C.ink,minWidth:100,flexShrink:0}}>{label}</span>
            <span style={{fontSize:11,color:C.muted,fontWeight:300}}>{desc}</span>
          </div>
        ))}
      </div>
    </div>
  </div>

  {/* WhatsApp */}
  <div style={{background:'white',border:'1px solid '+C.border,borderRadius:16,overflow:'hidden',boxShadow:C.shadow}}>
    <div style={{padding:'14px 20px',background:'#25D366',display:'flex',alignItems:'center',gap:10}}>
      <span style={{fontSize:20}}>💬</span>
      <span style={{fontFamily:"'Fraunces',serif",fontSize:15,fontWeight:700,color:'white'}}>WhatsApp Bot</span>
      <span style={{fontSize:11,color:'rgba(255,255,255,0.75)',marginLeft:'auto'}}>Meta Cloud API</span>
    </div>
    <div style={{padding:'16px 20px'}}>
      {[
        ['1. Meta App','developers.facebook.com → Create App → Business → Add WhatsApp product'],
        ['2. Phone Number','WhatsApp → Getting Started → Add/verify phone number → note Phone Number ID'],
        ['3. Access Token','Generate Permanent System User Token (not temporary)'],
        ['4. Webhook URL','Set to: https://jiff-ecru.vercel.app/api/whatsapp'],
        ['5. Verify Token','Set to: jiff-whatsapp-2026 (change in Vercel env + code)'],
        ['6. Subscribe','Subscribe to: messages field'],
        ['7. Env Vars','Add WHATSAPP_ACCESS_TOKEN, WHATSAPP_VERIFY_TOKEN, WHATSAPP_PHONE_NUMBER_ID to Vercel'],
        ['8. Test','Send "Hi Jiff! rice, dal, onion" to your WhatsApp number'],
      ].map(([step, desc]) => (
        <div key={step} style={{display:'flex',gap:10,padding:'7px 0',borderBottom:'1px solid rgba(28,10,0,0.04)'}}>
          <span style={{fontSize:11,fontWeight:600,color:'#128C7E',minWidth:90,flexShrink:0}}>{step}</span>
          <span style={{fontSize:11,color:C.muted,fontWeight:300}}>{desc}</span>
        </div>
      ))}
      <div style={{marginTop:10,padding:'8px 12px',background:'rgba(37,211,102,0.07)',borderRadius:8,fontSize:11,color:'#128C7E'}}>
        Full guide: <code>WHATSAPP_SETUP.md</code> in repo root. Free tier: 1,000 conversations/month.
      </div>
    </div>
  </div>

  {/* Razorpay */}
  <div style={{background:'white',border:'1px solid '+C.border,borderRadius:16,overflow:'hidden',boxShadow:C.shadow}}>
    <div style={{padding:'14px 20px',background:'#072654',display:'flex',alignItems:'center',gap:10}}>
      <span style={{fontSize:20}}>💳</span>
      <span style={{fontFamily:"'Fraunces',serif",fontSize:15,fontWeight:700,color:'white'}}>Razorpay</span>
      <span style={{fontSize:11,color:'rgba(255,255,255,0.5)',marginLeft:'auto'}}>Payments (India)</span>
    </div>
    <div style={{padding:'16px 20px'}}>
      {[
        ['1. Account','razorpay.com → Sign up → complete KYC (required for live payments)'],
        ['2. API Keys','Dashboard → Settings → API Keys → Generate Test/Live keys'],
        ['3. Key ID','Add as RAZORPAY_KEY_ID + REACT_APP_RAZORPAY_KEY_ID in Vercel'],
        ['4. Key Secret','Add as RAZORPAY_KEY_SECRET in Vercel (server-side only)'],
        ['5. Webhook','Optional: Dashboard → Webhooks → add endpoint for payment events'],
        ['Test card','4111 1111 1111 1111 · Expiry: any future date · CVV: any'],
      ].map(([step, desc]) => (
        <div key={step} style={{display:'flex',gap:10,padding:'7px 0',borderBottom:'1px solid rgba(28,10,0,0.04)'}}>
          <span style={{fontSize:11,fontWeight:600,color:'#072654',minWidth:90,flexShrink:0}}>{step}</span>
          <span style={{fontSize:11,color:C.muted,fontWeight:300}}>{desc}</span>
        </div>
      ))}
      <div style={{marginTop:10,padding:'8px 12px',background:'rgba(7,38,84,0.05)',borderRadius:8,fontSize:11,color:'#072654'}}>
        Plans: ₹99/mo · ₹799/yr · ₹2,999 lifetime. Change in <code>LocaleContext.jsx → CURRENCY_MAP</code>.
      </div>
    </div>
  </div>

  {/* Mailchimp */}
  <div style={{background:'white',border:'1px solid '+C.border,borderRadius:16,overflow:'hidden',boxShadow:C.shadow}}>
    <div style={{padding:'14px 20px',background:'#FFE01B',display:'flex',alignItems:'center',gap:10}}>
      <span style={{fontSize:20}}>🐵</span>
      <span style={{fontFamily:"'Fraunces',serif",fontSize:15,fontWeight:700,color:'#241C15'}}>Mailchimp</span>
      <span style={{fontSize:11,color:'rgba(36,28,21,0.6)',marginLeft:'auto'}}>Email + Drip</span>
    </div>
    <div style={{padding:'16px 20px'}}>
      {[
        ['1. Account','mailchimp.com → free for up to 500 contacts'],
        ['2. Audience','Audience → Create Audience → "Jiff Users"'],
        ['3. List ID','Audience → Settings → Audience ID → copy'],
        ['4. API Key','Account → Profile → Extras → API Keys → Create'],
        ['5. Server Prefix','From API key — last part e.g. "us21"'],
        ['6. Env Vars','Add MAILCHIMP_API_KEY, MAILCHIMP_LIST_ID, MAILCHIMP_SERVER_PREFIX to Vercel'],
        ['Tags applied','jiff-waitlist, source:landing/pricing'],
      ].map(([step, desc]) => (
        <div key={step} style={{display:'flex',gap:10,padding:'7px 0',borderBottom:'1px solid rgba(28,10,0,0.04)'}}>
          <span style={{fontSize:11,fontWeight:600,color:'#241C15',minWidth:90,flexShrink:0}}>{step}</span>
          <span style={{fontSize:11,color:C.muted,fontWeight:300}}>{desc}</span>
        </div>
      ))}
    </div>
  </div>

  {/* Admin key reminder */}
  <div style={{background:'rgba(229,62,62,0.05)',border:'1px solid rgba(229,62,62,0.2)',borderRadius:16,padding:'16px 20px'}}>
    <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:10}}>
      <span style={{fontSize:18}}>🔑</span>
      <span style={{fontFamily:"'Fraunces',serif",fontSize:14,fontWeight:700,color:C.red}}>Before going live</span>
    </div>
    {[
      'Change admin key from "jiff-admin-2026" in Admin.jsx (ADMIN_KEY constant)',
      'Change WhatsApp verify token from "jiff-whatsapp-2026" in api/whatsapp.js + Vercel env',
      'Switch Razorpay from test keys to live keys (requires KYC completion)',
      'Run npm audit in repo to check for vulnerable dependencies',
      'Add Content-Security-Policy headers in vercel.json',
    ].map((item, i) => (
      <div key={i} style={{display:'flex',gap:8,padding:'6px 0',borderBottom:'1px solid rgba(229,62,62,0.08)',fontSize:12,color:C.ink,fontWeight:300}}>
        <span style={{color:C.red,flexShrink:0}}>⚠</span>{item}
      </div>
    ))}
  </div>

</div>
    </>
  );
}
