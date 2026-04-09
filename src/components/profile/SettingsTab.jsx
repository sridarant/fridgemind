// src/components/profile/SettingsTab.jsx
const LANGUAGES = [
  { code:'en', label:'English'  },
  { code:'ta', label:'தமிழ்'    },
  { code:'hi', label:'हिंदी'    },
  { code:'bn', label:'বাংলা'   },
  { code:'kn', label:'ಕನ್ನಡ'   },
  { code:'mr', label:'मराठी'   },
  { code:'te', label:'తెలుగు'  },
];

const COUNTRIES = [
  { id:'IN', label:'India 🇮🇳'      },
  { id:'GB', label:'UK 🇬🇧'         },
  { id:'US', label:'US 🇺🇸'         },
  { id:'AU', label:'Australia 🇦🇺'  },
  { id:'SG', label:'Singapore 🇸🇬'  },
  { id:'AE', label:'UAE 🇦🇪'        },
];

export default function SettingsTab({
  lang, setLang,
  units, setUnits,
  profile, updateProfile,
  pill, C,
}) {
  return (
    <div>
      <SectionLabel C={C}>Language</SectionLabel>
      <div style={{ display:'flex', flexWrap:'wrap', gap:8, marginBottom:24 }}>
        {LANGUAGES.map(l => {
          const isActive = (lang || 'en') === l.code;
          return (
            <button key={l.code} onClick={() => setLang(l.code)}
              style={{ padding:'8px 16px', minHeight:40, border:'1.5px solid ' + (isActive ? C.jiff : C.borderMid), background: isActive ? C.jiff : 'white', color: isActive ? 'white' : C.muted, borderRadius:20, fontSize:13, cursor:'pointer', fontFamily:"'DM Sans',sans-serif", fontWeight: isActive ? 600 : 400, transition:'all 0.12s' }}>
              {isActive && '✓ '}{l.label}
            </button>
          );
        })}
      </div>

      <SectionLabel C={C}>Units</SectionLabel>
      <div style={{ display:'flex', gap:8, marginBottom:24 }}>
        {[
          { id:'metric',   label:'Metric (g, ml, kg)'       },
          { id:'imperial', label:'Imperial (oz, lb, fl oz)'  },
        ].map(u => (
          <button key={u.id} onClick={() => setUnits(u.id)}
            style={{ ...pill(units === u.id), flex:1, textAlign:'center', minHeight:44 }}>
            {u.label}
          </button>
        ))}
      </div>

      <SectionLabel C={C}>Country / Region</SectionLabel>
      <div style={{ display:'flex', flexWrap:'wrap', gap:8 }}>
        {COUNTRIES.map(c => (
          <button key={c.id} onClick={() => updateProfile?.({ country: c.id })}
            style={{ ...pill(profile?.country === c.id || (!profile?.country && c.id === 'IN')), minHeight:40 }}>
            {c.label}
          </button>
        ))}
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
