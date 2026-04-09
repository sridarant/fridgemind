// src/pages/Profile.jsx
// Profile page shell — tab routing only. All tab UI is in src/components/profile/.
import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth }   from '../contexts/AuthContext';
import { useLocale } from '../contexts/LocaleContext';
import { fetchHistory } from '../services/historyService';
import { parseFoodTypeIds } from '../lib/dietary';
import { INDIAN_PANTRY_DEFAULTS } from '../components/profile/PantryTab';
import TasteTab    from '../components/profile/TasteTab';
import FamilyTab   from '../components/profile/FamilyTab';
import GoalsTab    from '../components/profile/GoalsTab';
import PantryTab   from '../components/profile/PantryTab';
import SettingsTab from '../components/profile/SettingsTab';

const C = {
  jiff:'#FF4500', jiffDark:'#CC3700', ink:'#1C0A00',
  cream:'#FFFAF5', warm:'#FFF0E5', muted:'#7C6A5E',
  border:'rgba(28,10,0,0.08)', borderMid:'rgba(28,10,0,0.15)',
  shadow:'0 4px 20px rgba(28,10,0,0.07)', gold:'#D97706',
};

const pill = (active) => ({
  padding:'8px 16px',
  border:'1.5px solid ' + (active ? C.jiff : C.borderMid),
  borderRadius:20, background: active ? 'rgba(255,69,0,0.07)' : 'white',
  color: active ? C.jiff : C.muted, fontSize:13, cursor:'pointer',
  fontFamily:"'DM Sans',sans-serif",
  fontWeight: active ? 600 : 400, transition:'all 0.12s',
});

function StatsBanner({ streak, cookedCount, avgRating }) {
  const stats = [
    { emoji:'\ud83d\udd25', value: streak || 0,      label:'day streak'  },
    { emoji:'\ud83c\udf73', value: cookedCount || 0,  label:'recipes'     },
    { emoji:'\u2b50',        value: avgRating ? avgRating.toFixed(1) : '—', label:'avg rating' },
  ];
  return (
    <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:10, marginBottom:24 }}>
      {stats.map(s => (
        <div key={s.label} style={{ background:'white', border:'1px solid ' + C.border, borderRadius:14, padding:'14px 10px', textAlign:'center', boxShadow:C.shadow }}>
          <div style={{ fontSize:22, marginBottom:4 }}>{s.emoji}</div>
          <div style={{ fontFamily:"'Fraunces',serif", fontSize:22, fontWeight:900, color:C.ink }}>{s.value}</div>
          <div style={{ fontSize:10, color:C.muted, textTransform:'uppercase', letterSpacing:'1px', marginTop:2 }}>{s.label}</div>
        </div>
      ))}
    </div>
  );
}

const TABS = [
  { id:'taste',  label:'My Taste' },
  { id:'family', label:'Family'   },
  { id:'goals',  label:'Goals'    },
  { id:'pantry', label:'Pantry'   },
];

