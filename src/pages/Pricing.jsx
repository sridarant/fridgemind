import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePremium } from '../contexts/PremiumContext';

const C = {
  jiff: '#FF4500', jiffDark: '#CC3700', ink: '#1C0A00',
  cream: '#FFFAF5', warm: '#FFF0E5', muted: '#7C6A5E',
  border: 'rgba(28,10,0,0.10)', borderMid: 'rgba(28,10,0,0.18)',
  shadow: '0 4px 28px rgba(28,10,0,0.08)',
  gold: '#FFB800', goldBg: 'rgba(255,184,0,0.08)',
  green: '#1D9E75', greenBg: 'rgba(29,158,117,0.1)',
};

const FEATURES = [
  { label: 'Meal suggestions per day',   free: '5',        premium: 'Unlimited' },
  { label: 'Cuisine filters',            free: '✓',        premium: '✓' },
  { label: 'Grocery list generator',     free: '✓',        premium: '✓' },
  { label: 'Share & copy recipes',       free: '✓',        premium: '✓' },
  { label: 'Step cooking timers',        free: '✓',        premium: '✓' },
  { label: 'Serving size scaler',        free: '✓',        premium: '✓' },
  { label: 'Save favourites',            free: 'Device only', premium: 'Cloud synced' },
  { label: 'Weekly meal planner',        free: '1 / month', premium: 'Unlimited' },
  { label: 'Taste profile & pantry',     free: '✓',        premium: '✓ + cloud sync' },
  { label: 'Cross-device sync',          free: '—',        premium: '✓' },
  { label: 'Priority AI responses',      free: '—',        premium: '✓' },
  { label: 'New features first',         free: '—',        premium: '✓' },
];

