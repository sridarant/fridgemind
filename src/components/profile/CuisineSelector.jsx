// src/components/profile/CuisineSelector.jsx
// Grouped cuisine multi-select for Profile → Taste tab.
import { CUISINE_GROUPS } from '../../lib/cuisine';

export default function CuisineSelector({ selected, onChange, pill }) {
  const toggle = id => onChange(
    selected.includes(id) ? selected.filter(x => x !== id) : [...selected, id]
  );

  // pill helper: if not passed use inline style fallback
  const getStyle = (active) => pill
    ? { ...pill(active), padding:'5px 12px', fontSize:12 }
    : {
        padding:'5px 12px', fontSize:12,
        border:'1.5px solid ' + (active ? '#FF4500' : 'rgba(28,10,0,0.12)'),
        borderRadius:20, background: active ? '#FF4500' : 'white',
        color: active ? 'white' : '#7C6A5E',
        cursor:'pointer', fontFamily:"'DM Sans',sans-serif",
        fontWeight: active ? 600 : 400, transition:'all 0.12s',
      };

  return (
    <div>
      {CUISINE_GROUPS.map(group => (
        <div key={group.id} style={{ marginBottom:20 }}>
          <div style={{ fontSize:10, letterSpacing:'2px', textTransform:'uppercase', color:'#FF4500', fontWeight:700, marginBottom:12, paddingBottom:6, borderBottom:'1px solid rgba(255,69,0,0.15)' }}>
            {group.label}
          </div>
          {group.sections.map(section => (
            <div key={section.id} style={{ marginBottom: section.label ? 10 : 0 }}>
              {section.label && (
                <div style={{ fontSize:11, fontWeight:600, color:'#7C6A5E', marginBottom:6, marginTop:4 }}>
                  {section.label}
                </div>
              )}
              <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
                {section.items.map(item => (
                  <button key={item.id} onClick={() => toggle(item.id)} style={getStyle(selected.includes(item.id))}>
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
