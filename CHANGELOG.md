# Jiff — Complete Release History

AI-powered meal suggester. Live at https://jiff-ecru.vercel.app
GitHub: https://github.com/sridarant/fridgemind

> **Release rule:** Every release must update CHANGELOG.md, SUPABASE_SETUP.md, SETUP.md, and any relevant docs before shipping. Never overwrite history — always prepend new versions.

---

## v16.1 — UX polish, Blinkit India-gate, routes, food validation, Mailchimp guide
**Date:** March 2026

### Changes
- **ApiDocs.jsx build fix** — Invalid octal escape `\1` in border string corrected to `2px solid`
- **Blinkit India-only** — Per-item "Order →" and "🛒 Blinkit" buttons now only shown when `country === 'IN'` (both in recipe grocery list and Planner grocery list)
- **Profile button country flag** — Flag emoji from LocaleContext displayed in the profile header button (🇮🇳 🇸🇬 🇬🇧 etc.)
- **Language & Units merged** — Removed separate "Language & units" sidebar card; controls merged into "Your preferences" card
- **Photo upload label** — "Photograph your fridge" → "Upload fridge photos" with better subtitle
- **Food photo validation** — `api/detect-ingredients.js` now uses a two-step Claude prompt to reject non-food images with a user-friendly error message
- **Stats route** — `/stats` registered in App.jsx; visit jiff-ecru.vercel.app/stats
- **API docs route** — `/api-docs` registered in App.jsx; visit jiff-ecru.vercel.app/api-docs
- **Mailchimp setup guide** — `MAILCHIMP_SETUP.md` expanded to 7-step detailed guide including drip sequence setup
- **E2E tests updated** — 18 → 24 tests covering v16 layout: fridge section, sidebar diet/cuisine, Indian submenu, stats/apidocs pages, language change, profile tabs

### Supabase — no new tables needed for v16.1

---

## v16 — Full i18n, Smart Greeting, Autocomplete, Photo Upload, Food Types, Indian Cuisines, Public API, Feedback, Blinkit + 14 more
**Date:** March 2026
**Files changed:** 40+ files across all layers

### New features by item

**a. Full language coverage** — Fixed all hardcoded strings. All dynamic option labels (TIME_OPTIONS, DIET_OPTIONS, CUISINE_OPTIONS) now generated via `t()` inside LocaleContext so they react to language changes. Added 6 new languages:
- New Indian: **Telugu** (te), **Kannada** (kn), **Bengali** (bn), **Marathi** (mr)
- New Global: **French** (fr), **German** (de)
- Total: 10 languages (7 Indian + 3 global)

**b. Smart greeting with weather** — `SmartGreeting.jsx` + `src/lib/weather.js`. Browser Geolocation → Nominatim reverse geocode → wttr.in weather (no API key needed). Contextual recipe suggestion: rain+India+evening → Pakoda, cold+morning → Upma, hot+afternoon → Lassi. Weather card shown in greeting.

**c. Ingredient autocomplete** — `IngredientInput.jsx` replaces the plain tag input. 200+ ingredient database in `src/lib/ingredients-db.js`. Fuzzy match as you type. Auto-correct common misspellings (panir→paneer, tumeric→turmeric etc). Pantry items shown as blue tags with "In pantry" badge.

**d/e. Smart input screen** — Ingredients auto-filled from pantry. Meal type auto-detected from local time. FridgePhotoUpload as additional input method. Profile preferences (food type, cuisine, diet requirements) injected into every AI prompt automatically.

**f. Blinkit integration** — "Order on Blinkit →" link on every grocery list item in Planner. Deep-links to `https://blinkit.com/s/?q=INGREDIENT`.

**g. Public API** — `api/v1/suggest.js`. X-API-Key header auth. Tiers: free (10/day), starter (500/day), pro (5000/day). Rate limiting via Supabase `api_keys` table. Returns `meta.remaining` count.

**h. Technical documentation** — `TECHNICAL_DOC.docx` — 12-section Word doc covering product overview, tech stack, project structure, AI prompt architecture, database schema, auth, i18n, API reference, deployment, testing, and GA4 setup.

