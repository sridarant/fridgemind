// src/components/meal/MealCard.jsx — v22 full rewrite
// Layout: collapsed header → expanded with Ingredients/Method/Grocery tabs
// Video: embedded YouTube iframe (loads on tap, not autoplay)
// Method: inline step timers, Focus step button (replaces CookMode)
// CookModeOverlay: removed entirely

import { useState, useRef, memo } from 'react';
import { useLocale }        from '../../contexts/LocaleContext.jsx';
import { scaleIngredient, scaleNutrition } from '../../lib/scaling.js';
import { buildShareText }   from '../../lib/sharing.js';
import { StepWithTimer }    from './StepTimer.jsx';
import { GroceryPanel }     from './GroceryPanel.jsx';
import { VideoButton }      from './VideoButton.jsx';

const C = {
  jiff:'#FF4500', ink:'#1C0A00', cream:'#FFFAF5', muted:'#7C6A5E',
  green:'#1D9E75', red:'#E53E3E', border:'rgba(28,10,0,0.08)',
  borderMid:'rgba(28,10,0,0.15)', gold:'#D97706',
};

// ── Icons ──────────────────────────────────────────────────────────
const IconHeart  = ({filled}) => <svg viewBox="0 0 24 24" fill={filled?'#E53E3E':'none'} stroke={filled?'#E53E3E':'currentColor'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{width:16,height:16}}><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>;
const IconShare  = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{width:15,height:15}}><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>;
const IconCopy   = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{width:15,height:15}}><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>;

// ── Embedded video (loads iframe on tap) ───────────────────────────
function EmbeddedVideo({ videoId, title }) {
  const [loaded, setLoaded] = useState(false);
  if (!videoId) return null;
  return (
    <div style={{ borderRadius:12, overflow:'hidden', marginBottom:16, background:'#000', aspectRatio:'16/9', position:'relative' }}>
      {loaded ? (
        <iframe
          src={`https://www.youtube.com/embed/${videoId}?autoplay=0&rel=0&modestbranding=1`}
          title={title || 'Recipe video'}
          allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          style={{ width:'100%', height:'100%', border:'none' }}
        />
      ) : (
        <button onClick={() => setLoaded(true)}
          style={{
            width:'100%', height:'100%', border:'none', background:'transparent',
            cursor:'pointer', display:'flex', flexDirection:'column',
            alignItems:'center', justifyContent:'center', gap:8,
            minHeight:180,
          }}>
          <img
            src={`https://img.youtube.com/vi/${videoId}/mqdefault.jpg`}
            alt={title}
            style={{ position:'absolute', inset:0, width:'100%', height:'100%', objectFit:'cover', borderRadius:12 }}
          />
          <div style={{
            position:'relative', zIndex:1,
            width:52, height:52, borderRadius:'50%',
            background:'rgba(255,0,0,0.88)',
            display:'flex', alignItems:'center', justifyContent:'center',
          }}>
            <svg viewBox="0 0 24 24" fill="white" style={{width:22,height:22,marginLeft:2}}>
              <polygon points="5 3 19 12 5 21 5 3"/>
            </svg>
          </div>
          <div style={{ position:'relative', zIndex:1, fontSize:11, color:'white',
            background:'rgba(0,0,0,0.5)', padding:'3px 10px', borderRadius:20, backdropFilter:'blur(4px)' }}>
            {title || 'Watch recipe'}
          </div>
        </button>
      )}
    </div>
  );
}

// ── Star rating ────────────────────────────────────────────────────
function StarRating({ value, onChange, size = 16 }) {
  const [hov, setHov] = useState(0);
  return (
    <div style={{ display:'flex', gap:2 }}>
      {[1,2,3,4,5].map(n => (
        <button key={n} onClick={() => onChange?.(n)}
          onMouseEnter={() => setHov(n)} onMouseLeave={() => setHov(0)}
          style={{ background:'none', border:'none', cursor:'pointer', padding:0,
            fontSize:size, lineHeight:1, transition:'transform 0.08s',
            transform:(hov||value)>=n?'scale(1.15)':'scale(1)' }}>
          {(hov||value)>=n ? '⭐' : '☆'}
        </button>
      ))}
    </div>
  );
}

