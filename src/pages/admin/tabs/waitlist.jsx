// src/pages/admin/tabs/waitlist.jsx
import { useState, useEffect } from 'react';

const C = { jiff:'#FF4500', ink:'#1C0A00', muted:'#7C6A5E', border:'rgba(28,10,0,0.08)', green:'#1D9E75' };

function Card({ title, children }) {
  return (
    <div style={{ background:'white', border:'1px solid '+C.border, borderRadius:14, padding:'16px 20px', marginBottom:16 }}>
      {title && <div style={{ fontSize:11, letterSpacing:'1.5px', textTransform:'uppercase', color:C.jiff, fontWeight:700, marginBottom:12 }}>{title}</div>}
      {children}
    </div>
  );
}

export default function WaitlistTab() {
  const [waitlist, setWaitlist] = useState([]);
  const [loading,  setLoading]  = useState(true);

  useEffect(() => {
    fetch('/api/admin?action=waitlist', { method:'GET' })
      .then(r => r.json())
      .then(d => { setWaitlist(Array.isArray(d?.waitlist) ? d.waitlist : []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  if (loading) return <div style={{ padding:20, color:C.muted, fontSize:13 }}>Loading waitlist…</div>;

  return (
    <div style={{ padding:'0 4px' }}>
      <Card title={'Waitlist — ' + waitlist.length + ' entries'}>
        {waitlist.length === 0 ? (
          <div style={{ textAlign:'center', padding:'24px 0', color:C.muted }}>
            <div style={{ fontSize:32, marginBottom:8 }}>📋</div>
            <div style={{ fontSize:14, fontWeight:500 }}>No waitlist entries yet</div>
            <div style={{ fontSize:12, fontWeight:300 }}>Emails captured from Landing page and Pricing page appear here</div>
          </div>
        ) : (
          <>
            <div style={{ marginBottom:12, fontSize:12, color:C.muted }}>
              Emails captured from Landing + Pricing pages — these are pre-signup interest leads.
            </div>
            <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
              {waitlist.map((w, i) => (
                <div key={i} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'9px 12px', background:'rgba(28,10,0,0.02)', borderRadius:10 }}>
                  <div style={{ fontSize:13, color:C.ink }}>{w.email}</div>
                  <div style={{ fontSize:10, color:C.muted }}>
                    {w.ts ? new Date(w.ts).toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'}) : '—'}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </Card>

      <Card title="How waitlist works">
        <div style={{ fontSize:12, color:C.muted, lineHeight:1.7 }}>
          The Landing page and Pricing page both have email capture forms. Submissions go to <code style={{ background:'rgba(28,10,0,0.05)', padding:'1px 6px', borderRadius:4 }}>/api/comms?action=email</code> and are stored in Supabase with source tracking. Once Razorpay onboarding is complete, an automated email blast to this list can be triggered from the Comms tab.
        </div>
      </Card>
    </div>
  );
}
