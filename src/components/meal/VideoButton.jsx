// src/components/meal/VideoButton.jsx
// YouTube video: shows a thumbnail-style placeholder that links to YouTube search.
// The iframe listType=search API was deprecated by YouTube and shows "Video unavailable".
// Working approach: display a preview card → tap opens YouTube search in new tab.
// No API key required. Works for any meal name.

import { useState } from 'react';

function getYouTubeSearchUrl(mealName) {
  if (!mealName || !mealName.trim()) return null;
  return 'https://www.youtube.com/results?search_query=' +
    encodeURIComponent(mealName.trim() + ' recipe indian');
}

// Thumbnail via YouTube's image CDN — works without an API key
// We use a known-good food video as a visual placeholder background
function getPreviewStyle() {
  return {
    position: 'relative',
    width: '100%',
    paddingBottom: '52%',
    borderRadius: 10,
    overflow: 'hidden',
    background: 'linear-gradient(135deg, #1a1a1a 0%, #2d1a0e 100%)',
    cursor: 'pointer',
    border: '1px solid rgba(204,0,0,0.2)',
    marginTop: 8,
  };
}

export function VideoButton({ recipeName, compact = false }) {
  const [clicked, setClicked] = useState(false);

  const searchUrl = getYouTubeSearchUrl(recipeName);
  if (!searchUrl) return null;

  const handleWatch = () => {
    setClicked(true);
    window.open(searchUrl, '_blank', 'noopener,noreferrer');
    setTimeout(() => setClicked(false), 2000);
  };

  if (!compact) {
    return (
      <div>
        <div style={getPreviewStyle()} onClick={handleWatch}>
          {/* Gradient overlay */}
          <div style={{
            position: 'absolute', inset: 0,
            background: 'linear-gradient(180deg, rgba(0,0,0,0.2) 0%, rgba(0,0,0,0.65) 100%)',
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center', gap: 10,
          }}>
            {/* Play button */}
            <div style={{
              width: 52, height: 52, borderRadius: '50%',
              background: 'rgba(220,0,0,0.9)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 4px 16px rgba(0,0,0,0.4)',
              transition: 'transform 0.15s',
              transform: clicked ? 'scale(0.92)' : 'scale(1)',
            }}>
              <svg viewBox="0 0 24 24" fill="white" style={{ width: 22, height: 22, marginLeft: 3 }}>
                <polygon points="5 3 19 12 5 21 5 3" />
              </svg>
            </div>
            <div style={{
              fontSize: 12, color: 'white', fontWeight: 500,
              fontFamily: "'DM Sans',sans-serif",
              background: 'rgba(0,0,0,0.5)', padding: '4px 14px',
              borderRadius: 20, backdropFilter: 'blur(4px)',
            }}>
              {clicked ? 'Opening YouTube…' : 'Watch ' + (recipeName || 'recipe') + ' video'}
            </div>
          </div>
        </div>
        <div style={{ fontSize: 10, color: '#B0A09A', marginTop: 4, textAlign: 'right', fontFamily: "'DM Sans',sans-serif" }}>
          {'Opens YouTube search ↗'}
        </div>
      </div>
    );
  }

  // Compact variant
  return (
    <button onClick={handleWatch}
      style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 10px', borderRadius: 8, border: '1px solid rgba(204,0,0,0.25)', background: 'rgba(204,0,0,0.05)', color: '#CC0000', fontSize: 11, fontWeight: 500, cursor: 'pointer', fontFamily: "'DM Sans',sans-serif", touchAction: 'manipulation' }}>
      {'▶ Video'}
    </button>
  );
}
