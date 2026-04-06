// src/pages/admin/tabs/feedback.jsx
import { useState, useEffect } from 'react';

const C = { jiff:'#FF4500', ink:'#1C0A00', muted:'#7C6A5E', border:'rgba(28,10,0,0.08)', green:'#1D9E75', gold:'#D97706' };

function Card({ title, children }) {
  return (
    <div style={{ background:'white', border:'1px solid '+C.border, borderRadius:14, padding:'16px 20px', marginBottom:16 }}>
      {title && <div style={{ fontSize:11, letterSpacing:'1.5px', textTransform:'uppercase', color:C.jiff, fontWeight:700, marginBottom:12 }}>{title}</div>}
      {children}
    </div>
  );
}

const TYPE_COLORS = { bug: '#E53E3E', suggestion: '#D97706', general: C.jiff, crash: '#9B2C2C' };
const TYPE_EMOJI  = { bug: '🐛', suggestion: '💡', general: '💬', crash: '💥' };

export default function FeedbackTab() {
  const [items,   setItems]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter,  setFilter]  = useState('all');

  useEffect(() => {
    fetch('/api/admin?action=feedback', { method:'GET' })
      .then(r => r.json())
      .then(d => { setItems(Array.isArray(d?.feedback) ? d.feedback : []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const types   = ['all', 'bug', 'suggestion', 'general'];
  const nonCrash = items.filter(f => f.type !== 'crash');
  const filtered = filter === 'all' ? nonCrash : nonCrash.filter(f => f.type === filter);
  const counts   = types.reduce((acc, t) => { acc[t] = t === 'all' ? nonCrash.length : nonCrash.filter(f => f.type === t).length; return acc; }, {});

  if (loading) return <div style={{ padding:20, color:C.muted, fontSize:13 }}>Loading feedback…</div>;

  return (
    <div style={{ padding:'0 4px' }}>
      <Card title={'User Feedback — ' + nonCrash.length + ' entries'}>
        {/* Filter chips */}
        <div style={{ display:'flex', gap:6, flexWrap:'wrap', marginBottom:16 }}>
          {types.map(t => (
            <button key={t} onClick={() => setFilter(t)}
              style={{
                padding:'5px 12px', borderRadius:20, fontSize:11, cursor:'pointer',
                border:'1.5px solid '+(filter===t ? TYPE_COLORS[t]||C.jiff : C.border),
                background: filter===t ? 'rgba(255,69,0,0.07)' : 'white',
                color: filter===t ? TYPE_COLORS[t]||C.jiff : C.muted,
                fontFamily:"'DM Sans',sans-serif", fontWeight: filter===t ? 600 : 400,
              }}>
              {TYPE_EMOJI[t]||''} {t.charAt(0).toUpperCase()+t.slice(1)} ({counts[t]})
            </button>
          ))}
        </div>

        {filtered.length === 0 ? (
          <div style={{ textAlign:'center', padding:'24px 0', color:C.muted, fontSize:13 }}>No {filter === 'all' ? '' : filter} feedback yet</div>
        ) : (
          <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
            {filtered.map((f, i) => (
              <div key={i} style={{ padding:'10px 14px', background:'rgba(28,10,0,0.02)', border:'1px solid '+C.border, borderRadius:10 }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:4 }}>
                  <span style={{ fontSize:11, fontWeight:600, color: TYPE_COLORS[f.type]||C.muted }}>
                    {TYPE_EMOJI[f.type]||'💬'} {f.type || 'general'}
                  </span>
                  <span style={{ fontSize:10, color:C.muted }}>
                    {f.created_at ? new Date(f.created_at).toLocaleDateString('en-IN', {day:'numeric',month:'short',year:'numeric'}) : '—'}
                  </span>
                </div>
                <div style={{ fontSize:13, color:C.ink, lineHeight:1.5 }}>{f.message || f.content || '—'}</div>
                {f.email && <div style={{ fontSize:10, color:C.muted, marginTop:4 }}>From: {f.email}</div>}
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
