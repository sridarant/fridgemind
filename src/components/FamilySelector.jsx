// src/components/FamilySelector.jsx
// "Who's eating tonight?" — multi-select family member chips shown above generate button

const C = {
  jiff:'#FF4500', ink:'#1C0A00', cream:'#FFFAF5', muted:'#7C6A5E',
  border:'rgba(28,10,0,0.10)', borderMid:'rgba(28,10,0,0.18)',
};

const DIETARY_ICONS = {
  veg:'🥦', 'non-veg':'🍗', vegan:'🌱', jain:'🙏',
  eggetarian:'🥚', halal:'☪️', pescatarian:'🐟', kosher:'✡️',
};

export default function FamilySelector({ members = [], selected = [], onToggle }) {
  if (!members || members.length === 0) return null;

  return (
    <div style={{
      background: 'rgba(255,69,0,0.03)', border:'1px solid rgba(255,69,0,0.15)',
      borderRadius:12, padding:'10px 14px', marginBottom:14,
    }}>
      <div style={{ fontSize:11, letterSpacing:'1.5px', textTransform:'uppercase',
        color:C.jiff, fontWeight:500, marginBottom:8 }}>
        👨‍👩‍👧 Who's eating tonight?
      </div>
      <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
        {/* "Everyone" chip */}
        <button
          type="button"
          onClick={() => onToggle('all')}
          style={{
            padding:'5px 12px', borderRadius:20, fontSize:12, cursor:'pointer',
            border:'1.5px solid '+(selected.includes('all') || selected.length===0 ? C.jiff : C.borderMid),
            background: selected.includes('all') || selected.length===0 ? 'rgba(255,69,0,0.08)' : 'white',
            color: selected.includes('all') || selected.length===0 ? C.jiff : C.muted,
            fontFamily:"'DM Sans',sans-serif", fontWeight:500, transition:'all 0.15s',
          }}>
          🍽️ Everyone
        </button>
        {members.map((m, i) => {
          const active = selected.includes(i) && !selected.includes('all');
          const icon = DIETARY_ICONS[m.dietary] || '👤';
          return (
            <button
              key={i}
              type="button"
              onClick={() => onToggle(i)}
              style={{
                padding:'5px 12px', borderRadius:20, fontSize:12, cursor:'pointer',
                border:'1.5px solid '+(active ? C.jiff : C.borderMid),
                background: active ? 'rgba(255,69,0,0.08)' : 'white',
                color: active ? C.jiff : C.ink,
                fontFamily:"'DM Sans',sans-serif", transition:'all 0.15s',
                display:'flex', alignItems:'center', gap:5,
              }}>
              <span>{icon}</span>
              <span>{m.name}</span>
              {m.dietary && (
                <span style={{ fontSize:9, color:active ? C.jiff : C.muted, textTransform:'capitalize' }}>
                  ({m.dietary})
                </span>
              )}
            </button>
          );
        })}
      </div>
      {selected.length > 0 && !selected.includes('all') && (
        <div style={{ fontSize:10, color:C.muted, marginTop:6, fontWeight:300 }}>
          Recipes will accommodate {selected.map(i => members[i]?.name).filter(Boolean).join(' & ')}'s preferences
        </div>
      )}
    </div>
  );
}
