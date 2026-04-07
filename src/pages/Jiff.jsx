import { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth }    from '../contexts/AuthContext';
import { usePremium } from '../contexts/PremiumContext';
import { useLocale, getCurrentSeason } from '../contexts/LocaleContext';
import JiffLogo        from '../components/JiffLogo';
import SmartGreeting    from '../components/SmartGreeting';
import IngredientInput  from '../components/IngredientInput';
import FridgePhotoUpload  from '../components/FridgePhotoUpload';
import FamilySelector    from '../components/FamilySelector';

// ── localStorage helpers (favourites for guest fallback) ─────────
const STORAGE_KEY = 'jiff-favourites';
function loadLocalFavs() { try { const r = localStorage.getItem(STORAGE_KEY); return r ? JSON.parse(r) : []; } catch { return []; } }
function saveLocalFavs(f) { try { localStorage.setItem(STORAGE_KEY, JSON.stringify(f)); } catch {} }
// ── Utility lib imports ──────────────────────────────────────────
import { parseQty, scaleIngredient, scaleNutrition, toNiceNumber, QTY_RE, FRACTIONS } from '../lib/scaling.js';
import { parseStepTime, formatTime } from '../lib/timers.js';
import { extractCoreName, isAvailable, buildGroceryList } from '../lib/grocery.js';
import { buildShareText } from '../lib/sharing.js';
import { mealKey, getDietaryLabel } from '../lib/mealKey.js';
import { getUpcomingFestival } from '../lib/festival.js';
import { QUICK_ADD_STAPLES, ALL_CUISINES } from '../lib/cuisine.js';
import { MealCard }               from '../components/meal/MealCard.jsx';
import { JourneyTiles }           from '../components/common/JourneyTiles.jsx';


const MEAL_TYPE_OPTIONS = [
  { id:'any',       label:'Any meal',  emoji:'🍽️' },
  { id:'breakfast', label:'Breakfast', emoji:'🌅' },
  { id:'lunch',     label:'Lunch',     emoji:'☀️' },
  { id:'dinner',    label:'Dinner',    emoji:'🌙' },
  { id:'snack',     label:'Snacks',    emoji:'🍎' },
];

const FACTS = [
  'Raiding your fridge…','Cross-referencing 50,000+ recipes…',
  'Matching cuisine and flavour profile…','Crunching nutrition numbers…',
  'Preparing 5 great options for you…',
];

