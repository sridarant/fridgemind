// src/pages/SacredKitchen.jsx — Sacred Kitchen: temple, prasadam & sacred recipes
// Inclusive of all traditions: Hindu temples, Golden Temple langar, dargah, church, etc.

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth }    from '../contexts/AuthContext';
import { useLocale }  from '../contexts/LocaleContext';
import { usePremium } from '../contexts/PremiumContext';

const C = {
  jiff:'#FF4500', ink:'#1C0A00', cream:'#FFFAF5', warm:'#FFF0E5',
  muted:'#7C6A5E', border:'rgba(28,10,0,0.10)', shadow:'0 4px 24px rgba(28,10,0,0.08)',
  green:'#1D9E75', gold:'#B8860B', purple:'#6D4C8C',
};

const TRADITIONS = [
  { id:'tirupati',   label:'Tirupati',        emoji:'🍮', note:'Ladoo, pulihora, chakraponkala — Balaji prasadam' },
  { id:'golden',     label:'Golden Temple',   emoji:'🫓', note:'Kada prasad, langar dal, roti — Waheguru ka prasad' },
  { id:'puri',       label:'Puri Jagannath',  emoji:'🍚', note:'Mahaprasad — 56 bhog offerings of Jagannath' },
  { id:'shirdi',     label:'Shirdi Sai',      emoji:'🥛', note:'Aloo bhaji, rice, dal — Sai Baba naivedyam' },
  { id:'church',     label:'Church / Chapel', emoji:'🍞', note:'Communion bread, feast day sweets across traditions' },
  { id:'dargah',     label:'Dargah / Eid',    emoji:'🍲', note:'Sheer khurma, zarda, halwa — blessed community food' },
  { id:'onam',       label:'Onam Sadya',      emoji:'🍌', note:'Avial, sambar, payasam — 26-dish banana leaf feast' },
  { id:'navratri',   label:'Navratri Fast',   emoji:'🌸', note:'Sabudana khichdi, kuttu puri, singhara halwa' },
  { id:'christmas',  label:'Christmas',       emoji:'🎄', note:'Plum cake, rose cookies, appam, vegetable stew' },
  { id:'community',  label:'Community Feast', emoji:'🤝', note:'Annadanam — free community meal, any tradition' },
];

const OCCASION_TYPES = [
  { id:'prasadam',    label:'Prasadam / Naivedyam', desc:'Blessed offering to the divine' },
  { id:'fasting',     label:'Fasting Food',          desc:'Vrat-friendly, no grain or allium' },
  { id:'feast',       label:'Community Feast',       desc:'Langar, sadya, annadanam' },
  { id:'celebration', label:'Festival Sweet',        desc:'Mithai and desserts for occasions' },
];

