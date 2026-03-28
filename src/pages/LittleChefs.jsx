// src/pages/LittleChefs.jsx — Kids Meal Plan ("Little Chefs")
// Age-appropriate, fun, nutritious meal suggestions for children

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useLocale } from '../contexts/LocaleContext';
import { usePremium } from '../contexts/PremiumContext';

const C = {
  jiff:'#FF4500', ink:'#1C0A00', cream:'#FFFAF5', warm:'#FFF0E5',
  muted:'#7C6A5E', border:'rgba(28,10,0,0.10)', shadow:'0 4px 24px rgba(28,10,0,0.08)',
  green:'#1D9E75', purple:'#7C3AED', blue:'#2563EB',
};

const AGE_GROUPS = [
  { id:'toddler', label:'Toddlers', range:'1–3 yrs', emoji:'🍼', note:'Soft textures, mild flavours, finger foods' },
  { id:'kids',    label:'Kids',     range:'4–8 yrs', emoji:'🧒', note:'Fun shapes, hidden veggies, balanced portions' },
  { id:'preteen', label:'Pre-teens',range:'9–12 yrs',emoji:'🧑', note:'More variety, growing appetite, adventure foods' },
];

const MEAL_TYPES = [
  { id:'breakfast', label:'Breakfast', emoji:'🌅' },
  { id:'lunch',     label:'Lunch',     emoji:'☀️' },
  { id:'dinner',    label:'Dinner',    emoji:'🌙' },
  { id:'snack',     label:'Snack',     emoji:'🍎' },
  { id:'tiffin',    label:'School Tiffin', emoji:'🎒' },
];

const FUN_FACTS = [
  '🥦 Broccoli has more vitamin C than oranges!',
  '🥕 Carrots were originally purple, not orange.',
  '🍌 Bananas are technically berries.',
  '🍅 Tomatoes are fruits, not vegetables.',
  '🥚 Eggs have all 9 essential amino acids kids need.',
];

