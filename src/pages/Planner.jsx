// src/pages/Planner.jsx — Week Planner v17
// Uses profile preferences; no fridge/pantry input; multi-cuisine ratio selection
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

// ── Helpers ───────────────────────────────────────────────────────
function IconCopy()  { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>; }
function IconCheck() { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>; }
function IconWA()    { return <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.521.149-.174.198-.298.298-.497.099-.198.05-.372-.025-.521-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.372-.01-.571-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M11.999 2C6.477 2 2 6.477 2 12c0 1.99.574 3.846 1.568 5.408L2 22l4.785-1.536A9.958 9.958 0 0012 22c5.523 0 10-4.477 10-10S17.523 2 12 2z"/></svg>; }
function IconRefresh(){ return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 11-2.12-9.36L23 10"/></svg>; }

function collectAllIngredients(plan, mealTypes) {
  const all = new Set();
  if (!plan) return [];
  DAYS.forEach(day => {
    mealTypes.forEach(type => {
      const meal = plan[day]?.meals?.[type];
      if (meal?.ingredients) meal.ingredients.forEach(ing => {
        const c = ing.replace(/^\*\s*/, '').trim();
        if (c) all.add(c);
      });
    });
  });
  return [...all].sort();
}

function categoriseIngredients(items) {
  const kw = {
    'Vegetables & Herbs': ['onion','tomato','potato','carrot','spinach','garlic','ginger','chilli','pepper','broccoli','cauliflower','cabbage','beans','peas','capsicum','beetroot','okra','eggplant','zucchini','mushroom','coriander','mint','curry leaves','green onion','spring onion'],
    'Proteins': ['chicken','mutton','fish','egg','dal','lentil','paneer','tofu','chickpea','kidney bean','black bean','soya'],
    'Grains & Staples': ['rice','wheat','flour','bread','pasta','noodle','oats','semolina','poha','quinoa','millet','ragi','barley'],
    'Dairy': ['milk','yogurt','curd','butter','ghee','cream','cheese','paneer'],
    'Spices & Condiments': ['salt','pepper','cumin','turmeric','chilli powder','coriander','garam masala','mustard','cardamom','clove','cinnamon','bay','tamarind','oil','vinegar','sauce','paste'],
  };
  const cats = {};
  const other = [];
  items.forEach(item => {
    const lower = item.toLowerCase();
    let placed = false;
    for (const [cat, words] of Object.entries(kw)) {
      if (words.some(w => lower.includes(w))) { cats[cat] = cats[cat] || []; cats[cat].push(item); placed = true; break; }
    }
    if (!placed) other.push(item);
  });
  if (other.length) cats['Other'] = other;
  return Object.entries(cats);
}

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
  // Blinkit — India only (always IN now)
  const allUnchecked = items.filter((_,i) => !checked[`all-${i}`]);
  return (
    <div className="grocery-panel-wide">
      <div className="grocery-card">
        <div className="grocery-card-hdr">
          <div>
            <div className="grocery-card-title">🛒 Weekly grocery list</div>
            <div className="grocery-card-sub">{items.length} items · tap to tick off{checkedCount>0?` · ${checkedCount} done`:''}</div>
          </div>
          <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
            <button className={`g-action-btn copy ${copied?'copied':''}`} style={{background:copied?'#1D9E75':'rgba(255,250,245,0.1)',color:'white',border:copied?'none':'1.5px solid rgba(255,250,245,0.2)'}} onClick={handleCopy}>
              {copied?<IconCheck/>:<IconCopy/>}{copied?'Copied!':'Copy list'}
            </button>
            <a className="g-action-btn wa" href={waUrl} target="_blank" rel="noopener noreferrer" style={{textDecoration:'none'}}><IconWA/>WhatsApp</a>
            <a className="g-action-btn" href={'https://blinkit.com/s/?q='+encodeURIComponent(items.slice(0,10).join(', '))} target="_blank" rel="noopener noreferrer"
              style={{textDecoration:'none',background:'#1A8A3E',color:'white',border:'none',display:'flex',alignItems:'center',gap:5,padding:'7px 14px',borderRadius:8,fontSize:12,fontWeight:500,cursor:'pointer',fontFamily:"'DM Sans',sans-serif"}}>
              🛒 Order on Blinkit
            </a>
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
                  <a href={'https://blinkit.com/s/?q='+encodeURIComponent(item)} target="_blank" rel="noopener noreferrer"
                    onClick={e=>e.stopPropagation()}
                    style={{fontSize:10,color:'#1A8A3E',fontWeight:500,background:'rgba(26,138,62,0.08)',border:'1px solid rgba(26,138,62,0.2)',borderRadius:6,padding:'2px 6px',textDecoration:'none',marginLeft:'auto',whiteSpace:'nowrap',flexShrink:0}}>
                    Order →
                  </a>
                </div>
              );})}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function MealSlot({ meal, type, servings }) {
  const [open, setOpen] = useState(false);
  if (!meal) return <div style={{padding:'10px 0',fontSize:12,color:'#9E9E9E',fontStyle:'italic'}}>Not planned</div>;
  return (
    <div style={{cursor:'pointer'}} onClick={()=>setOpen(p=>!p)}>
      <div style={{display:'flex',alignItems:'center',gap:6,padding:'6px 0'}}>
        <span style={{fontSize:16}}>{meal.emoji||'🍽️'}</span>
        <div style={{flex:1,minWidth:0}}>
          <div style={{fontSize:12,fontWeight:500,color:'#1C0A00',lineHeight:1.3}}>{meal.name}</div>
          <div style={{fontSize:10,color:'#7C6A5E',marginTop:1}}>{meal.time} · {servings} serving{servings!==1?'s':''}</div>
        </div>
        <span style={{fontSize:10,color:'#7C6A5E'}}>{open?'▲':'▼'}</span>
      </div>
      {open && (
        <div style={{padding:'8px 10px',background:'rgba(255,250,245,0.8)',borderRadius:8,marginBottom:6,fontSize:11,lineHeight:1.7,color:'#3D2B1F'}}>
          <div style={{marginBottom:4,fontWeight:500,color:'#FF4500'}}>Ingredients:</div>
          {(meal.ingredients||[]).slice(0,5).map((ing,i)=><div key={i}>• {ing}</div>)}
          {(meal.ingredients||[]).length>5&&<div style={{color:'#7C6A5E'}}>+{meal.ingredients.length-5} more</div>}
        </div>
      )}
    </div>
  );
}

