// src/components/meal/MealCard.jsx — v22.80
//
// Layout:
//   MOBILE  (<640px): full-width single column, sticky CTA at bottom
//   DESKTOP (≥640px): 2-column — LEFT: header+ingredients+method | RIGHT: video+info+CTA
//
// Structure:
//   Header:      dish name (large), rating, time+servings+diet
//   Visual:      video or VideoButton (RIGHT col on desktop, below header on mobile)
//   CTA:         🔥 Cook this → (sticky on mobile, fixed in right col on desktop)
//   Ingredients: first 5 shown, "View all N ↓" expands rest
//   Method:      first 2 steps, "View all N steps ↓" expands rest
//   Grocery:     inline badge → expands GroceryPanel
//   Footer:      share + servings scale
//
// Tabs: removed. No activeTab state.

import { useState, useRef, memo } from 'react';
import { useLocale }        from '../../contexts/LocaleContext.jsx';
import { scaleIngredient, scaleNutrition } from '../../lib/scaling.js';
import { buildShareText }   from '../../lib/sharing.js';
import { StepWithTimer }    from './StepTimer.jsx';
import { GroceryPanel }     from './GroceryPanel.jsx';
import { VideoButton }      from './VideoButton.jsx';

const C = {
  jiff:'#FF4500', ember:'#CC3700', ink:'#1C0A00', cream:'#FFFAF5',
  muted:'#7C6A5E', green:'#1D9E75', border:'rgba(28,10,0,0.08)',
};

const INGR_PREVIEW  = 5;
const STEPS_PREVIEW = 2;

// ── Responsive hook ────────────────────────────────────────────────
function useIsDesktop() {
  const [desk, setDesk] = useState(() => typeof window !== 'undefined' && window.innerWidth >= 640);
  // Simple — just read on mount; no resize listener needed for card layout
  return desk;
}

// ── Icons ──────────────────────────────────────────────────────────
const IconHeart = ({ filled }) => (
  <svg viewBox="0 0 24 24" fill={filled ? '#E53E3E' : 'none'} stroke={filled ? '#E53E3E' : 'currentColor'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width:18, height:18 }}>
    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
  </svg>
);
const IconShare = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width:15, height:15 }}>
    <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>
    <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
  </svg>
);
const IconCopy = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width:15, height:15 }}>
    <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
  </svg>
);

// ── EmbeddedVideo ─────────────────────────────────────────────────
function EmbeddedVideo({ videoId, title }) {
  const [loaded, setLoaded] = useState(false);
  if (!videoId) return null;
  return (
    <div style={{ borderRadius:10, overflow:'hidden', background:'#000', position:'relative', aspectRatio:'16/9', width:'100%' }}>
      {loaded ? (
        <iframe
          src={'https://www.youtube.com/embed/' + videoId + '?autoplay=0&rel=0&modestbranding=1'}
          title={title || 'Recipe video'}
          allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          style={{ width:'100%', height:'100%', border:'none', display:'block' }}
        />
      ) : (
        <button onClick={() => setLoaded(true)}
          style={{ width:'100%', height:'100%', border:'none', background:'transparent', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:10, position:'absolute', inset:0 }}>
          <img src={'https://img.youtube.com/vi/' + videoId + '/mqdefault.jpg'} alt={title || 'Recipe video'}
            style={{ position:'absolute', inset:0, width:'100%', height:'100%', objectFit:'cover' }} />
          <div style={{ position:'relative', zIndex:1, width:44, height:44, borderRadius:'50%', background:'rgba(220,0,0,0.9)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
            <svg viewBox="0 0 24 24" fill="white" style={{ width:18, height:18, marginLeft:3 }}><polygon points="5 3 19 12 5 21 5 3"/></svg>
          </div>
          <div style={{ position:'relative', zIndex:1, fontSize:11, color:'white', background:'rgba(0,0,0,0.55)', padding:'3px 10px', borderRadius:20, backdropFilter:'blur(4px)', whiteSpace:'nowrap' }}>
            {'Watch quick recipe'}
          </div>
        </button>
      )}
    </div>
  );
}

// ── Star rating ────────────────────────────────────────────────────
function StarRating({ value, onChange, size = 14 }) {
  const [hov, setHov] = useState(0);
  return (
    <div style={{ display:'flex', gap:2 }}>
      {[1,2,3,4,5].map(n => (
        <button key={n} onClick={() => onChange?.(n)}
          onMouseEnter={() => setHov(n)} onMouseLeave={() => setHov(0)}
          style={{ background:'none', border:'none', cursor:'pointer', padding:0, fontSize:size, lineHeight:1 }}>
          {(hov || value) >= n ? '⭐' : '☆'}
        </button>
      ))}
    </div>
  );
}

// ── Scale selector ─────────────────────────────────────────────────
function ScaleSelector({ servings, baseServings, onChange }) {
  const opts = [1,2,3,4,6,8].filter(n => n !== baseServings);
  opts.unshift(baseServings);
  return (
    <div style={{ display:'flex', gap:4, alignItems:'center' }}>
      <span style={{ fontSize:11, color:C.muted, marginRight:4 }}>{'Serves:'}</span>
      {opts.slice(0,5).map(n => (
        <button key={n} onClick={() => onChange(n)}
          style={{ width:28, height:28, borderRadius:'50%', border:'none', background:servings===n?C.jiff:'rgba(28,10,0,0.06)', color:servings===n?'white':C.ink, fontSize:11, fontWeight:servings===n?600:400, cursor:'pointer', fontFamily:"'DM Sans',sans-serif", touchAction:'manipulation' }}>
          {n}
        </button>
      ))}
    </div>
  );
}

// ── Cook CTA button ────────────────────────────────────────────────
function CookCTA({ onClick }) {
  const [hov, setHov] = useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:8, width:'100%', padding:'14px 16px', borderRadius:13, background:hov ? C.ember : C.jiff, color:'white', border:'none', fontSize:15, fontWeight:700, cursor:'pointer', fontFamily:"'DM Sans',sans-serif", transition:'background 0.13s', touchAction:'manipulation', letterSpacing:'0.2px' }}>
      {'🔥 Cook this →'}
    </button>
  );
}

