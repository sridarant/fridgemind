// src/pages/admin/tabs/crashes.jsx
import { useState, useEffect } from 'react';

const C = { jiff:'#FF4500', ink:'#1C0A00', muted:'#7C6A5E', border:'rgba(28,10,0,0.08)', red:'#E53E3E', gold:'#D97706' };

function Card({ title, accent, children }) {
  return (
    <div style={{ background:'white', border:'1px solid '+(accent?accent:C.border), borderRadius:14, padding:'16px 20px', marginBottom:16 }}>
      {title && <div style={{ fontSize:11, letterSpacing:'1.5px', textTransform:'uppercase', color:accent||C.jiff, fontWeight:700, marginBottom:12 }}>{title}</div>}
      {children}
    </div>
  );
}

export default function CrashesTab() {
  const [crashes, setCrashes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/admin?action=feedback', { method:'GET' })
      .then(r => r.json())
      .then(d => { setCrashes(Array.isArray(d?.feedback) ? d.feedback.filter(f => f.type === 'crash') : []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  if (loading) return <div style={{ padding:20, color:C.muted, fontSize:13 }}>Loading crash reports…</div>;

  return (
    <div style={{ padding:'0 4px' }}>
      <Card title={'Crash Reports — ' + crashes.length + ' total'} accent={C.red}>
        {crashes.length === 0 ? (
          <div style={{ textAlign:'center', padding:'24px 0', color:C.muted }}>
            <div style={{ fontSize:32, marginBottom:8 }}>✅</div>
            <div style={{ fontSize:14, fontWeight:500 }}>No crashes reported</div>
            <div style={{ fontSize:12, fontWeight:300 }}>ErrorBoundary catches and logs crashes via user feedback</div>
          </div>
        ) : (
          <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
            {crashes.map((c, i) => (
              <div key={i} style={{ padding:'10px 12px', background:'rgba(229,62,62,0.04)', border:'1px solid rgba(229,62,62,0.15)', borderRadius:10 }}>
                <div style={{ display:'flex', justifyContent:'space-between', marginBottom:4 }}>
                  <span style={{ fontSize:12, fontWeight:600, color:C.red }}>Crash #{i+1}</span>
                  <span style={{ fontSize:10, color:C.muted }}>{c.created_at ? new Date(c.created_at).toLocaleDateString('en-IN') : '—'}</span>
                </div>
                <div style={{ fontSize:12, color:C.ink, fontFamily:'monospace', wordBreak:'break-all' }}>{c.message || 'No message'}</div>
                {c.stack && <div style={{ fontSize:10, color:C.muted, marginTop:4, fontFamily:'monospace', maxHeight:60, overflow:'hidden' }}>{c.stack.slice(0,200)}…</div>}
              </div>
            ))}
          </div>
        )}
      </Card>

      <Card title="How crashes are captured">
        <div style={{ fontSize:12, color:C.muted, lineHeight:1.7 }}>
          Jiff wraps the app in an <code style={{ background:'rgba(28,10,0,0.05)', padding:'1px 6px', borderRadius:4 }}>ErrorBoundary</code> component. When a runtime crash occurs, the boundary catches it and renders a recovery UI, then sends the error + stack trace to <code style={{ background:'rgba(28,10,0,0.05)', padding:'1px 6px', borderRadius:4 }}>/api/comms?action=feedback</code> with type = crash. Crashes appear here and in the User Feedback tab.
        </div>
      </Card>
    </div>
  );
}
