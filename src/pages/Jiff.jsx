import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,wght@0,700;0,900;1,700&family=DM+Sans:wght@300;400;500&display=swap');

  * { box-sizing: border-box; margin: 0; padding: 0; }
  :root {
    --jiff: #FF4500;
    --jiff-dark: #CC3700;
    --jiff-deep: #8C2500;
    --ink: #1C0A00;
    --cream: #FFFAF5;
    --warm: #FFF0E5;
    --gold: #FFB800;
    --muted: #7C6A5E;
    --border: rgba(28,10,0,0.10);
    --border-mid: rgba(28,10,0,0.18);
    --shadow: 0 4px 28px rgba(28,10,0,0.08);
    --whatsapp: #25D366;
    --whatsapp-dark: #1DA851;
    --need-bg: #FEF3E2; --need-text: #92400E;
    --have-bg: #ECFDF5; --have-text: #065F46;
  }
  body { background: var(--cream); font-family: 'DM Sans', sans-serif; color: var(--ink); }

  .app {
    min-height: 100vh; background: var(--cream);
    background-image:
      radial-gradient(ellipse at 15% 0%, rgba(255,69,0,0.06) 0%, transparent 40%),
      radial-gradient(ellipse at 85% 90%, rgba(255,184,0,0.05) 0%, transparent 40%);
  }

  /* Header */
  .header {
    display: flex; align-items: center; justify-content: space-between;
    padding: 18px 36px; border-bottom: 1px solid var(--border);
    position: sticky; top: 0; z-index: 10;
    background: rgba(255,250,245,0.93); backdrop-filter: blur(12px);
  }
  .logo { display: flex; align-items: center; gap: 8px; cursor: pointer; text-decoration: none; }
  .logo-mark { font-size: 22px; line-height: 1; }
  .logo-name { font-family: 'Fraunces', serif; font-size: 22px; font-weight: 900; color: var(--ink); letter-spacing: -0.5px; }
  .logo-name span { color: var(--jiff); }
  .header-tag { font-size: 10px; background: var(--jiff); color: white; padding: 3px 10px; border-radius: 20px; letter-spacing: 1px; text-transform: uppercase; font-weight: 500; }

  /* Hero */
  .hero { max-width: 760px; margin: 0 auto; padding: 52px 24px 0; text-align: center; }
  .hero-eyebrow { font-size: 11px; letter-spacing: 2.5px; text-transform: uppercase; color: var(--jiff); font-weight: 500; margin-bottom: 14px; }
  .hero-title {
    font-family: 'Fraunces', serif;
    font-size: clamp(34px, 6vw, 58px);
    font-weight: 900; line-height: 1.05; color: var(--ink);
    margin-bottom: 14px; letter-spacing: -2px;
  }
  .hero-title em { font-style: italic; color: var(--jiff); }
  .hero-sub { font-size: 15px; color: var(--muted); line-height: 1.7; max-width: 420px; margin: 0 auto 40px; font-weight: 300; }

  /* Input card */
  .card { background: white; border: 1px solid var(--border); border-radius: 22px; padding: 32px; box-shadow: var(--shadow); max-width: 720px; margin: 0 auto; }
  .section { margin-bottom: 26px; }
  .section-label { font-size: 11px; letter-spacing: 2px; text-transform: uppercase; color: var(--jiff); font-weight: 500; margin-bottom: 11px; display: flex; align-items: center; gap: 8px; }
  .section-label::after { content: ''; flex: 1; height: 1px; background: var(--border); }

  /* Ingredient input */
  .ingredient-box { border: 1.5px solid var(--border-mid); border-radius: 12px; padding: 12px 14px; background: var(--cream); min-height: 88px; cursor: text; display: flex; flex-wrap: wrap; gap: 7px; align-items: flex-start; transition: border-color 0.2s; }
  .ingredient-box:focus-within { border-color: var(--jiff); box-shadow: 0 0 0 3px rgba(255,69,0,0.1); }
  .tag { background: var(--ink); color: white; padding: 5px 12px 5px 13px; border-radius: 20px; font-size: 13px; display: flex; align-items: center; gap: 6px; animation: tagIn 0.2s ease; white-space: nowrap; }
  @keyframes tagIn { from { transform: scale(0.8); opacity: 0; } to { transform: scale(1); opacity: 1; } }
  .tag-remove { background: none; border: none; color: rgba(255,255,255,0.6); cursor: pointer; font-size: 16px; padding: 0; line-height: 1; transition: color 0.15s; display: flex; align-items: center; }
  .tag-remove:hover { color: white; }
  .tag-input { border: none; outline: none; font-family: 'DM Sans', sans-serif; font-size: 14px; color: var(--ink); flex: 1; min-width: 140px; background: transparent; padding: 4px 0; }
  .tag-input::placeholder { color: var(--muted); }
  .tag-hint { font-size: 11.5px; color: var(--muted); margin-top: 7px; font-weight: 300; }

  /* Cuisine chips */
  .cuisine-chips { display: flex; flex-wrap: wrap; gap: 7px; }
  .cuisine-chip { border: 1.5px solid var(--border-mid); border-radius: 10px; padding: 7px 14px; font-size: 13px; cursor: pointer; transition: all 0.18s; font-family: 'DM Sans', sans-serif; background: white; color: var(--muted); display: flex; align-items: center; gap: 6px; }
  .cuisine-chip:hover { border-color: var(--jiff); color: var(--ink); transform: translateY(-1px); }
  .cuisine-chip.active { background: var(--jiff); border-color: var(--jiff); color: white; font-weight: 500; transform: translateY(-1px); box-shadow: 0 3px 12px rgba(255,69,0,0.25); }
  .cuisine-chip.active-any { background: var(--ink); border-color: var(--ink); color: white; font-weight: 500; }
  .cuisine-flag { font-size: 16px; line-height: 1; }

  /* Chips */
  .chips { display: flex; flex-wrap: wrap; gap: 7px; }
  .chip { border: 1.5px solid var(--border-mid); border-radius: 10px; padding: 7px 15px; font-size: 13px; cursor: pointer; transition: all 0.18s; font-family: 'DM Sans', sans-serif; background: white; color: var(--muted); }
  .chip:hover { border-color: var(--jiff); color: var(--ink); }
  .chip.active { background: var(--ink); border-color: var(--ink); color: white; font-weight: 500; }
  .chip.diet.active { background: var(--jiff); border-color: var(--jiff); }

  /* CTA */
  .cta-wrap { text-align: center; padding-top: 4px; }
  .cta-btn { background: var(--jiff); color: white; border: none; border-radius: 14px; padding: 17px 44px; font-size: 16px; font-family: 'DM Sans', sans-serif; font-weight: 500; cursor: pointer; transition: all 0.2s; display: inline-flex; align-items: center; gap: 10px; letter-spacing: 0.2px; }
  .cta-btn:hover:not(:disabled) { background: var(--jiff-dark); transform: translateY(-2px); box-shadow: 0 8px 28px rgba(255,69,0,0.35); }
  .cta-btn:disabled { opacity: 0.55; cursor: not-allowed; }
  .cta-note { font-size: 12px; color: var(--muted); margin-top: 10px; }

  /* Loading */
  .loading-wrap { text-align: center; padding: 72px 24px; max-width: 480px; margin: 0 auto; }
  .spinner { width: 44px; height: 44px; border: 3px solid var(--border-mid); border-top-color: var(--jiff); border-radius: 50%; animation: spin 0.7s linear infinite; margin: 0 auto 24px; }
  @keyframes spin { to { transform: rotate(360deg); } }
  .loading-title { font-family: 'Fraunces', serif; font-size: 24px; font-weight: 700; color: var(--ink); margin-bottom: 8px; letter-spacing: -0.5px; }
  .loading-sub { font-size: 14px; color: var(--muted); font-weight: 300; margin-bottom: 28px; }
  .loading-fact { font-size: 13px; color: var(--muted); padding: 12px 0; border-top: 1px solid var(--border); animation: fadeIn 0.4s ease; }
  @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }

  /* Results */
  .results-header { max-width: 780px; margin: 44px auto 0; padding: 0 24px; }
  .results-title { font-family: 'Fraunces', serif; font-size: 28px; font-weight: 900; color: var(--ink); margin-bottom: 5px; letter-spacing: -0.5px; }
  .results-sub { font-size: 14px; color: var(--muted); font-weight: 300; }
  .result-filters { max-width: 780px; margin: 10px auto 0; padding: 0 24px; display: flex; flex-wrap: wrap; gap: 7px; }
  .filter-pill { background: white; border: 1px solid var(--border-mid); border-radius: 20px; padding: 4px 12px; font-size: 12px; color: var(--muted); }

  /* Meal cards */
  .meals-grid { max-width: 780px; margin: 22px auto; padding: 0 24px 60px; display: grid; grid-template-columns: repeat(auto-fill, minmax(330px, 1fr)); gap: 16px; }
  .meal-card { background: white; border: 1px solid var(--border); border-radius: 20px; overflow: hidden; box-shadow: var(--shadow); animation: slideUp 0.35s ease both; transition: transform 0.2s, box-shadow 0.2s; }
  .meal-card:not(.expanded) { cursor: pointer; }
  .meal-card:not(.expanded):hover { transform: translateY(-4px); box-shadow: 0 14px 36px rgba(28,10,0,0.12); }
  .meal-card:nth-child(2) { animation-delay: 0.07s; }
  .meal-card:nth-child(3) { animation-delay: 0.14s; }
  @keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }

  .meal-hdr { padding: 20px 20px 12px; }
  .meal-hdr-top { display: flex; align-items: center; justify-content: space-between; gap: 8px; margin-bottom: 8px; }
  .meal-num { font-size: 10px; letter-spacing: 2px; text-transform: uppercase; color: var(--jiff); font-weight: 600; }
  .meal-name { font-family: 'Fraunces', serif; font-size: 20px; font-weight: 700; color: var(--ink); margin-bottom: 9px; line-height: 1.2; letter-spacing: -0.3px; }
  .meal-meta { display: flex; gap: 12px; flex-wrap: wrap; }
  .meal-meta-item { font-size: 12px; color: var(--muted); }
  .meal-desc { padding: 0 20px 14px; font-size: 13.5px; color: var(--muted); line-height: 1.6; font-weight: 300; }

  /* Share button */
  .share-btn { background: none; border: 1.5px solid var(--border-mid); border-radius: 8px; padding: 5px 10px; font-size: 12px; font-family: 'DM Sans', sans-serif; color: var(--muted); cursor: pointer; display: flex; align-items: center; gap: 5px; transition: all 0.18s; flex-shrink: 0; }
  .share-btn:hover { border-color: var(--jiff); color: var(--jiff); }
  .share-btn svg { width: 13px; height: 13px; }
  .share-drawer { border-top: 1px solid var(--border); padding: 12px 20px 16px; animation: drawerIn 0.2s ease; background: var(--cream); }
  @keyframes drawerIn { from { opacity: 0; transform: translateY(5px); } to { opacity: 1; transform: translateY(0); } }
  .share-drawer-label { font-size: 10px; letter-spacing: 2px; text-transform: uppercase; color: var(--muted); font-weight: 500; margin-bottom: 10px; }
  .share-actions { display: flex; gap: 8px; flex-wrap: wrap; }
  .share-wa { display: flex; align-items: center; gap: 7px; background: var(--whatsapp); color: white; border: none; border-radius: 9px; padding: 9px 16px; font-size: 13px; font-family: 'DM Sans', sans-serif; font-weight: 500; cursor: pointer; transition: all 0.18s; text-decoration: none; flex: 1; }
  .share-wa:hover { background: var(--whatsapp-dark); transform: translateY(-1px); }
  .share-wa svg { width: 15px; height: 15px; flex-shrink: 0; }
  .share-copy { display: flex; align-items: center; gap: 7px; background: white; color: var(--ink); border: 1.5px solid var(--border-mid); border-radius: 9px; padding: 9px 16px; font-size: 13px; font-family: 'DM Sans', sans-serif; font-weight: 500; cursor: pointer; transition: all 0.18s; flex: 1; }
  .share-copy:hover { border-color: var(--ink); }
  .share-copy.copied { border-color: var(--jiff); color: var(--jiff); }
  .share-copy svg { width: 14px; height: 14px; flex-shrink: 0; }
  .share-native { display: flex; align-items: center; gap: 7px; background: var(--warm); color: var(--ink); border: 1.5px solid var(--border); border-radius: 9px; padding: 9px 16px; font-size: 13px; font-family: 'DM Sans', sans-serif; font-weight: 500; cursor: pointer; transition: all 0.18s; flex: 1; }
  .share-native svg { width: 14px; height: 14px; flex-shrink: 0; }

  /* Grocery */
  .grocery-trigger { margin: 0 20px 16px; width: calc(100% - 40px); background: none; border: 1.5px dashed rgba(255,69,0,0.3); border-radius: 10px; padding: 10px 14px; font-size: 13px; font-family: 'DM Sans', sans-serif; cursor: pointer; color: var(--jiff); font-weight: 500; display: flex; align-items: center; justify-content: space-between; transition: all 0.18s; }
  .grocery-trigger:hover { background: rgba(255,69,0,0.04); border-color: var(--jiff); }
  .grocery-trigger svg { width: 14px; height: 14px; }
  .grocery-panel { margin: 0 20px 16px; border: 1px solid var(--border); border-radius: 14px; overflow: hidden; animation: drawerIn 0.2s ease; }
  .grocery-header { background: var(--ink); padding: 12px 14px; display: flex; align-items: center; justify-content: space-between; }
  .grocery-header-left { display: flex; align-items: center; gap: 8px; }
  .grocery-header-title { font-size: 13px; font-weight: 500; color: white; }
  .grocery-header-sub { font-size: 11px; color: rgba(255,255,255,0.55); margin-top: 1px; }
  .grocery-close { background: none; border: none; color: rgba(255,255,255,0.6); cursor: pointer; font-size: 18px; padding: 0; line-height: 1; transition: color 0.15s; }
  .grocery-close:hover { color: white; }
  .grocery-section { padding: 12px 14px; }
  .grocery-section + .grocery-section { border-top: 1px solid var(--border); }
  .grocery-section-title { font-size: 10px; letter-spacing: 2px; text-transform: uppercase; font-weight: 500; margin-bottom: 9px; display: flex; align-items: center; gap: 6px; }
  .grocery-section-title.need { color: #92400E; }
  .grocery-section-title.have { color: #065F46; }
  .grocery-count { font-size: 10px; font-weight: 500; padding: 2px 7px; border-radius: 20px; margin-left: auto; }
  .grocery-count.need { background: var(--need-bg); color: var(--need-text); }
  .grocery-count.have { background: var(--have-bg); color: var(--have-text); }
  .grocery-items { display: flex; flex-direction: column; gap: 5px; }
  .grocery-item { display: flex; align-items: flex-start; gap: 9px; padding: 7px 9px; border-radius: 8px; font-size: 13px; line-height: 1.4; font-weight: 300; cursor: pointer; }
  .grocery-item.need { background: var(--need-bg); color: var(--need-text); }
  .grocery-item.have { background: var(--have-bg); color: var(--have-text); cursor: default; }
  .grocery-dot { width: 7px; height: 7px; border-radius: 50%; flex-shrink: 0; margin-top: 4px; }
  .grocery-item.need .grocery-dot { background: #F59E0B; }
  .grocery-item.have .grocery-dot { background: #10B981; }
  .grocery-checkbox { width: 15px; height: 15px; border-radius: 4px; border: 1.5px solid currentColor; flex-shrink: 0; margin-top: 1px; display: flex; align-items: center; justify-content: center; transition: all 0.15s; }
  .grocery-checkbox.checked { background: currentColor; }
  .grocery-checkbox.checked svg { display: block; }
  .grocery-checkbox svg { display: none; width: 9px; height: 9px; stroke: white; stroke-width: 2.5; }
  .grocery-item-text { flex: 1; }
  .grocery-item-text.checked-text { text-decoration: line-through; opacity: 0.5; }
  .grocery-empty { font-size: 13px; color: var(--muted); text-align: center; padding: 4px 0; }
  .grocery-actions { padding: 10px 14px; border-top: 1px solid var(--border); display: flex; gap: 8px; background: var(--cream); }
  .grocery-action-btn { flex: 1; padding: 8px 10px; font-size: 12px; font-family: 'DM Sans', sans-serif; font-weight: 500; border-radius: 8px; cursor: pointer; transition: all 0.18s; display: flex; align-items: center; justify-content: center; gap: 5px; }
  .grocery-action-btn.copy { background: white; color: var(--ink); border: 1px solid var(--border-mid); }
  .grocery-action-btn.copy:hover { border-color: var(--ink); }
  .grocery-action-btn.copy.copied { color: var(--jiff); border-color: var(--jiff); }
  .grocery-action-btn.wa { background: var(--whatsapp); color: white; border: none; text-decoration: none; }
  .grocery-action-btn.wa:hover { background: var(--whatsapp-dark); }
  .grocery-action-btn svg { width: 13px; height: 13px; flex-shrink: 0; }

  /* Recipe */
  .expand-btn { margin: 0 20px 16px; background: var(--warm); border: 1px solid var(--border); border-radius: 10px; padding: 10px 14px; font-size: 13px; font-family: 'DM Sans', sans-serif; cursor: pointer; color: var(--ink); font-weight: 500; width: calc(100% - 40px); text-align: left; display: flex; justify-content: space-between; align-items: center; transition: all 0.18s; }
  .expand-btn:hover { background: var(--jiff); color: white; border-color: var(--jiff); }
  .recipe { padding: 0 20px 20px; border-top: 1px solid var(--border); }
  .recipe-sec { font-size: 10px; letter-spacing: 2px; text-transform: uppercase; color: var(--jiff); font-weight: 600; margin: 16px 0 9px; }
  .ing-list { list-style: none; }
  .ing-list li { font-size: 13px; color: var(--ink); padding: 5px 0; border-bottom: 1px solid rgba(0,0,0,0.04); display: flex; align-items: center; gap: 8px; font-weight: 300; }
  .ing-list li::before { content: '·'; color: var(--jiff); font-size: 20px; line-height: 0; flex-shrink: 0; }
  .steps-list { counter-reset: step; list-style: none; }
  .steps-list li { font-size: 13px; color: var(--ink); padding: 7px 0 7px 28px; border-bottom: 1px solid rgba(0,0,0,0.04); position: relative; line-height: 1.6; font-weight: 300; counter-increment: step; }
  .steps-list li::before { content: counter(step); position: absolute; left: 0; top: 9px; width: 18px; height: 18px; background: var(--jiff); color: white; font-size: 10px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 600; }
  .nutr-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 7px; }
  .nutr-item { background: var(--warm); border-radius: 9px; padding: 9px; text-align: center; }
  .nutr-val { font-family: 'Fraunces', serif; font-size: 16px; font-weight: 700; color: var(--ink); }
  .nutr-lbl { font-size: 10px; color: var(--muted); margin-top: 2px; text-transform: uppercase; letter-spacing: 1px; }
  .collapse-btn { margin-top: 12px; width: 100%; background: var(--warm); border: 1px solid var(--border); border-radius: 9px; padding: 8px 14px; font-size: 13px; font-family: 'DM Sans', sans-serif; cursor: pointer; color: var(--muted); display: flex; justify-content: space-between; transition: all 0.18s; }
  .collapse-btn:hover { color: var(--jiff); border-color: rgba(255,69,0,0.3); }

  /* Reset */
  .reset-wrap { text-align: center; padding: 0 24px 60px; }
  .reset-btn { background: none; border: 1.5px solid var(--border-mid); border-radius: 10px; padding: 11px 28px; font-size: 14px; font-family: 'DM Sans', sans-serif; cursor: pointer; color: var(--muted); transition: all 0.18s; }
  .reset-btn:hover { border-color: var(--jiff); color: var(--jiff); }

  /* Error */
  .error-wrap { text-align: center; padding: 64px 24px; max-width: 460px; margin: 0 auto; }
  .error-icon { font-size: 40px; margin-bottom: 14px; }
  .error-title { font-family: 'Fraunces', serif; font-size: 22px; font-weight: 700; color: var(--ink); margin-bottom: 8px; }
  .error-msg { font-size: 14px; color: var(--muted); margin-bottom: 24px; font-weight: 300; }

  @media (max-width: 600px) {
    .header { padding: 16px 18px; }
    .hero { padding: 36px 18px 0; }
    .card { padding: 22px 16px; border-radius: 18px; }
    .meals-grid { grid-template-columns: 1fr; padding: 0 16px 48px; }
    .nutr-grid { grid-template-columns: repeat(2, 1fr); }
    .share-actions { flex-direction: column; }
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
const CUISINE_OPTIONS = [
  { id: 'any', label: 'Any cuisine', flag: '🌍' },
  { id: 'Indian', label: 'Indian', flag: '🇮🇳' },
  { id: 'Italian', label: 'Italian', flag: '🇮🇹' },
  { id: 'Chinese', label: 'Chinese', flag: '🇨🇳' },
  { id: 'Mexican', label: 'Mexican', flag: '🇲🇽' },
  { id: 'Mediterranean', label: 'Mediterranean', flag: '🫒' },
  { id: 'Thai', label: 'Thai', flag: '🇹🇭' },
];
const FACTS = [
  'Raiding your fridge…',
  'Cross-referencing 10,000+ recipes…',
  'Matching cuisine and flavour profile…',
  'Crunching nutrition numbers…',
  'Almost ready to Jiff…',
];

function extractCoreName(str) {
  return str.toLowerCase()
    .replace(/^\*?\s*/,'').replace(/[\d¼½¾⅓⅔⅛]+[\s\-]*/g,'')
    .replace(/\b(g|kg|ml|l|oz|lb|tbsp|tsp|cup|cups|cloves?|piece|pieces|slice|slices|medium|large|small|fresh|dried|minced|chopped|diced|sliced|grated|handful|pinch|bunch|can|cans|tin|tins|pack|packet|to taste|of)\b/gi,'')
    .replace(/[,()]/g,'').trim().split(/\s+/).filter(Boolean).join(' ');
}
function isAvailable(core, fridge) {
  const r = core.toLowerCase();
  return fridge.some(f => { const fr = f.toLowerCase().trim(); return r.includes(fr) || fr.includes(r) || fr.split(' ').some(w => w.length > 2 && r.includes(w)); });
}
function buildGroceryList(recipeIngs, fridgeIngs) {
  const need = [], have = [];
  recipeIngs.forEach(ing => {
    const core = extractCoreName(ing);
    if (!core) return;
    (isAvailable(core, fridgeIngs) ? have : need).push(ing.replace(/^\*\s*/,''));
  });
  return { need, have };
}
function buildShareText(meal) {
  return [`⚡ *Jiff Recipe*`,``,`${meal.emoji} *${meal.name}*`,`⏱ ${meal.time}  |  👥 ${meal.servings} servings  |  📊 ${meal.difficulty}`,``,meal.description,``,`*Ingredients:*`,meal.ingredients?.slice(0,6).join(', ')||'',``,`*Method:*`,meal.steps?.slice(0,3).map((s,i)=>`${i+1}. ${s}`).join('\n')||'',``,`🔥 ${meal.calories} cal  |  💪 ${meal.protein} protein`,``,`_Jiffed by Jiff — jiff.app_`].join('\n');
}
function buildGroceryText(name, need) {
  return [`🛒 *Shopping list for ${name}*`,``,need.map(i=>`• ${i}`).join('\n'),``,`_From Jiff — jiff.app_`].join('\n');
}

const IconShare = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>;
const IconCopy = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>;
const IconCheck = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>;
const IconCart = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 001.98 1.61H19a2 2 0 001.98-1.71L23 6H6"/></svg>;
const IconWA = () => <svg viewBox="0 0 32 32" fill="currentColor"><path d="M16 0C7.164 0 0 7.163 0 16c0 2.82.736 5.469 2.027 7.77L0 32l8.469-2.004A15.938 15.938 0 0016 32c8.836 0 16-7.164 16-16S24.836 0 16 0zm0 29.333a13.27 13.27 0 01-6.771-1.852l-.485-.288-5.027 1.189 1.213-4.899-.315-.503A13.257 13.257 0 012.667 16C2.667 8.636 8.636 2.667 16 2.667S29.333 8.636 29.333 16 23.364 29.333 16 29.333zm7.27-9.878c-.397-.198-2.35-1.16-2.714-1.291-.363-.132-.627-.198-.89.198-.264.397-1.023 1.291-1.253 1.556-.231.264-.462.297-.858.099-.397-.198-1.675-.617-3.19-1.97-1.18-1.052-1.977-2.35-2.208-2.747-.231-.397-.025-.611.173-.809.178-.178.397-.462.595-.693.198-.231.264-.397.397-.661.132-.265.066-.496-.033-.694-.099-.198-.89-2.148-1.22-2.942-.32-.772-.647-.667-.89-.68-.23-.012-.496-.015-.76-.015-.264 0-.694.099-1.057.496-.363.397-1.386 1.354-1.386 3.303 0 1.95 1.419 3.834 1.617 4.099.198.264 2.793 4.266 6.766 5.982.946.408 1.684.652 2.26.834.95.302 1.814.26 2.497.158.761-.114 2.35-.961 2.68-1.889.332-.927.332-1.722.232-1.889-.099-.165-.363-.264-.76-.462z"/></svg>;

function GroceryPanel({ meal, fridgeIngredients, onClose }) {
  const { need, have } = buildGroceryList(meal.ingredients || [], fridgeIngredients);
  const [checked, setChecked] = useState({});
  const [copied, setCopied] = useState(false);
  const toggle = k => setChecked(p => ({ ...p, [k]: !p[k] }));
  const handleCopy = async e => {
    e.stopPropagation();
    const text = need.length > 0 ? buildGroceryText(meal.name, need) : `Nothing to buy for ${meal.name} — you have everything!`;
    try { await navigator.clipboard.writeText(text); } catch { const ta = document.createElement('textarea'); ta.value = text; document.body.appendChild(ta); ta.select(); document.execCommand('copy'); document.body.removeChild(ta); }
    setCopied(true); setTimeout(() => setCopied(false), 2500);
  };
  const waUrl = `https://wa.me/?text=${encodeURIComponent(need.length > 0 ? buildGroceryText(meal.name, need) : `I have everything for ${meal.name}! 🎉`)}`;
  return (
    <div className="grocery-panel" onClick={e => e.stopPropagation()}>
      <div className="grocery-header">
        <div className="grocery-header-left">
          <span style={{ fontSize: 15 }}>🛒</span>
          <div>
            <div className="grocery-header-title">Grocery list</div>
            <div className="grocery-header-sub">{need.length === 0 ? 'You have everything!' : `${need.length} to buy · ${have.length} in fridge`}</div>
          </div>
        </div>
        <button className="grocery-close" onClick={e => { e.stopPropagation(); onClose(); }}>×</button>
      </div>
      <div className="grocery-section">
        <div className="grocery-section-title need"><span>Need to buy</span><span className="grocery-count need">{need.length}</span></div>
        {need.length === 0 ? <div className="grocery-empty">🎉 Nothing — you have it all!</div> : (
          <div className="grocery-items">
            {need.map((ing, i) => (
              <div key={i} className="grocery-item need" onClick={() => toggle(`n-${i}`)}>
                <div className={`grocery-checkbox ${checked[`n-${i}`] ? 'checked' : ''}`}><svg viewBox="0 0 12 12"><polyline points="10 2 5 9 2 6" strokeLinecap="round" strokeLinejoin="round"/></svg></div>
                <div className={`grocery-item-text ${checked[`n-${i}`] ? 'checked-text' : ''}`}>{ing}</div>
              </div>
            ))}
          </div>
        )}
      </div>
      {have.length > 0 && (
        <div className="grocery-section">
          <div className="grocery-section-title have"><span>Already in your fridge</span><span className="grocery-count have">{have.length}</span></div>
          <div className="grocery-items">
            {have.map((ing, i) => <div key={i} className="grocery-item have"><div className="grocery-dot"/><div className="grocery-item-text">{ing}</div></div>)}
          </div>
        </div>
      )}
      <div className="grocery-actions">
        <button className={`grocery-action-btn copy ${copied ? 'copied' : ''}`} onClick={handleCopy}>{copied ? <IconCheck /> : <IconCopy />}{copied ? 'Copied!' : 'Copy list'}</button>
        <a className="grocery-action-btn wa" href={waUrl} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()}><IconWA />WhatsApp</a>
      </div>
    </div>
  );
}

function ShareDrawer({ meal }) {
  const [copied, setCopied] = useState(false);
  const text = buildShareText(meal);
  const waUrl = `https://wa.me/?text=${encodeURIComponent(text)}`;
  const hasNative = typeof navigator !== 'undefined' && !!navigator.share;
  const handleCopy = async e => {
    e.stopPropagation();
    try { await navigator.clipboard.writeText(text); } catch { const ta = document.createElement('textarea'); ta.value = text; document.body.appendChild(ta); ta.select(); document.execCommand('copy'); document.body.removeChild(ta); }
    setCopied(true); setTimeout(() => setCopied(false), 2500);
  };
  return (
    <div className="share-drawer" onClick={e => e.stopPropagation()}>
      <div className="share-drawer-label">Share this recipe</div>
      <div className="share-actions">
        <a className="share-wa" href={waUrl} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()}><IconWA />WhatsApp</a>
        <button className={`share-copy ${copied ? 'copied' : ''}`} onClick={handleCopy}>{copied ? <IconCheck /> : <IconCopy />}{copied ? 'Copied!' : 'Copy text'}</button>
        {hasNative && <button className="share-native" onClick={async e => { e.stopPropagation(); try { await navigator.share({ title: `${meal.emoji} ${meal.name}`, text }); } catch {} }}><IconShare />More</button>}
      </div>
    </div>
  );
}

export default function Jiff() {
  const navigate = useNavigate();
  const [ingredients, setIngredients] = useState([]);
  const [inputVal, setInputVal] = useState('');
  const [time, setTime] = useState('30 min');
  const [diet, setDiet] = useState('none');
  const [cuisine, setCuisine] = useState('any');
  const [view, setView] = useState('input');
  const [meals, setMeals] = useState([]);
  const [expanded, setExpanded] = useState({});
  const [shareOpen, setShareOpen] = useState({});
  const [groceryOpen, setGroceryOpen] = useState({});
  const [factIdx, setFactIdx] = useState(0);
  const [errorMsg, setErrorMsg] = useState('');
  const inputRef = useRef(null);
  const timerRef = useRef(null);

  useEffect(() => {
    if (view === 'loading') timerRef.current = setInterval(() => setFactIdx(f => (f + 1) % FACTS.length), 1400);
    return () => clearInterval(timerRef.current);
  }, [view]);

  const addIng = val => { const v = val.trim().replace(/,$/,''); if (v && !ingredients.includes(v)) setIngredients(p => [...p, v]); setInputVal(''); };
  const onKey = e => { if (e.key==='Enter'||e.key===','){e.preventDefault();addIng(inputVal);} else if(e.key==='Backspace'&&!inputVal&&ingredients.length) setIngredients(p=>p.slice(0,-1)); };

  const handleSubmit = async () => {
    if (!ingredients.length) return;
    setView('loading'); setFactIdx(0);
    try {
      const res = await fetch('/api/suggest', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ingredients, time, diet, cuisine }) });
      const data = await res.json();
      if (data.meals?.length > 0) { setMeals(data.meals); setExpanded({}); setShareOpen({}); setGroceryOpen({}); setView('results'); }
      else { setErrorMsg(data.error || 'Could not generate suggestions. Please try again.'); setView('error'); }
    } catch { setErrorMsg('Connection error. Please try again.'); setView('error'); }
  };

  const reset = () => { setView('input'); setMeals([]); setIngredients([]); setInputVal(''); setShareOpen({}); setGroceryOpen({}); };
  const activeCuisine = CUISINE_OPTIONS.find(c => c.id === cuisine);

  return (
    <>
      <style>{styles}</style>
      <div className="app">
        <header className="header">
          <div className="logo" onClick={() => navigate('/')}>
            <span className="logo-mark">⚡</span>
            <span className="logo-name">Jiff</span>
          </div>
          <div className="header-tag">AI-Powered</div>
        </header>

        {view === 'input' && (
          <>
            <div className="hero">
              <div className="hero-eyebrow">Open fridge → get dinner → done</div>
              <h1 className="hero-title">What can I make <em>right now?</em></h1>
              <p className="hero-sub">Type what's in your fridge. Pick a cuisine. Get 3 real meals with full recipes — in a jiff.</p>
            </div>
            <div className="card" style={{ marginTop: 28 }}>
              <div className="section">
                <div className="section-label">What's in your fridge?</div>
                <div className="ingredient-box" onClick={() => inputRef.current?.focus()}>
                  {ingredients.map(ing => (
                    <span key={ing} className="tag">{ing}<button className="tag-remove" onClick={e => { e.stopPropagation(); setIngredients(p => p.filter(i => i !== ing)); }}>×</button></span>
                  ))}
                  <input ref={inputRef} className="tag-input" value={inputVal} onChange={e => setInputVal(e.target.value)} onKeyDown={onKey} onBlur={() => { if (inputVal.trim()) addIng(inputVal); }} placeholder={ingredients.length === 0 ? 'eggs, onions, rice, tomatoes… press Enter after each' : 'add more…'} />
                </div>
                <p className="tag-hint">Enter or comma to add · Backspace to remove last</p>
              </div>
              <div className="section">
                <div className="section-label">Cuisine</div>
                <div className="cuisine-chips">
                  {CUISINE_OPTIONS.map(o => (
                    <button key={o.id} className={`cuisine-chip ${cuisine===o.id?(o.id==='any'?'active-any':'active'):''}`} onClick={() => setCuisine(o.id)}>
                      <span className="cuisine-flag">{o.flag}</span><span>{o.label}</span>
                    </button>
                  ))}
                </div>
              </div>
              <div className="section">
                <div className="section-label">Time available</div>
                <div className="chips">{TIME_OPTIONS.map(o => <button key={o.id} className={`chip ${time===o.id?'active':''}`} onClick={() => setTime(o.id)}>{o.label}</button>)}</div>
              </div>
              <div className="section">
                <div className="section-label">Dietary preference</div>
                <div className="chips">{DIET_OPTIONS.map(o => <button key={o.id} className={`chip diet ${diet===o.id?'active':''}`} onClick={() => setDiet(o.id)}>{o.label}</button>)}</div>
              </div>
              <div className="cta-wrap">
                <button className="cta-btn" onClick={handleSubmit} disabled={!ingredients.length}>
                  <span>⚡</span><span>{cuisine==='any'?'Jiff my dinner!':`Jiff me ${cuisine} meals`}</span>
                </button>
                {!ingredients.length && <p className="cta-note">Add at least one ingredient to get started</p>}
              </div>
            </div>
          </>
        )}

        {view === 'loading' && (
          <div className="loading-wrap">
            <div className="spinner" />
            <div className="loading-title">{cuisine !== 'any' ? `Finding ${cuisine} recipes…` : 'Jiffing your dinner…'}</div>
            <div className="loading-sub">Matching {ingredients.length} ingredient{ingredients.length > 1 ? 's' : ''}{cuisine !== 'any' ? ` to ${cuisine} cuisine` : ' to the best meals'}</div>
            <div className="loading-fact">{FACTS[factIdx]}</div>
          </div>
        )}

        {view === 'results' && (
          <>
            <div className="results-header">
              <div className="results-title">Jiffed. ⚡ Here's your menu.</div>
              <div className="results-sub">3 meals from what you already have — tap any card for the full recipe.</div>
            </div>
            <div className="result-filters">
              {cuisine !== 'any' && <span className="filter-pill">{activeCuisine?.flag} {cuisine}</span>}
              <span className="filter-pill">⏱ {time}</span>
              {diet !== 'none' && <span className="filter-pill">🥗 {diet}</span>}
              <span className="filter-pill">🥦 {ingredients.length} ingredient{ingredients.length > 1 ? 's' : ''}</span>
            </div>
            <div className="meals-grid">
              {meals.map((meal, i) => (
                <div key={i} className={`meal-card ${expanded[i] ? 'expanded' : ''}`} onClick={() => !expanded[i] && !shareOpen[i] && !groceryOpen[i] && setExpanded(p => ({ ...p, [i]: true }))}>
                  <div className="meal-hdr">
                    <div className="meal-hdr-top">
                      <div className="meal-num">Option {i + 1}</div>
                      <button className="share-btn" onClick={e => { e.stopPropagation(); setShareOpen(p => ({ ...p, [i]: !p[i] })); }}>
                        <IconShare />{shareOpen[i] ? 'Close' : 'Share'}
                      </button>
                    </div>
                    <div className="meal-name">{meal.emoji} {meal.name}</div>
                    <div className="meal-meta">
                      <span className="meal-meta-item">⏱ {meal.time}</span>
                      <span className="meal-meta-item">👥 {meal.servings} servings</span>
                      <span className="meal-meta-item">📊 {meal.difficulty}</span>
                    </div>
                  </div>
                  <div className="meal-desc">{meal.description}</div>
                  {shareOpen[i] && <ShareDrawer meal={meal} />}
                  {!groceryOpen[i] ? (
                    <button className="grocery-trigger" onClick={e => { e.stopPropagation(); setGroceryOpen(p => ({ ...p, [i]: true })); }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><IconCart />What do I need to buy?</span>
                      <span style={{ fontSize: 11, color: 'var(--muted)', fontWeight: 400 }}>See list →</span>
                    </button>
                  ) : (
                    <GroceryPanel meal={meal} fridgeIngredients={ingredients} onClose={() => setGroceryOpen(p => ({ ...p, [i]: false }))} />
                  )}
                  {!expanded[i] ? (
                    <button className="expand-btn" onClick={e => { e.stopPropagation(); setExpanded(p => ({ ...p, [i]: true })); }}>
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
                          <div key={lbl} className="nutr-item"><div className="nutr-val">{val}</div><div className="nutr-lbl">{lbl}</div></div>
                        ))}
                      </div>
                      <button className="collapse-btn" onClick={() => setExpanded(p => ({ ...p, [i]: false }))}><span>Collapse</span><span>↑</span></button>
                    </div>
                  )}
                </div>
              ))}
            </div>
            <div className="reset-wrap"><button className="reset-btn" onClick={reset}>← Try different ingredients</button></div>
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
