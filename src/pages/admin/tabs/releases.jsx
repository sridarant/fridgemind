// src/pages/admin/tabs/releases.jsx
// Reads from Supabase releases table (written by api/deploy-hook.js on every deploy)

import { useState } from 'react';

export default function Tab_RELEASES({ C, Card, releases, setReleases }) {
  const [busy,   setBusy]   = useState(false);
  const [msg,    setMsg]    = useState('');

  const loadFromSupabase = async () => {
    setBusy(true);
    try {
      const r = await fetch('/api/admin?action=releases');
      const d = await r.json();
      if (Array.isArray(d.releases)) {
        setReleases(d.releases);
        setMsg('Loaded ' + d.releases.length + ' release(s) from Supabase');
      } else {
        setMsg('No releases in Supabase yet — set up the deploy webhook first');
      }
    } catch(e) { setMsg('Error: ' + e.message); }
    setBusy(false);
  };

  const logNow = async () => {
    setBusy(true);
    try {
      const r = await fetch('/api/deploy-hook', {
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ version:'manual', payload:{ meta:{ githubCommitMessage:'Manual log from Admin' } } }),
      });
      const d = await r.json();
      setMsg(d.ok ? '✓ Logged — click Load from Supabase to see it' : 'Error: ' + d.error);
    } catch(e) { setMsg('Error: ' + e.message); }
    setBusy(false);
  };

  return (
    <>
      <Card title={`Release history — ${releases.length} entr${releases.length===1?'y':'ies'}`}
        action={<div style={{display:'flex',gap:6}}>
          <button onClick={loadFromSupabase} disabled={busy}
            style={{fontSize:11,padding:'4px 10px',borderRadius:8,border:'1px solid rgba(28,10,0,0.18)',background:'white',cursor:'pointer',fontFamily:"'DM Sans',sans-serif"}}>
            {busy?'…':'↻ Load from Supabase'}
          </button>
          <button onClick={logNow} disabled={busy}
            style={{fontSize:11,padding:'4px 10px',borderRadius:8,border:'none',background:C.jiff,color:'white',cursor:'pointer',fontFamily:"'DM Sans',sans-serif"}}>
            + Log now
          </button>
        </div>}>
        {msg&&<div style={{fontSize:12,color:C.green,marginBottom:12,padding:'6px 10px',background:'rgba(29,158,117,0.08)',borderRadius:6}}>{msg}</div>}
        {releases.length===0?(
          <div style={{color:C.muted,fontSize:13,fontWeight:300}}>No releases loaded. Click "Load from Supabase" or set up the auto webhook below.</div>
        ):releases.map((r,i)=>(
          <div key={i} style={{borderBottom:'1px solid rgba(28,10,0,0.06)',padding:'12px 0'}}>
            <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:4}}>
              <span style={{fontFamily:"'Fraunces',serif",fontSize:15,fontWeight:700,color:C.ink}}>{r.version}</span>
              <span style={{fontSize:11,padding:'2px 8px',borderRadius:20,fontWeight:500,
                background:r.status==='deployed'?'rgba(29,158,117,0.1)':'rgba(28,10,0,0.06)',
                color:r.status==='deployed'?C.green:C.muted}}>
                {r.status==='deployed'?'✅ Deployed':r.status==='rollback'?'⏪ Rollback':'📝 Draft'}
              </span>
              <span style={{fontSize:11,color:C.muted,marginLeft:'auto'}}>
                {r.deployed_at?new Date(r.deployed_at).toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'}):''}
              </span>
            </div>
            <div style={{fontSize:13,fontWeight:500,color:C.ink,marginBottom:2}}>{r.title}</div>
            {r.summary&&<div style={{fontSize:12,color:C.muted,fontWeight:300,lineHeight:1.5}}>{r.summary}</div>}
          </div>
        ))}
      </Card>

      <Card title="Auto-logging setup — Vercel deploy webhook">
        <div style={{fontSize:12,color:C.muted,fontWeight:300,lineHeight:1.7,marginBottom:10}}>
          One-time setup. Every production deploy will log automatically to the Supabase releases table.
        </div>
        {[
          ['1','Vercel Dashboard','Project → Settings → Git → Deploy Hooks'],
          ['2','Create hook','Name: "Jiff Release Logger" → Branch: main → Copy URL'],
          ['3','Set trigger','Settings → Integrations → Deploy Notifications → paste URL → "Deployment Succeeded"'],
          ['4','Verify','Deploy the app → come back here → Load from Supabase → new entry appears'],
        ].map(([step,label,desc])=>(
          <div key={step} style={{display:'flex',gap:10,padding:'7px 0',borderBottom:'1px solid rgba(28,10,0,0.05)',alignItems:'flex-start'}}>
            <span style={{width:20,height:20,borderRadius:'50%',background:C.jiff,color:'white',fontSize:10,fontWeight:700,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,marginTop:1}}>{step}</span>
            <div>
              <div style={{fontSize:12,fontWeight:500,color:C.ink}}>{label}</div>
              <div style={{fontSize:11,color:C.muted,fontWeight:300}}>{desc}</div>
            </div>
          </div>
        ))}
        <div style={{marginTop:10,padding:'7px 10px',background:'rgba(255,69,0,0.04)',border:'1px solid rgba(255,69,0,0.15)',borderRadius:8,fontSize:11,color:C.muted}}>
          Endpoint: <code style={{color:C.jiff}}>/api/deploy-hook</code> (POST)
        </div>
      </Card>
    </>
  );
}
