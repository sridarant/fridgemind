// src/pages/admin/tabs/growth.jsx
// Growth dashboard — events funnel, key metrics, recommendation log.
// No external libraries — inline styles matching AdminShell design system.

import { useState, useEffect } from 'react';
import { fetchAdminStats } from '../../../services/adminService';

const C = {
  jiff:'#FF4500', ink:'#1C0A00', muted:'#7C6A5E',
  border:'rgba(28,10,0,0.08)', cream:'#FFFAF5', warm:'#FFF0E5',
  green:'#1D9E75', red:'#E53E3E', purple:'#7C3AED', blue:'#2563EB', gold:'#D97706',
};

const FUNNEL = [
  { key:'users',       label:'Total users',        color:C.blue   },
  { key:'generations', label:'Meals generated',    color:C.jiff   },
  { key:'paywalls',    label:'Paywall shown',       color:C.purple },
  { key:'upgrades',    label:'Upgrade clicked',     color:C.gold   },
  { key:'subscribers', label:'Subscribed (paid)',   color:C.green  },
];

const ACTION_COLORS = {
  accepted:  C.green,
  completed: '#059669',
  saved:     C.blue,
  swapped:   C.gold,
  rejected:  C.red,
};

function StatCard({ label, value, color, sub }) {
  return (
    <div style={{ background:'white', border:'1px solid '+C.border, borderRadius:14, padding:'16px 20px', flex:'1 1 120px' }}>
      <div style={{ fontSize:10, letterSpacing:'1.5px', textTransform:'uppercase', color:C.muted, fontWeight:600, marginBottom:8 }}>{label}</div>
      <div style={{ fontFamily:"'Fraunces',serif", fontSize:30, fontWeight:900, color:color||C.ink, lineHeight:1 }}>
        {value === null || value === undefined ? '—' : Number(value).toLocaleString()}
      </div>
      {sub && <div style={{ fontSize:11, color:C.muted, marginTop:6, fontWeight:300 }}>{sub}</div>}
    </div>
  );
}

function FunnelRow({ label, value, max, color, convLabel }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div style={{ marginBottom:14 }}>
      <div style={{ display:'flex', justifyContent:'space-between', marginBottom:4 }}>
        <span style={{ fontSize:12, color:C.ink, fontWeight:500 }}>{label}</span>
        <div style={{ display:'flex', gap:12, alignItems:'center' }}>
          {convLabel && <span style={{ fontSize:10, color:C.muted }}>{convLabel}</span>}
          <span style={{ fontSize:13, fontWeight:700, color, minWidth:40, textAlign:'right' }}>
            {value !== null && value !== undefined ? Number(value).toLocaleString() : '—'}
          </span>
        </div>
      </div>
      <div style={{ height:7, background:C.warm, borderRadius:4 }}>
        <div style={{ height:'100%', width:pct+'%', background:color, borderRadius:4, transition:'width 0.4s ease' }} />
      </div>
    </div>
  );
}

function ActionBadge({ action }) {
  const color = ACTION_COLORS[action] || C.muted;
  return (
    <span style={{ display:'inline-flex', alignItems:'center', gap:4, fontSize:10, fontWeight:600, color, background:color+'18', border:'1px solid '+color+'40', borderRadius:20, padding:'2px 8px' }}>
      <span style={{ width:6, height:6, borderRadius:'50%', background:color, display:'inline-block' }} />
      {action}
    </span>
  );
}

async function fetchRecommendationLogAdmin(limit = 100) {
  // Direct Supabase query via admin endpoint (uses service role key on backend)
  try {
    const res = await fetch(`/api/admin?action=recommendation-log&userId=all&limit=${limit}`);
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data?.log) ? data.log : [];
  } catch { return []; }
}

async function fetchMetrics() {
  try {
    const res = await fetch('/api/admin?action=metrics');
    if (!res.ok) return null;
    return res.json();
  } catch { return null; }
}

