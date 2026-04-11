// src/pages/Favs.jsx — Dedicated Favourites page
// Sort by rating or cuisine. Guest sign-in prompt.
// On first sign-in: migrates localStorage favourites to Supabase.
// Mobile-first, 2-col grid.

import { useState, useEffect } from 'react';
import { useNavigate }         from 'react-router-dom';
import PageHeader from '../components/common/PageHeader';
import { useAuth }             from '../contexts/AuthContext';
import { MealCard }            from '../components/meal/MealCard.jsx';
import { getCuisineLabel }     from '../lib/cuisine.js';
import { fetchHistory } from '../services/historyService';

const C = {
  jiff:'#FF4500', ink:'#1C0A00', cream:'#FFFAF5',
  muted:'#7C6A5E', border:'rgba(28,10,0,0.08)',
  green:'#1D9E75',
};

function SignInPrompt() {
  const { signInWithGoogle, signInWithEmail } = useAuth();
  const [email, setEmail] = useState('');
  const [sent,  setSent]  = useState(false);

  return (
    <div style={{
      display:'flex', flexDirection:'column', alignItems:'center',
      justifyContent:'center', padding:'60px 24px', textAlign:'center',
      fontFamily:"'DM Sans',sans-serif",
    }}>
      <div style={{ fontSize:48, marginBottom:16 }}>❤️</div>
      <div style={{
        fontFamily:"'Fraunces',serif", fontSize:22,
        fontWeight:700, color:C.ink, marginBottom:8,
      }}>
        Sign in to see your favourites
      </div>
      <div style={{ fontSize:13, color:C.muted, fontWeight:300, marginBottom:28, maxWidth:280 }}>
        Save recipes across devices and build your personal cookbook
      </div>
      <button onClick={signInWithGoogle}
        style={{
          width:'100%', maxWidth:320, padding:'13px',
          background:C.jiff, color:'white', border:'none',
          borderRadius:12, fontSize:14, fontWeight:600,
          cursor:'pointer', fontFamily:"'DM Sans',sans-serif",
          marginBottom:12,
        }}>
        Continue with Google
      </button>
      {!sent ? (
        <div style={{ display:'flex', gap:8, width:'100%', maxWidth:320 }}>
          <input type="email" value={email} onChange={e=>setEmail(e.target.value)}
            placeholder="or enter your email"
            style={{
              flex:1, padding:'11px 14px', border:'1px solid ' + (C.border),
              borderRadius:10, fontSize:13, fontFamily:"'DM Sans',sans-serif", outline:'none',
            }}
          />
          <button onClick={()=>{ if(email.includes('@')){ signInWithEmail?.(email); setSent(true); }}}
            style={{
              padding:'11px 16px', background:'rgba(28,10,0,0.06)',
              border:'1px solid ' + (C.border), borderRadius:10,
              fontSize:12, cursor:'pointer', fontFamily:"'DM Sans',sans-serif", color:C.ink,
            }}>
            Go
          </button>
        </div>
      ) : (
        <div style={{ fontSize:13, color:C.green }}>✓ Check your email for a sign-in link</div>
      )}
    </div>
  );
}

