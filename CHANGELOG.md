## v1.22.0 — 2026-04-04

### Major: v22 — UX Redesign

**Navigation**
- Bottom tab bar (mobile): Home · Discover · Favourites · Profile
- "← Home" button on all non-home pages, standardised label
- Profile dropdown: Profile · History · Insights · Send feedback · Sign out
- Insights moved inside Profile — removed from separate header link

**Journey tiles — full redesign**
- Weather banner always visible at top with smart contextual suggestion
- RIGHT NOW group (2-row): Fridge · Mood · Seasonal / Goal · Order in
- COOKING FOR group: Family meal (1-tap) · Kids lunchbox · Hosting guests (1-tap)
- [+ More] toggle: Little Ones (Dishes for kids, Little Chefs) · Plan ahead (Week plan, Leftover rescue) · Traditions (Sacred Kitchen)
- Mood selector: 5 moods in bottom sheet, each maps to cuisine + complexity + time
- Order in: India-only bottom sheet with Swiggy · Zomato · Blinkit deep links

**Discover tab (new)**
- In Season Now: seasonal produce by month, tappable recipe suggestions
- Coming Up: festival calendar with traditional dish suggestions
- Explore a Region: weekly rotating regional Indian cuisine spotlight (12 regions)
- You Haven't Tried: personalised gap detection from meal history
- Trending This Week: static curated list (data-driven in future)
- Option 2 architecture: page loads without API call, generation fires on tap only

**Recipe card — full redesign**
- Tab layout: Ingredients · Method · Grocery
- Video embedded inline (YouTube iframe, loads on tap, no autoplay)
- Method: inline step timers + "Focus on this step" per step
- Cook Mode removed — replaced by Focus step
- Rating visible in collapsed card header
- Scale control always accessible in action bar

**Onboarding — 3-screen first-time setup**
- Screen 1: Diet preference (6 options)
- Screen 2: Cooking for (Just me / Partner / Family) + kids ages if family
- Screen 3: Spice level + cuisine preferences (optional, skippable)
- Saves to Supabase profiles table
- Never shown again after completion

**Supabase — Phase 8 complete**
- profiles: streak, last_cooked_at, is_premium, premium_expires_at, trial_started_at, premium_plan, mood_history, behaviour_signals
- meal_history: rating, cooked_at
- usage_counts table: per-day recipe count per user
- updateStreak writes to profiles.streak via /api/admin?action=update-streak
- Rating writes to meal_history.rating via /api/admin?action=update-rating

**New files**
- src/lib/discover.js — Discover page logic (seasonal, festival, region, personalisation)
- src/lib/festival.js — Extended: 12-month seasonal data, 12 regional cuisines, 4 exports
- src/components/common/BottomNav.jsx
- src/components/common/WeatherBanner.jsx
- src/components/common/MoodSelector.jsx
- src/components/common/OrderInSheet.jsx
- src/components/common/SeasonalCard.jsx
- src/pages/Onboarding.jsx
- src/pages/Discover.jsx

**Prompt optimisations**
- ~200 token reduction per generation call
- Mood context: single sentence injection
- Weather context: temp + condition only (not prose)
- Cuisine sent as code not full label list

# Jiff — Complete Release History

AI-powered meal suggester. Live at https://jiff-ecru.vercel.app
GitHub: https://github.com/sridarant/fridgemind

> **Release rule:** Every release must update CHANGELOG.md, SUPABASE_SETUP.md, SETUP.md, and any relevant docs before shipping. Never overwrite history — always prepend new versions.

---

## v19.0 -- Technical Docs tab, Investor deck, auth fixes, Kids Meals overhaul
**Date:** March 2026  |  **Package:** 1.19.0

### Admin Portal — Technical Documentation tab (new)
- Full technical documentation embedded in Admin → Documentation → Technical Docs
- 8 reusable components with full props table and JSX usage examples
- 3 context providers with all exported values documented
- 9 serverless API functions with route, file, and description
- Design token system (colour palette, typography)
- 3 annotated data flow diagrams (recipe generation, kids meals, sign-in)
- 13 routes/pages reference table
- Complete environment variables table (13 vars, scope, requirement)
- Pages and architecture overview with request flow diagram

### Investor Deck — Complete rebuild
- 12 slides rebuilt from scratch with pptxgenjs
- Jiff orange/dark professional palette throughout
- Updated to v18.9 stats (90 tests, 13 pages, 9 APIs, 28 cuisines, 10 languages)
- Kids Meals, GA4 live, email drip, WhatsApp all reflected
- Pitch write-up (jiff-pitch.md) included

### Authentication fixes
- SignOut now navigates to homepage (was staying on /app)
- Sign-in gate X close button navigates to / (was keeping unauthenticated user on /app)
- Landing Try free -> close gate -> back to homepage (no bypass)

### Kids Meals — full overhaul
- Profile dietary (food_type, allergies, spice_level, preferred_cuisines) now all used
- Age-specific hard constraints per group (toddler/kids/preteen)
- Spice overridden to age-safe level regardless of profile setting
- Explicit anti-repetition rule in prompt (no Dal Tadka, no plain rice)
- Mode-specific AI instructions properly differentiate cook-for-kids vs kids-cook
- Response parsing handles both {meals:[]} and flat array formats

---

## v19.0 -- Technical Docs, Deck, Kids Meals fix, auth gate, signOut
**Date:** March 2026  |  **Package:** 1.19.0

### Admin Portal — Technical Documentation tab
- New Technical Docs tab in Admin sidebar (Documentation group)
- 8 UI component docs: IngredientInput, JiffLogo, FamilySelector, FridgePhotoUpload, SmartGreeting, FeedbackWidget, CookieBanner, ErrorBoundary
- Each component has: description, props table (name/type/description), usage example
- 3 context provider docs: AuthContext, PremiumContext, LocaleContext with all exported values
- 9 API function reference table (file, route, description)
- Design tokens, typography system documentation
- 3 annotated data flows: Recipe Generation, Kids Meals, Sign-in
- 13-route pages & routes reference
- 13-variable environment vars table with scope and requirement level

