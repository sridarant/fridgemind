// src/components/common/WeatherBanner.jsx
// Always-visible smart weather banner at top of Journey home.
// Tappable — fires generation with weather context.

import { useState, useEffect } from 'react';
import { getUserContext } from '../../lib/weather.js';
import { getWeatherSuggestion } from '../../lib/discover.js';
import { getCurrentSeason } from '../../lib/festival.js';

export default function WeatherBanner({ onTap }) {
  const [ctx, setCtx] = useState(null);

  useEffect(() => {
    getUserContext().then(setCtx).catch(() => {});
  }, []);

  const season     = getCurrentSeason();
  const weather    = ctx?.weather;
  const city       = ctx?.city || '';
  const suggestion = getWeatherSuggestion(weather, season);

  // Even without weather data, show a seasonal suggestion
  const bannerText = weather
    ? `${weather.emoji} ${weather.temp}°C${city ? ' · ' + city : ''}`
    : `${season.emoji} ${season.label}`;

  return (
    <button
      onClick={() => onTap?.({ weather, season, suggestion })}
      style={{
        width:        '100%',
        background:   'linear-gradient(135deg, rgba(255,69,0,0.07) 0%, rgba(255,184,0,0.07) 100%)',
        border:       '1px solid rgba(255,69,0,0.15)',
        borderRadius: 14,
        padding:      '12px 16px',
        textAlign:    'left',
        cursor:       'pointer',
        fontFamily:   "'DM Sans', sans-serif",
        marginBottom: 20,
        display:      'flex',
        alignItems:   'center',
        justifyContent: 'space-between',
        gap:          12,
        transition:   'all 0.15s',
      }}
      onMouseEnter={e => e.currentTarget.style.background = 'linear-gradient(135deg, rgba(255,69,0,0.11) 0%, rgba(255,184,0,0.11) 100%)'}
      onMouseLeave={e => e.currentTarget.style.background = 'linear-gradient(135deg, rgba(255,69,0,0.07) 0%, rgba(255,184,0,0.07) 100%)'}
    >
      <div>
        <div style={{ fontSize: 11, color: '#CC3700', fontWeight: 500, marginBottom: 2 }}>
          {bannerText}
        </div>
        <div style={{ fontSize: 13, color: '#1C0A00', fontWeight: 400, lineHeight: 1.4 }}>
          {suggestion.text}
        </div>
      </div>
      <span style={{
        fontSize:     11,
        color:        '#FF4500',
        fontWeight:   500,
        background:   'rgba(255,69,0,0.08)',
        borderRadius: 8,
        padding:      '4px 10px',
        border:       '1px solid rgba(255,69,0,0.15)',
        flexShrink:   0,
        whiteSpace:   'nowrap',
      }}>
        {suggestion.cta} →
      </span>
    </button>
  );
}
