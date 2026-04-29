// src/pages/KidsLunchbox.jsx — 5-day school lunchbox planner
// Generates Mon-Fri lunch + snack + drink per day
// Mobile-first, parent flow

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PageHeader from '../components/common/PageHeader';
import { useAuth }     from '../contexts/AuthContext';
import { generateRecipes } from '../services/recipeService';

const C = {
  jiff:'#FF4500', ink:'#1C0A00', cream:'#FFFAF5',
  muted:'#7C6A5E', border:'rgba(28,10,0,0.08)',
  green:'#1D9E75', gold:'#D97706',
};

const AGES = [
  { id:'under5',  label:'Under 5',  emoji:'🍼', note:'Soft, no choking hazards' },
  { id:'5to10',   label:'5–10 yrs', emoji:'🧒', note:'Fun shapes, mild spice'   },
  { id:'10plus',  label:'10+ yrs',  emoji:'🧑', note:'More variety, heartier'   },
];
const ALLERGENS = ['Nuts','Dairy','Gluten','Eggs','Shellfish','Soy'];
const DAYS = ['Monday','Tuesday','Wednesday','Thursday','Friday'];

function DayLunchCard({ day, lunchData }) {
  const [open, setOpen] = useState(false);
  if (!lunchData) return null;
  return (
    <div style={{
      background:'white', border:'1px solid ' + (C.border),
      borderRadius:14, overflow:'hidden', marginBottom:10,
    }}>
      <button onClick={() => setOpen(o => !o)}
        style={{
          width:'100%', padding:'14px 16px',
          display:'flex', alignItems:'center', gap:10,
          border:'none', background:'none', cursor:'pointer',
          fontFamily:"'DM Sans',sans-serif",
        }}>
        <span style={{ fontSize:20 }}>{lunchData.emoji || '🍱'}</span>
        <div style={{ flex:1, textAlign:'left' }}>
          <div style={{ fontSize:14, fontWeight:600, color:C.ink }}>{day}</div>
          <div style={{ fontSize:11, color:C.muted, fontWeight:300 }}>
            {lunchData.main?.name || 'Tap to see lunch'}
          </div>
        </div>
        <span style={{
          fontSize:16, color:C.muted,
          transform: open ? 'rotate(180deg)' : 'none',
          transition:'transform 0.2s',
        }}>▾</span>
      </button>
      {open && (
        <div style={{ borderTop:`1px solid ${C.border}`, padding:'12px 16px' }}>
          {[
            { label:'🍱 Main',  meal: lunchData.main  },
            { label:'🍎 Snack', meal: lunchData.snack },
            { label:'💧 Drink', meal: lunchData.drink },
          ].map(({ label, meal }) => meal && (
            <div key={label} style={{
              padding:'8px 0', borderBottom:`1px solid rgba(28,10,0,0.04)`,
            }}>
              <div style={{ fontSize:10, color:C.jiff, fontWeight:600, letterSpacing:'1px', textTransform:'uppercase', marginBottom:3 }}>{label}</div>
              <div style={{ fontSize:13, color:C.ink, fontWeight:500 }}>{meal.name}</div>
              {meal.note && <div style={{ fontSize:11, color:C.muted, fontWeight:300 }}>{meal.note}</div>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const LOADING_MSGS = [
  "Packing Monday's lunchbox... 🍱",
  "Adding snacks for Tuesday... 🍎",
  "Making Wednesday nutritious... 🥕",
  "Thinking of Thursday's treat... 🧆",
  "Finishing Friday's box... ✨",
];

export default function KidsLunchbox() {
  const navigate  = useNavigate();
  const { user, profile } = useAuth();

  const [age,        setAge]        = useState('5to10');
  const [allergens,  setAllergens]  = useState([]);
  const [view,       setView]       = useState('input');
  const [plan,       setPlan]       = useState(null);
  const [loadMsg,    setLoadMsg]    = useState(0);
  const [error,      setError]      = useState('');

  const toggleAllergen = (a) =>
    setAllergens(p => p.includes(a) ? p.filter(x => x !== a) : [...p, a]);

  const handleGenerate = async () => {
    setView('loading'); setError('');
    // Cycle through loading messages
    let idx = 0;
    const interval = setInterval(() => { idx = (idx+1) % LOADING_MSGS.length; setLoadMsg(idx); }, 3000);

    try {
      const selectedAge = AGES.find(a => a.id === age);
      const prompt = `Generate a 5-day school lunchbox plan for ${selectedAge?.label} (${selectedAge?.range}).
Each day: a main lunchbox dish, a snack, and a drink suggestion.
Rules: School-friendly (no strong smells, no mess, no nuts if allergen selected), nutritious, kid-approved.
Age notes: ${selectedAge?.note}.
${allergens.length > 0 ? 'Avoid allergens: ' + allergens.join(', ') + '.' : ''}
Respond ONLY with valid JSON:
{
  "Monday":    {"emoji":"🍱","main":{"name":"...","note":"..."},"snack":{"name":"...","note":"..."},"drink":{"name":"...","note":"..."}},
  "Tuesday":   {"emoji":"🍱","main":{"name":"...","note":"..."},"snack":{"name":"...","note":"..."},"drink":{"name":"...","note":"..."}},
  "Wednesday": {"emoji":"🍱","main":{"name":"...","note":"..."},"snack":{"name":"...","note":"..."},"drink":{"name":"...","note":"..."}},
  "Thursday":  {"emoji":"🍱","main":{"name":"...","note":"..."},"snack":{"name":"...","note":"..."},"drink":{"name":"...","note":"..."}},
  "Friday":    {"emoji":"🍱","main":{"name":"...","note":"..."},"snack":{"name":"...","note":"..."},"drink":{"name":"...","note":"..."}}
}`;

      const profileDiet = (() => {
        const ft = Array.isArray(profile?.food_type) ? profile.food_type[0] : profile?.food_type;
        return ft && ft !== 'none' ? ft : 'any';
      })();
      const data = await generateRecipes({
        ingredients: [], diet: profileDiet, cuisine: 'kid-friendly',
        time: '30 min', servings: 1, count: 1,
        kidsMode: true, kidsPromptOverride: prompt,
        tasteProfile: profile ? {
          spice_level:        profile.spice_level,
          allergies:          [...(profile.allergies || []), ...allergens],
          preferred_cuisines: profile.preferred_cuisines,
          skill_level:        profile.skill_level,
          active_goal:        profile.active_goal,
          country:            profile.country,
        } : { allergies: allergens },
      });
      // Try to parse the plan from the response
      let parsed = null;
      if (data.meals?.[0]?.rawPlan) {
        parsed = data.meals[0].rawPlan;
      } else {
        // Fallback: build a static demo plan
        parsed = {
          Monday:    { emoji:'🍱', main:{name:'Cheese paratha triangles',note:'Easy to eat'}, snack:{name:'Banana',note:''}, drink:{name:'Milk',note:''} },
          Tuesday:   { emoji:'🍱', main:{name:'Mini idli with mild sambar',note:'No mess'}, snack:{name:'Apple slices',note:''}, drink:{name:'Coconut water',note:''} },
          Wednesday: { emoji:'🍱', main:{name:'Veg sandwich',note:'Wholegrain bread'}, snack:{name:'Dry fruits',note:'No nuts if allergen'}, drink:{name:'Buttermilk',note:''} },
          Thursday:  { emoji:'🍱', main:{name:'Upma with vegetables',note:'Warm or cold'}, snack:{name:'Orange',note:''}, drink:{name:'Juice',note:'No added sugar'} },
          Friday:    { emoji:'🍱', main:{name:'Poha with peas',note:'Light and filling'}, snack:{name:'Yoghurt',note:'Plain'}, drink:{name:'Water with lemon',note:''} },
        };
      }
      setPlan(parsed);
      setView('results');
    } catch {
      setError('Could not generate plan. Please try again.');
      setView('error');
    } finally {
      clearInterval(interval);
    }
  };

  return (
    <div style={{ minHeight:'100vh', background:C.cream, fontFamily:"'DM Sans',sans-serif", paddingBottom:80 }}>
      {/* Header */}
      <PageHeader title="🍱 Kids' Lunchbox" backTo='/plan' backLabel='← Plan' />

      <div style={{ padding:'24px 20px', maxWidth:520, margin:'0 auto' }}>

        {view === 'input' && (
          <>
            <div style={{ fontFamily:"'Fraunces',serif", fontSize:22, fontWeight:900, color:C.ink, marginBottom:6 }}>
              Plan this week's lunches
            </div>
            <div style={{ fontSize:13, color:C.muted, fontWeight:300, marginBottom:24, lineHeight:1.6 }}>
              Jiff will generate 5 school-friendly lunch ideas — main, snack, and drink for each day.
            </div>

            {/* Age group */}
            <div style={{ fontSize:11, letterSpacing:'1.5px', textTransform:'uppercase', color:C.muted, fontWeight:600, marginBottom:10 }}>Age group</div>
            <div style={{ display:'flex', flexDirection:'column', gap:8, marginBottom:24 }}>
              {AGES.map(a => (
                <button key={a.id} onClick={() => setAge(a.id)}
                  style={{
                    display:'flex', alignItems:'center', gap:12, padding:'14px 16px',
                    border:'2px solid ' + (age===a.id ? C.jiff : C.border),
                    borderRadius:14, background: age===a.id ? 'rgba(255,69,0,0.06)' : 'white',
                    cursor:'pointer', fontFamily:"'DM Sans',sans-serif", transition:'all 0.12s',
                  }}>
                  <span style={{ fontSize:24 }}>{a.emoji}</span>
                  <div style={{ textAlign:'left' }}>
                    <div style={{ fontSize:14, fontWeight:600, color: age===a.id ? C.jiff : C.ink }}>{a.label}</div>
                    <div style={{ fontSize:11, color:C.muted, fontWeight:300 }}>{a.note}</div>
                  </div>
                </button>
              ))}
            </div>

            {/* Allergens */}
            <div style={{ fontSize:11, letterSpacing:'1.5px', textTransform:'uppercase', color:C.muted, fontWeight:600, marginBottom:10 }}>Allergens to avoid</div>
            <div style={{ display:'flex', flexWrap:'wrap', gap:8, marginBottom:28 }}>
              {ALLERGENS.map(a => (
                <button key={a} onClick={() => toggleAllergen(a)}
                  style={{
                    padding:'7px 14px', borderRadius:20, fontSize:13,
                    border:'1.5px solid ' + (allergens.includes(a) ? C.jiff : C.border),
                    background: allergens.includes(a) ? 'rgba(255,69,0,0.07)' : 'white',
                    color: allergens.includes(a) ? C.jiff : C.muted,
                    cursor:'pointer', fontFamily:"'DM Sans',sans-serif",
                    fontWeight: allergens.includes(a) ? 600 : 400, transition:'all 0.12s',
                  }}>
                  {allergens.includes(a) ? '✕ ' : ''}{a}
                </button>
              ))}
            </div>

            <button onClick={handleGenerate}
              style={{
                width:'100%', padding:'15px', background:C.jiff, color:'white',
                border:'none', borderRadius:14, fontSize:15, fontWeight:600,
                cursor:'pointer', fontFamily:"'DM Sans',sans-serif",
              }}>
              Plan this week's lunches →
            </button>
          </>
        )}

        {view === 'loading' && (
          <div style={{ textAlign:'center', padding:'60px 20px' }}>
            <div style={{ fontSize:48, marginBottom:16, animation:'spin 2s linear infinite' }}>🍱</div>
            <style>{'@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}'}</style>
            <div style={{ fontFamily:"'Fraunces',serif", fontSize:20, fontWeight:700, color:C.ink, marginBottom:8 }}>
              Building 5 days of lunches…
            </div>
            <div style={{ fontSize:13, color:C.muted, fontWeight:300 }}>
              {LOADING_MSGS[loadMsg]}
            </div>
          </div>
        )}

        {view === 'error' && (
          <div style={{ textAlign:'center', padding:'60px 20px' }}>
            <div style={{ fontSize:40, marginBottom:12 }}>⚠️</div>
            <div style={{ fontSize:15, fontWeight:600, color:C.ink, marginBottom:8 }}>Something went wrong</div>
            <div style={{ fontSize:13, color:C.muted, marginBottom:20 }}>{error}</div>
            <button onClick={() => setView('input')} style={{ padding:'10px 20px', background:C.jiff, color:'white', border:'none', borderRadius:10, fontSize:13, fontWeight:600, cursor:'pointer', fontFamily:"'DM Sans',sans-serif" }}>Try again</button>
          </div>
        )}

        {view === 'results' && plan && (
          <>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:16 }}>
              <div>
                <div style={{ fontFamily:"'Fraunces',serif", fontSize:20, fontWeight:700, color:C.ink }}>
                  This week's lunchboxes 🍱
                </div>
                <div style={{ fontSize:12, color:C.muted, fontWeight:300 }}>
                  Tap each day to see what to pack
                </div>
              </div>
              <button onClick={() => setView('input')}
                style={{ padding:'7px 12px', fontSize:12, background:'none', border:'1px solid ' + (C.border), borderRadius:8, color:C.muted, cursor:'pointer', fontFamily:"'DM Sans',sans-serif" }}>
                ↺ Cook something else
              </button>
            </div>
            {DAYS.map(day => (
              <DayLunchCard key={day} day={day} lunchData={plan[day]} />
            ))}
            <button onClick={handleGenerate}
              style={{
                width:'100%', marginTop:16, padding:'13px', background:'rgba(255,69,0,0.07)',
                border:`1px solid rgba(255,69,0,0.2)`, borderRadius:12,
                fontSize:13, color:C.jiff, fontWeight:600,
                cursor:'pointer', fontFamily:"'DM Sans',sans-serif",
              }}>
              ⚡ Generate new plan
            </button>
          </>
        )}
      </div>
    </div>
  );
}
