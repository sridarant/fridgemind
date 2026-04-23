// src/components/meal/VideoButton.jsx
// Inline recipe video — fetches via /api/videos, plays in iframe.
// States: idle | loading | found | notfound | unconfigured
//
// RULES:
// - If no video available (notfound or unconfigured): hide button entirely
// - Never redirect the user away from the app
// - Inline iframe only — no external links

import { useState } from 'react';
import { fetchRecipeVideo } from '../../services/userService';

export function VideoButton({ recipeName, cuisine = '', lang = 'en', compact = false }) {
  const [state,     setState]    = useState('idle');
  const [videoData, setVideoData] = useState(null);

  const handleFetch = async () => {
    if (state !== 'idle') return;
    setState('loading');
    try {
      const video = await fetchRecipeVideo(recipeName, cuisine, lang);
      if (!video || video.unconfigured) { setState('notfound'); return; }
      setVideoData(video);
      setState('found');
    } catch {
      setState('notfound');
    }
  };

  // Idle — show trigger button
  if (state === 'idle') return (
    <button onClick={handleFetch}
      style={{ display:'inline-flex', alignItems:'center', gap:6, padding: compact ? '4px 10px' : '7px 12px', borderRadius:8, border:'1px solid rgba(204,0,0,0.25)', background:'rgba(204,0,0,0.05)', color:'#CC0000', fontSize: compact ? 11 : 12, fontWeight:500, cursor:'pointer', fontFamily:"'DM Sans',sans-serif" }}>
      {'▶ '}{compact ? 'Video' : 'Watch recipe'}
    </button>
  );

  // Loading
  if (state === 'loading') return (
    <span style={{ fontSize:11, color:'#7C6A5E', fontStyle:'italic' }}>{'Finding video…'}</span>
  );

  // Found — inline iframe, no redirect
  if (state === 'found' && videoData) return (
    <div style={{ borderRadius:10, overflow:'hidden', border:'1px solid rgba(204,0,0,0.2)', marginTop:8 }}>
      <iframe
        src={videoData.embedUrl}
        title={videoData.title}
        width="100%" height="200"
        frameBorder="0" allowFullScreen
        style={{ display:'block' }}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
      />
      <div style={{ padding:'6px 12px', background:'rgba(204,0,0,0.04)', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <span style={{ fontSize:10, color:'#7C6A5E', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', maxWidth:'85%' }}>
          {videoData.title}{videoData.channel ? ' — ' + videoData.channel : ''}
        </span>
        <button onClick={() => setState('idle')}
          style={{ background:'none', border:'none', cursor:'pointer', fontSize:13, color:'#7C6A5E', flexShrink:0, marginLeft:6, lineHeight:1 }}>
          {'✕'}
        </button>
      </div>
    </div>
  );

  // notfound or any other state — hide entirely
  return null;
}
