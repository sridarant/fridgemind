// src/pages/Discover.jsx
// Discover tab — curated content using Option 2 (semi-static + API on tap).
// Seasonal, festival, region: computed from lib/discover.js (no API on load).
// Recipe generation only fires when user taps a specific dish.

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { buildDiscoverData } from '../lib/discover.js';
import { getCurrentSeason } from '../lib/festival.js';
import SeasonalCard from '../components/common/SeasonalCard.jsx';

const C = {
  jiff:'#FF4500', ink:'#1C0A00', cream:'#FFFAF5', muted:'#7C6A5E',
  green:'#1D9E75', border:'rgba(28,10,0,0.08)', gold:'#D97706',
};

function SectionHeader({ emoji, title, sub }) {
  return (
    <div style={{ marginBottom:12 }}>
      <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:2 }}>
        <span style={{ fontSize:16 }}>{emoji}</span>
        <span style={{ fontSize:11, letterSpacing:'1.5px', textTransform:'uppercase', fontWeight:600, color:C.muted }}>
          {title}
        </span>
      </div>
      {sub && <div style={{ fontSize:13, color:C.ink, fontWeight:500, paddingLeft:22 }}>{sub}</div>}
    </div>
  );
}

function RecipeChip({ dish, onTap }) {
  return (
    <button onClick={() => onTap?.(dish)}
      style={{
        padding:    '8px 14px',
        border:     '1.5px solid rgba(28,10,0,0.08)',
        borderRadius: 20, background:'white',
        fontSize:   12, color:C.ink,
        cursor:     'pointer', fontFamily:"'DM Sans',sans-serif",
        transition: 'all 0.12s', whiteSpace:'nowrap',
      }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = C.jiff; e.currentTarget.style.color = C.jiff; }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(28,10,0,0.08)'; e.currentTarget.style.color = C.ink; }}
    >
      {dish} →
    </button>
  );
}