export default function LittleChefs() {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const { lang } = useLocale();
  const { isPremium } = usePremium();
  const [ageGroup, setAgeGroup]   = useState('kids');
  const [mealType, setMealType]   = useState('lunch');
  const [servings, setServings]   = useState(2);
  const [meals,    setMeals]      = useState(null);
  const [loading,  setLoading]    = useState(false);
  const [error,    setError]      = useState('');
  const [factIdx,  setFactIdx]    = useState(0);

  useEffect(() => {
    if (!loading) return;
    const t = setInterval(() => setFactIdx(i => (i+1) % FUN_FACTS.length), 2800);
    return () => clearInterval(t);
  }, [loading]);

  const generate = async () => {
    if (!user && !isPremium) { navigate('/pricing'); return; }
    setLoading(true); setError(''); setMeals(null);
    const ag = AGE_GROUPS.find(a => a.id === ageGroup);
    const mt = MEAL_TYPES.find(m => m.id === mealType);
    const parentDiet = profile?.food_type ? 
      (Array.isArray(profile.food_type) ? profile.food_type[0] : 'veg') : 'veg';

    const prompt = `You are a child nutrition expert and creative kids' chef.
Create ${isPremium ? 3 : 1} fun, nutritious ${mt?.label} recipe(s) for ${ag?.label} (${ag?.range}).
Key requirements:
- ${ag?.note}
- Diet: ${parentDiet} (family preference)
- Serves: ${servings} children
- Make it FUN — kids should want to eat it
- Include a playful recipe name kids will love
- Keep preparation simple (parent-friendly, under 30 mins)
- Add a "Fun Fact for Kids" about a main ingredient
- India-appropriate ingredients

Respond ONLY with valid JSON (no markdown):
{
  "meals": [
    {
      "name": "Sunshine Veggie Wrap 🌮",
      "emoji": "🌮",
      "description": "Colourful and crunchy — kids love assembling their own!",
      "time": "15 mins",
      "difficulty": "Easy",
      "servings": "${servings}",
      "ingredients": ["1 whole wheat roti", "2 tbsp hummus"],
      "steps": ["Warm the roti for 30 seconds.", "Spread hummus evenly."],
      "calories": "280 kcal",
      "protein": "9g",
      "fun_fact": "Chickpeas help build strong muscles!"
    }
  ]
}`;

    try {
      const res = await fetch('/api/suggest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ingredients: ['rice', 'dal', 'vegetables', 'milk', 'eggs', 'paneer', 'roti'],
          time: '30 minutes',
          diet: parentDiet,
          cuisine: 'indian',
          mealType,
          defaultServings: servings,
          count: isPremium ? 3 : 1,
          language: lang,
          kidsMode: true,
          kidsPromptOverride: prompt,
        }),
      });
      const data = await res.json();
      if (data.meals?.length) {
        setMeals(data.meals);
      } else {
        setError('Could not generate recipes. Please try again.');
      }
    } catch { setError('Connection error. Please try again.'); }
    finally { setLoading(false); }
  };

  return (
    <div style={{ minHeight:'100vh', background:C.cream, fontFamily:"'DM Sans',sans-serif" }}>
      <link href="https://fonts.googleapis.com/css2?family=Fraunces:wght@700;900&family=DM+Sans:wght@300;400;500&display=swap" rel="stylesheet"/>

      {/* Header */}
      <div style={{ padding:'14px 28px', borderBottom:'1px solid '+C.border, background:'white',
        display:'flex', alignItems:'center', justifyContent:'space-between',
        position:'sticky', top:0, zIndex:10, boxShadow:'0 2px 8px rgba(28,10,0,0.04)' }}>
        <div>
          <div style={{ fontFamily:"'Fraunces',serif", fontSize:22, fontWeight:900, color:C.ink }}>
            👨‍🍳 Little Chefs
          </div>
          <div style={{ fontSize:11, color:C.muted, fontWeight:300 }}>Fun & nutritious meals for kids</div>
        </div>
        <button onClick={() => navigate('/app')}
          style={{ padding:'7px 16px', borderRadius:20, border:'1.5px solid '+C.border,
            background:'white', fontSize:12, cursor:'pointer', color:C.muted, fontFamily:"'DM Sans',sans-serif" }}>
          ← Back
        </button>
      </div>

      <div style={{ maxWidth:680, margin:'0 auto', padding:'28px 20px' }}>
        {/* Age group selector */}
        <div style={{ background:'white', border:'1px solid '+C.border, borderRadius:20,
          padding:'20px 22px', marginBottom:16, boxShadow:C.shadow }}>
          <div style={{ fontSize:11, letterSpacing:'2px', textTransform:'uppercase',
            color:C.purple, fontWeight:500, marginBottom:14 }}>Who's eating?</div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:10 }}>
            {AGE_GROUPS.map(ag => (
              <button key={ag.id} onClick={() => setAgeGroup(ag.id)}
                style={{ padding:'14px 10px', borderRadius:14, cursor:'pointer', textAlign:'center',
                  border:'2px solid '+(ageGroup===ag.id ? C.purple : C.border),
                  background: ageGroup===ag.id ? 'rgba(124,58,237,0.06)' : 'white',
                  transition:'all 0.15s', fontFamily:"'DM Sans',sans-serif" }}>
                <div style={{ fontSize:28, marginBottom:4 }}>{ag.emoji}</div>
                <div style={{ fontSize:13, fontWeight:600, color:ageGroup===ag.id ? C.purple : C.ink }}>
                  {ag.label}
                </div>
                <div style={{ fontSize:10, color:C.muted }}>{ag.range}</div>
              </button>
            ))}
          </div>
          <div style={{ marginTop:10, padding:'8px 12px', background:'rgba(124,58,237,0.05)',
            borderRadius:8, fontSize:12, color:C.purple, fontWeight:300 }}>
            💡 {AGE_GROUPS.find(a => a.id === ageGroup)?.note}
          </div>
        </div>

        {/* Meal type + servings */}
        <div style={{ background:'white', border:'1px solid '+C.border, borderRadius:20,
          padding:'20px 22px', marginBottom:16, boxShadow:C.shadow }}>
          <div style={{ fontSize:11, letterSpacing:'2px', textTransform:'uppercase',
            color:C.jiff, fontWeight:500, marginBottom:12 }}>Meal type</div>
          <div style={{ display:'flex', flexWrap:'wrap', gap:8, marginBottom:18 }}>
            {MEAL_TYPES.map(mt => (
              <button key={mt.id} onClick={() => setMealType(mt.id)}
                style={{ padding:'7px 14px', borderRadius:20, cursor:'pointer',
                  border:'1.5px solid '+(mealType===mt.id ? C.jiff : C.border),
                  background: mealType===mt.id ? C.jiff : 'white',
                  color: mealType===mt.id ? 'white' : C.ink,
                  fontSize:12, fontFamily:"'DM Sans',sans-serif",
                  display:'flex', alignItems:'center', gap:5 }}>
                {mt.emoji} {mt.label}
              </button>
            ))}
          </div>

          <div style={{ fontSize:11, letterSpacing:'2px', textTransform:'uppercase',
            color:C.green, fontWeight:500, marginBottom:10 }}>Number of kids</div>
          <div style={{ display:'flex', alignItems:'center', gap:12 }}>
            <button onClick={() => setServings(s => Math.max(1, s-1))}
              style={{ width:34, height:34, borderRadius:'50%', border:'1.5px solid '+C.border,
                background:'white', fontSize:18, cursor:'pointer', display:'flex',
                alignItems:'center', justifyContent:'center' }}>−</button>
            <span style={{ fontSize:20, fontWeight:700, color:C.ink, minWidth:28, textAlign:'center' }}>
              {servings}
            </span>
            <button onClick={() => setServings(s => Math.min(10, s+1))}
              style={{ width:34, height:34, borderRadius:'50%', border:'1.5px solid '+C.border,
                background:'white', fontSize:18, cursor:'pointer', display:'flex',
                alignItems:'center', justifyContent:'center' }}>+</button>
            <span style={{ fontSize:12, color:C.muted, fontWeight:300 }}>
              kid{servings !== 1 ? 's' : ''}
            </span>
          </div>
        </div>

        {/* Generate button */}
        <button onClick={generate} disabled={loading}
          style={{ width:'100%', background: loading ? '#ccc' : 'linear-gradient(135deg,#7C3AED,#6D28D9)',
            color:'white', border:'none', borderRadius:16, padding:'16px',
            fontSize:16, fontWeight:600, cursor: loading ? 'not-allowed' : 'pointer',
            fontFamily:"'Fraunces',serif", letterSpacing:'0.5px', marginBottom:20 }}>
          {loading ? '👨‍🍳 Cooking up ideas…' : `✨ Generate ${isPremium ? '3' : '1'} Kid-Friendly Recipe${isPremium ? 's' : ''}`}
        </button>

        {/* Loading fun facts */}
        {loading && (
          <div style={{ textAlign:'center', padding:'20px 16px', background:'white',
            border:'1px solid '+C.border, borderRadius:16, marginBottom:16, boxShadow:C.shadow }}>
            <div style={{ fontSize:32, marginBottom:8 }}>👨‍🍳</div>
            <div style={{ fontSize:14, color:C.purple, fontWeight:500, marginBottom:6 }}>
              Creating something delicious…
            </div>
            <div style={{ fontSize:12, color:C.muted, fontWeight:300, fontStyle:'italic' }}>
              {FUN_FACTS[factIdx % FUN_FACTS.length]}
            </div>
          </div>
        )}

        {error && (
          <div style={{ padding:'12px 16px', background:'rgba(229,62,62,0.08)',
            border:'1px solid rgba(229,62,62,0.2)', borderRadius:12, fontSize:13,
            color:'#C53030', marginBottom:16 }}>{error}</div>
        )}

        {/* Results */}
        {meals && meals.map((meal, idx) => (
          <div key={idx} style={{ background:'white', border:'2px solid rgba(124,58,237,0.15)',
            borderRadius:20, padding:'22px', marginBottom:16, boxShadow:C.shadow }}>
            {/* Header */}
            <div style={{ display:'flex', alignItems:'flex-start', gap:12, marginBottom:14 }}>
              <div style={{ fontSize:36 }}>{meal.emoji || '🍽️'}</div>
              <div style={{ flex:1 }}>
                <div style={{ fontFamily:"'Fraunces',serif", fontSize:19, fontWeight:900,
                  color:C.ink, marginBottom:4 }}>{meal.name}</div>
                <div style={{ fontSize:12, color:C.muted, fontWeight:300, lineHeight:1.5 }}>
                  {meal.description}
                </div>
              </div>
            </div>

            {/* Meta */}
            <div style={{ display:'flex', gap:12, marginBottom:16, flexWrap:'wrap' }}>
              {[['⏱', meal.time], ['📊', meal.difficulty], ['👨‍👩‍👧', `${meal.servings} serving${meal.servings != 1 ? 's' : ''}`]].map(([icon, val]) => (
                <span key={icon} style={{ fontSize:11, background:'rgba(124,58,237,0.08)',
                  color:C.purple, padding:'3px 10px', borderRadius:20 }}>
                  {icon} {val}
                </span>
              ))}
            </div>

            {/* Fun fact */}
            {meal.fun_fact && (
              <div style={{ padding:'10px 14px', background:'rgba(255,184,0,0.1)',
                border:'1px solid rgba(255,184,0,0.25)', borderRadius:12, marginBottom:16,
                fontSize:12, color:'#854F0B', fontWeight:400 }}>
                🌟 <strong>Fun fact for kids:</strong> {meal.fun_fact}
              </div>
            )}

            {/* Ingredients */}
            <div style={{ fontSize:11, letterSpacing:'2px', textTransform:'uppercase',
              color:C.purple, fontWeight:500, marginBottom:8 }}>Ingredients</div>
            <ul style={{ margin:'0 0 16px', paddingLeft:20 }}>
              {(meal.ingredients || []).map((ing, j) => (
                <li key={j} style={{ fontSize:13, color:C.ink, fontWeight:300,
                  lineHeight:1.7, marginBottom:2 }}>{ing}</li>
              ))}
            </ul>

            {/* Steps */}
            <div style={{ fontSize:11, letterSpacing:'2px', textTransform:'uppercase',
              color:C.purple, fontWeight:500, marginBottom:8 }}>How to make it</div>
            <ol style={{ margin:'0 0 16px', paddingLeft:20 }}>
              {(meal.steps || []).map((step, j) => (
                <li key={j} style={{ fontSize:13, color:C.ink, fontWeight:300,
                  lineHeight:1.7, marginBottom:4 }}>{step}</li>
              ))}
            </ol>

            {/* Nutrition */}
            {(meal.calories || meal.protein) && (
              <div style={{ display:'flex', gap:10, flexWrap:'wrap' }}>
                {meal.calories && (
                  <div style={{ padding:'8px 14px', background:'rgba(29,158,117,0.08)',
                    borderRadius:10, fontSize:12, color:C.green }}>
                    🔥 {meal.calories} per serving
                  </div>
                )}
                {meal.protein && (
                  <div style={{ padding:'8px 14px', background:'rgba(37,99,235,0.08)',
                    borderRadius:10, fontSize:12, color:C.blue }}>
                    💪 {meal.protein} protein
                  </div>
                )}
              </div>
            )}
          </div>
        ))}

        {!isPremium && (
          <div style={{ textAlign:'center', padding:'16px', background:'rgba(124,58,237,0.05)',
            border:'1px solid rgba(124,58,237,0.15)', borderRadius:14, marginTop:8 }}>
            <div style={{ fontSize:13, color:C.purple, marginBottom:8 }}>
              ✨ Get 3 recipes at once with Premium — plus Planner, Goal Plan & more
            </div>
            <button onClick={() => navigate('/pricing')}
              style={{ background:C.purple, color:'white', border:'none', borderRadius:10,
                padding:'8px 20px', fontSize:12, fontWeight:500, cursor:'pointer',
                fontFamily:"'DM Sans',sans-serif" }}>
              Upgrade ⚡
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
