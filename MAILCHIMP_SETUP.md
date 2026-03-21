# Jiff — Email Drip Setup Guide (Mailchimp)

Complete guide to connect the email capture on the landing page to a 3-email welcome sequence.

---

## Overview

The landing page captures emails and stores them in `localStorage` under `jiff-email-subs`.
This guide connects that capture to Mailchimp so every submission triggers a 3-email sequence:

| Email | When | Purpose |
|---|---|---|
| Email 1 | Immediately | Welcome — what Jiff can do, quick start guide |
| Email 2 | Day 3 | Tip — lesser-known feature (serving scaler, step timers, history) |
| Email 3 | Day 7 | Premium nudge — upgrade CTA with pricing |

---

## Step 1 — Create a free Mailchimp account

1. Go to **mailchimp.com** → **Sign up free**
2. Enter email, username, password → **Get started**
3. Complete the onboarding (business name: Jiff, website: your Vercel URL)
4. Free plan allows up to 500 contacts and 1,000 emails/month — enough to start

---

## Step 2 — Create an Audience (mailing list)

1. Go to **Audience → All contacts → Create Audience** (or use the default)
2. Set:
   - **Audience name:** `Jiff Users`
   - **Default from email:** your email
   - **Default from name:** `Jiff`
   - **Remind people how they signed up:** "You signed up at getjiff.in to be notified about Jiff updates"
3. Click **Save**

---

## Step 3 — Get your API key and Audience ID

**API Key:**
1. Click your account avatar (top right) → **Account & billing → Extras → API keys**
2. Click **Create A Key** → name it `jiff-website`
3. Copy the key — you'll add it to Vercel

**Audience ID:**
1. Go to **Audience → All contacts → Settings → Audience name and defaults**
2. Copy the **Audience ID** (looks like `abc123def4`)

---

## Step 4 — Add env vars to Vercel

Add these to **Vercel → Settings → Environment Variables**:

| Variable | Value | Notes |
|---|---|---|
| `MAILCHIMP_API_KEY` | Your API key from Step 3 | Server only |
| `MAILCHIMP_AUDIENCE_ID` | Your Audience ID from Step 3 | Server only |
| `MAILCHIMP_SERVER_PREFIX` | e.g. `us21` | The prefix before `.api.mailchimp.com` in your API key |

The server prefix is the part after the last `-` in your API key.
For example, if your key ends in `-us21`, the prefix is `us21`.

---

## Step 5 — Create the email-subscribe API endpoint

Create `api/email-subscribe.js` in your project:

