# Jiff — Complete Setup Guide

Everything you need to go from a fresh clone to a fully running app.
Follow sections in order — each builds on the previous.

---

## 1. Prerequisites

| Tool | Version | Install |
|---|---|---|
| Node.js | 18+ | nodejs.org |
| npm | 9+ | Comes with Node |
| Git | Any | git-scm.com |
| GitHub account | — | github.com |
| Vercel account | — | vercel.com (free) |

---

## 2. Clone and install

```bash
# Clone the repo
git clone https://github.com/sridarant/fridgemind.git
cd fridgemind

# Install dependencies (includes React, Supabase, Playwright)
npm install

# Install Playwright browsers for local E2E testing
npx playwright install chromium
```

---

## 3. Environment variables

Copy the example file:

```bash
cp .env.example .env
```

Fill in `.env` with your actual keys (details for each below):

```
ANTHROPIC_API_KEY=sk-ant-...
REACT_APP_SUPABASE_URL=https://your-project.supabase.co
REACT_APP_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
RAZORPAY_KEY_ID=rzp_test_...
RAZORPAY_KEY_SECRET=your_secret
REACT_APP_RAZORPAY_KEY_ID=rzp_test_...
```

**Which are required to start?**

| Variable | Required to run locally | Required for full features |
|---|---|---|
| `ANTHROPIC_API_KEY` | Yes — nothing works without it | Yes |
| Supabase vars | No — app runs in guest mode | For auth + sync |
| Razorpay vars | No — payments show "coming soon" | For payments |

---

## 4. Get your Anthropic API key

1. Go to **console.anthropic.com**
2. Sign up / sign in
3. Go to **API Keys → Create Key**
4. Copy the key (starts with `sk-ant-`)
5. Add credits: **Plans & Billing → Add credits** (minimum $5)
6. Paste into `.env` as `ANTHROPIC_API_KEY`

---

## 5. Set up Supabase (auth + cloud sync)

Follow `SUPABASE_SETUP.md` for the complete guide. Summary:

1. Create free project at supabase.com
2. Run Phase 1 SQL (profiles, pantry, favourites tables)
3. Run Phase 2 SQL (meal_history table)
4. Enable Google OAuth (requires Google Cloud Console)
5. Copy Project URL + anon key to `.env`
6. Copy service_role key to `.env` as `SUPABASE_SERVICE_ROLE_KEY`

---

## 6. Run locally

```bash
npm start
```

Opens at **http://localhost:3000**

The API functions (`/api/suggest`, `/api/planner`, `/api/meal-history`) run as Vercel
serverless functions in production. To test them locally:

```bash
npm install -g vercel
vercel dev
```

This starts the full Vercel dev environment including serverless functions at
**http://localhost:3000**.

---

## 7. Run E2E tests locally

```bash
# Run all tests against http://localhost:3000
npm run test:e2e

# Run with visible browser (useful for debugging)
npm run test:e2e:headed

# Open interactive Playwright UI
npm run test:e2e:ui

# View HTML report after a test run
npm run test:e2e:report
```

Tests require the app to be running. In a separate terminal:
```bash
vercel dev   # or npm start for frontend-only
```

---

## 8. Deploy to Vercel

### First-time deploy

1. Push your code to GitHub
2. Go to **vercel.com → New Project → Import Git Repository**
3. Select your repo → **Deploy**
4. Go to **Settings → Environment Variables** and add all variables from `.env`
5. **Redeploy** after adding env vars (required for them to take effect)

### Every subsequent deploy

```bash
git add .
git commit -m "Your message"
git push
```

Vercel auto-deploys on every push to `main`.

### Environment variables in Vercel

Add each variable under **Settings → Environment Variables**. Select all three
environments (Production, Preview, Development):

| Variable | Source |
|---|---|
| `ANTHROPIC_API_KEY` | console.anthropic.com → API Keys |
| `REACT_APP_SUPABASE_URL` | Supabase → Settings → API → Project URL |
| `REACT_APP_SUPABASE_ANON_KEY` | Supabase → Settings → API → anon public |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase → Settings → API → service_role |
| `RAZORPAY_KEY_ID` | Razorpay Dashboard → Settings → API Keys |
| `RAZORPAY_KEY_SECRET` | Razorpay Dashboard → Settings → API Keys |
| `REACT_APP_RAZORPAY_KEY_ID` | Same as RAZORPAY_KEY_ID |
| `PLAYWRIGHT_BASE_URL` | Your Vercel app URL e.g. `https://jiff-ecru.vercel.app` |
| `MAILCHIMP_API_KEY` | Mailchimp → Account → API keys |
| `MAILCHIMP_AUDIENCE_ID` | Mailchimp → Audience → Settings → Audience ID |
| `MAILCHIMP_SERVER_PREFIX` | Prefix from API key e.g. `us21` |

---

## 9. Set up Google Analytics (GA4)

1. Go to **analytics.google.com** → **Start measuring**
2. Create an account (name: `Jiff`) → property → data stream → **Web**
3. Enter your Vercel URL
4. Copy the **Measurement ID** (starts with `G-`)
5. In `public/index.html`, replace both occurrences of `G-XXXXXXXXXX` with your real ID
6. Redeploy — page views will appear in GA4 Realtime within 30 seconds

See `MAILCHIMP_SETUP.md` for email capture + drip configuration.

## 10. Set up Razorpay (India payments)

