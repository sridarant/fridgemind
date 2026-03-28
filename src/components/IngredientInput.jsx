// src/components/IngredientInput.jsx — Smart ingredient input with autocomplete + auto-correct

import { useState, useRef, useCallback } from 'react';
import { searchIngredients, autoCorrect } from '../lib/ingredients-db';

const C = {
  jiff: '#FF4500', ink: '#1C0A00', cream: '#FFFAF5', warm: '#FFF0E5',
  muted: '#7C6A5E', border: 'rgba(28,10,0,0.10)', borderMid: 'rgba(28,10,0,0.18)',
};

const styles = `
  .ing-input-wrap { position: relative; }
  .ing-box {
    border: 1.5px solid ${C.borderMid}; border-radius: 12px;
    padding: 10px 12px; background: ${C.cream}; min-height: 72px;
    cursor: text; display: flex; flex-wrap: wrap; gap: 6px;
    align-items: flex-start; transition: border-color 0.2s;
  }
  .ing-box:focus-within { border-color: ${C.jiff}; box-shadow: 0 0 0 3px rgba(255,69,0,0.1); }
  .ing-tag {
    background: ${C.ink}; color: white; padding: 4px 10px 4px 12px;
    border-radius: 20px; font-size: 12px; display: flex; align-items: center;
    gap: 5px; animation: tagIn 0.2s ease; white-space: nowrap;
  }
  .ing-tag.pantry { background: #5C6BC0; }
  .ing-tag.photo  { background: #2E7D32; }
  @keyframes tagIn { from { transform: scale(0.8); opacity: 0; } to { transform: scale(1); opacity: 1; } }
  .ing-tag-remove {
    background: none; border: none; color: rgba(255,255,255,0.65);
    cursor: pointer; font-size: 15px; padding: 0; line-height: 1;
  }
  .ing-text-input {
    border: none; outline: none; font-family: 'DM Sans', sans-serif;
    font-size: 13px; color: ${C.ink}; flex: 1; min-width: 140px;
    background: transparent; padding: 3px 0;
  }
  .ing-text-input::placeholder { color: ${C.muted}; }
  .autocomplete-dropdown {
    position: absolute; top: 100%; left: 0; right: 0; z-index: 100;
    background: white; border: 1.5px solid ${C.borderMid}; border-top: none;
    border-radius: 0 0 12px 12px; box-shadow: 0 8px 24px rgba(28,10,0,0.12);
    max-height: 200px; overflow-y: auto;
  }
  .ac-item {
    padding: 9px 14px; font-size: 13px; color: ${C.ink}; cursor: pointer;
    display: flex; align-items: center; gap: 8px; transition: background 0.1s;
    font-family: 'DM Sans', sans-serif;
  }
  .ac-item:hover, .ac-item.selected { background: ${C.warm}; }
  .ac-item-icon { font-size: 14px; }
  .ac-correction {
    padding: 7px 14px; font-size: 11px; color: ${C.muted};
    background: rgba(255,69,0,0.04); border-bottom: 1px solid ${C.border};
    font-style: italic;
  }
  .ing-hint { font-size: 11px; color: ${C.muted}; margin-top: 6px; font-weight: 300; }
  .voice-btn { background: none; border: 1.5px solid ${C.borderMid}; border-radius: 8px; padding: 5px 9px; cursor: pointer; font-size: 16px; color: ${C.muted}; transition: all 0.15s; line-height: 1; flex-shrink: 0; }
  .voice-btn.listening { background: rgba(255,69,0,0.1); border-color: ${C.jiff}; color: ${C.jiff}; animation: voicePulse 0.8s ease-in-out infinite; }
  @keyframes voicePulse { 0%,100%{transform:scale(1)} 50%{transform:scale(1.1)} }
`;

// Emoji for ingredient category hints
function getIngredientEmoji(ing) {
  const i = ing.toLowerCase();
  if (['onion','tomato','potato','garlic','ginger','carrot','spinach','cabbage','cauliflower','mushroom','capsicum','eggplant','cucumber','lettuce','kale','corn','beetroot'].some(v => i.includes(v))) return '🥦';
  if (['chicken','mutton','beef','pork','lamb','fish','salmon','tuna','prawn','shrimp'].some(v => i.includes(v))) return '🥩';
  if (['egg'].some(v => i.includes(v))) return '🥚';
  if (['milk','curd','yogurt','butter','ghee','cream','cheese','paneer'].some(v => i.includes(v))) return '🧀';
  if (['rice','flour','bread','pasta','noodle','oats','roti','wheat'].some(v => i.includes(v))) return '🌾';
  if (['lentil','dal','chickpea','chana','beans'].some(v => i.includes(v))) return '🫘';
  if (['oil','butter','ghee'].some(v => i.includes(v))) return '🫙';
  if (['lemon','lime','orange','banana','apple','mango'].some(v => i.includes(v))) return '🍋';
  return '🧂';
}

