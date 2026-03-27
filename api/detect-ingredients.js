// api/detect-ingredients.js — Uses Claude Vision to detect ingredients from fridge photo

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'API key not configured.' });

  try {
    const { imageBase64, mediaType = 'image/jpeg' } = req.body;
    if (!imageBase64) return res.status(400).json({ error: 'No image provided.' });

    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!validTypes.includes(mediaType)) {
      return res.status(400).json({ error: 'Invalid image type. Use JPEG, PNG, or WebP.' });
    }

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-opus-4-5',
        max_tokens: 500,
        messages: [{
          role: 'user',
          content: [
            {
              type: 'image',
              source: { type: 'base64', media_type: mediaType, data: imageBase64 },
            },
            {
              type: 'text',
              text: `First, determine if this image shows food, ingredients, a fridge, a pantry, a kitchen, or cooking items. If it does NOT (e.g. it's a selfie, a landscape, a document, a vehicle, or anything unrelated to food/cooking), respond with exactly: {"error": "not_food"}

If it IS food-related, list all the food ingredients you can identify.

Rules:
- List only actual food ingredients (vegetables, fruits, meats, dairy, grains, condiments, spices)
- Use common simple names: "onion" not "yellow onion", "milk" not "whole milk carton"
- Skip non-food items (bottles of water, cleaning products, containers you can't identify)
- Maximum 20 ingredients
- If the image is food-related but you cannot identify specific ingredients, return []

Respond ONLY with valid JSON. Either {"error": "not_food"} or a plain array:
["ingredient1", "ingredient2", "ingredient3"]`,
            },
          ],
        }],
      }),
    });

    const data = await response.json();
    if (!response.ok) return res.status(response.status).json({ error: data.error?.message || 'API error' });

    const rawText = data.content?.map(c => c.text || '').join('') || '';

    // Check for not_food response
    if (rawText.includes('"not_food"') || rawText.includes('not_food')) {
      return res.status(400).json({
        error: 'The photo does not appear to show food or cooking ingredients. Please upload a photo of your fridge, pantry, or ingredients.',
        code: 'not_food',
      });
    }

    let ingredients = [];
    try {
      const cleaned = rawText.replace(/```json|```/g, '').trim();
      const match = cleaned.match(/\[[\s\S]*\]/);
      if (match) ingredients = JSON.parse(match[0]);
    } catch {
      return res.status(500).json({ error: 'Could not parse ingredient list.' });
    }

    // Normalise: lowercase, deduplicate
    const normalised = [...new Set(
      ingredients
        .filter(i => typeof i === 'string' && i.trim().length > 0)
        .map(i => i.toLowerCase().trim())
        .slice(0, 20)
    )];

    return res.status(200).json({ ingredients: normalised, count: normalised.length });
  } catch (err) {
    console.error('detect-ingredients error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
}
