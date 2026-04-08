// src/components/jiff/ResultsView.jsx
// Results grid: filter pills, meal cards, order strip, reset

import { MealCard } from '../meal/MealCard.jsx';
import { mealKey }  from '../../lib/mealKey.js';

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
  CUISINE_OPTIONS,
  handleSurprise, reset, navigate, t,
}) {
  const handleRate = (meal, stars) => {
    const key = mealKey(meal);
    setRatings(prev => ({ ...prev, [key]: stars }));
    if (user) {
      fetch('/api/admin?action=meal-history', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, mealName: meal.name, rating: stars }),
      }).catch(() => {});
    }
  };

  const topRated = Object.entries(ratings).filter(([, r]) => r >= 4).map(([k]) => k);

  return (
    <div className="results-wrap">
      {/* Pantry restock nudge */}
      {pantryNudge.length > 0 && (
        <div style={{ background: 'rgba(92,107,192,0.08)', border: '1px solid rgba(92,107,192,0.2)', borderRadius: 12, padding: '10px 14px', marginBottom: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 13, color: '#3949AB', fontWeight: 300 }}>
            {'🧂 You may need to restock: '}
            <strong>{pantryNudge.join(', ')}</strong>
          </span>
          <button onClick={() => setPantryNudge([])} style={{ background: 'none', border: 'none', color: '#9E9E9E', cursor: 'pointer', fontSize: 12, fontFamily: "'DM Sans',sans-serif" }}>{'✕'}</button>
        </div>
      )}

      <div className="results-header">
        <div className="results-title">{'Jiffed. ⚡ Here\'s your menu.'}</div>
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
        <div style={{ background: 'rgba(255,184,0,0.08)', border: '1px solid rgba(255,184,0,0.25)', borderRadius: 12, padding: '10px 14px', marginBottom: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 13, color: '#854F0B', fontWeight: 300 }}>
            {'🎁 Trial preview — you\'re seeing 1 recipe. Upgrade to see all '}{PAID_RECIPE_CAP}{'.'}
          </span>
          <button
            onClick={() => navigate('/pricing')}
            style={{ background: '#854F0B', color: 'white', border: 'none', borderRadius: 8, padding: '7px 14px', fontSize: 12, fontWeight: 500, cursor: 'pointer', fontFamily: "'DM Sans',sans-serif", whiteSpace: 'nowrap' }}
          >
            {'⚡ Upgrade'}
          </button>
        </div>
      )}

      <div className="meals-grid">
        {meals.map((meal, i) => (
          <MealCard
            key={mealKey(meal) + i}
            meal={meal}
            index={i}
            isFavourite={isFav(meal)}
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

      {/* Smart recommendations */}
      {topRated.length >= 1 && (
        <div style={{ background: 'rgba(255,69,0,0.04)', border: '1px solid rgba(255,69,0,0.15)', borderRadius: 14, padding: '14px 16px', marginBottom: 16 }}>
          <div style={{ fontSize: 11, letterSpacing: '1.5px', textTransform: 'uppercase', color: 'var(--jiff)', fontWeight: 500, marginBottom: 10 }}>
            {'✨ Based on meals you loved'}
          </div>
          <p style={{ fontSize: 12, color: 'var(--muted)', fontWeight: 300, margin: '0 0 10px' }}>
            {'You\'ve rated '}{topRated.length}{' recipe'}{topRated.length !== 1 ? 's' : ''}{' highly. Generate similar dishes:'}
          </p>
          <button
            onClick={handleSurprise}
            style={{ background: 'var(--jiff)', color: 'white', border: 'none', borderRadius: 10, padding: '8px 18px', fontSize: 12, fontWeight: 500, cursor: 'pointer', fontFamily: "'DM Sans',sans-serif" }}
          >
            {'✨ Surprise me with something similar'}
          </button>
        </div>
      )}

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