// ── Scale selector ─────────────────────────────────────────────────
function ScaleSelector({ servings, baseServings, onChange }) {
  const options = [1,2,3,4,6,8].filter(n => n !== baseServings);
  options.unshift(baseServings);
  return (
    <div style={{ display:'flex', gap:4, alignItems:'center' }}>
      <span style={{ fontSize:11, color:C.muted, marginRight:4 }}>Serves:</span>
      {options.slice(0,5).map(n => (
        <button key={n} onClick={() => onChange(n)}
          style={{
            width:28, height:28, borderRadius:'50%', border:'none',
            background: servings===n ? C.jiff : 'rgba(28,10,0,0.06)',
            color: servings===n ? 'white' : C.ink,
            fontSize:11, fontWeight:servings===n?600:400,
            cursor:'pointer', fontFamily:"'DM Sans',sans-serif",
          }}>
          {n}
        </button>
      ))}
    </div>
  );
}

// ── Focus step overlay ─────────────────────────────────────────────
function FocusStep({ step, stepNum, total, onClose }) {
  return (
    <div style={{
      position:'fixed', inset:0, zIndex:9500,
      background:'#1C0A00', display:'flex', flexDirection:'column',
      fontFamily:"'DM Sans',sans-serif",
    }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'20px 24px' }}>
        <div style={{ fontSize:12, color:'rgba(255,255,255,0.5)' }}>Step {stepNum} of {total}</div>
        <button onClick={onClose} style={{ background:'none', border:'none', color:'rgba(255,255,255,0.6)', fontSize:24, cursor:'pointer', lineHeight:1 }}>✕</button>
      </div>
      <div style={{ flex:1, display:'flex', flexDirection:'column', justifyContent:'center', padding:'24px 32px' }}>
        <div style={{ fontSize:'clamp(18px,4vw,26px)', color:'white', lineHeight:1.6, fontWeight:300 }}>
          {step.instruction || step}
        </div>
      </div>
      <div style={{ padding:'24px', color:'rgba(255,255,255,0.3)', fontSize:11, textAlign:'center' }}>
        Tap ✕ to return to the recipe
      </div>
    </div>
  );
}

