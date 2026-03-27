
// Common pantry staples for auto-suggestion in Pantry & Spices section
export const PANTRY_STAPLES = [
  'salt', 'pepper', 'sugar', 'jaggery', 'oil', 'olive oil', 'coconut oil',
  'ghee', 'butter', 'all-purpose flour', 'rice flour', 'cornflour',
  'baking soda', 'baking powder', 'vinegar', 'honey', 'turmeric powder',
  'cumin seeds', 'coriander powder', 'red chilli powder', 'garam masala',
  'cardamom', 'cloves', 'cinnamon', 'bay leaves', 'mustard seeds',
  'fenugreek seeds', 'asafoetida', 'black pepper', 'garlic powder',
  'paprika', 'oregano', 'mixed herbs', 'soy sauce', 'tomato ketchup',
  'tamarind paste', 'coconut milk', 'sesame oil', 'chilli flakes',
  'rice vinegar', 'sriracha', 'hot sauce',
];

// src/lib/ingredients-db.js — Common ingredient database for autocomplete
// Covers Indian pantry staples, global ingredients, proteins, veg, dairy, grains

export const INGREDIENTS_DB = [
  // ── Vegetables ────────────────────────────────────────────────
  'onion', 'red onion', 'spring onion', 'shallot',
  'tomato', 'cherry tomato', 'sun-dried tomato',
  'potato', 'sweet potato', 'baby potato',
  'garlic', 'ginger', 'ginger garlic paste',
  'capsicum', 'bell pepper', 'green chilli', 'red chilli', 'dry red chilli',
  'carrot', 'peas', 'green beans', 'french beans', 'cluster beans',
  'spinach', 'palak', 'methi', 'fenugreek leaves', 'coriander leaves',
  'mint leaves', 'curry leaves', 'bay leaf',
  'cabbage', 'cauliflower', 'broccoli', 'brussels sprouts',
  'mushroom', 'button mushroom', 'shiitake mushroom',
  'zucchini', 'courgette', 'eggplant', 'brinjal', 'aubergine',
  'cucumber', 'lettuce', 'kale', 'celery',
  'corn', 'sweet corn', 'baby corn', 'beetroot',
  'radish', 'turnip', 'pumpkin', 'bottle gourd', 'lauki',
  'drumstick', 'moringa', 'raw banana', 'raw papaya',
  'avocado', 'leek', 'asparagus', 'artichoke',
  'bitter gourd', 'karela', 'ridge gourd', 'turai', 'snake gourd',

  // ── Proteins ──────────────────────────────────────────────────
  'egg', 'eggs', 'boiled egg',
  'chicken', 'chicken breast', 'chicken thigh', 'chicken leg', 'minced chicken',
  'mutton', 'lamb', 'goat meat', 'minced meat', 'keema',
  'beef', 'pork', 'bacon',
  'fish', 'salmon', 'tuna', 'tilapia', 'sardine', 'mackerel', 'pomfret',
  'prawn', 'shrimp', 'crab', 'squid',
  'paneer', 'tofu', 'tempeh',
  'lentils', 'dal', 'moong dal', 'toor dal', 'chana dal', 'masoor dal', 'urad dal',
  'chickpeas', 'chana', 'rajma', 'kidney beans', 'black beans', 'white beans',
  'soya chunks', 'soy protein',

  // ── Grains & Staples ──────────────────────────────────────────
  'rice', 'basmati rice', 'brown rice', 'jasmine rice', 'arborio rice',
  'wheat flour', 'maida', 'atta', 'semolina', 'sooji', 'rava',
  'bread', 'whole wheat bread', 'sourdough', 'pita bread',
  'roti', 'chapati', 'paratha', 'naan', 'tortilla',
  'pasta', 'spaghetti', 'penne', 'macaroni', 'fettuccine',
  'noodles', 'rice noodles', 'udon', 'soba',
  'oats', 'rolled oats', 'quinoa', 'barley', 'millet', 'corn flour', 'besan',
  'poha', 'flattened rice', 'vermicelli', 'bread crumbs',

  // ── Dairy ─────────────────────────────────────────────────────
  'milk', 'curd', 'yogurt', 'Greek yogurt',
  'butter', 'ghee', 'clarified butter',
  'cream', 'heavy cream', 'sour cream', 'crème fraîche',
  'cheese', 'cheddar', 'mozzarella', 'parmesan', 'feta', 'gouda',
  'condensed milk', 'buttermilk', 'khoya', 'mawa',

  // ── Pantry / Spices ───────────────────────────────────────────
  'salt', 'black pepper', 'white pepper',
  'cumin', 'cumin seeds', 'jeera',
  'coriander', 'coriander seeds', 'coriander powder',
  'turmeric', 'haldi',
  'chilli powder', 'red chilli powder', 'paprika', 'cayenne',
  'garam masala', 'biryani masala', 'kitchen king masala', 'sambar powder', 'rasam powder',
  'cardamom', 'elaichi', 'cloves', 'laung', 'cinnamon', 'dalchini',
  'star anise', 'mace', 'nutmeg', 'ajwain', 'mustard seeds', 'fennel seeds', 'saunf',
  'asafoetida', 'hing', 'dried fenugreek', 'kasuri methi',
  'oil', 'olive oil', 'coconut oil', 'sunflower oil', 'sesame oil', 'mustard oil',
  'soy sauce', 'oyster sauce', 'fish sauce', 'worcestershire sauce',
  'vinegar', 'apple cider vinegar', 'white vinegar', 'balsamic vinegar',
  'tomato ketchup', 'tomato paste', 'tomato puree',
  'coconut milk', 'coconut cream', 'desiccated coconut',
  'tamarind', 'imli', 'amchur', 'dry mango powder',
  'sugar', 'brown sugar', 'jaggery', 'honey', 'maple syrup',
  'baking soda', 'baking powder', 'yeast', 'cornstarch',
  'stock', 'chicken stock', 'vegetable stock', 'beef stock',
  'lemon', 'lime', 'lemon juice',

  // ── Nuts & Dry Fruits ─────────────────────────────────────────
  'cashews', 'almonds', 'peanuts', 'walnuts', 'pistachios', 'pine nuts',
  'raisins', 'dates', 'figs', 'apricots',

  // ── Fresh Herbs ───────────────────────────────────────────────
  'basil', 'oregano', 'thyme', 'rosemary', 'parsley', 'dill', 'chives',

  // ── Fruits ────────────────────────────────────────────────────
  'banana', 'apple', 'mango', 'pineapple', 'papaya', 'guava',
  'orange', 'lime', 'lemon', 'pomegranate', 'watermelon',

  // ── Sauces & Condiments ───────────────────────────────────────
  'mayonnaise', 'mustard', 'hot sauce', 'sriracha', 'tahini', 'hummus',
  'pesto', 'pasta sauce', 'pizza sauce',
  'green chutney', 'tamarind chutney', 'mint chutney',

  // ── SG / Global additions ─────────────────────────────────────
  'lemongrass', 'galangal', 'kaffir lime leaves', 'pandan leaves',
  'hoisin sauce', 'mirin', 'sake', 'dashi', 'miso',
  'kimchi', 'gochujang', 'gochugaru',
  'halloumi', 'labneh', 'za\'atar', 'sumac',
];

