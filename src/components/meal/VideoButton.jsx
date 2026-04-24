// src/components/meal/VideoButton.jsx
// No-API YouTube embed using search listType.
// Builds query: "{mealName} recipe indian", embeds as iframe.
// Hides if mealName is missing. No external redirects.

import { useState } from 'react';

function getYouTubeEmbedUrl(mealName) {
  if (!mealName) return null;
  const query = encodeURIComponent(mealName.trim() + ' recipe indian');
  return 'https://www.youtube.com/embed?listType=search&list=' + query + '&index=0';
}

export function VideoButton({ recipeName, compact = false }) {
  const [open, setOpen] = useState(false);

  const embedUrl = getYouTubeEmbedUrl(recipeName);
  if (!embedUrl) return null;

  if (!open) {
    return (
      <button onClick={() => setOpen(true)}
        style={{ display:'inline-flex', alignItems:'center', gap:6, padding:compact?'4px 10px':'7px 12px', borderRadius:8, border:'1px solid rgba(204,0,0,0.25)', background:'rgba(204,0,0,0.05)', color:'#CC0000', fontSize:compact?11:12, fontWeight:500, cursor:'pointer', fontFamily:"'DM Sans',sans-serif" }}>
        {'▶ '}{compact ? 'Video' : 'Watch recipe'}
      </button>
    );
  }

  return (
    <div style={{ borderRadius:10, overflow:'hidden', border:'1px solid rgba(204,0,0,0.15)', marginTop:8 }}>
      <div style={{ position:'relative', paddingBottom:'56.25%', height:0, overflow:'hidden' }}>
        <iframe
          src={embedUrl}
          title={'Recipe video for ' + (recipeName || 'this dish')}
          width="100%" height="100%"
          style={{ position:'absolute', top:0, left:0, width:'100%', height:'100%', border:'none' }}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>
      <div style={{ padding:'6px 12px', background:'rgba(204,0,0,0.04)', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <span style={{ fontSize:10, color:'#7C6A5E' }}>{recipeName}</span>
        <button onClick={() => setOpen(false)}
          style={{ background:'none', border:'none', cursor:'pointer', fontSize:13, color:'#7C6A5E', lineHeight:1, padding:0, marginLeft:8 }}>
          {'✕'}
        </button>
      </div>
    </div>
  );
}
