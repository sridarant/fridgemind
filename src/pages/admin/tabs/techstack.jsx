// src/pages/admin/tabs/techstack.jsx — Admin tab component
// Props received from AdminShell: C, Card, ADMIN_KEY, adminKey, stats, users,
//   waitlist, feedback, releases, loading, premiumStatus, lookerUrl,
//   tokenStats, rlsStatus, setStats, setUsers, setWaitlist, setFeedback,
//   setReleases, setLoading, setPremiumStatus, setLookerUrl,
//   setTokenStats, setRlsStatus, activeTab

export default function Tab_TECHSTACK({{ C, Card, ADMIN_KEY, adminKey, setAdminKey,
  stats, setStats, users, setUsers, waitlist, setWaitlist,
  feedback, setFeedback, releases, setReleases, loading, setLoading,
  premiumStatus, setPremiumStatus, lookerUrl, setLookerUrl,
  tokenStats, setTokenStats, rlsStatus, setRlsStatus }}) {{
  return (
    <>
<>
  <Card title="Frontend">
    {[
      ['Framework',       'React 18.x (Create React App)'],
      ['Routing',         'React Router DOM v6'],
      ['State',           'React Context API (AuthContext, PremiumContext, LocaleContext)'],
      ['Styling',         'Inline JSX styles + CSS-in-JS template literals (no external CSS framework)'],
      ['PWA',             'Custom service worker via serviceWorkerRegistration.js'],
      ['i18n',            '10 languages — EN, HI, TA, TE, KN, MR, BN, FR, DE, ES'],
      ['Build tool',      'react-scripts (CRA) → Vercel production build'],
      ['Font',            'Google Fonts — Fraunces (serif display) + DM Sans (body)'],
      ['Canvas',          'HTML5 Canvas API for share card generation (1080×1080px)'],
      ['Speech',          'Web Speech API (SpeechRecognition) for voice ingredient input'],
      ['Payments',        'Razorpay (India) — client SDK + server HMAC verification'],
    ].map(([k,v]) => (
      <div key={k} style={{display:'flex',gap:12,padding:'8px 0',borderBottom:'1px solid rgba(28,10,0,0.05)'}}>
        <span style={{fontSize:12,color:C.muted,minWidth:140,flexShrink:0,fontWeight:300}}>{k}</span>
        <span style={{fontSize:12,color:C.ink,fontWeight:400}}>{v}</span>
      </div>
    ))}
  </Card>
  <Card title="Backend / API">
    {[
      ['Platform',        'Vercel Hobby Plan — 8/12 serverless functions'],
      ['Runtime',         'Node.js 18.x (Vercel Edge Functions — ESM compiled to CJS)'],
      ['AI model',        'Anthropic claude-opus-4-5 (recipes, meal plans)'],
      ['AI model (fast)', 'Anthropic claude-haiku-4-5 (ingredient translation, WhatsApp bot)'],
      ['API version',     'Anthropic API 2023-06-01'],
      ['Functions',       'api/suggest.js · api/planner.js · api/admin.js (?action=meal-history) · api/payments.js · api/comms.js · api/admin.js · api/admin.js (?action=stats) · api/detect-ingredients.js · api/whatsapp.js'],
    ].map(([k,v]) => (
      <div key={k} style={{display:'flex',gap:12,padding:'8px 0',borderBottom:'1px solid rgba(28,10,0,0.05)'}}>
        <span style={{fontSize:12,color:C.muted,minWidth:140,flexShrink:0,fontWeight:300}}>{k}</span>
        <span style={{fontSize:12,color:C.ink,fontWeight:400,wordBreak:'break-all'}}>{v}</span>
      </div>
    ))}
  </Card>
  <Card title="Database & Auth">
    {[
      ['Provider',        'Supabase (PostgreSQL 15)'],
      ['Auth',            'Supabase Auth — Google OAuth + Magic Link (OTP email)'],
      ['Tables',          'profiles · pantry · favourites · meal_history · feedback · api_keys · broadcasts · releases'],
      ['RLS',             'Row Level Security enabled on all user tables'],
      ['Realtime',        'Not used (polling pattern)'],
      ['Storage',         'Not used (photos processed server-side, not persisted)'],
      ['Client',          'supabase-js v2 (browser) + REST API (serverless functions)'],
      ['Phases',          'Phase 1–5 SQL documented in SUPABASE_SETUP.md'],
    ].map(([k,v]) => (
      <div key={k} style={{display:'flex',gap:12,padding:'8px 0',borderBottom:'1px solid rgba(28,10,0,0.05)'}}>
        <span style={{fontSize:12,color:C.muted,minWidth:140,flexShrink:0,fontWeight:300}}>{k}</span>
        <span style={{fontSize:12,color:C.ink,fontWeight:400}}>{v}</span>
      </div>
    ))}
  </Card>
  <Card title="Infrastructure & Integrations">
    {[
      ['Hosting',         'Vercel (vercel.json — modern rewrites format)'],
      ['Domain',          'jiff-ecru.vercel.app'],
      ['CDN',             'Vercel Edge Network (automatic)'],
      ['Email',           'Mailchimp (waitlist drip) via api/comms.js?action=email'],
      ['Payments',        'Razorpay — INR only (India-only release)'],
      ['WhatsApp',        'Meta WhatsApp Cloud API v18.0 — webhook at /api/whatsapp'],
      ['Delivery links',  'Blinkit · Zepto · Swiggy Instamart (deep-link search)'],
      ['CI/CD',           'GitHub → Vercel auto-deploy on push to main'],
      ['Testing',         'Playwright E2E — 84 tests (tests/jiff.spec.js)'],
      ['Monitoring',      'Crash logging via ErrorBoundary → Supabase feedback table'],
    ].map(([k,v]) => (
      <div key={k} style={{display:'flex',gap:12,padding:'8px 0',borderBottom:'1px solid rgba(28,10,0,0.05)'}}>
        <span style={{fontSize:12,color:C.muted,minWidth:140,flexShrink:0,fontWeight:300}}>{k}</span>
        <span style={{fontSize:12,color:C.ink,fontWeight:400}}>{v}</span>
      </div>
    ))}
  </Card>
</>
    </>
  );
}
