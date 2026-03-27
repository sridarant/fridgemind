# Jiff v16.6 — Release Notes
**Released:** March 2026  
**Package version:** 1.16.6  
**Live:** https://jiff-ecru.vercel.app

---

## What's in this release (cumulative from v16.0)

### Core features delivered
- AI recipe generation (Claude claude-sonnet-4-20250514) — 5 recipes per search, full recipe with steps, nutrition, timers
- 10 languages: English, हिन्दी, தமிழ், తెలుగు, ಕನ್ನಡ, বাংলা, मराठी, Español, Français, Deutsch
- 28 cuisines — Indian regional (Tamil Nadu, Kerala, Andhra, Karnataka, Punjabi, Mughlai…) + 13 global
- 3 fridge input modes: photo upload (Claude Vision), text autocomplete, pantry pre-fill
- Grocery list with Blinkit ordering (India only), WhatsApp share, copy
- Weekly meal planner (7-day, 21 meals)
- Goal plans (Weight loss, Muscle gain, Family meals, Budget)
- Meal history with localStorage + Supabase sync
- Favourites with cloud sync
- Taste profile — food type, cuisine preferences, spice level, allergies, pantry
- Dietary preference — Vegetarian/Non-veg/Vegan/Jain/Halal/Kosher/Pescatarian
- Premium system — 7-day trial, monthly/annual/lifetime plans, Razorpay (India) + Stripe (global)
- Country rollout — IN/SG/GB/AU/US live; coming-soon page + waitlist for others
- Pricing in local currency (₹/S$/£/A$/$)
- PWA — installable, offline-capable
- Supabase auth — Google OAuth + magic link email

### Technical
- React 18 + React Router v6 + Vercel serverless
- Full i18n via LocaleContext — every visible string translatable
- Error boundary — friendly error screen with Back to app + Report issue
- Session security — auto-logout on tab close + visibilitychange
- Admin page (/admin, key: jiff-admin-2026) — stats, waitlist, feedback, tools
- Real stats API (/api/stats) — live Supabase data, 5-min cache
- vercel.json — modern rewrites format (no legacy builds warning)

### Known pending items
- Razorpay KYC not complete — payments show "Coming soon"
- i18n: full native translations for fr/de/bn/te/kn/mr (currently English fallback)
- Stats page weekly trend uses session-level data (no week-over-week comparison yet)
- Admin feedback tab requires Supabase Phase 3 SQL to be run

---

## Critical bugs fixed in v16.6
1. **Recipe generation crash** — MealCard + ShareDrawer called t() without useLocale() hook
2. **Favourites crash** — same root cause as above
3. **/api/stats `forEach` crash** — Supabase error objects aren't arrays; added safeArray() helper
4. **History not loading** — key mismatch: saved as `meals`, read as `meal`
5. **Week Plan not loading** — toggleType + handleSubmit functions deleted by cleanup
6. **Country flag showing as orange circle** — flag emoji at fontSize:20 without orange background

## Supabase requirements
Run phases 1–3 SQL from SUPABASE_SETUP.md. Required env vars:
- ANTHROPIC_API_KEY
- REACT_APP_SUPABASE_URL
- REACT_APP_SUPABASE_ANON_KEY  
- SUPABASE_SERVICE_ROLE_KEY
