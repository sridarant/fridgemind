import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth }   from '../contexts/AuthContext';
import { useLocale, FOOD_TYPE_OPTIONS, DIET_REQUIREMENTS, INDIAN_CUISINES, GLOBAL_CUISINES } from '../contexts/LocaleContext';
import IngredientInput from '../components/IngredientInput';
import { PANTRY_STAPLES } from '../lib/ingredients-db';

const C = { jiff:'#FF4500', ink:'#1C0A00', cream:'#FFFAF5', warm:'#FFF0E5', muted:'#7C6A5E', border:'rgba(28,10,0,0.10)', borderMid:'rgba(28,10,0,0.18)', shadow:'0 4px 28px rgba(28,10,0,0.08)', green:'#1D9E75', greenBg:'rgba(29,158,117,0.08)' };
const PALETTE = ['#E53E3E','#DD6B20','#38A169','#3182CE','#805AD5','#D69E2E','#319795','#E91E63'];
const pill = (active) => ({ border:'1.5px solid ' + (active?C.jiff:C.borderMid), background:active?C.jiff:'white', color:active?'white':C.muted, borderRadius:20, padding:'6px 14px', fontSize:13, cursor:'pointer', fontFamily:"'DM Sans', sans-serif", fontWeight:active?500:400, transition:'all 0.15s' });
const sectionTab = (active) => ({ padding:'8px 16px', borderRadius:20, fontSize:13, fontWeight:active?500:400, cursor:'pointer', fontFamily:"'DM Sans', sans-serif", border:'1.5px solid ' + (active?C.jiff:C.borderMid), background:active?C.jiff:'white', color:active?'white':C.muted, transition:'all 0.15s' });
const label = { fontSize:11, letterSpacing:'2px', textTransform:'uppercase', color:C.jiff, fontWeight:500, marginBottom:8, display:'block' };
const ingBox = { border:'1.5px solid ' + C.borderMid, borderRadius:12, padding:'12px 14px', background:C.cream, minHeight:60, cursor:'text', display:'flex', flexWrap:'wrap', gap:7, alignItems:'flex-start' };
const tag = { background:C.ink, color:'white', padding:'5px 12px 5px 13px', borderRadius:20, fontSize:12, display:'flex', alignItems:'center', gap:5, whiteSpace:'nowrap' };
const tagInput = { border:'none', outline:'none', fontFamily:"'DM Sans', sans-serif", fontSize:13, color:C.ink, flex:1, minWidth:120, background:'transparent', padding:'3px 0' };
const SPICE = [{id:'none',l:'None',e:'😌'},{id:'mild',l:'Mild',e:'🙂'},{id:'medium',l:'Medium',e:'😊'},{id:'hot',l:'Hot',e:'🌶️'},{id:'extra-hot',l:'Extra hot',e:'🔥'}];
const SKILL = [{id:'beginner',l:'Beginner',e:'👶'},{id:'intermediate',l:'Intermediate',e:'🍳'},{id:'advanced',l:'Advanced',e:'👨‍🍳'}];

