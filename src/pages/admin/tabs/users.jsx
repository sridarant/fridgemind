// src/pages/admin/tabs/users.jsx
export default function Tab_USERS({ C, Card, users, waitlist, feedback,
  releases, stats, loading, tokenStats, rlsStatus, premiumStatus, lookerUrl,
  setStats, setUsers, setWaitlist, setFeedback, setReleases, setLoading,
  setTokenStats, setRlsStatus, setPremiumStatus, setLookerUrl }) {
  return (
    <>
      <Card title={`Users — ${users.length} loaded`}>
        {users.length === 0 ? (
          <div style={{color:C.muted,fontSize:13,fontWeight:300}}>
            No users loaded. Ensure SUPABASE_SERVICE_ROLE_KEY is set, then click Load in the Overview tab.
          </div>
        ) : (
          <div style={{maxHeight:400,overflow:'auto'}}>
            <table style={{width:'100%',borderCollapse:'collapse',fontSize:12}}>
              <thead><tr style={{borderBottom:'1px solid '+C.border}}>
                {['Name','Email','Country','Joined'].map(h=>(
                  <th key={h} style={{padding:'6px 8px',textAlign:'left',fontSize:10,letterSpacing:'1px',textTransform:'uppercase',color:C.muted,fontWeight:500}}>{h}</th>
                ))}
              </tr></thead>
              <tbody>
                {users.map((u,i)=>(
                  <tr key={i} style={{borderBottom:'1px solid rgba(28,10,0,0.04)'}}>
                    <td style={{padding:'6px 8px'}}>{u.name||'—'}</td>
                    <td style={{padding:'6px 8px'}}>{u.email}</td>
                    <td style={{padding:'6px 8px'}}>{u.country||'—'}</td>
                    <td style={{padding:'6px 8px',color:C.muted}}>{u.created_at?new Date(u.created_at).toLocaleDateString():''}</td>
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
