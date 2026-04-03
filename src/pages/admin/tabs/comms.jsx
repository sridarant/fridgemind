// src/pages/admin/tabs/comms.jsx — Admin tab component
// Props received from AdminShell: C, Card, ADMIN_KEY, adminKey, stats, users,
//   waitlist, feedback, releases, loading, premiumStatus, lookerUrl,
//   tokenStats, rlsStatus, setStats, setUsers, setWaitlist, setFeedback,
//   setReleases, setLoading, setPremiumStatus, setLookerUrl,
//   setTokenStats, setRlsStatus, activeTab

export default function Tab_COMMS({{ C, Card, ADMIN_KEY, adminKey, setAdminKey,
  stats, setStats, users, setUsers, waitlist, setWaitlist,
  feedback, setFeedback, releases, setReleases, loading, setLoading,
  premiumStatus, setPremiumStatus, lookerUrl, setLookerUrl,
  tokenStats, setTokenStats, rlsStatus, setRlsStatus }}) {{
  return (
    <>
<>
  {/* Drip sequence overview */}
  <Card title="Email drip sequence — Mailchimp Customer Journeys">
    <div style={{ fontSize:12, color:C.muted, fontWeight:300, marginBottom:16, lineHeight:1.6 }}>
      Jiff uses <strong style={{color:C.ink}}>Mailchimp Customer Journeys (Automations)</strong> for all drip emails.
      The code in <code style={{fontSize:11,background:'rgba(28,10,0,0.06)',padding:'1px 5px',borderRadius:3}}>api/comms.js</code> adds tags to subscribers
      — each tag triggers the corresponding journey in Mailchimp. Build these journeys at
      <a href="https://mailchimp.com/features/customer-journeys/" target="_blank"
        style={{color:C.jiff,marginLeft:4}}>mailchimp.com → Automations → Customer Journeys</a>.
    </div>
    {[
      { tag:'jiff-welcome',        trigger:'On signup / first sign-in', emails:[
        {day:'Day 0', subject:'⚡ Welcome to Jiff — your meals just got easier', preview:'Your fridge + AI = no more dinner dilemmas. Here is how to get started in 60 seconds.'},
        {day:'Day 2', subject:'5 things Jiff can do that most people miss', preview:'Family mode, ingredient translation, Little Chefs, Week Planner and grocery delivery.'},
        {day:'Day 5', subject:'Your 7-day trial is going well — here is a tip', preview:'Rate your meals to train Jiff. The more you rate, the better your suggestions get.'},
      ]},
      { tag:'jiff-trial-day3',     trigger:'Day 3 of trial', emails:[
        {day:'Day 3', subject:'3 days in — have you tried everything?', preview:'Quick checklist: Week Planner · Goal Plan · Kids Meals · Voice input · Ingredient translator.'},
      ]},
      { tag:'jiff-trial-expiring', trigger:'Day 6 of trial', emails:[
        {day:'Day 6', subject:'1 day left on your Jiff trial', preview:'Your 7-day free trial ends tomorrow. Upgrade now and keep everything — recipes, history, family mode.'},
      ]},
      { tag:'jiff-trial-expired',  trigger:'Day 8 (trial ended)', emails:[
        {day:'Day 8', subject:'Your Jiff trial ended — here is an offer', preview:'20% off your first month. Use code COMEBACK at checkout. Valid for 48 hours.'},
        {day:'Day 15', subject:'We miss cooking with you', preview:'Your fridge still has ideas. Come back and get 5 free recipes — no strings attached.'},
      ]},
      { tag:'jiff-premium-welcome',trigger:'On premium purchase', emails:[
        {day:'Immediate', subject:'You are premium! Here is everything unlocked 🎉', preview:'Unlimited recipes · Week Planner · Goal Plans · Kids Meals · Priority AI · Family mode.'},
        {day:'Day 7', subject:'A week of premium — how is it going?', preview:'Here are 3 things premium members love most. Plus your personalised meal stats.'},
      ]},
      { tag:'jiff-inactive-7d',    trigger:'7 days without login', emails:[
        {day:'Day 7', subject:'Your fridge is probably full. Jiff can help.', preview:'Jump back in — get 5 meal ideas in moments. No planning required.'},
      ]},
    ].map(seq => (
      <div key={seq.tag} style={{ marginBottom:20, borderBottom:'1px solid rgba(28,10,0,0.06)', paddingBottom:20 }}>
        <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:10 }}>
          <code style={{ fontSize:11, background:'rgba(255,69,0,0.08)', color:C.jiff, padding:'2px 8px', borderRadius:4 }}>{seq.tag}</code>
          <span style={{ fontSize:11, color:C.muted, fontWeight:300 }}>Trigger: {seq.trigger}</span>
        </div>
        {seq.emails.map((e,i) => (
          <div key={i} style={{ display:'grid', gridTemplateColumns:'80px 1fr', gap:8,
            padding:'8px 12px', background:'rgba(28,10,0,0.02)', borderRadius:8, marginBottom:6 }}>
            <div style={{ fontSize:11, color:C.muted, fontWeight:500 }}>{e.day}</div>
            <div>
              <div style={{ fontSize:12, fontWeight:500, color:C.ink, marginBottom:2 }}>{e.subject}</div>
              <div style={{ fontSize:11, color:C.muted, fontWeight:300 }}>{e.preview}</div>
            </div>
          </div>
        ))}
      </div>
    ))}
  </Card>

  {/* Template viewer */}
  <Card title="Email templates — 11 templates across 7 journeys">
    <div style={{ fontSize:12, color:C.muted, fontWeight:300, marginBottom:16, lineHeight:1.6 }}>
      All 11 templates are available as downloadable HTML in the <strong style={{color:C.ink}}>jiff-email-templates.zip</strong>.
      Upload each to <strong style={{color:C.ink}}>Mailchimp → Content → Email Templates → Code your own</strong>.
    </div>
    <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))', gap:10 }}>
      {[
        { file:'01_welcome_day0',        journey:'Welcome',          day:'Day 0',        subject:'Welcome to Jiff — your meals just got easier' },
        { file:'02_welcome_day2',        journey:'Welcome',          day:'Day 2',        subject:'5 Jiff features most people never discover' },
        { file:'03_welcome_day5',        journey:'Welcome',          day:'Day 5',        subject:'Your trial is going well — one tip to make it better' },
        { file:'04_trial_day3_nudge',    journey:'Trial nudge',      day:'Day 3',        subject:'3 days in — have you tried everything?' },
        { file:'05_trial_day6_expiring', journey:'Trial expiring',   day:'Day 6',        subject:'1 day left on your Jiff trial' },
        { file:'06_trial_expired_day8',  journey:'Trial expired',    day:'Day 8',        subject:'Your trial ended — special offer (20% off)' },
        { file:'07_trial_expired_day15', journey:'Trial expired',    day:'Day 15',       subject:'We miss cooking with you' },
        { file:'08_premium_welcome',     journey:'Premium welcome',  day:'Immediate',    subject:'You are premium! Everything unlocked' },
        { file:'09_premium_week1',       journey:'Premium welcome',  day:'Day 7',        subject:'A week of premium — how is it going?' },
        { file:'10_reengagement_7d',     journey:'Re-engagement',    day:'Immediate',    subject:'Your fridge is probably full. Jiff can help.' },
        { file:'11_waitlist_confirm',    journey:'Waitlist',         day:'Immediate',    subject:'You are on the Jiff waitlist' },
      ].map((t,i) => (
        <div key={i} style={{ background:'rgba(28,10,0,0.02)', border:'1px solid '+C.border,
          borderRadius:12, padding:'12px 14px' }}>
          <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:6 }}>
            <span style={{ fontSize:10, background:'rgba(255,69,0,0.08)', color:C.jiff,
              padding:'2px 7px', borderRadius:20, fontWeight:500 }}>{t.journey}</span>
            <span style={{ fontSize:10, color:C.muted }}>{t.day}</span>
          </div>
          <div style={{ fontSize:12, fontWeight:500, color:C.ink, marginBottom:3, lineHeight:1.4 }}>{t.subject}</div>
          <code style={{ fontSize:10, color:C.muted }}>{t.file}.html</code>
        </div>
      ))}
    </div>
    <div style={{ marginTop:14, padding:'10px 14px', background:'rgba(29,158,117,0.07)',
      border:'1px solid rgba(29,158,117,0.2)', borderRadius:10, fontSize:12, color:'#0D6B50' }}>
      📥 Download all templates: <strong>jiff-email-templates.zip</strong> — upload to Mailchimp → Content → Email Templates → Code your own → Paste in code
    </div>
  </Card>

  {/* API trigger reference */}
  <Card title="Code trigger reference">
    <div style={{ fontSize:12, color:C.muted, fontWeight:300, marginBottom:12 }}>
      Call these endpoints from the app at the right moment. Each adds Mailchimp tags that fire the corresponding automation.
    </div>
    {[
      { action:'POST /api/comms?action=welcome',          when:'On user sign-up (first login)', body:'{ email, name }' },
      { action:'POST /api/comms?action=trial_start',      when:'When 7-day trial begins',      body:'{ email }' },
      { action:'POST /api/comms?action=trial_expired',    when:'When trial expires',            body:'{ email }' },
      { action:'POST /api/comms?action=premium_confirm',  when:'After Razorpay payment success',body:'{ email, plan }' },
      { action:'POST /api/comms?action=email',            when:'Landing / pricing waitlist',    body:'{ email, source }' },
    ].map((row,i) => (
      <div key={i} style={{ display:'grid', gridTemplateColumns:'1fr 180px 140px', gap:8,
        padding:'8px 0', borderBottom:'1px solid rgba(28,10,0,0.05)', fontSize:11 }}>
        <code style={{ color:C.jiff, fontFamily:'monospace' }}>{row.action}</code>
        <span style={{ color:C.muted }}>{row.when}</span>
        <code style={{ color:'#854F0B' }}>{row.body}</code>
      </div>
    ))}
  </Card>

  {/* Mailchimp setup checklist */}
  <Card title="Mailchimp setup checklist">
    {[
      ['✅ Free account', 'mailchimp.com — free for 500 contacts, 1000 emails/month'],
      ['✅ Audience created', 'Audiences → Create Audience — name it "Jiff Users"'],
      ['✅ API key set', 'Account → Extras → API Keys → Create key → add to Vercel as MAILCHIMP_API_KEY'],
      ['✅ List ID set', 'Audience → Settings → Audience name and defaults → Audience ID'],
      ['✅ Server prefix set', 'From your API key — e.g. "us21" → add as MAILCHIMP_SERVER_PREFIX'],
      ['📋 Build journey: Welcome', 'Automations → Customer Journeys → Starting point: Tag added → jiff-welcome'],
      ['📋 Build journey: Trial nudge', 'Starting point: Tag added → jiff-trial-day3 (with 3-day delay)'],
      ['📋 Build journey: Trial expiring', 'Starting point: Tag added → jiff-trial-expiring (with 6-day delay)'],
      ['📋 Build journey: Premium welcome', 'Starting point: Tag added → jiff-premium-welcome'],
      ['📋 Build journey: Re-engagement', 'Starting point: Tag added → jiff-inactive-7d'],
    ].map(([status,desc],i) => (
      <div key={i} style={{ display:'flex', gap:10, padding:'7px 0',
        borderBottom:'1px solid rgba(28,10,0,0.04)', fontSize:12 }}>
        <span style={{ flexShrink:0, width:24 }}>{status.slice(0,2)}</span>
        <div>
          <span style={{ fontWeight:500, color:C.ink }}>{status.slice(2).trim()}</span>
          <span style={{ color:C.muted, fontWeight:300, marginLeft:8 }}>{desc}</span>
        </div>
      </div>
    ))}
  </Card>
</>
    </>
  );
}
