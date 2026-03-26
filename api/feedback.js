// api/feedback.js — Save user feedback to Supabase

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { userId, email, rating, category, message, page, ua, ts } = req.body;

    if (!message && !rating) return res.status(400).json({ error: 'Provide a message or rating.' });

    const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
    const serviceKey  = process.env.SUPABASE_SERVICE_ROLE_KEY;

    // Save to Supabase if configured
    if (supabaseUrl && serviceKey) {
      const insertRes = await fetch(`${supabaseUrl}/rest/v1/feedback`, {
        method: 'POST',
        headers: {
          'Content-Type':  'application/json',
          'apikey':        serviceKey,
          'Authorization': `Bearer ${serviceKey}`,
          'Prefer':        'return=minimal',
        },
        body: JSON.stringify({
          user_id:    userId || null,
          email:      email  || null,
          rating:     rating || null,
          category:   category || 'other',
          message:    message  || '',
          page:       page     || '/',
          user_agent: ua?.substring(0, 200) || '',
          created_at: new Date(ts || Date.now()).toISOString(),
        }),
      });

      if (!insertRes.ok) {
        const err = await insertRes.text();
        console.error('Feedback save error:', err);
        // Don't fail — still return success to user
      }
    } else {
      // Log to console as fallback when Supabase not configured
      console.log('[FEEDBACK]', { userId, email, rating, category, message, page });
    }

    // Optional: send email notification for low ratings or bug reports
    // (implement with SMTP or Resend.com if needed)

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('Feedback handler error:', err);
    return res.status(500).json({ error: 'Could not save feedback.' });
  }
}
