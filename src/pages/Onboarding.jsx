// src/pages/Onboarding.jsx
// First-time setup — 3 screens, shown once after first login.
// Saves to Supabase profiles table.
// Skippable from screen 3.

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import JiffLogo from '../components/JiffLogo';
import { CUISINE_GROUPS, ALL_CUISINES } from '../lib/cuisine.js';

const C = {
  jiff: '#FF4500', ink: '#1C0A00', cream: '#FFFAF5',
  muted: '#7C6A5E', border: 'rgba(28,10,0,0.08)',
};

const DIETS = [
  { id:'non-veg',      emoji:'🍗', label:'Non-veg',     desc:'Includes meat, fish, eggs' },
  { id:'veg',          emoji:'🥦', label:'Vegetarian',  desc:'No meat or fish' },
  { id:'vegan',        emoji:'🌱', label:'Vegan',       desc:'No animal products' },
  { id:'eggetarian',   emoji:'🥚', label:'Eggetarian',  desc:'Veg + eggs' },
  { id:'jain',         emoji:'🙏', label:'Jain',        desc:'No root vegetables' },
  { id:'halal',        emoji:'☪️', label:'Halal',       desc:'Halal-certified only' },
];

const COOKING_FOR = [
  { id:'just_me',  emoji:'🧑', label:'Just me'       },
  { id:'partner',  emoji:'👫', label:'My partner'     },
  { id:'family',   emoji:'👨‍👩‍👧', label:'My family'    },
];



