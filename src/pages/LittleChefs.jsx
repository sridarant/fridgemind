// src/pages/LittleChefs.jsx — Kids Meal Plan ("Kids Meals")
// Age-appropriate, fun, nutritious meal suggestions for children

import { useState, useEffect } from 'react';
import { VideoButton } from '../components/meal/VideoButton.jsx';
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
  const [mode,     setMode]       = useState('for');  // 'for' = parent cooks for kids | 'with' = kids cook
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
    if (!user) { navigate('/app'); return; }
    setLoading(true); setError(''); setMeals(null);

    const ag    = AGE_GROUPS.find(a => a.id === ageGroup);
    const mt    = MEAL_TYPES.find(m => m.id === mealType);
    const count = isPremium ? 3 : 1;
    const isForKids = mode === 'for';

    // ── Rich dietary context from profile ─────────────────────────
    const rawFoodType = profile?.food_type;
    const foodArr     = Array.isArray(rawFoodType) ? rawFoodType : rawFoodType ? [rawFoodType] : [];
    const dietLabel   = foodArr.length ? foodArr.join(', ') : 'vegetarian';
    const allergies   = Array.isArray(profile?.allergies) && profile.allergies.length
                        ? `Allergies to avoid: ${profile.allergies.join(', ')}.` : '';
    const prefCuisines = Array.isArray(profile?.preferred_cuisines) && profile.preferred_cuisines.length
                         ? profile.preferred_cuisines : [];
    const cuisineCtx  = prefCuisines.length
                        ? `Preferred cuisines: ${prefCuisines.join(', ')}.`
                        : 'Use Indian-style cooking.';

    // Age-specific spice level — always override to safe for age
    const kidsSpice = ageGroup === 'toddler' ? 'absolutely NO spice, salt or sugar — completely plain'
                    : ageGroup === 'kids'    ? 'very mild — no chilli, minimal spice'
                    :                          'mild to medium spice at most';

    // Age-specific safety constraints
    const safetyRules = {
      toddler: 'TODDLER SAFETY (1-3 yrs): NO whole nuts, NO honey, NO added salt or sugar, NO raw egg, NO hard raw vegetables, NO choking hazard foods. Everything must be mashed, pureed, or very soft finger-food. Examples: soft idli, banana mash, moong dal soup, steamed sweet potato.',
      kids:    'KIDS SAFETY (4-8 yrs): No sharp cutting, no deep frying. Fun shapes, hidden vegetables, bright colours. Small portions. Examples: mini wraps, fruit skewers (blunt), egg scramble, stuffed paratha, fruit smoothie bowl.',
      preteen: 'PRE-TEEN (9-12 yrs): Simple stovetop allowed with adult nearby. Growing appetite — proper portions. Can handle mild spice. Examples: pasta, egg fried rice, stuffed sandwich, simple curry with roti.',
    };

    const modeInstr = isForKids
      ? `The PARENT cooks this FOR the child. Adult does all cooking. Focus on nutrition, hidden veg, quick prep, child-friendly presentation. Child just eats — make them love it.`
      : `The CHILD cooks this THEMSELVES. Only age-safe techniques. ${ageGroup === 'toddler' ? 'No heat — assembly only.' : ageGroup === 'kids' ? 'No sharp knives or frying. Mixing, spreading, assembling.' : 'Simple stovetop ok with adult nearby.'} Make the process fun and achievable.`;

    const prompt = `You are an expert child nutritionist and kids cooking educator.

${modeInstr}

Age group: ${ag?.label} (${ag?.range})
${safetyRules[ageGroup] || ''}
Meal type: ${mt?.label}
Recipes needed: ${count} — each COMPLETELY DIFFERENT from the others
Serves: ${servings}
Dietary: ${dietLabel}
${allergies}
Spice: ${kidsSpice}
${cuisineCtx}

STRICT RULE: Do NOT suggest Dal Tadka, plain Jeera Rice, or any generic everyday dish. Be creative and varied — think of something a child would actually get excited about.

Respond ONLY with valid JSON, no markdown:
{"meals":[{"name":"Rainbow Veggie Pancakes 🥞","emoji":"🥞","description":"Fluffy colourful pancakes with hidden carrots","time":"20 mins","difficulty":"Easy","servings":"${servings}","ingredients":["1 cup wheat flour","1 grated carrot"],"steps":["Mix all into batter.","Cook on non-stick pan."],"calories":"210 kcal","protein":"7g","fun_fact":"Carrots have beta-carotene that keeps your eyes sharp!"}]}`;

    try {
      const res = await fetch('/api/suggest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ingredients: [],
          time: '30 minutes',
          diet: dietLabel,
          cuisine: prefCuisines[0] || 'indian',
          mealType,
          defaultServings: servings,
          count,
          language: lang,
          kidsMode: true,
          kidsPromptOverride: prompt,
        }),
      });
      const data = await res.json();
      const meals = Array.isArray(data.meals) ? data.meals : Array.isArray(data) ? data : null;
      if (meals && meals.length) { setMeals(meals); }
      else { setError('Could not generate recipes. Please try again.'); }
    } catch { setError('Connection error. Please try again.'); }
    finally   { setLoading(false); }
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
            👶 Kids Meals
          </div>
          <div style={{ fontSize:11, color:C.muted, fontWeight:300 }}>
            {mode==='for' ? 'Recipes parents cook for their children' : 'Simple recipes kids can make themselves'}
          </div>
        </div>
        <div style={{display:'flex',gap:8,alignItems:'center'}}>
          <button onClick={() => navigate('/planner')}
            style={{ padding:'6px 14px', borderRadius:20, border:'1.5px solid rgba(28,10,0,0.15)',
              background:'white', fontSize:12, cursor:'pointer', color:C.muted, fontFamily:"'DM Sans',sans-serif" }}>
            📅 Week Plan
          </button>
          <button onClick={() => navigate('/plans')}
            style={{ padding:'6px 14px', borderRadius:20, border:'1.5px solid rgba(28,10,0,0.15)',
              background:'white', fontSize:12, cursor:'pointer', color:C.muted, fontFamily:"'DM Sans',sans-serif" }}>
            🎯 Goal Plan
          </button>
          <button onClick={() => navigate('/app')}
            style={{ padding:'6px 14px', borderRadius:20, border:'1.5px solid rgba(28,10,0,0.15)',
              background:'white', fontSize:12, cursor:'pointer', color:C.muted, fontFamily:"'DM Sans',sans-serif" }}>
            ← Back to App
          </button>
        </div>
      </div>

      <div style={{ maxWidth:680, margin:'0 auto', padding:'28px 20px' }}>
        {/* Mode toggle — what kind of recipes? */}
        <div style={{ background:'white', border:'1px solid '+C.border, borderRadius:20,
          padding:'16px 22px', marginBottom:16, boxShadow:C.shadow }}>
          <div style={{ fontSize:11, letterSpacing:'2px', textTransform:'uppercase',
            color:C.jiff, fontWeight:500, marginBottom:12 }}>What are you looking for?</div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
            <button onClick={()=>{setMode('for');setMeals(null);}}
              style={{ padding:'14px 16px', borderRadius:14, cursor:'pointer', textAlign:'left',
                border:'2px solid '+(mode==='for'?C.jiff:C.border),
                background:mode==='for'?'rgba(255,69,0,0.05)':'white',
                transition:'all 0.15s', fontFamily:"'DM Sans',sans-serif" }}>
              <div style={{ fontSize:22, marginBottom:4 }}>👩‍🍳</div>
              <div style={{ fontSize:13, fontWeight:600, color:mode==='for'?C.jiff:C.ink }}>Cook for your child</div>
              <div style={{ fontSize:11, color:C.muted, fontWeight:300, marginTop:3 }}>
                Nutritious recipes a parent cooks and serves
              </div>
            </button>
            <button onClick={()=>{setMode('with');setMeals(null);}}
              style={{ padding:'14px 16px', borderRadius:14, cursor:'pointer', textAlign:'left',
                border:'2px solid '+(mode==='with'?C.purple:C.border),
                background:mode==='with'?'rgba(124,58,237,0.05)':'white',
                transition:'all 0.15s', fontFamily:"'DM Sans',sans-serif" }}>
              <div style={{ fontSize:22, marginBottom:4 }}>👦</div>
              <div style={{ fontSize:13, fontWeight:600, color:mode==='with'?C.purple:C.ink }}>Your child wants to cook</div>
              <div style={{ fontSize:11, color:C.muted, fontWeight:300, marginTop:3 }}>
                Simple age-appropriate recipes kids make themselves
              </div>
            </button>
          </div>
        </div>


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
            {/* Video + Order */}
            <div style={{ display:'flex', gap:8, marginTop:12, flexWrap:'wrap' }}>
              <VideoButton recipeName={meal.name||''} cuisine="kids" compact={true}/>
              <a href={`https://www.swiggy.com/search?query=${encodeURIComponent(meal.name||'')}`}
                target="_blank" rel="noopener noreferrer"
                style={{ padding:'6px 12px', borderRadius:8, border:'1px solid rgba(252,128,25,0.2)', background:'rgba(252,128,25,0.05)', color:'#FC8019', fontSize:11, fontWeight:500, textDecoration:'none' }}>
                🛵 Order
              </a>
            </div>
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
