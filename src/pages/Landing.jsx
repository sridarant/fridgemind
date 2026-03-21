import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLocale } from '../contexts/LocaleContext';

const C = {
  jiff: '#FF4500',
  jiffDark: '#CC3700',
  jiffDeep: '#8C2500',
  ink: '#1C0A00',
  inkLight: '#3D2010',
  cream: '#FFFAF5',
  warm: '#FFF0E5',
  gold: '#FFB800',
  muted: '#7C6A5E',
  border: 'rgba(28,10,0,0.1)',
  borderMid: 'rgba(28,10,0,0.18)',
};

const s = {
  page: { minHeight: '100vh', background: C.cream, fontFamily: "'DM Sans', sans-serif", overflowX: 'hidden' },

  // Nav
  nav: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 48px', borderBottom: `1px solid ${C.border}`, position: 'sticky', top: 0, zIndex: 100, background: 'rgba(255,250,245,0.94)', backdropFilter: 'blur(12px)' },
  navLogo: { display: 'flex', alignItems: 'center', gap: 8, fontFamily: "'Fraunces', serif", fontSize: 22, fontWeight: 900, color: C.ink, letterSpacing: '-0.5px', cursor: 'pointer' },
  navSpark: { color: C.jiff, marginRight: 2 },
  navCta: { background: C.jiff, color: 'white', border: 'none', borderRadius: 10, padding: '10px 24px', fontSize: 14, fontFamily: "'DM Sans', sans-serif", fontWeight: 500, cursor: 'pointer', transition: 'all 0.18s', letterSpacing: '0.2px' },

  // Hero
  hero: { maxWidth: 880, margin: '0 auto', padding: '96px 24px 80px', textAlign: 'center' },
  heroPill: { display: 'inline-flex', alignItems: 'center', gap: 7, background: `rgba(255,69,0,0.1)`, border: `1px solid rgba(255,69,0,0.2)`, borderRadius: 20, padding: '5px 14px 5px 10px', marginBottom: 28 },
  heroPillDot: { width: 7, height: 7, borderRadius: '50%', background: C.jiff },
  heroPillText: { fontSize: 12, fontWeight: 500, color: C.jiff, letterSpacing: '0.5px' },
  h1: { fontFamily: "'Fraunces', serif", fontSize: 'clamp(48px, 8vw, 88px)', fontWeight: 900, lineHeight: 1.0, color: C.ink, marginBottom: 24, letterSpacing: '-2.5px' },
  h1Accent: { color: C.jiff, fontStyle: 'italic' },
  heroSub: { fontSize: 18, color: C.muted, lineHeight: 1.7, fontWeight: 300, maxWidth: 500, margin: '0 auto 44px' },
  heroBtns: { display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' },
  primaryBtn: { background: C.jiff, color: 'white', border: 'none', borderRadius: 14, padding: '18px 40px', fontSize: 16, fontFamily: "'DM Sans', sans-serif", fontWeight: 500, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10, transition: 'all 0.2s', letterSpacing: '0.2px' },
  secondaryBtn: { background: 'transparent', color: C.ink, border: `1.5px solid ${C.borderMid}`, borderRadius: 14, padding: '18px 32px', fontSize: 16, fontFamily: "'DM Sans', sans-serif", fontWeight: 400, cursor: 'pointer', transition: 'all 0.2s' },
  heroBadges: { display: 'flex', gap: 20, justifyContent: 'center', flexWrap: 'wrap', marginTop: 36 },
  heroBadgeItem: { display: 'flex', alignItems: 'center', gap: 7, fontSize: 13, color: C.muted, fontWeight: 300 },
  heroBadgeLine: { width: 1, height: 14, background: C.border },

  // Big stat bar
  statBar: { background: C.ink, padding: '48px 24px' },
  statBarInner: { maxWidth: 900, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 0 },
  statItem: { padding: '20px 32px', textAlign: 'center', borderRight: `1px solid rgba(255,250,245,0.1)` },
  statNum: { fontFamily: "'Fraunces', serif", fontSize: 44, fontWeight: 900, color: C.jiff, lineHeight: 1, letterSpacing: '-1px' },
  statLabel: { fontSize: 13, color: 'rgba(255,250,245,0.5)', marginTop: 6, fontWeight: 300, lineHeight: 1.4 },

  // How section
  howSection: { padding: '100px 24px', maxWidth: 1000, margin: '0 auto' },
  sectionEye: { fontSize: 11, letterSpacing: '2.5px', textTransform: 'uppercase', fontWeight: 500, color: C.jiff, marginBottom: 16, textAlign: 'center' },
  sectionH2: { fontFamily: "'Fraunces', serif", fontSize: 'clamp(30px, 4.5vw, 48px)', fontWeight: 900, color: C.ink, textAlign: 'center', marginBottom: 56, letterSpacing: '-1.5px', lineHeight: 1.1 },
  stepsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 20 },
  stepCard: { background: C.warm, border: `1px solid ${C.border}`, borderRadius: 20, padding: '28px 24px', position: 'relative', overflow: 'hidden' },
  stepNumBg: { fontFamily: "'Fraunces', serif", fontSize: 80, fontWeight: 900, color: `rgba(255,69,0,0.07)`, lineHeight: 1, position: 'absolute', top: 12, right: 16 },
  stepIcon: { fontSize: 28, marginBottom: 14 },
  stepTitle: { fontFamily: "'Fraunces', serif", fontSize: 19, fontWeight: 700, color: C.ink, marginBottom: 8, letterSpacing: '-0.3px' },
  stepDesc: { fontSize: 13.5, color: C.muted, lineHeight: 1.65, fontWeight: 300 },

  // Problem section
  problemSection: { background: C.warm, padding: '100px 24px' },
  problemInner: { maxWidth: 820, margin: '0 auto', textAlign: 'center' },
  problemQ: { fontFamily: "'Fraunces', serif", fontSize: 'clamp(28px, 5vw, 54px)', fontWeight: 900, color: C.ink, lineHeight: 1.1, marginBottom: 20, letterSpacing: '-1.5px' },
  problemQAccent: { color: C.jiff, fontStyle: 'italic' },
  problemP: { fontSize: 17, color: C.muted, lineHeight: 1.8, fontWeight: 300, maxWidth: 560, margin: '0 auto 48px' },
  problemCards: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14 },
  problemCard: { background: C.cream, border: `1px solid ${C.border}`, borderRadius: 16, padding: '20px 18px', textAlign: 'left' },
  problemCardIcon: { fontSize: 22, marginBottom: 10 },
  problemCardTitle: { fontSize: 14, fontWeight: 500, color: C.ink, marginBottom: 5 },
  problemCardDesc: { fontSize: 13, color: C.muted, lineHeight: 1.55, fontWeight: 300 },

  // Features
  featSection: { padding: '100px 24px', maxWidth: 1000, margin: '0 auto' },
  featGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: 16 },
  featCard: { border: `1px solid ${C.border}`, borderRadius: 16, padding: '24px 20px' },
  featIcon: { fontSize: 24, marginBottom: 12 },
  featTitle: { fontSize: 14, fontWeight: 500, color: C.ink, marginBottom: 6 },
  featDesc: { fontSize: 13, color: C.muted, lineHeight: 1.6, fontWeight: 300 },

  // Final CTA
  ctaSection: { background: C.jiff, padding: '100px 24px', textAlign: 'center' },
  ctaH2: { fontFamily: "'Fraunces', serif", fontSize: 'clamp(36px, 6vw, 64px)', fontWeight: 900, color: 'white', lineHeight: 1.05, marginBottom: 16, letterSpacing: '-2px' },
  ctaSub: { fontSize: 17, color: 'rgba(255,255,255,0.75)', marginBottom: 40, fontWeight: 300 },
  ctaBtn: { background: C.cream, color: C.jiff, border: 'none', borderRadius: 14, padding: '18px 44px', fontSize: 16, fontFamily: "'DM Sans', sans-serif", fontWeight: 500, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 10, transition: 'all 0.18s' },

  // Footer
  footer: { borderTop: `1px solid ${C.border}`, padding: '24px 48px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 },
  footerLogo: { fontFamily: "'Fraunces', serif", fontSize: 16, fontWeight: 900, color: C.ink, display: 'flex', alignItems: 'center', gap: 6 },
  footerNote: { fontSize: 13, color: C.muted, fontWeight: 300 },
};

