// api/meal-history.js — save and retrieve meal history per user
// Uses Supabase service role key for server-side operations

export default async function handler(req, res) {
  const supabaseUrl  = process.env.REACT_APP_SUPABASE_URL;
  const serviceKey   = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceKey) {
    // Graceful fallback — history just won't persist server-side
    if (req.method === 'GET') return res.status(200).json({ history: [] });
    return res.status(200).json({ ok: true, fallback: true });
  }

  const headers = {
    'Content-Type':  'application/json',
    'apikey':        serviceKey,
    'Authorization': `Bearer ${serviceKey}`,
    'Prefer':        'return=minimal',
  };

  // ── POST — save a meal to history ─────────────────────────────
  if (req.method === 'POST') {
    const { userId, meals, mealType, cuisine, servings, ingredients } = req.body;
    if (!userId || !meals?.length) return res.status(400).json({ error: 'Missing userId or meals.' });

    const rows = meals.map(meal => ({
      user_id:     userId,
      meal,
      meal_type:   mealType || 'any',
      cuisine:     cuisine  || 'any',
      servings:    servings || 2,
      ingredients: ingredients || [],
      generated_at: new Date().toISOString(),
    }));

    const response = await fetch(`${supabaseUrl}/rest/v1/meal_history`, {
      method:  'POST',
      headers: { ...headers, 'Prefer': 'return=minimal' },
      body:    JSON.stringify(rows),
    });

    if (!response.ok) {
      const err = await response.text();
      console.error('Supabase insert error:', err);
      return res.status(500).json({ error: 'Failed to save history.' });
    }

    // Keep only last 30 entries per user — delete older ones
    await fetch(
      `${supabaseUrl}/rest/v1/meal_history?user_id=eq.${userId}&id=not.in.(` +
      `select.id.from.meal_history.where.user_id.eq.${userId}.order.generated_at.desc.limit.30)`,
      { method: 'DELETE', headers }
    ).catch(() => {}); // non-critical — ignore errors

    return res.status(200).json({ ok: true });
  }

  // ── GET — fetch history for a user ────────────────────────────
  if (req.method === 'GET') {
    const { userId } = req.query;
    if (!userId) return res.status(400).json({ error: 'Missing userId.' });

    const response = await fetch(
      `${supabaseUrl}/rest/v1/meal_history?user_id=eq.${userId}&order=generated_at.desc&limit=30`,
      { method: 'GET', headers }
    );

    if (!response.ok) {
      const err = await response.text();
      console.error('Supabase fetch error:', err);
      return res.status(500).json({ error: 'Failed to fetch history.' });
    }

    const data = await response.json();
    return res.status(200).json({ history: data || [] });
  }

  // ── DELETE — clear a single history entry ─────────────────────
  if (req.method === 'DELETE') {
    const { id, userId } = req.body;
    if (!id || !userId) return res.status(400).json({ error: 'Missing id or userId.' });

    await fetch(
      `${supabaseUrl}/rest/v1/meal_history?id=eq.${id}&user_id=eq.${userId}`,
      { method: 'DELETE', headers }
    );

    return res.status(200).json({ ok: true });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
