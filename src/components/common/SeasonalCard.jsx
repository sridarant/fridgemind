// src/components/common/SeasonalCard.jsx
// Seasonal recipe card — used in both Journey tiles and Discover tab.
// Shows current season produce + recipe suggestions, tappable to generate.

import { getCurrentSeason } from '../../lib/festival.js';

export default function SeasonalCard({ onGenerate, compact = false }) {
  const season = getCurrentSeason();

  if (compact) {
    // Tile version — used in Journey home
    return (
      <button onClick={() => onGenerate?.({ seasonal: true, season })}
        style={{
          display:       'flex',
          flexDirection: 'column',
          gap:           6,
          padding:       '16px 14px',
          background:    'rgba(29,158,117,0.06)',
          border:        '1.5px solid rgba(29,158,117,0.2)',
          borderRadius:  16,
          cursor:        'pointer',
          textAlign:     'left',
          fontFamily:    "'DM Sans', sans-serif",
          width:         '100%',
          transition:    'all 0.15s',
        }}
        onMouseEnter={e => e.currentTarget.style.background = 'rgba(29,158,117,0.1)'}
        onMouseLeave={e => e.currentTarget.style.background = 'rgba(29,158,117,0.06)'}
      >
        <span style={{ fontSize: 26, lineHeight: 1 }}>{season.emoji}</span>
        <span style={{ fontSize: 13, fontWeight: 600, color: '#1C0A00', lineHeight: 1.3 }}>
          In season now
        </span>
        <span style={{ fontSize: 11, color: '#7C6A5E', fontWeight: 300, lineHeight: 1.4 }}>
          {season.items.slice(0, 2).join(', ')} & more
        </span>
      </button>
    );
  }

  // Full card version — used in Discover
  return (
    <div style={{
      background:   'white',
      border:       '1px solid rgba(28,10,0,0.08)',
      borderRadius: 16,
      overflow:     'hidden',
      marginBottom: 20,
      fontFamily:   "'DM Sans', sans-serif",
    }}>
      {/* Header */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(29,158,117,0.08) 0%, rgba(29,158,117,0.04) 100%)',
        padding:    '16px 18px 12px',
        borderBottom: '1px solid rgba(28,10,0,0.06)',
      }}>
        <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:4 }}>
          <span style={{ fontSize:22 }}>{season.emoji}</span>
          <div>
            <div style={{ fontSize:10, letterSpacing:'1.5px', textTransform:'uppercase', color:'#1D9E75', fontWeight:600 }}>
              In Season Now
            </div>
            <div style={{ fontSize:15, fontWeight:700, color:'#1C0A00', fontFamily:"'Fraunces',serif" }}>
              {season.label}
            </div>
          </div>
        </div>
        <div style={{ display:'flex', flexWrap:'wrap', gap:5, marginTop:8 }}>
          {season.items.map(item => (
            <span key={item} style={{
              fontSize:     11,
              padding:      '2px 8px',
              background:   'rgba(29,158,117,0.1)',
              color:        '#1D9E75',
              borderRadius: 20,
              fontWeight:   400,
            }}>
              {item}
            </span>
          ))}
        </div>
      </div>

      {/* Recipes */}
      <div style={{ padding:'12px 18px 16px' }}>
        <div style={{ fontSize:11, color:'#7C6A5E', fontWeight:400, marginBottom:10 }}>
          Try these right now
        </div>
        <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
          {season.recipes.map((recipe, i) => (
            <button key={i}
              onClick={() => onGenerate?.({ seasonal: true, season, dish: recipe })}
              style={{
                display:        'flex',
                alignItems:     'center',
                justifyContent: 'space-between',
                padding:        '10px 14px',
                background:     'rgba(28,10,0,0.02)',
                border:         '1px solid rgba(28,10,0,0.06)',
                borderRadius:   10,
                cursor:         'pointer',
                fontFamily:     "'DM Sans', sans-serif",
                transition:     'all 0.12s',
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(29,158,117,0.06)'}
              onMouseLeave={e => e.currentTarget.style.background = 'rgba(28,10,0,0.02)'}
            >
              <span style={{ fontSize:13, color:'#1C0A00', fontWeight:400 }}>{recipe}</span>
              <span style={{ fontSize:11, color:'#FF4500', fontWeight:500 }}>Cook →</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
