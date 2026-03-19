import { useNavigate } from 'react-router-dom';

const s = {
  page: {
    minHeight: '100vh',
    background: '#F5EFE0',
    backgroundImage: 'radial-gradient(ellipse at 15% 10%, rgba(196,96,58,0.08) 0%, transparent 45%), radial-gradient(ellipse at 85% 85%, rgba(45,74,62,0.10) 0%, transparent 45%)',
    overflowX: 'hidden',
  },
  nav: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '24px 48px',
    borderBottom: '1px solid rgba(45,74,62,0.12)',
    position: 'sticky', top: 0, zIndex: 100,
    background: 'rgba(245,239,224,0.92)',
    backdropFilter: 'blur(12px)',
  },
  navLogo: {
    display: 'flex', alignItems: 'center', gap: 10,
    fontFamily: "'Playfair Display', serif",
    fontSize: 20, fontWeight: 700, color: '#2D4A3E',
  },
  navCta: {
    background: '#2D4A3E', color: 'white',
    border: 'none', borderRadius: 10,
    padding: '10px 24px', fontSize: 14,
    fontFamily: "'DM Sans', sans-serif", fontWeight: 500,
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  hero: {
    maxWidth: 900, margin: '0 auto',
    padding: '100px 24px 80px',
    textAlign: 'center',
  },
  eyebrow: {
    display: 'inline-block',
    background: 'rgba(196,96,58,0.12)',
    color: '#C4603A',
    fontSize: 11, letterSpacing: '2.5px',
    textTransform: 'uppercase', fontWeight: 500,
    padding: '6px 16px', borderRadius: 20,
    marginBottom: 28,
  },
  h1: {
    fontFamily: "'Playfair Display', serif",
    fontSize: 'clamp(42px, 7vw, 76px)',
    fontWeight: 700, lineHeight: 1.08,
    color: '#2D4A3E', marginBottom: 28,
    letterSpacing: '-2px',
  },
  h1Italic: { fontStyle: 'italic', color: '#C4603A' },
  sub: {
    fontSize: 18, color: '#6B6458',
    lineHeight: 1.75, fontWeight: 300,
    maxWidth: 520, margin: '0 auto 48px',
  },
  heroCtas: {
    display: 'flex', gap: 14, justifyContent: 'center',
    flexWrap: 'wrap',
  },
  primaryBtn: {
    background: '#2D4A3E', color: 'white',
    border: 'none', borderRadius: 14,
    padding: '18px 40px', fontSize: 16,
    fontFamily: "'DM Sans', sans-serif", fontWeight: 500,
    cursor: 'pointer',
    display: 'flex', alignItems: 'center', gap: 10,
    transition: 'all 0.22s',
  },
  secondaryBtn: {
    background: 'transparent', color: '#2D4A3E',
    border: '1.5px solid rgba(45,74,62,0.25)', borderRadius: 14,
    padding: '18px 32px', fontSize: 16,
    fontFamily: "'DM Sans', sans-serif", fontWeight: 400,
    cursor: 'pointer', transition: 'all 0.22s',
  },
  badge: {
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    gap: 20, marginTop: 40, flexWrap: 'wrap',
  },
  badgeItem: {
    display: 'flex', alignItems: 'center', gap: 8,
    fontSize: 13, color: '#6B6458', fontWeight: 300,
  },
  badgeDot: {
    width: 6, height: 6, borderRadius: '50%',
    background: '#C9A84C',
  },

  // Problem section
  problem: {
    background: '#2D4A3E',
    padding: '100px 24px',
    textAlign: 'center',
  },
  problemInner: { maxWidth: 800, margin: '0 auto' },
  problemEyebrow: {
    fontSize: 11, letterSpacing: '2.5px',
    textTransform: 'uppercase', fontWeight: 500,
    color: 'rgba(245,239,224,0.5)', marginBottom: 24,
  },
  problemH2: {
    fontFamily: "'Playfair Display', serif",
    fontSize: 'clamp(28px, 5vw, 48px)',
    fontWeight: 700, color: '#F5EFE0',
    lineHeight: 1.2, marginBottom: 24, letterSpacing: '-1px',
  },
  problemStat: { color: '#C9A84C', fontStyle: 'italic' },
  problemP: {
    fontSize: 16, color: 'rgba(245,239,224,0.65)',
    lineHeight: 1.8, fontWeight: 300, maxWidth: 560, margin: '0 auto',
  },
  statsRow: {
    display: 'flex', justifyContent: 'center',
    gap: 0, marginTop: 60, flexWrap: 'wrap',
    borderTop: '1px solid rgba(245,239,224,0.12)',
  },
  statItem: {
    padding: '40px 48px',
    borderRight: '1px solid rgba(245,239,224,0.12)',
    textAlign: 'center',
    flex: '1 1 180px',
  },
  statNum: {
    fontFamily: "'Playfair Display', serif",
    fontSize: 44, fontWeight: 700, color: '#C4603A',
    lineHeight: 1,
  },
  statLabel: {
    fontSize: 13, color: 'rgba(245,239,224,0.5)',
    fontWeight: 300, marginTop: 8, lineHeight: 1.4,
  },

  // How it works
  how: { padding: '100px 24px', maxWidth: 1000, margin: '0 auto' },
  sectionEyebrow: {
    fontSize: 11, letterSpacing: '2.5px',
    textTransform: 'uppercase', fontWeight: 500,
    color: '#C4603A', marginBottom: 16, textAlign: 'center',
  },
  sectionH2: {
    fontFamily: "'Playfair Display', serif",
    fontSize: 'clamp(28px, 4vw, 44px)',
    fontWeight: 700, color: '#2D4A3E',
    textAlign: 'center', marginBottom: 64,
    letterSpacing: '-1px',
  },
  stepsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
    gap: 24,
  },
  stepCard: {
    background: '#FAF7F0',
    border: '1px solid rgba(45,74,62,0.12)',
    borderRadius: 20, padding: '36px 28px',
    position: 'relative',
    boxShadow: '0 2px 24px rgba(45,74,62,0.06)',
  },
  stepNum: {
    fontFamily: "'Playfair Display', serif",
    fontSize: 64, fontWeight: 700,
    color: 'rgba(45,74,62,0.08)',
    lineHeight: 1, marginBottom: 16,
    position: 'absolute', top: 20, right: 24,
  },
  stepEmoji: { fontSize: 32, marginBottom: 16 },
  stepTitle: {
    fontFamily: "'Playfair Display', serif",
    fontSize: 20, fontWeight: 700, color: '#2D4A3E',
    marginBottom: 10,
  },
  stepDesc: { fontSize: 14, color: '#6B6458', lineHeight: 1.7, fontWeight: 300 },

  // Features
  features: {
    background: '#FAF7F0',
    padding: '100px 24px',
  },
  featuresInner: { maxWidth: 1000, margin: '0 auto' },
  featGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: 20, marginTop: 0,
  },
  featCard: {
    background: 'white',
    border: '1px solid rgba(45,74,62,0.1)',
    borderRadius: 16, padding: '28px 24px',
  },
  featIcon: { fontSize: 28, marginBottom: 14 },
  featTitle: { fontSize: 15, fontWeight: 500, color: '#2D4A3E', marginBottom: 8 },
  featDesc: { fontSize: 13, color: '#6B6458', lineHeight: 1.6, fontWeight: 300 },

  // Final CTA
  finalCta: {
    padding: '100px 24px',
    textAlign: 'center',
    maxWidth: 700, margin: '0 auto',
  },
  finalH2: {
    fontFamily: "'Playfair Display', serif",
    fontSize: 'clamp(32px, 5vw, 52px)',
    fontWeight: 700, color: '#2D4A3E',
    marginBottom: 20, letterSpacing: '-1px',
  },
  finalSub: { fontSize: 16, color: '#6B6458', marginBottom: 40, fontWeight: 300, lineHeight: 1.7 },

  // Footer
  footer: {
    borderTop: '1px solid rgba(45,74,62,0.12)',
    padding: '28px 48px',
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    flexWrap: 'wrap', gap: 12,
  },
  footerLogo: {
    fontFamily: "'Playfair Display', serif",
    fontSize: 16, fontWeight: 700, color: '#2D4A3E',
  },
  footerNote: { fontSize: 13, color: '#6B6458', fontWeight: 300 },
};

