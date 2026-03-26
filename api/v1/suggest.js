// api/v1/suggest.js — Public Jiff API v1
// Requires X-API-Key header. 3 tiers: free (10/day), starter, pro.
// API keys stored in Supabase api_keys table.

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed', docs: 'https://jiff.app/api-docs' });

  const apiKey = req.headers['x-api-key'];
  if (!apiKey) {
    return res.status(401).json({
      error: 'Missing X-API-Key header.',
      docs: 'https://jiff.app/api-docs',
      message: 'Get a free API key at https://jiff.app/api-docs',
    });
  }

  // Validate API key against Supabase
  const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
  const serviceKey  = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const anthropicKey = process.env.ANTHROPIC_API_KEY;

  if (!anthropicKey) return res.status(500).json({ error: 'Service not configured.' });

  let keyRecord = null;

  if (supabaseUrl && serviceKey) {
    try {
      const keyRes = await fetch(
        `${supabaseUrl}/rest/v1/api_keys?key=eq.${encodeURIComponent(apiKey)}&limit=1`,
        {
          headers: { 'apikey': serviceKey, 'Authorization': `Bearer ${serviceKey}` },
        }
      );
      const keys = await keyRes.json();
      if (!keys?.length) return res.status(401).json({ error: 'Invalid API key.' });
      keyRecord = keys[0];

      // Check rate limits based on tier
      const DAILY_LIMITS = { free: 10, starter: 500, pro: 5000 };
      const limit = DAILY_LIMITS[keyRecord.tier] || 10;

      // Increment usage counter
      const today = new Date().toISOString().slice(0, 10);
      if (keyRecord.usage_date !== today) {
        // Reset daily counter
        await fetch(`${supabaseUrl}/rest/v1/api_keys?id=eq.${keyRecord.id}`, {
          method: 'PATCH',
          headers: { 'apikey': serviceKey, 'Authorization': `Bearer ${serviceKey}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ usage_date: today, usage_count: 1 }),
        });
      } else if (keyRecord.usage_count >= limit) {
        return res.status(429).json({
          error: `Daily limit reached. ${keyRecord.tier} tier allows ${limit} requests/day.`,
          upgrade: 'https://jiff.app/api-docs#pricing',
          reset_at: new Date(Date.now() + 86400000).toISOString(),
        });
      } else {
        await fetch(`${supabaseUrl}/rest/v1/api_keys?id=eq.${keyRecord.id}`, {
          method: 'PATCH',
          headers: { 'apikey': serviceKey, 'Authorization': `Bearer ${serviceKey}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ usage_count: (keyRecord.usage_count || 0) + 1 }),
        });
      }
    } catch (err) {
      console.error('API key validation error:', err);
      // In dev/test, allow without validation
      if (process.env.NODE_ENV === 'production') {
        return res.status(500).json({ error: 'Key validation service unavailable.' });
      }
    }
  }

  // Parse request
  const {
    ingredients = [],
    time       = '30 min',
    diet       = 'none',
    cuisine    = 'any',
    mealType   = 'any',
    servings   = 2,
    count      = 3,    // public API returns up to 3
    language   = 'en',
    units      = 'metric',
  } = req.body;

  if (!ingredients?.length) return res.status(400).json({ error: 'ingredients array is required and must not be empty.' });

  const maxCount = Math.min(count, keyRecord?.tier === 'pro' ? 5 : 3);

  // Build prompt
  const dietLabel    = (!diet || diet === 'none') ? 'no dietary restrictions' : diet;
  const cuisineLabel = (!cuisine || cuisine === 'any') ? null : cuisine;
  const cuisineRule  = cuisineLabel ? `All meals MUST be authentic ${cuisineLabel} cuisine.` : 'Suggest practical meals regardless of cuisine.';
  const unitsRule    = units === 'imperial' ? 'Use imperial measurements: oz, lbs, cups, tbsp, tsp.' : 'Use metric: g, kg, ml, l, tbsp, tsp.';
  const langMap      = { en:'English', hi:'Hindi', ta:'Tamil', es:'Spanish', fr:'French', de:'German' };
  const langName     = langMap[language] || 'English';
  const langRule     = langName !== 'English' ? `Respond ENTIRELY in ${langName}.` : '';

  const prompt = `You are a creative chef. Suggest ${maxCount} meals.
Available ingredients: ${ingredients.join(', ')}.
Time: ${time}. Diet: ${dietLabel}. ${cuisineRule} Servings: ${servings}. ${unitsRule} ${langRule}

Respond ONLY with valid JSON array:
[{"name":"..","emoji":"..","time":"..","servings":"${servings}","difficulty":"..","description":"..","ingredients":[],"steps":[],"calories":"..","protein":"..","carbs":"..","fat":".."}]`;

  try {
    const aiRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': anthropicKey, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({ model: 'claude-opus-4-5', max_tokens: 2000, messages: [{ role: 'user', content: prompt }] }),
    });

    const data = await aiRes.json();
    if (!aiRes.ok) return res.status(aiRes.status).json({ error: data.error?.message || 'AI error' });

    const rawText = data.content?.map(c => c.text || '').join('') || '';
    let meals = null;
    try {
      const match = rawText.replace(/```json|```/g, '').trim().match(/\[[\s\S]*\]/);
      if (match) meals = JSON.parse(match[0]);
    } catch { return res.status(500).json({ error: 'Could not parse meals.' }); }

    // Add metadata
    return res.status(200).json({
      meals,
      meta: {
        count:     meals?.length || 0,
        language,
        units,
        cuisine:   cuisine || 'any',
        generated: new Date().toISOString(),
        tier:      keyRecord?.tier || 'free',
        remaining: keyRecord ? Math.max(0, (keyRecord.tier === 'pro' ? 5000 : keyRecord.tier === 'starter' ? 500 : 10) - ((keyRecord.usage_count || 0) + 1)) : null,
      },
    });
  } catch (err) {
    console.error('v1/suggest error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
}