**i. Granular cookie preferences** — `CookieBanner.jsx` rebuilt. "Manage preferences" expands to show toggle switches per category: Essential (locked on), Functional, Analytics. "Save preferences" persists choices. "Accept all" / "Essential only" quick options.

**j. Investor pitch deck** — `INVESTOR_DECK.pptx` — 12-slide professional deck: Cover, Problem, Solution, Product, Market ($42B TAM), Traction, Business Model, Why Now, Competitive Moat, Roadmap, The Ask (₹1.5Cr seed), Closing.

**k. Diet requirements** — `DIET_REQUIREMENTS` in LocaleContext: Diabetic-friendly, Low sodium, Low fat, Keto, High protein, Low calorie, Gluten-free, Dairy-free. Multi-select in Profile page. Passed to AI prompt. Separate from food type (veg/non-veg).

**l. Fridge photo upload** — `FridgePhotoUpload.jsx` + `api/detect-ingredients.js`. Camera or file upload → base64 → Claude Vision → ingredient list. User reviews detected items, selects which to add. Shows photo preview with count.

**m. Auto meal type by time** — `getDefaultMealType()` in Jiff.jsx: 5–11h → breakfast, 11–15h → lunch, 15–18h → snack, 18–22h → dinner. Pre-selects the chip; user can change it.

**n. Latency messages** — LoadingView in Jiff.jsx shows "Taking a bit longer (Ns)…" after 10s. Planner already had this; Plans.jsx now also tracks `genElapsed` and shows warning after 12s.

**o. Singapore rollout** — SGD pricing added to CURRENCY_MAP: S$3/mo, S$24/yr, S$49 lifetime. Stripe gateway. SG onboarding steps in SETUP.md.

**p. GA4 setup guide** — Full step-by-step in TECHNICAL_DOC.docx and SETUP.md. Includes browser console verification, Chrome extension debugging, events reference.

**q. Usage stats** — `Stats.jsx` stub exists. Full implementation requires GA4 Data API or Supabase aggregate queries. Noted as v17 pending item.

**r. Back to home buttons** — Home button added to Planner header nav. Plans.jsx already has "Back to app" button. History, Pricing, Profile, Privacy all have back navigation.

**s. Auto-logout on close** — `beforeunload` event listener in Jiff.jsx calls Supabase `signOut()` when user closes tab/window.

**t. Cross-cuisine recommendations** — After 5+ saved favourites, AI prompt receives a context block: "User has saved many {cuisine} recipes. Suggest this recipe from a different cuisine to broaden their palate." Implemented in suggest.js prompt building.

**u. Egg + vegetarian conflict fix** — In `api/suggest.js`: if diet=vegetarian AND eggs in ingredients → treats as eggetarian. Strict vegetarian gets explicit rule "NO eggs even if in ingredient list." Vegan and Jain also get specific rule strings.

**v. Feedback widget** — `FeedbackWidget.jsx` floating button on all pages. Star rating (1–5), category dropdown (bug/feature/recipe/UX/general), free text message. Saved to Supabase `feedback` table via `api/feedback.js`. Thank-you animation on submit.

**w. Food type categories + Indian sub-cuisines** — `FOOD_TYPE_OPTIONS` in LocaleContext: Non-veg, Veg, Eggetarian, Vegan, Jain, Halal, Kosher, Pescatarian. `INDIAN_CUISINES`: 14 regional (Chettinad, Punjabi, South Indian, Kerala, Andhra, Gujarati, Rajasthani, Bengali, Maharashtrian, Kashmiri, Goan, Hyderabadi, Tamil, Mughlai). `GLOBAL_CUISINES`: 14 global. Profile page completely rewritten with 5 tabs.

### New files
`src/i18n/fr.js`, `de.js`, `bn.js`, `te.js`, `kn.js`, `mr.js` — 6 new language files
`src/lib/weather.js` — geolocation + weather utility
`src/lib/ingredients-db.js` — 200+ ingredient database
`src/components/SmartGreeting.jsx`
`src/components/IngredientInput.jsx`
`src/components/FridgePhotoUpload.jsx`
`src/components/FeedbackWidget.jsx`
`api/detect-ingredients.js`
`api/feedback.js`
`api/v1/suggest.js`
`TECHNICAL_DOC.docx`
`INVESTOR_DECK.pptx`