// ── View-more expand link ──────────────────────────────────────────
function ViewMore({ label, onClick }) {
  return (
    <button onClick={onClick}
      style={{ background:'none', border:'none', cursor:'pointer', fontSize:12, color:C.jiff, fontFamily:"'DM Sans',sans-serif", fontWeight:600, padding:'8px 0', display:'flex', alignItems:'center', gap:3 }}>
      {label}{' ↓'}
    </button>
  );
}

// ── Focus step overlay ─────────────────────────────────────────────
function FocusStep({ step, stepNum, total, onClose }) {
  return (
    <div style={{ position:'fixed', inset:0, zIndex:9500, background:'#1C0A00', display:'flex', flexDirection:'column', fontFamily:"'DM Sans',sans-serif" }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'20px 24px' }}>
        <div style={{ fontSize:12, color:'rgba(255,255,255,0.5)' }}>{'Step '}{stepNum}{' of '}{total}</div>
        <button onClick={onClose} style={{ background:'none', border:'none', color:'rgba(255,255,255,0.6)', fontSize:24, cursor:'pointer', lineHeight:1 }}>{'✕'}</button>
      </div>
      <div style={{ flex:1, display:'flex', flexDirection:'column', justifyContent:'center', padding:'24px 32px' }}>
        <div style={{ fontSize:'clamp(18px,4vw,26px)', color:'white', lineHeight:1.6, fontWeight:300 }}>
          {step.instruction || step}
        </div>
      </div>
    </div>
  );
}

// ── Section heading ────────────────────────────────────────────────
function SH({ children, count, borderTop = true }) {
  return (
    <div style={{ fontSize:12, fontWeight:700, color:C.ink, marginBottom:10, letterSpacing:'0.3px', ...(borderTop ? { borderTop:'1px solid '+C.border, paddingTop:12, marginTop:4 } : {}) }}>
      {children}
      {count != null && (
        <span style={{ fontSize:10, color:C.muted, fontWeight:400, marginLeft:6 }}>({count})</span>
      )}
    </div>
  );
}

