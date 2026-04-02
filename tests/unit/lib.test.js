// tests/unit/lib.test.js
// Unit tests for Jiff utility libraries.
// Run with: npx jest tests/unit/lib.test.js
// No browser, no React — pure function testing.

const { parseQty, toNiceNumber, scaleIngredient, scaleNutrition } = require('../../src/lib/scaling.js');
const { parseStepTime, formatTime } = require('../../src/lib/timers.js');
const { extractCoreName, isAvailable, buildGroceryList } = require('../../src/lib/grocery.js');
const { buildShareText } = require('../../src/lib/sharing.js');
const { mealKey, getDietaryLabel } = require('../../src/lib/mealKey.js');

// ── scaling.js ────────────────────────────────────────────────────

describe('parseQty', () => {
  test('parses whole number', () => {
    expect(parseQty('2 cups rice').value).toBe(2);
    expect(parseQty('2 cups rice').rest).toBe('cups rice');
  });
  test('parses fraction character', () => {
    expect(parseQty('½ tsp salt').value).toBeCloseTo(0.5);
  });
  test('parses mixed number', () => {
    expect(parseQty('1½ tbsp oil').value).toBeCloseTo(1.5);
  });
  test('parses fraction with slash', () => {
    expect(parseQty('3/4 cup flour').value).toBeCloseTo(0.75);
  });
  test('returns null for no quantity', () => {
    expect(parseQty('salt to taste').value).toBeNull();
    expect(parseQty('salt to taste').rest).toBe('salt to taste');
  });
  test('handles asterisk prefix', () => {
    expect(parseQty('* 2 tbsp olive oil').prefix).toBe('* ');
    expect(parseQty('* 2 tbsp olive oil').value).toBe(2);
  });
});

describe('toNiceNumber', () => {
  test('returns whole numbers as strings', () => {
    expect(toNiceNumber(3)).toBe('3');
    expect(toNiceNumber(0)).toBe('0');
  });
  test('converts common fractions', () => {
    expect(toNiceNumber(0.5)).toBe('½');
    expect(toNiceNumber(0.25)).toBe('¼');
    expect(toNiceNumber(0.75)).toBe('¾');
    expect(toNiceNumber(1/3)).toBe('⅓');
  });
  test('combines whole + fraction', () => {
    expect(toNiceNumber(1.5)).toBe('1½');
    expect(toNiceNumber(2.25)).toBe('2¼');
  });
  test('handles non-standard fractions', () => {
    expect(toNiceNumber(1.7)).toBe('1.7');
    expect(toNiceNumber(2.33)).toBe('2⅓');
  });
});

describe('scaleIngredient', () => {
  test('scales whole number', () => {
    expect(scaleIngredient('2 cups rice', 2)).toBe('4 cups rice');
  });
  test('ratio 1 returns unchanged', () => {
    expect(scaleIngredient('2 cups rice', 1)).toBe('2 cups rice');
  });
  test('scales to fraction', () => {
    expect(scaleIngredient('4 tbsp oil', 0.5)).toBe('2 tbsp oil');
  });
  test('produces nice fractions', () => {
    expect(scaleIngredient('2 cups milk', 0.75)).toBe('1½ cups milk');
  });
  test('no quantity passes through unchanged', () => {
    expect(scaleIngredient('salt to taste', 2)).toBe('salt to taste');
  });
});

describe('scaleNutrition', () => {
  test('ratio 1 unchanged', () => {
    expect(scaleNutrition('320 kcal', 1)).toBe('320 kcal');
  });
  test('scales number, preserves unit', () => {
    expect(scaleNutrition('320 kcal', 2)).toBe('640 kcal');
    expect(scaleNutrition('18g', 1.5)).toBe('27g');
  });
  test('handles non-numeric gracefully', () => {
    expect(scaleNutrition('N/A', 2)).toBe('N/A');
  });
});

// ── timers.js ─────────────────────────────────────────────────────

describe('parseStepTime', () => {
  test('parses plain minutes', () => {
    expect(parseStepTime('simmer for 10 minutes')).toBe(600);
    expect(parseStepTime('cook for 5 min')).toBe(300);
  });
  test('parses hours', () => {
    expect(parseStepTime('bake for 1 hour')).toBe(3600);
    expect(parseStepTime('marinate for 2 hours')).toBe(7200);
  });
  test('parses range as midpoint', () => {
    expect(parseStepTime('cook for 5-10 minutes')).toBe(450); // midpoint of 5+10=15 → /2=7.5min → 450s
  });
  test('parses half an hour', () => {
    expect(parseStepTime('simmer for half an hour')).toBe(1800);
  });
  test('returns null for no time', () => {
    expect(parseStepTime('stir well until combined')).toBeNull();
  });
  test('returns null for very short times', () => {
    expect(parseStepTime('wait 5 seconds')).toBeNull();
  });
});

