// src/pages/Planner.jsx — Week Planner v17
// Uses profile preferences; no fridge/pantry input; multi-cuisine ratio selection
import { useState, useRef, useEffect } from 'react';
import { MealSlot, GrocerySection, CuisineRatioSelector } from '../components/planner/PlannerComponents.jsx';
import { useNavigate } from 'react-router-dom';
import { useLocale } from '../contexts/LocaleContext';
import { useAuth }   from '../contexts/AuthContext';


// ── Components + helpers → src/components/planner/PlannerComponents.jsx ──

// ── Main component ─────────────────────────────────────────────────
const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,wght@0,700;0,900;1,700&family=DM+Sans:wght@300;400;500&display=swap');
  *{box-sizing:border-box;margin:0;padding:0;}
  body{background:#FFFAF5;}
  .page{min-height:100vh;background:#FFFAF5;font-family:'DM Sans',sans-serif;color:#1C0A00;}
  .header{display:flex;align-items:center;justify-content:space-between;padding:14px 28px;border-bottom:1px solid rgba(28,10,0,0.08);position:sticky;top:0;z-index:10;background:rgba(255,250,245,0.95);backdrop-filter:blur(12px);}
  .logo{display:flex;align-items:center;gap:6px;cursor:pointer;}
  .logo-name{font-family:'Fraunces',serif;font-size:20px;font-weight:900;color:#1C0A00;}
  .nav-links{display:flex;align-items:center;gap:8px;margin-left:auto;}
  .nav-link{padding:7px 14px;border-radius:8px;font-size:12px;font-family:'DM Sans',sans-serif;cursor:pointer;border:1.5px solid rgba(28,10,0,0.15);background:white;color:#7C6A5E;transition:all 0.15s;}
  .nav-link:hover,.nav-link.active{background:#1C0A00;color:white;border-color:#1C0A00;}
  .hero{text-align:center;padding:48px 24px 24px;max-width:600px;margin:0 auto;}
  .hero-eyebrow{font-size:11px;letter-spacing:2.5px;text-transform:uppercase;color:#FF4500;font-weight:500;margin-bottom:10px;}
  .hero-title{font-family:'Fraunces',serif;font-size:clamp(28px,5vw,44px);font-weight:900;color:#1C0A00;letter-spacing:-1.5px;line-height:1.05;margin-bottom:10px;}
  .hero-title em{font-style:italic;color:#FF4500;}
  .hero-sub{font-size:14px;color:#7C6A5E;font-weight:300;line-height:1.6;}
  .card{background:white;border:1px solid rgba(28,10,0,0.08);border-radius:20px;padding:22px;box-shadow:0 4px 24px rgba(28,10,0,0.06);max-width:860px;margin:0 auto 24px;}
  .section{margin-bottom:18px;}
  .section:last-child{margin-bottom:0;}
  .section-label{font-size:11px;letter-spacing:2px;text-transform:uppercase;color:#FF4500;font-weight:500;margin-bottom:10px;display:flex;align-items:center;gap:8px;}
  .section-label::after{content:'';flex:1;height:1px;background:rgba(28,10,0,0.08);}
  .meal-type-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:9px;}
  @media(min-width:480px){.meal-type-grid{grid-template-columns:repeat(4,1fr);}}
  .meal-type-toggle{border:1.5px solid rgba(28,10,0,0.14);border-radius:12px;padding:12px;cursor:pointer;display:flex;flex-direction:column;align-items:center;gap:5px;transition:all 0.15s;background:white;}
  .meal-type-toggle.selected{box-shadow:0 3px 10px rgba(0,0,0,0.08);}
  .meal-type-toggle-emoji{font-size:22px;}
  .meal-type-toggle-label{font-size:12px;font-weight:500;}
  .meal-type-toggle-check{width:16px;height:16px;border-radius:50%;border:1.5px solid rgba(28,10,0,0.2);display:flex;align-items:center;justify-content:center;transition:all 0.15s;margin-top:2px;}
  .servings-time-row{display:grid;grid-template-columns:1fr 1fr;gap:12px;}
  @media(max-width:480px){.servings-time-row{grid-template-columns:1fr;}}
  .serving-controls{display:flex;align-items:center;gap:8px;}
  .serving-btn{width:30px;height:30px;border-radius:8px;border:1.5px solid rgba(28,10,0,0.18);background:white;font-size:18px;cursor:pointer;display:flex;align-items:center;justify-content:center;color:#FF4500;transition:all 0.1s;}
  .serving-btn:disabled{opacity:0.35;cursor:not-allowed;}
  .serving-count{font-size:16px;font-weight:500;min-width:24px;text-align:center;}
  .chips{display:flex;flex-wrap:wrap;gap:7px;}
  .chip{border:1.5px solid rgba(28,10,0,0.18);border-radius:20px;padding:5px 14px;font-size:12px;cursor:pointer;transition:all 0.15s;font-family:'DM Sans',sans-serif;background:white;color:#7C6A5E;}
  .chip.active{background:#FF4500;border-color:#FF4500;color:white;font-weight:500;}
  .cta-btn{background:#FF4500;color:white;border:none;border-radius:14px;padding:14px 36px;font-size:15px;font-family:'DM Sans',sans-serif;font-weight:500;cursor:pointer;transition:all 0.2s;display:inline-flex;align-items:center;gap:10px;}
  .cta-btn:hover:not(:disabled){background:#CC3700;transform:translateY(-2px);box-shadow:0 8px 28px rgba(255,69,0,0.35);}
  .cta-btn:disabled{opacity:0.55;cursor:not-allowed;}
  .cta-wrap{text-align:center;padding-top:4px;}
  .cta-note{font-size:12px;color:#7C6A5E;margin-top:8px;text-align:center;}
  .loading-wrap{text-align:center;padding:60px 24px;max-width:500px;margin:0 auto;}
  .loading-title{font-family:'Fraunces',serif;font-size:26px;font-weight:900;color:#1C0A00;margin-bottom:8px;}
  .loading-sub{font-size:13px;color:#7C6A5E;font-weight:300;margin-bottom:32px;}
  .loading-days{display:flex;gap:6px;justify-content:center;flex-wrap:wrap;}
  .loading-day{width:36px;height:36px;border-radius:10px;border:1.5px solid rgba(28,10,0,0.12);display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:500;color:#7C6A5E;transition:all 0.3s;}
  .loading-day.done{background:#1C0A00;color:white;border-color:#1C0A00;}
  .results-wrap{max-width:1100px;margin:0 auto;padding:24px 20px;}
  .plan-header{display:flex;align-items:center;justify-content:space-between;margin-bottom:20px;flex-wrap:wrap;gap:10px;}
  .plan-title{font-family:'Fraunces',serif;font-size:22px;font-weight:900;color:#1C0A00;letter-spacing:-0.5px;}
  .plan-sub{font-size:12px;color:#7C6A5E;font-weight:300;margin-top:2px;}
  .plan-actions{display:flex;gap:8px;flex-wrap:wrap;}
  .plan-btn{padding:7px 14px;border-radius:8px;font-size:12px;font-family:'DM Sans',sans-serif;cursor:pointer;border:1.5px solid rgba(28,10,0,0.15);background:white;color:#1C0A00;display:flex;align-items:center;gap:5px;transition:all 0.15s;}
  .plan-btn:hover{background:#1C0A00;color:white;border-color:#1C0A00;}
  .plan-btn.secondary{background:white;}
  .plan-btn.grocery{background:#FF4500;color:white;border-color:#FF4500;}
  .plan-btn.grocery:hover{background:#CC3700;}
  .days-tabs{display:flex;gap:4px;overflow-x:auto;padding-bottom:4px;margin-bottom:16px;scrollbar-width:none;}
  .days-tabs::-webkit-scrollbar{display:none;}
  .day-tab{flex-shrink:0;padding:6px 14px;border-radius:8px;font-size:12px;font-family:'DM Sans',sans-serif;cursor:pointer;border:1.5px solid rgba(28,10,0,0.12);background:white;color:#7C6A5E;transition:all 0.15s;font-weight:400;}
  .day-tab.active{background:#1C0A00;color:white;border-color:#1C0A00;font-weight:500;}
  .day-meals-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:12px;margin-bottom:16px;}
  .meal-slot-card{background:white;border:1px solid rgba(28,10,0,0.08);border-radius:14px;padding:14px;box-shadow:0 2px 8px rgba(28,10,0,0.04);}
  .meal-slot-type{font-size:9px;letter-spacing:2px;text-transform:uppercase;font-weight:500;margin-bottom:6px;}
  .error-wrap{text-align:center;padding:48px 24px;max-width:400px;margin:0 auto;}
  .error-title{font-family:'Fraunces',serif;font-size:22px;font-weight:900;color:#1C0A00;margin-bottom:8px;}
  .error-msg{font-size:13px;color:#7C6A5E;margin-bottom:20px;}
  .profile-redirect{background:rgba(255,69,0,0.06);border:1.5px solid rgba(255,69,0,0.2);border-radius:14px;padding:20px 22px;text-align:center;margin:32px auto;max-width:480px;}
  .grocery-panel-wide{max-width:1100px;margin:0 auto 48px;padding:0 20px;}
  .grocery-card{background:white;border:1px solid rgba(28,10,0,0.08);border-radius:18px;overflow:hidden;box-shadow:0 4px 24px rgba(28,10,0,0.06);}
  .grocery-card-hdr{background:#1C0A00;padding:18px 22px;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:10px;}
  .grocery-card-title{font-family:'Fraunces',serif;font-size:18px;font-weight:900;color:white;letter-spacing:-0.3px;}
  .grocery-card-sub{font-size:12px;color:rgba(255,255,255,0.5);margin-top:2px;}
  .grocery-grid-wide{display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));}
  .grocery-category{padding:14px 18px;border-right:1px solid rgba(28,10,0,0.06);border-bottom:1px solid rgba(28,10,0,0.06);}
  .grocery-category:nth-child(odd){background:rgba(255,250,245,0.6);}
  .grocery-cat-title{font-size:9px;letter-spacing:2px;text-transform:uppercase;font-weight:600;color:#FF4500;margin-bottom:9px;}
  .grocery-item-row{display:flex;align-items:center;gap:7px;padding:4px 0;border-bottom:1px solid rgba(0,0,0,0.04);cursor:pointer;}
  .grocery-item-row:last-child{border-bottom:none;}
  .g-checkbox{width:14px;height:14px;border-radius:3px;border:1.5px solid rgba(28,10,0,0.25);flex-shrink:0;display:flex;align-items:center;justify-content:center;transition:all 0.15s;}
  .g-checkbox.checked{background:#1D9E75;border-color:#1D9E75;}
  .g-checkbox.checked svg{display:block;}
  .g-checkbox svg{display:none;width:8px;height:8px;stroke:white;stroke-width:2.5;}
  .g-item-text{font-size:12px;font-weight:300;flex:1;line-height:1.4;}
  .g-item-text.done{text-decoration:line-through;color:#B0A097;}
  .g-action-btn{padding:7px 14px;border-radius:8px;font-size:12px;font-family:'DM Sans',sans-serif;cursor:pointer;display:flex;align-items:center;gap:5px;border:none;font-weight:500;transition:all 0.15s;}
  .g-action-btn.copy{background:rgba(255,250,245,0.1);color:white;border:1.5px solid rgba(255,250,245,0.2);}
  .g-action-btn.wa{background:#25D366;color:white;}
  @media(max-width:768px){
    .header{padding:12px 16px;}
    .hero{padding:32px 16px 16px;}
    .card{margin:0 12px 20px;padding:16px;}
    .grocery-grid-wide{grid-template-columns:1fr;}
    .day-meals-grid{grid-template-columns:1fr 1fr;}
  }
`;

export default function Planner() {
  const navigate = useNavigate();
  const { profile, pantry } = useAuth();
  const { country } = useLocale();

  // Check profile completeness
  const hasProfile = profile && (profile.preferred_cuisines?.length || profile.food_type?.length || pantry?.length);

  const [servings,      setServings]      = useState(2);
  const [selectedTypes, setSelectedTypes] = useState(['breakfast','lunch','dinner']);
  const [view,          setView]          = useState('input');
  const [plan,          setPlan]          = useState(null);
  const [loadingDay,    setLoadingDay]    = useState(0);
  const [activeDay,     setActiveDay]     = useState(0);
  const [showGrocery,   setShowGrocery]   = useState(false);
  const [errorMsg,      setErrorMsg]      = useState('');
  const timerRef = useRef(null);
  const [loadElapsed,  setLoadElapsed]   = useState(0);

  // Multi-cuisine ratio
  const cuisines = profile?.preferred_cuisines?.length ? profile.preferred_cuisines : ['any'];
  const [cuisineRatio, setCuisineRatio] = useState(() => {
    if (!profile?.preferred_cuisines?.length) return {};
    const even = Math.floor(7 / profile.preferred_cuisines.length);
    const r = {};
    profile.preferred_cuisines.forEach((c, i) => {
      r[c] = i === 0 ? 7 - even * (profile.preferred_cuisines.length - 1) : even;
    });
    return r;
  });

  const updateRatio = (cuisine, val) => setCuisineRatio(p => ({ ...p, [cuisine]: val }));
  const ratioTotal = Object.values(cuisineRatio).reduce((s,v)=>s+v,0);

  const toggleType = (id) => setSelectedTypes(prev =>
    prev.includes(id) ? prev.filter(t => t !== id) : [...prev, id]
  );

  const handleSubmit = async () => {
    if (selectedTypes.length === 0) return;
    setView('loading'); setErrorMsg(''); setPlan(null);
    try {
      const res = await fetch('/api/planner', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ingredients: pantry || [],
          mealTypes: selectedTypes,
          servings,
          cuisine: cuisines.join(', '),
          cuisineRatio,
          diet: Array.isArray(profile?.food_type) ? profile.food_type[0] : (profile?.food_type || 'none'),
          preferences: {
            spice_level: profile?.spice_level,
            allergies: profile?.allergies,
            skill_level: profile?.skill_level,
            preferred_cuisines: cuisines,
            diet_requirements: profile?.diet_requirements,
          },
        }),
      });
      const data = await res.json();
      if (res.ok && data.plan) { setPlan(data.plan); setView('results'); }
      else { setErrorMsg(data.error || 'Could not generate plan. Please try again.'); setView('error'); }
    } catch { setErrorMsg('Connection error. Please try again.'); setView('error'); }
  };

  useEffect(() => {
    if (view==='loading') {
      let d=0; timerRef.current=setInterval(()=>{d++;setLoadingDay(d);if(d>=7)clearInterval(timerRef.current);},1100);
      const startTs = Date.now();
      const elapsedT = setInterval(() => setLoadElapsed(Math.floor((Date.now()-startTs)/1000)), 1000);
      return () => { clearInterval(timerRef.current); clearInterval(elapsedT); setLoadElapsed(0); };
    }
    return ()=>clearInterval(timerRef.current);
  }, [view]);

  const mealCount = selectedTypes.length * 7;

  return (
    <>
      <style>{styles}</style>
      <div className="page">
        <header className="header">
          <div className="logo" onClick={()=>navigate('/')}>
            <span style={{fontSize:22}}>⚡</span>
            <span className="logo-name"><span style={{color:'#FF4500'}}>J</span>iff</span>
          </div>
          <div className="nav-links">
            <button className="nav-link" onClick={()=>navigate('/app')}>← Home</button>
          </div>
        </header>

        {/* No profile — redirect prompt */}
        {!hasProfile && (
          <div className="profile-redirect">
            <div style={{fontSize:32,marginBottom:12}}>👤</div>
            <div style={{fontFamily:"'Fraunces',serif",fontSize:18,fontWeight:900,color:'#1C0A00',marginBottom:6}}>Set up your profile first</div>
            <div style={{fontSize:13,color:'#7C6A5E',fontWeight:300,marginBottom:16,lineHeight:1.6}}>
              Week Plan uses your cuisine preferences and dietary settings to build your 7-day menu. Complete your profile to get started.
            </div>
            <button onClick={()=>navigate('/profile')} style={{background:'#FF4500',color:'white',border:'none',borderRadius:10,padding:'11px 24px',fontSize:13,fontWeight:500,cursor:'pointer',fontFamily:"'DM Sans',sans-serif"}}>
              Set up preferences →
            </button>
          </div>
        )}

        {hasProfile && view==='input' && (
          <>
            <div className="hero">
              <div className="hero-eyebrow">Plan once, eat well all week</div>
              <h1 className="hero-title">7 days.<br /><em>Your meals sorted.</em></h1>
              <p className="hero-sub">Jiff builds your entire week's menu from your preferences — cuisines, dietary needs, spice level and skill. No fridge input needed.</p>
            </div>
            <div className="card">
              {/* Meal type */}
              <div className="section">
                <div className="section-label">Which meals to plan?</div>
                <div className="meal-type-grid">
                  {MEAL_TYPE_OPTIONS.map(mt=>{
                    const sel=selectedTypes.includes(mt.id);
                    return(
                      <div key={mt.id} className={`meal-type-toggle ${sel?'selected':''}`}
                        style={sel?{borderColor:mt.color,background:mt.bg,color:mt.dark}:{}}
                        onClick={()=>toggleType(mt.id)}>
                        <span className="meal-type-toggle-emoji">{mt.emoji}</span>
                        <span className="meal-type-toggle-label">{mt.label}</span>
                        <div className="meal-type-toggle-check" style={sel?{borderColor:mt.color,background:mt.color}:{}}>
                          {sel&&<svg width="10" height="10" viewBox="0 0 12 12"><polyline points="10 2 5 9 2 6" stroke="white" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                        </div>
                      </div>
                    );
                  })}
                </div>
                <p className="cta-note" style={{textAlign:'left',marginTop:8}}>{selectedTypes.length} meal type{selectedTypes.length!==1?'s':''} · {mealCount} meals total</p>
              </div>

              {/* Servings */}
              <div className="section">
                <div className="section-label">Servings per meal</div>
                <div className="serving-controls">
                  <button className="serving-btn" disabled={servings<=1} onClick={()=>setServings(s=>Math.max(1,s-1))}>−</button>
                  <div className="serving-count">{servings}</div>
                  <button className="serving-btn" disabled={servings>=12} onClick={()=>setServings(s=>Math.min(12,s+1))}>+</button>
                  <span style={{fontSize:12,color:'#7C6A5E',fontWeight:300,marginLeft:8}}>serving{servings!==1?'s':''} — all recipes sized for {servings} {servings===1?'person':'people'}</span>
                </div>
              </div>

              {/* Cuisine ratio — only if multiple cuisines */}
              {cuisines.length > 1 && cuisines[0] !== 'any' && (
                <div className="section">
                  <div className="section-label">Days per cuisine</div>
                  <CuisineRatioSelector cuisines={cuisines} ratio={cuisineRatio} onChange={updateRatio} />
                </div>
              )}
              {cuisines.length === 1 && cuisines[0] !== 'any' && (
                <div style={{fontSize:12,color:'#7C6A5E',fontWeight:300,marginBottom:12,padding:'8px 12px',background:'rgba(255,69,0,0.04)',borderRadius:8}}>
                  All 7 days: <strong>{cuisines[0]}</strong> cuisine · based on your preference
                </div>
              )}

              <div className="cta-wrap">
                <button className="cta-btn" onClick={handleSubmit} disabled={selectedTypes.length===0 || (cuisines.length>1 && ratioTotal!==7)}>
                  <span>📅</span>
                  <span>Plan my week</span>
                </button>
                {cuisines.length > 1 && ratioTotal !== 7 && (
                  <p className="cta-note">Assign all 7 days across your cuisines to continue</p>
                )}
              </div>
            </div>
          </>
        )}

        {view==='loading' && (
          <div className="loading-wrap">
            <div className="loading-title">Building your week…</div>
            <div className="loading-sub">Planning {mealCount} meals across 7 days — usually takes 20–30 seconds. ({loadElapsed}s)</div>
            <div className="loading-days">
              {DAYS_SHORT.map((d,i)=>(
                <div key={d} className={`loading-day ${i<loadingDay?'done':''}`}>{i<loadingDay?'✓':d}</div>
              ))}
            </div>
          </div>
        )}

        {view==='error' && (
          <div className="error-wrap">
            <div style={{fontSize:40,marginBottom:12}}>⚠️</div>
            <div className="error-title">Couldn't build your plan</div>
            <div className="error-msg">{errorMsg}</div>
            <button className="cta-btn" onClick={()=>setView('input')}>← Try again</button>
          </div>
        )}

        {view==='results' && plan && (
          <div style={{padding:'16px 20px', maxWidth:720, margin:'0 auto', paddingBottom:80}}>
            {/* Plan header */}
            <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:16}}>
              <div>
                <div style={{fontFamily:"'Fraunces',serif",fontSize:20,fontWeight:700,color:'#1C0A00'}}>
                  Your 7-day menu ⚡
                </div>
                <div style={{fontSize:12,color:'#7C6A5E',fontWeight:300}}>
                  {mealCount} meals · {servings} serving{servings!==1?'s':''} each
                </div>
              </div>
              <div style={{display:'flex',gap:8}}>
                <button onClick={()=>setShowGrocery(p=>!p)}
                  style={{
                    padding:'7px 12px',fontSize:12,border:'1px solid rgba(28,10,0,0.12)',
                    borderRadius:8,background:showGrocery?'rgba(255,69,0,0.07)':'white',
                    color:showGrocery?'#FF4500':'#7C6A5E',cursor:'pointer',
                    fontFamily:"'DM Sans',sans-serif",
                  }}>
                  🛒 {showGrocery?'Hide':'Grocery'}
                </button>
                <button onClick={handleSubmit}
                  style={{
                    padding:'7px 14px',fontSize:12,background:'#FF4500',color:'white',
                    border:'none',borderRadius:8,cursor:'pointer',fontWeight:500,
                    fontFamily:"'DM Sans',sans-serif",
                  }}>
                  ⚡ Regenerate
                </button>
              </div>
            </div>

            {/* Week strip — emoji + cooked status */}
            <div style={{
              display:'grid',gridTemplateColumns:'repeat(7,1fr)',
              gap:4,marginBottom:20,
            }}>
              {DAYS.map((day,i) => {
                const meals = plan[day]?.meals || {};
                const firstMeal = Object.values(meals)[0];
                const emoji = firstMeal?.emoji || '🍽️';
                const isToday = i === new Date().getDay() - 1;
                return (
                  <button key={day} onClick={()=>setActiveDay(i)}
                    style={{
                      display:'flex',flexDirection:'column',alignItems:'center',gap:3,
                      padding:'8px 4px',borderRadius:12,
                      border:`1.5px solid ${activeDay===i?'#FF4500':'rgba(28,10,0,0.08)'}`,
                      background:activeDay===i?'rgba(255,69,0,0.06)':isToday?'rgba(255,184,0,0.06)':'white',
                      cursor:'pointer',fontFamily:"'DM Sans',sans-serif",
                    }}>
                    <span style={{fontSize:9,color:'#7C6A5E',fontWeight:500}}>
                      {DAYS_SHORT[i]}
                    </span>
                    <span style={{fontSize:16}}>{emoji}</span>
                  </button>
                );
              })}
            </div>

            {/* Accordion — active day expanded, rest collapsed */}
            <div style={{display:'flex',flexDirection:'column',gap:8}}>
              {DAYS.map((day,i) => {
                const dayPlan = plan[day];
                const isOpen = activeDay === i;
                const firstEmoji = Object.values(dayPlan?.meals||{})[0]?.emoji||'🍽️';
                return (
                  <div key={day} style={{
                    background:'white',border:'1px solid rgba(28,10,0,0.08)',
                    borderRadius:14,overflow:'hidden',
                    boxShadow: isOpen?'0 4px 16px rgba(28,10,0,0.07)':'none',
                    transition:'box-shadow 0.15s',
                  }}>
                    {/* Day header — always visible */}
                    <button onClick={()=>setActiveDay(isOpen?-1:i)}
                      style={{
                        width:'100%',padding:'14px 16px',
                        display:'flex',alignItems:'center',gap:10,
                        border:'none',background:'none',cursor:'pointer',
                        fontFamily:"'DM Sans',sans-serif",
                      }}>
                      <span style={{fontSize:20}}>{firstEmoji}</span>
                      <div style={{flex:1,textAlign:'left'}}>
                        <div style={{fontSize:14,fontWeight:600,color:'#1C0A00'}}>
                          {day}
                        </div>
                        {!isOpen && (
                          <div style={{fontSize:11,color:'#7C6A5E',fontWeight:300}}>
                            {Object.values(dayPlan?.meals||{}).map(m=>m?.name).filter(Boolean).slice(0,2).join(' · ')}
                          </div>
                        )}
                      </div>
                      <span style={{
                        fontSize:16,color:'#7C6A5E',
                        transform:isOpen?'rotate(180deg)':'none',
                        transition:'transform 0.2s',
                      }}>▾</span>
                    </button>

                    {/* Expanded day content */}
                    {isOpen && (
                      <div style={{borderTop:'1px solid rgba(28,10,0,0.06)',padding:'0 0 4px'}}>
                        {selectedTypes.map(type => {
                          const mt = MEAL_TYPE_OPTIONS.find(m=>m.id===type);
                          const meal = dayPlan?.meals?.[type];
                          return (
                            <div key={type} style={{
                              padding:'12px 16px',
                              borderBottom:'1px solid rgba(28,10,0,0.04)',
                            }}>
                              <div style={{
                                fontSize:10,letterSpacing:'1px',textTransform:'uppercase',
                                color:mt?.color||'#FF4500',fontWeight:600,marginBottom:6,
                              }}>
                                {mt?.emoji} {mt?.label}
                              </div>
                              {meal ? (
                                <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',gap:10}}>
                                  <div>
                                    <div style={{fontSize:14,fontWeight:600,color:'#1C0A00'}}>
                                      {meal.emoji} {meal.name}
                                    </div>
                                    <div style={{fontSize:11,color:'#7C6A5E',marginTop:2}}>
                                      {meal.time && `⏱ ${meal.time}`}
                                      {meal.calories && ` · ~${meal.calories} kcal`}
                                    </div>
                                  </div>
                                  <button
                                    onClick={()=>navigate('/app',{state:{generateContext:{dish:meal.name,type:'planner'}}})}
                                    style={{
                                      padding:'6px 12px',fontSize:11,
                                      background:'rgba(255,69,0,0.07)',
                                      border:'1px solid rgba(255,69,0,0.2)',
                                      borderRadius:8,color:'#FF4500',
                                      cursor:'pointer',fontWeight:500,
                                      fontFamily:"'DM Sans',sans-serif",
                                      flexShrink:0,
                                    }}>
                                    Cook this →
                                  </button>
                                </div>
                              ) : (
                                <div style={{fontSize:12,color:'#7C6A5E',fontStyle:'italic'}}>
                                  Not planned
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {showGrocery && <GrocerySection plan={plan} mealTypes={selectedTypes}/>}
          </div>
        )}
      </div>
    </>
  );
}
