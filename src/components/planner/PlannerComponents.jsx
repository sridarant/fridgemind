// src/components/planner/PlannerComponents.jsx
// Extracted from Planner.jsx — MealSlot, GrocerySection, CuisineRatioSelector
// Plus shared helpers: collectAllIngredients, categoriseIngredients

import { useState } from 'react';
import { VideoButton } from '../meal/VideoButton.jsx';

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
            <div className="grocery-card-sub">{items.length} items · tap to tick off{checkedCount>0?' · ' + checkedCount + ' done':''}</div>
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
          <div style={{display:'flex',gap:6,marginTop:8,flexWrap:'wrap'}}>
            <div onClick={e=>e.stopPropagation()}>
              <VideoButton recipeName={meal.name||''} compact={true}/>
            </div>
            <a href={'https://www.swiggy.com/search?query=' + (encodeURIComponent(meal.name||''))}
              target="_blank" rel="noopener noreferrer" onClick={e=>e.stopPropagation()}
              style={{padding:'4px 10px',borderRadius:6,border:'1px solid rgba(252,128,25,0.2)',background:'rgba(252,128,25,0.05)',color:'#FC8019',fontSize:10,fontWeight:500,textDecoration:'none'}}>
              🛵 Order
            </a>
          </div>
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


export { MealSlot, GrocerySection, CuisineRatioSelector };