// ── Main MealCard ──────────────────────────────────────────────────
// MealCard is memo-wrapped — only re-renders when rating, isFavourite, or meal changes
const MealCardInner = function MealCard({
  meal, isFav, onToggleFav,
  rating, onRate,
  pantry = [], lang = 'en',
}) {
  const { t, units }   = useLocale();
  const [expanded,    setExpanded]    = useState(false);
  const [activeTab,   setActiveTab]   = useState('ingredients');
  const [servings,    setServings]    = useState(meal?.servings || 2);
  const [showShare,   setShowShare]   = useState(false);
  const [copied,      setCopied]      = useState(false);
  const [focusStep,   setFocusStep]   = useState(null);
  const cardRef = useRef(null);

  if (!meal) return null;

  const baseServings = meal.servings || 2;
  const scale        = servings / baseServings;

  const handleCopy = () => {
    navigator.clipboard?.writeText(buildShareText(meal, lang)).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleWA = () => {
    const text = encodeURIComponent(buildShareText(meal, lang));
    window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
  };

  const TABS = [
    { id:'ingredients', label:'Ingredients' },
    { id:'method',      label:'Method'      },
    { id:'grocery',     label:'Grocery'     },
  ];

  return (
    <>
      <div ref={cardRef} style={{
        background:   'white',
        border:       `1px solid ${C.border}`,
        borderRadius: 16,
        overflow:     'hidden',
        fontFamily:   "'DM Sans', sans-serif",
        marginBottom: 14,
        transition:   'box-shadow 0.15s',
      }}>

        {/* Collapsed header — always visible */}
        <div
          onClick={() => setExpanded(e => !e)}
          style={{ padding:'14px 16px', cursor:'pointer', userSelect:'none' }}>
          <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:10 }}>
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:4 }}>
                <span style={{ fontSize:20 }}>{meal.emoji || '🍽️'}</span>
                <span style={{ fontFamily:"'Fraunces',serif", fontSize:16, fontWeight:700, color:C.ink, lineHeight:1.3 }}>
                  {meal.name}
                </span>
              </div>
              <div style={{ fontSize:11, color:C.muted, display:'flex', gap:8, flexWrap:'wrap' }}>
                {meal.time     && <span>⏱ {meal.time}</span>}
                {meal.servings && <span>👥 {meal.servings}</span>}
                {meal.diet     && <span style={{ color:C.green }}>🌿 {meal.diet}</span>}
              </div>
            </div>
            <div style={{ display:'flex', flexDirection:'column', alignItems:'flex-end', gap:6, flexShrink:0 }}>
              <button onClick={e => { e.stopPropagation(); console.log('fav clicked', meal.name); onToggleFav?.(meal); }}
                style={{ background:'none', border:'none', cursor:'pointer', padding:2 }}>
                <IconHeart filled={isFav} />
              </button>
              <StarRating value={rating||0} onChange={r => { onRate?.(r); }} size={13} />
            </div>
          </div>
          <div style={{ fontSize:11, color:C.muted, marginTop:6, display:'flex', alignItems:'center', gap:6 }}>
            <span style={{ fontSize:16, transform:'rotate(' + (expanded ? '180deg' : '0deg') + ')', display:'inline-block', transition:'transform 0.2s' }}>▾</span>
            <span>{expanded ? 'Collapse' : 'See recipe'}</span>
          </div>
        </div>

        {/* Expanded content */}
        {expanded && (
          <div style={{ borderTop:`1px solid ${C.border}` }}>

            {/* Video — fetches from YouTube API on demand */}
            <div style={{ padding:'14px 16px 0' }}>
              {meal.videoId
                ? <EmbeddedVideo videoId={meal.videoId} title={meal.videoTitle} />
                : <VideoButton recipeName={meal.name} cuisine={meal.cuisine || ''} lang="en" />
              }
            </div>

            {/* Tabs */}
            <div style={{ display:'flex', borderBottom:`1px solid ${C.border}` }}>
              {TABS.map(tab => (
                <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                  style={{
                    flex:1, padding:'10px 4px',
                    border:'none', background:'none',
                    fontSize:12, fontWeight: activeTab===tab.id ? 600 : 400,
                    color:       activeTab===tab.id ? C.jiff : C.muted,
                    borderBottom: activeTab===tab.id ? '2px solid ' + C.jiff : '2px solid transparent',
                    cursor:'pointer', fontFamily:"'DM Sans',sans-serif",
                    transition:'all 0.12s',
                  }}>
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Tab content */}
            <div style={{ padding:'16px' }}>

              {/* INGREDIENTS TAB */}
              {activeTab === 'ingredients' && (
                <>
                  <div style={{ marginBottom:12 }}>
                    <ScaleSelector servings={servings} baseServings={baseServings} onChange={setServings} />
                  </div>
                  {(meal.ingredients||[]).map((ing, i) => (
                    <div key={i} style={{
                      padding:'6px 0', borderBottom:`1px solid rgba(28,10,0,0.04)`,
                      fontSize:13, color:C.ink, display:'flex', alignItems:'baseline', gap:8,
                    }}>
                      <span style={{ color:C.muted, fontSize:11 }}>•</span>
                      <span>{scaleIngredient(ing, scale, units)}</span>
                    </div>
                  ))}
                  {meal.nutrition && (
                    <div style={{ marginTop:14, padding:'10px 12px', background:'rgba(29,158,117,0.05)', borderRadius:10, fontSize:11, color:C.green }}>
                      {(() => {
                        const n = scaleNutrition(meal.nutrition, scale);
                        return `~${n.calories} kcal · ${n.protein}g protein · ${n.carbs}g carbs · ${n.fat}g fat`;
                      })()}
                    </div>
                  )}
                </>
              )}

              {/* METHOD TAB */}
              {activeTab === 'method' && (
                <div>
                  {(meal.method||meal.steps||[]).map((step, i) => (
                    <div key={i} style={{ marginBottom:12 }}>
                      <StepWithTimer text={typeof step === 'string' ? step : (step?.instruction || step?.text || String(step))} index={i} />
                      <button onClick={() => setFocusStep({ step, num:i+1 })}
                        style={{
                          marginTop:4, fontSize:10, color:C.muted,
                          background:'none', border:`1px solid rgba(28,10,0,0.08)`,
                          borderRadius:6, padding:'2px 8px', cursor:'pointer',
                          fontFamily:"'DM Sans',sans-serif",
                        }}>
                        Focus on this step →
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* GROCERY TAB */}
              {activeTab === 'grocery' && (
                <GroceryPanel
                  ingredients={meal.ingredients||[]}
                  pantry={pantry}
                  servings={servings}
                  baseServings={baseServings}
                  units={units}
                />
              )}
            </div>

            {/* Action bar */}
            <div style={{
              display:'flex', justifyContent:'space-between', alignItems:'center',
              padding:'10px 16px', borderTop:`1px solid ${C.border}`,
              background:'rgba(28,10,0,0.01)',
            }}>
              {/* Share */}
              <div style={{ position:'relative' }}>
                <button onClick={() => setShowShare(s => !s)}
                  style={{ display:'flex', alignItems:'center', gap:5, background:'none', border:'1px solid ' + (C.border), borderRadius:8, padding:'6px 12px', fontSize:12, color:C.ink, cursor:'pointer', fontFamily:"'DM Sans',sans-serif" }}>
                  <IconShare /> Share
                </button>
                {showShare && (
                  <>
                    <div onClick={() => setShowShare(false)} style={{ position:'fixed', inset:0, zIndex:100 }}/>
                    <div style={{ position:'absolute', bottom:'calc(100% + 6px)', left:0, background:'white', border:'1px solid ' + (C.border), borderRadius:12, padding:'8px', zIndex:101, minWidth:140, boxShadow:'0 8px 24px rgba(28,10,0,0.1)' }}>
                      <button onClick={handleCopy} style={{ display:'flex', alignItems:'center', gap:8, width:'100%', padding:'8px 10px', border:'none', background:'none', fontSize:12, color:C.ink, cursor:'pointer', borderRadius:8, fontFamily:"'DM Sans',sans-serif" }}>
                        <IconCopy /> {copied ? '✓ Copied!' : 'Copy recipe'}
                      </button>
                      <button onClick={handleWA} style={{ display:'flex', alignItems:'center', gap:8, width:'100%', padding:'8px 10px', border:'none', background:'none', fontSize:12, color:'#25D366', cursor:'pointer', borderRadius:8, fontFamily:"'DM Sans',sans-serif" }}>
                        <span style={{ fontSize:15 }}>📱</span> WhatsApp
                      </button>
                    </div>
                  </>
                )}
              </div>

              {/* Scale */}
              <ScaleSelector servings={servings} baseServings={baseServings} onChange={setServings} />
            </div>
          </div>
        )}
      </div>

      {/* Focus step overlay */}
      {focusStep && (
        <FocusStep
          step={focusStep.step}
          stepNum={focusStep.num}
          total={(meal.method||meal.steps||[]).length}
          onClose={() => setFocusStep(null)}
        />
      )}
    </>
  );
}

export const MealCard = memo(MealCardInner, (prev, next) => {
  // Only re-render if these props change
  return (
    prev.rating      === next.rating      &&
    prev.isFav       === next.isFav       &&
    prev.meal?.name  === next.meal?.name  &&
    prev.defaultServings === next.defaultServings
  );
});
