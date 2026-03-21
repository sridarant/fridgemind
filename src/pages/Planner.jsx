import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLocale } from '../contexts/LocaleContext';
import { useAuth }   from '../contexts/AuthContext';

const DAYS       = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'];
const DAYS_SHORT = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];

const MEAL_TYPE_OPTIONS = [
  { id:'breakfast', label:'Breakfast', emoji:'🌅', color:'#FF9800', bg:'#FFF3E0', dark:'#E65100' },
  { id:'lunch',     label:'Lunch',     emoji:'☀️', color:'#4CAF50', bg:'#E8F5E9', dark:'#1B5E20' },
  { id:'dinner',    label:'Dinner',    emoji:'🌙', color:'#673AB7', bg:'#EDE7F6', dark:'#311B92' },
  { id:'snack',     label:'Snacks',    emoji:'🍎', color:'#E91E63', bg:'#FCE4EC', dark:'#880E4F' },
];

const CUISINE_OPTIONS = [
  { id:'any',          label:'Mix it up',    flag:'🌍' },
  { id:'Indian',       label:'Indian',        flag:'🇮🇳' },
  { id:'Italian',      label:'Italian',       flag:'🇮🇹' },
  { id:'Chinese',      label:'Chinese',       flag:'🇨🇳' },
  { id:'Mexican',      label:'Mexican',       flag:'🇲🇽' },
  { id:'Mediterranean',label:'Mediterranean', flag:'🫒' },
  { id:'Thai',         label:'Thai',          flag:'🇹🇭' },
  { id:'Japanese',     label:'Japanese',      flag:'🇯🇵' },
  { id:'Korean',       label:'Korean',        flag:'🇰🇷' },
  { id:'American',     label:'American',      flag:'🇺🇸' },
  { id:'Middle Eastern',label:'Middle Eastern',flag:'🌙' },
  { id:'French',       label:'French',        flag:'🇫🇷' },
  { id:'Brazilian',    label:'Brazilian',     flag:'🇧🇷' },
];

