// src/components/common/MoodSelector.jsx
// Inline mood picker — 5 moods, one tap, fires generation.
// Shown as a bottom sheet overlay when Mood tile is tapped.

import { useState } from 'react';
import { moodToContext } from '../../lib/discover.js';

const MOODS = [
  { id:'tired',    emoji:'😴', label:'Tired',    sub:'Quick & comforting' },
  { id:'stressed', emoji:'😤', label:'Stressed', sub:'Simple & familiar'  },
  { id:'happy',    emoji:'😊', label:'Happy',    sub:'Something fun'      },
  { id:'unwell',   emoji:'🤒', label:'Unwell',   sub:'Light & gentle'     },
  { id:'energetic',emoji:'💪', label:'Energetic',sub:'Bold & adventurous' },
];

export default function MoodSelector({ onSelect, onClose }) {
  const [selected, setSelected] = useState(null);

  const handleMood = (mood) => {
    setSelected(mood.id);
    const context = moodToContext(mood.id);
    setTimeout(() => {
      onSelect?.({ mood, context });
    }, 200);
  };

  return (
    <>
      {/* Backdrop */}
      <div onClick={onClose} style={{
        position: 'fixed', inset: 0, zIndex: 9000,
        background: 'rgba(28,10,0,0.4)',
        backdropFilter: 'blur(2px)',
      }}/>

      {/* Bottom sheet */}
      <div style={{
        position:     'fixed',
        bottom:       0, left: 0, right: 0,
        zIndex:       9001,
        background:   'white',
        borderRadius: '20px 20px 0 0',
        padding:      '24px 20px 40px',
        fontFamily:   "'DM Sans', sans-serif",
        animation:    'slideUp 0.2s ease',
      }}>
        <style>{'@keyframes slideUp{from{transform:translateY(100%)}to{transform:translateY(0)}}'}</style>

        {/* Handle */}
        <div style={{
          width: 40, height: 4,
          background: 'rgba(28,10,0,0.12)',
          borderRadius: 2,
          margin: '0 auto 20px',
        }}/>

        <div style={{
          fontFamily:   "'Fraunces', serif",
          fontSize:     20,
          fontWeight:   700,
          color:        '#1C0A00',
          marginBottom: 6,
        }}>
          How are you feeling?
        </div>
        <div style={{ fontSize: 13, color: '#7C6A5E', fontWeight: 300, marginBottom: 20 }}>
          Jiff will match the recipe to your mood
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 10 }}>
          {MOODS.map(mood => (
            <button key={mood.id}
              onClick={() => handleMood(mood)}
              style={{
                display:        'flex',
                flexDirection:  'column',
                alignItems:     'center',
                gap:            6,
                padding:        '14px 6px',
                border:         `2px solid ${selected === mood.id ? '#FF4500' : 'rgba(28,10,0,0.08)'}`,
                borderRadius:   14,
                background:     selected === mood.id ? 'rgba(255,69,0,0.07)' : 'white',
                cursor:         'pointer',
                transition:     'all 0.15s',
                fontFamily:     "'DM Sans', sans-serif",
              }}>
              <span style={{ fontSize: 28 }}>{mood.emoji}</span>
              <span style={{ fontSize: 11, fontWeight: 600, color: '#1C0A00' }}>{mood.label}</span>
              <span style={{ fontSize: 9, color: '#7C6A5E', textAlign: 'center', lineHeight: 1.3 }}>{mood.sub}</span>
            </button>
          ))}
        </div>
      </div>
    </>
  );
}
