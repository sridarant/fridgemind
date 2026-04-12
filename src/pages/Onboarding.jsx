// src/pages/Onboarding.jsx
// Sprint 1 redesign — 5 screens → magic moment → /app with auto-generation.
//
// Screen 1: Who's eating?       (cooking_for + family_size + kids)
// Screen 2: What do you eat?    (diet — multi-select)
// Screen 3: Weekly staples      (Tier 2 pantry — fresh items always in fridge)
// Screen 4: Favourite cuisines  (top 12 shown, max 3 picks)
// Screen 5: Your goal           (single select, skippable)
// → Magic moment: navigate to /app with generateContext → Jiff auto-fires
//
// Guardrails:
//   - One question per screen
//   - Auto-advances on single-select screens after 320ms
//   - Never asks something we already know
//   - Skip always visible but de-emphasised
//   - Ends with recipe, not home screen

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import JiffLogo from '../components/JiffLogo';
import {
  WHO_OPTIONS, DIET_OPTIONS, STAPLE_GROUPS,
  CUISINE_PICKER_GROUPS, GOAL_OPTIONS, TIER1_DEFAULTS,
} from './onboardingData.js';

const C = {
  jiff:'#FF4500', jiffDark:'#CC3700', ink:'#1C0A00',
  cream:'#FFFAF5', muted:'#7C6A5E',
  border:'rgba(28,10,0,0.08)', borderMid:'rgba(28,10,0,0.15)',
};



const card  = (active) => ({ border:'2px solid ' + (active ? C.jiff : C.border), borderRadius:16, background:active ? 'rgba(255,69,0,0.06)' : 'white', cursor:'pointer', transition:'all 0.12s', fontFamily:"'DM Sans',sans-serif" });
const chip  = (active) => ({ padding:'11px 14px', border:'1.5px solid ' + (active ? C.jiff : C.borderMid), borderRadius:20, background:active ? 'rgba(255,69,0,0.07)' : 'white', color:active ? C.jiff : C.muted, fontSize:12, cursor:'pointer', fontFamily:"'DM Sans',sans-serif", fontWeight:active ? 600 : 400, transition:'all 0.12s' });

function getMealType() {
  const h = new Date().getHours();
  if (h >= 5  && h < 11) return 'breakfast';
  if (h >= 11 && h < 15) return 'lunch';
  if (h >= 15 && h < 18) return 'snack';
  if (h >= 18 && h < 22) return 'dinner';
  return 'any';
}

const TOTAL = 5;