### Investor Deck — rebuilt from scratch
- 12 slides with Jiff orange/dark palette (pptxgenjs)
- Updated with v18.9+ stats, Kids Meals, GA4, email drip, all features
- Includes: Cover, Problem, Solution, Product, Market, Traction, Business Model, Why Now, Competitive, Roadmap, The Ask, Closing
- PITCH.md pitch write-up document included in project

### Bug fixes
- SignOut now navigates to homepage (/) after signing out
- Auth gate close (X) now navigates to homepage instead of showing app unauthenticated
- Pricing page Back/nav is auth-aware: user gets /app, guest gets /
- Kids Meals generate now uses profile dietary + preferred_cuisines + allergies
- Kids Meals: age-specific safety constraints (toddler/kids/preteen)
- Kids Meals: explicit anti-repetition rule (no Dal Tadka / plain rice)
- Kids Meals: mode-specific AI instructions properly differentiated

---

## v18.4 -- Fix Insights.jsx build error
**Date:** March 2026  |  **Package:** 1.18.4

### Fix
- Insights.jsx: async `loadData` function was missing its closing `}` and `loadData()` call,
  causing ESLint error "Missing initializer in destructuring declaration" at line 141.
  Introduced when the Supabase fallback block was added in v18.2.

---

## v18.3 -- Admin sidebar nav, Home button, Supabase cleanup
**Date:** March 2026  |  **Package:** 1.18.3

### Admin portal -- redesigned navigation
- Replaced cluttered 14-tab header with a clean **sticky left sidebar**
- Tabs grouped into 5 logical sections:
  - **Dashboard** -- Overview
  - **Users & Feedback** -- Users, Waitlist, User Feedback, Crashes
  - **Releases & Build** -- Releases, CI/CD, Tests
  - **Platform** -- Status, Tools, API Usage
  - **Documentation** -- Tech Stack, Security, Config
- **Home button** -- appears in top bar when not on Overview; click to return to admin dashboard (does not exit admin)
- **Exit button** -- dedicated "Exit" in top bar to leave admin and return to the app
- Breadcrumb label shows current section name next to the Jiff Admin logo
- Active item highlighted with orange left border and subtle tint

### Admin Tools -- Supabase status removed
- Supabase status card removed from Tools tab
- Supabase connectivity is available under the Status tab

### App header nav order
- Already in correct order: Week Plan > Goal Plan > Little Chefs > Insights

---

## v18.2 -- Crash fixes, sign-out, Supabase insights, cross-navigation
**Date:** March 2026  |  **Package:** 1.18.2

### Critical crash fixes
- **e.map is not a function** -- guarded all three crash points:
  - `setMeals(data.meals)` now wraps with `Array.isArray()` before setting state
  - `favourites.map()` -- guarded in favs-grid render
  - `notifications.map()` -- guarded in both markAllRead and render
- **Sign Out not working** -- `signOut` was missing from the `useAuth()` destructure in Jiff.jsx; clicking Sign Out now works correctly

### Insights -- loads from Supabase when localStorage is empty
- Insights previously only read from localStorage (browser cache)
- After clearing browser cache or opening on a new device, Insights appeared blank
- Now: if localStorage is empty AND user is signed in, fetches from `/api/meal-history`
- History, ratings, and all profile data are already saved to Supabase -- Insights now uses that
- localStorage remains as a fast cache layer

### localStorage vs Supabase -- what lives where
- **Supabase (persistent, cross-device):** meal history, ratings, favourites, pantry, profile preferences (food type, spice, allergies, cuisines, family members, nutrition goals)
- **localStorage (cache/device):** streak, notification read state, premium status (for speed), admin releases list, language/unit preference
- Phase 5 SQL updated: added `lang` and `units` columns to profiles table for full cross-device preference sync

### Cross-navigation between plan pages
- **Week Plan** header: Goal Plan + Little Chefs links; "Back to App" renamed
- **Goal Plan** header: Week Plan + Little Chefs links; "Back to App" renamed
- **Little Chefs** header: Week Plan + Goal Plan links; "Back to App" renamed
- All plan pages now form a connected hub -- easy to switch between them

### Header nav order
- Little Chefs now appears before Insights in the header (logical grouping of plan pages)

---

## v18.1 — UX fixes, Little Chefs, Admin overhaul
**Date:** March 2026  |  **Package:** 1.18.1

### Bug fixes
- **Sign-in gate** — added ✕ close button; users can now read the landing page before signing in
- **Notification panel** — added ✕ close button; no longer requires click-outside to dismiss
- **History removed from header** — Profile history is sufficient; header is cleaner
- **Plans.jsx food_type** — now uses `getDietaryLabel()` — no more `["veg"]` raw JSON display
- **Profile food type highlight** — `useEffect` syncs local state from server profile after save; selection now stays highlighted
- **Cuisine persistence** — preferred cuisines saved to `localStorage('jiff-pref-cuisines')` and restored on refresh
- **Ingredient translator** — `onBlur` no longer auto-adds term while translating; translate button always visible when input has text
- **Insights empty state** — clear message explaining what insights will show; no longer looks broken after cache clear

### 👨‍🍳 Little Chefs (new page — /little-chefs)
- Age-group selector: Toddlers (1–3), Kids (4–8), Pre-teens (9–12)
- Meal types: Breakfast, Lunch, Dinner, Snack, School Tiffin
- Fun fact for kids about a main ingredient in each recipe
- Nutrition info per serving
- Kid-specific prompt via `kidsMode` + `kidsPromptOverride` in `/api/suggest`
- Linked from header nav

### Admin Portal overhaul
- **🟢 Status tab** — service health for Vercel, Supabase, Anthropic API, Razorpay, WhatsApp with live badge
- **🔄 CI/CD tab** — 8-step pipeline diagram (push → ESLint → build → deploy → CDN), GitHub Actions info
- **🧪 Tests tab** — 90 test breakdown by feature range, how-to-run commands
- **💬 User Feedback** — category filter chips; filter by any category in one click
- **🚀 Releases** — manual entry form removed; auto-loaded from CHANGELOG (all 31 versions v1→v18.1); correct dates
- **Tools** — Supabase status removed (moved to Status tab)

