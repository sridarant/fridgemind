// src/pages/Jiff.jsx  v1.22.22-refactor
// State + handlers + view orchestration. JSX split into: AuthGate, JiffHeader, FridgeCard, LoadingView, ResultsView
import { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation }    from 'react-router-dom';
import { useAuth }    from '../contexts/AuthContext';
import { usePremium } from '../contexts/PremiumContext';
import { useLocale, getCurrentSeason } from '../contexts/LocaleContext';
import SmartGreeting    from '../components/SmartGreeting';
import { JourneyTiles } from '../components/common/JourneyTiles.jsx';
import AuthGate    from '../components/jiff/AuthGate';
import JiffHeader  from '../components/jiff/JiffHeader';
import FridgeCard  from '../components/jiff/FridgeCard';
import LoadingView from '../components/jiff/LoadingView';
import ResultsView from '../components/jiff/ResultsView';
import { mealKey } from '../lib/mealKey.js';

const FACTS = [
  'Raiding your fridge…','Cross-referencing 50,000+ recipes…',
  'Matching cuisine and flavour profile…','Crunching nutrition numbers…','Preparing your recipes…',
];

const TILE_LOADING_MSGS = {
  family:   'Planning for the whole family... 👪',
  hosting:  'Preparing an impressive spread... 🎉',
  mood:     'Finding something that matches your vibe... 😊',
  seasonal: "Pulling in what's fresh right now... 🌿",
  weather:  "Picking recipes for today's weather... 🌤️",
  goal:     'Finding recipes that work for your goal... 🎯',
  discover: 'Getting that recipe ready... ⚡',
  planner:  'Building your 7-day menu... 📅',
  trending: 'Grabbing a trending recipe... 🔥',
  regional: "Exploring this week's region... 🌍",
  festival: 'Bringing in the festival flavours... 🎉',
};

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
  .header{display:flex;align-items:center;justify-content:space-between;padding:16px 28px;border-bottom:1px solid var(--border);position:sticky;top:0;z-index:20;background:rgba(255,250,245,0.95);backdrop-filter:blur(12px);}
  .header-right{display:flex;align-items:center;gap:8px;flex-wrap:wrap;}
  .hdr-btn{font-size:12px;font-weight:500;color:var(--muted);background:none;border:1.5px solid var(--border-mid);border-radius:8px;padding:6px 12px;cursor:pointer;font-family:'DM Sans',sans-serif;transition:all 0.18s;white-space:nowrap;display:flex;align-items:center;gap:5px;}
  .hdr-btn:hover{border-color:var(--jiff);color:var(--jiff);}
  .hdr-btn.premium{border-color:var(--gold);color:#854F0B;background:rgba(255,184,0,0.1);}
  .trial-badge{background:rgba(255,184,0,0.15);border:1px solid rgba(255,184,0,0.3);border-radius:20px;padding:4px 10px;font-size:11px;font-weight:500;color:#854F0B;white-space:nowrap;}
  .notif-btn{position:relative;background:none;border:1.5px solid var(--border-mid);border-radius:20px;padding:6px 10px;cursor:pointer;font-size:15px;display:flex;align-items:center;gap:4px;}
  .notif-badge{position:absolute;top:-4px;right:-4px;background:#E53E3E;color:white;font-size:9px;font-weight:700;border-radius:20px;padding:1px 5px;min-width:16px;text-align:center;border:2px solid white;}
  .notif-panel{position:absolute;right:0;top:calc(100% + 8px);width:320px;background:white;border:1px solid rgba(28,10,0,0.10);border-radius:16px;box-shadow:0 12px 40px rgba(28,10,0,0.14);z-index:200;overflow:hidden;}
  .notif-header{display:flex;align-items:center;justify-content:space-between;padding:12px 16px;border-bottom:1px solid rgba(28,10,0,0.08);}
  .notif-item{display:flex;gap:10px;padding:12px 16px;border-bottom:1px solid rgba(28,10,0,0.05);}
  .notif-item.unread{background:rgba(255,69,0,0.03);}
  .notif-empty{padding:28px 16px;text-align:center;color:var(--muted);font-size:13px;font-weight:300;}
  .auth-gate{position:fixed;inset:0;background:rgba(28,10,0,0.6);display:flex;align-items:center;justify-content:center;z-index:100;padding:20px;backdrop-filter:blur(4px);}
  .auth-card{background:white;border-radius:24px;padding:40px 36px;max-width:440px;width:100%;text-align:center;box-shadow:0 24px 64px rgba(28,10,0,0.2);}
  .auth-icon{font-size:48px;margin-bottom:16px;}
  .auth-title{font-family:'Fraunces',serif;font-size:28px;font-weight:900;color:var(--ink);margin-bottom:8px;letter-spacing:-0.5px;}
  .auth-sub{font-size:15px;color:var(--muted);font-weight:300;line-height:1.65;margin-bottom:28px;}
  .auth-google-btn{width:100%;background:var(--jiff);color:white;border:none;border-radius:12px;padding:16px;font-size:16px;font-weight:500;cursor:pointer;font-family:'DM Sans',sans-serif;margin-bottom:12px;transition:all 0.2s;display:flex;align-items:center;justify-content:center;gap:10px;}
  .auth-email-row{display:flex;border:1.5px solid var(--border-mid);border-radius:10px;overflow:hidden;margin-bottom:8px;}
  .auth-email-input{flex:1;border:none;outline:none;padding:12px 14px;font-size:14px;font-family:'DM Sans',sans-serif;color:var(--ink);}
  .auth-email-go{background:var(--warm);border:none;border-left:1px solid var(--border-mid);padding:12px 18px;font-size:14px;font-weight:500;cursor:pointer;color:var(--ink);font-family:'DM Sans',sans-serif;}
  .auth-magic{font-size:13px;color:var(--timer-done);font-weight:500;padding:8px;}
  .auth-perks{display:flex;flex-direction:column;gap:8px;margin-bottom:24px;text-align:left;}
  .auth-perk{display:flex;align-items:center;gap:10px;font-size:13px;color:var(--ink);font-weight:300;}
  .auth-perk-icon{width:28px;height:28px;border-radius:8px;background:var(--warm);display:flex;align-items:center;justify-content:center;font-size:14px;flex-shrink:0;}
  .gate-overlay{position:fixed;inset:0;background:rgba(28,10,0,0.5);display:flex;align-items:center;justify-content:center;z-index:100;padding:20px;}
  .gate-card{background:white;border-radius:24px;padding:36px 32px;max-width:440px;width:100%;text-align:center;box-shadow:0 24px 64px rgba(28,10,0,0.2);animation:slideUp 0.25s ease;}
  @keyframes slideUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}
  .gate-icon{font-size:44px;margin-bottom:14px;}
  .gate-title{font-family:'Fraunces',serif;font-size:26px;font-weight:900;color:var(--ink);margin-bottom:8px;}
  .gate-sub{font-size:15px;color:var(--muted);font-weight:300;line-height:1.65;margin-bottom:24px;}
  .gate-plans{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-bottom:18px;}
  .gate-plan{border:1.5px solid var(--border-mid);border-radius:12px;padding:14px 10px;cursor:pointer;text-align:center;}
  .gate-plan.selected{border-color:var(--jiff);background:rgba(255,69,0,0.05);}
  .gate-plan-price{font-family:'Fraunces',serif;font-size:20px;font-weight:900;color:var(--ink);}
  .gate-plan-label{font-size:11px;color:var(--muted);margin-top:2px;}
  .gate-plan-saving{font-size:10px;font-weight:600;color:var(--jiff);margin-top:3px;}
  .gate-cta{background:var(--jiff);color:white;border:none;border-radius:12px;padding:15px 32px;font-size:15px;font-weight:500;cursor:pointer;width:100%;font-family:'DM Sans',sans-serif;margin-bottom:10px;}
  .gate-skip{background:none;border:none;color:var(--muted);font-size:13px;cursor:pointer;font-family:'DM Sans',sans-serif;padding:4px;}
  .main-layout{max-width:700px;margin:0 auto;padding:32px 24px 60px;}
  .section-label{font-size:11px;letter-spacing:2px;text-transform:uppercase;color:var(--jiff);font-weight:500;margin-bottom:10px;}
  .cta-wrap{text-align:center;padding:16px;}
  .cta-btn{background:var(--jiff);color:white;border:none;border-radius:14px;padding:16px 40px;font-size:16px;font-family:'DM Sans',sans-serif;font-weight:500;cursor:pointer;display:inline-flex;align-items:center;gap:10px;transition:all 0.2s;}
  .cta-btn:hover:not(:disabled){background:var(--jiff-dark);transform:translateY(-2px);box-shadow:0 8px 28px rgba(255,69,0,0.35);}
  .cta-btn:disabled{opacity:0.55;cursor:not-allowed;}
  .cta-note{font-size:12px;color:var(--muted);margin-top:8px;}
  .trial-note{font-size:12px;color:#854F0B;margin-top:8px;background:rgba(255,184,0,0.1);border-radius:8px;padding:6px 12px;display:inline-block;}
  .loading-wrap{text-align:center;padding:64px 24px;max-width:480px;margin:0 auto;}
  .spinner{width:44px;height:44px;border:3px solid var(--border-mid);border-top-color:var(--jiff);border-radius:50%;animation:spin 0.7s linear infinite;margin:0 auto 20px;}
  @keyframes spin{to{transform:rotate(360deg)}}
  .loading-title{font-family:'Fraunces',serif;font-size:24px;font-weight:700;color:var(--ink);margin-bottom:8px;}
  .loading-sub{font-size:14px;color:var(--muted);font-weight:300;margin-bottom:24px;}
  .loading-fact{font-size:13px;color:var(--muted);padding:12px 0;border-top:1px solid var(--border);animation:fadeIn 0.4s ease;}
  @keyframes fadeIn{from{opacity:0}to{opacity:1}}
  .results-wrap{max-width:860px;margin:0 auto;padding:32px 24px 60px;}
  .results-header{margin-bottom:16px;}
  .results-title{font-family:'Fraunces',serif;font-size:26px;font-weight:900;color:var(--ink);margin-bottom:4px;letter-spacing:-0.5px;}
  .results-sub{font-size:13px;color:var(--muted);font-weight:300;}
  .filter-pills{display:flex;flex-wrap:wrap;gap:6px;margin-bottom:20px;}
  .filter-pill{background:white;border:1px solid var(--border-mid);border-radius:20px;padding:3px 11px;font-size:11px;color:var(--muted);}
  .meals-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(320px,1fr));gap:14px;}
  .meal-card{background:white;border:1px solid var(--border);border-radius:18px;overflow:hidden;box-shadow:var(--shadow);animation:slideUp 0.3s ease both;transition:transform 0.2s,box-shadow 0.2s;}
  .meal-card:not(.expanded){cursor:pointer;}
  .meal-card:not(.expanded):hover{transform:translateY(-3px);box-shadow:0 12px 32px rgba(28,10,0,0.12);}
  .meal-hdr{padding:18px 18px 10px;}
  .meal-hdr-top{display:flex;align-items:center;justify-content:space-between;gap:6px;margin-bottom:7px;}
  .meal-num{font-size:10px;letter-spacing:2px;text-transform:uppercase;color:var(--jiff);font-weight:600;}
  .meal-name{font-family:'Fraunces',serif;font-size:19px;font-weight:700;color:var(--ink);margin-bottom:7px;line-height:1.2;}
  .meal-meta{display:flex;gap:10px;flex-wrap:wrap;}
  .meal-meta-item{font-size:11px;color:var(--muted);}
  .meal-desc{padding:0 18px 12px;font-size:13px;color:var(--muted);line-height:1.6;font-weight:300;}
  .heart-btn{background:none;border:1.5px solid var(--border-mid);border-radius:8px;width:30px;height:30px;display:flex;align-items:center;justify-content:center;cursor:pointer;transition:all 0.2s;flex-shrink:0;padding:0;}
  .heart-btn:hover,.heart-btn.saved{border-color:var(--fav);background:var(--fav-bg);}
  .heart-btn svg{width:14px;height:14px;}
  .reset-wrap{text-align:center;padding:0 24px 48px;}
  .reset-btn{background:none;border:1.5px solid var(--border-mid);border-radius:10px;padding:10px 24px;font-size:13px;font-family:'DM Sans',sans-serif;cursor:pointer;color:var(--muted);}
  .reset-btn:hover{border-color:var(--jiff);color:var(--jiff);}
  .error-wrap{text-align:center;padding:56px 24px;max-width:440px;margin:0 auto;}
  .error-icon{font-size:38px;margin-bottom:12px;}
  .error-title{font-family:'Fraunces',serif;font-size:20px;font-weight:700;color:var(--ink);margin-bottom:7px;}
  .error-msg{font-size:13px;color:var(--muted);margin-bottom:22px;font-weight:300;}
  .chip{border:1.5px solid var(--border-mid);border-radius:10px;padding:6px 13px;font-size:12px;cursor:pointer;font-family:'DM Sans',sans-serif;background:white;color:var(--muted);}
  .chip.active{background:var(--ink);border-color:var(--ink);color:white;font-weight:500;}
  .grocery-panel{margin:0 18px 14px;border:1px solid var(--border);border-radius:13px;overflow:hidden;}
  .grocery-header{background:var(--ink);padding:11px 13px;display:flex;align-items:center;justify-content:space-between;}
  .grocery-item{display:flex;align-items:flex-start;gap:8px;padding:6px 8px;border-radius:7px;font-size:12px;line-height:1.4;font-weight:300;cursor:pointer;}
  .grocery-item.need{background:var(--need-bg);color:var(--need-text);}
  .grocery-item.have{background:var(--have-bg);color:var(--have-text);cursor:default;}
  .nutr-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:6px;}
  .nutr-item{background:var(--warm);border-radius:8px;padding:8px;text-align:center;}
  .nutr-val{font-family:'Fraunces',serif;font-size:15px;font-weight:700;color:var(--ink);}
  .nutr-lbl{font-size:9px;color:var(--muted);margin-top:2px;text-transform:uppercase;letter-spacing:1px;}
  .steps-list{counter-reset:step;list-style:none;}
  .steps-list li{font-size:12px;color:var(--ink);padding:7px 0 7px 26px;border-bottom:1px solid rgba(0,0,0,0.04);position:relative;line-height:1.6;font-weight:300;counter-increment:step;display:flex;flex-direction:column;gap:7px;}
  .steps-list li::before{content:counter(step);position:absolute;left:0;top:9px;width:17px;height:17px;background:var(--jiff);color:white;font-size:9px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:600;}
  .step-text{flex:1;}
  .step-timer.idle{align-self:flex-start;display:inline-flex;align-items:center;gap:5px;background:rgba(255,69,0,0.08);border:1.5px solid rgba(255,69,0,0.2);border-radius:20px;padding:4px 10px 4px 8px;font-size:11px;font-weight:500;color:var(--timer-idle);cursor:pointer;font-family:'DM Sans',sans-serif;}
  .step-timer.done{align-self:flex-start;display:inline-flex;align-items:center;gap:7px;background:rgba(29,158,117,0.1);border:1.5px solid rgba(29,158,117,0.3);border-radius:20px;padding:5px 12px 5px 9px;}
  .timer-done-icon{font-size:15px;}
  .timer-done-text{font-size:12px;font-weight:600;color:var(--timer-done);}
  .scaler-bar{padding:11px 14px;background:var(--warm);border:1px solid rgba(255,69,0,0.15);border-radius:9px 9px 0 0;display:flex;align-items:center;gap:10px;flex-wrap:wrap;}
  .favs-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(320px,1fr));gap:14px;padding-bottom:36px;}
  .share-actions{display:flex;gap:7px;flex-wrap:wrap;}
  @media(max-width:700px){
    /* Layout */
    .main-layout{padding:12px 14px 80px;}
    .meals-grid,.favs-grid{grid-template-columns:1fr;}
    .results-wrap{padding:12px 14px 80px;}
    /* Header — compact on mobile */
    .header{padding:10px 14px;}
    .header-right{gap:5px;}
    .hdr-btn{padding:5px 9px;font-size:11px;}
    /* Typography */
    .results-title{font-size:17px;}
    .meal-name{font-size:16px;}
    /* Cards */
    .nutr-grid{grid-template-columns:repeat(2,1fr);}
    .auth-card{padding:22px 18px;}
    /* Prevent horizontal overflow */
    .filter-pills{overflow-x:auto;flex-wrap:nowrap;padding-bottom:4px;-webkit-overflow-scrolling:touch;}
    .meal-meta{flex-wrap:wrap;gap:6px;}
    /* Gates */
    .gate-plans{grid-template-columns:1fr;}
    .gate-card{padding:28px 20px;}
    /* Actions */
    .share-actions{flex-direction:column;}
    .cta-btn{width:100%;justify-content:center;}
    /* Hide desktop-only elements */
    .scaler-orig{display:none;}
    .trial-badge{display:none;}
    .desktop-only{display:none!important;}
    /* Grocery panel — full width */
    .grocery-panel{margin:0 0 14px;}
    /* Steps — larger tap targets */
    .steps-list li{padding:9px 0 9px 28px;}
    /* Auth */
    .auth-perks{gap:6px;}
  }