### Supabase — Phase 3 tables needed
See SUPABASE_SETUP.md Phase 3: `feedback` table, `api_keys` table, profile columns `food_type` and `diet_requirements[]`.

### E2E tests
18 tests — unchanged from v15. v17 will add tests for: greeting visible, autocomplete suggestions, photo upload flow, cookie preference toggles, food type selection persists.

---

## v15 — Privacy, Analytics, Goal Plans, Cookie Consent, Logo Animation
**Date:** March 2026
**Files changed:** `src/components/JiffLogo.jsx` (new), `src/components/CookieBanner.jsx` (new), `src/pages/Privacy.jsx` (new), `src/pages/Plans.jsx` (new), `src/pages/Jiff.jsx`, `src/pages/Landing.jsx`, `src/pages/Planner.jsx`, `src/App.jsx`, `public/index.html`, `MAILCHIMP_SETUP.md` (new), `SETUP.md`, `SUPABASE_SETUP.md`, `CHANGELOG.md`

### New features
- **Cookie consent banner** (`CookieBanner.jsx`) — GDPR-compliant, appears on first visit, Accept/Decline with expandable detail, stores choice in localStorage, initialises GA4 on accept, links to Privacy Policy
- **Privacy Policy page** (`/privacy`) — full policy: data collection, cookies, third parties (Supabase, Anthropic, Razorpay, GA4, Mailchimp), user rights, children, changes
- **Google Analytics GA4** — script in `public/index.html` with `G-XXXXXXXXXX` placeholder. Replace with real ID from analytics.google.com. Events: `meal_generated`, `email_capture`
- **Goal-based Premium Meal Plans** (`/plans`) — 6 curated plans: Weight Loss, Muscle Gain, Family Friendly, Budget Meals, Vegetarian Week, 15-Minute Meals. Each generates AI-optimised 7-day plan via planner API with goal-specific prompt. Premium-gated
- **Animated Jiff logo** (`JiffLogo.jsx`) — pulsing lightning bolt, optional spinning ring (activates during loading). Sizes: sm/md/lg. Used in Jiff.jsx (spins while generating) and Landing
- **Latency warning** — `LoadingView` component: after 10 seconds shows "Taking a little longer than usual (Ns)…"

### Fixes
- **Snack → Snacks** — corrected in `MEAL_TYPE_OPTIONS` in Jiff.jsx, Planner.jsx, and all 4 i18n files (en/hi/ta/es)
- **Sidebar preferences** — removed "Units" row, added "Allergies" and "Cuisines" from user profile
- Privacy link added to Landing footer
- Plans nav link added to Landing and Jiff header (premium users only)
- GA4 `meal_generated` event fired after each successful generation

### New documents
- `MAILCHIMP_SETUP.md` — Mailchimp account setup, 3-email automation, API endpoint code, troubleshooting

---

## v14 — Meal History, Email Capture, Global Payments Messaging
**Files changed:** `api/meal-history.js` (new), `src/pages/History.jsx` (new), `src/App.jsx`, `src/pages/Jiff.jsx`, `src/pages/Landing.jsx`, `src/pages/Pricing.jsx`, `vercel.json`, `tests/jiff.spec.js`, `SUPABASE_SETUP.md`, `.env.example`

### New features
- **Meal history** — every generation auto-saved to Supabase (last 30 per user). New `/history` page with search, filter by meal type, stats row (sessions, recipes seen, cuisines tried, streak), expandable cards showing full recipe + ingredients used, "Cook again" button pre-fills the app, delete individual entries
- **Email capture** — new section on landing page with email input and "Notify me ⚡" button. Stores to `localStorage` as `jiff-email-subs`, ready to connect to Mailchimp/ConvertKit
- **Payments — coming soon** — unified "Paid plans launching soon" block for all countries. Mentions Razorpay onboarding in progress, collects waitlist emails to `jiff-global-waitlist`, 7-day free trial still active

### Fixes
- Removed all "Tamil Nadu" regional references — app is now correctly positioned as India & global
- Updated hero copy to reflect global audience
- Added `SUPABASE_SERVICE_ROLE_KEY` requirement to `.env.example` and setup guide
- Added `meal_history` table SQL to `SUPABASE_SETUP.md`