export default function Profile() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, profile, pantry, updateProfile, savePantry } = useAuth();
  const { lang, setLang, units, setUnits } = useLocale();

  const initTab   = location?.state?.tab || 'taste';
  const [activeTab, setActiveTab] = useState(initTab);
  const [saving,    setSaving]    = useState(false);
  const [saved,     setSaved]     = useState(false);

  // Taste
  const [foodType,     setFoodType]     = useState(['veg']);
  const [spiceLevel,   setSpiceLevel]   = useState('medium');
  const [skillLevel,   setSkillLevel]   = useState('home_cook');
  const [allergies,    setAllergies]    = useState([]);
  const [allergyInput, setAllergyInput] = useState('');
  const [prefCuisines, setPrefCuisines] = useState([]);

  // Family
  const [familyMembers,    setFamilyMembers]    = useState([]);
  const [newMemberName,    setNewMemberName]     = useState('');
  const [newMemberDietary, setNewMemberDietary]  = useState('veg');

  // Goals
  const [activeGoal,    setActiveGoal]    = useState('');
  const [calorieTarget, setCalorieTarget] = useState('');
  const [mealHistory,   setMealHistory]   = useState([]);

  // Pantry
  const [pantryItems, setPantryItems] = useState([]);

  // Derived stats
  const streak     = profile?.streak || 0;
  const cookedCount = mealHistory.filter(h => h.rating).length;
  const avgRating   = cookedCount > 0
    ? mealHistory.filter(h => h.rating).reduce((s, h) => s + (h.rating || 0), 0) / cookedCount
    : 0;

  const isSettingsView = activeTab === 'settings';

  // ── Effects ──────────────────────────────────────────────────────
  useEffect(() => {
    if (!profile) return;
    const ids = parseFoodTypeIds(profile.food_type);
    if (ids.length)                        setFoodType(ids);
    if (profile.spice_level)               setSpiceLevel(profile.spice_level);
    if (profile.skill_level)               setSkillLevel(profile.skill_level);
    if (profile.allergies?.length)         setAllergies(profile.allergies);
    if (profile.preferred_cuisines?.length) setPrefCuisines(profile.preferred_cuisines);
    if (profile.family_members)            setFamilyMembers(Array.isArray(profile.family_members) ? profile.family_members : []);
    if (profile.active_goal)               setActiveGoal(profile.active_goal);
    if (profile.calorie_target)            setCalorieTarget(String(profile.calorie_target));
  }, [profile]);

  useEffect(() => {
    if (Array.isArray(pantry) && pantry.length > 0) {
      setPantryItems(pantry);
    } else if (pantry !== null) {
      setPantryItems([...INDIAN_PANTRY_DEFAULTS]);
    }
  }, [pantry]); // eslint-disable-line

  useEffect(() => {
    if (!user) return;
    fetchHistory(user.id).then(h => { if (h.length) setMealHistory(h); }).catch(() => {});
  }, [user]);

  // ── Save handler ──────────────────────────────────────────────────
  const handleSave = async () => {
    setSaving(true);
    await updateProfile({
      food_type:          [...new Set(foodType)],
      spice_level:        spiceLevel,
      skill_level:        skillLevel,
      allergies,
      preferred_cuisines: prefCuisines,
      family_members:     familyMembers,
      active_goal:        activeGoal,
      calorie_target:     calorieTarget ? parseInt(calorieTarget, 10) : null,
    });
    await savePantry(pantryItems);
    setSaving(false); setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  // ── Shared tab props ──────────────────────────────────────────────
  const tabProps = { pill, C };

  // ── Render ────────────────────────────────────────────────────────
  return (
    <div style={{ minHeight:'100vh', background:C.cream, fontFamily:"'DM Sans',sans-serif", color:C.ink, paddingBottom:80 }}>

      <header style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'14px 20px', borderBottom:'1px solid ' + C.border, position:'sticky', top:0, zIndex:10, background:'rgba(255,250,245,0.96)', backdropFilter:'blur(10px)' }}>
        <button onClick={() => navigate('/app')}
          style={{ fontSize:13, color:C.muted, background:'none', border:'1px solid ' + C.border, borderRadius:8, padding:'6px 12px', cursor:'pointer', fontFamily:"'DM Sans',sans-serif" }}>
          {'\u2190 Home'}
        </button>
        <span style={{ fontFamily:"'Fraunces',serif", fontSize:17, fontWeight:700, color:C.ink }}>Profile</span>
        <button onClick={handleSave} disabled={saving}
          style={{ fontSize:13, color:'white', background: saving ? C.muted : C.jiff, border:'none', borderRadius:8, padding:'7px 16px', cursor: saving ? 'default' : 'pointer', fontFamily:"'DM Sans',sans-serif", fontWeight:500 }}>
          {saving ? 'Saving\u2026' : saved ? '\u2713 Saved' : 'Save'}
        </button>
      </header>

      <div style={{ padding:'20px 20px 0', maxWidth:680, margin:'0 auto' }}>

        {/* Stats banner — hidden in settings view */}
        {user && !isSettingsView && <StatsBanner streak={streak} cookedCount={cookedCount} avgRating={avgRating} />}

        {/* Tab bar / settings back button */}
        {isSettingsView ? (
          <button onClick={() => setActiveTab('taste')}
            style={{ display:'flex', alignItems:'center', gap:6, marginBottom:20, background:'none', border:'none', cursor:'pointer', fontSize:13, color:C.muted, fontFamily:"'DM Sans',sans-serif", padding:0 }}>
            {'\u2190 Back to Profile'}
          </button>
        ) : (
          <div style={{ display:'flex', gap:8, marginBottom:24, overflowX:'auto', paddingBottom:4, scrollbarWidth:'none', msOverflowStyle:'none' }}>
            {TABS.map(tab => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                style={{ ...pill(activeTab === tab.id), whiteSpace:'nowrap', flexShrink:0, padding:'8px 16px', minHeight:36 }}>
                {tab.label}
              </button>
            ))}
          </div>
        )}

        {/* Tab content */}
        {activeTab === 'taste' && (
          <TasteTab
            foodType={foodType} setFoodType={setFoodType}
            spiceLevel={spiceLevel} setSpiceLevel={setSpiceLevel}
            skillLevel={skillLevel} setSkillLevel={setSkillLevel}
            allergies={allergies} setAllergies={setAllergies}
            allergyInput={allergyInput} setAllergyInput={setAllergyInput}
            prefCuisines={prefCuisines} setPrefCuisines={setPrefCuisines}
            {...tabProps}
          />
        )}
        {activeTab === 'family' && (
          <FamilyTab
            familyMembers={familyMembers} setFamilyMembers={setFamilyMembers}
            newMemberName={newMemberName} setNewMemberName={setNewMemberName}
            newMemberDietary={newMemberDietary} setNewMemberDietary={setNewMemberDietary}
            {...tabProps}
          />
        )}
        {activeTab === 'goals' && (
          <GoalsTab
            activeGoal={activeGoal} setActiveGoal={setActiveGoal}
            calorieTarget={calorieTarget} setCalorieTarget={setCalorieTarget}
            mealHistory={mealHistory} cookedCount={cookedCount} avgRating={avgRating}
            {...tabProps}
          />
        )}
        {activeTab === 'pantry' && (
          <PantryTab pantryItems={pantryItems} setPantryItems={setPantryItems} C={C} />
        )}
        {activeTab === 'settings' && (
          <SettingsTab
            lang={lang} setLang={setLang}
            units={units} setUnits={setUnits}
            profile={profile} updateProfile={updateProfile}
            {...tabProps}
          />
        )}
      </div>
    </div>
  );
}
