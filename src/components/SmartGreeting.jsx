// src/components/SmartGreeting.jsx
// Shows a personalised greeting with weather, time, location and contextual recipe suggestion

import { useState, useEffect } from 'react';
import { getUserContext } from '../lib/weather';

const C = {
  jiff: '#FF4500', ink: '#1C0A00', cream: '#FFFAF5', warm: '#FFF0E5',
  muted: '#7C6A5E', border: 'rgba(28,10,0,0.10)',
  gold: '#FFB800', goldBg: 'rgba(255,184,0,0.08)',
};

export default function SmartGreeting({ user, profile, onSuggestRecipe, onCountryDetected }) {
  const [ctx,     setCtx]     = useState(null);
  const [loading, setLoading] = useState(true);
  const [denied,  setDenied]  = useState(false);

  useEffect(() => {
    let cancelled = false;
    getUserContext()
      .then(c => {
        if (!cancelled) {
          setCtx(c);
          setLoading(false);
          // Update country in LocaleContext from real geolocation
          if (onCountryDetected && c.location?.country) {
            const countryMap = {
              'India':'IN','Singapore':'SG','United Kingdom':'GB','Australia':'AU',
              'United States':'US','Germany':'DE','France':'FR','Spain':'ES',
              'Japan':'JP','China':'CN','Canada':'CA','New Zealand':'NZ',
              'United Arab Emirates':'AE','Malaysia':'MY','Thailand':'TH',
            };
            const code = countryMap[c.location.country];
            if (code) onCountryDetected(code);
          }
        }
      })
      .catch(() => { if (!cancelled) { setDenied(true); setLoading(false); } });
    return () => { cancelled = true; };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const name = profile?.name?.split(' ')[0] || user?.email?.split('@')[0] || 'there';

  if (loading) {
    return (
      <div style={{ background: C.warm, borderRadius: 14, padding: '14px 18px', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ width: 8, height: 8, borderRadius: '50%', background: C.jiff, animation: 'pulse 1s ease-in-out infinite' }}/>
        <span style={{ fontSize: 13, color: C.muted, fontWeight: 300 }}>Getting your local weather…</span>
        <style>{'@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.3}}'}</style>
      </div>
    );
  }

  const timeInfo = ctx?.timeInfo || { greeting: 'Hello', mealType: 'any', timeStr: '' };
  const weather  = ctx?.weather;
  const location = ctx?.location;
  const suggestion = ctx?.suggestion;

  return (
    <div style={{
      background: 'white',
      border: '1px solid ' + C.border,
      borderRadius: 16,
      padding: '16px 20px',
      marginBottom: 20,
      boxShadow: '0 2px 16px rgba(28,10,0,0.06)',
      animation: 'fadeIn 0.4s ease',
    }}>
      <style>{'@keyframes fadeIn{from{opacity:0;transform:translateY(-6px)}to{opacity:1;transform:translateY(0)}}'}</style>

      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
        <div style={{ flex: 1 }}>
          {/* Greeting */}
          <div style={{ fontFamily: "'Fraunces', serif", fontSize: 'clamp(16px,3vw,20px)', fontWeight: 900, color: C.ink, marginBottom: 4, letterSpacing: '-0.3px' }}>
            {timeInfo.greeting}, {name}! 👋
          </div>

          {/* Location + time + weather */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap', marginBottom: suggestion ? 10 : 0 }}>
            {location?.display && (
              <span style={{ fontSize: 12, color: C.muted, display: 'flex', alignItems: 'center', gap: 4 }}>
                📍 {location.display}
              </span>
            )}
            {timeInfo.timeStr && (
              <span style={{ fontSize: 12, color: C.muted, display: 'flex', alignItems: 'center', gap: 4 }}>
                🕐 {timeInfo.timeStr}
              </span>
            )}
            {weather?.temp != null && (
              <span style={{ fontSize: 12, color: C.muted, display: 'flex', alignItems: 'center', gap: 4 }}>
                {weather.emoji} {weather.temp}°C · {weather.condition}
              </span>
            )}
            {denied && (
              <span style={{ fontSize: 12, color: C.muted }}>🕐 {timeInfo.timeStr}</span>
            )}
          </div>

          {/* Recipe suggestion */}
          {suggestion && (
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              background: C.goldBg, border: '1px solid rgba(255,184,0,0.25)',
              borderRadius: 10, padding: '7px 12px',
            }}>
              <span style={{ fontSize: 18 }}>{suggestion.emoji}</span>
              <div>
                <span style={{ fontSize: 12, fontWeight: 500, color: '#854F0B' }}>
                  Jiff suggests: {suggestion.dish}
                </span>
                <span style={{ fontSize: 11, color: '#A0522D', marginLeft: 6, fontWeight: 300 }}>
                  — {suggestion.reason}
                </span>
              </div>
              {onSuggestRecipe && (
                <button
                  onClick={() => onSuggestRecipe(suggestion, timeInfo.mealType)}
                  style={{
                    background: C.jiff, color: 'white', border: 'none', borderRadius: 8,
                    padding: '4px 10px', fontSize: 11, fontWeight: 500, cursor: 'pointer',
                    fontFamily: "'DM Sans', sans-serif", whiteSpace: 'nowrap',
                  }}
                >
                  Make it ⚡
                </button>
              )}
            </div>
          )}
        </div>

        {/* Weather card (desktop) */}
        {weather?.temp != null && (
          <div style={{
            textAlign: 'center', background: C.warm, borderRadius: 12,
            padding: '10px 16px', minWidth: 80, flexShrink: 0,
          }}>
            <div style={{ fontSize: 28, lineHeight: 1 }}>{weather.emoji}</div>
            <div style={{ fontFamily: "'Fraunces', serif", fontSize: 22, fontWeight: 900, color: C.ink, marginTop: 4 }}>
              {weather.temp}°
            </div>
            <div style={{ fontSize: 10, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              {weather.condition}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