### E2E tests
- 14 tests (up from 12)
- New: email capture stores to localStorage and shows confirmation
- New: history page loads without error
- New: pricing shows coming soon and blocks live checkout
- New: waitlist email submission works
- New: landing page must not contain "Tamil Nadu"

---

## v13 — Mandatory Sign-in, Meal Types, Servings, 5 Recipes, Trial, Planner Fix
**Files changed:** `api/suggest.js`, `api/planner.js`, `src/contexts/PremiumContext.jsx`, `src/pages/Jiff.jsx` (major rewrite), `src/pages/Planner.jsx` (full rewrite), `src/pages/Landing.jsx`, `src/App.jsx`

### New features
- **Mandatory sign-in** — full-screen auth overlay for unauthenticated users; cannot access app without signing in. Shows 4 benefit pills, Google + magic link options
- **Meal type selector** — Breakfast 🌅, Lunch ☀️, Dinner 🌙, Snack 🍎, Any. AI generates meal-appropriate recipes per type
- **Servings on input card** — −/+ counter sets default serving size before generation. All returned recipes sized accordingly
- **5 recipes per generation** — up from 3. Free trial gets 1 (preview), paid gets 5
- **7-day free trial** — starts on first sign-in. Trial countdown shown in sidebar. After expiry: hard gate with plan selector, no skip button
- **Compact 2-column layout** — input form on left, sidebar on right showing: trial countdown, profile preferences (spice/diet/skill/units/cuisines), language+units toggles, Week Planner shortcut. Users don't need to scroll past saved preferences
- **Planner blank page fix** — full rewrite of `Planner.jsx`. Root cause was component structure causing silent crash on render

### Planner enhancements
- Meal type multi-select — pick any combination (just breakfast+dinner, all four, etc.)
- Servings per meal selector
- 13 cuisines in planner (up from 7)
- Language + units passed to planner API

### API changes
- `api/suggest.js` — accepts `mealType`, `defaultServings`, `count` (1 for trial, 5 for paid)
- `api/planner.js` — accepts `mealTypes[]` array, `servings`

### E2E tests
- 12 tests
- New: auth gate blocks unauthenticated access
- New: planner blank page regression test
- New: serving scaler updates quantities
- New: step timer starts and shows countdown
- New: 5 recipe cards returned

---

## v12 — Multi-currency Pricing, 13 Cuisines, Imperial Units, i18n
**Files changed:** `src/contexts/LocaleContext.jsx` (new), `src/i18n/` (new — en/hi/ta/es), `api/suggest.js`, `api/planner.js`, `src/pages/Jiff.jsx`, `src/pages/Pricing.jsx`, `src/pages/Landing.jsx`, `src/App.jsx`

### New features
- **Multi-currency pricing** — `LocaleContext` detects country from browser locale. India → ₹ INR via Razorpay. US/UK/AU/SG/CA → local currency via Stripe. Country dropdown on pricing page for manual override
- **13 cuisines** — added Japanese 🇯🇵, Korean 🇰🇷, American 🇺🇸, Middle Eastern 🌙, French 🇫🇷, Brazilian 🇧🇷 (up from 7)
- **Imperial units toggle** — metric/imperial per user preference. Passed to AI prompt — generates cups/oz/lbs instead of grams/ml. Persists in localStorage and Profile page
- **4-language localisation** — English, हिन्दी (Hindi), தமிழ் (Tamil), Español (Spanish). Full UI translation via `src/i18n/`. AI generates recipes in chosen language. Language dropdown in input card and Profile page

### Architecture
- `src/contexts/LocaleContext.jsx` — language, units, currency, cuisine/diet/time options all in one provider
- `src/i18n/en.js`, `hi.js`, `ta.js`, `es.js` — full translation files
- `translate()` helper with variable interpolation: `t('key', { name: 'Sri' })`
- `CURRENCY_MAP` — per-country currency code, symbol, plan prices, payment gateway

---

## v11 — Phase 4 Freemium Paywall, Razorpay, Pricing Page
**Files changed:** `api/create-order.js` (new), `api/verify-payment.js` (new), `src/contexts/PremiumContext.jsx` (new), `src/pages/Pricing.jsx` (new), `src/pages/Jiff.jsx`, `src/pages/Landing.jsx`, `src/App.jsx`, `vercel.json`

