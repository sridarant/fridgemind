// src/pages/admin/tabs/api.jsx
import { useState, useEffect } from 'react';
import { fetchAdminStats } from '../../../services/adminService';

const C = { jiff:'#FF4500', ink:'#1C0A00', muted:'#7C6A5E', border:'rgba(28,10,0,0.08)', green:'#1D9E75', red:'#E53E3E' };

function Card({ title, children }) {
  return (
    <div style={{ background:'white', border:'1px solid ' + C.border, borderRadius:14, padding:'16px 20px', marginBottom:16 }}>
      {title && <div style={{ fontSize:11, letterSpacing:'1.5px', textTransform:'uppercase', color:C.jiff, fontWeight:700, marginBottom:12 }}>{title}</div>}
      {children}
    </div>
  );
}

const ENDPOINTS = [
  { method:'POST', path:'/api/suggest',              desc:'Recipe generation + translate + detect' },
  { method:'POST', path:'/api/planner',              desc:'Weekly meal plan generation' },
  { method:'POST', path:'/api/admin',                desc:'Admin: stats, users, history, streak, rating' },
  { method:'POST', path:'/api/comms',                desc:'Email: feedback, welcome, trial, translate' },
  { method:'POST', path:'/api/payments',             desc:'Razorpay: create order + verify' },
  { method:'GET',  path:'/api/videos',               desc:'YouTube video search cache' },
  { method:'POST', path:'/api/whatsapp',             desc:'WhatsApp recipe share' },
  { method:'POST', path:'/api/deploy-hook',          desc:'Vercel deploy trigger' },
];

export default function ApiTab() {
  const [envStatus, setEnvStatus] = useState(null);
  const [loading, setLoading]     = useState(true);

  useEffect(() => {
    fetchAdminStats()
      .then(r => r.json())
      .then(d => { setEnvStatus(d.envStatus || null); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const vars = [
    { key:'ANTHROPIC_API_KEY',            label:'Anthropic' },
    { key:'REACT_APP_SUPABASE_URL',       label:'Supabase URL' },
    { key:'REACT_APP_SUPABASE_ANON_KEY',  label:'Supabase Anon Key' },
    { key:'SUPABASE_SERVICE_ROLE_KEY',    label:'Supabase Service Key' },
    { key:'RAZORPAY_KEY_ID',              label:'Razorpay Key' },
    { key:'YOUTUBE_API_KEY',              label:'YouTube API' },
  ];

  return (
    <div style={{ padding:'0 4px' }}>
      <Card title="Environment Variables">
        {loading ? (
          <div style={{ color:C.muted, fontSize:13 }}>Checking…</div>
        ) : (
          <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
            {vars.map(v => {
              const present = envStatus ? envStatus[v.key] : null;
              return (
                <div key={v.key} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'8px 12px', background:'rgba(28,10,0,0.02)', borderRadius:8 }}>
                  <div>
                    <div style={{ fontSize:13, fontWeight:500, color:C.ink }}>{v.label}</div>
                    <div style={{ fontSize:10, color:C.muted, fontFamily:'monospace' }}>{v.key}</div>
                  </div>
                  <span style={{ fontSize:12, fontWeight:600, color: present === true ? C.green : present === false ? C.red : C.muted }}>
                    {present === true ? '✓ Set' : present === false ? '✗ Missing' : '— Unknown'}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      <Card title={'API Endpoints — 8 / 12 Vercel functions'}>
        <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
          {ENDPOINTS.map(e => (
            <div key={e.path} style={{ display:'flex', alignItems:'center', gap:10, padding:'7px 10px', background:'rgba(28,10,0,0.02)', borderRadius:8 }}>
              <span style={{ fontSize:10, fontWeight:700, color: e.method==='POST' ? C.jiff : C.green, minWidth:36 }}>{e.method}</span>
              <span style={{ fontSize:11, fontFamily:'monospace', color:C.ink, flex:1 }}>{e.path}</span>
              <span style={{ fontSize:11, color:C.muted }}>{e.desc}</span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
