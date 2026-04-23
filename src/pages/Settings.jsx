// src/pages/Settings.jsx
// Lightweight settings screen — dietary, cuisine, cooking style, household, region, notifications.
// All changes feed directly into profile (and thus into the decision engine).
// No advanced configs, no clutter.

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth }   from '../contexts/AuthContext';
import { useLocale } from '../contexts/LocaleContext';
import { requestPermission, isNotificationsEnabled, setNotificationsEnabled } from '../lib/notificationService.js';

const C = {
  jiff:'#FF4500', jiffDark:'#CC3700', ink:'#1C0A00',
  cream:'#FFFAF5', muted:'#7C6A5E',
  border:'rgba(28,10,0,0.08)', borderMid:'rgba(28,10,0,0.15)',
};

const DIETARY_OPTIONS = [
  { id:'veg',        label:'Vegetarian',    emoji:'🥦' },
  { id:'non-veg',    label:'Non-veg',       emoji:'🍗' },
  { id:'vegan',      label:'Vegan',         emoji:'🌱' },
  { id:'eggetarian', label:'Eggetarian',    emoji:'🥚' },
  { id:'jain',       label:'Jain',          emoji:'🙏' },
  { id:'halal',      label:'Halal',         emoji:'☪️' },
];

const CUISINE_OPTIONS = [
  { id:'north_indian',   label:'North Indian' },
  { id:'south_indian',   label:'South Indian' },
  { id:'tamil_nadu',     label:'Tamil Nadu'   },
  { id:'punjabi',        label:'Punjabi'      },
  { id:'gujarati',       label:'Gujarati'     },
  { id:'maharashtrian',  label:'Maharashtrian'},
  { id:'bengali',        label:'Bengali'      },
  { id:'kerala',         label:'Kerala'       },
  { id:'hyderabadi',     label:'Hyderabadi'   },
  { id:'rajasthani',     label:'Rajasthani'   },
];

const COOKING_STYLE_OPTIONS = [
  { id:'quick',     label:'Quick',         sub:'Under 20 min',        emoji:'⚡' },
  { id:'balanced',  label:'Balanced',      sub:'20–35 min',           emoji:'⚖️' },
  { id:'enjoy',     label:'Enjoy cooking', sub:'Happy to spend time',  emoji:'👨‍🍳' },
];

const SPICE_OPTIONS = [
  { id:'mild',   label:'Mild'   },
  { id:'medium', label:'Medium' },
  { id:'spicy',  label:'Spicy'  },
];

const REGION_OPTIONS = [
  { id:'IN', label:'India 🇮🇳'      },
  { id:'GB', label:'UK 🇬🇧'         },
  { id:'US', label:'US 🇺🇸'         },
  { id:'AU', label:'Australia 🇦🇺'  },
  { id:'SG', label:'Singapore 🇸🇬'  },
  { id:'AE', label:'UAE 🇦🇪'        },
];

function Section({ title, children }) {
  return (
    <div style={{ marginBottom:24 }}>
      <div style={{ fontSize:10, letterSpacing:'2px', textTransform:'uppercase', color:C.muted, fontWeight:600, marginBottom:12 }}>
        {title}
      </div>
      {children}
    </div>
  );
}

function ChipRow({ options, selected, onToggle, multi = false }) {
  return (
    <div style={{ display:'flex', flexWrap:'wrap', gap:8 }}>
      {options.map(opt => {
        const isSelected = multi
          ? Array.isArray(selected) && selected.includes(opt.id)
          : selected === opt.id;
        return (
          <button key={opt.id} onClick={() => onToggle(opt.id)}
            style={{ display:'flex', alignItems:'center', gap:6, padding:'7px 14px', borderRadius:20, border:'1.5px solid '+(isSelected?C.jiff:C.border), background:isSelected?'rgba(255,69,0,0.07)':'white', color:isSelected?C.jiff:C.ink, fontSize:13, fontWeight:isSelected?600:400, cursor:'pointer', fontFamily:"'DM Sans',sans-serif", transition:'all 0.12s' }}>
            {opt.emoji && <span>{opt.emoji}</span>}
            <span>{opt.label}</span>
            {opt.sub && <span style={{ fontSize:10, color:isSelected?C.jiff:C.muted, fontWeight:300 }}>{'· '+opt.sub}</span>}
          </button>
        );
      })}
    </div>
  );
}

function Toggle({ value, onChange, label, sub }) {
  return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'12px 0', borderBottom:'1px solid '+C.border }}>
      <div>
        <div style={{ fontSize:13, fontWeight:500, color:C.ink }}>{label}</div>
        {sub && <div style={{ fontSize:11, color:C.muted, marginTop:2 }}>{sub}</div>}
      </div>
      <button onClick={() => onChange(!value)}
        style={{ width:44, height:24, borderRadius:12, background:value?C.jiff:'rgba(28,10,0,0.12)', border:'none', cursor:'pointer', position:'relative', transition:'background 0.2s', flexShrink:0 }}>
        <div style={{ position:'absolute', top:2, left:value?22:2, width:20, height:20, borderRadius:'50%', background:'white', transition:'left 0.2s', boxShadow:'0 1px 4px rgba(0,0,0,0.2)' }} />
      </button>
    </div>
  );
}