export default function Onboarding() {
  const navigate = useNavigate();
  const { updateProfile, savePantry } = useAuth();

  const [screen,     setScreen]     = useState(1);
  const [saving,     setSaving]     = useState(false);
  const [cookingFor, setCookingFor] = useState('');
  const [hasKids,    setHasKids]    = useState(false);
  const [kidsAges,   setKidsAges]   = useState([]);
  const [diet,       setDiet]       = useState([]);
  const [staples,    setStaples]    = useState([]);
  const [cuisines,   setCuisines]   = useState([]);
  const [goal,       setGoal]       = useState('');

  const next = () => setScreen(s => Math.min(s + 1, TOTAL));
  const back = () => setScreen(s => Math.max(s - 1, 1));

  const selectWho = (id) => {
    setCookingFor(id);
    // Don't auto-advance for family/joint — user needs to answer kids question first
    if (id !== 'family' && id !== 'joint') setTimeout(next, 320);
  };

  const toggleDiet = (id) => setDiet(p => p.includes(id) ? p.filter(x=>x!==id) : [...p, id]);
  const toggleStaple = (id) => setStaples(p => p.includes(id) ? p.filter(x=>x!==id) : [...p, id]);
  const toggleCuisine = (id) => setCuisines(p => {
    if (p.includes(id)) return p.filter(x=>x!==id);
    if (p.length >= 3)  return p;
    return [...p, id];
  });

  const canProceed = screen === 1 ? !!cookingFor
    : screen === 2 ? diet.length > 0
    : true;

  const handleFinish = async (skip = false) => {
    setSaving(true);
    const who = WHO_OPTIONS.find(o => o.id === cookingFor);
    const servings  = who?.servings || 2;
    const isFamily  = cookingFor === 'family' || cookingFor === 'joint';
    const allStapleItems = STAPLE_GROUPS.flatMap(g => g.items);
    const stapleLabels   = allStapleItems.filter(i => staples.includes(i.id)).map(i => i.label);
    const fullPantry     = [...TIER1_DEFAULTS, ...stapleLabels];

    try {
      await updateProfile?.({
        food_type:          diet.length > 0 ? diet : ['non-veg'],
        cooking_for:        cookingFor || 'just_me',
        family_size:        servings,
        has_kids:           hasKids,
        kids_ages:          kidsAges,
        preferred_cuisines: cuisines,
        active_goal:        skip ? '' : (goal || ''),
        onboarding_done:    true,
      });
      await savePantry?.(fullPantry);
    } catch {}

    setSaving(false);
    // Mark onboarding complete in localStorage so it doesn't show again cross-session
    try { localStorage.setItem('jiff-onboarding-done', '1'); } catch {}
    try {
      if (typeof window !== 'undefined' && window._jiffGA) {
        window._jiffGA('onboarding_complete', { skipped: skip, cuisines_selected: cuisines.length, goal_set: !!goal });
      }
    } catch {}
    navigate('/app', {
      state: {
        generateContext: {
          type:         'magic_moment',
          mealType:     getMealType(),
          family:       isFamily,
          servings,
          goal:         skip ? null : (goal || null),
          dietOverride: diet[0] || 'non-veg',
        },
      },
    });
  };

  const btnLabel = saving ? 'Just a moment…' : screen < TOTAL ? 'Continue →' : 'Show me my first recipe ⚡';

  return (
    <div style={{ minHeight:'100vh', minHeight:'-webkit-fill-available', background:C.cream, display:'flex', flexDirection:'column', fontFamily:"'DM Sans',sans-serif" }}>

      {/* Header */}
      <div style={{ padding:'20px 24px 0', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <JiffLogo size="sm" />
        {screen > 1 && (
          <button onClick={back} style={{ fontSize:12, color:C.muted, background:'none', border:'none', cursor:'pointer', fontFamily:"'DM Sans',sans-serif", padding:'4px 8px' }}>
            ← Back
          </button>
        )}
      </div>

      {/* Progress bar — segmented dots */}
      <div style={{ display:'flex', gap:5, padding:'14px 24px 0', alignItems:'center' }}>
        {Array.from({ length:TOTAL }, (_, i) => (
          <div key={i} style={{ height:4, flex: i+1===screen ? 2 : 1, borderRadius:2, background: i+1<=screen ? C.jiff : C.border, transition:'all 0.3s ease' }} />
        ))}
      </div>

      {/* Screen content — scrollable */}
      <div style={{ flex:1, padding:'28px 24px 16px', maxWidth:480, width:'100%', margin:'0 auto', boxSizing:'border-box', overflowY:'auto' }}>

        {/* ── Screen 1 — Who's eating ── */}
        {screen === 1 && (
          <div>
            <div style={{ fontFamily:"'Fraunces',serif", fontSize:26, fontWeight:900, color:C.ink, marginBottom:6 }}>Who are you usually cooking for?</div>
            <div style={{ fontSize:13, color:C.muted, marginBottom:28, lineHeight:1.5 }}>Jiff uses this for portions and family-friendly suggestions.</div>
            <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
              {WHO_OPTIONS.map(opt => (
                <button key={opt.id} onClick={() => selectWho(opt.id)}
                  style={{ ...card(cookingFor===opt.id), display:'flex', alignItems:'center', gap:14, padding:'16px 18px', textAlign:'left' }}>
                  <span style={{ fontSize:26, flexShrink:0 }}>{opt.emoji}</span>
                  <div>
                    <div style={{ fontSize:15, fontWeight:600, color:C.ink }}>{opt.label}</div>
                    <div style={{ fontSize:11, color:C.muted, marginTop:2 }}>{opt.sub}</div>
                  </div>
                  {cookingFor===opt.id && <span style={{ marginLeft:'auto', color:C.jiff, fontSize:18 }}>{'✓'}</span>}
                </button>
              ))}
            </div>
            {(cookingFor==='family'||cookingFor==='joint') && (
              <div style={{ marginTop:16, padding:'16px', borderRadius:14, background:'rgba(255,184,0,0.06)', border:'1px solid rgba(255,184,0,0.2)' }}>
                <div style={{ fontSize:13, fontWeight:600, color:C.ink, marginBottom:12 }}>Do you have kids?</div>
                <div style={{ display:'flex', gap:10, marginBottom: hasKids ? 14 : 0 }}>
                  {[{v:true,label:'Yes, I do'},{v:false,label:'No'}].map(({v,label}) => (
                    <button key={String(v)} onClick={() => setHasKids(v)}
                      style={{ flex:1, padding:'10px', border:'2px solid '+(hasKids===v?C.jiff:C.border), borderRadius:10, background:hasKids===v?'rgba(255,69,0,0.06)':'white', cursor:'pointer', fontSize:12, fontFamily:"'DM Sans',sans-serif", color:C.ink, fontWeight:hasKids===v?600:400 }}>
                      {label}
                    </button>
                  ))}
                </div>
                {hasKids && (
                  <div>
                    <div style={{ fontSize:11, color:C.muted, marginBottom:8 }}>Their age group(s):</div>
                    <div style={{ display:'flex', gap:8 }}>
                      {['Under 5','5–10','10+'].map(age => (
                        <button key={age} onClick={() => setKidsAges(p => p.includes(age)?p.filter(a=>a!==age):[...p,age])}
                          style={{ flex:1, padding:'10px 4px', fontSize:11, fontFamily:"'DM Sans',sans-serif", border:'1.5px solid '+(kidsAges.includes(age)?C.jiff:C.border), borderRadius:8, background:kidsAges.includes(age)?'rgba(255,69,0,0.06)':'white', cursor:'pointer', color:C.ink }}>
                          {age}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ── Screen 2 — Diet ── */}
        {screen === 2 && (
          <div>
            <div style={{ fontFamily:"'Fraunces',serif", fontSize:26, fontWeight:900, color:C.ink, marginBottom:6 }}>What do you eat?</div>
            <div style={{ fontSize:13, color:C.muted, marginBottom:28, lineHeight:1.5 }}>Select all that apply — filters every recipe Jiff suggests.</div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
              {DIET_OPTIONS.map(d => (
                <button key={d.id} onClick={() => toggleDiet(d.id)}
                  style={{ ...card(diet.includes(d.id)), padding:'14px 12px', textAlign:'left' }}>
                  <div style={{ fontSize:24, marginBottom:8 }}>{d.emoji}</div>
                  <div style={{ fontSize:13, fontWeight:600, color:C.ink }}>{d.label}</div>
                  <div style={{ fontSize:11, color:C.muted, marginTop:2, lineHeight:1.4 }}>{d.desc}</div>
                  {diet.includes(d.id) && <div style={{ marginTop:6, color:C.jiff, fontSize:11, fontWeight:600 }}>{'✓ Selected'}</div>}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── Screen 3 — Weekly staples ── */}
        {screen === 3 && (
          <div>
            <div style={{ fontFamily:"'Fraunces',serif", fontSize:26, fontWeight:900, color:C.ink, marginBottom:6 }}>What's usually in your kitchen?</div>
            <div style={{ fontSize:13, color:C.muted, marginBottom:6, lineHeight:1.5 }}>Tap everything you buy most weeks — Jiff won't ask you to type these again.</div>
            <div style={{ fontSize:11, color:'#1D9E75', marginBottom:22, padding:'8px 12px', background:'rgba(29,158,117,0.06)', border:'1px solid rgba(29,158,117,0.15)', borderRadius:8 }}>
              {'🌿 Spices, dals, and grains are already assumed — just tap the fresh items.'}
            </div>
            {STAPLE_GROUPS.map((group, gi) => (
              <div key={gi} style={{ marginBottom:20 }}>
                <div style={{ fontSize:10, letterSpacing:'1.5px', textTransform:'uppercase', color:C.muted, fontWeight:600, marginBottom:10 }}>{group.label}</div>
                <div style={{ display:'flex', flexWrap:'wrap', gap:8 }}>
                  {group.items.map(item => (
                    <button key={item.id} onClick={() => toggleStaple(item.id)} style={chip(staples.includes(item.id))}>
                      {staples.includes(item.id) ? '✓ ' : ''}{item.label}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── Screen 4 — Cuisines ── */}
        {screen === 4 && (
          <div>
            <div style={{ fontFamily:"'Fraunces',serif", fontSize:26, fontWeight:900, color:C.ink, marginBottom:6 }}>Favourite cuisines?</div>
            <div style={{ fontSize:13, color:C.muted, marginBottom:8, lineHeight:1.5 }}>Pick up to 3 — shapes which recipes Jiff highlights for you.</div>
            {cuisines.length === 3
              ? <div style={{ fontSize:11, color:C.jiff, fontWeight:600, marginBottom:14, padding:'6px 12px', background:'rgba(255,69,0,0.06)', borderRadius:8 }}>{'✓ 3 selected — tap one to swap'}</div>
              : cuisines.length > 0
                ? <div style={{ fontSize:11, color:C.muted, marginBottom:14 }}>{3-cuisines.length} more to go (or continue)</div>
                : <div style={{ fontSize:11, color:C.muted, marginBottom:14 }}>{'Pick up to 3, or skip'}</div>
            }
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:8 }}>
              {CUISINE_PICKER_GROUPS.map(group => (
                <div key={group.label} style={{ marginBottom:16 }}>
                  <div style={{ fontSize:10, letterSpacing:'1.5px', textTransform:'uppercase', color:C.muted, fontWeight:600, marginBottom:8 }}>{group.label}</div>
                  <div style={{ display:'flex', flexWrap:'wrap', gap:7 }}>
                    {group.items.map(c => {
                      const active   = cuisines.includes(c.id);
                      const disabled = !active && cuisines.length >= 3;
                      return (
                        <button key={c.id} onClick={() => toggleCuisine(c.id)}
                          style={{ padding:'8px 14px', border:'1.5px solid '+(active?C.jiff:C.borderMid), borderRadius:20, background:active?'rgba(255,69,0,0.07)':'white', color:active?C.jiff:C.muted, fontSize:12, cursor:disabled?'not-allowed':'pointer', fontFamily:"'DM Sans',sans-serif", fontWeight:active?600:400, opacity:disabled?0.4:1, transition:'all 0.12s' }}>
                          {active ? '✓ ' : ''}{c.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Screen 5 — Goal ── */}
        {screen === 5 && (
          <div>
            <div style={{ fontFamily:"'Fraunces',serif", fontSize:26, fontWeight:900, color:C.ink, marginBottom:6 }}>What brings you to Jiff?</div>
            <div style={{ fontSize:13, color:C.muted, marginBottom:28, lineHeight:1.5 }}>Pick one — or skip. Shapes the most relevant journeys for you.</div>
            <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
              {GOAL_OPTIONS.map(g => (
                <button key={g.id} onClick={() => setGoal(p => p===g.id ? '' : g.id)}
                  style={{ ...card(goal===g.id), display:'flex', alignItems:'center', gap:14, padding:'14px 16px', textAlign:'left' }}>
                  <span style={{ fontSize:26, flexShrink:0 }}>{g.emoji}</span>
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:13, fontWeight:600, color:C.ink }}>{g.label}</div>
                    <div style={{ fontSize:11, color:C.muted, marginTop:2 }}>{g.desc}</div>
                  </div>
                  {goal===g.id && <span style={{ color:C.jiff, fontSize:16 }}>{'✓'}</span>}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div style={{ padding:'12px 24px 36px', maxWidth:480, width:'100%', margin:'0 auto', boxSizing:'border-box' }}>
        {screen >= 3 && screen < TOTAL && (
          <button onClick={next} style={{ width:'100%', padding:'10px', background:'none', border:'none', fontSize:12, color:C.muted, cursor:'pointer', fontFamily:"'DM Sans',sans-serif", marginBottom:6, textDecoration:'underline' }}>
            Skip this step
          </button>
        )}
        <button
          onClick={() => screen < TOTAL ? next() : handleFinish(false)}
          disabled={!canProceed || saving}
          style={{ width:'100%', padding:'15px', background:canProceed&&!saving?C.jiff:C.muted, color:'white', border:'none', borderRadius:14, fontSize:15, fontWeight:600, cursor:canProceed&&!saving?'pointer':'not-allowed', fontFamily:"'DM Sans',sans-serif", opacity:canProceed&&!saving?1:0.6, transition:'all 0.15s' }}>
          {btnLabel}
        </button>
        {screen === TOTAL && (
          <button onClick={() => handleFinish(true)} style={{ width:'100%', padding:'12px', background:'none', border:'none', fontSize:12, color:C.muted, cursor:'pointer', fontFamily:"'DM Sans',sans-serif", marginTop:6, textDecoration:'underline' }}>
            Skip — just take me to Jiff
          </button>
        )}
      </div>
    </div>
  );
}