`;

export default function Jiff() {
  const navigate = useNavigate();
  const location = useLocation();
  const generateContextFromNav = location.state?.generateContext || null;

  const { user, profile, pantry, toggleFavourite, isFav, signInWithGoogle, signInWithEmail, signOut, supabaseEnabled, authLoading } = useAuth();
  const { isPremium, trial, trialActive, trialDaysLeft, plans, checkAccess, recordUsage, startTrial, openCheckout, activateTestPremium, showGate, setShowGate, gateReason, razorpayEnabled, TRIAL_DAYS, PAID_RECIPE_CAP } = usePremium();
  const { lang, units, setLang, t, country, setCountry, CUISINE_OPTIONS } = useLocale();
  const season = getCurrentSeason();

  const [fridgeItems,     setFridgeItems]     = useState([]);
  const [pantryItems,     setPantryItems]     = useState([]);
  const [time,            setTime]            = useState('30 min');
  const [diet,            setDiet]            = useState('none');
  const [cuisine,         setCuisine]         = useState('any');
  const [mealType,        setMealType]        = useState(() => {
    const h = new Date().getHours();
    if (h >= 5  && h < 11) return 'breakfast';
    if (h >= 11 && h < 15) return 'lunch';
    if (h >= 15 && h < 18) return 'snack';
    if (h >= 18 && h < 22) return 'dinner';
    return 'any';
  });
  const [defaultServings, setDefaultServings] = useState(2);
  const [view,            setView]            = useState('input');
  const [meals,           setMeals]           = useState([]);
  const [factIdx,         setFactIdx]         = useState(0);
  const [errorMsg,        setErrorMsg]        = useState('');
  const [emailInput,      setEmailInput]      = useState('');
  const [emailSent,       setEmailSent]       = useState(false);
  const [pantryLoaded,    setPantryLoaded]    = useState(false);
  const [gatePlan,        setGatePlan]        = useState('annual');
  const [gateLoading,     setGateLoading]     = useState(false);
  const [gateDismissed,   setGateDismissed]   = useState(false);
  const [showUserMenu,    setShowUserMenu]    = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications,   setNotifications]  = useState([]);
  const [unreadCount,     setUnreadCount]     = useState(0);
  const [streak,          setStreak]          = useState(0);
  const [familySelected,  setFamilySelected]  = useState([]);
  const [pantryNudge,     setPantryNudge]     = useState([]);
  const [journeyMode,     setJourneyMode]     = useState(false);
  const [inputMode,       setInputMode]       = useState('direct');
  const [loadingMessage,  setLoadingMessage]  = useState('Finding your perfect recipes...');
  const [profileLoaded,   setProfileLoaded]   = useState(false);
  const [ratings,         setRatings]         = useState(() => {
    try { return JSON.parse(localStorage.getItem('jiff-ratings') || '{}'); } catch { return {}; }
  });
  const timerRef = useRef(null);

  const ingredients = [...new Set([...fridgeItems, ...pantryItems])];

  useEffect(() => {
    if (!pantryLoaded && pantry?.length) { setPantryItems(pantry); setPantryLoaded(true); }
  }, [pantry, pantryLoaded]);

  useEffect(() => {
    if (profile && !profileLoaded) {
      const ft = Array.isArray(profile.food_type) ? profile.food_type[0] : profile.food_type;
      if (ft === 'vegan') setDiet('vegan');
      else if (ft === 'veg' || ft === 'eggetarian' || ft === 'jain') setDiet('vegetarian');
      if (profile.preferred_cuisines?.length) setCuisine(profile.preferred_cuisines[0]);
      setProfileLoaded(true);
    }
  }, [profile, profileLoaded]);

  useEffect(() => {
    if (user && !trial && !isPremium) startTrial(user.id);
  }, [user, trial, isPremium, startTrial]);

  useEffect(() => {
    if (view === 'loading') timerRef.current = setInterval(() => setFactIdx(f => (f + 1) % FACTS.length), 1400);
    return () => clearInterval(timerRef.current);
  }, [view]);

  useEffect(() => {
    if (user) sessionStorage.setItem('jiff-session-active', '1');
    else sessionStorage.removeItem('jiff-session-active');
  }, [user]);

  useEffect(() => {
    if (user && view === 'input') {
      setJourneyMode(true);
      if (profile && !profile.onboarding_done && !sessionStorage.getItem('jiff-onboarding-shown')) {
        sessionStorage.setItem('jiff-onboarding-shown', '1');
        navigate('/onboarding');
      }
    }
  }, [user]); // eslint-disable-line

  useEffect(() => {
    if (generateContextFromNav && user) handleGenerateDirect(generateContextFromNav);
  }, []); // eslint-disable-line

  useEffect(() => {
    try {
      if (profile?.streak) { setStreak(profile.streak); return; }
      const d = JSON.parse(localStorage.getItem('jiff-streak') || '{}');
      const yest = new Date(Date.now() - 86400000).toDateString();
      setStreak((d.lastDate === new Date().toDateString() || d.lastDate === yest) ? (d.count || 1) : 0);
    } catch {}
  }, [profile]);

  useEffect(() => {
    if (!user) return;
    fetch('/api/admin?action=meal-history&userId=' + user.id, { method: 'GET' })
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (!Array.isArray(data?.history)) return;
        const sr = {};
        data.history.forEach(m => { if (m.meal_name && m.rating) sr[m.meal_name] = m.rating; });
        if (Object.keys(sr).length) setRatings(prev => ({ ...prev, ...sr }));
      }).catch(() => {});
  }, [user]);

  useEffect(() => {
    const loadNotifs = async () => {
      const readIds = new Set(JSON.parse(localStorage.getItem('jiff-read-notifs') || '[]'));
      const all = [];
      const sd = JSON.parse(localStorage.getItem('jiff-streak') || '{}');
      if (sd.count >= 3) all.push({ id: 'streak-' + sd.count, type: 'achievement', icon: '\ud83d\udd25', title: sd.count + '-day cooking streak!', body: "Keep it up!", ts: Date.now() - 1000 });
      all.push({ id: 'tip-season', type: 'tip', icon: '\ud83c\udf3f', title: 'Seasonal produce available', body: 'Check seasonal suggestions for the freshest ingredients.', ts: Date.now() - 2000 });
      if (supabaseEnabled) {
        try {
          const { supabase } = await import('../lib/supabase');
          const { data } = await supabase.from('broadcasts').select('id,message,created_at').eq('active', true).order('created_at', { ascending: false }).limit(10);
          (data || []).forEach(b => all.push({ id: 'bc-' + b.id, type: 'broadcast', icon: '\ud83d\udce2', title: 'From Jiff', body: b.message, ts: new Date(b.created_at).getTime() }));
        } catch {}
      }
      all.sort((a, b) => b.ts - a.ts);
      const marked = all.map(n => ({ ...n, read: readIds.has(n.id) }));
      setNotifications(marked);
      setUnreadCount(marked.filter(n => !n.read).length);
    };
    loadNotifs();
  }, [user, supabaseEnabled, streak]);

  const markAllRead = () => {
    localStorage.setItem('jiff-read-notifs', JSON.stringify(notifications.map(n => n.id)));
    setNotifications(ns => ns.map(n => ({ ...n, read: true })));
    setUnreadCount(0);
  };

  const updateStreak = () => {
    try {
      const today = new Date().toDateString();
      const stored = JSON.parse(localStorage.getItem('jiff-streak') || '{}');
      const newCount = stored.lastDate === new Date(Date.now() - 86400000).toDateString() ? (stored.count || 0) + 1 : 1;
      try { localStorage.setItem('jiff-streak', JSON.stringify({ count: newCount, lastDate: today })); } catch {}
      setStreak(newCount);
      if (user) fetch('/api/admin?action=update-streak', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId: user.id, streak: newCount, lastCooked: new Date().toISOString() }) }).catch(() => {});
    } catch {}
  };

  const saveToHistory = mealsArr => {
    if (!user || !mealsArr?.length) return;
    fetch('/api/admin?action=meal-history', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId: user.id, meals: mealsArr, mealType, cuisine, servings: defaultServings, ingredients }) }).catch(() => {});
  };

  const handleSubmit = async () => {
    if (!ingredients.length) return;
    if (!user) { setGateDismissed(false); return; }
    if (!checkAccess('generation')) return;
    setView('loading'); setFactIdx(0);
    try {
      const count = isPremium ? PAID_RECIPE_CAP : 1;
      const res = await fetch('/api/suggest', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ingredients, time, diet, cuisine, mealType, defaultServings, count, language: lang, units, tasteProfile: profile ? { spice_level: profile.spice_level, allergies: profile.allergies, preferred_cuisines: profile.preferred_cuisines, skill_level: profile.skill_level } : null }) });
      const data = await res.json();
      if (data.meals?.length > 0) {
        setMeals(Array.isArray(data.meals) ? data.meals : []);
        setView('results'); recordUsage(); updateStreak();
        const used = (pantry || []).filter(p => data.meals?.[0]?.ingredients?.some(ing => ing.toLowerCase().includes(p.toLowerCase())));
        if (used.length) setPantryNudge(used.slice(0, 4));
        saveToHistory(data.meals);
      } else { setErrorMsg(data.error || 'Could not generate suggestions.'); setView('error'); }
    } catch { setErrorMsg('Connection error. Please try again.'); setView('error'); }
  };

  const handleGenerateDirect = async (context = {}) => {
    const msgKey = context.mood ? 'mood' : context.seasonal ? 'seasonal' : context.weather ? 'weather' : context.hosting ? 'hosting' : context.family ? 'family' : context.goal ? 'goal' : context.type || 'discover';
    setLoadingMessage(TILE_LOADING_MSGS[msgKey] || 'Finding your perfect recipes...');
    if (!user) { setGateDismissed(false); return; }
    if (!checkAccess('generation')) return;
    if (context.cuisine) setCuisine(context.cuisine);
    if (context.mealType && context.mealType !== 'any') setMealType(context.mealType);
    const tileIngredients = pantryItems.length > 0 ? pantryItems : ['rice', 'onion', 'tomato', 'oil', 'salt', 'chilli'];
    setView('loading'); setFactIdx(0); setJourneyMode(false);
    try {
      const count = isPremium ? PAID_RECIPE_CAP : 1;
      const res = await fetch('/api/suggest', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ingredients: tileIngredients, time, diet, cuisine: context.cuisine || cuisine, mealType: context.mealType || mealType, count, country, lang }) });
      const data = await res.json();
      if (data.error) { setErrorMsg(data.error); setView('input'); setJourneyMode(true); return; }
      const resultMeals = Array.isArray(data.meals) ? data.meals : data.meals?.meals || [];
      setMeals(resultMeals); updateStreak(); saveToHistory(resultMeals); setView('results');
    } catch { setErrorMsg('Something went wrong. Please try again.'); setView('input'); setJourneyMode(true); }
  };

  const handleSurprise = async () => {
    if (!checkAccess('generation')) return;
    setView('loading'); setFactIdx(0);
    try {
      const count = isPremium ? PAID_RECIPE_CAP : 1;
      const surpriseCuisine = profile?.preferred_cuisines?.length ? profile.preferred_cuisines[Math.floor(Math.random() * profile.preferred_cuisines.length)] : 'any';
      const res = await fetch('/api/suggest', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ingredients: pantry?.length ? pantry : season.items.slice(0, 4), time, diet, cuisine: surpriseCuisine, count, language: lang, units, surpriseMode: true }) });
      const data = await res.json();
      if (data.meals?.length > 0) { setMeals(Array.isArray(data.meals) ? data.meals : []); setView('results'); recordUsage(); }
      else { setErrorMsg(data.error || 'Could not generate suggestions.'); setView('error'); }
    } catch { setErrorMsg('Connection error. Please try again.'); setView('error'); }
  };

  const handleLeftoverRescue = () => {
    setJourneyMode(false); setInputMode('leftover');
    setFridgeItems(['leftover rice', 'leftover curry']);
    setLoadingMessage('Rescuing your leftovers...'); setView('input');
  };

  const handleEmailSignIn = async () => {
    const { error } = await signInWithEmail(emailInput);
    if (!error) setEmailSent(true);
  };

  const handleGateUpgrade = async () => {
    if (!razorpayEnabled) { activateTestPremium(); return; }
    setGateLoading(true);
    try { await openCheckout(gatePlan); setShowGate(false); }
    catch (e) { if (e.message !== 'dismissed') alert('Payment failed. Please try again.'); }
    finally { setGateLoading(false); }
  };

  const reset = () => {
    setView('input'); setMeals([]); setFridgeItems([]);
    setPantryItems(pantry || []); setPantryLoaded(true);
    setInputMode('direct'); setJourneyMode(!!user);
  };

  const showSignInGate = !authLoading && !user && !gateDismissed;

  const renderView = () => {
    if (view === 'loading') {
      return (
        <LoadingView
          cuisine={cuisine} mealType={mealType} ingredients={ingredients}
          isPremium={isPremium} PAID_RECIPE_CAP={PAID_RECIPE_CAP}
          factIdx={factIdx} loadingMessage={loadingMessage}
        />
      );
    }
    if (view === 'error') {
      return (
        <div className="error-wrap">
          <div className="error-icon">{'\ud83d\ude15'}</div>
          <div className="error-title">{t('error_title_app')}</div>
          <div className="error-msg">{errorMsg}</div>
          <button className="cta-btn" onClick={reset}>{'\u2190 Start over'}</button>
        </div>
      );
    }
    if (view === 'results') {
      return (
        <>
          {user && (
            <div style={{ textAlign: 'center', padding: '12px 0 4px' }}>
              <button
                onClick={() => { setView('input'); setJourneyMode(true); setMeals([]); }}
                style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, color: 'var(--muted)', fontFamily: "'DM Sans',sans-serif" }}
              >
                {'\u2190 Cook something else'}
              </button>
            </div>
          )}
          <ResultsView
            meals={meals} mealType={mealType} cuisine={cuisine} time={time}
            diet={diet} defaultServings={defaultServings} ingredients={ingredients}
            profile={profile} user={user} isPremium={isPremium}
            trialActive={trialActive} PAID_RECIPE_CAP={PAID_RECIPE_CAP}
            ratings={ratings} setRatings={setRatings}
            isFav={isFav} toggleFavourite={toggleFavourite} country={country}
            pantryNudge={pantryNudge} setPantryNudge={setPantryNudge}
            CUISINE_OPTIONS={CUISINE_OPTIONS}
            handleSurprise={handleSurprise} reset={reset} navigate={navigate} t={t}
          />
        </>
      );
    }
    return (
      <div className="main-layout">
        {user && (
          <button
            onClick={() => { setJourneyMode(true); setInputMode('direct'); }}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 5, marginBottom: 14, background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, color: 'var(--muted)', fontFamily: "'DM Sans',sans-serif", padding: 0 }}
          >
            {'\u2190 Home'}
          </button>
        )}
        {user && profile && !profile.spice_level && !profile.preferred_cuisines?.length && !sessionStorage.getItem('jiff-prefs-dismissed') && (
          <div style={{ background: 'rgba(255,69,0,0.07)', border: '1.5px solid rgba(255,69,0,0.25)', borderRadius: 12, padding: '12px 16px', marginBottom: 16, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 500, color: '#CC3700', marginBottom: 2 }}>{'\ud83d\udc4b Personalise your experience'}</div>
              <div style={{ fontSize: 12, color: '#CC3700', fontWeight: 300 }}>{'Set your food type, cuisine and pantry so every recipe is tailored to you.'}</div>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => navigate('/profile')} style={{ background: '#CC3700', color: 'white', border: 'none', borderRadius: 8, padding: '7px 14px', fontSize: 12, fontWeight: 500, cursor: 'pointer', fontFamily: "'DM Sans',sans-serif", whiteSpace: 'nowrap' }}>{'Set up profile \u2192'}</button>
              <button onClick={() => sessionStorage.setItem('jiff-prefs-dismissed', '1')} style={{ background: 'none', border: '1px solid rgba(204,55,0,0.3)', borderRadius: 8, padding: '7px 10px', fontSize: 12, color: '#CC3700', cursor: 'pointer', fontFamily: "'DM Sans',sans-serif" }}>{'Later'}</button>
            </div>
          </div>
        )}
        {inputMode === 'direct' && (
          <>
            {user && (
              <SmartGreeting
                user={user} profile={profile}
                onCountryDetected={setCountry}
                onSuggestRecipe={(suggestion, autoMealType) => {
                  if (autoMealType && autoMealType !== 'any') setMealType(autoMealType);
                  if (suggestion?.dish) setFridgeItems(prev => prev.includes(suggestion.dish.toLowerCase()) ? prev : [...prev, suggestion.dish.toLowerCase()]);
                  setTimeout(() => { if (ingredients.length || suggestion?.dish) handleSubmit(); }, 100);
                }}
              />
            )}
            {streak >= 2 && (
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: 'rgba(255,69,0,0.08)', borderRadius: 20, padding: '4px 12px', fontSize: 11, color: 'var(--jiff)', fontWeight: 500, marginBottom: 12 }}>
                {'\ud83d\udd25 '}{streak}{'-day streak!'}
              </div>
            )}
            <h1 style={{ fontFamily: "'Fraunces', serif", fontSize: 'clamp(26px,4vw,40px)', fontWeight: 900, color: 'var(--ink)', letterSpacing: '-1px', lineHeight: 1.05, marginBottom: 6 }}>
              {t('main_heading')}
            </h1>
            <p style={{ fontSize: 13, color: 'var(--muted)', fontWeight: 300, marginBottom: 20 }}>
              {isPremium ? ('\u26a1 Premium \u00b7 ' + PAID_RECIPE_CAP + ' recipes per search') : trialActive ? ('\ud83c\udf81 Free trial \u00b7 1 recipe preview \u00b7 ' + trialDaysLeft + ' days left') : ''}
            </p>
          </>
        )}
        <FridgeCard
          inputMode={inputMode} fridgeItems={fridgeItems} setFridgeItems={setFridgeItems}
          pantry={pantry} diet={diet} setDiet={setDiet} time={time} setTime={setTime}
          cuisine={cuisine} setCuisine={setCuisine}
          defaultServings={defaultServings} setDefaultServings={setDefaultServings}
          profile={profile} lang={lang} user={user}
          isPremium={isPremium} trialActive={trialActive} PAID_RECIPE_CAP={PAID_RECIPE_CAP}
          familySelected={familySelected} setFamilySelected={setFamilySelected}
          ingredients={ingredients} handleSubmit={handleSubmit}
          setGateDismissed={setGateDismissed}
          navigate={navigate} t={t}
        />
      </div>
    );
  };

  return (
    <>
      <style>{styles}</style>
      <div className="app">
        <AuthGate
          showSignInGate={showSignInGate} showGate={showGate}
          TRIAL_DAYS={TRIAL_DAYS} emailInput={emailInput} emailSent={emailSent}
          supabaseEnabled={supabaseEnabled} gateReason={gateReason}
          gatePlan={gatePlan} gateLoading={gateLoading} plans={plans}
          razorpayEnabled={razorpayEnabled} PAID_RECIPE_CAP={PAID_RECIPE_CAP}
          setEmailInput={setEmailInput} setGateDismissed={setGateDismissed}
          setGatePlan={setGatePlan} setShowGate={setShowGate}
          signInWithGoogle={signInWithGoogle}
          handleEmailSignIn={handleEmailSignIn}
          handleGateUpgrade={handleGateUpgrade}
          activateTestPremium={activateTestPremium}
          navigate={navigate} t={t}
        />
        <JiffHeader
          view={view} user={user} profile={profile}
          isPremium={isPremium} trialActive={trialActive} trialDaysLeft={trialDaysLeft}
          showNotifications={showNotifications} setShowNotifications={setShowNotifications}
          notifications={notifications} unreadCount={unreadCount}
          showUserMenu={showUserMenu} setShowUserMenu={setShowUserMenu}
          markAllRead={markAllRead} signOut={signOut}
          navigate={navigate} t={t}
        />
        {journeyMode && user && view === 'input' && errorMsg && (
          <div style={{ margin:'8px 16px', padding:'10px 14px', background:'rgba(229,62,62,0.08)', border:'1px solid rgba(229,62,62,0.25)', borderRadius:10, fontSize:13, color:'#C53030', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            {errorMsg}
            <button onClick={() => setErrorMsg('')} style={{ background:'none', border:'none', cursor:'pointer', color:'#C53030', fontSize:16, lineHeight:1 }}>{'×'}</button>
          </div>
        )}
        {journeyMode && user && view === 'input' && (
          <JourneyTiles
            profile={profile} season={season} streak={streak}
            onSelectFridge={() => { setJourneyMode(false); setInputMode('fridge'); }}
            onGenerateDirect={handleGenerateDirect}
            onLeftoverRescue={handleLeftoverRescue}
          />
        )}
        {(!journeyMode || !user) && renderView()}
      </div>
    </>
  );
}
