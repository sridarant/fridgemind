// src/components/common/RetentionNudges.jsx
// Inline retention nudge banners — one shown at a time, priority order:
//   welcomeBack > weeklyDigest > milestone > didYouCookNudge > upgradeNudge
//
// Challenge + day tracker intentionally NOT rendered here.
// Use the exported <ChallengeTracker challenge={...} mealHistory={...} />
// component to render the merged challenge + progress block BELOW the fold.

const C = { jiff:'#FF4500', ink:'#1C0A00', muted:'#7C6A5E' };

function DismissBtn({ onClick }) {
  return (
    <button onClick={onClick}
      style={{ background:'none', border:'none', color:C.muted, cursor:'pointer', fontSize:16, padding:'0 4px', flexShrink:0 }}>
      {'×'}
    </button>
  );
}

// ── Inline nudges (above fold) ────────────────────────────────────
export default function RetentionNudges({
  welcomeBack, weeklyDigest, milestone, didYouCookNudge,
  upgradeNudge, onDismissUpgrade,
  onConfirmCooked, onDismissNudge, lastFavCuisine,
}) {
  return (
    <>
      {welcomeBack && (
        <div style={{ marginTop:10, padding:'9px 13px', borderRadius:11, background:'rgba(37,99,235,0.05)', border:'1px solid rgba(37,99,235,0.18)', display:'flex', alignItems:'center', gap:10 }}>
          <span style={{ fontSize:18, flexShrink:0 }}>{'👋'}</span>
          <div style={{ flex:1, fontSize:12, color:'#1E40AF', lineHeight:1.5 }}>
            {lastFavCuisine
              ? ('Welcome back! Ready to cook more ' + lastFavCuisine.replace(/_/g,' ') + '?')
              : ('Welcome back! ' + welcomeBack.daysAway + ' days away — great to see you.')}
          </div>
          <DismissBtn onClick={() => onDismissNudge?.('welcome-back')} />
        </div>
      )}

      {!welcomeBack && weeklyDigest && (
        <div style={{ marginTop:10, padding:'9px 13px', borderRadius:11, background:'rgba(29,158,117,0.05)', border:'1px solid rgba(29,158,117,0.18)', display:'flex', alignItems:'center', gap:10 }}>
          <span style={{ fontSize:18, flexShrink:0 }}>{'📊'}</span>
          <div style={{ flex:1, fontSize:12, color:'#065F46', lineHeight:1.5 }}>
            {'Last week: '}
            <strong>{weeklyDigest.cooks}{' meals cooked'}</strong>
            {weeklyDigest.cuisines.length ? (' · ' + weeklyDigest.cuisines.join(', ')) : ''}
            {'. Great week!'}
          </div>
          <DismissBtn onClick={() => onDismissNudge?.('weekly-digest')} />
        </div>
      )}

      {!welcomeBack && !weeklyDigest && milestone && (
        <div style={{ marginTop:10, padding:'9px 13px', borderRadius:11, background:'rgba(217,119,6,0.06)', border:'1px solid rgba(217,119,6,0.22)', display:'flex', alignItems:'center', gap:10 }}>
          <span style={{ fontSize:18, flexShrink:0 }}>{milestone.type === 'rating15' ? '🏆' : '⭐'}</span>
          <div style={{ flex:1, fontSize:12, color:'#92400E', lineHeight:1.5 }}>
            {milestone.type === 'rating5'
              ? 'Jiff now knows your taste — suggestions are getting smarter!'
              : 'Jiff expert! Your personalisation is at its best.'}
          </div>
          <DismissBtn onClick={() => onDismissNudge?.('milestone')} />
        </div>
      )}

      {!welcomeBack && !weeklyDigest && !milestone && didYouCookNudge && (
        <div style={{ marginTop:10, padding:'9px 13px', borderRadius:11, background:'rgba(124,58,237,0.05)', border:'1px solid rgba(124,58,237,0.18)', display:'flex', alignItems:'center', gap:10, flexWrap:'wrap' }}>
          <span style={{ fontSize:17, flexShrink:0 }}>{'🍳'}</span>
          <div style={{ flex:1, fontSize:12, color:'#4C1D95', lineHeight:1.4, minWidth:130 }}>
            {'Did you make '}<strong>{didYouCookNudge.mealName}</strong>{'?'}
          </div>
          <div style={{ display:'flex', gap:6, flexShrink:0 }}>
            <button onClick={onConfirmCooked}
              style={{ fontSize:11, padding:'5px 11px', borderRadius:8, background:'#7C3AED', color:'white', border:'none', cursor:'pointer', fontFamily:"'DM Sans',sans-serif", fontWeight:500 }}>
              {'Yes! 🎉'}
            </button>
            <button onClick={() => onDismissNudge?.('did-you-cook')}
              style={{ fontSize:11, padding:'5px 10px', borderRadius:8, background:'none', color:C.muted, border:'1px solid rgba(28,10,0,0.12)', cursor:'pointer', fontFamily:"'DM Sans',sans-serif" }}>
              {'Not yet'}
            </button>
          </div>
        </div>
      )}

      {upgradeNudge && (
        <div style={{ marginTop:10, padding:'9px 13px', borderRadius:11, background:'rgba(255,69,0,0.05)', border:'1px solid rgba(255,69,0,0.18)', display:'flex', alignItems:'center', gap:10 }}>
          <span style={{ fontSize:17, flexShrink:0 }}>{'⚡'}</span>
          <div style={{ flex:1, fontSize:12, color:'#CC3700', lineHeight:1.5 }}>
            {"You've rated "}{upgradeNudge.ratingCount}{" recipes — unlock everything with Premium."}
          </div>
          <div style={{ display:'flex', gap:6, flexShrink:0 }}>
            <a href="/pricing" style={{ fontSize:11, padding:'5px 11px', borderRadius:8, background:'#FF4500', color:'white', textDecoration:'none', fontFamily:"'DM Sans',sans-serif", fontWeight:600, display:'inline-block' }}>
              {'Upgrade'}
            </a>
            <button onClick={onDismissUpgrade} style={{ fontSize:11, padding:'5px 10px', borderRadius:8, background:'none', color:'#7C6A5E', border:'1px solid rgba(28,10,0,0.12)', cursor:'pointer', fontFamily:"'DM Sans',sans-serif" }}>
              {'Later'}
            </button>
          </div>
        </div>
      )}
    </>
  );
}