const STEPS = [
  { icon: '🥦', n: '01', title: 'Dump your fridge', desc: 'Type whatever you have. Eggs, half an onion, leftover rice — anything goes. No measuring, no precision.' },
  { icon: '🍱', n: '02', title: 'Pick your vibe', desc: 'Choose a cuisine and how much time you have. Indian? 15 minutes? Done.' },
  { icon: '⚡', n: '03', title: 'Jiff it', desc: 'AI cooks up 5 real meals instantly. Full recipes, ingredients, steps, nutrition — the works.' },
  { icon: '🍽️', n: '04', title: 'Actually eat well', desc: 'No food waste. No sad takeout. No endless recipe searches. Five options ready in seconds.' },
];

const PROBLEMS = [
  { icon: '😩', title: '"What should I cook?"', desc: 'Said by millions, every single day. Decision fatigue is real and exhausting.' },
  { icon: '🗑️', title: 'Food goes to waste', desc: '30% of everything bought gets thrown away. Not on our watch.' },
  { icon: '📱', title: 'Recipe rabbit holes', desc: 'You search one dish. 45 minutes later you\'ve watched 12 videos and ordered pizza.' },
  { icon: '🛒', title: 'Unnecessary grocery runs', desc: 'You already have what you need. You just don\'t know it yet.' },
];