const DIET_OPTIONS = [
  { id:'none',        label:'No restrictions' },
  { id:'vegetarian',  label:'Vegetarian' },
  { id:'vegan',       label:'Vegan' },
  { id:'gluten-free', label:'Gluten-free' },
  { id:'dairy-free',  label:'Dairy-free' },
  { id:'low-carb',    label:'Low-carb' },
];

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,wght@0,700;0,900;1,700&family=DM+Sans:wght@300;400;500&display=swap');
  *{box-sizing:border-box;margin:0;padding:0;}
  :root{--jiff:#FF4500;--jiff-dark:#CC3700;--ink:#1C0A00;--cream:#FFFAF5;--warm:#FFF0E5;--muted:#7C6A5E;--border:rgba(28,10,0,0.10);--border-mid:rgba(28,10,0,0.18);--shadow:0 4px 24px rgba(28,10,0,0.07);--whatsapp:#25D366;}
  body{background:var(--cream);font-family:'DM Sans',sans-serif;color:var(--ink);}
  .page{min-height:100vh;background:var(--cream);}

  .header{display:flex;align-items:center;justify-content:space-between;padding:16px 28px;border-bottom:1px solid var(--border);position:sticky;top:0;z-index:20;background:rgba(255,250,245,0.95);backdrop-filter:blur(12px);}
  .logo{display:flex;align-items:center;gap:8px;cursor:pointer;}
  .logo-name{font-family:'Fraunces',serif;font-size:22px;font-weight:900;color:var(--ink);letter-spacing:-0.5px;}
  .logo-name span{color:var(--jiff);}
  .nav-links{display:flex;align-items:center;gap:8px;}
  .nav-link{font-size:12px;font-weight:500;color:var(--muted);background:none;border:1.5px solid var(--border-mid);border-radius:8px;padding:6px 12px;cursor:pointer;font-family:'DM Sans',sans-serif;transition:all 0.18s;text-decoration:none;display:inline-flex;align-items:center;gap:5px;}
  .nav-link:hover{border-color:var(--jiff);color:var(--jiff);}
  .nav-link.active{background:var(--jiff);color:white;border-color:var(--jiff);}

  .hero{max-width:720px;margin:0 auto;padding:40px 24px 0;text-align:center;}
  .hero-eyebrow{font-size:11px;letter-spacing:2.5px;text-transform:uppercase;color:var(--jiff);font-weight:500;margin-bottom:10px;}
  .hero-title{font-family:'Fraunces',serif;font-size:clamp(28px,5vw,46px);font-weight:900;color:var(--ink);line-height:1.05;letter-spacing:-1.5px;margin-bottom:10px;}
  .hero-title em{font-style:italic;color:var(--jiff);}
  .hero-sub{font-size:14px;color:var(--muted);line-height:1.7;font-weight:300;max-width:400px;margin:0 auto 28px;}

  .card{background:white;border:1px solid var(--border);border-radius:20px;padding:24px;box-shadow:var(--shadow);max-width:680px;margin:0 auto;}
  .section{margin-bottom:20px;}
  .section-label{font-size:11px;letter-spacing:2px;text-transform:uppercase;color:var(--jiff);font-weight:500;margin-bottom:10px;display:flex;align-items:center;gap:8px;}
  .section-label::after{content:'';flex:1;height:1px;background:var(--border);}

  /* Meal type multi-select */
  .meal-type-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:8px;}
  .meal-type-toggle{border:1.5px solid var(--border-mid);border-radius:12px;padding:12px 14px;cursor:pointer;transition:all 0.18s;font-family:'DM Sans',sans-serif;background:white;display:flex;align-items:center;gap:10px;}
  .meal-type-toggle.selected{border-width:2px;}
  .meal-type-toggle-emoji{font-size:20px;}
  .meal-type-toggle-label{font-size:14px;font-weight:500;color:var(--ink);}
  .meal-type-toggle-check{margin-left:auto;width:20px;height:20px;border-radius:5px;border:2px solid var(--border-mid);display:flex;align-items:center;justify-content:center;transition:all 0.15s;flex-shrink:0;}
  .meal-type-toggle.selected .meal-type-toggle-check{border-color:currentColor;}

  .ingredient-box{border:1.5px solid var(--border-mid);border-radius:12px;padding:10px 12px;background:var(--cream);min-height:72px;cursor:text;display:flex;flex-wrap:wrap;gap:6px;align-items:flex-start;transition:border-color 0.2s;}
  .ingredient-box:focus-within{border-color:var(--jiff);box-shadow:0 0 0 3px rgba(255,69,0,0.1);}
  .tag{background:var(--ink);color:white;padding:4px 10px 4px 12px;border-radius:20px;font-size:12px;display:flex;align-items:center;gap:5px;animation:tagIn 0.2s ease;white-space:nowrap;}
  @keyframes tagIn{from{transform:scale(0.8);opacity:0}to{transform:scale(1);opacity:1}}
  .tag-remove{background:none;border:none;color:rgba(255,255,255,0.6);cursor:pointer;font-size:15px;padding:0;line-height:1;}
  .tag-input{border:none;outline:none;font-family:'DM Sans',sans-serif;font-size:13px;color:var(--ink);flex:1;min-width:120px;background:transparent;padding:3px 0;}
  .tag-input::placeholder{color:var(--muted);}
  .tag-hint{font-size:11px;color:var(--muted);margin-top:6px;font-weight:300;}
  .chips{display:flex;flex-wrap:wrap;gap:6px;}
  .chip{border:1.5px solid var(--border-mid);border-radius:10px;padding:6px 12px;font-size:12px;cursor:pointer;transition:all 0.18s;font-family:'DM Sans',sans-serif;background:white;color:var(--muted);}
  .chip:hover{border-color:var(--jiff);color:var(--ink);}
  .chip.active{background:var(--ink);border-color:var(--ink);color:white;font-weight:500;}
  .chip.diet.active{background:var(--jiff);border-color:var(--jiff);}
  .cuisine-chips{display:flex;flex-wrap:wrap;gap:6px;}
  .cuisine-chip{border:1.5px solid var(--border-mid);border-radius:10px;padding:6px 11px;font-size:12px;cursor:pointer;transition:all 0.18s;font-family:'DM Sans',sans-serif;background:white;color:var(--muted);display:flex;align-items:center;gap:5px;}
  .cuisine-chip:hover{border-color:var(--jiff);color:var(--ink);}
  .cuisine-chip.active{background:var(--jiff);border-color:var(--jiff);color:white;font-weight:500;}
  .cuisine-chip.active-any{background:var(--ink);border-color:var(--ink);color:white;font-weight:500;}

  /* Serving row */
  .serving-row{display:flex;align-items:center;gap:10px;}
  .serving-controls{display:flex;align-items:center;border:1.5px solid var(--border-mid);border-radius:10px;overflow:hidden;}
  .serving-btn{width:34px;height:34px;background:white;border:none;font-size:18px;color:var(--jiff);cursor:pointer;display:flex;align-items:center;justify-content:center;transition:background 0.15s;}
  .serving-btn:hover:not(:disabled){background:var(--warm);}
  .serving-btn:disabled{color:var(--muted);cursor:not-allowed;}
  .serving-count{min-width:42px;height:34px;display:flex;align-items:center;justify-content:center;font-size:14px;font-weight:500;border-left:1px solid var(--border-mid);border-right:1px solid var(--border-mid);}
  .serving-label{font-size:13px;color:var(--muted);font-weight:300;}

  .cta-wrap{text-align:center;padding-top:4px;}
  .cta-btn{background:var(--jiff);color:white;border:none;border-radius:14px;padding:16px 40px;font-size:16px;font-family:'DM Sans',sans-serif;font-weight:500;cursor:pointer;transition:all 0.2s;display:inline-flex;align-items:center;gap:10px;}
  .cta-btn:hover:not(:disabled){background:var(--jiff-dark);transform:translateY(-2px);box-shadow:0 8px 28px rgba(255,69,0,0.35);}
  .cta-btn:disabled{opacity:0.55;cursor:not-allowed;}
  .cta-note{font-size:12px;color:var(--muted);margin-top:8px;}

  /* Loading */
  .loading-wrap{text-align:center;padding:64px 24px;max-width:500px;margin:0 auto;}
  .spinner{width:48px;height:48px;border:3px solid var(--border-mid);border-top-color:var(--jiff);border-radius:50%;animation:spin 0.7s linear infinite;margin:0 auto 20px;}
  @keyframes spin{to{transform:rotate(360deg)}}
  .loading-title{font-family:'Fraunces',serif;font-size:24px;font-weight:900;color:var(--ink);margin-bottom:8px;letter-spacing:-0.5px;}
  .loading-sub{font-size:14px;color:var(--muted);font-weight:300;margin-bottom:28px;}
  .loading-days{display:grid;grid-template-columns:repeat(7,1fr);gap:5px;max-width:400px;margin:0 auto;}
  .loading-day{background:var(--warm);border-radius:7px;padding:7px 3px;text-align:center;font-size:11px;color:var(--muted);transition:all 0.3s;}
  .loading-day.done{background:var(--jiff);color:white;font-weight:500;}
  .loading-day.active{background:var(--warm);border:2px solid var(--jiff);color:var(--jiff);font-weight:500;}

  /* Results */
  .planner-wrap{max-width:1100px;margin:0 auto;padding:32px 20px 60px;}
  .planner-top{display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:20px;flex-wrap:wrap;gap:12px;}
  .planner-title{font-family:'Fraunces',serif;font-size:24px;font-weight:900;color:var(--ink);letter-spacing:-0.5px;}
  .planner-sub{font-size:12px;color:var(--muted);font-weight:300;margin-top:3px;}
  .planner-actions{display:flex;gap:8px;flex-wrap:wrap;}
  .plan-btn{display:flex;align-items:center;gap:6px;font-size:12px;font-weight:500;font-family:'DM Sans',sans-serif;padding:8px 14px;border-radius:10px;cursor:pointer;transition:all 0.18s;}
  .plan-btn.secondary{background:white;color:var(--ink);border:1.5px solid var(--border-mid);}
  .plan-btn.secondary:hover{border-color:var(--jiff);color:var(--jiff);}
  .plan-btn.primary{background:var(--jiff);color:white;border:none;}
  .plan-btn.primary:hover{background:var(--jiff-dark);}
  .plan-btn.green{background:var(--whatsapp);color:white;border:none;text-decoration:none;}
  .plan-btn svg{width:14px;height:14px;flex-shrink:0;}

  /* Legend */
  .meal-legend{display:flex;gap:14px;margin-bottom:18px;flex-wrap:wrap;}
  .legend-item{display:flex;align-items:center;gap:6px;font-size:12px;color:var(--muted);}
  .legend-dot{width:9px;height:9px;border-radius:3px;flex-shrink:0;}

  /* Day tabs (mobile) */
  .day-tabs{display:none;gap:6px;overflow-x:auto;padding-bottom:4px;margin-bottom:14px;}
  .day-tab{flex-shrink:0;padding:6px 14px;border-radius:20px;font-size:12px;font-weight:500;cursor:pointer;font-family:'DM Sans',sans-serif;border:1.5px solid var(--border-mid);background:white;color:var(--muted);transition:all 0.18s;}
  .day-tab.active{background:var(--jiff);color:white;border-color:var(--jiff);}

  /* Calendar */
  .calendar{display:grid;grid-template-columns:repeat(7,minmax(0,1fr));gap:8px;}
  .day-col{display:flex;flex-direction:column;gap:6px;}
  .day-header{text-align:center;padding:9px 5px 7px;background:var(--ink);border-radius:10px;}
  .day-name{font-family:'Fraunces',serif;font-size:13px;font-weight:700;color:white;letter-spacing:0.3px;}
  .day-short-lbl{font-size:10px;color:rgba(255,250,245,0.5);margin-top:1px;}

  /* Meal slot */
  .meal-slot{border-radius:10px;overflow:hidden;border:1px solid var(--border);transition:box-shadow 0.18s;}
  .meal-slot:hover{box-shadow:0 3px 14px rgba(28,10,0,0.1);}
  .meal-slot-header{padding:8px 9px 6px;cursor:pointer;}
  .meal-type-label{font-size:9px;letter-spacing:1.5px;text-transform:uppercase;font-weight:600;margin-bottom:3px;}
  .meal-emoji{font-size:16px;margin-bottom:3px;line-height:1;}
  .meal-name-cell{font-size:11px;font-weight:500;color:var(--ink);line-height:1.3;}
  .meal-time-cell{font-size:9px;color:var(--muted);margin-top:2px;}
  .meal-expand-icon{font-size:9px;color:var(--muted);margin-top:3px;}
  .meal-detail{padding:9px;background:white;border-top:1px solid var(--border);animation:fadeIn 0.2s ease;}
  @keyframes fadeIn{from{opacity:0}to{opacity:1}}
  .meal-detail-desc{font-size:11px;color:var(--muted);line-height:1.55;margin-bottom:8px;font-weight:300;}
  .detail-label{font-size:9px;letter-spacing:1.5px;text-transform:uppercase;font-weight:600;color:var(--jiff);margin-bottom:4px;margin-top:8px;}
  .ing-list-sm{list-style:none;}
  .ing-list-sm li{font-size:10px;color:var(--ink);padding:2px 0;border-bottom:1px solid rgba(0,0,0,0.04);display:flex;align-items:center;gap:4px;font-weight:300;}
  .ing-list-sm li::before{content:'·';color:var(--jiff);font-size:13px;line-height:0;flex-shrink:0;}
  .steps-list-sm{counter-reset:s;list-style:none;}
  .steps-list-sm li{font-size:10px;color:var(--ink);padding:3px 0 3px 19px;border-bottom:1px solid rgba(0,0,0,0.04);position:relative;line-height:1.5;font-weight:300;counter-increment:s;}
  .steps-list-sm li::before{content:counter(s);position:absolute;left:0;top:4px;width:14px;height:14px;background:var(--jiff);color:white;font-size:8px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:600;}
  .nutr-row-sm{display:flex;gap:5px;margin-top:8px;}
  .nutr-pill-sm{flex:1;background:var(--warm);border-radius:6px;padding:5px 3px;text-align:center;}
  .nutr-val-sm{font-family:'Fraunces',serif;font-size:12px;font-weight:700;color:var(--ink);}
  .nutr-lbl-sm{font-size:8px;color:var(--muted);text-transform:uppercase;letter-spacing:0.5px;margin-top:1px;}

  /* Grocery panel */
  .grocery-panel-wide{max-width:1100px;margin:0 auto 48px;padding:0 20px;}
  .grocery-card{background:white;border:1px solid var(--border);border-radius:18px;overflow:hidden;box-shadow:var(--shadow);}
  .grocery-card-hdr{background:var(--ink);padding:18px 22px;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:10px;}
  .grocery-card-title{font-family:'Fraunces',serif;font-size:18px;font-weight:900;color:white;letter-spacing:-0.3px;}
  .grocery-card-sub{font-size:12px;color:rgba(255,255,255,0.5);margin-top:2px;}
  .grocery-grid-wide{display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));}
  .grocery-category{padding:14px 18px;border-right:1px solid var(--border);border-bottom:1px solid var(--border);}
  .grocery-category:nth-child(odd){background:var(--cream);}
  .grocery-cat-title{font-size:9px;letter-spacing:2px;text-transform:uppercase;font-weight:600;color:var(--jiff);margin-bottom:9px;}
  .grocery-item-row{display:flex;align-items:center;gap:7px;padding:4px 0;border-bottom:1px solid rgba(0,0,0,0.04);cursor:pointer;}
  .grocery-item-row:last-child{border-bottom:none;}
  .g-checkbox{width:15px;height:15px;border-radius:4px;border:1.5px solid var(--border-mid);flex-shrink:0;display:flex;align-items:center;justify-content:center;transition:all 0.15s;}
  .g-checkbox.checked{background:var(--jiff);border-color:var(--jiff);}
  .g-checkbox.checked svg{display:block;}
  .g-checkbox svg{display:none;width:9px;height:9px;stroke:white;stroke-width:2.5;}
  .g-item-text{font-size:12px;color:var(--ink);font-weight:300;flex:1;line-height:1.4;}
  .g-item-text.done{text-decoration:line-through;opacity:0.45;}
  .grocery-actions-bar{padding:14px 18px;background:var(--cream);border-top:1px solid var(--border);display:flex;gap:9px;flex-wrap:wrap;}
  .g-action-btn{display:flex;align-items:center;gap:6px;padding:8px 14px;border-radius:9px;font-size:12px;font-weight:500;cursor:pointer;font-family:'DM Sans',sans-serif;transition:all 0.18s;}
  .g-action-btn.copy{background:white;color:var(--ink);border:1.5px solid var(--border-mid);}
  .g-action-btn.copy:hover{border-color:var(--ink);}
  .g-action-btn.copy.copied{color:var(--jiff);border-color:var(--jiff);}
  .g-action-btn.wa{background:var(--whatsapp);color:white;border:none;text-decoration:none;}
  .g-action-btn svg{width:13px;height:13px;flex-shrink:0;}

  .reset-wrap{text-align:center;padding:0 24px 48px;}
  .reset-btn{background:none;border:1.5px solid var(--border-mid);border-radius:10px;padding:10px 24px;font-size:13px;font-family:'DM Sans',sans-serif;cursor:pointer;color:var(--muted);transition:all 0.18s;}
  .reset-btn:hover{border-color:var(--jiff);color:var(--jiff);}
  .error-wrap{text-align:center;padding:56px 24px;max-width:440px;margin:0 auto;}
  .error-icon{font-size:38px;margin-bottom:12px;}
  .error-title{font-family:'Fraunces',serif;font-size:20px;font-weight:700;color:var(--ink);margin-bottom:7px;}
  .error-msg{font-size:13px;color:var(--muted);margin-bottom:22px;font-weight:300;}

  @media(max-width:900px){.calendar{grid-template-columns:repeat(4,minmax(0,1fr));}}
  @media(max-width:600px){
    .header{padding:14px 16px;}
    .hero{padding:28px 16px 0;}
    .card{padding:18px 14px;border-radius:16px;}
    .calendar{grid-template-columns:1fr;}
    .day-tabs{display:flex;}
    .day-col{display:none;}
    .day-col.visible{display:flex;}
    .planner-wrap{padding:20px 14px 48px;}
    .grocery-grid-wide{grid-template-columns:1fr;}
    .meal-type-grid{grid-template-columns:1fr 1fr;}
  }
