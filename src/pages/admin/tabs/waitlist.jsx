// src/pages/admin/tabs/waitlist.jsx
export default function Tab_WAITLIST({ C, Card, users, waitlist, feedback,
  releases, stats, loading, tokenStats, rlsStatus, premiumStatus, lookerUrl,
  setStats, setUsers, setWaitlist, setFeedback, setReleases, setLoading,
  setTokenStats, setRlsStatus, setPremiumStatus, setLookerUrl }) {
  return (
    <>
      <Card title={`Waitlist — ${waitlist.length} entries`}>
        {waitlist.length === 0 ? (
          <div style={{color:C.muted,fontSize:13,fontWeight:300}}>No waitlist entries yet.</div>
        ) : (
          <div style={{maxHeight:400,overflow:'auto'}}>
            <table style={{width:'100%',borderCollapse:'collapse',fontSize:12}}>
              <thead><tr style={{borderBottom:'1px solid '+C.border}}>
                {['Email','Country','Joined'].map(h=>(
                  <th key={h} style={{padding:'6px 8px',textAlign:'left',fontSize:10,letterSpacing:'1px',textTransform:'uppercase',color:C.muted,fontWeight:500}}>{h}</th>
                ))}
              </tr></thead>
              <tbody>
                {waitlist.map((w,i)=>(
                  <tr key={i} style={{borderBottom:'1px solid rgba(28,10,0,0.04)'}}>
                    <td style={{padding:'6px 8px'}}>{w.email}</td>
                    <td style={{padding:'6px 8px'}}>{w.country||'—'}</td>
                    <td style={{padding:'6px 8px',color:C.muted}}>{w.ts?new Date(w.ts).toLocaleDateString():w.created_at?new Date(w.created_at).toLocaleDateString():''}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </>
  );
}
