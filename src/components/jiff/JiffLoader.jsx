// src/components/jiff/JiffLoader.jsx — v1.23.00
// Brand-aligned loader: "jiff" wordmark centered, opacity pulse animation.
// No SVG icon, no spinner. Wordmark only.
//
// Animation: opacity pulse 0.6 → 1 → 0.6, 700ms loop (Option A per spec)
// Rotating microcopy: "thinking..." / "planning..." / "almost ready..."

import { useState, useEffect } from 'react';

const MESSAGES = [
  'thinking...',
  'planning...',
  'almost ready...',
];

const LOADER_CSS = `
  @keyframes jiff-wm-pulse {
    0%,100% { opacity: 0.6; }
    50%      { opacity: 1;   }
  }
  .jiff-wm-pulse {
    animation: jiff-wm-pulse 700ms ease-in-out infinite;
  }
`;

export default function JiffLoader({ message }) {
  const [msgIdx, setMsgIdx] = useState(0);

  useEffect(() => {
    if (message) return; // caller provided custom message — don't rotate
    const t = setInterval(() => setMsgIdx(i => (i + 1) % MESSAGES.length), 1400);
    return () => clearInterval(t);
  }, [message]);

  const displayMsg = message || MESSAGES[msgIdx];

  return (
    <>
      <style>{LOADER_CSS}</style>
      <div style={{
        position:       'fixed',
        inset:          0,
        display:        'flex',
        flexDirection:  'column',
        alignItems:     'center',
        justifyContent: 'center',
        background:     '#FFFAF5',
        zIndex:         9999,
        fontFamily:     "'DM Sans', sans-serif",
        gap:            16,
      }}
        role="status"
        aria-label="Loading Jiff"
      >
        {/* Wordmark — pulsing */}
        <div className="jiff-wm-pulse" style={{ display:'flex', alignItems:'center' }}>
          <span style={{
            fontFamily:    "'Fraunces', serif",
            fontWeight:    900,
            fontSize:      42,
            letterSpacing: '-0.03em',
            lineHeight:    1,
            color:         '#1C0A00',
          }}>
            <span style={{ color: '#FF4500' }}>{'j'}</span>{'iff'}
          </span>
        </div>

        {/* Rotating microcopy */}
        <div style={{
          fontSize:   13,
          color:      '#7C6A5E',
          fontWeight: 300,
          letterSpacing: '0.02em',
          minHeight:  20,
          transition: 'opacity 0.3s',
        }}>
          {displayMsg}
        </div>
      </div>
    </>
  );
}
