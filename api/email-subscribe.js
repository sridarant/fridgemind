// api/email-subscribe.js — Email capture with Mailchimp integration
// Adds subscriber to list, applies tags for drip sequence

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { email, source = 'landing', tags = [] } = req.body;
  if (!email || !email.includes('@')) {
    return res.status(400).json({ error: 'Valid email required.' });
  }

  const apiKey    = process.env.MAILCHIMP_API_KEY;
  const listId    = process.env.MAILCHIMP_LIST_ID;
  const serverDc  = process.env.MAILCHIMP_SERVER_PREFIX; // e.g. "us21"

  // If Mailchimp not configured — store in memory log and return ok
  // (Vercel logs capture this for manual follow-up)
  if (!apiKey || !listId || !serverDc) {
    console.log(`[EMAIL_CAPTURE] ${email} from ${source} — Mailchimp not configured`);
    return res.status(200).json({ ok: true, fallback: true });
  }

  try {
    // Mailchimp subscriber tags for drip automation
    const allTags = ['jiff-waitlist', `source:${source}`, ...tags];

    const mcRes = await fetch(
      `https://${serverDc}.api.mailchimp.com/3.0/lists/${listId}/members`,
      {
        method: 'POST',
        headers: {
          'Content-Type':  'application/json',
          'Authorization': `Basic ${Buffer.from(`anystring:${apiKey}`).toString('base64')}`,
        },
        body: JSON.stringify({
          email_address: email,
          status:        'subscribed',
          tags:          allTags,
          merge_fields: {
            SOURCE: source,
            SIGNUP:  new Date().toISOString().slice(0, 10),
          },
        }),
      }
    );

    const data = await mcRes.json();

    // 400 with title "Member Exists" — already subscribed, still ok
    if (!mcRes.ok && data.title !== 'Member Exists') {
      console.error('Mailchimp error:', data);
      return res.status(500).json({ error: 'Subscription failed. Please try again.' });
    }

    // If already exists, update tags
    if (data.title === 'Member Exists') {
      const hash = require('crypto')
        .createHash('md5')
        .update(email.toLowerCase())
        .digest('hex');
      await fetch(
        `https://${serverDc}.api.mailchimp.com/3.0/lists/${listId}/members/${hash}/tags`,
        {
          method: 'POST',
          headers: {
            'Content-Type':  'application/json',
            'Authorization': `Basic ${Buffer.from(`anystring:${apiKey}`).toString('base64')}`,
          },
          body: JSON.stringify({ tags: allTags.map(t => ({ name: t, status: 'active' })) }),
        }
      );
    }

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('Email subscribe error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
}
