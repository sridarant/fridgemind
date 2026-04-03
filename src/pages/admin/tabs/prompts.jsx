// src/pages/admin/tabs/prompts.jsx — Admin tab component
// Props received from AdminShell: C, Card, ADMIN_KEY, adminKey, stats, users,
//   waitlist, feedback, releases, loading, premiumStatus, lookerUrl,
//   tokenStats, rlsStatus, setStats, setUsers, setWaitlist, setFeedback,
//   setReleases, setLoading, setPremiumStatus, setLookerUrl,
//   setTokenStats, setRlsStatus, activeTab

export default function Tab_PROMPTS({ C, Card, ADMIN_KEY, adminKey, setAdminKey,
  stats, setStats, users, setUsers, waitlist, setWaitlist,
  feedback, setFeedback, releases, setReleases, loading, setLoading,
  premiumStatus, setPremiumStatus, lookerUrl, setLookerUrl,
  tokenStats, setTokenStats, rlsStatus, setRlsStatus }) {{
  return (
    <>
<>
  <Card title="All AI prompts used in Jiff — with rendered examples">
    <div style={{fontSize:12,color:C.muted,fontWeight:300,marginBottom:12,lineHeight:1.6}}>
      Every prompt Jiff sends to Claude. Values shown are real examples. Model and token budget noted per prompt.
    </div>
  </Card>

  {/* Recipe generation */}
  <Card title="1. Recipe generation — api/suggest.js (internal path)">
    <div style={{display:'flex',gap:8,flexWrap:'wrap',marginBottom:10}}>
      {[['Model','claude-opus-4-5'],['Max tokens','2500'],['Endpoint','/api/suggest'],['Trigger','Generate button']].map(([k,v])=>(
        <div key={k} style={{padding:'4px 10px',background:'rgba(28,10,0,0.04)',borderRadius:6,fontSize:11}}>
          <span style={{color:C.muted}}>{k}: </span><span style={{color:C.ink,fontWeight:500}}>{v}</span>
        </div>
      ))}
    </div>
    <div style={{fontFamily:'monospace',fontSize:11,background:'rgba(28,10,0,0.03)',padding:'14px',borderRadius:8,lineHeight:1.9,color:C.muted,whiteSpace:'pre-wrap',wordBreak:'break-word'}}>
{`You are a creative, practical chef with deep knowledge of world cuisines.

Available ingredients: [tomato, paneer, onion, coriander].
Time available: 30 min.
Dietary preference: vegetarian.
Meal type: All suggestions must be lunch dishes.
Cuisine requirement: All 3 meals MUST be authentic Tamil Nadu cuisine.
Serving size: Each recipe should serve 2 people.
Measurements: Use metric measurements only.

User taste profile:
- Spice level: medium
- Allergies — NEVER include: peanuts
- User prefers: Tamil Nadu, Kerala

Suggest exactly 3 meals. Respond ONLY with a valid JSON array — no markdown, no explanation.
[{"name":"...","emoji":"...","time":"...","servings":"2","difficulty":"...","description":"...","ingredients":[...],"steps":[...],"calories":"...","protein":"...","carbs":"...","fat":"..."}]`}
    </div>
  </Card>

  {/* Kids mode */}
  <Card title="2. Kids Meals — api/suggest.js (kidsMode override)">
    <div style={{display:'flex',gap:8,flexWrap:'wrap',marginBottom:10}}>
      {[['Model','claude-haiku-4-5'],['Max tokens','2500'],['Trigger','Kids Meals generate']].map(([k,v])=>(
        <div key={k} style={{padding:'4px 10px',background:'rgba(28,10,0,0.04)',borderRadius:6,fontSize:11}}>
          <span style={{color:C.muted}}>{k}: </span><span style={{color:C.ink,fontWeight:500}}>{v}</span>
        </div>
      ))}
    </div>
    <div style={{fontFamily:'monospace',fontSize:11,background:'rgba(28,10,0,0.03)',padding:'14px',borderRadius:8,lineHeight:1.9,color:C.muted,whiteSpace:'pre-wrap',wordBreak:'break-word'}}>
{`You are an expert child nutritionist and kids cooking educator.

The PARENT cooks this FOR the child. Adult does all cooking.
Focus on nutrition, hidden veg, quick prep, child-friendly presentation.

Age group: Kids (4-8 yrs) (4-8 yrs)
KIDS SAFETY (4-8 yrs): No sharp cutting, no deep frying. Fun shapes, hidden vegetables.
Meal type: Lunch
Recipes needed: 3 — each COMPLETELY DIFFERENT from the others
Serves: 2
Dietary: vegetarian
Spice: very mild — no chilli, minimal spice
Preferred cuisines: Tamil Nadu, Kerala.

STRICT RULE: Do NOT suggest Dal Tadka, plain Jeera Rice, or any generic everyday dish.

Respond ONLY with valid JSON, no markdown:
{"meals":[{"name":"...","emoji":"...","description":"...","time":"...","difficulty":"...","servings":"2","ingredients":[...],"steps":[...],"calories":"...","protein":"...","fun_fact":"..."}]}`}
    </div>
  </Card>

  {/* Sacred Kitchen */}
  <Card title="3. Sacred Kitchen — api/suggest.js (kidsMode override)">
    <div style={{display:'flex',gap:8,flexWrap:'wrap',marginBottom:10}}>
      {[['Model','claude-haiku-4-5'],['Max tokens','2500'],['Trigger','Sacred Kitchen generate']].map(([k,v])=>(
        <div key={k} style={{padding:'4px 10px',background:'rgba(28,10,0,0.04)',borderRadius:6,fontSize:11}}>
          <span style={{color:C.muted}}>{k}: </span><span style={{color:C.ink,fontWeight:500}}>{v}</span>
        </div>
      ))}
    </div>
    <div style={{fontFamily:'monospace',fontSize:11,background:'rgba(28,10,0,0.03)',padding:'14px',borderRadius:8,lineHeight:1.9,color:C.muted,whiteSpace:'pre-wrap',wordBreak:'break-word'}}>
{`You are an expert in sacred and traditional Indian food across all religious traditions.

Generate 3 authentic Prasadam / Naivedyam recipe(s) associated with Tirupati tradition.
Context: Ladoo, pulihora, chakraponkala — Balaji prasadam
Occasion: Blessed offering to the divine
Servings: 4
Diet: vegetarian
SATVIK MODE: strictly no onion, no garlic, no meat, no eggs, no non-vegetarian items.

IMPORTANT: These should be genuinely authentic recipes traditionally offered in this context.

Respond ONLY with valid JSON:
{"meals":[{"name":"...","emoji":"...","description":"...","tradition":"Tirupati","significance":"...","time":"...","difficulty":"...","servings":"4","ingredients":[...],"steps":[...],"calories":"...","protein":"...","fun_fact":"..."}]}`}
    </div>
  </Card>

  {/* Week planner */}
  <Card title="4. Week planner — api/planner.js">
    <div style={{display:'flex',gap:8,flexWrap:'wrap',marginBottom:10}}>
      {[['Model','claude-opus-4-5'],['Max tokens','4000'],['Trigger','Week Plan generate']].map(([k,v])=>(
        <div key={k} style={{padding:'4px 10px',background:'rgba(28,10,0,0.04)',borderRadius:6,fontSize:11}}>
          <span style={{color:C.muted}}>{k}: </span><span style={{color:C.ink,fontWeight:500}}>{v}</span>
        </div>
      ))}
    </div>
    <div style={{fontFamily:'monospace',fontSize:11,background:'rgba(28,10,0,0.03)',padding:'14px',borderRadius:8,lineHeight:1.9,color:C.muted,whiteSpace:'pre-wrap',wordBreak:'break-word'}}>
{`You are a professional meal planner and nutritionist with expertise in Indian and global cuisines.

Create a complete 7-day meal plan.
Diet: vegetarian
Cuisine preferences: Tamil Nadu (40%), Kerala (30%), North Indian (30%)
Servings: 2 people per meal
Time preference: Quick (under 20 min)
Nutrition goal: balanced

Respond ONLY with valid JSON: {"plan":[{"day":"Monday","meals":{"breakfast":{...},"lunch":{...},"dinner":{...}}}]}`}
    </div>
  </Card>

  {/* Ingredient translation */}
  <Card title="5. Ingredient translator — api/suggest.js (?action=translate)">
    <div style={{display:'flex',gap:8,flexWrap:'wrap',marginBottom:10}}>
      {[['Model','claude-haiku-4-5'],['Max tokens','300'],['Trigger','🌐 button in IngredientInput']].map(([k,v])=>(
        <div key={k} style={{padding:'4px 10px',background:'rgba(28,10,0,0.04)',borderRadius:6,fontSize:11}}>
          <span style={{color:C.muted}}>{k}: </span><span style={{color:C.ink,fontWeight:500}}>{v}</span>
        </div>
      ))}
    </div>
    <div style={{fontFamily:'monospace',fontSize:11,background:'rgba(28,10,0,0.03)',padding:'14px',borderRadius:8,lineHeight:1.9,color:C.muted,whiteSpace:'pre-wrap',wordBreak:'break-word'}}>
{`You are an expert in Indian culinary ingredients and regional names.
User typed: "ponangani keerai". The user may be using Tamil names.
If this is a known food ingredient or regional name, identify it and return:
{"found":true,"english":"Water Amaranth","local":"Ponangani Keerai","lang":"Tamil","category":"leafy green","note":"Used in rasam and stir fry"}
If you cannot identify it as a food ingredient, return: {"found":false}`}
    </div>
  </Card>

  {/* Fridge detect */}
  <Card title="6. Fridge photo detection — api/suggest.js (?action=detect)">
    <div style={{display:'flex',gap:8,flexWrap:'wrap',marginBottom:10}}>
      {[['Model','claude-opus-4-5'],['Max tokens','500'],['Input','base64 image'],['Trigger','FridgePhotoUpload']].map(([k,v])=>(
        <div key={k} style={{padding:'4px 10px',background:'rgba(28,10,0,0.04)',borderRadius:6,fontSize:11}}>
          <span style={{color:C.muted}}>{k}: </span><span style={{color:C.ink,fontWeight:500}}>{v}</span>
        </div>
      ))}
    </div>
    <div style={{fontFamily:'monospace',fontSize:11,background:'rgba(28,10,0,0.03)',padding:'14px',borderRadius:8,lineHeight:1.9,color:C.muted,whiteSpace:'pre-wrap',wordBreak:'break-word'}}>
{`[image input: base64 fridge photo]

Determine if this image shows food, ingredients, a fridge, pantry, or kitchen.
If not, respond: {"error":"not_food"}

If food-related, list all food ingredients visible.
Rules: common simple names only; max 20 items; skip non-food items.
Respond ONLY with valid JSON: {"error":"not_food"} or ["ingredient1","ingredient2"]`}
    </div>
  </Card>

  {/* Substitution */}
  <Card title="7. Ingredient substitution — api/suggest.js (inline)">
    <div style={{display:'flex',gap:8,flexWrap:'wrap',marginBottom:10}}>
      {[['Model','claude-haiku-4-5'],['Max tokens','2500'],['Trigger','Sub? button on ingredient']].map(([k,v])=>(
        <div key={k} style={{padding:'4px 10px',background:'rgba(28,10,0,0.04)',borderRadius:6,fontSize:11}}>
          <span style={{color:C.muted}}>{k}: </span><span style={{color:C.ink,fontWeight:500}}>{v}</span>
        </div>
      ))}
    </div>
    <div style={{fontFamily:'monospace',fontSize:11,background:'rgba(28,10,0,0.03)',padding:'14px',borderRadius:8,lineHeight:1.9,color:C.muted,whiteSpace:'pre-wrap',wordBreak:'break-word'}}>
{`Suggest 2-3 practical substitutes for "paneer" when cooking "Palak Paneer".
Respond ONLY with JSON: {"subs":[{"name":"substitute","note":"brief note on how to use"}]}`}
    </div>
  </Card>
</>
    </>
  );
}
