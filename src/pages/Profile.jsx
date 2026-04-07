// src/pages/Profile.jsx — v22.4 full rewrite
// 4 tabs: My Taste · Family · Goals · Settings
// Stats banner: streak · cooked count · avg rating
// Cuisine pool: full grouped taxonomy from cuisine.js

import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation }     from 'react-router-dom';
import { useAuth }                      from '../contexts/AuthContext';
import { useLocale }                    from '../contexts/LocaleContext';
import { parseFoodTypeIds }             from '../lib/dietary';
import { PANTRY_STAPLES }              from '../lib/ingredients-db';
import {
  CUISINE_GROUPS, ALL_CUISINES, getCuisineLabel, GOAL_CONTEXTS,
} from '../lib/cuisine.js';

const C = {
  jiff:'#FF4500', ink:'#1C0A00', cream:'#FFFAF5', muted:'#7C6A5E',
  border:'rgba(28,10,0,0.08)', borderMid:'rgba(28,10,0,0.15)',
  green:'#1D9E75', gold:'#D97706', red:'#E53E3E',
};

// ── Reusable style helpers ────────────────────────────────────────
const pill = (active) => ({
  border:'1.5px solid ' + (active ? C.jiff : C.borderMid),
  background: active ? 'rgba(255,69,0,0.08)' : 'white',
  color: active ? C.jiff : C.muted,
  borderRadius:20, padding:'7px 14px', fontSize:13,
  cursor:'pointer', fontFamily:"'DM Sans', sans-serif",
  fontWeight: active ? 600 : 400, transition:'all 0.12s',
});

const SectionLabel = ({ children }) => (
  <div style={{
    fontSize:10, letterSpacing:'1.5px', textTransform:'uppercase',
    color:C.muted, fontWeight:600, marginBottom:8, marginTop:4,
  }}>{children}</div>
);

// ── Diet options ──────────────────────────────────────────────────
const DIET_OPTS = [
  { id:'non-veg',    emoji:'🍗', label:'Non-veg'    },
  { id:'veg',        emoji:'🥦', label:'Vegetarian' },
  { id:'vegan',      emoji:'🌱', label:'Vegan'      },
  { id:'eggetarian', emoji:'🥚', label:'Eggetarian' },
  { id:'jain',       emoji:'🙏', label:'Jain'       },
  { id:'halal',      emoji:'☪️', label:'Halal'      },
];
const SPICE = [
  { id:'mild',       label:'Mild',       emoji:'😌' },
  { id:'medium',     label:'Medium',     emoji:'😊' },
  { id:'hot',        label:'Hot',        emoji:'🌶️' },
  { id:'extra-hot',  label:'Extra hot',  emoji:'🔥' },
];
const SKILL = [
  { id:'beginner',     label:'Beginner',     emoji:'👶' },
  { id:'home_cook',    label:'Home cook',    emoji:'🍳' },
  { id:'confident',    label:'Confident',    emoji:'👨‍🍳' },
];

