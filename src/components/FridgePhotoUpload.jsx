// src/components/FridgePhotoUpload.jsx
// Camera + file upload for ingredient detection
// Camera button: opens native camera on mobile, shows tooltip on desktop

import { useState, useRef, useEffect } from 'react';
import { detectIngredientsFromPhoto } from '../services/recipeService';

const C = {
  jiff:'#FF4500', ink:'#1C0A00', cream:'#FFFAF5', warm:'#FFF0E5',
  muted:'#7C6A5E', border:'rgba(28,10,0,0.10)', borderMid:'rgba(28,10,0,0.18)',
  green:'#1D9E75', greenBg:'rgba(29,158,117,0.08)',
};

// Detect mobile once — camera capture only works on mobile browsers
function isMobileDevice() {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  ) || (navigator.maxTouchPoints > 1 && /Macintosh/.test(navigator.userAgent));
}

export default function FridgePhotoUpload({ onIngredients, existingIngredients = [] }) {
  const fileRef   = useRef(null);
  const cameraRef = useRef(null);
  const [state,    setState]    = useState('idle');   // idle | loading | done | error
  const [previews, setPreviews] = useState([]);
  const [dragging, setDragging] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    setIsMobile(isMobileDevice());
  }, []);

  const handleFiles = async (files) => {
    const imageFiles = Array.from(files).filter(f => f.type.startsWith('image/'));
    if (!imageFiles.length) return;

    // Show previews immediately
    const urls = imageFiles.map(f => URL.createObjectURL(f));
    setPreviews(urls);
    setState('loading');

    try {
      // Convert to base64
      const base64Images = await Promise.all(imageFiles.map(f => new Promise((res, rej) => {
        const r = new FileReader();
        r.onload  = () => res(r.result.split(',')[1]);
        r.onerror = rej;
        r.readAsDataURL(f);
      })));

      const detected = await detectIngredientsFromPhoto(base64Images[0], existingIngredients || []);
      if (detected.length) {
        onIngredients(detected);
        setState('done');
      } else {
        setState('error');
      }
    } catch {
      setState('error');
    }
  };

  const onDrop = (e) => {
    e.preventDefault(); setDragging(false);
    if (e.dataTransfer.files?.length) handleFiles(e.dataTransfer.files);
  };
  const onDragOver  = (e) => { e.preventDefault(); setDragging(true); };
  const onDragLeave = ()  => setDragging(false);

  const handleCameraClick = (e) => {
    e.stopPropagation();
    cameraRef.current?.click();
  };

  if (state === 'done') {
    return (
      <div style={{ padding:'12px 14px', background:C.greenBg, border:'1px solid rgba(29,158,117,0.25)', borderRadius:12, display:'flex', alignItems:'center', gap:10 }}>
        <span style={{ fontSize:18 }}>✅</span>
        <span style={{ fontSize:13, color:C.green, fontWeight:400 }}>Ingredients detected from photo</span>
        <button onClick={() => { setState('idle'); setPreviews([]); }}
          style={{ marginLeft:'auto', background:'none', border:'none', color:C.muted, fontSize:12, cursor:'pointer', fontFamily:"'DM Sans',sans-serif" }}>
          ✕ Clear
        </button>
      </div>
    );
  }

  return (
    <div style={{ marginBottom:10, position:'relative' }}>
      {/* Hidden file inputs */}
      <input ref={fileRef} type="file" accept="image/*" multiple style={{ display:'none' }}
        onChange={e => { if (e.target.files?.length) handleFiles(e.target.files); e.target.value=''; }}
      />
      {/* Camera input — capture="environment" triggers native camera on mobile */}
      <input ref={cameraRef} type="file" accept="image/*" capture="environment" style={{ display:'none' }}
        onChange={e => { if (e.target.files?.length) handleFiles(e.target.files); e.target.value=''; }}
      />



      <div
        onDrop={onDrop} onDragOver={onDragOver} onDragLeave={onDragLeave}
        style={{
          border: '1.5px dashed ' + (dragging ? C.jiff : C.borderMid),
          borderRadius:12, padding:'14px 16px',
          background: dragging ? 'rgba(255,69,0,0.04)' : C.cream,
          textAlign:'center', transition:'all 0.15s',
        }}
      >
        {state === 'loading' ? (
          <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:8 }}>
            <span style={{ display:'inline-block', width:14, height:14, border:'2px solid rgba(255,69,0,0.3)', borderTopColor:C.jiff, borderRadius:'50%', animation:'spin 0.7s linear infinite' }}/>
            <span style={{ fontSize:13, color:C.muted, fontWeight:300 }}>
              Scanning {previews.length > 1 ? previews.length + ' photos' : 'photo'}…
            </span>
            <style>{'@keyframes spin{to{transform:rotate(360deg)}}'}</style>
          </div>
        ) : (
          <div>
            <div style={{ fontSize:22, marginBottom:8 }}>📸</div>
            <div style={{ display:'flex', gap:10, marginBottom:8, justifyContent:'center' }}>
              {/* Camera button — full camera on mobile, tooltip on desktop */}
              {/* Camera button — mobile only, fully hidden on desktop */}
              {isMobile && (
                <button type="button" onClick={handleCameraClick}
                  style={{ display:'flex', alignItems:'center', gap:5, padding:'7px 16px', borderRadius:10, border:'1.5px solid '+C.jiff, background:'white', fontSize:12, fontWeight:500, cursor:'pointer', fontFamily:"'DM Sans',sans-serif", color:C.jiff }}>
                  📷 Take photo
                </button>
              )}
              {/* File picker — always works */}
              <button type="button" onClick={e => { e.stopPropagation(); fileRef.current?.click(); }}
                style={{ display:'flex', alignItems:'center', gap:5, padding:'7px 16px', borderRadius:10, border:'1.5px solid '+C.jiff, background:'white', fontSize:12, fontWeight:500, cursor:'pointer', fontFamily:"'DM Sans',sans-serif", color:C.jiff }}>
                🖼️ Add photo
              </button>
            </div>
            <div style={{ fontSize:11, color:C.muted, fontWeight:300 }}>
              or drag &amp; drop anywhere above
            </div>
          </div>
        )}
        {state === 'error' && (
          <div style={{ marginTop:8, fontSize:12, color:'#E53E3E', fontWeight:300 }}>
            Could not detect ingredients — try a clearer photo or type them below.
          </div>
        )}
      </div>
    </div>
  );
}