### New files
- `src/pages/LittleChefs.jsx` — kids meal plan page
- `src/lib/dietary.js` — shared `getDietaryLabel` + `parseFoodTypeIds` utility

### Tests: 84 → 90

---

## v18.0 — Major release: Family mode, Insights, Delivery, Smart Recs, WhatsApp bot, Admin overhaul
**Date:** March 2026  |  **Package:** 1.18.0  |  **Supabase:** Run Phase 5 SQL

### 1. Family Mode
- New **👨‍👩‍👧 Family** tab in Profile — add family members with name + dietary preference
- Saved as `family_members JSONB` column in Supabase `profiles` table
- `FamilySelector` component appears on the main page when family members are set
- "Who's eating tonight?" chips — select individuals or leave as "Everyone"
- When members are selected, `suggest.js` merges all dietary restrictions (most restrictive wins)
- Example: Amma (Jain) + Appa (Non-veg) selected → recipes must be Jain-compliant

### 2. Meal Insights Dashboard (/insights)
- New page linked from header nav (📊 Insights)
- Five tabs: Overview, Cuisines, Nutrition, Ratings, Ingredients
- Overview: stat cards for total meals, sessions, streak, weekly activity, avg rating
- Cuisines: bar chart of all cuisines tried, sorted by frequency
- Nutrition: average calories and protein across all generated recipes
- Ratings: distribution chart with labels (Poor/Ok/.../Loved it!)
- Ingredients: most-used ingredients bar chart
- All data from `localStorage` — works offline, no Supabase needed

### 3. Grocery Delivery Integration
- "Order missing items" section at the bottom of the GroceryPanel
- Three quick-order buttons: **Blinkit**, **Zepto**, **Swiggy Instamart**
- Each opens the platform's search with all missing ingredients pre-filled
- Only shown when there are items in the "need to buy" list

### 4. Smart Recommendations
- Strip shown below results when user has rated ≥1 recipe 4+ stars
- "✨ Based on meals you loved" + count of high-rated recipes
- "Surprise me with something similar" button → calls `handleSurprise`
- Uses localStorage ratings — no server call

### 5. WhatsApp Bot
- New `api/whatsapp.js` — Meta WhatsApp Cloud API webhook
- Supports GET (webhook verification) and POST (incoming messages)
- Parses ingredients from natural messages: "Hi Jiff! rice, dal, onion"
- Returns formatted WhatsApp-markdown recipe using claude-haiku (fast, cheap)
- Handles unrecognised messages with a help message
- Full setup guide: `WHATSAPP_SETUP.md`
- Env vars required: `WHATSAPP_ACCESS_TOKEN`, `WHATSAPP_VERIFY_TOKEN`, `WHATSAPP_PHONE_NUMBER_ID`

### 6. Nutrition Goals
- Profile → Settings tab: **Daily nutrition goals** section
- Set daily calorie target (kcal) and protein target (g)
- Saved as `nutrition_goals JSONB` in Supabase `profiles`
- Recipe cards reflect goals for future comparison features

### 7. Admin — Feedback categorisation (crashes never lost)
- **💬 User Feedback** tab — shows only genuine user feedback (excludes crashes)
- **💥 Crashes** tab — dedicated tab for `category:'crash'` entries
  - Styled in red with monospace stack traces
  - CSV export: `jiff-crashes.csv`
  - "🎉 No crashes recorded" when clean
- User feedback and crash reports are now completely separate — neither gets buried

### 8. Admin — Release Tracker
- New **🚀 Releases** tab in Admin portal
- Log each deployment: version, title, status (Deployed/Draft/Rollback), summary
- Persisted to `localStorage('jiff-releases')` — available offline
- Timeline view with colour-coded status badges
- Refresh button to sync from localStorage

### Supabase — Phase 5 (run in SQL Editor)
See `SUPABASE_SETUP.md` → Phase 5. Summary:
```sql
alter table profiles add column if not exists family_members jsonb default '[]';
alter table profiles add column if not exists nutrition_goals jsonb default '{"calories":2000,"protein":80}';
```

### New files
- `src/pages/Insights.jsx` — meal insights dashboard
- `src/components/FamilySelector.jsx` — family member chips
- `api/whatsapp.js` — WhatsApp webhook
- `WHATSAPP_SETUP.md` — WhatsApp bot setup guide

### API functions: 9/12 (3 spare)

---

## v17.6 — Notifications, share dropdown, rating clarity, camera mobile-only, ingredient translator
**Date:** March 2026  |  **Package:** 1.17.6

### Notifications (🔔 bell in header)
- Bell icon added to header-right, before the avatar button (visible to logged-in users)
- Red unread badge showing count (max "9+")
- Panel shows three notification types:
  - **🔥 Achievements** — streak milestones (fires when streak ≥ 3)
  - **🌿 Tips** — contextual app tips
  - **📢 Broadcasts** — admin messages from Supabase `broadcasts` table
- "Mark all read" button in panel header
- Read state persisted in `localStorage('jiff-read-notifs')`
- Click-outside closes panel and marks all as read
- Unread items highlighted with orange dot and slightly bolder title

### Share button — single dropdown (removes duplicate)
- Two separate share buttons (header icon + rating row button) merged into one
- Single "📤 Share" button in the rating row with a dropdown containing:
  - 💬 Share on WhatsApp
  - 📋 Copy recipe text
  - 🖼️ Download image (1080×1080 PNG)
- Dropdown opens upward, click-outside closes

### Recipe rating — clearer context
- Label changed from generic "Rate this" to **"How was this recipe?"** before rating
- After rating: label changes to **"Your rating"** with the selected label (Poor/Ok/Good/Great/Loved it!)

### Camera — mobile only (fully hidden on desktop)
- Camera button now completely hidden on desktop browsers
- On mobile: "📷 Take photo" button with orange border triggers native camera
- "🖼️ Add photo" always shown on all devices
- No more tooltip — clean, no confusion

