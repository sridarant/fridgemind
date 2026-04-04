// src/components/common/JourneyTiles.jsx — v22 full rewrite
// Spec: 2-row RIGHT NOW grid + COOKING FOR + [+More] with 3 groups
// All tile labels/subs computed inside component (no t() at module level)
// Self-contained — no prop drilling from Jiff.jsx internals

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLocale } from '../../contexts/LocaleContext';
import MoodSelector from './MoodSelector.jsx';
import OrderInSheet from './OrderInSheet.jsx';
import SeasonalCard from './SeasonalCard.jsx';
import WeatherBanner from './WeatherBanner.jsx';

const C = {
  jiff:'#FF4500', ink:'#1C0A00', muted:'#7C6A5E',
  border:'rgba(28,10,0,0.08)',
};

function Tile({ emoji, label, sub, color, bg, border, oneTap, onClick, wide }) {
  const [hov, setHov] = useState(false);
  return (
    <button onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        gridColumn:    wide ? 'span 2' : 'span 1',
        display:       'flex',
        flexDirection: 'column',
        alignItems:    'flex-start',
        gap:           6,
        padding:       '16px 14px',
        background:    hov ? (bg || 'rgba(28,10,0,0.04)') : 'white',
        border:        `1.5px solid ${hov ? (border || 'rgba(28,10,0,0.15)') : C.border}`,
        borderRadius:  16,
        cursor:        'pointer',
        textAlign:     'left',
        fontFamily:    "'DM Sans', sans-serif",
        transform:     hov ? 'translateY(-2px)' : 'none',
        boxShadow:     hov ? '0 6px 20px rgba(28,10,0,0.07)' : '0 1px 3px rgba(28,10,0,0.04)',
        transition:    'all 0.14s',
        position:      'relative',
        minHeight:     90,
      }}>
      <span style={{ fontSize:26, lineHeight:1 }}>{emoji}</span>
      <span style={{ fontSize:13, fontWeight:600, color:C.ink, lineHeight:1.3 }}>{label}</span>
      {sub && <span style={{ fontSize:11, color:C.muted, fontWeight:300, lineHeight:1.4 }}>{sub}</span>}
      {oneTap && (
        <span style={{
          position:'absolute', top:10, right:10,
          fontSize:8, fontWeight:700, color:color || C.jiff,
          background: bg || 'rgba(255,69,0,0.08)',
          border:`1px solid ${border || 'rgba(255,69,0,0.2)'}`,
          borderRadius:5, padding:'1px 5px', letterSpacing:'0.5px',
        }}>1-TAP</span>
      )}
    </button>
  );
}

function GroupLabel({ children }) {
  return (
    <div style={{
      fontSize:11, letterSpacing:'1.5px', textTransform:'uppercase',
      color:C.muted, fontWeight:600, marginBottom:10, marginTop:4,
    }}>
      {children}
    </div>
  );
}

