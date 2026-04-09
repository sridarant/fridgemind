// src/components/profile/PantryTab.jsx
// Pantry management: add/remove items, pre-populated Indian kitchen defaults.
import { useState } from 'react';

const INDIAN_PANTRY_DEFAULTS = [
  'Oil','Ghee','Butter','Salt','Sugar','Jaggery',
  'Cumin seeds','Mustard seeds','Coriander seeds','Cardamom','Cloves',
  'Cinnamon','Bay leaves','Dried red chillies','Peppercorns','Fenugreek seeds',
  'Turmeric','Red chilli powder','Coriander powder','Cumin powder',
  'Garam masala','Amchur','Chaat masala','Asafoetida','Tamarind',
  'Rice','Atta','Maida','Sooji','Poha',
  'Toor dal','Moong dal','Chana dal','Masoor dal','Urad dal',
  'Ginger garlic paste','Tomato puree',
  'Cashews','Almonds','Raisins',
];

function PantryEditor({ pantryItems, setPantryItems, C }) {
  const [input, setInput] = useState('');
  const add = () => {
    const val = input.trim();
    if (!val || pantryItems.includes(val)) return;
    setPantryItems(prev => [...prev, val]);
    setInput('');
  };
  const remove = item => setPantryItems(p => p.filter(x => x !== item));

  return (
    <div>
      {/* Add input row */}
      <div style={{ display:'flex', gap:8, marginBottom:16 }}>
        <input value={input} onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && add()}
          placeholder="Add an item, e.g. coconut oil, saffron…"
          style={{ flex:1, padding:'9px 12px', border:'1px solid ' + C.borderMid, borderRadius:10, fontSize:13, fontFamily:"'DM Sans',sans-serif", outline:'none' }}
        />
        <button onClick={add}
          style={{ padding:'9px 16px', background:C.jiff, color:'white', border:'none', borderRadius:10, fontSize:13, cursor:'pointer', fontFamily:"'DM Sans',sans-serif", fontWeight:500 }}>
          {'+ Add'}
        </button>
      </div>

      {/* Reset to defaults */}
      <button onClick={() => setPantryItems([...INDIAN_PANTRY_DEFAULTS])}
        style={{ fontSize:11, color:'#1D9E75', background:'rgba(29,158,117,0.06)', border:'1px solid rgba(29,158,117,0.2)', borderRadius:8, padding:'5px 12px', cursor:'pointer', fontFamily:"'DM Sans',sans-serif", marginBottom:14, display:'inline-flex', alignItems:'center', gap:5 }}>
        {'🌿 Reset to Indian kitchen defaults'}
      </button>

      {/* Info note */}
      <div style={{ fontSize:11, color:C.muted, fontWeight:300, marginBottom:14, padding:'8px 12px', background:'rgba(29,158,117,0.04)', border:'1px solid rgba(29,158,117,0.12)', borderRadius:8, lineHeight:1.5 }}>
        {'These are assumed available for every recipe — Jiff won\'t ask you to buy them. Tap × to remove anything you\'re out of.'}
      </div>

      {/* Items grid */}
      {pantryItems.length === 0 ? (
        <div style={{ textAlign:'center', padding:'24px 0', color:C.muted, fontSize:13 }}>
          No pantry items — add staples above or click Reset to defaults
        </div>
      ) : (
        <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
          {pantryItems.map(item => (
            <div key={item} style={{ display:'flex', alignItems:'center', gap:3, background:'rgba(29,158,117,0.07)', border:'1px solid rgba(29,158,117,0.18)', borderRadius:20, padding:'5px 8px 5px 11px' }}>
              <span style={{ fontSize:12, color:'#1D9E75', fontWeight:500 }}>{item}</span>
              <button onClick={() => remove(item)}
                style={{ background:'none', border:'none', cursor:'pointer', color:'rgba(29,158,117,0.6)', fontSize:14, lineHeight:1, padding:'0 2px', fontFamily:'monospace' }}
                onMouseEnter={e => { e.currentTarget.style.color = '#E53E3E'; }}
                onMouseLeave={e => { e.currentTarget.style.color = 'rgba(29,158,117,0.6)'; }}>
                {'×'}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export { INDIAN_PANTRY_DEFAULTS };

export default function PantryTab({ pantryItems, setPantryItems, C }) {
  return (
    <div>
      <div style={{ fontSize:13, color:'#7C6A5E', fontWeight:300, marginBottom:16, lineHeight:1.6 }}>
        Your pantry items are assumed available in every recipe. Add staples you always have — Jiff will not ask you to buy them.
      </div>
      <PantryEditor pantryItems={pantryItems} setPantryItems={setPantryItems} C={C} />
    </div>
  );
}