### Ingredient translator (🌐 in ingredient input)
- 🌐 button appears in the ingredient input when typed text has < 3 autocomplete matches
- Calls `/api/suggest?action=translate` using claude-haiku (fast, cheap)
- Returns: English name, local name, also known as, emoji, tip
- Example: "ponangani keerai" → "Sessile joyweed / Water amaranth" 
- Result card shows below dropdown with "+ Add" button
- Input auto-populates with English name for easy adding
- `lang` prop passed to IngredientInput so AI knows user's language context

### E2E tests: 67 → 72
- Test 68: Notification bell visible in header for logged-in user
- Test 69: Unread badge shows on bell
- Test 70: Single share button (no duplicate in header)
- Test 71: Camera button hidden on desktop
- Test 72: Translate button appears when input has text

---

## v17.5 — Definitive dietary display fix + camera mobile detection
**Date:** March 2026  |  **Package:** 1.17.5

### Root cause analysis

**Dietary garbled content — root cause:**
Previous attempts used an IIFE (`(() => { ... })()`) inside the `profilePrefs` array
literal. When this IIFE was not closed correctly in JS, React serialised the function
object itself as a string — producing garbled output. Additionally, even when the IIFE
ran correctly, it joined storage IDs like `'non-veg'` directly, not display labels like
`'Non-vegetarian'`.

**Camera opens folder — root cause:**
`capture="environment"` on `<input type="file">` is a **mobile-only browser API**.
On desktop, all browsers (Chrome, Firefox, Edge, Safari) silently ignore this attribute
and show the file picker. This is a web platform limitation — there is no way to open
the device camera via `<input>` on desktop. Previous fixes repeated the same approach.

### Definitive fixes

**Dietary display:**
- Removed the IIFE entirely. Replaced with `getDietaryLabel()` — a named module-level
  helper function defined once, outside the component, testable in isolation.
- `getDietaryLabel(food_type)` handles every known Supabase storage format:
  - JS array `['veg']` (supabase-js reading a `text[]` column)
  - JSON string `'["veg"]'` (text column storing a serialised array)
  - Postgres wire format `'{veg}'` or `'{"non-veg","veg"}'`
  - Plain string `'veg'`
- Maps all IDs to display labels via `DIETARY_LABELS` constant (also module-level)
- `profilePrefs` Dietary entry is now a single clean line: `getDietaryLabel(profile.food_type)`

**Camera / photo upload — complete rewrite of FridgePhotoUpload.jsx:**
- Added `isMobileDevice()` utility that checks `navigator.userAgent` for mobile signals
- `useEffect` sets `isMobile` state on mount — no SSR issues
- On mobile: 📷 "Take photo" button triggers `cameraRef` with `capture="environment"` → opens native camera
- On desktop: 📷 "Camera" button shows a tooltip "Camera works on mobile — use Add photo on desktop" (auto-dismisses after 3s)
- Camera button is styled with orange border on mobile to signal it works, grey on desktop
- "Add photo" button always works on all devices (file picker / gallery)
- Drag and drop still works on the surrounding zone
- No hidden state where desktop users expect camera but get file picker silently

### Code quality
- Zero syntax errors, zero stale variables across all 38 source files
- All `t()` calls verified to have `useLocale()` in scope
- 23/23 feature checks pass
- API: 8/12 serverless functions

### E2E tests: 64 → 67
- Test 65: Dietary in sidebar shows label text not IDs or JSON
- Test 66: Camera button shows tooltip on non-mobile (jsdom)
- Test 67: getDietaryLabel handles JS array, JSON string, Postgres format

---

## v17.4 — Clean pass: dietary card, nav chips, share card redesign, rating position
**Date:** March 2026  |  **Package:** 1.17.4

### UI Fixes
- **Dietary Preferences sidebar card removed** — the duplicate card in the main sidebar has been removed. Dietary details are shown in the "Your Preferences" card only.
- **Dietary value — Postgres text[] format** — `food_type` stored in Supabase as `{non-veg}` (Postgres curly-brace array format) now parses correctly. Handles all three formats: JS array, JSON string `["non-veg"]`, and Postgres `{non-veg}`.
- **Recipe rating moved to top** — star rating row now appears below the meal description (before the grocery trigger), so it's visible without expanding the card.
- **Planner header** — removed the redundant "📅 Week plan" active chip; only "Goal Planner" and "← Back to app" remain.
- **Goal Plans header** — "Custom planner" renamed to "📅 Week Plan".

### Share card — complete redesign
- 1080×1080 square (Instagram-ready)
- Rich dark radial gradient background with warm orange glow behind emoji
- Large centred meal emoji (200px)
- Auto-sizing meal name (bold uppercase, font shrinks to fit)
- Thin orange divider line
- 4 stat chips (time, calories, protein, difficulty) with rounded rect backgrounds
- Bottom branding strip with Jiff wordmark
- Downloads as PNG at 95% quality

### Code quality (deep review)
- Zero syntax errors across all 38 source files
- Zero stale variable references
- All standalone components with `t()` calls verified to have `useLocale()` hook
- `cameraRef` and `fileRef` both correctly declared in FridgePhotoUpload
- `pantryLoaded` and `pantryItems` confirmed in Plans.jsx
- LocaleContext `getLang()`, `getUnits()`, `getCurrentSeason()` all present
- ErrorBoundary wraps entire provider tree
- API: 8/12 functions (4 spare)

### E2E tests: 60 → 64
- Test 61: Dietary sidebar card not visible
- Test 62: Dietary "Your Preferences" shows clean text (not JSON/Postgres format)
- Test 63: Rating visible on card without expanding
- Test 64: Planner header has no duplicate Week plan chip

---

## v17.3 — Crash fixes, seasonal picker, camera, voice, rating, share card
**Date:** March 2026  |  **Package:** 1.17.3

### Crash fixes (identified from admin crash logs)
- **`t is not defined` in GroceryPanel** — `GroceryPanel` called `t('need_to_buy')` etc. but only destructured `country` from `useLocale()`, not `t`. Added `t` to the destructure.
- **`pantryLoaded is not defined` in Goal Plans** — `Plans.jsx` useEffect referenced `pantryLoaded` and `pantryItems` state that were accidentally removed during consolidation. Both `useState` declarations restored.
- **`getLang is not defined` in LocaleContext** — Root crash that caused the blank page. `getLang()` and `getUnits()` helper functions were deleted when `INDIA_SEASONAL` block was inserted. Both restored.

