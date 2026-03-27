export default async function handler(req, res) {
  const url = process.env.REACT_APP_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return res.status(503).json({ error: 'Supabase not configured' });
  const h = { 'apikey': key, 'Authorization': `Bearer ${key}` };
  try {
    const [keysR, todayR] = await Promise.all([
      fetch(`${url}/rest/v1/api_keys?select=key,tier,usage_count&order=usage_count.desc&limit=20`, { headers: h }),
      fetch(`${url}/rest/v1/api_keys?select=usage_count&usage_date=eq.${new Date().toISOString().slice(0,10)}`, { headers: h }),
    ]);
    const keys = await keysR.json().then(d => Array.isArray(d) ? d : []);
    const today = await todayR.json().then(d => Array.isArray(d) ? d : []);
    return res.status(200).json({ totalCalls: keys.reduce((s,k)=>s+(k.usage_count||0),0), todayCalls: today.reduce((s,k)=>s+(k.usage_count||0),0), activeKeys: keys.length, errorsToday: 0, topKeys: keys.slice(0,10) });
  } catch (e) { return res.status(500).json({ error: e.message }); }
}
