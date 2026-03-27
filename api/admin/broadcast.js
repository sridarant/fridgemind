const ADMIN_KEY = 'jiff-admin-2026';
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });
  const { message, adminKey } = req.body || {};
  if (adminKey !== ADMIN_KEY) return res.status(401).json({ error: 'Unauthorised' });
  if (!message?.trim()) return res.status(400).json({ error: 'Message required' });
  const url = process.env.REACT_APP_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return res.status(503).json({ error: 'Supabase not configured' });
  const h = { 'Content-Type':'application/json', 'apikey': key, 'Authorization': `Bearer ${key}`, 'Prefer': 'return=minimal' };
  try {
    await fetch(`${url}/rest/v1/broadcasts`, { method: 'POST', headers: h, body: JSON.stringify({ message: message.trim(), created_at: new Date().toISOString(), active: true }) });
    const cR = await fetch(`${url}/rest/v1/profiles?select=count`, { headers: { ...h, 'Prefer': 'count=exact', 'Range': '0-0' } });
    const recipientCount = parseInt(cR.headers.get('content-range')?.split('/')[1] || '0');
    return res.status(200).json({ ok: true, recipientCount });
  } catch (e) { return res.status(500).json({ error: e.message }); }
}