export default function Profile() {
  const navigate = useNavigate();
  const { user, profile, pantry, updateProfile, savePantry, signOut, supabaseEnabled } = useAuth();
  const { lang, setLang, units, setUnits, supportedLanguages } = useLocale();

  const [activeTab, setActiveTab] = useState('food');
  const [saved,  setSaved]   = useState(false);
  const [saving, setSaving]  = useState(false);

  const [foodType,      setFoodType]      = useState(
    Array.isArray(profile?.food_type) ? profile.food_type
    : profile?.food_type ? [profile.food_type]
    : ['veg']
  );
  const [spiceLevel,    setSpiceLevel]    = useState(profile?.spice_level || 'medium');
  const [skillLevel,    setSkillLevel]    = useState(profile?.skill_level || 'intermediate');
  const [allergies,     setAllergies]     = useState(profile?.allergies || []);
  const [allergyInput,  setAllergyInput]  = useState('');
  const [dietReqs,      setDietReqs]      = useState(profile?.diet_requirements || []);
  const [prefCuisines,  setPrefCuisines]  = useState(profile?.preferred_cuisines || []);
  const [pantryItems,   setPantryItems]   = useState(pantry || []);
  const allergyRef = useRef(null);

  const addTag = (setArr, arr, v) => { const t=v.trim().toLowerCase().replace(/,$/,''); if(t&&!arr.includes(t)) setArr(p=>[...p,t]); };
  const toggleArr = (setArr, arr, id) => setArr(p => p.includes(id) ? p.filter(x=>x!==id) : [...p,id]);

  const handleSave = async () => {
    setSaving(true);
    await updateProfile({ food_type:foodType, spice_level:spiceLevel, allergies, diet_requirements:dietReqs, preferred_cuisines:prefCuisines, skill_level:skillLevel });
    await savePantry(pantryItems);
    setSaving(false); setSaved(true); setTimeout(()=>setSaved(false),3000);
  };

  const TABS = [{id:'food',l:'🍽️ Food type'},{id:'cuisine',l:'🌍 Cuisines'},{id:'dietary',l:'💊 Dietary'},{id:'pantry',l:'🧂 Pantry'},{id:'prefs',l:'⚙️ Settings'}];

  return (
    <div style={{minHeight:'100vh',background:C.cream,fontFamily:"'DM Sans', sans-serif",color:C.ink}}>
      <link href="https://fonts.googleapis.com/css2?family=Fraunces:ital,wght@0,700;0,900&family=DM+Sans:wght@300;400;500&display=swap" rel="stylesheet"/>
      <header style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'16px 28px',borderBottom:'1px solid ' + C.border,position:'sticky',top:0,zIndex:10,background:'rgba(255,250,245,0.95)',backdropFilter:'blur(12px)'}}>
        <div style={{display:'flex',alignItems:'center',gap:8,cursor:'pointer'}} onClick={()=>navigate('/app')}>
          <span style={{fontSize:22}}>⚡</span>
          <span style={{fontFamily:"'Fraunces', serif",fontSize:22,fontWeight:900,color:C.ink}}><span style={{color:C.jiff}}>J</span>iff</span>
        </div>
        <div style={{display:'flex',gap:8}}>
          <button onClick={()=>navigate('/app')} style={{fontSize:13,color:C.muted,background:'none',border:'1.5px solid ' + C.borderMid,borderRadius:8,padding:'7px 14px',cursor:'pointer',fontFamily:"'DM Sans', sans-serif"}}>← App</button>
          {user && <button onClick={signOut} style={{fontSize:13,color:'#E53E3E',background:'none',border:'1.5px solid rgba(229,62,62,0.3)',borderRadius:8,padding:'7px 14px',cursor:'pointer',fontFamily:"'DM Sans', sans-serif"}}>Sign out</button>}
        </div>
      </header>

      <div style={{maxWidth:720,margin:'0 auto',padding:'36px 20px 100px'}}>
        <div style={{fontFamily:"'Fraunces', serif",fontSize:'clamp(24px,4vw,36px)',fontWeight:900,color:C.ink,letterSpacing:'-1px',marginBottom:4}}>Your profile</div>
        <div style={{fontSize:14,color:C.muted,fontWeight:300,marginBottom:24}}>Preferences here personalise every recipe Jiff generates for you.</div>

        {user && (
          <div style={{background:'white',border:'1px solid ' + C.border,borderRadius:16,padding:'14px 18px',marginBottom:20,boxShadow:C.shadow,display:'flex',alignItems:'center',gap:12}}>
            <div style={{width:40,height:40,borderRadius:'50%',background:C.jiff,display:'flex',alignItems:'center',justifyContent:'center',fontSize:16,color:'white',fontWeight:700,flexShrink:0}}>
              {(profile?.name||user.email||'U')[0].toUpperCase()}
            </div>
            <div style={{flex:1}}>
              <div style={{fontSize:14,fontWeight:500,color:C.ink}}>{profile?.name||'Your account'}</div>
              <div style={{fontSize:12,color:C.muted,fontWeight:300}}>{user.email}</div>
            </div>
            {!supabaseEnabled && <span style={{fontSize:11,color:C.muted,background:C.warm,borderRadius:20,padding:'3px 10px'}}>Guest mode</span>}
          </div>
        )}

        <div style={{display:'flex',gap:7,flexWrap:'wrap',marginBottom:20}}>
          {TABS.map(t => <button key={t.id} style={sectionTab(activeTab===t.id)} onClick={()=>setActiveTab(t.id)}>{t.l}</button>)}
        </div>

        {/* FOOD TYPE TAB */}
        {activeTab==='food' && (
          <div style={{background:'white',border:'1px solid ' + C.border,borderRadius:20,padding:22,boxShadow:C.shadow}}>
            <div style={{fontFamily:"'Fraunces', serif",fontSize:18,fontWeight:700,color:C.ink,marginBottom:4}}>🍽️ What do you eat?</div>
            <div style={{fontSize:13,color:C.muted,fontWeight:300,lineHeight:1.6,marginBottom:6}}>Select all that apply — controls ingredients and recipes Jiff suggests.</div>
            <span style={label}>Food type <span style={{fontWeight:300,textTransform:'none',letterSpacing:0,fontSize:10,color:C.muted}}>(select multiple)</span></span>
            <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(175px,1fr))',gap:10,marginBottom:22}}>
              {FOOD_TYPE_OPTIONS.map((opt,i)=>{
                const active = Array.isArray(foodType) ? foodType.includes(opt.id) : foodType===opt.id;
                return (
                <div key={opt.id} onClick={()=>toggleArr(setFoodType,Array.isArray(foodType)?foodType:[foodType],opt.id)} style={{border:'2px solid '+(active?PALETTE[i%8]:C.borderMid),borderRadius:14,padding:'11px 13px',cursor:'pointer',background:active?PALETTE[i%8]+'12':'white',transition:'all 0.15s'}}>
                  <div style={{display:'flex',alignItems:'center',gap:7,marginBottom:3}}>
                    <span style={{fontSize:18}}>{opt.emoji}</span>
                    <span style={{fontSize:13,fontWeight:500,color:active?C.ink:C.muted}}>{opt.label}</span>
                    {active && <span style={{marginLeft:'auto',color:PALETTE[i%8]}}>✓</span>}
                  </div>
                  <div style={{fontSize:11,color:C.muted,fontWeight:300,lineHeight:1.4}}>{opt.desc}</div>
                </div>
                );
              })}
            </div>
            <span style={label}>Spice level</span>
            <div style={{display:'flex',flexWrap:'wrap',gap:7,marginBottom:18}}>
              {SPICE.map(o=><button key={o.id} style={pill(spiceLevel===o.id)} onClick={()=>setSpiceLevel(o.id)}>{o.e} {o.l}</button>)}
            </div>
            <span style={label}>Cooking skill</span>
            <div style={{display:'flex',flexWrap:'wrap',gap:7,marginBottom:18}}>
              {SKILL.map(o=><button key={o.id} style={pill(skillLevel===o.id)} onClick={()=>setSkillLevel(o.id)}>{o.e} {o.l}</button>)}
            </div>
            <span style={label}>Allergies / foods to avoid</span>
            <div style={ingBox} onClick={()=>allergyRef.current?.focus()}>
              {allergies.map(a=>(
                <span key={a} style={{...tag,background:'#E53E3E'}}>
                  {a}<button onClick={()=>setAllergies(p=>p.filter(x=>x!==a))} style={{background:'none',border:'none',color:'rgba(255,255,255,0.7)',cursor:'pointer',fontSize:14,padding:0}}>×</button>
                </span>
              ))}
              <input ref={allergyRef} style={tagInput} value={allergyInput}
                onChange={e=>setAllergyInput(e.target.value)}
                onKeyDown={e=>{if(e.key==='Enter'||e.key===','){e.preventDefault();addTag(setAllergies,allergies,allergyInput);setAllergyInput('');}}}
                onBlur={()=>{if(allergyInput.trim()){addTag(setAllergies,allergies,allergyInput);setAllergyInput('');}}}
                placeholder={allergies.length===0?'peanuts, shellfish, dairy…':'add more…'}
              />
            </div>
          </div>
        )}

        {/* CUISINE TAB */}
        {activeTab==='cuisine' && (
          <div style={{background:'white',border:'1px solid ' + C.border,borderRadius:20,padding:22,boxShadow:C.shadow}}>
            <div style={{fontFamily:"'Fraunces', serif",fontSize:18,fontWeight:700,color:C.ink,marginBottom:4}}>🌍 Cuisine preferences</div>
            <div style={{fontSize:13,color:C.muted,fontWeight:300,lineHeight:1.6,marginBottom:14}}>Select all your favourite cuisines — Jiff will favour these when suggesting meals.</div>

            <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:8}}>
              <span style={label}>Indian regional cuisines</span>
              <button onClick={()=>setPrefCuisines(p=>{const ids=INDIAN_CUISINES.map(c=>c.id);const allIn=ids.every(id=>p.includes(id));return allIn?p.filter(id=>!ids.includes(id)):[...new Set([...p,...ids])]})}
                style={{fontSize:11,color:C.jiff,background:'none',border:'none',cursor:'pointer',fontFamily:"'DM Sans',sans-serif",padding:0}}>
                {INDIAN_CUISINES.every(c=>prefCuisines.includes(c.id)) ? 'Deselect all' : 'Select all'}
              </button>
            </div>
            <div style={{display:'flex',flexWrap:'wrap',gap:7,marginBottom:20}}>
              {INDIAN_CUISINES.map(c=>(
                <button key={c.id} onClick={()=>toggleArr(setPrefCuisines,prefCuisines,c.id)}
                  style={{...pill(prefCuisines.includes(c.id)),display:'flex',alignItems:'center',gap:5}}>
                  <span style={{fontSize:12}}>{c.flag}</span>{c.label}
                </button>
              ))}
            </div>

            <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:8}}>
              <span style={label}>Global cuisines</span>
              <button onClick={()=>setPrefCuisines(p=>{const ids=GLOBAL_CUISINES.map(c=>c.id);const allIn=ids.every(id=>p.includes(id));return allIn?p.filter(id=>!ids.includes(id)):[...new Set([...p,...ids])]})}
                style={{fontSize:11,color:C.jiff,background:'none',border:'none',cursor:'pointer',fontFamily:"'DM Sans',sans-serif",padding:0}}>
                {GLOBAL_CUISINES.every(c=>prefCuisines.includes(c.id)) ? 'Deselect all' : 'Select all'}
              </button>
            </div>
            <div style={{display:'flex',flexWrap:'wrap',gap:7}}>
              {GLOBAL_CUISINES.map(c=>(
                <button key={c.id} onClick={()=>toggleArr(setPrefCuisines,prefCuisines,c.id)}
                  style={{...pill(prefCuisines.includes(c.id)),display:'flex',alignItems:'center',gap:5}}>
                  <span style={{fontSize:12}}>{c.flag}</span>{c.label}
                </button>
              ))}
            </div>
            {prefCuisines.length>0 && (
              <div style={{marginTop:12,fontSize:12,color:C.muted,display:'flex',alignItems:'center',justifyContent:'space-between'}}>
                <span>{prefCuisines.length} cuisine{prefCuisines.length>1?'s':''} selected</span>
                <button onClick={()=>setPrefCuisines([])} style={{fontSize:11,color:'#E53E3E',background:'none',border:'none',cursor:'pointer',fontFamily:"'DM Sans',sans-serif"}}>Clear all</button>
              </div>
            )}
          </div>
        )}

        {/* DIETARY REQUIREMENTS TAB */}
        {activeTab==='dietary' && (
          <div style={{background:'white',border:'1px solid ' + C.border,borderRadius:20,padding:22,boxShadow:C.shadow}}>
            <div style={{fontFamily:"'Fraunces', serif",fontSize:18,fontWeight:700,color:C.ink,marginBottom:4}}>💊 Dietary requirements</div>
            <div style={{fontSize:13,color:C.muted,fontWeight:300,lineHeight:1.6,marginBottom:18}}>Medical or health-based requirements. Jiff will optimise every recipe accordingly. Select all that apply.</div>
            <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(190px,1fr))',gap:10}}>
              {DIET_REQUIREMENTS.map((req,i)=>{
                const active=dietReqs.includes(req.id);
                return (
                  <div key={req.id} onClick={()=>toggleArr(setDietReqs,dietReqs,req.id)}
                    style={{border:'1.5px solid ' + (active?PALETTE[i%8]:C.borderMid),borderRadius:12,padding:'10px 12px',cursor:'pointer',background:active?PALETTE[i%8]+'10':'white',transition:'all 0.15s'}}>
                    <div style={{display:'flex',alignItems:'center',gap:7,marginBottom:3}}>
                      <span style={{fontSize:16}}>{req.emoji}</span>
                      <span style={{fontSize:13,fontWeight:500,color:active?C.ink:C.muted}}>{req.label}</span>
                      {active && <span style={{marginLeft:'auto',color:PALETTE[i%8],fontSize:14}}>✓</span>}
                    </div>
                    <div style={{fontSize:11,color:C.muted,fontWeight:300}}>{req.desc}</div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* PANTRY TAB */}
        {activeTab==='pantry' && (
          <div style={{background:'white',border:'1px solid ' + C.border,borderRadius:20,padding:22,boxShadow:C.shadow}}>
            <div style={{fontFamily:"'Fraunces', serif",fontSize:18,fontWeight:700,color:C.ink,marginBottom:4}}>🧂 Your pantry</div>
            <div style={{fontSize:13,color:C.muted,fontWeight:300,lineHeight:1.6,marginBottom:16}}>Items always in your kitchen. These pre-fill every search automatically.</div>
            <IngredientInput
              ingredients={pantryItems}
              onChange={setPantryItems}
              pantryIngredients={[]}
              placeholder="salt, oil, cumin, turmeric, garlic…"
            />
            <div style={{marginTop:12}}>
              <div style={{fontSize:11,letterSpacing:'1.5px',textTransform:'uppercase',color:C.muted,fontWeight:500,marginBottom:8}}>Quick add common staples</div>
              <div style={{display:'flex',flexWrap:'wrap',gap:5}}>
                {PANTRY_STAPLES.filter(s => !pantryItems.map(p=>p.toLowerCase()).includes(s.toLowerCase())).slice(0,20).map(s=>(
                  <button key={s} onClick={()=>!pantryItems.includes(s)&&setPantryItems(p=>[...p,s])}
                    style={{background:'none',border:'1px dashed ' + C.borderMid,borderRadius:20,padding:'3px 10px',fontSize:11,color:C.muted,cursor:'pointer',fontFamily:"'DM Sans',sans-serif",transition:'all 0.12s'}}
                    onMouseEnter={e=>{e.target.style.borderColor=C.jiff;e.target.style.color=C.jiff;}}
                    onMouseLeave={e=>{e.target.style.borderColor=C.borderMid;e.target.style.color=C.muted;}}>
                    + {s}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* PREFERENCES TAB */}
        {activeTab==='prefs' && (
          <div style={{background:'white',border:'1px solid ' + C.border,borderRadius:20,padding:22,boxShadow:C.shadow}}>
            <div style={{fontFamily:"'Fraunces', serif",fontSize:18,fontWeight:700,color:C.ink,marginBottom:16}}>⚙️ App preferences</div>
            <span style={label}>Display language (10 available)</span>
            <div style={{display:'flex',flexWrap:'wrap',gap:7,marginBottom:20}}>
              {supportedLanguages.map(l=>(
                <button key={l.id} style={pill(lang===l.id)} onClick={()=>setLang(l.id)}>
                  {l.flag} {l.label}
                </button>
              ))}
            </div>
            <span style={label}>Measurement units</span>
            <div style={{display:'flex',flexWrap:'wrap',gap:7}}>
              {[{id:'metric',label:'⚖️ Metric (g, ml, kg)'},{id:'imperial',label:'🥛 Imperial (oz, cups, lbs)'}].map(u=>(
                <button key={u.id} style={pill(units===u.id)} onClick={()=>setUnits(u.id)}>{u.label}</button>
              ))}
            </div>
          </div>
        )}

        {activeTab!=='prefs' && (
          <div style={{marginTop:20}}>
            <button onClick={handleSave} disabled={saving} style={{background:C.jiff,color:'white',border:'none',borderRadius:12,padding:'13px 30px',fontSize:14,fontFamily:"'DM Sans', sans-serif",fontWeight:500,cursor:saving?'not-allowed':'pointer',opacity:saving?0.7:1,display:'inline-flex',alignItems:'center',gap:7}}>
              {saving?'⏳ Saving…':'⚡ Save preferences'}
            </button>
            {saved && <div style={{background:C.greenBg,border:'1px solid rgba(29,158,117,0.25)',borderRadius:10,padding:'11px 14px',fontSize:13,color:C.green,fontWeight:500,marginTop:14,display:'inline-flex',alignItems:'center',gap:7}}>✓ Preferences saved!</div>}
          </div>
        )}
      </div>
    </div>
  );
}
