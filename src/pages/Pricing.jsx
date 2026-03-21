import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePremium } from '../contexts/PremiumContext';
import { useLocale, CURRENCY_MAP } from '../contexts/LocaleContext';

const C = {
  jiff: '#FF4500', jiffDark: '#CC3700', ink: '#1C0A00',
  cream: '#FFFAF5', warm: '#FFF0E5', muted: '#7C6A5E',
  border: 'rgba(28,10,0,0.10)', borderMid: 'rgba(28,10,0,0.18)',
  shadow: '0 4px 28px rgba(28,10,0,0.08)',
  gold: '#FFB800', goldBg: 'rgba(255,184,0,0.08)',
  green: '#1D9E75', greenBg: 'rgba(29,158,117,0.1)',
};

const FEATURES = [
  { label: 'Meal suggestions per day',  free: '5',           premium: 'Unlimited' },
  { label: 'Weekly meal planner',       free: '1 / month',   premium: 'Unlimited' },
  { label: 'All cuisine types',         free: '✓',           premium: '✓' },
  { label: 'Grocery list generator',    free: '✓',           premium: '✓' },
  { label: 'Share & copy recipes',      free: '✓',           premium: '✓' },
  { label: 'Step cooking timers',       free: '✓',           premium: '✓' },
  { label: 'Serving size scaler',       free: '✓',           premium: '✓' },
  { label: 'Save favourites',           free: 'Device only', premium: 'Cloud synced' },
  { label: 'Taste profile & pantry',    free: '✓',           premium: '✓ + cloud sync' },
  { label: 'Cross-device sync',         free: '—',           premium: '✓' },
  { label: 'Recipe language choice',    free: '—',           premium: '✓' },
  { label: 'New features first',        free: '—',           premium: '✓' },
];

// Country selector for manual override
const COUNTRY_OPTIONS = Object.entries(CURRENCY_MAP)
  .filter(([k]) => k !== 'DEFAULT')
  .map(([code, c]) => ({ code, label: `${code} — ${c.symbol} ${c.code}` }));

