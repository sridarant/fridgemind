// src/pages/admin/tabs/users.jsx
import { useState, useEffect } from 'react';
import { fetchUsers } from '../../../services/adminService';

const C = { jiff:'#FF4500', ink:'#1C0A00', muted:'#7C6A5E', border:'rgba(28,10,0,0.08)', green:'#1D9E75', gold:'#D97706' };

function Card({ title, children }) {
  return (
    <div style={{ background:'white', border:'1px solid '+C.border, borderRadius:14, padding:'16px 20px', marginBottom:16 }}>
      {title && <div style={{ fontSize:11, letterSpacing:'1.5px', textTransform:'uppercase', color:C.jiff, fontWeight:700, marginBottom:12 }}>{title}</div>}
      {children}
    </div>
  );
}

export default function UsersTab() {
  const [users,    setUsers]   = useState([]);
  const [loading,  setLoading] = useState(true);
  const [search,   setSearch]  = useState('');

  useEffect(() => {
    fetchUsers()
      .then(r => r.json())
      .then(d => { setUsers(Array.isArray(d?.users) ? d.users : []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const filtered = search
    ? users.filter(u => (u.email||'').toLowerCase().includes(search.toLowerCase()) || (u.name||'').toLowerCase().includes(search.toLowerCase()))
    : users;

  if (loading) return <div style={{ padding:20, color:C.muted, fontSize:13 }}>Loading users…</div>;

  return (
    <div style={{ padding:'0 4px' }}>
      <Card title={'Users — ' + users.length + ' total'}>
        <input
          placeholder="Search by email or name…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{
            width:'100%', padding:'8px 12px', marginBottom:12,
            border:'1px solid '+C.border, borderRadius:8, fontSize:12,
            fontFamily:"'DM Sans',sans-serif", outline:'none', boxSizing:'border-box',
          }}
        />
        {filtered.length === 0 ? (
          <div style={{ textAlign:'center', padding:'24px 0', color:C.muted, fontSize:13 }}>No users found</div>
        ) : (
          <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
            {filtered.map((u, i) => (
              <div key={i} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'9px 12px', background:'rgba(28,10,0,0.02)', borderRadius:10, gap:8 }}>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontSize:13, fontWeight:500, color:C.ink, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                    {u.name || u.email || 'Unknown'}
                  </div>
                  <div style={{ fontSize:10, color:C.muted }}>
                    {u.email} · joined {u.created_at ? new Date(u.created_at).toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'}) : '—'}
                  </div>
                </div>
                <div style={{ display:'flex', gap:6, flexShrink:0 }}>
                  {u.tier === 'pro' && <span style={{ fontSize:10, background:'rgba(255,69,0,0.1)', color:C.jiff, borderRadius:20, padding:'2px 8px', fontWeight:600 }}>Pro</span>}
                  {u.streak > 0 && <span style={{ fontSize:10, background:'rgba(255,184,0,0.1)', color:C.gold, borderRadius:20, padding:'2px 8px' }}>{'🔥 ' + u.streak}</span>}
                  {u.onboarding_done && <span style={{ fontSize:10, color:C.green }}>✓ Setup</span>}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
