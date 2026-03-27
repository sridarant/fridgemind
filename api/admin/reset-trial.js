const ADMIN_KEY = 'jiff-admin-2026';
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });
  const { email, adminKey } = req.body || {};
  if (adminKey !== ADMIN_KEY) return res.status(401).json({ error: 'Unauthorised' });
  if (!email) return res.status(400).json({ error: 'Email required' });
  const url = process.env.REACT_APP_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return res.status(503).json({ error: 'Supabase not configured' });
  const h = { 'Content-Type':'application/json', 'apikey': key, 'Authorization': `Bearer ${key}` };
  try {
    const findR = await fetch(`${url}/rest/v1/profiles?email=eq.${encodeURIComponent(email)}&select=id`, { headers: h });
    const users = await findR.json();
    if (!Array.isArray(users) || users.length === 0) return res.status(404).json({ error: `No user found: ${email}` });
    await fetch(`${url}/rest/v1/trials?user_id=eq.${users[0].id}`, { method: 'DELETE', headers: { ...h, 'Prefer': 'return=minimal' } });
    return res.status(200).json({ ok: true, message: `Trial reset for ${email}` });
  } catch (e) { return res.status(500).json({ error: e.message }); }
}
