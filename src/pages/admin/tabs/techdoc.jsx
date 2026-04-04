// src/pages/admin/tabs/techdoc.jsx — Admin tab component
// Props received from AdminShell: C, Card, ADMIN_KEY, adminKey, stats, users,
//   waitlist, feedback, releases, loading, premiumStatus, lookerUrl,
//   tokenStats, rlsStatus, setStats, setUsers, setWaitlist, setFeedback,
//   setReleases, setLoading, setPremiumStatus, setLookerUrl,
//   setTokenStats, setRlsStatus, activeTab

export default function Tab_TECHDOC({ C, Card, ADMIN_KEY, adminKey, setAdminKey,
  stats, setStats, users, setUsers, waitlist, setWaitlist,
  feedback, setFeedback, releases, setReleases, loading, setLoading,
  premiumStatus, setPremiumStatus, lookerUrl, setLookerUrl,
  tokenStats, setTokenStats, rlsStatus, setRlsStatus }) {
  return (
    <>
  <Card title="Jiff v18.9 — Technical Overview">
    <div style={{fontSize:12,color:C.muted,lineHeight:1.8,fontWeight:300}}>
      Jiff is a React 18 SPA deployed on Vercel, backed by Supabase (PostgreSQL 15) and the Anthropic API.
      It is a fully installable PWA with offline support, 10-language i18n, Razorpay payments, Mailchimp drip automation, WhatsApp bot integration, and Google Analytics GA4 (G-ERSLLHSXCL).
    </div>
    <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(130px,1fr))',gap:10,marginTop:16}}>
      {[['13','Pages/routes'],['8','Components'],['3','Context providers'],
        ['9','API functions'],['10','Languages'],['28','Cuisines'],
        ['90','E2E tests'],['v18.9','Current version'],
      ].map(([n,l])=>(
        <div key={l} style={{background:'rgba(255,69,0,0.05)',border:'1px solid rgba(255,69,0,0.15)',borderRadius:10,padding:'10px 12px',textAlign:'center'}}>
          <div style={{fontFamily:"'Fraunces',serif",fontSize:20,fontWeight:700,color:C.jiff}}>{n}</div>
          <div style={{fontSize:10,color:C.muted,marginTop:2}}>{l}</div>
        </div>
      ))}
    </div>
  </Card>

  <Card title="Architecture">
    <div style={{fontSize:13,fontWeight:500,color:C.ink,marginBottom:8}}>Request flow</div>
    <div style={{fontFamily:'monospace',fontSize:11,color:C.muted,background:'rgba(28,10,0,0.03)',padding:'12px 16px',borderRadius:8,lineHeight:2.0,marginBottom:16}}>
      Browser (React SPA via Vercel CDN)<br/>
      &nbsp;&nbsp;/api/* Vercel Serverless Node.js 18<br/>
      &nbsp;&nbsp;&nbsp;&nbsp;Anthropic API (claude-opus-4-5 / claude-haiku-4-5)<br/>
      &nbsp;&nbsp;&nbsp;&nbsp;Supabase REST (PostgreSQL 15)<br/>
      &nbsp;&nbsp;&nbsp;&nbsp;Razorpay API (India payments)<br/>
      &nbsp;&nbsp;&nbsp;&nbsp;Mailchimp API (email drip)<br/>
      &nbsp;&nbsp;&nbsp;&nbsp;Meta WhatsApp Cloud API (bot)
    </div>
    <div style={{fontSize:13,fontWeight:500,color:C.ink,marginBottom:8}}>Data persistence</div>
    {[['Supabase (primary)','Profiles, pantry, favourites, history, feedback, API keys. Cross-device sync.'],
      ['localStorage (cache)','Cookie consent, weather cache (30 min), admin Looker URL (mirrored to Supabase), jiff-releases merge. Everything else is Supabase-primary. truth.'],
      ['sessionStorage','Admin session (jiff-admin-auth). Cleared on Exit.'],
      ['React state','Current meals, UI state, inputs. Ephemeral — lost on refresh.'],
    ].map(([k,v])=>(
      <div key={k} style={{display:'flex',gap:10,padding:'7px 0',borderBottom:'1px solid rgba(28,10,0,0.05)'}}>
        <span style={{fontSize:11,minWidth:160,color:C.jiff,fontWeight:500,flexShrink:0}}>{k}</span>
        <span style={{fontSize:11,color:C.muted,fontWeight:300}}>{v}</span>
      </div>
    ))}
  </Card>

  <Card title="Pages & Routes">
    {[['/',            'Landing.jsx',       'Public landing — hero, features, pricing preview, waitlist'],
      ['/app',         'Jiff.jsx',          'Main app — ingredient input, AI generation, results (1,837 lines)'],
      ['/planner',     'Planner.jsx',       '7-day week planner — profile-driven, premium gated'],
      ['/plans',       'Plans.jsx',         'Goal-based plans — protein, weight loss, diabetic-friendly'],
      ['/little-chefs','LittleChefs.jsx',   'Kids Meals — cook for kids or kids cook themselves (mode toggle)'],
      ['/insights',    'Insights.jsx',      'Analytics — cuisines, ratings, nutrition, history charts'],
      ['/profile',     'Profile.jsx',       'Food type, dietary, family, pantry, language, units settings'],
      ['/history',     'History.jsx',       'Full generation history with per-meal ratings'],
      ['/pricing',     'Pricing.jsx',       'Subscription tiers — Razorpay checkout integration'],
      ['/stats',       'Stats.jsx',         'Public aggregate usage statistics page'],
      ['/api-docs',    'ApiDocs.jsx',       'Public API documentation for B2B developers'],
      ['/admin',       'Admin.jsx',         'Admin portal — 15 tabs, sidebar nav, requires admin key'],
      ['/privacy',     'Privacy.jsx',       'Privacy policy (GDPR-aligned)'],
    ].map(([route,file,desc])=>(
      <div key={route} style={{display:'grid',gridTemplateColumns:'130px 175px 1fr',gap:8,padding:'7px 0',borderBottom:'1px solid rgba(28,10,0,0.05)',alignItems:'start'}}>
        <code style={{fontSize:10,color:C.jiff,fontWeight:500}}>{route}</code>
        <span style={{fontSize:10,color:'#854F0B',fontFamily:'monospace'}}>{file}</span>
        <span style={{fontSize:11,color:C.muted,fontWeight:300}}>{desc}</span>
      </div>
    ))}
  </Card>

  <Card title="UI Components — with Props & Usage">
    <div style={{fontSize:12,color:C.muted,fontWeight:300,marginBottom:14,lineHeight:1.6}}>
      All reusable components live in <code style={{fontSize:11,background:'rgba(28,10,0,0.06)',padding:'1px 5px',borderRadius:3}}>src/components/</code>.
      Each is self-contained with inline styles or injected CSS template literals. No external CSS framework.
    </div>
    {[
      {name:'IngredientInput', file:'IngredientInput.jsx',
       sig:'{ ingredients, onChange, pantryIngredients?, placeholder?, lang? }',
       desc:'Core input widget. Renders ingredient tag chips with autocomplete dropdown (200+ items from ingredients-db.js), voice input via Web Speech API, and the regional ingredient translator (clicks API). Keyboard-accessible. Backspace removes last tag.',
       props:[['ingredients','string[]','Controlled array of current ingredient tags'],
              ['onChange','fn(string[])','Called on every add/remove with updated array'],
              ['pantryIngredients','string[]','Optional — marks matching items with purple pantry badge'],
              ['lang','string','Locale code for placeholder text (default: en)']],
       usage:"<IngredientInput ingredients={ingredients} onChange={setIngredients} pantryIngredients={pantry} lang={lang} />"},
      {name:'JiffLogo', file:'JiffLogo.jsx',
       sig:'{ size?, spinning?, onClick?, style? }',
       desc:'Animated lightning bolt logo. The spinning prop shows a CSS rotating ring — used during AI generation loading. Three sizes (sm/md/lg). Clickable — used in all page headers to navigate home.',
       props:[['size','"sm"|"md"|"lg"','Controls rendered dimensions. md is default header size.'],
              ['spinning','boolean','Shows animated rotating ring. True during generation loading.'],
              ['onClick','fn','Optional click handler — navigates to / in header usage']],
       usage:"<JiffLogo size=\"md\" spinning={view==='loading'} onClick={()=>navigate('/')} />"},
      {name:'FamilySelector', file:'FamilySelector.jsx',
       sig:'{ members, selected, onToggle }',
       desc:"Renders 'Who's eating tonight?' chip selector above the Generate button. Only visible when user has family members saved in Profile. Each chip shows member name and dietary icon (veg/non-veg/jain etc). Selecting a member restricts recipe generation to their dietary profile.",
       props:[['members','object[]','Array of {name, dietary} from profile.family_members'],
              ['selected','string[]','Array of currently active member names'],
              ['onToggle','fn(name)','Toggles a member on/off in selected array']],
       usage:"<FamilySelector members={profile?.family_members} selected={selectedFamily} onToggle={toggleFamily} />"},
      {name:'FridgePhotoUpload', file:'FridgePhotoUpload.jsx',
       sig:'{ onIngredients }',
       desc:'Camera/gallery upload widget. Accepts base64 image, calls /api/detect-ingredients, returns detected ingredient array to parent. States: idle, loading, done, error. On mobile shows both camera and gallery buttons. Desktop shows gallery only (camera hidden via CSS media query).',
       props:[['onIngredients','fn(string[])','Called with detected ingredient array on success']],
       usage:"<FridgePhotoUpload onIngredients={(ings)=>setIngredients(prev=>[...new Set([...prev,...ings])])} />"},
      {name:'SmartGreeting', file:'SmartGreeting.jsx',
       sig:'{ user, profile, onSuggestRecipe, onCountryDetected }',
       desc:"Time-aware personalised greeting at the top of the main app. Adjusts message for morning/afternoon/evening. Uses weather.js for contextual suggestions when geolocation is permitted. The 'Surprise me' button calls onSuggestRecipe to pre-fill ingredient input from pantry and profile.",
       props:[['user','object','Supabase user object (for display name)'],
              ['profile','object','User profile for food preference context'],
              ['onSuggestRecipe','fn()','Triggers Surprise me ingredient auto-fill'],
              ['onCountryDetected','fn(code)','Reports detected country code to parent']],
       usage:"<SmartGreeting user={user} profile={profile} onSuggestRecipe={handleSurpriseMe} onCountryDetected={setCountry} />"},
      {name:'FeedbackWidget', file:'FeedbackWidget.jsx',
       sig:'() — no props',
       desc:'Floating feedback button rendered globally via App.jsx. Opens a slide-up panel with 5-star rating, category chips (bug/feature/praise/other), and free text. Posts to /api/comms?action=feedback which saves to Supabase feedback table. Shown on all routes.',
       props:[],
       usage:"<FeedbackWidget />  {/* Added once in App.jsx — renders on every page */}"},
      {name:'CookieBanner', file:'CookieBanner.jsx',
       sig:'() — no props — also exports initAnalytics()',
       desc:'GDPR cookie consent banner shown on first visit. Accept enables Google Analytics GA4 (G-ERSLLHSXCL). Decline blocks analytics. Preference stored in localStorage (jiff-cookie-consent). The exported initAnalytics() is called after consent is given.',
       props:[],
       usage:"<CookieBanner />  {/* Added once in App.jsx — also call initAnalytics() on accept */}"},
      {name:'ErrorBoundary', file:'ErrorBoundary.jsx',
       sig:'{ children } — React class component (componentDidCatch)',
       desc:'Wraps the entire app in App.jsx. Catches unhandled React render errors and shows a friendly error page with reload button. Also logs crash details to Supabase feedback table when connected. Prevents blank white screen crashes.',
       props:[['children','ReactNode','The entire app tree (wraps App in index.js)']],
       usage:"<ErrorBoundary><App /></ErrorBoundary>"},
    ].map(comp=>(
      <div key={comp.name} style={{marginBottom:24,borderBottom:'1px solid rgba(28,10,0,0.07)',paddingBottom:20}}>
        <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:6,flexWrap:'wrap'}}>
          <span style={{fontFamily:"'Fraunces',serif",fontSize:15,fontWeight:700,color:C.ink}}>{comp.name}</span>
          <code style={{fontSize:10,color:'#854F0B',background:'rgba(133,79,11,0.08)',padding:'2px 7px',borderRadius:4}}>{comp.file}</code>
        </div>
        <div style={{fontSize:11,color:C.muted,fontFamily:'monospace',marginBottom:8,background:'rgba(28,10,0,0.03)',padding:'6px 10px',borderRadius:6,wordBreak:'break-all'}}>
          {comp.name}({'{'}{comp.sig}{'}'})
        </div>
        <div style={{fontSize:12,color:C.muted,fontWeight:300,lineHeight:1.7,marginBottom:comp.props.length?10:0}}>{comp.desc}</div>
        {comp.props.length > 0 && (
          <div style={{marginBottom:10}}>
            <div style={{fontSize:10,letterSpacing:'1.5px',textTransform:'uppercase',color:C.muted,fontWeight:600,marginBottom:6}}>Props</div>
            {(comp.props||[]).map(([pname,ptype,pdesc])=>(
              <div key={pname} style={{display:'grid',gridTemplateColumns:'110px 110px 1fr',gap:6,padding:'4px 0',fontSize:11,borderBottom:'1px solid rgba(28,10,0,0.03)'}}>
                <code style={{color:C.jiff}}>{pname}</code>
                <code style={{color:'#854F0B',fontSize:10}}>{ptype}</code>
                <span style={{color:C.muted,fontWeight:300}}>{pdesc}</span>
              </div>
            ))}
          </div>
        )}
        {comp.usage && (
          <div style={{background:'rgba(28,10,0,0.03)',borderRadius:6,padding:'8px 10px'}}>
            <div style={{fontSize:10,color:C.muted,marginBottom:3,fontWeight:500}}>Usage</div>
            <code style={{fontSize:10,color:C.ink,fontFamily:'monospace',wordBreak:'break-all'}}>{comp.usage}</code>
          </div>
        )}
      </div>
    ))}
  </Card>

  <Card title="Context Providers">
    <div style={{fontSize:12,color:C.muted,fontWeight:300,marginBottom:12,lineHeight:1.6}}>
      Three global React contexts wired in App.jsx in order: LocaleProvider wraps AuthProvider wraps PremiumProvider.
      Consume with useAuth(), usePremium(), useLocale() hooks in any component.
    </div>
    {[
      {name:'AuthContext', hook:'useAuth()', file:'contexts/AuthContext.jsx',
       desc:'Manages Supabase authentication, user profile, pantry, and favourites. Exposes sign-in/out actions. Profile auto-loads from Supabase on login.',
       exports:['user','authLoading','profile','pantry','favourites','signInWithGoogle','signInWithEmail','signOut','updateProfile','savePantry','toggleFavourite','isFav','supabaseEnabled']},
      {name:'PremiumContext', hook:'usePremium()', file:'contexts/PremiumContext.jsx',
       desc:'Tracks trial and premium status. checkAccess() gates generation, planner, and premium features. Handles Razorpay checkout flow and trial usage counting.',
       exports:['isPremium','trialActive','trialExpired','trialDaysLeft','recipeCount','checkAccess','recordUsage','startTrial','openCheckout','showGate','gateReason','razorpayEnabled']},
      {name:'LocaleContext', hook:'useLocale()', file:'contexts/LocaleContext.jsx',
       desc:'Language, units (metric/imperial), country detection, currency. t() translates keys from src/i18n/{lang}.js. Supports 10 languages: EN HI TA TE KN MR BN FR DE ES.',
       exports:['lang','setLang','t','units','setUnits','country','setCountry','currency','supportedLanguages','TIME_OPTIONS']},
    ].map(ctx=>(
      <div key={ctx.name} style={{marginBottom:18,borderBottom:'1px solid rgba(28,10,0,0.07)',paddingBottom:16}}>
        <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:6,flexWrap:'wrap'}}>
          <span style={{fontFamily:"'Fraunces',serif",fontSize:14,fontWeight:700,color:C.ink}}>{ctx.name}</span>
          <code style={{fontSize:11,color:C.jiff,background:'rgba(255,69,0,0.08)',padding:'2px 8px',borderRadius:4}}>{ctx.hook}</code>
          <code style={{fontSize:10,color:'#854F0B',background:'rgba(133,79,11,0.08)',padding:'2px 6px',borderRadius:4}}>{ctx.file}</code>
        </div>
        <div style={{fontSize:12,color:C.muted,fontWeight:300,lineHeight:1.7,marginBottom:8}}>{ctx.desc}</div>
        <div style={{display:'flex',flexWrap:'wrap',gap:5}}>
          {(ctx.exports||[]).map(e=>(
            <code key={e} style={{fontSize:10,background:'rgba(28,10,0,0.05)',color:C.ink,padding:'2px 7px',borderRadius:4}}>{e}</code>
          ))}
        </div>
      </div>
    ))}
  </Card>

  <Card title="Serverless API Functions (9/12 Vercel limit)">
    {[
      {file:'api/suggest.js',           route:'POST /api/suggest',           desc:'Main recipe generation. Handles kidsMode override (kidsPromptOverride), ingredient translation action, standard recipes. Uses claude-opus-4-5 for full recipes, claude-haiku-4-5 for fast translation.'},
      {file:'api/planner.js',           route:'POST /api/planner',           desc:'7-day week plan generation. Profile-driven — uses food_type, preferred_cuisines, spice_level, nutrition_goals from Supabase.'},
      {file:'api/admin.js (action=meal-history)', route:'GET/POST/PATCH /api/admin?action=meal-history',  desc:'Saves meals to Supabase meal_history. GET returns paginated history for Insights and History pages. Used by Insights Supabase fallback when localStorage is empty.'},
      {file:'api/payments.js',          route:'POST /api/payments',          desc:'Razorpay order creation (create-order action) and HMAC signature verification (verify-payment action). India-only.'},
      {file:'api/comms.js',             route:'POST /api/comms',             desc:'Feedback + all Mailchimp email triggers. Actions: feedback, email, welcome, trial_start, trial_expired, premium_confirm. Upserts members and applies drip tags.'},
      {file:'api/admin.js',             route:'GET /api/admin',              desc:'Admin-only data: users, feedback, crashes, API usage stats. Requires SUPABASE_SERVICE_ROLE_KEY in Vercel env vars.'},
      {file:'api/admin.js (action=stats)',             route:'GET /api/stats',              desc:'Public aggregate stats — total users, meals generated, cuisine distribution. Used by Admin Overview and /stats page.'},
      {file:'api/suggest.js (?action=detect)',route:'POST /api/detect-ingredients → suggest.js?action=detect',desc:'Fridge photo ingredient detection. Accepts base64 image, returns string[] of detected ingredients via Claude vision.'},
      {file:'api/videos.js',            route:'GET /api/videos',             desc:'YouTube recipe video search with Supabase cache. Ranked by views, engagement, recency, language match. 7-day TTL per recipe name.'},
      {file:'api/whatsapp.js',          route:'GET/POST /api/whatsapp',      desc:'Meta WhatsApp Cloud API webhook. GET for token verification, POST for incoming messages → recipe reply.'},
    ].map(fn=>(
      <div key={fn.file} style={{display:'grid',gridTemplateColumns:'195px 235px 1fr',gap:8,padding:'8px 0',borderBottom:'1px solid rgba(28,10,0,0.05)',alignItems:'start'}}>
        <code style={{fontSize:10,color:'#854F0B',fontFamily:'monospace'}}>{fn.file}</code>
        <code style={{fontSize:10,color:C.jiff}}>{fn.route}</code>
        <span style={{fontSize:11,color:C.muted,fontWeight:300}}>{fn.desc}</span>
      </div>
    ))}
    <div style={{marginTop:12,padding:'8px 12px',background:'rgba(255,184,0,0.08)',border:'1px solid rgba(255,184,0,0.2)',borderRadius:8,fontSize:11,color:'#854F0B'}}>
      Vercel Hobby plan hard limit: 12 functions. Current: 7/12. Five slots remain for future features for future features.
    </div>
  </Card>

  <Card title="Styling System">
    <div style={{fontSize:12,color:C.muted,fontWeight:300,lineHeight:1.7,marginBottom:12}}>
      No CSS framework — all styling is inline JSX style objects or CSS template literals injected via style tags.
      Each page/component defines its own local C (colours) constant and styles object.
    </div>
    <div style={{fontSize:13,fontWeight:500,color:C.ink,marginBottom:8}}>Design tokens (C object — replicated per file)</div>
    <div style={{fontFamily:'monospace',fontSize:10,background:'rgba(28,10,0,0.03)',padding:'10px 14px',borderRadius:8,lineHeight:2.0,marginBottom:14,color:C.muted}}>
      jiff: #FF4500 — Primary orange (buttons, accents, active states)<br/>
      ink: #1C0A00 — Primary text (near-black warm tone)<br/>
      cream: #FFFAF5 — Page backgrounds<br/>
      warm: #FFF0E5 — Card backgrounds, hover states<br/>
      muted: #7C6A5E — Secondary text, labels, descriptions<br/>
      green: #1D9E75 — Success, premium badge, dietary indicators<br/>
      gold: #FFB800 — Warnings, trial status, goal plans<br/>
      red: #E53E3E — Errors, crashes, destructive actions<br/>
      border: rgba(28,10,0,0.10) — Subtle borders<br/>
      shadow: 0 4px 24px rgba(28,10,0,0.08) — Card elevation
    </div>
    <div style={{fontSize:13,fontWeight:500,color:C.ink,marginBottom:8}}>Typography</div>
    {[["Fraunces (serif, Google Fonts)","Display headings, logo mark, large stat numbers. Weights 700/900."],
      ["DM Sans (sans-serif, Google Fonts)","All body text, labels, chips, buttons. Weights 300/400/500."],
      ["System monospace","Code snippets, API references in Admin and ApiDocs pages."],
    ].map(([font,usage])=>(
      <div key={font} style={{display:'flex',gap:10,padding:'5px 0',borderBottom:'1px solid rgba(28,10,0,0.05)'}}>
        <code style={{fontSize:11,color:C.jiff,minWidth:200,flexShrink:0}}>{font}</code>
        <span style={{fontSize:11,color:C.muted,fontWeight:300}}>{usage}</span>
      </div>
    ))}
  </Card>

  <Card title="Key Data Flows">
    {[
      {title:'Recipe Generation',
       steps:['User adds ingredients via IngredientInput (autocomplete, voice, or photo)',
              'FamilySelector optionally filters by selected member dietary restrictions',
              'handleSubmit() calls checkAccess() — gates trial/free users',
              'POST /api/suggest with ingredients, diet, cuisine, count, language, tasteProfile',
              'Server calls Claude claude-opus-4-5 → parses JSON array response',
              'setMeals(data) renders MealCard components with rating, share, grocery, scale',
              'recordUsage() increments trial count. POST /api/meal-history saves to Supabase']},
      {title:'Kids Meals Generation',
       steps:['User selects mode (cook for kids / kids cook), age group (toddler/kids/preteen), meal type',
              'generate() builds rich prompt: age safety rules, profile dietary, allergies, cuisines, spice',
              'kidsPromptOverride sent to /api/suggest with kidsMode:true flag',
              'suggest.js bypasses standard recipe flow, sends prompt directly to Claude as user message',
              'Response parsed as {meals:[]} JSON. Falls back to flat array if needed.',
              'Meals rendered with fun_fact card and calories/protein per serving chips']},
      {title:'Sign-in & Onboarding',
       steps:['User clicks Google OAuth or enters email for magic link',
              'Supabase onAuthStateChange fires → setUser() in AuthContext',
              'loadProfile() fetches from profiles table → setProfile()',
              'loadFavourites() and loadPantry() hydrate context state',
              'POST /api/comms?action=welcome fires Mailchimp welcome + trial_start tags',
              'Auth gate hides. App renders with user data. Trial timer starts.']},
    ].map(flow=>(
      <div key={flow.title} style={{marginBottom:16,borderBottom:'1px solid rgba(28,10,0,0.07)',paddingBottom:14}}>
        <div style={{fontSize:13,fontWeight:600,color:C.ink,marginBottom:8}}>{flow.title}</div>
        {(flow.steps||[]).map((step,i)=>(
          <div key={i} style={{display:'flex',gap:8,marginBottom:5}}>
            <span style={{fontSize:10,color:C.jiff,fontWeight:700,flexShrink:0,minWidth:18}}>{i+1}.</span>
            <span style={{fontSize:11,color:C.muted,fontWeight:300}}>{step}</span>
          </div>
        ))}
      </div>
    ))}
  </Card>

  <Card title="Environment Variables — Complete Reference">
    <div style={{fontSize:12,color:C.muted,fontWeight:300,marginBottom:12}}>
      Set in Vercel Dashboard → Project → Settings → Environment Variables. REACT_APP_ prefix = bundled into client build.
    </div>
    {[['ANTHROPIC_API_KEY','Server-only','Required','Anthropic API key for recipe generation and translation'],
      ['REACT_APP_SUPABASE_URL','Client+Server','Required','Supabase project URL (https://xxx.supabase.co)'],
      ['REACT_APP_SUPABASE_ANON_KEY','Client+Server','Required','Supabase anonymous public key'],
      ['SUPABASE_SERVICE_ROLE_KEY','Server-only','Admin features','Supabase service role key — enables admin Users/Feedback/Usage tabs'],
      ['RAZORPAY_KEY_ID','Server-only','Payments','Razorpay live/test key ID for server HMAC'],
      ['RAZORPAY_KEY_SECRET','Server-only','Payments','Razorpay secret for order verification'],
      ['REACT_APP_RAZORPAY_KEY_ID','Client','Payments','Public Razorpay key for checkout.js'],
      ['MAILCHIMP_API_KEY','Server-only','Email drip','Mailchimp API key for subscriber management'],
      ['MAILCHIMP_LIST_ID','Server-only','Email drip','Mailchimp audience ID'],
      ['MAILCHIMP_SERVER_PREFIX','Server-only','Email drip','Mailchimp server prefix (e.g. us21)'],
      ['WHATSAPP_ACCESS_TOKEN','Server-only','WhatsApp bot','Meta WhatsApp API access token'],
      ['WHATSAPP_VERIFY_TOKEN','Server-only','WhatsApp bot','Webhook verification token'],
      ['WHATSAPP_PHONE_NUMBER_ID','Server-only','WhatsApp bot','Meta phone number ID for outbound messages'],
    ].map(([key,scope,cat,desc])=>(
      <div key={key} style={{display:'grid',gridTemplateColumns:'220px 95px 105px 1fr',gap:6,padding:'6px 0',borderBottom:'1px solid rgba(28,10,0,0.04)',fontSize:11}}>
        <code style={{color:C.jiff,fontFamily:'monospace',fontSize:10}}>{key}</code>
        <span style={{color:C.muted,fontSize:10}}>{scope}</span>
        <span style={{color:cat==='Required'?C.green:cat.includes('Admin')?C.gold:'#888',fontSize:10,fontWeight:500}}>{cat}</span>
        <span style={{color:C.muted,fontWeight:300}}>{desc}</span>
      </div>
    ))}
  </Card>
    </>
  );
}