export default function SacredKitchen() {
  const navigate  = useNavigate();
  const { user, profile } = useAuth();
  const { lang }  = useLocale();
  const { isPremium } = usePremium();

  const [tradition,  setTradition]  = useState('tirupati');
  const [occasion,   setOccasion]   = useState('prasadam');
  const [servings,   setServings]   = useState(4);
  const [satvik,     setSatvik]     = useState(false);
  const [meals,      setMeals]      = useState(null);
  const [loading,    setLoading]    = useState(false);
  const [error,      setError]      = useState('');
  const [videoData,  setVideoData]  = useState({});

  useEffect(() => { if (!user) navigate('/app'); }, [user, navigate]);

  const trad  = TRADITIONS.find(t => t.id === tradition);
  const occ   = OCCASION_TYPES.find(o => o.id === occasion);
  const count = isPremium ? 3 : 1;

  const generate = async () => {
    if (!user) { navigate('/app'); return; }
    setLoading(true); setError(''); setMeals(null);

    const dietContext = profile?.food_type
      ? (Array.isArray(profile.food_type) ? profile.food_type.join(', ') : profile.food_type)
      : 'vegetarian';

    const satvik_rule = satvik
      ? 'SATVIK MODE: strictly no onion, no garlic, no meat, no eggs, no non-vegetarian items. Only pure satvik ingredients.'
      : '';

    const prompt = `You are an expert in sacred and traditional Indian food across all religious traditions.

Generate ${count} authentic ${occ?.label} recipe(s) associated with ${trad?.label} tradition.
Context: ${trad?.note}
Occasion: ${occ?.desc}
Servings: ${servings}
Diet: ${dietContext}
${satvik_rule}

IMPORTANT: These should be genuinely authentic recipes that are traditionally offered/served in this context — not generic Indian food. Research the specific prasadam/bhog/langar associated with this tradition.

Respond ONLY with valid JSON:
{"meals":[{
  "name": "Tirupati Ladoo",
  "emoji": "🍮",
  "description": "The famous besan ladoo offered as prasadam at Tirumala temple",
  "tradition": "${trad?.label}",
  "significance": "1-2 sentences on the spiritual/cultural significance of this dish",
  "time": "45 mins",
  "difficulty": "Medium",
  "servings": "${servings}",
  "ingredients": ["2 cups besan", "1 cup ghee"],
  "steps": ["Roast besan in ghee on low flame for 20 minutes until fragrant.", "Add sugar and cardamom."],
  "calories": "280 kcal",
  "protein": "6g",
  "fun_fact": "Tirupati temple prepares over 100,000 ladoos daily using a 300-year-old recipe."
}]}`;

    try {
      const res = await fetch('/api/suggest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ingredients:[], diet: dietContext, count, language: lang, kidsMode: true, kidsPromptOverride: prompt }),
      });
      const data = await res.json();
      const result = Array.isArray(data.meals) ? data.meals : Array.isArray(data) ? data : null;
      if (result?.length) setMeals(result);
      else setError('Could not generate recipes. Please try again.');
    } catch { setError('Connection error. Please try again.'); }
    finally { setLoading(false); }
  };

  const fetchVideo = async (meal) => {
    if (videoData[meal.name]) return;
    try {
      const res = await fetch(`/api/videos?recipe=${encodeURIComponent(meal.name)}&cuisine=Indian&lang=${lang}`);
      const data = await res.json();
      if (data.videos?.length) setVideoData(prev => ({ ...prev, [meal.name]: data.videos[0] }));
    } catch {}
  };

  return (
    <div style={{ minHeight:'100vh', background:C.cream, fontFamily:"'DM Sans',sans-serif" }}>
      <link href="https://fonts.googleapis.com/css2?family=Fraunces:wght@700;900&family=DM+Sans:wght@300;400;500&display=swap" rel="stylesheet"/>

      {/* Header */}
      <div style={{ padding:'14px 28px', borderBottom:'1px solid '+C.border, background:'white', display:'flex', alignItems:'center', justifyContent:'space-between', position:'sticky', top:0, zIndex:10, boxShadow:'0 2px 8px rgba(28,10,0,0.04)' }}>
        <div>
          <div style={{ fontFamily:"'Fraunces',serif", fontSize:22, fontWeight:900, color:C.ink }}>✨ Sacred Kitchen</div>
          <div style={{ fontSize:11, color:C.muted, fontWeight:300 }}>Authentic recipes from sacred traditions worldwide</div>
        </div>
        <div style={{ display:'flex', gap:8 }}>
          <button onClick={() => navigate('/little-chefs')} style={{ padding:'6px 14px', borderRadius:20, border:'1.5px solid '+C.border, background:'white', fontSize:12, cursor:'pointer', color:C.muted }}>👶 Kids Meals</button>
          <button onClick={() => navigate('/app')} style={{ padding:'6px 14px', borderRadius:20, border:'1.5px solid '+C.border, background:'white', fontSize:12, cursor:'pointer', color:C.muted }}>← Back to app</button>
        </div>
      </div>

      <div style={{ maxWidth:700, margin:'0 auto', padding:'28px 20px' }}>

        {/* Tradition selector */}
        <div style={{ background:'white', border:'1px solid '+C.border, borderRadius:20, padding:'20px 22px', marginBottom:16, boxShadow:C.shadow }}>
          <div style={{ fontSize:11, letterSpacing:'2px', textTransform:'uppercase', color:C.gold, fontWeight:500, marginBottom:14 }}>Select Tradition</div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(130px,1fr))', gap:8 }}>
            {TRADITIONS.map(t => (
              <button key={t.id} onClick={() => { setTradition(t.id); setMeals(null); }}
                style={{ padding:'10px 10px', borderRadius:12, cursor:'pointer', textAlign:'left', border:'2px solid '+(tradition===t.id ? C.gold : C.border), background:tradition===t.id ? 'rgba(184,134,11,0.06)' : 'white', transition:'all 0.15s' }}>
                <div style={{ fontSize:20, marginBottom:3 }}>{t.emoji}</div>
                <div style={{ fontSize:11, fontWeight:600, color:tradition===t.id ? C.gold : C.ink }}>{t.label}</div>
              </button>
            ))}
          </div>
          {trad && <div style={{ marginTop:12, padding:'8px 12px', background:'rgba(184,134,11,0.06)', borderRadius:8, fontSize:11, color:C.gold }}>{trad.note}</div>}
        </div>

        {/* Occasion + settings */}
        <div style={{ background:'white', border:'1px solid '+C.border, borderRadius:20, padding:'20px 22px', marginBottom:16, boxShadow:C.shadow }}>
          <div style={{ fontSize:11, letterSpacing:'2px', textTransform:'uppercase', color:C.gold, fontWeight:500, marginBottom:12 }}>Occasion Type</div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginBottom:16 }}>
            {OCCASION_TYPES.map(o => (
              <button key={o.id} onClick={() => { setOccasion(o.id); setMeals(null); }}
                style={{ padding:'12px 14px', borderRadius:12, cursor:'pointer', textAlign:'left', border:'2px solid '+(occasion===o.id ? C.gold : C.border), background:occasion===o.id ? 'rgba(184,134,11,0.06)' : 'white', transition:'all 0.15s' }}>
                <div style={{ fontSize:12, fontWeight:600, color:occasion===o.id ? C.gold : C.ink }}>{o.label}</div>
                <div style={{ fontSize:10, color:C.muted, marginTop:2 }}>{o.desc}</div>
              </button>
            ))}
          </div>

          {/* Servings + Satvik toggle */}
          <div style={{ display:'flex', gap:16, alignItems:'center', flexWrap:'wrap' }}>
            <div>
              <div style={{ fontSize:11, letterSpacing:'2px', textTransform:'uppercase', color:C.muted, fontWeight:500, marginBottom:8 }}>Serves</div>
              <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                <button onClick={() => setServings(s => Math.max(1,s-1))} style={{ width:28, height:28, borderRadius:'50%', border:'1.5px solid '+C.border, background:'white', cursor:'pointer', fontSize:16 }}>−</button>
                <span style={{ fontWeight:600, fontSize:18, minWidth:24, textAlign:'center' }}>{servings}</span>
                <button onClick={() => setServings(s => Math.min(50,s+1))} style={{ width:28, height:28, borderRadius:'50%', border:'1.5px solid '+C.border, background:'white', cursor:'pointer', fontSize:16 }}>+</button>
              </div>
            </div>
            <div style={{ flex:1, borderLeft:'1px solid '+C.border, paddingLeft:16 }}>
              <div style={{ fontSize:11, letterSpacing:'2px', textTransform:'uppercase', color:C.muted, fontWeight:500, marginBottom:8 }}>Satvik Mode (opt-in)</div>
              <button onClick={() => setSatvik(s => !s)} style={{ display:'flex', alignItems:'center', gap:10, padding:'8px 14px', borderRadius:12, border:'2px solid '+(satvik ? C.gold : C.border), background:satvik ? 'rgba(184,134,11,0.06)' : 'white', cursor:'pointer', transition:'all 0.15s' }}>
                <span style={{ fontSize:16 }}>🌿</span>
                <div style={{ textAlign:'left' }}>
                  <div style={{ fontSize:12, fontWeight:600, color:satvik ? C.gold : C.ink }}>Satvik food</div>
                  <div style={{ fontSize:10, color:C.muted }}>No onion, garlic, meat or eggs</div>
                </div>
                <div style={{ marginLeft:'auto', width:20, height:20, borderRadius:'50%', background:satvik ? C.gold : C.border, display:'flex', alignItems:'center', justifyContent:'center' }}>
                  {satvik && <span style={{ fontSize:10, color:'white' }}>✓</span>}
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* Generate button */}
        <button onClick={generate} disabled={loading}
          style={{ width:'100%', padding:'16px', borderRadius:16, background:loading ? C.border : `linear-gradient(135deg, ${C.gold}, #8B6914)`, color:loading ? C.muted : 'white', border:'none', fontSize:15, fontWeight:700, cursor:loading ? 'not-allowed' : 'pointer', marginBottom:16, transition:'all 0.2s', boxShadow:loading ? 'none' : '0 4px 16px rgba(184,134,11,0.35)' }}>
          {loading ? '⏳ Finding sacred recipes…' : `✨ Generate ${count} Sacred Recipe${count>1?'s':''}`}
        </button>

        {error && <div style={{ padding:'12px 16px', background:'rgba(229,62,62,0.08)', border:'1px solid rgba(229,62,62,0.2)', borderRadius:12, fontSize:13, color:'#C53030', marginBottom:16 }}>{error}</div>}

        {/* Results */}
        {meals?.map((meal, i) => (
          <SacredMealCard key={i} meal={meal} servings={servings} video={videoData[meal.name]} onFetchVideo={() => fetchVideo(meal)} />
        ))}
      </div>
    </div>
  );
}

