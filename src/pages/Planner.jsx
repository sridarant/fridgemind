import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,wght@0,700;0,900;1,700&family=DM+Sans:wght@300;400;500&display=swap');
  * { box-sizing: border-box; margin: 0; padding: 0; }
  :root {
    --jiff: #FF4500; --jiff-dark: #CC3700; --ink: #1C0A00;
    --cream: #FFFAF5; --warm: #FFF0E5; --muted: #7C6A5E;
    --border: rgba(28,10,0,0.10); --border-mid: rgba(28,10,0,0.18);
    --shadow: 0 4px 24px rgba(28,10,0,0.07);
    --breakfast: #FFF3E0; --breakfast-b: rgba(255,152,0,0.3); --breakfast-t: #E65100;
    --lunch: #E8F5E9; --lunch-b: rgba(76,175,80,0.3); --lunch-t: #1B5E20;
    --dinner: #EDE7F6; --dinner-b: rgba(103,58,183,0.3); --dinner-t: #311B92;
    --whatsapp: #25D366; --whatsapp-dark: #1DA851;
  }
  body { background: var(--cream); font-family: 'DM Sans', sans-serif; color: var(--ink); }
  .app { min-height: 100vh; background: var(--cream); }

  /* Header */
  .header { display: flex; align-items: center; justify-content: space-between; padding: 18px 36px; border-bottom: 1px solid var(--border); position: sticky; top: 0; z-index: 20; background: rgba(255,250,245,0.95); backdrop-filter: blur(12px); }
  .logo { display: flex; align-items: center; gap: 8px; cursor: pointer; }
  .logo-name { font-family: 'Fraunces', serif; font-size: 22px; font-weight: 900; color: var(--ink); letter-spacing: -0.5px; }
  .logo-name span { color: var(--jiff); }
  .nav-links { display: flex; align-items: center; gap: 8px; }
  .nav-link { font-size: 13px; font-weight: 500; color: var(--muted); background: none; border: 1.5px solid var(--border-mid); border-radius: 8px; padding: 7px 14px; cursor: pointer; font-family: 'DM Sans', sans-serif; transition: all 0.18s; text-decoration: none; display: inline-flex; align-items: center; gap: 6px; }
  .nav-link:hover { border-color: var(--jiff); color: var(--jiff); }
  .nav-link.active { background: var(--jiff); color: white; border-color: var(--jiff); }

  /* Page hero */
  .hero { max-width: 760px; margin: 0 auto; padding: 48px 24px 0; text-align: center; }
  .hero-eyebrow { font-size: 11px; letter-spacing: 2.5px; text-transform: uppercase; color: var(--jiff); font-weight: 500; margin-bottom: 12px; }
  .hero-title { font-family: 'Fraunces', serif; font-size: clamp(30px, 5vw, 50px); font-weight: 900; color: var(--ink); line-height: 1.05; letter-spacing: -1.5px; margin-bottom: 12px; }
  .hero-title em { font-style: italic; color: var(--jiff); }
  .hero-sub { font-size: 15px; color: var(--muted); line-height: 1.7; font-weight: 300; max-width: 420px; margin: 0 auto 36px; }

  /* Input card */
  .card { background: white; border: 1px solid var(--border); border-radius: 22px; padding: 32px; box-shadow: var(--shadow); max-width: 720px; margin: 0 auto; }
  .section { margin-bottom: 24px; }
  .section-label { font-size: 11px; letter-spacing: 2px; text-transform: uppercase; color: var(--jiff); font-weight: 500; margin-bottom: 11px; display: flex; align-items: center; gap: 8px; }
  .section-label::after { content: ''; flex: 1; height: 1px; background: var(--border); }
  .ingredient-box { border: 1.5px solid var(--border-mid); border-radius: 12px; padding: 12px 14px; background: var(--cream); min-height: 88px; cursor: text; display: flex; flex-wrap: wrap; gap: 7px; align-items: flex-start; transition: border-color 0.2s; }
  .ingredient-box:focus-within { border-color: var(--jiff); box-shadow: 0 0 0 3px rgba(255,69,0,0.1); }
  .tag { background: var(--ink); color: white; padding: 5px 12px 5px 13px; border-radius: 20px; font-size: 13px; display: flex; align-items: center; gap: 6px; animation: tagIn 0.2s ease; white-space: nowrap; }
  @keyframes tagIn { from { transform: scale(0.8); opacity: 0; } to { transform: scale(1); opacity: 1; } }
  .tag-remove { background: none; border: none; color: rgba(255,255,255,0.6); cursor: pointer; font-size: 16px; padding: 0; line-height: 1; transition: color 0.15s; }
  .tag-remove:hover { color: white; }
  .tag-input { border: none; outline: none; font-family: 'DM Sans', sans-serif; font-size: 14px; color: var(--ink); flex: 1; min-width: 140px; background: transparent; padding: 4px 0; }
  .tag-input::placeholder { color: var(--muted); }
  .tag-hint { font-size: 11.5px; color: var(--muted); margin-top: 7px; font-weight: 300; }
  .chips { display: flex; flex-wrap: wrap; gap: 7px; }
  .chip { border: 1.5px solid var(--border-mid); border-radius: 10px; padding: 7px 15px; font-size: 13px; cursor: pointer; transition: all 0.18s; font-family: 'DM Sans', sans-serif; background: white; color: var(--muted); }
  .chip:hover { border-color: var(--jiff); color: var(--ink); }
  .chip.active { background: var(--ink); border-color: var(--ink); color: white; font-weight: 500; }
  .chip.diet.active { background: var(--jiff); border-color: var(--jiff); }
  .cuisine-chips { display: flex; flex-wrap: wrap; gap: 7px; }
  .cuisine-chip { border: 1.5px solid var(--border-mid); border-radius: 10px; padding: 7px 14px; font-size: 13px; cursor: pointer; transition: all 0.18s; font-family: 'DM Sans', sans-serif; background: white; color: var(--muted); display: flex; align-items: center; gap: 6px; }
  .cuisine-chip:hover { border-color: var(--jiff); color: var(--ink); }
  .cuisine-chip.active { background: var(--jiff); border-color: var(--jiff); color: white; font-weight: 500; }
  .cuisine-chip.active-any { background: var(--ink); border-color: var(--ink); color: white; font-weight: 500; }
  .cuisine-flag { font-size: 16px; line-height: 1; }
  .cta-wrap { text-align: center; padding-top: 4px; }
  .cta-btn { background: var(--jiff); color: white; border: none; border-radius: 14px; padding: 17px 44px; font-size: 16px; font-family: 'DM Sans', sans-serif; font-weight: 500; cursor: pointer; transition: all 0.2s; display: inline-flex; align-items: center; gap: 10px; }
  .cta-btn:hover:not(:disabled) { background: var(--jiff-dark); transform: translateY(-2px); box-shadow: 0 8px 28px rgba(255,69,0,0.35); }
  .cta-btn:disabled { opacity: 0.55; cursor: not-allowed; }
  .cta-note { font-size: 12px; color: var(--muted); margin-top: 10px; }

  /* Loading */
  .loading-wrap { text-align: center; padding: 72px 24px; max-width: 500px; margin: 0 auto; }
  .spinner { width: 48px; height: 48px; border: 3px solid var(--border-mid); border-top-color: var(--jiff); border-radius: 50%; animation: spin 0.7s linear infinite; margin: 0 auto 24px; }
  @keyframes spin { to { transform: rotate(360deg); } }
  .loading-title { font-family: 'Fraunces', serif; font-size: 26px; font-weight: 900; color: var(--ink); margin-bottom: 8px; letter-spacing: -0.5px; }
  .loading-sub { font-size: 14px; color: var(--muted); font-weight: 300; margin-bottom: 32px; }
  .loading-days { display: grid; grid-template-columns: repeat(7, 1fr); gap: 6px; max-width: 420px; margin: 0 auto; }
  .loading-day { background: var(--warm); border-radius: 8px; padding: 8px 4px; text-align: center; font-size: 11px; color: var(--muted); transition: all 0.3s; }
  .loading-day.done { background: var(--jiff); color: white; font-weight: 500; }
  .loading-day.active { background: var(--warm); border: 2px solid var(--jiff); color: var(--jiff); font-weight: 500; }
  @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }

  /* Results — week planner */
  .planner-wrap { max-width: 1100px; margin: 0 auto; padding: 36px 20px 60px; }
  .planner-top { display: flex; align-items: center; justify-content: space-between; margin-bottom: 24px; flex-wrap: wrap; gap: 12px; }
  .planner-title { font-family: 'Fraunces', serif; font-size: 26px; font-weight: 900; color: var(--ink); letter-spacing: -0.5px; }
  .planner-sub { font-size: 13px; color: var(--muted); font-weight: 300; margin-top: 3px; }
  .planner-actions { display: flex; gap: 8px; flex-wrap: wrap; }
  .plan-btn { display: flex; align-items: center; gap: 7px; font-size: 13px; font-weight: 500; font-family: 'DM Sans', sans-serif; padding: 9px 16px; border-radius: 10px; cursor: pointer; transition: all 0.18s; }
  .plan-btn.secondary { background: white; color: var(--ink); border: 1.5px solid var(--border-mid); }
  .plan-btn.secondary:hover { border-color: var(--jiff); color: var(--jiff); }
  .plan-btn.primary { background: var(--jiff); color: white; border: none; }
  .plan-btn.primary:hover { background: var(--jiff-dark); }
  .plan-btn.green { background: var(--whatsapp); color: white; border: none; text-decoration: none; }
  .plan-btn.green:hover { background: var(--whatsapp-dark); }
  .plan-btn svg { width: 15px; height: 15px; flex-shrink: 0; }

  /* Meal type legend */
  .meal-legend { display: flex; gap: 16px; margin-bottom: 20px; flex-wrap: wrap; }
  .legend-item { display: flex; align-items: center; gap: 7px; font-size: 12px; color: var(--muted); }
  .legend-dot { width: 10px; height: 10px; border-radius: 3px; flex-shrink: 0; }
  .legend-dot.breakfast { background: #FF9800; }
  .legend-dot.lunch { background: #4CAF50; }
  .legend-dot.dinner { background: #673AB7; }

  /* Day tabs (mobile) */
  .day-tabs { display: none; gap: 6px; overflow-x: auto; padding-bottom: 4px; margin-bottom: 16px; }
  .day-tab { flex-shrink: 0; padding: 7px 16px; border-radius: 20px; font-size: 13px; font-weight: 500; cursor: pointer; font-family: 'DM Sans', sans-serif; border: 1.5px solid var(--border-mid); background: white; color: var(--muted); transition: all 0.18s; }
  .day-tab.active { background: var(--jiff); color: white; border-color: var(--jiff); }

  /* Calendar grid */
  .calendar { display: grid; grid-template-columns: repeat(7, minmax(0, 1fr)); gap: 10px; }
  .day-col { display: flex; flex-direction: column; gap: 8px; }
  .day-header { text-align: center; padding: 10px 6px 8px; background: var(--ink); border-radius: 12px; }
  .day-name { font-family: 'Fraunces', serif; font-size: 13px; font-weight: 700; color: white; letter-spacing: 0.3px; }
  .day-short { font-size: 10px; color: rgba(255,250,245,0.55); margin-top: 1px; }

  /* Meal slot */
  .meal-slot { border-radius: 12px; overflow: hidden; border: 1px solid var(--border); transition: box-shadow 0.18s; }
  .meal-slot:hover { box-shadow: 0 4px 16px rgba(28,10,0,0.1); }
  .meal-slot.breakfast { border-color: var(--breakfast-b); }
  .meal-slot.lunch { border-color: var(--lunch-b); }
  .meal-slot.dinner { border-color: var(--dinner-b); }

  .meal-slot-header { padding: 9px 10px 7px; cursor: pointer; }
  .meal-slot.breakfast .meal-slot-header { background: var(--breakfast); }
  .meal-slot.lunch .meal-slot-header { background: var(--lunch); }
  .meal-slot.dinner .meal-slot-header { background: var(--dinner); }
  .meal-type-label { font-size: 9px; letter-spacing: 1.5px; text-transform: uppercase; font-weight: 600; margin-bottom: 4px; }
  .meal-slot.breakfast .meal-type-label { color: var(--breakfast-t); }
  .meal-slot.lunch .meal-type-label { color: var(--lunch-t); }
  .meal-slot.dinner .meal-type-label { color: var(--dinner-t); }
  .meal-emoji { font-size: 18px; margin-bottom: 4px; line-height: 1; }
  .meal-name-cell { font-size: 12px; font-weight: 500; color: var(--ink); line-height: 1.3; }
  .meal-time-cell { font-size: 10px; color: var(--muted); margin-top: 3px; }
  .meal-expand-icon { font-size: 10px; color: var(--muted); margin-top: 4px; }

  /* Expanded meal detail */
  .meal-detail { padding: 10px; background: white; border-top: 1px solid var(--border); animation: fadeIn 0.2s ease; }
  .meal-detail-desc { font-size: 11.5px; color: var(--muted); line-height: 1.55; margin-bottom: 9px; font-weight: 300; }
  .detail-label { font-size: 9px; letter-spacing: 1.5px; text-transform: uppercase; font-weight: 600; color: var(--jiff); margin-bottom: 5px; margin-top: 9px; }
  .ing-list-small { list-style: none; }
  .ing-list-small li { font-size: 11px; color: var(--ink); padding: 3px 0; border-bottom: 1px solid rgba(0,0,0,0.04); font-weight: 300; display: flex; align-items: center; gap: 5px; }
  .ing-list-small li::before { content: '·'; color: var(--jiff); font-size: 14px; line-height: 0; flex-shrink: 0; }
  .steps-list-small { counter-reset: s; list-style: none; }
  .steps-list-small li { font-size: 11px; color: var(--ink); padding: 4px 0 4px 22px; border-bottom: 1px solid rgba(0,0,0,0.04); position: relative; line-height: 1.5; font-weight: 300; counter-increment: s; }
  .steps-list-small li::before { content: counter(s); position: absolute; left: 0; top: 5px; width: 15px; height: 15px; background: var(--jiff); color: white; font-size: 9px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 600; }
  .nutrition-row { display: flex; gap: 6px; margin-top: 9px; }
  .nutr-pill { flex: 1; background: var(--warm); border-radius: 7px; padding: 6px 4px; text-align: center; }
  .nutr-val-sm { font-family: 'Fraunces', serif; font-size: 13px; font-weight: 700; color: var(--ink); }
  .nutr-lbl-sm { font-size: 9px; color: var(--muted); text-transform: uppercase; letter-spacing: 0.5px; margin-top: 1px; }

  /* Weekly grocery panel */
  .grocery-panel { max-width: 1100px; margin: 0 auto 60px; padding: 0 20px; }
  .grocery-card { background: white; border: 1px solid var(--border); border-radius: 20px; overflow: hidden; box-shadow: var(--shadow); }
  .grocery-card-header { background: var(--ink); padding: 20px 24px; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 12px; }
  .grocery-card-title { font-family: 'Fraunces', serif; font-size: 20px; font-weight: 900; color: white; letter-spacing: -0.3px; }
  .grocery-card-sub { font-size: 13px; color: rgba(255,250,245,0.55); margin-top: 2px; }
  .grocery-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 0; }
  .grocery-category { padding: 16px 20px; border-right: 1px solid var(--border); border-bottom: 1px solid var(--border); }
  .grocery-category:nth-child(odd) { background: var(--cream); }
  .grocery-cat-title { font-size: 10px; letter-spacing: 2px; text-transform: uppercase; font-weight: 600; color: var(--jiff); margin-bottom: 10px; }
  .grocery-item-row { display: flex; align-items: center; gap: 8px; padding: 5px 0; border-bottom: 1px solid rgba(0,0,0,0.04); cursor: pointer; }
  .grocery-item-row:last-child { border-bottom: none; }
  .g-checkbox { width: 16px; height: 16px; border-radius: 4px; border: 1.5px solid var(--border-mid); flex-shrink: 0; display: flex; align-items: center; justify-content: center; transition: all 0.15s; }
  .g-checkbox.checked { background: var(--jiff); border-color: var(--jiff); }
  .g-checkbox.checked svg { display: block; }
  .g-checkbox svg { display: none; width: 10px; height: 10px; stroke: white; stroke-width: 2.5; }
  .g-item-text { font-size: 12px; color: var(--ink); font-weight: 300; flex: 1; line-height: 1.4; }
  .g-item-text.done { text-decoration: line-through; opacity: 0.45; }
  .grocery-actions { padding: 16px 20px; background: var(--cream); border-top: 1px solid var(--border); display: flex; gap: 10px; flex-wrap: wrap; }
  .grocery-stats { padding: 12px 20px 0; display: flex; gap: 16px; flex-wrap: wrap; border-top: 1px solid var(--border); }
  .grocery-stat { font-size: 12px; color: var(--muted); display: flex; align-items: center; gap: 5px; }

  /* Reset */
  .reset-wrap { text-align: center; padding: 0 24px 60px; }
  .reset-btn { background: none; border: 1.5px solid var(--border-mid); border-radius: 10px; padding: 11px 28px; font-size: 14px; font-family: 'DM Sans', sans-serif; cursor: pointer; color: var(--muted); transition: all 0.18s; }
  .reset-btn:hover { border-color: var(--jiff); color: var(--jiff); }
  .error-wrap { text-align: center; padding: 64px 24px; max-width: 460px; margin: 0 auto; }
  .error-icon { font-size: 40px; margin-bottom: 14px; }
  .error-title { font-family: 'Fraunces', serif; font-size: 22px; font-weight: 700; color: var(--ink); margin-bottom: 8px; }
  .error-msg { font-size: 14px; color: var(--muted); margin-bottom: 24px; font-weight: 300; }

  @media (max-width: 900px) {
    .calendar { grid-template-columns: repeat(4, minmax(0, 1fr)); }
  }
  @media (max-width: 600px) {
    .header { padding: 16px 18px; }
    .hero { padding: 32px 18px 0; }
    .card { padding: 22px 16px; }
    .calendar { grid-template-columns: 1fr; }
    .day-tabs { display: flex; }
    .day-col { display: none; }
    .day-col.visible { display: flex; }
    .planner-wrap { padding: 24px 16px 48px; }
    .grocery-grid { grid-template-columns: 1fr; }
    .nav-links { gap: 6px; }
    .nav-link span { display: none; }
  }
`;

const DAYS = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'];
const DAYS_SHORT = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
const MEAL_TYPES = ['breakfast','lunch','dinner'];

const DIET_OPTIONS = [
  { id: 'none', label: 'No restrictions' },
  { id: 'vegetarian', label: 'Vegetarian' },
  { id: 'vegan', label: 'Vegan' },
  { id: 'gluten-free', label: 'Gluten-free' },
  { id: 'dairy-free', label: 'Dairy-free' },
  { id: 'low-carb', label: 'Low-carb' },
];

const CUISINE_OPTIONS = [
  { id: 'any', label: 'Mix it up', flag: '🌍' },
  { id: 'Indian', label: 'Indian', flag: '🇮🇳' },
  { id: 'Italian', label: 'Italian', flag: '🇮🇹' },
  { id: 'Chinese', label: 'Chinese', flag: '🇨🇳' },
  { id: 'Mexican', label: 'Mexican', flag: '🇲🇽' },
  { id: 'Mediterranean', label: 'Mediterranean', flag: '🫒' },
  { id: 'Thai', label: 'Thai', flag: '🇹🇭' },
];

const LOADING_STEPS = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'];

// ── Icons ──────────────────────────────────────────────
const IconCopy = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>;
const IconCheck = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>;
const IconCart = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 001.98 1.61H19a2 2 0 001.98-1.71L23 6H6"/></svg>;
const IconWA = () => <svg viewBox="0 0 32 32" fill="currentColor"><path d="M16 0C7.164 0 0 7.163 0 16c0 2.82.736 5.469 2.027 7.77L0 32l8.469-2.004A15.938 15.938 0 0016 32c8.836 0 16-7.164 16-16S24.836 0 16 0zm0 29.333a13.27 13.27 0 01-6.771-1.852l-.485-.288-5.027 1.189 1.213-4.899-.315-.503A13.257 13.257 0 012.667 16C2.667 8.636 8.636 2.667 16 2.667S29.333 8.636 29.333 16 23.364 29.333 16 29.333zm7.27-9.878c-.397-.198-2.35-1.16-2.714-1.291-.363-.132-.627-.198-.89.198-.264.397-1.023 1.291-1.253 1.556-.231.264-.462.297-.858.099-.397-.198-1.675-.617-3.19-1.97-1.18-1.052-1.977-2.35-2.208-2.747-.231-.397-.025-.611.173-.809.178-.178.397-.462.595-.693.198-.231.264-.397.397-.661.132-.265.066-.496-.033-.694-.099-.198-.89-2.148-1.22-2.942-.32-.772-.647-.667-.89-.68-.23-.012-.496-.015-.76-.015-.264 0-.694.099-1.057.496-.363.397-1.386 1.354-1.386 3.303 0 1.95 1.419 3.834 1.617 4.099.198.264 2.793 4.266 6.766 5.982.946.408 1.684.652 2.26.834.95.302 1.814.26 2.497.158.761-.114 2.35-.961 2.68-1.889.332-.927.332-1.722.232-1.889-.099-.165-.363-.264-.76-.462z"/></svg>;
const IconRefresh = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 11-2.12-9.36L23 10"/></svg>;

// ── Collect all unique ingredients from the plan ──────
function collectAllIngredients(plan) {
  const all = new Set();
  plan.forEach(day => {
    MEAL_TYPES.forEach(type => {
      const meal = day.meals?.[type];
      if (meal?.ingredients) {
        meal.ingredients.forEach(ing => {
          const clean = ing.replace(/^\*\s*/, '').trim();
          if (clean) all.add(clean);
        });
      }
    });
  });
  return [...all].sort();
}

// Group ingredients into rough categories
function categoriseIngredients(items) {
  const cats = {
    '🥩 Proteins': [],
    '🥦 Vegetables': [],
    '🌾 Grains & Carbs': [],
    '🥛 Dairy & Eggs': [],
    '🫙 Pantry & Spices': [],
    '🍋 Fresh & Other': [],
  };
  const keywords = {
    '🥩 Proteins': ['chicken','meat','fish','egg','tofu','paneer','lentil','dal','bean','chickpea','tuna','prawn','shrimp','pork','beef','lamb','mutton','sausage','bacon'],
    '🥦 Vegetables': ['onion','tomato','potato','carrot','spinach','capsicum','pepper','broccoli','cabbage','cauliflower','peas','corn','mushroom','zucchini','eggplant','garlic','ginger','cucumber','lettuce','celery','leek'],
    '🌾 Grains & Carbs': ['rice','pasta','bread','flour','noodle','oats','quinoa','roti','chapati','tortilla','couscous','bulgur','barley'],
    '🥛 Dairy & Eggs': ['milk','cream','yogurt','curd','cheese','butter','ghee','egg'],
    '🫙 Pantry & Spices': ['oil','salt','sugar','vinegar','soy','sauce','paste','cumin','coriander','turmeric','chili','pepper','masala','stock','broth','coconut milk','tahini','honey','mustard','ketchup','curry'],
  };
  items.forEach(item => {
    const lower = item.toLowerCase();
    let placed = false;
    for (const [cat, words] of Object.entries(keywords)) {
      if (words.some(w => lower.includes(w))) {
        cats[cat].push(item); placed = true; break;
      }
    }
    if (!placed) cats['🍋 Fresh & Other'].push(item);
  });
  return Object.entries(cats).filter(([, v]) => v.length > 0);
}

function buildGroceryText(plan) {
  const items = collectAllIngredients(plan);
  const cats = categoriseIngredients(items);
  const lines = ['🛒 *Jiff Weekly Grocery List*', ''];
  cats.forEach(([cat, items]) => {
    lines.push(`*${cat}*`);
    items.forEach(i => lines.push(`• ${i}`));
    lines.push('');
  });
  lines.push('_Generated by Jiff — jiff.app_');
  return lines.join('\n');
}

function buildWeekSummaryText(plan) {
  const lines = ['⚡ *My Jiff Weekly Meal Plan*', ''];
  plan.forEach(day => {
    lines.push(`*${day.day}*`);
    lines.push(`🌅 ${day.meals?.breakfast?.emoji} ${day.meals?.breakfast?.name}`);
    lines.push(`☀️ ${day.meals?.lunch?.emoji} ${day.meals?.lunch?.name}`);
    lines.push(`🌙 ${day.meals?.dinner?.emoji} ${day.meals?.dinner?.name}`);
    lines.push('');
  });
  lines.push('_Planned with Jiff — jiff.app_');
  return lines.join('\n');
}

// ── Grocery Panel ────────────────────────────────────
function GrocerySection({ plan }) {
  const items = collectAllIngredients(plan);
  const cats = categoriseIngredients(items);
  const [checked, setChecked] = useState({});
  const [copied, setCopied] = useState(false);
  const toggle = key => setChecked(p => ({ ...p, [key]: !p[key] }));
  const checkedCount = Object.values(checked).filter(Boolean).length;

  const handleCopy = async () => {
    const text = buildGroceryText(plan);
    try { await navigator.clipboard.writeText(text); } catch { const ta = document.createElement('textarea'); ta.value = text; document.body.appendChild(ta); ta.select(); document.execCommand('copy'); document.body.removeChild(ta); }
    setCopied(true); setTimeout(() => setCopied(false), 2500);
  };

  const waUrl = `https://wa.me/?text=${encodeURIComponent(buildGroceryText(plan))}`;

  return (
    <div className="grocery-panel">
      <div className="grocery-card">
        <div className="grocery-card-header">
          <div>
            <div className="grocery-card-title">🛒 Weekly grocery list</div>
            <div className="grocery-card-sub">{items.length} items across 21 meals · tap to tick off as you shop</div>
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button className={`plan-btn ${copied ? 'primary' : 'secondary'}`} style={{ background: copied ? '#1D9E75' : 'rgba(255,250,245,0.1)', color: 'white', border: copied ? 'none' : '1.5px solid rgba(255,250,245,0.2)' }} onClick={handleCopy}>
              {copied ? <IconCheck /> : <IconCopy />}{copied ? 'Copied!' : 'Copy list'}
            </button>
            <a className="plan-btn green" href={waUrl} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none' }}>
              <IconWA />WhatsApp
            </a>
          </div>
        </div>
        {checkedCount > 0 && (
          <div className="grocery-stats">
            <div className="grocery-stat"><span style={{ color: '#1D9E75', fontWeight: 500 }}>{checkedCount} ticked</span></div>
            <div className="grocery-stat">{items.length - checkedCount} remaining</div>
            <button onClick={() => setChecked({})} style={{ fontSize: 12, background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', marginLeft: 'auto', padding: '0 0 0 8px' }}>Clear all</button>
          </div>
        )}
        <div className="grocery-grid">
          {cats.map(([cat, catItems]) => (
            <div key={cat} className="grocery-category">
              <div className="grocery-cat-title">{cat}</div>
              {catItems.map((item, i) => {
                const key = `${cat}-${i}`;
                return (
                  <div key={key} className="grocery-item-row" onClick={() => toggle(key)}>
                    <div className={`g-checkbox ${checked[key] ? 'checked' : ''}`}>
                      <svg viewBox="0 0 12 12"><polyline points="10 2 5 9 2 6" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    </div>
                    <div className={`g-item-text ${checked[key] ? 'done' : ''}`}>{item}</div>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Meal slot component ───────────────────────────────
function MealSlot({ meal, type }) {
  const [open, setOpen] = useState(false);
  if (!meal) return null;
  return (
    <div className={`meal-slot ${type}`}>
      <div className="meal-slot-header" onClick={() => setOpen(p => !p)}>
        <div className="meal-type-label">{type}</div>
        <div className="meal-emoji">{meal.emoji}</div>
        <div className="meal-name-cell">{meal.name}</div>
        <div className="meal-time-cell">⏱ {meal.time} · 🔥 {meal.calories} cal</div>
        <div className="meal-expand-icon">{open ? '▲' : '▼'}</div>
      </div>
      {open && (
        <div className="meal-detail">
          <div className="meal-detail-desc">{meal.description}</div>
          <div className="detail-label">Ingredients</div>
          <ul className="ing-list-small">{meal.ingredients?.map((ing, i) => <li key={i}>{ing}</li>)}</ul>
          <div className="detail-label">Steps</div>
          <ol className="steps-list-small">{meal.steps?.map((s, i) => <li key={i}>{s}</li>)}</ol>
          <div className="nutrition-row">
            <div className="nutr-pill"><div className="nutr-val-sm">{meal.calories}</div><div className="nutr-lbl-sm">Cal</div></div>
            <div className="nutr-pill"><div className="nutr-val-sm">{meal.protein}</div><div className="nutr-lbl-sm">Protein</div></div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main component ────────────────────────────────────
export default function Planner() {
  const navigate = useNavigate();
  const [ingredients, setIngredients] = useState([]);
  const [inputVal, setInputVal] = useState('');
  const [diet, setDiet] = useState('none');
  const [cuisine, setCuisine] = useState('any');
  const [view, setView] = useState('input');
  const [plan, setPlan] = useState(null);
  const [loadingDay, setLoadingDay] = useState(0);
  const [activeDay, setActiveDay] = useState(0);
  const [showGrocery, setShowGrocery] = useState(false);
  const [copiedPlan, setCopiedPlan] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const inputRef = useRef(null);
  const timerRef = useRef(null);

  useEffect(() => {
    if (view === 'loading') {
      let d = 0;
      timerRef.current = setInterval(() => {
        d++;
        setLoadingDay(d);
        if (d >= 7) clearInterval(timerRef.current);
      }, 1000);
    }
    return () => clearInterval(timerRef.current);
  }, [view]);

  const addIng = val => {
    const v = val.trim().replace(/,$/,'');
    if (v && !ingredients.includes(v)) setIngredients(p => [...p, v]);
    setInputVal('');
  };
  const onKey = e => {
    if (e.key==='Enter'||e.key===','){e.preventDefault();addIng(inputVal);}
    else if(e.key==='Backspace'&&!inputVal&&ingredients.length) setIngredients(p=>p.slice(0,-1));
  };

  const handleSubmit = async () => {
    if (!ingredients.length) return;
    setView('loading'); setLoadingDay(0);
    try {
      const res = await fetch('/api/planner', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ingredients, diet, cuisine }),
      });
      const data = await res.json();
      if (data.plan?.length >= 7) {
        setPlan(data.plan); setShowGrocery(false); setActiveDay(0); setView('results');
      } else {
        setErrorMsg(data.error || 'Could not generate meal plan. Please try again.');
        setView('error');
      }
    } catch {
      setErrorMsg('Connection error. Please try again.');
      setView('error');
    }
  };

  const handleCopyPlan = async () => {
    const text = buildWeekSummaryText(plan);
    try { await navigator.clipboard.writeText(text); } catch { const ta = document.createElement('textarea'); ta.value = text; document.body.appendChild(ta); ta.select(); document.execCommand('copy'); document.body.removeChild(ta); }
    setCopiedPlan(true); setTimeout(() => setCopiedPlan(false), 2500);
  };

  const reset = () => { setView('input'); setPlan(null); setIngredients([]); setInputVal(''); setShowGrocery(false); };

  const waUrl = plan ? `https://wa.me/?text=${encodeURIComponent(buildWeekSummaryText(plan))}` : '#';

  return (
    <>
      <style>{styles}</style>
      <div className="app">
        <header className="header">
          <div className="logo" onClick={() => navigate('/')}>
            <span style={{ fontSize: 22 }}>⚡</span>
            <span className="logo-name"><span>J</span>iff</span>
          </div>
          <div className="nav-links">
            <button className="nav-link" onClick={() => navigate('/app')}>
              ⚡ <span>Quick meal</span>
            </button>
            <button className="nav-link active">
              📅 <span>Week planner</span>
            </button>
          </div>
        </header>

        {view === 'input' && (
          <>
            <div className="hero">
              <div className="hero-eyebrow">Plan once, eat well all week</div>
              <h1 className="hero-title">7 days.<br /><em>21 meals. Done.</em></h1>
              <p className="hero-sub">Tell us what you have. Jiff builds your full week — breakfast, lunch, and dinner — in one shot.</p>
            </div>
            <div className="card" style={{ marginTop: 28 }}>
              <div className="section">
                <div className="section-label">What's in your fridge & pantry?</div>
                <div className="ingredient-box" onClick={() => inputRef.current?.focus()}>
                  {ingredients.map(ing => (
                    <span key={ing} className="tag">{ing}
                      <button className="tag-remove" onClick={e => { e.stopPropagation(); setIngredients(p => p.filter(i => i !== ing)); }}>×</button>
                    </span>
                  ))}
                  <input ref={inputRef} className="tag-input" value={inputVal}
                    onChange={e => setInputVal(e.target.value)} onKeyDown={onKey}
                    onBlur={() => { if (inputVal.trim()) addIng(inputVal); }}
                    placeholder={ingredients.length === 0 ? 'eggs, onions, rice, tomatoes, chicken… press Enter after each' : 'add more…'} />
                </div>
                <p className="tag-hint">More ingredients = more variety. Add everything — pantry staples too.</p>
              </div>
              <div className="section">
                <div className="section-label">Cuisine style</div>
                <div className="cuisine-chips">
                  {CUISINE_OPTIONS.map(o => (
                    <button key={o.id} className={`cuisine-chip ${cuisine===o.id?(o.id==='any'?'active-any':'active'):''}`} onClick={() => setCuisine(o.id)}>
                      <span className="cuisine-flag">{o.flag}</span><span>{o.label}</span>
                    </button>
                  ))}
                </div>
              </div>
              <div className="section">
                <div className="section-label">Dietary preference</div>
                <div className="chips">
                  {DIET_OPTIONS.map(o => (
                    <button key={o.id} className={`chip diet ${diet===o.id?'active':''}`} onClick={() => setDiet(o.id)}>{o.label}</button>
                  ))}
                </div>
              </div>
              <div className="cta-wrap">
                <button className="cta-btn" onClick={handleSubmit} disabled={!ingredients.length}>
                  <span>📅</span>
                  <span>Plan my week</span>
                </button>
                {!ingredients.length && <p className="cta-note">Add at least one ingredient to get started</p>}
              </div>
            </div>
          </>
        )}

        {view === 'loading' && (
          <div className="loading-wrap">
            <div className="spinner" />
            <div className="loading-title">Planning your week…</div>
            <div className="loading-sub">Building 21 meals from your ingredients. This takes about 15 seconds.</div>
            <div className="loading-days">
              {LOADING_STEPS.map((day, i) => (
                <div key={day} className={`loading-day ${loadingDay > i ? 'done' : loadingDay === i ? 'active' : ''}`}>
                  {loadingDay > i ? '✓' : day.slice(0,3)}
                </div>
              ))}
            </div>
          </div>
        )}

        {view === 'results' && plan && (
          <>
            <div className="planner-wrap">
              <div className="planner-top">
                <div>
                  <div className="planner-title">⚡ Your week is planned.</div>
                  <div className="planner-sub">Tap any meal to see the full recipe · 21 meals from your ingredients</div>
                </div>
                <div className="planner-actions">
                  <button className={`plan-btn ${copiedPlan ? 'primary' : 'secondary'}`} style={copiedPlan ? { background: '#1D9E75', color: 'white', border: 'none' } : {}} onClick={handleCopyPlan}>
                    {copiedPlan ? <IconCheck /> : <IconCopy />}{copiedPlan ? 'Copied!' : 'Copy plan'}
                  </button>
                  <a className="plan-btn green" href={waUrl} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none' }}>
                    <IconWA />Share week
                  </a>
                  <button className="plan-btn secondary" onClick={() => setShowGrocery(p => !p)}>
                    <IconCart />{showGrocery ? 'Hide' : 'Grocery list'}
                  </button>
                  <button className="plan-btn secondary" onClick={handleSubmit}>
                    <IconRefresh />Regenerate
                  </button>
                </div>
              </div>

              <div className="meal-legend">
                <div className="legend-item"><div className="legend-dot breakfast" />Breakfast</div>
                <div className="legend-item"><div className="legend-dot lunch" />Lunch</div>
                <div className="legend-item"><div className="legend-dot dinner" />Dinner</div>
              </div>

              {/* Mobile day tabs */}
              <div className="day-tabs">
                {DAYS.map((day, i) => (
                  <button key={day} className={`day-tab ${activeDay === i ? 'active' : ''}`} onClick={() => setActiveDay(i)}>
                    {DAYS_SHORT[i]}
                  </button>
                ))}
              </div>

              {/* Calendar grid */}
              <div className="calendar">
                {plan.map((dayData, i) => (
                  <div key={dayData.day} className={`day-col ${i === activeDay ? 'visible' : ''}`}>
                    <div className="day-header">
                      <div className="day-name">{DAYS_SHORT[i]}</div>
                      <div className="day-short">{dayData.day}</div>
                    </div>
                    {MEAL_TYPES.map(type => (
                      <MealSlot key={type} meal={dayData.meals?.[type]} type={type} />
                    ))}
                  </div>
                ))}
              </div>
            </div>

            {showGrocery && <GrocerySection plan={plan} />}

            <div className="reset-wrap">
              <button className="reset-btn" onClick={reset}>← Start over with new ingredients</button>
            </div>
          </>
        )}

        {view === 'error' && (
          <div className="error-wrap">
            <div className="error-icon">😕</div>
            <div className="error-title">Something went wrong</div>
            <div className="error-msg">{errorMsg}</div>
            <button className="cta-btn" onClick={reset}>← Try again</button>
          </div>
        )}
      </div>
    </>
  );
}
