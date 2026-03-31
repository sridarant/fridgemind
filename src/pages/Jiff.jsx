import { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
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

// ── Serving scaler helpers ────────────────────────────────────────
const FRACTIONS = { '¼':0.25,'½':0.5,'¾':0.75,'⅓':1/3,'⅔':2/3,'⅛':0.125,'⅜':0.375,'⅝':0.625,'⅞':0.875 };
const FRAC_CHARS = Object.keys(FRACTIONS).join('');
const QTY_RE = new RegExp(`^(\\*?\\s*)(\\d+(?:\\.\\d+)?)?\\s*([${FRAC_CHARS}])?(?:\\s*(\\d+)\\s*\\/\\s*(\\d+))?`);
// ── Dietary display helper ────────────────────────────────────────
// Maps food_type IDs to human labels regardless of how Supabase returns them.
// Handles: JS array ['veg'], JSON string '["veg"]', Postgres '{veg}', plain 'veg'
const DIETARY_LABELS = {
  'non-veg':'Non-vegetarian', 'veg':'Vegetarian', 'eggetarian':'Eggetarian',
  'vegan':'Vegan', 'jain':'Jain', 'halal':'Halal', 'kosher':'Kosher',
  'pescatarian':'Pescatarian',
};
function getDietaryLabel(food_type) {
  const toLabel = id => {
    if (!id) return '';
    const clean = String(id).toLowerCase().trim().replace(/^"+|"+$/g, '');
    return DIETARY_LABELS[clean] || clean;
  };
  // Recursively unwrap until we have a flat array of IDs
  const unwrap = (val) => {
    if (!val) return [];
    if (Array.isArray(val)) return val.flatMap(unwrap);
    if (typeof val !== 'string') return [String(val)];
    const s = val.trim();
    // Postgres wire format: {veg} or {"non-veg","veg"}
    if (s.startsWith('{') && s.endsWith('}')) {
      return s.slice(1,-1).split(',').map(x => x.replace(/^"+|"+$/g,'').trim()).filter(Boolean);
    }
    // JSON encoded (possibly double-encoded): ["veg"] or "veg" or [["veg"]]
    if (s.startsWith('[') || s.startsWith('"')) {
      try { return unwrap(JSON.parse(s)); } catch {}
    }
    return [s];
  };
  try {
    const ids = [...new Set(unwrap(food_type).filter(Boolean))];
    if (!ids.length) return 'Not set';
    return ids.map(toLabel).filter(Boolean).join(', ') || 'Not set';
  } catch { return 'Not set'; }
}

function parseQty(str) {
  const m = str.match(QTY_RE); if (!m) return { value:null, rest:str, prefix:'' };
  const prefix=m[1]||'', whole=m[2]?parseFloat(m[2]):0;
  const frac=m[3]?FRACTIONS[m[3]]:0, slash=m[4]&&m[5]?parseInt(m[4])/parseInt(m[5]):0;
  const value=whole+frac+slash;
  return value>0?{value,rest:str.slice(m[0].length).trimStart(),prefix}:{value:null,rest:str,prefix:''};
}
function toNiceNumber(n) {
  if(n===0)return'0'; const r=Math.round(n*100)/100;
  const nf=[[0.125,'⅛'],[0.25,'¼'],[0.333,'⅓'],[0.375,'⅜'],[0.5,'½'],[0.625,'⅝'],[0.667,'⅔'],[0.75,'¾'],[0.875,'⅞']];
  const whole=Math.floor(r),frac=Math.round((r-whole)*1000)/1000;
  if(frac===0)return String(whole||r);
  for(const[val,sym]of nf)if(Math.abs(frac-val)<0.02)return whole>0?`${whole}${sym}`:sym;
  return r<10?r.toFixed(1).replace(/\.0$/,''):String(Math.round(r));
}
function scaleIngredient(str,ratio) {
  if(ratio===1)return str; const{value,rest,prefix}=parseQty(str);
  if(value===null)return str; return`${prefix}${toNiceNumber(value*ratio)} ${rest}`.trim();
}
function scaleNutrition(val,ratio) {
  if(ratio===1)return val; const n=parseFloat(val); if(isNaN(n))return val;
  return`${Math.round(n*ratio)}${val.replace(/^[\d.]+/,'').trim()}`;
}

// ── Timer helpers ─────────────────────────────────────────────────
function parseStepTime(text) {
  const t=text.toLowerCase();
  if(/half\s+an?\s+hour/.test(t))return 1800;
  let total=0;
  const hr=t.match(/(\d+(?:\.\d+)?)\s*[-–to]+\s*(\d+(?:\.\d+)?)\s*h(?:ou?r?s?|rs?)/);
  const hs=t.match(/(\d+(?:\.\d+)?)\s*h(?:ou?r?s?|rs?)/);
  if(hr)total+=((parseFloat(hr[1])+parseFloat(hr[2]))/2)*3600;
  else if(hs)total+=parseFloat(hs[1])*3600;
  const mr=t.match(/(\d+(?:\.\d+)?)\s*[-–to]+\s*(\d+(?:\.\d+)?)\s*m(?:in(?:utes?)?s?)/);
  const ms=t.match(/(\d+(?:\.\d+)?)\s*m(?:in(?:utes?)?s?)/);
  if(mr)total+=((parseFloat(mr[1])+parseFloat(mr[2]))/2)*60;
  else if(ms)total+=parseFloat(ms[1])*60;
  const sec=t.match(/(\d+)\s*s(?:ec(?:onds?)?s?)/);
  if(sec)total+=parseInt(sec[1]);
  return(total<10||total>43200)?null:Math.round(total);
}
function formatTime(s){const h=Math.floor(s/3600),m=Math.floor((s%3600)/60),sc=s%60;return h>0?`${h}:${String(m).padStart(2,'0')}:${String(sc).padStart(2,'0')}`:`${String(m).padStart(2,'0')}:${String(sc).padStart(2,'0')}`;}

function mealKey(m){return`${m.name}-${m.emoji}`.toLowerCase().replace(/\s+/g,'-');}
function extractCoreName(str){return str.toLowerCase().replace(/^\*?\s*/,'').replace(/[\d¼½¾⅓⅔⅛]+[\s-]*/g,'').replace(/\b(g|kg|ml|l|oz|lb|tbsp|tsp|cup|cups|cloves?|piece|pieces|slice|slices|medium|large|small|fresh|dried|minced|chopped|diced|sliced|grated|handful|pinch|bunch|can|cans|tin|tins|pack|packet|to taste|of)\b/gi,'').replace(/[,()]/g,'').trim().split(/\s+/).filter(Boolean).join(' ');}
function isAvailable(core,fridge){const r=core.toLowerCase();return fridge.some(f=>{const fr=f.toLowerCase().trim();return r.includes(fr)||fr.includes(r)||fr.split(' ').some(w=>w.length>2&&r.includes(w));});}
function buildGroceryList(ings,fridge){const need=[],have=[];ings.forEach(ing=>{const core=extractCoreName(ing);if(!core)return;(isAvailable(core,fridge)?have:need).push(ing.replace(/^\*\s*/,''));});return{need,have};}
function buildShareText(meal){return[`⚡ *Jiff Recipe*`,``,`${meal.emoji} *${meal.name}*`,meal.description,``,`*Ingredients:*`,meal.ingredients?.slice(0,6).join(', ')||'',``,`*Steps:*`,meal.steps?.slice(0,3).map((s,i)=>`${i+1}. ${s}`).join('\n')||'',``,`🔥 ${meal.calories} cal  |  💪 ${meal.protein}`,``,`_From Jiff — jiff.app_`].join('\n');}

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
const IconShare=()=><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>;
const IconCopy=()=><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>;
const IconCheck=()=><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>;
const IconCart=()=><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 001.98 1.61H19a2 2 0 001.98-1.71L23 6H6"/></svg>;
const IconWA=()=><svg viewBox="0 0 32 32" fill="currentColor"><path d="M16 0C7.164 0 0 7.163 0 16c0 2.82.736 5.469 2.027 7.77L0 32l8.469-2.004A15.938 15.938 0 0016 32c8.836 0 16-7.164 16-16S24.836 0 16 0zm0 29.333a13.27 13.27 0 01-6.771-1.852l-.485-.288-5.027 1.189 1.213-4.899-.315-.503A13.257 13.257 0 012.667 16C2.667 8.636 8.636 2.667 16 2.667S29.333 8.636 29.333 16 23.364 29.333 16 29.333zm7.27-9.878c-.397-.198-2.35-1.16-2.714-1.291-.363-.132-.627-.198-.89.198-.264.397-1.023 1.291-1.253 1.556-.231.264-.462.297-.858.099-.397-.198-1.675-.617-3.19-1.97-1.18-1.052-1.977-2.35-2.208-2.747-.231-.397-.025-.611.173-.809.178-.178.397-.462.595-.693.198-.231.264-.397.397-.661.132-.265.066-.496-.033-.694-.099-.198-.89-2.148-1.22-2.942-.32-.772-.647-.667-.89-.68-.23-.012-.496-.015-.76-.015-.264 0-.694.099-1.057.496-.363.397-1.386 1.354-1.386 3.303 0 1.95 1.419 3.834 1.617 4.099.198.264 2.793 4.266 6.766 5.982.946.408 1.684.652 2.26.834.95.302 1.814.26 2.497.158.761-.114 2.35-.961 2.68-1.889.332-.927.332-1.722.232-1.889-.099-.165-.363-.264-.76-.462z"/></svg>;
const IconScaler=()=><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>;

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
    .main-layout{grid-template-columns:1fr;padding:20px 16px 48px;}
    .main-sidebar{order:-1;}
    .meals-grid,.favs-grid{grid-template-columns:1fr;padding-left:16px;padding-right:16px;}
    .results-wrap{padding:24px 16px 48px;}
    .nutr-grid{grid-template-columns:repeat(2,1fr);}
    .share-actions{flex-direction:column;}
    .favs-panel{padding:0 16px;}
    .gate-plans{grid-template-columns:1fr;}
    .header{padding:14px 16px;}
    .scaler-orig{display:none;}
    .trial-badge{display:none;}
  }
