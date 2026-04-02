// src/lib/mealKey.js — Meal identity helpers and dietary label formatting
// Pure functions — no React dependencies.

/**
 * Generate a stable key for a meal object (used for ratings, localStorage, etc.)
 */
export function mealKey(m) {
  return `${m.name}-${m.emoji}`.toLowerCase().replace(/\s+/g, '-');
}

// ── Dietary label helpers ──────────────────────────────────────────

const DIETARY_LABELS = {
  'non-veg':     'Non-vegetarian',
  'veg':         'Vegetarian',
  'eggetarian':  'Eggetarian',
  'vegan':       'Vegan',
  'jain':        'Jain',
  'halal':       'Halal',
  'kosher':      'Kosher',
  'pescatarian': 'Pescatarian',
};

/**
 * Convert a food_type value (any Supabase format) to a human-readable label.
 * Handles: JS array, JSON string, Postgres wire format {veg}, plain string.
 */
export function getDietaryLabel(food_type) {
  const toLabel = id => {
    if (!id) return '';
    const clean = String(id).toLowerCase().trim().replace(/^"+|"+$/g, '');
    return DIETARY_LABELS[clean] || clean;
  };

  const unwrap = (val) => {
    if (!val) return [];
    if (Array.isArray(val)) return val.flatMap(unwrap);
    if (typeof val !== 'string') return [String(val)];
    const s = val.trim();
    if (s.startsWith('{') && s.endsWith('}')) {
      return s.slice(1, -1).split(',')
        .map(x => x.replace(/^"+|"+$/g, '').trim())
        .filter(Boolean);
    }
    if (s.startsWith('[') || s.startsWith('"')) {
      try { return unwrap(JSON.parse(s)); } catch {}
    }
    return [s];
  };

  try {
    const ids = [...new Set(unwrap(food_type).filter(Boolean))];
    if (!ids.length) return 'Not set';
    return ids.map(toLabel).filter(Boolean).join(', ') || 'Not set';
  } catch { return 'Not set'; }
}
