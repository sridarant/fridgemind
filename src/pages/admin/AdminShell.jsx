// src/pages/admin/AdminShell.jsx
// Admin portal shell — auth gate, sticky sidebar, tab routing.
// All data loading via adminService. No inline fetch() calls.
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchAdminStats, fetchWaitlist, fetchUsers, fetchFeedback, broadcastMessage, resetTrial } from '../../services/adminService';

import Tab_OVERVIEW  from './tabs/overview.jsx';
import Tab_USERS     from './tabs/users.jsx';
import Tab_WAITLIST  from './tabs/waitlist.jsx';
import Tab_FEEDBACK  from './tabs/feedback.jsx';
import Tab_CRASHES   from './tabs/crashes.jsx';
import Tab_RELEASES  from './tabs/releases.jsx';
import Tab_CICD      from './tabs/cicd.jsx';
import Tab_TESTS     from './tabs/tests.jsx';
import Tab_STATUS    from './tabs/status.jsx';
import Tab_TOOLS     from './tabs/tools.jsx';
import Tab_API       from './tabs/api.jsx';
import Tab_TECHSTACK from './tabs/techstack.jsx';
import Tab_SECURITY  from './tabs/security.jsx';
import Tab_RLS       from './tabs/rls.jsx';
import Tab_CONFIG    from './tabs/config.jsx';
import Tab_COMMS     from './tabs/comms.jsx';
import Tab_TECHDOC   from './tabs/techdoc.jsx';
import Tab_ANALYTICS from './tabs/analytics.jsx';
import Tab_TOKENS    from './tabs/tokens.jsx';
import Tab_PROMPTS   from './tabs/prompts.jsx';
import Tab_UIKIT     from './tabs/uikit.jsx';
import Tab_GROWTH    from './tabs/growth.jsx';

const ADMIN_KEY = 'jiff-admin-2026';
const C = {
  jiff:'#FF4500', jiffDark:'#CC3700', ink:'#1C0A00', cream:'#FFFAF5',
  muted:'#7C6A5E', border:'rgba(28,10,0,0.10)', borderMid:'rgba(28,10,0,0.18)',
  shadow:'0 4px 24px rgba(28,10,0,0.08)', green:'#1D9E75', red:'#E53E3E', gold:'#FFB800',
};

const CHANGELOG_RELEASES = [
  { version:'v22.30', title:'Service layer complete — all fetch() migrated', summary:'', status:'deployed', deployed_at:'2026-04-10' },
  { version:'v22.29', title:'Phases 1-3 complete — architecture, performance, code quality', summary:'', status:'deployed', deployed_at:'2026-04-10' },
  { version:'v22.26', title:'Festival tile multi-religion, FridgeCard UI v2', summary:'', status:'deployed', deployed_at:'2026-04-09' },
  { version:'v18.8', title:'GA4, Kids Meals modes, sign-in gate, email drip', summary:'', status:'deployed', deployed_at:'2026-03-01' },
  { version:'v10',   title:'Phase 3 Supabase Auth, Cloud Sync, Taste Profile', summary:'', status:'deployed', deployed_at:'2025-01-01' },
  { version:'v1',    title:'Core AI Meal Suggester (FridgeMind)', summary:'', status:'deployed', deployed_at:'2025-01-01' },
];

const SIDEBAR = [
  { group:'Dashboard', items:[
    { id:'overview', icon:'\ud83d\udcca', label:'Overview' },
    { id:'growth',   icon:'\ud83d\udcc8', label:'Growth'   },
  ]},
  { group:'Users & Feedback', items:[
    { id:'users',    icon:'\ud83d\udc65', label:'Users' },
    { id:'waitlist', icon:'\ud83d\udccb', label:'Waitlist' },
    { id:'feedback', icon:'\ud83d\udcac', label:'System & Feedback' },
  ]},
  { group:'Releases & Build', items:[
    { id:'releases', icon:'\ud83d\ude80', label:'Releases' },
    { id:'cicd',     icon:'\ud83d\udd04', label:'CI/CD' },
    { id:'tests',    icon:'\ud83e\uddea', label:'Tests' },
  ]},
  { group:'Platform', items:[
    { id:'status',    icon:'\ud83d\udfe2', label:'Status' },
    { id:'tools',     icon:'\ud83d\udd27', label:'Tools' },
    { id:'api',       icon:'\ud83d\udce1', label:'API Usage' },
    { id:'analytics', icon:'\ud83d\udcc8', label:'Analytics (GA4)' },
    { id:'tokens',    icon:'\ud83e\ude99', label:'Token Usage' },
  ]},
  { group:'Documentation', items:[
    { id:'techstack', icon:'\ud83d\udee0\ufe0f', label:'Tech Stack' },
    { id:'security',  icon:'\ud83d\udd12', label:'Security' },
    { id:'rls',       icon:'\ud83d\udee1\ufe0f', label:'RLS Audit' },
    { id:'config',    icon:'\u2699\ufe0f', label:'Config' },
    { id:'comms',     icon:'\ud83d\udce7', label:'Email & Comms' },
    { id:'techdoc',   icon:'\ud83d\udcc4', label:'Technical Docs' },
  ]},
  { group:'Developer Tools', items:[
    { id:'prompts', icon:'\ud83e\udde0', label:'Prompt Library' },
    { id:'uikit',   icon:'\ud83c\udfa8', label:'UI Kit' },
  ]},
];

