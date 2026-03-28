// api/suggest.js — Internal suggest + Public API v1 (?v=1 + X-API-Key)

import crypto from 'crypto';

const DAILY_LIMITS = { free: 10, starter: 500, pro: 5000 };

async function validateApiKey(apiKey, supabaseUrl, serviceKey) {
  if (!supabaseUrl || !serviceKey) return { ok: false, error: 'Key validation unavailable' };
  try {
    const r = await fetch(`${supabaseUrl}/rest/v1/api_keys?key=eq.${encodeURIComponent(apiKey)}&limit=1`, {
      headers: { 'apikey': serviceKey, 'Authorization': `Bearer ${serviceKey}` },
    });
    const keys = await r.json();
    if (!Array.isArray(keys) || !keys.length) return { ok: false, error: 'Invalid API key.' };
    const rec = keys[0];
    const today = new Date().toISOString().slice(0, 10);
    const limit = DAILY_LIMITS[rec.tier] || 10;
    if (rec.usage_date === today && rec.usage_count >= limit) {
      return { ok: false, error: `Daily limit reached (${limit}/day for ${rec.tier} tier).`, status: 429 };
    }
    // Increment usage
    const newCount = rec.usage_date === today ? (rec.usage_count || 0) + 1 : 1;
    await fetch(`${supabaseUrl}/rest/v1/api_keys?id=eq.${rec.id}`, {
      method: 'PATCH',
      headers: { 'apikey': serviceKey, 'Authorization': `Bearer ${serviceKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ usage_count: newCount, usage_date: today }),
    });
    return { ok: true, record: rec, remaining: limit - newCount };
  } catch { return { ok: false, error: 'Key validation error.' }; }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const isPublicV1 = req.query.v === '1';

  // ── Public API v1 path ──────────────────────────────────────────
  if (isPublicV1) {
    const apiKey = req.headers['x-api-key'];
    if (!apiKey) return res.status(401).json({ error: 'Missing X-API-Key header.', docs: 'https://jiff-ecru.vercel.app/api-docs' });

    const validation = await validateApiKey(apiKey, process.env.REACT_APP_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
    if (!validation.ok) return res.status(validation.status || 401).json({ error: validation.error });

    const { ingredients=[], time='30 min', diet='none', cuisine='any', mealType='any', servings=2, count=3, language='en', units='metric' } = req.body;
    if (!ingredients?.length) return res.status(400).json({ error: 'ingredients array is required.' });
    const maxCount = Math.min(count, validation.record?.tier === 'pro' ? 5 : 3);
    const cuisineLabel = (!cuisine || cuisine === 'any') ? null : cuisine;
    const dietLabel    = (!diet    || diet    === 'none') ? 'no dietary restrictions' : diet;
    const langMap = { en:'English', hi:'Hindi', ta:'Tamil', es:'Spanish', fr:'French', de:'German' };
    const langName = langMap[language] || 'English';
    const prompt = `You are a creative chef. Suggest ${maxCount} meals.
Ingredients: ${ingredients.join(', ')}.
Time: ${time}. Diet: ${dietLabel}. ${cuisineLabel?`All meals MUST be ${cuisineLabel} cuisine.`:''} Servings: ${servings}. ${units==='imperial'?'Use imperial measurements.':'Use metric measurements.'} ${langName!=='English'?`Respond entirely in ${langName}.`:''}
Respond ONLY with valid JSON array:
[{"name":"..","emoji":"..","time":"..","servings":"${servings}","difficulty":"..","description":"..","ingredients":[],"steps":[],"calories":"..","protein":"..","carbs":"..","fat":".."}]`;
    try {
      const aiRes = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-api-key': process.env.ANTHROPIC_API_KEY, 'anthropic-version': '2023-06-01' },
        body: JSON.stringify({ model: 'claude-opus-4-5', max_tokens: 2000, messages: [{ role: 'user', content: prompt }] }),
      });
      const data = await aiRes.json();
      if (!aiRes.ok) return res.status(aiRes.status).json({ error: data.error?.message || 'AI error' });
      const match = data.content?.map(c=>c.text||'').join('').replace(/```json|```/g,'').trim().match(/\[[\s\S]*\]/);
      const meals = match ? JSON.parse(match[0]) : null;
      return res.status(200).json({ meals, meta: { count: meals?.length||0, language, cuisine: cuisine||'any', generated: new Date().toISOString(), tier: validation.record?.tier||'free', remaining: validation.remaining } });
    } catch { return res.status(500).json({ error: 'Internal server error.' }); }
  }

  // ── Internal app path (existing logic below) ────────────────────

  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'API key not configured.' });

  try {
    const {
      ingredients, time, diet, cuisine,
      mealType = 'any',        // breakfast | lunch | dinner | snack | any
      defaultServings = 2,     // used in recipe scaling hint
      tasteProfile,
      language = 'en',
      units = 'metric',
      count = 5,               // number of meals to return (free tier sends 1)
    } = req.body;

    if (!ingredients?.length) return res.status(400).json({ error: 'Please provide at least one ingredient.' });

    const dietLabel    = (!diet || diet === 'none') ? 'no dietary restrictions' : diet;

    // ── Egg + vegetarian conflict fix (item u) ────────────────
    // If diet is vegetarian and ingredients contain eggs, treat as eggetarian
    // This prevents AI from returning egg dishes for strict vegetarian
    const hasEggs = (ingredients || []).some(i => ['egg','eggs','boiled egg'].includes(i.toLowerCase().trim()));
    let effectiveDiet = dietLabel;
    let eggRule = '';
    if (diet === 'vegetarian' && hasEggs) {
      effectiveDiet = 'eggetarian (vegetarian who eats eggs)';
      eggRule = 'User is eggetarian — recipes CAN include eggs but must have NO meat or fish.';
    } else if (diet === 'vegetarian') {
      eggRule = 'STRICT vegetarian — absolutely NO eggs, meat, fish, or seafood in any recipe. Even if eggs appear in the ingredient list, do NOT use them.';
    } else if (diet === 'vegan') {
      eggRule = 'STRICTLY vegan — NO eggs, dairy, meat, fish, honey, or any animal products.';
    } else if (diet === 'jain') {
      eggRule = 'Jain diet — NO meat, eggs, fish, or root vegetables (onion, garlic, potato, carrot, beetroot, turnip). Use only above-ground vegetables.';
    }
    const cuisineLabel = (!cuisine || cuisine === 'any') ? null : cuisine;
    const cuisineRule  = cuisineLabel
      ? `All ${count} meals MUST be authentic ${cuisineLabel} cuisine.`
      : `Suggest the ${count} most practical meals regardless of cuisine.`;

    // Meal type instruction
    const mealTypeMap = {
      breakfast: 'breakfast dishes — quick to prepare (under 20 min), energising, and appropriate for the morning',
      lunch:     'lunch dishes — satisfying, practical, and suitable for midday',
      dinner:    'dinner dishes — more complete meals suitable for the evening',
      snack:     'snack or light bite recipes — small portions, quick to prepare, suitable as between-meal snacks',
      any:       'meals suitable for any time of day — vary the meal types across the suggestions',
    };
    const mealTypeRule = `All suggestions must be ${mealTypeMap[mealType] || mealTypeMap.any}.`;

    const unitsRule = units === 'imperial'
      ? 'Use imperial measurements only: oz, lbs, cups, tbsp, tsp, fl oz. Never use grams or ml.'
      : 'Use metric measurements only: g, kg, ml, l, tbsp, tsp.';

    const langMap = { en: 'English', hi: 'Hindi', ta: 'Tamil', es: 'Spanish' };
    const langName = langMap[language] || 'English';
    const langRule = langName !== 'English'
      ? `IMPORTANT: Respond ENTIRELY in ${langName}. All meal names, descriptions, ingredients, and steps must be in ${langName}.`
      : '';

    const tp = tasteProfile || {};
    const profileLines = [];
    if (tp.spice_level && tp.spice_level !== 'medium') profileLines.push(`Spice level: ${tp.spice_level} — adjust heat accordingly.`);
    if (tp.allergies?.length) profileLines.push(`Allergies — NEVER include: ${tp.allergies.join(', ')}.`);
    if (tp.preferred_cuisines?.length && !cuisineLabel) profileLines.push(`User prefers: ${tp.preferred_cuisines.join(', ')} — favour these styles.`);
    if (tp.skill_level === 'beginner') profileLines.push('User is a beginner cook — keep techniques simple.');
    if (tp.skill_level === 'advanced') profileLines.push('Advanced cook — feel free to use sophisticated techniques.');
    const profileInstruction = profileLines.length
      ? `\nUser taste profile:\n${profileLines.map(l => `- ${l}`).join('\n')}`
      : '';

    const promptDiet = eggRule || effectiveDiet;

    const prompt = `You are a creative, practical chef with deep knowledge of world cuisines.

Available ingredients: ${ingredients.join(', ')}.
Time available: ${time}.
Dietary preference: ${effectiveDiet}. ${eggRule}
Meal type: ${mealTypeRule}
Cuisine requirement: ${cuisineRule}
Serving size: Each recipe should serve ${defaultServings} people.
Measurements: ${unitsRule}
${langRule}${profileInstruction}

Suggest exactly ${count} meal${count > 1 ? 's' : ''}. Respond ONLY with a valid JSON array — no markdown, no explanation, no backticks:

[
  {
    "name": "Meal Name",
    "emoji": "🍝",
    "time": "25 min",
    "servings": "${defaultServings}",
    "difficulty": "Easy",
    "description": "One enticing sentence describing this dish.",
    "ingredients": ["200g pasta", "2 cloves garlic", "olive oil*"],
    "steps": ["Step 1", "Step 2", "Step 3"],
    "calories": "420",
    "protein": "18g",
    "carbs": "52g",
    "fat": "14g"
  }
]

Rules: use given ingredients as base; mark pantry staples with *; keep steps concise; each meal must be distinct.`;

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({ model: 'claude-opus-4-5', max_tokens: 2500, messages: [{ role: 'user', content: prompt }] }),
    });

    const data = await response.json();
    if (!response.ok) return res.status(response.status).json({ error: data.error?.message || 'API error' });

    const rawText = data.content?.map(c => c.text || '').join('') || '';
    let meals = null;
    try {
      const cleaned = rawText.replace(/```json|```/g, '').trim();
      const match = cleaned.match(/\[[\s\S]*\]/);
      if (match) meals = JSON.parse(match[0]);
    } catch { return res.status(500).json({ error: 'Could not parse meal suggestions.' }); }

    return res.status(200).json({ meals });
  } catch (err) {
    console.error('Handler error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
}
