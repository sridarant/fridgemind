// src/pages/admin/tabs/uikit.jsx — Admin tab component
// Props received from AdminShell: C, Card, ADMIN_KEY, adminKey, stats, users,
//   waitlist, feedback, releases, loading, premiumStatus, lookerUrl,
//   tokenStats, rlsStatus, setStats, setUsers, setWaitlist, setFeedback,
//   setReleases, setLoading, setPremiumStatus, setLookerUrl,
//   setTokenStats, setRlsStatus, activeTab

export default function Tab_UIKIT({{ C, Card, ADMIN_KEY, adminKey, setAdminKey,
  stats, setStats, users, setUsers, waitlist, setWaitlist,
  feedback, setFeedback, releases, setReleases, loading, setLoading,
  premiumStatus, setPremiumStatus, lookerUrl, setLookerUrl,
  tokenStats, setTokenStats, rlsStatus, setRlsStatus }}) {{
  return (
    <>
<>
  <Card title="Jiff Design System — UI components and primitives">
    <div style={{fontSize:12,color:C.muted,fontWeight:300,marginBottom:4,lineHeight:1.6}}>
      All UI primitives used across the Jiff app. Each component is built with inline JSX styles — no external CSS framework. Colors come from the local <code style={{fontSize:11,background:'rgba(28,10,0,0.06)',padding:'1px 5px',borderRadius:3}}>C</code> object in each file.
    </div>
  </Card>

  {/* Buttons */}
  <Card title="Buttons">
    <div style={{display:'flex',gap:10,flexWrap:'wrap',marginBottom:16}}>
      <button style={{padding:'10px 20px',background:C.jiff,color:'white',border:'none',borderRadius:10,fontSize:13,fontWeight:600,cursor:'pointer'}}>Primary</button>
      <button style={{padding:'10px 20px',background:'white',color:C.ink,border:'1.5px solid rgba(28,10,0,0.18)',borderRadius:10,fontSize:13,fontWeight:500,cursor:'pointer'}}>Secondary</button>
      <button style={{padding:'10px 20px',background:'none',color:C.muted,border:'1px solid rgba(28,10,0,0.12)',borderRadius:10,fontSize:13,cursor:'pointer'}}>Ghost</button>
      <button style={{padding:'10px 20px',background:'rgba(229,62,62,0.1)',color:'#C53030',border:'1px solid rgba(229,62,62,0.2)',borderRadius:10,fontSize:13,cursor:'pointer'}}>Destructive</button>
      <button style={{padding:'10px 20px',background:C.jiff,color:'white',border:'none',borderRadius:10,fontSize:13,fontWeight:600,cursor:'not-allowed',opacity:0.4}} disabled>Disabled</button>
    </div>
    {[
      ['Primary','bg: #FF4500, color: white, border-radius: 10px, font-weight: 600 — CTA actions (Generate, Save, Submit)'],
      ['Secondary','bg: white, border: 1.5px solid rgba(28,10,0,0.18) — navigation actions (Week Plan, Back to app)'],
      ['Ghost','bg: none, border: 1px solid rgba(28,10,0,0.12) — low-priority actions (Report issue, Cancel)'],
      ['Destructive','bg: rgba(229,62,62,0.1), color: #C53030 — delete, clear, remove actions'],
    ].map(([name,desc])=>(
      <div key={name} style={{display:'flex',gap:10,padding:'6px 0',borderBottom:'1px solid rgba(28,10,0,0.05)',fontSize:11}}>
        <span style={{minWidth:90,fontWeight:500,color:C.ink}}>{name}</span>
        <span style={{color:C.muted,fontWeight:300}}>{desc}</span>
      </div>
    ))}
  </Card>

  {/* Chips and badges */}
  <Card title="Chips, tags & badges">
    <div style={{display:'flex',gap:8,flexWrap:'wrap',marginBottom:16,alignItems:'center'}}>
      <span style={{padding:'5px 12px',background:'rgba(255,69,0,0.08)',color:C.jiff,border:'1px solid rgba(255,69,0,0.2)',borderRadius:20,fontSize:12,fontWeight:500}}>Jiff chip</span>
      <span style={{padding:'5px 12px',background:'rgba(29,158,117,0.1)',color:C.green,border:'1px solid rgba(29,158,117,0.25)',borderRadius:20,fontSize:12,fontWeight:500}}>✓ Success</span>
      <span style={{padding:'5px 12px',background:'rgba(255,184,0,0.1)',color:'#854F0B',border:'1px solid rgba(255,184,0,0.3)',borderRadius:20,fontSize:12,fontWeight:500}}>Trial active</span>
      <span style={{padding:'5px 12px',background:'rgba(229,62,62,0.08)',color:'#C53030',border:'1px solid rgba(229,62,62,0.2)',borderRadius:20,fontSize:12,fontWeight:500}}>Error</span>
      <span style={{padding:'3px 8px',background:C.jiff,color:'white',borderRadius:20,fontSize:10,fontWeight:700}}>NEW</span>
      <span style={{padding:'5px 14px',background:C.warm,color:C.muted,border:'1.5px solid '+C.border,borderRadius:20,fontSize:12,cursor:'pointer'}}>Filter chip</span>
      <span style={{padding:'5px 14px',background:C.jiff,color:'white',border:'none',borderRadius:20,fontSize:12,fontWeight:500}}>Active filter</span>
    </div>
    {[
      ['Orange chip','Selected state, active filter, selected cuisine — bg: rgba(255,69,0,0.08), border: rgba(255,69,0,0.2)'],
      ['Green badge','Premium, success, verified — bg: rgba(29,158,117,0.1)'],
      ['Gold badge','Trial, warning, in-progress — bg: rgba(255,184,0,0.1)'],
      ['Red badge','Error, crash, danger — bg: rgba(229,62,62,0.08)'],
      ['Pill filter','Unselected: bg warm, border light. Selected: bg jiff, color white'],
    ].map(([name,desc])=>(
      <div key={name} style={{display:'flex',gap:10,padding:'5px 0',borderBottom:'1px solid rgba(28,10,0,0.05)',fontSize:11}}>
        <span style={{minWidth:110,fontWeight:500,color:C.ink}}>{name}</span>
        <span style={{color:C.muted,fontWeight:300}}>{desc}</span>
      </div>
    ))}
  </Card>

  {/* Cards */}
  <Card title="Cards and panels">
    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:16}}>
      <div style={{background:'white',border:'1px solid rgba(28,10,0,0.10)',borderRadius:16,padding:'16px',boxShadow:'0 4px 24px rgba(28,10,0,0.08)'}}>
        <div style={{fontSize:12,fontWeight:500,color:C.ink}}>Standard card</div>
        <div style={{fontSize:11,color:C.muted,fontWeight:300,marginTop:4}}>bg white, border 1px, radius 16px, shadow 4px 24px 0.08</div>
      </div>
      <div style={{background:C.warm,border:'1px solid rgba(255,69,0,0.15)',borderRadius:16,padding:'16px'}}>
        <div style={{fontSize:12,fontWeight:500,color:C.jiff}}>Accent card</div>
        <div style={{fontSize:11,color:C.muted,fontWeight:300,marginTop:4}}>bg warm, border orange — info panels, tips</div>
      </div>
    </div>
    {[
      ['Standard card','bg: white, border: 1px solid rgba(28,10,0,0.10), border-radius: 16-20px, shadow: 0 4px 24px rgba(28,10,0,0.08)'],
      ['Accent card','bg: #FFF0E5 (warm), border: rgba(255,69,0,0.15) — tip boxes, featured content'],
      ['Dark card','bg: #1C0A00 (ink), color: white — premium gates, dark overlays'],
      ['Error panel','bg: rgba(229,62,62,0.08), border: rgba(229,62,62,0.2) — error messages'],
    ].map(([name,desc])=>(
      <div key={name} style={{display:'flex',gap:10,padding:'5px 0',borderBottom:'1px solid rgba(28,10,0,0.05)',fontSize:11}}>
        <span style={{minWidth:110,fontWeight:500,color:C.ink}}>{name}</span>
        <span style={{color:C.muted,fontWeight:300}}>{desc}</span>
      </div>
    ))}
  </Card>

  {/* Input */}
  <Card title="Inputs and form elements">
    <div style={{display:'flex',flexDirection:'column',gap:10,marginBottom:16,maxWidth:380}}>
      <input placeholder="Standard text input" style={{padding:'10px 12px',border:'1.5px solid rgba(28,10,0,0.18)',borderRadius:10,fontSize:13,fontFamily:"'DM Sans',sans-serif",color:C.ink,background:C.cream,outline:'none'}} readOnly/>
      <textarea rows={2} placeholder="Textarea" style={{padding:'10px 12px',border:'1.5px solid rgba(28,10,0,0.18)',borderRadius:10,fontSize:13,fontFamily:"'DM Sans',sans-serif",color:C.ink,background:C.cream,resize:'vertical'}} readOnly/>
      <div style={{display:'flex',gap:8}}>
        <input type="number" defaultValue={2} style={{width:60,padding:'8px 10px',border:'1.5px solid rgba(28,10,0,0.18)',borderRadius:8,fontSize:13,textAlign:'center',fontFamily:"'DM Sans',sans-serif"}} readOnly/>
        <span style={{alignSelf:'center',fontSize:12,color:C.muted}}>Number stepper</span>
      </div>
    </div>
    {[
      ['Text input','padding: 9-10px 12px, border: 1.5px solid rgba(28,10,0,0.18), radius: 10px, bg: #FFFAF5 (cream)'],
      ['Focus state','border-color: #FF4500, outline: none — override default browser focus ring'],
      ['Disabled','opacity: 0.5, cursor: not-allowed'],
      ['Error state','border-color: #E53E3E, bg: rgba(229,62,62,0.04)'],
    ].map(([name,desc])=>(
      <div key={name} style={{display:'flex',gap:10,padding:'5px 0',borderBottom:'1px solid rgba(28,10,0,0.05)',fontSize:11}}>
        <span style={{minWidth:110,fontWeight:500,color:C.ink}}>{name}</span>
        <span style={{color:C.muted,fontWeight:300}}>{desc}</span>
      </div>
    ))}
  </Card>

  {/* Typography */}
  <Card title="Typography scale">
    {[
      {size:32,weight:900,font:'Fraunces',label:'Display heading',sample:'Jiff it.'},
      {size:22,weight:900,font:'Fraunces',label:'Page title',sample:'Kids Meals'},
      {size:16,weight:700,font:'Fraunces',label:'Card title',sample:'This week\'s plan'},
      {size:15,weight:500,font:'DM Sans',label:'Body strong',sample:'5 recipes, any fridge'},
      {size:13,weight:300,font:'DM Sans',label:'Body regular',sample:'Your fridge has the ingredients for 3 meals.'},
      {size:11,weight:500,font:'DM Sans',label:'Label / caps',sample:'MEAL TYPE'},
      {size:10,weight:300,font:'DM Sans',label:'Caption / hint',sample:'Last updated 2 hours ago'},
    ].map(({size,weight,font,label,sample})=>(
      <div key={label} style={{display:'flex',alignItems:'baseline',gap:16,padding:'8px 0',borderBottom:'1px solid rgba(28,10,0,0.05)'}}>
        <span style={{minWidth:130,fontSize:11,color:C.muted,fontWeight:400}}>{label}</span>
        <span style={{fontFamily:`'${font}',serif`,fontSize:size,fontWeight:weight,color:C.ink,lineHeight:1.2}}>{sample}</span>
        <span style={{fontSize:10,color:C.muted,marginLeft:'auto',whiteSpace:'nowrap'}}>{font} {size}px/{weight}</span>
      </div>
    ))}
  </Card>

  {/* Colour palette */}
  <Card title="Colour palette — C object">
    <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(120px,1fr))',gap:8}}>
      {[
        {name:'jiff',val:'#FF4500',desc:'Primary — buttons, accents'},
        {name:'jiffDk',val:'#CC3700',desc:'Hover on orange'},
        {name:'ink',val:'#1C0A00',desc:'Primary text'},
        {name:'cream',val:'#FFFAF5',desc:'Page backgrounds'},
        {name:'warm',val:'#FFF0E5',desc:'Card backgrounds'},
        {name:'muted',val:'#7C6A5E',desc:'Secondary text'},
        {name:'green',val:'#1D9E75',desc:'Success, premium'},
        {name:'gold',val:'#FFB800',desc:'Trial, warnings'},
        {name:'red',val:'#E53E3E',desc:'Errors, danger'},
        {name:'purple',val:'#7C3AED',desc:'Kids Meals mode'},
      ].map(({name,val,desc})=>(
        <div key={name} style={{borderRadius:10,overflow:'hidden',border:'1px solid rgba(28,10,0,0.08)'}}>
          <div style={{height:36,background:val}}/>
          <div style={{padding:'6px 8px',background:'white'}}>
            <div style={{fontSize:10,fontWeight:600,color:C.ink,fontFamily:'monospace'}}>{val}</div>
            <div style={{fontSize:9,color:C.muted}}>{name} — {desc}</div>
          </div>
        </div>
      ))}
    </div>
  </Card>
</>
    </>
  );
}