export default function IngredientInput({ ingredients, onChange, pantryIngredients = [], placeholder }) {
  const [inputVal,     setInputVal]     = useState('');
  const recognitionRef = useRef(null);
  const [listening,    setListening]    = useState(false);
  const hasVoice = typeof window !== 'undefined' && ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window);
  const [suggestions,  setSuggestions]  = useState([]);
  const [selectedIdx,  setSelectedIdx]  = useState(-1);
  const [correction,   setCorrection]   = useState(null);
  const inputRef  = useRef(null);
  const dropdownRef = useRef(null);

  const handleInputChange = useCallback((val) => {
    setInputVal(val);
    setSelectedIdx(-1);
    if (val.length >= 2) {
      const results = searchIngredients(val, 8);
      setSuggestions(results);
      const corrected = autoCorrect(val);
      setCorrection(corrected !== val ? corrected : null);
    } else {
      setSuggestions([]);
      setCorrection(null);
    }
  }, []);

  const addIngredient = useCallback((val) => {
    const v = autoCorrect(val.trim().replace(/,$/,'').toLowerCase());
    if (v && v.length >= 2 && !ingredients.map(i => i.toLowerCase()).includes(v)) {
      onChange([...ingredients, v]);
    }
    setInputVal('');
    setSuggestions([]);
    setCorrection(null);
    setSelectedIdx(-1);
    inputRef.current?.focus();
  }, [ingredients, onChange]);

  const removeIngredient = useCallback((ing) => {
    onChange(ingredients.filter(i => i !== ing));
  }, [ingredients, onChange]);

  const handleKeyDown = useCallback((e) => {
    if (suggestions.length > 0) {
      if (e.key === 'ArrowDown') { e.preventDefault(); setSelectedIdx(i => Math.min(i + 1, suggestions.length - 1)); return; }
      if (e.key === 'ArrowUp')   { e.preventDefault(); setSelectedIdx(i => Math.max(i - 1, -1)); return; }
      if (e.key === 'Enter' && selectedIdx >= 0) { e.preventDefault(); addIngredient(suggestions[selectedIdx]); return; }
      if (e.key === 'Tab' && selectedIdx >= 0)   { e.preventDefault(); addIngredient(suggestions[selectedIdx]); return; }
      if (e.key === 'Escape') { setSuggestions([]); setSelectedIdx(-1); return; }
    }
    if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); if (inputVal.trim()) addIngredient(inputVal); }
    if (e.key === 'Backspace' && !inputVal && ingredients.length) removeIngredient(ingredients[ingredients.length - 1]);
  }, [suggestions, selectedIdx, inputVal, ingredients, addIngredient, removeIngredient]);

  // Source label for tags
  const isPantry = (ing) => pantryIngredients.map(i => i.toLowerCase()).includes(ing.toLowerCase());


  const startVoice = () => {
    if (!hasVoice) return;
    const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
    const rec = new SpeechRec();
    rec.lang = 'en-IN';
    rec.continuous = false;
    rec.interimResults = false;
    recognitionRef.current = rec;
    rec.onstart = () => setListening(true);
    rec.onend   = () => setListening(false);
    rec.onerror = () => setListening(false);
    rec.onresult = (e) => {
      const transcript = e.results[0][0].transcript.toLowerCase();
      // Parse comma or "and" separated ingredients from speech
      const raw = transcript.replace(/and/gi, ',').split(/[,،]+/).map(s => s.trim()).filter(Boolean);
      raw.forEach(item => {
        const corrected = item.replace(/[.!?]/g, '').trim();
        if (corrected && !ingredients.includes(corrected)) {
          onChange([...new Set([...ingredients, corrected])]);
        }
      });
      setListening(false);
    };
    rec.start();
  };

  return (
    <>
      <style>{styles}</style>
      <div className="ing-input-wrap">
        <div className="ing-box" onClick={() => inputRef.current?.focus()}>
          {ingredients.map(ing => (
            <span key={ing} className={`ing-tag ${isPantry(ing) ? 'pantry' : ''}`} title={isPantry(ing) ? 'From your pantry' : ''}>
              {ing}
              <button className="ing-tag-remove" onClick={e => { e.stopPropagation(); removeIngredient(ing); }}>×</button>
            </span>
          ))}
          <input
            ref={inputRef}
            className="ing-text-input"
            value={inputVal}
            onChange={e => handleInputChange(e.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={() => { setTimeout(() => { if (inputVal.trim()) addIngredient(inputVal); setSuggestions([]); }, 150); }}
            placeholder={ingredients.length === 0 ? (placeholder || 'eggs, onions, rice… type or pick from list') : 'add more…'}
            autoComplete="off"
            spellCheck={false}
          />
          {hasVoice && (
            <button type="button" className={`voice-btn ${listening?'listening':''}`}
              onMouseDown={e=>e.preventDefault()}
              onClick={listening ? ()=>{recognitionRef.current?.stop();setListening(false);} : startVoice}
              title={listening ? 'Stop listening' : 'Speak ingredients (en-IN)'}
            >
              {listening ? '⏹' : '🎤'}
            </button>
          )}
        </div>

        {/* Autocomplete dropdown */}
        {suggestions.length > 0 && (
          <div ref={dropdownRef} className="autocomplete-dropdown">
            {correction && (
              <div className="ac-correction">
                Did you mean <strong>{correction}</strong>?
              </div>
            )}
            {suggestions.map((s, i) => (
              <div
                key={s}
                className={`ac-item ${i === selectedIdx ? 'selected' : ''}`}
                onMouseDown={e => { e.preventDefault(); addIngredient(s); }}
              >
                <span className="ac-item-icon">{getIngredientEmoji(s)}</span>
                <span>{s}</span>
                {isPantry(s) && <span style={{ marginLeft: 'auto', fontSize: 10, color: '#5C6BC0', fontWeight: 500 }}>In pantry</span>}
              </div>
            ))}
          </div>
        )}
      </div>
      <p className="ing-hint">Enter or comma to add · ↑↓ to navigate suggestions · Backspace to remove last</p>
    </>
  );
}
