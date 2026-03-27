# Mailchimp Setup — Jiff Email Integration

Jiff captures emails on the landing page and pricing page and subscribes them to your Mailchimp audience. The API endpoint (`api/email-subscribe.js`) is already built — you just need to connect your Mailchimp account via environment variables.

---

## Step 1 — Create a Mailchimp account

1. Go to [mailchimp.com](https://mailchimp.com) and sign up (free for up to 500 contacts)
2. Complete email verification and account setup

---

## Step 2 — Create an Audience

1. In Mailchimp, click **Audience** in the top nav
2. Click **Create Audience** (or use an existing one)
3. Fill in:
   - **Audience name**: Jiff Users
   - **Default from email**: your sending email (e.g. hello@jiff.app)
   - **Default from name**: Jiff
4. Click **Save**

### Get your Audience ID
1. Go to **Audience → Manage Audience → Settings**
2. Scroll to **Audience ID** — copy this value (looks like: `abc123def456`)

---

## Step 3 — Generate an API Key

1. Click your account avatar (top right) → **Profile**
2. Go to **Extras → API Keys**
3. Click **Create A Key**
4. Give it a name: `Jiff Production`
5. Copy the API key immediately — it won't be shown again

### Find your Server Prefix
Your server prefix is shown in the URL when you're logged in to Mailchimp:
- If the URL shows `us21.admin.mailchimp.com` → your prefix is `us21`
- If it shows `us10.admin.mailchimp.com` → your prefix is `us10`

---

## Step 4 — Add Environment Variables to Vercel

1. Go to [vercel.com](https://vercel.com) → your Jiff project
2. Click **Settings** → **Environment Variables**
3. Add these three variables (all environments: Production, Preview, Development):

| Variable | Value |
|---|---|
| `MAILCHIMP_API_KEY` | The API key from Step 3 |
| `MAILCHIMP_AUDIENCE_ID` | The Audience ID from Step 2 |
| `MAILCHIMP_SERVER_PREFIX` | e.g. `us21` |

4. Click **Save** for each

---

## Step 5 — Redeploy

Push any commit to trigger a new Vercel deployment, or in Vercel go to **Deployments → Redeploy** on the latest deployment.

---

## Step 6 — Test the integration

1. Open your live app at `jiff-ecru.vercel.app`
2. On the landing page, scroll to the email capture section
3. Enter a test email and click Subscribe
4. In Mailchimp → **Audience → All Contacts** — the email should appear within 30 seconds

---

## Step 7 — Set up the 3-email drip sequence (optional but recommended)

1. In Mailchimp → **Automations → Customer Journeys**
2. Click **Create Journey**
3. Starting point: **Joins audience**
4. Add 3 emails:
   - **Email 1 (immediately)**: Welcome to Jiff — introduce the app, link to `/app`
   - **Email 2 (day 3)**: Your first 5 recipes — tips and best features
   - **Email 3 (day 7)**: Go Premium — explain benefits, link to `/pricing`
5. Set delays between emails (3 days apart works well)
6. Activate the journey

---

## Troubleshooting

| Issue | Fix |
|---|---|
| Emails not appearing in Mailchimp | Check all 3 env vars are set, check Vercel function logs at `/api/email-subscribe` |
| "Invalid API key" error | Regenerate the API key in Mailchimp |
| "Audience not found" | Double-check the Audience ID (not the name — the alphanumeric ID) |
| Duplicate email error | Normal — Mailchimp deduplicates by email address |

---

## Current integration points

- **Landing page** — email capture box at the bottom (`/`)
- **Pricing page** — email waitlist capture (`/pricing`)
- Both use `POST /api/email-subscribe` which calls the Mailchimp API v3