// ── Shared share popup ────────────────────────────────────────────
function SharePopup({ show, onClose, onCopy, copied, onWhatsApp }) {
  if (!show) return null;
  return (
    <>
      <div onClick={onClose} style={{ position:'fixed', inset:0, zIndex:100 }}/>
      <div style={{ position:'absolute', bottom:'calc(100% + 6px)', left:0, background:'white', border:'1px solid rgba(28,10,0,0.08)', borderRadius:12, padding:'8px', zIndex:101, minWidth:140, boxShadow:'0 8px 24px rgba(28,10,0,0.1)' }}>
        <button onClick={onCopy} style={{ display:'flex', alignItems:'center', gap:8, width:'100%', padding:'8px 10px', border:'none', background:'none', fontSize:12, color:'#1C0A00', cursor:'pointer', borderRadius:8, fontFamily:"'DM Sans',sans-serif" }}>
          <IconCopy /> {copied ? '✓ Copied!' : 'Copy recipe'}
        </button>
        <button onClick={onWhatsApp} style={{ display:'flex', alignItems:'center', gap:8, width:'100%', padding:'8px 10px', border:'none', background:'none', fontSize:12, color:'#25D366', cursor:'pointer', borderRadius:8, fontFamily:"'DM Sans',sans-serif" }}>
          <span style={{ fontSize:15 }}>{'📱'}</span> {'WhatsApp'}
        </button>
      </div>
    </>
  );
}
// ── Main ───────────────────────────────────────────────────────────
const MealCardInner = function MealCard({
  meal, isFav, onToggleFav,
  rating, onRate,
  pantry = [], lang = 'en',
}) {
  const { units } = useLocale();
  const isDesktop = useIsDesktop();

  const [expanded,     setExpanded]     = useState(false);
  const [showAllIngr,  setShowAllIngr]  = useState(false);
  const [showAllSteps, setShowAllSteps] = useState(false);
  const [groceryOpen,  setGroceryOpen]  = useState(false);
  const [servings,     setServings]     = useState(meal?.servings || 2);
  const [showShare,    setShowShare]    = useState(false);
  const [copied,       setCopied]       = useState(false);
  const [focusStep,    setFocusStep]    = useState(null);
  const cardRef = useRef(null);

  if (!meal) return null;

  const baseServings     = meal.servings || 2;
  const scale            = servings / baseServings;
  const steps            = meal.method || meal.steps || [];
  const ingredients      = meal.ingredients || [];
  const visibleIngr      = showAllIngr  ? ingredients : ingredients.slice(0, INGR_PREVIEW);
  const visibleSteps     = showAllSteps ? steps       : steps.slice(0, STEPS_PREVIEW);
  const pantryLower      = (pantry || []).map(p => p.toLowerCase().trim());
  const missingItems     = ingredients.filter(ing => {
    const name = (typeof ing === 'string' ? ing : ing.name || ing.item || '').toLowerCase();
    return name && !pantryLower.some(p => name.includes(p) || p.includes(name.split(' ')[0]));
  });

  const handleCookThis = () => {
    if (!expanded) setExpanded(true);
    setTimeout(() => cardRef.current?.scrollIntoView({ behavior:'smooth', block:'start' }), 100);
  };

  const handleCopy = () => {
    navigator.clipboard?.writeText(buildShareText(meal, lang)).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  // ── Ingredients block (shared between layouts) ─────────────────
  const IngrBlock = (
    <div>
      <SH count={ingredients.length} borderTop={false}>{'Ingredients'}</SH>
      {visibleIngr.map((ing, i) => (
        <div key={i} style={{ padding:'5px 0', borderBottom:'1px solid rgba(28,10,0,0.04)', fontSize:13, color:C.ink, display:'flex', alignItems:'baseline', gap:8 }}>
          <span style={{ color:C.muted, fontSize:11, flexShrink:0 }}>{'•'}</span>
          <span>{scaleIngredient(ing, scale, units)}</span>
        </div>
      ))}
      {!showAllIngr && ingredients.length > INGR_PREVIEW && (
        <ViewMore label={'View all ' + ingredients.length + ' ingredients'} onClick={() => setShowAllIngr(true)} />
      )}
      {meal.nutrition && (
        <div style={{ marginTop:10, padding:'7px 12px', background:'rgba(29,158,117,0.05)', borderRadius:8, fontSize:11, color:C.green }}>
          {(() => { const n = scaleNutrition(meal.nutrition, scale); return '~' + n.calories + ' kcal · ' + n.protein + 'g protein · ' + n.carbs + 'g carbs · ' + n.fat + 'g fat'; })()}
        </div>
      )}
    </div>
  );

  // ── Method block (shared) ─────────────────────────────────────
  const MethodBlock = steps.length > 0 ? (
    <div style={{ marginTop:16 }}>
      <SH count={steps.length + ' steps'}>{'Method'}</SH>
      {visibleSteps.map((step, i) => (
        <div key={i} style={{ marginBottom:12 }}>
          <div style={{ fontSize:10, fontWeight:600, color:C.muted, marginBottom:3 }}>{'Step '}{i + 1}</div>
          <StepWithTimer
            text={typeof step === 'string' ? step : (step?.instruction || step?.text || String(step))}
            index={i}
          />
          <button onClick={() => setFocusStep({ step, num:i+1 })}
            style={{ marginTop:4, fontSize:10, color:C.muted, background:'none', border:'1px solid rgba(28,10,0,0.08)', borderRadius:6, padding:'2px 8px', cursor:'pointer', fontFamily:"'DM Sans',sans-serif" }}>
            {'Focus →'}
          </button>
        </div>
      ))}
      {!showAllSteps && steps.length > STEPS_PREVIEW && (
        <ViewMore label={'View all ' + steps.length + ' steps'} onClick={() => setShowAllSteps(true)} />
      )}
    </div>
  ) : null;

  // ── Grocery block (shared) ───────────────────────────────────
  const GroceryBlock = missingItems.length > 0 ? (
    <div style={{ marginTop:12 }}>
      <button onClick={() => setGroceryOpen(v => !v)}
        style={{ display:'flex', alignItems:'center', gap:6, background:'rgba(217,119,6,0.07)', border:'1px solid rgba(217,119,6,0.22)', borderRadius:8, padding:'7px 12px', fontSize:12, color:'#92400E', fontWeight:500, cursor:'pointer', fontFamily:"'DM Sans',sans-serif", width:'100%', textAlign:'left' }}>
        <span>{'🛒'}</span>
        <span>{'Missing '}{missingItems.length}{' item'}{missingItems.length>1?'s':''}{' → '}{groceryOpen?'Hide':'View'}</span>
      </button>
      {groceryOpen && (
        <div style={{ marginTop:8 }}>
          <GroceryPanel ingredients={ingredients} pantry={pantry} servings={servings} baseServings={baseServings} units={units} />
        </div>
      )}
    </div>
  ) : null;

  // ── Header (always visible, same on all layouts) ─────────────
  const Header = (
    <div style={{ padding:'14px 16px 0' }}>
      <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:10, marginBottom:7 }}>
        <div style={{ flex:1, minWidth:0, display:'flex', alignItems:'center', gap:9 }}>
          <span style={{ fontSize:24, flexShrink:0 }}>{meal.emoji || '🍽️'}</span>
          <span style={{ fontFamily:"'Fraunces',serif", fontSize:isDesktop?20:17, fontWeight:700, color:C.ink, lineHeight:1.25 }}>
            {meal.name}
          </span>
        </div>
        {/* Fav — stopPropagation prevents card toggle */}
        <button
          onClick={e => { e.stopPropagation(); onToggleFav?.(meal); }}
          style={{ background:'none', border:'none', cursor:'pointer', padding:4, flexShrink:0, zIndex:5, pointerEvents:'auto', touchAction:'manipulation' }}>
          <IconHeart filled={isFav} />
        </button>
      </div>

      {/* Meta row */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:6, paddingBottom:12 }}>
        <div style={{ fontSize:11, color:C.muted, display:'flex', gap:10, flexWrap:'wrap' }}>
          {meal.time     && <span>{'⏱ '}{meal.time}</span>}
          {meal.servings && <span>{'👥 '}{meal.servings}</span>}
          {meal.diet     && <span style={{ color:C.green }}>{'🌿 '}{meal.diet}</span>}
          {ingredients.length > 0 && <span>{'🥘 '}{ingredients.length}{' ingr'}</span>}
        </div>
        <StarRating value={rating||0} onChange={r => onRate?.(r)} />
      </div>
    </div>
  );

  return (
    <>
      <div ref={cardRef} style={{
        background:   'white',
        border:       '1px solid ' + C.border,
        borderRadius: 16,
        overflow:     'hidden',
        fontFamily:   "'DM Sans', sans-serif",
        marginBottom: 14,
        maxWidth:     '100%',
        boxSizing:    'border-box',
      }}>

        {/* ── DESKTOP 2-COLUMN LAYOUT ── */}
        {isDesktop ? (
          <>
            {Header}
            <div style={{ display:'grid', gridTemplateColumns:'1fr 320px', gap:0, borderTop:'1px solid '+C.border }}>

              {/* LEFT: ingredients + method */}
              <div style={{ padding:'16px 20px 16px 16px', borderRight:'1px solid '+C.border, overflowY:'auto' }}>
                {IngrBlock}
                {MethodBlock}
                {GroceryBlock}

                {/* Footer actions */}
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginTop:16, paddingTop:12, borderTop:'1px solid '+C.border }}>
                  <div style={{ position:'relative' }}>
                    <button onClick={() => setShowShare(s => !s)}
                      style={{ display:'flex', alignItems:'center', gap:5, background:'none', border:'1px solid '+C.border, borderRadius:8, padding:'6px 12px', fontSize:12, color:C.ink, cursor:'pointer', fontFamily:"'DM Sans',sans-serif" }}>
                      <IconShare /> {'Share'}
                    </button>
                    <SharePopup show={showShare} onClose={() => setShowShare(false)} onCopy={handleCopy} copied={copied} onWhatsApp={() => window.open('https://api.whatsapp.com/send?text='+encodeURIComponent(buildShareText(meal, lang)), '_blank')} />
                  </div>
                  <ScaleSelector servings={servings} baseServings={baseServings} onChange={setServings} />
                </div>
              </div>

              {/* RIGHT: video + quick info + CTA (sticky within right col) */}
              <div style={{ padding:'16px', display:'flex', flexDirection:'column', gap:12 }}>
                {/* Video */}
                {meal.videoId
                  ? <EmbeddedVideo videoId={meal.videoId} title={meal.videoTitle} />
                  : <VideoButton recipeName={meal.name} compact />
                }

                {/* Description — fills space between video and CTA */}
                {meal.description && (
                  <div style={{ fontSize:12, color:C.muted, lineHeight:1.6, fontWeight:300, flex:1 }}>
                    {meal.description}
                  </div>
                )}

                {/* CTA — sticky at bottom of right col */}
                <div style={{ marginTop:'auto' }}>
                  <CookCTA onClick={handleCookThis} />
                </div>
              </div>
            </div>
          </>

        ) : (
          /* ── MOBILE SINGLE-COLUMN LAYOUT ── */
          <>
            {Header}

            {/* CTA — always visible, no expand needed */}
            <div style={{ padding:'0 12px 10px' }}>
              <CookCTA onClick={handleCookThis} />
            </div>

            {/* Expand toggle */}
            <button
              onClick={() => setExpanded(v => !v)}
              style={{ width:'100%', padding:'7px 12px 10px', background:'none', border:'none', borderTop:'1px solid '+C.border, cursor:'pointer', fontSize:11, color:C.muted, display:'flex', alignItems:'center', gap:5, fontFamily:"'DM Sans',sans-serif", touchAction:'manipulation' }}>
              <span style={{ display:'inline-block', transform:expanded?'rotate(180deg)':'none', transition:'transform 0.2s', fontSize:14 }}>{'▾'}</span>
              <span>{expanded ? 'Hide recipe' : 'See recipe'}</span>
            </button>

            {expanded && (
              <div style={{ padding:'0 12px 12px' }}>
                {/* Video */}
                <div style={{ marginBottom:14 }}>
                  {meal.videoId
                    ? <EmbeddedVideo videoId={meal.videoId} title={meal.videoTitle} />
                    : <VideoButton recipeName={meal.name} compact />
                  }
                </div>

                {IngrBlock}
                {MethodBlock}
                {GroceryBlock}

                {/* Footer */}
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginTop:14, paddingTop:12, borderTop:'1px solid '+C.border }}>
                  <div style={{ position:'relative' }}>
                    <button onClick={() => setShowShare(s => !s)}
                      style={{ display:'flex', alignItems:'center', gap:5, background:'none', border:'1px solid '+C.border, borderRadius:8, padding:'6px 12px', fontSize:12, color:C.ink, cursor:'pointer', fontFamily:"'DM Sans',sans-serif" }}>
                      <IconShare /> {'Share'}
                    </button>
                    <SharePopup show={showShare} onClose={() => setShowShare(false)} onCopy={handleCopy} copied={copied} onWhatsApp={() => window.open('https://api.whatsapp.com/send?text='+encodeURIComponent(buildShareText(meal, lang)), '_blank')} />
                  </div>
                  <ScaleSelector servings={servings} baseServings={baseServings} onChange={setServings} />
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {focusStep && (
        <FocusStep step={focusStep.step} stepNum={focusStep.num} total={steps.length} onClose={() => setFocusStep(null)} />
      )}
    </>
  );
};

export const MealCard = memo(MealCardInner, (prev, next) =>
  prev.rating          === next.rating     &&
  prev.isFav           === next.isFav      &&
  prev.meal?.name      === next.meal?.name &&
  prev.defaultServings === next.defaultServings
);