### Seasonal ingredient picker
- Tapping "In season" now opens a picker panel (not random-add)
- Shows 6 seasonal ingredient chips to choose from
- **"🥦 I have it"** — adds selected item to fridge
- **Blinkit / Zepto / Swiggy** — order links for all three delivery apps
- Click-outside overlay closes the picker

### Dietary preference — garbled characters fixed
- `food_type` stored in Supabase as `'["non-veg"]'` (JSON string) was being displayed raw
- Safe parsing: checks `Array.isArray` first, then `JSON.parse` if string starts with `[`, else wraps as plain string

### FridgePhotoUpload — Camera + Add photo
- **📷 Camera** button uses `capture="environment"` — opens device camera directly on mobile
- **🖼️ Add photo** button opens file picker / gallery
- Drag & drop still works on the surrounding area

### Voice input — now correctly placed
- 🎤 button sits inside the ingredient input box alongside the text input
- Was previously inserted at wrong DOM position in earlier session

### Recipe rating UI
- Stars now use `filter: grayscale(1)` for unselected, full colour for selected
- Labels appear on hover/click: Poor / Ok / Good / Great / Loved it!
- Separated from recipe body with a subtle top border

### Share card — 1080×1080px Instagram format
- Square canvas (1080×1080) for Instagram/WhatsApp status
- Subtle grid overlay pattern, large centred emoji, proper typography hierarchy
- Stats row with time, calories, protein
- Orange accent bar at top, Jiff wordmark top-left, frosted branding footer

### Code quality
- Deep audit: 21/21 feature checks, zero syntax errors, zero stale variables
- All standalone React components that call `t()` verified to have `useLocale()` hook
- API function count: 8/12 (4 spare for future features)
- ErrorBoundary wraps entire provider tree — no more silent blank pages

### E2E tests: 52 → 60
- Test 53: GroceryPanel renders without crash
- Test 54: Goal Plans loads without pantryLoaded crash
- Test 55: Seasonal picker shows Blinkit/Zepto/Swiggy
- Test 56: Dietary sidebar shows clean text (no JSON chars)
- Test 57: Camera and Add photo buttons present
- Test 58: Voice input button visible inside ingredient box
- Test 59: Rating label appears after clicking star
- Test 60: All 8 pages load without JS errors

---

## v17.2 — API consolidation: 11 → 8 serverless functions
**Date:** March 2026  |  **Package:** 1.17.2

### Serverless function consolidation (Vercel Hobby: 12 fn hard limit)

| Before | After | Saving |
|---|---|---|
| `api/feedback.js` + `api/email-subscribe.js` | `api/comms.js` (?action=feedback\|email) | −1 |
| `api/create-order.js` + `api/verify-payment.js` | `api/payments.js` (?action=create\|verify) | −1 |
| `api/v1/suggest.js` | merged into `api/suggest.js` (?v=1) | −1 |

**Result: 11 → 8 functions (4 spare for future features)**

All existing routes preserved for backward compatibility via vercel.json rewrites:
- `POST /api/v1/suggest` still works (maps to `suggest.js?v=1`)
- All payment, feedback, and email flows unchanged for the frontend
- Public API docs updated: endpoint is now `/api/suggest?v=1` with `X-API-Key` header

No user-facing changes.

---

## v17.1 — Quick wins + medium features: Surprise me, ratings, voice, streaks, seasonal
**Date:** March 2026  |  **Package:** 1.17.1

### Quick wins

**"Surprise me" button**
- One-tap generation with zero input required
- Reads `profile.preferred_cuisines` and picks one at random
- Falls back to `pantry` items or current seasonal produce as ingredients
- Respects meal type (auto-detected from time of day), spice level, allergies
- Shown only when user is logged in with a profile

**Recipe star rating**
- 1–5 star rating on every recipe card with hover preview effect
- Saves to `localStorage('jiff-ratings')` immediately (key = meal name+emoji hash)
- Syncs to Supabase `meal_history.rating` column (PATCH) when user is signed in
- Visible on both recipe results and Favourites panel

**Share card — canvas PNG download**
- "📤 Share" button on every recipe card
- Generates an 800×450px canvas image: dark gradient background, recipe emoji, name, description, nutrition stats, "Made with ⚡ Jiff" branding
- Downloads as `jiff-dal-rice.png` for WhatsApp/Instagram sharing
- Runs entirely client-side — no server call

**Meal streaks**
- Tracks consecutive cooking days in `localStorage('jiff-streak')`
- Shows "🔥 N-day streak!" badge in the header area when streak ≥ 2
- Increments on every successful generation; resets if a day is skipped

### Medium features

**Voice input (Web Speech API)**
- 🎤 microphone button added to every IngredientInput box
- Uses `SpeechRecognition` / `webkitSpeechRecognition` with `lang: 'en-IN'`
- Parses comma or "and" separated items from speech (e.g. "chicken and onion and rice")
- Shows pulsing animation while listening; tap ⏹ to stop early
- Gracefully hidden if browser doesn't support Speech API

**Seasonal ingredient suggestions**
- `INDIA_SEASONAL` data for all 12 months added to LocaleContext (Tamil Nadu focused)
- `getCurrentSeason()` exported from LocaleContext — returns month, label, emoji, item list
- Green "In season: mango, watermelon…" chip in app header — tap to add one random seasonal item to fridge
- Surprise me also uses seasonal produce as fallback ingredients

**Smart pantry learning**
- After generation, cross-references recipe ingredients against saved pantry
- Shows "🧂 You may need to restock: turmeric, cumin" banner in results
- Dismissible with ✕; doesn't re-appear until next generation

### Supabase additions (Phase 4 — run in SQL Editor)
See `SUPABASE_SETUP.md` → Phase 4 for full SQL. Summary:
- `broadcasts` table (admin broadcast feature)
- `meal_history.rating` column (recipe ratings)