// ── Stats banner ──────────────────────────────────────────────────
function PantryEditor({ pantryItems, setPantryItems, C }) {
  const [input, setInput] = React.useState('');
  const add = () => {
    const val = input.trim();
    if (!val || pantryItems.includes(val)) return;
    setPantryItems(prev => [...prev, val]);
    setInput('');
  };
  return (
    <div>
      <div style={{ display:'flex', gap:8, marginBottom:12 }}>
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && add()}
          placeholder="e.g. oil, salt, cumin, garlic…"
          style={{
            flex:1, padding:'9px 12px',
            border:'1px solid ' + C.borderMid, borderRadius:10,
            fontSize:13, fontFamily:"'DM Sans',sans-serif", outline:'none',
          }}
        />
        <button onClick={add}
          style={{
            padding:'9px 16px', background:C.jiff, color:'white',
            border:'none', borderRadius:10, fontSize:13, cursor:'pointer',
            fontFamily:"'DM Sans',sans-serif", fontWeight:500,
          }}>
          + Add
        </button>
      </div>
      {pantryItems.length === 0 ? (
        <div style={{ textAlign:'center', padding:'24px 0', color:C.muted, fontSize:13 }}>
          No pantry items yet — add your staples above
        </div>
      ) : (
        <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
          {pantryItems.map(item => (
            <div key={item} style={{
              display:'flex', alignItems:'center', gap:4,
              background:'rgba(29,158,117,0.07)',
              border:'1px solid rgba(29,158,117,0.2)',
              borderRadius:20, padding:'5px 10px 5px 12px',
            }}>
              <span style={{ fontSize:12, color:'#1D9E75', fontWeight:500 }}>{item}</span>
              <button onClick={() => setPantryItems(p => p.filter(x => x !== item))}
                style={{
                  background:'none', border:'none', cursor:'pointer',
                  color:'#1D9E75', fontSize:14, lineHeight:1, padding:'0 2px',
                }}>
                ×
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function StatsBanner({ streak, cookedCount, avgRating }) {
  const stats = [
    { emoji:'🔥', value: streak || 0,      label:'day streak' },
    { emoji:'🍳', value: cookedCount || 0,  label:'recipes'   },
    { emoji:'⭐', value: avgRating ? avgRating.toFixed(1) : '—', label:'avg rating' },
  ];
  return (
    <div style={{
      display:'grid', gridTemplateColumns:'repeat(3,1fr)',
      gap:1, background:C.border,
      borderRadius:14, overflow:'hidden', marginBottom:24,
    }}>
      {stats.map(s => (
        <div key={s.label} style={{
          background:'white', padding:'14px 8px',
          textAlign:'center',
        }}>
          <div style={{ fontSize:18, marginBottom:2 }}>{s.emoji}</div>
          <div style={{
            fontFamily:"'Fraunces',serif", fontSize:20,
            fontWeight:700, color:C.ink,
          }}>{s.value}</div>
          <div style={{ fontSize:10, color:C.muted, fontWeight:300 }}>{s.label}</div>
        </div>
      ))}
    </div>
  );
}

// ── Cuisine pool selector — grouped taxonomy ──────────────────────
function CuisineSelector({ selected, onChange }) {
  const toggle = (id) => {
    onChange(
      selected.includes(id)
        ? selected.filter(x => x !== id)
        : [...selected, id]
    );
  };

  return (
    <div>
      {CUISINE_GROUPS.map(group => (
        <div key={group.id} style={{ marginBottom:20 }}>
          <div style={{
            fontSize:10, letterSpacing:'2px', textTransform:'uppercase',
            color:C.jiff, fontWeight:700, marginBottom:12,
            paddingBottom:6, borderBottom:`1px solid rgba(255,69,0,0.15)`,
          }}>
            {group.label}
          </div>
          {group.sections.map(section => (
            <div key={section.id} style={{ marginBottom:section.label ? 10 : 0 }}>
              {section.label && (
                <div style={{
                  fontSize:11, fontWeight:600, color:C.muted,
                  marginBottom:6, marginTop:4,
                }}>
                  {section.label}
                </div>
              )}
              <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
                {section.items.map(item => (
                  <button key={item.id}
                    onClick={() => toggle(item.id)}
                    style={{
                      ...pill(selected.includes(item.id)),
                      padding:'5px 12px', fontSize:12,
                    }}>
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

// ── 7-day cooked strip ────────────────────────────────────────────
function WeekStrip({ mealHistory }) {
  const days = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
  const today = new Date();
  const weekData = days.map((label, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() - (today.getDay() === 0 ? 6 : today.getDay() - 1) + i);
    const dateStr = d.toDateString();
    const cooked = Array.isArray(mealHistory) && mealHistory.some(h => {
      const hd = h.rating && new Date(h.generated_at || h.created_at || '');
      return hd && hd.toDateString() === dateStr;
    });
    return { label, cooked, isToday: d.toDateString() === today.toDateString() };
  });

  return (
    <div style={{
      display:'grid', gridTemplateColumns:'repeat(7,1fr)',
      gap:4, marginBottom:16,
    }}>
      {weekData.map((d, i) => (
        <div key={i} style={{
          display:'flex', flexDirection:'column', alignItems:'center', gap:3,
          padding:'8px 4px',
          background: d.isToday ? 'rgba(255,69,0,0.06)' : 'rgba(28,10,0,0.02)',
          borderRadius:10,
          border:'1px solid ' + (d.isToday ? 'rgba(255,69,0,0.2)' : C.border),
        }}>
          <span style={{ fontSize:9, color:C.muted, fontWeight:500 }}>{d.label}</span>
          <span style={{ fontSize:14 }}>{d.cooked ? '✓' : '–'}</span>
        </div>
      ))}
    </div>
  );
}

// ── Main Profile component ────────────────────────────────────────
export default function Profile() {
  const navigate  = useNavigate();
  const {
    user, profile, pantry, updateProfile, savePantry, signOut, supabaseEnabled,
  } = useAuth();
  const { lang, setLang, units, setUnits, supportedLanguages } = useLocale();

  const location  = useLocation();
  const initTab   = location?.state?.tab || 'taste';
  const [activeTab, setActiveTab] = useState(initTab);
  const [saving,    setSaving]    = useState(false);
  const [saved,     setSaved]     = useState(false);

  // My Taste state
  const [foodType,     setFoodType]     = useState(['veg']);
  const [spiceLevel,   setSpiceLevel]   = useState('medium');
  const [skillLevel,   setSkillLevel]   = useState('home_cook');
  const [allergies,    setAllergies]    = useState([]);
  const [allergyInput, setAllergyInput] = useState('');
  const [prefCuisines, setPrefCuisines] = useState([]);
  const allergyRef = useRef(null);

  // Family state
  const [familyMembers,    setFamilyMembers]    = useState([]);
  const [newMemberName,    setNewMemberName]     = useState('');
  const [newMemberDietary, setNewMemberDietary]  = useState('veg');

  // Goals state
  const [activeGoal,    setActiveGoal]    = useState('');
  const [calorieTarget, setCalorieTarget] = useState('');
  const [mealHistory,   setMealHistory]   = useState([]);

  // Pantry state
  const [pantryItems, setPantryItems] = useState([]);

  // Stats
  const streak     = profile?.streak || 0;
  const cookedCount = Array.isArray(mealHistory) ? mealHistory.filter(h => h.rating).length : 0;
  const avgRating   = cookedCount > 0
    ? mealHistory.filter(h => h.rating).reduce((s, h) => s + (h.rating||0), 0) / cookedCount
    : 0;

  // Load profile data
  useEffect(() => {
    if (!profile) return;
    const ids = parseFoodTypeIds(profile.food_type);
    if (ids.length) setFoodType(ids);
    if (profile.spice_level)            setSpiceLevel(profile.spice_level);
    if (profile.skill_level)            setSkillLevel(profile.skill_level);
    if (profile.allergies?.length)      setAllergies(profile.allergies);
    if (profile.preferred_cuisines?.length) setPrefCuisines(profile.preferred_cuisines);
    if (profile.family_members)         setFamilyMembers(Array.isArray(profile.family_members) ? profile.family_members : []);
    if (profile.active_goal)            setActiveGoal(profile.active_goal);
    if (profile.calorie_target)         setCalorieTarget(String(profile.calorie_target));
  }, [profile]);

  // Load pantry
  useEffect(() => {
    if (Array.isArray(pantry) && pantry.length > 0) setPantryItems(pantry);
  }, [pantry]);

  // Load meal history for goals tab
  useEffect(() => {
    if (!user) return;
    fetch(`/api/admin?action=meal-history&userId=${user.id}`)
      .then(r => r.json())
      .then(d => { if (Array.isArray(d.history)) setMealHistory(d.history); })
      .catch(() => {});
  }, [user]);

  const handleSave = async () => {
    setSaving(true);
    await updateProfile({
      food_type:          [...new Set(foodType)],
      spice_level:        spiceLevel,
      skill_level:        skillLevel,
      allergies,
      preferred_cuisines: prefCuisines,
      family_members:     familyMembers,
      active_goal:        activeGoal,
      calorie_target:     calorieTarget ? parseInt(calorieTarget, 10) : null,
    });
    await savePantry(pantryItems);
    setSaving(false); setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const TABS = [
    { id:'taste',    label:'My Taste'  },
    { id:'family',   label:'Family'    },
    { id:'goals',    label:'Goals'     },
    { id:'pantry',   label:'Pantry'    },
  ];
  const isSettingsView = activeTab === 'settings';

  return (
    <div style={{
      minHeight:'100vh', background:C.cream,
      fontFamily:"'DM Sans',sans-serif", color:C.ink,
      paddingBottom:80,
    }}>
      {/* Header */}
      <header style={{
        display:'flex', alignItems:'center', justifyContent:'space-between',
        padding:'14px 20px', borderBottom:`1px solid ${C.border}`,
        position:'sticky', top:0, zIndex:10,
        background:'rgba(255,250,245,0.96)', backdropFilter:'blur(10px)',
      }}>
        <button onClick={() => navigate('/app')}
          style={{
            fontSize:13, color:C.muted, background:'none',
            border:'1px solid ' + (C.border), borderRadius:8,
            padding:'6px 12px', cursor:'pointer',
            fontFamily:"'DM Sans',sans-serif",
          }}>
          ← Home
        </button>
        <span style={{
          fontFamily:"'Fraunces',serif", fontSize:17,
          fontWeight:700, color:C.ink,
        }}>Profile</span>
        <button onClick={handleSave} disabled={saving}
          style={{
            fontSize:13, color:'white', background:saving ? C.muted : C.jiff,
            border:'none', borderRadius:8, padding:'7px 16px',
            cursor: saving ? 'default' : 'pointer',
            fontFamily:"'DM Sans',sans-serif", fontWeight:500,
            transition:'all 0.15s',
          }}>
          {saving ? 'Saving…' : saved ? '✓ Saved' : 'Save'}
        </button>
      </header>

      <div style={{ padding:'20px 20px 0', maxWidth:680, margin:'0 auto' }}>
        {/* Stats banner */}
        {user && <StatsBanner streak={streak} cookedCount={cookedCount} avgRating={avgRating} />}

        {/* Tab bar — horizontal scroll on mobile */}
        {/* Settings view: no tab bar, back button instead */}
        {isSettingsView ? (
          <button onClick={() => setActiveTab('taste')}
            style={{ display:'flex', alignItems:'center', gap:6, marginBottom:20, background:'none',
              border:'none', cursor:'pointer', fontSize:13, color:C.muted,
              fontFamily:"'DM Sans',sans-serif", padding:0 }}>
            ← Back to Profile
          </button>
        ) : (
          <div style={{
            display:'flex', gap:8, marginBottom:24,
            overflowX:'auto', paddingBottom:4,
            scrollbarWidth:'none', msOverflowStyle:'none',
          }}>
            {TABS.map(tab => (
              <button key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  ...pill(activeTab === tab.id),
                  whiteSpace:'nowrap', flexShrink:0,
                  padding:'8px 16px', minHeight:36,
                }}>
                {tab.label}
              </button>
            ))}
          </div>
        )}

        {/* ── MY TASTE TAB ── */}
        {activeTab === 'taste' && (
          <div>
            <SectionLabel>Diet type</SectionLabel>
            <div style={{ display:'flex', flexWrap:'wrap', gap:8, marginBottom:24 }}>
              {DIET_OPTS.map(opt => (
                <button key={opt.id}
                  onClick={() => setFoodType([opt.id])}
                  style={{ ...pill(foodType.includes(opt.id)), display:'flex', alignItems:'center', gap:5 }}>
                  <span>{opt.emoji}</span> {opt.label}
                </button>
              ))}
            </div>

            <SectionLabel>Spice level</SectionLabel>
            <div style={{ display:'flex', flexWrap:'wrap', gap:8, marginBottom:24 }}>
              {SPICE.map(s => (
                <button key={s.id}
                  onClick={() => setSpiceLevel(s.id)}
                  style={{ ...pill(spiceLevel === s.id), display:'flex', alignItems:'center', gap:5 }}>
                  <span>{s.emoji}</span> {s.label}
                </button>
              ))}
            </div>

            <SectionLabel>Cooking skill</SectionLabel>
            <div style={{ display:'flex', flexWrap:'wrap', gap:8, marginBottom:24 }}>
              {SKILL.map(s => (
                <button key={s.id}
                  onClick={() => setSkillLevel(s.id)}
                  style={{ ...pill(skillLevel === s.id), display:'flex', alignItems:'center', gap:5 }}>
                  <span>{s.emoji}</span> {s.label}
                </button>
              ))}
            </div>

            <SectionLabel>Allergies / foods to avoid</SectionLabel>
            <div onClick={() => allergyRef.current?.focus()}
              style={{
                border:'1.5px solid ' + (C.borderMid), borderRadius:12,
                padding:'10px 12px', background:C.cream, minHeight:50,
                display:'flex', flexWrap:'wrap', gap:6, alignItems:'flex-start',
                cursor:'text', marginBottom:24,
              }}>
              {allergies.map(a => (
                <span key={a} style={{
                  background:C.ink, color:'white', padding:'4px 10px 4px 12px',
                  borderRadius:20, fontSize:12, display:'flex', alignItems:'center', gap:5,
                }}>
                  {a}
                  <button onClick={() => setAllergies(p => p.filter(x => x !== a))}
                    style={{ background:'none', border:'none', color:'rgba(255,255,255,0.7)', cursor:'pointer', padding:0, fontSize:14, lineHeight:1 }}>
                    ✕
                  </button>
                </span>
              ))}
              <input ref={allergyRef}
                value={allergyInput} onChange={e => setAllergyInput(e.target.value)}
                onKeyDown={e => {
                  if ((e.key === 'Enter' || e.key === ',') && allergyInput.trim()) {
                    e.preventDefault();
                    setAllergies(p => [...p, allergyInput.trim()]);
                    setAllergyInput('');
                  }
                }}
                placeholder="e.g. peanuts, shellfish…"
                style={{
                  border:'none', outline:'none', fontSize:13,
                  fontFamily:"'DM Sans',sans-serif", flex:1,
                  minWidth:140, background:'transparent', padding:'3px 0',
                }}
              />
            </div>

            <SectionLabel>Cuisine preferences</SectionLabel>
            <div style={{ fontSize:12, color:C.muted, marginBottom:12, fontWeight:300 }}>
              These form your pool — used across all journey tiles and the per-session picker
            </div>
            <CuisineSelector selected={prefCuisines} onChange={setPrefCuisines} />
          </div>
        )}

        {/* ── FAMILY TAB ── */}
        {activeTab === 'family' && (
          <div>
            <SectionLabel>Family members</SectionLabel>
            <div style={{ display:'flex', flexDirection:'column', gap:10, marginBottom:20 }}>
              {familyMembers.map((m, i) => (
                <div key={i} style={{
                  display:'flex', alignItems:'center', justifyContent:'space-between',
                  padding:'12px 14px', background:'white',
                  border:'1px solid ' + (C.border), borderRadius:12,
                }}>
                  <div>
                    <span style={{ fontSize:13, fontWeight:600, color:C.ink }}>{m.name}</span>
                    <span style={{ fontSize:11, color:C.muted, marginLeft:8 }}>{m.dietary}</span>
                  </div>
                  <button onClick={() => setFamilyMembers(p => p.filter((_, j) => j !== i))}
                    style={{
                      background:'none', border:'none', color:C.muted,
                      cursor:'pointer', fontSize:16, lineHeight:1, padding:'2px 6px',
                    }}>✕</button>
                </div>
              ))}
            </div>

            {/* Add member */}
            <div style={{
              padding:'14px', background:'rgba(28,10,0,0.02)',
              border:'1px solid ' + (C.border), borderRadius:14,
            }}>
              <div style={{ fontSize:12, fontWeight:600, color:C.ink, marginBottom:10 }}>
                Add member
              </div>
              <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
                <input value={newMemberName} onChange={e => setNewMemberName(e.target.value)}
                  placeholder="Name"
                  style={{
                    flex:1, minWidth:120, padding:'9px 12px',
                    border:'1px solid ' + (C.border), borderRadius:8,
                    fontSize:13, fontFamily:"'DM Sans',sans-serif", outline:'none',
                  }}
                />
                <select value={newMemberDietary} onChange={e => setNewMemberDietary(e.target.value)}
                  style={{
                    padding:'9px 12px', border:'1px solid ' + (C.border),
                    borderRadius:8, fontSize:13, fontFamily:"'DM Sans',sans-serif",
                    outline:'none', background:'white', cursor:'pointer',
                  }}>
                  {DIET_OPTS.map(d => <option key={d.id} value={d.id}>{d.label}</option>)}
                </select>
                <button
                  onClick={() => {
                    if (newMemberName.trim()) {
                      setFamilyMembers(p => [...p, { name:newMemberName.trim(), dietary:newMemberDietary }]);
                      setNewMemberName(''); setNewMemberDietary('veg');
                    }
                  }}
                  style={{
                    padding:'9px 16px', background:C.jiff, color:'white',
                    border:'none', borderRadius:8, fontSize:13, fontWeight:500,
                    cursor:'pointer', fontFamily:"'DM Sans',sans-serif",
                  }}>
                  Add
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── GOALS TAB ── */}
        {activeTab === 'goals' && (
          <div>
            <SectionLabel>Active goal</SectionLabel>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:10, marginBottom:24 }}>
              {Object.entries(GOAL_CONTEXTS).map(([id, goal]) => (
                <button key={id}
                  onClick={() => setActiveGoal(activeGoal === id ? '' : id)}
                  style={{
                    padding:'14px 12px', border:'2px solid ' + (activeGoal===id ? C.jiff : C.border),
                    borderRadius:14, background: activeGoal===id ? 'rgba(255,69,0,0.06)' : 'white',
                    cursor:'pointer', textAlign:'left',
                    fontFamily:"'DM Sans',sans-serif", transition:'all 0.12s',
                    display:'flex', flexDirection:'column', gap:6, minHeight:80,
                  }}>
                  <span style={{ fontSize:24 }}>{goal.emoji}</span>
                  <span style={{ fontSize:12, fontWeight:600, color: activeGoal===id ? C.jiff : C.ink }}>
                    {goal.label}
                  </span>
                </button>
              ))}
            </div>

            {/* Calorie target */}
            <SectionLabel>Daily calorie target (optional)</SectionLabel>
            <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:8 }}>
              <input type="number" value={calorieTarget}
                onChange={e => setCalorieTarget(e.target.value)}
                placeholder="e.g. 1800"
                style={{
                  width:120, padding:'9px 12px',
                  border:'1px solid ' + (C.border), borderRadius:8,
                  fontSize:13, fontFamily:"'DM Sans',sans-serif", outline:'none',
                }}
              />
              <span style={{ fontSize:13, color:C.muted }}>kcal / day</span>
            </div>
            <div style={{
              fontSize:11, color:C.gold,
              background:'rgba(217,119,6,0.07)',
              border:'1px solid rgba(217,119,6,0.2)',
              borderRadius:8, padding:'8px 12px', marginBottom:24,
            }}>
              ⓘ Rating a recipe updates your nutrition tracking
            </div>

            {/* 7-day strip */}
            <SectionLabel>This week</SectionLabel>
            <WeekStrip mealHistory={mealHistory} />

            {/* Progress card */}
            {cookedCount > 0 && (
              <div style={{
                padding:'12px 16px', background:'white',
                border:'1px solid ' + (C.border), borderRadius:12,
                fontSize:13, color:C.ink,
              }}>
                🍳 {cookedCount} recipes rated this week
                {avgRating > 0 && ` · avg ★${avgRating.toFixed(1)}`}
              </div>
            )}
          </div>
        )}

        {/* ── PANTRY TAB ── */}
        {activeTab === 'pantry' && (
          <div>
            <div style={{ fontSize:13, color:'#7C6A5E', fontWeight:300, marginBottom:16, lineHeight:1.6 }}>
              Your pantry items are assumed available in every recipe. Add staples you always have — Jiff won't ask you to buy them.
            </div>
            <PantryEditor
              pantryItems={pantryItems}
              setPantryItems={setPantryItems}
              C={C}
            />
          </div>
        )}

        {/* ── SETTINGS TAB ── */}
        {activeTab === 'settings' && (
          <div>
            <SectionLabel>Language</SectionLabel>
            <div style={{ display:'flex', flexWrap:'wrap', gap:8, marginBottom:24 }}>
              {[
                {code:'en',label:'English'},
                {code:'ta',label:'தமிழ்'},
                {code:'hi',label:'हिंदी'},
                {code:'bn',label:'বাংলা'},
                {code:'kn',label:'ಕನ್ನಡ'},
                {code:'mr',label:'मराठी'},
                {code:'te',label:'తెలుగు'},
              ].map(l => {
                const isActive = (lang || 'en') === l.code;
                return (
                  <button key={l.code} onClick={() => setLang(l.code)}
                    style={{
                      padding:'8px 16px', minHeight:40,
                      border:'1.5px solid ' + (isActive ? C.jiff : C.borderMid),
                      background: isActive ? C.jiff : 'white',
                      color: isActive ? 'white' : C.muted,
                      borderRadius:20, fontSize:13, cursor:'pointer',
                      fontFamily:"'DM Sans', sans-serif",
                      fontWeight: isActive ? 600 : 400, transition:'all 0.12s',
                    }}>
                    {isActive && '✓ '}{l.label}
                  </button>
                );
              })}
            </div>

            <SectionLabel>Units</SectionLabel>
            <div style={{ display:'flex', gap:8, marginBottom:24 }}>
              {[
                { id:'metric',   label:'Metric (g, ml, kg)'      },
                { id:'imperial', label:'Imperial (oz, lb, fl oz)' },
              ].map(u => (
                <button key={u.id} onClick={() => setUnits(u.id)}
                  style={{ ...pill(units === u.id), flex:1, textAlign:'center', minHeight:44 }}>
                  {u.label}
                </button>
              ))}
            </div>

            <SectionLabel>Country / Region</SectionLabel>
            <div style={{ display:'flex', flexWrap:'wrap', gap:8, marginBottom:8 }}>
              {[
                { id:'IN', label:'India 🇮🇳'       },
                { id:'GB', label:'UK 🇬🇧'           },
                { id:'US', label:'US 🇺🇸'           },
                { id:'AU', label:'Australia 🇦🇺'    },
                { id:'SG', label:'Singapore 🇸🇬'    },
                { id:'AE', label:'UAE 🇦🇪'          },
              ].map(c => (
                <button key={c.id}
                  onClick={() => updateProfile?.({ country: c.id })}
                  style={{ ...pill(profile?.country === c.id || (!profile?.country && c.id === 'IN')), minHeight:40 }}>
                  {c.label}
                </button>
              ))}
            </div>
          </div>
        )}        )}
      </div>
    </div>
  );
}