const FEATURES = [
  { icon: '🔒', title: 'Secure by design', desc: 'Your API key lives server-side only. Never exposed to the browser.' },
  { icon: '⚡', title: 'Under 5 seconds', desc: 'Faster than opening a recipe app. Faster than thinking about it.' },
  { icon: '🍱', title: '13 world cuisines', desc: 'Indian, Italian, Japanese, Korean, Mexican, Mediterranean, Thai, French, American, Brazilian and more.' },
  { icon: '🌍', title: '4 languages', desc: 'Use Jiff in English, हिन्दी, தமிழ் or Español. Recipes generated in your language.' },
  { icon: '🥗', title: 'Diet-aware', desc: 'Vegetarian, vegan, gluten-free, dairy-free, low-carb — all handled.' },
  { icon: '🛒', title: 'Grocery list', desc: 'Instantly know what you need to buy vs what you already have.' },
  { icon: '📱', title: 'Installs like an app', desc: 'Add to home screen on any phone. No app store. No updates. Just Jiff.' },
];

export default function Landing() {
  const navigate = useNavigate();
  const { currency } = useLocale();
  const [email, setEmail]     = useState('');
  const [emailDone, setEmailDone] = useState(false);
  const handleEmailCapture = async () => {
    if (!email || !email.includes('@')) return;
    // Store in localStorage as fallback; Mailchimp webhook handled externally
    const subs = JSON.parse(localStorage.getItem('jiff-email-subs') || '[]');
    subs.push({ email, ts: Date.now() });
    localStorage.setItem('jiff-email-subs', JSON.stringify(subs));
    setEmailDone(true);
  };

  const hoverJiff = (on, e) => {
    e.currentTarget.style.background = on ? C.jiffDark : C.jiff;
    e.currentTarget.style.transform = on ? 'translateY(-2px)' : 'none';
    e.currentTarget.style.boxShadow = on ? '0 8px 32px rgba(255,69,0,0.35)' : 'none';
  };

  return (
    <div style={s.page}>

      {/* Nav */}
      <nav style={s.nav}>
        <div style={s.navLogo} onClick={() => navigate('/')}>
          <span style={s.navSpark}>⚡</span>Jiff
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={() => navigate('/planner')} style={{ background: 'transparent', color: C.ink, border: '1.5px solid ' + C.borderMid, borderRadius: 10, padding: '9px 18px', fontSize: 13, fontFamily: "'DM Sans', sans-serif", fontWeight: 500, cursor: 'pointer' }}>
            📅 Week plan
          </button>
          <button onClick={() => navigate('/pricing')} style={{ background: 'transparent', color: C.ink, border: '1.5px solid ' + C.borderMid, borderRadius: 10, padding: '9px 18px', fontSize: 13, fontFamily: "'DM Sans', sans-serif", fontWeight: 500, cursor: 'pointer' }}>
            💳 Pricing
          </button>
          <button style={s.navCta} onClick={() => navigate('/app')} onMouseEnter={e => Object.assign(e.target.style, { background: C.jiffDark, transform: 'translateY(-1px)' })} onMouseLeave={e => Object.assign(e.target.style, { background: C.jiff, transform: 'none' })}>
            ⚡ Quick meal
          </button>
        </div>
      </nav>

      {/* Hero */}
      <section style={s.hero}>
        <div style={s.heroPill}>
          <div style={s.heroPillDot} />
          <span style={s.heroPillText}>AI-powered · Free · No sign-up</span>
        </div>
        <h1 style={s.h1}>
          Any meal.
          <span style={s.h1Accent}>In a Jiff.</span>
        </h1>
        <p style={s.heroSub}>
          Open your fridge. Type what's inside. Get 5 real meals — with full recipes — in under 5 seconds. No faff.
        </p>
        <div style={s.heroBtns}>
          <button style={s.primaryBtn} onClick={() => navigate('/app')}
            onMouseEnter={e => hoverJiff(true, e)} onMouseLeave={e => hoverJiff(false, e)}>
            <span>⚡</span> Jiff a meal
          </button>
          <button style={s.secondaryBtn} onClick={() => document.getElementById('how').scrollIntoView({ behavior: 'smooth' })}
            onMouseEnter={e => Object.assign(e.target.style, { borderColor: C.jiff, color: C.jiff })}
            onMouseLeave={e => Object.assign(e.target.style, { borderColor: C.borderMid, color: C.ink })}>
            See how it works
          </button>
        </div>
        <div style={s.heroBadges}>
          {['5 free meals daily', null, '13 cuisines', null, '4 languages', null, 'Works globally'].map((item, i) =>
            item === null
              ? <div key={i} style={s.heroBadgeLine} />
              : <span key={i} style={s.heroBadgeItem}>⚡ {item}</span>
          )}
        </div>
      </section>

      {/* Stat bar */}
      <div style={s.statBar}>
        <div style={s.statBarInner}>
          {[
            { num: '10s', label: 'To get your first meal idea' },
            { num: '3', label: 'Real recipes every single time' },
            { num: '400+', label: 'Hours saved per year per person' },
            { num: '0', label: 'Grocery runs you didn\'t need to make' },
          ].map((item, i) => (
            <div key={i} style={{ ...s.statItem, borderRight: i < 3 ? s.statItem.borderRight : 'none' }}>
              <div style={s.statNum}>{item.num}</div>
              <div style={s.statLabel}>{item.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Problem */}
      <section style={s.problemSection}>
        <div style={s.problemInner}>
          <div style={s.sectionEye}>The problem</div>
          <h2 style={s.problemQ}>
            Every night, billions of people ask<br />
            <span style={s.problemQAccent}>"what do I cook?"</span>
          </h2>
          <p style={s.problemP}>
            It's the most common daily frustration on the planet. Not hunger — the decision. Jiff kills the decision.
          </p>
          <div style={s.problemCards}>
            {PROBLEMS.map((p, i) => (
              <div key={i} style={s.problemCard}>
                <div style={s.problemCardIcon}>{p.icon}</div>
                <div style={s.problemCardTitle}>{p.title}</div>
                <div style={s.problemCardDesc}>{p.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how" style={s.howSection}>
        <div style={s.sectionEye}>How Jiff works</div>
        <h2 style={s.sectionH2}>Four steps.<br />Any meal sorted.</h2>
        <div style={s.stepsGrid}>
          {STEPS.map((step, i) => (
            <div key={i} style={s.stepCard}>
              <div style={s.stepNumBg}>{step.n}</div>
              <div style={s.stepIcon}>{step.icon}</div>
              <div style={s.stepTitle}>{step.title}</div>
              <div style={s.stepDesc}>{step.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section style={s.featSection}>
        <div style={s.sectionEye}>What's inside</div>
        <h2 style={s.sectionH2}>Everything you need.<br />Nothing you don't.</h2>
        <div style={s.featGrid}>
          {FEATURES.map((f, i) => (
            <div key={i} style={s.featCard}>
              <div style={s.featIcon}>{f.icon}</div>
              <div style={s.featTitle}>{f.title}</div>
              <div style={s.featDesc}>{f.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Final CTA */}

      {/* ── Pricing ── */}
      <section style={{ background: C.warm, padding: '100px 24px' }}>
        <div style={{ maxWidth: 800, margin: '0 auto' }}>
          <div style={s.sectionEyebrow}>Simple pricing</div>
          <h2 style={{ ...s.sectionH2, marginBottom: 12 }}>Start free. Upgrade when ready.</h2>
          <p style={{ fontSize: 16, color: '#6B6458', textAlign: 'center', marginBottom: 56, fontWeight: 300, lineHeight: 1.7 }}>
            5 free meal suggestions every day — no card needed. Upgrade for unlimited everything.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16, marginBottom: 32 }}>
            {[
              { name: 'Free', price: '₹0', period: 'forever', color: '#6B6458', features: ['5 meals / day', '1 weekly plan / month', 'All basic features', 'Device-only sync'], cta: 'Start free', onClick: () => navigate('/app'), outline: true },
              { name: 'Monthly', price: currency.plans.monthly, period: '/month', color: C.jiff, features: ['Unlimited meals', 'Unlimited weekly plans', 'Cloud sync across devices', 'Taste profile + pantry'], cta: 'Get Premium', onClick: () => navigate('/pricing'), outline: false },
              { name: 'Lifetime', price: currency.plans.lifetime, period: 'one time', color: '#854F0B', features: ['Everything in Premium', 'Pay once, use forever', 'All future features', 'Priority support'], cta: 'Best value', onClick: () => navigate('/pricing'), outline: false },
            ].map((plan, i) => (
              <div key={i} style={{ background: 'white', border: `2px solid ${plan.outline ? 'rgba(28,10,0,0.12)' : plan.color}`, borderRadius: 20, padding: '28px 24px', boxShadow: plan.outline ? 'none' : `0 8px 32px ${plan.color}33` }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: plan.color, letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: 10 }}>{plan.name}</div>
                <div style={{ fontFamily: "'Fraunces', serif", fontSize: 36, fontWeight: 900, color: C.ink, letterSpacing: '-1px', lineHeight: 1, marginBottom: 4 }}>{plan.price}</div>
                <div style={{ fontSize: 13, color: '#6B6458', marginBottom: 20, fontWeight: 300 }}>{plan.period}</div>
                {plan.features.map((f, j) => (
                  <div key={j} style={{ fontSize: 13, color: C.ink, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 8, fontWeight: 300 }}>
                    <span style={{ color: plan.color, fontWeight: 700, fontSize: 14 }}>✓</span>{f}
                  </div>
                ))}
                <button onClick={plan.onClick} style={{ marginTop: 20, width: '100%', background: plan.outline ? 'transparent' : plan.color, color: plan.outline ? C.ink : 'white', border: `2px solid ${plan.outline ? 'rgba(28,10,0,0.18)' : plan.color}`, borderRadius: 10, padding: '11px', fontSize: 14, fontWeight: 500, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", transition: 'all 0.18s' }}>
                  {plan.cta}
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>



      {/* Email capture */}
      <section style={{ background: C.ink, padding: '72px 24px' }}>
        <div style={{ maxWidth: 560, margin: '0 auto', textAlign: 'center' }}>
          <div style={{ fontSize: 11, letterSpacing: '2.5px', textTransform: 'uppercase', color: 'rgba(255,250,245,0.5)', fontWeight: 500, marginBottom: 16 }}>
            Stay in the loop
          </div>
          <h2 style={{ fontFamily: "'Fraunces', serif", fontSize: 'clamp(26px,4vw,40px)', fontWeight: 900, color: 'white', letterSpacing: '-1px', lineHeight: 1.1, marginBottom: 12 }}>
            New recipes. New features.<br />First to know.
          </h2>
          <p style={{ fontSize: 15, color: 'rgba(255,250,245,0.6)', fontWeight: 300, lineHeight: 1.7, marginBottom: 28 }}>
            Join home cooks from India and around the world. No spam — just occasional updates when something worth sharing ships.
          </p>
          {emailDone ? (
            <div style={{ background: 'rgba(29,158,117,0.15)', border: '1px solid rgba(29,158,117,0.3)', borderRadius: 12, padding: '14px 20px', color: '#5DCAA5', fontWeight: 500, fontSize: 15 }}>
              ✓ You're in! We'll be in touch.
            </div>
          ) : (
            <div style={{ display: 'flex', gap: 0, maxWidth: 420, margin: '0 auto', border: '1.5px solid rgba(255,250,245,0.15)', borderRadius: 12, overflow: 'hidden', background: 'rgba(255,255,255,0.07)' }}>
              <input
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleEmailCapture()}
                style={{ flex: 1, border: 'none', outline: 'none', padding: '14px 16px', fontSize: 14, fontFamily: "'DM Sans', sans-serif", background: 'transparent', color: 'white' }}
              />
              <button onClick={handleEmailCapture} style={{ background: C.jiff, color: 'white', border: 'none', padding: '14px 22px', fontSize: 14, fontWeight: 500, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", whiteSpace: 'nowrap', transition: 'background 0.18s' }}
                onMouseEnter={e => e.target.style.background = C.jiffDark}
                onMouseLeave={e => e.target.style.background = C.jiff}>
                Notify me ⚡
              </button>
            </div>
          )}
          <p style={{ fontSize: 12, color: 'rgba(255,250,245,0.3)', marginTop: 12, fontWeight: 300 }}>No spam. Unsubscribe anytime.</p>
        </div>
      </section>

      <section style={s.ctaSection}>
        <h2 style={s.ctaH2}>Any meal.<br />Right now.</h2>
        <p style={s.ctaSub}>Find out what you can make right now. Takes 10 seconds.</p>
        <button style={s.ctaBtn} onClick={() => navigate('/app')}
          onMouseEnter={e => Object.assign(e.currentTarget.style, { transform: 'translateY(-2px)', boxShadow: '0 8px 32px rgba(0,0,0,0.2)' })}
          onMouseLeave={e => Object.assign(e.currentTarget.style, { transform: 'none', boxShadow: 'none' })}>
          <span>⚡</span> Jiff it now — it's free
        </button>
      </section>

      {/* Footer */}
      <footer style={s.footer}>
        <div style={s.footerLogo}><span style={{ color: C.jiff }}>⚡</span> Jiff</div>
        <div style={s.footerNote}>Powered by Claude AI · <span style={{cursor:'pointer',textDecoration:'underline'}} onClick={()=>navigate('/pricing')}>Pricing</span> · No sign-up to start</div>
      </footer>

    </div>
  );
}
