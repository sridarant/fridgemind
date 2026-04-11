// src/pages/Jiff.jsx
// Main app page — orchestration only. Business logic lives in hooks/services.
// Target: <500 lines. Phases 1-3 compliant.
import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth }    from '../contexts/AuthContext';
import { usePremium } from '../contexts/PremiumContext';
import { useLocale, getCurrentSeason } from '../contexts/LocaleContext';
import { useRecipes }       from '../hooks/useRecipes';
import { useRetention }    from '../hooks/useRetention';
import { useNotifications } from '../hooks/useNotifications';
import SmartGreeting    from '../components/SmartGreeting';
import { JourneyTiles } from '../components/common/JourneyTiles.jsx';
import AuthGate         from '../components/jiff/AuthGate';
import JiffHeader       from '../components/jiff/JiffHeader';
import FridgeCard       from '../components/jiff/FridgeCard';
import LoadingView      from '../components/jiff/LoadingView';
import ResultsView      from '../components/jiff/ResultsView';
import styles           from '../styles/jiffStyles';
import { mealKey }      from '../lib/mealKey.js';
import { fetchHistory, trackStapleUsage, getStapleSuggestions } from '../services/historyService';

const FACTS = [
  'Raiding your fridge\u2026','Cross-referencing 50,000+ recipes\u2026',
  'Matching cuisine and flavour profile\u2026','Crunching nutrition numbers\u2026','Preparing your recipes\u2026',
];

