export default async function handler(req, res) {
  const url = process.env.REACT_APP_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return res.status(503).json({ error: 'Supabase not configured' });
  const h = { 'apikey': key, 'Authorization': `Bearer ${key}` };
  try {
    const r = await fetch(`${url}/rest/v1/profiles?select=id,name,email,country,created_at&order=created_at.desc&limit=200`, { headers: h });
    const data = await r.json();
    return res.status(200).json({ users: Array.isArray(data) ? data : [] });
  } catch (e) { return res.status(500).json({ error: e.message }); }
}