`;

// ── StepTimer ─────────────────────────────────────────────────────
function StepTimer({ totalSeconds }) {
  const [remaining, setRemaining] = useState(totalSeconds);
  const [running, setRunning] = useState(false);
  const [done, setDone] = useState(false);
  const intRef = useRef(null);
  useEffect(() => () => clearInterval(intRef.current), []);
  useEffect(() => {
    if (running) {
      intRef.current = setInterval(() => {
        setRemaining(r => { if(r<=1){clearInterval(intRef.current);setRunning(false);setDone(true);if(navigator.vibrate)navigator.vibrate([200,100,200]);return 0;}return r-1;});
      }, 1000);
    } else clearInterval(intRef.current);
    return () => clearInterval(intRef.current);
  }, [running]);
  const start=e=>{e.stopPropagation();setRunning(true);setDone(false);};
  const pause=e=>{e.stopPropagation();setRunning(false);};
  const reset=e=>{e.stopPropagation();setRunning(false);setRemaining(totalSeconds);setDone(false);};
  const pct=((totalSeconds-remaining)/totalSeconds)*100;
  if(done)return(<div className="step-timer done" onClick={e=>e.stopPropagation()}><span className="timer-done-icon">🔔</span><span className="timer-done-text">Done!</span><button className="timer-reset-btn" onClick={reset}>↺</button></div>);
  if(!running&&remaining===totalSeconds)return(<button className="step-timer idle" onClick={start}><span className="timer-icon">⏱</span><span className="timer-idle-label">{formatTime(totalSeconds)}</span></button>);
  return(<div className={`step-timer active ${running?'ticking':'paused'}`} onClick={e=>e.stopPropagation()}>
    <div className="timer-ring-wrap">
      <svg className="timer-ring" viewBox="0 0 36 36"><circle className="timer-ring-track" cx="18" cy="18" r="15.9" fill="none" strokeWidth="3"/><circle className="timer-ring-fill" cx="18" cy="18" r="15.9" fill="none" strokeWidth="3" strokeDasharray={`${pct} ${100-pct}`} strokeDashoffset="25"/></svg>
      <span className="timer-display">{formatTime(remaining)}</span>
    </div>
    <div className="timer-controls">
      {running?<button className="timer-ctrl-btn pause" onClick={pause}>⏸</button>:<button className="timer-ctrl-btn play" onClick={start}>▶</button>}
      <button className="timer-ctrl-btn reset" onClick={reset}>↺</button>
    </div>
  </div>);
}

function StepWithTimer({ text }) {
  const sec = parseStepTime(text);
  return (<li><span className="step-text">{text}</span>{sec&&<StepTimer key={text} totalSeconds={sec}/>}</li>);
}

// ── GroceryPanel ──────────────────────────────────────────────────
function GroceryPanel({ meal, fridgeIngredients, onClose, country: countryProp }) {
  const { country: ctxCountry, t } = useLocale();
  const country = countryProp || ctxCountry;
  const { need, have } = buildGroceryList(meal.ingredients||[], fridgeIngredients);
  const [checked, setChecked] = useState({});
  const [copied, setCopied] = useState(false);
  const toggle=k=>setChecked(p=>({...p,[k]:!p[k]}));
  const handleCopy=async e=>{e.stopPropagation();const text=need.length>0?`🛒 Shopping list for ${meal.name}\n\n${need.map(i=>`• ${i}`).join('\n')}\n\n_From Jiff_`:`Nothing to buy for ${meal.name}!`;try{await navigator.clipboard.writeText(text);}catch{const ta=document.createElement('textarea');ta.value=text;document.body.appendChild(ta);ta.select();document.execCommand('copy');document.body.removeChild(ta);}setCopied(true);setTimeout(()=>setCopied(false),2500);};
  const waUrl=`https://wa.me/?text=${encodeURIComponent(need.length>0?`🛒 *Shopping list for ${meal.name}*\n\n${need.map(i=>`• ${i}`).join('\n')}\n\n_From Jiff_`:`I have everything for ${meal.name}! 🎉`)}`;
  return(
    <div className="grocery-panel" onClick={e=>e.stopPropagation()}>
      <div className="grocery-header">
        <div className="grocery-header-left"><span style={{fontSize:14}}>🛒</span><div><div className="grocery-header-title">{t('grocery_title')}</div><div className="grocery-header-sub">{need.length===0?'You have everything!':`${need.length} to buy · ${have.length} in fridge`}</div></div></div>
        <button className="grocery-close" onClick={e=>{e.stopPropagation();onClose();}}>×</button>
      </div>
      <div className="grocery-section">
        <div className="grocery-section-title need"><span>{t('need_to_buy')}</span><span className="grocery-count need">{need.length}</span></div>
        {need.length===0?<div className="grocery-empty">🎉 Nothing — you have it all!</div>:(
          <div className="grocery-items">{need.map((ing,i)=>(
            <div key={i} className="grocery-item need" onClick={()=>toggle(`n-${i}`)}>
              <div className={`grocery-checkbox ${checked[`n-${i}`]?'checked':''}`}><svg viewBox="0 0 12 12"><polyline points="10 2 5 9 2 6" strokeLinecap="round" strokeLinejoin="round"/></svg></div>
              <div className={`grocery-item-text ${checked[`n-${i}`]?'checked-text':''}`}>{ing}</div>
              {(
                <a href={'https://blinkit.com/s/?q='+encodeURIComponent(ing.replace(/^[\d½¼¾⅓⅔⅛]+\s*(?:g|kg|ml|l|tsp|tbsp|cup|cups)?\s*/i,''))}
                  target="_blank" rel="noopener noreferrer"
                  onClick={e=>e.stopPropagation()}
                  style={{marginLeft:'auto',flexShrink:0,fontSize:10,fontWeight:500,color:'#1A8A3E',background:'rgba(26,138,62,0.08)',border:'1px solid rgba(26,138,62,0.22)',borderRadius:6,padding:'2px 7px',textDecoration:'none',whiteSpace:'nowrap',fontFamily:"'DM Sans',sans-serif"}}>
                  Order →
                </a>
              )}
            </div>
          ))}</div>
        )}
      </div>
      {have.length>0&&<div className="grocery-section"><div className="grocery-section-title have"><span>{t('in_fridge')}</span><span className="grocery-count have">{have.length}</span></div><div className="grocery-items">{have.map((ing,i)=><div key={i} className="grocery-item have"><div className="grocery-dot"/><div className="grocery-item-text">{ing}</div></div>)}</div></div>}
      <div className="grocery-actions">
        <button className={`grocery-action-btn copy ${copied?'copied':''}`} onClick={handleCopy}>{copied?<IconCheck/>:<IconCopy/>}{copied?'Copied!':'Copy list'}</button>
        <a className="grocery-action-btn wa" href={waUrl} target="_blank" rel="noopener noreferrer" onClick={e=>e.stopPropagation()}><IconWA/>WhatsApp</a>
        {need.length > 0 && (
          <a className="grocery-action-btn"
            href={'https://blinkit.com/s/?q='+encodeURIComponent(need.map(i=>i.replace(/^[\d½¼¾⅓⅔⅛]+\s*(?:g|kg|ml|l|tsp|tbsp|cup|cups)?\s*/i,'')).join(', '))}
            target="_blank" rel="noopener noreferrer"
            onClick={e=>e.stopPropagation()}
            style={{background:'#1A8A3E',color:'white',border:'none',textDecoration:'none',display:'flex',alignItems:'center',gap:5}}>
            🛒 Blinkit
          </a>
        )}
      </div>
    </div>
  );
}

