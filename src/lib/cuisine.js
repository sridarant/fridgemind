// src/lib/cuisine.js — Single source of truth for all cuisine data
// Taxonomy, pool logic, tile mapping, per-session picker
// v22.4

// ── Full taxonomy ─────────────────────────────────────────────────
export const CUISINE_GROUPS = [
  {
    id:    'regional',
    label: 'Regional',
    sections: [
      {
        id: 'south', label: 'South',
        items: [
          { id:'tamil_nadu',    label:'Tamil Nadu'    },
          { id:'kerala',        label:'Kerala'        },
          { id:'karnataka',     label:'Karnataka'     },
          { id:'andhra',        label:'Andhra'        },
          { id:'chettinad',     label:'Chettinad'     },
          { id:'udupi',         label:'Udupi'         },
          { id:'mangalorean',   label:'Mangalorean'   },
          { id:'hyderabadi',    label:'Hyderabadi'    },
        ],
      },
      {
        id: 'north', label: 'North',
        items: [
          { id:'punjabi',       label:'Punjabi'       },
          { id:'kashmiri',      label:'Kashmiri'      },
          { id:'rajasthani',    label:'Rajasthani'    },
          { id:'awadhi',        label:'Awadhi'        },
          { id:'bihari',        label:'Bihari'        },
          { id:'himachali',     label:'Himachali'     },
        ],
      },
      {
        id: 'east_northeast', label: 'East / North East',
        items: [
          { id:'bengali',       label:'Bengali'       },
          { id:'odia',          label:'Odia'          },
          { id:'assamese',      label:'Assamese'      },
          { id:'manipuri',      label:'Manipuri'      },
          { id:'meghalayan',    label:'Meghalayan'    },
          { id:'nagaland',      label:'Nagaland'      },
        ],
      },
      {
        id: 'west', label: 'West',
        items: [
          { id:'gujarati',      label:'Gujarati'      },
          { id:'maharashtrian', label:'Maharashtrian' },
          { id:'goan',          label:'Goan'          },
          { id:'parsi',         label:'Parsi'         },
          { id:'sindhi',        label:'Sindhi'        },
        ],
      },
      {
        id: 'central', label: 'Central',
        items: [
          { id:'madhya_pradesh',label:'Madhya Pradesh'},
          { id:'chhattisgarh',  label:'Chhattisgarh' },
        ],
      },
      {
        id: 'street_food', label: 'Street Food',
        items: [
          { id:'chaat',         label:'Chaat'         },
          { id:'mumbai_street', label:'Mumbai street' },
          { id:'delhi_street',  label:'Delhi street'  },
          { id:'si_street',     label:'South Indian street' },
          { id:'coastal_snacks',label:'Coastal snacks'},
        ],
      },
    ],
  },
  {
    id:    'global',
    label: 'Global',
    sections: [
      {
        id: 'global', label: '',
        items: [
          { id:'chinese',       label:'Chinese'       },
          { id:'italian',       label:'Italian'       },
          { id:'japanese',      label:'Japanese'      },
          { id:'korean',        label:'Korean'        },
          { id:'mexican',       label:'Mexican'       },
          { id:'middle_eastern',label:'Middle Eastern'},
          { id:'continental',   label:'Continental'   },
          { id:'french',        label:'French'        },
          { id:'mediterranean', label:'Mediterranean' },
          { id:'thai',          label:'Thai'          },
        ],
      },
    ],
  },
  {
    id:    'special',
    label: 'Special Requirements',
    sections: [
      {
        id: 'special', label: '',
        items: [
          { id:'jain',          label:'Jain'          },
          { id:'sattvic',       label:'Sattvic'       },
          { id:'high_protein',  label:'High-protein'  },
          { id:'low_carb',      label:'Low-carb'      },
          { id:'kid_friendly',  label:'Kid-friendly'  },
          { id:'celebratory',   label:'Celebratory'   },
        ],
      },
    ],
  },
];

// ── Flat list of all cuisine items (for lookup/display) ───────────
export const ALL_CUISINES = CUISINE_GROUPS.flatMap(g =>
  g.sections.flatMap(s => s.items)
);

export const getCuisineLabel = (id) =>
  ALL_CUISINES.find(c => c.id === id)?.label || id;

// ── Tile → cuisine behaviour mapping ─────────────────────────────
// Returns the cuisine context string for the prompt given tile + user pool
export function getCuisineForTile(tileId, userPool = [], lastCuisine = null) {
  // Tiles that override the pool entirely
  const LOCKED = {
    sacred:     'Sattvic or Jain — pure vegetarian temple food, no onion or garlic',
    lunchbox:   null,  // kid-safe context — cuisine not relevant
    little_chefs: null,
  };
  if (tileId in LOCKED) return LOCKED[tileId];

  // Tiles that use the pool with a specific bias
  const BIASED = {
    hosting:  'crowd-pleasing, visually impressive, suitable for guests',
    mood:     null,   // mood logic overrides via moodToContext()
    goal:     null,   // goal logic overrides via goal prompt
    discover: null,   // Discover sets its own context
  };
  if (tileId in BIASED && BIASED[tileId]) return BIASED[tileId];

  // All other tiles: use last used cuisine from pool, or random from pool
  if (lastCuisine && userPool.includes(lastCuisine)) {
    return getCuisineLabel(lastCuisine);
  }
  if (userPool.length > 0) {
    // For week plan — return 'varied' to rotate through pool
    if (tileId === 'week_plan') return `varied — rotate through ${userPool.map(getCuisineLabel).join(', ')}`;
    return getCuisineLabel(userPool[0]);
  }
  return 'any'; // no pool set
}

// ── Goal → prompt context ─────────────────────────────────────────
export const GOAL_CONTEXTS = {
  weight:   { label:'Weight management', emoji:'⚖️', prompt:'low calorie, high fibre, light cooking methods, portion-controlled, filling but not heavy' },
  muscle:   { label:'Muscle gain',       emoji:'💪', prompt:'high protein, lean meats, legumes, eggs, post-workout friendly, satisfying portions' },
  healthier:{ label:'Eat healthier',     emoji:'🥗', prompt:'whole ingredients, minimal processing, balanced macros, lots of vegetables' },
  family:   { label:'Family nutrition',  emoji:'👨‍👩‍👧', prompt:'balanced for all ages, nutritious, varied, kid-friendly but not bland' },
  festive:  { label:'Festive prep',      emoji:'🎉', prompt:'celebratory dishes suitable for an occasion or festival, can be elaborate, feeds a group' },
};

// ── Quick-add staples (India-first, used in fridge view) ──────────
export const QUICK_ADD_STAPLES = [
  'Onion','Tomato','Potato','Eggs','Chicken','Dal','Rice','Paneer',
  'Garlic','Ginger','Spinach','Carrot','Cauliflower','Peas',
];
