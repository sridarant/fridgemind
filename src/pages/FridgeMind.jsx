import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const styles = `
  * { box-sizing: border-box; margin: 0; padding: 0; }
  :root {
    --cream: #F5EFE0; --warm-white: #FAF7F0;
    --green: #2D4A3E; --green-light: #4A7C65;
    --terracotta: #C4603A; --gold: #C9A84C;
    --text: #1A1A1A; --muted: #6B6458;
    --border: rgba(45,74,62,0.15);
    --shadow: 0 4px 32px rgba(45,74,62,0.10);
  }
  body { background: var(--cream); font-family: 'DM Sans', sans-serif; }
  .app {
    min-height: 100vh; background: var(--cream);
    background-image:
      radial-gradient(ellipse at 20% 20%, rgba(196,96,58,0.06) 0%, transparent 50%),
      radial-gradient(ellipse at 80% 80%, rgba(45,74,62,0.08) 0%, transparent 50%);
  }
  .header {
    display: flex; align-items: center; justify-content: space-between;
    padding: 24px 40px 18px;
    border-bottom: 1px solid var(--border);
    position: sticky; top: 0; z-index: 10;
    background: rgba(245,239,224,0.92);
    backdrop-filter: blur(12px);
  }
  .logo { display: flex; align-items: center; gap: 10px; cursor: pointer; }
  .logo-text { font-family: 'Playfair Display', serif; font-size: 20px; font-weight: 700; color: var(--green); }
  .logo-tag { font-size: 10px; color: var(--muted); letter-spacing: 1.5px; text-transform: uppercase; }
  .header-badge { background: var(--green); color: white; font-size: 10px; padding: 4px 10px; border-radius: 20px; letter-spacing: 1px; text-transform: uppercase; }
  .hero { max-width: 800px; margin: 0 auto; padding: 56px 24px 0; text-align: center; }
  .hero-eyebrow { font-size: 11px; letter-spacing: 2.5px; text-transform: uppercase; color: var(--terracotta); font-weight: 500; margin-bottom: 14px; }
  .hero-title { font-family: 'Playfair Display', serif; font-size: clamp(32px, 5vw, 52px); font-weight: 700; line-height: 1.1; color: var(--green); margin-bottom: 16px; letter-spacing: -1px; }
  .hero-title em { font-style: italic; color: var(--terracotta); }
  .hero-sub { font-size: 15px; color: var(--muted); line-height: 1.7; max-width: 440px; margin: 0 auto 44px; font-weight: 300; }
  .card { background: var(--warm-white); border: 1px solid var(--border); border-radius: 20px; padding: 36px; box-shadow: var(--shadow); max-width: 740px; margin: 0 auto; }
  .section { margin-bottom: 30px; }
  .section-label { font-size: 11px; letter-spacing: 2px; text-transform: uppercase; color: var(--green); font-weight: 500; margin-bottom: 12px; display: flex; align-items: center; gap: 8px; }
  .section-label::after { content: ''; flex: 1; height: 1px; background: var(--border); }
  .ingredient-box { border: 1.5px solid var(--border); border-radius: 12px; padding: 12px 14px; background: white; min-height: 90px; cursor: text; display: flex; flex-wrap: wrap; gap: 7px; align-items: flex-start; transition: border-color 0.2s; }
  .ingredient-box:focus-within { border-color: var(--green-light); box-shadow: 0 0 0 3px rgba(45,74,62,0.08); }
  .tag { background: var(--green); color: white; padding: 5px 12px 5px 13px; border-radius: 20px; font-size: 13px; display: flex; align-items: center; gap: 6px; animation: tagIn 0.2s ease; white-space: nowrap; }
  @keyframes tagIn { from { transform: scale(0.8); opacity: 0; } to { transform: scale(1); opacity: 1; } }
  .tag-remove { background: none; border: none; color: rgba(255,255,255,0.65); cursor: pointer; font-size: 15px; padding: 0; display: flex; align-items: center; transition: color 0.15s; line-height: 1; }
  .tag-remove:hover { color: white; }
  .tag-input { border: none; outline: none; font-family: 'DM Sans', sans-serif; font-size: 14px; color: var(--text); flex: 1; min-width: 140px; background: transparent; padding: 4px 0; }
  .tag-input::placeholder { color: var(--muted); }
  .tag-hint { font-size: 11.5px; color: var(--muted); margin-top: 7px; font-weight: 300; }
  .chips { display: flex; flex-wrap: wrap; gap: 8px; }
  .chip { border: 1.5px solid var(--border); border-radius: 10px; padding: 8px 16px; font-size: 13px; cursor: pointer; transition: all 0.18s; font-family: 'DM Sans', sans-serif; background: white; color: var(--muted); }
  .chip:hover { border-color: var(--green-light); color: var(--green); }
  .chip.active { background: var(--green); border-color: var(--green); color: white; font-weight: 500; }
  .chip.diet.active { background: var(--terracotta); border-color: var(--terracotta); }
  .cta-wrap { text-align: center; padding-top: 6px; }
  .cta-btn { background: var(--green); color: white; border: none; border-radius: 14px; padding: 17px 44px; font-size: 16px; font-family: 'DM Sans', sans-serif; font-weight: 500; cursor: pointer; transition: all 0.22s; display: inline-flex; align-items: center; gap: 10px; }
  .cta-btn:hover:not(:disabled) { background: var(--green-light); transform: translateY(-2px); box-shadow: 0 8px 32px rgba(45,74,62,0.25); }
  .cta-btn:disabled { opacity: 0.6; cursor: not-allowed; }
  .cta-note { font-size: 12px; color: var(--muted); margin-top: 10px; }
  .loading-wrap { text-align: center; padding: 64px 24px; max-width: 500px; margin: 32px auto; }
  .spinner { width: 44px; height: 44px; border: 3px solid var(--border); border-top-color: var(--green); border-radius: 50%; animation: spin 0.8s linear infinite; margin: 0 auto 22px; }
  @keyframes spin { to { transform: rotate(360deg); } }
  .loading-title { font-family: 'Playfair Display', serif; font-size: 22px; color: var(--green); margin-bottom: 8px; }
  .loading-sub { font-size: 14px; color: var(--muted); font-weight: 300; margin-bottom: 28px; }
  .loading-fact { font-size: 13px; color: var(--muted); padding: 12px 0; border-top: 1px solid var(--border); animation: fadeIn 0.4s ease; }
  @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
  .results-header { max-width: 800px; margin: 48px auto 0; padding: 0 24px; }
  .results-title { font-family: 'Playfair Display', serif; font-size: 26px; color: var(--green); margin-bottom: 6px; }
  .results-sub { font-size: 14px; color: var(--muted); font-weight: 300; }
  .meals-grid { max-width: 800px; margin: 24px auto; padding: 0 24px 60px; display: grid; grid-template-columns: repeat(auto-fill, minmax(330px, 1fr)); gap: 18px; }
  .meal-card { background: var(--warm-white); border: 1px solid var(--border); border-radius: 18px; overflow: hidden; box-shadow: var(--shadow); animation: slideUp 0.35s ease both; transition: transform 0.22s, box-shadow 0.22s; }
  .meal-card:not(.expanded) { cursor: pointer; }
  .meal-card:not(.expanded):hover { transform: translateY(-4px); box-shadow: 0 12px 40px rgba(45,74,62,0.14); }
  .meal-card:nth-child(2) { animation-delay: 0.08s; }
  .meal-card:nth-child(3) { animation-delay: 0.16s; }
  @keyframes slideUp { from { opacity: 0; transform: translateY(24px); } to { opacity: 1; transform: translateY(0); } }
  .meal-hdr { padding: 22px 22px 14px; }
  .meal-num { font-size: 10px; letter-spacing: 2px; text-transform: uppercase; color: var(--terracotta); font-weight: 500; margin-bottom: 6px; }
  .meal-name { font-family: 'Playfair Display', serif; font-size: 21px; font-weight: 700; color: var(--green); margin-bottom: 10px; line-height: 1.2; }
  .meal-meta { display: flex; gap: 14px; flex-wrap: wrap; }
  .meal-meta-item { font-size: 12px; color: var(--muted); }
  .meal-desc { padding: 0 22px 16px; font-size: 13.5px; color: var(--muted); line-height: 1.6; font-weight: 300; }
  .expand-btn { margin: 0 22px 18px; background: var(--cream); border: 1px solid var(--border); border-radius: 10px; padding: 10px 16px; font-size: 13px; font-family: 'DM Sans', sans-serif; cursor: pointer; color: var(--green); font-weight: 500; width: calc(100% - 44px); text-align: left; display: flex; justify-content: space-between; align-items: center; transition: all 0.18s; }
  .expand-btn:hover { background: var(--green); color: white; border-color: var(--green); }
  .recipe { padding: 0 22px 22px; border-top: 1px solid var(--border); }
  .recipe-sec { font-size: 10px; letter-spacing: 2px; text-transform: uppercase; color: var(--green); font-weight: 500; margin: 18px 0 10px; }
  .ing-list { list-style: none; }
  .ing-list li { font-size: 13px; color: var(--text); padding: 5px 0; border-bottom: 1px solid rgba(0,0,0,0.04); display: flex; align-items: center; gap: 8px; font-weight: 300; }
  .ing-list li::before { content: '·'; color: var(--terracotta); font-size: 18px; line-height: 0; flex-shrink: 0; }
  .steps-list { counter-reset: step; list-style: none; }
  .steps-list li { font-size: 13px; color: var(--text); padding: 8px 0 8px 30px; border-bottom: 1px solid rgba(0,0,0,0.04); position: relative; line-height: 1.6; font-weight: 300; counter-increment: step; }
  .steps-list li::before { content: counter(step); position: absolute; left: 0; top: 10px; width: 19px; height: 19px; background: var(--green); color: white; font-size: 10px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 600; }
  .nutr-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; }
  .nutr-item { background: var(--cream); border-radius: 10px; padding: 10px; text-align: center; }
  .nutr-val { font-family: 'Playfair Display', serif; font-size: 17px; font-weight: 700; color: var(--green); }
  .nutr-lbl { font-size: 10px; color: var(--muted); margin-top: 2px; text-transform: uppercase; letter-spacing: 1px; }
  .collapse-btn { margin-top: 14px; width: 100%; background: var(--cream); border: 1px solid var(--border); border-radius: 10px; padding: 9px 16px; font-size: 13px; font-family: 'DM Sans', sans-serif; cursor: pointer; color: var(--muted); display: flex; justify-content: space-between; transition: all 0.18s; }
  .collapse-btn:hover { color: var(--green); border-color: var(--green-light); }
  .reset-wrap { text-align: center; padding: 0 24px 60px; }
  .reset-btn { background: none; border: 1.5px solid var(--border); border-radius: 10px; padding: 12px 28px; font-size: 14px; font-family: 'DM Sans', sans-serif; cursor: pointer; color: var(--muted); transition: all 0.18s; }
  .reset-btn:hover { border-color: var(--terracotta); color: var(--terracotta); }
  .error-wrap { text-align: center; padding: 60px 24px; max-width: 480px; margin: 0 auto; }
  .error-icon { font-size: 40px; margin-bottom: 16px; }
  .error-title { font-family: 'Playfair Display', serif; font-size: 20px; color: var(--green); margin-bottom: 8px; }
  .error-msg { font-size: 14px; color: var(--muted); margin-bottom: 24px; font-weight: 300; }
  @media (max-width: 600px) {
    .header { padding: 18px 18px 14px; }
    .hero { padding: 36px 18px 0; }
    .card { padding: 22px 18px; }
    .meals-grid { grid-template-columns: 1fr; padding: 0 18px 48px; }
    .nutr-grid { grid-template-columns: repeat(2, 1fr); }
  }
`;

