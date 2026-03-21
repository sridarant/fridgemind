import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth }   from '../contexts/AuthContext';
import { useLocale } from '../contexts/LocaleContext';

const C = {
  jiff: '#FF4500', jiffDark: '#CC3700', ink: '#1C0A00',
  cream: '#FFFAF5', warm: '#FFF0E5', muted: '#7C6A5E',
  border: 'rgba(28,10,0,0.10)', borderMid: 'rgba(28,10,0,0.18)',
  shadow: '0 4px 28px rgba(28,10,0,0.08)',
  green: '#1D9E75', greenBg: 'rgba(29,158,117,0.1)',
};

const SPICE_OPTIONS   = ['none','mild','medium','hot','extra hot'];
const SKILL_OPTIONS   = ['beginner','intermediate','advanced'];
const ALLERGY_OPTIONS = ['gluten','dairy','nuts','eggs','soy','shellfish','fish'];
const CUISINE_OPTIONS = ['Indian','Italian','Chinese','Mexican','Mediterranean','Thai','Japanese','American'];

const s = {
  page: { minHeight: '100vh', background: C.cream, fontFamily: "'DM Sans', sans-serif" },
  header: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 36px', borderBottom: `1px solid ${C.border}`, position: 'sticky', top: 0, zIndex: 10, background: 'rgba(255,250,245,0.95)', backdropFilter: 'blur(12px)' },
  logo: { display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' },
  logoName: { fontFamily: "'Fraunces', serif", fontSize: 22, fontWeight: 900, color: C.ink, letterSpacing: '-0.5px' },
  backBtn: { fontSize: 13, fontWeight: 500, color: C.muted, background: 'none', border: `1.5px solid ${C.borderMid}`, borderRadius: 8, padding: '7px 14px', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", transition: 'all 0.18s' },
  wrap: { maxWidth: 680, margin: '0 auto', padding: '40px 24px 80px' },
  pageTitle: { fontFamily: "'Fraunces', serif", fontSize: 'clamp(28px,5vw,42px)', fontWeight: 900, color: C.ink, letterSpacing: '-1px', marginBottom: 6 },
  pageSub: { fontSize: 14, color: C.muted, fontWeight: 300, marginBottom: 36, lineHeight: 1.6 },
  card: { background: 'white', border: `1px solid ${C.border}`, borderRadius: 20, padding: 28, boxShadow: C.shadow, marginBottom: 20 },
  cardTitle: { fontFamily: "'Fraunces', serif", fontSize: 18, fontWeight: 700, color: C.ink, marginBottom: 4, letterSpacing: '-0.3px' },
  cardSub: { fontSize: 13, color: C.muted, fontWeight: 300, marginBottom: 20, lineHeight: 1.55 },
  label: { fontSize: 11, letterSpacing: '2px', textTransform: 'uppercase', fontWeight: 500, color: C.jiff, marginBottom: 10, display: 'block' },
  row: { display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 6 },
  pill: (active) => ({
    border: `1.5px solid ${active ? C.jiff : C.borderMid}`,
    background: active ? C.jiff : 'white',
    color: active ? 'white' : C.muted,
    borderRadius: 20, padding: '6px 14px', fontSize: 13,
    cursor: 'pointer', fontWeight: active ? 500 : 400,
    fontFamily: "'DM Sans', sans-serif", transition: 'all 0.15s',
    textTransform: 'capitalize',
  }),
  spicePill: (level, active) => {
    const colors = { none:'#888', mild:'#22C55E', medium:'#F59E0B', hot:'#EF4444', 'extra hot':'#7C3AED' };
    const col = colors[level] || C.jiff;
    return {
      border: `1.5px solid ${active ? col : C.borderMid}`,
      background: active ? col : 'white',
      color: active ? 'white' : C.muted,
      borderRadius: 20, padding: '6px 16px', fontSize: 13,
      cursor: 'pointer', fontWeight: active ? 500 : 400,
      fontFamily: "'DM Sans', sans-serif", transition: 'all 0.15s',
      textTransform: 'capitalize',
    };
  },
  saveBtn: { background: C.jiff, color: 'white', border: 'none', borderRadius: 12, padding: '14px 32px', fontSize: 15, fontFamily: "'DM Sans', sans-serif", fontWeight: 500, cursor: 'pointer', transition: 'all 0.2s', display: 'inline-flex', alignItems: 'center', gap: 8 },
  successBanner: { background: C.greenBg, border: `1px solid rgba(29,158,117,0.25)`, borderRadius: 12, padding: '12px 16px', fontSize: 13, color: C.green, fontWeight: 500, marginTop: 16, display: 'flex', alignItems: 'center', gap: 8 },
  signOutBtn: { background: 'none', border: `1.5px solid ${C.borderMid}`, borderRadius: 10, padding: '10px 20px', fontSize: 13, color: C.muted, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", transition: 'all 0.18s' },
  // Pantry
  ingBox: { border: `1.5px solid ${C.borderMid}`, borderRadius: 12, padding: '12px 14px', background: C.cream, minHeight: 80, cursor: 'text', display: 'flex', flexWrap: 'wrap', gap: 7, alignItems: 'flex-start' },
  tag: { background: C.ink, color: 'white', padding: '5px 12px 5px 13px', borderRadius: 20, fontSize: 13, display: 'flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap' },
  tagRemove: { background: 'none', border: 'none', color: 'rgba(255,255,255,0.6)', cursor: 'pointer', fontSize: 16, padding: 0, lineHeight: 1 },
  tagInput: { border: 'none', outline: 'none', fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: C.ink, flex: 1, minWidth: 140, background: 'transparent', padding: '4px 0' },
  hint: { fontSize: 11.5, color: C.muted, marginTop: 7, fontWeight: 300 },
  // User avatar row
  userRow: { display: 'flex', alignItems: 'center', gap: 14, marginBottom: 24, padding: '16px 20px', background: C.warm, borderRadius: 14 },
  avatar: { width: 48, height: 48, borderRadius: '50%', background: C.jiff, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 700, color: 'white', flexShrink: 0, overflow: 'hidden' },
  userName: { fontSize: 15, fontWeight: 500, color: C.ink },
  userEmail: { fontSize: 13, color: C.muted, fontWeight: 300, marginTop: 2 },
};

export default function Profile() {
  const navigate = useNavigate();
  const { user, profile, pantry, updateProfile, savePantry, signOut, supabaseEnabled } = useAuth();
  const { lang, setLang, units, setUnits, supportedLanguages } = useLocale();

  const [local, setLocal]       = useState(profile || { spice_level:'medium', allergies:[], preferred_cuisines:[], skill_level:'intermediate' });
  const [pantryLocal, setPantryLocal] = useState(pantry || []);
  const [pantryInput, setPantryInput] = useState('');
  const [saved, setSaved]       = useState(false);
  const [saving, setSaving]     = useState(false);
  const pantryRef = useRef(null);

  // Keep local in sync if profile loads async
  useState(() => { if (profile) setLocal(profile); }, [profile]);
  useState(() => { if (pantry?.length) setPantryLocal(pantry); }, [pantry]);

  const toggle = (field, value) => {
    setLocal(prev => {
      const arr = prev[field] || [];
      return { ...prev, [field]: arr.includes(value) ? arr.filter(v => v !== value) : [...arr, value] };
    });
  };

  const addPantryItem = (val) => {
    const v = val.trim().replace(/,$/,'');
    if (v && !pantryLocal.includes(v)) setPantryLocal(p => [...p, v]);
    setPantryInput('');
  };
  const onPantryKey = e => {
    if (e.key==='Enter'||e.key===','){e.preventDefault();addPantryItem(pantryInput);}
    else if(e.key==='Backspace'&&!pantryInput&&pantryLocal.length) setPantryLocal(p=>p.slice(0,-1));
  };

  const handleSave = async () => {
    setSaving(true);
    await Promise.all([
      updateProfile(local),
      savePantry(pantryLocal),
    ]);
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const handleSignOut = async () => { await signOut(); navigate('/'); };

  const initials = profile?.name ? profile.name.slice(0,2).toUpperCase() : user?.email?.slice(0,2).toUpperCase() || 'J';

  return (
    <div style={s.page}>
      <link href="https://fonts.googleapis.com/css2?family=Fraunces:ital,wght@0,700;0,900;1,700&family=DM+Sans:wght@300;400;500&display=swap" rel="stylesheet"/>

      <header style={s.header}>
        <div style={s.logo} onClick={() => navigate('/')}>
          <span style={{fontSize:22}}>⚡</span>
          <span style={s.logoName}><span style={{color:C.jiff}}>J</span>iff</span>
        </div>
        <button style={s.backBtn} onClick={() => navigate('/app')}
          onMouseEnter={e=>Object.assign(e.target.style,{borderColor:C.jiff,color:C.jiff})}
          onMouseLeave={e=>Object.assign(e.target.style,{borderColor:C.borderMid,color:C.muted})}>
          ← Back to app
        </button>
      </header>

      <div style={s.wrap}>
        <div style={s.pageTitle}>Your Jiff profile</div>
        <div style={s.pageSub}>Jiff uses your preferences to personalise every meal suggestion automatically.</div>

        {/* User info */}
        {user && (
          <div style={s.card}>
            <div style={s.userRow}>
              <div style={s.avatar}>
                {profile?.avatar_url
                  ? <img src={profile.avatar_url} alt="" style={{width:'100%',height:'100%',objectFit:'cover'}}/>
                  : initials}
              </div>
              <div style={{flex:1}}>
                <div style={s.userName}>{profile?.name || 'Chef'}</div>
                <div style={s.userEmail}>{user.email}</div>
              </div>
              <button style={s.signOutBtn} onClick={handleSignOut}
                onMouseEnter={e=>Object.assign(e.target.style,{borderColor:'#E53E3E',color:'#E53E3E'})}
                onMouseLeave={e=>Object.assign(e.target.style,{borderColor:C.borderMid,color:C.muted})}>
                Sign out
              </button>
            </div>
          </div>
        )}

        {/* Pantry */}
        <div style={s.card}>
          <div style={s.cardTitle}>🧂 Saved pantry</div>
          <div style={s.cardSub}>Your regular staples. These will pre-fill your ingredient list every time you open Jiff.</div>
          <span style={s.label}>Pantry ingredients</span>
          <div style={s.ingBox} onClick={() => pantryRef.current?.focus()}>
            {pantryLocal.map(ing => (
              <span key={ing} style={s.tag}>
                {ing}
                <button style={s.tagRemove} onClick={e=>{e.stopPropagation();setPantryLocal(p=>p.filter(i=>i!==ing));}}>×</button>
              </span>
            ))}
            <input
              ref={pantryRef} style={s.tagInput} value={pantryInput}
              onChange={e=>setPantryInput(e.target.value)} onKeyDown={onPantryKey}
              onBlur={()=>{if(pantryInput.trim())addPantryItem(pantryInput);}}
              placeholder={pantryLocal.length===0?'rice, onions, garlic, olive oil… press Enter after each':'add more…'}
            />
          </div>
          <p style={s.hint}>Enter or comma to add · Backspace to remove last</p>
        </div>

        {/* Spice level */}
        <div style={s.card}>
          <div style={s.cardTitle}>🌶️ Spice tolerance</div>
          <div style={s.cardSub}>Jiff will calibrate heat levels in every recipe to match your preference.</div>
          <span style={s.label}>Your spice level</span>
          <div style={s.row}>
            {SPICE_OPTIONS.map(o => (
              <button key={o} style={s.spicePill(o, local.spice_level===o)} onClick={() => setLocal(p=>({...p,spice_level:o}))}>
                {o==='none'?'🚫 none':o==='mild'?'😌 mild':o==='medium'?'🔥 medium':o==='hot'?'🔥🔥 hot':'🔥🔥🔥 extra hot'}
              </button>
            ))}
          </div>
        </div>

        {/* Allergies */}
        <div style={s.card}>
          <div style={s.cardTitle}>⚠️ Allergies & intolerances</div>
          <div style={s.cardSub}>Jiff will never suggest a meal containing these ingredients.</div>
          <span style={s.label}>Select all that apply</span>
          <div style={s.row}>
            {ALLERGY_OPTIONS.map(o => (
              <button key={o} style={s.pill((local.allergies||[]).includes(o))} onClick={() => toggle('allergies', o)}>
                {o}
              </button>
            ))}
          </div>
        </div>

        {/* Preferred cuisines */}
        <div style={s.card}>
          <div style={s.cardTitle}>🌍 Favourite cuisines</div>
          <div style={s.cardSub}>Jiff will favour these styles when no cuisine is selected.</div>
          <span style={s.label}>Select all you love</span>
          <div style={s.row}>
            {CUISINE_OPTIONS.map(o => (
              <button key={o} style={s.pill((local.preferred_cuisines||[]).includes(o))} onClick={() => toggle('preferred_cuisines', o)}>
                {o}
              </button>
            ))}
          </div>
        </div>

        {/* Cooking skill */}
        <div style={s.card}>
          <div style={s.cardTitle}>👨‍🍳 Cooking skill level</div>
          <div style={s.cardSub}>Jiff will adjust recipe complexity and technique to match your confidence in the kitchen.</div>
          <span style={s.label}>Your level</span>
          <div style={s.row}>
            {SKILL_OPTIONS.map(o => (
              <button key={o} style={s.pill(local.skill_level===o)} onClick={() => setLocal(p=>({...p,skill_level:o}))}>
                {o==='beginner'?'🌱 Beginner':o==='intermediate'?'🍳 Intermediate':'👨‍🍳 Advanced'}
              </button>
            ))}
          </div>
        </div>

        {/* Language */}
        <div style={s.card}>
          <div style={s.cardTitle}>🌍 Language</div>
          <div style={s.cardSub}>Jiff will display the UI and generate recipes in your chosen language.</div>
          <span style={s.label}>Display language</span>
          <div style={s.row}>
            {supportedLanguages.map(l => (
              <button key={l.id} style={s.pill(lang===l.id)} onClick={()=>setLang(l.id)}>
                {l.flag} {l.label}
              </button>
            ))}
          </div>
        </div>

        {/* Units */}
        <div style={s.card}>
          <div style={s.cardTitle}>📏 Measurement units</div>
          <div style={s.cardSub}>Ingredient quantities in all recipes will use your preferred system.</div>
          <span style={s.label}>Units</span>
          <div style={s.row}>
            {[{id:'metric',label:'⚖️ Metric (g, ml, kg)'},{id:'imperial',label:'🥛 Imperial (oz, cups, lbs)'}].map(o=>(
              <button key={o.id} style={s.pill(units===o.id)} onClick={()=>setUnits(o.id)}>{o.label}</button>
            ))}
          </div>
        </div>

        {/* Save */}
        <button style={s.saveBtn} onClick={handleSave} disabled={saving}
          onMouseEnter={e=>Object.assign(e.currentTarget.style,{background:C.jiffDark,transform:'translateY(-1px)'})}
          onMouseLeave={e=>Object.assign(e.currentTarget.style,{background:C.jiff,transform:'none'})}>
          {saving ? '⏳ Saving…' : '✓ Save profile'}
        </button>

        {saved && (
          <div style={s.successBanner}>
            ✓ Profile saved — Jiff will personalise your meals automatically from now on.
          </div>
        )}

        {!supabaseEnabled && (
          <div style={{marginTop:16,fontSize:13,color:C.muted,background:C.warm,borderRadius:10,padding:'10px 14px',lineHeight:1.6}}>
            ℹ️ Supabase not configured — profile saved locally only. Follow the setup guide to enable cloud sync.
          </div>
        )}
      </div>
    </div>
  );
}
