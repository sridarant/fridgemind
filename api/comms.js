// api/comms.js — Consolidated: feedback + email-subscribe
// Route by ?action=feedback | email

import crypto from 'crypto';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const action = req.query.action || req.body?.action;

  // ── Feedback ─────────────────────────────────────────────────────
  if (action === 'feedback') {
    try {
      const { userId, email, rating, category, message, page, ua, ts } = req.body;
      if (!message && !rating) return res.status(400).json({ error: 'Provide a message or rating.' });

      const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
      const serviceKey  = process.env.SUPABASE_SERVICE_ROLE_KEY;

      if (supabaseUrl && serviceKey) {
        await fetch(`${supabaseUrl}/rest/v1/feedback`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'apikey': serviceKey, 'Authorization': `Bearer ${serviceKey}`, 'Prefer': 'return=minimal' },
          body: JSON.stringify({ user_id: userId||null, email: email||null, rating: rating||null, category: category||'other', message: message||'', page: page||'/', user_agent: ua?.substring(0,200)||'', created_at: new Date(ts||Date.now()).toISOString() }),
        });
      } else {
        console.log('[FEEDBACK]', { userId, email, rating, category, message, page });
      }
      return res.status(200).json({ ok: true });
    } catch (err) {
      return res.status(500).json({ error: 'Could not save feedback.' });
    }
  }

  // ── Email subscribe ───────────────────────────────────────────────
  if (action === 'email') {
    const { email, source = 'landing', tags = [] } = req.body;
    if (!email || !email.includes('@')) return res.status(400).json({ error: 'Valid email required.' });

    const apiKey   = process.env.MAILCHIMP_API_KEY;
    const listId   = process.env.MAILCHIMP_LIST_ID;
    const serverDc = process.env.MAILCHIMP_SERVER_PREFIX;

    if (!apiKey || !listId || !serverDc) {
      console.log(`[EMAIL_CAPTURE] ${email} from ${source}`);
      return res.status(200).json({ ok: true, fallback: true });
    }

    try {
      const allTags = ['jiff-waitlist', `source:${source}`, ...tags];
      const auth = `Basic ${Buffer.from(`anystring:${apiKey}`).toString('base64')}`;
      const mcRes = await fetch(`https://${serverDc}.api.mailchimp.com/3.0/lists/${listId}/members`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': auth },
        body: JSON.stringify({ email_address: email, status: 'subscribed', tags: allTags, merge_fields: { SOURCE: source, SIGNUP: new Date().toISOString().slice(0,10) } }),
      });
      const data = await mcRes.json();
      if (!mcRes.ok && data.title !== 'Member Exists') return res.status(500).json({ error: 'Subscription failed.' });
      if (data.title === 'Member Exists') {
        const hash = crypto.createHash('md5').update(email.toLowerCase()).digest('hex');
        await fetch(`https://${serverDc}.api.mailchimp.com/3.0/lists/${listId}/members/${hash}/tags`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': auth },
          body: JSON.stringify({ tags: allTags.map(t => ({ name: t, status: 'active' })) }),
        });
      }
      return res.status(200).json({ ok: true });
    } catch (err) {
      return res.status(500).json({ error: 'Internal server error.' });
    }
  }

  return res.status(400).json({ error: `Unknown action: ${action}. Use ?action=feedback or ?action=email` });
}
