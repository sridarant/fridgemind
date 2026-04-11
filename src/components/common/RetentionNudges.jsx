// src/components/common/RetentionNudges.jsx
// Retention nudge banners shown in Zone 1 of the home screen.
// One nudge shown at a time in priority order:
//   welcomeBack > weeklyDigest > milestone > didYouCookNudge
// Weekly challenge strip always shown below if active.

const C = { jiff:'#FF4500', ink:'#1C0A00', muted:'#7C6A5E' };

function DismissBtn({ onClick }) {
  return (
    <button onClick={onClick}
      style={{ background:'none', border:'none', color:C.muted, cursor:'pointer', fontSize:16, padding:'0 4px', flexShrink:0 }}>
      {'×'}
    </button>
  );
}

export default function RetentionNudges({
  welcomeBack, weeklyDigest, milestone, didYouCookNudge, challenge,
  onConfirmCooked, onDismissNudge, lastFavCuisine,
}) {
  return (
    <>
      {/* Welcome-back (highest priority) */}
      {welcomeBack && (
        <div style={{ marginTop:12, padding:'10px 14px', borderRadius:12, background:'rgba(37,99,235,0.06)', border:'1px solid rgba(37,99,235,0.2)', display:'flex', alignItems:'center', gap:10 }}>
          <span style={{ fontSize:20, flexShrink:0 }}>{'👋'}</span>
          <div style={{ flex:1, fontSize:12, color:'#1E40AF', lineHeight:1.5 }}>
            {lastFavCuisine
              ? ('Welcome back! Ready to cook more ' + lastFavCuisine.replace(/_/g,' ') + '?')
              : ('Welcome back! ' + welcomeBack.daysAway + ' days away — a lot to catch up on.')}
          </div>
          <DismissBtn onClick={() => onDismissNudge?.('welcome-back')} />
        </div>
      )}

      {/* Weekly digest (Monday) */}
      {!welcomeBack && weeklyDigest && (
        <div style={{ marginTop:12, padding:'10px 14px', borderRadius:12, background:'rgba(29,158,117,0.06)', border:'1px solid rgba(29,158,117,0.2)', display:'flex', alignItems:'center', gap:10 }}>
          <span style={{ fontSize:20, flexShrink:0 }}>{'📊'}</span>
          <div style={{ flex:1, fontSize:12, color:'#065F46', lineHeight:1.5 }}>
            {'Last week: '}
            <strong>{weeklyDigest.cooks}{' meals cooked'}</strong>
            {weeklyDigest.cuisines.length ? (' · ' + weeklyDigest.cuisines.join(', ')) : ''}
            {'. Great week!'}
          </div>
          <DismissBtn onClick={() => onDismissNudge?.('weekly-digest')} />
        </div>
      )}

      {/* Personalisation milestone */}
      {!welcomeBack && !weeklyDigest && milestone && (
        <div style={{ marginTop:12, padding:'10px 14px', borderRadius:12, background:'rgba(217,119,6,0.07)', border:'1px solid rgba(217,119,6,0.25)', display:'flex', alignItems:'center', gap:10 }}>
          <span style={{ fontSize:20, flexShrink:0 }}>{milestone.type === 'rating15' ? '🏆' : '⭐'}</span>
          <div style={{ flex:1, fontSize:12, color:'#92400E', lineHeight:1.5 }}>
            {milestone.type === 'rating5'
              ? 'Jiff now knows your taste — suggestions are getting smarter!'
              : 'Jiff expert! Your personalisation is now at its best.'}
          </div>
          <DismissBtn onClick={() => onDismissNudge?.('milestone')} />
        </div>
      )}

      {/* Did you cook this? */}
      {!welcomeBack && !weeklyDigest && !milestone && didYouCookNudge && (
        <div style={{ marginTop:12, padding:'10px 14px', borderRadius:12, background:'rgba(124,58,237,0.06)', border:'1px solid rgba(124,58,237,0.2)', display:'flex', alignItems:'center', gap:10, flexWrap:'wrap' }}>
          <span style={{ fontSize:18, flexShrink:0 }}>{'🍳'}</span>
          <div style={{ flex:1, fontSize:12, color:'#4C1D95', lineHeight:1.4, minWidth:140 }}>
            {'Did you make '}<strong>{didYouCookNudge.mealName}</strong>{'?'}
          </div>
          <div style={{ display:'flex', gap:6, flexShrink:0 }}>
            <button onClick={onConfirmCooked}
              style={{ fontSize:11, padding:'5px 12px', borderRadius:8, background:'#7C3AED', color:'white', border:'none', cursor:'pointer', fontFamily:"'DM Sans',sans-serif", fontWeight:500 }}>
              {'Yes! 🎉'}
            </button>
            <button onClick={() => onDismissNudge?.('did-you-cook')}
              style={{ fontSize:11, padding:'5px 10px', borderRadius:8, background:'none', color:C.muted, border:'1px solid rgba(28,10,0,0.12)', cursor:'pointer', fontFamily:"'DM Sans',sans-serif" }}>
              {'Not yet'}
            </button>
          </div>
        </div>
      )}

      {/* Weekly challenge strip */}
      {challenge && !challenge.done && (
        <div style={{ marginTop:10, padding:'8px 12px', borderRadius:10, background:'rgba(255,69,0,0.04)', border:'1px solid rgba(255,69,0,0.12)', display:'flex', alignItems:'center', gap:10 }}>
          <span style={{ fontSize:16, flexShrink:0 }}>{'🏆'}</span>
          <div style={{ flex:1, minWidth:0 }}>
            <div style={{ fontSize:11, color:C.muted, fontWeight:300 }}>{"This week's challenge"}</div>
            <div style={{ fontSize:12, color:C.ink, fontWeight:500, lineHeight:1.3 }}>{challenge.label}</div>
          </div>
          <div style={{ flexShrink:0, textAlign:'right' }}>
            <div style={{ fontSize:13, fontWeight:700, color:C.jiff }}>{challenge.progress}/{challenge.target}</div>
            <div style={{ fontSize:9, color:C.muted }}>{'done'}</div>
          </div>
        </div>
      )}
      {challenge?.done && (
        <div style={{ marginTop:10, padding:'8px 12px', borderRadius:10, background:'rgba(29,158,117,0.07)', border:'1px solid rgba(29,158,117,0.2)', display:'flex', alignItems:'center', gap:8 }}>
          <span>{'🏆'}</span>
          <span style={{ fontSize:12, color:'#065F46', fontWeight:500 }}>{'Weekly challenge complete! Great cooking this week.'}</span>
        </div>
      )}
    </>
  );
}