export default function Pricing() {
  const navigate = useNavigate();
  const { plans, isPremium, premium, openCheckout, activateTestPremium, razorpayEnabled, clearPremium } = usePremium();
  const [loading, setLoading] = useState(null);
  const [success, setSuccess] = useState(false);
  const [error,   setError]   = useState('');
  const [selected, setSelected] = useState('monthly');

  const handleUpgrade = async (planId) => {
    if (!razorpayEnabled) {
      activateTestPremium();
      setSuccess(true);
      return;
    }
    setLoading(planId); setError('');
    try {
      await openCheckout(planId);
      setSuccess(true);
    } catch (err) {
      if (err.message !== 'dismissed') setError('Payment failed. Please try again.');
    } finally { setLoading(null); }
  };

  const planList = Object.values(plans);

  return (
    <div style={{ minHeight: '100vh', background: C.cream, fontFamily: "'DM Sans', sans-serif" }}>
      <link href="https://fonts.googleapis.com/css2?family=Fraunces:ital,wght@0,700;0,900;1,700&family=DM+Sans:wght@300;400;500&display=swap" rel="stylesheet"/>

      {/* Header */}
      <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 36px', borderBottom: `1px solid ${C.border}`, background: 'rgba(255,250,245,0.95)', backdropFilter: 'blur(12px)', position: 'sticky', top: 0, zIndex: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }} onClick={() => navigate('/')}>
          <span style={{ fontSize: 22 }}>⚡</span>
          <span style={{ fontFamily: "'Fraunces', serif", fontSize: 22, fontWeight: 900, color: C.ink, letterSpacing: '-0.5px' }}>
            <span style={{ color: C.jiff }}>J</span>iff
          </span>
        </div>
        <button onClick={() => navigate('/app')} style={{ fontSize: 13, fontWeight: 500, color: C.muted, background: 'none', border: `1.5px solid ${C.borderMid}`, borderRadius: 8, padding: '7px 14px', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}>
          ← Back to app
        </button>
      </header>

      <div style={{ maxWidth: 860, margin: '0 auto', padding: '56px 24px 80px' }}>

        {/* Hero */}
        <div style={{ textAlign: 'center', marginBottom: 56 }}>
          {isPremium ? (
            <>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: C.greenBg, border: `1px solid rgba(29,158,117,0.25)`, borderRadius: 20, padding: '6px 16px', marginBottom: 20 }}>
                <span style={{ fontSize: 14 }}>⚡</span>
                <span style={{ fontSize: 13, fontWeight: 500, color: C.green }}>You're on Jiff Premium</span>
              </div>
              <h1 style={{ fontFamily: "'Fraunces', serif", fontSize: 'clamp(32px,5vw,48px)', fontWeight: 900, color: C.ink, letterSpacing: '-1.5px', marginBottom: 12 }}>
                Welcome to the good stuff.
              </h1>
              <p style={{ fontSize: 16, color: C.muted, fontWeight: 300, lineHeight: 1.7, marginBottom: 24 }}>
                Plan: {premium?.planId} · Expires: {premium?.expiresAt ? new Date(premium.expiresAt).toLocaleDateString() : 'Never'}
              </p>
              <button onClick={clearPremium} style={{ fontSize: 12, color: C.muted, background: 'none', border: `1px solid ${C.border}`, borderRadius: 8, padding: '6px 14px', cursor: 'pointer' }}>
                Cancel subscription
              </button>
            </>
          ) : success ? (
            <>
              <div style={{ fontSize: 48, marginBottom: 16 }}>🎉</div>
              <h1 style={{ fontFamily: "'Fraunces', serif", fontSize: 'clamp(32px,5vw,48px)', fontWeight: 900, color: C.ink, letterSpacing: '-1.5px', marginBottom: 12 }}>
                Welcome to Jiff Premium!
              </h1>
              <p style={{ fontSize: 16, color: C.muted, fontWeight: 300, marginBottom: 28 }}>You now have unlimited access to everything.</p>
              <button onClick={() => navigate('/app')} style={{ background: C.jiff, color: 'white', border: 'none', borderRadius: 14, padding: '16px 36px', fontSize: 16, fontWeight: 500, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}>
                ⚡ Start Jiffing →
              </button>
            </>
          ) : (
            <>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: C.goldBg, border: `1px solid rgba(255,184,0,0.25)`, borderRadius: 20, padding: '6px 16px', marginBottom: 20 }}>
                <span style={{ fontSize: 13 }}>⚡</span>
                <span style={{ fontSize: 12, fontWeight: 500, color: C.gold, letterSpacing: '1px', textTransform: 'uppercase' }}>Jiff Premium</span>
              </div>
              <h1 style={{ fontFamily: "'Fraunces', serif", fontSize: 'clamp(36px,6vw,58px)', fontWeight: 900, color: C.ink, letterSpacing: '-2px', lineHeight: 1.05, marginBottom: 16 }}>
                Cook smarter.<br /><span style={{ color: C.jiff, fontStyle: 'italic' }}>Eat better.</span>
              </h1>
              <p style={{ fontSize: 17, color: C.muted, fontWeight: 300, lineHeight: 1.7, maxWidth: 480, margin: '0 auto' }}>
                Unlimited meal ideas, weekly planners, cross-device sync and more. Starting at just ₹99/month.
              </p>
            </>
          )}
        </div>

        {!isPremium && !success && (
          <>
            {/* Plan selector */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px,1fr))', gap: 14, marginBottom: 36 }}>
              {planList.map(plan => {
                const isSelected = selected === plan.id;
                const isPopular  = plan.id === 'annual';
                return (
                  <div key={plan.id}
                    onClick={() => setSelected(plan.id)}
                    style={{
                      background: isSelected ? C.jiff : 'white',
                      border: `2px solid ${isSelected ? C.jiff : C.borderMid}`,
                      borderRadius: 18, padding: '22px 20px', cursor: 'pointer',
                      transition: 'all 0.18s', position: 'relative',
                      boxShadow: isSelected ? `0 8px 28px rgba(255,69,0,0.25)` : C.shadow,
                    }}>
                    {isPopular && (
                      <div style={{ position: 'absolute', top: -12, left: '50%', transform: 'translateX(-50%)', background: C.gold, color: '#1C0A00', fontSize: 10, fontWeight: 700, padding: '3px 12px', borderRadius: 20, whiteSpace: 'nowrap', letterSpacing: '0.5px' }}>
                        MOST POPULAR
                      </div>
                    )}
                    {plan.saving && (
                      <div style={{ fontSize: 10, fontWeight: 600, color: isSelected ? 'rgba(255,255,255,0.8)' : C.jiff, letterSpacing: '1px', textTransform: 'uppercase', marginBottom: 8 }}>
                        {plan.saving}
                      </div>
                    )}
                    <div style={{ fontFamily: "'Fraunces', serif", fontSize: 28, fontWeight: 900, color: isSelected ? 'white' : C.ink, letterSpacing: '-1px', marginBottom: 4 }}>
                      {plan.price}
                    </div>
                    <div style={{ fontSize: 13, color: isSelected ? 'rgba(255,255,255,0.75)' : C.muted, fontWeight: 300 }}>
                      {plan.label} {plan.period}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* CTA */}
            {error && <div style={{ textAlign: 'center', color: '#E53E3E', fontSize: 13, marginBottom: 12 }}>{error}</div>}
            <div style={{ textAlign: 'center', marginBottom: 12 }}>
              <button
                onClick={() => handleUpgrade(selected)}
                disabled={!!loading}
                style={{ background: C.jiff, color: 'white', border: 'none', borderRadius: 14, padding: '18px 56px', fontSize: 17, fontWeight: 500, cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1, fontFamily: "'DM Sans', sans-serif", transition: 'all 0.2s', display: 'inline-flex', alignItems: 'center', gap: 10 }}>
                {loading ? '⏳ Processing…' : `⚡ Upgrade to ${PLANS[selected]?.label || 'Premium'}`}
              </button>
            </div>
            {!razorpayEnabled && (
              <div style={{ textAlign: 'center', fontSize: 12, color: C.muted, marginBottom: 28 }}>
                ℹ️ Razorpay not configured — clicking upgrade activates a free test premium. Add <code>REACT_APP_RAZORPAY_KEY_ID</code> to enable real payments.
              </div>
            )}
            <div style={{ textAlign: 'center', fontSize: 12, color: C.muted, marginBottom: 48, fontWeight: 300 }}>
              Secure payment via Razorpay · Cancel anytime · No hidden fees
            </div>

            {/* Feature comparison table */}
            <div style={{ background: 'white', border: `1px solid ${C.border}`, borderRadius: 20, overflow: 'hidden', boxShadow: C.shadow }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 120px 120px', background: C.ink, padding: '14px 20px' }}>
                <div style={{ fontSize: 12, fontWeight: 500, color: 'rgba(255,250,245,0.6)', textTransform: 'uppercase', letterSpacing: '1px' }}>Feature</div>
                <div style={{ fontSize: 12, fontWeight: 500, color: 'rgba(255,250,245,0.6)', textTransform: 'uppercase', letterSpacing: '1px', textAlign: 'center' }}>Free</div>
                <div style={{ fontSize: 12, fontWeight: 600, color: C.gold, textTransform: 'uppercase', letterSpacing: '1px', textAlign: 'center' }}>Premium</div>
              </div>
              {FEATURES.map((f, i) => (
                <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 120px 120px', padding: '12px 20px', borderBottom: i < FEATURES.length - 1 ? `1px solid ${C.border}` : 'none', background: i % 2 === 0 ? 'white' : C.cream }}>
                  <div style={{ fontSize: 13, color: C.ink, fontWeight: 300 }}>{f.label}</div>
                  <div style={{ fontSize: 13, color: f.free === '—' ? '#CBD5E0' : C.muted, textAlign: 'center', fontWeight: f.free === '—' ? 300 : 400 }}>{f.free}</div>
                  <div style={{ fontSize: 13, color: C.jiff, textAlign: 'center', fontWeight: 500 }}>{f.premium}</div>
                </div>
              ))}
            </div>

            {/* Bottom CTA */}
            <div style={{ textAlign: 'center', marginTop: 48 }}>
              <p style={{ fontSize: 15, color: C.muted, fontWeight: 300, marginBottom: 20 }}>Ready to cook without limits?</p>
              <button onClick={() => handleUpgrade(selected)} disabled={!!loading}
                style={{ background: C.jiff, color: 'white', border: 'none', borderRadius: 14, padding: '16px 44px', fontSize: 16, fontWeight: 500, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}>
                ⚡ Get Premium →
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
