// src/pages/Admin.jsx — Admin dashboard v17
import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

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
  const [toast,    setToast]    = useState('');
  // Tools state
  const [resetEmail,   setResetEmail]   = useState('');
  const [resetResult,  setResetResult]  = useState('');
  const [broadcastMsg, setBroadcastMsg] = useState('');
  const [broadcastSent,setBroadcastSent]= useState(false);
  const [releases,      setReleases]     = useState([]);
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
    setReleases(JSON.parse(localStorage.getItem('jiff-releases')||'[]'));
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
    } catch { setResetResult('✗ Network error'); }
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
    } catch { showToast('✗ Network error'); }
  };

  if (!authed) return (
    <div style={{ minHeight:'100vh', background:C.cream, display:'flex', alignItems:'center', justifyContent:'center', fontFamily:"'DM Sans',sans-serif" }}>
      <link href="https://fonts.googleapis.com/css2?family=Fraunces:wght@700;900&family=DM+Sans:wght@300;400;500&display=swap" rel="stylesheet"/>
      <div style={{ background:'white', border:'1px solid '+C.border, borderRadius:20, padding:'32px 28px', width:320, boxShadow:C.shadow }}>
        <div style={{ fontFamily:"'Fraunces',serif", fontSize:22, fontWeight:900, color:C.ink, marginBottom:4 }}>⚡ Jiff Admin</div>
        <div style={{ fontSize:12, color:C.muted, marginBottom:20, fontWeight:300 }}>Enter admin key to continue</div>
        <input type="password" value={pass} onChange={e=>setPass(e.target.value)} onKeyDown={e=>e.key==='Enter'&&login()}
          placeholder="Admin key"
          style={{ width:'100%', padding:'10px 12px', border:'1.5px solid '+C.borderMid, borderRadius:10, fontSize:13, fontFamily:"'DM Sans',sans-serif", marginBottom:12, boxSizing:'border-box', outline:'none' }}
        />
        <button onClick={login} style={{ width:'100%', background:C.jiff, color:'white', border:'none', borderRadius:10, padding:11, fontSize:13, fontWeight:500, cursor:'pointer', fontFamily:"'DM Sans',sans-serif" }}>
          Sign in
        </button>
        <button onClick={()=>navigate('/app')} style={{ width:'100%', background:'none', border:'none', marginTop:10, fontSize:12, color:C.muted, cursor:'pointer', fontFamily:"'DM Sans',sans-serif" }}>
          ← Back to app
        </button>
      </div>
    </div>
  );

  const tabs = [
    { id:'overview',  label:'📊 Overview' },
    { id:'users',     label:'👥 Users' },
    { id:'waitlist',  label:'📋 Waitlist' },
    { id:'feedback',  label:'💬 User Feedback' },
    { id:'crashes',   label:'💥 Crashes' },
    { id:'releases',  label:'🚀 Releases' },
    { id:'tools',     label:'🔧 Tools' },
    { id:'api',       label:'📡 API Usage' },
  ];

  return (
    <div style={{ minHeight:'100vh', background:C.cream, fontFamily:"'DM Sans',sans-serif" }}>
      <link href="https://fonts.googleapis.com/css2?family=Fraunces:wght@700;900&family=DM+Sans:wght@300;400;500&display=swap" rel="stylesheet"/>
      {/* Toast */}
      {toast && (
        <div style={{ position:'fixed', top:16, right:16, background:C.ink, color:'white', padding:'10px 18px', borderRadius:10, fontSize:13, zIndex:999, boxShadow:C.shadow }}>
          {toast}
        </div>
      )}
      <header style={{ padding:'14px 28px', borderBottom:'1px solid '+C.border, background:'white', display:'flex', alignItems:'center', justifyContent:'space-between', position:'sticky', top:0, zIndex:10 }}>
        <div style={{ fontFamily:"'Fraunces',serif", fontSize:18, fontWeight:900, color:C.ink }}>⚡ Jiff Admin</div>
        <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
          {tabs.map(t=>(
            <button key={t.id} onClick={()=>setActiveTab(t.id)}
              style={{ padding:'6px 12px', borderRadius:20, fontSize:11, fontWeight:activeTab===t.id?500:400, cursor:'pointer', border:'1.5px solid '+(activeTab===t.id?C.jiff:C.border), background:activeTab===t.id?C.jiff:'white', color:activeTab===t.id?'white':C.muted, fontFamily:"'DM Sans',sans-serif" }}>
              {t.label}
            </button>
          ))}
          <button onClick={()=>{sessionStorage.removeItem('jiff-admin-auth');navigate('/app');}}
            style={{ padding:'6px 12px', borderRadius:20, fontSize:11, cursor:'pointer', border:'1.5px solid '+C.border, background:'white', color:C.muted, fontFamily:"'DM Sans',sans-serif" }}>
            Sign out
          </button>
        </div>
      </header>

      <div style={{ maxWidth:960, margin:'0 auto', padding:'28px 24px' }}>

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
        {activeTab==='feedback' && (
          <Card title="User Feedback"
            action={<button onClick={()=>exportCSV(feedback.filter(f=>f.category!=='crash'),'jiff-user-feedback.csv',['rating','category','message','created_at'])} style={{ fontSize:11, padding:'4px 10px', borderRadius:8, border:'1px solid '+C.borderMid, background:'white', cursor:'pointer', fontFamily:"'DM Sans',sans-serif" }}>↓ CSV</button>}>
            {feedback.filter(f=>f.category!=='crash').length === 0 ? (
              <div style={{ color:C.muted, fontSize:13, fontWeight:300 }}>No user feedback yet. Requires Supabase Phase 3 + <code style={{fontSize:11}}>SUPABASE_SERVICE_ROLE_KEY</code>.</div>
            ) : feedback.filter(f=>f.category!=='crash').map((f,i)=>(
              <div key={i} style={{ borderBottom:'1px solid rgba(28,10,0,0.05)', padding:'10px 0' }}>
                <div style={{ display:'flex', gap:8, alignItems:'center', marginBottom:4 }}>
                  <span style={{ fontSize:13 }}>{'⭐'.repeat(f.rating||0)||'💬'}</span>
                  <span style={{ fontSize:11, color:C.muted, background:'rgba(28,10,0,0.05)', borderRadius:20, padding:'2px 8px' }}>{f.category||'general'}</span>
                  <span style={{ fontSize:11, color:C.muted, marginLeft:'auto' }}>{f.created_at ? new Date(f.created_at).toLocaleDateString() : ''}</span>
                </div>
                <div style={{ fontSize:12, color:C.ink, fontWeight:300, lineHeight:1.6 }}>{f.message}</div>
              </div>
            ))}
          </Card>
        )}

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
            <Card title="Quick actions">
              <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
                {[
                  { label:'View live app',      action:()=>window.open('/app','_blank') },
                  { label:'View stats page',     action:()=>window.open('/stats','_blank') },
                  { label:'View API docs',       action:()=>window.open('/api-docs','_blank') },
                  { label:'Test /api/stats',     action:()=>window.open('/api/stats','_blank') },
                  { label:'Clear my test data',  action:()=>{ localStorage.removeItem('jiff-history'); localStorage.removeItem('jiff-premium'); showToast('✓ Test data cleared'); }},
                  { label:'Export waitlist CSV', action:()=>{ const wl=JSON.parse(localStorage.getItem('jiff-global-waitlist')||'[]'); if(!wl.length){showToast('No waitlist entries');return;} exportCSV(wl,'waitlist.csv',['email','country','ts']); }},
                ].map(t=>(
                  <button key={t.label} onClick={t.action}
                    style={{ background:'white', border:'1.5px solid '+C.borderMid, borderRadius:10, padding:'9px 14px', fontSize:12, cursor:'pointer', fontFamily:"'DM Sans',sans-serif", color:C.ink, transition:'all 0.15s' }}
                    onMouseEnter={e=>e.target.style.background=C.cream}
                    onMouseLeave={e=>e.target.style.background='white'}>
                    {t.label}
                  </button>
                ))}
              </div>
            </Card>

            {/* Supabase status */}
            <Card title="Supabase status" accent={C.green}>
              <div style={{ fontSize:13, color:C.muted, fontWeight:300, lineHeight:2 }}>
                {[
                  ['REACT_APP_SUPABASE_URL',      !!process.env.REACT_APP_SUPABASE_URL],
                  ['REACT_APP_SUPABASE_ANON_KEY', !!process.env.REACT_APP_SUPABASE_ANON_KEY],
                ].map(([k,v])=>(
                  <div key={k}>{k}: <code style={{ background:v?'rgba(29,158,117,0.1)':'rgba(229,62,62,0.1)', color:v?C.green:C.red, padding:'2px 7px', borderRadius:4, fontSize:11 }}>{v?'✓ Set':'✗ Not set'}</code></div>
                ))}
                <div style={{ marginTop:10, padding:'8px 12px', background:'rgba(29,158,117,0.07)', borderRadius:8, fontSize:12, color:C.green, borderLeft:'3px solid '+C.green }}>
                  Test connectivity: <a href="/api/stats" target="_blank" style={{ color:C.green, fontWeight:500 }}>/api/stats</a> should return JSON. Also ensure <code style={{ fontSize:11 }}>SUPABASE_SERVICE_ROLE_KEY</code> is set (server-side variable, NOT prefixed with REACT_APP_).
                </div>
              </div>
            </Card>
          </>
        )}

        {/* RELEASES */}
        {activeTab==='releases' && (
          <>
            <Card title="Log New Release">
              <div style={{display:'flex',gap:8,flexWrap:'wrap',marginBottom:10}}>
                <input value={newRelease.version} onChange={e=>setNewRelease(r=>({...r,version:e.target.value}))}
                  placeholder="v18.0" style={{width:80,padding:'8px 10px',border:'1.5px solid '+C.borderMid,borderRadius:8,fontSize:12,fontFamily:"'DM Sans',sans-serif",outline:'none'}}/>
                <input value={newRelease.title} onChange={e=>setNewRelease(r=>({...r,title:e.target.value}))}
                  placeholder="Release title" style={{flex:1,minWidth:180,padding:'8px 10px',border:'1.5px solid '+C.borderMid,borderRadius:8,fontSize:12,fontFamily:"'DM Sans',sans-serif",outline:'none'}}/>
                <select value={newRelease.status} onChange={e=>setNewRelease(r=>({...r,status:e.target.value}))}
                  style={{padding:'8px 10px',border:'1.5px solid '+C.borderMid,borderRadius:8,fontSize:12,fontFamily:"'DM Sans',sans-serif",background:'white',outline:'none'}}>
                  {[['deployed','✅ Deployed'],['draft','📝 Draft'],['rollback','⏪ Rollback']].map(([v,l])=>(
                    <option key={v} value={v}>{l}</option>
                  ))}
                </select>
              </div>
              <textarea value={newRelease.summary} onChange={e=>setNewRelease(r=>({...r,summary:e.target.value}))}
                placeholder="What changed in this release?" rows={3}
                style={{width:'100%',padding:'8px 10px',border:'1.5px solid '+C.borderMid,borderRadius:8,fontSize:12,fontFamily:"'DM Sans',sans-serif",outline:'none',resize:'vertical',boxSizing:'border-box',marginBottom:8}}/>
              <button onClick={async()=>{
                if(!newRelease.version||!newRelease.title) return;
                const entry={...newRelease,deployed_at:new Date().toISOString()};
                const saved=JSON.parse(localStorage.getItem('jiff-releases')||'[]');
                saved.unshift(entry); localStorage.setItem('jiff-releases',JSON.stringify(saved));
                setReleases(saved); setNewRelease({version:'',title:'',summary:'',status:'deployed'});
                showToast('✓ Release logged');
              }} style={{background:C.jiff,color:'white',border:'none',borderRadius:8,padding:'8px 16px',fontSize:12,fontWeight:500,cursor:'pointer',fontFamily:"'DM Sans',sans-serif"}}>
                Log release
              </button>
            </Card>
            <Card title={`Release history — ${releases.length} entries`}
              action={<button onClick={()=>{const rs=JSON.parse(localStorage.getItem('jiff-releases')||'[]');setReleases(rs);}} style={{fontSize:11,padding:'4px 10px',borderRadius:8,border:'1px solid '+C.borderMid,background:'white',cursor:'pointer',fontFamily:"'DM Sans',sans-serif"}}>↻ Refresh</button>}>
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

      </div>
    </div>
  );
}
