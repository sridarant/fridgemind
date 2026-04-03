// src/pages/admin/tabs/waitlist.jsx — Admin tab component
// Props received from AdminShell: C, Card, ADMIN_KEY, adminKey, stats, users,
//   waitlist, feedback, releases, loading, premiumStatus, lookerUrl,
//   tokenStats, rlsStatus, setStats, setUsers, setWaitlist, setFeedback,
//   setReleases, setLoading, setPremiumStatus, setLookerUrl,
//   setTokenStats, setRlsStatus, activeTab

export default function Tab_WAITLIST({{ C, Card, ADMIN_KEY, adminKey, setAdminKey,
  stats, setStats, users, setUsers, waitlist, setWaitlist,
  feedback, setFeedback, releases, setReleases, loading, setLoading,
  premiumStatus, setPremiumStatus, lookerUrl, setLookerUrl,
  tokenStats, setTokenStats, rlsStatus, setRlsStatus }}) {{
  return (
    <>
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
    </>
  );
}