export default function Tab_GROWTH({ stats }) {
  const [metrics,  setMetrics]  = useState(null);
  const [recLog,   setRecLog]   = useState([]);
  const [filter,   setFilter]   = useState('all');
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState(null);

  useEffect(() => {
    setLoading(true);
    Promise.all([fetchMetrics(), fetchRecommendationLogAdmin(150)])
      .then(([m, log]) => {
        setMetrics(m);
        setRecLog(log);
        setLoading(false);
      })
      .catch(err => { setError(err.message); setLoading(false); });
  }, []);

  // Derive action counts from recommendation log
  const actionCounts = recLog.reduce((acc, row) => {
    acc[row.action] = (acc[row.action] || 0) + 1;
    return acc;
  }, {});

  const acceptRate = actionCounts.accepted && (actionCounts.accepted + (actionCounts.rejected || 0)) > 0
    ? ((actionCounts.accepted / (actionCounts.accepted + (actionCounts.rejected || 0))) * 100).toFixed(1) + '%'
    : null;

  const filtered = filter === 'all' ? recLog : recLog.filter(r => r.action === filter);

  // Build funnel data merging stats + metrics
  const funnelData = {
    users:       stats?.totalUsers        || metrics?.users       || null,
    generations: stats?.totalGenerations  || metrics?.generations || null,
    paywalls:    metrics?.paywalls        || null,
    upgrades:    metrics?.upgrades        || null,
    subscribers: metrics?.subscribers     || null,
  };
  const funnelMax = funnelData.users || funnelData.generations || 1;

  if (loading) return (
    <div style={{ padding:40, textAlign:'center', color:C.muted, fontSize:13 }}>Loading growth data…</div>
  );

  if (error) return (
    <div style={{ padding:40, color:C.red }}>
      <div style={{ fontSize:16, marginBottom:8, fontWeight:600 }}>⚠ Could not load metrics</div>
      <div style={{ fontSize:12, fontWeight:300 }}>{error}</div>
      <div style={{ fontSize:11, color:C.muted, marginTop:8 }}>
        Ensure the <code>recommendation_log</code> and <code>events</code> tables exist in Supabase.
      </div>
    </div>
  );

  return (
    <div style={{ maxWidth:900, paddingBottom:40 }}>

      {/* Header */}
      <div style={{ marginBottom:24 }}>
        <div style={{ fontFamily:"'Fraunces',serif", fontSize:22, fontWeight:900, color:C.ink }}>Growth Dashboard</div>
        <div style={{ fontSize:12, color:C.muted, marginTop:4, fontWeight:300 }}>
          Funnel · Recommendation feedback · Behaviour signals
        </div>
      </div>

      {/* Stat cards row */}
      <div style={{ display:'flex', gap:12, marginBottom:24, flexWrap:'wrap' }}>
        <StatCard label="Accepted"   value={actionCounts.accepted}  color={C.green}  sub="Cook this tapped" />
        <StatCard label="Completed"  value={actionCounts.completed} color='#059669'  sub="Cooked it confirmed" />
        <StatCard label="Saved"      value={actionCounts.saved}     color={C.blue}   sub="Favourited" />
        <StatCard label="Rejected"   value={actionCounts.rejected}  color={C.red}    sub="Not for me" />
        {acceptRate && (
          <StatCard label="Accept rate" value={null} color={C.green} sub={acceptRate + ' accept vs reject'} />
        )}
      </div>

      {/* Conversion funnel */}
      <div style={{ background:'white', border:'1px solid '+C.border, borderRadius:16, padding:'20px 24px', marginBottom:24 }}>
        <div style={{ fontSize:11, letterSpacing:'2px', textTransform:'uppercase', color:C.muted, fontWeight:600, marginBottom:18 }}>
          Conversion funnel
        </div>
        {FUNNEL.map((step, i) => {
          const val     = funnelData[step.key];
          const prevVal = i > 0 ? funnelData[FUNNEL[i-1].key] : null;
          const conv    = prevVal && val !== null ? ((val / prevVal) * 100).toFixed(1) + '% from prev' : null;
          return (
            <FunnelRow
              key={step.key}
              label={step.label}
              value={val}
              max={funnelMax}
              color={step.color}
              convLabel={conv}
            />
          );
        })}
        {!funnelData.users && !funnelData.generations && (
          <div style={{ fontSize:12, color:C.muted, fontWeight:300 }}>
            No funnel data yet — run Supabase migrations and deploy events tracking.
          </div>
        )}
      </div>

      {/* Recommendation log table */}
      <div style={{ background:'white', border:'1px solid '+C.border, borderRadius:16, overflow:'hidden' }}>
        <div style={{ padding:'16px 20px', borderBottom:'1px solid '+C.border, display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:8 }}>
          <div style={{ fontSize:11, letterSpacing:'2px', textTransform:'uppercase', color:C.muted, fontWeight:600 }}>
            Recommendation log ({filtered.length})
          </div>
          <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
            {['all', 'accepted', 'completed', 'saved', 'swapped', 'rejected'].map(a => (
              <button key={a} onClick={() => setFilter(a)}
                style={{ padding:'4px 10px', borderRadius:12, fontSize:11, cursor:'pointer', fontFamily:"'DM Sans',sans-serif", border:'1px solid '+(filter===a ? C.jiff : C.border), background:filter===a ? 'rgba(255,69,0,0.08)' : 'white', color:filter===a ? C.jiff : C.muted, fontWeight:filter===a ? 600 : 400 }}>
                {a === 'all' ? 'All' : a}
              </button>
            ))}
          </div>
        </div>

        {filtered.length === 0 ? (
          <div style={{ padding:32, textAlign:'center', color:C.muted, fontSize:12 }}>
            {recLog.length === 0
              ? 'No feedback events yet — they appear when users tap "Cook this" or "Not for me" on recommendations.'
              : 'No events match this filter.'}
          </div>
        ) : (
          <div style={{ overflowX:'auto' }}>
            <table style={{ width:'100%', borderCollapse:'collapse' }}>
              <thead>
                <tr style={{ background:C.cream }}>
                  {['Action', 'Meal', 'Cuisine', 'Position', 'Time'].map(h => (
                    <th key={h} style={{ padding:'8px 12px', textAlign:'left', fontSize:10, color:C.muted, letterSpacing:'1px', textTransform:'uppercase', fontWeight:600 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.slice(0, 60).map((row, i) => (
                  <tr key={row.id || i} style={{ background: i % 2 === 0 ? 'white' : C.cream }}>
                    <td style={{ padding:'8px 12px' }}><ActionBadge action={row.action} /></td>
                    <td style={{ padding:'8px 12px', fontSize:12, color:C.ink, maxWidth:180, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{row.meal_name || row.meal_id || '—'}</td>
                    <td style={{ padding:'8px 12px', fontSize:11, color:C.muted }}>{row.cuisine || '—'}</td>
                    <td style={{ padding:'8px 12px', fontSize:11, color:C.muted, textAlign:'center' }}>
                      {row.position !== null && row.position !== undefined
                        ? row.position === 0 ? 'Primary' : 'Alt ' + row.position
                        : '—'}
                    </td>
                    <td style={{ padding:'8px 12px', fontSize:10, color:C.muted, whiteSpace:'nowrap' }}>
                      {row.created_at ? new Date(row.created_at).toLocaleString('en-IN', { dateStyle:'short', timeStyle:'short' }) : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
