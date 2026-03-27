// src/components/FridgePhotoUpload.jsx
// "What's in your fridge?" — upload multiple photos OR type below

import { useState, useRef } from 'react';

const C = {
  jiff:'#FF4500', ink:'#1C0A00', cream:'#FFFAF5', warm:'#FFF0E5',
  muted:'#7C6A5E', border:'rgba(28,10,0,0.10)', borderMid:'rgba(28,10,0,0.18)',
  green:'#1D9E75', greenBg:'rgba(29,158,117,0.08)',
};

export default function FridgePhotoUpload({ onIngredientsDetected, existingIngredients = [] }) {
  const [state,    setState]    = useState('idle'); // idle | loading | done | error
  const [detected, setDetected] = useState([]);
  const [checked,  setChecked]  = useState({});
  const [errMsg,   setErrMsg]   = useState('');
  const [previews, setPreviews] = useState([]);
  const fileRef = useRef(null);

  const handleFiles = async (files) => {
    if (!files?.length) return;
    const validFiles = Array.from(files).filter(f => f.type.startsWith('image/') && f.size < 5*1024*1024);
    if (!validFiles.length) { setErrMsg('Please upload image files under 5MB each.'); setState('error'); return; }

    // Show previews
    const previewUrls = await Promise.all(validFiles.map(f => new Promise(res => {
      const r = new FileReader(); r.onload = e => res(e.target.result); r.readAsDataURL(f);
    })));
    setPreviews(previewUrls);
    setState('loading'); setErrMsg('');

    // Process each image and collect all detected ingredients
    const allDetected = new Set();
    await Promise.all(validFiles.map(async (file) => {
      try {
        const base64 = await new Promise(res => {
          const r = new FileReader(); r.onload = () => res(r.result.split(',')[1]); r.readAsDataURL(file);
        });
        const res = await fetch('/api/detect-ingredients', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ imageBase64: base64, mediaType: file.type }),
        });
        const data = await res.json();
        if (res.ok && data.ingredients?.length) {
          data.ingredients.forEach(i => allDetected.add(i));
        }
      } catch {}
    }));

    // Filter out already-added items
    const newOnes = [...allDetected].filter(
      i => !existingIngredients.map(e => e.toLowerCase()).includes(i.toLowerCase())
    );
    if (!newOnes.length) {
      setErrMsg('No new ingredients found. Try a clearer photo.'); setState('error'); return;
    }
    setDetected(newOnes);
    const initChecked = {};
    newOnes.forEach((_, i) => { initChecked[i] = true; }); // all selected by default
    setChecked(initChecked);
    setState('done');
  };

  const toggleCheck = (i) => setChecked(p => ({ ...p, [i]: !p[i] }));

  const addSelected = () => {
    const selected = detected.filter((_, i) => checked[i] !== false);
    onIngredientsDetected(selected);
    setState('idle'); setDetected([]); setChecked({}); setPreviews([]);
  };

  // Drag-and-drop
  const [dragging, setDragging] = useState(false);
  const onDrop = e => { e.preventDefault(); setDragging(false); handleFiles(e.dataTransfer.files); };
  const onDragOver = e => { e.preventDefault(); setDragging(true); };
  const onDragLeave = () => setDragging(false);

  if (state === 'done' && detected.length > 0) {
    return (
      <div style={{ background:'white', border:'1px solid ' + C.border, borderRadius:14, overflow:'hidden', marginBottom:10 }}>
        {/* Previews */}
        {previews.length > 0 && (
          <div style={{ display:'flex', gap:6, padding:'10px 12px 0', flexWrap:'wrap' }}>
            {previews.map((src, i) => (
              <img key={i} src={src} alt="" style={{ width:52, height:52, borderRadius:8, objectFit:'cover', border:'1px solid ' + C.border }}/>
            ))}
          </div>
        )}
        <div style={{ padding:'10px 12px 6px', borderBottom:'1px solid ' + C.border }}>
          <div style={{ fontSize:13, fontWeight:500, color:C.ink }}>
            Found {detected.length} ingredient{detected.length > 1 ? 's' : ''}
          </div>
          <div style={{ fontSize:11, color:C.muted, fontWeight:300 }}>Tap to deselect any you don't want</div>
        </div>
        <div style={{ padding:'8px 12px', display:'flex', flexWrap:'wrap', gap:6 }}>
          {detected.map((ing, i) => (
            <button key={ing} onClick={() => toggleCheck(i)} style={{
              background: checked[i] !== false ? C.ink : 'white',
              color: checked[i] !== false ? 'white' : C.muted,
              border: '1.5px solid ' + checked[i] !== false ? C.ink : C.borderMid,
              borderRadius:20, padding:'4px 11px', fontSize:12, cursor:'pointer',
              fontFamily:"'DM Sans',sans-serif", transition:'all 0.12s',
            }}>
              {ing}
            </button>
          ))}
        </div>
        <div style={{ padding:'6px 12px 12px', display:'flex', gap:8 }}>
          <button onClick={addSelected} style={{
            background:C.jiff, color:'white', border:'none', borderRadius:9,
            padding:'8px 18px', fontSize:12, fontWeight:500, cursor:'pointer',
            fontFamily:"'DM Sans',sans-serif", flex:1,
          }}>
            ⚡ Add {detected.filter((_, i) => checked[i] !== false).length} to fridge
          </button>
          <button onClick={() => { setState('idle'); setDetected([]); setPreviews([]); }} style={{
            background:'white', color:C.muted, border:'1.5px solid ' + C.borderMid,
            borderRadius:9, padding:'8px 14px', fontSize:12, cursor:'pointer',
            fontFamily:"'DM Sans',sans-serif",
          }}>
            Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ marginBottom:10 }}>
      <input ref={fileRef} type="file" accept="image/*" multiple style={{ display:'none' }}
        onChange={e => { if (e.target.files?.length) handleFiles(e.target.files); e.target.value = ''; }}
      />
      <div
        onClick={() => state !== 'loading' && fileRef.current?.click()}
        onDrop={onDrop} onDragOver={onDragOver} onDragLeave={onDragLeave}
        style={{
          border: '1.5px dashed ' + (dragging ? C.jiff : C.borderMid),
          borderRadius:12, padding:'14px 16px',
          background: dragging ? 'rgba(255,69,0,0.04)' : C.cream,
          cursor: state === 'loading' ? 'not-allowed' : 'pointer',
          textAlign:'center', transition:'all 0.15s',
        }}
      >
        {state === 'loading' ? (
          <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:8 }}>
            <span style={{ display:'inline-block', width:14, height:14, border:'2px solid rgba(255,69,0,0.3)', borderTopColor:C.jiff, borderRadius:'50%', animation:'spin 0.7s linear infinite' }}/>
            <span style={{ fontSize:13, color:C.muted, fontWeight:300 }}>
              Scanning {previews.length > 1 ? `${previews.length} photos` : 'photo'}…
            </span>
          </div>
        ) : (
          <div>
            <div style={{ fontSize:22, marginBottom:4 }}>📸</div>
            <div style={{ fontSize:13, fontWeight:500, color:C.ink, marginBottom:2 }}>
              Photograph your fridge
            </div>
            <div style={{ fontSize:11, color:C.muted, fontWeight:300 }}>
              Click to upload · drag & drop · multiple photos OK
            </div>
          </div>
        )}
      </div>
      {state === 'error' && (
        <div style={{ fontSize:11, color:'#E53E3E', marginTop:5, display:'flex', alignItems:'center', gap:6 }}>
          <span>⚠</span>{errMsg}
          <button onClick={() => setState('idle')} style={{ background:'none', border:'none', color:'#E53E3E', cursor:'pointer', fontSize:11, padding:0, marginLeft:4 }}>Dismiss</button>
        </div>
      )}
      <style>{'@keyframes spin{to{transform:rotate(360deg)}}'}</style>
    </div>
  );
}