function SacredMealCard({ meal, servings, video, onFetchVideo }) {
  const [expanded,   setExpanded]   = useState(false);
  const [videoOpen,  setVideoOpen]  = useState(false);
  const [videoFetched, setVideoFetched] = useState(false);
  const [speaking,   setSpeaking]   = useState(false);

  const handleVideoClick = () => {
    if (!videoFetched) { onFetchVideo(); setVideoFetched(true); }
    setVideoOpen(v => !v);
  };

  const readAloud = () => {
    if ('speechSynthesis' in window) {
      if (speaking) { window.speechSynthesis.cancel(); setSpeaking(false); return; }
      const steps = meal.steps?.map((s,i) => `Step ${i+1}: ${s}`).join('. ') || '';
      const text  = `${meal.name}. ${meal.description}. Ingredients: ${meal.ingredients?.join(', ')}. Instructions: ${steps}`;
      const utt   = new SpeechSynthesisUtterance(text);
      utt.onend = () => setSpeaking(false);
      window.speechSynthesis.speak(utt);
      setSpeaking(true);
    }
  };

  return (
    <div style={{ background:'white', border:'1px solid '+C.border, borderRadius:20, marginBottom:16, boxShadow:C.shadow, overflow:'hidden' }}>
      {/* Top accent bar */}
      <div style={{ height:3, background:`linear-gradient(90deg, ${C.gold}, #D4A82A)` }}/>

      <div style={{ padding:'18px 20px' }}>
        <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:12, marginBottom:8 }}>
          <div style={{ flex:1 }}>
            <div style={{ fontFamily:"'Fraunces',serif", fontSize:18, fontWeight:700, color:C.ink, marginBottom:3 }}>
              {meal.emoji} {meal.name}
            </div>
            <div style={{ fontSize:12, color:C.gold, fontWeight:500, marginBottom:6 }}>
              {meal.tradition && `✨ ${meal.tradition}`}
            </div>
            <div style={{ fontSize:12, color:C.muted, fontWeight:300, lineHeight:1.6 }}>{meal.description}</div>
          </div>
        </div>

        {/* Significance */}
        {meal.significance && (
          <div style={{ padding:'10px 14px', background:'rgba(184,134,11,0.06)', border:'1px solid rgba(184,134,11,0.15)', borderRadius:10, fontSize:12, color:'#6B4F0A', fontStyle:'italic', marginBottom:12, lineHeight:1.6 }}>
            🙏 {meal.significance}
          </div>
        )}

        {/* Meta row */}
        <div style={{ display:'flex', gap:12, flexWrap:'wrap', marginBottom:12 }}>
          {[['⏱',meal.time],['👥',`${servings} servings`],['📊',meal.difficulty],['🔥',meal.calories]].map(([icon,val],i)=>(
            val && <span key={i} style={{ fontSize:11, color:C.muted, display:'flex', alignItems:'center', gap:3 }}><span>{icon}</span>{val}</span>
          ))}
        </div>

        {/* Action buttons */}
        <div style={{ display:'flex', gap:8, flexWrap:'wrap', marginBottom:expanded?16:0 }}>
          <button onClick={() => setExpanded(e => !e)} style={{ padding:'7px 14px', borderRadius:10, border:'1.5px solid '+C.border, background:'white', fontSize:12, cursor:'pointer', color:C.ink, fontWeight:500 }}>
            {expanded ? '▲ Hide recipe' : '▼ View recipe'}
          </button>
          <button onClick={handleVideoClick} style={{ padding:'7px 14px', borderRadius:10, border:'1.5px solid rgba(255,0,0,0.2)', background:'rgba(255,0,0,0.05)', fontSize:12, cursor:'pointer', color:'#CC0000', fontWeight:500 }}>
            ▶ Watch video
          </button>
          <button onClick={readAloud} style={{ padding:'7px 14px', borderRadius:10, border:'1.5px solid '+C.border, background:speaking ? 'rgba(255,69,0,0.06)' : 'white', fontSize:12, cursor:'pointer', color:speaking ? C.jiff : C.muted }}>
            {speaking ? '⏹ Stop' : '🔊 Read aloud'}
          </button>
        </div>

        {/* Video embed */}
        {videoOpen && video && (
          <div style={{ marginTop:12, borderRadius:12, overflow:'hidden', border:'1px solid '+C.border }}>
            <iframe src={video.embedUrl} title={video.title} width="100%" height="220" frameBorder="0" allowFullScreen style={{ display:'block' }} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"/>
            <div style={{ padding:'8px 12px', background:C.warm, fontSize:11, color:C.muted }}>{video.title} — {video.channel}</div>
          </div>
        )}
        {videoOpen && !video && (
          <div style={{ marginTop:12, padding:'12px', background:C.warm, borderRadius:10, fontSize:12, color:C.muted, textAlign:'center' }}>Searching for video…</div>
        )}

        {/* Expanded recipe */}
        {expanded && (
          <div style={{ borderTop:'1px solid '+C.border, paddingTop:16 }}>
            <div style={{ fontSize:12, fontWeight:500, color:C.ink, marginBottom:8 }}>Ingredients</div>
            <ul style={{ paddingLeft:0, margin:'0 0 16px', listStyle:'none' }}>
              {meal.ingredients?.map((ing,i) => (
                <li key={i} style={{ fontSize:12, color:C.muted, padding:'4px 0', borderBottom:'1px solid rgba(28,10,0,0.04)', display:'flex', alignItems:'center', gap:8 }}>
                  <span style={{ color:C.gold, fontSize:10 }}>●</span> {ing}
                </li>
              ))}
            </ul>
            <div style={{ fontSize:12, fontWeight:500, color:C.ink, marginBottom:8 }}>Method</div>
            <ol style={{ paddingLeft:16, margin:'0 0 16px' }}>
              {meal.steps?.map((s,i) => (
                <li key={i} style={{ fontSize:12, color:C.muted, marginBottom:8, lineHeight:1.6 }}>{s}</li>
              ))}
            </ol>
            {meal.fun_fact && (
              <div style={{ padding:'10px 14px', background:'rgba(109,76,140,0.06)', border:'1px solid rgba(109,76,140,0.15)', borderRadius:10, fontSize:12, color:C.purple, lineHeight:1.6 }}>
                💡 {meal.fun_fact}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