// ── ShareDrawer ───────────────────────────────────────────────────
function ShareDrawer({ meal }) {
  const { t } = useLocale();
  const [copied, setCopied] = useState(false);
  const text = buildShareText(meal);
  const waUrl = `https://wa.me/?text=${encodeURIComponent(text)}`;
  const hasNative = typeof navigator !== 'undefined' && !!navigator.share;
  const handleCopy=async e=>{e.stopPropagation();try{await navigator.clipboard.writeText(text);}catch{const ta=document.createElement('textarea');ta.value=text;document.body.appendChild(ta);ta.select();document.execCommand('copy');document.body.removeChild(ta);}setCopied(true);setTimeout(()=>setCopied(false),2500);};
  return(
    <div className="share-drawer" onClick={e=>e.stopPropagation()}>
      <div className="share-drawer-label">{t('share_title')}</div>
      <div className="share-actions">
        <a className="share-wa" href={waUrl} target="_blank" rel="noopener noreferrer" onClick={e=>e.stopPropagation()}><IconWA/>WhatsApp</a>
        <button className={`share-copy ${copied?'copied':''}`} onClick={handleCopy}>{copied?<IconCheck/>:<IconCopy/>}{copied?'Copied!':'Copy'}</button>
        {hasNative&&<button className="share-copy" onClick={async e=>{e.stopPropagation();try{await navigator.share({title:`${meal.emoji} ${meal.name}`,text});}catch{}}}><IconShare/>More</button>}
      </div>
      {/* ── Order delivery ── */}
      {need.length > 0 && (
        <div style={{marginTop:10,padding:'10px 14px',background:'rgba(28,10,0,0.03)',borderRadius:10,borderTop:'1px solid rgba(28,10,0,0.06)'}}>
          <div style={{fontSize:10,letterSpacing:'1.5px',textTransform:'uppercase',color:'#9E9E9E',fontWeight:500,marginBottom:8}}>Order missing items</div>
          <div style={{display:'flex',gap:6,flexWrap:'wrap'}}>
            {[
              {name:'Blinkit', color:'#1A8A3E', url:'https://blinkit.com/s/?q='+encodeURIComponent(need.join(' '))},
              {name:'Zepto',   color:'#5B21B6', url:'https://zeptonow.com/search?query='+encodeURIComponent(need.join(' '))},
              {name:'Swiggy',  color:'#FC8019', url:'https://swiggy.com/instamart/search?query='+encodeURIComponent(need.join(' '))},
            ].map(p=>(
              <a key={p.name} href={p.url} target="_blank" rel="noopener noreferrer"
                style={{padding:'6px 14px',borderRadius:8,background:p.color,color:'white',textDecoration:'none',fontSize:11,fontWeight:600,fontFamily:"'DM Sans',sans-serif",display:'inline-block'}}>
                🛒 {p.name}
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}


// ── Festival detector — date-based, no API ──────────────────────
function getUpcomingFestival() {
  const now   = new Date();
  const month = now.getMonth() + 1; // 1-12
  const day   = now.getDate();
  const festivals = [
    { name:'Pongal',    emoji:'🌾', m:1,  d1:13, d2:16, diet:'vegetarian',  note:'Ven Pongal, Sakkarai Pongal, Vadai' },
    { name:'Holi',      emoji:'🎨', m:3,  d1:24, d2:26, diet:'vegetarian',  note:'Gujiya, Thandai, Dahi Bhalle' },
    { name:'Navratri',  emoji:'🌸', m:4,  d1:1,  d2:11, diet:'vegetarian',  note:'Sabudana khichdi, Kuttu puri, Samak rice' },
    { name:'Eid',       emoji:'🌙', m:4,  d1:9,  d2:11, diet:'halal',       note:'Sheer khurma, Biryani, Sewai' },
    { name:'Onam',      emoji:'🌺', m:8,  d1:28, d2:31, diet:'vegetarian',  note:'Avial, Sambar, Payasam, Sadya' },
    { name:'Navratri',  emoji:'🌸', m:10, d1:2,  d2:12, diet:'vegetarian',  note:'Fasting specials — sabudana, singhara' },
    { name:'Diwali',    emoji:'🪔', m:10, d1:29, d2:3,  diet:'vegetarian',  note:'Ladoo, Chakli, Murukku, Kheer' },
    { name:'Christmas', emoji:'🎄', m:12, d1:22, d2:26, diet:'none',        note:'Plum cake, Appam, Stew, Fruit cake' },
  ];
  const check = (m, d1, d2) => {
    if (d1 <= d2) return month === m && day >= d1-3 && day <= d2;
    return (month === m && day >= d1-3) || (month === (m%12)+1 && day <= d2);
  };
  return festivals.find(f => check(f.m, f.d1, f.d2)) || null;
}

// ── MealCard ──────────────────────────────────────────────────────
function MealCard({ meal, index, isFavourite, onToggleFav, fridgeIngredients=[], showFavTag=false, defaultServings=2, animDelay=0, country='', onRate, rating=0 }) {
  const { t } = useLocale();
  const baseServings = parseInt(meal.servings) || defaultServings;
  const [shareCardOpen, setShareCardOpen] = useState(false);
  const [hoverStar,     setHoverStar]     = useState(0);
  const [expanded, setExpanded]       = useState(false);
  const [shareOpen, setShareOpen]     = useState(false);
  const [groceryOpen, setGroceryOpen] = useState(false);
  const [videoOpen,   setVideoOpen]   = useState(false);
  const [videoData,   setVideoData]   = useState(null);
  const [videoLoading,setVideoLoading]= useState(false);
  const [subOpen,     setSubOpen]     = useState(null); // ingredient name being substituted
  const [subResult,   setSubResult]   = useState({});   // {ingName: [sub1, sub2]}
  const [cookMode,    setCookMode]    = useState(false);
  const [cookStep,    setCookStep]    = useState(0);
  const [speaking,    setSpeaking]    = useState(false);
  const [orderOpen,   setOrderOpen]   = useState(false);
  const [servings, setServings]       = useState(baseServings);
  const ratio    = servings / baseServings;
  const isScaled = ratio !== 1;

  const scaledIngs  = (meal.ingredients||[]).map(ing=>scaleIngredient(ing,ratio));
  const scaledCal   = scaleNutrition(meal.calories||'',ratio);
  const scaledPro   = scaleNutrition(meal.protein||'',ratio);
  const scaledCarbs = scaleNutrition(meal.carbs||'',ratio);
  const scaledFat   = scaleNutrition(meal.fat||'',ratio);

  // ── Share card — canvas PNG download ───────────────────────────
  const generateShareCard = () => {
    const SIZE = 1080;
    const canvas = document.createElement('canvas');
    canvas.width = SIZE; canvas.height = SIZE;
    const cx = canvas.getContext('2d');

    // ── Background ──────────────────────────────────────────────
    // Rich dark gradient
    const bg = cx.createRadialGradient(SIZE/2, SIZE*0.4, 0, SIZE/2, SIZE*0.4, SIZE*0.85);
    bg.addColorStop(0, '#2D1000');
    bg.addColorStop(0.6, '#1C0A00');
    bg.addColorStop(1, '#0D0500');
    cx.fillStyle = bg; cx.fillRect(0, 0, SIZE, SIZE);

    // Warm glow behind emoji
    const glow = cx.createRadialGradient(SIZE/2, SIZE*0.38, 0, SIZE/2, SIZE*0.38, 260);
    glow.addColorStop(0, 'rgba(255,69,0,0.18)');
    glow.addColorStop(1, 'rgba(255,69,0,0)');
    cx.fillStyle = glow; cx.fillRect(0, 0, SIZE, SIZE);

    // ── Top bar ──────────────────────────────────────────────────
    cx.fillStyle = '#FF4500'; cx.fillRect(0, 0, SIZE, 6);

    // ── Jiff wordmark ────────────────────────────────────────────
    cx.font = '500 32px Arial, sans-serif';
    cx.fillStyle = 'rgba(255,255,255,0.35)';
    cx.textAlign = 'left';
    cx.fillText('⚡ JIFF', 60, 72);

    // ── Meal emoji ───────────────────────────────────────────────
    cx.font = '200px serif';
    cx.textAlign = 'center';
    cx.fillText(meal.emoji || '🍽️', SIZE/2, 390);

    // ── Meal name ────────────────────────────────────────────────
    cx.textAlign = 'center';
    const name = (meal.name || 'Recipe').toUpperCase();
    // Auto-size font to fit
    let fontSize = 72;
    cx.font = `900 ${fontSize}px Arial, sans-serif`;
    while (cx.measureText(name).width > SIZE - 100 && fontSize > 36) {
      fontSize -= 4;
      cx.font = `900 ${fontSize}px Arial, sans-serif`;
    }
    cx.fillStyle = 'white';
    cx.fillText(name, SIZE/2, 490);

    // ── Thin orange divider ──────────────────────────────────────
    cx.strokeStyle = '#FF4500'; cx.lineWidth = 2;
    cx.beginPath(); cx.moveTo(SIZE/2 - 120, 520); cx.lineTo(SIZE/2 + 120, 520); cx.stroke();

    // ── Description ──────────────────────────────────────────────
    const desc = (meal.description || '').slice(0, 72);
    cx.font = '300 28px Arial, sans-serif';
    cx.fillStyle = 'rgba(255,255,255,0.55)';
    cx.fillText(desc, SIZE/2, 575);

    // ── Stats chips ──────────────────────────────────────────────
    const stats = [
      { icon:'⏱', val: meal.time || '?' },
      { icon:'🔥', val: (meal.calories || '?') + ' cal' },
      { icon:'💪', val: meal.protein || '?' },
      { icon:'📊', val: meal.difficulty || 'Easy' },
    ];
    const chipW = 200, chipH = 68, chipGap = 20;
    const totalW = stats.length * chipW + (stats.length - 1) * chipGap;
    const startX = (SIZE - totalW) / 2;
    stats.forEach((s, idx) => {
      const x = startX + idx * (chipW + chipGap);
      const y = 630;
      // Chip background
      cx.fillStyle = 'rgba(255,255,255,0.07)';
      cx.beginPath();
      cx.roundRect(x, y, chipW, chipH, 14);
      cx.fill();
      cx.strokeStyle = 'rgba(255,255,255,0.12)'; cx.lineWidth = 1;
      cx.stroke();
      // Icon + value
      cx.font = '22px serif'; cx.textAlign = 'center';
      cx.fillStyle = 'rgba(255,255,255,0.5)';
      cx.fillText(s.icon, x + chipW/2, y + 26);
      cx.font = '600 22px Arial, sans-serif';
      cx.fillStyle = 'white';
      cx.fillText(s.val, x + chipW/2, y + 54);
    });

    // ── Bottom branding strip ────────────────────────────────────
    cx.fillStyle = 'rgba(255,69,0,0.12)';
    cx.fillRect(0, SIZE - 100, SIZE, 100);
    cx.fillStyle = '#FF4500';
    cx.font = '700 30px Arial, sans-serif'; cx.textAlign = 'center';
    cx.fillText('Made with ⚡ Jiff', SIZE/2, SIZE - 55);
    cx.font = '300 20px Arial, sans-serif';
    cx.fillStyle = 'rgba(255,255,255,0.3)';
    cx.fillText('jiff-ecru.vercel.app', SIZE/2, SIZE - 22);

    // ── Download ─────────────────────────────────────────────────
    const link = document.createElement('a');
    link.download = 'jiff-' + (meal.name || 'recipe').toLowerCase().replace(/[^a-z0-9]+/g, '-') + '.png';
    link.href = canvas.toDataURL('image/png', 0.95);
    link.click();
  };

  // ── Fetch video ────────────────────────────────────────────────
  const fetchVideo = async () => {
    if (videoData || videoLoading) return;
    setVideoLoading(true);
    try {
      const cuisine = meal.cuisine || '';
      const res = await fetch(`/api/videos?recipe=${encodeURIComponent(meal.name)}&cuisine=${encodeURIComponent(cuisine)}&lang=${lang||'en'}`);
      const data = await res.json();
      setVideoData(data.videos?.[0] || null);
    } catch { setVideoData(null); }
    finally { setVideoLoading(false); }
  };

  // ── Ingredient substitution ────────────────────────────────────
  const fetchSub = async (ing) => {
    if (subResult[ing]) { setSubOpen(ing); return; }
    setSubOpen(ing);
    try {
      const res = await fetch('/api/suggest', {
        method: 'POST', headers: {'Content-Type':'application/json'},
        body: JSON.stringify({ kidsMode: true, kidsPromptOverride: `Suggest 2-3 practical substitutes for "${ing}" when cooking "${meal.name}". Respond ONLY with JSON: {"subs":[{"name":"substitute","note":"brief note on how to use"}]}` })
      });
      const data = await res.json();
      const raw = JSON.stringify(data);
      const m = raw.match(/"subs"\s*:\s*\[[\s\S]*?\]/);
      if (m) {
        const parsed = JSON.parse('{' + m[0] + '}');
        setSubResult(prev => ({ ...prev, [ing]: parsed.subs || [] }));
      }
    } catch {}
  };

  // ── Read aloud ─────────────────────────────────────────────────
  const readAloud = () => {
    if (!('speechSynthesis' in window)) return;
    if (speaking) { window.speechSynthesis.cancel(); setSpeaking(false); return; }
    const stepsText = meal.steps?.map((s,i) => `Step ${i+1}: ${s}`).join('. ') || '';
    const text = `${meal.name}. ${meal.description}. Ingredients: ${scaledIngs.join(', ')}. ${stepsText}`;
    const utt = new SpeechSynthesisUtterance(text);
    utt.onend = () => setSpeaking(false);
    window.speechSynthesis.speak(utt);
    setSpeaking(true);
  };

  // ── PDF export ─────────────────────────────────────────────────
  const printRecipe = () => {
    const w = window.open('', '_blank');
    w.document.write(`<!DOCTYPE html><html><head><title>${meal.name}</title><style>
      body{font-family:Arial,sans-serif;max-width:600px;margin:40px auto;color:#1C0A00;line-height:1.6}
      h1{color:#FF4500;font-size:24px;margin-bottom:4px}
      .meta{color:#7C6A5E;font-size:13px;margin-bottom:16px}
      h2{font-size:14px;text-transform:uppercase;letter-spacing:1px;color:#7C6A5E;margin:20px 0 8px}
      ul,ol{padding-left:20px}li{margin-bottom:6px;font-size:13px}
      .footer{margin-top:32px;padding-top:12px;border-top:1px solid #eee;font-size:11px;color:#aaa;text-align:center}
      @media print{body{margin:20px}}
    </style></head><body>
      <h1>${meal.emoji} ${meal.name}</h1>
      <div class="meta">⏱ ${meal.time} · 👥 ${servings} servings · 📊 ${meal.difficulty} · 🔥 ${meal.calories}</div>
      <p style="font-size:13px;color:#3D2010">${meal.description}</p>
      <h2>Ingredients</h2><ul>${scaledIngs.map(i=>`<li>${i}</li>`).join('')}</ul>
      <h2>Method</h2><ol>${meal.steps?.map(s=>`<li>${s}</li>`).join('')||''}</ol>
      ${meal.fun_fact?`<p style="background:#FFF0E5;padding:10px;border-radius:6px;font-size:12px;margin-top:16px">💡 ${meal.fun_fact}</p>`:''}
      <div class="footer">Made with ⚡ Jiff · jiff-ecru.vercel.app</div>
    </body></html>`);
    w.document.close();
    w.print();
  };

  return (
    <div className={`meal-card ${expanded?'expanded':''} ${isFavourite?'is-fav':''}`} style={{animationDelay:`${animDelay}s`}}
      onClick={()=>{if(!expanded&&!shareOpen&&!groceryOpen)setExpanded(true);}}>
      <div className="meal-hdr">
        <div className="meal-hdr-top">
          <div className="meal-num">{showFavTag?'❤️ Saved':`Option ${index+1}`}</div>
          <div className="meal-hdr-actions">
            <button className={`heart-btn ${isFavourite?'saved':''}`} onClick={e=>{e.stopPropagation();onToggleFav(meal);}}><IconHeart filled={isFavourite}/></button>
          </div>
        </div>
        <div className="meal-name">{meal.emoji} {meal.name}</div>
        <div className="meal-meta">
          <span className="meal-meta-item">⏱ {meal.time}</span>
          <span className="meal-meta-item">👥 {servings} serving{servings!==1?'s':''}{isScaled?` (was ${baseServings})`:''}</span>
          <span className="meal-meta-item">📊 {meal.difficulty}</span>
        </div>
      </div>
      <div className="meal-desc">{meal.description}</div>
      {/* ── Rating + Share row ── */}
      <div style={{padding:'10px 0 4px',borderTop:'1px solid rgba(28,10,0,0.06)',marginTop:4}}>
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',gap:8}}>
          <div>
            <div style={{fontSize:10,color:'var(--muted)',fontWeight:300,marginBottom:4,letterSpacing:'0.3px'}}>
              {rating > 0 ? 'Your rating' : 'How was this recipe?'}
            </div>
            <div style={{display:'flex',gap:1,alignItems:'center'}}>
              {[1,2,3,4,5].map(s=>(
            <button key={s}
              onMouseEnter={()=>setHoverStar(s)}
              onMouseLeave={()=>setHoverStar(0)}
              onClick={e=>{e.stopPropagation();onRate&&onRate(s);}}
              style={{background:'none',border:'none',cursor:'pointer',fontSize:18,padding:'0 1px',lineHeight:1,transition:'transform 0.12s',transform:(hoverStar||rating)>=s?'scale(1.25)':'scale(1)',filter:(hoverStar||rating)>=s?'none':'grayscale(1) opacity(0.4)'}}>
              ⭐
            </button>
          ))}
              {rating > 0 && (
                <span style={{fontSize:10,color:'var(--jiff)',fontWeight:600,marginLeft:6,letterSpacing:'0.5px'}}>
                  {['','Poor','Ok','Good','Great','Loved it!'][rating]}
                </span>
              )}
            </div>
          </div>
          {/* ── Action buttons row: video, read, pdf, share ── */}
        <div style={{display:'flex',gap:6,marginLeft:'auto',alignItems:'center',flexWrap:'wrap',justifyContent:'flex-end'}}>
          <button onClick={e=>{e.stopPropagation();fetchVideo();setVideoOpen(p=>!p);}}
            title="Watch recipe video"
            style={{padding:'5px 10px',borderRadius:8,border:'1px solid rgba(204,0,0,0.25)',background:'rgba(204,0,0,0.05)',color:'#CC0000',fontSize:11,fontWeight:500,cursor:'pointer',display:'flex',alignItems:'center',gap:4}}>
            ▶ Video
          </button>
          <button onClick={e=>{e.stopPropagation();readAloud();}}
            title="Read recipe aloud"
            style={{padding:'5px 10px',borderRadius:8,border:'1px solid rgba(28,10,0,0.12)',background:speaking?'rgba(255,69,0,0.07)':'white',color:speaking?'var(--jiff)':'var(--muted)',fontSize:11,cursor:'pointer'}}>
            {speaking?'⏹':'🔊'}
          </button>
          <button onClick={e=>{e.stopPropagation();printRecipe();}}
            title="Save as PDF"
            style={{padding:'5px 10px',borderRadius:8,border:'1px solid rgba(28,10,0,0.12)',background:'white',color:'var(--muted)',fontSize:11,cursor:'pointer'}}>
            📄
          </button>
          {/* ── Merged share button ── */}
        <div style={{position:'relative'}}>
          <button onClick={e=>{e.stopPropagation();setShareOpen(p=>!p);}}
            style={{background:'linear-gradient(135deg,#FF4500,#CC3700)',color:'white',border:'none',borderRadius:8,padding:'4px 12px',fontSize:11,fontWeight:500,cursor:'pointer',display:'flex',alignItems:'center',gap:4,fontFamily:"'DM Sans',sans-serif",boxShadow:'0 2px 6px rgba(255,69,0,0.25)'}}>
            📤 Share
          </button>
          {shareOpen && (
            <div onClick={e=>e.stopPropagation()} style={{position:'absolute',right:0,bottom:'calc(100% + 6px)',background:'white',border:'1px solid rgba(28,10,0,0.12)',borderRadius:12,boxShadow:'0 8px 24px rgba(28,10,0,0.12)',padding:'8px',zIndex:50,minWidth:180,fontFamily:"'DM Sans',sans-serif"}}>
              <div style={{fontSize:10,letterSpacing:'1px',textTransform:'uppercase',color:'#9E9E9E',padding:'2px 8px 6px',fontWeight:500}}>Share this recipe</div>
              {/* WhatsApp */}
              <a href={`https://wa.me/?text=${encodeURIComponent(buildShareText(meal))}`}
                target="_blank" rel="noopener noreferrer" onClick={()=>setShareOpen(false)}
                style={{display:'flex',alignItems:'center',gap:8,padding:'7px 10px',borderRadius:8,textDecoration:'none',color:'#1C0A00',fontSize:12,transition:'background 0.1s'}}
                onMouseEnter={e=>e.currentTarget.style.background='rgba(28,10,0,0.05)'}
                onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
                <span style={{fontSize:16}}>💬</span> Share on WhatsApp
              </a>
              {/* Copy text */}
              <button onClick={async e=>{e.stopPropagation();try{await navigator.clipboard.writeText(buildShareText(meal));}catch{} setShareOpen(false);}}
                style={{display:'flex',alignItems:'center',gap:8,padding:'7px 10px',borderRadius:8,width:'100%',background:'none',border:'none',color:'#1C0A00',fontSize:12,cursor:'pointer',fontFamily:"'DM Sans',sans-serif",textAlign:'left',transition:'background 0.1s'}}
                onMouseEnter={e=>e.currentTarget.style.background='rgba(28,10,0,0.05)'}
                onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
                <span style={{fontSize:16}}>📋</span> Copy recipe text
              </button>
              {/* Download image */}
              <button onClick={e=>{e.stopPropagation();generateShareCard();setShareOpen(false);}}
                style={{display:'flex',alignItems:'center',gap:8,padding:'7px 10px',borderRadius:8,width:'100%',background:'none',border:'none',color:'#1C0A00',fontSize:12,cursor:'pointer',fontFamily:"'DM Sans',sans-serif",textAlign:'left',transition:'background 0.1s'}}
                onMouseEnter={e=>e.currentTarget.style.background='rgba(28,10,0,0.05)'}
                onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
                <span style={{fontSize:16}}>🖼️</span> Download image
              </button>
            </div>
          )}
        </div>
        </div>
      </div>
      </div>

      {shareOpen&&<ShareDrawer meal={meal}/>}
      {!groceryOpen?(
        <button className="grocery-trigger" onClick={e=>{e.stopPropagation();setGroceryOpen(true);}}>
          <span style={{display:'flex',alignItems:'center',gap:5}}><IconCart/>{t('what_to_buy')}</span>
          <span style={{fontSize:11,color:'var(--muted)',fontWeight:400}}>{t('see_list')}</span>
        </button>
      ):<GroceryPanel meal={meal} fridgeIngredients={fridgeIngredients} onClose={()=>setGroceryOpen(false)} country={country}/>}
      {!expanded?(
        <button className="expand-btn" onClick={e=>{e.stopPropagation();setExpanded(true);}}><span>{t('see_full_recipe')}</span><span>→</span></button>
      ):(
        <div className="recipe" onClick={e=>e.stopPropagation()}>
          {/* Scaler */}
          <div className="scaler-bar">
            <div className="scaler-label"><IconScaler/>{t('servings_label')}</div>
            <div className="scaler-controls">
              <button className="scaler-btn" disabled={servings<=1} onClick={e=>{e.stopPropagation();setServings(s=>Math.max(1,s-1));}}>−</button>
              <div className="scaler-count">{servings}</div>
              <button className="scaler-btn" disabled={servings>=20} onClick={e=>{e.stopPropagation();setServings(s=>Math.min(20,s+1));}}>+</button>
            </div>
            {isScaled?<span className="scaler-badge">×{(ratio%1===0?ratio:ratio.toFixed(2).replace(/\.?0+$/,''))}</span>:<span className="scaler-orig">Base: {baseServings} servings</span>}
          </div>
          <div className="recipe-sec" style={{marginTop:0,paddingTop:12,borderTop:'1px solid rgba(255,69,0,0.12)'}}>{t('recipe_ingredients')}</div>
          {/* Video panel */}
          {videoOpen && (
            <div style={{marginBottom:14,borderRadius:12,overflow:'hidden',border:'1px solid rgba(204,0,0,0.2)'}}>
              {videoLoading && <div style={{padding:'16px',textAlign:'center',fontSize:12,color:'var(--muted)'}}>Searching for video…</div>}
              {!videoLoading && videoData && (
                <>
                  <iframe src={videoData.embedUrl} title={videoData.title} width="100%" height="200" frameBorder="0" allowFullScreen style={{display:'block'}} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"/>
                  <div style={{padding:'6px 10px',background:'rgba(204,0,0,0.04)',fontSize:10,color:'var(--muted)'}}>{videoData.title} — {videoData.channel}</div>
                </>
              )}
              {!videoLoading && !videoData && <div style={{padding:'12px',textAlign:'center',fontSize:12,color:'var(--muted)'}}>No video found for this recipe.</div>}
            </div>
          )}
          <ul className="ing-list">{scaledIngs.map((ing,j)=><li key={j} style={{position:'relative'}}><span className={ing!==(meal.ingredients?.[j]||'')&&isScaled?'scaled-highlight':''}>{ing}</span></li>)}</ul>
          {/* Substitution modal */}
          {subOpen && (
            <div onClick={e=>e.stopPropagation()} style={{margin:'8px 0 12px',padding:'12px 14px',background:'rgba(255,69,0,0.04)',border:'1px solid rgba(255,69,0,0.15)',borderRadius:10}}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:8}}>
                <span style={{fontSize:11,fontWeight:500,color:'var(--jiff)'}}>Substitutes for <em>{subOpen}</em></span>
                <button onClick={()=>setSubOpen(null)} style={{background:'none',border:'none',cursor:'pointer',fontSize:16,color:'var(--muted)'}}>×</button>
              </div>
              {!subResult[subOpen] && <div style={{fontSize:12,color:'var(--muted)'}}>Finding substitutes…</div>}
              {subResult[subOpen]?.map((s,k)=>(
                <div key={k} style={{fontSize:12,marginBottom:6}}>
                  <strong style={{color:'var(--ink)'}}>{s.name}</strong>
                  <span style={{color:'var(--muted)',marginLeft:6}}>{s.note}</span>
                </div>
              ))}
            </div>
          )}
          <div className="recipe-sec">{t('recipe_method')}</div>
          <ol className="steps-list">{meal.steps?.map((s,j)=><StepWithTimer key={j} text={s}/>)}</ol>
          <div className="recipe-sec">Nutrition{isScaled&&<span style={{marginLeft:7,fontSize:9,color:'var(--muted)',fontWeight:400,textTransform:'none',letterSpacing:0}}>scaled for {servings}</span>}</div>
          <div className="nutr-grid">
            {[['Calories',scaledCal],['Protein',scaledPro],['Carbs',scaledCarbs],['Fat',scaledFat]].map(([lbl,val])=>(
              <div key={lbl} className="nutr-item"><div className={`nutr-val ${isScaled?'scaled-highlight':''}`}>{val}</div><div className="nutr-lbl">{lbl}</div></div>
            ))}
          </div>
          {/* Order food */}
          {orderOpen && (
            <div onClick={e=>e.stopPropagation()} style={{margin:'12px 0',padding:'12px 14px',background:'rgba(28,10,0,0.02)',border:'1px solid rgba(28,10,0,0.08)',borderRadius:12}}>
              <div style={{fontSize:11,fontWeight:500,color:'var(--ink)',marginBottom:8}}>Order <em>{meal.name}</em> from</div>
              <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
                {[
                  {name:'Swiggy',  color:'#FC8019', url:`https://www.swiggy.com/search?query=${encodeURIComponent(meal.name)}`},
                  {name:'Zomato',  color:'#CB202D', url:`https://www.zomato.com/search?q=${encodeURIComponent(meal.name)}`},
                  {name:'EatSure', color:'#E84855', url:`https://eatsure.com/search?query=${encodeURIComponent(meal.name)}`},
                ].map(d=>(
                  <a key={d.name} href={d.url} target="_blank" rel="noopener noreferrer" onClick={e=>e.stopPropagation()}
                    style={{padding:'7px 14px',borderRadius:10,textDecoration:'none',fontSize:12,fontWeight:600,color:'white',background:d.color}}>
                    {d.name} →
                  </a>
                ))}
              </div>
            </div>
          )}
          <div style={{display:'flex',gap:8,marginBottom:8}}>
            <button onClick={e=>{e.stopPropagation();setOrderOpen(p=>!p);}}
              style={{padding:'6px 12px',borderRadius:10,border:'1px solid rgba(28,10,0,0.12)',background:'white',fontSize:11,cursor:'pointer',color:'var(--muted)',display:'flex',alignItems:'center',gap:4}}>
              🛵 {orderOpen ? 'Hide' : "Can't cook? Order"}
            </button>
          </div>
          <button onClick={e=>{e.stopPropagation();setCookMode(true);setCookStep(0);}}
            style={{width:'100%',padding:'12px',borderRadius:12,border:'none',background:'linear-gradient(135deg,#1C0A00,#3D1500)',color:'white',fontSize:13,fontWeight:600,cursor:'pointer',marginBottom:8,display:'flex',alignItems:'center',justifyContent:'center',gap:8}}>
            👨‍🍳 Start Cooking — Cook Mode
          </button>
          <button className="collapse-btn" onClick={()=>setExpanded(false)}><span>{t('collapse')}</span><span>↑</span></button>
        </div>
      )}
    </div>

    {/* Cook Mode overlay */}
    {cookMode && (
      <div onClick={e=>e.stopPropagation()} style={{position:'fixed',inset:0,background:'rgba(28,10,0,0.97)',zIndex:9999,display:'flex',flexDirection:'column',padding:'28px 24px',fontFamily:"'DM Sans',sans-serif"}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:24}}>
          <div>
            <div style={{fontFamily:"'Fraunces',serif",fontSize:22,fontWeight:900,color:'white'}}>{meal.emoji} {meal.name}</div>
            <div style={{fontSize:12,color:'rgba(255,255,255,0.5)',marginTop:2}}>Step {cookStep+1} of {meal.steps?.length||0}</div>
          </div>
          <button onClick={()=>{setCookMode(false);setCookStep(0);window.speechSynthesis?.cancel();}}
            style={{background:'rgba(255,255,255,0.1)',border:'none',color:'white',borderRadius:10,padding:'8px 16px',cursor:'pointer',fontSize:13}}>
            ✕ Exit
          </button>
        </div>
        {/* Step display */}
        <div style={{flex:1,display:'flex',flexDirection:'column',justifyContent:'center',maxWidth:600,margin:'0 auto',width:'100%'}}>
          <div style={{fontSize:13,color:'rgba(255,69,0,0.8)',fontWeight:600,marginBottom:12,letterSpacing:'1px',textTransform:'uppercase'}}>
            Step {cookStep+1}
          </div>
          <div style={{fontSize:22,color:'white',lineHeight:1.6,fontWeight:300,marginBottom:32}}>
            {meal.steps?.[cookStep]}
          </div>
          {/* Step dots */}
          <div style={{display:'flex',gap:6,marginBottom:32,flexWrap:'wrap'}}>
            {meal.steps?.map((_,i)=>(
              <div key={i} onClick={()=>setCookStep(i)}
                style={{width:i===cookStep?28:8,height:8,borderRadius:4,background:i===cookStep?'#FF4500':i<cookStep?'rgba(255,69,0,0.4)':'rgba(255,255,255,0.2)',transition:'all 0.2s',cursor:'pointer'}}/>
            ))}
          </div>
          {/* Navigation */}
          <div style={{display:'flex',gap:12}}>
            <button onClick={()=>setCookStep(s=>Math.max(0,s-1))} disabled={cookStep===0}
              style={{flex:1,padding:'14px',borderRadius:14,border:'1px solid rgba(255,255,255,0.15)',background:'rgba(255,255,255,0.08)',color:cookStep===0?'rgba(255,255,255,0.3)':'white',fontSize:15,cursor:cookStep===0?'not-allowed':'pointer'}}>
              ← Previous
            </button>
            {cookStep < (meal.steps?.length||0)-1 ? (
              <button onClick={()=>setCookStep(s=>s+1)}
                style={{flex:2,padding:'14px',borderRadius:14,border:'none',background:'#FF4500',color:'white',fontSize:15,fontWeight:600,cursor:'pointer'}}>
                Next step →
              </button>
            ) : (
              <button onClick={()=>{setCookMode(false);setCookStep(0);}}
                style={{flex:2,padding:'14px',borderRadius:14,border:'none',background:'#1D9E75',color:'white',fontSize:15,fontWeight:600,cursor:'pointer'}}>
                ✓ Done cooking!
              </button>
            )}
          </div>
        </div>
      </div>
    )}
  );
}

// ── Main ──────────────────────────────────────────────────────────
// ── LoadingView — shows latency warning after 10s ─────────────────
function LoadingView({ cuisine, mealType, ingredients, isPremium, PAID_RECIPE_CAP, factIdx }) {
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
            '--tx': `${[60,-60,50,-50][i]}px`,
            '--ty': `${[-40,-30,-55,-25][i]}px`,
            animationDelay: `${i*0.3}s`,
            animationDuration: `${1.2 + i*0.2}s`,
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
        {cuisine !== 'any'
          ? `Finding ${cuisine}${mealType !== 'any' ? ' ' + mealType : ''} recipes…`
          : `Jiffing your ${mealType !== 'any' ? mealType : 'meal'}…`}
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


export default function Jiff() {
  const navigate = useNavigate();
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
  const [showFavs,     setShowFavs]     = useState(false);
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
  const [showSurprise,   setShowSurprise]   = useState(false);
  const [familySelected, setFamilySelected] = useState([]);  // [] = everyone
  const [pantryNudge,    setPantryNudge]    = useState([]);   // items used in last generation
  const [showSeasonalPicker, setShowSeasonalPicker] = useState(false);
  const [ratings,        setRatings]        = useState(()=>{ try{ return JSON.parse(localStorage.getItem('jiff-ratings')||'{}'); }catch{return {};} });
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
    setView('loading'); setFactIdx(0); setShowFavs(false);
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

  const handleSubmit = async () => {
    if (!ingredients.length) return;
    // Mandate sign-in before any generation
    if (!user) { setGateDismissed(false); return; }
    if (!checkAccess('generation')) return;
    setView('loading'); setFactIdx(0); setShowFavs(false);
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
        // ── Streak update ────────────────────────────────────────────
        try {
          const today = new Date().toDateString();
          const data  = JSON.parse(localStorage.getItem('jiff-streak') || '{}');
          const yesterday = new Date(Date.now() - 86400000).toDateString();
          const newCount = data.lastDate === yesterday ? (data.count || 0) + 1 : 1;
          localStorage.setItem('jiff-streak', JSON.stringify({ count: newCount, lastDate: today }));
          setStreak(newCount);
        } catch {}

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
        try {
          const existing = JSON.parse(localStorage.getItem('jiff-history') || '[]');
          localStorage.setItem('jiff-history', JSON.stringify([histEntry, ...existing].slice(0, 50)));
        } catch {}
        if (user) {
          fetch('/api/meal-history', {
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
  };

  // ── Streak tracking ──────────────────────────────────────────────
  useEffect(() => {
    try {
      const today = new Date().toDateString();
      const data  = JSON.parse(localStorage.getItem('jiff-streak') || '{}');
      const last  = data.lastDate;
      const yesterday = new Date(Date.now() - 86400000).toDateString();
      if (last === today) {
        setStreak(data.count || 1);
      } else if (last === yesterday) {
        setStreak(data.count || 1);
      } else {
        setStreak(0);
      }
    } catch {}
  }, []);

  const reset = () => { setView('input'); setMeals([]); setFridgeItems([]); setPantryItems(pantry||[]); setShowFavs(false); setPantryLoaded(true); };

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
                  <div key={plan.id} className={`gate-plan ${gatePlan===plan.id?'selected':''}`} onClick={()=>setGatePlan(plan.id)}>
                    <div className="gate-plan-price">{plan.price}</div>
                    <div className="gate-plan-label">{plan.label}<br/>{plan.period}</div>
                    {plan.saving&&<div className="gate-plan-saving">{plan.saving}</div>}
                  </div>
                ))}
              </div>
              <button className="gate-cta" disabled={gateLoading} onClick={handleGateUpgrade}>
                {gateLoading?'⏳ Processing…':'⚡ Upgrade now'}
              </button>
              {gateReason==='trial_expired'&&<button className="gate-skip" onClick={()=>navigate('/')}>← Back to home</button>}
              {!razorpayEnabled&&<div style={{fontSize:11,color:'var(--muted)',marginTop:8}}>Test mode — click to activate free premium</div>}
            </div>
          </div>
        )}

        {/* ── Header ── */}
        <header className="header">
          <JiffLogo size="md" spinning={view==='loading'} onClick={()=>navigate('/')} />
          <div className="header-right">
            {trialActive && <div className="trial-badge">⏳ Trial: {trialDaysLeft}d left</div>}
            <button className={`hdr-btn ${favourites.length>0?'fav-active':''}`} onClick={()=>{if(!user){alert('Sign in to save and view your favourite recipes.');return;}setShowFavs(p=>!p);}}>
                <IconHeart filled={favourites.length>0}/>Favourites{favourites.length>0&&<span className="fav-badge">{favourites.length}</span>}
              </button>
            <button className="hdr-btn" onClick={()=>navigate('/planner')}>📅 {t('week_plan')}</button>
            {user && <button className="hdr-btn" onClick={()=>navigate('/plans')}>🎯 {t('goal_plans')}</button>}
            {user && <button className="hdr-btn" onClick={()=>navigate('/little-chefs')}>👶 Kids Meals</button>}
            {user && <button className="hdr-btn" onClick={()=>navigate('/sacred')}>✨ Sacred Kitchen</button>}
            {user && <button className="hdr-btn" onClick={()=>navigate('/insights')}>📊 Insights</button>}
            {user && !isPremium && <button className="hdr-btn premium" onClick={()=>navigate('/pricing')}>⚡ {t('go_premium')}</button>}
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
                          <div key={n.id} className={`notif-item ${n.read ? '' : 'unread'}`}>
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
                      {label:'👤 My Profile',   action:()=>navigate('/profile')},
                      {label:'⚙️ Settings',      action:()=>navigate('/profile')},
                      {label:'📜 History',       action:()=>navigate('/history')},
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

        {/* ── Favourites panel ── */}
        {showFavs && user && (
          <div className="favs-panel">
            <div className="favs-panel-header">
              <div><div className="favs-panel-title"><IconHeart filled/>{t('favs_title')}</div><div className="favs-panel-sub">{favourites.length===0?'Nothing saved yet':`${favourites.length} saved recipe${favourites.length>1?'s':''}`}</div></div>
              <button className="favs-close-btn" onClick={()=>setShowFavs(false)}>Close ×</button>
            </div>
            {favourites.length===0?(
              <div className="favs-empty"><div className="favs-empty-icon">🤍</div><div className="favs-empty-title">{t('favs_empty_title')}</div><div className="favs-empty-sub">Tap ♥ on any recipe card to save it here.</div></div>
            ):(
              <div className="favs-grid">{(Array.isArray(favourites)?favourites:[]).map((meal,i)=><MealCard key={mealKey(meal)} meal={meal} index={i} isFavourite={isFav(meal)} onToggleFav={toggleFavourite} defaultServings={defaultServings} showFavTag animDelay={i*0.05} rating={ratings[mealKey(meal)]||0}/>)}</div>
            )}
          </div>
        )}

        {/* ── Input view ── */}
        {view === 'input' && (
          <div className="main-layout">
            <div className="main-form">
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
              {/* Smart greeting with weather/time/location */}
              {user && (
                <SmartGreeting
                  user={user}
                  profile={profile}
                  onCountryDetected={(code) => setCountry(code)}
                  onSuggestRecipe={(suggestion, autoMealType) => {
                    if (autoMealType && autoMealType !== 'any') setMealType(autoMealType);
                    // Pre-fill the suggested dish as a fridge ingredient hint and auto-submit
                    if (suggestion?.dish) {
                      setFridgeItems(prev => prev.includes(suggestion.dish.toLowerCase()) ? prev : [...prev, suggestion.dish.toLowerCase()]);
                    }
                    // Small delay so state settles before submit
                    setTimeout(() => { if (ingredients.length || suggestion?.dish) handleSubmit(); }, 150);
                  }}
                />
              )}

              {/* ── Streak badge + Seasonal nudge ── */}
              <div style={{display:'flex',gap:8,flexWrap:'wrap',marginBottom:12,alignItems:'center'}}>
                {streak >= 2 && (
                  <div style={{display:'inline-flex',alignItems:'center',gap:5,background:'rgba(255,184,0,0.1)',border:'1px solid rgba(255,184,0,0.3)',borderRadius:20,padding:'4px 12px',fontSize:12,color:'#854F0B',fontWeight:500}}>
                    🔥 {streak}-day streak!
                  </div>
                )}
                {season?.items?.length > 0 && (
                  <div style={{position:'relative',display:'inline-block'}}>
                    <div style={{display:'inline-flex',alignItems:'center',gap:5,background:'rgba(29,158,117,0.08)',border:'1px solid rgba(29,158,117,0.2)',borderRadius:20,padding:'4px 12px',fontSize:12,color:'#1D9E75',fontWeight:300,cursor:'pointer'}}
                      onClick={()=>setShowSeasonalPicker(p=>!p)}>
                      {season.emoji} In season: {season.items.slice(0,3).join(', ')} · <span style={{fontWeight:500}}>tap to add</span>
                    </div>
                    {showSeasonalPicker && (
                      <>
                        <div onClick={()=>setShowSeasonalPicker(false)} style={{position:'fixed',inset:0,zIndex:49}}/>
                        <div style={{position:'absolute',top:'calc(100% + 6px)',left:0,background:'white',border:'1px solid rgba(28,10,0,0.12)',borderRadius:12,boxShadow:'0 8px 24px rgba(28,10,0,0.12)',padding:'12px 14px',zIndex:50,minWidth:260,fontFamily:"'DM Sans',sans-serif"}}>
                          <div style={{fontSize:11,letterSpacing:'1px',textTransform:'uppercase',color:'#1D9E75',fontWeight:600,marginBottom:8}}>Pick an ingredient to add</div>
                          <div style={{display:'flex',flexWrap:'wrap',gap:5,marginBottom:10}}>
                            {season.items.slice(0,6).map(item=>(
                              <button key={item} onClick={()=>{if(!fridgeItems.includes(item))setFridgeItems(p=>[...p,item]);setShowSeasonalPicker(false);}}
                                style={{padding:'4px 11px',borderRadius:20,border:'1.5px solid rgba(28,10,0,0.15)',background:'white',fontSize:11,cursor:'pointer',fontFamily:"'DM Sans',sans-serif",transition:'all 0.1s'}}
                                onMouseEnter={e=>e.target.style.borderColor='#1D9E75'}
                                onMouseLeave={e=>e.target.style.borderColor='rgba(28,10,0,0.15)'}>
                                {item}
                              </button>
                            ))}
                          </div>
                          <div style={{borderTop:'1px solid rgba(28,10,0,0.08)',paddingTop:10,fontSize:11,color:'#7C6A5E',marginBottom:6}}>Don't have it? Order now:</div>
                          <div style={{display:'flex',gap:6}}>
                            {[['Blinkit','#1A8A3E'],['Zepto','#5B21B6'],['Swiggy','#FC8019']].map(([name,color])=>(
                              <a key={name} href={'https://'+name.toLowerCase()+'.com/s/?q='+encodeURIComponent(season.items.slice(0,3).join(' '))} target="_blank" rel="noopener noreferrer"
                                onClick={()=>setShowSeasonalPicker(false)}
                                style={{flex:1,background:color,color:'white',borderRadius:8,padding:'6px 0',fontSize:10,fontWeight:600,cursor:'pointer',textDecoration:'none',display:'flex',alignItems:'center',justifyContent:'center'}}>
                                {name}
                              </a>
                            ))}
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>

              <div style={{marginBottom:6}}>
                <h1 style={{fontFamily:"'Fraunces', serif",fontSize:'clamp(26px,4vw,40px)',fontWeight:900,color:'var(--ink)',letterSpacing:'-1px',lineHeight:1.05,marginBottom:6}}>
                  {t('main_heading')}
                </h1>
                <p style={{fontSize:13,color:'var(--muted)',fontWeight:300,marginBottom:20}}>
                  {isPremium ? `⚡ Premium · ${PAID_RECIPE_CAP} recipes per search` : trialActive ? `🎁 Free trial · 1 recipe preview · ${trialDaysLeft} days left` : ''}
                </p>
              </div>
              <div className="card">

                {/* ── What's in your fridge? — photo + text input for veg/meat/main items ── */}
                <div className="section">
                  <div className="section-label" style={{marginBottom:6}}>{t('fridge_label')}</div>
                  <div style={{fontSize:11,color:'var(--muted)',fontWeight:300,marginBottom:10}}>{t('fridge_sub')}</div>
                  <FridgePhotoUpload
                    onIngredientsDetected={detected => setFridgeItems(prev => [...new Set([...prev, ...detected])])}
                    existingIngredients={fridgeItems}
                  />
                  <div style={{fontSize:11,color:'var(--muted)',textAlign:'center',margin:'8px 0',fontWeight:400,letterSpacing:'0.5px'}}>{t('or_type_below')}</div>
                  <IngredientInput
                    ingredients={fridgeItems}
                    onChange={setFridgeItems}
                    pantryIngredients={[]}
                    placeholder="cabbage, chicken, eggs, potatoes…"
                    lang={lang}
                  />
                </div>

                {/* ── Pantry & Spices — pre-populated from profile ── */}
                <div className="section">
                  <div className="section-label">
                    {t('pantry_label')}
                    {pantry?.length > 0 && (
                      <span style={{fontSize:10,fontWeight:400,color:'var(--muted)',marginLeft:8,textTransform:'none',letterSpacing:0}}>
                        {t('pantry_prepopulated')}
                      </span>
                    )}
                  </div>
                  <div style={{fontSize:11,color:'var(--muted)',fontWeight:300,marginBottom:8}}>{t('pantry_sub')}</div>
                  <IngredientInput
                    ingredients={pantryItems}
                    onChange={setPantryItems}
                    pantryIngredients={pantry || []}
                    placeholder="salt, oil, cumin, turmeric, garlic…"
                  />
                </div>

                {/* ── Meal Type, Servings & Time — 3 column layout ── */}
                <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:12,marginBottom:18}}>
                  {/* Meal Type */}
                  <div style={{background:'rgba(255,250,245,0.8)',border:'1px solid rgba(28,10,0,0.08)',borderRadius:12,padding:'12px 14px'}}>
                    <div style={{fontSize:10,letterSpacing:'1.5px',textTransform:'uppercase',color:'var(--jiff)',fontWeight:600,marginBottom:8}}>{t('section_meal_type')}</div>
                    <div style={{display:'flex',flexDirection:'column',gap:4}}>
                      {MEAL_TYPE_OPTIONS.map(o=>(
                        <button key={o.id}
                          className={`meal-type-chip ${mealType===o.id?'active':''}`}
                          onClick={()=>setMealType(o.id)}
                          style={{justifyContent:'flex-start',padding:'5px 8px',borderRadius:8,fontSize:12}}>
                          <span>{o.emoji}</span><span>{t('mealtype_'+o.id)||o.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                  {/* Servings */}
                  <div style={{background:'rgba(255,250,245,0.8)',border:'1px solid rgba(28,10,0,0.08)',borderRadius:12,padding:'12px 14px'}}>
                    <div style={{fontSize:10,letterSpacing:'1.5px',textTransform:'uppercase',color:'var(--jiff)',fontWeight:600,marginBottom:8}}>{t('section_servings')}</div>
                    <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:6}}>
                      <button className="serving-btn" disabled={defaultServings<=1} onClick={()=>setDefaultServings(s=>Math.max(1,s-1))}>−</button>
                      <div className="serving-count" style={{fontSize:20,minWidth:28}}>{defaultServings}</div>
                      <button className="serving-btn" disabled={defaultServings>=12} onClick={()=>setDefaultServings(s=>Math.min(12,s+1))}>+</button>
                    </div>
                    <div style={{fontSize:11,color:'var(--muted)',fontWeight:300,lineHeight:1.4}}>
                      {defaultServings} {defaultServings===1?'person':'people'}
                    </div>
                  </div>
                  {/* Time Available */}
                  <div style={{background:'rgba(255,250,245,0.8)',border:'1px solid rgba(28,10,0,0.08)',borderRadius:12,padding:'12px 14px'}}>
                    <div style={{fontSize:10,letterSpacing:'1.5px',textTransform:'uppercase',color:'var(--jiff)',fontWeight:600,marginBottom:8}}>{t('section_time')}</div>
                    <div style={{display:'flex',flexDirection:'column',gap:4}}>
                      {TIME_OPTIONS.map(o=>(
                        <button key={o.id} className={`chip ${time===o.id?'active':''}`}
                          onClick={()=>setTime(o.id)}
                          style={{borderRadius:8,fontSize:11,padding:'4px 10px',textAlign:'left'}}>
                          {o.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>


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

                {/* Surprise me — one tap, profile-based */}
                {user && profile && (
                  <div style={{marginTop:12,textAlign:'center'}}>
                    <div style={{fontSize:11,color:'var(--muted)',marginBottom:6,fontWeight:300}}>
                      or let Jiff decide for you
                    </div>
                    <button onClick={handleSurprise}
                      style={{background:'none',border:'1.5px dashed rgba(255,69,0,0.4)',borderRadius:12,padding:'8px 20px',fontSize:13,color:'var(--jiff)',cursor:'pointer',fontFamily:"'DM Sans',sans-serif",fontWeight:500,transition:'all 0.2s'}}
                      onMouseEnter={e=>{e.target.style.background='rgba(255,69,0,0.06)';}}
                      onMouseLeave={e=>{e.target.style.background='none';}}>
                      ✨ Surprise me
                    </button>
                  </div>
                )}
                  {trialActive && !isPremium && <p className="trial-note">🎁 Trial mode — you'll see 1 recipe preview. <button onClick={()=>navigate('/pricing')} style={{background:'none',border:'none',color:'#854F0B',cursor:'pointer',fontWeight:600,fontFamily:"'DM Sans',sans-serif",fontSize:'inherit',textDecoration:'underline'}}>Upgrade for {PAID_RECIPE_CAP} recipes →</button></p>}
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <div className="main-sidebar">
              {/* Trial countdown */}
              {trialActive && !isPremium && (
                <div className="trial-card">
                  <div className="trial-card-title">⏳ Free trial</div>
                  <div className="trial-bar-track"><div className="trial-bar-fill" style={{width:`${(trialDaysLeft/TRIAL_DAYS)*100}%`}}/></div>
                  <div className="trial-days">{trialDaysLeft} of {TRIAL_DAYS} days remaining</div>
                  <button className="trial-upgrade-btn" onClick={()=>navigate('/pricing')}>⚡ Upgrade — unlock {PAID_RECIPE_CAP} recipes</button>
                </div>
              )}

              {/* Your preferences card — includes language & units */}
              <div className="sidebar-card">
                <div className="sidebar-card-title">{t('your_prefs')}</div>
                {profile && profilePrefs.map(p=>(
                  <div key={p.key} className="sidebar-pref">
                    <span className="sidebar-pref-key">{p.key}</span>
                    <span className="sidebar-pref-val" style={{textTransform:'capitalize'}}>{p.val}</span>
                  </div>
                ))}
                {/* Language — inline in preferences */}
                <div className="sidebar-pref" style={{flexDirection:'column',alignItems:'flex-start',gap:4,marginTop:4}}>
                  <span className="sidebar-pref-key">{t('language_label')}</span>
                  <select value={lang} onChange={e=>setLang(e.target.value)} style={{width:'100%',border:'1.5px solid var(--border-mid)',borderRadius:8,padding:'5px 9px',fontSize:12,fontFamily:"'DM Sans',sans-serif",color:'var(--ink)',background:'white',cursor:'pointer'}}>
                    {supportedLanguages.map(l=><option key={l.id} value={l.id}>{l.flag} {l.label}</option>)}
                  </select>
                </div>
                {/* Units — inline in preferences */}
                <div className="sidebar-pref" style={{flexDirection:'column',alignItems:'flex-start',gap:4,marginTop:4}}>
                  <span className="sidebar-pref-key">{t('units_label')}</span>
                  <div style={{display:'flex',width:'100%',border:'1.5px solid var(--border-mid)',borderRadius:8,overflow:'hidden'}}>
                    {[{id:'metric',label:'Metric'},{id:'imperial',label:'Imperial'}].map(u=>(
                      <button key={u.id} onClick={()=>setUnits(u.id)} style={{flex:1,padding:'5px',fontSize:12,fontFamily:"'DM Sans',sans-serif",border:'none',cursor:'pointer',background:units===u.id?'var(--ink)':'white',color:units===u.id?'white':'var(--muted)',fontWeight:units===u.id?500:400,transition:'all 0.15s'}}>
                        {u.label}
                      </button>
                    ))}
                  </div>
                </div>
                {profile && <button className="sidebar-edit-btn" onClick={()=>navigate('/profile')}>{t('edit_prefs')}</button>}
              </div>

    {/* Cuisine card — grouped: Indian Regional + International */}
              <div className="sidebar-card">
                <div className="sidebar-card-title">{t('section_cuisine')}</div>
                <button className={`cuisine-chip ${cuisine==='any'?'active-any':''}`}
                  onClick={()=>setCuisine('any')}
                  style={{marginBottom:10,width:'100%',justifyContent:'center'}}>
                  <span style={{fontSize:13}}>🌍</span><span style={{fontSize:12}}>{t('cuisine_any')}</span>
                </button>
                <div style={{fontSize:9,letterSpacing:'1.5px',textTransform:'uppercase',color:'var(--jiff)',fontWeight:600,marginBottom:6}}>🇮🇳 Indian Regional</div>
                <div style={{display:'flex',flexWrap:'wrap',gap:5,marginBottom:12}}>
                  {INDIAN_CUISINES.map(o=>(
                    <button key={o.id}
                      className={`cuisine-chip ${cuisine===o.id?'active':profile?.preferred_cuisines?.includes(o.id)?'pref-highlight':''}`}
                      onClick={()=>setCuisine(o.id)} style={{fontSize:11,padding:'4px 9px'}}>
                      <span style={{fontSize:12}}>{o.flag}</span><span>{o.label}</span>
                    </button>
                  ))}
                </div>
                <div style={{fontSize:9,letterSpacing:'1.5px',textTransform:'uppercase',color:'var(--jiff)',fontWeight:600,marginBottom:6}}>🌐 International</div>
                <div style={{display:'flex',flexWrap:'wrap',gap:5}}>
                  {GLOBAL_CUISINES.map(o=>(
                    <button key={o.id}
                      className={`cuisine-chip ${cuisine===o.id?'active':profile?.preferred_cuisines?.includes(o.id)?'pref-highlight':''}`}
                      onClick={()=>setCuisine(o.id)} style={{fontSize:11,padding:'4px 9px'}}>
                      <span style={{fontSize:12}}>{o.flag}</span><span>{o.label}</span>
                    </button>
                  ))}
                </div>
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
          />
        )}

        {/* ── Results ── */}
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
                    try { localStorage.setItem('jiff-ratings', JSON.stringify(next)); } catch {}
                    if (supabaseEnabled && user) {
                      fetch('/api/meal-history', {
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
                  {name:'Swiggy',  color:'#FC8019', url:`https://www.swiggy.com/search?query=${encodeURIComponent(meals[0].name)}`},
                  {name:'Zomato',  color:'#CB202D', url:`https://www.zomato.com/search?q=${encodeURIComponent(meals[0].name)}`},
                  {name:'EatSure', color:'#E84855', url:`https://eatsure.com/search?query=${encodeURIComponent(meals[0].name)}`},
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