// ── Cuisine ratio selector ─────────────────────────────────────────
function CuisineRatioSelector({ cuisines, ratio, onChange }) {
  const total = 7;
  const remaining = total - Object.values(ratio).reduce((s,v)=>s+v, 0);
  return (
    <div style={{background:'rgba(255,69,0,0.04)',border:'1px solid rgba(255,69,0,0.15)',borderRadius:12,padding:'14px 16px',marginBottom:16}}>
      <div style={{fontSize:11,letterSpacing:'1.5px',textTransform:'uppercase',color:'#FF4500',fontWeight:500,marginBottom:10}}>
        How many days per cuisine? ({remaining} day{remaining!==1?'s':''} remaining)
      </div>
      <div style={{display:'flex',flexDirection:'column',gap:8}}>
        {cuisines.map(c => (
          <div key={c} style={{display:'flex',alignItems:'center',gap:10}}>
            <div style={{flex:1,fontSize:13,color:'#1C0A00',fontWeight:300}}>{c}</div>
            <div style={{display:'flex',alignItems:'center',gap:6}}>
              <button onClick={()=>onChange(c, Math.max(0, (ratio[c]||0)-1))}
                style={{width:26,height:26,borderRadius:8,border:'1.5px solid rgba(28,10,0,0.18)',background:'white',cursor:'pointer',fontSize:16,display:'flex',alignItems:'center',justifyContent:'center',color:'#FF4500'}}>−</button>
              <span style={{fontSize:13,fontWeight:500,color:'#1C0A00',minWidth:20,textAlign:'center'}}>{ratio[c]||0}</span>
              <button onClick={()=>{ if((ratio[c]||0)<total && remaining>0) onChange(c, (ratio[c]||0)+1); }}
                disabled={remaining === 0}
                style={{width:26,height:26,borderRadius:8,border:'1.5px solid rgba(28,10,0,0.18)',background:remaining===0?'#f5f5f5':'white',cursor:remaining===0?'not-allowed':'pointer',fontSize:16,display:'flex',alignItems:'center',justifyContent:'center',color:remaining===0?'#ccc':'#FF4500'}}>+</button>
            </div>
          </div>
        ))}
      </div>
      {remaining > 0 && <div style={{marginTop:8,fontSize:11,color:'#7C6A5E',fontWeight:300}}>Assign {remaining} more day{remaining!==1?'s':''} to complete your 7-day plan</div>}
      {remaining === 0 && <div style={{marginTop:8,fontSize:11,color:'#1D9E75',fontWeight:500}}>✓ All 7 days assigned</div>}
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────
const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,wght@0,700;0,900;1,700&family=DM+Sans:wght@300;400;500&display=swap');
  *{box-sizing:border-box;margin:0;padding:0;}
  body{background:#FFFAF5;}
  .page{min-height:100vh;background:#FFFAF5;font-family:'DM Sans',sans-serif;color:#1C0A00;}
  .header{display:flex;align-items:center;justify-content:space-between;padding:14px 28px;border-bottom:1px solid rgba(28,10,0,0.08);position:sticky;top:0;z-index:10;background:rgba(255,250,245,0.95);backdrop-filter:blur(12px);}
  .logo{display:flex;align-items:center;gap:6px;cursor:pointer;}
  .logo-name{font-family:'Fraunces',serif;font-size:20px;font-weight:900;color:#1C0A00;}
  .nav-links{display:flex;align-items:center;gap:8px;margin-left:auto;}
  .nav-link{padding:7px 14px;border-radius:8px;font-size:12px;font-family:'DM Sans',sans-serif;cursor:pointer;border:1.5px solid rgba(28,10,0,0.15);background:white;color:#7C6A5E;transition:all 0.15s;}
  .nav-link:hover,.nav-link.active{background:#1C0A00;color:white;border-color:#1C0A00;}
  .hero{text-align:center;padding:48px 24px 24px;max-width:600px;margin:0 auto;}
  .hero-eyebrow{font-size:11px;letter-spacing:2.5px;text-transform:uppercase;color:#FF4500;font-weight:500;margin-bottom:10px;}
  .hero-title{font-family:'Fraunces',serif;font-size:clamp(28px,5vw,44px);font-weight:900;color:#1C0A00;letter-spacing:-1.5px;line-height:1.05;margin-bottom:10px;}
  .hero-title em{font-style:italic;color:#FF4500;}
  .hero-sub{font-size:14px;color:#7C6A5E;font-weight:300;line-height:1.6;}
  .card{background:white;border:1px solid rgba(28,10,0,0.08);border-radius:20px;padding:22px;box-shadow:0 4px 24px rgba(28,10,0,0.06);max-width:860px;margin:0 auto 24px;}
  .section{margin-bottom:18px;}
  .section:last-child{margin-bottom:0;}
  .section-label{font-size:11px;letter-spacing:2px;text-transform:uppercase;color:#FF4500;font-weight:500;margin-bottom:10px;display:flex;align-items:center;gap:8px;}
  .section-label::after{content:'';flex:1;height:1px;background:rgba(28,10,0,0.08);}
  .meal-type-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:9px;}
  @media(min-width:480px){.meal-type-grid{grid-template-columns:repeat(4,1fr);}}
  .meal-type-toggle{border:1.5px solid rgba(28,10,0,0.14);border-radius:12px;padding:12px;cursor:pointer;display:flex;flex-direction:column;align-items:center;gap:5px;transition:all 0.15s;background:white;}
  .meal-type-toggle.selected{box-shadow:0 3px 10px rgba(0,0,0,0.08);}
  .meal-type-toggle-emoji{font-size:22px;}
  .meal-type-toggle-label{font-size:12px;font-weight:500;}
  .meal-type-toggle-check{width:16px;height:16px;border-radius:50%;border:1.5px solid rgba(28,10,0,0.2);display:flex;align-items:center;justify-content:center;transition:all 0.15s;margin-top:2px;}
  .servings-time-row{display:grid;grid-template-columns:1fr 1fr;gap:12px;}
  @media(max-width:480px){.servings-time-row{grid-template-columns:1fr;}}
  .serving-controls{display:flex;align-items:center;gap:8px;}
  .serving-btn{width:30px;height:30px;border-radius:8px;border:1.5px solid rgba(28,10,0,0.18);background:white;font-size:18px;cursor:pointer;display:flex;align-items:center;justify-content:center;color:#FF4500;transition:all 0.1s;}
  .serving-btn:disabled{opacity:0.35;cursor:not-allowed;}
  .serving-count{font-size:16px;font-weight:500;min-width:24px;text-align:center;}
  .chips{display:flex;flex-wrap:wrap;gap:7px;}
  .chip{border:1.5px solid rgba(28,10,0,0.18);border-radius:20px;padding:5px 14px;font-size:12px;cursor:pointer;transition:all 0.15s;font-family:'DM Sans',sans-serif;background:white;color:#7C6A5E;}
  .chip.active{background:#FF4500;border-color:#FF4500;color:white;font-weight:500;}
  .cta-btn{background:#FF4500;color:white;border:none;border-radius:14px;padding:14px 36px;font-size:15px;font-family:'DM Sans',sans-serif;font-weight:500;cursor:pointer;transition:all 0.2s;display:inline-flex;align-items:center;gap:10px;}
  .cta-btn:hover:not(:disabled){background:#CC3700;transform:translateY(-2px);box-shadow:0 8px 28px rgba(255,69,0,0.35);}
  .cta-btn:disabled{opacity:0.55;cursor:not-allowed;}
  .cta-wrap{text-align:center;padding-top:4px;}
  .cta-note{font-size:12px;color:#7C6A5E;margin-top:8px;text-align:center;}
  .loading-wrap{text-align:center;padding:60px 24px;max-width:500px;margin:0 auto;}
  .loading-title{font-family:'Fraunces',serif;font-size:26px;font-weight:900;color:#1C0A00;margin-bottom:8px;}
  .loading-sub{font-size:13px;color:#7C6A5E;font-weight:300;margin-bottom:32px;}
  .loading-days{display:flex;gap:6px;justify-content:center;flex-wrap:wrap;}
  .loading-day{width:36px;height:36px;border-radius:10px;border:1.5px solid rgba(28,10,0,0.12);display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:500;color:#7C6A5E;transition:all 0.3s;}
  .loading-day.done{background:#1C0A00;color:white;border-color:#1C0A00;}
  .results-wrap{max-width:1100px;margin:0 auto;padding:24px 20px;}
  .plan-header{display:flex;align-items:center;justify-content:space-between;margin-bottom:20px;flex-wrap:wrap;gap:10px;}
  .plan-title{font-family:'Fraunces',serif;font-size:22px;font-weight:900;color:#1C0A00;letter-spacing:-0.5px;}
  .plan-sub{font-size:12px;color:#7C6A5E;font-weight:300;margin-top:2px;}
  .plan-actions{display:flex;gap:8px;flex-wrap:wrap;}
  .plan-btn{padding:7px 14px;border-radius:8px;font-size:12px;font-family:'DM Sans',sans-serif;cursor:pointer;border:1.5px solid rgba(28,10,0,0.15);background:white;color:#1C0A00;display:flex;align-items:center;gap:5px;transition:all 0.15s;}
  .plan-btn:hover{background:#1C0A00;color:white;border-color:#1C0A00;}
  .plan-btn.secondary{background:white;}
  .plan-btn.grocery{background:#FF4500;color:white;border-color:#FF4500;}
  .plan-btn.grocery:hover{background:#CC3700;}
  .days-tabs{display:flex;gap:4px;overflow-x:auto;padding-bottom:4px;margin-bottom:16px;scrollbar-width:none;}
  .days-tabs::-webkit-scrollbar{display:none;}
  .day-tab{flex-shrink:0;padding:6px 14px;border-radius:8px;font-size:12px;font-family:'DM Sans',sans-serif;cursor:pointer;border:1.5px solid rgba(28,10,0,0.12);background:white;color:#7C6A5E;transition:all 0.15s;font-weight:400;}
  .day-tab.active{background:#1C0A00;color:white;border-color:#1C0A00;font-weight:500;}
  .day-meals-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:12px;margin-bottom:16px;}
  .meal-slot-card{background:white;border:1px solid rgba(28,10,0,0.08);border-radius:14px;padding:14px;box-shadow:0 2px 8px rgba(28,10,0,0.04);}
  .meal-slot-type{font-size:9px;letter-spacing:2px;text-transform:uppercase;font-weight:500;margin-bottom:6px;}
  .error-wrap{text-align:center;padding:48px 24px;max-width:400px;margin:0 auto;}
  .error-title{font-family:'Fraunces',serif;font-size:22px;font-weight:900;color:#1C0A00;margin-bottom:8px;}
  .error-msg{font-size:13px;color:#7C6A5E;margin-bottom:20px;}
  .profile-redirect{background:rgba(255,69,0,0.06);border:1.5px solid rgba(255,69,0,0.2);border-radius:14px;padding:20px 22px;text-align:center;margin:32px auto;max-width:480px;}
  .grocery-panel-wide{max-width:1100px;margin:0 auto 48px;padding:0 20px;}
  .grocery-card{background:white;border:1px solid rgba(28,10,0,0.08);border-radius:18px;overflow:hidden;box-shadow:0 4px 24px rgba(28,10,0,0.06);}
  .grocery-card-hdr{background:#1C0A00;padding:18px 22px;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:10px;}
  .grocery-card-title{font-family:'Fraunces',serif;font-size:18px;font-weight:900;color:white;letter-spacing:-0.3px;}
  .grocery-card-sub{font-size:12px;color:rgba(255,255,255,0.5);margin-top:2px;}
  .grocery-grid-wide{display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));}
  .grocery-category{padding:14px 18px;border-right:1px solid rgba(28,10,0,0.06);border-bottom:1px solid rgba(28,10,0,0.06);}
  .grocery-category:nth-child(odd){background:rgba(255,250,245,0.6);}
  .grocery-cat-title{font-size:9px;letter-spacing:2px;text-transform:uppercase;font-weight:600;color:#FF4500;margin-bottom:9px;}
  .grocery-item-row{display:flex;align-items:center;gap:7px;padding:4px 0;border-bottom:1px solid rgba(0,0,0,0.04);cursor:pointer;}
  .grocery-item-row:last-child{border-bottom:none;}
  .g-checkbox{width:14px;height:14px;border-radius:3px;border:1.5px solid rgba(28,10,0,0.25);flex-shrink:0;display:flex;align-items:center;justify-content:center;transition:all 0.15s;}
  .g-checkbox.checked{background:#1D9E75;border-color:#1D9E75;}
  .g-checkbox.checked svg{display:block;}
  .g-checkbox svg{display:none;width:8px;height:8px;stroke:white;stroke-width:2.5;}
  .g-item-text{font-size:12px;font-weight:300;flex:1;line-height:1.4;}
  .g-item-text.done{text-decoration:line-through;color:#B0A097;}
  .g-action-btn{padding:7px 14px;border-radius:8px;font-size:12px;font-family:'DM Sans',sans-serif;cursor:pointer;display:flex;align-items:center;gap:5px;border:none;font-weight:500;transition:all 0.15s;}
  .g-action-btn.copy{background:rgba(255,250,245,0.1);color:white;border:1.5px solid rgba(255,250,245,0.2);}
  .g-action-btn.wa{background:#25D366;color:white;}
  @media(max-width:768px){
    .header{padding:12px 16px;}
    .hero{padding:32px 16px 16px;}
    .card{margin:0 12px 20px;padding:16px;}
    .grocery-grid-wide{grid-template-columns:1fr;}
    .day-meals-grid{grid-template-columns:1fr 1fr;}
  }
`;

export default function Planner() {
  const navigate = useNavigate();
  const { profile, pantry } = useAuth();
  const { country } = useLocale();

  // Check profile completeness
  const hasProfile = profile && (profile.preferred_cuisines?.length || profile.food_type?.length || pantry?.length);

  const [servings,      setServings]      = useState(2);
  const [selectedTypes, setSelectedTypes] = useState(['breakfast','lunch','dinner']);
  const [view,          setView]          = useState('input');
  const [plan,          setPlan]          = useState(null);
  const [loadingDay,    setLoadingDay]    = useState(0);
  const [activeDay,     setActiveDay]     = useState(0);
  const [showGrocery,   setShowGrocery]   = useState(false);
  const [errorMsg,      setErrorMsg]      = useState('');
  const timerRef = useRef(null);
  const [loadElapsed,  setLoadElapsed]   = useState(0);

  // Multi-cuisine ratio
  const cuisines = profile?.preferred_cuisines?.length ? profile.preferred_cuisines : ['any'];
  const [cuisineRatio, setCuisineRatio] = useState(() => {
    if (!profile?.preferred_cuisines?.length) return {};
    const even = Math.floor(7 / profile.preferred_cuisines.length);
    const r = {};
    profile.preferred_cuisines.forEach((c, i) => {
      r[c] = i === 0 ? 7 - even * (profile.preferred_cuisines.length - 1) : even;
    });
    return r;
  });

  const updateRatio = (cuisine, val) => setCuisineRatio(p => ({ ...p, [cuisine]: val }));
  const ratioTotal = Object.values(cuisineRatio).reduce((s,v)=>s+v,0);

  const toggleType = (id) => setSelectedTypes(prev =>
    prev.includes(id) ? prev.filter(t => t !== id) : [...prev, id]
  );

  const handleSubmit = async () => {
    if (selectedTypes.length === 0) return;
    setView('loading'); setErrorMsg(''); setPlan(null);
    try {
      const res = await fetch('/api/planner', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ingredients: pantry || [],
          mealTypes: selectedTypes,
          servings,
          cuisine: cuisines.join(', '),
          cuisineRatio,
          diet: Array.isArray(profile?.food_type) ? profile.food_type[0] : (profile?.food_type || 'none'),
          preferences: {
            spice_level: profile?.spice_level,
            allergies: profile?.allergies,
            skill_level: profile?.skill_level,
            preferred_cuisines: cuisines,
            diet_requirements: profile?.diet_requirements,
          },
        }),
      });
      const data = await res.json();
      if (res.ok && data.plan) { setPlan(data.plan); setView('results'); }
      else { setErrorMsg(data.error || 'Could not generate plan. Please try again.'); setView('error'); }
    } catch { setErrorMsg('Connection error. Please try again.'); setView('error'); }
  };

  useEffect(() => {
    if (view==='loading') {
      let d=0; timerRef.current=setInterval(()=>{d++;setLoadingDay(d);if(d>=7)clearInterval(timerRef.current);},1100);
      const startTs = Date.now();
      const elapsedT = setInterval(() => setLoadElapsed(Math.floor((Date.now()-startTs)/1000)), 1000);
      return () => { clearInterval(timerRef.current); clearInterval(elapsedT); setLoadElapsed(0); };
    }
    return ()=>clearInterval(timerRef.current);
  }, [view]);

  const mealCount = selectedTypes.length * 7;

  return (
    <>
      <style>{styles}</style>
      <div className="page">
        <header className="header">
          <div className="logo" onClick={()=>navigate('/')}>
            <span style={{fontSize:22}}>⚡</span>
            <span className="logo-name"><span style={{color:'#FF4500'}}>J</span>iff</span>
          </div>
          <div className="nav-links">
            <button className="nav-link" onClick={()=>navigate('/plans')}>🎯 Goal Planner</button>
            <button className="nav-link active">📅 Week plan</button>
            <button className="nav-link" onClick={()=>navigate('/app')}>← Back to app</button>
          </div>
        </header>

        {/* No profile — redirect prompt */}
        {!hasProfile && (
          <div className="profile-redirect">
            <div style={{fontSize:32,marginBottom:12}}>👤</div>
            <div style={{fontFamily:"'Fraunces',serif",fontSize:18,fontWeight:900,color:'#1C0A00',marginBottom:6}}>Set up your profile first</div>
            <div style={{fontSize:13,color:'#7C6A5E',fontWeight:300,marginBottom:16,lineHeight:1.6}}>
              Week Plan uses your cuisine preferences and dietary settings to build your 7-day menu. Complete your profile to get started.
            </div>
            <button onClick={()=>navigate('/profile')} style={{background:'#FF4500',color:'white',border:'none',borderRadius:10,padding:'11px 24px',fontSize:13,fontWeight:500,cursor:'pointer',fontFamily:"'DM Sans',sans-serif"}}>
              Set up preferences →
            </button>
          </div>
        )}

        {hasProfile && view==='input' && (
          <>
            <div className="hero">
              <div className="hero-eyebrow">Plan once, eat well all week</div>
              <h1 className="hero-title">7 days.<br /><em>Your meals sorted.</em></h1>
              <p className="hero-sub">Jiff builds your entire week's menu from your preferences — cuisines, dietary needs, spice level and skill. No fridge input needed.</p>
            </div>
            <div className="card">
              {/* Meal type */}
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
                <p className="cta-note" style={{textAlign:'left',marginTop:8}}>{selectedTypes.length} meal type{selectedTypes.length!==1?'s':''} · {mealCount} meals total</p>
              </div>

              {/* Servings */}
              <div className="section">
                <div className="section-label">Servings per meal</div>
                <div className="serving-controls">
                  <button className="serving-btn" disabled={servings<=1} onClick={()=>setServings(s=>Math.max(1,s-1))}>−</button>
                  <div className="serving-count">{servings}</div>
                  <button className="serving-btn" disabled={servings>=12} onClick={()=>setServings(s=>Math.min(12,s+1))}>+</button>
                  <span style={{fontSize:12,color:'#7C6A5E',fontWeight:300,marginLeft:8}}>serving{servings!==1?'s':''} — all recipes sized for {servings} {servings===1?'person':'people'}</span>
                </div>
              </div>

              {/* Cuisine ratio — only if multiple cuisines */}
              {cuisines.length > 1 && cuisines[0] !== 'any' && (
                <div className="section">
                  <div className="section-label">Days per cuisine</div>
                  <CuisineRatioSelector cuisines={cuisines} ratio={cuisineRatio} onChange={updateRatio} />
                </div>
              )}
              {cuisines.length === 1 && cuisines[0] !== 'any' && (
                <div style={{fontSize:12,color:'#7C6A5E',fontWeight:300,marginBottom:12,padding:'8px 12px',background:'rgba(255,69,0,0.04)',borderRadius:8}}>
                  All 7 days: <strong>{cuisines[0]}</strong> cuisine · based on your preference
                </div>
              )}

              <div className="cta-wrap">
                <button className="cta-btn" onClick={handleSubmit} disabled={selectedTypes.length===0 || (cuisines.length>1 && ratioTotal!==7)}>
                  <span>📅</span>
                  <span>Plan my week</span>
                </button>
                {cuisines.length > 1 && ratioTotal !== 7 && (
                  <p className="cta-note">Assign all 7 days across your cuisines to continue</p>
                )}
              </div>
            </div>
          </>
        )}

        {view==='loading' && (
          <div className="loading-wrap">
            <div className="loading-title">Building your week…</div>
            <div className="loading-sub">Planning {mealCount} meals across 7 days — usually takes 20–30 seconds. ({loadElapsed}s)</div>
            <div className="loading-days">
              {DAYS_SHORT.map((d,i)=>(
                <div key={d} className={`loading-day ${i<loadingDay?'done':''}`}>{i<loadingDay?'✓':d}</div>
              ))}
            </div>
          </div>
        )}

        {view==='error' && (
          <div className="error-wrap">
            <div style={{fontSize:40,marginBottom:12}}>⚠️</div>
            <div className="error-title">Couldn't build your plan</div>
            <div className="error-msg">{errorMsg}</div>
            <button className="cta-btn" onClick={()=>setView('input')}>← Try again</button>
          </div>
        )}

        {view==='results' && plan && (
          <>
            <div className="results-wrap">
              <div className="plan-header">
                <div>
                  <div className="plan-title">Your 7-day menu ⚡</div>
                  <div className="plan-sub">{mealCount} meals · {servings} serving{servings!==1?'s':''} each · tap any meal to expand</div>
                </div>
                <div className="plan-actions">
                  <button className="plan-btn secondary" onClick={handleSubmit}><IconRefresh/>Regenerate</button>
                  <button className={`plan-btn grocery ${showGrocery?'active':''}`} onClick={()=>setShowGrocery(p=>!p)}>
                    🛒 {showGrocery?'Hide':'Grocery list'}
                  </button>
                  <button className="plan-btn" onClick={()=>setView('input')}>← Edit</button>
                </div>
              </div>

              <div className="days-tabs">
                {DAYS.map((d,i)=>(
                  <button key={d} className={`day-tab ${activeDay===i?'active':''}`} onClick={()=>setActiveDay(i)}>{DAYS_SHORT[i]}</button>
                ))}
              </div>

              <div className="day-meals-grid">
                {selectedTypes.map(type=>{
                  const mt = MEAL_TYPE_OPTIONS.find(m=>m.id===type);
                  return (
                    <div key={type} className="meal-slot-card">
                      <div className="meal-slot-type" style={{color:mt?.color||'#FF4500'}}>{mt?.emoji} {mt?.label}</div>
                      <MealSlot meal={plan[DAYS[activeDay]]?.meals?.[type]} type={type} servings={servings}/>
                    </div>
                  );
                })}
              </div>
            </div>

            {showGrocery && <GrocerySection plan={plan} mealTypes={selectedTypes}/>}
          </>
        )}
      </div>
    </>
  );
}
