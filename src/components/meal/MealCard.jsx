// src/components/meal/MealCard.jsx
// Full recipe card component — collapsed preview + expanded recipe
// Extracted from Jiff.jsx. All icons self-contained.

import { useState } from 'react';
import { useLocale } from '../../contexts/LocaleContext.jsx';
import { scaleIngredient, scaleNutrition } from '../../lib/scaling.js';
import { buildShareText } from '../../lib/sharing.js';
import { StepWithTimer } from './StepTimer.jsx';
import { GroceryPanel }  from './GroceryPanel.jsx';
import { CookModeOverlay } from './CookModeOverlay.jsx';
import { VideoButton }   from './VideoButton.jsx';

// ── Icons ──────────────────────────────────────────────────────────
const IconHeart=({filled})=><svg viewBox="0 0 24 24" fill={filled?'#E53E3E':'none'} stroke={filled?'#E53E3E':'currentColor'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>;
const IconShare=()=><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>;
const IconCopy=()=><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>;
const IconCheck=()=><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>;
const IconCart=()=><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 001.98 1.61H19a2 2 0 001.98-1.71L23 6H6"/></svg>;
const IconWA=()=><svg viewBox="0 0 32 32" fill="currentColor"><path d="M16 0C7.164 0 0 7.163 0 16c0 2.82.736 5.469 2.027 7.77L0 32l8.469-2.004A15.938 15.938 0 0016 32c8.836 0 16-7.164 16-16S24.836 0 16 0zm0 29.333a13.27 13.27 0 01-6.771-1.852l-.485-.288-5.027 1.189 1.213-4.899-.315-.503A13.257 13.257 0 012.667 16C2.667 8.636 8.636 2.667 16 2.667S29.333 8.636 29.333 16 23.364 29.333 16 29.333zm7.27-9.878c-.397-.198-2.35-1.16-2.714-1.291-.363-.132-.627-.198-.89.198-.264.397-1.023 1.291-1.253 1.556-.231.264-.462.297-.858.099-.397-.198-1.675-.617-3.19-1.97-1.18-1.052-1.977-2.35-2.208-2.747-.231-.397-.025-.611.173-.809.178-.178.397-.462.595-.693.198-.231.264-.397.397-.661.132-.265.066-.496-.033-.694-.099-.198-.89-2.148-1.22-2.942-.32-.772-.647-.667-.89-.68-.23-.012-.496-.015-.76-.015-.264 0-.694.099-1.057.496-.363.397-1.386 1.354-1.386 3.303 0 1.95 1.419 3.834 1.617 4.099.198.264 2.793 4.266 6.766 5.982.946.408 1.684.652 2.26.834.95.302 1.814.26 2.497.158.761-.114 2.35-.961 2.68-1.889.332-.927.332-1.722.232-1.889-.099-.165-.363-.264-.76-.462z"/></svg>;
const IconScaler=()=><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>;


// ── MealCard ──────────────────────────────────────────────────────
function MealCard({ meal, index, isFavourite, onToggleFav, fridgeIngredients=[], showFavTag=false, defaultServings=2, animDelay=0, country='', onRate, rating=0 }) {
  const { t, lang } = useLocale();
  const baseServings = parseInt(meal.servings) || defaultServings;
  const [shareCardOpen, setShareCardOpen] = useState(false);
  const [hoverStar,     setHoverStar]     = useState(0);
  const [expanded, setExpanded]       = useState(false);
  const [shareOpen, setShareOpen]     = useState(false);
  const [groceryOpen, setGroceryOpen] = useState(false);
  // video state managed by VideoButton component
  const [subOpen,     setSubOpen]     = useState(null); // ingredient name being substituted
  const [subResult,   setSubResult]   = useState({});   // {ingName: [sub1, sub2]}
  const [cookMode,    setCookMode]    = useState(false);
  const [cookStep,    setCookStep]    = useState(0);
  const [speaking,    setSpeaking]    = useState(false);
  const [orderOpen,   setOrderOpen]   = useState(false);
  const [servings, setServings]       = useState(baseServings);
  const ratio    = servings / baseServings;
  const isScaled = ratio !== 1;

  const scaledIngs  = (meal.ingredients||[]).map(ing=>scaleIngredient(ing,ratio));
  const scaledCal   = scaleNutrition(meal.calories||'',ratio);
  const scaledPro   = scaleNutrition(meal.protein||'',ratio);
  const scaledCarbs = scaleNutrition(meal.carbs||'',ratio);
  const scaledFat   = scaleNutrition(meal.fat||'',ratio);

  // ── Share card — canvas PNG download ───────────────────────────
  const generateShareCard = () => {
    const SIZE = 1080;
    const canvas = document.createElement('canvas');
    canvas.width = SIZE; canvas.height = SIZE;
    const cx = canvas.getContext('2d');

    // ── Background ──────────────────────────────────────────────
    // Rich dark gradient
    const bg = cx.createRadialGradient(SIZE/2, SIZE*0.4, 0, SIZE/2, SIZE*0.4, SIZE*0.85);
    bg.addColorStop(0, '#2D1000');
    bg.addColorStop(0.6, '#1C0A00');
    bg.addColorStop(1, '#0D0500');
    cx.fillStyle = bg; cx.fillRect(0, 0, SIZE, SIZE);

    // Warm glow behind emoji
    const glow = cx.createRadialGradient(SIZE/2, SIZE*0.38, 0, SIZE/2, SIZE*0.38, 260);
    glow.addColorStop(0, 'rgba(255,69,0,0.18)');
    glow.addColorStop(1, 'rgba(255,69,0,0)');
    cx.fillStyle = glow; cx.fillRect(0, 0, SIZE, SIZE);

    // ── Top bar ──────────────────────────────────────────────────
    cx.fillStyle = '#FF4500'; cx.fillRect(0, 0, SIZE, 6);

    // ── Jiff wordmark ────────────────────────────────────────────
    cx.font = '500 32px Arial, sans-serif';
    cx.fillStyle = 'rgba(255,255,255,0.35)';
    cx.textAlign = 'left';
    cx.fillText('⚡ JIFF', 60, 72);

    // ── Meal emoji ───────────────────────────────────────────────
    cx.font = '200px serif';
    cx.textAlign = 'center';
    cx.fillText(meal.emoji || '🍽️', SIZE/2, 390);

    // ── Meal name ────────────────────────────────────────────────
    cx.textAlign = 'center';
    const name = (meal.name || 'Recipe').toUpperCase();
    // Auto-size font to fit
    let fontSize = 72;
    cx.font = `900 ${fontSize}px Arial, sans-serif`;
    while (cx.measureText(name).width > SIZE - 100 && fontSize > 36) {
      fontSize -= 4;
      cx.font = `900 ${fontSize}px Arial, sans-serif`;
    }
    cx.fillStyle = 'white';
    cx.fillText(name, SIZE/2, 490);

    // ── Thin orange divider ──────────────────────────────────────
    cx.strokeStyle = '#FF4500'; cx.lineWidth = 2;
    cx.beginPath(); cx.moveTo(SIZE/2 - 120, 520); cx.lineTo(SIZE/2 + 120, 520); cx.stroke();

    // ── Description ──────────────────────────────────────────────
    const desc = (meal.description || '').slice(0, 72);
    cx.font = '300 28px Arial, sans-serif';
    cx.fillStyle = 'rgba(255,255,255,0.55)';
    cx.fillText(desc, SIZE/2, 575);

    // ── Stats chips ──────────────────────────────────────────────
    const stats = [
      { icon:'⏱', val: meal.time || '?' },
      { icon:'🔥', val: (meal.calories || '?') + ' cal' },
      { icon:'💪', val: meal.protein || '?' },
      { icon:'📊', val: meal.difficulty || 'Easy' },
    ];
    const chipW = 200, chipH = 68, chipGap = 20;
    const totalW = stats.length * chipW + (stats.length - 1) * chipGap;
    const startX = (SIZE - totalW) / 2;
    stats.forEach((s, idx) => {
      const x = startX + idx * (chipW + chipGap);
      const y = 630;
      // Chip background
      cx.fillStyle = 'rgba(255,255,255,0.07)';
      cx.beginPath();
      cx.roundRect(x, y, chipW, chipH, 14);
      cx.fill();
      cx.strokeStyle = 'rgba(255,255,255,0.12)'; cx.lineWidth = 1;
      cx.stroke();
      // Icon + value
      cx.font = '22px serif'; cx.textAlign = 'center';
      cx.fillStyle = 'rgba(255,255,255,0.5)';
      cx.fillText(s.icon, x + chipW/2, y + 26);
      cx.font = '600 22px Arial, sans-serif';
      cx.fillStyle = 'white';
      cx.fillText(s.val, x + chipW/2, y + 54);
    });

    // ── Bottom branding strip ────────────────────────────────────
    cx.fillStyle = 'rgba(255,69,0,0.12)';
    cx.fillRect(0, SIZE - 100, SIZE, 100);
    cx.fillStyle = '#FF4500';
    cx.font = '700 30px Arial, sans-serif'; cx.textAlign = 'center';
    cx.fillText('Made with ⚡ Jiff', SIZE/2, SIZE - 55);
    cx.font = '300 20px Arial, sans-serif';
    cx.fillStyle = 'rgba(255,255,255,0.3)';
    cx.fillText('jiff-ecru.vercel.app', SIZE/2, SIZE - 22);

    // ── Download ─────────────────────────────────────────────────
    const link = document.createElement('a');
    link.download = 'jiff-' + (meal.name || 'recipe').toLowerCase().replace(/[^a-z0-9]+/g, '-') + '.png';
    link.href = canvas.toDataURL('image/png', 0.95);
    link.click();
  };

  // fetchVideo removed — VideoButton component handles fetch internally

  // ── Ingredient substitution ────────────────────────────────────
  const fetchSub = async (ing) => {
    if (subResult[ing]) { setSubOpen(ing); return; }
    setSubOpen(ing);
    try {
      const res = await fetch('/api/suggest', {
        method: 'POST', headers: {'Content-Type':'application/json'},
        body: JSON.stringify({ kidsMode: true, kidsPromptOverride: `Suggest 2-3 practical substitutes for "${ing}" when cooking "${meal.name}". Respond ONLY with JSON: {"subs":[{"name":"substitute","note":"brief note on how to use"}]}` })
      });
      const data = await res.json();
      const raw = JSON.stringify(data);
      const m = raw.match(/"subs"\s*:\s*\[[\s\S]*?\]/);
      if (m) {
        const parsed = JSON.parse('{' + m[0] + '}');
        setSubResult(prev => ({ ...prev, [ing]: parsed.subs || [] }));
      }
    } catch {}
  };

  // ── Read aloud ─────────────────────────────────────────────────
  const readAloud = () => {
    if (!('speechSynthesis' in window)) return;
    if (speaking) { window.speechSynthesis.cancel(); setSpeaking(false); return; }
    const stepsText = meal.steps?.map((s,i) => `Step ${i+1}: ${s}`).join('. ') || '';
    const text = `${meal.name}. ${meal.description}. Ingredients: ${scaledIngs.join(', ')}. ${stepsText}`;
    const utt = new SpeechSynthesisUtterance(text);
    utt.onend = () => setSpeaking(false);
    window.speechSynthesis.speak(utt);
    setSpeaking(true);
  };

  // ── PDF export ─────────────────────────────────────────────────
  const printRecipe = () => {
    const w = window.open('', '_blank');
    w.document.write(`<!DOCTYPE html><html><head><title>${meal.name}</title><style>
      body{font-family:Arial,sans-serif;max-width:600px;margin:40px auto;color:#1C0A00;line-height:1.6}
      h1{color:#FF4500;font-size:24px;margin-bottom:4px}
      .meta{color:#7C6A5E;font-size:13px;margin-bottom:16px}
      h2{font-size:14px;text-transform:uppercase;letter-spacing:1px;color:#7C6A5E;margin:20px 0 8px}
      ul,ol{padding-left:20px}li{margin-bottom:6px;font-size:13px}
      .footer{margin-top:32px;padding-top:12px;border-top:1px solid #eee;font-size:11px;color:#aaa;text-align:center}
      @media print{body{margin:20px}}
    </style></head><body>
      <h1>${meal.emoji} ${meal.name}</h1>
      <div class="meta">⏱ ${meal.time} · 👥 ${servings} servings · 📊 ${meal.difficulty} · 🔥 ${meal.calories}</div>
      <p style="font-size:13px;color:#3D2010">${meal.description}</p>
      <h2>Ingredients</h2><ul>${scaledIngs.map(i=>`<li>${i}</li>`).join('')}</ul>
      <h2>Method</h2><ol>${meal.steps?.map(s=>`<li>${s}</li>`).join('')||''}</ol>
      ${meal.fun_fact?`<p style="background:#FFF0E5;padding:10px;border-radius:6px;font-size:12px;margin-top:16px">💡 ${meal.fun_fact}</p>`:''}
      <div class="footer">Made with ⚡ Jiff · jiff-ecru.vercel.app</div>
    </body></html>`);
    w.document.close();
    w.print();
  };

  return (
    <>
    {/* ── meal-card ─────────────────────────────────────────────── */}
    <div className={`meal-card ${expanded?'expanded':''} ${isFavourite?'is-fav':''}`}
      style={{animationDelay:`${animDelay}s`}}>

      {/* ── COLLAPSED: always-visible header ─────────────────────── */}
      <div className="meal-hdr" onClick={()=>{if(!expanded)setExpanded(true);}}>
        <div className="meal-hdr-top">
          <div className="meal-num">{showFavTag?'❤️ Saved':`Option ${index+1}`}</div>
          <div className="meal-hdr-actions">
            <button className={`heart-btn ${isFavourite?'saved':''}`}
              onClick={e=>{e.stopPropagation();onToggleFav(meal);}}>
              <IconHeart filled={isFavourite}/>
            </button>
          </div>
        </div>
        <div className="meal-name">{meal.emoji} {meal.name}</div>
        <div className="meal-meta">
          <span className="meal-meta-item">⏱ {meal.time}</span>
          <span className="meal-meta-item">📊 {meal.difficulty}</span>
          <span className="meal-meta-item">🔥 {meal.calories||'—'}</span>
        </div>
        <div className="meal-desc">{meal.description}</div>

        {/* ── VIDEO (tap to fetch inline) ────────────────────────── */}
        <div style={{marginTop:10}} onClick={e=>e.stopPropagation()}>
          <VideoButton recipeName={meal.name} cuisine={meal.cuisine||''} lang={lang}/>
        </div>

        {/* ── Expand prompt (collapsed only) ──────────────────────── */}
        {!expanded && (
          <button className="expand-btn" onClick={e=>{e.stopPropagation();setExpanded(true);}}>
            <span>{t('see_full_recipe')}</span><span>→</span>
          </button>
        )}
      </div>

      {/* ── EXPANDED: full recipe ────────────────────────────────── */}
      {expanded && (
        <div className="recipe" onClick={e=>e.stopPropagation()}>

          {/* Servings scaler */}
          <div className="scaler-bar">
            <div className="scaler-label"><IconScaler/>{t('servings_label')}</div>
            <div className="scaler-controls">
              <button className="scaler-btn" disabled={servings<=1}
                onClick={e=>{e.stopPropagation();setServings(s=>Math.max(1,s-1));}}>−</button>
              <div className="scaler-count">{servings}</div>
              <button className="scaler-btn" disabled={servings>=20}
                onClick={e=>{e.stopPropagation();setServings(s=>Math.min(20,s+1));}}>+</button>
            </div>
            {isScaled
              ? <span className="scaler-badge">×{(ratio%1===0?ratio:ratio.toFixed(2).replace(/\.?0+$/,''))}</span>
              : <span className="scaler-orig">Base: {baseServings} servings</span>}
          </div>

          {/* Ingredients */}
          <div className="recipe-sec" style={{marginTop:0,paddingTop:12,borderTop:'1px solid rgba(255,69,0,0.12)'}}>
            {t('recipe_ingredients')}
          </div>
          <ul className="ing-list">
            {scaledIngs.map((ing,j)=>(
              <li key={j} style={{position:'relative'}}>
                <span className={ing!==(meal.ingredients?.[j]||'')&&isScaled?'scaled-highlight':''}>{ing}</span>
                <button onClick={()=>fetchSub(ing)}
                  style={{marginLeft:6,fontSize:9,color:'var(--muted)',background:'rgba(28,10,0,0.05)',
                    border:'1px solid rgba(28,10,0,0.10)',borderRadius:4,padding:'1px 5px',cursor:'pointer',
                    fontFamily:"'DM Sans',sans-serif",verticalAlign:'middle'}}>
                  sub?
                </button>
              </li>
            ))}
          </ul>

          {/* Substitution panel */}
          {subOpen && (
            <div onClick={e=>e.stopPropagation()}
              style={{margin:'8px 0 12px',padding:'12px 14px',background:'rgba(255,69,0,0.04)',
                border:'1px solid rgba(255,69,0,0.15)',borderRadius:10}}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:8}}>
                <span style={{fontSize:11,fontWeight:500,color:'var(--jiff)'}}>Substitutes for <em>{subOpen}</em></span>
                <button onClick={()=>setSubOpen(null)}
                  style={{background:'none',border:'none',cursor:'pointer',fontSize:16,color:'var(--muted)'}}>×</button>
              </div>
              {!subResult[subOpen] && <div style={{fontSize:12,color:'var(--muted)'}}>Finding substitutes…</div>}
              {subResult[subOpen]?.map((s,k)=>(
                <div key={k} style={{fontSize:12,marginBottom:6}}>
                  <strong style={{color:'var(--ink)'}}>{s.name}</strong>
                  <span style={{color:'var(--muted)',marginLeft:6}}>{s.note}</span>
                </div>
              ))}
            </div>
          )}

          {/* Steps */}
          <div className="recipe-sec">{t('recipe_method')}</div>
          <ol className="steps-list">{meal.steps?.map((s,j)=><StepWithTimer key={j} text={s}/>)}</ol>

          {/* Nutrition */}
          <div className="recipe-sec">
            Nutrition
            {isScaled&&<span style={{marginLeft:7,fontSize:9,color:'var(--muted)',fontWeight:400,textTransform:'none',letterSpacing:0}}>scaled for {servings}</span>}
          </div>
          <div className="nutr-grid">
            {[['Calories',scaledCal],['Protein',scaledPro],['Carbs',scaledCarbs],['Fat',scaledFat]].map(([lbl,val])=>(
              <div key={lbl} className="nutr-item">
                <div className={`nutr-val ${isScaled?'scaled-highlight':''}`}>{val}</div>
                <div className="nutr-lbl">{lbl}</div>
              </div>
            ))}
          </div>

          {/* ── PRIMARY ACTIONS: Start Cooking + Rate ──────────────── */}
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8,margin:'16px 0 12px'}}>
            <button onClick={e=>{e.stopPropagation();setCookMode(true);setCookStep(0);}}
              style={{padding:'12px 8px',borderRadius:12,border:'none',
                background:'linear-gradient(135deg,#1C0A00,#3D1500)',color:'white',
                fontSize:13,fontWeight:600,cursor:'pointer',
                display:'flex',alignItems:'center',justifyContent:'center',gap:6,
                fontFamily:"'DM Sans',sans-serif"}}>
              👨‍🍳 Start Cooking
            </button>
            <div style={{padding:'8px',borderRadius:12,border:'1px solid rgba(28,10,0,0.10)',
              background:'white',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:2}}>
              <div style={{fontSize:9,color:'var(--muted)',fontWeight:300,letterSpacing:'0.3px'}}>
                {rating > 0 ? 'Your rating' : 'Rate this recipe'}
              </div>
              <div style={{display:'flex',gap:1,alignItems:'center'}}>
                {[1,2,3,4,5].map(s=>(
                  <button key={s}
                    onMouseEnter={()=>setHoverStar(s)}
                    onMouseLeave={()=>setHoverStar(0)}
                    onClick={e=>{e.stopPropagation();onRate&&onRate(s);}}
                    style={{background:'none',border:'none',cursor:'pointer',fontSize:16,padding:'0 1px',
                      lineHeight:1,transition:'transform 0.12s',
                      transform:(hoverStar||rating)>=s?'scale(1.25)':'scale(1)',
                      filter:(hoverStar||rating)>=s?'none':'grayscale(1) opacity(0.4)'}}>
                    ⭐
                  </button>
                ))}
                {rating > 0 && (
                  <span style={{fontSize:9,color:'var(--jiff)',fontWeight:600,marginLeft:4,letterSpacing:'0.5px'}}>
                    {['','Poor','Ok','Good','Great','Loved it!'][rating]}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* ── UTILITY ROW: grocery, pdf, read, share ─────────────── */}
          <div style={{display:'flex',gap:6,flexWrap:'wrap',marginBottom:10}}>
            <button onClick={e=>{e.stopPropagation();setGroceryOpen(p=>!p);}}
              style={{padding:'6px 12px',borderRadius:8,border:'1px solid rgba(28,10,0,0.12)',
                background:groceryOpen?'rgba(255,69,0,0.06)':'white',
                color:groceryOpen?'var(--jiff)':'var(--muted)',fontSize:11,cursor:'pointer',
                display:'flex',alignItems:'center',gap:4,fontFamily:"'DM Sans',sans-serif"}}>
              <IconCart/> {t('what_to_buy')}
            </button>
            <button onClick={e=>{e.stopPropagation();printRecipe();}}
              title="Save as PDF"
              style={{padding:'6px 12px',borderRadius:8,border:'1px solid rgba(28,10,0,0.12)',
                background:'white',color:'var(--muted)',fontSize:11,cursor:'pointer'}}>
              📄 PDF
            </button>
            <button onClick={e=>{e.stopPropagation();readAloud();}}
              title="Read recipe aloud"
              style={{padding:'6px 12px',borderRadius:8,border:'1px solid rgba(28,10,0,0.12)',
                background:speaking?'rgba(255,69,0,0.07)':'white',
                color:speaking?'var(--jiff)':'var(--muted)',fontSize:11,cursor:'pointer'}}>
              {speaking?'⏹ Stop':'🔊 Read'}
            </button>
            <div style={{position:'relative',marginLeft:'auto'}}>
              <button onClick={e=>{e.stopPropagation();setShareOpen(p=>!p);}}
                style={{padding:'6px 12px',borderRadius:8,
                  background:'linear-gradient(135deg,#FF4500,#CC3700)',color:'white',
                  border:'none',fontSize:11,fontWeight:500,cursor:'pointer',
                  display:'flex',alignItems:'center',gap:4,fontFamily:"'DM Sans',sans-serif",
                  boxShadow:'0 2px 6px rgba(255,69,0,0.25)'}}>
                📤 Share
              </button>
              {shareOpen && (
                <div onClick={e=>e.stopPropagation()}
                  style={{position:'absolute',right:0,bottom:'calc(100% + 6px)',background:'white',
                    border:'1px solid rgba(28,10,0,0.12)',borderRadius:12,
                    boxShadow:'0 8px 24px rgba(28,10,0,0.12)',padding:'8px',
                    zIndex:50,minWidth:180,fontFamily:"'DM Sans',sans-serif"}}>
                  <div style={{fontSize:10,letterSpacing:'1px',textTransform:'uppercase',
                    color:'#9E9E9E',padding:'2px 8px 6px',fontWeight:500}}>Share this recipe</div>
                  <a href={`https://wa.me/?text=${encodeURIComponent(buildShareText(meal))}`}
                    target="_blank" rel="noopener noreferrer" onClick={()=>setShareOpen(false)}
                    style={{display:'flex',alignItems:'center',gap:8,padding:'7px 10px',
                      borderRadius:8,textDecoration:'none',color:'#1C0A00',fontSize:12}}
                    onMouseEnter={e=>e.currentTarget.style.background='rgba(28,10,0,0.05)'}
                    onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
                    <span style={{fontSize:16}}>💬</span> Share on WhatsApp
                  </a>
                  <button onClick={async e=>{e.stopPropagation();try{await navigator.clipboard.writeText(buildShareText(meal));}catch{}setShareOpen(false);}}
                    style={{display:'flex',alignItems:'center',gap:8,padding:'7px 10px',borderRadius:8,
                      width:'100%',background:'none',border:'none',color:'#1C0A00',fontSize:12,
                      cursor:'pointer',fontFamily:"'DM Sans',sans-serif",textAlign:'left'}}
                    onMouseEnter={e=>e.currentTarget.style.background='rgba(28,10,0,0.05)'}
                    onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
                    <span style={{fontSize:16}}>📋</span> Copy recipe text
                  </button>
                  <button onClick={e=>{e.stopPropagation();generateShareCard();setShareOpen(false);}}
                    style={{display:'flex',alignItems:'center',gap:8,padding:'7px 10px',borderRadius:8,
                      width:'100%',background:'none',border:'none',color:'#1C0A00',fontSize:12,
                      cursor:'pointer',fontFamily:"'DM Sans',sans-serif",textAlign:'left'}}
                    onMouseEnter={e=>e.currentTarget.style.background='rgba(28,10,0,0.05)'}
                    onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
                    <span style={{fontSize:16}}>🖼️</span> Download image
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* ── GROCERY PANEL (inline, toggles open) ───────────────── */}
          {groceryOpen && (
            <GroceryPanel meal={meal} fridgeIngredients={fridgeIngredients}
              onClose={()=>setGroceryOpen(false)} country={country}/>
          )}

          {/* ── ORDER ROW ───────────────────────────────────────────── */}
          <div style={{padding:'10px 0',borderTop:'1px solid rgba(28,10,0,0.06)'}}>
            <div style={{fontSize:10,letterSpacing:'1px',textTransform:'uppercase',
              color:'var(--muted)',fontWeight:500,marginBottom:8}}>
              🛵 Can't cook today? Order it
            </div>
            <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
              {[
                {name:'Swiggy',  color:'#FC8019', url:`https://www.swiggy.com/search?query=${encodeURIComponent(meal.name)}`},
                {name:'Zomato',  color:'#CB202D', url:`https://www.zomato.com/search?q=${encodeURIComponent(meal.name)}`},
                {name:'EatSure', color:'#E84855', url:`https://eatsure.com/search?query=${encodeURIComponent(meal.name)}`},
              ].map(d=>(
                <a key={d.name} href={d.url} target="_blank" rel="noopener noreferrer"
                  onClick={e=>e.stopPropagation()}
                  style={{padding:'6px 14px',borderRadius:8,textDecoration:'none',
                    fontSize:11,fontWeight:600,color:'white',background:d.color,display:'inline-block'}}>
                  {d.name} →
                </a>
              ))}
            </div>
          </div>

          <button className="collapse-btn" onClick={()=>setExpanded(false)}>
            <span>{t('collapse')}</span><span>↑</span>
          </button>
        </div>
      )}
    </div>

    {/* ── COOK MODE OVERLAY ────────────────────────────────────────── */}
    {cookMode && (
      <CookModeOverlay
        meal={meal}
        cookStep={cookStep}
        setCookStep={setCookStep}
        onExit={()=>{setCookMode(false);setCookStep(0);window.speechSynthesis?.cancel();}}
      />
    )}
    </>
  );
}

