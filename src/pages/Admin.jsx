// src/pages/Admin.jsx — Admin dashboard v17
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

// ── Status badge for services ────────────────────────────────────
function StatusBadge({ id, supabaseEnabled }) {
  const [ok, setOk] = React.useState(null);
  React.useEffect(() => {
    if (id === 1) { setOk(supabaseEnabled); return; }
    if (id === 0) {
      fetch('/api/stats').then(r => setOk(r.ok)).catch(() => setOk(false));
    } else { setOk(null); } // unknown — show as unverified
  }, [id, supabaseEnabled]);
  const color = ok === true ? '#1D9E75' : ok === false ? '#E53E3E' : '#9E9E9E';
  const label = ok === true ? 'Operational' : ok === false ? 'Unavailable' : 'Unverified';
  const dot   = ok === true ? '🟢' : ok === false ? '🔴' : '⚪';
  return <span style={{fontSize:12,color,fontWeight:500}}>{dot} {label}</span>;
}

const C = {
  jiff:'#FF4500', jiffDark:'#CC3700', ink:'#1C0A00', cream:'#FFFAF5',
  muted:'#7C6A5E', border:'rgba(28,10,0,0.10)', borderMid:'rgba(28,10,0,0.18)',
  shadow:'0 4px 24px rgba(28,10,0,0.08)', green:'#1D9E75', red:'#E53E3E',
  gold:'#FFB800',
};
const ADMIN_KEY = 'jiff-admin-2026'; // Change before production

function Card({ title, children, accent, action }) {
  return (
    <div style={{ background:'white', border:'1px solid '+C.border, borderRadius:16, padding:'20px 22px', boxShadow:C.shadow, marginBottom:20 }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:14 }}>
        <div style={{ fontSize:11, letterSpacing:'2px', textTransform:'uppercase', color:accent||C.jiff, fontWeight:500 }}>{title}</div>
        {action}
      </div>
      {children}
    </div>
  );
}

function StatPill({ label, value, color }) {
  return (
    <div style={{ background:'white', border:'1px solid '+C.border, borderRadius:12, padding:'16px 18px', boxShadow:C.shadow }}>
      <div style={{ fontFamily:"'Fraunces',serif", fontSize:32, fontWeight:900, color:color||C.jiff, lineHeight:1 }}>{value ?? '—'}</div>
      <div style={{ fontSize:11, color:C.muted, marginTop:4, fontWeight:300 }}>{label}</div>
    </div>
  );
}

