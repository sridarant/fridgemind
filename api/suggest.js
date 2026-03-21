// api/suggest.js — Jiff secure server-side proxy

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'API key not configured.' });

  try {
    const { ingredients, time, diet, cuisine, tasteProfile, language, units } = req.body;
    if (!ingredients?.length) return res.status(400).json({ error: 'Please provide at least one ingredient.' });

    const dietLabel    = (!diet || diet === 'none') ? 'no dietary restrictions' : diet;
    const cuisineLabel = (!cuisine || cuisine === 'any') ? null : cuisine;
    const cuisineRule  = cuisineLabel
      ? `All 3 meals MUST be authentic ${cuisineLabel} cuisine. Do not suggest dishes from other cuisines.`
      : 'Suggest the 3 most practical meals regardless of cuisine.';

    // Units instruction
    const unitsRule = units === 'imperial'
      ? 'Use imperial measurements only: oz, lbs, cups, tbsp, tsp, fl oz. Never use grams or ml.'
      : 'Use metric measurements only: g, kg, ml, l, tbsp, tsp.';

    // Language instruction
    const langMap = { en: 'English', hi: 'Hindi', ta: 'Tamil', es: 'Spanish' };
    const langName = langMap[language] || 'English';
    const langRule = langName !== 'English'
      ? `IMPORTANT: Respond ENTIRELY in ${langName}. All meal names, descriptions, ingredients, and steps must be in ${langName}.`
      : '';

    // Taste profile
    const tp = tasteProfile || {};
    const profileLines = [];
    if (tp.spice_level && tp.spice_level !== 'medium') profileLines.push(`Spice level: ${tp.spice_level} — adjust heat accordingly.`);
    if (tp.allergies?.length) profileLines.push(`Allergies — NEVER include: ${tp.allergies.join(', ')}.`);
    if (tp.preferred_cuisines?.length && !cuisineLabel) profileLines.push(`User prefers: ${tp.preferred_cuisines.join(', ')} — favour these styles.`);
    if (tp.skill_level === 'beginner') profileLines.push('User is a beginner cook — keep techniques simple.');
    if (tp.skill_level === 'advanced') profileLines.push('User is an advanced cook — feel free to use sophisticated techniques.');
    const profileInstruction = profileLines.length ? `\nUser taste profile:\n${profileLines.map(l => `- ${l}`).join('\n')}` : '';

    const prompt = `You are a creative, practical chef with deep knowledge of world cuisines.

Available ingredients: ${ingredients.join(', ')}.
Time available: ${time}.
Dietary preference: ${dietLabel}.
Cuisine requirement: ${cuisineRule}
Measurements: ${unitsRule}
${langRule}${profileInstruction}

Suggest exactly 3 meals. Respond ONLY with a valid JSON array — no markdown, no explanation, no backticks:

[
  {
    "name": "Meal Name",
    "emoji": "🍝",
    "time": "25 min",
    "servings": "2",
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
      body: JSON.stringify({ model: 'claude-opus-4-5', max_tokens: 1500, messages: [{ role: 'user', content: prompt }] }),
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
