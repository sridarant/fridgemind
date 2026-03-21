import { useNavigate } from 'react-router-dom';

const C = { jiff:'#FF4500', ink:'#1C0A00', cream:'#FFFAF5', warm:'#FFF0E5', muted:'#7C6A5E', border:'rgba(28,10,0,0.10)' };

const Section = ({ title, children }) => (
  <div style={{ marginBottom: 32 }}>
    <h2 style={{ fontFamily:"'Fraunces', serif", fontSize: 20, fontWeight: 900, color: C.ink, letterSpacing: '-0.3px', marginBottom: 12, paddingBottom: 8, borderBottom: '1px solid ' + C.border }}>
      {title}
    </h2>
    <div style={{ fontSize: 14, color: C.muted, lineHeight: 1.8, fontWeight: 300 }}>
      {children}
    </div>
  </div>
);

const P = ({ children }) => <p style={{ marginBottom: 12 }}>{children}</p>;

export default function Privacy() {
  const navigate = useNavigate();
  return (
    <div style={{ minHeight:'100vh', background:C.cream, fontFamily:"'DM Sans', sans-serif", color:C.ink }}>
      <link href="https://fonts.googleapis.com/css2?family=Fraunces:ital,wght@0,700;0,900&family=DM+Sans:wght@300;400;500&display=swap" rel="stylesheet"/>
      <header style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'16px 28px', borderBottom:'1px solid '+C.border, position:'sticky', top:0, zIndex:10, background:'rgba(255,250,245,0.95)', backdropFilter:'blur(12px)' }}>
        <div style={{ display:'flex', alignItems:'center', gap:8, cursor:'pointer' }} onClick={()=>navigate('/')}>
          <span style={{ fontSize:22 }}>⚡</span>
          <span style={{ fontFamily:"'Fraunces', serif", fontSize:22, fontWeight:900, color:C.ink, letterSpacing:'-0.5px' }}>
            <span style={{ color:C.jiff }}>J</span>iff
          </span>
        </div>
        <button onClick={()=>navigate(-1)} style={{ fontSize:13, color:C.muted, background:'none', border:'1.5px solid rgba(28,10,0,0.18)', borderRadius:8, padding:'6px 14px', cursor:'pointer', fontFamily:"'DM Sans', sans-serif" }}>
          ← Back
        </button>
      </header>
      <div style={{ maxWidth:720, margin:'0 auto', padding:'48px 24px 80px' }}>
        <div style={{ marginBottom:40 }}>
          <p style={{ fontSize:11, letterSpacing:'2px', textTransform:'uppercase', color:C.jiff, fontWeight:500, marginBottom:8 }}>Legal</p>
          <h1 style={{ fontFamily:"'Fraunces', serif", fontSize:'clamp(28px,5vw,42px)', fontWeight:900, color:C.ink, letterSpacing:'-1px', marginBottom:10 }}>Privacy Policy</h1>
          <p style={{ fontSize:14, color:C.muted, fontWeight:300 }}>Last updated: March 2026</p>
        </div>
        <div style={{ background:C.warm, borderRadius:14, padding:'16px 20px', marginBottom:36, fontSize:14, color:C.ink, lineHeight:1.7 }}>
          <strong>Summary:</strong> Jiff collects minimal data to make the app work and improve it. We do not sell your data, show ads, or share data for marketing. You can delete your account any time.
        </div>
        <Section title="1. Who we are"><P>Jiff is an AI-powered meal suggestion app. Questions: <a href="mailto:privacy@getjiff.in" style={{ color:C.jiff }}>privacy@getjiff.in</a></P></Section>
        <Section title="2. What we collect">
          <P><strong style={{ color:C.ink }}>Account info</strong> — email and name from Google sign-in or magic link. Used to identify your account and sync preferences.</P>
          <P><strong style={{ color:C.ink }}>Usage analytics (optional)</strong> — with consent: page views, feature usage, device type, country-level location. No fingerprinting, no precise GPS.</P>
          <P><strong style={{ color:C.ink }}>Meal and pantry data</strong> — ingredients, generated recipes, saved meals, taste profile. Used only to personalise your experience.</P>
          <P><strong style={{ color:C.ink }}>Payment data</strong> — processed by Razorpay. We receive plan confirmation only. We do not store card or bank details.</P>
          <P><strong style={{ color:C.ink }}>Email addresses</strong> — if you submit your email on our landing or pricing page. Used to notify you of product updates. Unsubscribe any time.</P>
        </Section>
        <Section title="3. Cookies">
          <P><strong style={{ color:C.ink }}>Essential</strong> — session and auth. Cannot be disabled without breaking the app.</P>
          <P><strong style={{ color:C.ink }}>Analytics (optional)</strong> — Google Analytics 4, only after you accept the cookie banner. Clear browser data for this site to reset.</P>
          <P>No advertising, tracking, or social cookies.</P>
        </Section>
        <Section title="4. Third parties">
          <P>Supabase (database) · Anthropic (AI) · Razorpay (payments) · Google Analytics (analytics, with consent) · Mailchimp (email). None of these receive your data for their own marketing. We do not sell data.</P>
        </Section>
        <Section title="5. Your rights">
          <P>Access, correct, delete, or export your data at any time. Email <a href="mailto:privacy@getjiff.in" style={{ color:C.jiff }}>privacy@getjiff.in</a> to exercise your rights. Account deletion removes all personal data within 30 days.</P>
        </Section>
        <Section title="6. Children">
          <P>Jiff is not directed at children under 13. We do not knowingly collect data from them.</P>
        </Section>
        <Section title="7. Changes">
          <P>We will notify you of significant changes by email or in-app notice. Continued use after changes means acceptance.</P>
        </Section>
        <div style={{ marginTop:48, paddingTop:24, borderTop:'1px solid '+C.border, fontSize:13, color:C.muted, fontWeight:300 }}>
          Contact: <a href="mailto:privacy@getjiff.in" style={{ color:C.jiff }}>privacy@getjiff.in</a>
        </div>
      </div>
    </div>
  );
}