describe('formatTime', () => {
  test('formats minutes and seconds', () => {
    expect(formatTime(90)).toBe('01:30');
    expect(formatTime(600)).toBe('10:00');
  });
  test('formats hours', () => {
    expect(formatTime(3661)).toBe('1:01:01');
    expect(formatTime(7200)).toBe('2:00:00');
  });
  test('zero', () => {
    expect(formatTime(0)).toBe('00:00');
  });
});

// ── grocery.js ────────────────────────────────────────────────────

describe('extractCoreName', () => {
  test('removes quantity', () => {
    expect(extractCoreName('2 cups rice')).toBe('rice');
  });
  test('removes unit words', () => {
    expect(extractCoreName('1 tbsp olive oil')).toBe('olive oil');
  });
  test('removes prep instructions', () => {
    expect(extractCoreName('3 cloves garlic, minced')).toBe('garlic');
  });
  test('removes asterisk', () => {
    expect(extractCoreName('* 200g paneer')).toBe('paneer');
  });
  test('handles fraction chars', () => {
    expect(extractCoreName('½ tsp turmeric')).toBe('turmeric');
  });
});

describe('isAvailable', () => {
  const fridge = ['rice', 'onion', 'tomato', 'green chilli'];
  test('exact match', () => {
    expect(isAvailable('rice', fridge)).toBe(true);
  });
  test('partial match - ingredient in fridge item', () => {
    expect(isAvailable('green chilli', fridge)).toBe(true);
  });
  test('not available', () => {
    expect(isAvailable('paneer', fridge)).toBe(false);
  });
  test('substring match', () => {
    expect(isAvailable('chilli', fridge)).toBe(true);
  });
});

describe('buildGroceryList', () => {
  const fridge = ['rice', 'onion', 'tomato'];
  const ingredients = ['2 cups rice', '1 onion, chopped', '200g paneer', '1 tsp cumin'];

  test('splits into have and need', () => {
    const { have, need } = buildGroceryList(ingredients, fridge);
    expect(have).toContain('2 cups rice');
    expect(have).toContain('1 onion, chopped');
    expect(need).toContain('200g paneer');
    expect(need).toContain('1 tsp cumin');
  });
  test('empty fridge — everything in need', () => {
    const { have, need } = buildGroceryList(ingredients, []);
    expect(have).toHaveLength(0);
    expect(need).toHaveLength(4);
  });
  test('removes asterisk from need items', () => {
    const { need } = buildGroceryList(['* 200g paneer'], []);
    expect(need[0]).toBe('200g paneer');
  });
});

// ── sharing.js ────────────────────────────────────────────────────

describe('buildShareText', () => {
  const meal = {
    name: 'Lemon Rice', emoji: '🍚',
    description: 'A tangy South Indian classic',
    ingredients: ['2 cups rice', '1 lemon', '1 tsp mustard', '1 tsp turmeric', '10 curry leaves', '2 tbsp oil', 'salt'],
    steps: ['Cook rice.', 'Temper spices.', 'Mix with lemon.', 'Garnish and serve.'],
    calories: '320 kcal', protein: '6g',
  };

  test('includes meal name', () => {
    expect(buildShareText(meal)).toContain('Lemon Rice');
  });
  test('includes at most 6 ingredients', () => {
    const text = buildShareText(meal);
    expect(text).toContain('2 cups rice');
    expect(text).not.toContain('salt'); // 7th ingredient should be excluded
  });
  test('includes at most 3 steps', () => {
    const text = buildShareText(meal);
    expect(text).toContain('3. Mix with lemon.');
    expect(text).not.toContain('Garnish');
  });
  test('includes Jiff attribution', () => {
    expect(buildShareText(meal)).toContain('Jiff');
  });
});

// ── mealKey.js ────────────────────────────────────────────────────

describe('mealKey', () => {
  test('generates consistent key', () => {
    expect(mealKey({ name: 'Lemon Rice', emoji: '🍚' })).toBe('lemon-rice-🍚');
  });
  test('collapses whitespace', () => {
    expect(mealKey({ name: 'Dal  Makhani', emoji: '🫘' })).toBe('dal--makhani-🫘');
  });
});

describe('getDietaryLabel', () => {
  test('handles plain string', () => {
    expect(getDietaryLabel('veg')).toBe('Vegetarian');
  });
  test('handles JS array', () => {
    expect(getDietaryLabel(['veg'])).toBe('Vegetarian');
  });
  test('handles JSON string', () => {
    expect(getDietaryLabel('["veg"]')).toBe('Vegetarian');
  });
  test('handles Postgres wire format', () => {
    expect(getDietaryLabel('{veg}')).toBe('Vegetarian');
    expect(getDietaryLabel('{"non-veg","veg"}')).toBe('Non-vegetarian, Vegetarian');
  });
  test('handles null/undefined', () => {
    expect(getDietaryLabel(null)).toBe('Not set');
    expect(getDietaryLabel(undefined)).toBe('Not set');
    expect(getDietaryLabel('')).toBe('Not set');
  });
  test('handles multiple values', () => {
    expect(getDietaryLabel(['veg', 'jain'])).toBe('Vegetarian, Jain');
  });
});