### New features
- **Freemium paywall** — 5 free meal suggestions/day, 1 weekly plan/month. Usage tracked in localStorage with daily reset
- **Razorpay payments** — server-side order creation (`api/create-order.js`), HMAC signature verification (`api/verify-payment.js`). Secret key never exposed to browser
- **3 paid tiers** — Monthly ₹99, Annual ₹799 (Save 33%), Lifetime ₹2,999
- **Pricing page** (`/pricing`) — plan selector cards with MOST POPULAR badge, feature comparison table, bottom CTA
- **Upgrade gate modal** — appears when free limit hit. Inline plan selector, one-tap checkout. Cannot be dismissed after trial expires
- **Usage bar** — shows remaining free meals on results page with orange dots
- **⚡ Go Premium** button in header for non-premium users

### Vercel routing fix
- Added `{ "handle": "filesystem" }` + `{ "src": "/(.*)", "dest": "/index.html" }` to `vercel.json`
- Fixes 404 on all client-side routes after Google sign-in redirect

---

## v10 — Phase 3 Supabase Auth, Cloud Sync, Taste Profile, Pantry
**Files changed:** `src/lib/supabase.js` (new), `src/contexts/AuthContext.jsx` (new), `src/pages/Profile.jsx` (new), `src/App.jsx`, `src/pages/Jiff.jsx`, `src/pages/Landing.jsx`, `api/suggest.js`, `api/planner.js`, `package.json`, `.env.example`

### New features
- **Google sign-in** — Supabase Auth with OAuth redirect
- **Magic link email sign-in** — passwordless, no friction
- **Cloud sync favourites** — saves to Supabase `favourites` table. Merges localStorage favourites on first sign-in
- **Saved pantry** — ingredients saved to Supabase `pantry` table, pre-fill ingredient input on every visit
- **Taste profile** — spice level (none/mild/medium/hot/extra hot), allergies, preferred cuisines, cooking skill level. Stored in `profiles` table. AI prompt personalised per user
- **Profile page** (`/profile`) — manage all preferences, pantry, view account info, sign out
- **Graceful guest fallback** — all features work without Supabase env vars (localStorage only). Sign-in UI hidden when Supabase not configured
- **Auth prompt banner** — appears after first meal generation for guests (dismissable)

### Database tables (run SQL in Supabase)
- `profiles` — id, email, name, avatar_url, spice_level, allergies[], preferred_cuisines[], skill_level
- `pantry` — user_id (unique), ingredients[]
- `favourites` — user_id, meal (jsonb), saved_at

### Copy fixes
- All "dinner" references → meal-agnostic ("Any meal", "meals sorted")
- Service worker logs: "FridgeMind" → "Jiff"

---

## v9 — Step Timers on Recipe Steps
**Files changed:** `src/pages/Jiff.jsx`

### New features
- **Tap-to-start step timers** — every recipe step with a cooking time gets a timer pill automatically
- **Time parser** — handles: "5 minutes", "10-15 mins" (midpoint), "1 hour 30 minutes", "half an hour", "45 seconds"
- **Three timer states:**
  - Idle — orange `⏱ 05:00` pill, tap to start
  - Active — SVG ring progress, digital countdown, pulse animation, ⏸ pause + ↺ reset buttons
  - Done — 🔔 bell shake animation, device vibration on mobile
- Multiple timers run simultaneously across different steps
- `StepTimer` and `StepWithTimer` components are fully self-contained

---

## v8 — Serving Size Scaler
**Files changed:** `src/pages/Jiff.jsx`

### New features
- **Serving scaler** — −/+ buttons in every expanded recipe card. Scales 1–20 people
- **Smart quantity parser** — handles integers, decimals, Unicode fractions (¼ ½ ¾ ⅓ ⅔ ⅛), slash fractions (1/3), whole+fraction combos (1½), ranges. Outputs nice fractions (not 1.5 but 1½)
- **Nutrition scales** too — calories, protein, carbs, fat all recalculate per serving count
- **Orange highlights** on changed quantities so users see at a glance what shifted
- **Scaler bar** — warm orange strip above ingredients with multiplier badge (e.g. ×3)
- Serving count shown in card meta: "👥 4 servings (was 2)"
- Ingredients without quantities (e.g. "a pinch of pepper") left unchanged