### E2E tests: 44 → 52
- Test 45: Surprise me button visible when profile set
- Test 46: Seasonal nudge "In season:" text appears
- Test 47: Star rating (☆) on recipe cards
- Test 48: Share button present on recipe cards
- Test 49: Streak badge shows when streak in localStorage
- Test 50: Voice input 🎤 button in fridge section
- Test 51: Rating click saves to localStorage
- Test 52: SUPABASE_SETUP.md Phase 4 documented

---

## v17.0 — India-only, profile-driven plans, avatar dropdown, CSS animation, admin overhaul
**Date:** March 2026  |  **Package:** 1.17.0  |  **Breaking:** yes

### Architecture changes
- **India-only release** — `guessCountry()` now returns `'IN'` unconditionally. All country detection, currency switching, Stripe/non-Razorpay payment paths, and non-IN gating removed from rendering logic. Blinkit shown unconditionally everywhere.
- **Planner / Plans no longer use fridge input** — both pages now generate from saved profile preferences (cuisines, dietary, spice, pantry). Users without preferences are redirected to Profile with a clear message.

### New features

**Week Plan (Planner.jsx) — complete rewrite**
- Profile-based generation: reads `preferred_cuisines`, `food_type`, `spice_level`, `allergies`, `skill_level`, `pantry` from AuthContext
- Multi-cuisine ratio selector: if user has 3 preferred cuisines, they assign days across them (e.g. 3 Tamil + 2 Karnataka + 2 Italian = 7 days). Submit locked until all 7 days assigned.
- "Goal Planner" link in nav header
- Blinkit order links on every grocery item
- Profile redirect if no preferences set

**Goal Plans (Plans.jsx)**
- Fridge/pantry input removed; replaced with profile preferences display card
- Shows cuisine, food type, spice, pantry count from profile
- Link to Profile if preferences not set

**CSS fridge animation** — loading state replaced with:
- Fridge door opening (CSS `perspective` + `rotateY` keyframe)
- Ingredients flying out to a plate (`translate` + `scale` keyframe)
- Steam puffs rising (`translateY` + opacity keyframe)
- No external library — instant load, works offline

**Avatar dropdown** — profile button replaced with:
- Orange initials circle (first letter of name)
- Dropdown with: Profile, Settings, History, Sign out
- Click-outside closes via overlay div
- Sign out styled in red, separated from nav items

**Cuisine card restructured**
- Removed "Indian ▸" submenu pattern — all cuisines flat and visible
- Two labelled groups: "🇮🇳 Indian Regional" and "🌐 International"
- No more `showIndianSub` state needed
- `pref-highlight` class shows user's saved preferences without selecting them

**3-column layout** — Meal Type / Servings / Time Available displayed as equal-width columns with individual card backgrounds

### Profile changes
- **Cuisine tab removed** — `TABS` array updated, cuisine tab JSX removed
- **Skill → Cooking Skill** — label updated in Profile, sidebar Your Preferences card, all display strings
- **Your Preferences sidebar** — now shows: Spice, Dietary (from food_type), Cooking Skill. Cuisines row removed.

### Admin overhaul (Admin.jsx + api/admin/)
- **Users tab** — loads profiles from Supabase via `/api/admin/users`, CSV export
- **Feedback tab** — loads from Supabase feedback table, CSV export
- **Tools: Reset trial** — POST to `/api/admin/reset-trial`, finds user by email, deletes trial record
- **Tools: Broadcast message** — POST to `/api/admin/broadcast`, stores in `broadcasts` Supabase table
- **API Usage tab** — shows total calls, today's calls, active keys from `api_keys` table
- **Toast notifications** — feedback for all tool actions
- All 5 admin endpoints: `api/admin/{users,feedback,reset-trial,broadcast,usage}.js`

### E2E tests: 40 → 44
- Tests 16-20: Planner profile-redirect, meal type, nav
- Tests 21-23: Goal Plans no fridge input, profile card
- Tests 33-37: Admin login, all tabs, reset trial, broadcast
- Test 38: Tamil translation fridge label
- Test 41: All 7 main pages load without JS errors

### Supabase additions needed for v17 admin features
Run in SQL Editor:
```sql
-- Broadcasts table (for admin broadcast feature)
create table if not exists broadcasts (
  id         uuid primary key default gen_random_uuid(),
  message    text not null,
  active     boolean default true,
  created_at timestamptz default now()
);
alter table broadcasts enable row level security;
create policy "broadcasts: read all" on broadcasts for select using (true);
create policy "broadcasts: service insert" on broadcasts for insert with check (false);
```

---

## v16.6 — Critical crash fix: recipe generation & Favourites
**Date:** March 2026

### Root Cause Analysis
Two standalone function components (`MealCard`, `ShareDrawer`) were calling `t()` — the i18n translation function — but neither had a `useLocale()` React hook. They sit outside the main `Jiff` component and cannot access its scope. Every time a recipe card rendered (after generation, or when Favourites opened), React threw `ReferenceError: t is not defined`, which the ErrorBoundary caught and displayed as "Something went wrong".

### Fixes
- **`MealCard`** — Added `const { t } = useLocale()` as first line of the component
- **`ShareDrawer`** — Added `const { t } = useLocale()` as first line of the component
- **Country flag circle** — Removed orange `background:'var(--jiff)'`. Now uses transparent background with subtle border. Flag emoji at `fontSize:20` renders correctly at full size.
- **Landing "3 Real recipes"** → `"5 Full recipes every single search"` (matches actual app behaviour)
- **SUPABASE_SETUP.md** — Complete rewrite: removed duplicate Phase 3 section, merged into one clean linear guide, added "Why Admin shows Phase 3 not complete" troubleshooting section with `/api/stats` test link.

### Analysis method
Deep scan of all top-level function components that call `t()` without a local `useLocale()` hook. Components affected: MealCard (calls `t('see_full_recipe')`, `t('servings_label')`, `t('recipe_ingredients')`, etc.), ShareDrawer (calls `t('share_title')`). GroceryPanel was already fixed in a prior session.

