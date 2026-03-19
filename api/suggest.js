// api/suggest.js — Jiff secure server-side proxy for Anthropic Claude API

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'API key not configured on server.' });
  }

  try {
    const { ingredients, time, diet, cuisine } = req.body;

    if (!ingredients || !Array.isArray(ingredients) || ingredients.length === 0) {
      return res.status(400).json({ error: 'Please provide at least one ingredient.' });
    }

    const dietLabel = diet === 'none' ? 'no dietary restrictions' : diet;
    const cuisineLabel = (!cuisine || cuisine === 'any') ? null : cuisine;

    const cuisineInstruction = cuisineLabel
      ? `All 3 meals MUST be authentic ${cuisineLabel} cuisine dishes. Use ${cuisineLabel} cooking techniques, spices, and flavour profiles. Do not suggest dishes from other cuisines.`
      : `Suggest the 3 most practical and delicious meals regardless of cuisine.`;

    const prompt = `You are a creative, practical chef with deep knowledge of world cuisines.

Available ingredients: ${ingredients.join(', ')}.
Time available: ${time}.
Dietary preference: ${dietLabel}.
Cuisine requirement: ${cuisineInstruction}

Suggest exactly 3 meals. Respond ONLY with a valid JSON array — no markdown, no explanation, no backticks:

[
  {
    "name": "Meal Name",
    "emoji": "🍝",
    "time": "25 min",
    "servings": "2",
    "difficulty": "Easy",
    "description": "One enticing sentence describing this dish and its key flavours.",
    "ingredients": ["200g pasta", "2 cloves garlic", "olive oil", "salt"],
    "steps": ["Step 1", "Step 2", "Step 3", "Step 4"],
    "calories": "420",
    "protein": "18g",
    "carbs": "52g",
    "fat": "14g"
  }
]

Rules:
- Make meals practical and achievable with the given ingredients
- Add 1–2 common pantry staples only if essential (mark with *)
- Keep steps concise and clear
- Use authentic dish names and appropriate emojis for the cuisine
- Each meal must be clearly distinct from the others`;

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-opus-4-5',
        max_tokens: 1500,
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Anthropic API error:', data);
      return res.status(response.status).json({ error: data.error?.message || 'API error' });
    }

    const rawText = data.content?.map(c => c.text || '').join('') || '';

    let meals = null;
    try {
      const cleaned = rawText.replace(/```json|```/g, '').trim();
      const match = cleaned.match(/\[[\s\S]*\]/);
      if (match) meals = JSON.parse(match[0]);
    } catch {
      return res.status(500).json({ error: 'Could not parse meal suggestions.' });
    }

    return res.status(200).json({ meals });
  } catch (err) {
    console.error('Handler error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
}
