// src/pages/Insights.jsx — Meal Insights Dashboard
// Shows cuisine breakdown, nutrition trends, top ingredients, rating history

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const C = {
  jiff:'#FF4500', ink:'#1C0A00', cream:'#FFFAF5', warm:'#FFF0E5',
  muted:'#7C6A5E', border:'rgba(28,10,0,0.10)', shadow:'0 4px 24px rgba(28,10,0,0.08)',
  green:'#1D9E75', gold:'#FFB800', purple:'#673AB7',
};

function StatCard({ label, value, sub, color, emoji }) {
  return (
    <div style={{ background:'white', border:'1px solid '+C.border, borderRadius:16,
      padding:'18px 20px', boxShadow:C.shadow }}>
      <div style={{ fontSize:28, marginBottom:4 }}>{emoji}</div>
      <div style={{ fontFamily:"'Fraunces',serif", fontSize:34, fontWeight:900,
        color:color||C.jiff, lineHeight:1 }}>{value ?? '—'}</div>
      <div style={{ fontSize:12, color:C.ink, fontWeight:500, marginTop:4 }}>{label}</div>
      {sub && <div style={{ fontSize:11, color:C.muted, marginTop:2, fontWeight:300 }}>{sub}</div>}
    </div>
  );
}

function BarChart({ data, color }) {
  const max = Math.max(...data.map(d => d.count), 1);
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
      {data.slice(0,8).map((d, i) => (
        <div key={i} style={{ display:'flex', alignItems:'center', gap:10 }}>
          <div style={{ width:120, fontSize:12, color:C.ink, textTransform:'capitalize',
            whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis', flexShrink:0 }}>
            {d.label}
          </div>
          <div style={{ flex:1, height:8, background:'rgba(28,10,0,0.06)', borderRadius:4 }}>
            <div style={{ height:'100%', width:`${(d.count/max)*100}%`, background:color||C.jiff,
              borderRadius:4, transition:'width 0.8s ease' }}/>
          </div>
          <div style={{ fontSize:11, color:C.muted, width:24, textAlign:'right', flexShrink:0 }}>
            {d.count}
          </div>
        </div>
      ))}
    </div>
  );
}

export default function Insights() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    const loadData = async () => {
      // Try localStorage first (fast)
      let history = JSON.parse(localStorage.getItem('jiff-history') || '[]');
      let ratings  = JSON.parse(localStorage.getItem('jiff-ratings') || '{}');
      const streak = JSON.parse(localStorage.getItem('jiff-streak') || '{}');

      // If localStorage is empty, fetch from Supabase API
      if (history.length === 0 && user) {
        try {
          const res = await fetch('/api/meal-history?userId=' + user.id);
          const d = await res.json();
          if (Array.isArray(d.history) && d.history.length > 0) {
            history = d.history;
            // Also rebuild ratings from Supabase history
            const newRatings = {};
            d.history.forEach(h => {
              if (h.rating && h.id) newRatings[h.id] = h.rating;
            });
            if (Object.keys(newRatings).length > 0) ratings = newRatings;
          }
        } catch {}
      }

    // Cuisine breakdown
    const cuisineMap = {};
    history.forEach(h => {
      const c = h.cuisine || 'any';
      cuisineMap[c] = (cuisineMap[c] || 0) + 1;
    });
    const cuisines = Object.entries(cuisineMap)
      .map(([label, count]) => ({ label, count }))
      .sort((a,b) => b.count - a.count);

    // Meal type breakdown
    const mealTypeMap = {};
    history.forEach(h => {
      const t = h.mealType || 'any';
      mealTypeMap[t] = (mealTypeMap[t] || 0) + 1;
    });
    const mealTypes = Object.entries(mealTypeMap)
      .map(([label, count]) => ({ label, count }))
      .sort((a,b) => b.count - a.count);

    // Top ingredients
    const ingMap = {};
    history.forEach(h => {
      (h.ingredients || []).forEach(ing => {
        ingMap[ing] = (ingMap[ing] || 0) + 1;
      });
    });
    const topIngs = Object.entries(ingMap)
      .map(([label, count]) => ({ label, count }))
      .sort((a,b) => b.count - a.count);

    // Nutrition averages from all meals
    const allMeals = history.flatMap(h => h.meal || []);
    const parseNum = v => parseFloat((v||'').toString().replace(/[^0-9.]/g,'')) || 0;
    const avgNutr = {
      calories: allMeals.length
        ? Math.round(allMeals.reduce((s,m) => s + parseNum(m.calories), 0) / allMeals.length)
        : 0,
      protein: allMeals.length
        ? Math.round(allMeals.reduce((s,m) => s + parseNum(m.protein), 0) / allMeals.length)
        : 0,
    };

    // Ratings distribution
    const ratingDist = [1,2,3,4,5].map(s => ({
      label: ['','Poor','Ok','Good','Great','Loved it!'][s],
      count: Object.values(ratings).filter(r => r === s).length,
      stars: s,
    }));
    const avgRating = Object.values(ratings).length
      ? (Object.values(ratings).reduce((s,r) => s+r, 0) / Object.values(ratings).length).toFixed(1)
      : null;

    // Recent activity (last 7 days)
    const now = Date.now();
    const weekAgo = now - 7 * 86400000;
    const recentCount = history.filter(h => new Date(h.generated_at).getTime() > weekAgo).length;

    setData({ history, cuisines, mealTypes, topIngs, avgNutr, ratingDist, avgRating,
      streak: streak.count || 0, recentCount, totalMeals: allMeals.length,
      totalSessions: history.length, ratedCount: Object.values(ratings).length });
  }, []);

  const tabs = [
    { id:'overview',  label:'Overview' },
    { id:'cuisines',  label:'Cuisines' },
    { id:'nutrition', label:'Nutrition' },
    { id:'ratings',   label:'Ratings' },
    { id:'ingredients',label:'Ingredients' },
  ];

  return (
    <div style={{ minHeight:'100vh', background:C.cream, fontFamily:"'DM Sans',sans-serif" }}>
      <link href="https://fonts.googleapis.com/css2?family=Fraunces:wght@700;900&family=DM+Sans:wght@300;400;500&display=swap" rel="stylesheet"/>

      {/* Header */}
      <div style={{ padding:'14px 28px', borderBottom:'1px solid '+C.border, background:'white',
        display:'flex', alignItems:'center', justifyContent:'space-between',
        position:'sticky', top:0, zIndex:10 }}>
        <div style={{ fontFamily:"'Fraunces',serif", fontSize:20, fontWeight:900, color:C.ink }}>
          📊 Meal Insights
        </div>
        <div style={{ display:'flex', gap:8 }}>
          {tabs.map(t => (
            <button key={t.id} onClick={() => setActiveTab(t.id)}
              style={{ padding:'6px 14px', borderRadius:20, fontSize:11, cursor:'pointer',
                border:'1.5px solid '+(activeTab===t.id ? C.jiff : C.border),
                background: activeTab===t.id ? C.jiff : 'white',
                color: activeTab===t.id ? 'white' : C.muted,
                fontFamily:"'DM Sans',sans-serif", fontWeight:activeTab===t.id ? 500 : 400 }}>
              {t.label}
            </button>
          ))}
          <button onClick={() => navigate('/app')}
            style={{ padding:'6px 14px', borderRadius:20, fontSize:11, cursor:'pointer',
              border:'1.5px solid '+C.border, background:'white', color:C.muted,
              fontFamily:"'DM Sans',sans-serif" }}>
            ← Back
          </button>
        </div>
      </div>

      <div style={{ maxWidth:960, margin:'0 auto', padding:'28px 24px' }}>
        {!data ? (
          <div style={{ textAlign:'center', color:C.muted, padding:60, fontSize:14, fontWeight:300 }}>
            Loading insights…
          </div>
        ) : data.history.length === 0 ? (
          <div style={{ textAlign:'center', padding:'48px 24px', maxWidth:480, margin:'0 auto' }}>
            <div style={{ fontSize:56, marginBottom:16 }}>🍽️</div>
            <div style={{ fontFamily:"'Fraunces',serif", fontSize:24, fontWeight:900, color:C.ink, marginBottom:10 }}>
              Your insights will appear here
            </div>
            <p style={{ color:C.muted, fontWeight:300, lineHeight:1.7, marginBottom:8 }}>
              Insights are built from your recipe history. Once you start generating meals, you'll see:
            </p>
            <div style={{ display:'flex', flexDirection:'column', gap:6, marginBottom:24, textAlign:'left',
              background:'white', border:'1px solid '+C.border, borderRadius:14, padding:'14px 18px' }}>
              {['📊 Which cuisines you cook most', '⭐ Your recipe ratings over time',
                '🥦 Most-used ingredients', '🔥 Average calories & protein',
                '📅 Cooking frequency & streaks'].map(item => (
                <div key={item} style={{ fontSize:13, color:C.ink, fontWeight:300 }}>{item}</div>
              ))}
            </div>
            <p style={{ color:C.muted, fontSize:12, fontWeight:300, marginBottom:20 }}>
              Note: Insights use your browser's local storage. They'll rebuild automatically as you cook.
            </p>
            <button onClick={() => navigate('/app')}
              style={{ background:C.jiff, color:'white', border:'none', borderRadius:12,
                padding:'12px 28px', fontSize:14, fontWeight:500, cursor:'pointer',
                fontFamily:"'DM Sans',sans-serif" }}>
              Generate your first meal ⚡
            </button>
          </div>
        ) : (
          <>
            {/* OVERVIEW */}
            {activeTab === 'overview' && (
              <>
                <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(160px,1fr))', gap:12, marginBottom:24 }}>
                  <StatCard emoji="🍽️" label="Total meals generated" value={data.totalMeals} color={C.jiff} />
                  <StatCard emoji="📅" label="Cooking sessions" value={data.totalSessions} color={C.purple} />
                  <StatCard emoji="🔥" label="Day streak" value={data.streak} color="#E65100" />
                  <StatCard emoji="📅" label="Sessions this week" value={data.recentCount} color={C.green} />
                  {data.avgRating && <StatCard emoji="⭐" label="Avg recipe rating" value={data.avgRating} sub="out of 5" color={C.gold} />}
                </div>
                {data.cuisines.length > 0 && (
                  <div style={{ background:'white', border:'1px solid '+C.border, borderRadius:16,
                    padding:'20px 22px', boxShadow:C.shadow, marginBottom:20 }}>
                    <div style={{ fontSize:11, letterSpacing:'2px', textTransform:'uppercase',
                      color:C.jiff, fontWeight:500, marginBottom:14 }}>Top cuisines</div>
                    <BarChart data={data.cuisines} color={C.jiff} />
                  </div>
                )}
                {data.mealTypes.length > 0 && (
                  <div style={{ background:'white', border:'1px solid '+C.border, borderRadius:16,
                    padding:'20px 22px', boxShadow:C.shadow }}>
                    <div style={{ fontSize:11, letterSpacing:'2px', textTransform:'uppercase',
                      color:C.purple, fontWeight:500, marginBottom:14 }}>Meal types</div>
                    <BarChart data={data.mealTypes} color={C.purple} />
                  </div>
                )}
              </>
            )}

            {/* CUISINES */}
            {activeTab === 'cuisines' && (
              <div style={{ background:'white', border:'1px solid '+C.border, borderRadius:16,
                padding:'20px 22px', boxShadow:C.shadow }}>
                <div style={{ fontSize:11, letterSpacing:'2px', textTransform:'uppercase',
                  color:C.jiff, fontWeight:500, marginBottom:16 }}>
                  Cuisine breakdown — {data.cuisines.length} cuisines tried
                </div>
                {data.cuisines.length === 0
                  ? <p style={{ color:C.muted, fontWeight:300 }}>No cuisine data yet.</p>
                  : <BarChart data={data.cuisines} color={C.jiff} />}
              </div>
            )}

            {/* NUTRITION */}
            {activeTab === 'nutrition' && (
              <div style={{ display:'grid', gap:16 }}>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
                  <StatCard emoji="🔥" label="Avg calories/recipe" value={data.avgNutr.calories > 0 ? data.avgNutr.calories : '—'} sub="kcal" color="#E65100" />
                  <StatCard emoji="💪" label="Avg protein/recipe" value={data.avgNutr.protein > 0 ? data.avgNutr.protein+'g' : '—'} color={C.green} />
                </div>
                <div style={{ background:'white', border:'1px solid '+C.border, borderRadius:16,
                  padding:'20px 22px', boxShadow:C.shadow }}>
                  <div style={{ fontSize:11, letterSpacing:'2px', textTransform:'uppercase',
                    color:C.muted, fontWeight:500, marginBottom:12 }}>
                    These are averages across all your generated recipes.
                    Set nutrition goals in your Profile → Settings tab.
                  </div>
                  {data.avgNutr.calories === 0 && (
                    <p style={{ color:C.muted, fontWeight:300, fontSize:13 }}>
                      Generate more recipes with detailed nutrition to see trends here.
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* RATINGS */}
            {activeTab === 'ratings' && (
              <div style={{ background:'white', border:'1px solid '+C.border, borderRadius:16,
                padding:'20px 22px', boxShadow:C.shadow }}>
                <div style={{ display:'flex', alignItems:'baseline', gap:12, marginBottom:16 }}>
                  <div style={{ fontFamily:"'Fraunces',serif", fontSize:40, fontWeight:900, color:C.gold }}>
                    {data.avgRating || '—'}
                  </div>
                  <div>
                    <div style={{ fontSize:13, color:C.ink, fontWeight:500 }}>Average rating</div>
                    <div style={{ fontSize:11, color:C.muted, fontWeight:300 }}>
                      From {data.ratedCount} rated recipe{data.ratedCount !== 1 ? 's' : ''}
                    </div>
                  </div>
                </div>
                {data.ratingDist.map(r => (
                  <div key={r.stars} style={{ display:'flex', alignItems:'center', gap:10, marginBottom:8 }}>
                    <div style={{ width:60, fontSize:12, color:C.ink }}>{'⭐'.repeat(r.stars)}</div>
                    <div style={{ flex:1, height:8, background:'rgba(28,10,0,0.06)', borderRadius:4 }}>
                      <div style={{ height:'100%', background:C.gold, borderRadius:4,
                        width:`${data.ratedCount ? (r.count/data.ratedCount)*100 : 0}%`,
                        transition:'width 0.8s ease' }}/>
                    </div>
                    <div style={{ fontSize:11, color:C.muted, width:20, textAlign:'right' }}>{r.count}</div>
                    <div style={{ fontSize:11, color:C.muted, width:55 }}>{r.label}</div>
                  </div>
                ))}
              </div>
            )}

            {/* INGREDIENTS */}
            {activeTab === 'ingredients' && (
              <div style={{ background:'white', border:'1px solid '+C.border, borderRadius:16,
                padding:'20px 22px', boxShadow:C.shadow }}>
                <div style={{ fontSize:11, letterSpacing:'2px', textTransform:'uppercase',
                  color:C.green, fontWeight:500, marginBottom:16 }}>
                  Your most-used ingredients
                </div>
                {data.topIngs.length === 0
                  ? <p style={{ color:C.muted, fontWeight:300 }}>No ingredient data yet.</p>
                  : <BarChart data={data.topIngs} color={C.green} />}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
