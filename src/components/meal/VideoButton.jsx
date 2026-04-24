// src/components/meal/VideoButton.jsx
// No-API YouTube embed using YouTube search listType.
// Builds query: "{mealName} indian recipe", embeds via iframe.
// No index=0, no playlist params — those break the search embed.
// If mealName is missing → renders nothing.
// Aspect ratio 16:9, responsive via padding-bottom trick.

import { useState } from 'react';

function getYouTubeEmbedUrl(mealName) {
  if (!mealName || !mealName.trim()) return null;
  const query = encodeURIComponent(mealName.trim() + ' indian recipe');
  return 'https://www.youtube.com/embed?listType=search&list=' + query;
}

export function VideoButton({ recipeName, compact = false }) {
  const [open, setOpen] = useState(false);

  const embedUrl = getYouTubeEmbedUrl(recipeName);
  if (!embedUrl) return null;

  if (!open) {
    return (
      <button onClick={() => setOpen(true)}
        style={{ display:'inline-flex', alignItems:'center', gap:6, padding:compact?'4px 10px':'7px 13px', borderRadius:8, border:'1px solid rgba(204,0,0,0.25)', background:'rgba(204,0,0,0.05)', color:'#CC0000', fontSize:compact?11:12, fontWeight:500, cursor:'pointer', fontFamily:"'DM Sans',sans-serif", touchAction:'manipulation' }}>
        {'▶ '}{compact ? 'Video' : 'Watch recipe'}
      </button>
    );
  }

  return (
    <div style={{ borderRadius:10, overflow:'hidden', border:'1px solid rgba(204,0,0,0.15)', marginTop:8 }}>
      {/* 16:9 responsive container */}
      <div style={{ position:'relative', width:'100%', paddingBottom:'56.25%', height:0, overflow:'hidden', background:'#000' }}>
        <iframe
          src={embedUrl}
          title={'Recipe: ' + (recipeName || '')}
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          style={{ position:'absolute', top:0, left:0, width:'100%', height:'100%', border:'none' }}
        />
      </div>
      <div style={{ padding:'6px 12px', background:'rgba(204,0,0,0.04)', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <span style={{ fontSize:10, color:'#7C6A5E', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', maxWidth:'85%' }}>{recipeName}</span>
        <button onClick={() => setOpen(false)}
          style={{ background:'none', border:'none', cursor:'pointer', fontSize:13, color:'#7C6A5E', lineHeight:1, padding:0, marginLeft:8, flexShrink:0 }}>
          {'✕'}
        </button>
      </div>
    </div>
  );
}
