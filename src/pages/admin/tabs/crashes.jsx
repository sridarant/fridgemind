// src/pages/admin/tabs/crashes.jsx — Admin tab component
export default function Tab_CRASHES({ C, Card, ADMIN_KEY, adminKey, setAdminKey,
  stats, setStats, users, setUsers, waitlist, setWaitlist,
  feedback, setFeedback, releases, setReleases, loading, setLoading,
  premiumStatus, setPremiumStatus, lookerUrl, setLookerUrl,
  tokenStats, setTokenStats, rlsStatus, setRlsStatus }) {{
  return (
    <>
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
        
    </>
  );
}