export default function Jiff() {
  const navigate  = useNavigate();
  const location  = useLocation();
  const genCtxNav = location.state?.generateContext || null;

  const {
    user, profile, pantry, updateProfile, toggleFavourite, isFav,
    signInWithGoogle, signInWithEmail, signOut, supabaseEnabled, authLoading,
  } = useAuth();

  const {
    isPremium, trial, trialActive, trialDaysLeft, plans,
    checkAccess, recordUsage, startTrial, openCheckout,
    activateTestPremium, showGate, setShowGate, gateReason,
    razorpayEnabled, TRIAL_DAYS, PAID_RECIPE_CAP,
  } = usePremium();

  const { lang, units, setLang, setUnits, t, country, setCountry, CUISINE_OPTIONS } = useLocale();
  const season = getCurrentSeason();

  // ── Input state ────────────────────────────────────────────────
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
  const [pantryLoaded,    setPantryLoaded]    = useState(false);
  const [profileLoaded,   setProfileLoaded]   = useState(false);
  const [journeyMode,     setJourneyMode]     = useState(false);
  const [inputMode,       setInputMode]       = useState('direct');
  const [familySelected,  setFamilySelected]  = useState([]);
  const [gatePlan,        setGatePlan]        = useState('annual');
  const [gateLoading,     setGateLoading]     = useState(false);
  const [gateDismissed,   setGateDismissed]   = useState(false);
  const [emailInput,      setEmailInput]      = useState('');
  const [emailSent,       setEmailSent]       = useState(false);
  const [showUserMenu,    setShowUserMenu]    = useState(false);
  const [showNotifPanel,  setShowNotifPanel]  = useState(false);
  const [streak,          setStreak]          = useState(0);
  const [mealHistory,     setMealHistory]     = useState([]);
  const [stapleSuggestion,setStapleSuggestion]= useState(null);

  const ingredients = [...new Set([...fridgeItems, ...pantryItems])];

  // ── Business logic via hooks ───────────────────────────────────
  const {
    meals, view, errorMsg, loadingMessage, factIdx, pantryNudge, ratings, tileContext,
    setView, setErrorMsg, setFactIdx, setPantryNudge, setRatings, setTileContext,
    handleSubmit, handleGenerateDirect, handleSurprise, handleRate,
    syncRatings, reset: resetRecipes,
  } = useRecipes({
    user, profile, pantry, pantryItems,
    isPremium, PAID_RECIPE_CAP, checkAccess, recordUsage,
    time, diet, cuisine, mealType, defaultServings,
    lang, units, country,
    setCuisine, setMealType, setJourneyMode,
  });

  const { notifications, unreadCount, markAllRead } = useNotifications({
    user, supabaseEnabled, streak,
  });

  const {
    didYouCookNudge, weeklyDigest, welcomeBack, challenge, milestone,
    recordGeneration, confirmCooked, dismissNudge, recordRating,
  } = useRetention({ mealHistory, ratings, user });

  // ── Effects ────────────────────────────────────────────────────
  useEffect(() => {
    if (!pantryLoaded && pantry?.length) { setPantryItems(pantry); setPantryLoaded(true); }
  }, [pantry, pantryLoaded]);

  useEffect(() => {
    if (profile && !profileLoaded) {
      const ft = Array.isArray(profile.food_type) ? profile.food_type[0] : profile.food_type;
      if (ft === 'vegan') setDiet('vegan');
      else if (ft === 'veg' || ft === 'eggetarian' || ft === 'jain') setDiet('vegetarian');
      if (profile.preferred_cuisines?.length) setCuisine(profile.preferred_cuisines[0]);
      // Family-aware default servings
      if (profile.family_size > 4) setDefaultServings(6);
      else if (profile.family_size > 2) setDefaultServings(4);
      setProfileLoaded(true);
    }
  }, [profile, profileLoaded]);

  useEffect(() => {
    if (user && !trial && !isPremium) startTrial(user.id);
  }, [user, trial, isPremium, startTrial]);

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
    if (genCtxNav && user) handleGenerateDirect(genCtxNav);
  }, []); // eslint-disable-line

  useEffect(() => {
    try {
      if (profile?.streak) { setStreak(profile.streak); return; }
      const d = JSON.parse(localStorage.getItem('jiff-streak') || '{}');
      const yest = new Date(Date.now() - 86400000).toDateString();
      setStreak((d.lastDate === new Date().toDateString() || d.lastDate === yest) ? (d.count || 1) : 0);
    } catch {}
  }, [profile]);

  useEffect(() => { if (user) syncRatings(user.id); }, [user]); // eslint-disable-line

  // Record generation for 'did you cook this' nudge
  useEffect(() => {
    if (view === 'results' && meals.length && user) {
      recordGeneration(meals[0]?.name || 'your meal');
    }
  }, [view]); // eslint-disable-line
  useEffect(() => {
    if (!user) return;
    fetchHistory(user.id).then(h => { if (h.length) setMealHistory(h); }).catch(() => {});
  }, [user]); // eslint-disable-line

  // ── Handlers ───────────────────────────────────────────────────
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

  const handleLeftoverRescue = () => {
    setJourneyMode(false); setInputMode('leftover');
    setFridgeItems(['leftover rice', 'leftover curry']);
    setTileContext({ emoji:'♻️', color:'#D97706', bg:'rgba(217,119,6,0.08)',
      border:'rgba(217,119,6,0.25)', label:'Leftover rescue',
      sub:"Turning what you have into something great" });
    setView('input');
  };

  const reset = () => {
    resetRecipes(); setFridgeItems([]); setPantryItems(pantry || []);
    setPantryLoaded(true); setInputMode('direct'); setJourneyMode(!!user);
    setTileContext(null);
  };

  const showSignInGate = !authLoading && !user && !gateDismissed;

  // ── View renderer ──────────────────────────────────────────────
  const renderView = () => {
    if (view === 'loading') return (
      <LoadingView
        cuisine={cuisine} mealType={mealType} ingredients={ingredients}
        isPremium={isPremium} PAID_RECIPE_CAP={PAID_RECIPE_CAP}
        factIdx={factIdx} loadingMessage={loadingMessage}
      />
    );

    if (view === 'error') return (
      <div className="error-wrap">
        <div className="error-icon">{'\ud83d\ude15'}</div>
        <div className="error-title">{t('error_title_app')}</div>
        <div className="error-msg">{errorMsg}</div>
        <button className="cta-btn" onClick={reset}>{'\u2190 Start over'}</button>
      </div>
    );

    if (view === 'results') return (
      <>
        {user && (
          <div style={{ textAlign:'center', padding:'12px 0 4px' }}>
            <button onClick={() => { setView('input'); setJourneyMode(true); }} style={{ background:'none', border:'none', cursor:'pointer', fontSize:12, color:'var(--muted)', fontFamily:"'DM Sans',sans-serif" }}>
              {'\u21ba Cook something else'}
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
          CUISINE_OPTIONS={CUISINE_OPTIONS} tileContext={tileContext}
          stapleSuggestion={stapleSuggestion}
          onDismissStapleSuggestion={() => setStapleSuggestion(null)}
          onAddStaple={async (items) => {
            // Add items to profile weekly_staples + savePantry
            const newStaples = [...(profile?.weekly_staples || []), ...items.map(i => i.toLowerCase())];
            await updateProfile?.({ weekly_staples: newStaples });
            setStapleSuggestion(null);
          }}
          handleSurprise={() => handleSurprise(season)}
          onRate={(meal, stars) => { handleRate(meal, stars, user?.id, mealKey); recordRating(); }}
          reset={reset} navigate={navigate} t={t}
        />
      </>
    );

    // Input view
    return (
      <div className="main-layout">
        {user && (
          <button onClick={() => { setJourneyMode(true); setInputMode('direct'); }}
            style={{ display:'inline-flex', alignItems:'center', gap:5, marginBottom:14, background:'none', border:'none', cursor:'pointer', fontSize:12, color:'var(--muted)', fontFamily:"'DM Sans',sans-serif", padding:0 }}>
            {'\u2190 Home'}
          </button>
        )}

        {/* Profile completion nudge */}
        {user && profile && !profile.spice_level && !profile.preferred_cuisines?.length
          && !sessionStorage.getItem('jiff-prefs-dismissed') && (
          <div style={{ background:'rgba(255,69,0,0.07)', border:'1.5px solid rgba(255,69,0,0.25)', borderRadius:12, padding:'12px 16px', marginBottom:16, display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:12, flexWrap:'wrap' }}>
            <div>
              <div style={{ fontSize:13, fontWeight:500, color:'#CC3700', marginBottom:2 }}>{'\ud83d\udc4b Personalise your experience'}</div>
              <div style={{ fontSize:12, color:'#CC3700', fontWeight:300 }}>{'Set your food type, cuisine and pantry so every recipe is tailored to you.'}</div>
            </div>
            <div style={{ display:'flex', gap:8 }}>
              <button onClick={() => navigate('/profile')} style={{ background:'#CC3700', color:'white', border:'none', borderRadius:8, padding:'7px 14px', fontSize:12, fontWeight:500, cursor:'pointer', fontFamily:"'DM Sans',sans-serif" }}>{'Set up profile \u2192'}</button>
              <button onClick={() => sessionStorage.setItem('jiff-prefs-dismissed','1')} style={{ background:'none', border:'1px solid rgba(204,55,0,0.3)', borderRadius:8, padding:'7px 10px', fontSize:12, color:'#CC3700', cursor:'pointer', fontFamily:"'DM Sans',sans-serif" }}>{'Later'}</button>
            </div>
          </div>
        )}

        {/* Direct mode heading */}
        {inputMode === 'direct' && (
          <>
            {user && (
              <SmartGreeting user={user} profile={profile}
                onCountryDetected={setCountry}
                onSuggestRecipe={(suggestion, autoMealType) => {
                  if (autoMealType && autoMealType !== 'any') setMealType(autoMealType);
                  if (suggestion?.dish) setFridgeItems(prev => prev.includes(suggestion.dish.toLowerCase()) ? prev : [...prev, suggestion.dish.toLowerCase()]);
                  setTimeout(() => { if (ingredients.length || suggestion?.dish) handleSubmit(ingredients, () => setGateDismissed(false)); }, 100);
                }}
              />
            )}
            {streak >= 2 && (
              <div style={{ display:'inline-flex', alignItems:'center', gap:5, background:'rgba(255,69,0,0.08)', borderRadius:20, padding:'4px 12px', fontSize:11, color:'var(--jiff)', fontWeight:500, marginBottom:12 }}>
                {'\ud83d\udd25 '}{streak}{'-day streak!'}
              </div>
            )}
            <h1 style={{ fontFamily:"'Fraunces',serif", fontSize:'clamp(26px,4vw,40px)', fontWeight:900, color:'var(--ink)', letterSpacing:'-1px', lineHeight:1.05, marginBottom:6 }}>
              {t('main_heading')}
            </h1>
            <p style={{ fontSize:13, color:'var(--muted)', fontWeight:300, marginBottom:20 }}>
              {isPremium ? '\u26a1 Premium \u00b7 ' + PAID_RECIPE_CAP + ' recipes per search'
                : trialActive ? '\ud83c\udf81 Free trial \u00b7 1 recipe preview \u00b7 ' + trialDaysLeft + ' days left' : ''}
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
          ingredients={ingredients}
          handleSubmit={() => {
            // Track fridge items for pantry learning
            if (fridgeItems.length) {
              trackStapleUsage(fridgeItems);
              const suggestions = getStapleSuggestions(pantryItems);
              if (suggestions.length) setStapleSuggestion({ items: suggestions, shown: false });
            }
            handleSubmit(ingredients, () => setGateDismissed(false));
          }}
          setGateDismissed={setGateDismissed}
          navigate={navigate} t={t}
        />
      </div>
    );
  };

  // ── Render ─────────────────────────────────────────────────────
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
          showNotifications={showNotifPanel} setShowNotifications={setShowNotifPanel}
          notifications={notifications} unreadCount={unreadCount}
          showUserMenu={showUserMenu} setShowUserMenu={setShowUserMenu}
          markAllRead={markAllRead} signOut={signOut}
          navigate={navigate} t={t}
        />

        {/* Error toast on journey home */}
        {journeyMode && user && view === 'input' && errorMsg && (
          <div style={{ margin:'8px 16px', padding:'10px 14px', background:'rgba(229,62,62,0.08)', border:'1px solid rgba(229,62,62,0.25)', borderRadius:10, fontSize:13, color:'#C53030', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            {errorMsg}
            <button onClick={() => setErrorMsg('')} style={{ background:'none', border:'none', cursor:'pointer', color:'#C53030', fontSize:16, lineHeight:1 }}>{'\u00d7'}</button>
          </div>
        )}

        {journeyMode && user && view === 'input' && (
          <JourneyTiles
            profile={profile} season={season} streak={streak}
            country={profile?.country || 'IN'}
            ratings={ratings} mealHistory={mealHistory}
            didYouCookNudge={didYouCookNudge}
            weeklyDigest={weeklyDigest}
            welcomeBack={welcomeBack}
            challenge={challenge}
            milestone={milestone}
            onConfirmCooked={confirmCooked}
            onDismissNudge={dismissNudge}
            onSelectFridge={() => { setJourneyMode(false); setInputMode('fridge'); }}
            onGenerateDirect={handleGenerateDirect}
            onLeftoverRescue={handleLeftoverRescue}
            onWeatherGenerate={(ctx) => handleGenerateDirect({ weather:ctx?.weather, type:'weather', mealType:'any' })}
          />
        )}

        {(!journeyMode || !user) && renderView()}

      </div>
    </>
  );
}
