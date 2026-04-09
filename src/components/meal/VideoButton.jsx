// src/components/meal/VideoButton.jsx
// Inline recipe video — fetches via /api/videos, plays in iframe.
// States: idle | loading | found | notfound | unconfigured

import { useState } from 'react';

export function VideoButton({ recipeName, cuisine = '', lang = 'en', compact = false }) {
  const [state,     setState]    = useState('idle');
  const [videoData, setVideoData] = useState(null);

  const fetch_video = async () => {
    if (state !== 'idle') return;
    setState('loading');
    try {
      const res  = await fetch(`/api/videos?recipe=${encodeURIComponent(recipeName)}&cuisine=${encodeURIComponent(cuisine)}&lang=${lang}`);
      const data = await res.json();

      // Distinguish: API key missing vs no results
      if (data.error === 'YouTube API not configured') {
        setState('unconfigured');
        return;
      }
      if (data.videos?.length) {
        setVideoData(data.videos[0]);
        setState('found');
      } else {
        setState('notfound');
      }
    } catch {
      setState('notfound');
    }
  };

  const ytFallback = `https://www.youtube.com/results?search_query=${encodeURIComponent(recipeName + ' recipe')}`;
  const btnStyle = {
    display:'inline-flex', alignItems:'center', gap:6,
    padding: compact ? '4px 10px' : '7px 12px',
    borderRadius:8, border:'1px solid rgba(204,0,0,0.25)',
    background:'rgba(204,0,0,0.05)', color:'#CC0000',
    fontSize: compact ? 11 : 12, fontWeight:500, cursor:'pointer',
    fontFamily:"'DM Sans',sans-serif",
  };

  if (state === 'idle') return (
    <button onClick={fetch_video} style={btnStyle}>
      ▶ {compact ? 'Video' : 'Watch recipe'}
    </button>
  );

  if (state === 'loading') return (
    <span style={{fontSize:11, color:'var(--muted, #7C6A5E)', fontStyle:'italic'}}>Searching…</span>
  );

  if (state === 'found' && videoData) return (
    <div style={{borderRadius:10, overflow:'hidden', border:'1px solid rgba(204,0,0,0.2)', marginTop:8}}>
      <iframe
        src={videoData.embedUrl}
        title={videoData.title}
        width="100%" height="180"
        frameBorder="0" allowFullScreen
        style={{display:'block'}}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
      />
      <div style={{padding:'5px 10px', background:'rgba(204,0,0,0.04)', display:'flex', alignItems:'center', justifyContent:'space-between'}}>
        <span style={{fontSize:10, color:'#7C6A5E', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', maxWidth:'80%'}}>
          {videoData.title} — {videoData.channel}
        </span>
        <button onClick={()=>setState('idle')} style={{background:'none', border:'none', cursor:'pointer', fontSize:12, color:'#7C6A5E', flexShrink:0, marginLeft:4}}>✕</button>
      </div>
    </div>
  );

  // YOUTUBE_API_KEY not configured — direct YouTube search link
  if (state === 'unconfigured') return (
    <a href={ytFallback} target="_blank" rel="noopener noreferrer" style={{
      display:'inline-flex', alignItems:'center', gap:6,
      padding:'6px 12px', borderRadius:8,
      border:'1px solid rgba(204,0,0,0.2)', background:'rgba(204,0,0,0.05)',
      color:'#CC0000', fontSize:12, fontWeight:500, textDecoration:'none',
      fontFamily:"'DM Sans',sans-serif",
    }}>
      {'\ud83d\udcfa Watch recipe video'}
    </a>
  );

  // No results — YouTube search fallback
  return (
    <div style={{display:'flex', alignItems:'center', gap:8, padding:'6px 0'}}>
      <a href={ytFallback} target="_blank" rel="noopener noreferrer" style={{
        display:'inline-flex', alignItems:'center', gap:4,
        padding:'4px 10px', borderRadius:8,
        border:'1px solid rgba(204,0,0,0.2)', background:'rgba(204,0,0,0.05)',
        color:'#CC0000', fontSize:11, fontWeight:500, textDecoration:'none',
        fontFamily:"'DM Sans',sans-serif",
      }}>
        🔴 Search YouTube →
      </a>
      <button onClick={()=>setState('idle')} style={{background:'none', border:'none', cursor:'pointer', fontSize:12, color:'#7C6A5E'}}>✕</button>
    </div>
  );
}
