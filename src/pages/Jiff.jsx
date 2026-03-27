import { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth }    from '../contexts/AuthContext';
import { usePremium } from '../contexts/PremiumContext';
import { useLocale }  from '../contexts/LocaleContext';
import JiffLogo        from '../components/JiffLogo';
import SmartGreeting    from '../components/SmartGreeting';
import IngredientInput  from '../components/IngredientInput';
import FridgePhotoUpload from '../components/FridgePhotoUpload';

// ── localStorage helpers (favourites for guest fallback) ─────────
const STORAGE_KEY = 'jiff-favourites';
function loadLocalFavs() { try { const r = localStorage.getItem(STORAGE_KEY); return r ? JSON.parse(r) : []; } catch { return []; } }
function saveLocalFavs(f) { try { localStorage.setItem(STORAGE_KEY, JSON.stringify(f)); } catch {} }

// ── Serving scaler helpers ────────────────────────────────────────
const FRACTIONS = { '¼':0.25,'½':0.5,'¾':0.75,'⅓':1/3,'⅔':2/3,'⅛':0.125,'⅜':0.375,'⅝':0.625,'⅞':0.875 };
const FRAC_CHARS = Object.keys(FRACTIONS).join('');
const QTY_RE = new RegExp(`^(\\*?\\s*)(\\d+(?:\\.\\d+)?)?\\s*([${FRAC_CHARS}])?(?:\\s*(\\d+)\\s*\\/\\s*(\\d+))?`);
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
  const { country: ctxCountry } = useLocale();
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
              {country === 'IN' && (
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
        {need.length > 0 && country === 'IN' && (
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
    </div>
  );
}

// ── MealCard ──────────────────────────────────────────────────────
function MealCard({ meal, index, isFavourite, onToggleFav, fridgeIngredients=[], showFavTag=false, defaultServings=2, animDelay=0, country='' }) {
  const baseServings = parseInt(meal.servings) || defaultServings;
  const [expanded, setExpanded]       = useState(false);
  const [shareOpen, setShareOpen]     = useState(false);
  const [groceryOpen, setGroceryOpen] = useState(false);
  const [servings, setServings]       = useState(baseServings);
  const ratio    = servings / baseServings;
  const isScaled = ratio !== 1;

  const scaledIngs  = (meal.ingredients||[]).map(ing=>scaleIngredient(ing,ratio));
  const scaledCal   = scaleNutrition(meal.calories||'',ratio);
  const scaledPro   = scaleNutrition(meal.protein||'',ratio);
  const scaledCarbs = scaleNutrition(meal.carbs||'',ratio);
  const scaledFat   = scaleNutrition(meal.fat||'',ratio);

  return (
    <div className={`meal-card ${expanded?'expanded':''} ${isFavourite?'is-fav':''}`} style={{animationDelay:`${animDelay}s`}}
      onClick={()=>{if(!expanded&&!shareOpen&&!groceryOpen)setExpanded(true);}}>
      <div className="meal-hdr">
        <div className="meal-hdr-top">
          <div className="meal-num">{showFavTag?'❤️ Saved':`Option ${index+1}`}</div>
          <div className="meal-hdr-actions">
            <button className={`heart-btn ${isFavourite?'saved':''}`} onClick={e=>{e.stopPropagation();onToggleFav(meal);}}><IconHeart filled={isFavourite}/></button>
            <button className="share-btn" onClick={e=>{e.stopPropagation();setShareOpen(p=>!p);}}><IconShare/>{shareOpen?'Close':'Share'}</button>
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
          <ul className="ing-list">{scaledIngs.map((ing,j)=><li key={j}><span className={ing!==(meal.ingredients?.[j]||'')&&isScaled?'scaled-highlight':''}>{ing}</span></li>)}</ul>
          <div className="recipe-sec">{t('recipe_method')}</div>
          <ol className="steps-list">{meal.steps?.map((s,j)=><StepWithTimer key={j} text={s}/>)}</ol>
          <div className="recipe-sec">Nutrition{isScaled&&<span style={{marginLeft:7,fontSize:9,color:'var(--muted)',fontWeight:400,textTransform:'none',letterSpacing:0}}>scaled for {servings}</span>}</div>
          <div className="nutr-grid">
            {[['Calories',scaledCal],['Protein',scaledPro],['Carbs',scaledCarbs],['Fat',scaledFat]].map(([lbl,val])=>(
              <div key={lbl} className="nutr-item"><div className={`nutr-val ${isScaled?'scaled-highlight':''}`}>{val}</div><div className="nutr-lbl">{lbl}</div></div>
            ))}
          </div>
          <button className="collapse-btn" onClick={()=>setExpanded(false)}><span>{t('collapse')}</span><span>↑</span></button>
        </div>
      )}
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────
// ── LoadingView — shows latency warning after 10s ─────────────────
function LoadingView({ cuisine, mealType, ingredients, isPremium, PAID_RECIPE_CAP, factIdx }) {
  const [slow, setSlow]       = useState(false);
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const start = Date.now();
    const t = setInterval(() => {
      const s = Math.floor((Date.now() - start) / 1000);
      setElapsed(s);
      if (s >= 10) setSlow(true);
    }, 1000);
    return () => clearInterval(t);
  }, []);

  const titleText = cuisine !== 'any'
    ? 'Finding ' + cuisine + (mealType !== 'any' ? ' ' + mealType : '') + ' recipes…'
    : 'Jiffing your ' + (mealType !== 'any' ? mealType : 'meal') + '…';

  const subText = 'Matching ' + ingredients.length + ' ingredient' + (ingredients.length > 1 ? 's' : '')
    + ' · ' + (isPremium ? PAID_RECIPE_CAP : 1) + ' recipe' + (isPremium && PAID_RECIPE_CAP > 1 ? 's' : '') + ' coming up';

  return (
    <div className="loading-wrap">
      <div className="spinner"/>
      <div className="loading-title">{titleText}</div>
      <div className="loading-sub">{subText}</div>
      {slow && (
        <div style={{
          marginTop:16, padding:'10px 16px',
          background:'rgba(255,69,0,0.07)',
          border:'1px solid rgba(255,69,0,0.2)',
          borderRadius:10, fontSize:13, color:'#CC3700',
          fontWeight:300, lineHeight:1.6,
        }}>
          ⏳ Taking a little longer than usual ({elapsed}s) — the AI is working hard on your recipes…
        </div>
      )}
      <div className="loading-fact">{FACTS[factIdx]}</div>
    </div>
  );
}