---

## v7 — Save Favourites with localStorage Persistence
**Files changed:** `src/pages/Jiff.jsx`

### New features
- **Heart button** on every meal card — hollow when unsaved, fills red with pop animation when saved
- **Favourites panel** — slides in below header when ❤️ Favourites button clicked. Shows all saved meals as full interactive cards (expand, share, grocery list all work inside panel)
- **localStorage persistence** — key `jiff-favourites`. Survives browser close, page refresh, app reinstall
- **Header button** — shows count badge (e.g. `❤️ Favourites 3`), turns red when meals saved
- **`MealCard` component** refactored — shared between results view and favourites panel, so both have identical full feature sets
- Saved meals include timestamp — sorted by most recently saved

---

## v6 — Weekly Meal Planner
**Files changed:** `src/pages/Planner.jsx` (new), `api/planner.js` (new), `src/App.jsx`, `src/pages/Landing.jsx`, `src/pages/Jiff.jsx`, `vercel.json`

### New features
- **Week planner** (`/planner`) — generates 7 days × 3 meals (21 total) in one API call
- **7-column calendar grid** — colour-coded by meal type (orange=breakfast, green=lunch, purple=dinner). Tap any meal to expand inline with full recipe
- **Loading screen** — 7 day pills tick green one by one as plan generates (~15 seconds)
- **Mobile day tabs** — single-day view on mobile with Mon/Tue/Wed... tabs
- **Weekly grocery list** — all 21 meals deduplicated, categorised (Proteins/Vegetables/Grains/Dairy/Pantry/Other), tickable shopping list, copy + WhatsApp share
- **Share week** — WhatsApp/copy formatted 7-day meal name summary
- **Regenerate button** — fresh week without going back to input
- Landing page nav updated with "📅 Week plan" button

---

## v5 — Full Rebrand to Jiff
**Files changed:** `src/pages/Landing.jsx`, `src/pages/Jiff.jsx`, `public/manifest.json`, `public/index.html`, `src/serviceWorkerRegistration.js`, all icons regenerated

### Changes
- **Name:** FridgeMind → Jiff ("meals in a jiff" — blend of Jam + Riff)
- **Tagline:** "Meals in a Jiff"
- **Colours:** Vivid orange-red `#FF4500`, deep ink `#1C0A00`, warm cream `#FFFAF5`
- **Fonts:** Fraunces (serif, 900 weight) + DM Sans
- **Logo mark:** ⚡ lightning bolt
- **Voice:** Snappy, confident, no-fluff, slightly cheeky
- New landing page built from scratch with hero, stats bar, how-it-works steps, problem section, feature grid, final CTA, footer
- PWA manifest updated with new name, theme colour, icons

---

## v4 — Grocery List Generator
**Files changed:** `src/pages/Jiff.jsx`

### New features
- **Grocery list** — compares recipe ingredients against fridge contents using fuzzy matching
- Shows "Need to buy" (amber, checkable) vs "Already in fridge" (green)
- Fuzzy matching: strips quantities/units/prep notes, matches substrings and word-level ("garlic" matches "garlic powder")
- Copy list to clipboard
- WhatsApp share with formatted shopping list
- Triggered by "What do I need to buy?" dashed button on each card

---

## v3 — Share Button + WhatsApp Integration
**Files changed:** `src/pages/Jiff.jsx`

### New features
- **Share drawer** on each meal card — slides open with animation
- **WhatsApp** — pre-formatted recipe message with `wa.me` link
- **Copy text** — full recipe copied to clipboard with ✓ feedback
- **Web Share API** — native share sheet on mobile (falls back gracefully)
- Share text includes: meal name, time, servings, description, top 6 ingredients, first 3 steps, nutrition

---

## v2 — Cuisine Filter + PWA
**Files changed:** `src/pages/Jiff.jsx`, `public/manifest.json`, `public/sw.js`, `src/index.js`

