// api/stats.js — Real app statistics from Supabase
export default async function handler(req, res) {
  res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=600'); // Cache 5 min

  const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
  const serviceKey  = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceKey) {
    return res.status(503).json({ error: 'Stats not configured' });
  }

  const h = {
    'Content-Type': 'application/json',
    'apikey': serviceKey,
    'Authorization': `Bearer ${serviceKey}`,
  };

  try {
    // Parallel queries for efficiency
    const [usersR, mealsR, histR] = await Promise.all([
      fetch(`${supabaseUrl}/rest/v1/profiles?select=count`, { headers: {...h, 'Prefer':'count=exact', 'Range-Unit':'items', 'Range':'0-0'} }),
      fetch(`${supabaseUrl}/rest/v1/meal_history?select=count`, { headers: {...h, 'Prefer':'count=exact', 'Range-Unit':'items', 'Range':'0-0'} }),
      // Last 7 days daily counts
      fetch(`${supabaseUrl}/rest/v1/meal_history?select=generated_at&generated_at=gte.${new Date(Date.now()-7*86400000).toISOString()}&order=generated_at.asc`, { headers: h }),
    ]);

    const totalUsers = parseInt(usersR.headers.get('content-range')?.split('/')[1] || '0');
    const totalMeals = parseInt(mealsR.headers.get('content-range')?.split('/')[1] || '0');
    const recentMeals = await histR.json();

    // Build weekly trend from recent meals
    const dayMap = {};
    const days = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
    recentMeals.forEach(m => {
      const d = new Date(m.generated_at);
      const key = days[d.getDay()];
      dayMap[key] = (dayMap[key] || 0) + 1;
    });
    const weeklyTrend = days.map(d => ({ day:d, users: dayMap[d]||0 }));

    // Country breakdown from profiles
    const profilesR = await fetch(`${supabaseUrl}/rest/v1/profiles?select=country`, { headers: h });
    const profiles = await profilesR.json();
    const countryCount = {};
    profiles.forEach(p => { if (p.country) countryCount[p.country] = (countryCount[p.country]||0)+1; });
    const flagMap = { IN:'🇮🇳',SG:'🇸🇬',GB:'🇬🇧',AU:'🇦🇺',US:'🇺🇸',DE:'🇩🇪',FR:'🇫🇷',MY:'🇲🇾',AE:'🇦🇪',TH:'🇹🇭' };
    const nameMap = { IN:'India',SG:'Singapore',GB:'United Kingdom',AU:'Australia',US:'United States',DE:'Germany',FR:'France',MY:'Malaysia',AE:'UAE',TH:'Thailand' };
    const topCountries = Object.entries(countryCount)
      .sort((a,b)=>b[1]-a[1]).slice(0,7)
      .map(([code,users])=>({ name:nameMap[code]||code, code, flag:flagMap[code]||'🌍', users, pct:Math.round(users/totalUsers*100)||1 }));
    if (Object.keys(countryCount).length > 7) topCountries.push({ name:'Others', code:'__', flag:'🌍', users:0, pct: 100-topCountries.reduce((s,c)=>s+c.pct,0) });

    // Cuisine breakdown
    const cuisineR = await fetch(`${supabaseUrl}/rest/v1/meal_history?select=cuisine&limit=200`, { headers: h });
    const cuisineRows = await cuisineR.json();
    const cuisineCount = {};
    cuisineRows.forEach(r => { if (r.cuisine && r.cuisine!=='any') cuisineCount[r.cuisine] = (cuisineCount[r.cuisine]||0)+1; });
    const topCuisines = Object.entries(cuisineCount)
      .sort((a,b)=>b[1]-a[1]).slice(0,7)
      .map(([name,count])=>({ name, count, pct:Math.round(count/totalMeals*100)||1 }));

    return res.status(200).json({
      totalUsers, totalMeals,
      countriesCount: Object.keys(countryCount).length || 5,
      todayUsers: weeklyTrend[new Date().getDay()]?.users || 0,
      growthPct: Math.round((weeklyTrend.slice(-1)[0]?.users||0) / Math.max((weeklyTrend.slice(-7,-6)[0]?.users||1), 1) * 100 - 100),
      topCountries: topCountries.length ? topCountries : [{ name:'India',code:'IN',flag:'🇮🇳',users:1,pct:100 }],
      topCuisines: topCuisines.length ? topCuisines : [{ name:'Tamil Nadu',count:1,pct:100 }],
      weeklyTrend,
    });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
