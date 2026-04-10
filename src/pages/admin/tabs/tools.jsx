import { resetTrial, broadcastMessage } from '../../../services/adminService';
// src/pages/admin/tabs/tools.jsx
import { useState } from 'react';

export default function Tab_TOOLS({ C, Card, ADMIN_KEY, premiumStatus, setPremiumStatus }) {
  const [resetEmail,   setResetEmail]   = useState('');
  const [resetResult,  setResetResult]  = useState('');
  const [broadcastMsg, setBroadcastMsg] = useState('');
  const [broadcastSent,setBroadcastSent]= useState(false);

  const handleResetTrial = async () => {
    if (!resetEmail.includes('@')) { setResetResult('Enter a valid email'); return; }
    try {
      await resetTrial(resetEmail);
      setResetResult('✓ Trial reset for ' + resetEmail);
    } catch (e) { setResetResult('✗ ' + (e.message || 'Network error')); }
  };

  const handleBroadcast = async () => {
    if (!broadcastMsg.trim()) return;
    try {
      await broadcastMessage(broadcastMsg);
      setBroadcastSent(true);
    } catch {}
  };

  return (
    <>
      <Card title="Reset trial period">
        <div style={{fontSize:13,color:C.muted,fontWeight:300,marginBottom:12}}>
          Reset a user's 7-day trial. Enter their email address.
        </div>
        <div style={{display:'flex',gap:8,flexWrap:'wrap',marginBottom:8}}>
          <input type="email" value={resetEmail} onChange={e=>setResetEmail(e.target.value)}
            placeholder="user@email.com"
            style={{flex:1,minWidth:220,padding:'9px 12px',border:'1.5px solid '+C.borderMid,borderRadius:10,fontSize:13,fontFamily:"'DM Sans',sans-serif",outline:'none'}}
            onKeyDown={e=>e.key==='Enter'&&handleResetTrial()}
          />
          <button onClick={handleResetTrial}
            style={{background:C.jiff,color:'white',border:'none',borderRadius:10,padding:'9px 18px',fontSize:13,fontWeight:500,cursor:'pointer',fontFamily:"'DM Sans',sans-serif"}}>
            Reset trial
          </button>
        </div>
        {resetResult && (
          <div style={{fontSize:12,color:resetResult.startsWith('✓')?C.green:C.red,fontWeight:500,
            padding:'6px 10px',background:resetResult.startsWith('✓')?'rgba(29,158,117,0.08)':'rgba(229,62,62,0.08)',borderRadius:8}}>
            {resetResult}
          </div>
        )}
      </Card>

      <Card title="Premium access — testing override">
        <div style={{fontSize:12,color:C.muted,fontWeight:300,marginBottom:12,lineHeight:1.6}}>
          Activate or clear premium for testing on this device only (localStorage — does not affect real user accounts).
        </div>
        <div style={{display:'flex',gap:10,flexWrap:'wrap',marginBottom:8}}>
          <button onClick={()=>{
            try {
              localStorage.setItem('jiff-premium',JSON.stringify({plan:'premium',activatedAt:Date.now(),source:'admin-override',expiresAt:Date.now()+365*24*60*60*1000}));
              setPremiumStatus('activated');
            } catch {}
          }} style={{background:C.green,color:'white',border:'none',borderRadius:8,padding:'9px 16px',fontSize:12,fontWeight:600,cursor:'pointer',fontFamily:"'DM Sans',sans-serif"}}>
            ✓ Activate Premium
          </button>
          <button onClick={()=>{
            try { localStorage.removeItem('jiff-premium'); localStorage.removeItem('jiff-trial'); setPremiumStatus('cleared'); } catch {}
          }} style={{background:'rgba(229,62,62,0.1)',color:C.red,border:'1px solid rgba(229,62,62,0.3)',borderRadius:8,padding:'9px 16px',fontSize:12,fontWeight:600,cursor:'pointer',fontFamily:"'DM Sans',sans-serif"}}>
            ✕ Clear Premium + Trial
          </button>
          <button onClick={()=>{
            try { localStorage.setItem('jiff-trial',JSON.stringify({startedAt:Date.now(),expiresAt:Date.now()+7*24*60*60*1000})); setPremiumStatus('trial-reset'); } catch {}
          }} style={{background:C.warm,color:C.ink,border:'1px solid '+C.border,borderRadius:8,padding:'9px 16px',fontSize:12,fontWeight:500,cursor:'pointer',fontFamily:"'DM Sans',sans-serif"}}>
            ↺ Reset 7-day trial
          </button>
        </div>
        {premiumStatus && (
          <div style={{fontSize:12,fontWeight:500,padding:'6px 10px',borderRadius:6,marginTop:4,
            background:premiumStatus==='activated'?'rgba(29,158,117,0.08)':premiumStatus==='cleared'?'rgba(229,62,62,0.08)':'rgba(255,184,0,0.08)',
            color:premiumStatus==='activated'?C.green:premiumStatus==='cleared'?C.red:C.gold}}>
            {premiumStatus==='activated'&&'✓ Premium activated — reload the app'}
            {premiumStatus==='cleared'&&'✕ Premium and trial cleared'}
            {premiumStatus==='trial-reset'&&'↺ Trial reset to 7 days — reload the app'}
            {premiumStatus==='error'&&'✗ localStorage error'}
          </div>
        )}
      </Card>

      <Card title="Broadcast message">
        <div style={{fontSize:13,color:C.muted,fontWeight:300,marginBottom:12}}>
          Send a notification to all users. Stored in Supabase for in-app display.
        </div>
        <textarea value={broadcastMsg} onChange={e=>setBroadcastMsg(e.target.value)}
          placeholder="New features just dropped! 🎉"
          rows={3}
          style={{width:'100%',padding:'10px 12px',border:'1.5px solid '+C.borderMid,borderRadius:10,fontSize:13,fontFamily:"'DM Sans',sans-serif",outline:'none',resize:'vertical',boxSizing:'border-box',marginBottom:8}}
        />
        <button onClick={handleBroadcast} disabled={broadcastSent||!broadcastMsg.trim()}
          style={{background:broadcastSent?C.green:C.jiff,color:'white',border:'none',borderRadius:10,padding:'9px 18px',fontSize:13,fontWeight:500,cursor:broadcastSent?'default':'pointer',fontFamily:"'DM Sans',sans-serif",opacity:!broadcastMsg.trim()?0.6:1}}>
          {broadcastSent ? '✓ Sent' : 'Send broadcast'}
        </button>
      </Card>
    </>
  );
}
