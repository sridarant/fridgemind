// api/planner.js — Jiff weekly meal planner

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'API key not configured.' });

  try {
    const { ingredients, diet, cuisine, tasteProfile, language, units } = req.body;
    if (!ingredients?.length) return res.status(400).json({ error: 'Please provide at least one ingredient.' });

    const dietLabel    = (!diet || diet === 'none') ? 'no dietary restrictions' : diet;
    const cuisineLabel = (!cuisine || cuisine === 'any') ? null : cuisine;
    const cuisineRule  = cuisineLabel
      ? `All meals should follow ${cuisineLabel} cuisine.`
      : 'Mix cuisines freely — variety across the week is encouraged.';

    const unitsRule = units === 'imperial'
      ? 'Use imperial measurements only: oz, lbs, cups, tbsp, tsp.'
      : 'Use metric measurements only: g, kg, ml, l.';

    const langMap = { en: 'English', hi: 'Hindi', ta: 'Tamil', es: 'Spanish' };
    const langName = langMap[language] || 'English';
    const langRule = langName !== 'English'
      ? `IMPORTANT: Respond ENTIRELY in ${langName}. All meal names, descriptions, ingredients, and steps must be in ${langName}.`
      : '';

    const tp = tasteProfile || {};
    const profileLines = [];
    if (tp.spice_level && tp.spice_level !== 'medium') profileLines.push(`Spice level: ${tp.spice_level}.`);
    if (tp.allergies?.length) profileLines.push(`NEVER include: ${tp.allergies.join(', ')}.`);
    if (tp.skill_level === 'beginner') profileLines.push('Keep techniques simple — beginner cook.');
    if (tp.skill_level === 'advanced') profileLines.push('Advanced cook — can handle complex techniques.');
    const profileInstruction = profileLines.length ? `\nUser taste profile:\n${profileLines.map(l => `- ${l}`).join('\n')}` : '';

    const prompt = `You are a professional meal planner. Create a complete 7-day meal plan.

Available ingredients: ${ingredients.join(', ')}.
Dietary preference: ${dietLabel}.
Cuisine style: ${cuisineRule}
Measurements: ${unitsRule}
${langRule}${profileInstruction}

Rules:
- 7 days, each with breakfast, lunch, and dinner (21 meals total)
- No meal repeats across the week
- Breakfast under 20 min, lunch practical, dinner more complete
- Mark pantry extras with *

Respond ONLY with a valid JSON array — no markdown:

[
  {
    "day": "Monday",
    "meals": {
      "breakfast": { "name": "...", "emoji": "🍳", "time": "10 min", "description": "...", "ingredients": [], "steps": [], "calories": "320", "protein": "12g" },
      "lunch":     { "name": "...", "emoji": "🥗", "time": "20 min", "description": "...", "ingredients": [], "steps": [], "calories": "450", "protein": "18g" },
      "dinner":    { "name": "...", "emoji": "🍲", "time": "35 min", "description": "...", "ingredients": [], "steps": [], "calories": "580", "protein": "24g" }
    }
  }
]

Generate all 7 days (Monday through Sunday).`;

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({ model: 'claude-opus-4-5', max_tokens: 8000, messages: [{ role: 'user', content: prompt }] }),
    });

    const data = await response.json();
    if (!response.ok) return res.status(response.status).json({ error: data.error?.message || 'API error' });

    const rawText = data.content?.map(c => c.text || '').join('') || '';
    let plan = null;
    try {
      const cleaned = rawText.replace(/```json|```/g, '').trim();
      const match = cleaned.match(/\[[\s\S]*\]/);
      if (match) plan = JSON.parse(match[0]);
    } catch { return res.status(500).json({ error: 'Could not parse meal plan.' }); }

    if (!plan || plan.length < 7) return res.status(500).json({ error: 'Incomplete plan. Please try again.' });
    return res.status(200).json({ plan });
  } catch (err) {
    console.error('Planner error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
}