export default function Onboarding() {
  const navigate = useNavigate();
  const { user, updateProfile } = useAuth();
  const [screen,   setScreen]   = useState(1);
  const [saving,   setSaving]   = useState(false);

  // Screen 1 state
  const [diet, setDiet] = useState([]); // multi-select array

  // Screen 2 state
  const [cookingFor, setCookingFor] = useState('');
  const [hasKids,    setHasKids]    = useState(false);
  const [kidsAges,   setKidsAges]   = useState([]);

  // Screen 3 state
  const [spice,    setSpice]    = useState(3);
  const [cuisines, setCuisines] = useState([]);

  const toggleCuisine = (id) => {
    setCuisines(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const toggleKidsAge = (age) => {
    setKidsAges(prev => prev.includes(age) ? prev.filter(a => a !== age) : [...prev, age]);
  };

  const handleFinish = async (skip = false) => {
    setSaving(true);
    try {
      const profileData = {
        food_type:          diet.length > 0 ? diet : ['non-veg'],
        cooking_for:        cookingFor || 'just_me',
        has_kids:           hasKids,
        kids_ages:          kidsAges,
        spice_level:        skip ? 3 : spice,
        preferred_cuisines: skip ? [] : (cuisines.filter(c => c !== 'Any')),
        onboarding_done:    true,
      };
      if (updateProfile) await updateProfile(profileData);
    } catch {}
    setSaving(false);
    navigate('/app');
  };

  const progress = (screen / 3) * 100;

  return (
    <div style={{
      minHeight:    '100vh',
      background:   C.cream,
      display:      'flex',
      flexDirection:'column',
      fontFamily:   "'DM Sans', sans-serif",
    }}>
      {/* Header */}
      <div style={{ padding:'24px 24px 0', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <JiffLogo size="sm" />
        <div style={{ fontSize:12, color:C.muted }}>{screen} of 3</div>
      </div>

      {/* Progress bar */}
      <div style={{ height:3, background:'rgba(28,10,0,0.06)', margin:'16px 24px 0' }}>
        <div style={{ height:'100%', width:(progress) + '%', background:C.jiff, borderRadius:2, transition:'width 0.3s ease' }}/>
      </div>

      {/* Content */}
      <div style={{ flex:1, padding:'32px 24px 24px', maxWidth:480, width:'100%', margin:'0 auto', boxSizing:'border-box' }}>

        {/* Screen 1 — Diet */}
        {screen === 1 && (
          <>
            <div style={{ fontFamily:"'Fraunces',serif", fontSize:26, fontWeight:900, color:C.ink, marginBottom:6 }}>
              What best describes your diet? (select all that apply)
            </div>
            <div style={{ fontSize:13, color:C.muted, marginBottom:28 }}>
              This shapes every recipe Jiff suggests for you.
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
              {DIETS.map(d => (
                <button key={d.id} onClick={() => setDiet(prev => prev.includes(d.id) ? prev.filter(x=>x!==d.id) : [...prev, d.id])}
                  style={{
                    padding:    '14px 12px',
                    border:     `2px solid ${diet.includes(d.id) ? C.jiff : C.border}`,
                    borderRadius: 14,
                    background: diet.includes(d.id) ? 'rgba(255,69,0,0.06)' : 'white',
                    cursor:     'pointer',
                    textAlign:  'left',
                    fontFamily: "'DM Sans', sans-serif",
                    transition: 'all 0.12s',
                  }}>
                  <div style={{ fontSize:22, marginBottom:6 }}>{d.emoji}</div>
                  <div style={{ fontSize:13, fontWeight:600, color:C.ink }}>{d.label}</div>
                  <div style={{ fontSize:11, color:C.muted, marginTop:2 }}>{d.desc}</div>
                </button>
              ))}
            </div>
          </>
        )}

        {/* Screen 2 — Cooking for */}
        {screen === 2 && (
          <>
            <div style={{ fontFamily:"'Fraunces',serif", fontSize:26, fontWeight:900, color:C.ink, marginBottom:6 }}>
              Who are you usually cooking for?
            </div>
            <div style={{ fontSize:13, color:C.muted, marginBottom:28 }}>
              Helps Jiff get portions and preferences right.
            </div>
            <div style={{ display:'flex', flexDirection:'column', gap:10, marginBottom:24 }}>
              {COOKING_FOR.map(opt => (
                <button key={opt.id} onClick={() => setCookingFor(opt.id)}
                  style={{
                    display:    'flex', alignItems:'center', gap:14,
                    padding:    '16px 18px',
                    border:     `2px solid ${cookingFor === opt.id ? C.jiff : C.border}`,
                    borderRadius: 14,
                    background: cookingFor === opt.id ? 'rgba(255,69,0,0.06)' : 'white',
                    cursor:     'pointer',
                    fontFamily: "'DM Sans', sans-serif",
                    transition: 'all 0.12s',
                  }}>
                  <span style={{ fontSize:24 }}>{opt.emoji}</span>
                  <span style={{ fontSize:15, fontWeight:500, color:C.ink }}>{opt.label}</span>
                </button>
              ))}
            </div>

            {/* Kids follow-up — only if family selected */}
            {cookingFor === 'family' && (
              <div style={{ padding:'16px', background:'rgba(255,184,0,0.06)', border:'1px solid rgba(255,184,0,0.2)', borderRadius:14 }}>
                <div style={{ fontSize:13, fontWeight:600, color:C.ink, marginBottom:12 }}>
                  Do you have kids?
                </div>
                <div style={{ display:'flex', gap:10, marginBottom:14 }}>
                  {[true, false].map(val => (
                    <button key={String(val)} onClick={() => setHasKids(val)}
                      style={{
                        flex:1, padding:'10px',
                        border:'2px solid ' + (hasKids === val ? C.jiff : C.border),
                        borderRadius:10, background: hasKids === val ? 'rgba(255,69,0,0.06)' : 'white',
                        cursor:'pointer', fontSize:13, fontFamily:"'DM Sans',sans-serif",
                        color: C.ink, fontWeight: hasKids === val ? 600 : 400,
                      }}>
                      {val ? 'Yes' : 'No'}
                    </button>
                  ))}
                </div>
                {hasKids && (
                  <>
                    <div style={{ fontSize:12, color:C.muted, marginBottom:8 }}>Their age group(s):</div>
                    <div style={{ display:'flex', gap:8 }}>
                      {['Under 5','5–10','10+'].map(age => (
                        <button key={age} onClick={() => toggleKidsAge(age)}
                          style={{
                            flex:1, padding:'8px 4px', fontSize:11, fontFamily:"'DM Sans',sans-serif",
                            border:'1.5px solid ' + (kidsAges.includes(age) ? C.jiff : C.border),
                            borderRadius:8, background: kidsAges.includes(age) ? 'rgba(255,69,0,0.06)' : 'white',
                            cursor:'pointer', color:C.ink,
                          }}>
                          {age}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
            )}
          </>
        )}

        {/* Screen 3 — Your kitchen (optional) */}
        {screen === 3 && (
          <>
            <div style={{ fontFamily:"'Fraunces',serif", fontSize:26, fontWeight:900, color:C.ink, marginBottom:6 }}>
              Your kitchen preferences
            </div>
            <div style={{ fontSize:13, color:C.muted, marginBottom:28 }}>
              Optional — you can always update this in your profile.
            </div>

            {/* Spice level */}
            <div style={{ marginBottom:28 }}>
              <div style={{ fontSize:13, fontWeight:600, color:C.ink, marginBottom:12 }}>
                How spicy do you like it?
              </div>
              <div style={{ display:'flex', gap:8, alignItems:'center' }}>
                {[1,2,3,4,5].map(n => (
                  <button key={n} onClick={() => setSpice(n)}
                    style={{
                      flex:1, padding:'10px 0', fontSize:18,
                      border:'2px solid ' + (spice >= n ? C.jiff : C.border),
                      borderRadius:10,
                      background: spice >= n ? 'rgba(255,69,0,0.07)' : 'white',
                      cursor:'pointer',
                    }}>
                    🌶️
                  </button>
                ))}
              </div>
              <div style={{ display:'flex', justifyContent:'space-between', marginTop:4, fontSize:10, color:C.muted }}>
                <span>Mild</span><span>Very spicy</span>
              </div>
            </div>

            {/* Favourite cuisines — grouped taxonomy (same IDs as Profile) */}
            <div style={{ overflowY:'auto', maxHeight:'40vh' }}>
              <div style={{ fontSize:13, fontWeight:600, color:C.ink, marginBottom:12 }}>
                Favourite cuisines? <span style={{ fontWeight:300, color:C.muted }}>(pick any)</span>
              </div>
              {CUISINE_GROUPS.map(group => (
                <div key={group.id} style={{ marginBottom:16 }}>
                  <div style={{
                    fontSize:9, letterSpacing:'2px', textTransform:'uppercase',
                    color:C.jiff, fontWeight:700, marginBottom:8,
                    paddingBottom:4, borderBottom:'1px solid rgba(255,69,0,0.15)',
                  }}>
                    {group.label}
                  </div>
                  {group.sections.map(section => (
                    <div key={section.id} style={{ marginBottom:section.label ? 8 : 0 }}>
                      {section.label && (
                        <div style={{ fontSize:10, fontWeight:600, color:C.muted, marginBottom:5 }}>
                          {section.label}
                        </div>
                      )}
                      <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
                        {section.items.map(item => (
                          <button key={item.id} onClick={() => toggleCuisine(item.id)}
                            style={{
                              padding:'5px 12px', borderRadius:20, fontSize:11,
                              border:'1.5px solid ' + (cuisines.includes(item.id) ? C.jiff : C.border),
                              background: cuisines.includes(item.id) ? 'rgba(255,69,0,0.07)' : 'white',
                              color: cuisines.includes(item.id) ? C.jiff : C.muted,
                              cursor:'pointer', fontFamily:"'DM Sans',sans-serif",
                              fontWeight: cuisines.includes(item.id) ? 600 : 400,
                              transition:'all 0.12s',
                            }}>
                            {cuisines.includes(item.id) ? '✓ ' : ''}{item.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Footer */}
      <div style={{ padding:'16px 24px 36px', maxWidth:480, width:'100%', margin:'0 auto', boxSizing:'border-box' }}>
        <button
          onClick={() => screen < 3 ? setScreen(s => s + 1) : handleFinish(false)}
          disabled={
            (screen === 1 && !diet) ||
            (screen === 2 && !cookingFor) ||
            saving
          }
          style={{
            width:        '100%',
            padding:      '15px',
            background:   C.jiff,
            color:        'white',
            border:       'none',
            borderRadius: 14,
            fontSize:     15,
            fontWeight:   600,
            cursor:       (screen === 1 && !diet) || (screen === 2 && !cookingFor) ? 'not-allowed' : 'pointer',
            fontFamily:   "'DM Sans', sans-serif",
            opacity:      (screen === 1 && !diet) || (screen === 2 && !cookingFor) ? 0.5 : 1,
            marginBottom: 10,
            transition:   'opacity 0.15s',
          }}>
          {saving ? 'Saving…' : screen < 3 ? 'Next →' : 'Start cooking ⚡'}
        </button>

        {screen === 3 && (
          <button onClick={() => handleFinish(true)}
            style={{
              width:'100%', padding:'12px', background:'none', border:'none',
              fontSize:13, color:C.muted, cursor:'pointer', fontFamily:"'DM Sans',sans-serif",
            }}>
            Skip for now
          </button>
        )}
      </div>
    </div>
  );
}