const STEPS = [
  { emoji: '🥦', title: 'Add your ingredients', desc: 'Type what you have in your fridge — eggs, onions, rice, whatever. No need to be precise.' },
  { emoji: '⏱️', title: 'Set time & diet', desc: 'Tell us how much time you have and any dietary preferences. That is it.' },
  { emoji: '🤖', title: 'AI thinks for you', desc: 'Claude AI cross-references thousands of recipes and picks the 3 best matches for exactly what you have.' },
  { emoji: '🍽️', title: 'Cook with confidence', desc: 'Get full recipes with step-by-step instructions, ingredient amounts, and nutrition info.' },
];

const FEATURES = [
  { icon: '🔒', title: 'Fully secure', desc: 'Your API key never touches the browser. Runs server-side only.' },
  { icon: '⚡', title: 'Instant results', desc: 'Meal suggestions in under 5 seconds, every time.' },
  { icon: '🥗', title: 'Diet-aware', desc: 'Vegetarian, vegan, gluten-free, dairy-free, low-carb — all supported.' },
  { icon: '📋', title: 'Full recipes', desc: 'Not just names — complete ingredient lists, steps, and nutrition.' },
  { icon: '♻️', title: 'Reduces waste', desc: 'Use what you have, buy less, waste nothing.' },
  { icon: '🌍', title: 'Works anywhere', desc: 'Any cuisine, any ingredient — from dal to pasta to stir fry.' },
];