export default function Pricing() {
  const navigate   = useNavigate();
  const { isPremium, premium, plans, openCheckout, handleStripeSuccess, activateTestPremium, razorpayEnabled, stripeEnabled, clearPremium } = usePremium();
  const { currency, country, setCountry } = useLocale();

  const [loading,  setLoading]  = useState(null);
  const [success,  setSuccess]  = useState(false);
  const [error,    setError]    = useState('');
  const [selected, setSelected] = useState('annual');

  // Handle Stripe redirect back
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('success') === '1') {
      const planId = params.get('plan') || 'monthly';
      handleStripeSuccess(planId);
      setSuccess(true);
      window.history.replaceState({}, '', '/pricing');
    }
  }, [handleStripeSuccess]);

  const planList = Object.values(plans);

  const handleUpgrade = async (planId) => {
    const isTestMode = !razorpayEnabled && !stripeEnabled;
    if (isTestMode) { activateTestPremium(); setSuccess(true); return; }
    setLoading(planId); setError('');
    try {
      await openCheckout(planId, currency);
      // Razorpay resolves here; Stripe redirects away
      setSuccess(true);
    } catch (err) {
      if (err.message !== 'dismissed') setError('Payment failed. Please try again.');
    } finally { setLoading(null); }
  };

  const hdr = { display:'flex', alignItems:'center', justifyContent:'space-between', padding:'18px 36px', borderBottom:`1px solid ${C.border}`, background:'rgba(255,250,245,0.95)', backdropFilter:'blur(12px)', position:'sticky', top:0, zIndex:10 };

  return (
    <div style={{ minHeight:'100vh', background:C.cream, fontFamily:"'DM Sans', sans-serif", color:C.ink }}>

      <header style={hdr}>
        <div style={{ display:'flex', alignItems:'center', gap:8, cursor:'pointer' }} onClick={()=>navigate('/')}>
          <span style={{fontSize:22}}>⚡</span>
          <span style={{ fontFamily:"'Fraunces', serif", fontSize:22, fontWeight:900, color:C.ink }}>
            <span style={{color:C.jiff}}>J</span>iff
          </span>
        </div>
        <div style={{display:'flex', gap:8, alignItems:'center'}}>
          {/* Country selector for currency override */}
          <select value={country} onChange={e=>setCountry(e.target.value)}
            style={{ fontSize:12, color:C.muted, background:'white', border:`1px solid ${C.borderMid}`, borderRadius:8, padding:'5px 8px', cursor:'pointer', fontFamily:"'DM Sans', sans-serif" }}>
            {COUNTRY_OPTIONS.map(c=><option key={c.code} value={c.code}>{c.label}</option>)}
          </select>
          <button onClick={()=>navigate('/app')} style={{ fontSize:13, color:C.muted, background:'none', border:`1.5px solid ${C.borderMid}`, borderRadius:8, padding:'7px 14px', cursor:'pointer', fontFamily:"'DM Sans', sans-serif", fontWeight:500 }}>
            ← Back to app
          </button>
        </div>
      </header>

      <div style={{ maxWidth:860, margin:'0 auto', padding:'56px 24px 80px' }}>

        {/* Already premium */}
        {isPremium && (
          <div style={{textAlign:'center'}}>
            <div style={{display:'inline-flex',alignItems:'center',gap:8,background:C.greenBg,border:'1px solid rgba(29,158,117,0.25)',borderRadius:20,padding:'6px 16px',marginBottom:20}}>
              <span>⚡</span><span style={{fontSize:13,fontWeight:500,color:C.green}}>You're on Jiff Premium</span>
            </div>
            <h1 style={{fontFamily:"'Fraunces', serif",fontSize:'clamp(32px,5vw,48px)',fontWeight:900,color:C.ink,letterSpacing:'-1.5px',marginBottom:12}}>
              Welcome to the good stuff.
            </h1>
            <p style={{fontSize:16,color:C.muted,fontWeight:300,lineHeight:1.7,marginBottom:24}}>
              Plan: <strong>{premium?.planId}</strong> · Expires: {premium?.expiresAt ? new Date(premium.expiresAt).toLocaleDateString() : 'Never'}
              · Paid via: {premium?.gateway || 'card'}
            </p>
            <button onClick={()=>navigate('/app')} style={{background:C.jiff,color:'white',border:'none',borderRadius:12,padding:'14px 32px',fontSize:15,fontWeight:500,cursor:'pointer',fontFamily:"'DM Sans', sans-serif",marginRight:10}}>
              ⚡ Go cook something →
            </button>
            <button onClick={clearPremium} style={{fontSize:12,color:C.muted,background:'none',border:`1px solid ${C.border}`,borderRadius:8,padding:'8px 14px',cursor:'pointer',fontFamily:"'DM Sans', sans-serif"}}>
              Cancel subscription
            </button>
          </div>
        )}

        {/* Stripe success */}
        {!isPremium && success && (
          <div style={{textAlign:'center'}}>
            <div style={{fontSize:56,marginBottom:16}}>🎉</div>
            <h1 style={{fontFamily:"'Fraunces', serif",fontSize:'clamp(32px,5vw,48px)',fontWeight:900,color:C.ink,letterSpacing:'-1.5px',marginBottom:12}}>
              Welcome to Jiff Premium!
            </h1>
            <p style={{fontSize:16,color:C.muted,fontWeight:300,marginBottom:28}}>Unlimited meals, plans, and more — forever yours.</p>
            <button onClick={()=>navigate('/app')} style={{background:C.jiff,color:'white',border:'none',borderRadius:14,padding:'16px 36px',fontSize:16,fontWeight:500,cursor:'pointer',fontFamily:"'DM Sans', sans-serif"}}>
              ⚡ Start Jiffing →
            </button>
          </div>
        )}

        {/* Upgrade page */}
        {!isPremium && !success && (
          <>
            {/* Hero */}
            <div style={{textAlign:'center',marginBottom:52}}>
              <div style={{display:'inline-flex',alignItems:'center',gap:8,background:C.goldBg,border:'1px solid rgba(255,184,0,0.25)',borderRadius:20,padding:'6px 16px',marginBottom:20}}>
                <span style={{fontSize:13}}>⚡</span>
                <span style={{fontSize:12,fontWeight:500,color:'#854F0B',letterSpacing:'1px',textTransform:'uppercase'}}>Jiff Premium</span>
              </div>
              <h1 style={{fontFamily:"'Fraunces', serif",fontSize:'clamp(36px,6vw,58px)',fontWeight:900,color:C.ink,letterSpacing:'-2px',lineHeight:1.05,marginBottom:16}}>
                Cook smarter.<br /><span style={{color:C.jiff,fontStyle:'italic'}}>Eat better.</span>
              </h1>
              <p style={{fontSize:17,color:C.muted,fontWeight:300,lineHeight:1.7,maxWidth:480,margin:'0 auto 8px'}}>
                Unlimited meal ideas, weekly planners, cross-device sync and more.
              </p>
              <p style={{fontSize:14,color:C.muted,fontWeight:300}}>
                Starting at <strong style={{color:C.jiff}}>{currency.plans.monthly}</strong>/month ·
                {currency.gateway === 'razorpay' ? ' Secure payment via Razorpay' : ' Secure payment via Stripe'}
              </p>
            </div>

            {/* Plan cards */}
            <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit, minmax(220px,1fr))',gap:14,marginBottom:28}}>
              {planList.map(plan => {
                const sel = selected === plan.id;
                const popular = plan.id === 'annual';
                const price = currency.plans[plan.id];
                return (
                  <div key={plan.id} onClick={()=>setSelected(plan.id)}
                    style={{background:sel?C.jiff:'white',border:`2px solid ${sel?C.jiff:C.borderMid}`,borderRadius:18,padding:'22px 20px',cursor:'pointer',transition:'all 0.18s',position:'relative',boxShadow:sel?'0 8px 28px rgba(255,69,0,0.25)':C.shadow}}>
                    {popular && <div style={{position:'absolute',top:-12,left:'50%',transform:'translateX(-50%)',background:C.gold,color:C.ink,fontSize:10,fontWeight:700,padding:'3px 12px',borderRadius:20,whiteSpace:'nowrap'}}>MOST POPULAR</div>}
                    {plan.saving && <div style={{fontSize:10,fontWeight:600,color:sel?'rgba(255,255,255,0.8)':C.jiff,letterSpacing:'1px',textTransform:'uppercase',marginBottom:8}}>{plan.saving}</div>}
                    <div style={{fontFamily:"'Fraunces', serif",fontSize:30,fontWeight:900,color:sel?'white':C.ink,letterSpacing:'-1px',marginBottom:4}}>{price}</div>
                    <div style={{fontSize:13,color:sel?'rgba(255,255,255,0.75)':C.muted,fontWeight:300}}>{plan.label} {plan.period}</div>
                  </div>
                );
              })}
            </div>

            {/* Gateway badge */}
            <div style={{textAlign:'center',marginBottom:16}}>
              <span style={{fontSize:12,color:C.muted,background:C.warm,borderRadius:20,padding:'4px 12px'}}>
                {currency.gateway === 'razorpay'
                  ? '🇮🇳 Paying in ₹ INR via Razorpay'
                  : `🌍 Paying in ${currency.code} via Stripe — change country above`}
              </span>
            </div>

            {/* CTA */}
            {error && <div style={{textAlign:'center',color:'#E53E3E',fontSize:13,marginBottom:10}}>{error}</div>}
            <div style={{textAlign:'center',marginBottom:10}}>
              <button onClick={()=>handleUpgrade(selected)} disabled={!!loading}
                style={{background:C.jiff,color:'white',border:'none',borderRadius:14,padding:'18px 56px',fontSize:17,fontWeight:500,cursor:loading?'not-allowed':'pointer',opacity:loading?0.7:1,fontFamily:"'DM Sans', sans-serif",transition:'all 0.2s',display:'inline-flex',alignItems:'center',gap:10}}>
                {loading?'⏳ Processing…':`⚡ Upgrade to ${plans[selected]?.label||'Premium'} — ${currency.plans[selected]||''}`}
              </button>
            </div>
            {!razorpayEnabled && !stripeEnabled && (
              <div style={{textAlign:'center',fontSize:12,color:C.muted,marginBottom:12}}>
                ℹ️ No payment gateway configured — clicking upgrade activates free test premium.
              </div>
            )}
            <div style={{textAlign:'center',fontSize:12,color:C.muted,marginBottom:52,fontWeight:300}}>
              Cancel anytime · Secure checkout · No hidden fees
            </div>

            {/* Feature comparison */}
            <div style={{background:'white',border:`1px solid ${C.border}`,borderRadius:20,overflow:'hidden',boxShadow:C.shadow}}>
              <div style={{display:'grid',gridTemplateColumns:'1fr 110px 110px',background:C.ink,padding:'14px 20px'}}>
                <div style={{fontSize:12,fontWeight:500,color:'rgba(255,250,245,0.6)',textTransform:'uppercase',letterSpacing:'1px'}}>Feature</div>
                <div style={{fontSize:12,fontWeight:500,color:'rgba(255,250,245,0.6)',textTransform:'uppercase',letterSpacing:'1px',textAlign:'center'}}>Free</div>
                <div style={{fontSize:12,fontWeight:600,color:C.gold,textTransform:'uppercase',letterSpacing:'1px',textAlign:'center'}}>Premium</div>
              </div>
              {FEATURES.map((f,i)=>(
                <div key={i} style={{display:'grid',gridTemplateColumns:'1fr 110px 110px',padding:'12px 20px',borderBottom:i<FEATURES.length-1?`1px solid ${C.border}`:'none',background:i%2===0?'white':C.cream}}>
                  <div style={{fontSize:13,color:C.ink,fontWeight:300}}>{f.label}</div>
                  <div style={{fontSize:13,color:f.free==='—'?'#CBD5E0':C.muted,textAlign:'center'}}>{f.free}</div>
                  <div style={{fontSize:13,color:C.jiff,textAlign:'center',fontWeight:500}}>{f.premium}</div>
                </div>
              ))}
            </div>

            <div style={{textAlign:'center',marginTop:48}}>
              <p style={{fontSize:15,color:C.muted,fontWeight:300,marginBottom:20}}>Ready to cook without limits?</p>
              <button onClick={()=>handleUpgrade(selected)} disabled={!!loading}
                style={{background:C.jiff,color:'white',border:'none',borderRadius:14,padding:'16px 44px',fontSize:16,fontWeight:500,cursor:'pointer',fontFamily:"'DM Sans', sans-serif"}}>
                ⚡ Get Premium →
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
