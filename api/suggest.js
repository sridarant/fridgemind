// api/suggest.js — Jiff secure server-side proxy — returns 5 meal suggestions

export default async function handler(req, res) {
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