// ── Auto-correct common misspellings ──────────────────────────────
const CORRECTIONS = {
  'onoin':    'onion',    'oniom':    'onion',    'onions':   'onion',
  'tomatoe':  'tomato',   'toamto':   'tomato',   'tomatos':  'tomato',
  'garlick':  'garlic',   'garlik':   'garlic',
  'ginger':   'ginger',   'gingerr':  'ginger',
  'potatoe':  'potato',   'potatoe':  'potato',
  'carrot':   'carrot',   'carot':    'carrot',
  'chiken':   'chicken',  'chikken':  'chicken',  'chciken': 'chicken',
  'panneer':  'paneer',   'panir':    'paneer',   'paner':   'paneer',
  'yougurt':  'yogurt',   'yoghurt':  'yogurt',   'curd':    'curd',
  'lentil':   'lentils',  'lentills': 'lentils',
  'tumeric':  'turmeric', 'turmeric': 'turmeric',
  'corriander': 'coriander', 'corainder': 'coriander',
  'cumin':    'cumin',    'cummin':   'cumin',
  'spnach':   'spinach',  'spinach':  'spinach',
  'mushroms':  'mushroom', 'mushroons': 'mushroom',
};

// ── Fuzzy search ──────────────────────────────────────────────────
export function searchIngredients(query, limit = 8) {
  if (!query || query.length < 2) return [];

  const q = query.toLowerCase().trim();

  // Apply auto-correction
  const corrected = CORRECTIONS[q] || q;

  // Score each ingredient
  const scored = INGREDIENTS_DB.map(ing => {
    const i = ing.toLowerCase();
    let score = 0;
    if (i === corrected)                    score = 100;  // exact match
    else if (i.startsWith(corrected))       score = 80;   // starts with
    else if (i.includes(corrected))         score = 60;   // contains
    else if (corrected.includes(i))         score = 40;   // query contains ingredient
    else {
      // Simple fuzzy: count matching chars in sequence
      let qi = 0;
      for (let ci = 0; ci < i.length && qi < corrected.length; ci++) {
        if (i[ci] === corrected[qi]) qi++;
      }
      if (qi === corrected.length) score = 20;
    }
    return { ing, score };
  }).filter(x => x.score > 0).sort((a, b) => b.score - a.score);

  return scored.slice(0, limit).map(x => x.ing);
}

// ── Auto-correct a single entry ───────────────────────────────────
export function autoCorrect(input) {
  const q = input.toLowerCase().trim();
  return CORRECTIONS[q] || input;
}

// ── Check if it's a vegetarian-safe ingredient ────────────────────
export const NON_VEG = new Set([
  'chicken', 'chicken breast', 'chicken thigh', 'chicken leg', 'minced chicken',
  'mutton', 'lamb', 'goat meat', 'minced meat', 'keema', 'beef', 'pork', 'bacon',
  'fish', 'salmon', 'tuna', 'tilapia', 'sardine', 'mackerel', 'pomfret',
  'prawn', 'shrimp', 'crab', 'squid', 'soy sauce', 'oyster sauce', 'fish sauce',
  'worcestershire sauce', 'chicken stock', 'beef stock',
]);

export const EGG_INGREDIENTS = new Set(['egg', 'eggs', 'boiled egg']);

export function isVegetarianSafe(ingredient) {
  const i = ingredient.toLowerCase().trim();
  return !NON_VEG.has(i) && !NON_VEG.has(i.replace('s$', ''));
}