---

## v16.5 — i18n completion, History fix, cuisine multi-pref, profile nav
**Date:** March 2026

### Bug Fixes
- **History page crash** — `Jiff.jsx` saved history entries with key `meals` but `History.jsx` read `entry.meal`. Fixed: save key is now `meal` (matching Supabase schema). History render also has null-safe access: `filter(Boolean)` guards against undefined meal names.
- **Profile nav says "← App"** — Changed to "← Back to app" on Profile.jsx L63.
- **Cuisine only shows first preference** — Sidebar cuisine chips now show all preferred cuisines from profile with a distinct `pref-highlight` style (orange border + subtle orange background). Indian submenu also highlights preferred regional cuisines. The active (selected for this search) chip still uses full solid orange.

### i18n — Complete translation coverage
Added 30+ new translation keys across all 10 languages for every visible string in the main app that was previously hardcoded English:
- Fridge section: `fridge_label`, `fridge_sub`, `or_type_below`
- Pantry section: `pantry_label`, `pantry_sub`
- Grocery panel: `grocery_title`, `need_to_buy`, `in_fridge`, `what_to_buy`, `see_list`
- Recipe card: `see_full_recipe`, `collapse`, `recipe_ingredients`, `recipe_method`, `share_title`, `servings_label`
- Auth card: `auth_title`, `auth_perk_favs`, `auth_perk_taste`, `auth_send`
- Sidebar: `your_prefs`, `language_label`, `units_label`, `edit_prefs`
- Results: `favs_title`, `favs_empty_title`, `error_title_app`, `cta_note`
- Full translations in English, Hindi (hi), Tamil (ta). Other 7 languages use English fallback until native speakers review.

### Profile button
- Flag emoji scaled up with `transform:scale(1.3)` inside the circle so it fills the orange badge visually.

### Admin key
- Admin key is `jiff-admin-2026` — change this before production.

### E2E tests: 36 → 40
- Test 37: Tamil translation renders fridge label in Tamil
- Test 38: History page renders entries from localStorage (no crash)
- Test 39: Profile page has "Back to app"
- Test 40: Cuisine sidebar shows preferred cuisines highlighted

---

## v16.4 — Country rollout, admin, stability, session security, navigation
**Date:** March 2026

### Critical Fixes
- **Week Plan crash fixed** — `toggleType` and `handleSubmit` were completely missing from `Planner.jsx` (accidentally removed during a dead-code cleanup pass). Both functions fully restored with proper API call to `/api/planner`.
- **History not showing** — History now saves to `localStorage` (`jiff-history`) immediately on generation, independent of Supabase. History page merges localStorage + server data on load.
- **Favourites not responding** — Button was hidden behind `{user && ...}` guard. Now always visible; shows a sign-in prompt if unauthenticated.
- **Planner stale variable** — `setIngredients(pantry)` in pantry pre-fill replaced with `setPantryItems(pantry)`.
- **Profile pantry stale ref** — `pantryRef` useRef removed from Profile.jsx.

### New Features
- **Country rollout gating** — `ENABLED_COUNTRIES = ['IN','SG','GB','AU','US']` exported from LocaleContext. Pricing page shows a "Coming to your region soon" page with waitlist email capture for users outside these countries.
- **Admin page** (`/admin`) — Password-protected admin dashboard with Overview (stats), Waitlist management (CSV export), Feedback viewer, and Tools panel.
- **Real stats API** (`/api/stats`) — Pulls live data from Supabase (user count, meal count, country breakdown, cuisine trends, weekly activity). Falls back to preview data if Supabase not configured. Stats page shows ● Live / ● Preview badge.
- **Error boundary** — `ErrorBoundary` component wraps all routes. Any render crash shows a friendly "Something went wrong" page with Back to app, Refresh, and Report issue buttons.
- **Session security** — Enhanced session management: `sessionStorage` flag tracks active session, `visibilitychange` event fires signout when tab is hidden, not just on close.

### UI Improvements
- **Profile button** — Country flag displayed in a 22px circular orange badge (not inline text). Cleaner and more international-friendly.
- **AI chip removed** — `<div className="header-tag">AI</div>` removed from app header.
- **CTA text** — Changed from confusing cuisine+mealtype combo (`"Jiff Tamil Nadu lunch!"`) to clean `"Jiff it now!"`.
- **Navigation standardised** — All secondary pages (Planner, Plans, History, Profile) use "← Back to app" consistently.
- **Landing copy** — "Jiff it now — it's free" → "Try Jiff — 7 days free"; stats bar updated.
- **Pantry tab (Profile)** — Now uses `IngredientInput` with full autocomplete + 20 quick-add staple buttons (salt, pepper, turmeric, ghee, etc.).
- **Profile completion banner** — Has a "Later" dismiss button using `sessionStorage` so it doesn't pester on every page load.

### Build Warning Fixes
- **`vercel.json` `builds` warning** — Migrated from legacy `"builds"` format to modern `"framework"`, `"buildCommand"`, `"outputDirectory"`, `"rewrites"` format. Eliminates the Vercel CLI warning about build config override.
- **ESM→CommonJS warning** — Inherent to Vercel's Node.js runtime compilation of API files; no code change needed as this is expected behaviour.

### Documents & Tests
- `tests/jiff.spec.js` — Full rewrite, 32 → 36 tests
- `CHANGELOG.md` — This entry
- `SUPABASE_SETUP.md` — No new tables needed for v16.4

---

## v16.3 — Planner/Plans fixed, pantry pre-fill, Goal Plans fridge section
**Date:** March 2026

### Bug fixes
- **Week Plan page crash** — `setIngredients(pantry)` in Planner pantry-prefill `useEffect` referenced a deleted state variable. Fixed to `setPantryItems(pantry)`.
- **Plans page ingredient section** — Replaced old tag-input `ingredient-box` with `FridgePhotoUpload` + `IngredientInput` components matching the main app.