const TIME_OPTIONS = [
  { id: '15 min', label: '⚡ 15 min' },
  { id: '30 min', label: '🍳 30 min' },
  { id: '1 hour', label: '🥘 1 hour' },
  { id: 'no time limit', label: '🌿 No limit' },
];

const DIET_OPTIONS = [
  { id: 'none', label: 'No restrictions' },
  { id: 'vegetarian', label: 'Vegetarian' },
  { id: 'vegan', label: 'Vegan' },
  { id: 'gluten-free', label: 'Gluten-free' },
  { id: 'dairy-free', label: 'Dairy-free' },
  { id: 'low-carb', label: 'Low-carb' },
];

const FACTS = [
  'Scanning your fridge inventory…',
  'Cross-referencing 10,000+ recipes…',
  'Checking your time & diet preferences…',
  'Calculating nutritional profiles…',
  'Finalising your personalised menu…',
];

export default function FridgeMind() {
  const navigate = useNavigate();
  const [ingredients, setIngredients] = useState([]);
  const [inputVal, setInputVal] = useState('');
  const [time, setTime] = useState('30 min');
  const [diet, setDiet] = useState('none');
  const [view, setView] = useState('input');
  const [meals, setMeals] = useState([]);
  const [expanded, setExpanded] = useState({});
  const [factIdx, setFactIdx] = useState(0);
  const [errorMsg, setErrorMsg] = useState('');
  const inputRef = useRef(null);
  const timerRef = useRef(null);

  useEffect(() => {
    if (view === 'loading') {
      timerRef.current = setInterval(() => setFactIdx(f => (f + 1) % FACTS.length), 1400);
    }
    return () => clearInterval(timerRef.current);
  }, [view]);

  const addIngredient = (val) => {
    const v = val.trim().replace(/,$/, '');
    if (v && !ingredients.includes(v)) setIngredients(p => [...p, v]);
    setInputVal('');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); addIngredient(inputVal); }
    else if (e.key === 'Backspace' && !inputVal && ingredients.length) setIngredients(p => p.slice(0, -1));
  };

  const toggleExpand = (i) => setExpanded(p => ({ ...p, [i]: !p[i] }));

  const handleSubmit = async () => {
    if (!ingredients.length) return;
    setView('loading'); setFactIdx(0);
    try {
      const res = await fetch('/api/suggest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ingredients, time, diet }),
      });
      const data = await res.json();
      if (data.meals && data.meals.length > 0) {
        setMeals(data.meals); setExpanded({}); setView('results');
      } else {
        setErrorMsg(data.error || 'Could not generate suggestions. Please try again.');
        setView('error');
      }
    } catch {
      setErrorMsg('Connection error. Please check your network and try again.');
      setView('error');
    }
  };

  const reset = () => { setView('input'); setMeals([]); setIngredients([]); setInputVal(''); };

  return (
    <>
      <style>{styles}</style>
      <div className="app">
        <header className="header">
          <div className="logo" onClick={() => navigate('/')}>
            <span style={{ fontSize: 26 }}>🧠</span>
            <div>
              <div className="logo-text">FridgeMind</div>
              <div className="logo-tag">AI Meal Suggester</div>
            </div>
          </div>
          <div className="header-badge">Powered by Claude AI</div>
        </header>

        {view === 'input' && (
          <>
            <div className="hero">
              <div className="hero-eyebrow">The world's most common daily frustration — solved</div>
              <h1 className="hero-title">What should I cook with <em>what I have?</em></h1>
              <p className="hero-sub">Add your ingredients below and get 3 personalised meal ideas with full recipes — instantly.</p>
            </div>
            <div className="card" style={{ marginTop: 32 }}>
              <div className="section">
                <div className="section-label">Your ingredients</div>
                <div className="ingredient-box" onClick={() => inputRef.current?.focus()}>
                  {ingredients.map(ing => (
                    <span key={ing} className="tag">
                      {ing}
                      <button className="tag-remove" onClick={e => { e.stopPropagation(); setIngredients(p => p.filter(i => i !== ing)); }}>×</button>
                    </span>
                  ))}
                  <input
                    ref={inputRef} className="tag-input" value={inputVal}
                    onChange={e => setInputVal(e.target.value)}
                    onKeyDown={handleKeyDown}
                    onBlur={() => { if (inputVal.trim()) addIngredient(inputVal); }}
                    placeholder={ingredients.length === 0 ? 'Type an ingredient and press Enter… e.g. eggs, onions, rice' : 'Add more…'}
                  />
                </div>
                <p className="tag-hint">Press Enter or comma after each ingredient · Backspace to remove last</p>
              </div>
              <div className="section">
                <div className="section-label">Time available</div>
                <div className="chips">
                  {TIME_OPTIONS.map(o => (
                    <button key={o.id} className={`chip ${time === o.id ? 'active' : ''}`} onClick={() => setTime(o.id)}>{o.label}</button>
                  ))}
                </div>
              </div>
              <div className="section">
                <div className="section-label">Dietary preference</div>
                <div className="chips">
                  {DIET_OPTIONS.map(o => (
                    <button key={o.id} className={`chip diet ${diet === o.id ? 'active' : ''}`} onClick={() => setDiet(o.id)}>{o.label}</button>
                  ))}
                </div>
              </div>
              <div className="cta-wrap">
                <button className="cta-btn" onClick={handleSubmit} disabled={!ingredients.length}>
                  <span>🍽️</span> What should I cook?
                </button>
                {!ingredients.length && <p className="cta-note">Add at least one ingredient to get started</p>}
              </div>
            </div>
          </>
        )}

        {view === 'loading' && (
          <div className="loading-wrap">
            <div className="spinner" />
            <div className="loading-title">Thinking like a chef…</div>
            <div className="loading-sub">Matching your {ingredients.length} ingredient{ingredients.length > 1 ? 's' : ''} to the perfect meals</div>
            <div className="loading-fact">{FACTS[factIdx]}</div>
          </div>
        )}

        {view === 'results' && (
          <>
            <div className="results-header">
              <div className="results-title">Your personal menu is ready 🎉</div>
              <div className="results-sub">3 meals crafted from what you already have — tap any card for the full recipe.</div>
            </div>
            <div className="meals-grid">
              {meals.map((meal, i) => (
                <div key={i} className={`meal-card ${expanded[i] ? 'expanded' : ''}`} onClick={() => !expanded[i] && toggleExpand(i)}>
                  <div className="meal-hdr">
                    <div className="meal-num">Option {i + 1}</div>
                    <div className="meal-name">{meal.emoji} {meal.name}</div>
                    <div className="meal-meta">
                      <span className="meal-meta-item">⏱ {meal.time}</span>
                      <span className="meal-meta-item">👥 {meal.servings} servings</span>
                      <span className="meal-meta-item">📊 {meal.difficulty}</span>
                    </div>
                  </div>
                  <div className="meal-desc">{meal.description}</div>
                  {!expanded[i] ? (
                    <button className="expand-btn" onClick={e => { e.stopPropagation(); toggleExpand(i); }}>
                      <span>See full recipe</span><span>→</span>
                    </button>
                  ) : (
                    <div className="recipe" onClick={e => e.stopPropagation()}>
                      <div className="recipe-sec">Ingredients</div>
                      <ul className="ing-list">{meal.ingredients?.map((ing, j) => <li key={j}>{ing}</li>)}</ul>
                      <div className="recipe-sec">Method</div>
                      <ol className="steps-list">{meal.steps?.map((s, j) => <li key={j}>{s}</li>)}</ol>
                      <div className="recipe-sec">Nutrition (approx.)</div>
                      <div className="nutr-grid">
                        {[['Calories', meal.calories], ['Protein', meal.protein], ['Carbs', meal.carbs], ['Fat', meal.fat]].map(([lbl, val]) => (
                          <div key={lbl} className="nutr-item">
                            <div className="nutr-val">{val}</div>
                            <div className="nutr-lbl">{lbl}</div>
                          </div>
                        ))}
                      </div>
                      <button className="collapse-btn" onClick={() => toggleExpand(i)}>
                        <span>Collapse</span><span>↑</span>
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
            <div className="reset-wrap">
              <button className="reset-btn" onClick={reset}>← Try different ingredients</button>
            </div>
          </>
        )}

        {view === 'error' && (
          <div className="error-wrap">
            <div className="error-icon">😕</div>
            <div className="error-title">Something went wrong</div>
            <div className="error-msg">{errorMsg}</div>
            <button className="cta-btn" onClick={reset}>← Start over</button>
          </div>
        )}
      </div>
    </>
  );
}
