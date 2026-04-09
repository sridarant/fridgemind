// src/components/profile/GoalsTab.jsx
import { GOAL_CONTEXTS } from '../../lib/cuisine';

function WeekStrip({ mealHistory, C }) {
  const days  = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
  const today = new Date();
  const weekData = days.map((label, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() - (today.getDay() === 0 ? 6 : today.getDay() - 1) + i);
    const dateStr = d.toDateString();
    const cooked  = Array.isArray(mealHistory) && mealHistory.some(h => {
      const hd = h.rating && new Date(h.generated_at || h.created_at || '');
      return hd && hd.toDateString() === dateStr;
    });
    return { label, cooked, isToday: d.toDateString() === today.toDateString() };
  });

  return (
    <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', gap:4, marginBottom:16 }}>
      {weekData.map((d, i) => (
        <div key={i} style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:3, padding:'8px 4px', background: d.isToday ? 'rgba(255,69,0,0.06)' : 'rgba(28,10,0,0.02)', borderRadius:10, border:'1px solid ' + (d.isToday ? 'rgba(255,69,0,0.2)' : C.border) }}>
          <span style={{ fontSize:9, color:C.muted, fontWeight:500 }}>{d.label}</span>
          <span style={{ fontSize:14 }}>{d.cooked ? '✓' : '–'}</span>
        </div>
      ))}
    </div>
  );
}

export default function GoalsTab({
  activeGoal, setActiveGoal,
  calorieTarget, setCalorieTarget,
  mealHistory, cookedCount, avgRating,
  pill, C,
}) {
  return (
    <div>
      <SectionLabel C={C}>Active goal</SectionLabel>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:10, marginBottom:24 }}>
        {Object.entries(GOAL_CONTEXTS).map(([id, goal]) => (
          <button key={id} onClick={() => setActiveGoal(activeGoal === id ? '' : id)}
            style={{ padding:'14px 12px', border:'2px solid ' + (activeGoal===id ? C.jiff : C.border), borderRadius:14, background: activeGoal===id ? 'rgba(255,69,0,0.06)' : 'white', cursor:'pointer', textAlign:'left', fontFamily:"'DM Sans',sans-serif", transition:'all 0.12s', display:'flex', flexDirection:'column', gap:6, minHeight:80 }}>
            <span style={{ fontSize:24 }}>{goal.emoji}</span>
            <span style={{ fontSize:12, fontWeight:600, color: activeGoal===id ? C.jiff : C.ink }}>{goal.label}</span>
          </button>
        ))}
      </div>

      <SectionLabel C={C}>Daily calorie target (optional)</SectionLabel>
      <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:8 }}>
        <input type="number" value={calorieTarget} onChange={e => setCalorieTarget(e.target.value)}
          placeholder="e.g. 1800"
          style={{ width:120, padding:'9px 12px', border:'1px solid ' + C.border, borderRadius:8, fontSize:13, fontFamily:"'DM Sans',sans-serif", outline:'none' }}
        />
        <span style={{ fontSize:13, color:C.muted }}>kcal / day</span>
      </div>
      <div style={{ fontSize:11, color:C.gold, background:'rgba(217,119,6,0.07)', border:'1px solid rgba(217,119,6,0.2)', borderRadius:8, padding:'8px 12px', marginBottom:24 }}>
        {'ⓘ Rating a recipe updates your nutrition tracking'}
      </div>

      <SectionLabel C={C}>This week</SectionLabel>
      <WeekStrip mealHistory={mealHistory} C={C} />

      {cookedCount > 0 && (
        <div style={{ padding:'12px 16px', background:'white', border:'1px solid ' + C.border, borderRadius:12, fontSize:13, color:C.ink }}>
          {'🍳 '}{cookedCount}{' recipes rated this week'}
          {avgRating > 0 && ' · avg ★' + avgRating.toFixed(1)}
        </div>
      )}
    </div>
  );
}

function SectionLabel({ children, C }) {
  return (
    <div style={{ fontSize:10, letterSpacing:'1.5px', textTransform:'uppercase', color:C.jiff, fontWeight:700, marginBottom:10, display:'flex', alignItems:'center', gap:8 }}>
      {children}
      <div style={{ flex:1, height:1, background:C.border }} />
    </div>
  );
}
