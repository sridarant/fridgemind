// src/pages/admin/tabs/overview.jsx
export default function Tab_OVERVIEW({ C, Card, stats, waitlist, loading }) {

  function StatPill({ label, value, color, sub }) {
    return (
      <div style={{ background:'white', border:'1px solid '+C.border, borderRadius:12, padding:'14px 16px' }}>
        <div style={{ fontFamily:"'Fraunces',serif", fontSize:28, fontWeight:900, color: color||C.ink, lineHeight:1 }}>
          {value ?? '—'}
        </div>
        <div style={{ fontSize:11, color:C.muted, fontWeight:400, marginTop:4 }}>{label}</div>
        {sub && <div style={{ fontSize:10, color:C.muted, marginTop:2, fontWeight:300 }}>{sub}</div>}
      </div>
    );
  }

  const trend = stats?.weeklyTrend || [];
  const maxMeals = Math.max(...trend.map(d => d.meals || 0), 1);
  const totalWeek = trend.reduce((s,d) => s + (d.meals||0), 0);
  const todayBar  = trend[trend.length - 1];

  return (
    <>
      {/* Stat pills */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(130px,1fr))', gap:12, marginBottom:20 }}>
        <StatPill label="Total users"     value={stats?.totalUsers?.toLocaleString()}  color={C.jiff}  />
        <StatPill label="Meals generated" value={stats?.totalMeals?.toLocaleString()}  color="#673AB7" />
        <StatPill label="Active today"    value={stats?.todayUsers}                     color={C.green} />
        <StatPill label="Countries"       value={stats?.countriesCount}                 color={C.gold}  />
        <StatPill label="Waitlist"        value={(waitlist||[]).length}                 color="#E91E63" />
      </div>

      {!stats && !loading && (
        <div style={{ padding:'20px', textAlign:'center', color:C.muted, fontSize:13, background:'white', borderRadius:12, border:'1px solid '+C.border }}>
          Stats require Supabase service key. Check <code style={{ fontSize:11 }}>SUPABASE_SERVICE_ROLE_KEY</code> in Vercel.
        </div>
      )}
      {loading && <div style={{ textAlign:'center', color:C.muted, fontSize:13, padding:'20px' }}>⏳ Loading…</div>}

      {/* Activity this week — last 7 days */}
      {trend.length > 0 && (
        <Card title={'Meals generated — last 7 days · ' + totalWeek + ' total'}>
          <div style={{ display:'flex', alignItems:'flex-end', gap:6, height:80, marginBottom:8 }}>
            {trend.map((d, i) => {
              const h     = Math.max(Math.round((d.meals / maxMeals) * 64), d.meals > 0 ? 4 : 2);
              const isToday = i === trend.length - 1;
              return (
                <div key={d.day} style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:4 }}>
                  {d.meals > 0 && (
                    <div style={{ fontSize:9, color: isToday ? C.jiff : C.muted, fontWeight: isToday ? 600 : 400 }}>
                      {d.meals}
                    </div>
                  )}
                  <div style={{
                    width:'100%', height:h,
                    background: isToday ? C.jiff : 'rgba(255,69,0,0.25)',
                    borderRadius:'3px 3px 0 0',
                    minHeight:2,
                    transition:'height 0.6s ease',
                  }}/>
                  <div style={{
                    fontSize:8, color: isToday ? C.jiff : C.muted,
                    fontWeight: isToday ? 600 : 400,
                    textAlign:'center', lineHeight:1.3,
                  }}>
                    {d.day}
                  </div>
                </div>
              );
            })}
          </div>
          {todayBar && (
            <div style={{ fontSize:11, color:C.muted, textAlign:'right', fontWeight:300 }}>
              Today: <strong style={{ color:C.jiff }}>{todayBar.meals}</strong> meals
            </div>
          )}
        </Card>
      )}

      {/* Top cuisines */}
      {stats?.topCuisines?.length > 0 && (
        <Card title="Top cuisines">
          {stats.topCuisines.map(c => (
            <div key={c.name} style={{ display:'flex', alignItems:'center', gap:10, marginBottom:8 }}>
              <div style={{ fontSize:12, color:C.ink, width:130, flexShrink:0, textTransform:'capitalize' }}>{c.name}</div>
              <div style={{ flex:1, height:6, background:'rgba(28,10,0,0.07)', borderRadius:3 }}>
                <div style={{ height:'100%', width:c.pct+'%', background:C.jiff, borderRadius:3, transition:'width 0.8s ease' }}/>
              </div>
              <div style={{ fontSize:11, color:C.muted, width:70, textAlign:'right' }}>{c.count?.toLocaleString()} · {c.pct}%</div>
            </div>
          ))}
        </Card>
      )}
    </>
  );
}