### Improvements
- **Plans: What's in your fridge?** — Goal Plans page now has the same photo-upload + text-input fridge section and "Pantry & Spices" section.
- **Plans: pantry pre-fill** — Added `useAuth` hook; pantry items pre-fill from profile on load.
- **Plans: API call** — Already used computed `ingredients` variable; now correctly merges `fridgeItems` + `pantryItems`.
- **Planner: pantry pre-fill fixed** — `setPantryItems(pantry)` now correctly populates the Pantry & Spices field.

### E2E tests: 28 → 32
- Test 29: Week Plan loads with fridge section
- Test 30: Goal Plans loads with fridge section
- Test 31: Pantry pre-fills in Planner
- Test 32: Pantry & Spices section shown in main app

---

## v16.3 — Week Plan & Goal Plans fixed, complete cleanup pass
**Date:** March 2026

### Root cause of page crashes
Both `/planner` and `/plans` were crashing because of **stale variable references** — `setIngredients`, `inputVal`, `addIng`, `onKey`, `inputRef` remained in the code after the ingredient state was split into `fridgeItems` + `pantryItems`. When React tried to call a function that no longer existed (`setIngredients(pantry)` in Planner's pre-fill `useEffect`), the page crashed silently.

### Fixes
- **Planner crash** — `setIngredients(pantry)` → `setPantryItems(pantry)` in pantry pre-fill `useEffect`
- **Jiff.jsx dead code** — Removed `inputVal`, `setInputVal`, `inputRef`, `addIng`, `onKey` (dead since v16 ingredient split). None were referenced in JSX any longer.
- **Plans.jsx dead code** — Same stale vars removed from Goal Plans page
- **Plans: What's in your fridge?** — New photo upload + text input fridge section added above Pantry & Spices
- **Plans: pantry pre-fill** — `useAuth` hook added; `setPantryItems(pantry)` pre-fills from saved pantry on load
- **Plans: API call** — Correctly uses computed `ingredients = [...fridgeItems, ...pantryItems]` merged array
- **Planner: pantry pre-fill confirmed working** — `setPantryItems(pantry)` verified correct

### E2E test suite rewrite
- Full rewrite from 28 tests to **32 targeted tests**
- Tests 15–17 specifically cover Planner and Plans loading with fridge sections
- Test 31: All three main pages (`/app`, `/planner`, `/plans`) load without JS errors
- Removed brittle tests, improved selectors throughout

### Documents updated
- `CHANGELOG.md` — this entry
- `tests/jiff.spec.js` — complete rewrite, 32 tests

---

## v16.2 — Grocery fix, country detection, cuisine cleanup, Planner fridge section, profile pre-fill
**Date:** March 2026

### Bug fixes
- **Grocery list blank page** — `GroceryPanel` now calls `useLocale()` directly to get `country`, eliminating the `ReferenceError` from referencing `country` in a scope that didn't have it. Grocery list and Blinkit links now render correctly.
- **Duplicate "Any Cuisine"** — Removed `any` from `GLOBAL_CUISINES` (it was already manually rendered as the first chip in the sidebar). Now only one "Any cuisine" button appears.
- **Country shows SG instead of IN** — `guessCountry()` now uses `Intl.DateTimeFormat().resolvedOptions().timeZone` (e.g. `Asia/Kolkata` → `IN`, `Asia/Singapore` → `SG`). `SmartGreeting` also calls `onCountryDetected` when real GPS country is determined, updating `LocaleContext` with the accurate value.

### Improvements
- **Dietary + Cuisine pre-filled from profile** — On load, `useEffect` reads saved `food_type` and `preferred_cuisines` from profile and sets the `diet`/`cuisine` state automatically.
- **Profile completion banner** — If logged in but no `spice_level` or `preferred_cuisines` saved, a prominent orange banner appears at the top of the app page: "Complete your profile — Set preferences →".
- **Make it ⚡ button** — Clicking the contextual suggestion in SmartGreeting now adds the dish to fridge items and auto-triggers generation (with 150ms delay for state to settle).
- **Planner fridge section** — `/planner` now has the same "What's in your fridge?" photo+text section and "Pantry & Spices" section as the main app. Pantry pre-filled from profile. Old `ingredient-box` tag input removed.
- **Indian cuisines updated** — South Indian and Chettinad removed; `Tamil` renamed to `Tamil Nadu` (🌶️); `Karnataka` (🏯) added. 13 cuisines total.

### E2E tests: 24 → 28
- Test 25: No duplicate Any cuisine chip
- Test 26: Profile completion banner
- Test 27: Planner fridge section
- Test 28: Tamil Nadu/Karnataka in Indian submenu, Chettinad absent

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

> These three files ship in every zip. A release is not complete without them.## v18.8 -- GA4, Kids Meals, auth gate, email drip, Admin comms
**Date:** March 2026  |  **Package:** 1.18.8

### Google Analytics GA4
- Updated measurement ID to G-ERSLLHSXCL in public/index.html
- window._jiffGA helper available globally for event tracking

### Kids Meals (renamed from Little Chefs)
- Page renamed from "Little Chefs" to "Kids Meals" across all nav references
- Dynamic subtitle explains current mode clearly
- Mode toggle: "Cook for your child" (parent prepares) vs "Your child wants to cook" (kids cook)
- AI prompt fully adapts to each mode — nutrition-focused adult-prep vs safe-technique kids-cooking

### Sign-in gate hardened
- Generate button now mandates sign-in — no bypass possible
- "Maybe later" skip removed from sign-in gate
- Pricing page "Back to app" is auth-aware — unauthenticated users go to / not /app
- Landing nav simplified — Goal Plan / Week Plan / Quick Meal removed; replaced with social proof + "Try free"

### Email drip sequence (comms.js)
- api/comms.js rebuilt with 5 trigger actions: welcome, trial_start, trial_expired, premium_confirm, email
- Each action adds correct Mailchimp tags to fire Customer Journey automations
- 11 HTML email templates built across 7 journeys (see jiff-email-templates.zip)

### Admin portal — Email & Comms tab
- New sidebar section: Documentation → Email & Comms
- Full drip sequence documentation with subject lines and preview text
- Template viewer showing all 11 templates with journey mapping
- Mailchimp setup checklist and API trigger reference

---


