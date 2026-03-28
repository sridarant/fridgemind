// src/components/FeedbackWidget.jsx — floating feedback button on all pages

import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

const C = { jiff:'#FF4500', jiffDark:'#CC3700', ink:'#1C0A00', cream:'#FFFAF5', warm:'#FFF0E5', muted:'#7C6A5E', border:'rgba(28,10,0,0.10)', borderMid:'rgba(28,10,0,0.18)', green:'#1D9E75', greenBg:'rgba(29,158,117,0.08)' };

const CATEGORIES = [
  { id: 'bug',     label: '🐛 Bug report',       desc: 'Something is broken' },
  { id: 'feature', label: '✨ Feature request',   desc: 'Something I want' },
  { id: 'recipe',  label: '🍽️ Recipe quality',   desc: 'Recipe suggestions' },
  { id: 'ux',      label: '🎨 Design / UX',       desc: 'Layout or usability' },
  { id: 'other',   label: '💬 General feedback',  desc: 'Anything else' },
];

export default function FeedbackWidget() {
  const { user } = useAuth();
  const [open,      setOpen]      = useState(false);
  const [rating,    setRating]    = useState(0);
  const [hovered,   setHovered]   = useState(0);
  const [category,  setCategory]  = useState('other');
  const [message,   setMessage]   = useState('');
  const [state,     setState]     = useState('idle'); // idle | sending | done | error
  const [page,      setPage]      = useState(typeof window !== 'undefined' ? window.location.pathname : '/');

  const handleSubmit = async () => {
    if (!message.trim() && rating === 0) return;
    setState('sending');
    try {
      const res = await fetch('/api/comms?action=feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId:   user?.id || null,
          email:    user?.email || null,
          rating,
          category,
          message:  message.trim(),
          page:     typeof window !== 'undefined' ? window.location.pathname : '/',
          ua:       navigator.userAgent,
          ts:       Date.now(),
        }),
      });
      if (res.ok) { setState('done'); setTimeout(() => { setOpen(false); setState('idle'); setRating(0); setMessage(''); setCategory('other'); }, 2500); }
      else { setState('error'); }
    } catch { setState('error'); }
  };

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setOpen(p => !p)}
        style={{
          position: 'fixed', bottom: 24, right: 24, zIndex: 9000,
          background: C.ink, color: 'white', border: 'none', borderRadius: 50,
          width: 48, height: 48, fontSize: 18, cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 4px 16px rgba(28,10,0,0.25)', transition: 'all 0.2s',
          fontFamily: "'DM Sans', sans-serif",
        }}
        title="Send feedback"
        onMouseEnter={e => { e.currentTarget.style.background = C.jiff; e.currentTarget.style.transform = 'scale(1.1)'; }}
        onMouseLeave={e => { e.currentTarget.style.background = C.ink;  e.currentTarget.style.transform = 'scale(1)'; }}
      >
        💬
      </button>

      {/* Modal */}
      {open && (
        <div style={{
          position: 'fixed', bottom: 84, right: 24, zIndex: 9001,
          background: 'white', border: '1px solid ' + C.border, borderRadius: 20,
          width: 320, boxShadow: '0 16px 48px rgba(28,10,0,0.18)',
          fontFamily: "'DM Sans', sans-serif", animation: 'feedbackIn 0.2s ease',
        }}>
          <style>{'@keyframes feedbackIn{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}'}</style>

          {state === 'done' ? (
            <div style={{ padding: '32px 24px', textAlign: 'center' }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>🙏</div>
              <div style={{ fontFamily: "'Fraunces', serif", fontSize: 18, fontWeight: 900, color: C.ink, marginBottom: 6 }}>Thank you!</div>
              <div style={{ fontSize: 13, color: C.muted, fontWeight: 300 }}>Your feedback helps us improve Jiff.</div>
            </div>
          ) : (
            <>
              <div style={{ padding: '16px 18px 12px', borderBottom: '1px solid ' + C.border, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 500, color: C.ink }}>Share feedback</div>
                  <div style={{ fontSize: 11, color: C.muted, fontWeight: 300 }}>We read every message</div>
                </div>
                <button onClick={() => setOpen(false)} style={{ background: 'none', border: 'none', color: C.muted, fontSize: 18, cursor: 'pointer', padding: 0 }}>×</button>
              </div>

              <div style={{ padding: '14px 18px' }}>
                {/* Star rating */}
                <div style={{ marginBottom: 14 }}>
                  <div style={{ fontSize: 11, letterSpacing: '1.5px', textTransform: 'uppercase', color: C.jiff, fontWeight: 500, marginBottom: 8 }}>Rate your experience</div>
                  <div style={{ display: 'flex', gap: 6 }}>
                    {[1,2,3,4,5].map(n => (
                      <button key={n} onClick={() => setRating(n)}
                        onMouseEnter={() => setHovered(n)} onMouseLeave={() => setHovered(0)}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 24, padding: 0, transition: 'transform 0.1s', transform: (hovered || rating) >= n ? 'scale(1.2)' : 'scale(1)' }}>
                        {(hovered || rating) >= n ? '⭐' : '☆'}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Category */}
                <div style={{ marginBottom: 12 }}>
                  <div style={{ fontSize: 11, letterSpacing: '1.5px', textTransform: 'uppercase', color: C.jiff, fontWeight: 500, marginBottom: 8 }}>Category</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {CATEGORIES.map(cat => (
                      <button key={cat.id} onClick={() => setCategory(cat.id)}
                        style={{ background: category === cat.id ? C.ink : 'white', color: category === cat.id ? 'white' : C.muted, border: '1.5px solid ' + (category === cat.id ? C.ink : C.borderMid), borderRadius: 20, padding: '4px 10px', fontSize: 11, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", transition: 'all 0.15s' }}>
                        {cat.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Message */}
                <div style={{ marginBottom: 14 }}>
                  <div style={{ fontSize: 11, letterSpacing: '1.5px', textTransform: 'uppercase', color: C.jiff, fontWeight: 500, marginBottom: 8 }}>Message</div>
                  <textarea
                    value={message} onChange={e => setMessage(e.target.value)}
                    placeholder="Tell us what you think, what's broken, or what you'd love to see…"
                    style={{ width: '100%', border: '1.5px solid ' + C.borderMid, borderRadius: 10, padding: '10px 12px', fontSize: 12, fontFamily: "'DM Sans', sans-serif", color: C.ink, resize: 'vertical', minHeight: 80, outline: 'none', background: C.cream, lineHeight: 1.5 }}
                  />
                </div>

                {state === 'error' && <div style={{ fontSize: 12, color: '#E53E3E', marginBottom: 10 }}>Failed to send. Please try again.</div>}

                <button onClick={handleSubmit} disabled={state === 'sending' || (!message.trim() && rating === 0)}
                  style={{ width: '100%', background: C.jiff, color: 'white', border: 'none', borderRadius: 10, padding: '11px', fontSize: 13, fontWeight: 500, cursor: state === 'sending' ? 'not-allowed' : 'pointer', fontFamily: "'DM Sans', sans-serif", opacity: (state === 'sending' || (!message.trim() && rating === 0)) ? 0.6 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                  {state === 'sending' ? <><span style={{ width: 14, height: 14, border: '2px solid rgba(255,255,255,0.4)', borderTopColor: 'white', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.7s linear infinite' }}/>Sending…</> : '⚡ Send feedback'}
                </button>
                <style>{'@keyframes spin{to{transform:rotate(360deg)}}'}</style>
              </div>
            </>
          )}
        </div>
      )}
    </>
  );
}