export default function Favs() {
  const navigate  = useNavigate();
  const { user, favourites, isFav, toggleFavourite, pantry } = useAuth();
  const [sort,     setSort]     = useState('rating');
  const [filter,   setFilter]   = useState('all');
  const [search,   setSearch]   = useState('');
  const [expanded, setExpanded] = useState(null);
  const [ratings,  setRatings]  = useState({});
  const [migrated, setMigrated] = useState(false);

  // Migrate localStorage favourites to Supabase on first sign-in
  useEffect(() => {
    if (!user || migrated) return;
    try {
      const local = JSON.parse(localStorage.getItem('jiff-favourites') || '[]');
      if (local.length > 0 && typeof toggleFavourite === 'function') {
        local.forEach(meal => {
          if (meal?.name && !isFav?.(meal)) toggleFavourite(meal);
        });
        localStorage.removeItem('jiff-favourites');
      }
    } catch {}
    setMigrated(true);
  }, [user]);

  // Load ratings: localStorage first, then merge Supabase
  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem('jiff-ratings') || '{}');
      setRatings(stored);
    } catch {}
    if (!user) return;
    fetchHistory(user.id).then(history => {
        const r = {};
        history.forEach(m => { if (m.meal_name && m.rating) r[m.meal_name] = m.rating; });
        if (Object.keys(r).length) setRatings(prev => ({ ...prev, ...r }));
      }).catch(() => {});
  }, [user]);

  if (!user) return (
    <div style={{ minHeight:'100vh', background:C.cream, paddingBottom:80 }}>
      <div style={{
        padding:'20px 20px 0', display:'flex', alignItems:'center', gap:12,
        borderBottom:`1px solid ${C.border}`,
        background:'white', marginBottom:1,
      }}>
        <button onClick={() => navigate('/app')}
          style={{
            background:'none', border:'none', cursor:'pointer',
            fontSize:13, color:C.muted, fontFamily:"'DM Sans',sans-serif",
            padding:'4px 0', display:'flex', alignItems:'center', gap:4,
          }}>
          ↺ Cook something else
        </button>
      </div>
      <SignInPrompt />
    </div>
  );

  const favList = Array.isArray(favourites) ? favourites : [];

  // Sort
  const sorted = [...favList].sort((a, b) => {
    if (sort === 'rating') {
      const rA = ratings[a.name] || 0;
      const rB = ratings[b.name] || 0;
      return rB - rA;
    }
    if (sort === 'cuisine') {
      return (a.cuisine||'').localeCompare(b.cuisine||'');
    }
    return 0;
  });

  // Filter
  const cuisinesInFavs = [...new Set(favList.map(f => f.cuisine).filter(Boolean))];
  const filtered = sorted.filter(meal => {
    const matchFilter  = filter === 'all' || meal.cuisine === filter;
    const matchSearch  = !search ||
      (meal.name||'').toLowerCase().includes(search.toLowerCase());
    return matchFilter && matchSearch;
  });

  return (
    <div style={{
      minHeight:'100vh', background:C.cream,
      fontFamily:"'DM Sans',sans-serif", paddingBottom:80,
    }}>
      <PageHeader title="Saved recipes" action={
          <select value={sort} onChange={e => setSort(e.target.value)}
            style={{ fontSize:12, border:'1px solid rgba(28,10,0,0.08)', borderRadius:8, padding:'5px 10px', background:'white', color:'#1C0A00', fontFamily:"'DM Sans',sans-serif", cursor:'pointer', outline:'none' }}>
            <option value="rating">Sort: Rating</option>
            <option value="cuisine">Sort: Cuisine</option>
          </select>
        } />
          {/* Sort */}
          <select value={sort} onChange={e => setSort(e.target.value)}
            style={{
              fontSize:12, border:'1px solid ' + (C.border), borderRadius:8,
              padding:'5px 10px', background:'white', color:C.ink,
              fontFamily:"'DM Sans',sans-serif", cursor:'pointer', outline:'none',
            }}>
            <option value="rating">Sort: Rating</option>
            <option value="cuisine">Sort: Cuisine</option>
          </select>
        </div>

        {/* Stats + search */}
        <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:10 }}>
          <span style={{ fontFamily:"'Fraunces',serif", fontSize:18, fontWeight:700, color:C.ink }}>
            ❤️ Favourites
          </span>
          <span style={{ fontSize:12, color:C.muted }}>· {favList.length} saved</span>
        </div>

        {/* Search */}
        <input
          value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search your favourites…"
          style={{
            width:'100%', boxSizing:'border-box',
            padding:'9px 14px', border:'1px solid ' + (C.border),
            borderRadius:10, fontSize:13, outline:'none',
            fontFamily:"'DM Sans',sans-serif",
          }}
        />

        {/* Cuisine filter chips — horizontal scroll on mobile */}
        {cuisinesInFavs.length > 0 && (
          <div style={{
            display:'flex', gap:6, marginTop:10,
            overflowX:'auto', paddingBottom:4,
            scrollbarWidth:'none', msOverflowStyle:'none',
          }}>
            {['all', ...cuisinesInFavs].map(c => (
              <button key={c} onClick={() => setFilter(c)}
                style={{
                  padding:'5px 12px', borderRadius:20, whiteSpace:'nowrap',
                  border:'1.5px solid ' + (filter===c ? C.jiff : C.border),
                  background: filter===c ? 'rgba(255,69,0,0.07)' : 'white',
                  color: filter===c ? C.jiff : C.muted,
                  fontSize:11, fontWeight: filter===c ? 600 : 400,
                  cursor:'pointer', fontFamily:"'DM Sans',sans-serif",
                  transition:'all 0.12s', flexShrink:0,
                }}>
                {c === 'all' ? 'All' : getCuisineLabel(c)||c}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Content */}
      <div style={{ padding:'16px 16px 0' }}>
        {filtered.length === 0 ? (
          <div style={{ textAlign:'center', padding:'60px 20px', color:C.muted }}>
            <div style={{ fontSize:40, marginBottom:12 }}>🍽️</div>
            <div style={{ fontSize:15, fontWeight:500, color:C.ink, marginBottom:6 }}>
              {favList.length === 0 ? 'No favourites yet' : 'No results found'}
            </div>
            <div style={{ fontSize:13, fontWeight:300 }}>
              {favList.length === 0
                ? 'Tap ❤️ on any recipe to save it here'
                : 'Try a different search or filter'}
            </div>
            {favList.length === 0 && (
              <button onClick={() => navigate('/app')}
                style={{
                  marginTop:20, padding:'10px 20px',
                  background:C.jiff, color:'white', border:'none',
                  borderRadius:10, fontSize:13, fontWeight:600,
                  cursor:'pointer', fontFamily:"'DM Sans',sans-serif",
                }}>
                Generate recipes →
              </button>
            )}
          </div>
        ) : (
          /* 2-col grid on mobile, 3-col on desktop */
          <div style={{
            display:'grid',
            gridTemplateColumns:'repeat(2, 1fr)',
            gap:12,
          }} className="favs-grid">
            {filtered.map((meal, i) => {
              const isExpanded = expanded === (meal.name + i);
              return (
                <div key={meal.name + i}>
                  {isExpanded ? (
                    <div style={{ gridColumn:'span 2' }}>
                      <MealCard
                        meal={meal}
                        isFav={true}
                        onToggleFav={() => toggleFavourite?.(meal)}
                        rating={ratings[meal.name] || 0}
                        onRate={(r) => {
                          const updated = { ...ratings, [meal.name]: r };
                          setRatings(updated);
                          try { localStorage.setItem('jiff-ratings', JSON.stringify(updated)); } catch {}
                        }}
                        pantry={pantry || []}
                      />
                      <button onClick={() => setExpanded(null)}
                        style={{
                          width:'100%', padding:'8px', fontSize:12, color:C.muted,
                          background:'none', border:'1px solid ' + (C.border),
                          borderRadius:8, cursor:'pointer', marginBottom:8,
                          fontFamily:"'DM Sans',sans-serif",
                        }}>
                        ▲ Collapse
                      </button>
                    </div>
                  ) : (
                    /* Compact card */
                    <button
                      onClick={() => setExpanded(meal.name + i)}
                      style={{
                        width:'100%', background:'white',
                        border:'1px solid ' + (C.border), borderRadius:14,
                        padding:'14px 12px', cursor:'pointer',
                        textAlign:'left', fontFamily:"'DM Sans',sans-serif",
                        display:'flex', flexDirection:'column', gap:6,
                        transition:'all 0.12s', minHeight:110,
                      }}
                      onMouseEnter={e => e.currentTarget.style.boxShadow='0 4px 16px rgba(28,10,0,0.08)'}
                      onMouseLeave={e => e.currentTarget.style.boxShadow='none'}
                    >
                      <div style={{ fontSize:24, lineHeight:1 }}>{meal.emoji||'🍽️'}</div>
                      <div style={{
                        fontSize:13, fontWeight:600, color:C.ink,
                        lineHeight:1.3, display:'-webkit-box',
                        WebkitLineClamp:2, WebkitBoxOrient:'vertical', overflow:'hidden',
                      }}>
                        {meal.name}
                      </div>
                      <div style={{ fontSize:11, color:C.muted }}>
                        {meal.time && `⏱ ${meal.time}`}
                      </div>
                      {ratings[meal.name] > 0 && (
                        <div style={{ fontSize:11, color:'#F59E0B' }}>
                          {'⭐'.repeat(ratings[meal.name])}
                        </div>
                      )}
                      <div style={{
                        fontSize:11, color:C.jiff, fontWeight:500, marginTop:'auto',
                      }}>
                        Cook → 
                      </div>
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
