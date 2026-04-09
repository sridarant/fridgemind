// src/components/profile/FamilyTab.jsx
const DIET_OPTS = [
  { id:'veg',        label:'Vegetarian'  },
  { id:'non-veg',    label:'Non-veg'     },
  { id:'vegan',      label:'Vegan'       },
  { id:'eggetarian', label:'Eggetarian'  },
  { id:'jain',       label:'Jain'        },
];

export default function FamilyTab({
  familyMembers, setFamilyMembers,
  newMemberName, setNewMemberName,
  newMemberDietary, setNewMemberDietary,
  pill, C,
}) {
  const addMember = () => {
    if (!newMemberName.trim()) return;
    setFamilyMembers(p => [...p, { name: newMemberName.trim(), dietary: newMemberDietary }]);
    setNewMemberName('');
    setNewMemberDietary('veg');
  };

  return (
    <div>
      <SectionLabel C={C}>Family members</SectionLabel>
      <div style={{ display:'flex', flexDirection:'column', gap:10, marginBottom:20 }}>
        {familyMembers.map((m, i) => (
          <div key={i} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'12px 14px', background:'white', border:'1px solid ' + C.border, borderRadius:12 }}>
            <div>
              <span style={{ fontSize:13, fontWeight:600, color:C.ink }}>{m.name}</span>
              <span style={{ fontSize:11, color:C.muted, marginLeft:8 }}>{m.dietary}</span>
            </div>
            <button onClick={() => setFamilyMembers(p => p.filter((_, j) => j !== i))}
              style={{ background:'none', border:'none', color:C.muted, cursor:'pointer', fontSize:16, lineHeight:1, padding:'2px 6px' }}>
              {'✕'}
            </button>
          </div>
        ))}
        {familyMembers.length === 0 && (
          <div style={{ fontSize:13, color:C.muted, fontWeight:300, padding:'8px 0' }}>
            No members added yet — recipes will be tailored just for you.
          </div>
        )}
      </div>

      <div style={{ padding:'14px', background:'rgba(28,10,0,0.02)', border:'1px solid ' + C.border, borderRadius:14 }}>
        <div style={{ fontSize:12, fontWeight:600, color:C.ink, marginBottom:10 }}>Add member</div>
        <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
          <input value={newMemberName} onChange={e => setNewMemberName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && addMember()}
            placeholder="Name"
            style={{ flex:1, minWidth:120, padding:'9px 12px', border:'1px solid ' + C.border, borderRadius:8, fontSize:13, fontFamily:"'DM Sans',sans-serif", outline:'none' }}
          />
          <select value={newMemberDietary} onChange={e => setNewMemberDietary(e.target.value)}
            style={{ padding:'9px 12px', border:'1px solid ' + C.border, borderRadius:8, fontSize:13, fontFamily:"'DM Sans',sans-serif", outline:'none', background:'white', cursor:'pointer' }}>
            {DIET_OPTS.map(d => <option key={d.id} value={d.id}>{d.label}</option>)}
          </select>
          <button onClick={addMember}
            style={{ padding:'9px 16px', background:C.jiff, color:'white', border:'none', borderRadius:8, fontSize:13, fontWeight:500, cursor:'pointer', fontFamily:"'DM Sans',sans-serif" }}>
            Add
          </button>
        </div>
      </div>
    </div>
  );
}

function SectionLabel({ children, C }) {
  return (
    <div style={{ fontSize:10, letterSpacing:'1.5px', textTransform:'uppercase', color:C.jiff, fontWeight:700, marginBottom:10, display:'flex', alignItems:'center', gap:8 }}>
      {children}
      <div style={{ flex:1, height:1, background:C.border }} />
    </div>
  );
}
