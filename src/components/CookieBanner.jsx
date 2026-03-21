// src/components/CookieBanner.jsx — GDPR cookie consent
import { useState, useEffect } from 'react';

const CONSENT_KEY = 'jiff-cookie-consent';

export function initAnalytics() {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('consent', 'update', { analytics_storage: 'granted', ad_storage: 'denied' });
  }
}

export function getConsent() {
  try { return localStorage.getItem(CONSENT_KEY); } catch { return null; }
}

export function trackEvent(name, params) {
  if (typeof window !== 'undefined' && window._jiffGA) window._jiffGA(name, params);
}

export default function CookieBanner() {
  const [visible,  setVisible]  = useState(false);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    const c = getConsent();
    if (!c) { const t = setTimeout(() => setVisible(true), 1200); return () => clearTimeout(t); }
    if (c === 'accepted') initAnalytics();
  }, []);

  const accept  = () => { try { localStorage.setItem(CONSENT_KEY, 'accepted');  } catch {} initAnalytics(); setVisible(false); };
  const decline = () => { try { localStorage.setItem(CONSENT_KEY, 'declined');  } catch {} setVisible(false); };

  if (!visible) return null;

  const btn = (onClick, label, primary) => (
    <button onClick={onClick} style={{
      background: primary ? '#FF4500' : 'none',
      border:     primary ? 'none' : '1px solid rgba(255,250,245,0.2)',
      color:      primary ? 'white' : 'rgba(255,250,245,0.6)',
      borderRadius: 8, padding: '8px 18px', fontSize: 13, fontWeight: primary ? 500 : 400,
      cursor: 'pointer', fontFamily: "'DM Sans', sans-serif",
    }}>{label}</button>
  );

  return (
    <div style={{
      position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 9999,
      background: '#1C0A00', borderTop: '1px solid rgba(255,250,245,0.1)',
      fontFamily: "'DM Sans', sans-serif", animation: 'cookie-slide 0.3s ease',
    }}>
      <style>{'@keyframes cookie-slide{from{transform:translateY(100%);opacity:0}to{transform:translateY(0);opacity:1}}'}</style>
      <div style={{ maxWidth: 960, margin: '0 auto', padding: '16px 24px', display: 'flex', alignItems: 'flex-start', gap: 20, flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: 260 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
            <span>🍪</span>
            <span style={{ fontSize: 14, fontWeight: 500, color: '#FFFAF5' }}>Cookie &amp; privacy notice</span>
          </div>
          <p style={{ fontSize: 13, color: 'rgba(255,250,245,0.65)', lineHeight: 1.6, margin: 0 }}>
            Jiff uses analytics cookies to understand how the app is used and improve it.
            We never sell your data or show ads.{' '}
            <a href="/privacy" style={{ color: '#FF4500', textDecoration: 'none' }}>Privacy policy</a>
            {!expanded && (
              <button onClick={() => setExpanded(true)} style={{ background: 'none', border: 'none', color: 'rgba(255,250,245,0.45)', fontSize: 12, cursor: 'pointer', marginLeft: 8, fontFamily: "'DM Sans', sans-serif" }}>
                What we collect ↓
              </button>
            )}
          </p>
          {expanded && (
            <ul style={{ margin: '8px 0 0', paddingLeft: 16, fontSize: 12, color: 'rgba(255,250,245,0.5)', lineHeight: 1.7 }}>
              <li>Page views and feature usage (meal generation, planner)</li>
              <li>Device type and browser — no fingerprinting</li>
              <li>Country-level location — no precise GPS</li>
              <li>We do NOT collect: names, emails without consent, payment details</li>
            </ul>
          )}
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexShrink: 0, paddingTop: 2 }}>
          {btn(decline, 'Decline', false)}
          {btn(accept,  'Accept cookies', true)}
        </div>
      </div>
    </div>
  );
}
