// src/pages/admin/AdminShell.jsx
// Admin portal shell — auth gate, sidebar, tab routing.
// Each tab is a separate component in ./tabs/
// 21 tabs, ~150 line shell (was 2,269 line monolith).

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
const ADMIN_KEY = 'jiff-admin-2026';

function Card({ title, children, accent, action }) {
  return (
    <div style={{ background:'white', border:'1px solid '+C.border, borderRadius:16, padding:'20px 24px', marginBottom:20 }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:children?16:0 }}>
        <div style={{ fontSize:11, letterSpacing:'2px', textTransform:'uppercase', color: accent||C.jiff, fontWeight:600 }}>{title}</div>
        {action && <div>{action}</div>}
      </div>
      {children}
    </div>
  );
}

import Tab_OVERVIEW from './tabs/overview.jsx';
import Tab_USERS from './tabs/users.jsx';
import Tab_WAITLIST from './tabs/waitlist.jsx';
import Tab_FEEDBACK from './tabs/feedback.jsx';
import Tab_CRASHES from './tabs/crashes.jsx';
import Tab_RELEASES from './tabs/releases.jsx';
import Tab_CICD from './tabs/cicd.jsx';
import Tab_TESTS from './tabs/tests.jsx';
import Tab_STATUS from './tabs/status.jsx';
import Tab_TOOLS from './tabs/tools.jsx';
import Tab_API from './tabs/api.jsx';
import Tab_TECHSTACK from './tabs/techstack.jsx';
import Tab_SECURITY from './tabs/security.jsx';
import Tab_RLS from './tabs/rls.jsx';
import Tab_CONFIG from './tabs/config.jsx';
import Tab_COMMS from './tabs/comms.jsx';
import Tab_TECHDOC from './tabs/techdoc.jsx';
import Tab_ANALYTICS from './tabs/analytics.jsx';
import Tab_TOKENS from './tabs/tokens.jsx';
import Tab_PROMPTS from './tabs/prompts.jsx';
import Tab_UIKIT from './tabs/uikit.jsx';

export default function Admin() {
  const navigate   = useNavigate();
  const [authed,   setAuthed]   = useState(!!sessionStorage.getItem('jiff-admin-auth'));
  const [adminKey, setAdminKey] = useState('');
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
    { id:'rls',       label:'RLS Audit' },
    { id:'config',    label:'Config' },
    { id:'comms',     label:'Email & Comms' },
    { id:'techdoc',   label:'Technical Docs' },
    { id:'analytics', label:'Analytics (GA4)' },
    { id:'tokens',    label:'Token Usage' },
    { id:'prompts',   label:'Prompt Library' },
    { id:'uikit',     label:'UI Kit' },
  ];
  // Tools state
  const [resetEmail,   setResetEmail]   = useState('');
  const [resetResult,  setResetResult]  = useState('');
  const [broadcastMsg, setBroadcastMsg] = useState('');
  const [broadcastSent,setBroadcastSent]= useState(false);
  const [premiumStatus,  setPremiumStatus]  = useState('');
  const [tokenStats,     setTokenStats]     = useState(null);
  const [rlsStatus,      setRlsStatus]      = useState(null);
  const [lookerUrl,      setLookerUrl]      = useState(()=>{ try{return localStorage.getItem('jiff-looker-url')||'';}catch{return '';} });
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
    // Waitlist from Supabase broadcasts table
        try {
          const wRes = await fetch('/api/admin?action=waitlist');
          const wData = await wRes.json();
          if (Array.isArray(wData.waitlist)) setWaitlist(wData.waitlist);
        } catch { setWaitlist([]); }
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
              { id:'analytics', icon:'📈', label:'Analytics (GA4)' },
              { id:'tokens',    icon:'🪙', label:'Token Usage' },
            ]},
            { group:'Documentation', items:[
              { id:'techstack', icon:'🛠️', label:'Tech Stack' },
              { id:'security',  icon:'🔒', label:'Security' },
              { id:'rls',       icon:'🛡️', label:'RLS Audit' },
              { id:'config',    icon:'⚙️', label:'Config' },
              { id:'comms',     icon:'📧', label:'Email & Comms' },
              { id:'techdoc',   icon:'📄', label:'Technical Docs' },
            ]},
            { group:'Developer Tools', items:[
              { id:'prompts',   icon:'🧠', label:'Prompt Library' },
              { id:'uikit',     icon:'🎨', label:'UI Kit' },
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

        {/* Shared props for all tab components */}
        {(() => {
          const tabProps = {
            C, Card, ADMIN_KEY, adminKey, setAdminKey,
            stats, setStats, users, setUsers, waitlist, setWaitlist,
            feedback, setFeedback, releases, setReleases, loading, setLoading,
            premiumStatus, setPremiumStatus, lookerUrl, setLookerUrl,
            tokenStats, setTokenStats, rlsStatus, setRlsStatus,
            exportCSV, supabaseEnabled, StatusBadge,
            resetEmail, setResetEmail, resetResult, setResetResult, handleResetTrial,
            broadcastMsg, setBroadcastMsg, broadcastSent, setBroadcastSent, handleBroadcast,
            feedbackFilter, setFeedbackFilter,
          };
          return (
            <>
          {activeTab==='overview' && <Tab_OVERVIEW {...tabProps}/>}
          {activeTab==='users' && <Tab_USERS {...tabProps}/>}
          {activeTab==='waitlist' && <Tab_WAITLIST {...tabProps}/>}
          {activeTab==='feedback' && <Tab_FEEDBACK {...tabProps}/>}
          {activeTab==='crashes' && <Tab_CRASHES {...tabProps}/>}
          {activeTab==='releases' && <Tab_RELEASES {...tabProps}/>}
          {activeTab==='cicd' && <Tab_CICD {...tabProps}/>}
          {activeTab==='tests' && <Tab_TESTS {...tabProps}/>}
          {activeTab==='status' && <Tab_STATUS {...tabProps}/>}
          {activeTab==='tools' && <Tab_TOOLS {...tabProps}/>}
          {activeTab==='api' && <Tab_API {...tabProps}/>}
          {activeTab==='techstack' && <Tab_TECHSTACK {...tabProps}/>}
          {activeTab==='security' && <Tab_SECURITY {...tabProps}/>}
          {activeTab==='rls' && <Tab_RLS {...tabProps}/>}
          {activeTab==='config' && <Tab_CONFIG {...tabProps}/>}
          {activeTab==='comms' && <Tab_COMMS {...tabProps}/>}
          {activeTab==='techdoc' && <Tab_TECHDOC {...tabProps}/>}
          {activeTab==='analytics' && <Tab_ANALYTICS {...tabProps}/>}
          {activeTab==='tokens' && <Tab_TOKENS {...tabProps}/>}
          {activeTab==='prompts' && <Tab_PROMPTS {...tabProps}/>}
          {activeTab==='uikit' && <Tab_UIKIT {...tabProps}/>}
            </>
          );
        })()}

        </div>
      </div>
    </div>
  );
}

