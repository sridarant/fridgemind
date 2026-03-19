// api/planner.js — Weekly meal planner endpoint for Jiff

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'API key not configured on server.' });
  }

  try {
    const { ingredients, diet, cuisine } = req.body;

    if (!ingredients || !Array.isArray(ingredients) || ingredients.length === 0) {
      return res.status(400).json({ error: 'Please provide at least one ingredient.' });
    }

    const dietLabel   = (!diet || diet === 'none') ? 'no dietary restrictions' : diet;
    const cuisineLabel = (!cuisine || cuisine === 'any') ? null : cuisine;
    const cuisineInstruction = cuisineLabel
      ? `All meals should follow ${cuisineLabel} cuisine style with authentic flavours and techniques.`
      : `Mix cuisines freely — variety across the week is encouraged.`;

    const prompt = `You are a professional meal planner and chef. Create a complete 7-day meal plan.

Available ingredients (pantry/fridge): ${ingredients.join(', ')}.
Dietary preference: ${dietLabel}.
Cuisine style: ${cuisineInstruction}

Rules:
- Generate exactly 7 days, each with breakfast, lunch, and dinner
- No meal should repeat across the entire week
- Breakfast should be quick (under 20 min), lunch practical, dinner more complete
- Use the given ingredients as the base — add common pantry staples where needed (mark extras with *)
- Vary proteins, textures, and cooking methods throughout the week
- Keep each meal realistic and achievable at home

Respond ONLY with a valid JSON array — no markdown, no explanation, no backticks:

[
  {
    "day": "Monday",
    "meals": {
      "breakfast": {
        "name": "Meal name",
        "emoji": "🍳",
        "time": "10 min",
        "description": "One sentence description.",
        "ingredients": ["item 1", "item 2"],
        "steps": ["Step 1", "Step 2", "Step 3"],
        "calories": "320",
        "protein": "12g"
      },
      "lunch": {
        "name": "Meal name",
        "emoji": "🥗",
        "time": "20 min",
        "description": "One sentence description.",
        "ingredients": ["item 1", "item 2"],
        "steps": ["Step 1", "Step 2", "Step 3"],
        "calories": "450",
        "protein": "18g"
      },
      "dinner": {
        "name": "Meal name",
        "emoji": "🍲",
        "time": "35 min",
        "description": "One sentence description.",
        "ingredients": ["item 1", "item 2"],
        "steps": ["Step 1", "Step 2", "Step 3", "Step 4"],
        "calories": "580",
        "protein": "24g"
      }
    }
  }
]

Generate all 7 days (Monday through Sunday) in this exact format.`;

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-opus-4-5',
        max_tokens: 8000,
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Anthropic API error:', data);
      return res.status(response.status).json({ error: data.error?.message || 'API error' });
    }

    const rawText = data.content?.map(c => c.text || '').join('') || '';

    let plan = null;
    try {
      const cleaned = rawText.replace(/```json|```/g, '').trim();
      const match = cleaned.match(/\[[\s\S]*\]/);
      if (match) plan = JSON.parse(match[0]);
    } catch {
      return res.status(500).json({ error: 'Could not parse meal plan.' });
    }

    if (!plan || plan.length < 7) {
      return res.status(500).json({ error: 'Incomplete meal plan generated. Please try again.' });
    }

    return res.status(200).json({ plan });
  } catch (err) {
    console.error('Planner handler error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
}