// ── Challenge + day tracker (below fold) ──────────────────────────
// Merged component: challenge label + progress dots + 7-day cooking calendar.
// challenge: { label, progress, target, done }
// mealHistory: array of history records
export function ChallengeTracker({ challenge, mealHistory = [] }) {
  if (!challenge && (!Array.isArray(mealHistory) || mealHistory.length === 0)) return null;

  // Build 7-day cooking dots
  const today  = new Date();
  const dow    = today.getDay();
  const monday = new Date(today);
  monday.setDate(today.getDate() - (dow === 0 ? 6 : dow - 1));

  const DAYS = ['M','T','W','T','F','S','S'];
  const weekDots = DAYS.map((label, i) => {
    const d       = new Date(monday);
    d.setDate(monday.getDate() + i);
    const isToday = d.toDateString() === today.toDateString();
    const cooked  = Array.isArray(mealHistory) && mealHistory.some(h => {
      const hd = h.rating && new Date(h.generated_at || h.created_at || '');
      return hd && hd.toDateString() === d.toDateString();
    });
    return { label, isToday, cooked };
  });

  const cookedCount = weekDots.filter(d => d.cooked).length;

  return (
    <div style={{ background:'white', border:'1px solid rgba(28,10,0,0.08)', borderRadius:14, padding:'14px 16px', marginBottom:16 }}>
      {/* Challenge row */}
      {challenge && (
        <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom: cookedCount > 0 || mealHistory.length > 0 ? 12 : 0 }}>
          <span style={{ fontSize:16, flexShrink:0 }}>{challenge.done ? '🏆' : '🎯'}</span>
          <div style={{ flex:1, minWidth:0 }}>
            <div style={{ fontSize:10, color:C.muted, fontWeight:500, textTransform:'uppercase', letterSpacing:'1px', marginBottom:2 }}>
              {"This week's challenge"}
            </div>
            {challenge.done ? (
              <div style={{ fontSize:12, color:'#065F46', fontWeight:600 }}>{'Challenge complete! Great week 🎉'}</div>
            ) : (
              <div style={{ fontSize:12, color:C.ink, fontWeight:500, lineHeight:1.3 }}>{challenge.label}</div>
            )}
          </div>
          {!challenge.done && (
            <div style={{ flexShrink:0, textAlign:'right' }}>
              {/* Progress bar */}
              <div style={{ width:56, height:5, background:'rgba(28,10,0,0.07)', borderRadius:3, overflow:'hidden', marginBottom:3 }}>
                <div style={{ height:'100%', width:Math.round((challenge.progress / challenge.target) * 100)+'%', background:C.jiff, borderRadius:3, transition:'width 0.3s' }} />
              </div>
              <div style={{ fontSize:10, color:C.muted, textAlign:'right' }}>
                {challenge.progress}/{challenge.target}
              </div>
            </div>
          )}
        </div>
      )}

      {/* 7-day cooking tracker */}
      <div style={{ display:'flex', alignItems:'center', gap:8 }}>
        <div style={{ display:'flex', gap:4 }}>
          {weekDots.map((d, i) => (
            <div key={i} style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:2 }}>
              <div style={{ width:9, height:9, borderRadius:'50%', background:d.cooked?C.jiff:d.isToday?'rgba(255,69,0,0.2)':'rgba(28,10,0,0.08)', border:d.isToday?'1.5px solid '+C.jiff:'none', transition:'all 0.18s' }} />
              <span style={{ fontSize:7, color:d.isToday?C.jiff:C.muted, fontWeight:d.isToday?600:400 }}>{d.label}</span>
            </div>
          ))}
        </div>
        {cookedCount > 0 ? (
          <span style={{ fontSize:10, color:C.muted, fontWeight:400 }}>{cookedCount} of 7 days cooked</span>
        ) : (
          <span style={{ fontSize:10, color:C.muted, fontWeight:300 }}>Cook something to start your week tracker</span>
        )}
      </div>
    </div>
  );
}