### New features
- **7 cuisine filters** — Any 🌍, Indian 🇮🇳, Italian 🇮🇹, Chinese 🇨🇳, Mexican 🇲🇽, Mediterranean 🫒, Thai 🇹🇭. AI prompt enforces authentic cuisine per selection
- **PWA (Progressive Web App)** — installable on Android and iOS home screen
  - `manifest.json` with all icon sizes (72×72 to 512×512)
  - Service worker with app shell caching
  - `apple-touch-icon` for iOS
  - Theme colour `#FF4500`
  - Full-screen display mode

---

## v1 — Core AI Meal Suggester (FridgeMind)
**Files created:** All files. Initial build.

### Features
- **Ingredient tag input** — type ingredients, press Enter to add as tags, Backspace to remove
- **Time filter** — 15 min / 30 min / 1 hour / No limit
- **Dietary filter** — None / Vegetarian / Vegan / Gluten-free / Dairy-free / Low-carb
- **AI meal generation** — calls `/api/suggest` (Vercel serverless) → Anthropic Claude API → returns 3 meals as JSON
- **3 meal cards** — emoji, name, time, servings, difficulty, description, ingredients, steps, nutrition (calories, protein, carbs, fat)
- **Secure API proxy** — `ANTHROPIC_API_KEY` stored in Vercel env vars, never exposed to browser
- **Responsive design** — Fraunces + DM Sans, `#FF4500` brand colour
- **Error handling** — connection errors, API failures, empty responses all handled with friendly UI
- **Loading state** — spinner with rotating facts

### Tech stack
- React 18, React Router v6
- Vercel serverless functions (Node.js)
- Anthropic Messages API (`claude-opus-4-5`)
- CSS-in-JS (inline styles + `<style>` tag)
- Deployed on Vercel, code on GitHub

---

## Razorpay Setup — Pending Steps

To activate real payments for India users:

1. **Complete KYC** — razorpay.com → Dashboard → Activate Account → submit PAN, bank account, business details
2. **Get live keys** — Settings → API Keys → Generate Live Key (after KYC approval)
3. **Add to Vercel** — `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `REACT_APP_RAZORPAY_KEY_ID` as environment variables
4. **Enable international cards** (optional) — Dashboard → Settings → International Payments → submit activation request (2–3 days)
5. **Test flow** — use `rzp_test_` keys locally first with test card `4111 1111 1111 1111`
6. **Webhook** (recommended) — Dashboard → Webhooks → add `https://your-app.vercel.app/api/verify-payment` for `payment.captured` event

Once live keys are in Vercel and redeployed, the "Coming soon" block on `/pricing` should be replaced with the live Razorpay checkout button.

---

## Environment Variables Reference

| Variable | Where used | Required |
|---|---|---|
| `ANTHROPIC_API_KEY` | `api/suggest.js`, `api/planner.js` | Yes |
| `REACT_APP_SUPABASE_URL` | `src/lib/supabase.js` | For auth/sync |
| `REACT_APP_SUPABASE_ANON_KEY` | `src/lib/supabase.js` | For auth/sync |
| `SUPABASE_SERVICE_ROLE_KEY` | `api/meal-history.js` | For history |
| `RAZORPAY_KEY_ID` | `api/create-order.js` | For payments |
| `RAZORPAY_KEY_SECRET` | `api/create-order.js`, `api/verify-payment.js` | For payments |
| `REACT_APP_RAZORPAY_KEY_ID` | `src/contexts/PremiumContext.jsx` | For payments |
| `PLAYWRIGHT_BASE_URL` | GitHub Actions E2E tests | For CI |

---

## Release checklist — mandatory for every version

Before zipping and shipping any release, verify all three doc files are updated:

**CHANGELOG.md** (this file)
- New version section at the top
- Files changed listed
- New features described
- Fixes listed
- E2E test count and new tests named

**SUPABASE_SETUP.md**
- Phase 1 SQL always present (profiles, pantry, favourites)
- Phase 2 SQL always present (meal_history)
- Troubleshooting table current
- Environment variable reference current

**SETUP.md**
- Prerequisites current
- All environment variables listed with sources
- Project structure reflects actual file tree
- Razorpay pending steps current
- CI/GitHub Actions instructions current

> These three files ship in every zip. A release is not complete without them.
