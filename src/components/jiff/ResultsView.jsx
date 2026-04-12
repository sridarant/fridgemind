// src/components/jiff/ResultsView.jsx
// Results grid: filter pills, meal cards, order strip, reset

import { MealCard } from '../meal/MealCard.jsx';
import { mealKey }  from '../../lib/mealKey.js';
import { updateRating } from '../../services/historyService';
import { trackPaywallShown, trackUpgradeClick, trackRating } from '../../lib/analytics';

const MEAL_TYPE_OPTIONS = [
  { id: 'any', label: 'Any meal', emoji: '🍽️' },
  { id: 'breakfast', label: 'Breakfast', emoji: '🌅' },
  { id: 'lunch', label: 'Lunch', emoji: '☀️' },
  { id: 'dinner', label: 'Dinner', emoji: '🌙' },
  { id: 'snack', label: 'Snacks', emoji: '🍎' },
];

export default function ResultsView({
  meals, mealType, cuisine, time, diet, defaultServings,
  ingredients, profile, user, isPremium, trialActive, PAID_RECIPE_CAP,
  ratings, setRatings, isFav, toggleFavourite, country,
  pantryNudge, setPantryNudge,
  CUISINE_OPTIONS, tileContext,
  stapleSuggestion, onDismissStapleSuggestion, onAddStaple,
  handleSurprise, onRate, reset, navigate, t,
}) {
  // onRate is passed from parent (Jiff.jsx) which handles Supabase sync
  const handleRate = onRate || ((meal, stars) => {
    trackRating({ stars, cuisine: meal.cuisine, mealType });
    const key = mealKey(meal);
    setRatings(prev => ({ ...prev, [key]: stars }));
    if (user) updateRating({ userId: user.id, mealName: meal.name, rating: stars });
  });

  const topRated = Object.entries(ratings).filter(([, r]) => r >= 4).map(([k]) => k);

  return (
    <div className="results-wrap">
      {/* Pantry restock nudge */}
      {/* Pantry learning nudge — suggest promoting repeat items to weekly staples */}
      {stapleSuggestion?.items?.length > 0 && !stapleSuggestion.shown && (
        <div style={{ background:'rgba(29,158,117,0.06)', border:'1px solid rgba(29,158,117,0.2)', borderRadius:12, padding:'10px 14px', marginBottom:12, display:'flex', alignItems:'center', justifyContent:'space-between', gap:10, flexWrap:'wrap' }}>
          <span style={{ fontSize:12, color:'#1D9E75', fontWeight:400, flex:1 }}>
            {'🌿 You often add '}{stapleSuggestion.items.join(' and ')}{' — save it to your weekly staples?'}
          </span>
          <div style={{ display:'flex', gap:6, flexShrink:0 }}>
            <button onClick={() => onAddStaple?.(stapleSuggestion.items)} style={{ fontSize:11, padding:'4px 10px', borderRadius:8, background:'#1D9E75', color:'white', border:'none', cursor:'pointer', fontFamily:"'DM Sans',sans-serif", fontWeight:500 }}>
              {'+ Add'}
            </button>
            <button onClick={() => onDismissStapleSuggestion?.()} style={{ fontSize:11, padding:'4px 10px', borderRadius:8, background:'none', color:'#7C6A5E', border:'1px solid rgba(28,10,0,0.1)', cursor:'pointer', fontFamily:"'DM Sans',sans-serif" }}>
              {'Dismiss'}
            </button>
          </div>
        </div>
      )}

      {pantryNudge.length > 0 && (
        <div style={{ background: 'rgba(92,107,192,0.08)', border: '1px solid rgba(92,107,192,0.2)', borderRadius: 12, padding: '10px 14px', marginBottom: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 13, color: '#3949AB', fontWeight: 300 }}>
            {'🧂 You may need to restock: '}
            <strong>{pantryNudge.join(', ')}</strong>
          </span>
          <button onClick={() => setPantryNudge([])} style={{ background: 'none', border: 'none', color: '#9E9E9E', cursor: 'pointer', fontSize: 12, fontFamily: "'DM Sans',sans-serif" }}>{'✕'}</button>
        </div>
      )}

      {/* Context banner — themed per tile type */}
      {tileContext && (
        <div style={{
          display:'flex', alignItems:'center', gap:12,
          padding:'14px 16px', borderRadius:14, marginBottom:20,
          background: tileContext.bg || 'rgba(255,69,0,0.06)',
          border:'1px solid ' + (tileContext.border || 'rgba(255,69,0,0.18)'),
        }}>
          <span style={{ fontSize:28, flexShrink:0 }}>{tileContext.emoji}</span>
          <div style={{ flex:1, minWidth:0 }}>
            <div style={{ fontSize:14, fontWeight:700, color: tileContext.color || '#CC3700', marginBottom:2 }}>
              {tileContext.label}
            </div>
            <div style={{ fontSize:12, color:'#7C6A5E', fontWeight:300, lineHeight:1.5 }}>
              {tileContext.sub || 'Recipes personalised for this context'}
            </div>
          </div>
        </div>
      )}

      <div className="results-header">
        <div className="results-title">
          {tileContext?.label?.includes('Leftover') ? '♻️ Rescued! Here\'s what to make.' : 'Jiffed. ⚡ Here\'s your menu.'}
        </div>
        <div className="results-sub">
          {'Tap ♥ to save · expand for full recipe + timers · adjust servings inside'}
          {profile && (
            <span style={{ color: 'var(--jiff)', fontWeight: 500 }}>
              {' · personalised for '}{profile.name?.split(' ')[0]}
            </span>
          )}
        </div>
      </div>

      <div className="filter-pills">
        {mealType !== 'any' && (
          <span className="filter-pill">{MEAL_TYPE_OPTIONS.find(m => m.id === mealType)?.emoji}{' '}{mealType}</span>
        )}
        {cuisine !== 'any' && (
          <span className="filter-pill">{CUISINE_OPTIONS?.find(c => c.id === cuisine)?.flag}{' '}{cuisine}</span>
        )}
        <span className="filter-pill">{'⏱ '}{time}</span>
        {diet !== 'none' && <span className="filter-pill">{'🥗 '}{diet}</span>}
        <span className="filter-pill">{'👥 '}{defaultServings}{' serving'}{defaultServings !== 1 ? 's' : ''}</span>
        <span className="filter-pill">{'🥦 '}{ingredients.length}{' ingredient'}{ingredients.length > 1 ? 's' : ''}</span>
      </div>


      {!isPremium && trialActive && (
        <div style={{ background:'rgba(255,184,0,0.08)', border:'1px solid rgba(255,184,0,0.25)', borderRadius:12, padding:'10px 16px', marginBottom:12, display:'flex', alignItems:'center', justifyContent:'space-between', gap:10 }}>
          <div>
            <div style={{ fontSize:13, color:'#854F0B', fontWeight:500 }}>
              {'🎁 Trial — seeing 1 of '}{PAID_RECIPE_CAP}{' recipes'}
            </div>
            <div style={{ fontSize:11, color:'#92400E', fontWeight:300, marginTop:2 }}>
              {'Upgrade to unlock all recipes + week planner + saved meals'}
            </div>
          </div>
          <button onClick={() => { trackUpgradeClick('trial_banner'); navigate('/pricing'); }}
            style={{ background:'#854F0B', color:'white', border:'none', borderRadius:8, padding:'7px 16px', fontSize:12, fontWeight:600, cursor:'pointer', fontFamily:"'DM Sans',sans-serif", whiteSpace:'nowrap', flexShrink:0 }}>
            {'⚡ Upgrade'}
          </button>
        </div>
      )}

      {!isPremium && !trialActive && user && (
        <div style={{ background:'rgba(255,69,0,0.06)', border:'1.5px solid rgba(255,69,0,0.25)', borderRadius:12, padding:'12px 16px', marginBottom:12, display:'flex', alignItems:'center', justifyContent:'space-between', gap:10 }}>
          <div>
            <div style={{ fontSize:13, color:'#CC3700', fontWeight:600 }}>
              {'✨ '}{meals.length}{' recipes found'}
            </div>
            <div style={{ fontSize:11, color:'#7C6A5E', fontWeight:300, marginTop:2 }}>
              {'Unlock all '}{PAID_RECIPE_CAP}{' recipes, week planner, and saved meals'}
            </div>
          </div>
          <button onClick={() => { trackUpgradeClick('results_gate'); navigate('/pricing'); }}
            style={{ background:'#FF4500', color:'white', border:'none', borderRadius:8, padding:'7px 16px', fontSize:12, fontWeight:600, cursor:'pointer', fontFamily:"'DM Sans',sans-serif", whiteSpace:'nowrap', flexShrink:0 }}>
            {'⚡ Upgrade →'}
          </button>
        </div>
      )}

      {/* Skill level badge */}
      {profile?.skill_level === 'beginner' && (
        <div style={{ display:'inline-flex', alignItems:'center', gap:5, padding:'5px 12px', borderRadius:20, background:'rgba(29,158,117,0.08)', border:'1px solid rgba(29,158,117,0.2)', marginBottom:10, fontSize:11, color:'#065F46', fontWeight:500 }}>
          {'✓ Beginner-friendly recipes'}
        </div>
      )}

      <div className="meals-grid">
        {meals.map((meal, i) => (
          <MealCard
            key={mealKey(meal) + i}
            meal={meal}
            index={i}
            isFav={isFav(meal)}
            onToggleFav={toggleFavourite}
            fridgeIngredients={ingredients}
            defaultServings={defaultServings}
            animDelay={i * 0.06}
            country={country}
            rating={ratings[mealKey(meal)] || 0}
            onRate={stars => handleRate(meal, stars)}
          />
        ))}
      </div>

      {/* Smart recommendations — post-rating 'More like this' */}
      {topRated.length >= 1 && (() => {
        const topMeal    = meals.find(m => (ratings[mealKey(m)] || 0) >= 4 && m.cuisine);
        const topCuisine = topMeal?.cuisine;
        const cuisineLabel = topCuisine
          ? topCuisine.replace(/_/g,' ').split(' ').map(w => w.charAt(0).toUpperCase()+w.slice(1)).join(' ')
          : null;
        return (
          <div style={{ background:'rgba(255,69,0,0.04)', border:'1px solid rgba(255,69,0,0.15)', borderRadius:14, padding:'14px 16px', marginBottom:16 }}>
            <div style={{ fontSize:11, letterSpacing:'1.5px', textTransform:'uppercase', color:'var(--muted)', fontWeight:600, marginBottom:8 }}>
              {'✨ More like what you loved'}
            </div>
            <div style={{ display:'flex', flexWrap:'wrap', gap:8 }}>
              {cuisineLabel && (
                <button onClick={() => handleSurprise()}
                  style={{ padding:'8px 16px', borderRadius:20, background:'#FF4500', color:'white', border:'none', fontSize:12, fontWeight:600, cursor:'pointer', fontFamily:"'DM Sans',sans-serif" }}>
                  {'More '}{cuisineLabel}{' ideas →'}
                </button>
              )}
              <button onClick={handleSurprise}
                style={{ padding:'8px 16px', borderRadius:20, background:'white', color:'#FF4500', border:'1.5px solid rgba(255,69,0,0.3)', fontSize:12, fontWeight:500, cursor:'pointer', fontFamily:"'DM Sans',sans-serif" }}>
                {'✨ Surprise me'}
              </button>
            </div>
          </div>
        );
      })()}

      {/* Order-in strip */}
      {meals?.[0]?.name && (
        <div style={{ background: 'rgba(28,10,0,0.025)', border: '1px solid rgba(28,10,0,0.07)', borderRadius: 14, padding: '14px 18px', marginBottom: 12 }}>
          <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--muted)', marginBottom: 10 }}>
            {"🛵 Can't cook today? Order it instead"}
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {[
              { name: 'Swiggy',  color: '#FC8019', url: 'https://www.swiggy.com/search?query='  + encodeURIComponent(meals[0].name) },
              { name: 'Zomato',  color: '#CB202D', url: 'https://www.zomato.com/search?q='      + encodeURIComponent(meals[0].name) },
              { name: 'EatSure', color: '#E84855', url: 'https://eatsure.com/search?query='     + encodeURIComponent(meals[0].name) },
            ].map(d => (
              <a key={d.name} href={d.url} target="_blank" rel="noopener noreferrer"
                style={{ padding: '7px 16px', borderRadius: 10, textDecoration: 'none', fontSize: 12, fontWeight: 600, color: 'white', background: d.color, display: 'inline-block' }}
              >
                {d.name}
              </a>
            ))}
          </div>
        </div>
      )}

      <div className="reset-wrap">
        <button className="reset-btn" onClick={reset}>{'← Try different ingredients'}</button>
      </div>
    </div>
  );
}
