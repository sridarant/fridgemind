// api/stats.js — Real app statistics from Supabase
// Defensive: every Supabase response is validated before use

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=600');

  const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
  const serviceKey  = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceKey) {
    return res.status(503).json({ error: 'Stats not configured — SUPABASE_SERVICE_ROLE_KEY missing' });
  }

  const h = {
    'Content-Type': 'application/json',
    'apikey':        serviceKey,
    'Authorization': `Bearer ${serviceKey}`,
  };

  // Safe JSON parser — returns [] if parse fails or result is not an array
  const safeArray = async (response) => {
    try {
      const data = await response.json();
      return Array.isArray(data) ? data : [];
    } catch { return []; }
  };

  // Safe count extractor from content-range header
  const safeCount = (response) => {
    try {
      const cr = response.headers.get('content-range');
      const n = parseInt(cr?.split('/')[1]);
      return isNaN(n) ? 0 : n;
    } catch { return 0; }
  };

  try {
    // Step 1: count queries (use HEAD + content-range)
    const [usersR, mealsR] = await Promise.all([
      fetch(`${supabaseUrl}/rest/v1/profiles?select=id`, {
        headers: { ...h, 'Prefer': 'count=exact', 'Range': '0-0' }
      }),
      fetch(`${supabaseUrl}/rest/v1/meal_history?select=id`, {
        headers: { ...h, 'Prefer': 'count=exact', 'Range': '0-0' }
      }),
    ]);

    const totalUsers = safeCount(usersR);
    const totalMeals = safeCount(mealsR);

    // Step 2: recent meals for weekly trend (last 7 days)
    const since = new Date(Date.now() - 7 * 86400000).toISOString();
    const histR = await fetch(
      `${supabaseUrl}/rest/v1/meal_history?select=generated_at&generated_at=gte.${since}&order=generated_at.asc&limit=500`,
      { headers: h }
    );
    const recentMeals = await safeArray(histR);

    const dayLabels = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
    const dayMap = {};
    recentMeals.forEach(m => {
      if (!m?.generated_at) return;
      const key = dayLabels[new Date(m.generated_at).getDay()];
      dayMap[key] = (dayMap[key] || 0) + 1;
    });
    const weeklyTrend = dayLabels.map(d => ({ day: d, users: dayMap[d] || 0 }));

    // Step 3: country breakdown
    const profilesR = await fetch(
      `${supabaseUrl}/rest/v1/profiles?select=country&limit=1000`,
      { headers: h }
    );
    const profiles = await safeArray(profilesR);
    const countryCount = {};
    profiles.forEach(p => {
      if (p?.country) countryCount[p.country] = (countryCount[p.country] || 0) + 1;
    });

    const flagMap = { IN:'🇮🇳',SG:'🇸🇬',GB:'🇬🇧',AU:'🇦🇺',US:'🇺🇸',DE:'🇩🇪',FR:'🇫🇷',MY:'🇲🇾',AE:'🇦🇪',TH:'🇹🇭',JP:'🇯🇵',CA:'🇨🇦' };
    const nameMap = { IN:'India',SG:'Singapore',GB:'United Kingdom',AU:'Australia',US:'United States',DE:'Germany',FR:'France',MY:'Malaysia',AE:'UAE',TH:'Thailand',JP:'Japan',CA:'Canada' };
    const total = totalUsers || 1; // avoid div/0
    const topCountries = Object.entries(countryCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 7)
      .map(([code, count]) => ({
        name: nameMap[code] || code,
        code,
        flag: flagMap[code] || '🌍',
        users: count,
        pct: Math.round(count / total * 100) || 1,
      }));

    // Step 4: cuisine breakdown
    const cuisineR = await fetch(
      `${supabaseUrl}/rest/v1/meal_history?select=cuisine&limit=500`,
      { headers: h }
    );
    const cuisineRows = await safeArray(cuisineR);
    const cuisineCount = {};
    cuisineRows.forEach(r => {
      if (r?.cuisine && r.cuisine !== 'any') {
        cuisineCount[r.cuisine] = (cuisineCount[r.cuisine] || 0) + 1;
      }
    });
    const topCuisines = Object.entries(cuisineCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 7)
      .map(([name, count]) => ({
        name,
        count,
        pct: Math.round(count / (totalMeals || 1) * 100) || 1,
      }));

    return res.status(200).json({
      totalUsers,
      totalMeals,
      countriesCount: Object.keys(countryCount).length || 1,
      todayUsers: weeklyTrend[new Date().getDay()]?.users || 0,
      growthPct: 0, // would need week-over-week data
      topCountries: topCountries.length ? topCountries : [{ name: 'India', code: 'IN', flag: '🇮🇳', users: 0, pct: 100 }],
      topCuisines: topCuisines.length ? topCuisines : [{ name: 'Tamil Nadu', count: 0, pct: 100 }],
      weeklyTrend,
    });

  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
