// api/admin.js — Consolidated: admin data + stats + meal history
// Routes by ?action=: users|feedback|usage|reset-trial|broadcast|stats|meal-history

const ADMIN_KEY = 'jiff-admin-2026';
function safeArray(data) { return Array.isArray(data) ? data : []; }
const safeCount = (res) => {
  try { const n = parseInt(res.headers.get('content-range')?.split('/')[1]); return isNaN(n) ? 0 : n; } catch { return 0; }
};
const safeJson = async (res) => { try { const d = await res.json(); return Array.isArray(d) ? d : []; } catch { return []; } };

export default async function handler(req, res) {
  const url    = process.env.REACT_APP_SUPABASE_URL;
  const key    = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const action = req.query.action || req.body?.action;
  const h      = { 'Content-Type':'application/json', 'apikey':key||'', 'Authorization':`Bearer ${key||''}` };

  // ── PUBLIC: stats (no auth required) ──────────────────────────────
  if (action === 'stats') {
    if (!url || !key) return res.status(503).json({ error: 'Stats not configured' });
    res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=600');
    try {
      const [usersR, mealsR] = await Promise.all([
        fetch(`${url}/rest/v1/profiles?select=id`, { headers: { ...h, 'Prefer':'count=exact','Range':'0-0' } }),
        fetch(`${url}/rest/v1/meal_history?select=id`, { headers: { ...h, 'Prefer':'count=exact','Range':'0-0' } }),
      ]);
      const totalUsers = safeCount(usersR), totalMeals = safeCount(mealsR);
      const since = new Date(Date.now()-7*86400000).toISOString();
      const [histR, profilesR, cuisineR] = await Promise.all([
        fetch(`${url}/rest/v1/meal_history?select=generated_at&generated_at=gte.${since}&order=generated_at.asc`, { headers: h }),
        fetch(`${url}/rest/v1/profiles?select=country&limit=1000`, { headers: h }),
        fetch(`${url}/rest/v1/meal_history?select=cuisine&limit=500`, { headers: h }),
      ]);
      const recentMeals = await safeJson(histR);
      const profiles    = await safeJson(profilesR);
      const cuisineRows = await safeJson(cuisineR);
      const dayLabels = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
      const dayMap = {};
      recentMeals.forEach(m => { if (m?.generated_at) { const k = dayLabels[new Date(m.generated_at).getDay()]; dayMap[k]=(dayMap[k]||0)+1; } });
      const countryCount = {}, cuisineCount = {};
      profiles.forEach(p => { if (p?.country) countryCount[p.country]=(countryCount[p.country]||0)+1; });
      cuisineRows.forEach(r => { if (r?.cuisine&&r.cuisine!=='any') cuisineCount[r.cuisine]=(cuisineCount[r.cuisine]||0)+1; });
      const flagMap = { IN:'🇮🇳',SG:'🇸🇬',GB:'🇬🇧',AU:'🇦🇺',US:'🇺🇸',DE:'🇩🇪',FR:'🇫🇷',MY:'🇲🇾',AE:'🇦🇪' };
      const nameMap = { IN:'India',SG:'Singapore',GB:'United Kingdom',AU:'Australia',US:'United States',DE:'Germany',FR:'France',MY:'Malaysia',AE:'UAE' };
      const total = totalUsers || 1;
      return res.status(200).json({
        totalUsers, totalMeals,
        countriesCount: Object.keys(countryCount).length || 1,
        todayUsers: dayMap[dayLabels[new Date().getDay()]]||0,
        growthPct: 0,
        topCountries: Object.entries(countryCount).sort((a,b)=>b[1]-a[1]).slice(0,7)
          .map(([code,count])=>({ name:nameMap[code]||code, code, flag:flagMap[code]||'🌍', users:count, pct:Math.round(count/total*100)||1 })),
        topCuisines: Object.entries(cuisineCount).sort((a,b)=>b[1]-a[1]).slice(0,7)
          .map(([name,count])=>({ name, count, pct:Math.round(count/(totalMeals||1)*100)||1 })),
        weeklyTrend: dayLabels.map(d=>({ day:d, users:dayMap[d]||0 })),
      });
    } catch(e) { return res.status(500).json({ error: e.message }); }
  }

  // ── USER AUTH: meal history (uses user's own data, no admin key) ──
  if (action === 'meal-history' || req.query.action === undefined && req.headers['x-user-id']) {
    if (!url || !key) {
      if (req.method === 'GET') return res.status(200).json({ history: [] });
      return res.status(200).json({ ok: true, fallback: true });
    }
    const mh = { ...h, 'Prefer': 'return=minimal' };

    if (req.method === 'POST') {
      const { userId, meals, mealType, cuisine, servings, ingredients } = req.body;
      if (!userId || !meals?.length) return res.status(400).json({ error: 'Missing userId or meals.' });
      const rows = meals.map(meal => ({
        user_id: userId, meal, meal_type: mealType||'any', cuisine: cuisine||'any',
        servings: servings||2, ingredients: ingredients||[], generated_at: new Date().toISOString(),
      }));
      const r = await fetch(`${url}/rest/v1/meal_history`, { method:'POST', headers: mh, body: JSON.stringify(rows) });
      if (!r.ok) return res.status(500).json({ error: 'Failed to save history.' });
      return res.status(200).json({ ok: true });
    }

    if (req.method === 'GET') {
      const userId = req.query.userId;
      if (!userId) return res.status(400).json({ error: 'Missing userId.' });
      const r = await fetch(`${url}/rest/v1/meal_history?user_id=eq.${userId}&order=generated_at.desc&limit=30`, { method:'GET', headers: h });
      if (!r.ok) return res.status(500).json({ error: 'Failed to fetch history.' });
      return res.status(200).json({ history: (await r.json()) || [] });
    }

    if (req.method === 'DELETE') {
      const { id, userId } = req.body;
      if (!id || !userId) return res.status(400).json({ error: 'Missing id or userId.' });
      await fetch(`${url}/rest/v1/meal_history?id=eq.${id}&user_id=eq.${userId}`, { method:'DELETE', headers: mh });
      return res.status(200).json({ ok: true });
    }
    // ── PATCH — update rating on a meal by name ──────────────────
    if (req.method === 'PATCH') {
      const { userId, mealName, rating } = req.body;
      if (!userId || !mealName || !rating) return res.status(400).json({ error: 'Missing fields.' });
      // Find the most recent entry for this meal name by this user
      const findR = await fetch(
        `${url}/rest/v1/meal_history?user_id=eq.${userId}&select=id&order=generated_at.desc&limit=1`,
        { headers: h }
      );
      const rows = await findR.json();
      if (!Array.isArray(rows) || !rows.length) return res.status(200).json({ ok: true, notFound: true });
      await fetch(`${url}/rest/v1/meal_history?id=eq.${rows[0].id}`, {
        method: 'PATCH',
        headers: { ...mh, 'Prefer': 'return=minimal' },
        body: JSON.stringify({ rating, cooked_at: new Date().toISOString() }),
      });
      return res.status(200).json({ ok: true });
    }
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!url || !key) return res.status(503).json({ error: 'Supabase not configured' });

  try {
    if (action === 'users' && req.method === 'GET') {
      const r = await fetch(`${url}/rest/v1/profiles?select=id,name,email,country,created_at&order=created_at.desc&limit=200`, { headers: h });
      return res.status(200).json({ users: safeArray(await r.json()) });
    }
    if (action === 'feedback' && req.method === 'GET') {
      const r = await fetch(`${url}/rest/v1/feedback?select=*&order=created_at.desc&limit=100`, { headers: h });
      return res.status(200).json({ feedback: safeArray(await r.json()) });
    }
    if (action === 'usage' && req.method === 'GET') {
      const [keysR, todayR] = await Promise.all([
        fetch(`${url}/rest/v1/api_keys?select=key,tier,usage_count&order=usage_count.desc&limit=20`, { headers: h }),
        fetch(`${url}/rest/v1/api_keys?select=usage_count&usage_date=eq.${new Date().toISOString().slice(0,10)}`, { headers: h }),
      ]);
      const keys = safeArray(await keysR.json()), today = safeArray(await todayR.json());
      return res.status(200).json({ totalCalls: keys.reduce((s,k)=>s+(k.usage_count||0),0), todayCalls: today.reduce((s,k)=>s+(k.usage_count||0),0), activeKeys: keys.length, errorsToday: 0, topKeys: keys.slice(0,10) });
    }
    if (action === 'reset-trial' && req.method === 'POST') {
      const { email, adminKey } = req.body||{};
      if (adminKey !== ADMIN_KEY) return res.status(401).json({ error: 'Unauthorised' });
      if (!email) return res.status(400).json({ error: 'Email required' });
      const findR = await fetch(`${url}/rest/v1/profiles?email=eq.${encodeURIComponent(email)}&select=id`, { headers: h });
      const users = safeArray(await findR.json());
      if (!users.length) return res.status(404).json({ error: `No user found: ${email}` });
      await fetch(`${url}/rest/v1/trials?user_id=eq.${users[0].id}`, { method:'DELETE', headers: { ...h,'Prefer':'return=minimal' } });
      return res.status(200).json({ ok: true, message: `Trial reset for ${email}` });
    }
    if (action === 'broadcast' && req.method === 'POST') {
      const { message, adminKey } = req.body||{};
      if (adminKey !== ADMIN_KEY) return res.status(401).json({ error: 'Unauthorised' });
      if (!message?.trim()) return res.status(400).json({ error: 'Message required' });
      await fetch(`${url}/rest/v1/broadcasts`, { method:'POST', headers: { ...h,'Prefer':'return=minimal' }, body: JSON.stringify({ message: message.trim(), created_at: new Date().toISOString(), active: true }) });
      const cR = await fetch(`${url}/rest/v1/profiles?select=count`, { headers: { ...h,'Prefer':'count=exact','Range':'0-0' } });
      return res.status(200).json({ ok: true, recipientCount: safeCount(cR) });
    }
    // ── GET token usage stats ────────────────────────────────────
    if (action === 'token-stats' && req.method === 'GET') {
      try {
        const today = new Date().toISOString().slice(0, 10);
        const [totalR, todayR, endpointR] = await Promise.all([
          fetch(`${url}/rest/v1/token_usage?select=input_tokens,output_tokens,total_tokens`, { headers: h }),
          fetch(`${url}/rest/v1/token_usage?select=input_tokens,output_tokens,total_tokens&logged_at=gte.${today}T00:00:00Z`, { headers: h }),
          fetch(`${url}/rest/v1/token_usage?select=endpoint,input_tokens,output_tokens,total_tokens`, { headers: h }),
        ]);
        const all      = safeArray(await totalR.json());
        const todayAll = safeArray(await todayR.json());
        const byEpRaw  = safeArray(await endpointR.json());

        const sum = (arr, key) => arr.reduce((s, r) => s + (r[key] || 0), 0);

        // Aggregate by endpoint
        const epMap = {};
        byEpRaw.forEach(r => {
          if (!epMap[r.endpoint]) epMap[r.endpoint] = { calls:0, input_tokens:0, output_tokens:0, total_tokens:0 };
          epMap[r.endpoint].calls++;
          epMap[r.endpoint].input_tokens  += r.input_tokens  || 0;
          epMap[r.endpoint].output_tokens += r.output_tokens || 0;
          epMap[r.endpoint].total_tokens  += r.total_tokens  || 0;
        });
        const byEndpoint = Object.entries(epMap)
          .map(([endpoint, v]) => ({ endpoint, ...v }))
          .sort((a, b) => b.total_tokens - a.total_tokens);

        const totalInput  = sum(all, 'input_tokens');
        const totalOutput = sum(all, 'output_tokens');
        // Rough cost estimate: opus-4-5 rates ($3/$15 per 1M tokens) — conservative upper bound
        const costEstimateUSD = +((totalInput / 1e6 * 3) + (totalOutput / 1e6 * 15)).toFixed(4);

        return res.status(200).json({
          totalCalls:    all.length,
          totalTokens:   sum(all, 'total_tokens'),
          inputTokens:   totalInput,
          outputTokens:  totalOutput,
          todayCalls:    todayAll.length,
          todayTokens:   sum(todayAll, 'total_tokens'),
          byEndpoint,
          costEstimateUSD,
        });
      } catch(e) { return res.status(500).json({ error: e.message }); }
    }

    // ── GET waitlist (from broadcasts table) ────────────────────
    if (action === 'waitlist' && req.method === 'GET') {
      const r = await fetch(`${url}/rest/v1/broadcasts?select=message,created_at&order=created_at.desc&limit=200`, { headers: h });
      const rows = safeArray(await r.json());
      // Broadcasts with email-like messages are waitlist entries
      const waitlist = rows
        .filter(b => b.message?.includes('@') || b.message?.startsWith('waitlist:'))
        .map(b => ({ email: b.message.replace('waitlist:','').trim(), joined_at: b.created_at }));
      return res.status(200).json({ waitlist });
    }

    // ── POST save-setting (admin device prefs → api_keys table) ──
    if (action === 'save-setting' && req.method === 'POST') {
      const { key, value, adminKey } = req.body || {};
      if (adminKey !== ADMIN_KEY) return res.status(401).json({ error: 'Unauthorised' });
      if (!key) return res.status(400).json({ error: 'key required' });
      await fetch(`${url}/rest/v1/api_keys`, {
        method: 'POST',
        headers: { ...h, 'Prefer': 'resolution=merge-duplicates' },
        body: JSON.stringify({ key: `__setting__${key}`, tier: 'admin', value_json: JSON.stringify(value), usage_count: 0, usage_date: new Date().toISOString().slice(0,10) }),
      });
      return res.status(200).json({ ok: true });
    }

    // ── GET load-setting ─────────────────────────────────────────
    if (action === 'load-setting' && req.method === 'GET') {
      const { key } = req.query;
      if (!key) return res.status(400).json({ error: 'key required' });
      const r = await fetch(`${url}/rest/v1/api_keys?key=eq.__setting__${key}&select=value_json&limit=1`, { headers: h });
      const rows = safeArray(await r.json());
      const value = rows[0]?.value_json ? JSON.parse(rows[0].value_json) : null;
      return res.status(200).json({ value });
    }

    // ── GET releases from Supabase ───────────────────────────────
    if (action === 'releases' && req.method === 'GET') {
      const r = await fetch(`${url}/rest/v1/releases?select=*&order=deployed_at.desc&limit=50`, { headers: h });
      const releases = safeArray(await r.json());
      return res.status(200).json({ releases });
    }

    // ── Update streak in profiles table (Phase 8) ──────────────────
    if (action === 'update-streak' && req.method === 'POST') {
      const { userId, streak, lastCooked } = req.body;
      if (!userId) return res.status(400).json({ error: 'userId required' });
      const r = await fetch(`${url}/rest/v1/profiles?id=eq.${userId}`, {
        method: 'PATCH',
        headers: { ...h, 'Content-Type': 'application/json', 'Prefer': 'return=minimal' },
        body: JSON.stringify({ streak, last_cooked_at: lastCooked }),
      });
      return res.status(r.ok ? 200 : 500).json({ ok: r.ok });
    }

    // ── Update rating in meal_history (Phase 8) ──────────────────
    if (action === 'update-rating' && req.method === 'POST') {
      const { mealId, rating, userId } = req.body;
      if (!mealId || !userId) return res.status(400).json({ error: 'mealId and userId required' });
      const r = await fetch(`${url}/rest/v1/meal_history?id=eq.${mealId}&user_id=eq.${userId}`, {
        method: 'PATCH',
        headers: { ...h, 'Content-Type': 'application/json', 'Prefer': 'return=minimal' },
        body: JSON.stringify({ rating, cooked_at: new Date().toISOString() }),
      });
      return res.status(r.ok ? 200 : 500).json({ ok: r.ok });
    }

    return res.status(400).json({ error: `Unknown action: ${action}` });
  } catch(e) { return res.status(500).json({ error: e.message }); }
}
