// api/admin.js — Single consolidated admin endpoint (Vercel Hobby: 12 fn limit)
// Routes by ?action= query param: users | feedback | reset-trial | broadcast | usage

const ADMIN_KEY = 'jiff-admin-2026';

function safeArray(data) { return Array.isArray(data) ? data : []; }

export default async function handler(req, res) {
  const url = process.env.REACT_APP_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const action = req.query.action || req.body?.action;

  if (!url || !key) return res.status(503).json({ error: 'Supabase not configured' });

  const h = {
    'Content-Type': 'application/json',
    'apikey': key,
    'Authorization': `Bearer ${key}`,
  };

  try {
    // ── GET users ─────────────────────────────────────────────────
    if (action === 'users' && req.method === 'GET') {
      const r = await fetch(`${url}/rest/v1/profiles?select=id,name,email,country,created_at&order=created_at.desc&limit=200`, { headers: h });
      return res.status(200).json({ users: safeArray(await r.json()) });
    }

    // ── GET feedback ──────────────────────────────────────────────
    if (action === 'feedback' && req.method === 'GET') {
      const r = await fetch(`${url}/rest/v1/feedback?select=*&order=created_at.desc&limit=100`, { headers: h });
      return res.status(200).json({ feedback: safeArray(await r.json()) });
    }

    // ── GET usage ─────────────────────────────────────────────────
    if (action === 'usage' && req.method === 'GET') {
      const [keysR, todayR] = await Promise.all([
        fetch(`${url}/rest/v1/api_keys?select=key,tier,usage_count&order=usage_count.desc&limit=20`, { headers: h }),
        fetch(`${url}/rest/v1/api_keys?select=usage_count&usage_date=eq.${new Date().toISOString().slice(0,10)}`, { headers: h }),
      ]);
      const keys  = safeArray(await keysR.json());
      const today = safeArray(await todayR.json());
      return res.status(200).json({
        totalCalls: keys.reduce((s,k) => s+(k.usage_count||0), 0),
        todayCalls: today.reduce((s,k) => s+(k.usage_count||0), 0),
        activeKeys: keys.length, errorsToday: 0, topKeys: keys.slice(0,10),
      });
    }

    // ── POST reset-trial ──────────────────────────────────────────
    if (action === 'reset-trial' && req.method === 'POST') {
      const { email, adminKey } = req.body || {};
      if (adminKey !== ADMIN_KEY) return res.status(401).json({ error: 'Unauthorised' });
      if (!email) return res.status(400).json({ error: 'Email required' });
      const findR = await fetch(`${url}/rest/v1/profiles?email=eq.${encodeURIComponent(email)}&select=id`, { headers: h });
      const users = safeArray(await findR.json());
      if (!users.length) return res.status(404).json({ error: `No user found: ${email}` });
      await fetch(`${url}/rest/v1/trials?user_id=eq.${users[0].id}`, {
        method: 'DELETE', headers: { ...h, 'Prefer': 'return=minimal' },
      });
      return res.status(200).json({ ok: true, message: `Trial reset for ${email}` });
    }

    // ── POST broadcast ────────────────────────────────────────────
    if (action === 'broadcast' && req.method === 'POST') {
      const { message, adminKey } = req.body || {};
      if (adminKey !== ADMIN_KEY) return res.status(401).json({ error: 'Unauthorised' });
      if (!message?.trim()) return res.status(400).json({ error: 'Message required' });
      await fetch(`${url}/rest/v1/broadcasts`, {
        method: 'POST', headers: { ...h, 'Prefer': 'return=minimal' },
        body: JSON.stringify({ message: message.trim(), created_at: new Date().toISOString(), active: true }),
      });
      const cR = await fetch(`${url}/rest/v1/profiles?select=count`, {
        headers: { ...h, 'Prefer': 'count=exact', 'Range': '0-0' },
      });
      const recipientCount = parseInt(cR.headers.get('content-range')?.split('/')[1] || '0');
      return res.status(200).json({ ok: true, recipientCount });
    }

    return res.status(400).json({ error: `Unknown action: ${action}. Use ?action=users|feedback|usage|reset-trial|broadcast` });

  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