function StatusBadge({ id, supabaseEnabled }) {
  const [ok, setOk] = React.useState(null);
  React.useEffect(() => {
    if (id === 1) { setOk(supabaseEnabled); return; }
    if (id === 0) { fetchAdminStats().then(() => setOk(true)).catch(() => setOk(false)); }
    else { setOk(null); }
  }, [id, supabaseEnabled]);
  const color = ok === true ? C.green : ok === false ? C.red : '#9E9E9E';
  const dot   = ok === true ? '\ud83d\udfe2' : ok === false ? '\ud83d\udd34' : '\u26aa';
  const label = ok === true ? 'Operational' : ok === false ? 'Unavailable' : 'Unverified';
  return <span style={{ fontSize:12, color, fontWeight:500 }}>{dot} {label}</span>;
}

function Card({ title, children, accent, action }) {
  return (
    <div style={{ background:'white', border:'1px solid '+C.border, borderRadius:16, padding:'20px 24px', marginBottom:20 }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:children?16:0 }}>
        <div style={{ fontSize:11, letterSpacing:'2px', textTransform:'uppercase', color:accent||C.jiff, fontWeight:600 }}>{title}</div>
        {action && <div>{action}</div>}
      </div>
      {children}
    </div>
  );
}

export default function Admin() {
  const navigate = useNavigate();
  const [authed,    setAuthed]    = useState(!!sessionStorage.getItem('jiff-admin-auth'));
  const [pass,      setPass]      = useState('');
  const [activeTab, setActiveTab] = useState('overview');
  const [toast,     setToast]     = useState('');
  const supabaseEnabled = !!process.env.REACT_APP_SUPABASE_URL;
  const [stats,    setStats]    = useState(null);
  const [users,    setUsers]    = useState([]);
  const [waitlist, setWaitlist] = useState([]);
  const [feedback, setFeedback] = useState([]);
  const [releases, setReleases] = useState(CHANGELOG_RELEASES);
  const [loading,  setLoading]  = useState(false);
  const [adminKey,      setAdminKey]      = useState('');
  const [premiumStatus, setPremiumStatus] = useState('');
  const [tokenStats,    setTokenStats]    = useState(null);
  const [rlsStatus,     setRlsStatus]     = useState(null);
  const [lookerUrl,     setLookerUrl]     = useState(()=>{ try{return localStorage.getItem('jiff-looker-url')||'';}catch{return '';} });
  const [resetEmail,    setResetEmail]    = useState('');
  const [resetResult,   setResetResult]   = useState('');
  const [broadcastMsg,  setBroadcastMsg]  = useState('');
  const [broadcastSent, setBroadcastSent] = useState(false);
  const [feedbackFilter,setFeedbackFilter]= useState('user');
  const [newRelease,    setNewRelease]    = useState({ version:'', title:'', summary:'', status:'deployed' });

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 3000); };

  const login = () => {
    if (pass === ADMIN_KEY) { sessionStorage.setItem('jiff-admin-auth','1'); setAuthed(true); }
    else { showToast('Wrong key'); }
  };

  const loadData = useCallback(async () => {
    setLoading(true);
    const [s, w, u, f] = await Promise.allSettled([
      fetchAdminStats(), fetchWaitlist(), fetchUsers(), fetchFeedback(),
    ]);
    if (s.status==='fulfilled' && !s.value?.error) setStats(s.value);
    if (w.status==='fulfilled') setWaitlist(w.value?.waitlist || []);
    if (u.status==='fulfilled') setUsers(u.value?.users || []);
    if (f.status==='fulfilled') setFeedback(f.value?.feedback || []);
    setLoading(false);
  }, []);

  useEffect(() => { if (authed) loadData(); }, [authed, loadData]);

  const handleResetTrial = async () => {
    if (!resetEmail.includes('@')) { setResetResult('Enter a valid email'); return; }
    try {
      await resetTrial(resetEmail);
      setResetResult('\u2713 Trial reset for ' + resetEmail);
    } catch (e) { setResetResult('\u2717 ' + (e.message||'Network error')); }
  };

  const handleBroadcast = async () => {
    if (!broadcastMsg.trim()) return;
    try {
      await broadcastMessage(broadcastMsg);
      setBroadcastSent(true); showToast('\u2713 Broadcast sent');
    } catch { showToast('\u2717 Network error'); }
  };

  const exportCSV = (rows, filename, cols) => {
    const header = cols.join(',');
    const body = rows.map(r => cols.map(c => '"' + (r[c]||'').toString().replace(/"/g,'""') + '"').join(',')).join('\n');
    const blob = new Blob([header+'\n'+body], { type:'text/csv' });
    const a = Object.assign(document.createElement('a'), { href:URL.createObjectURL(blob), download:filename });
    a.click();
  };

  const tabProps = {
    C, Card, ADMIN_KEY, adminKey, setAdminKey,
    stats, setStats, users, setUsers, waitlist, setWaitlist,
    feedback, setFeedback, releases, setReleases, loading, setLoading,
    premiumStatus, setPremiumStatus, lookerUrl, setLookerUrl,
    tokenStats, setTokenStats, rlsStatus, setRlsStatus,
    exportCSV, supabaseEnabled, StatusBadge,
    resetEmail, setResetEmail, resetResult, setResetResult, handleResetTrial,
    broadcastMsg, setBroadcastMsg, broadcastSent, setBroadcastSent, handleBroadcast,
    feedbackFilter, setFeedbackFilter, newRelease, setNewRelease,
  };

  if (!authed) return (
    <div style={{ minHeight:'100vh', background:C.cream, display:'flex', alignItems:'center', justifyContent:'center', fontFamily:"'DM Sans',sans-serif" }}>
      <link href="https://fonts.googleapis.com/css2?family=Fraunces:wght@700;900&family=DM+Sans:wght@300;400;500&display=swap" rel="stylesheet"/>
      {toast && <div style={{ position:'fixed',top:20,right:20,background:C.green,color:'white',padding:'10px 20px',borderRadius:12,zIndex:9999,fontSize:13,fontWeight:500 }}>{toast}</div>}
      <div style={{ background:'white', border:'1px solid '+C.border, borderRadius:20, padding:'40px 36px', width:340, boxShadow:C.shadow }}>
        <div style={{ fontFamily:"'Fraunces',serif", fontSize:28, fontWeight:900, color:C.ink, marginBottom:4 }}>{'\u26a1 Jiff Admin'}</div>
        <div style={{ fontSize:13, color:C.muted, fontWeight:300, marginBottom:24 }}>Enter the admin key to continue</div>
        <input value={pass} onChange={e=>setPass(e.target.value)} onKeyDown={e=>{ if(e.key==='Enter') login(); }}
          placeholder="Admin key" type="password" autoFocus
          style={{ width:'100%', padding:'10px 14px', border:'1.5px solid '+C.borderMid, borderRadius:10, fontSize:13, fontFamily:"'DM Sans',sans-serif", boxSizing:'border-box', marginBottom:12, outline:'none' }}
        />
        <button onClick={login}
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

      <header style={{ padding:'12px 24px', borderBottom:'1px solid '+C.border, background:'white', display:'flex', alignItems:'center', justifyContent:'space-between', position:'sticky', top:0, zIndex:20, boxShadow:'0 2px 8px rgba(28,10,0,0.04)' }}>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <button onClick={()=>setActiveTab('overview')} style={{ background:'none', border:'none', cursor:'pointer', padding:0 }}>
            <span style={{ fontFamily:"'Fraunces',serif", fontSize:20, fontWeight:900, color:C.ink }}>{'\u26a1 Jiff Admin'}</span>
          </button>
          <span style={{ fontSize:11, color:C.muted, background:'rgba(28,10,0,0.06)', padding:'2px 8px', borderRadius:20, fontFamily:"'DM Sans',sans-serif" }}>
            {SIDEBAR.flatMap(s=>s.items).find(t=>t.id===activeTab)?.label||'Overview'}
          </span>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          {activeTab!=='overview' && (
            <button onClick={()=>setActiveTab('overview')}
              style={{ padding:'6px 14px', borderRadius:20, fontSize:12, cursor:'pointer', border:'1.5px solid '+C.border, background:'white', color:C.muted, fontFamily:"'DM Sans',sans-serif" }}>
              {'\u2190 Home'}
            </button>
          )}
          <button onClick={()=>{ sessionStorage.removeItem('jiff-admin-auth'); navigate('/app'); }}
            style={{ padding:'6px 14px', borderRadius:20, fontSize:12, cursor:'pointer', border:'1.5px solid rgba(229,62,62,0.25)', background:'rgba(229,62,62,0.05)', color:C.red, fontFamily:"'DM Sans',sans-serif" }}>
            Sign out
          </button>
        </div>
      </header>

      <div style={{ display:'flex', minHeight:'calc(100vh - 53px)' }}>
        <nav style={{ width:196, flexShrink:0, background:'white', borderRight:'1px solid '+C.border, padding:'16px 0', position:'sticky', top:53, height:'calc(100vh - 53px)', overflowY:'auto' }}>
          {SIDEBAR.map(section => (
            <div key={section.group} style={{ marginBottom:6 }}>
              <div style={{ padding:'8px 20px 3px', fontSize:9, letterSpacing:'1.5px', textTransform:'uppercase', color:'rgba(28,10,0,0.3)', fontWeight:600, fontFamily:"'DM Sans',sans-serif" }}>
                {section.group}
              </div>
              {section.items.map(item => {
                const active = activeTab===item.id;
                return (
                  <button key={item.id} onClick={()=>setActiveTab(item.id)}
                    style={{ width:'100%', padding:'8px 20px', border:'none', textAlign:'left', background:active?'rgba(255,69,0,0.07)':'transparent', borderLeft:active?'3px solid '+C.jiff:'3px solid transparent', cursor:'pointer', fontFamily:"'DM Sans',sans-serif", fontSize:13, color:active?C.jiff:C.ink, fontWeight:active?500:400, display:'flex', alignItems:'center', gap:9, transition:'all 0.1s' }}>
                    <span style={{ fontSize:14 }}>{item.icon}</span>
                    {item.label}
                  </button>
                );
              })}
            </div>
          ))}
        </nav>

        <div style={{ flex:1, padding:'28px', overflowX:'hidden' }}>
          {activeTab==='overview'  && <Tab_OVERVIEW  {...tabProps}/>}
          {activeTab==='users'     && <Tab_USERS     {...tabProps}/>}
          {activeTab==='waitlist'  && <Tab_WAITLIST  {...tabProps}/>}
          {activeTab==='feedback'  && <Tab_FEEDBACK  {...tabProps}/>}
          {activeTab==='releases'  && <Tab_RELEASES  {...tabProps}/>}
          {activeTab==='cicd'      && <Tab_CICD      {...tabProps}/>}
          {activeTab==='tests'     && <Tab_TESTS     {...tabProps}/>}
          {activeTab==='status'    && <Tab_STATUS    {...tabProps}/>}
          {activeTab==='tools'     && <Tab_TOOLS     {...tabProps}/>}
          {activeTab==='api'       && <Tab_API       {...tabProps}/>}
          {activeTab==='techstack' && <Tab_TECHSTACK {...tabProps}/>}
          {activeTab==='security'  && <Tab_SECURITY  {...tabProps}/>}
          {activeTab==='rls'       && <Tab_RLS       {...tabProps}/>}
          {activeTab==='config'    && <Tab_CONFIG    {...tabProps}/>}
          {activeTab==='comms'     && <Tab_COMMS     {...tabProps}/>}
          {activeTab==='techdoc'   && <Tab_TECHDOC   {...tabProps}/>}
          {activeTab==='analytics' && <Tab_ANALYTICS {...tabProps}/>}
          {activeTab==='tokens'    && <Tab_TOKENS    {...tabProps}/>}
          {activeTab==='prompts'   && <Tab_PROMPTS   {...tabProps}/>}
          {activeTab==='uikit'     && <Tab_UIKIT     {...tabProps}/>}
          {activeTab==='growth'    && <Tab_GROWTH    {...tabProps}/>}
        </div>
      </div>
    </div>
  );
}
