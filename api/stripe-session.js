// api/stripe-session.js — Creates a Stripe checkout session for non-India users
// Uses Stripe's hosted checkout page — no card details touch our server

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const stripeSecret = process.env.STRIPE_SECRET_KEY;
  if (!stripeSecret) return res.status(500).json({ error: 'Stripe not configured on server.' });

  try {
    const { planId, currency, amount, successUrl, cancelUrl } = req.body;

    if (!planId || !currency || !amount) {
      return res.status(400).json({ error: 'Missing planId, currency, or amount.' });
    }

    const PLAN_NAMES = {
      monthly:  'Jiff Premium — Monthly',
      annual:   'Jiff Premium — Annual',
      lifetime: 'Jiff Premium — Lifetime',
    };

    // Call Stripe API directly (no SDK needed — keeps bundle small)
    const params = new URLSearchParams({
      'payment_method_types[]':              'card',
      'line_items[0][price_data][currency':  currency.toLowerCase(),
      'line_items[0][price_data][product_data][name]': PLAN_NAMES[planId] || 'Jiff Premium',
      'line_items[0][price_data][unit_amount]': String(amount),
      'line_items[0][quantity]':             '1',
      'mode':                                planId === 'lifetime' ? 'payment' : 'subscription',
      'success_url':                         successUrl || `${req.headers.origin}/pricing?success=1&plan=${planId}`,
      'cancel_url':                          cancelUrl  || `${req.headers.origin}/pricing`,
      'metadata[planId]':                    planId,
    });

    // For subscriptions, need price with recurring interval
    if (planId !== 'lifetime') {
      const interval = planId === 'annual' ? 'year' : 'month';
      params.set('line_items[0][price_data][recurring][interval]', interval);
    }

    const response = await fetch('https://api.stripe.com/v1/checkout/sessions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${stripeSecret}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    });

    const session = await response.json();
    if (!response.ok) {
      console.error('Stripe error:', session);
      return res.status(response.status).json({ error: session.error?.message || 'Stripe session creation failed.' });
    }

    return res.status(200).json({ sessionId: session.id, url: session.url });
  } catch (err) {
    console.error('Stripe session error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
}
