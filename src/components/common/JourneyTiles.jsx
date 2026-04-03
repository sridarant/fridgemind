// src/components/common/JourneyTiles.jsx
// Home screen journey picker — 8 tiles, one-tap generation from profile
// Replaces the raw text-input-first landing for logged-in users

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLocale } from '../../contexts/LocaleContext.jsx';

const TILES = [
  {
    id:      'fridge',
    emoji:   '🧊',
    label:   t('journey_fridge_tile'),
    sub:     t('journey_fridge_sub'),
    color:   '#FF4500',
    bg:      'rgba(255,69,0,0.07)',
    border:  'rgba(255,69,0,0.2)',
    action:  'input',        // stays on input screen
    oneTap:  false,
  },
  {
    id:      'goal',
    emoji:   '🎯',
    label:   t('journey_goal_tile'),
    sub:     t('journey_goal_sub'),
    color:   '#1D9E75',
    bg:      'rgba(29,158,117,0.07)',
    border:  'rgba(29,158,117,0.2)',
    action:  'navigate',
    path:    '/plans',
    oneTap:  false,
  },
  {
    id:      'family',
    emoji:   '👨‍👩‍👧',
    label:   t('journey_family_tile'),
    sub:     t('journey_family_sub'),
    color:   '#7C3AED',
    bg:      'rgba(124,58,237,0.07)',
    border:  'rgba(124,58,237,0.2)',
    action:  'generate',
    context: { mealType:'dinner', cuisine:'any', family:true },
    oneTap:  true,
  },
  {
    id:      'kids',
    emoji:   '👶',
    label:   t('journey_kids_tile'),
    sub:     t('journey_kids_sub'),
    color:   '#F59E0B',
    bg:      'rgba(245,158,11,0.07)',
    border:  'rgba(245,158,11,0.2)',
    action:  'navigate',
    path:    '/little-chefs',
    oneTap:  false,
  },
  {
    id:      'sacred',
    emoji:   '✨',
    label:   t('journey_sacred_tile'),
    sub:     t('journey_sacred_sub'),
    color:   '#D97706',
    bg:      'rgba(217,119,6,0.07)',
    border:  'rgba(217,119,6,0.2)',
    action:  'navigate',
    path:    '/sacred',
    oneTap:  false,
  },
  {
    id:      'hosting',
    emoji:   '🎉',
    label:   t('journey_hosting_tile'),
    sub:     t('journey_hosting_sub'),
    color:   '#DB2777',
    bg:      'rgba(219,39,119,0.07)',
    border:  'rgba(219,39,119,0.2)',
    action:  'generate',
    context: { mealType:'any', cuisine:'any', hosting:true, servings:10 },
    oneTap:  true,
  },
  {
    id:      'leftover',
    emoji:   '♻️',
    label:   t('journey_leftover_tile'),
    sub:     t('journey_leftover_sub'),
    color:   '#059669',
    bg:      'rgba(5,150,105,0.07)',
    border:  'rgba(5,150,105,0.2)',
    action:  'input',
    prefill: 'leftover',
    oneTap:  false,
  },
  {
    id:      'weekplan',
    emoji:   '📅',
    label:   t('journey_weekplan_tile'),
    sub:     t('journey_weekplan_sub'),
    color:   '#2563EB',
    bg:      'rgba(37,99,235,0.07)',
    border:  'rgba(37,99,235,0.2)',
    action:  'navigate',
    path:    '/planner',
    oneTap:  false,
  },
];

