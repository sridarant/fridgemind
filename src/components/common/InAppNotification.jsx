// src/components/common/InAppNotification.jsx
// In-app time-based meal suggestion banner.
// Fires when app is open — does NOT require browser push permission.
//
// Windows:
//   Morning   07:00–09:00 → breakfast suggestion
//   Afternoon 12:00–14:00 → lunch suggestion
//   Evening   18:00–20:00 → dinner suggestion
//
// Rules:
//   - only shown once per window per day (localStorage key)
//   - respects jiff-notif-enabled + jiff-notif-{window} prefs
//   - auto-dismisses after 6s, or on manual close
//   - CTA navigates to /app (already there) — triggers the recommendation
//
// Usage: mount once at app root, pass navigate + onCookNow

import { useState, useEffect } from 'react';

const WINDOWS = [
  { id:'breakfast', hourStart:7,  hourEnd:9,  label:'Ready for breakfast?',  sub:'Something quick before you start your day.',  emoji:'🌅' },
  { id:'lunch',     hourStart:12, hourEnd:14, label:'Lunch time — what\'s the plan?', sub:'Let\'s get you something good.',         emoji:'☀️' },
  { id:'dinner',    hourStart:18, hourEnd:20, label:'Time to cook?',          sub:'Try something quick for this evening.',             emoji:'🌙' },
];

const SENT_KEY = 'jiff-inapp-notif-sent';
const MS_DAY   = 86400000;

function getWindowForNow() {
  const h = new Date().getHours();
  return WINDOWS.find(w => h >= w.hourStart && h < w.hourEnd) || null;
}

function isEnabled()     { try { return localStorage.getItem('jiff-notif-enabled') !== 'false'; } catch { return true; } }
function isPrefEnabled(id) { try { return localStorage.getItem('jiff-notif-' + id) !== 'false'; } catch { return true; } }

function wasSentToday(id) {
  try {
    const d = JSON.parse(localStorage.getItem(SENT_KEY) || '{}');
    return d[id] && (Date.now() - new Date(d[id]).getTime()) < MS_DAY;
  } catch { return false; }
}

function markSent(id) {
  try {
    const d = JSON.parse(localStorage.getItem(SENT_KEY) || '{}');
    d[id] = new Date().toISOString();
    localStorage.setItem(SENT_KEY, JSON.stringify(d));
  } catch {}
}

export default function InAppNotification({ onCookNow }) {
  const [notif,   setNotif]   = useState(null);
  const [visible, setVisible] = useState(false);
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    if (!isEnabled()) return;

    const tryShow = () => {
      const win = getWindowForNow();
      if (!win) return;
      if (!isPrefEnabled(win.id)) return;
      if (wasSentToday(win.id)) return;

      markSent(win.id);
      setNotif(win);
      // Small delay so app is settled before banner appears
      setTimeout(() => setVisible(true), 1200);
    };

    // Try immediately
    tryShow();

    // Also try every 30 min in case user leaves app open across a window boundary
    const interval = setInterval(tryShow, 30 * 60 * 1000);
    return () => clearInterval(interval);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-dismiss after 6s
  useEffect(() => {
    if (!visible) return;
    const t = setTimeout(() => dismiss(), 6000);
    return () => clearTimeout(t);
  }, [visible]); // eslint-disable-line react-hooks/exhaustive-deps

  const dismiss = () => {
    setLeaving(true);
    setTimeout(() => { setVisible(false); setLeaving(false); setNotif(null); }, 280);
  };

  const handleCook = () => {
    dismiss();
    onCookNow && onCookNow();
  };

  if (!notif || !visible) return null;

  return (
    <>
      <style>{`
        @keyframes jiff-notif-in  { from { transform:translateY(-100%); opacity:0; } to { transform:translateY(0); opacity:1; } }
        @keyframes jiff-notif-out { from { transform:translateY(0); opacity:1; } to { transform:translateY(-100%); opacity:0; } }
      `}</style>
      <div style={{
        position:   'fixed',
        top:        0,
        left:       0,
        right:      0,
        zIndex:     8500,
        padding:    '10px 12px',
        background: '#1C0A00',
        boxShadow:  '0 4px 20px rgba(28,10,0,0.22)',
        display:    'flex',
        alignItems: 'center',
        gap:        12,
        fontFamily: "'DM Sans', sans-serif",
        animation:  (leaving ? 'jiff-notif-out' : 'jiff-notif-in') + ' 0.28s ease both',
      }}>
        {/* Emoji */}
        <span style={{ fontSize:22, flexShrink:0 }}>{notif.emoji}</span>

        {/* Text */}
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ fontSize:13, fontWeight:600, color:'white', lineHeight:1.3 }}>
            {notif.label}
          </div>
          <div style={{ fontSize:11, color:'rgba(255,255,255,0.55)', marginTop:2 }}>
            {notif.sub}
          </div>
        </div>

        {/* CTA */}
        <button onClick={handleCook}
          style={{ flexShrink:0, background:'#FF4500', color:'white', border:'none', borderRadius:8, padding:'7px 14px', fontSize:12, fontWeight:600, cursor:'pointer', fontFamily:"'DM Sans',sans-serif", whiteSpace:'nowrap', touchAction:'manipulation' }}>
          {'Cook now →'}
        </button>

        {/* Dismiss */}
        <button onClick={dismiss}
          style={{ flexShrink:0, background:'none', border:'none', color:'rgba(255,255,255,0.4)', fontSize:18, cursor:'pointer', lineHeight:1, padding:'0 2px', touchAction:'manipulation' }}>
          {'✕'}
        </button>
      </div>
    </>
  );
}
