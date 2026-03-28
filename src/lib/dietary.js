// src/lib/dietary.js — shared food_type parsing utility
// Handles all Supabase storage formats: JS array, JSON string, double-encoded, Postgres wire

export const DIETARY_LABELS = {
  'non-veg':'Non-vegetarian', 'veg':'Vegetarian', 'eggetarian':'Eggetarian',
  'vegan':'Vegan', 'jain':'Jain', 'halal':'Halal', 'kosher':'Kosher',
  'pescatarian':'Pescatarian',
};

// Recursively unwrap until we have a flat array of clean ID strings
export function parseFoodTypeIds(food_type) {
  const unwrap = (val) => {
    if (!val) return [];
    if (Array.isArray(val)) return val.flatMap(unwrap);
    if (typeof val !== 'string') return [String(val)];
    const s = val.trim();
    if (s.startsWith('{') && s.endsWith('}'))
      return s.slice(1,-1).split(',').map(x => x.replace(/^"+|"+$/g,'').trim()).filter(Boolean);
    if (s.startsWith('[') || s.startsWith('"'))
      try { return unwrap(JSON.parse(s)); } catch {}
    return [s.replace(/^"+|"+$/g,'').trim()];
  };
  const ids = [...new Set(unwrap(food_type).filter(Boolean))];
  return ids;
}

export function getDietaryLabel(food_type) {
  try {
    const ids = parseFoodTypeIds(food_type);
    if (!ids.length) return 'Not set';
    const toLabel = id => {
      const clean = String(id).toLowerCase().trim().replace(/^"+|"+$/g,'');
      return DIETARY_LABELS[clean] || clean;
    };
    return ids.map(toLabel).filter(Boolean).join(', ') || 'Not set';
  } catch { return 'Not set'; }
}