export function JourneyTiles({
  profile, season, streak,
  onSelectFridge,      // () => void — switch to fridge input
  onGenerateDirect,    // (context) => void — fire generation directly
  onLeftoverRescue,    // () => void — switch to fridge input with leftover context
}) {
  const navigate = useNavigate();
  const { t } = useLocale();
  const [hovered, setHovered] = useState(null);

  const greet = () => {
    const h = new Date().getHours();
    const name = profile?.name?.split(' ')[0] || '';
    const base = h < 12 ? t('journey_greeting_morning')
               : h < 17 ? t('journey_greeting_afternoon')
               :           t('journey_greeting_evening');
    return name ? `${base}, ${name}` : base;
  };

  const handleTile = (tile) => {
    if (tile.action === 'navigate') {
      navigate(tile.path);
    } else if (tile.action === 'input') {
      if (tile.prefill === 'leftover') {
        onLeftoverRescue?.();
      } else {
        onSelectFridge?.();
      }
    } else if (tile.action === 'generate') {
      onGenerateDirect?.(tile.context);
    }
  };

  return (
    <div style={{
      maxWidth: 720, margin: '0 auto',
      padding: '32px 20px 48px',
      fontFamily: "'DM Sans', sans-serif",
    }}>

      {/* Greeting */}
      <div style={{ marginBottom: 28 }}>
        <h2 style={{
          fontFamily: "'Fraunces', serif",
          fontSize: 'clamp(22px, 5vw, 30px)',
          fontWeight: 900, color: '#1C0A00',
          margin: 0, lineHeight: 1.2,
        }}>
          {greet()} ⚡
        </h2>
        <p style={{
          fontSize: 14, color: '#7C6A5E',
          fontWeight: 300, margin: '6px 0 0',
          lineHeight: 1.5,
        }}>
          What do you want to cook today?
        </p>

        {/* Contextual badges */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 10 }}>
          {streak >= 2 && (
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: 4,
              background: 'rgba(255,69,0,0.08)', border: '1px solid rgba(255,69,0,0.2)',
              borderRadius: 20, padding: '3px 10px', fontSize: 11, color: '#CC3700', fontWeight: 500,
            }}>
              🔥 {streak}-day streak
            </span>
          )}
          {season?.items?.length > 0 && (
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: 4,
              background: 'rgba(29,158,117,0.07)', border: '1px solid rgba(29,158,117,0.2)',
              borderRadius: 20, padding: '3px 10px', fontSize: 11, color: '#1D9E75', fontWeight: 500,
            }}>
              {season.emoji} {season.items.slice(0, 2).join(', ')} in season
            </span>
          )}
        </div>
      </div>

      {/* 8-tile grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
        gap: 12,
        marginBottom: 28,
      }}>
        {TILES.map(tile => (
          <button
            key={tile.id}
            onClick={() => handleTile(tile)}
            onMouseEnter={() => setHovered(tile.id)}
            onMouseLeave={() => setHovered(null)}
            style={{
              background:   hovered === tile.id ? tile.bg : 'white',
              border:       `1.5px solid ${hovered === tile.id ? tile.border : 'rgba(28,10,0,0.08)'}`,
              borderRadius: 16,
              padding:      '18px 14px',
              textAlign:    'left',
              cursor:       'pointer',
              transition:   'all 0.15s',
              transform:    hovered === tile.id ? 'translateY(-2px)' : 'none',
              boxShadow:    hovered === tile.id ? '0 6px 20px rgba(28,10,0,0.08)' : '0 1px 4px rgba(28,10,0,0.04)',
              fontFamily:   "'DM Sans', sans-serif",
              position:     'relative',
            }}
          >
            <div style={{ fontSize: 28, marginBottom: 10, lineHeight: 1 }}>{tile.emoji}</div>
            <div style={{
              fontSize: 13, fontWeight: 600, color: '#1C0A00',
              lineHeight: 1.3, marginBottom: 4,
            }}>
              {tile.label}
            </div>
            <div style={{
              fontSize: 11, color: '#7C6A5E',
              fontWeight: 300, lineHeight: 1.4,
            }}>
              {tile.sub}
            </div>
            {tile.oneTap && (
              <div style={{
                position: 'absolute', top: 10, right: 10,
                fontSize: 9, fontWeight: 600, color: tile.color,
                background: tile.bg, border: `1px solid ${tile.border}`,
                borderRadius: 6, padding: '1px 5px', letterSpacing: '0.5px',
              }}>
                1-TAP
              </div>
            )}
          </button>
        ))}
      </div>

      {/* Fridge text shortcut — secondary entry point */}
      <div style={{
        padding: '14px 18px',
        background: 'rgba(28,10,0,0.02)',
        border: '1px solid rgba(28,10,0,0.08)',
        borderRadius: 14,
        display: 'flex', alignItems: 'center', gap: 10,
        cursor: 'pointer',
      }} onClick={onSelectFridge}>
        <span style={{ fontSize: 20 }}>🔍</span>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 13, color: '#7C6A5E', fontWeight: 300 }}>
            Or type what's in your fridge…
          </div>
        </div>
        <span style={{
          fontSize: 12, color: '#FF4500', fontWeight: 500,
          background: 'rgba(255,69,0,0.08)', borderRadius: 8,
          padding: '4px 10px', border: '1px solid rgba(255,69,0,0.15)',
        }}>
          Open fridge →
        </span>
      </div>

    </div>
  );
}