// ── Icons ─────────────────────────────────────────────────────────
const IconHeart=({filled})=><svg viewBox="0 0 24 24" fill={filled?'#E53E3E':'none'} stroke={filled?'#E53E3E':'currentColor'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>;
// IconShare moved to MealCard.jsx
// IconCopy moved to MealCard.jsx
// IconCheck moved to MealCard.jsx
// IconCart moved to MealCard.jsx
// IconWA moved to MealCard.jsx
// IconScaler moved to MealCard.jsx

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,wght@0,700;0,900;1,700&family=DM+Sans:wght@300;400;500&display=swap');
  *{box-sizing:border-box;margin:0;padding:0;}
  :root{
    --jiff:#FF4500;--jiff-dark:#CC3700;--ink:#1C0A00;
    --cream:#FFFAF5;--warm:#FFF0E5;--muted:#7C6A5E;
    --border:rgba(28,10,0,0.10);--border-mid:rgba(28,10,0,0.18);
    --shadow:0 4px 28px rgba(28,10,0,0.08);
    --fav:#E53E3E;--fav-bg:#FFF5F5;--fav-border:rgba(229,62,62,0.2);
    --whatsapp:#25D366;--whatsapp-dark:#1DA851;
    --need-bg:#FEF3E2;--need-text:#92400E;
    --have-bg:#ECFDF5;--have-text:#065F46;
    --timer-idle:#FF6B35;--timer-active:#2D6A4F;--timer-done:#1D9E75;
    --gold:#FFB800;
  }
  body{background:var(--cream);font-family:'DM Sans',sans-serif;color:var(--ink);}
  .app{min-height:100vh;background:var(--cream);}

  /* Header */
  .header{display:flex;align-items:center;justify-content:space-between;padding:16px 28px;border-bottom:1px solid var(--border);position:sticky;top:0;z-index:20;background:rgba(255,250,245,0.95);backdrop-filter:blur(12px);}
  .logo{display:flex;align-items:center;gap:8px;cursor:pointer;}
  .logo-name{font-family:'Fraunces',serif;font-size:22px;font-weight:900;color:var(--ink);letter-spacing:-0.5px;}
  .logo-name span{color:var(--jiff);}
  .header-right{display:flex;align-items:center;gap:8px;flex-wrap:wrap;}
  .header-tag{font-size:10px;background:var(--jiff);color:white;padding:3px 10px;border-radius:20px;letter-spacing:1px;text-transform:uppercase;font-weight:500;}
  .hdr-btn{font-size:12px;font-weight:500;color:var(--muted);background:none;border:1.5px solid var(--border-mid);border-radius:8px;padding:6px 12px;cursor:pointer;font-family:'DM Sans',sans-serif;transition:all 0.18s;white-space:nowrap;display:flex;align-items:center;gap:5px;}
  .hdr-btn:hover{border-color:var(--jiff);color:var(--jiff);}
  .hdr-btn.fav-active{border-color:var(--fav);color:var(--fav);background:var(--fav-bg);}
  .hdr-btn.premium{border-color:var(--gold);color:#854F0B;background:rgba(255,184,0,0.1);}
  .hdr-btn.profile{border-color:rgba(255,69,0,0.2);color:var(--jiff);background:rgba(255,69,0,0.06);}
  .fav-badge{background:var(--fav);color:white;font-size:10px;font-weight:700;border-radius:20px;padding:1px 6px;}
  .trial-badge{background:rgba(255,184,0,0.15);border:1px solid rgba(255,184,0,0.3);border-radius:20px;padding:4px 10px;font-size:11px;font-weight:500;color:#854F0B;white-space:nowrap;}
  .notif-btn{position:relative;background:none;border:1.5px solid var(--border-mid);border-radius:20px;padding:6px 10px;cursor:pointer;font-size:15px;display:flex;align-items:center;gap:4px;transition:all 0.15s;}
  .notif-btn:hover{border-color:var(--jiff);color:var(--jiff);}
  .notif-badge{position:absolute;top:-4px;right:-4px;background:#E53E3E;color:white;font-size:9px;font-weight:700;border-radius:20px;padding:1px 5px;min-width:16px;text-align:center;border:2px solid white;}
  .notif-panel{position:absolute;right:0;top:calc(100% + 8px);width:320px;background:white;border:1px solid rgba(28,10,0,0.10);border-radius:16px;box-shadow:0 12px 40px rgba(28,10,0,0.14);z-index:200;overflow:hidden;}
  .notif-header{display:flex;align-items:center;justify-content:space-between;padding:12px 16px;border-bottom:1px solid rgba(28,10,0,0.08);}
  .notif-item{display:flex;gap:10px;padding:12px 16px;border-bottom:1px solid rgba(28,10,0,0.05);transition:background 0.1s;cursor:default;}
  .notif-item.unread{background:rgba(255,69,0,0.03);}
  .notif-item:hover{background:rgba(28,10,0,0.03);}
  .notif-empty{padding:28px 16px;text-align:center;color:var(--muted);font-size:13px;font-weight:300;}

  /* Auth gate overlay */
  .auth-gate{position:fixed;inset:0;background:rgba(28,10,0,0.6);display:flex;align-items:center;justify-content:center;z-index:100;padding:20px;backdrop-filter:blur(4px);}
  .auth-card{background:white;border-radius:24px;padding:40px 36px;max-width:440px;width:100%;text-align:center;box-shadow:0 24px 64px rgba(28,10,0,0.2);}
  .auth-icon{font-size:48px;margin-bottom:16px;}
  .auth-title{font-family:'Fraunces',serif;font-size:28px;font-weight:900;color:var(--ink);margin-bottom:8px;letter-spacing:-0.5px;}
  .auth-sub{font-size:15px;color:var(--muted);font-weight:300;line-height:1.65;margin-bottom:28px;}
  .auth-google-btn{width:100%;background:var(--jiff);color:white;border:none;border-radius:12px;padding:16px;font-size:16px;font-weight:500;cursor:pointer;font-family:'DM Sans',sans-serif;margin-bottom:12px;transition:all 0.2s;display:flex;align-items:center;justify-content:center;gap:10px;}
  .auth-google-btn:hover{background:var(--jiff-dark);transform:translateY(-1px);}
  .auth-email-row{display:flex;border:1.5px solid var(--border-mid);border-radius:10px;overflow:hidden;margin-bottom:8px;}
  .auth-email-input{flex:1;border:none;outline:none;padding:12px 14px;font-size:14px;font-family:'DM Sans',sans-serif;color:var(--ink);}
  .auth-email-go{background:var(--warm);border:none;border-left:1px solid var(--border-mid);padding:12px 18px;font-size:14px;font-weight:500;cursor:pointer;color:var(--ink);font-family:'DM Sans',sans-serif;transition:background 0.15s;}
  .auth-email-go:hover{background:var(--jiff);color:white;}
  .auth-magic{font-size:13px;color:var(--timer-done);font-weight:500;padding:8px;}
  .auth-perks{display:flex;flex-direction:column;gap:8px;margin-bottom:24px;text-align:left;}
  .auth-perk{display:flex;align-items:center;gap:10px;font-size:13px;color:var(--ink);font-weight:300;}
  .auth-perk-icon{width:28px;height:28px;border-radius:8px;background:var(--warm);display:flex;align-items:center;justify-content:center;font-size:14px;flex-shrink:0;}

  /* Upgrade gate */
  .gate-overlay{position:fixed;inset:0;background:rgba(28,10,0,0.5);display:flex;align-items:center;justify-content:center;z-index:100;padding:20px;}
  .gate-card{background:white;border-radius:24px;padding:36px 32px;max-width:440px;width:100%;text-align:center;box-shadow:0 24px 64px rgba(28,10,0,0.2);animation:slideUp 0.25s ease;}
  @keyframes slideUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}
  .gate-icon{font-size:44px;margin-bottom:14px;}
  .gate-title{font-family:'Fraunces',serif;font-size:26px;font-weight:900;color:var(--ink);margin-bottom:8px;letter-spacing:-0.5px;}
  .gate-sub{font-size:15px;color:var(--muted);font-weight:300;line-height:1.65;margin-bottom:24px;}
  .gate-plans{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-bottom:18px;}
  .gate-plan{border:1.5px solid var(--border-mid);border-radius:12px;padding:14px 10px;cursor:pointer;transition:all 0.15s;text-align:center;}
  .gate-plan:hover,.gate-plan.selected{border-color:var(--jiff);}
  .gate-plan.selected{background:rgba(255,69,0,0.05);}
  .gate-plan-price{font-family:'Fraunces',serif;font-size:20px;font-weight:900;color:var(--ink);}
  .gate-plan-label{font-size:11px;color:var(--muted);margin-top:2px;}
  .gate-plan-saving{font-size:10px;font-weight:600;color:var(--jiff);margin-top:3px;}
  .gate-cta{background:var(--jiff);color:white;border:none;border-radius:12px;padding:15px 32px;font-size:15px;font-weight:500;cursor:pointer;width:100%;font-family:'DM Sans',sans-serif;margin-bottom:10px;transition:all 0.18s;}
  .gate-cta:hover{background:var(--jiff-dark);}
  .gate-skip{background:none;border:none;color:var(--muted);font-size:13px;cursor:pointer;font-family:'DM Sans',sans-serif;padding:4px;}
  .gate-skip:hover{color:var(--ink);}

  /* Main layout — 2 columns on desktop */
  .main-layout{display:grid;grid-template-columns:1fr 280px;gap:24px;max-width:1000px;margin:0 auto;padding:32px 24px 60px;}
  .main-form{min-width:0;}
  .main-sidebar{display:flex;flex-direction:column;gap:16px;}

  /* Sidebar profile card */
  .sidebar-card{background:white;border:1px solid var(--border);border-radius:18px;padding:18px;box-shadow:var(--shadow);}
  .sidebar-card-title{font-size:11px;letter-spacing:2px;text-transform:uppercase;color:var(--jiff);font-weight:500;margin-bottom:12px;}
  .sidebar-pref{display:flex;align-items:center;gap:9px;padding:7px 0;border-bottom:1px solid var(--border);font-size:13px;color:var(--ink);}
  .sidebar-pref:last-child{border-bottom:none;}
  .sidebar-pref-key{color:var(--muted);font-weight:300;min-width:60px;font-size:12px;}
  .sidebar-pref-val{font-weight:500;flex:1;}
  .sidebar-edit-btn{font-size:11px;color:var(--jiff);background:none;border:none;cursor:pointer;font-family:'DM Sans',sans-serif;padding:0;text-decoration:underline;margin-top:10px;display:block;}

  /* Trial countdown card */
  .trial-card{background:linear-gradient(135deg,#FFF8E7,#FFF0E5);border:1px solid rgba(255,184,0,0.3);border-radius:18px;padding:18px;}
  .trial-card-title{font-size:13px;font-weight:500;color:#854F0B;margin-bottom:6px;display:flex;align-items:center;gap:6px;}
  .trial-bar-track{height:6px;background:rgba(255,184,0,0.2);border-radius:3px;margin:8px 0;}
  .trial-bar-fill{height:100%;background:var(--gold);border-radius:3px;transition:width 0.3s;}
  .trial-days{font-size:12px;color:#854F0B;font-weight:300;}
  .trial-upgrade-btn{margin-top:10px;width:100%;background:#854F0B;color:white;border:none;border-radius:8px;padding:9px;font-size:12px;font-weight:500;cursor:pointer;font-family:'DM Sans',sans-serif;}
  .trial-upgrade-btn:hover{background:#6D3F08;}

  /* Input card */
  .card{background:white;border:1px solid var(--border);border-radius:20px;padding:24px;box-shadow:var(--shadow);}
  .section{margin-bottom:20px;}
  .section-label{font-size:11px;letter-spacing:2px;text-transform:uppercase;color:var(--jiff);font-weight:500;margin-bottom:10px;display:flex;align-items:center;gap:8px;}
  .section-label::after{content:'';flex:1;height:1px;background:var(--border);}
  .ingredient-box{border:1.5px solid var(--border-mid);border-radius:12px;padding:10px 12px;background:var(--cream);min-height:72px;cursor:text;display:flex;flex-wrap:wrap;gap:6px;align-items:flex-start;transition:border-color 0.2s;}
  .ingredient-box:focus-within{border-color:var(--jiff);box-shadow:0 0 0 3px rgba(255,69,0,0.1);}
  .tag{background:var(--ink);color:white;padding:4px 10px 4px 12px;border-radius:20px;font-size:12px;display:flex;align-items:center;gap:5px;animation:tagIn 0.2s ease;white-space:nowrap;}
  @keyframes tagIn{from{transform:scale(0.8);opacity:0}to{transform:scale(1);opacity:1}}
  .tag-remove{background:none;border:none;color:rgba(255,255,255,0.6);cursor:pointer;font-size:15px;padding:0;line-height:1;}
  .tag-remove:hover{color:white;}
  .tag-input{border:none;outline:none;font-family:'DM Sans',sans-serif;font-size:13px;color:var(--ink);flex:1;min-width:120px;background:transparent;padding:3px 0;}
  .tag-input::placeholder{color:var(--muted);}
  .tag-hint{font-size:11px;color:var(--muted);margin-top:6px;font-weight:300;}
  .chips{display:flex;flex-wrap:wrap;gap:7px;}
  .chip{border:1.5px solid var(--border-mid);border-radius:10px;padding:6px 13px;font-size:12px;cursor:pointer;transition:all 0.18s;font-family:'DM Sans',sans-serif;background:white;color:var(--muted);}
  .chip:hover{border-color:var(--jiff);color:var(--ink);}
  .chip.active{background:var(--ink);border-color:var(--ink);color:white;font-weight:500;}
  .chip.diet.active{background:var(--jiff);border-color:var(--jiff);}
  .cuisine-chips{display:flex;flex-wrap:wrap;gap:6px;}
  .cuisine-chip{border:1.5px solid var(--border-mid);border-radius:10px;padding:6px 12px;font-size:12px;cursor:pointer;transition:all 0.18s;font-family:'DM Sans',sans-serif;background:white;color:var(--muted);display:flex;align-items:center;gap:5px;}
  .cuisine-chip:hover{border-color:var(--jiff);color:var(--ink);}
  .cuisine-chip.active{background:var(--jiff);border-color:var(--jiff);color:white;font-weight:500;box-shadow:0 3px 10px rgba(255,69,0,0.25);}
  .cuisine-chip.pref-highlight{border-color:var(--jiff);color:var(--jiff);background:rgba(255,69,0,0.06);font-weight:500;}
  .cuisine-chip.active-any{background:var(--ink);border-color:var(--ink);color:white;font-weight:500;}

  /* Meal type chips */
  .meal-type-chips{display:flex;flex-wrap:wrap;gap:7px;}
  .meal-type-chip{border:1.5px solid var(--border-mid);border-radius:10px;padding:7px 14px;font-size:13px;cursor:pointer;font-family:'DM Sans',sans-serif;background:white;color:var(--muted);display:flex;align-items:center;gap:6px;transition:all 0.18s;}
  .meal-type-chip:hover{border-color:var(--jiff);color:var(--ink);}
  .meal-type-chip.active{background:var(--jiff);border-color:var(--jiff);color:white;font-weight:500;box-shadow:0 3px 10px rgba(255,69,0,0.25);}

  /* Serving size input row */
  .serving-row{display:flex;align-items:center;gap:10px;}
  .serving-controls{display:flex;align-items:center;border:1.5px solid var(--border-mid);border-radius:10px;overflow:hidden;}
  .serving-btn{width:34px;height:34px;background:white;border:none;font-size:18px;color:var(--jiff);cursor:pointer;display:flex;align-items:center;justify-content:center;transition:background 0.15s;}
  .serving-btn:hover:not(:disabled){background:var(--warm);}
  .serving-btn:disabled{color:var(--muted);cursor:not-allowed;}
  .serving-count{min-width:42px;height:34px;display:flex;align-items:center;justify-content:center;font-size:14px;font-weight:500;border-left:1px solid var(--border-mid);border-right:1px solid var(--border-mid);}
  .serving-label{font-size:13px;color:var(--muted);font-weight:300;}

  /* CTA */
  .cta-wrap{text-align:center;padding-top:4px;}
  .cta-btn{background:var(--jiff);color:white;border:none;border-radius:14px;padding:16px 40px;font-size:16px;font-family:'DM Sans',sans-serif;font-weight:500;cursor:pointer;transition:all 0.2s;display:inline-flex;align-items:center;gap:10px;}
  .cta-btn:hover:not(:disabled){background:var(--jiff-dark);transform:translateY(-2px);box-shadow:0 8px 28px rgba(255,69,0,0.35);}
  .cta-btn:disabled{opacity:0.55;cursor:not-allowed;}
  .cta-note{font-size:12px;color:var(--muted);margin-top:8px;}
  .trial-note{font-size:12px;color:#854F0B;margin-top:8px;background:rgba(255,184,0,0.1);border-radius:8px;padding:6px 12px;display:inline-block;}

  /* Loading */
  .loading-wrap{text-align:center;padding:64px 24px;max-width:480px;margin:0 auto;}
  .spinner{width:44px;height:44px;border:3px solid var(--border-mid);border-top-color:var(--jiff);border-radius:50%;animation:spin 0.7s linear infinite;margin:0 auto 20px;}
  @keyframes spin{to{transform:rotate(360deg)}}
  .loading-title{font-family:'Fraunces',serif;font-size:24px;font-weight:700;color:var(--ink);margin-bottom:8px;letter-spacing:-0.5px;}
  .loading-sub{font-size:14px;color:var(--muted);font-weight:300;margin-bottom:24px;}
  .loading-fact{font-size:13px;color:var(--muted);padding:12px 0;border-top:1px solid var(--border);animation:fadeIn 0.4s ease;}
  @keyframes fadeIn{from{opacity:0}to{opacity:1}}

  /* Results */
  .results-wrap{max-width:860px;margin:0 auto;padding:32px 24px 60px;}
  .results-header{margin-bottom:16px;}
  .results-title{font-family:'Fraunces',serif;font-size:26px;font-weight:900;color:var(--ink);margin-bottom:4px;letter-spacing:-0.5px;}
  .results-sub{font-size:13px;color:var(--muted);font-weight:300;}
  .filter-pills{display:flex;flex-wrap:wrap;gap:6px;margin-bottom:20px;}
  .filter-pill{background:white;border:1px solid var(--border-mid);border-radius:20px;padding:3px 11px;font-size:11px;color:var(--muted);}
  .meals-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(320px,1fr));gap:14px;}

  /* Meal card */
  .meal-card{background:white;border:1px solid var(--border);border-radius:18px;overflow:hidden;box-shadow:var(--shadow);animation:slideUp 0.3s ease both;transition:transform 0.2s,box-shadow 0.2s;}
  .meal-card:not(.expanded){cursor:pointer;}
  .meal-card:not(.expanded):hover{transform:translateY(-3px);box-shadow:0 12px 32px rgba(28,10,0,0.12);}
  .meal-card.is-fav{border-color:var(--fav-border);}
  .meal-card:nth-child(2){animation-delay:0.05s;}
  .meal-card:nth-child(3){animation-delay:0.1s;}
  .meal-card:nth-child(4){animation-delay:0.15s;}
  .meal-card:nth-child(5){animation-delay:0.2s;}
  .meal-hdr{padding:18px 18px 10px;}
  .meal-hdr-top{display:flex;align-items:center;justify-content:space-between;gap:6px;margin-bottom:7px;}
  .meal-hdr-actions{display:flex;align-items:center;gap:5px;flex-shrink:0;}
  .meal-num{font-size:10px;letter-spacing:2px;text-transform:uppercase;color:var(--jiff);font-weight:600;}
  .meal-name{font-family:'Fraunces',serif;font-size:19px;font-weight:700;color:var(--ink);margin-bottom:7px;line-height:1.2;letter-spacing:-0.3px;}
  .meal-meta{display:flex;gap:10px;flex-wrap:wrap;}
  .meal-meta-item{font-size:11px;color:var(--muted);}
  .meal-desc{padding:0 18px 12px;font-size:13px;color:var(--muted);line-height:1.6;font-weight:300;}
  .heart-btn{background:none;border:1.5px solid var(--border-mid);border-radius:8px;width:30px;height:30px;display:flex;align-items:center;justify-content:center;cursor:pointer;transition:all 0.2s;flex-shrink:0;padding:0;}
  .heart-btn:hover{border-color:var(--fav);background:var(--fav-bg);}
  .heart-btn.saved{border-color:var(--fav);background:var(--fav-bg);}
  .heart-btn svg{width:14px;height:14px;}
  .heart-btn.saved svg{animation:heartPop 0.3s ease;}
  @keyframes heartPop{0%{transform:scale(1)}40%{transform:scale(1.4)}100%{transform:scale(1)}}
  .share-btn{background:none;border:1.5px solid var(--border-mid);border-radius:8px;padding:4px 9px;font-size:11px;font-family:'DM Sans',sans-serif;color:var(--muted);cursor:pointer;display:flex;align-items:center;gap:4px;transition:all 0.18s;flex-shrink:0;}
  .share-btn:hover{border-color:var(--jiff);color:var(--jiff);}
  .share-btn svg{width:12px;height:12px;}
  .share-drawer{border-top:1px solid var(--border);padding:10px 18px 14px;animation:fadeIn 0.2s ease;background:var(--cream);}
  .share-drawer-label{font-size:10px;letter-spacing:2px;text-transform:uppercase;color:var(--muted);font-weight:500;margin-bottom:9px;}
  .share-actions{display:flex;gap:7px;flex-wrap:wrap;}
  .share-wa{display:flex;align-items:center;gap:6px;background:var(--whatsapp);color:white;border:none;border-radius:8px;padding:8px 14px;font-size:12px;font-family:'DM Sans',sans-serif;font-weight:500;cursor:pointer;transition:all 0.18s;text-decoration:none;flex:1;}
  .share-wa:hover{background:var(--whatsapp-dark);}
  .share-wa svg{width:13px;height:13px;flex-shrink:0;}
  .share-copy{display:flex;align-items:center;gap:6px;background:white;color:var(--ink);border:1.5px solid var(--border-mid);border-radius:8px;padding:8px 14px;font-size:12px;font-family:'DM Sans',sans-serif;font-weight:500;cursor:pointer;transition:all 0.18s;flex:1;}
  .share-copy.copied{border-color:var(--jiff);color:var(--jiff);}
  .share-copy svg{width:13px;height:13px;flex-shrink:0;}

  /* Grocery */
  .grocery-trigger{margin:0 18px 14px;width:calc(100% - 36px);background:none;border:1.5px dashed rgba(255,69,0,0.3);border-radius:9px;padding:9px 12px;font-size:12px;font-family:'DM Sans',sans-serif;cursor:pointer;color:var(--jiff);font-weight:500;display:flex;align-items:center;justify-content:space-between;transition:all 0.18s;}
  .grocery-trigger:hover{background:rgba(255,69,0,0.04);border-color:var(--jiff);}
  .grocery-panel{margin:0 18px 14px;border:1px solid var(--border);border-radius:13px;overflow:hidden;animation:fadeIn 0.2s ease;}
  .grocery-header{background:var(--ink);padding:11px 13px;display:flex;align-items:center;justify-content:space-between;}
  .grocery-header-left{display:flex;align-items:center;gap:8px;}
  .grocery-header-title{font-size:12px;font-weight:500;color:white;}
  .grocery-header-sub{font-size:10px;color:rgba(255,255,255,0.55);margin-top:1px;}
  .grocery-close{background:none;border:none;color:rgba(255,255,255,0.6);cursor:pointer;font-size:17px;padding:0;line-height:1;}
  .grocery-section{padding:11px 13px;}
  .grocery-section+.grocery-section{border-top:1px solid var(--border);}
  .grocery-section-title{font-size:9px;letter-spacing:2px;text-transform:uppercase;font-weight:500;margin-bottom:8px;display:flex;align-items:center;gap:6px;}
  .grocery-section-title.need{color:#92400E;}
  .grocery-section-title.have{color:#065F46;}
  .grocery-count{font-size:9px;font-weight:500;padding:2px 7px;border-radius:20px;margin-left:auto;}
  .grocery-count.need{background:var(--need-bg);color:var(--need-text);}
  .grocery-count.have{background:var(--have-bg);color:var(--have-text);}
  .grocery-items{display:flex;flex-direction:column;gap:4px;}
  .grocery-item{display:flex;align-items:flex-start;gap:8px;padding:6px 8px;border-radius:7px;font-size:12px;line-height:1.4;font-weight:300;cursor:pointer;}
  .grocery-item.need{background:var(--need-bg);color:var(--need-text);}
  .grocery-item.have{background:var(--have-bg);color:var(--have-text);cursor:default;}
  .grocery-empty{font-size:12px;color:var(--muted);text-align:center;padding:4px 0;}
  .grocery-checkbox{width:14px;height:14px;border-radius:3px;border:1.5px solid currentColor;flex-shrink:0;margin-top:1px;display:flex;align-items:center;justify-content:center;transition:all 0.15s;}
  .grocery-checkbox.checked{background:currentColor;}
  .grocery-checkbox.checked svg{display:block;}
  .grocery-checkbox svg{display:none;width:8px;height:8px;stroke:white;stroke-width:2.5;}
  .grocery-item-text{flex:1;}
  .grocery-item-text.checked-text{text-decoration:line-through;opacity:0.5;}
  .grocery-dot{width:6px;height:6px;border-radius:50%;flex-shrink:0;margin-top:4px;}
  .grocery-item.need .grocery-dot{background:#F59E0B;}
  .grocery-item.have .grocery-dot{background:#10B981;}
  .grocery-actions{padding:9px 13px;border-top:1px solid var(--border);display:flex;gap:7px;background:var(--cream);}
  .grocery-action-btn{flex:1;padding:7px 9px;font-size:11px;font-family:'DM Sans',sans-serif;font-weight:500;border-radius:7px;cursor:pointer;transition:all 0.18s;display:flex;align-items:center;justify-content:center;gap:4px;}
  .grocery-action-btn.copy{background:white;color:var(--ink);border:1px solid var(--border-mid);}
  .grocery-action-btn.copy.copied{color:var(--jiff);border-color:var(--jiff);}
  .grocery-action-btn.wa{background:var(--whatsapp);color:white;border:none;text-decoration:none;}
  .grocery-action-btn svg{width:12px;height:12px;flex-shrink:0;}

  /* Scaler */
  .scaler-bar{padding:11px 14px;background:var(--warm);border:1px solid rgba(255,69,0,0.15);border-radius:9px 9px 0 0;display:flex;align-items:center;gap:10px;flex-wrap:wrap;}
  .scaler-label{font-size:11px;font-weight:500;color:var(--ink);display:flex;align-items:center;gap:5px;white-space:nowrap;}
  .scaler-label svg{width:13px;height:13px;color:var(--jiff);flex-shrink:0;}
  .scaler-controls{display:flex;align-items:center;border:1.5px solid rgba(255,69,0,0.25);border-radius:7px;overflow:hidden;flex-shrink:0;}
  .scaler-btn{background:white;border:none;width:30px;height:30px;font-size:16px;color:var(--jiff);cursor:pointer;display:flex;align-items:center;justify-content:center;transition:background 0.15s;}
  .scaler-btn:hover:not(:disabled){background:var(--fav-bg);}
  .scaler-btn:disabled{color:var(--muted);cursor:not-allowed;}
  .scaler-count{background:white;min-width:40px;height:30px;display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:500;border-left:1px solid rgba(255,69,0,0.15);border-right:1px solid rgba(255,69,0,0.15);user-select:none;}
  .scaler-badge{font-size:10px;font-weight:500;background:rgba(255,69,0,0.1);color:var(--jiff);padding:2px 7px;border-radius:20px;}
  .scaler-orig{font-size:11px;color:var(--muted);font-weight:300;white-space:nowrap;margin-left:auto;}
  .scaled-highlight{color:var(--jiff);font-weight:500;}

  /* Recipe */
  .expand-btn{margin:0 18px 14px;background:var(--warm);border:1px solid var(--border);border-radius:9px;padding:9px 13px;font-size:12px;font-family:'DM Sans',sans-serif;cursor:pointer;color:var(--ink);font-weight:500;width:calc(100% - 36px);text-align:left;display:flex;justify-content:space-between;align-items:center;transition:all 0.18s;}
  .expand-btn:hover{background:var(--jiff);color:white;border-color:var(--jiff);}
  .recipe{padding:0 18px 18px;border-top:1px solid var(--border);}
  .recipe-sec{font-size:9px;letter-spacing:2px;text-transform:uppercase;color:var(--jiff);font-weight:600;margin:14px 0 8px;}
  .ing-list{list-style:none;}
  .ing-list li{font-size:12px;color:var(--ink);padding:4px 0;border-bottom:1px solid rgba(0,0,0,0.04);display:flex;align-items:center;gap:7px;font-weight:300;}
  .ing-list li::before{content:'·';color:var(--jiff);font-size:18px;line-height:0;flex-shrink:0;}
  .steps-list{counter-reset:step;list-style:none;}
  .steps-list li{font-size:12px;color:var(--ink);padding:7px 0 7px 26px;border-bottom:1px solid rgba(0,0,0,0.04);position:relative;line-height:1.6;font-weight:300;counter-increment:step;display:flex;flex-direction:column;gap:7px;}
  .steps-list li::before{content:counter(step);position:absolute;left:0;top:9px;width:17px;height:17px;background:var(--jiff);color:white;font-size:9px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:600;}
  .step-text{flex:1;}
  .nutr-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:6px;}
  .nutr-item{background:var(--warm);border-radius:8px;padding:8px;text-align:center;}
  .nutr-val{font-family:'Fraunces',serif;font-size:15px;font-weight:700;color:var(--ink);}
  .nutr-lbl{font-size:9px;color:var(--muted);margin-top:2px;text-transform:uppercase;letter-spacing:1px;}
  .collapse-btn{margin-top:10px;width:100%;background:var(--warm);border:1px solid var(--border);border-radius:8px;padding:7px 12px;font-size:12px;font-family:'DM Sans',sans-serif;cursor:pointer;color:var(--muted);display:flex;justify-content:space-between;transition:all 0.18s;}
  .collapse-btn:hover{color:var(--jiff);}

  /* Step timer */
  .step-timer.idle{align-self:flex-start;display:inline-flex;align-items:center;gap:5px;background:rgba(255,69,0,0.08);border:1.5px solid rgba(255,69,0,0.2);border-radius:20px;padding:4px 10px 4px 8px;font-size:11px;font-weight:500;color:var(--timer-idle);cursor:pointer;font-family:'DM Sans',sans-serif;transition:all 0.18s;}
  .step-timer.idle:hover{background:rgba(255,69,0,0.14);border-color:var(--jiff);}
  .step-timer.active{align-self:flex-start;display:inline-flex;align-items:center;gap:9px;background:rgba(45,106,79,0.07);border:1.5px solid rgba(45,106,79,0.2);border-radius:11px;padding:7px 10px;animation:timerPulse 2s ease-in-out infinite;}
  .step-timer.paused{background:var(--warm);border-color:rgba(28,10,0,0.12);animation:none;}
  @keyframes timerPulse{0%,100%{border-color:rgba(45,106,79,0.2)}50%{border-color:rgba(45,106,79,0.5)}}
  .timer-ring-wrap{position:relative;width:40px;height:40px;flex-shrink:0;display:flex;align-items:center;justify-content:center;}
  .timer-ring{width:40px;height:40px;transform:rotate(-90deg);position:absolute;}
  .timer-ring-track{stroke:rgba(45,106,79,0.12);}
  .timer-ring-fill{stroke:var(--timer-active);stroke-linecap:round;transition:stroke-dasharray 1s linear;}
  .step-timer.paused .timer-ring-fill{stroke:var(--muted);}
  .timer-display{font-size:10px;font-weight:600;color:var(--timer-active);position:relative;z-index:1;letter-spacing:-0.5px;}
  .step-timer.paused .timer-display{color:var(--muted);}
  .timer-controls{display:flex;gap:3px;}
  .timer-ctrl-btn{width:26px;height:26px;border-radius:6px;border:none;cursor:pointer;font-size:12px;display:flex;align-items:center;justify-content:center;transition:all 0.15s;}
  .timer-ctrl-btn.play,.timer-ctrl-btn.pause{background:rgba(45,106,79,0.1);color:var(--timer-active);}
  .timer-ctrl-btn.reset{background:rgba(28,10,0,0.06);color:var(--muted);font-size:13px;}
  .step-timer.done{align-self:flex-start;display:inline-flex;align-items:center;gap:7px;background:rgba(29,158,117,0.1);border:1.5px solid rgba(29,158,117,0.3);border-radius:20px;padding:5px 12px 5px 9px;animation:doneFlash 0.4s ease;}
  @keyframes doneFlash{0%{transform:scale(0.9);opacity:0}60%{transform:scale(1.05)}100%{transform:scale(1);opacity:1}}
  .timer-done-icon{font-size:15px;animation:bellShake 0.6s ease 0.1s;}
  @keyframes bellShake{0%,100%{transform:rotate(0)}20%{transform:rotate(-15deg)}40%{transform:rotate(15deg)}60%{transform:rotate(-10deg)}80%{transform:rotate(10deg)}}
  .timer-done-text{font-size:12px;font-weight:600;color:var(--timer-done);}
  .timer-reset-btn{background:none;border:none;color:rgba(29,158,117,0.6);font-size:14px;cursor:pointer;padding:0;line-height:1;}
  .timer-icon{font-size:12px;line-height:1;}
  .timer-idle-label{letter-spacing:0.3px;}

  /* Favourites panel */
  .favs-panel{max-width:860px;margin:0 auto;padding:0 24px;animation:fadeIn 0.25s ease;}
  .favs-panel-header{display:flex;align-items:center;justify-content:space-between;padding:16px 0 12px;border-bottom:1px solid var(--border);margin-bottom:18px;}
  .favs-panel-title{font-family:'Fraunces',serif;font-size:20px;font-weight:900;color:var(--ink);letter-spacing:-0.5px;display:flex;align-items:center;gap:9px;}
  .favs-panel-sub{font-size:12px;color:var(--muted);font-weight:300;margin-top:2px;}
  .favs-close-btn{background:none;border:1.5px solid var(--border-mid);border-radius:8px;padding:6px 13px;font-size:12px;font-family:'DM Sans',sans-serif;font-weight:500;color:var(--muted);cursor:pointer;transition:all 0.18s;}
  .favs-close-btn:hover{border-color:var(--jiff);color:var(--jiff);}
  .favs-empty{text-align:center;padding:40px 24px;border:2px dashed var(--border-mid);border-radius:16px;margin-bottom:28px;}
  .favs-empty-icon{font-size:32px;margin-bottom:10px;}
  .favs-empty-title{font-family:'Fraunces',serif;font-size:17px;font-weight:700;color:var(--ink);margin-bottom:5px;}
  .favs-empty-sub{font-size:13px;color:var(--muted);font-weight:300;}
  .favs-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(320px,1fr));gap:14px;padding-bottom:36px;}

  /* Reset */
  .reset-wrap{text-align:center;padding:0 24px 48px;}
  .reset-btn{background:none;border:1.5px solid var(--border-mid);border-radius:10px;padding:10px 24px;font-size:13px;font-family:'DM Sans',sans-serif;cursor:pointer;color:var(--muted);transition:all 0.18s;}
  .reset-btn:hover{border-color:var(--jiff);color:var(--jiff);}
  .error-wrap{text-align:center;padding:56px 24px;max-width:440px;margin:0 auto;}
  .error-icon{font-size:38px;margin-bottom:12px;}
  .error-title{font-family:'Fraunces',serif;font-size:20px;font-weight:700;color:var(--ink);margin-bottom:7px;}
  .error-msg{font-size:13px;color:var(--muted);margin-bottom:22px;font-weight:300;}

  @media(max-width:700px){
    /* Layout */
    .main-layout{grid-template-columns:1fr;padding:16px 16px 80px;}
    .meals-grid,.favs-grid{grid-template-columns:1fr;padding-left:0;padding-right:0;}
    .results-wrap{padding:16px 16px 80px;}
    /* Cards */
    .card{padding:16px;}
    .nutr-grid{grid-template-columns:repeat(2,1fr);}
    /* Header */
    .header{padding:12px 16px;}
    .header-right{gap:6px;}
    /* Typography scale-down */
    .results-title{font-size:18px;}
    /* Misc */
    .scaler-orig{display:none;}
    .trial-badge{display:none;}
    .gate-plans{grid-template-columns:1fr;}
    .share-actions{flex-direction:column;}
    /* Fridge input full-width */
    .main-form{padding:0;}
    .section-label{font-size:9px;}
    /* Filter pills — horizontal scroll */
    .filter-pills{overflow-x:auto;flex-wrap:nowrap;padding-bottom:4px;}
    /* Meal card actions — stack on mobile */
    .meal-actions-bar{flex-wrap:wrap;gap:6px;}
    /* Auth gate */
    .auth-card{padding:24px 20px;}
    .auth-perks{gap:6px;}
  }
`;

// ── Components → imported from src/components/meal/ ────────────
// ── Festival detection → imported from lib/festival.js ──────

// ── MealCard → extracted to src/components/meal/MealCard.jsx ──────
// ── Main ──────────────────────────────────────────────────────────
// ── LoadingView — shows latency warning after 10s ─────────────────
function LoadingView({ cuisine, mealType, ingredients, isPremium, PAID_RECIPE_CAP, factIdx, loadingMessage }) {
  const FACTS = [
    'Raiding your fridge…','Cross-referencing 50,000+ recipes…',
    'Matching cuisine and flavour profile…','Crunching nutrition numbers…',
    'Preparing 5 great options for you…',
  ];
  const fact = FACTS[factIdx % FACTS.length];

  return (
    <div style={{textAlign:'center',padding:'48px 24px',maxWidth:500,margin:'0 auto'}}>
      {/* CSS Fridge Animation */}
      <div style={{position:'relative',width:200,height:200,margin:'0 auto 28px',display:'flex',alignItems:'center',justifyContent:'center'}}>
        <style>{`
          @keyframes fridgeDoor{0%{transform:perspective(400px) rotateY(0deg)}60%{transform:perspective(400px) rotateY(-75deg)}100%{transform:perspective(400px) rotateY(-75deg)}}
          @keyframes ingredientFly{0%{opacity:0;transform:translate(0,0) scale(0.5)}30%{opacity:1}70%{opacity:1;transform:translate(var(--tx),var(--ty)) scale(1.1)}100%{opacity:0;transform:translate(calc(var(--tx)*2),calc(var(--ty)*2 + 40px)) scale(0.8)}}
          @keyframes plateAppear{0%,50%{opacity:0;transform:scale(0.6) translateY(20px)}75%{opacity:1;transform:scale(1.1) translateY(-5px)}100%{opacity:1;transform:scale(1) translateY(0)}}
          @keyframes steam{0%{opacity:0;transform:translateY(0) scaleX(1)}50%{opacity:0.7;transform:translateY(-15px) scaleX(1.3)}100%{opacity:0;transform:translateY(-30px) scaleX(0.8)}}
          @keyframes pulse{0%,100%{transform:scale(1)}50%{transform:scale(1.05)}}
          .fridge-door{animation:fridgeDoor 0.8s ease-in-out 0.3s both;transform-origin:left center;}
          .ingredient-fly{animation:ingredientFly 1.2s ease-in-out infinite;}
          .plate-appear{animation:plateAppear 0.6s ease-out 1s both;}
          .steam-puff{animation:steam 1.5s ease-out infinite;}
          .fridge-pulse{animation:pulse 2s ease-in-out infinite;}
        `}</style>
        {/* Fridge body */}
        <div className="fridge-pulse" style={{position:'relative',width:90,height:130,background:'#F5F5F5',borderRadius:10,border:'2px solid #E0E0E0',boxShadow:'4px 4px 12px rgba(0,0,0,0.15)',overflow:'visible'}}>
          {/* Fridge door swinging open */}
          <div className="fridge-door" style={{position:'absolute',inset:0,background:'linear-gradient(135deg,#FAFAFA,#E8E8E8)',borderRadius:10,border:'2px solid #D0D0D0',display:'flex',flexDirection:'column',justifyContent:'center',alignItems:'center',gap:6}}>
            <div style={{fontSize:8,color:'#999',fontWeight:700,letterSpacing:'1px'}}>JIFF</div>
            <div style={{width:8,height:22,background:'#C0C0C0',borderRadius:4}}/>
          </div>
          {/* Inside fridge — ingredients */}
          <div style={{position:'absolute',inset:4,display:'flex',flexWrap:'wrap',gap:3,padding:4,alignContent:'flex-start',fontSize:14}}>
            {['🥚','🧅','🫑','🥬','🍅','🧄'].map((e,i)=>(
              <span key={i} style={{lineHeight:1.2}}>{e}</span>
            ))}
          </div>
        </div>
        {/* Flying ingredients */}
        {['🌶️','🧅','🥩','🫛'].map((e,i)=>(
          <span key={i} className="ingredient-fly" style={{
            position:'absolute', fontSize:18, lineHeight:1,
            '--tx': [60,-60,50,-50][i] + 'px',
            '--ty': [-40,-30,-55,-25][i] + 'px',
            animationDelay: (i*0.3) + 's',
            animationDuration: (1.2 + i*0.2) + 's',
          }}>{e}</span>
        ))}
        {/* Plate appearing */}
        <div className="plate-appear" style={{position:'absolute',right:-20,bottom:10,fontSize:42,lineHeight:1,filter:'drop-shadow(0 4px 8px rgba(0,0,0,0.2))'}}>
          🍽️
        </div>
        {/* Steam puffs */}
        {[0,1,2].map(i=>(
          <div key={i} className="steam-puff" style={{
            position:'absolute',right:-10+i*10,bottom:50-i*5,
            width:8,height:8,borderRadius:'50%',
            background:'rgba(200,200,200,0.6)',
            animationDelay:`${i*0.4}s`,
          }}/>
        ))}
      </div>

      <div style={{fontFamily:"'Fraunces',serif",fontSize:'clamp(20px,3.5vw,28px)',fontWeight:900,color:'var(--ink)',letterSpacing:'-0.5px',marginBottom:8}}>
        {loadingMessage}
      </div>
      <div style={{fontSize:13,color:'var(--muted)',fontWeight:300,marginBottom:20,minHeight:20}}>{fact}</div>
      {isPremium && (
        <div style={{display:'inline-flex',alignItems:'center',gap:6,background:'rgba(255,69,0,0.08)',borderRadius:20,padding:'4px 14px',fontSize:11,color:'var(--jiff)',fontWeight:500}}>
          ⚡ Generating {PAID_RECIPE_CAP} recipes
        </div>
      )}
    </div>
  );
}


const TILE_LOADING_MSGS = {
  family:   'Planning for the whole family... 👨‍👩‍👧',
  hosting:  'Preparing an impressive spread... 🎉',
  mood:     'Finding something that matches your vibe... 😊',
  seasonal: 'Pulling in what\'s fresh right now... 🌿',
  weather:  'Picking recipes for today\'s weather... 🌤️',
  goal:     'Finding recipes that work for your goal... 🎯',
  discover: 'Getting that recipe ready... ⚡',
  planner:  'Building your 7-day menu... 📅',
  trending: 'Grabbing a trending recipe... 🔥',
  regional: "Exploring this week's region... 🌍",
  festival: 'Bringing in the festival flavours... 🎉',
};

export default function Jiff() {
  const navigate = useNavigate();
  const location = useLocation();
  const generateContextFromNav = location.state?.generateContext || null;
  const { user, profile, pantry, favourites, toggleFavourite, isFav, signInWithGoogle, signInWithEmail, signOut, supabaseEnabled, authLoading } = useAuth();
  const { isPremium, trial, trialActive, trialExpired, trialDaysLeft, recipeCount, plans, checkAccess, recordUsage, startTrial, openCheckout, activateTestPremium, showGate, setShowGate, gateReason, razorpayEnabled, TRIAL_DAYS, PAID_RECIPE_CAP } = usePremium();
  const { lang, units, setUnits, setLang, t, country, setCountry, CUISINE_OPTIONS, TIME_OPTIONS, DIET_OPTIONS, INDIAN_CUISINES, GLOBAL_CUISINES, supportedLanguages } = useLocale();

  const [fridgeItems,  setFridgeItems]  = useState([]);
  const [pantryItems,  setPantryItems]  = useState([]);
  // ingredients = merged fridgeItems + pantryItems — used for API calls
  const ingredients = [...new Set([...fridgeItems, ...pantryItems])];
  const setIngredients = (val) => {
    // Legacy setter: used by reset and history re-use — splits back into fridge
    if (typeof val === 'function') {
      setFridgeItems(prev => val([...new Set([...prev, ...pantryItems])]).filter(i => !pantryItems.includes(i)));
    } else {
      setFridgeItems(val.filter(i => !pantryItems.includes(i)));
    }
  };
  const [time,         setTime]         = useState('30 min');
  const [diet,         setDiet]         = useState('none');
  const [cuisine,      setCuisine]      = useState('any');
  // Auto-detect meal type from local time (item m) — user can override
  const getDefaultMealType = () => {
    const h = new Date().getHours();
    if (h >= 5  && h < 11)  return 'breakfast';
    if (h >= 11 && h < 15)  return 'lunch';
    if (h >= 15 && h < 18)  return 'snack';
    if (h >= 18 && h < 22)  return 'dinner';
    return 'any';
  };
  const [mealType,     setMealType]     = useState(getDefaultMealType);
  const [defaultServings, setDefaultServings] = useState(2);
  const [view,         setView]         = useState('input');
  const [meals,        setMeals]        = useState([]);
  const [factIdx,      setFactIdx]      = useState(0);
  const [errorMsg,     setErrorMsg]     = useState('');
  const [emailInput,   setEmailInput]   = useState('');
  const [emailSent,    setEmailSent]    = useState(false);
  const [pantryLoaded, setPantryLoaded] = useState(false);
  const [gatePlan,     setGatePlan]     = useState('annual');
  const [gateLoading,  setGateLoading]  = useState(false);
  const [showUserMenu,       setShowUserMenu]       = useState(false);
  const [gateDismissed,      setGateDismissed]      = useState(false);
  const [showNotifications,  setShowNotifications]  = useState(false);
  const [notifications,      setNotifications]      = useState([]);
  const [unreadCount,        setUnreadCount]        = useState(0);

  const timerRef = useRef(null);

  // Pre-fill pantry on load into pantryItems
  useEffect(() => {
    if (!pantryLoaded && pantry?.length) { setPantryItems(pantry); setPantryLoaded(true); }
  }, [pantry, pantryLoaded]);

  // Pre-fill diet + cuisine from saved profile preferences
  const [profileLoaded, setProfileLoaded] = useState(false);
  const [streak,         setStreak]         = useState(0);
  // POTENTIAL_DEAD_CODE: showSurprise state declared but never set — safe to remove
  const [showSurprise,   setShowSurprise]   = useState(false);
  const [familySelected, setFamilySelected] = useState([]);  // [] = everyone
  const [pantryNudge,    setPantryNudge]    = useState([]);   // items used in last generation
  const [showSeasonalPicker, setShowSeasonalPicker] = useState(false);
  const [journeyMode,    setJourneyMode]    = useState(false);
  const [inputMode,      setInputMode]      = useState('direct'); // 'direct' | 'fridge' | 'leftover'
  const [loadingMessage, setLoadingMessage] = useState('Finding your perfect recipes... ⚡'); // starts false; set true after user loads
  const [ratings,        setRatings]        = useState(()=>{ try{ return JSON.parse(localStorage.getItem('jiff-ratings')||'{}'); }catch{return {};} });
  // SUPABASE_SYNC: ratings from meal_history loaded in useEffect below
  const season = getCurrentSeason();
  useEffect(() => {
    if (profile && !profileLoaded) {
      // Pre-fill dietary from food_type
      const ft = Array.isArray(profile.food_type) ? profile.food_type[0] : profile.food_type;
      if (ft === 'vegan') setDiet('vegan');
      else if (ft === 'veg' || ft === 'eggetarian' || ft === 'jain') setDiet('vegetarian');
      // Pre-fill cuisine — use first preferred cuisine as default
      if (profile.preferred_cuisines?.length) setCuisine(profile.preferred_cuisines[0]);
      setProfileLoaded(true);
    }
  }, [profile, profileLoaded]);

  // h. Non-veg detection — if non-veg ingredient added, disable vegetarian diet
  const NON_VEG_INGREDIENTS = new Set([
    'chicken','mutton','beef','pork','lamb','fish','salmon','tuna','prawn','shrimp',
    'crab','squid','egg','eggs','bacon','meat','seafood','anchovy','pepperoni',
    'sausage','ham','turkey','duck','venison','goat','sardine','mackerel','tilapia',
  ]);
  const hasNonVeg = ingredients.some(i => NON_VEG_INGREDIENTS.has(i.toLowerCase().trim()));
  useEffect(() => {
    if (hasNonVeg && diet === 'vegetarian') setDiet('none');
  }, [hasNonVeg, diet]);

  // Start trial when user first signs in
  useEffect(() => {
    if (user && !trial && !isPremium) startTrial(user.id);
  }, [user, trial, isPremium, startTrial]);

  useEffect(() => {
    if (view === 'loading') timerRef.current = setInterval(() => setFactIdx(f => (f + 1) % FACTS.length), 1400);
    return () => clearInterval(timerRef.current);
  }, [view]);

  // ── Surprise me — one tap, profile-based, no fridge input ─────────
  const handleSurprise = async () => {
    if (!checkAccess('generation')) return;
    setView('loading'); setFactIdx(0); ;
    try {
      const count = isPremium ? PAID_RECIPE_CAP : 1;
      const surpriseMealType = getDefaultMealType();
      const surpriseCuisine = profile?.preferred_cuisines?.length
        ? profile.preferred_cuisines[Math.floor(Math.random() * profile.preferred_cuisines.length)]
        : 'any';
      const res = await fetch('/api/suggest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ingredients: pantry?.length ? pantry : season.items.slice(0,4),
          time, diet, cuisine: surpriseCuisine, mealType: surpriseMealType,
          defaultServings, count, language: lang, units,
          tasteProfile: profile ? {
            spice_level: profile.spice_level, allergies: profile.allergies,
            preferred_cuisines: profile.preferred_cuisines, skill_level: profile.skill_level,
          } : null,
          familyMembers: (() => {
            const members = Array.isArray(profile?.family_members) ? profile.family_members : [];
            if (!members.length || familySelected.includes('all') || !familySelected.length) return [];
            return familySelected.map(i => members[i]).filter(Boolean);
          })(),
          surpriseMode: true,
        }),
      });
      const data = await res.json();
      if (data.meals?.length > 0) {
        setMeals(Array.isArray(data.meals) ? data.meals : []); setView('results'); recordUsage();
        setCuisine(surpriseCuisine); setMealType(surpriseMealType);
      } else { setErrorMsg(data.error||'Could not generate suggestions.'); setView('error'); }
    } catch { setErrorMsg('Connection error. Please try again.'); setView('error'); }
  };

  // ── Reusable streak + history helpers ───────────────────────────
  const updateStreak = () => {
    try {
      const today = new Date().toDateString();
      const stored = JSON.parse(localStorage.getItem('jiff-streak') || '{}');
      const yesterday = new Date(Date.now() - 86400000).toDateString();
      const newCount = stored.lastDate === yesterday ? (stored.count || 0) + 1 : 1;
      try { localStorage.setItem('jiff-streak', JSON.stringify({ count: newCount, lastDate: today })); } catch {}
      setStreak(newCount);
      if (user) {
        // Write streak to Supabase profiles.streak (Phase 8)
        fetch('/api/admin?action=update-streak', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: user.id, streak: newCount, lastCooked: new Date().toISOString() }),
        }).catch(() => {});
      }
    } catch {}
  };

  const saveToHistory = (generatedMeals) => {
    if (!user || !generatedMeals?.length) return;
    fetch('/api/admin?action=meal-history', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: user.id, meals: generatedMeals,
        mealType, cuisine, servings: defaultServings,
        ingredients: [...new Set([...fridgeItems, ...pantryItems])],
        generated_at: new Date().toISOString(),
      }),
    }).catch(() => {});
  };

  // ── Handle navigation state from Discover page ──────────────────
  useEffect(() => {
    if (generateContextFromNav && user) {
      handleGenerateDirect(generateContextFromNav);
    }
  }, []); // eslint-disable-line

  // ── One-tap generation from journey tiles ────────────────────────
  const handleGenerateDirect = async (context = {}) => {
    // Set contextual loading message
    const msgKey = context.mood ? 'mood' : context.seasonal ? 'seasonal'
      : context.weather ? 'weather' : context.hosting ? 'hosting'
      : context.family ? 'family' : context.goal ? 'goal'
      : context.type || 'discover';
    setLoadingMessage(TILE_LOADING_MSGS[msgKey] || 'Finding your perfect recipes... ⚡');
    if (!user) { setGateDismissed(false); return; }
    if (!checkAccess('generation')) return;

    // Apply tile context
    if (context.cuisine)  setCuisine(context.cuisine);
    if (context.mealType && context.mealType !== 'any') setMealType(context.mealType);
    if (context.servings) setDefaultServings(context.servings);

    // Build a smart ingredient list from pantry + profile for one-tap
    const tileIngredients = pantryItems.length > 0
      ? pantryItems
      : ['rice', 'onion', 'tomato', 'oil', 'salt', 'chilli'];  // Indian pantry defaults

    // Inject context into prompt
    const cuisineCtx = context.hosting
      ? 'Indian hosting and entertaining — impressive dishes that feed 8–12 people, can be partially prepped ahead, visually striking. Include a starter, main, and dessert option in the recipe suggestions.'
      : context.family
        ? 'family meal — suitable for all ages and dietary preferences in the household'
        : context.goalContext?.prompt
          ? context.goalContext.prompt
          : context.moodContext?.prompt
            ? context.moodContext.prompt + ' — cuisine: ' + (context.moodContext.cuisineWeight || 'any')
            : context.seasonal
              ? 'seasonal dishes using ' + (context.season?.items?.slice(0,3).join(', ') || 'seasonal produce')
              : context.mealType || 'any';

    setView('loading'); setFactIdx(0); ; setJourneyMode(false);
    setLoadingMessage('Checking what you can make... 🧊');
    try {
      const count = isPremium ? PAID_RECIPE_CAP : 1;
      const res = await fetch('/api/suggest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ingredients: tileIngredients,
          time, diet,
          cuisine: cuisineCtx,
          mealType: context.mealType || mealType,
          kidsMode: false,
          count,
          country, lang,
          ...(profile?.food_type ? { dietHint: profile.food_type } : {}),
          ...(context.hosting ? { servings: 10 } : {}),
        }),
      });
      const data = await res.json();
      if (data.error) { setErrorMsg(data.error); setView('input'); return; }
      const resultMeals = Array.isArray(data.meals) ? data.meals : data.meals?.meals || [];
      setMeals(resultMeals);
      updateStreak();
      saveToHistory(resultMeals);
      setView('results');
    } catch (err) {
      setErrorMsg('Something went wrong. Please try again.');
      setView('input');
    }
  };

  const handleLeftoverRescue = () => {
    setJourneyMode(false);
    setInputMode('leftover');
    setFridgeItems(['leftover rice', 'leftover curry']);
    setLoadingMessage('Rescuing your leftovers... ♻️');
    setView('input');
  };

  const handleSubmit = async () => {
    if (!ingredients.length) return;
    // Mandate sign-in before any generation
    if (!user) { setGateDismissed(false); return; }
    if (!checkAccess('generation')) return;
    setView('loading'); setFactIdx(0); ;
    try {
      const count = isPremium ? PAID_RECIPE_CAP : 1; // trial = 1 recipe
      const res = await fetch('/api/suggest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ingredients, time, diet, cuisine, mealType,
          defaultServings, count,
          language: lang, units,
          tasteProfile: profile ? {
            spice_level: profile.spice_level,
            allergies: profile.allergies,
            preferred_cuisines: profile.preferred_cuisines,
            skill_level: profile.skill_level,
          } : null,
        }),
      });
      const data = await res.json();
      if (data.meals?.length > 0) {
        setMeals(Array.isArray(data.meals) ? data.meals : []);
        setView('results');
        recordUsage();
        if (typeof window !== 'undefined' && window._jiffGA) {
          window._jiffGA('meal_generated', { cuisine, mealType, ingredient_count: ingredients.length, is_premium: isPremium });
        }
        updateStreak();

        // ── Pantry nudge — items used from pantry ────────────────────
        const usedFromPantry = (pantry || []).filter(p =>
          data.meals?.[0]?.ingredients?.some(ing => ing.toLowerCase().includes(p.toLowerCase()))
        );
        if (usedFromPantry.length) setPantryNudge(usedFromPantry.slice(0, 4));

        // Auto-save to meal history (localStorage + API)
        const histEntry = {
          id: Date.now().toString(),
          meal: data.meals,  // 'meal' matches Supabase schema and History.jsx
          mealType, cuisine,
          servings: defaultServings,
          ingredients,
          generated_at: new Date().toISOString(),
        };
        // jiff-history migrated to Supabase meal_history (localStorage write removed)
        if (user) {
          fetch('/api/admin?action=meal-history', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: user.id, meals: data.meals, mealType, cuisine, servings: defaultServings, ingredients }),
          }).catch(() => {});
        }
      }
      else { setErrorMsg(data.error||'Could not generate suggestions.'); setView('error'); }
    } catch { setErrorMsg('Connection error. Please try again.'); setView('error'); }
  };

  const handleEmailSignIn = async () => {
    const { error } = await signInWithEmail(emailInput);
    if (!error) setEmailSent(true);
  };

  const handleGateUpgrade = async () => {
    if (!razorpayEnabled) { activateTestPremium(); return; }
    setGateLoading(true);
    try { await openCheckout(gatePlan); setShowGate(false); }
    catch (e) { if (e.message !== 'dismissed') alert('Payment failed — please try again.'); }
    finally { setGateLoading(false); }
  };

  // Session security: clear auth state on tab/browser close
  // Uses sessionStorage (cleared on close) to track the session flag
  useEffect(() => {
    if (user) sessionStorage.setItem('jiff-session-active', '1');
    else sessionStorage.removeItem('jiff-session-active');
  }, [user]);

  // Activate journey picker + check onboarding on first login
  useEffect(() => {
    if (user && view === 'input') {
      setJourneyMode(true);
      // Check if onboarding is needed (profile.onboarding_done not set)
      if (profile && !profile.onboarding_done && !sessionStorage.getItem('jiff-onboarding-shown')) {
        sessionStorage.setItem('jiff-onboarding-shown', '1');
        navigate('/onboarding');
      }
    }
  }, [user]); // eslint-disable-line

  useEffect(() => {
    const handleUnload = () => {
      try {
        sessionStorage.removeItem('jiff-session-active');
        if (user && supabaseEnabled) {
          // Best-effort Supabase signout on close
          const sb = window._supabaseClient;
          if (sb) sb.auth.signOut();
        }
      } catch {}
    };
    window.addEventListener('beforeunload', handleUnload);
    // Also handle visibility change (tab hidden / app backgrounded)
    const handleVisibility = () => {
      if (document.visibilityState === 'hidden') handleUnload();
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => {
      window.removeEventListener('beforeunload', handleUnload);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [user, supabaseEnabled]);

  // ── Notifications — load broadcasts + system messages ────────────
  useEffect(() => {
    const loadNotifications = async () => {
      const readKey = 'jiff-read-notifs';
      const readIds = new Set(JSON.parse(localStorage.getItem(readKey) || '[]'));
      // Also sync with Supabase last_notification_read_at if available
      const all = [];

      // System notifications — streak, tips
      const streakData = JSON.parse(localStorage.getItem('jiff-streak') || '{}');
      if (streakData.count >= 3) {
        all.push({ id:'streak-'+streakData.count, type:'achievement', icon:'🔥',
          title:`${streakData.count}-day cooking streak!`, body:"Keep it up — you're building a great habit.", ts: Date.now()-1000 });
      }
      all.push({ id:'tip-season', type:'tip', icon:'🌿',
        title:'Seasonal produce available', body:'Check the seasonal suggestions at the top of the page for the freshest ingredients.', ts: Date.now()-2000 });

      // Broadcast messages from Supabase (if connected)
      if (supabaseEnabled) {
        try {
          const { supabase } = await import('../lib/supabase');
          const { data } = await supabase
            .from('broadcasts').select('id,message,created_at').eq('active', true)
            .order('created_at', { ascending: false }).limit(10);
          (data || []).forEach(b => all.push({
            id: 'bc-'+b.id, type:'broadcast', icon:'📢',
            title:'From Jiff', body: b.message, ts: new Date(b.created_at).getTime(),
          }));
        } catch {}
      }

      // Sort newest first, mark read status
      all.sort((a,b) => b.ts - a.ts);
      const withRead = all.map(n => ({ ...n, read: readIds.has(n.id) }));
      setNotifications(withRead);
      setUnreadCount(withRead.filter(n => !n.read).length);
    };
    loadNotifications();
  }, [user, supabaseEnabled, streak]);

  const markAllRead = () => {
    const ids = (Array.isArray(notifications)?notifications:[]).map(n => n.id);
    localStorage.setItem('jiff-read-notifs', JSON.stringify(ids));
    setNotifications(ns => ns.map(n => ({ ...n, read: true })));
    setUnreadCount(0);
    // Sync last-read timestamp to Supabase profiles.last_notification_read_at
    if (user) {
      const sbUrl = process.env.REACT_APP_SUPABASE_URL;
      const anonKey = process.env.REACT_APP_SUPABASE_ANON_KEY;
      if (sbUrl && anonKey) {
        fetch(`${sbUrl}/rest/v1/profiles?id=eq.${user.id}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'apikey': anonKey,
            'Authorization': `Bearer ${anonKey}`,
            'Prefer': 'return=minimal',
          },
          body: JSON.stringify({ last_notification_read_at: new Date().toISOString() }),
        }).catch(() => {});
      }
    }
  };

  // ── Streak tracking ──────────────────────────────────────────────
  useEffect(() => {
    // Read streak from Supabase profile (primary) or localStorage (guest fallback)
    try {
      if (profile?.streak) {
        setStreak(profile.streak);
      } else {
        const today = new Date().toDateString();
        const data  = JSON.parse(localStorage.getItem('jiff-streak') || '{}');
        const last  = data.lastDate;
        const yesterday = new Date(Date.now() - 86400000).toDateString();
        if (last === today || last === yesterday) {
          setStreak(data.count || 1);
        } else {
          setStreak(0);
        }
      }
    } catch {}
  }, [profile]);

  // ── Sync ratings from Supabase meal_history ──────────────────────
  useEffect(() => {
    if (!user) return;
    fetch('/api/admin?action=meal-history&userId=' + user.id, { method:'GET' })
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (!Array.isArray(data?.history)) return;
        const supaRatings = {};
        data.history.forEach(m => {
          if (m.meal_name && m.rating) supaRatings[m.meal_name] = m.rating;
        });
        if (Object.keys(supaRatings).length > 0) {
          setRatings(prev => {
            const merged = { ...prev, ...supaRatings };
            try { localStorage.setItem('jiff-ratings', JSON.stringify(merged)); } catch {}
            return merged;
          });
        }
      })
      .catch(() => {});
  }, [user]);

  const reset = () => { setView('input'); setMeals([]); setFridgeItems([]); setPantryItems(pantry||[]); ; setPantryLoaded(true); };

  // Profile prefs for sidebar
  const profilePrefs = profile ? [
    { key: 'Spice',          val: profile.spice_level || 'Medium' },
    { key: 'Dietary',        val: getDietaryLabel(profile.food_type) },
    { key: 'Cooking Skill',  val: profile.skill_level || 'Intermediate' },
  ] : [];

  // Show mandatory sign-in gate
  const showSignInGate = !authLoading && !user && !gateDismissed;

  return (
    <>
      <style>{styles}</style>
      <div className="app">

        {/* ── Mandatory sign-in gate ── */}
        {showSignInGate && (
          <div className="auth-gate">
            <div className="auth-card" style={{position:'relative'}}>
              <button onClick={()=>navigate('/')}
                style={{position:'absolute',top:16,right:16,background:'none',border:'none',
                  fontSize:20,cursor:'pointer',color:'rgba(28,10,0,0.3)',lineHeight:1,padding:4}}>
                ✕
              </button>
              <div className="auth-icon">⚡</div>
              <div className="auth-title">{t('auth_title')}</div>
              <div className="auth-sub">Sign in to start your free {TRIAL_DAYS}-day trial. No credit card needed.</div>
              <div className="auth-perks">
                <div className="auth-perk"><div className="auth-perk-icon">🎁</div>Free {TRIAL_DAYS}-day trial — full access</div>
                <div className="auth-perk"><div className="auth-perk-icon">☁️</div>{t('auth_perk_favs')}</div>
                <div className="auth-perk"><div className="auth-perk-icon">👤</div>{t('auth_perk_taste')}</div>
                <div className="auth-perk"><div className="auth-perk-icon">🔒</div>No spam — ever</div>
              </div>
              {supabaseEnabled ? (
                <>
                  <button className="auth-google-btn" onClick={signInWithGoogle}>
                    <span style={{fontSize:18}}>G</span> Continue with Google
                  </button>
                  {emailSent ? (
                    <div className="auth-magic">✓ Check your email for the magic link!</div>
                  ) : (
                    <div className="auth-email-row">
                      <input className="auth-email-input" placeholder="Or enter your email" value={emailInput} onChange={e=>setEmailInput(e.target.value)} onKeyDown={e=>e.key==='Enter'&&handleEmailSignIn()}/>
                      <button className="auth-email-go" onClick={handleEmailSignIn}>{t('auth_send')}</button>
                    </div>
                  )}
                </>
              ) : (
                <button className="auth-google-btn" onClick={activateTestPremium} style={{background:'var(--ink)'}}>
                  Continue as guest (dev mode)
                </button>
              )}
            </div>
          </div>
        )}

        {/* ── Upgrade gate modal ── */}
        {showGate && (
          <div className="gate-overlay" onClick={()=>setShowGate(false)}>
            <div className="gate-card" onClick={e=>e.stopPropagation()}>
              <div className="gate-icon">{gateReason==='trial_expired'?'⏰':'⚡'}</div>
              <div className="gate-title">{gateReason==='trial_expired'?'Your free trial has ended':'Unlock full access'}</div>
              <div className="gate-sub">
                {gateReason==='trial_expired'
                  ? 'Your 7-day free trial is complete. Choose a plan to continue cooking with Jiff.'
                  : `Get ${PAID_RECIPE_CAP} recipes per search, unlimited weekly plans, cloud sync, and more.`}
              </div>
              <div className="gate-plans">
                {Object.values(plans).map(plan=>(
                  <div key={plan.id} className={'gate-plan ' + (gatePlan===plan.id?'selected':'')} onClick={()=>setGatePlan(plan.id)}>
                    <div className="gate-plan-price">{plan.price}</div>
                    <div className="gate-plan-label">{plan.label}<br/>{plan.period}</div>
                    {plan.saving&&<div className="gate-plan-saving">{plan.saving}</div>}
                  </div>
                ))}
              </div>
              <button className="gate-cta" disabled={gateLoading} onClick={handleGateUpgrade}>
                {gateLoading?'⏳ Processing…':'⚡ Upgrade now'}
              </button>
              {gateReason==='trial_expired'&&<button className="gate-skip" onClick={()=>navigate('/')}>← Home</button>}
              {!razorpayEnabled&&<div style={{fontSize:11,color:'var(--muted)',marginTop:8}}>Test mode — click to activate free premium</div>}
            </div>
          </div>
        )}

        {/* ── Header ── */}
        <header className="header">
          <JiffLogo size="md" spinning={view==='loading'} onClick={()=>navigate('/')} />
          <div className="header-right">
            {/* Desktop-only nav links — hidden on mobile where BottomNav is used */}
            <button className="hdr-btn desktop-only" onClick={()=>navigate('/discover')}
              style={{fontFamily:"'DM Sans',sans-serif"}}>🌟 Discover</button>
            <button className="hdr-btn desktop-only" onClick={()=>{if(!user){alert('Sign in to view your favourites.');return;}navigate('/favs');}}
              style={{fontFamily:"'DM Sans',sans-serif"}}>❤️ Favourites</button>
            {trialActive && <div className="trial-badge">⏳ Trial: {trialDaysLeft}d left</div>}
            {user && !isPremium && <button className="hdr-btn premium" onClick={()=>navigate('/pricing')}>⚡ {t('go_premium')}</button>}
            <button className="hdr-btn" onClick={()=>navigate('/profile', { state:{ tab:'settings' } })}
              title="Settings"
              style={{padding:'6px 10px',fontSize:16,lineHeight:1}}>
              ⚙️
            </button>
            {/* ── Notification bell ── */}
            {user && (
              <div style={{position:'relative'}}>
                <button className="notif-btn" onClick={()=>{setShowNotifications(p=>!p);if(showNotifications)markAllRead();}}>
                  🔔
                  {unreadCount > 0 && <span className="notif-badge">{unreadCount > 9 ? '9+' : unreadCount}</span>}
                </button>
                {showNotifications && (
                  <>
                    <div onClick={()=>{setShowNotifications(false);markAllRead();}} style={{position:'fixed',inset:0,zIndex:199}}/>
                    <div className="notif-panel">
                      <div className="notif-header">
                        <span style={{fontFamily:"'Fraunces',serif",fontSize:14,fontWeight:700,color:'var(--ink)'}}>Notifications</span>
                        <div style={{display:'flex',alignItems:'center',gap:8,marginLeft:'auto'}}>
                          {unreadCount > 0 && (
                            <button onClick={markAllRead} style={{background:'none',border:'none',fontSize:11,color:'var(--jiff)',cursor:'pointer',fontFamily:"'DM Sans',sans-serif",fontWeight:500}}>
                              Mark all read
                            </button>
                          )}
                          <button onClick={()=>{setShowNotifications(false);markAllRead();}}
                            style={{background:'none',border:'none',fontSize:16,cursor:'pointer',color:'rgba(28,10,0,0.35)',padding:'0 2px',lineHeight:1}}>
                            ✕
                          </button>
                        </div>
                      </div>
                      <div style={{maxHeight:380,overflowY:'auto'}}>
                        {notifications.length === 0 ? (
                          <div className="notif-empty">
                            <div style={{fontSize:28,marginBottom:8}}>🔔</div>
                            No notifications yet
                          </div>
                        ) : (Array.isArray(notifications)?notifications:[]).map(n => (
                          <div key={n.id} className={'notif-item ' + (n.read ? '' : 'unread')}>
                            <span style={{fontSize:20,lineHeight:1,marginTop:2,flexShrink:0}}>{n.icon}</span>
                            <div style={{flex:1,minWidth:0}}>
                              <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',gap:6,marginBottom:2}}>
                                <span style={{fontSize:12,fontWeight:n.read?400:600,color:'var(--ink)'}}>{n.title}</span>
                                {!n.read && <span style={{width:6,height:6,borderRadius:'50%',background:'var(--jiff)',flexShrink:0}}/>}
                              </div>
                              <p style={{fontSize:11,color:'var(--muted)',fontWeight:300,lineHeight:1.5,margin:0}}>{n.body}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}

            {user && (
              <div style={{position:'relative'}}>
                {/* Avatar button */}
                <button
                  onClick={()=>setShowUserMenu(p=>!p)}
                  style={{display:'flex',alignItems:'center',gap:7,padding:'5px 10px',borderRadius:20,border:'1.5px solid rgba(28,10,0,0.18)',background:'white',cursor:'pointer',fontFamily:"'DM Sans',sans-serif",fontSize:13,fontWeight:500,color:'#1C0A00',transition:'all 0.15s'}}>
                  {/* Initials circle */}
                  <span style={{width:26,height:26,borderRadius:'50%',background:'#FF4500',color:'white',display:'inline-flex',alignItems:'center',justifyContent:'center',fontSize:11,fontWeight:700,flexShrink:0,lineHeight:1}}>
                    {(profile?.name||'U').charAt(0).toUpperCase()}
                  </span>
                  <span>{profile?.name?.split(' ')[0]||t('profile_nav')}</span>
                  <span style={{fontSize:9,color:'#7C6A5E'}}>▼</span>
                </button>
                {/* Dropdown menu */}
                {showUserMenu && (
                  <div onClick={()=>setShowUserMenu(false)} style={{position:'fixed',inset:0,zIndex:99}} />
                )}
                {showUserMenu && (
                  <div style={{position:'absolute',right:0,top:'calc(100% + 6px)',background:'white',border:'1px solid rgba(28,10,0,0.12)',borderRadius:12,boxShadow:'0 8px 24px rgba(28,10,0,0.12)',minWidth:180,zIndex:100,overflow:'hidden',fontFamily:"'DM Sans',sans-serif"}}>
                    <div style={{padding:'10px 14px',borderBottom:'1px solid rgba(28,10,0,0.07)',fontSize:11,color:'#7C6A5E',fontWeight:300}}>
                      {user.email}
                    </div>
                    {[
                      {label:'👤 My Profile',    action:()=>navigate('/profile')},
                      {label:'📜 History',        action:()=>navigate('/history')},
                      {label:'📊 Insights',       action:()=>navigate('/insights')},
                      {label:'💬 Send feedback',  action:()=>{ setShowUserMenu(false); document.querySelector('.feedback-tab-btn')?.click(); }},
                    ].map(item=>(
                      <button key={item.label} onClick={()=>{item.action();setShowUserMenu(false);}}
                        style={{width:'100%',padding:'10px 14px',border:'none',background:'white',cursor:'pointer',textAlign:'left',fontSize:13,color:'#1C0A00',fontWeight:400,fontFamily:"'DM Sans',sans-serif",borderBottom:'1px solid rgba(28,10,0,0.05)',transition:'background 0.1s'}}
                        onMouseEnter={e=>e.target.style.background='rgba(255,69,0,0.05)'}
                        onMouseLeave={e=>e.target.style.background='white'}>
                        {item.label}
                      </button>
                    ))}
                    <button onClick={()=>{signOut();setShowUserMenu(false);navigate('/');}}
                      style={{width:'100%',padding:'10px 14px',border:'none',background:'white',cursor:'pointer',textAlign:'left',fontSize:13,color:'#E53E3E',fontWeight:500,fontFamily:"'DM Sans',sans-serif",transition:'background 0.1s'}}
                      onMouseEnter={e=>e.target.style.background='rgba(229,62,62,0.05)'}
                      onMouseLeave={e=>e.target.style.background='white'}>
                      🚪 Sign out
                    </button>
                  </div>
                )}
              </div>
            )}

          </div>
        </header>



        {/* ── Journey picker home screen ── */}
        {journeyMode && user && view === 'input' && (
          <JourneyTiles
            profile={profile}
            season={season}
            streak={streak}
            onSelectFridge={() => { setJourneyMode(false); setInputMode('fridge'); setLoadingMessage('Checking what you can make... 🧊'); }}
            onGenerateDirect={handleGenerateDirect}
            onLeftoverRescue={handleLeftoverRescue}
          />
        )}

        {/* ── Input view ── */}
        {(!journeyMode || !user) && view === 'input' && (
          <div className="main-layout">
            <div className="main-form">
              {user && (
                <button onClick={()=>{ setJourneyMode(true); setInputMode('direct'); }}
                  style={{display:'inline-flex',alignItems:'center',gap:5,marginBottom:14,
                    background:'none',border:'none',cursor:'pointer',fontSize:12,
                    color:'var(--muted)',fontFamily:"'DM Sans',sans-serif",padding:0}}>
                  ← Home
                </button>
              )}
              {/* Post-login profile completion banner */}
              {user && profile && !profile.spice_level && !profile.preferred_cuisines?.length &&
               !sessionStorage.getItem('jiff-prefs-dismissed') && (
                <div style={{background:'rgba(255,69,0,0.07)',border:'1.5px solid rgba(255,69,0,0.25)',borderRadius:12,padding:'12px 16px',marginBottom:16,display:'flex',alignItems:'flex-start',justifyContent:'space-between',gap:12,flexWrap:'wrap'}}>
                  <div>
                    <div style={{fontSize:13,fontWeight:500,color:'#CC3700',marginBottom:2}}>👋 Personalise your experience</div>
                    <div style={{fontSize:12,color:'#CC3700',fontWeight:300}}>Set your food type, cuisine and pantry so every recipe is tailored to you.</div>
                  </div>
                  <div style={{display:'flex',gap:8,flexShrink:0}}>
                    <button onClick={()=>navigate('/profile')} style={{background:'#CC3700',color:'white',border:'none',borderRadius:8,padding:'7px 14px',fontSize:12,fontWeight:500,cursor:'pointer',fontFamily:"'DM Sans',sans-serif",whiteSpace:'nowrap'}}>
                      Set up profile →
                    </button>
                    <button onClick={e=>{e.stopPropagation();sessionStorage.setItem('jiff-prefs-dismissed','1');e.target.closest('[data-dismiss]').remove();}}
                      data-dismiss="1"
                      style={{background:'none',border:'1px solid rgba(204,55,0,0.3)',borderRadius:8,padding:'7px 10px',fontSize:12,color:'#CC3700',cursor:'pointer',fontFamily:"'DM Sans',sans-serif",whiteSpace:'nowrap'}}>
                      Later
                    </button>
                  </div>
                </div>
              )}
              {/* ── Direct mode: show SmartGreeting + streak + heading ── */}
              {inputMode === 'direct' && (
                <>
                  {user && (
                    <SmartGreeting
                      user={user}
                      profile={profile}
                      onCountryDetected={(code) => setCountry(code)}
                      onSuggestRecipe={(suggestion, autoMealType) => {
                        if (autoMealType && autoMealType !== 'any') setMealType(autoMealType);
                        if (suggestion?.dish) {
                          setFridgeItems(prev => prev.includes(suggestion.dish.toLowerCase()) ? prev : [...prev, suggestion.dish.toLowerCase()]);
                        }
                        setTimeout(() => { if (ingredients.length || suggestion?.dish) handleSubmit(); }, 100);
                      }}
                    />
                  )}
                  <div style={{display:'flex',gap:8,flexWrap:'wrap',marginBottom:12,alignItems:'center'}}>
                    {streak >= 2 && (
                      <div style={{display:'inline-flex',alignItems:'center',gap:5,background:'rgba(255,69,0,0.08)',borderRadius:20,padding:'4px 12px',fontSize:11,color:'var(--jiff)',fontWeight:500}}>
                        🔥 {streak}-day streak!
                      </div>
                    )}
                  </div>
                  <div style={{marginBottom:6}}>
                    <h1 style={{fontFamily:"'Fraunces', serif",fontSize:'clamp(26px,4vw,40px)',fontWeight:900,color:'var(--ink)',letterSpacing:'-1px',lineHeight:1.05,marginBottom:6}}>
                      {t('main_heading')}
                    </h1>
                    <p style={{fontSize:13,color:'var(--muted)',fontWeight:300,marginBottom:20}}>
                      {isPremium ? '⚡ Premium · ' + PAID_RECIPE_CAP + ' recipes per search' : trialActive ? '🎁 Free trial · 1 recipe preview · ' + trialDaysLeft + ' days left' : ''}
                    </p>
                  </div>
                </>
              )}

              {/* ── Fridge mode: clean minimal header ── */}
              {inputMode === 'fridge' && (
                <div style={{marginBottom:16}}>
                  <div style={{fontFamily:"'Fraunces',serif",fontSize:22,fontWeight:900,color:'var(--ink)',marginBottom:4}}>
                    🧊 What's in your fridge?
                  </div>
                  <div style={{fontSize:13,color:'var(--muted)',fontWeight:300}}>
                    Add what you have — Jiff finds what you can make.
                  </div>
                </div>
              )}

              {/* ── Leftover mode: clean rescue header ── */}
              {inputMode === 'leftover' && (
                <div style={{marginBottom:16}}>
                  <div style={{fontFamily:"'Fraunces',serif",fontSize:22,fontWeight:900,color:'var(--ink)',marginBottom:4}}>
                    ♻️ Rescue your leftovers
                  </div>
                  <div style={{fontSize:13,color:'var(--muted)',fontWeight:300}}>
                    Tell Jiff what you have left — it will turn it into something great.
                  </div>
                </div>
              )}

                            <div className="card">

                {/* ── Fridge header + photo ── */}
                <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:10}}>
                  <div>
                    <div className="section-label" style={{marginBottom:2}}>
                      {inputMode === 'leftover' ? 'What leftovers do you have?' : t('fridge_label')}
                    </div>
                    <div style={{fontSize:11,color:'var(--muted)',fontWeight:300}}>
                      {inputMode === 'leftover' ? 'Add what you have — Jiff will rescue it.' : t('fridge_sub')}
                    </div>
                  </div>
                  <FridgePhotoUpload
                    onIngredientsDetected={detected => setFridgeItems(prev => [...new Set([...prev, ...detected])])}
                    existingIngredients={fridgeItems}
                  />
                </div>

                {/* ── Ingredient tag input with voice + translate ── */}
                <IngredientInput
                  ingredients={fridgeItems}
                  onChange={setFridgeItems}
                  pantryIngredients={[]}
                  placeholder="cabbage, chicken, eggs…"
                  lang={lang}
                  // Translation handled internally via /api/suggest?action=translate
                />

                {/* ── Quick-add chips ── */}
                <div style={{marginTop:10,marginBottom:14}}>
                  <div style={{fontSize:10,letterSpacing:'1px',textTransform:'uppercase',color:'var(--muted)',fontWeight:500,marginBottom:7}}>
                    Quick add
                  </div>
                  <div style={{
                    display:'flex', gap:6, overflowX:'auto',
                    paddingBottom:4, scrollbarWidth:'none', msOverflowStyle:'none',
                  }}>
                    {(pantry?.length > 0
                      ? pantry.filter(p => !fridgeItems.includes(p)).slice(0,8)
                      : QUICK_ADD_STAPLES.filter(s => !fridgeItems.includes(s)).slice(0,8)
                    ).map(item => (
                      <button key={item}
                        onClick={() => setFridgeItems(prev => [...new Set([...prev, item])])}
                        style={{
                          padding:'5px 12px', borderRadius:20, whiteSpace:'nowrap',
                          border:'1.5px solid rgba(28,10,0,0.10)',
                          background:'rgba(255,250,245,0.8)',
                          fontSize:11, color:'var(--muted)',
                          cursor:'pointer', fontFamily:"'DM Sans',sans-serif",
                          flexShrink:0, transition:'all 0.12s',
                        }}
                        onMouseEnter={e=>{e.currentTarget.style.borderColor='var(--jiff)';e.currentTarget.style.color='var(--jiff)';}}
                        onMouseLeave={e=>{e.currentTarget.style.borderColor='rgba(28,10,0,0.10)';e.currentTarget.style.color='var(--muted)';}}>
                        + {item}
                      </button>
                    ))}
                  </div>
                </div>

                {/* ── Pantry strip — read-only, shows assumed staples ── */}
                {pantry?.length > 0 && (
                  <div style={{
                    padding:'8px 12px', marginBottom:14,
                    background:'rgba(29,158,117,0.04)',
                    border:'1px solid rgba(29,158,117,0.15)',
                    borderRadius:10, display:'flex', alignItems:'center', justifyContent:'space-between', gap:8,
                  }}>
                    <div style={{fontSize:11,color:'#1D9E75',fontWeight:300,flex:1,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>
                      <span style={{fontWeight:500}}>Pantry assumed: </span>
                      {pantry.slice(0,5).join(', ')}{pantry.length > 5 ? ' +' + (pantry.length-5) + ' more' : ''}
                    </div>
                    <button onClick={()=>navigate('/profile',{state:{tab:'pantry'}})}
                      style={{fontSize:10,color:'#1D9E75',background:'none',border:'1px solid rgba(29,158,117,0.3)',borderRadius:6,padding:'3px 8px',cursor:'pointer',fontFamily:"'DM Sans',sans-serif",flexShrink:0}}>
                      Edit
                    </button>
                  </div>
                )}

                {/* ── Simplified 3 filters ── */}
                <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:8,marginBottom:16}}>
                  {/* Diet */}
                  <div>
                    <div style={{fontSize:9,letterSpacing:'1px',textTransform:'uppercase',color:'var(--jiff)',fontWeight:600,marginBottom:5}}>{t('section_diet')}</div>
                    <select value={diet||'none'}
                      onChange={e=>setDiet(e.target.value)}
                      style={{width:'100%',padding:'8px 6px',border:'1px solid rgba(28,10,0,0.10)',borderRadius:8,fontSize:11,fontFamily:"'DM Sans',sans-serif",background:'white',outline:'none',cursor:'pointer'}}>
                      <option value="none">Any</option>
                      <option value="vegetarian">Veg only</option>
                      <option value="vegan">Vegan</option>
                      <option value="jain">Jain</option>
                      <option value="non-vegetarian">Non-veg</option>
                    </select>
                  </div>
                  {/* Servings */}
                  <div>
                    <div style={{fontSize:9,letterSpacing:'1px',textTransform:'uppercase',color:'var(--jiff)',fontWeight:600,marginBottom:5}}>{t('section_servings')}</div>
                    <div style={{display:'flex',alignItems:'center',gap:4,padding:'6px 8px',border:'1px solid rgba(28,10,0,0.10)',borderRadius:8,background:'white'}}>
                      <button onClick={()=>setDefaultServings(s=>Math.max(1,s-1))} disabled={defaultServings<=1}
                        style={{background:'none',border:'none',fontSize:14,cursor:'pointer',color:'var(--muted)',padding:'0 2px',lineHeight:1}}>−</button>
                      <span style={{flex:1,textAlign:'center',fontSize:13,fontWeight:600,color:'var(--ink)'}}>{defaultServings}</span>
                      <button onClick={()=>setDefaultServings(s=>Math.min(12,s+1))} disabled={defaultServings>=12}
                        style={{background:'none',border:'none',fontSize:14,cursor:'pointer',color:'var(--muted)',padding:'0 2px',lineHeight:1}}>+</button>
                    </div>
                  </div>
                  {/* Time */}
                  <div>
                    <div style={{fontSize:9,letterSpacing:'1px',textTransform:'uppercase',color:'var(--jiff)',fontWeight:600,marginBottom:5}}>{t('section_time')}</div>
                    <select value={time} onChange={e=>setTime(e.target.value)}
                      style={{width:'100%',padding:'8px 6px',border:'1px solid rgba(28,10,0,0.10)',borderRadius:8,fontSize:11,fontFamily:"'DM Sans',sans-serif",background:'white',outline:'none',cursor:'pointer'}}>
                      <option value="20 min">20 min</option>
                      <option value="30 min">30 min</option>
                      <option value="45 min">45 min</option>
                      <option value="60 min">1 hour</option>
                      <option value="any">Any time</option>
                    </select>
                  </div>
                </div>

                {/* ── Per-session cuisine picker ── */}
                {profile?.preferred_cuisines?.length > 0 && (
                  <div style={{marginBottom:16}}>
                    <div style={{fontSize:9,letterSpacing:'1px',textTransform:'uppercase',color:'var(--jiff)',fontWeight:600,marginBottom:7}}>
                      Cuisine
                    </div>
                    <div style={{
                      display:'flex', gap:6, overflowX:'auto',
                      paddingBottom:4, scrollbarWidth:'none', msOverflowStyle:'none',
                    }}>
                      {profile.preferred_cuisines.map(id => {
                        const label = ALL_CUISINES?.find(c=>c.id===id)?.label || id;
                        const isActive = (cuisine === id) || (profile.preferred_cuisines.indexOf(id)===0 && cuisine==='any');
                        return (
                          <button key={id}
                            onClick={()=>setCuisine(isActive?'any':id)}
                            style={{
                              padding:'5px 12px', borderRadius:20, whiteSpace:'nowrap', flexShrink:0,
                              border:'1.5px solid ' + (isActive ? 'var(--jiff)' : 'rgba(28,10,0,0.10)'),
                              background: isActive?'rgba(255,69,0,0.07)':'white',
                              color: isActive?'var(--jiff)':'var(--muted)',
                              fontSize:11, cursor:'pointer', fontFamily:"'DM Sans',sans-serif",
                              fontWeight: isActive?600:400, transition:'all 0.12s',
                            }}>
                            {label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                <div className="cta-wrap">
                          {/* Festival banner */}
        {(()=>{const f=getUpcomingFestival(); return f ? (
          <div style={{background:'rgba(255,69,0,0.06)',border:'1px solid rgba(255,69,0,0.18)',borderRadius:12,padding:'10px 14px',marginBottom:12,display:'flex',alignItems:'center',gap:10,cursor:'pointer'}}
            onClick={()=>{
              if(f.diet && f.diet!=='none') {/* pre-fill diet context */}
              handleSubmit && handleSubmit();
            }}>
            <span style={{fontSize:22}}>{f.emoji}</span>
            <div>
              <div style={{fontSize:12,fontWeight:600,color:'var(--jiff)'}}>{f.name} special recipes</div>
              <div style={{fontSize:11,color:'var(--muted)',fontWeight:300}}>{f.note}</div>
            </div>
            <span style={{marginLeft:'auto',fontSize:11,color:'var(--jiff)',fontWeight:500}}>Generate →</span>
          </div>
        ) : null;})()}
        <button className="cta-btn" onClick={!user ? ()=>{setGateDismissed(false);} : handleSubmit} disabled={!ingredients.length || !user}>
                    <span>⚡</span>
                    <span>Jiff it now!</span>
                  </button>
                  {!ingredients.length && <p className="cta-note">{t('cta_note')}</p>}

                {/* ── Family selector ── */}
                {user && Array.isArray(profile?.family_members) && profile.family_members.length > 0 && (
                  <FamilySelector
                    members={profile.family_members}
                    selected={familySelected}
                    onToggle={(idx) => {
                      if (idx === 'all') { setFamilySelected([]); return; }
                      setFamilySelected(prev =>
                        prev.includes(idx) ? prev.filter(i=>i!==idx) : [...prev, idx]
                      );
                    }}
                  />
                )}

                  {trialActive && !isPremium && <p className="trial-note">🎁 Trial mode — you'll see 1 recipe preview. <button onClick={()=>navigate('/pricing')} style={{background:'none',border:'none',color:'#854F0B',cursor:'pointer',fontWeight:600,fontFamily:"'DM Sans',sans-serif",fontSize:'inherit',textDecoration:'underline'}}>Upgrade for {PAID_RECIPE_CAP} recipes →</button></p>}
                </div>
              </div>
            </div>

        )}

        {/* ── Loading ── */}
        {view === 'loading' && (
          <LoadingView
            cuisine={cuisine} mealType={mealType}
            ingredients={ingredients} isPremium={isPremium}
            PAID_RECIPE_CAP={PAID_RECIPE_CAP} factIdx={factIdx}
            loadingMessage={loadingMessage}
          />
        )}

        {/* ── Results ── */}
        {/* ── Back to journey from results ── */}
        {view === 'results' && user && (
          <div style={{textAlign:'center',padding:'12px 0 4px'}}>
            <button onClick={()=>{setView('input');setJourneyMode(true);setMeals([]);}}
              style={{background:'none',border:'none',cursor:'pointer',fontSize:12,
                color:'var(--muted)',fontFamily:"'DM Sans',sans-serif"}}>
              ← Cook something else
            </button>
          </div>
        )}

        {view === 'results' && (
          <div className="results-wrap">
            {/* Pantry restock nudge */}
            {pantryNudge.length > 0 && (
              <div style={{background:'rgba(92,107,192,0.08)',border:'1px solid rgba(92,107,192,0.2)',borderRadius:12,padding:'10px 14px',marginBottom:16,display:'flex',alignItems:'center',justifyContent:'space-between',gap:10,flexWrap:'wrap'}}>
                <span style={{fontSize:13,color:'#3949AB',fontWeight:300}}>
                  🧂 You may need to restock: <strong>{pantryNudge.join(', ')}</strong>
                </span>
                <button onClick={()=>setPantryNudge([])} style={{background:'none',border:'none',color:'#9E9E9E',cursor:'pointer',fontSize:12,fontFamily:"'DM Sans',sans-serif"}}>✕</button>
              </div>
            )}
            <div className="results-header">
              <div className="results-title">Jiffed. ⚡ Here's your menu.</div>
              <div className="results-sub">
                Tap ♥ to save · expand for full recipe + timers · adjust servings inside
                {profile&&<span style={{color:'var(--jiff)',fontWeight:500}}> · personalised for {profile.name?.split(' ')[0]}</span>}
              </div>
            </div>
            <div className="filter-pills">
              {mealType!=='any'&&<span className="filter-pill">{MEAL_TYPE_OPTIONS.find(m=>m.id===mealType)?.emoji} {mealType}</span>}
              {cuisine!=='any'&&<span className="filter-pill">{CUISINE_OPTIONS.find(c=>c.id===cuisine)?.flag} {cuisine}</span>}
              <span className="filter-pill">⏱ {time}</span>
              {diet!=='none'&&<span className="filter-pill">🥗 {diet}</span>}
              <span className="filter-pill">👥 {defaultServings} serving{defaultServings!==1?'s':''}</span>
              <span className="filter-pill">🥦 {ingredients.length} ingredient{ingredients.length>1?'s':''}</span>
            </div>
            {!isPremium && trialActive && (
              <div style={{background:'rgba(255,184,0,0.08)',border:'1px solid rgba(255,184,0,0.25)',borderRadius:12,padding:'10px 14px',marginBottom:16,display:'flex',alignItems:'center',justifyContent:'space-between',gap:10,flexWrap:'wrap'}}>
                <span style={{fontSize:13,color:'#854F0B',fontWeight:300}}>🎁 Trial preview — you're seeing 1 recipe. Upgrade to see all {PAID_RECIPE_CAP}.</span>
                <button onClick={()=>navigate('/pricing')} style={{background:'#854F0B',color:'white',border:'none',borderRadius:8,padding:'7px 14px',fontSize:12,fontWeight:500,cursor:'pointer',fontFamily:"'DM Sans',sans-serif",whiteSpace:'nowrap'}}>⚡ Upgrade</button>
              </div>
            )}
            <div className="meals-grid">
              {meals.map((meal,i)=>(
                <MealCard key={mealKey(meal)+i} meal={meal} index={i}
                  isFavourite={isFav(meal)} onToggleFav={toggleFavourite}
                  fridgeIngredients={ingredients} defaultServings={defaultServings}
                  animDelay={i*0.06} country={country}
                  rating={ratings[mealKey(meal)] || 0}
                  onRate={(stars)=>{
                    const key = mealKey(meal);
                    const next = {...ratings, [key]: stars};
                    setRatings(next);
                    // ratings saved to Supabase only (see PATCH below)
                    if (user) {
                      fetch('/api/admin?action=meal-history', {
                        method: 'PATCH',
                        headers: {'Content-Type':'application/json'},
                        body: JSON.stringify({ userId: user.id, mealName: meal.name, rating: stars }),
                      }).catch(()=>{});
                    }
                  }}
                />
              ))}
            </div>
            {/* ── Smart recommendations ── */}
            {(() => {
              const ratings = JSON.parse(localStorage.getItem('jiff-ratings')||'{}');
              const topRated = Object.entries(ratings).filter(([,r])=>r>=4).map(([k])=>k);
              return topRated.length >= 1 ? (
                <div style={{background:'rgba(255,69,0,0.04)',border:'1px solid rgba(255,69,0,0.15)',borderRadius:14,padding:'14px 16px',marginBottom:16}}>
                  <div style={{fontSize:11,letterSpacing:'1.5px',textTransform:'uppercase',color:'var(--jiff)',fontWeight:500,marginBottom:10}}>
                    ✨ Based on meals you loved
                  </div>
                  <p style={{fontSize:12,color:'var(--muted)',fontWeight:300,margin:'0 0 10px'}}>
                    You've rated {topRated.length} recipe{topRated.length!==1?'s':''} highly. Generate similar dishes:
                  </p>
                  <button onClick={handleSurprise}
                    style={{background:'var(--jiff)',color:'white',border:'none',borderRadius:10,padding:'8px 18px',fontSize:12,fontWeight:500,cursor:'pointer',fontFamily:"'DM Sans',sans-serif"}}>
                    ✨ Surprise me with something similar
                  </button>
                </div>
              ) : null;
            })()}
            {/* ── "Can't cook today?" order strip ── */}
            <div style={{background:'rgba(28,10,0,0.025)',border:'1px solid rgba(28,10,0,0.07)',borderRadius:14,padding:'14px 18px',marginBottom:12}}>
              <div style={{fontSize:12,fontWeight:500,color:'var(--muted)',marginBottom:10}}>🛵 Can't cook today? Order it instead</div>
              <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
                {meals?.[0]?.name && [
                  {name:'Swiggy',  color:'#FC8019', url:'https://www.swiggy.com/search?query='+encodeURIComponent(meals[0].name)},
                  {name:'Zomato',  color:'#CB202D', url:'https://www.zomato.com/search?q='+encodeURIComponent(meals[0].name)},
                  {name:'EatSure', color:'#E84855', url:'https://eatsure.com/search?query='+encodeURIComponent(meals[0].name)},
                ].map(d=>(
                  <a key={d.name} href={d.url} target="_blank" rel="noopener noreferrer"
                    style={{padding:'7px 16px',borderRadius:10,textDecoration:'none',fontSize:12,fontWeight:600,color:'white',background:d.color,display:'inline-block'}}>
                    {d.name}
                  </a>
                ))}
              </div>
            </div>
            <div className="reset-wrap">
              <button className="reset-btn" onClick={reset}>← Try different ingredients</button>
            </div>
          </div>
        )}

        {/* ── Error ── */}
        {view === 'error' && (
          <div className="error-wrap">
            <div className="error-icon">😕</div>
            <div className="error-title">{t('error_title_app')}</div>
            <div className="error-msg">{errorMsg}</div>
            <button className="cta-btn" onClick={reset}>← Start over</button>
          </div>
        )}
      </div>
    </>
  );
}