export default function Discover() {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const [data, setData] = useState(null);
  const [mealHistory, setMealHistory] = useState([]);

  useEffect(() => {
    // Load meal history from Supabase for personalisation
    if (user) {
      fetch(`/api/admin?action=meal-history&userId=${user.id}`)
        .then(r => r.json())
        .then(d => {
          const history = Array.isArray(d.history) ? d.history : [];
          setMealHistory(history);
          setData(buildDiscoverData({
            mealHistory: history,
            profile:     profile || {},
            country:     'IN',
          }));
        })
        .catch(() => {
          setData(buildDiscoverData({ mealHistory: [], profile: profile || {}, country: 'IN' }));
        });
    } else {
      setData(buildDiscoverData({ mealHistory: [], profile: {}, country: 'IN' }));
    }
  }, [user, profile]);

  // Navigate to app with pre-set generation context
  const generateWith = (context) => {
    navigate('/app', { state: { generateContext: context } });
  };

  if (!data) {
    return (
      <div style={{ minHeight:'100vh', background:C.cream, display:'flex', alignItems:'center', justifyContent:'center' }}>
        <div style={{ fontSize:13, color:C.muted }}>Loading…</div>
      </div>
    );
  }

  const { season, festival, featuredRegion, upcomingFestivals, untried, trending } = data;

  return (
    <div style={{ minHeight:'100vh', background:C.cream, fontFamily:"'DM Sans',sans-serif", paddingBottom:80 }}>

      {/* Header */}
      <div style={{ padding:'20px 20px 0', position:'sticky', top:0, background:C.cream, zIndex:10 }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:16 }}>
          <div style={{ fontFamily:"'Fraunces',serif", fontSize:24, fontWeight:900, color:C.ink }}>
            Discover
          </div>
          <button onClick={() => navigate('/app')}
            style={{ fontSize:12, color:C.muted, background:'none', border:'1px solid rgba(28,10,0,0.12)', borderRadius:20, padding:'5px 14px', cursor:'pointer', fontFamily:"'DM Sans',sans-serif", fontWeight:500 }}>
            ↺ Cook something else
          </button>
        </div>
      </div>

      <div style={{ padding:'0 20px', maxWidth:720, margin:'0 auto' }}>

        {/* 1. In Season Now */}
        <div style={{ marginBottom:28 }}>
          <SectionHeader emoji="🌿" title="In Season Now" sub={season.label} />
          <SeasonalCard onGenerate={ctx => generateWith({ ...ctx, type:'seasonal' })} />
        </div>

        {/* 2. Coming Up — festival */}
        {(festival || upcomingFestivals.length > 0) && (
          <div style={{ marginBottom:28 }}>
            <SectionHeader emoji="🎉" title="Coming Up" sub={festival ? festival.emoji + ' ' + festival.name + ' — cook traditionally' : (upcomingFestivals[0]?.emoji + ' ' + upcomingFestivals[0]?.name + ' in ' + upcomingFestivals[0]?.daysFromNow + ' days')} />
            <div style={{
              background:   'white', border:'1px solid ' + (C.border),
              borderRadius: 14, padding:'14px 16px',
            }}>
              {(festival || upcomingFestivals[0]) && (() => {
                const f = festival || upcomingFestivals[0];
                return (
                  <>
                    <div style={{ fontSize:12, color:C.muted, fontWeight:300, marginBottom:10, lineHeight:1.5 }}>
                      Traditional dishes: {f.note}
                    </div>
                    <div style={{ display:'flex', flexWrap:'wrap', gap:8 }}>
                      {f.note.split(', ').map(dish => (
                        <RecipeChip key={dish} dish={dish.trim()} onTap={d => generateWith({ dish: d, festival: f.name, type:'festival' })} />
                      ))}
                    </div>
                  </>
                );
              })()}
            </div>
          </div>
        )}

        {/* 3. Explore a Region */}
        <div style={{ marginBottom:28 }}>
          <SectionHeader emoji="🌍" title="Explore a Region" sub={`This week: ${featuredRegion.name}, ${featuredRegion.state}`} />
          <div style={{ background:'white', border:'1px solid ' + (C.border), borderRadius:14, padding:'14px 16px' }}>
            <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:10 }}>
              <span style={{ fontSize:28 }}>{featuredRegion.emoji}</span>
              <div>
                <div style={{ fontSize:14, fontWeight:700, color:C.ink }}>{featuredRegion.name} cuisine</div>
                <div style={{ fontSize:12, color:C.muted, fontWeight:300 }}>{featuredRegion.description}</div>
              </div>
            </div>
            <div style={{ display:'flex', flexWrap:'wrap', gap:8 }}>
              {featuredRegion.dishes.map(dish => (
                <RecipeChip key={dish} dish={dish} onTap={d => generateWith({ dish: d, cuisine: featuredRegion.id, type:'regional' })} />
              ))}
            </div>
          </div>
        </div>

        {/* 4. You Haven't Tried */}
        {untried && (
          <div style={{ marginBottom:28 }}>
            <SectionHeader emoji="💡" title="You Haven't Tried" sub={`${mealHistory.length > 0 ? 'Based on your history' : 'Something new to explore'}`} />
            <button
              onClick={() => generateWith({ cuisine: untried, type:'explore' })}
              style={{
                width:'100%', padding:'16px', background:'white',
                border:'1px solid ' + (C.border), borderRadius:14,
                display:'flex', alignItems:'center', justifyContent:'space-between',
                cursor:'pointer', fontFamily:"'DM Sans',sans-serif", transition:'all 0.12s',
              }}
              onMouseEnter={e => e.currentTarget.style.borderColor = C.jiff}
              onMouseLeave={e => e.currentTarget.style.borderColor = C.border}
            >
              <div style={{ textAlign:'left' }}>
                <div style={{ fontSize:14, fontWeight:600, color:C.ink }}>{untried} cuisine</div>
                <div style={{ fontSize:12, color:C.muted, fontWeight:300, marginTop:2 }}>
                  You haven't explored this yet — let Jiff suggest something
                </div>
              </div>
              <span style={{ fontSize:20, color:C.jiff }}>→</span>
            </button>
          </div>
        )}

        {/* 5. Trending This Week */}
        <div style={{ marginBottom:28 }}>
          <SectionHeader emoji="🔥" title="Trending This Week" sub="What people are cooking" />
          <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
            {trending.map((item, i) => (
              <button key={i}
                onClick={() => generateWith({ dish: item.name, type:'trending' })}
                style={{
                  display:'flex', alignItems:'center', gap:12,
                  padding:'12px 14px', background:'white',
                  border:'1px solid ' + (C.border), borderRadius:12,
                  cursor:'pointer', fontFamily:"'DM Sans',sans-serif", transition:'all 0.12s',
                }}
                onMouseEnter={e => e.currentTarget.style.borderColor = C.jiff}
                onMouseLeave={e => e.currentTarget.style.borderColor = C.border}
              >
                <span style={{ fontSize:20, width:28, textAlign:'center' }}>{item.emoji}</span>
                <div style={{ flex:1, textAlign:'left' }}>
                  <span style={{ fontSize:13, color:C.ink, fontWeight:500 }}>{item.name}</span>
                  <div style={{ display:'flex', gap:4, flexWrap:'wrap', marginTop:3 }}>
                    {item.tags.map(tag => (
                      <span key={tag} style={{ fontSize:9, color:C.muted, background:'rgba(28,10,0,0.04)', padding:'1px 6px', borderRadius:8 }}>{tag}</span>
                    ))}
                  </div>
                </div>
                <span style={{ fontSize:12, color:C.jiff, fontWeight:500 }}>Cook →</span>
              </button>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