`;

// ── Icon helpers ──────────────────────────────────────────────────
const IconCopy = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>;
const IconCheck = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>;
const IconWA = () => <svg viewBox="0 0 32 32" fill="currentColor"><path d="M16 0C7.164 0 0 7.163 0 16c0 2.82.736 5.469 2.027 7.77L0 32l8.469-2.004A15.938 15.938 0 0016 32c8.836 0 16-7.164 16-16S24.836 0 16 0zm0 29.333a13.27 13.27 0 01-6.771-1.852l-.485-.288-5.027 1.189 1.213-4.899-.315-.503A13.257 13.257 0 012.667 16C2.667 8.636 8.636 2.667 16 2.667S29.333 8.636 29.333 16 23.364 29.333 16 29.333zm7.27-9.878c-.397-.198-2.35-1.16-2.714-1.291-.363-.132-.627-.198-.89.198-.264.397-1.023 1.291-1.253 1.556-.231.264-.462.297-.858.099-.397-.198-1.675-.617-3.19-1.97-1.18-1.052-1.977-2.35-2.208-2.747-.231-.397-.025-.611.173-.809.178-.178.397-.462.595-.693.198-.231.264-.397.397-.661.132-.265.066-.496-.033-.694-.099-.198-.89-2.148-1.22-2.942-.32-.772-.647-.667-.89-.68-.23-.012-.496-.015-.76-.015-.264 0-.694.099-1.057.496-.363.397-1.386 1.354-1.386 3.303 0 1.95 1.419 3.834 1.617 4.099.198.264 2.793 4.266 6.766 5.982.946.408 1.684.652 2.26.834.95.302 1.814.26 2.497.158.761-.114 2.35-.961 2.68-1.889.332-.927.332-1.722.232-1.889-.099-.165-.363-.264-.76-.462z"/></svg>;
const IconRefresh = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 11-2.12-9.36L23 10"/></svg>;
const IconCart = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 001.98 1.61H19a2 2 0 001.98-1.71L23 6H6"/></svg>;

// ── Collect + categorise grocery items ───────────────────────────
function collectAllIngredients(plan, mealTypes) {
  const all = new Set();
  plan.forEach(day => {
    mealTypes.forEach(type => {
      const meal = day.meals?.[type];
      if (meal?.ingredients) meal.ingredients.forEach(ing => { const c = ing.replace(/^\*\s*/,'').trim(); if(c) all.add(c); });
    });
  });
  return [...all].sort();
}
function categoriseIngredients(items) {
  const cats = { '🥩 Proteins':[], '🥦 Vegetables':[], '🌾 Grains':[], '🥛 Dairy & Eggs':[], '🫙 Pantry':[], '🍋 Other':[] };
  const kw = {
    '🥩 Proteins':['chicken','meat','fish','egg','tofu','paneer','lentil','dal','bean','chickpea','tuna','prawn','shrimp','pork','beef','lamb','sausage'],
    '🥦 Vegetables':['onion','tomato','potato','carrot','spinach','capsicum','pepper','broccoli','cabbage','cauliflower','peas','corn','mushroom','zucchini','eggplant','garlic','ginger','cucumber','lettuce'],
    '🌾 Grains':['rice','pasta','bread','flour','noodle','oats','quinoa','roti','tortilla','couscous'],
    '🥛 Dairy & Eggs':['milk','cream','yogurt','curd','cheese','butter','ghee','egg'],
    '🫙 Pantry':['oil','salt','sugar','vinegar','soy','sauce','paste','cumin','coriander','turmeric','chili','pepper','masala','stock','broth','coconut milk','honey','mustard'],
  };
  items.forEach(item => {
    const lower = item.toLowerCase(); let placed = false;
    for (const [cat, words] of Object.entries(kw)) {
      if (words.some(w => lower.includes(w))) { cats[cat].push(item); placed=true; break; }
    }
    if (!placed) cats['🍋 Other'].push(item);
  });
  return Object.entries(cats).filter(([,v]) => v.length > 0);
}

// ── GrocerySection ────────────────────────────────────────────────
function GrocerySection({ plan, mealTypes }) {
  const items = collectAllIngredients(plan, mealTypes);
  const cats  = categoriseIngredients(items);
  const [checked, setChecked] = useState({});
  const [copied, setCopied]   = useState(false);
  const toggle = key => setChecked(p=>({...p,[key]:!p[key]}));
  const handleCopy = async () => {
    const lines = ['🛒 *Jiff Weekly Grocery List*',''];
    cats.forEach(([cat,items]) => { lines.push(`*${cat}*`); items.forEach(i=>lines.push(`• ${i}`)); lines.push(''); });
    lines.push('_From Jiff_');
    const text = lines.join('\n');
    try { await navigator.clipboard.writeText(text); } catch { const ta=document.createElement('textarea');ta.value=text;document.body.appendChild(ta);ta.select();document.execCommand('copy');document.body.removeChild(ta); }
    setCopied(true); setTimeout(()=>setCopied(false),2500);
  };
  const waText = cats.map(([cat,items])=>`*${cat}*\n${items.map(i=>`• ${i}`).join('\n')}`).join('\n\n');
  const waUrl  = `https://wa.me/?text=${encodeURIComponent(`🛒 *Jiff Weekly Grocery List*\n\n${waText}\n\n_From Jiff_`)}`;
  const checkedCount = Object.values(checked).filter(Boolean).length;
  return (
    <div className="grocery-panel-wide">
      <div className="grocery-card">
        <div className="grocery-card-hdr">
          <div><div className="grocery-card-title">🛒 Weekly grocery list</div><div className="grocery-card-sub">{items.length} items · tap to tick off as you shop{checkedCount>0?` · ${checkedCount} done`:''}</div></div>
          <div style={{display:'flex',gap:8}}>
            <button className={`g-action-btn copy ${copied?'copied':''}`} style={{background:copied?'#1D9E75':'rgba(255,250,245,0.1)',color:'white',border:copied?'none':'1.5px solid rgba(255,250,245,0.2)'}} onClick={handleCopy}>
              {copied?<IconCheck/>:<IconCopy/>}{copied?'Copied!':'Copy list'}
            </button>
            <a className="g-action-btn wa" href={waUrl} target="_blank" rel="noopener noreferrer" style={{textDecoration:'none'}}><IconWA/>WhatsApp</a>
          </div>
        </div>
        <div className="grocery-grid-wide">
          {cats.map(([cat,catItems])=>(
            <div key={cat} className="grocery-category">
              <div className="grocery-cat-title">{cat}</div>
              {catItems.map((item,i)=>{const key=`${cat}-${i}`;return(
                <div key={key} className="grocery-item-row" onClick={()=>toggle(key)}>
                  <div className={`g-checkbox ${checked[key]?'checked':''}`}><svg viewBox="0 0 12 12"><polyline points="10 2 5 9 2 6" strokeLinecap="round" strokeLinejoin="round"/></svg></div>
                  <div className={`g-item-text ${checked[key]?'done':''}`}>{item}</div>
                </div>
              );})}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── MealSlot ──────────────────────────────────────────────────────
function MealSlot({ meal, type, servings }) {
  const [open, setOpen] = useState(false);
  if (!meal) return null;
  const mt = MEAL_TYPE_OPTIONS.find(m=>m.id===type)||MEAL_TYPE_OPTIONS[0];
  return (
    <div className="meal-slot" style={{borderColor:`${mt.color}44`}}>
      <div className="meal-slot-header" style={{background:mt.bg}} onClick={()=>setOpen(p=>!p)}>
        <div className="meal-type-label" style={{color:mt.dark}}>{type}</div>
        <div className="meal-emoji">{meal.emoji}</div>
        <div className="meal-name-cell">{meal.name}</div>
        <div className="meal-time-cell">⏱ {meal.time} · 🔥 {meal.calories} cal</div>
        <div className="meal-expand-icon">{open?'▲':'▼'}</div>
      </div>
      {open && (
        <div className="meal-detail">
          <div className="meal-detail-desc">{meal.description}</div>
          <div className="detail-label">Ingredients</div>
          <ul className="ing-list-sm">{meal.ingredients?.map((ing,i)=><li key={i}>{ing}</li>)}</ul>
          <div className="detail-label">Steps</div>
          <ol className="steps-list-sm">{meal.steps?.map((s,i)=><li key={i}>{s}</li>)}</ol>
          <div className="nutr-row-sm">
            <div className="nutr-pill-sm"><div className="nutr-val-sm">{meal.calories}</div><div className="nutr-lbl-sm">Cal</div></div>
            <div className="nutr-pill-sm"><div className="nutr-val-sm">{meal.protein}</div><div className="nutr-lbl-sm">Protein</div></div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main Planner component ────────────────────────────────────────
export default function Planner() {
  const navigate = useNavigate();
  const { profile, pantry } = useAuth();
  const { lang, units } = useLocale();

  const [ingredients,   setIngredients]   = useState([]);
  const [inputVal,      setInputVal]      = useState('');
  const [diet,          setDiet]          = useState('none');
  const [cuisine,       setCuisine]       = useState('any');
  const [servings,      setServings]      = useState(2);
  const [selectedTypes, setSelectedTypes] = useState(['breakfast','lunch','dinner']);
  const [view,          setView]          = useState('input');
  const [plan,          setPlan]          = useState(null);
  const [loadingDay,    setLoadingDay]    = useState(0);
  const [activeDay,     setActiveDay]     = useState(0);
  const [showGrocery,   setShowGrocery]   = useState(false);
  const [copiedPlan,    setCopiedPlan]    = useState(false);
  const [errorMsg,      setErrorMsg]      = useState('');
  const inputRef = useRef(null);
  const timerRef = useRef(null);
  const [pantryLoaded, setPantryLoaded]   = useState(false);

  // Pre-fill pantry
  useEffect(() => { if(!pantryLoaded&&pantry?.length){setIngredients(pantry);setPantryLoaded(true);} }, [pantry,pantryLoaded]);

  useEffect(() => {
    if (view==='loading') { let d=0; timerRef.current=setInterval(()=>{d++;setLoadingDay(d);if(d>=7)clearInterval(timerRef.current);},1100); }
    return ()=>clearInterval(timerRef.current);
  }, [view]);

  const addIng = val => { const v=val.trim().replace(/,$/,''); if(v&&!ingredients.includes(v))setIngredients(p=>[...p,v]); setInputVal(''); };
  const onKey  = e => { if(e.key==='Enter'||e.key===','){e.preventDefault();addIng(inputVal);}else if(e.key==='Backspace'&&!inputVal&&ingredients.length)setIngredients(p=>p.slice(0,-1)); };

  const toggleType = id => {
    setSelectedTypes(prev => {
      if (prev.includes(id)) { if(prev.length<=1)return prev; return prev.filter(t=>t!==id); }
      return [...prev, id];
    });
  };

  const handleSubmit = async () => {
    if (!ingredients.length || !selectedTypes.length) return;
    setView('loading'); setLoadingDay(0);
    try {
      const res = await fetch('/api/planner', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ingredients, diet, cuisine,
          mealTypes: selectedTypes, servings,
          language: lang, units,
          tasteProfile: profile ? {
            spice_level: profile.spice_level,
            allergies: profile.allergies,
            skill_level: profile.skill_level,
          } : null,
        }),
      });
      const data = await res.json();
      if (data.plan?.length >= 7) { setPlan(data.plan); setShowGrocery(false); setActiveDay(0); setView('results'); }
      else { setErrorMsg(data.error||'Could not generate meal plan. Please try again.'); setView('error'); }
    } catch { setErrorMsg('Connection error. Please try again.'); setView('error'); }
  };

  const handleCopyPlan = async () => {
    const lines = ['⚡ *Jiff Weekly Meal Plan*',''];
    plan.forEach(day => {
      lines.push(`*${day.day}*`);
      selectedTypes.forEach(type => { const m=day.meals?.[type]; if(m) lines.push(`${MEAL_TYPE_OPTIONS.find(t=>t.id===type)?.emoji} ${m.emoji} ${m.name}`); });
      lines.push('');
    });
    lines.push('_Planned with Jiff — jiff.app_');
    const text = lines.join('\n');
    try{await navigator.clipboard.writeText(text);}catch{const ta=document.createElement('textarea');ta.value=text;document.body.appendChild(ta);ta.select();document.execCommand('copy');document.body.removeChild(ta);}
    setCopiedPlan(true); setTimeout(()=>setCopiedPlan(false),2500);
  };

  const reset = () => { setView('input'); setPlan(null); setIngredients(pantry||[]); setInputVal(''); setShowGrocery(false); setPantryLoaded(true); };

  const mealCount = selectedTypes.length * 7;

  return (
    <>
      <style>{styles}</style>
      <div className="page">
        <header className="header">
          <div className="logo" onClick={()=>navigate('/')}><span style={{fontSize:22}}>⚡</span><span className="logo-name"><span>J</span>iff</span></div>
          <div className="nav-links">
            <button className="nav-link" onClick={()=>navigate('/app')}>⚡ Quick meal</button>
            <button className="nav-link active">📅 Week planner</button>
          </div>
        </header>

        {view==='input' && (
          <>
            <div className="hero">
              <div className="hero-eyebrow">Plan once, eat well all week</div>
              <h1 className="hero-title">7 days.<br /><em>Your meals sorted.</em></h1>
              <p className="hero-sub">Pick your meal types, add your ingredients. Jiff plans your whole week in one shot.</p>
            </div>
            <div className="card" style={{marginTop:24}}>

              {/* Meal type selector */}
              <div className="section">
                <div className="section-label">Which meals to plan?</div>
                <div className="meal-type-grid">
                  {MEAL_TYPE_OPTIONS.map(mt=>{
                    const sel=selectedTypes.includes(mt.id);
                    return(
                      <div key={mt.id} className={`meal-type-toggle ${sel?'selected':''}`}
                        style={sel?{borderColor:mt.color,background:mt.bg,color:mt.dark}:{}}
                        onClick={()=>toggleType(mt.id)}>
                        <span className="meal-type-toggle-emoji">{mt.emoji}</span>
                        <span className="meal-type-toggle-label">{mt.label}</span>
                        <div className="meal-type-toggle-check" style={sel?{borderColor:mt.color,background:mt.color}:{}}>
                          {sel&&<svg width="10" height="10" viewBox="0 0 12 12"><polyline points="10 2 5 9 2 6" stroke="white" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                        </div>
                      </div>
                    );
                  })}
                </div>
                <p className="tag-hint" style={{marginTop:8}}>{selectedTypes.length} meal type{selectedTypes.length>1?'s':''} selected · {mealCount} meals total</p>
              </div>

              {/* Ingredients */}
              <div className="section">
                <div className="section-label">Ingredients in your fridge & pantry</div>
                <div className="ingredient-box" onClick={()=>inputRef.current?.focus()}>
                  {ingredients.map(ing=>(<span key={ing} className="tag">{ing}<button className="tag-remove" onClick={e=>{e.stopPropagation();setIngredients(p=>p.filter(i=>i!==ing));}}>×</button></span>))}
                  <input ref={inputRef} className="tag-input" value={inputVal} onChange={e=>setInputVal(e.target.value)} onKeyDown={onKey} onBlur={()=>{if(inputVal.trim())addIng(inputVal);}} placeholder={ingredients.length===0?'eggs, rice, chicken, onions… press Enter after each':'add more…'}/>
                </div>
                <p className="tag-hint">Enter or comma to add · More ingredients = more variety</p>
              </div>

              {/* Servings */}
              <div className="section">
                <div className="section-label">Servings per meal</div>
                <div className="serving-row">
                  <div className="serving-controls">
                    <button className="serving-btn" disabled={servings<=1} onClick={()=>setServings(s=>Math.max(1,s-1))}>−</button>
                    <div className="serving-count">{servings}</div>
                    <button className="serving-btn" disabled={servings>=12} onClick={()=>setServings(s=>Math.min(12,s+1))}>+</button>
                  </div>
                  <span className="serving-label">serving{servings!==1?'s':''} — all recipes sized for {servings} {servings===1?'person':'people'}</span>
                </div>
              </div>

              {/* Cuisine */}
              <div className="section">
                <div className="section-label">Cuisine style</div>
                <div className="cuisine-chips">
                  {CUISINE_OPTIONS.map(o=>(
                    <button key={o.id} className={`cuisine-chip ${cuisine===o.id?(o.id==='any'?'active-any':'active'):''}`} onClick={()=>setCuisine(o.id)}>
                      <span style={{fontSize:13}}>{o.flag}</span><span>{o.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Diet */}
              <div className="section">
                <div className="section-label">Dietary preference</div>
                <div className="chips">{DIET_OPTIONS.map(o=><button key={o.id} className={`chip diet ${diet===o.id?'active':''}`} onClick={()=>setDiet(o.id)}>{o.label}</button>)}</div>
              </div>

              <div className="cta-wrap">
                <button className="cta-btn" onClick={handleSubmit} disabled={!ingredients.length||selectedTypes.length===0}>
                  <span>📅</span><span>Plan my week</span>
                </button>
                {(!ingredients.length||selectedTypes.length===0) && <p className="cta-note">Add ingredients and select at least one meal type</p>}
              </div>
            </div>
          </>
        )}

        {view==='loading' && (
          <div className="loading-wrap">
            <div className="spinner"/>
            <div className="loading-title">Planning your week…</div>
            <div className="loading-sub">Building {mealCount} meals across 7 days. Takes about 20 seconds.</div>
            <div className="loading-days">
              {DAYS.map((day,i)=>(
                <div key={day} className={`loading-day ${loadingDay>i?'done':loadingDay===i?'active':''}`}>
                  {loadingDay>i?'✓':day.slice(0,3)}
                </div>
              ))}
            </div>
          </div>
        )}

        {view==='results' && plan && (
          <>
            <div className="planner-wrap">
              <div className="planner-top">
                <div>
                  <div className="planner-title">⚡ Your week is planned.</div>
                  <div className="planner-sub">{mealCount} meals · {selectedTypes.join(', ')} · {servings} serving{servings>1?'s':''} each · tap any meal to expand</div>
                </div>
                <div className="planner-actions">
                  <button className={`plan-btn ${copiedPlan?'primary':'secondary'}`} style={copiedPlan?{background:'#1D9E75',color:'white',border:'none'}:{}} onClick={handleCopyPlan}>
                    {copiedPlan?<IconCheck/>:<IconCopy/>}{copiedPlan?'Copied!':'Copy plan'}
                  </button>
                  <a className="plan-btn green" href={`https://wa.me/?text=${encodeURIComponent('⚡ My Jiff Week Plan — planned at jiff.app')}`} target="_blank" rel="noopener noreferrer" style={{textDecoration:'none'}}><IconWA/>Share</a>
                  <button className="plan-btn secondary" onClick={()=>setShowGrocery(p=>!p)}><IconCart/>{showGrocery?'Hide grocery':'Grocery list'}</button>
                  <button className="plan-btn secondary" onClick={handleSubmit}><IconRefresh/>Regenerate</button>
                </div>
              </div>

              {/* Legend */}
              <div className="meal-legend">
                {selectedTypes.map(type=>{const mt=MEAL_TYPE_OPTIONS.find(m=>m.id===type);return mt?(
                  <div key={type} className="legend-item"><div className="legend-dot" style={{background:mt.color}}/>{mt.emoji} {mt.label}</div>
                ):null;})}
              </div>

              {/* Mobile day tabs */}
              <div className="day-tabs">
                {DAYS.map((day,i)=>(
                  <button key={day} className={`day-tab ${activeDay===i?'active':''}`} onClick={()=>setActiveDay(i)}>
                    {DAYS_SHORT[i]}
                  </button>
                ))}
              </div>

              {/* Calendar grid */}
              <div className="calendar">
                {plan.map((dayData,i)=>(
                  <div key={dayData.day} className={`day-col ${i===activeDay?'visible':''}`}>
                    <div className="day-header">
                      <div className="day-name">{DAYS_SHORT[i]}</div>
                      <div className="day-short-lbl">{dayData.day}</div>
                    </div>
                    {selectedTypes.map(type=>(
                      <MealSlot key={type} meal={dayData.meals?.[type]} type={type} servings={servings}/>
                    ))}
                  </div>
                ))}
              </div>
            </div>

            {showGrocery && <GrocerySection plan={plan} mealTypes={selectedTypes}/>}

            <div className="reset-wrap">
              <button className="reset-btn" onClick={reset}>← Start over</button>
            </div>
          </>
        )}

        {view==='error' && (
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
