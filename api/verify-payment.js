// api/verify-payment.js — Verifies Razorpay payment signature
// This is the security step — confirms payment is genuine, not fabricated

import crypto from 'crypto';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keySecret) return res.status(500).json({ error: 'Razorpay not configured.' });

  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, planId } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ error: 'Missing payment verification fields.' });
    }

    // Verify HMAC signature — standard Razorpay verification
    const body      = `${razorpay_order_id}|${razorpay_payment_id}`;
    const expected  = crypto.createHmac('sha256', keySecret).update(body).digest('hex');
    const isValid   = expected === razorpay_signature;

    if (!isValid) {
      console.error('Signature mismatch — possible tampered payment');
      return res.status(400).json({ error: 'Payment verification failed.' });
    }

    // Payment is genuine — determine expiry based on plan
    const now = Date.now();
    const EXPIRY = {
      monthly:  now + 30  * 24 * 60 * 60 * 1000,
      annual:   now + 365 * 24 * 60 * 60 * 1000,
      lifetime: now + 100 * 365 * 24 * 60 * 60 * 1000, // ~100 years = lifetime
    };

    return res.status(200).json({
      verified: true,
      planId,
      paymentId: razorpay_payment_id,
      expiresAt: EXPIRY[planId] || EXPIRY.monthly,
    });
  } catch (err) {
    console.error('Verify payment error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
}