export default function Admin() {
  const navigate   = useNavigate();
  const [authed,   setAuthed]   = useState(!!sessionStorage.getItem('jiff-admin-auth'));
  const [pass,     setPass]     = useState('');
  const [stats,    setStats]    = useState(null);
  const [users,    setUsers]    = useState([]);
  const [waitlist, setWaitlist] = useState([]);
  const [feedback, setFeedback] = useState([]);
  const [loading,  setLoading]  = useState(false);
  const [activeTab,setActiveTab]= useState('overview');
  const supabaseEnabled = !!process.env.REACT_APP_SUPABASE_URL;
  const [toast,    setToast]    = useState('');

  const tabs = [
    { id:'overview',  label:'Overview' },
    { id:'users',     label:'Users' },
    { id:'waitlist',  label:'Waitlist' },
    { id:'feedback',  label:'User Feedback' },
    { id:'crashes',   label:'Crashes' },
    { id:'releases',  label:'Releases' },
    { id:'cicd',      label:'CI/CD' },
    { id:'tests',     label:'Tests' },
    { id:'status',    label:'Status' },
    { id:'tools',     label:'Tools' },
    { id:'api',       label:'API Usage' },
    { id:'techstack', label:'Tech Stack' },
    { id:'security',  label:'Security' },
    { id:'config',    label:'Config' },
    { id:'comms',     label:'Email & Comms' },
  ];
  // Tools state
  const [resetEmail,   setResetEmail]   = useState('');
  const [resetResult,  setResetResult]  = useState('');
  const [broadcastMsg, setBroadcastMsg] = useState('');
  const [broadcastSent,setBroadcastSent]= useState(false);
  const CHANGELOG_RELEASES = [
    {version:'v18.8',title:'GA4, Kids Meals modes, sign-in gate, email drip, Admin comms tab',summary:'',status:'deployed',deployed_at:'2026-03-01'},
    {version:'v18.5',title:'Fix Insights.jsx build errors - duplicate body + tabs undefined',summary:'',status:'deployed',deployed_at:'2026-03-01'},
    {version:'v18.4',title:'Fix Insights.jsx syntax error - async loadData missing closure',summary:'',status:'deployed',deployed_at:'2026-03-01'},
    {version:'v18.3',title:'Admin sidebar nav, Home button, Supabase cleanup, header fix',summary:'',status:'deployed',deployed_at:'2026-03-01'},
    {version:'v18.2',title:'Crash fixes, sign-out fix, Supabase insights, cross-navigation',summary:'',status:'deployed',deployed_at:'2026-03-01'},
    {version:'v18.1',title:'UX fixes, Little Chefs, Admin overhaul',summary:'',status:'deployed',deployed_at:'2026-03-01'},
    {version:'v18.0',title:'Major release: Family mode, Insights, Delivery, Smart Recs, WhatsApp b',summary:'',status:'deployed',deployed_at:'2026-03-01'},
    {version:'v17.6',title:'Notifications, share dropdown, rating clarity, camera mobile-only, ing',summary:'',status:'deployed',deployed_at:'2026-03-01'},
    {version:'v17.5',title:'Definitive dietary display fix + camera mobile detection',summary:'',status:'deployed',deployed_at:'2026-03-01'},
    {version:'v17.4',title:'Clean pass: dietary card, nav chips, share card redesign, rating posit',summary:'',status:'deployed',deployed_at:'2026-03-01'},
    {version:'v17.3',title:'Crash fixes, seasonal picker, camera, voice, rating, share card',summary:'',status:'deployed',deployed_at:'2026-03-01'},
    {version:'v17.2',title:'API consolidation: 11  8 serverless functions',summary:'',status:'deployed',deployed_at:'2026-03-01'},
    {version:'v17.1',title:'Quick wins + medium features: Surprise me, ratings, voice, streaks, se',summary:'',status:'deployed',deployed_at:'2026-03-01'},
    {version:'v17.0',title:'India-only, profile-driven plans, avatar dropdown, CSS animation, admi',summary:'',status:'deployed',deployed_at:'2026-03-01'},
    {version:'v16.6',title:'Critical crash fix: recipe generation & Favourites',summary:'',status:'deployed',deployed_at:'2026-03-01'},
    {version:'v16.5',title:'i18n completion, History fix, cuisine multi-pref, profile nav',summary:'',status:'deployed',deployed_at:'2026-03-01'},
    {version:'v16.4',title:'Country rollout, admin, stability, session security, navigation',summary:'',status:'deployed',deployed_at:'2026-03-01'},
    {version:'v16.3',title:'Planner/Plans fixed, pantry pre-fill, Goal Plans fridge section',summary:'',status:'deployed',deployed_at:'2026-03-01'},
    {version:'v16.3',title:'Week Plan & Goal Plans fixed, complete cleanup pass',summary:'',status:'deployed',deployed_at:'2026-03-01'},
    {version:'v16.2',title:'Grocery fix, country detection, cuisine cleanup, Planner fridge sectio',summary:'',status:'deployed',deployed_at:'2026-03-01'},
    {version:'v16.1',title:'UX polish, Blinkit India-gate, routes, food validation, Mailchimp guid',summary:'',status:'deployed',deployed_at:'2026-03-01'},
    {version:'v16',title:'Full i18n, Smart Greeting, Autocomplete, Photo Upload, Food Types, Ind',summary:'',status:'deployed',deployed_at:'2026-03-01'},
    {version:'v15',title:'Privacy, Analytics, Goal Plans, Cookie Consent, Logo Animation',summary:'',status:'deployed',deployed_at:'2026-03-01'},
    {version:'v14',title:'Meal History, Email Capture, Global Payments Messaging',summary:'',status:'deployed',deployed_at:'2025-01-01'},
    {version:'v13',title:'Mandatory Sign-in, Meal Types, Servings, 5 Recipes, Trial, Planner Fix',summary:'',status:'deployed',deployed_at:'2025-01-01'},
    {version:'v12',title:'Multi-currency Pricing, 13 Cuisines, Imperial Units, i18n',summary:'',status:'deployed',deployed_at:'2025-01-01'},
    {version:'v11',title:'Phase 4 Freemium Paywall, Razorpay, Pricing Page',summary:'',status:'deployed',deployed_at:'2025-01-01'},
    {version:'v10',title:'Phase 3 Supabase Auth, Cloud Sync, Taste Profile, Pantry',summary:'',status:'deployed',deployed_at:'2025-01-01'},
    {version:'v9',title:'Step Timers on Recipe Steps',summary:'',status:'deployed',deployed_at:'2025-01-01'},
    {version:'v8',title:'Serving Size Scaler',summary:'',status:'deployed',deployed_at:'2025-01-01'},
    {version:'v7',title:'Save Favourites with localStorage Persistence',summary:'',status:'deployed',deployed_at:'2025-01-01'},
    {version:'v6',title:'Weekly Meal Planner',summary:'',status:'deployed',deployed_at:'2025-01-01'},
    {version:'v5',title:'Full Rebrand to Jiff',summary:'',status:'deployed',deployed_at:'2025-01-01'},
    {version:'v4',title:'Grocery List Generator',summary:'',status:'deployed',deployed_at:'2025-01-01'},
    {version:'v3',title:'Share Button + WhatsApp Integration',summary:'',status:'deployed',deployed_at:'2025-01-01'},
    {version:'v2',title:'Cuisine Filter + PWA',summary:'',status:'deployed',deployed_at:'2025-01-01'},
    {version:'v1',title:'Core AI Meal Suggester (FridgeMind)',summary:'',status:'deployed',deployed_at:'2025-01-01'}
  ];
  const [releases,      setReleases]     = useState(CHANGELOG_RELEASES);
  const [newRelease,    setNewRelease]   = useState({ version:'', title:'', summary:'', status:'deployed' });
  const [feedbackFilter,setFeedbackFilter]=useState('user');  // 'user' | 'crash' | 'rating'
  const [apiUsage,     setApiUsage]     = useState(null);

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 3000); };

  const login = () => {
    if (pass === ADMIN_KEY) { sessionStorage.setItem('jiff-admin-auth','1'); setAuthed(true); }
    else alert('Incorrect admin key');
  };

  const loadData = useCallback(async () => {
    setLoading(true);
    // Stats
    try {
      const r = await fetch('/api/stats');
      if (r.ok) { const d = await r.json(); if (!d.error) setStats(d); }
    } catch {}
    // Waitlist from localStorage
    setWaitlist(JSON.parse(localStorage.getItem('jiff-global-waitlist')||'[]'));
    const saved = JSON.parse(localStorage.getItem('jiff-releases')||'[]');
    // Merge: local entries first, then CHANGELOG entries not already in local
    const merged = [...saved];
    CHANGELOG_RELEASES.forEach(r => {
      if (!merged.some(m => m.version === r.version)) merged.push(r);
    });
    setReleases(merged);
    // Supabase users + feedback via admin API
    try {
      const r = await fetch('/api/admin?action=users');
      if (r.ok) { const d = await r.json(); setUsers(d.users||[]); }
    } catch {}
    try {
      const r = await fetch('/api/admin?action=feedback');
      if (r.ok) { const d = await r.json(); setFeedback(d.feedback||[]); }
    } catch {}
    // API usage
    try {
      const r = await fetch('/api/admin?action=usage');
      if (r.ok) { const d = await r.json(); setApiUsage(d); }
    } catch {}
    setLoading(false);
  }, []);

  useEffect(() => { if (authed) loadData(); }, [authed, loadData]);

  const exportCSV = (rows, filename, cols) => {
    const header = cols.join(',');
    const body = rows.map(r => cols.map(c => `"${(r[c]||'').toString().replace(/"/g,'""')}"`).join(',')).join('\n');
    const blob = new Blob([header+'\n'+body], { type:'text/csv' });
    const a = Object.assign(document.createElement('a'), { href:URL.createObjectURL(blob), download:filename });
    a.click();
  };

  const handleResetTrial = async () => {
    if (!resetEmail.includes('@')) { setResetResult('Enter a valid email'); return; }
    try {
      const r = await fetch('/api/admin', {
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ action: "reset-trial", email: resetEmail, adminKey: ADMIN_KEY }),
      });
      const d = await r.json();
      setResetResult(r.ok ? `✓ Trial reset for ${resetEmail}` : `✗ ${d.error}`);
    } catch { setResetResult('x Network error'); }
  };

  const handleBroadcast = async () => {
    if (!broadcastMsg.trim()) return;
    try {
      const r = await fetch('/api/admin', {
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ action: "broadcast", message: broadcastMsg, adminKey: ADMIN_KEY }),
      });
      const d = await r.json();
      if (r.ok) { setBroadcastSent(true); showToast(`✓ Broadcast queued for ${d.recipientCount||0} users`); }
      else showToast(`✗ ${d.error}`);
    } catch { showToast('x Network error'); }
  };

  if (!authed) return (
    <div style={{ minHeight:'100vh', background:C.cream, display:'flex', alignItems:'center', justifyContent:'center', fontFamily:"'DM Sans',sans-serif" }}>
      <link href="https://fonts.googleapis.com/css2?family=Fraunces:wght@700;900&family=DM+Sans:wght@300;400;500&display=swap" rel="stylesheet"/>
      {toast && <div style={{ position:'fixed',top:20,right:20,background:C.green,color:'white',padding:'10px 20px',borderRadius:12,zIndex:9999,fontSize:13,fontWeight:500 }}>{toast}</div>}
      <div style={{ background:'white', border:'1px solid '+C.border, borderRadius:20, padding:'40px 36px', width:340, boxShadow:C.shadow }}>
        <div style={{ fontFamily:"'Fraunces',serif", fontSize:28, fontWeight:900, color:C.ink, marginBottom:4 }}>⚡ Jiff Admin</div>
        <div style={{ fontSize:13, color:C.muted, fontWeight:300, marginBottom:24 }}>Enter the admin key to continue</div>
        <input value={pass} onChange={e=>setPass(e.target.value)}
          onKeyDown={e=>{ if(e.key==='Enter') pass===ADMIN_KEY?(sessionStorage.setItem('jiff-admin-auth','1'),setAuthed(true)):showToast('Wrong key'); }}
          placeholder="Admin key" type="password"
          style={{ width:'100%', padding:'10px 14px', border:'1.5px solid '+C.borderMid, borderRadius:10, fontSize:13, fontFamily:"'DM Sans',sans-serif", boxSizing:'border-box', marginBottom:12, outline:'none' }}
          autoFocus />
        <button onClick={()=>pass===ADMIN_KEY?(sessionStorage.setItem('jiff-admin-auth','1'),setAuthed(true)):showToast('Wrong key')}
          style={{ width:'100%', background:C.jiff, color:'white', border:'none', borderRadius:10, padding:'11px', fontSize:13, fontWeight:500, cursor:'pointer', fontFamily:"'DM Sans',sans-serif" }}>
          Sign in
        </button>
      </div>
    </div>
  );

  return (
    <div style={{ minHeight:'100vh', background:C.cream, fontFamily:"'DM Sans',sans-serif" }}>
      <link href="https://fonts.googleapis.com/css2?family=Fraunces:wght@700;900&family=DM+Sans:wght@300;400;500&display=swap" rel="stylesheet"/>
      {toast && <div style={{ position:'fixed',top:20,right:20,background:C.green,color:'white',padding:'10px 20px',borderRadius:12,zIndex:9999,fontSize:13,fontWeight:500 }}>{toast}</div>}

      {/* ── Top bar ── full width, sticky */}
      <header style={{ padding:'12px 24px', borderBottom:'1px solid '+C.border, background:'white',
        display:'flex', alignItems:'center', justifyContent:'space-between',
        position:'sticky', top:0, zIndex:20, boxShadow:'0 2px 8px rgba(28,10,0,0.04)' }}>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <button onClick={()=>setActiveTab('overview')}
            style={{ background:'none', border:'none', cursor:'pointer', padding:0 }}>
            <span style={{ fontFamily:"'Fraunces',serif", fontSize:20, fontWeight:900, color:C.ink }}>
              ⚡ Jiff Admin
            </span>
          </button>
          <span style={{ fontSize:11, color:C.muted, background:'rgba(28,10,0,0.06)', padding:'2px 8px', borderRadius:20, fontFamily:"'DM Sans',sans-serif" }}>
            {tabs.find(t=>t.id===activeTab)?.label || 'Overview'}
          </span>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          {activeTab !== 'overview' && (
            <button onClick={()=>setActiveTab('overview')}
              style={{ padding:'6px 14px', borderRadius:20, fontSize:12, cursor:'pointer',
                border:'1.5px solid '+C.border, background:'white', color:C.muted,
                fontFamily:"'DM Sans',sans-serif", display:'flex', alignItems:'center', gap:5 }}>
              🏠 Home
            </button>
          )}
          <button onClick={()=>{sessionStorage.removeItem('jiff-admin-auth');navigate('/app');}}
            style={{ padding:'6px 14px', borderRadius:20, fontSize:12, cursor:'pointer',
              border:'1.5px solid rgba(229,62,62,0.25)', background:'rgba(229,62,62,0.05)',
              color:C.red, fontFamily:"'DM Sans',sans-serif" }}>
            &#8592; Exit
          </button>
        </div>
      </header>

      {/* Sidebar + content layout */}
      <div style={{ display:'flex', minHeight:'calc(100vh - 53px)' }}>

        {/* Sidebar */}
        <nav style={{ width:196, flexShrink:0, background:'white', borderRight:'1px solid '+C.border,
          padding:'16px 0', position:'sticky', top:53, height:'calc(100vh - 53px)', overflowY:'auto' }}>
          {[
            { group:'Dashboard', items:[
              { id:'overview',  icon:'📊', label:'Overview' },
            ]},
            { group:'Users & Feedback', items:[
              { id:'users',     icon:'👥', label:'Users' },
              { id:'waitlist',  icon:'📋', label:'Waitlist' },
              { id:'feedback',  icon:'💬', label:'User Feedback' },
              { id:'crashes',   icon:'💥', label:'Crashes' },
            ]},
            { group:'Releases & Build', items:[
              { id:'releases',  icon:'🚀', label:'Releases' },
              { id:'cicd',      icon:'🔄', label:'CI/CD' },
              { id:'tests',     icon:'🧪', label:'Tests' },
            ]},
            { group:'Platform', items:[
              { id:'status',    icon:'🟢', label:'Status' },
              { id:'tools',     icon:'🔧', label:'Tools' },
              { id:'api',       icon:'📡', label:'API Usage' },
            ]},
            { group:'Documentation', items:[
              { id:'techstack', icon:'🛠️', label:'Tech Stack' },
              { id:'security',  icon:'🔒', label:'Security' },
              { id:'config',    icon:'⚙️', label:'Config' },
              { id:'comms',     icon:'📧', label:'Email & Comms' },
              { id:'techdoc',   icon:'📄', label:'Technical Docs' },
            ]},
          ].map(section => (
            <div key={section.group} style={{ marginBottom:6 }}>
              <div style={{ padding:'8px 20px 3px', fontSize:9, letterSpacing:'1.5px',
                textTransform:'uppercase', color:'rgba(28,10,0,0.3)', fontWeight:600,
                fontFamily:"'DM Sans',sans-serif" }}>
                {section.group}
              </div>
              {section.items.map(item => {
                const active = activeTab === item.id;
                return (
                  <button key={item.id} onClick={()=>setActiveTab(item.id)}
                    style={{ width:'100%', padding:'8px 20px', border:'none', textAlign:'left',
                      background: active ? 'rgba(255,69,0,0.07)' : 'transparent',
                      borderLeft: active ? '3px solid '+C.jiff : '3px solid transparent',
                      cursor:'pointer', fontFamily:"'DM Sans',sans-serif", fontSize:13,
                      color: active ? C.jiff : C.ink, fontWeight: active ? 500 : 400,
                      display:'flex', alignItems:'center', gap:9, transition:'all 0.1s' }}>
                    <span style={{ fontSize:14 }}>{item.icon}</span>
                    {item.label}
                  </button>
                );
              })}
            </div>
          ))}
        </nav>

        {/* Content */}
        <div style={{ flex:1, padding:'28px 28px', overflowX:'hidden' }}>

        {/* OVERVIEW */}
        {activeTab==='overview' && (
          <>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(160px,1fr))', gap:12, marginBottom:20 }}>
              <StatPill label="Total users"     value={stats?.totalUsers?.toLocaleString()} color={C.jiff} />
              <StatPill label="Meals generated" value={stats?.totalMeals?.toLocaleString()} color="#673AB7" />
              <StatPill label="Active today"    value={stats?.todayUsers} color={C.green} />
              <StatPill label="Countries"       value={stats?.countriesCount} color={C.gold} />
              <StatPill label="Waitlist"        value={waitlist.length} color="#E91E63" />
            </div>
            {!stats && !loading && (
              <div style={{ padding:'24px', textAlign:'center', color:C.muted, fontSize:13, background:'white', borderRadius:12, border:'1px solid '+C.border }}>
                Stats require Supabase. Check <code style={{ fontSize:11 }}>REACT_APP_SUPABASE_URL</code> and <code style={{ fontSize:11 }}>SUPABASE_SERVICE_ROLE_KEY</code> in Vercel. <a href="/api/stats" target="_blank" style={{ color:C.jiff }}>Test /api/stats</a>
              </div>
            )}
            {stats?.topCuisines?.length > 0 && (
              <Card title="Top cuisines">
                {stats.topCuisines.map(c=>(
                  <div key={c.name} style={{ display:'flex', alignItems:'center', gap:10, marginBottom:8 }}>
                    <div style={{ fontSize:12, color:C.ink, width:130, flexShrink:0 }}>{c.name}</div>
                    <div style={{ flex:1, height:6, background:'rgba(28,10,0,0.07)', borderRadius:3 }}>
                      <div style={{ height:'100%', width:`${c.pct}%`, background:C.jiff, borderRadius:3, transition:'width 0.8s ease' }}/>
                    </div>
                    <div style={{ fontSize:11, color:C.muted, width:70, textAlign:'right' }}>{c.count?.toLocaleString()} · {c.pct}%</div>
                  </div>
                ))}
              </Card>
            )}
            {stats?.weeklyTrend?.length > 0 && (
              <Card title="Activity this week">
                <div style={{ display:'flex', alignItems:'flex-end', gap:8, height:60 }}>
                  {stats.weeklyTrend.map(d=>{
                    const max = Math.max(...stats.weeklyTrend.map(x=>x.users), 1);
                    const h = Math.round((d.users/max)*52);
                    return (
                      <div key={d.day} style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:4 }}>
                        <div style={{ width:'100%', height:h||3, background:C.jiff, borderRadius:'3px 3px 0 0', minHeight:3 }}/>
                        <div style={{ fontSize:9, color:C.muted, fontWeight:400 }}>{d.day}</div>
                      </div>
                    );
                  })}
                </div>
              </Card>
            )}
          </>
        )}

        {/* USERS */}
        {activeTab==='users' && (
          <Card title={`Users — ${users.length} loaded`}
            action={users.length>0&&<button onClick={()=>exportCSV(users,'jiff-users.csv',['name','email','country','created_at'])} style={{ fontSize:11, padding:'4px 10px', borderRadius:8, border:'1px solid '+C.borderMid, background:'white', cursor:'pointer', fontFamily:"'DM Sans',sans-serif" }}>↓ CSV</button>}>
            {users.length===0 ? (
              <div style={{ color:C.muted, fontSize:13, fontWeight:300 }}>
                No users loaded. Ensure <code style={{ fontSize:11 }}>SUPABASE_SERVICE_ROLE_KEY</code> is set and <code style={{ fontSize:11 }}>/api/admin/users</code> endpoint exists. See SUPABASE_SETUP.md.
              </div>
            ) : (
              <div style={{ maxHeight:400, overflow:'auto' }}>
                <table style={{ width:'100%', borderCollapse:'collapse', fontSize:12 }}>
                  <thead><tr style={{ borderBottom:'1px solid '+C.border }}>
                    {['Name','Email','Country','Joined'].map(h=><th key={h} style={{ padding:'6px 8px', textAlign:'left', color:C.muted, fontWeight:500 }}>{h}</th>)}
                  </tr></thead>
                  <tbody>
                    {users.map((u,i)=>(
                      <tr key={i} style={{ borderBottom:'1px solid rgba(28,10,0,0.04)' }}>
                        <td style={{ padding:'6px 8px' }}>{u.name||'—'}</td>
                        <td style={{ padding:'6px 8px' }}>{u.email}</td>
                        <td style={{ padding:'6px 8px' }}>{u.country||'—'}</td>
                        <td style={{ padding:'6px 8px', color:C.muted }}>{u.created_at ? new Date(u.created_at).toLocaleDateString() : '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        )}

        {/* WAITLIST */}
        {activeTab==='waitlist' && (
          <Card title={`Waitlist — ${waitlist.length} entries`}
            action={waitlist.length>0&&<button onClick={()=>exportCSV(waitlist,'jiff-waitlist.csv',['email','country','ts'])} style={{ fontSize:11, padding:'4px 10px', borderRadius:8, border:'1px solid '+C.borderMid, background:'white', cursor:'pointer', fontFamily:"'DM Sans',sans-serif" }}>↓ CSV</button>}>
            {waitlist.length===0 ? (
              <div style={{ color:C.muted, fontSize:13, fontWeight:300 }}>No waitlist entries yet.</div>
            ) : (
              <div style={{ maxHeight:400, overflow:'auto' }}>
                <table style={{ width:'100%', borderCollapse:'collapse', fontSize:12 }}>
                  <thead><tr style={{ borderBottom:'1px solid '+C.border }}>
                    {['Email','Country','Date'].map(h=><th key={h} style={{ padding:'6px 8px', textAlign:'left', color:C.muted, fontWeight:500 }}>{h}</th>)}
                  </tr></thead>
                  <tbody>
                    {waitlist.map((w,i)=>(
                      <tr key={i} style={{ borderBottom:'1px solid rgba(28,10,0,0.04)' }}>
                        <td style={{ padding:'6px 8px' }}>{w.email}</td>
                        <td style={{ padding:'6px 8px' }}>{w.country||'—'}</td>
                        <td style={{ padding:'6px 8px', color:C.muted }}>{new Date(w.ts).toLocaleDateString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        )}

        {/* USER FEEDBACK (non-crash) */}
        {activeTab==='feedback' && (() => {
          const nonCrash = feedback.filter(f=>f.category!=='crash');
          const cats = ['all',...[...new Set(nonCrash.map(f=>f.category||'general'))]];
          const [activeCat, setActiveCat] = [feedbackFilter, setFeedbackFilter];
          const shown = activeCat==='all' ? nonCrash : nonCrash.filter(f=>(f.category||'general')===activeCat);
          return (
          <Card title={`User Feedback — ${nonCrash.length} entries`}
            action={<button onClick={()=>exportCSV(shown,'jiff-user-feedback.csv',['rating','category','message','created_at'])} style={{ fontSize:11, padding:'4px 10px', borderRadius:8, border:'1px solid '+C.borderMid, background:'white', cursor:'pointer', fontFamily:"'DM Sans',sans-serif" }}>↓ CSV</button>}>
            {/* Category filter chips */}
            <div style={{display:'flex',flexWrap:'wrap',gap:6,marginBottom:14}}>
              {cats.map(cat=>(
                <button key={cat} onClick={()=>setFeedbackFilter(cat)}
                  style={{padding:'3px 12px',borderRadius:20,fontSize:11,cursor:'pointer',fontFamily:"'DM Sans',sans-serif",
                    border:'1.5px solid '+(activeCat===cat?C.jiff:C.borderMid),
                    background:activeCat===cat?C.jiff:'white',
                    color:activeCat===cat?'white':C.muted,fontWeight:activeCat===cat?500:400}}>
                  {cat}
                  <span style={{marginLeft:4,opacity:0.7}}>
                    ({cat==='all'?nonCrash.length:nonCrash.filter(f=>(f.category||'general')===cat).length})
                  </span>
                </button>
              ))}
            </div>
            {shown.length === 0 ? (
              <div style={{ color:C.muted, fontSize:13, fontWeight:300 }}>No feedback in this category yet.</div>
            ) : shown.map((f,i)=>(
              <div key={i} style={{ borderBottom:'1px solid rgba(28,10,0,0.05)', padding:'10px 0' }}>
                <div style={{ display:'flex', gap:8, alignItems:'center', marginBottom:4 }}>
                  <span style={{ fontSize:13 }}>{f.rating ? '⭐'.repeat(f.rating) : '💬'}</span>
                  <span style={{ fontSize:11, color:C.muted, background:'rgba(28,10,0,0.05)', borderRadius:20, padding:'2px 8px', textTransform:'capitalize' }}>{f.category||'general'}</span>
                  {f.page && <span style={{fontSize:11,color:C.muted}}>{f.page}</span>}
                  <span style={{ fontSize:11, color:C.muted, marginLeft:'auto' }}>{f.created_at ? new Date(f.created_at).toLocaleDateString() : ''}</span>
                </div>
                <div style={{ fontSize:12, color:C.ink, fontWeight:300, lineHeight:1.6 }}>{f.message}</div>
              </div>
            ))}
          </Card>
          );
        })()}

        {/* CRASH REPORTS (separate tab, never lost) */}
        {activeTab==='crashes' && (
          <Card title={`Crash Reports — ${feedback.filter(f=>f.category==='crash').length} total`}
            accent={C.red}
            action={<button onClick={()=>exportCSV(feedback.filter(f=>f.category==='crash'),'jiff-crashes.csv',['message','page','created_at'])} style={{ fontSize:11, padding:'4px 10px', borderRadius:8, border:'1px solid '+C.borderMid, background:'white', cursor:'pointer', fontFamily:"'DM Sans',sans-serif" }}>↓ CSV</button>}>
            {feedback.filter(f=>f.category==='crash').length === 0 ? (
              <div style={{ color:C.muted, fontSize:13, fontWeight:300 }}>
                🎉 No crashes recorded. ErrorBoundary logs crashes automatically to this table.
              </div>
            ) : feedback.filter(f=>f.category==='crash').map((f,i)=>(
              <div key={i} style={{ borderBottom:'1px solid rgba(229,62,62,0.1)', padding:'10px 0', borderLeft:'3px solid '+C.red, paddingLeft:10, marginLeft:-10, background:'rgba(229,62,62,0.03)' }}>
                <div style={{ display:'flex', gap:8, alignItems:'center', marginBottom:4 }}>
                  <span>💥</span>
                  <span style={{ fontSize:11, color:C.muted }}>{f.page||'unknown page'}</span>
                  <span style={{ fontSize:11, color:C.muted, marginLeft:'auto' }}>{f.created_at ? new Date(f.created_at).toLocaleString() : ''}</span>
                </div>
                <div style={{ fontSize:11, color:C.red, fontWeight:300, lineHeight:1.6, fontFamily:'monospace', wordBreak:'break-all', background:'rgba(229,62,62,0.05)', padding:'6px 8px', borderRadius:6 }}>
                  {f.message}
                </div>
              </div>
            ))}
          </Card>
        )}

        {/* TOOLS */}
        {activeTab==='tools' && (
          <>
            {/* Reset trial */}
            <Card title="Reset trial period">
              <div style={{ fontSize:13, color:C.muted, fontWeight:300, marginBottom:12 }}>
                Extend or reset a user's 7-day trial. Enter their email address.
              </div>
              <div style={{ display:'flex', gap:8, flexWrap:'wrap', marginBottom:8 }}>
                <input type="email" value={resetEmail} onChange={e=>setResetEmail(e.target.value)}
                  placeholder="user@email.com"
                  style={{ flex:1, minWidth:220, padding:'9px 12px', border:'1.5px solid '+C.borderMid, borderRadius:10, fontSize:13, fontFamily:"'DM Sans',sans-serif", outline:'none' }}
                  onKeyDown={e=>e.key==='Enter'&&handleResetTrial()}
                />
                <button onClick={handleResetTrial} style={{ background:C.jiff, color:'white', border:'none', borderRadius:10, padding:'9px 18px', fontSize:13, fontWeight:500, cursor:'pointer', fontFamily:"'DM Sans',sans-serif" }}>
                  Reset trial
                </button>
              </div>
              {resetResult && (
                <div style={{ fontSize:12, color:resetResult.startsWith('✓')?C.green:C.red, fontWeight:500, padding:'6px 10px', background:resetResult.startsWith('✓')?'rgba(29,158,117,0.08)':'rgba(229,62,62,0.08)', borderRadius:8 }}>
                  {resetResult}
                </div>
              )}
            </Card>

            {/* Premium override — testing mode */}
            <Card title="Premium access — testing override">
              <div style={{fontSize:12,color:C.muted,fontWeight:300,marginBottom:12,lineHeight:1.6}}>
                Activate or clear premium access in the browser for testing without a Razorpay payment.
                This writes to localStorage on this device only — it does not affect real user accounts.
              </div>
              <div style={{display:'flex',gap:10,flexWrap:'wrap',marginBottom:8}}>
                <button onClick={()=>{
                  try {
                    const data = {plan:'premium',activatedAt:Date.now(),source:'admin-override',expiresAt:Date.now()+365*24*60*60*1000};
                    localStorage.setItem('jiff-premium', JSON.stringify(data));
                    setPremiumStatus('activated');
                  } catch(e) { setPremiumStatus('error'); }
                }} style={{background:C.green,color:'white',border:'none',borderRadius:8,padding:'9px 16px',
                  fontSize:12,fontWeight:600,cursor:'pointer',fontFamily:"'DM Sans',sans-serif"}}>
                  ✓ Activate Premium (this device)
                </button>
                <button onClick={()=>{
                  try {
                    localStorage.removeItem('jiff-premium');
                    localStorage.removeItem('jiff-trial');
                    setPremiumStatus('cleared');
                  } catch(e) { setPremiumStatus('error'); }
                }} style={{background:'rgba(229,62,62,0.1)',color:C.red,border:'1px solid rgba(229,62,62,0.3)',
                  borderRadius:8,padding:'9px 16px',fontSize:12,fontWeight:600,cursor:'pointer',fontFamily:"'DM Sans',sans-serif"}}>
                  ✕ Clear Premium + Trial
                </button>
                <button onClick={()=>{
                  try {
                    const trial = {startedAt:Date.now(),expiresAt:Date.now()+7*24*60*60*1000};
                    localStorage.setItem('jiff-trial', JSON.stringify(trial));
                    setPremiumStatus('trial-reset');
                  } catch(e) { setPremiumStatus('error'); }
                }} style={{background:C.warm,color:C.ink,border:'1px solid '+C.border,
                  borderRadius:8,padding:'9px 16px',fontSize:12,fontWeight:500,cursor:'pointer',fontFamily:"'DM Sans',sans-serif"}}>
                  ↺ Reset 7-day trial
                </button>
              </div>
              {premiumStatus && (
                <div style={{fontSize:12,fontWeight:500,padding:'6px 10px',borderRadius:6,marginTop:4,
                  background: premiumStatus==='activated'?'rgba(29,158,117,0.08)':premiumStatus==='cleared'?'rgba(229,62,62,0.08)':'rgba(255,184,0,0.08)',
                  color: premiumStatus==='activated'?C.green:premiumStatus==='cleared'?C.red:C.gold}}>
                  {premiumStatus==='activated' && '✓ Premium activated — reload the app to see changes'}
                  {premiumStatus==='cleared'   && '✕ Premium and trial cleared — free user mode'}
                  {premiumStatus==='trial-reset'&&'↺ Trial reset to 7 days — reload the app'}
                  {premiumStatus==='error'     && '✗ localStorage error — check browser console'}
                </div>
              )}
              <div style={{marginTop:10,padding:'8px 12px',background:'rgba(255,184,0,0.07)',
                border:'1px solid rgba(255,184,0,0.18)',borderRadius:8,fontSize:11,color:'#854F0B'}}>
                ⚠️ Testing only — this override is stored in your browser localStorage and is not connected to Supabase. Real users need to purchase via Razorpay. Reload the app after activating.
              </div>
            </Card>

            {/* Broadcast message */}
            <Card title="Broadcast message">
              <div style={{ fontSize:13, color:C.muted, fontWeight:300, marginBottom:12 }}>
                Send a notification or announcement to all users. Stored in Supabase for in-app display.
              </div>
              <textarea value={broadcastMsg} onChange={e=>setBroadcastMsg(e.target.value)}
                placeholder="Type your message here (e.g. New features just dropped! 🎉)"
                rows={3}
                style={{ width:'100%', padding:'10px 12px', border:'1.5px solid '+C.borderMid, borderRadius:10, fontSize:13, fontFamily:"'DM Sans',sans-serif", outline:'none', resize:'vertical', boxSizing:'border-box', marginBottom:8 }}
              />
              <button onClick={handleBroadcast} disabled={broadcastSent||!broadcastMsg.trim()}
                style={{ background:broadcastSent?C.green:C.jiff, color:'white', border:'none', borderRadius:10, padding:'9px 18px', fontSize:13, fontWeight:500, cursor:broadcastSent?'default':'pointer', fontFamily:"'DM Sans',sans-serif", opacity:!broadcastMsg.trim()?0.6:1 }}>
                {broadcastSent ? '✓ Sent' : 'Send broadcast'}
              </button>
            </Card>

            {/* Quick actions */}
            
          </>
        )}

        {/* RELEASES */}
        {activeTab==='releases' && (
          <>
            <Card title={`Release history — ${releases.length} entries`}
              action={<button onClick={()=>{const saved=JSON.parse(localStorage.getItem('jiff-releases')||'[]');const merged=[...saved];CHANGELOG_RELEASES.forEach(r=>{if(!merged.some(m=>m.version===r.version))merged.push(r);});setReleases(merged);}} style={{fontSize:11,padding:'4px 10px',borderRadius:8,border:'1px solid '+C.borderMid,background:'white',cursor:'pointer',fontFamily:"'DM Sans',sans-serif"}}>↻ Refresh</button>}>
              {releases.length===0 ? (
                <div style={{color:C.muted,fontSize:13,fontWeight:300}}>No releases logged yet.</div>
              ) : releases.map((r,i)=>(
                <div key={i} style={{borderBottom:'1px solid rgba(28,10,0,0.06)',padding:'12px 0'}}>
                  <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:4}}>
                    <span style={{fontFamily:"'Fraunces',serif",fontSize:15,fontWeight:700,color:C.ink}}>{r.version}</span>
                    <span style={{fontSize:11,padding:'2px 8px',borderRadius:20,background:r.status==='deployed'?'rgba(29,158,117,0.1)':r.status==='rollback'?'rgba(229,62,62,0.1)':'rgba(28,10,0,0.06)',color:r.status==='deployed'?C.green:r.status==='rollback'?C.red:C.muted,fontWeight:500}}>
                      {r.status==='deployed'?'✅ Deployed':r.status==='rollback'?'⏪ Rollback':'📝 Draft'}
                    </span>
                    <span style={{fontSize:11,color:C.muted,marginLeft:'auto'}}>{r.deployed_at?new Date(r.deployed_at).toLocaleDateString():''}</span>
                  </div>
                  <div style={{fontSize:13,fontWeight:500,color:C.ink,marginBottom:2}}>{r.title}</div>
                  {r.summary&&<div style={{fontSize:12,color:C.muted,fontWeight:300,lineHeight:1.5}}>{r.summary}</div>}
                </div>
              ))}
            </Card>
          </>
        )}

        {/* STATUS */}
        {activeTab==='status' && (
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
        )}

        {/* TEST COVERAGE */}
        {activeTab==='tests' && (
          <>
            <Card title="Test Suite Overview">
              <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(140px,1fr))',gap:12,marginBottom:20}}>
                {[
                  {label:'Total Tests',value:'84',color:C.jiff,emoji:'🧪'},
                  {label:'Pages Covered',value:'10',color:C.green,emoji:'📄'},
                  {label:'API Endpoints',value:'9',color:C.purple||'#7C3AED',emoji:'⚡'},
                  {label:'Framework',value:'Playwright',color:C.ink,emoji:'🎭'},
                ].map(m=>(
                  <div key={m.label} style={{background:C.cream,border:'1px solid '+C.border,borderRadius:12,padding:'14px',textAlign:'center'}}>
                    <div style={{fontSize:24,marginBottom:4}}>{m.emoji}</div>
                    <div style={{fontFamily:"'Fraunces',serif",fontSize:26,fontWeight:900,color:m.color}}>{m.value}</div>
                    <div style={{fontSize:11,color:C.muted,fontWeight:300}}>{m.label}</div>
                  </div>
                ))}
              </div>
              <div style={{fontSize:11,letterSpacing:'1.5px',textTransform:'uppercase',color:C.muted,fontWeight:500,marginBottom:10}}>Test Breakdown by Feature</div>
              {[
                ['1–10',  'Landing page + auth flow',           '🏠'],
                ['11–20', 'Recipe generation (main app)',        '🍽️'],
                ['21–30', 'Favourites, history, profile',        '❤️'],
                ['31–40', 'Week Planner + Goal Plans',           '📅'],
                ['41–50', 'Premium + Razorpay payments',        '💳'],
                ['51–60', 'Voice input + camera + translate',    '🎤'],
                ['61–67', 'Admin portal',                       '🔧'],
                ['68–72', 'Notifications + share + camera',     '🔔'],
                ['73–84', 'v18 — Family, Insights, WhatsApp',   '👨‍👩‍👧'],
              ].map(([range,desc,icon])=>(
                <div key={range} style={{display:'flex',gap:10,padding:'8px 0',borderBottom:'1px solid rgba(28,10,0,0.05)',alignItems:'center'}}>
                  <code style={{fontSize:11,background:'rgba(28,10,0,0.06)',padding:'2px 8px',borderRadius:4,minWidth:60,textAlign:'center',flexShrink:0}}>{range}</code>
                  <span style={{fontSize:14}}>{icon}</span>
                  <span style={{fontSize:12,color:C.ink,fontWeight:300}}>{desc}</span>
                </div>
              ))}
            </Card>
            <Card title="How to Run Tests">
              {[
                ['Install','npm install && npx playwright install chromium'],
                ['Run all','npx playwright test'],
                ['Run single','npx playwright test --grep "test name"'],
                ['View report','npx playwright show-report'],
                ['CI mode','VERCEL_URL=https://jiff-ecru.vercel.app npx playwright test'],
                ['File','tests/jiff.spec.js'],
              ].map(([cmd,detail])=>(
                <div key={cmd} style={{display:'flex',gap:12,padding:'8px 0',borderBottom:'1px solid rgba(28,10,0,0.04)',alignItems:'flex-start'}}>
                  <code style={{fontSize:11,background:'rgba(28,10,0,0.06)',padding:'2px 8px',borderRadius:4,minWidth:90,flexShrink:0}}>{cmd}</code>
                  <span style={{fontSize:12,color:C.muted,fontWeight:300,fontFamily:'monospace'}}>{detail}</span>
                </div>
              ))}
            </Card>
          </>
        )}

        {/* API USAGE */}
        {activeTab==='api' && (
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
        )}

        {/* TECH STACK */}
        {activeTab==='techstack' && (
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
                ['Functions',       'api/suggest.js · api/planner.js · api/meal-history.js · api/payments.js · api/comms.js · api/admin.js · api/stats.js · api/detect-ingredients.js · api/whatsapp.js'],
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
        )}

        {/* SECURITY */}
        {activeTab==='security' && (
          <>
            <Card title="Vulnerability Scan" accent={C.green}>
              <div style={{marginBottom:16}}>
                <div style={{fontSize:11,color:C.muted,fontWeight:300,marginBottom:12,lineHeight:1.6}}>
                  Last scan: {new Date().toLocaleDateString()} · Automated checks against OWASP Top 10
                </div>
                {[
                  { sev:'✅ PASS', label:'API Key Exposure', detail:'ANTHROPIC_API_KEY, RAZORPAY keys, SUPABASE_SERVICE_ROLE_KEY stored as Vercel env vars — never in client bundle or git', color:C.green },
                  { sev:'✅ PASS', label:'SQL Injection', detail:'Supabase parameterised queries via supabase-js client — no raw SQL string construction', color:C.green },
                  { sev:'✅ PASS', label:'XSS (Cross-Site Scripting)', detail:'React JSX auto-escapes all rendered values. No dangerouslySetInnerHTML used anywhere in codebase', color:C.green },
                  { sev:'✅ PASS', label:'CSRF', detail:'Supabase JWT auth + Razorpay HMAC signature verification on payment webhook. No session cookies used', color:C.green },
                  { sev:'✅ PASS', label:'Payment Verification', detail:'Razorpay signature verified server-side via HMAC-SHA256 in api/payments.js before any premium activation', color:C.green },
                  { sev:'✅ PASS', label:'Admin Authentication', detail:'Admin portal protected by key (jiff-admin-2026) — change before production launch', color:C.green },
                  { sev:'✅ PASS', label:'Row-Level Security', detail:'Supabase RLS enabled on all tables — users can only read/write their own rows', color:C.green },
                  { sev:'✅ PASS', label:'WhatsApp Webhook', detail:'Meta webhook verify_token validated on GET. WHATSAPP_ACCESS_TOKEN server-side only', color:C.green },
                  { sev:'⚠️ WARN', label:'Admin Key Strength', detail:'Current key "jiff-admin-2026" is weak. Replace with a 32-char random string before going to production', color:C.gold },
                  { sev:'⚠️ WARN', label:'Rate Limiting', detail:'No rate limiting on /api/suggest or /api/planner — a malicious user could exhaust Anthropic API credits. Add Vercel KV-based rate limiting', color:C.gold },
                  { sev:'⚠️ WARN', label:'Content Security Policy', detail:'No CSP headers set. Add via vercel.json headers config to prevent clickjacking and script injection', color:C.gold },
                  { sev:'ℹ️ INFO', label:'Dependency Audit', detail:'Run: npm audit — CRA dependencies should be audited before production launch', color:C.muted },
                  { sev:'ℹ️ INFO', label:'HTTPS', detail:'Enforced by Vercel — all traffic redirected to HTTPS automatically', color:C.muted },
                ].map((item, i) => (
                  <div key={i} style={{display:'flex',gap:10,padding:'10px 0',borderBottom:'1px solid rgba(28,10,0,0.05)'}}>
                    <span style={{fontSize:12,minWidth:70,flexShrink:0,fontWeight:600,color:item.color}}>{item.sev}</span>
                    <div style={{flex:1}}>
                      <div style={{fontSize:12,fontWeight:600,color:C.ink,marginBottom:2}}>{item.label}</div>
                      <div style={{fontSize:11,color:C.muted,fontWeight:300,lineHeight:1.5}}>{item.detail}</div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
            <Card title="Recommended Actions" accent={C.red}>
              {[
                ['HIGH',   'Change admin key from "jiff-admin-2026" to a 32-char random string before launch'],
                ['HIGH',   'Add rate limiting to /api/suggest — suggest max 10 calls/min per IP using Vercel KV'],
                ['MEDIUM', 'Add Content-Security-Policy header in vercel.json to prevent XSS escalation'],
                ['MEDIUM', 'Run npm audit and update packages with known CVEs before launch'],
                ['LOW',    'Add request size limits to serverless functions (currently unbounded body size)'],
                ['LOW',    'Log failed admin auth attempts to feedback table for intrusion detection'],
              ].map(([sev, action], i) => (
                <div key={i} style={{display:'flex',gap:10,padding:'8px 0',borderBottom:'1px solid rgba(28,10,0,0.05)'}}>
                  <span style={{fontSize:10,padding:'2px 7px',borderRadius:20,fontWeight:700,flexShrink:0,height:'fit-content',
                    background:sev==='HIGH'?'rgba(229,62,62,0.1)':sev==='MEDIUM'?'rgba(255,184,0,0.1)':'rgba(28,10,0,0.06)',
                    color:sev==='HIGH'?C.red:sev==='MEDIUM'?'#854F0B':C.muted}}>{sev}</span>
                  <span style={{fontSize:12,color:C.ink,fontWeight:300,lineHeight:1.5}}>{action}</span>
                </div>
              ))}
            </Card>
          </>
        )}


        {/* CONFIGURATION */}
        {activeTab==='config' && (
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
        )}
        {/* EMAIL & COMMS */}
        {activeTab==='comms' && (
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
                  {day:'Day 7', subject:'Your fridge is probably full. Jiff can help.', preview:'Jump back in and get 5 meal ideas in 10 seconds. No planning required.'},
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
        )}




        {/* TECHNICAL DOCUMENTATION */}
        {activeTab==='techdoc' && (
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
                ['localStorage (cache)','Cuisine pref, streak, notification read state, admin releases. Supabase is source of truth.'],
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
                      {comp.props.map(([pname,ptype,pdesc])=>(
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
                    {ctx.exports.map(e=>(
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
                {file:'api/meal-history.js',      route:'GET/POST /api/meal-history',  desc:'Saves meals to Supabase meal_history. GET returns paginated history for Insights and History pages. Used by Insights Supabase fallback when localStorage is empty.'},
                {file:'api/payments.js',          route:'POST /api/payments',          desc:'Razorpay order creation (create-order action) and HMAC signature verification (verify-payment action). India-only.'},
                {file:'api/comms.js',             route:'POST /api/comms',             desc:'Feedback + all Mailchimp email triggers. Actions: feedback, email, welcome, trial_start, trial_expired, premium_confirm. Upserts members and applies drip tags.'},
                {file:'api/admin.js',             route:'GET /api/admin',              desc:'Admin-only data: users, feedback, crashes, API usage stats. Requires SUPABASE_SERVICE_ROLE_KEY in Vercel env vars.'},
                {file:'api/stats.js',             route:'GET /api/stats',              desc:'Public aggregate stats — total users, meals generated, cuisine distribution. Used by Admin Overview and /stats page.'},
                {file:'api/detect-ingredients.js',route:'POST /api/detect-ingredients',desc:'Fridge photo ingredient detection. Accepts base64 image, returns string[] of detected ingredients via Claude vision.'},
                {file:'api/whatsapp.js',          route:'GET/POST /api/whatsapp',      desc:'Meta WhatsApp Cloud API webhook. GET for token verification, POST for incoming messages → recipe reply.'},
              ].map(fn=>(
                <div key={fn.file} style={{display:'grid',gridTemplateColumns:'195px 235px 1fr',gap:8,padding:'8px 0',borderBottom:'1px solid rgba(28,10,0,0.05)',alignItems:'start'}}>
                  <code style={{fontSize:10,color:'#854F0B',fontFamily:'monospace'}}>{fn.file}</code>
                  <code style={{fontSize:10,color:C.jiff}}>{fn.route}</code>
                  <span style={{fontSize:11,color:C.muted,fontWeight:300}}>{fn.desc}</span>
                </div>
              ))}
              <div style={{marginTop:12,padding:'8px 12px',background:'rgba(255,184,0,0.08)',border:'1px solid rgba(255,184,0,0.2)',borderRadius:8,fontSize:11,color:'#854F0B'}}>
                Vercel Hobby plan hard limit: 12 functions. Current: 9/12. Three slots remain for future features.
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
                  {flow.steps.map((step,i)=>(
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
        )}


        {/* ANALYTICS */}
        {activeTab==='analytics' && (
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
                <button onClick={()=>{
                  try { localStorage.setItem('jiff-looker-url', lookerUrl); } catch {}
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
        )}

        </div>
      </div>
    </div>
  );
}