```javascript
// api/email-subscribe.js — subscribes an email to Mailchimp
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { email } = req.body;
  if (!email || !email.includes('@')) return res.status(400).json({ error: 'Invalid email' });

  const apiKey    = process.env.MAILCHIMP_API_KEY;
  const audience  = process.env.MAILCHIMP_AUDIENCE_ID;
  const server    = process.env.MAILCHIMP_SERVER_PREFIX;

  if (!apiKey || !audience || !server) {
    // Graceful fallback if Mailchimp not configured
    return res.status(200).json({ ok: true, fallback: true });
  }

  try {
    const response = await fetch(
      `https://${server}.api.mailchimp.com/3.0/lists/${audience}/members`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email_address: email,
          status:        'subscribed',
          tags:          ['jiff-landing'],
          merge_fields:  { SOURCE: 'landing-page' },
        }),
      }
    );

    const data = await response.json();

    // 400 with title "Member Exists" is fine — they're already subscribed
    if (!response.ok && data.title !== 'Member Exists') {
      console.error('Mailchimp error:', data);
      return res.status(500).json({ error: 'Subscription failed' });
    }

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('Mailchimp request failed:', err);
    return res.status(500).json({ error: 'Internal error' });
  }
}
```

Add this endpoint to `vercel.json`:
```json
{ "src": "api/email-subscribe.js", "use": "@vercel/node" }
```
And to `routes`:
```json
{ "src": "/api/email-subscribe", "dest": "/api/email-subscribe.js" }
```

---

## Step 6 — Update the landing page to call the API

In `src/pages/Landing.jsx`, update `handleEmailCapture`:

```javascript
const handleEmailCapture = async () => {
  if (!email || !email.includes('@')) return;
  // Save locally
  const subs = JSON.parse(localStorage.getItem('jiff-email-subs') || '[]');
  subs.push({ email, ts: Date.now() });
  localStorage.setItem('jiff-email-subs', JSON.stringify(subs));
  // Send to Mailchimp via API
  try {
    await fetch('/api/email-subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
  } catch (e) { /* non-critical */ }
  setEmailDone(true);
  if (typeof window !== 'undefined' && window._jiffGA) {
    window._jiffGA('email_capture', { source: 'landing' });
  }
};
```

---

## Step 7 — Build the 3-email automation in Mailchimp

1. Go to **Automations → Customer Journeys → Create**
2. Click **Start → Contact subscribes to audience** → select `Jiff Users`
3. Add filter: tag is `jiff-landing`

**Email 1 — Welcome (send immediately):**
- Subject: `⚡ Welcome to Jiff — your fridge just got smarter`
- Content:

> Hi there,
>
> Thanks for signing up for Jiff updates!
>
> Jiff is an AI-powered meal suggester — type what's in your fridge and get 5 real recipes in seconds, with step-by-step instructions, nutrition info, and a grocery list for anything you're missing.
>
> **[Try Jiff free →](https://your-app.vercel.app)**
>
> No credit card needed. Your first 7 days are completely free.

**Add a time delay: 3 days**

**Email 2 — Tip (Day 3):**
- Subject: `One Jiff feature most people miss 👀`
- Content:

> Quick tip for you —
>
> After Jiff generates your recipes, tap on any card and you'll find:
>
> **⚖️ Serving scaler** — cooking for 1? Hosting 8? Every ingredient scales automatically.
>
> **⏱ Step timers** — tap any time in a recipe step and a timer starts. Your phone vibrates when it's done.
>
> **🛒 Grocery list** — see exactly what you have vs what you need to buy, with a WhatsApp share button.
>
> **[Explore these features →](https://your-app.vercel.app)**

**Add a time delay: 4 days**

**Email 3 — Premium nudge (Day 7):**
- Subject: `Your Jiff trial — here's what you get if you stay ⚡`
- Content:

> Your free trial is coming to an end.
>
> Here's what Premium unlocks:
>
> ✓ 5 recipes per search (instead of 1 preview)
> ✓ Unlimited weekly meal plans
> ✓ Goal-based plans (weight loss, muscle gain, family, budget…)
> ✓ Cloud sync across all your devices
>
> **[Upgrade to Premium →](https://your-app.vercel.app/pricing)**
>
> Starting at ₹99/month. Cancel any time.

4. Click **Activate** — the sequence will now run automatically for every new subscriber

---

## Troubleshooting

| Problem | Fix |
|---|---|
| `MAILCHIMP_SERVER_PREFIX` wrong | Open your API key — the prefix is after the last `-` (e.g. key ending in `-us21` → prefix is `us21`) |
| "Member Exists" error | Fine — the subscriber is already on your list. The API endpoint handles this gracefully |
| Emails going to spam | Add SPF/DKIM records in your domain DNS (Mailchimp provides these under Domains settings) |
| Automation not sending | Check the trigger is set to "Contact subscribes to audience" and the tag filter matches `jiff-landing` |
| Email not receiving Day 1 | Check Mailchimp Audience → Contacts — did the email appear? If yes, check spam folder |

---

## Free plan limits

Mailchimp free plan: 500 contacts, 1,000 emails/month, 3-step automations.

Once you exceed 500 contacts, upgrade to **Essentials** (~$13/month for 500 contacts).
Alternatively, switch to **Brevo** (formerly Sendinblue) which has more generous free limits.