export default function Landing() {
  const navigate = useNavigate();

  return (
    <div style={s.page}>
      {/* Nav */}
      <nav style={s.nav}>
        <div style={s.navLogo}>🧠 FridgeMind</div>
        <button
          style={s.navCta}
          onClick={() => navigate('/app')}
          onMouseEnter={e => { e.target.style.background = '#4A7C65'; e.target.style.transform = 'translateY(-1px)'; }}
          onMouseLeave={e => { e.target.style.background = '#2D4A3E'; e.target.style.transform = 'none'; }}
        >
          Try it free →
        </button>
      </nav>

      {/* Hero */}
      <section style={s.hero}>
        <span style={s.eyebrow}>Solving the world's #1 daily frustration</span>
        <h1 style={s.h1}>
          Stop staring at<br />
          your <span style={s.h1Italic}>fridge.</span>
        </h1>
        <p style={s.sub}>
          Tell us what ingredients you have. FridgeMind uses AI to suggest 3 delicious meals you can make — right now, with exactly what's in front of you.
        </p>
        <div style={s.heroCtas}>
          <button
            style={s.primaryBtn}
            onClick={() => navigate('/app')}
            onMouseEnter={e => { e.currentTarget.style.background = '#4A7C65'; e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 32px rgba(45,74,62,0.25)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = '#2D4A3E'; e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'none'; }}
          >
            <span>🍳</span> What should I cook?
          </button>
          <button
            style={s.secondaryBtn}
            onClick={() => document.getElementById('how').scrollIntoView({ behavior: 'smooth' })}
            onMouseEnter={e => { e.target.style.borderColor = '#2D4A3E'; e.target.style.background = 'rgba(45,74,62,0.05)'; }}
            onMouseLeave={e => { e.target.style.borderColor = 'rgba(45,74,62,0.25)'; e.target.style.background = 'transparent'; }}
          >
            See how it works
          </button>
        </div>
        <div style={s.badge}>
          {['Free to use', 'No sign-up needed', 'Powered by Claude AI', 'Results in 5 seconds'].map(t => (
            <span key={t} style={s.badgeItem}><span style={s.badgeDot} />{t}</span>
          ))}
        </div>
      </section>

      {/* Problem / Stats */}
      <section style={s.problem}>
        <div style={s.problemInner}>
          <div style={s.problemEyebrow}>The problem we solved</div>
          <h2 style={s.problemH2}>
            The average person spends <span style={s.problemStat}>over 400 hours</span> deciding what to eat — every year.
          </h2>
          <p style={s.problemP}>
            Decision fatigue around meals is real. It leads to food waste, unnecessary grocery runs, unhealthy takeout, and daily stress. FridgeMind eliminates that entirely.
          </p>
        </div>
        <div style={s.statsRow}>
          {[
            { num: '400+', label: 'Hours spent per year on meal decisions' },
            { num: '30%', label: 'Of food purchased is thrown away unused' },
            { num: '3 sec', label: 'Average time to add your ingredients' },
            { num: '3', label: 'Personalised meals suggested every time' },
          ].map((s2, i) => (
            <div key={i} style={{ ...s.statItem, borderRight: i < 3 ? s.statItem.borderRight : 'none' }}>
              <div style={s.statNum}>{s2.num}</div>
              <div style={s.statLabel}>{s2.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section id="how" style={{ padding: '100px 24px' }}>
        <div style={{ maxWidth: 1000, margin: '0 auto' }}>
          <div style={s.sectionEyebrow}>How it works</div>
          <h2 style={s.sectionH2}>Four steps. Zero stress.</h2>
          <div style={s.stepsGrid}>
            {STEPS.map((step, i) => (
              <div key={i} style={s.stepCard}>
                <div style={s.stepNum}>{i + 1}</div>
                <div style={s.stepEmoji}>{step.emoji}</div>
                <div style={s.stepTitle}>{step.title}</div>
                <div style={s.stepDesc}>{step.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section style={s.features}>
        <div style={s.featuresInner}>
          <div style={s.sectionEyebrow}>Why FridgeMind</div>
          <h2 style={s.sectionH2}>Everything you need, nothing you don't.</h2>
          <div style={s.featGrid}>
            {FEATURES.map((f, i) => (
              <div key={i} style={s.featCard}>
                <div style={s.featIcon}>{f.icon}</div>
                <div style={s.featTitle}>{f.title}</div>
                <div style={s.featDesc}>{f.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section>
        <div style={s.finalCta}>
          <h2 style={s.finalH2}>What's in your fridge right now?</h2>
          <p style={s.finalSub}>Try it — takes less than 30 seconds and you'll have a full meal plan ready to cook.</p>
          <button
            style={{ ...s.primaryBtn, margin: '0 auto', fontSize: 17, padding: '20px 48px' }}
            onClick={() => navigate('/app')}
            onMouseEnter={e => { e.currentTarget.style.background = '#4A7C65'; e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 32px rgba(45,74,62,0.25)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = '#2D4A3E'; e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'none'; }}
          >
            <span>🧠</span> Open FridgeMind — it's free
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer style={s.footer}>
        <div style={s.footerLogo}>🧠 FridgeMind</div>
        <div style={s.footerNote}>Powered by Claude AI · Built with ❤️ · No sign-up required</div>
      </footer>
    </div>
  );
}