Payments currently show "Coming soon" — Razorpay onboarding is in progress.

When ready:

1. **Complete KYC** — razorpay.com → Dashboard → Activate Account → submit PAN, bank account, business details
2. **Get test keys first** — Settings → API Keys → Generate Test Key (prefix: `rzp_test_`)
3. **Test the flow** — add test keys to Vercel, use card `4111 1111 1111 1111` to verify checkout works
4. **Go live** — once KYC approved, generate Live Keys (prefix: `rzp_live_`) and replace test keys
5. **International cards (optional)** — Dashboard → Settings → International Payments → submit activation request (2–3 days)
6. **Webhook (recommended)** — Dashboard → Webhooks → add endpoint:
   ```
   https://your-app.vercel.app/api/verify-payment
   ```
   Event: `payment.captured`

Once live keys are in Vercel and the app is redeployed, replace the "Coming soon" block
in `src/pages/Pricing.jsx` with the live Razorpay checkout button (see `PremiumContext.jsx`
for the `openCheckout` function — it's already built, just needs `razorpayEnabled` to be true).

---

## 10. CI / E2E automation

Tests run automatically on every `git push` via GitHub Actions (`.github/workflows/e2e.yml`).

**One-time setup:**

1. Go to your GitHub repo → **Settings → Secrets → Actions → New repository secret**
2. Add:

| Secret | Value |
|---|---|
| `PLAYWRIGHT_BASE_URL` | `https://your-app.vercel.app` |

After this, every push triggers:
1. GitHub Actions spins up Ubuntu container
2. Waits for Vercel preview deployment
3. Runs all 14 Playwright tests against the preview URL
4. Posts pass/fail comment on pull requests
5. Uploads HTML report as downloadable artifact (14-day retention)

**Fixing the workflow scope error:**

If you get `refusing to allow a Personal Access Token to create workflow files`:
1. GitHub → Settings → Developer settings → Personal access tokens → your token → Edit
2. Tick the **`workflow`** scope checkbox
3. Update token → copy new value → update your git remote URL:
   ```bash
   git remote set-url origin https://NEW_TOKEN@github.com/sridarant/fridgemind.git
   ```

---

## 12. Custom domain (optional)

1. Buy a domain (e.g. `getjiff.in` at GoDaddy/Namecheap, ~₹800/year)
2. Vercel → your project → **Settings → Domains → Add**
3. Add the domain and follow the DNS instructions (usually just one CNAME record)
4. Update Supabase → Authentication → URL Configuration → Site URL to your new domain

---

## 13. Project structure

```
jiff/
├── api/                      Vercel serverless functions
│   ├── suggest.js            AI meal suggestions
│   ├── planner.js            Weekly meal plan generation
│   ├── meal-history.js       Save/fetch meal history
│   ├── create-order.js       Razorpay order creation
│   └── verify-payment.js     Razorpay payment verification
│
├── src/
│   ├── contexts/
│   │   ├── AuthContext.jsx   Supabase auth + cloud data
│   │   ├── PremiumContext.jsx Usage tracking + Razorpay checkout
│   │   └── LocaleContext.jsx Language, units, currency, cuisine options
│   ├── i18n/
│   │   ├── en.js             English translations
│   │   ├── hi.js             Hindi translations
│   │   ├── ta.js             Tamil translations
│   │   └── es.js             Spanish translations
│   ├── lib/
│   │   └── supabase.js       Supabase client init
│   └── pages/
│       ├── Landing.jsx       Marketing homepage
│       ├── Jiff.jsx          Main meal suggester app
│       ├── Planner.jsx       Weekly meal planner
│       ├── Profile.jsx       User taste profile + pantry
│       ├── Pricing.jsx       Upgrade / payment page
│       ├── History.jsx       Meal generation history
│       ├── Plans.jsx         Goal-based premium meal plans
│       └── Privacy.jsx       Privacy policy page
│
├── public/                   PWA assets (icons, manifest, service worker)
├── src/components/
│   ├── JiffLogo.jsx          Animated logo component
│   └── CookieBanner.jsx      GDPR cookie consent banner
├── tests/
│   └── jiff.spec.js          14 Playwright E2E test cases
├── .github/workflows/
│   └── e2e.yml               GitHub Actions CI workflow
│
├── .env.example              All required environment variables
├── CHANGELOG.md              Release history v1–v15
├── SETUP.md                  This file
├── SUPABASE_SETUP.md         Supabase-specific setup (Phase 1 + Phase 2)
├── MAILCHIMP_SETUP.md        Email drip setup guide
└── vercel.json               Vercel deployment config + routing
```

---

## 14. Key technical decisions

| Decision | Choice | Reason |
|---|---|---|
| AI model | `claude-opus-4-5` | Best instruction-following for structured JSON output |
| Database | Supabase (Postgres) | Free tier, built-in auth, Row Level Security |
| Payments | Razorpay | India-first, simple API, supports UPI/cards/netbanking |
| Deployment | Vercel | Zero-config React + serverless functions, free tier |
| Auth | Supabase Auth | Google OAuth + magic link, no password management |
| State | React context | No Redux needed at this scale |
| Styling | CSS-in-JS + `<style>` | No build step for CSS, colocated with components |
| Testing | Playwright | Best-in-class E2E, cross-browser, CI-friendly |
| i18n | Custom `translate()` | No dependencies, simple key-value with interpolation |
