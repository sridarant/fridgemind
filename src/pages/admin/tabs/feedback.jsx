// src/pages/admin/tabs/feedback.jsx — Admin tab component
export default function Tab_FEEDBACK({{ C, Card, ADMIN_KEY, adminKey, setAdminKey,
  stats, setStats, users, setUsers, waitlist, setWaitlist,
  feedback, setFeedback, releases, setReleases, loading, setLoading,
  premiumStatus, setPremiumStatus, lookerUrl, setLookerUrl,
  tokenStats, setTokenStats, rlsStatus, setRlsStatus }}) {{
  return (
    <>
() => {
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
        }
    </>
  );
}
