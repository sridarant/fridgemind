// src/pages/admin/tabs/tools.jsx — Admin tab component
// Props received from AdminShell: C, Card, ADMIN_KEY, adminKey, stats, users,
//   waitlist, feedback, releases, loading, premiumStatus, lookerUrl,
//   tokenStats, rlsStatus, setStats, setUsers, setWaitlist, setFeedback,
//   setReleases, setLoading, setPremiumStatus, setLookerUrl,
//   setTokenStats, setRlsStatus, activeTab

export default function Tab_TOOLS({ C, Card, ADMIN_KEY, adminKey, setAdminKey,
  stats, setStats, users, setUsers, waitlist, setWaitlist,
  feedback, setFeedback, releases, setReleases, loading, setLoading,
  premiumStatus, setPremiumStatus, lookerUrl, setLookerUrl,
  tokenStats, setTokenStats, rlsStatus, setRlsStatus }) {
  return (
    <>
  {/* Reset trial */}
  <Card title="Reset trial period">
    <div style={{ fontSize:13, color:C.muted, fontWeight:300, marginBottom:12 }}>
      Extend or reset a user's 7-day trial. Enter their email address.
    </div>
    <div style={{ display:'flex', gap:8, flexWrap:'wrap', marginBottom:8 }}>
      <input type="email" value={resetEmail} onChange={e=>setResetEmail(e.target.value)}
        placeholder="user@email.com"
        style={{ flex:1, minWidth:220, padding:'9px 12px', border:'1.5px solid '+C.borderMid, borderRadius:10, fontSize:13, fontFamily:"'DM Sans',sans-serif", outline:'none' }}
        onKeyDown={e=>e.key==='Enter'&&handleResetTrial()}
      />
      <button onClick={handleResetTrial} style={{ background:C.jiff, color:'white', border:'none', borderRadius:10, padding:'9px 18px', fontSize:13, fontWeight:500, cursor:'pointer', fontFamily:"'DM Sans',sans-serif" }}>
        Reset trial
      </button>
    </div>
    {resetResult && (
      <div style={{ fontSize:12, color:resetResult.startsWith('✓')?C.green:C.red, fontWeight:500, padding:'6px 10px', background:resetResult.startsWith('✓')?'rgba(29,158,117,0.08)':'rgba(229,62,62,0.08)', borderRadius:8 }}>
        {resetResult}
      </div>
    )}
  </Card>

  {/* Premium override — testing mode */}
  <Card title="Premium access — testing override">
    <div style={{fontSize:12,color:C.muted,fontWeight:300,marginBottom:12,lineHeight:1.6}}>
      Activate or clear premium access in the browser for testing without a Razorpay payment.
      This writes to localStorage on this device only — it does not affect real user accounts.
    </div>
    <div style={{display:'flex',gap:10,flexWrap:'wrap',marginBottom:8}}>
      <button onClick={()=>{
        try {
          const data = {plan:'premium',activatedAt:Date.now(),source:'admin-override',expiresAt:Date.now()+365*24*60*60*1000};
          localStorage.setItem('jiff-premium', JSON.stringify(data));
          setPremiumStatus('activated');
        } catch(e) { setPremiumStatus('error'); }
      }} style={{background:C.green,color:'white',border:'none',borderRadius:8,padding:'9px 16px',
        fontSize:12,fontWeight:600,cursor:'pointer',fontFamily:"'DM Sans',sans-serif"}}>
        ✓ Activate Premium (this device)
      </button>
      <button onClick={()=>{
        try {
          localStorage.removeItem('jiff-premium');
          localStorage.removeItem('jiff-trial');
          setPremiumStatus('cleared');
        } catch(e) { setPremiumStatus('error'); }
      }} style={{background:'rgba(229,62,62,0.1)',color:C.red,border:'1px solid rgba(229,62,62,0.3)',
        borderRadius:8,padding:'9px 16px',fontSize:12,fontWeight:600,cursor:'pointer',fontFamily:"'DM Sans',sans-serif"}}>
        ✕ Clear Premium + Trial
      </button>
      <button onClick={()=>{
        try {
          const trial = {startedAt:Date.now(),expiresAt:Date.now()+7*24*60*60*1000};
          localStorage.setItem('jiff-trial', JSON.stringify(trial));
          setPremiumStatus('trial-reset');
        } catch(e) { setPremiumStatus('error'); }
      }} style={{background:C.warm,color:C.ink,border:'1px solid '+C.border,
        borderRadius:8,padding:'9px 16px',fontSize:12,fontWeight:500,cursor:'pointer',fontFamily:"'DM Sans',sans-serif"}}>
        ↺ Reset 7-day trial
      </button>
    </div>
    {premiumStatus && (
      <div style={{fontSize:12,fontWeight:500,padding:'6px 10px',borderRadius:6,marginTop:4,
        background: premiumStatus==='activated'?'rgba(29,158,117,0.08)':premiumStatus==='cleared'?'rgba(229,62,62,0.08)':'rgba(255,184,0,0.08)',
        color: premiumStatus==='activated'?C.green:premiumStatus==='cleared'?C.red:C.gold}}>
        {premiumStatus==='activated' && '✓ Premium activated — reload the app to see changes'}
        {premiumStatus==='cleared'   && '✕ Premium and trial cleared — free user mode'}
        {premiumStatus==='trial-reset'&&'↺ Trial reset to 7 days — reload the app'}
        {premiumStatus==='error'     && '✗ localStorage error — check browser console'}
      </div>
    )}
    <div style={{marginTop:10,padding:'8px 12px',background:'rgba(255,184,0,0.07)',
      border:'1px solid rgba(255,184,0,0.18)',borderRadius:8,fontSize:11,color:'#854F0B'}}>
      ⚠️ Testing only — this override is stored in your browser localStorage and is not connected to Supabase. Real users need to purchase via Razorpay. Reload the app after activating.
    </div>
  </Card>

  {/* Broadcast message */}
  <Card title="Broadcast message">
    <div style={{ fontSize:13, color:C.muted, fontWeight:300, marginBottom:12 }}>
      Send a notification or announcement to all users. Stored in Supabase for in-app display.
    </div>
    <textarea value={broadcastMsg} onChange={e=>setBroadcastMsg(e.target.value)}
      placeholder="Type your message here (e.g. New features just dropped! 🎉)"
      rows={3}
      style={{ width:'100%', padding:'10px 12px', border:'1.5px solid '+C.borderMid, borderRadius:10, fontSize:13, fontFamily:"'DM Sans',sans-serif", outline:'none', resize:'vertical', boxSizing:'border-box', marginBottom:8 }}
    />
    <button onClick={handleBroadcast} disabled={broadcastSent||!broadcastMsg.trim()}
      style={{ background:broadcastSent?C.green:C.jiff, color:'white', border:'none', borderRadius:10, padding:'9px 18px', fontSize:13, fontWeight:500, cursor:broadcastSent?'default':'pointer', fontFamily:"'DM Sans',sans-serif", opacity:!broadcastMsg.trim()?0.6:1 }}>
      {broadcastSent ? '✓ Sent' : 'Send broadcast'}
    </button>
  </Card>

  {/* Quick actions */}
  
    </>
  );
}