export function JourneyTiles({
  profile, season, streak, country,
  onSelectFridge, onGenerateDirect, onLeftoverRescue, onWeatherGenerate,
}) {
  const navigate   = useNavigate();
  const { t }      = useLocale();
  const [showMood,    setShowMood]    = useState(false);
  const [showOrder,   setShowOrder]   = useState(false);
  const [showMore,    setShowMore]    = useState(false);

  const isIndia = (country || 'IN') === 'IN';

  const greet = () => {
    const h    = new Date().getHours();
    const name = profile?.name?.split(' ')[0] || '';
    const base = h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
    return name ? `${base}, ${name}` : base;
  };

  return (
    <div style={{ maxWidth:720, margin:'0 auto', padding:'20px 16px 100px', fontFamily:"'DM Sans',sans-serif" }}>

      {/* Greeting */}
      <div style={{ marginBottom:16 }}>
        <h2 style={{ fontFamily:"'Fraunces',serif", fontSize:'clamp(20px,5vw,28px)', fontWeight:900, color:C.ink, margin:0, lineHeight:1.2 }}>
          {greet()} ⚡
        </h2>
        {streak >= 2 && (
          <div style={{ display:'inline-flex', alignItems:'center', gap:4, marginTop:8,
            background:'rgba(255,69,0,0.08)', border:'1px solid rgba(255,69,0,0.2)',
            borderRadius:20, padding:'3px 10px', fontSize:11, color:'#CC3700', fontWeight:500 }}>
            🔥 {streak}-day streak!
          </div>
        )}
      </div>

      {/* Weather banner — always shown */}
      <WeatherBanner onTap={onWeatherGenerate} />

      {/* RIGHT NOW — 2-row grid: Fridge Mood Seasonal / Goal OrderIn */}
      <GroupLabel>Right now</GroupLabel>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:10, marginBottom:10 }}>
        <Tile emoji="🧊" label="What's in my fridge?" sub="Use what you have"
          color="#FF4500" bg="rgba(255,69,0,0.07)" border="rgba(255,69,0,0.2)"
          onClick={onSelectFridge} />
        <Tile emoji="😊" label="Match my mood" sub="5 moods, one tap"
          color="#7C3AED" bg="rgba(124,58,237,0.07)" border="rgba(124,58,237,0.2)"
          onClick={() => setShowMood(true)} />
        <SeasonalCard compact onGenerate={onGenerateDirect} />
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:10, marginBottom:24 }}>
        <Tile emoji="🎯" label="I have a goal" sub="Plans & targets"
          color="#1D9E75" bg="rgba(29,158,117,0.07)" border="rgba(29,158,117,0.2)"
          onClick={() => navigate('/plans')} />
        {isIndia && (
          <Tile emoji="🛵" label="Order in instead" sub="Swiggy · Zomato · Blinkit"
            color="#FC8019" bg="rgba(252,128,25,0.07)" border="rgba(252,128,25,0.2)"
            onClick={() => setShowOrder(true)} />
        )}
      </div>

      {/* COOKING FOR */}
      <GroupLabel>Cooking for</GroupLabel>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:10, marginBottom:24 }}>
        <Tile emoji="👨‍👩‍👧" label="Family meal" sub="Everyone covered" oneTap
          color="#DB2777" bg="rgba(219,39,119,0.07)" border="rgba(219,39,119,0.2)"
          onClick={() => onGenerateDirect?.({ mealType:'dinner', family:true })} />
        <Tile emoji="🍱" label="Kids' lunchbox" sub="School-friendly"
          color="#F59E0B" bg="rgba(245,158,11,0.07)" border="rgba(245,158,11,0.2)"
          onClick={() => navigate('/little-chefs', { state:{ mode:'lunchbox' } })} />
        <Tile emoji="🎉" label="Hosting guests" sub="8–12 people" oneTap
          color="#2563EB" bg="rgba(37,99,235,0.07)" border="rgba(37,99,235,0.2)"
          onClick={() => onGenerateDirect?.({ hosting:true, servings:10 })} />
      </div>

      {/* More / Less toggle */}
      <button onClick={() => setShowMore(m => !m)}
        style={{
          display:'flex', alignItems:'center', gap:6,
          background:'none', border:`1px solid ${C.border}`,
          borderRadius:20, padding:'6px 16px', fontSize:12,
          color:C.muted, cursor:'pointer', fontFamily:"'DM Sans',sans-serif",
          margin:'0 auto', marginBottom:showMore?20:0,
        }}>
        {showMore ? '− Less' : '+ More options'}
      </button>

      {/* MORE GROUPS — hidden until toggle */}
      {showMore && (
        <>
          {/* For the little ones */}
          <GroupLabel>For the little ones</GroupLabel>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:10, marginBottom:24 }}>
            <Tile emoji="👶" label="Dishes for kids" sub="Age-safe & fun"
              color="#F59E0B" bg="rgba(245,158,11,0.07)" border="rgba(245,158,11,0.2)"
              onClick={() => navigate('/little-chefs', { state:{ mode:'dishes' } })} />
            <Tile emoji="🧑‍🍳" label="Little Chefs" sub="Kids can cook"
              color="#1D9E75" bg="rgba(29,158,117,0.07)" border="rgba(29,158,117,0.2)"
              onClick={() => navigate('/little-chefs', { state:{ mode:'chefs' } })} />
          </div>

          {/* Plan ahead */}
          <GroupLabel>Plan ahead</GroupLabel>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:10, marginBottom:24 }}>
            <Tile emoji="📅" label="Week plan" sub="7 days sorted"
              color="#2563EB" bg="rgba(37,99,235,0.07)" border="rgba(37,99,235,0.2)"
              onClick={() => navigate('/planner')} />
            <Tile emoji="♻️" label="Leftover rescue" sub="Cooked too much?"
              color="#059669" bg="rgba(5,150,105,0.07)" border="rgba(5,150,105,0.2)"
              onClick={onLeftoverRescue} />
          </div>

          {/* Traditions */}
          <GroupLabel>Traditions</GroupLabel>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(1,1fr)', gap:10, marginBottom:24 }}>
            <Tile emoji="✨" label="Sacred Kitchen" sub="Temple food · Festival · Sattvic"
              color="#D97706" bg="rgba(217,119,6,0.07)" border="rgba(217,119,6,0.2)"
              onClick={() => navigate('/sacred')} />
          </div>
        </>
      )}

      {/* Fridge shortcut */}
      <div onClick={onSelectFridge} style={{
        padding:'12px 16px', background:'rgba(28,10,0,0.02)',
        border:`1px solid ${C.border}`, borderRadius:14,
        display:'flex', alignItems:'center', gap:10, cursor:'pointer',
      }}>
        <span style={{ fontSize:18 }}>🔍</span>
        <span style={{ flex:1, fontSize:13, color:C.muted, fontWeight:300 }}>
          Or type what's in your fridge…
        </span>
        <span style={{ fontSize:11, color:C.jiff, fontWeight:500,
          background:'rgba(255,69,0,0.07)', borderRadius:8, padding:'4px 10px',
          border:'1px solid rgba(255,69,0,0.15)' }}>
          Open fridge →
        </span>
      </div>

      {/* Modals */}
      {showMood && (
        <MoodSelector
          onSelect={({ mood, context }) => {
            setShowMood(false);
            onGenerateDirect?.({ mood: mood.id, moodContext: context });
          }}
          onClose={() => setShowMood(false)}
        />
      )}
      {showOrder && (
        <OrderInSheet
          city={profile?.city || ''}
          onClose={() => setShowOrder(false)}
        />
      )}
    </div>
  );
}