export default function Settings() {
  const navigate  = useNavigate();
  const { user, profile, updateProfile } = useAuth();
  const { country, setCountry } = useLocale();

  const [dietary,        setDietary]        = useState([]);
  const [cuisines,       setCuisines]       = useState([]);
  const [cookingStyle,   setCookingStyle]   = useState('balanced');
  const [hasKids,        setHasKids]        = useState(false);
  const [spice,          setSpice]          = useState('medium');
  const [region,         setRegion]         = useState(country || 'IN');
  const [notifsEnabled,  setNotifsEnabled]  = useState(isNotificationsEnabled());
  const [saving,         setSaving]         = useState(false);
  const [saved,          setSaved]          = useState(false);

  // Load from profile on mount
  useEffect(() => {
    if (!profile) return;
    if (profile.food_type) {
      const ft = Array.isArray(profile.food_type) ? profile.food_type : [profile.food_type];
      setDietary(ft);
    }
    if (profile.preferred_cuisines) setCuisines(profile.preferred_cuisines);
    if (profile.skill_level) {
      const styleMap = { beginner:'quick', intermediate:'balanced', advanced:'enjoy' };
      setCookingStyle(styleMap[profile.skill_level] || 'balanced');
    }
    if (profile.has_kids !== undefined) setHasKids(!!profile.has_kids);
    if (profile.spice_level) setSpice(profile.spice_level);
    if (profile.country) setRegion(profile.country);
  }, [profile]);

  const handleToggleDietary = (id) => {
    setDietary(prev => prev.includes(id) ? prev.filter(d => d !== id) : [...prev.filter(d => !['veg','non-veg','vegan','eggetarian','jain','halal'].includes(d)), id]);
  };

  const handleToggleCuisine = (id) => {
    setCuisines(prev => prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]);
  };

  const handleNotifToggle = async (val) => {
    setNotifsEnabled(val);
    setNotificationsEnabled(val);
    if (val) await requestPermission();
  };

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    const styleToSkill = { quick:'beginner', balanced:'intermediate', enjoy:'advanced' };
    try {
      await updateProfile({
        food_type:          dietary,
        preferred_cuisines: cuisines,
        skill_level:        styleToSkill[cookingStyle] || 'intermediate',
        has_kids:           hasKids,
        spice_level:        spice,
        country:            region,
      });
      setCountry(region);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch {}
    setSaving(false);
  };

  return (
    <div style={{ maxWidth:600, margin:'0 auto', padding:'16px 16px 100px', fontFamily:"'DM Sans',sans-serif" }}>
      {/* Header */}
      <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:24 }}>
        <button onClick={() => navigate(-1)}
          style={{ background:'none', border:'none', cursor:'pointer', fontSize:20, color:C.muted, padding:4, lineHeight:1 }}>
          {'←'}
        </button>
        <div style={{ fontFamily:"'Fraunces',serif", fontSize:22, fontWeight:900, color:C.ink }}>Settings</div>
      </div>

      <Section title="Dietary preference">
        <ChipRow options={DIETARY_OPTIONS} selected={dietary} onToggle={handleToggleDietary} multi />
      </Section>

      <Section title="Cuisine preference">
        <ChipRow options={CUISINE_OPTIONS} selected={cuisines} onToggle={handleToggleCuisine} multi />
      </Section>

      <Section title="Cooking style">
        <ChipRow options={COOKING_STYLE_OPTIONS} selected={cookingStyle} onToggle={setCookingStyle} />
      </Section>

      <Section title="Household">
        <Toggle
          value={hasKids} onChange={setHasKids}
          label="Kids in the household"
          sub="Adjusts suggestions to be kid-friendly"
        />
        <div style={{ marginTop:12 }}>
          <div style={{ fontSize:12, color:C.muted, marginBottom:8 }}>Spice level</div>
          <ChipRow options={SPICE_OPTIONS} selected={spice} onToggle={setSpice} />
        </div>
      </Section>

      <Section title="Region">
        <ChipRow options={REGION_OPTIONS} selected={region} onToggle={setRegion} />
      </Section>

      <Section title="Notifications">
        <Toggle
          value={notifsEnabled} onChange={handleNotifToggle}
          label="Enable notifications"
          sub="Meal reminders, event suggestions (max 1/day)"
        />
      </Section>

      {/* Save */}
      <button onClick={handleSave} disabled={saving}
        style={{ width:'100%', padding:'14px', borderRadius:14, background:saved?'#1D9E75':C.jiff, color:'white', border:'none', fontSize:14, fontWeight:700, cursor:saving?'wait':'pointer', fontFamily:"'DM Sans',sans-serif", transition:'background 0.2s' }}>
        {saving ? 'Saving…' : saved ? '✔ Saved' : 'Save preferences'}
      </button>

      {!user && (
        <div style={{ marginTop:12, fontSize:12, color:C.muted, textAlign:'center' }}>
          {'Sign in to save your preferences across devices'}
        </div>
      )}
    </div>
  );
}
