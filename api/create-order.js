// api/create-order.js — Creates a Razorpay order server-side
// Key stays on the server — never exposed to the browser

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const keyId     = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;

  if (!keyId || !keySecret) {
    return res.status(500).json({ error: 'Razorpay not configured on server.' });
  }

  try {
    const { planId } = req.body;

    // Plan amounts in paise (1 INR = 100 paise)
    const PLANS = {
      monthly:  { amount: 9900,  currency: 'INR', description: 'Jiff Premium — Monthly' },
      annual:   { amount: 79900, currency: 'INR', description: 'Jiff Premium — Annual' },
      lifetime: { amount: 299900,currency: 'INR', description: 'Jiff Premium — Lifetime' },
    };

    const plan = PLANS[planId];
    if (!plan) return res.status(400).json({ error: 'Invalid plan.' });

    const auth = Buffer.from(`${keyId}:${keySecret}`).toString('base64');

    const response = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${auth}`,
      },
      body: JSON.stringify({
        amount: plan.amount,
        currency: plan.currency,
        receipt: `jiff_${planId}_${Date.now()}`,
        notes: { plan: planId, description: plan.description },
      }),
    });

    const order = await response.json();
    if (!response.ok) {
      console.error('Razorpay error:', order);
      return res.status(response.status).json({ error: order.error?.description || 'Order creation failed.' });
    }

    return res.status(200).json({ orderId: order.id, amount: plan.amount, currency: plan.currency, planId });
  } catch (err) {
    console.error('Create order error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
}
