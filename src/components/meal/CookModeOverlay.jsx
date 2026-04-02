// src/components/meal/CookModeOverlay.jsx
// Fullscreen step-by-step Cook Mode overlay.
// Props: meal, cookStep, setCookStep, onExit

export function CookModeOverlay({ meal, cookStep, setCookStep, onExit }) {
  const totalSteps = meal.steps?.length || 0;

  return (
    <div onClick={e => e.stopPropagation()} style={{
      position:'fixed', inset:0, background:'rgba(28,10,0,0.97)',
      zIndex:9999, display:'flex', flexDirection:'column',
      padding:'28px 24px', fontFamily:"'DM Sans',sans-serif",
    }}>
      {/* Header */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:24 }}>
        <div>
          <div style={{ fontFamily:"'Fraunces',serif", fontSize:22, fontWeight:900, color:'white' }}>
            {meal.emoji} {meal.name}
          </div>
          <div style={{ fontSize:12, color:'rgba(255,255,255,0.5)', marginTop:2 }}>
            Step {cookStep + 1} of {totalSteps}
          </div>
        </div>
        <button onClick={onExit} style={{
          background:'rgba(255,255,255,0.1)', border:'none', color:'white',
          borderRadius:10, padding:'8px 16px', cursor:'pointer', fontSize:13,
          fontFamily:"'DM Sans',sans-serif",
        }}>
          ✕ Exit
        </button>
      </div>

      {/* Step content */}
      <div style={{ flex:1, display:'flex', flexDirection:'column', justifyContent:'center',
        maxWidth:600, margin:'0 auto', width:'100%' }}>

        <div style={{ fontSize:13, color:'rgba(255,69,0,0.8)', fontWeight:600,
          marginBottom:12, letterSpacing:'1px', textTransform:'uppercase' }}>
          Step {cookStep + 1}
        </div>

        <div style={{ fontSize:22, color:'white', lineHeight:1.6, fontWeight:300, marginBottom:32 }}>
          {meal.steps?.[cookStep]}
        </div>

        {/* Progress dots */}
        <div style={{ display:'flex', gap:6, marginBottom:32, flexWrap:'wrap' }}>
          {meal.steps?.map((_, i) => (
            <div key={i} onClick={() => setCookStep(i)}
              style={{
                width: i === cookStep ? 28 : 8, height:8, borderRadius:4, cursor:'pointer',
                background: i === cookStep ? '#FF4500' : i < cookStep ? 'rgba(255,69,0,0.4)' : 'rgba(255,255,255,0.2)',
                transition:'all 0.2s',
              }}
            />
          ))}
        </div>

        {/* Navigation */}
        <div style={{ display:'flex', gap:12 }}>
          <button
            onClick={() => setCookStep(s => Math.max(0, s - 1))}
            disabled={cookStep === 0}
            style={{
              flex:1, padding:'14px', borderRadius:14,
              border:'1px solid rgba(255,255,255,0.15)',
              background:'rgba(255,255,255,0.08)',
              color: cookStep === 0 ? 'rgba(255,255,255,0.3)' : 'white',
              fontSize:15, cursor: cookStep === 0 ? 'not-allowed' : 'pointer',
              fontFamily:"'DM Sans',sans-serif",
            }}>
            ← Previous
          </button>

          {cookStep < totalSteps - 1 ? (
            <button onClick={() => setCookStep(s => s + 1)} style={{
              flex:2, padding:'14px', borderRadius:14, border:'none',
              background:'#FF4500', color:'white', fontSize:15, fontWeight:600,
              cursor:'pointer', fontFamily:"'DM Sans',sans-serif",
            }}>
              Next step →
            </button>
          ) : (
            <button onClick={onExit} style={{
              flex:2, padding:'14px', borderRadius:14, border:'none',
              background:'#1D9E75', color:'white', fontSize:15, fontWeight:600,
              cursor:'pointer', fontFamily:"'DM Sans',sans-serif",
            }}>
              ✓ Done cooking!
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
