// src/pages/admin/tabs/users.jsx — Admin tab component
// Props received from AdminShell: C, Card, ADMIN_KEY, adminKey, stats, users,
//   waitlist, feedback, releases, loading, premiumStatus, lookerUrl,
//   tokenStats, rlsStatus, setStats, setUsers, setWaitlist, setFeedback,
//   setReleases, setLoading, setPremiumStatus, setLookerUrl,
//   setTokenStats, setRlsStatus, activeTab

export default function Tab_USERS({{ C, Card, ADMIN_KEY, adminKey, setAdminKey,
  stats, setStats, users, setUsers, waitlist, setWaitlist,
  feedback, setFeedback, releases, setReleases, loading, setLoading,
  premiumStatus, setPremiumStatus, lookerUrl, setLookerUrl,
  tokenStats, setTokenStats, rlsStatus, setRlsStatus }}) {{
  return (
    <>
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
    </>
  );
}
