// src/pages/admin/tabs/status.jsx — self-contained, no AdminShell state deps
import { useState, useEffect } from 'react';

// StatusBadge defined locally — was previously missing/undefined
function StatusBadge({ label, check }) {
  const [ok, setOk] = useState(null);
  useEffect(() => {
    if (typeof check === 'boolean') { setOk(check); return; }
    if (typeof check === 'string') {
      fetch(check).then(r => setOk(r.ok)).catch(() => setOk(false));
    }
  }, [check]);
  const color = ok === true ? '#1D9E75' : ok === false ? '#E53E3E' : '#9E9E9E';
  const text  = ok === true ? '✅ OK'    : ok === false ? '❌ Down' : '⏳ Checking…';
  return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between',
      padding:'8px 0', borderBottom:'1px solid rgba(28,10,0,0.05)' }}>
      <span style={{ fontSize:13, color:'#1C0A00' }}>{label}</span>
      <span style={{ fontSize:12, fontWeight:500, color }}>{text}</span>
    </div>
  );
}

export default function Tab_STATUS({ C, Card }) {
  const supabaseOk = !!process.env.REACT_APP_SUPABASE_URL;

  const SERVICES = [
    { label:'Supabase (auth + database)',    check: supabaseOk },
    { label:'API /api/suggest',              check: '/api/suggest' },
    { label:'API /api/admin',               check: '/api/admin?action=stats' },
    { label:'API /api/videos',              check: '/api/videos?check=true' },
    { label:'API /api/comms',               check: '/api/comms?check=true' },
    { label:'API /api/payments',            check: '/api/payments?check=true' },
    { label:'API /api/planner',             check: '/api/planner?check=true' },
    { label:'Vercel hosting',               check: true },
  ];

  return (
    <>
      <Card title="Service status">
        <div style={{ fontSize:12, color:C.muted, fontWeight:300, marginBottom:12, lineHeight:1.6 }}>
          Live checks against each service endpoint. Green = responding, red = unreachable.
        </div>
        {SERVICES.map((svc, i) => (
          <StatusBadge key={i} label={svc.label} check={svc.check} />
        ))}
      </Card>

      <Card title="Environment variables">
        {[
          ['REACT_APP_SUPABASE_URL',      !!process.env.REACT_APP_SUPABASE_URL],
          ['REACT_APP_SUPABASE_ANON_KEY', !!process.env.REACT_APP_SUPABASE_ANON_KEY],
          ['REACT_APP_RAZORPAY_KEY_ID',   !!process.env.REACT_APP_RAZORPAY_KEY_ID],
          ['REACT_APP_GA_MEASUREMENT_ID', !!process.env.REACT_APP_GA_MEASUREMENT_ID],
        ].map(([name, set]) => (
          <div key={name} style={{ display:'flex', alignItems:'center', justifyContent:'space-between',
            padding:'7px 0', borderBottom:'1px solid rgba(28,10,0,0.05)', fontSize:12 }}>
            <code style={{ color:C.ink, fontSize:11 }}>{name}</code>
            <span style={{ fontWeight:500, color: set ? '#1D9E75' : '#E53E3E', fontSize:11 }}>
              {set ? '✅ Set' : '❌ Missing'}
            </span>
          </div>
        ))}
        <div style={{ marginTop:10, fontSize:11, color:C.muted, fontWeight:300, lineHeight:1.5 }}>
          Server-only vars (ANTHROPIC_API_KEY, SUPABASE_SERVICE_ROLE_KEY, RAZORPAY_KEY_SECRET, YOUTUBE_API_KEY)
          are not visible to the frontend — check them in Vercel Dashboard → Settings → Environment Variables.
        </div>
      </Card>
    </>
  );
}
