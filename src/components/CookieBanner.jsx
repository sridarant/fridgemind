// src/components/CookieBanner.jsx — GDPR cookie consent with granular opt-in/out

import { useState, useEffect } from 'react';

const CONSENT_KEY = 'jiff-cookie-consent-v2';

export function initAnalytics() {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('consent', 'update', { analytics_storage: 'granted', ad_storage: 'denied' });
  }
}

export function getConsent() {
  try {
    const raw = localStorage.getItem(CONSENT_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

export function saveConsent(prefs) {
  try { localStorage.setItem(CONSENT_KEY, JSON.stringify({ ...prefs, ts: Date.now() })); } catch {}
  if (prefs.analytics) initAnalytics();
}

export function trackEvent(name, params) {
  if (typeof window !== 'undefined' && window._jiffGA) window._jiffGA(name, params);
}

export default function CookieBanner() {
  const [visible,   setVisible]   = useState(false);
  const [showPrefs, setShowPrefs] = useState(false);
  const [prefs,     setPrefs]     = useState({ essential: true, analytics: false, functional: true });

  useEffect(() => {
    const c = getConsent();
    if (!c) {
      const t = setTimeout(() => setVisible(true), 1000);
      return () => clearTimeout(t);
    }
    if (c.analytics) initAnalytics();
  }, []);

  const acceptAll = () => {
    const p = { essential: true, analytics: true, functional: true };
    saveConsent(p); setVisible(false);
  };

  const saveSelected = () => {
    saveConsent(prefs); setVisible(false);
  };

  const declineAll = () => {
    saveConsent({ essential: true, analytics: false, functional: false });
    setVisible(false);
  };

  if (!visible) return null;

  const toggle = (key) => setPrefs(p => ({ ...p, [key]: !p[key] }));

  const CATEGORIES = [
    { key: 'essential',  label: 'Essential',   desc: 'Required for the app to work. Cannot be disabled.', locked: true },
    { key: 'functional', label: 'Functional',  desc: 'Remember your preferences (language, units, pantry).', locked: false },
    { key: 'analytics',  label: 'Analytics',   desc: 'Google Analytics — understand usage and improve Jiff.', locked: false },
  ];

  return (
    <div style={{
      position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 9999,
      background: '#1C0A00', borderTop: '1px solid rgba(255,250,245,0.1)',
      fontFamily: "'DM Sans', sans-serif", animation: 'csIn 0.3s ease',
    }}>
      <style>{'@keyframes csIn{from{transform:translateY(100%);opacity:0}to{transform:translateY(0);opacity:1}}'}</style>

      <div style={{ maxWidth: 960, margin: '0 auto', padding: showPrefs ? '16px 24px 20px' : '14px 24px' }}>

        {showPrefs ? (
          /* Detailed preferences */
          <>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              <div style={{ fontSize: 14, fontWeight: 500, color: '#FFFAF5' }}>🍪 Cookie preferences</div>
              <button onClick={() => setShowPrefs(false)} style={{ background: 'none', border: 'none', color: 'rgba(255,250,245,0.5)', cursor: 'pointer', fontSize: 14, fontFamily: "'DM Sans', sans-serif" }}>← Back</button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16 }}>
              {CATEGORIES.map(cat => (
                <div key={cat.key} style={{ display: 'flex', alignItems: 'center', gap: 14, background: 'rgba(255,250,245,0.05)', borderRadius: 10, padding: '10px 14px' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 500, color: '#FFFAF5', marginBottom: 2 }}>{cat.label}</div>
                    <div style={{ fontSize: 11, color: 'rgba(255,250,245,0.55)', fontWeight: 300 }}>{cat.desc}</div>
                  </div>
                  {/* Toggle switch */}
                  <div
                    onClick={() => !cat.locked && toggle(cat.key)}
                    style={{
                      width: 40, height: 22, borderRadius: 11, position: 'relative', flexShrink: 0,
                      background: (prefs[cat.key] || cat.locked) ? '#FF4500' : 'rgba(255,250,245,0.2)',
                      cursor: cat.locked ? 'not-allowed' : 'pointer', transition: 'background 0.2s',
                    }}
                  >
                    <div style={{
                      position: 'absolute', top: 2, left: (prefs[cat.key] || cat.locked) ? 20 : 2,
                      width: 18, height: 18, borderRadius: '50%', background: 'white',
                      transition: 'left 0.2s', boxShadow: '0 1px 4px rgba(0,0,0,0.3)',
                    }}/>
                  </div>
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={saveSelected} style={{ background: '#FF4500', color: 'white', border: 'none', borderRadius: 8, padding: '9px 20px', fontSize: 13, fontWeight: 500, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", flex: 1 }}>Save preferences</button>
              <button onClick={acceptAll}    style={{ background: 'rgba(255,250,245,0.1)', color: 'rgba(255,250,245,0.8)', border: '1px solid rgba(255,250,245,0.2)', borderRadius: 8, padding: '9px 20px', fontSize: 13, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}>Accept all</button>
            </div>
          </>
        ) : (
          /* Summary banner */
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 20, flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: 240 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 5 }}>
                <span>🍪</span>
                <span style={{ fontSize: 13, fontWeight: 500, color: '#FFFAF5' }}>We use cookies</span>
              </div>
              <p style={{ fontSize: 12, color: 'rgba(255,250,245,0.6)', lineHeight: 1.6, margin: 0 }}>
                Essential cookies keep the app working. Analytics cookies (optional) help us improve.{' '}
                <a href="/privacy" style={{ color: '#FF4500', textDecoration: 'none' }}>Privacy policy</a>
                {' · '}
                <button onClick={() => setShowPrefs(true)} style={{ background: 'none', border: 'none', color: 'rgba(255,250,245,0.5)', fontSize: 12, cursor: 'pointer', padding: 0, fontFamily: "'DM Sans', sans-serif", textDecoration: 'underline' }}>
                  Manage preferences
                </button>
              </p>
            </div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexShrink: 0, paddingTop: 2 }}>
              <button onClick={declineAll}  style={{ background: 'none', border: '1px solid rgba(255,250,245,0.2)', color: 'rgba(255,250,245,0.6)', borderRadius: 8, padding: '8px 14px', fontSize: 12, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}>Essential only</button>
              <button onClick={acceptAll}   style={{ background: '#FF4500', border: 'none', color: 'white', borderRadius: 8, padding: '8px 18px', fontSize: 12, fontWeight: 500, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}>Accept all</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
