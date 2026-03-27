// src/pages/Admin.jsx — Admin dashboard for Jiff operations
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const C = { jiff:'#FF4500', ink:'#1C0A00', cream:'#FFFAF5', muted:'#7C6A5E', border:'rgba(28,10,0,0.10)', borderMid:'rgba(28,10,0,0.18)', shadow:'0 4px 24px rgba(28,10,0,0.08)', green:'#1D9E75', red:'#E53E3E' };
const ADMIN_KEY = 'jiff-admin-2026'; // Change this in production

function AdminCard({ title, children, accent }) {
  return (
    <div style={{ background:'white', border:'1px solid '+C.border, borderRadius:16, padding:'20px 22px', boxShadow:C.shadow, marginBottom:20 }}>
      <div style={{ fontSize:11, letterSpacing:'2px', textTransform:'uppercase', color:accent||C.jiff, fontWeight:500, marginBottom:14 }}>{title}</div>
      {children}
    </div>
  );
}

export default function Admin() {
  const navigate = useNavigate();
  const [authed, setAuthed] = useState(!!sessionStorage.getItem('jiff-admin-auth'));
  const [pass, setPass] = useState('');
  const [stats, setStats] = useState(null);
  const [waitlist, setWaitlist] = useState([]);
  const [feedback, setFeedback] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  const login = () => {
    if (pass === ADMIN_KEY) { sessionStorage.setItem('jiff-admin-auth','1'); setAuthed(true); }
    else alert('Incorrect admin key');
  };

  useEffect(() => {
    if (!authed) return;
    setLoading(true);
    // Load stats
    fetch('/api/stats').then(r=>r.json()).then(d=>setStats(d)).catch(()=>{});
    // Load waitlist from localStorage (global key)
    const wl = JSON.parse(localStorage.getItem('jiff-global-waitlist')||'[]');
    setWaitlist(wl);
    // Load feedback if Supabase configured
    fetch('/api/admin/feedback').then(r=>r.json()).then(d=>setFeedback(d.feedback||[])).catch(()=>{});
    setLoading(false);
  }, [authed]);

  if (!authed) return (
    <div style={{ minHeight:'100vh', background:C.cream, display:'flex', alignItems:'center', justifyContent:'center', fontFamily:"'DM Sans',sans-serif" }}>
      <div style={{ background:'white', border:'1px solid '+C.border, borderRadius:20, padding:'32px 28px', width:320, boxShadow:C.shadow }}>
        <div style={{ fontFamily:"'Fraunces',serif", fontSize:22, fontWeight:900, color:C.ink, marginBottom:6 }}>⚡ Jiff Admin</div>
        <div style={{ fontSize:12, color:C.muted, marginBottom:20, fontWeight:300 }}>Enter admin key to continue</div>
        <input type="password" value={pass} onChange={e=>setPass(e.target.value)}
          onKeyDown={e=>e.key==='Enter'&&login()}
          placeholder="Admin key"
          style={{ width:'100%', padding:'10px 12px', border:'1.5px solid '+C.borderMid, borderRadius:10, fontSize:13, fontFamily:"'DM Sans',sans-serif", marginBottom:12, boxSizing:'border-box', outline:'none' }}
        />
        <button onClick={login} style={{ width:'100%', background:C.jiff, color:'white', border:'none', borderRadius:10, padding:'11px', fontSize:13, fontWeight:500, cursor:'pointer', fontFamily:"'DM Sans',sans-serif" }}>
          Sign in
        </button>
        <button onClick={()=>navigate('/app')} style={{ width:'100%', background:'none', border:'none', marginTop:10, fontSize:12, color:C.muted, cursor:'pointer', fontFamily:"'DM Sans',sans-serif" }}>
          ← Back to app
        </button>
      </div>
    </div>
  );

  const tabs = ['overview','users','waitlist','feedback','tools'];
  return (
    <div style={{ minHeight:'100vh', background:C.cream, fontFamily:"'DM Sans',sans-serif" }}>
      <link href="https://fonts.googleapis.com/css2?family=Fraunces:wght@700;900&family=DM+Sans:wght@300;400;500&display=swap" rel="stylesheet"/>
      <header style={{ padding:'14px 28px', borderBottom:'1px solid '+C.border, background:'white', display:'flex', alignItems:'center', justifyContent:'space-between', position:'sticky', top:0, zIndex:10 }}>
        <div style={{ fontFamily:"'Fraunces',serif", fontSize:18, fontWeight:900, color:C.ink }}>⚡ Jiff Admin</div>
        <div style={{ display:'flex', gap:8 }}>
          {tabs.map(t=>(
            <button key={t} onClick={()=>setActiveTab(t)}
              style={{ padding:'6px 14px', borderRadius:20, fontSize:12, fontWeight:activeTab===t?500:400, cursor:'pointer', border:'1.5px solid '+(activeTab===t?C.jiff:C.border), background:activeTab===t?C.jiff:'white', color:activeTab===t?'white':C.muted, fontFamily:"'DM Sans',sans-serif", textTransform:'capitalize' }}>
              {t}
            </button>
          ))}
          <button onClick={()=>{sessionStorage.removeItem('jiff-admin-auth');navigate('/app');}}
            style={{ padding:'6px 12px', borderRadius:20, fontSize:12, cursor:'pointer', border:'1.5px solid '+C.border, background:'white', color:C.muted, fontFamily:"'DM Sans',sans-serif" }}>
            Sign out
          </button>
        </div>
      </header>

      <div style={{ maxWidth:960, margin:'0 auto', padding:'28px 24px' }}>

        {/* OVERVIEW */}
        {activeTab==='overview' && stats && (
          <>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(180px,1fr))', gap:14, marginBottom:20 }}>
              {[
                { n:stats.totalUsers?.toLocaleString()||'—', label:'Total users', color:C.jiff },
                { n:stats.totalMeals?.toLocaleString()||'—', label:'Meals generated', color:'#673AB7' },
                { n:stats.todayUsers||'—', label:'Active today', color:C.green },
                { n:stats.countriesCount||'—', label:'Countries', color:'#FF9800' },
              ].map(s=>(
                <div key={s.label} style={{ background:'white', border:'1px solid '+C.border, borderRadius:14, padding:'18px 20px', boxShadow:C.shadow }}>
                  <div style={{ fontFamily:"'Fraunces',serif", fontSize:34, fontWeight:900, color:s.color, lineHeight:1 }}>{s.n}</div>
                  <div style={{ fontSize:12, color:C.muted, marginTop:4, fontWeight:300 }}>{s.label}</div>
                </div>
              ))}
            </div>
            <AdminCard title="Top cuisines">
              {(stats.topCuisines||[]).map(c=>(
                <div key={c.name} style={{ display:'flex', alignItems:'center', gap:10, marginBottom:8 }}>
                  <div style={{ fontSize:12, color:C.ink, width:120, flexShrink:0 }}>{c.name}</div>
                  <div style={{ flex:1, height:6, background:'rgba(28,10,0,0.07)', borderRadius:3 }}>
                    <div style={{ height:'100%', width:`${c.pct}%`, background:C.jiff, borderRadius:3 }}/>
                  </div>
                  <div style={{ fontSize:11, color:C.muted, width:60, textAlign:'right' }}>{c.count?.toLocaleString()} · {c.pct}%</div>
                </div>
              ))}
            </AdminCard>
            <AdminCard title="Country breakdown">
              {(stats.topCountries||[]).map(c=>(
                <div key={c.code} style={{ display:'flex', alignItems:'center', gap:10, marginBottom:8 }}>
                  <div style={{ width:100, fontSize:12, color:C.ink, display:'flex', gap:6 }}><span>{c.flag}</span>{c.name}</div>
                  <div style={{ flex:1, height:6, background:'rgba(28,10,0,0.07)', borderRadius:3 }}>
                    <div style={{ height:'100%', width:`${c.pct}%`, background:'#673AB7', borderRadius:3 }}/>
                  </div>
                  <div style={{ fontSize:11, color:C.muted, width:80, textAlign:'right' }}>{c.users} users · {c.pct}%</div>
                </div>
              ))}
            </AdminCard>
          </>
        )}
        {activeTab==='overview' && !stats && (
          <div style={{ padding:'40px 0', textAlign:'center', color:C.muted, fontSize:14 }}>
            {loading ? 'Loading stats…' : 'Stats require Supabase to be configured. See SUPABASE_SETUP.md.'}
          </div>
        )}

        {/* WAITLIST */}
        {activeTab==='waitlist' && (
          <AdminCard title={`Waitlist — ${waitlist.length} entries`}>
            {waitlist.length === 0 ? (
              <div style={{ color:C.muted, fontSize:13, fontWeight:300 }}>No waitlist entries yet.</div>
            ) : (
              <>
                <button onClick={()=>{const csv='email,country,date\n'+waitlist.map(w=>`${w.email},${w.country},${new Date(w.ts).toLocaleDateString()}`).join('\n');const b=URL.createObjectURL(new Blob([csv],{type:'text/csv'}));Object.assign(document.createElement('a'),{href:b,download:'jiff-waitlist.csv'}).click();}}
                  style={{ background:C.green, color:'white', border:'none', borderRadius:8, padding:'7px 14px', fontSize:12, fontWeight:500, cursor:'pointer', fontFamily:"'DM Sans',sans-serif", marginBottom:14 }}>
                  ↓ Export CSV
                </button>
                <div style={{ maxHeight:400, overflow:'auto' }}>
                  <table style={{ width:'100%', borderCollapse:'collapse', fontSize:12 }}>
                    <thead>
                      <tr style={{ borderBottom:'1px solid '+C.border }}>
                        {['Email','Country','Date'].map(h=><th key={h} style={{ padding:'6px 8px', textAlign:'left', color:C.muted, fontWeight:500 }}>{h}</th>)}
                      </tr>
                    </thead>
                    <tbody>
                      {waitlist.map((w,i)=>(
                        <tr key={i} style={{ borderBottom:'1px solid rgba(28,10,0,0.05)' }}>
                          <td style={{ padding:'6px 8px' }}>{w.email}</td>
                          <td style={{ padding:'6px 8px' }}>{w.country}</td>
                          <td style={{ padding:'6px 8px', color:C.muted }}>{new Date(w.ts).toLocaleDateString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </AdminCard>
        )}

        {/* FEEDBACK */}
        {activeTab==='feedback' && (
          <AdminCard title={`User feedback — ${feedback.length} entries`}>
            {feedback.length === 0 ? (
              <div style={{ color:C.muted, fontSize:13, fontWeight:300 }}>No feedback yet, or Supabase not configured.</div>
            ) : feedback.map((f,i)=>(
              <div key={i} style={{ borderBottom:'1px solid rgba(28,10,0,0.07)', padding:'10px 0', marginBottom:4 }}>
                <div style={{ display:'flex', gap:10, alignItems:'center', marginBottom:4 }}>
                  <span style={{ fontSize:14 }}>{'⭐'.repeat(f.rating||0)}</span>
                  <span style={{ fontSize:11, color:C.muted }}>{f.category}</span>
                  <span style={{ fontSize:11, color:C.muted, marginLeft:'auto' }}>{new Date(f.created_at).toLocaleDateString()}</span>
                </div>
                <div style={{ fontSize:13, color:C.ink, fontWeight:300, lineHeight:1.6 }}>{f.message}</div>
              </div>
            ))}
          </AdminCard>
        )}

        {/* TOOLS */}
        {activeTab==='tools' && (
          <>
            <AdminCard title="Quick actions">
              <div style={{ display:'flex', gap:10, flexWrap:'wrap' }}>
                {[
                  { label:'View live app', action:()=>window.open('/app','_blank') },
                  { label:'View stats page', action:()=>window.open('/stats','_blank') },
                  { label:'Clear my test data', action:()=>{localStorage.removeItem('jiff-history');localStorage.removeItem('jiff-premium');alert('Test data cleared');} },
                  { label:'Export waitlist CSV', action:()=>{const wl=JSON.parse(localStorage.getItem('jiff-global-waitlist')||'[]');if(!wl.length){alert('No waitlist entries');return;}const csv='email,country,date\n'+wl.map(w=>`${w.email},${w.country||'?'},${new Date(w.ts).toLocaleDateString()}`).join('\n');const b=URL.createObjectURL(new Blob([csv],{type:'text/csv'}));Object.assign(document.createElement('a'),{href:b,download:'waitlist.csv'}).click();} },
                ].map(t=>(
                  <button key={t.label} onClick={t.action}
                    style={{ background:'white', border:'1.5px solid '+C.borderMid, borderRadius:10, padding:'9px 16px', fontSize:12, cursor:'pointer', fontFamily:"'DM Sans',sans-serif", color:C.ink }}>
                    {t.label}
                  </button>
                ))}
              </div>
            </AdminCard>
            <AdminCard title="Supabase status" accent={C.green}>
              <div style={{ fontSize:13, color:C.muted, fontWeight:300, lineHeight:2 }}>
                {[
                  ['REACT_APP_SUPABASE_URL',      !!process.env.REACT_APP_SUPABASE_URL],
                  ['REACT_APP_SUPABASE_ANON_KEY', !!process.env.REACT_APP_SUPABASE_ANON_KEY],
                ].map(([k,v])=>(
                  <div key={k}>{k}: <code style={{ background: v?'rgba(29,158,117,0.1)':'rgba(229,62,62,0.1)', color: v?C.green:C.red, padding:'2px 7px', borderRadius:4, fontSize:11 }}>{v?'✓ Set':'✗ Not set — add to Vercel env vars'}</code></div>
                ))}
                <div style={{ marginTop:10, padding:'8px 12px', background:'rgba(29,158,117,0.07)', borderRadius:8, fontSize:12, color:C.green, borderLeft:'3px solid '+C.green }}>
                  All variables set? Test by visiting <a href="/api/stats" target="_blank" style={{color:C.green}}>/api/stats</a> — if it returns JSON, Supabase is connected. If you see an error, check SUPABASE_SERVICE_ROLE_KEY is also set.
                </div>
              </div>
            </AdminCard>
          </>
        )}
      </div>
    </div>
  );
}
