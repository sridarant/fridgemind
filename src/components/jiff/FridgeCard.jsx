// src/components/jiff/FridgeCard.jsx
// Fridge / leftover input card: ingredient tags, quick-add, filters, cuisine, CTA

import IngredientInput   from '../IngredientInput';
import FridgePhotoUpload from '../FridgePhotoUpload';
import FamilySelector    from '../FamilySelector';
import { QUICK_ADD_STAPLES, ALL_CUISINES } from '../../lib/cuisine.js';
import { getUpcomingFestival } from '../../lib/festival.js';

export default function FridgeCard({
  inputMode, fridgeItems, setFridgeItems, pantry,
  diet, setDiet, time, setTime, cuisine, setCuisine,
  defaultServings, setDefaultServings,
  profile, lang, user,
  isPremium, trialActive, PAID_RECIPE_CAP,
  familySelected, setFamilySelected,
  ingredients, handleSubmit, setGateDismissed,
  navigate, t,
}) {
  const festival = getUpcomingFestival();

  const quickAddItems = inputMode === 'leftover'
    ? ['Leftover rice', 'Leftover dal', 'Rotis', 'Cooked chicken', 'Boiled potato', 'Leftover curry', 'Cooked pasta', 'Bread']
    : (pantry?.length > 0
        ? pantry.filter(p => !fridgeItems.includes(p)).slice(0, 10)
        : QUICK_ADD_STAPLES.filter(s => !fridgeItems.includes(s)));

  const addItem = item => setFridgeItems(prev => [...new Set([...prev, item])]);

  return (
    <div style={{ background: 'white', borderRadius: 20, border: '1px solid rgba(28,10,0,0.08)', overflow: 'hidden', boxShadow: '0 4px 20px rgba(28,10,0,0.06)' }}>

      {/* Mode header bar */}
      <div style={{
        background: inputMode === 'leftover'
          ? 'linear-gradient(135deg,rgba(217,119,6,0.08),rgba(251,191,36,0.06))'
          : 'linear-gradient(135deg,rgba(29,158,117,0.07),rgba(255,69,0,0.04))',
        borderBottom: '1px solid rgba(28,10,0,0.06)',
        padding: '14px 18px 12px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div>
          <div style={{ fontFamily: "'Fraunces',serif", fontSize: 17, fontWeight: 900, color: 'var(--ink)', letterSpacing: '-0.3px' }}>
            {inputMode === 'leftover' ? '♻️ Leftover rescue' : "🧊 What's in your fridge?"}
          </div>
          <div style={{ fontSize: 11, color: 'var(--muted)', fontWeight: 300, marginTop: 2 }}>
            {inputMode === 'leftover'
              ? "Tell Jiff what's left — it will turn it into something great"
              : 'Add ingredients · Jiff finds what you can make'}
          </div>
        </div>
        {/* Camera — mobile only, handled inside FridgePhotoUpload */}
        <FridgePhotoUpload
          onIngredients={detected => setFridgeItems(prev => [...new Set([...prev, ...detected])])}
          existingIngredients={fridgeItems}
        />
      </div>

      {/* Ingredient input */}
      <div style={{ padding: '14px 16px 0' }}>
        <IngredientInput
          ingredients={fridgeItems}
          onChange={setFridgeItems}
          pantryIngredients={[]}
          placeholder={inputMode === 'leftover' ? 'leftover rice, dal, rotis…' : 'spinach, chicken, eggs, tomatoes…'}
          lang={lang}
        />
      </div>

      {/* Quick-add chips */}
      <div style={{ padding: '10px 16px 0' }}>
        <div style={{ fontSize: 9, letterSpacing: '1.5px', textTransform: 'uppercase', color: 'var(--muted)', fontWeight: 600, marginBottom: 7 }}>
          {inputMode === 'leftover' ? 'Common leftovers' : 'Quick add'}
        </div>
        <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 6, scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
          {quickAddItems.filter(item => !fridgeItems.includes(item)).map(item => (
            <button
              key={item}
              onClick={() => addItem(item)}
              style={{ padding: '6px 12px', borderRadius: 20, whiteSpace: 'nowrap', border: '1.5px solid rgba(28,10,0,0.10)', background: 'rgba(255,250,245,0.9)', fontSize: 11, color: 'var(--muted)', cursor: 'pointer', fontFamily: "'DM Sans',sans-serif", flexShrink: 0, transition: 'border-color 0.1s,color 0.1s' }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--jiff)'; e.currentTarget.style.color = 'var(--jiff)'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(28,10,0,0.10)'; e.currentTarget.style.color = 'var(--muted)'; }}
            >
              {'+ '}{item}
            </button>
          ))}
        </div>
      </div>

      {/* Pantry strip */}
      {pantry?.length > 0 && (
        <div style={{ margin: '10px 16px 0', padding: '8px 12px', background: 'rgba(29,158,117,0.04)', border: '1px solid rgba(29,158,117,0.15)', borderRadius: 10, display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 13 }}>{'🌿'}</span>
          <div style={{ fontSize: 11, color: '#1D9E75', fontWeight: 300, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            <span style={{ fontWeight: 500 }}>{'Pantry assumed: '}</span>
            {pantry.slice(0, 5).join(', ')}{pantry.length > 5 ? ' +' + (pantry.length - 5) + ' more' : ''}
          </div>
          <button
            onClick={() => navigate('/profile', { state: { tab: 'pantry' } })}
            style={{ fontSize: 10, color: '#1D9E75', background: 'none', border: '1px solid rgba(29,158,117,0.3)', borderRadius: 6, padding: '3px 8px', cursor: 'pointer', fontFamily: "'DM Sans',sans-serif", flexShrink: 0 }}
          >
            {'Edit'}
          </button>
        </div>
      )}

      {/* Filters: Diet / Serves / Time */}
      <div style={{ padding: '12px 16px', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
        <div>
          <div style={{ fontSize: 8, letterSpacing: '1.5px', textTransform: 'uppercase', color: 'var(--jiff)', fontWeight: 700, marginBottom: 5 }}>{'Diet'}</div>
          <select
            value={diet || 'none'}
            onChange={e => setDiet(e.target.value)}
            style={{ width: '100%', padding: '7px 6px', border: '1px solid rgba(28,10,0,0.10)', borderRadius: 8, fontSize: 11, fontFamily: "'DM Sans',sans-serif", background: 'white', outline: 'none', cursor: 'pointer', color: 'var(--ink)' }}
          >
            <option value="none">Any</option>
            <option value="vegetarian">Veg only</option>
            <option value="vegan">Vegan</option>
            <option value="jain">Jain</option>
            <option value="non-vegetarian">Non-veg</option>
          </select>
        </div>
        <div>
          <div style={{ fontSize: 8, letterSpacing: '1.5px', textTransform: 'uppercase', color: 'var(--jiff)', fontWeight: 700, marginBottom: 5 }}>{'Serves'}</div>
          <div style={{ display: 'flex', alignItems: 'center', border: '1px solid rgba(28,10,0,0.10)', borderRadius: 8, background: 'white', overflow: 'hidden' }}>
            <button
              onClick={() => setDefaultServings(s => Math.max(1, s - 1))}
              disabled={defaultServings <= 1}
              style={{ flex: 1, padding: '7px 0', border: 'none', background: 'none', fontSize: 16, cursor: 'pointer', color: 'var(--muted)', lineHeight: 1 }}
            >{'−'}</button>
            <span style={{ flex: 1, textAlign: 'center', fontSize: 13, fontWeight: 700, color: 'var(--ink)', lineHeight: 1 }}>{defaultServings}</span>
            <button
              onClick={() => setDefaultServings(s => Math.min(12, s + 1))}
              disabled={defaultServings >= 12}
              style={{ flex: 1, padding: '7px 0', border: 'none', background: 'none', fontSize: 16, cursor: 'pointer', color: 'var(--muted)', lineHeight: 1 }}
            >{'+'}</button>
          </div>
        </div>
        <div>
          <div style={{ fontSize: 8, letterSpacing: '1.5px', textTransform: 'uppercase', color: 'var(--jiff)', fontWeight: 700, marginBottom: 5 }}>{'Time'}</div>
          <select
            value={time}
            onChange={e => setTime(e.target.value)}
            style={{ width: '100%', padding: '7px 6px', border: '1px solid rgba(28,10,0,0.10)', borderRadius: 8, fontSize: 11, fontFamily: "'DM Sans',sans-serif", background: 'white', outline: 'none', cursor: 'pointer', color: 'var(--ink)' }}
          >
            <option value="20 min">20 min</option>
            <option value="30 min">30 min</option>
            <option value="45 min">45 min</option>
            <option value="60 min">1 hour</option>
            <option value="any">Any</option>
          </select>
        </div>
      </div>

      {/* Cuisine chips from saved profile */}
      {profile?.preferred_cuisines?.length > 0 && (
        <div style={{ padding: '0 16px 14px' }}>
          <div style={{ fontSize: 8, letterSpacing: '1.5px', textTransform: 'uppercase', color: 'var(--jiff)', fontWeight: 700, marginBottom: 7 }}>
            {'Cuisine'}
          </div>
          <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 2, scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
            {profile.preferred_cuisines.map(id => {
              const label = ALL_CUISINES?.find(c => c.id === id)?.label || id;
              const isActive = cuisine === id || (profile.preferred_cuisines.indexOf(id) === 0 && cuisine === 'any');
              return (
                <button
                  key={id}
                  onClick={() => setCuisine(isActive ? 'any' : id)}
                  style={{ padding: '5px 12px', borderRadius: 20, whiteSpace: 'nowrap', flexShrink: 0, border: '1.5px solid ' + (isActive ? 'var(--jiff)' : 'rgba(28,10,0,0.10)'), background: isActive ? 'rgba(255,69,0,0.07)' : 'white', color: isActive ? 'var(--jiff)' : 'var(--muted)', fontSize: 11, cursor: 'pointer', fontFamily: "'DM Sans',sans-serif", fontWeight: isActive ? 600 : 400, transition: 'all 0.12s' }}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* CTA wrap */}
      <div className="cta-wrap">
        {festival && (
          <div
            style={{ background: 'rgba(255,69,0,0.06)', border: '1px solid rgba(255,69,0,0.18)', borderRadius: 12, padding: '10px 14px', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}
            onClick={handleSubmit}
          >
            <span style={{ fontSize: 22 }}>{festival.emoji}</span>
            <div>
              <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--jiff)' }}>{festival.name}{' special recipes'}</div>
              <div style={{ fontSize: 11, color: 'var(--muted)', fontWeight: 300 }}>{festival.note}</div>
            </div>
            <span style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--jiff)', fontWeight: 500 }}>{'Generate →'}</span>
          </div>
        )}

        <button
          className="cta-btn"
          onClick={!user ? () => setGateDismissed(false) : handleSubmit}
          disabled={!ingredients.length || !user}
        >
          <span>{'⚡'}</span>
          <span>{'Jiff it now!'}</span>
        </button>
        {!ingredients.length && <p className="cta-note">{t('cta_note')}</p>}

        {user && Array.isArray(profile?.family_members) && profile.family_members.length > 0 && (
          <FamilySelector
            members={profile.family_members}
            selected={familySelected}
            onToggle={idx => {
              if (idx === 'all') { setFamilySelected([]); return; }
              setFamilySelected(prev => prev.includes(idx) ? prev.filter(i => i !== idx) : [...prev, idx]);
            }}
          />
        )}

        {trialActive && !isPremium && (
          <p className="trial-note">
            {'🎁 Trial mode — you will see 1 recipe preview. '}
            <button
              onClick={() => navigate('/pricing')}
              style={{ background: 'none', border: 'none', color: '#854F0B', cursor: 'pointer', fontWeight: 600, fontFamily: "'DM Sans',sans-serif", fontSize: 'inherit', textDecoration: 'underline' }}
            >
              {'Upgrade for '}{PAID_RECIPE_CAP}{' recipes →'}
            </button>
          </p>
        )}
      </div>
    </div>
  );
}