export default function Jiff() {
  const navigate = useNavigate();
  const { user, profile, pantry, favourites, toggleFavourite, isFav, signInWithGoogle, signInWithEmail, supabaseEnabled, authLoading } = useAuth();
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
  const [showIndianSub, setShowIndianSub] = useState(false);
  const [gateLoading,  setGateLoading]  = useState(false);

  const timerRef = useRef(null);

  // Pre-fill pantry on load into pantryItems
  useEffect(() => {
    if (!pantryLoaded && pantry?.length) { setPantryItems(pantry); setPantryLoaded(true); }
  }, [pantry, pantryLoaded]);

  // Pre-fill diet + cuisine from saved profile preferences
  const [profileLoaded, setProfileLoaded] = useState(false);
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

  const handleSubmit = async () => {
    if (!ingredients.length) return;
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
        setMeals(data.meals);
        setView('results');
        recordUsage();
        if (typeof window !== 'undefined' && window._jiffGA) {
          window._jiffGA('meal_generated', { cuisine, mealType, ingredient_count: ingredients.length, is_premium: isPremium });
        }
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

  const reset = () => { setView('input'); setMeals([]); setFridgeItems([]); setPantryItems(pantry||[]); setShowFavs(false); setPantryLoaded(true); };

  // Profile prefs for sidebar
  const profilePrefs = profile ? [
    { key: 'Spice',     val: profile.spice_level || 'Medium' },
    { key: 'Allergies', val: profile.allergies?.length ? profile.allergies.join(', ') : 'None' },
    { key: 'Cuisines',  val: profile.preferred_cuisines?.length ? profile.preferred_cuisines.slice(0,2).join(', ') : 'Any' },
    { key: 'Skill',     val: profile.skill_level || 'Intermediate' },
  ] : [];

  // Show mandatory sign-in gate
  const showSignInGate = !authLoading && !user;

  return (
    <>
      <style>{styles}</style>
      <div className="app">

        {/* ── Mandatory sign-in gate ── */}
        {showSignInGate && (
          <div className="auth-gate">
            <div className="auth-card">
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
              {gateReason!=='trial_expired'&&<button className="gate-skip" onClick={()=>setShowGate(false)}>Maybe later</button>}
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
            {user && <button className="hdr-btn" onClick={()=>navigate('/history')}>🕐 {t('history_nav')}</button>}
            {user && !isPremium && <button className="hdr-btn premium" onClick={()=>navigate('/pricing')}>⚡ {t('go_premium')}</button>}
            {user && (
              <button className="hdr-btn profile" onClick={()=>navigate('/profile')}
                style={{display:'flex',alignItems:'center',gap:6,paddingLeft:4}}>
                <span style={{
                  width:26, height:26, borderRadius:'50%',
                  background:'var(--jiff)',
                  display:'inline-flex', alignItems:'center', justifyContent:'center',
                  fontSize:15, lineHeight:1, flexShrink:0,
                  boxShadow:'0 1px 4px rgba(255,69,0,0.35)',
                  overflow:'hidden',
                }}>
                  {/* Flag emoji in a circle — uses CSS to scale up so it fills the circle */}
                  <span style={{fontSize:18,lineHeight:1,display:'block',transform:'scale(1.3)'}}>
                    {{'IN':'🇮🇳','SG':'🇸🇬','GB':'🇬🇧','AU':'🇦🇺','US':'🇺🇸','DE':'🇩🇪','FR':'🇫🇷','ES':'🇪🇸','JP':'🇯🇵','CN':'🇨🇳','CA':'🇨🇦','NZ':'🇳🇿','AE':'🇦🇪','MY':'🇲🇾','TH':'🇹🇭'}[country] || '👤'}
                  </span>
                </span>
                {profile?.name?.split(' ')[0]||t('profile_nav')}
              </button>
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
              <div className="favs-grid">{favourites.map((meal,i)=><MealCard key={mealKey(meal)} meal={meal} index={i} isFavourite={isFav(meal)} onToggleFav={toggleFavourite} defaultServings={defaultServings} showFavTag animDelay={i*0.05}/>)}</div>
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

                {/* ── Meal type — below ingredients ── */}
                <div className="section">
                  <div className="section-label">{t('section_meal_type')}</div>
                  <div className="meal-type-chips">
                    {MEAL_TYPE_OPTIONS.map(o=>(
                      <button key={o.id} className={`meal-type-chip ${mealType===o.id?'active':''}`} onClick={()=>setMealType(o.id)}>
                        <span>{o.emoji}</span><span>{t('mealtype_'+o.id)||o.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* ── Servings — single column ── */}
                <div className="section">
                  <div className="section-label">{t('section_servings')}</div>
                  <div className="serving-row">
                    <div className="serving-controls">
                      <button className="serving-btn" disabled={defaultServings<=1} onClick={()=>setDefaultServings(s=>Math.max(1,s-1))}>−</button>
                      <div className="serving-count">{defaultServings}</div>
                      <button className="serving-btn" disabled={defaultServings>=12} onClick={()=>setDefaultServings(s=>Math.min(12,s+1))}>+</button>
                    </div>
                    <span className="serving-label">serving{defaultServings!==1?'s':''} — sized for {defaultServings} {defaultServings===1?'person':'people'}</span>
                  </div>
                </div>

                {/* ── Time — single column ── */}
                <div className="section">
                  <div className="section-label">{t('section_time')}</div>
                  <div className="chips">{TIME_OPTIONS.map(o=><button key={o.id} className={`chip ${time===o.id?'active':''}`} onClick={()=>setTime(o.id)}>{o.label}</button>)}</div>
                </div>


                <div className="cta-wrap">
                  <button className="cta-btn" onClick={handleSubmit} disabled={!ingredients.length || !user}>
                    <span>⚡</span>
                    <span>Jiff it now!</span>
                  </button>
                  {!ingredients.length && <p className="cta-note">{t('cta_note')}</p>}
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

              {/* Dietary preference card */}
              <div className="sidebar-card">
                <div className="sidebar-card-title">{t('section_diet')}</div>
                {hasNonVeg && (
                  <div style={{fontSize:11,color:'#CC3700',marginBottom:6,fontWeight:300}}>
                    ⚠ {t('veg_disabled_msg')}
                  </div>
                )}
                <div style={{display:'flex',flexWrap:'wrap',gap:6}}>
                  {DIET_OPTIONS.map(o=>{
                    const disabled = hasNonVeg && o.id === 'vegetarian';
                    return (
                      <button key={o.id}
                        disabled={disabled}
                        className={`chip diet ${diet===o.id?'active':''}`}
                        onClick={()=>!disabled&&setDiet(o.id)}
                        style={disabled?{opacity:0.35,cursor:'not-allowed'}:{}}
                      >{o.label}</button>
                    );
                  })}
                </div>
              </div>

              {/* Cuisine card — below dietary preference */}
              <div className="sidebar-card">
                <div className="sidebar-card-title">{t('section_cuisine')}</div>
                {showIndianSub ? (
                  <div>
                    <button onClick={()=>setShowIndianSub(false)} style={{fontSize:11,color:'var(--muted)',background:'none',border:'none',cursor:'pointer',marginBottom:8,padding:0,fontFamily:"'DM Sans',sans-serif"}}>
                      {t('back_to_cuisines')}
                    </button>
                    <div style={{display:'flex',flexWrap:'wrap',gap:6}}>
                      {INDIAN_CUISINES.map(o=>(
                        <button key={o.id}
                          className={`cuisine-chip ${cuisine===o.id?'active':profile?.preferred_cuisines?.includes(o.id)?'pref-highlight':''}`}
                          onClick={()=>{setCuisine(o.id);setShowIndianSub(false);}}>
                          <span style={{fontSize:13}}>{o.flag}</span><span style={{fontSize:12}}>{o.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div style={{display:'flex',flexWrap:'wrap',gap:6}}>
                    {/* Preferred cuisines from profile shown highlighted */}
                    {profile?.preferred_cuisines?.length > 1 && (
                      <div style={{fontSize:10,color:'var(--muted)',width:'100%',marginBottom:4,fontWeight:300}}>
                        Your preferences: tap to select
                      </div>
                    )}
                    <button className={`cuisine-chip ${cuisine==='any'?'active-any':''}`} onClick={()=>setCuisine('any')}>
                      <span style={{fontSize:13}}>🌍</span><span style={{fontSize:12}}>{t('cuisine_any')}</span>
                    </button>
                    <button
                      className={`cuisine-chip ${INDIAN_CUISINES.some(c=>c.id===cuisine)?'active':profile?.preferred_cuisines?.some(p=>INDIAN_CUISINES.some(c=>c.id===p))?'pref-highlight':''}`}
                      onClick={()=>setShowIndianSub(true)}>
                      <span style={{fontSize:13}}>🇮🇳</span>
                      <span style={{fontSize:12}}>{INDIAN_CUISINES.some(c=>c.id===cuisine) ? cuisine : 'Indian'}</span>
                      <span style={{fontSize:10,marginLeft:2}}>▸</span>
                    </button>
                    {GLOBAL_CUISINES.map(o=>(
                      <button key={o.id}
                        className={`cuisine-chip ${cuisine===o.id?'active':profile?.preferred_cuisines?.includes(o.id)?'pref-highlight':''}`}
                        onClick={()=>setCuisine(o.id)}>
                        <span style={{fontSize:13}}>{o.flag}</span><span style={{fontSize:12}}>{o.label}</span>
                      </button>
                    ))}
                  </div>
                )}
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
                <MealCard key={mealKey(meal)+i} meal={meal} index={i} isFavourite={isFav(meal)} onToggleFav={toggleFavourite} fridgeIngredients={ingredients} defaultServings={defaultServings} animDelay={i*0.06} country={country}/>
              ))}
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
