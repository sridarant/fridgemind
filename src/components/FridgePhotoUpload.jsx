// src/components/FridgePhotoUpload.jsx — Photo upload → ingredient detection via Claude Vision

import { useState, useRef } from 'react';

const C = { jiff:'#FF4500', jiffDark:'#CC3700', ink:'#1C0A00', cream:'#FFFAF5', warm:'#FFF0E5', muted:'#7C6A5E', border:'rgba(28,10,0,0.10)', borderMid:'rgba(28,10,0,0.18)' };

export default function FridgePhotoUpload({ onIngredientsDetected, existingIngredients = [] }) {
  const [state,    setState]    = useState('idle'); // idle | loading | done | error
  const [detected, setDetected] = useState([]);
  const [preview,  setPreview]  = useState(null);
  const [errMsg,   setErrMsg]   = useState('');
  const fileRef = useRef(null);

  const handleFile = async (file) => {
    if (!file || !file.type.startsWith('image/')) return;
    if (file.size > 5 * 1024 * 1024) { setErrMsg('Image must be under 5MB'); setState('error'); return; }

    // Preview
    const reader = new FileReader();
    reader.onload = e => setPreview(e.target.result);
    reader.readAsDataURL(file);

    setState('loading');
    setErrMsg('');

    try {
      const base64 = await new Promise(resolve => {
        const r = new FileReader();
        r.onload = () => resolve(r.result.split(',')[1]);
        r.readAsDataURL(file);
      });

      const res = await fetch('/api/detect-ingredients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64: base64, mediaType: file.type }),
      });

      const data = await res.json();
      if (!res.ok || !data.ingredients?.length) {
        setErrMsg(data.error || 'Could not detect ingredients. Try a clearer photo.');
        setState('error');
        return;
      }

      // Filter out already-added ingredients
      const newOnes = data.ingredients.filter(
        i => !existingIngredients.map(e => e.toLowerCase()).includes(i.toLowerCase())
      );
      setDetected(newOnes);
      setState('done');
    } catch (e) {
      setErrMsg('Upload failed. Please try again.');
      setState('error');
    }
  };

  const addSelected = (selected) => {
    onIngredientsDetected(selected);
    setState('idle');
    setDetected([]);
    setPreview(null);
  };

  const [checked, setChecked] = useState({});
  const toggleCheck = (ing) => setChecked(p => ({ ...p, [ing]: !p[ing] }));

  const btnBase = { fontFamily:"'DM Sans', sans-serif", cursor:'pointer', border:'none', borderRadius:9, padding:'8px 16px', fontSize:13, fontWeight:500, transition:'all 0.15s' };

  if (state === 'done' && detected.length > 0) {
    const selectedItems = detected.filter((_,i) => checked[i] !== false); // default all selected
    return (
      <div style={{ background:'white', border:'1px solid '+C.border, borderRadius:14, overflow:'hidden', marginBottom:12 }}>
        <div style={{ display:'flex', gap:10, padding:'12px 14px', borderBottom:'1px solid '+C.border, alignItems:'center' }}>
          {preview && <img src={preview} alt="fridge" style={{ width:48, height:48, borderRadius:8, objectFit:'cover', flexShrink:0 }}/>}
          <div>
            <div style={{ fontSize:13, fontWeight:500, color:C.ink, marginBottom:2 }}>📸 Detected {detected.length} ingredients</div>
            <div style={{ fontSize:11, color:C.muted, fontWeight:300 }}>Select the ones to add</div>
          </div>
        </div>
        <div style={{ padding:'10px 14px', display:'flex', flexWrap:'wrap', gap:7 }}>
          {detected.map((ing, i) => (
            <button key={ing} onClick={() => toggleCheck(i)}
              style={{ ...btnBase, background: checked[i]===false ? 'white' : C.ink, color: checked[i]===false ? C.muted : 'white', border:'1.5px solid '+(checked[i]===false ? C.borderMid : C.ink), padding:'5px 12px', fontSize:12 }}>
              {ing}
            </button>
          ))}
        </div>
        <div style={{ padding:'8px 14px 12px', display:'flex', gap:8 }}>
          <button onClick={() => addSelected(detected.filter((_,i) => checked[i]!==false))}
            style={{ ...btnBase, background:C.jiff, color:'white', flex:1 }}>
            ⚡ Add {detected.filter((_,i) => checked[i]!==false).length} ingredients
          </button>
          <button onClick={() => { setState('idle'); setDetected([]); setPreview(null); }}
            style={{ ...btnBase, background:'white', color:C.muted, border:'1.5px solid '+C.borderMid }}>
            Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ marginBottom: 8 }}>
      <input ref={fileRef} type="file" accept="image/*" capture="environment" style={{ display:'none' }}
        onChange={e => { if (e.target.files?.[0]) handleFile(e.target.files[0]); e.target.value=''; }}
      />
      <div style={{ display:'flex', gap:8, alignItems:'center' }}>
        <button
          onClick={() => fileRef.current?.click()}
          disabled={state==='loading'}
          style={{ ...btnBase, background:C.warm, color:C.ink, border:'1.5px dashed '+C.borderMid, display:'flex', alignItems:'center', gap:6, opacity:state==='loading'?0.6:1 }}
        >
          {state === 'loading' ? (
            <><span style={{ display:'inline-block', width:12, height:12, border:'2px solid rgba(28,10,0,0.2)', borderTopColor:C.jiff, borderRadius:'50%', animation:'spin 0.7s linear infinite' }}/>Scanning fridge…</>
          ) : (
            <><span style={{ fontSize:14 }}>📸</span> Scan fridge photo</>
          )}
        </button>
        {state === 'done' && detected.length === 0 && (
          <span style={{ fontSize:12, color:C.muted }}>No ingredients found — try a clearer photo</span>
        )}
        {state === 'error' && (
          <span style={{ fontSize:12, color:'#E53E3E' }}>{errMsg}</span>
        )}
      </div>
      <style>{'@keyframes spin{to{transform:rotate(360deg)}}'}</style>
    </div>
  );
}
