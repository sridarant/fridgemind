# Jiff — Supabase Setup Guide

Complete setup guide for Supabase auth, cloud sync, and meal history.
Takes about 20 minutes the first time.

---

## Phase 1 — Auth, Favourites, Pantry & Taste Profile (v10+)

### Step 1 — Create a free Supabase account

1. Go to **supabase.com** → click **Start your project**
2. Sign up with GitHub (easiest) or email
3. Verify your email address
4. Click **New project** and fill in:
   - **Name:** `jiff`
   - **Database password:** generate a strong one and save it
   - **Region:** Asia South (ap-south-1) — closest to India
5. Click **Create new project** — takes ~2 minutes to provision

---

### Step 2 — Create Phase 1 database tables

Go to **SQL Editor** in the left sidebar. Paste the entire block and click **Run**:

```sql
-- User profiles (taste preferences and settings)
create table if not exists profiles (
  id                  uuid primary key references auth.users(id) on delete cascade,
  email               text,
  name                text,
  avatar_url          text,
  spice_level         text default 'medium',
  allergies           text[] default '{}',
  preferred_cuisines  text[] default '{}',
  skill_level         text default 'intermediate',
  created_at          timestamptz default now(),
  updated_at          timestamptz default now()
);

-- Saved pantry ingredients per user
create table if not exists pantry (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid references auth.users(id) on delete cascade unique,
  ingredients  text[] default '{}',
  updated_at   timestamptz default now()
);

-- Saved favourite meals
create table if not exists favourites (
  id        uuid primary key default gen_random_uuid(),
  user_id   uuid references auth.users(id) on delete cascade,
  meal      jsonb not null,
  saved_at  timestamptz default now()
);

-- Row Level Security — users see only their own data
alter table profiles   enable row level security;
alter table pantry     enable row level security;
alter table favourites enable row level security;

create policy "profiles: own data"   on profiles   for all using (auth.uid() = id);
create policy "pantry: own data"     on pantry      for all using (auth.uid() = user_id);
create policy "favourites: own data" on favourites  for all using (auth.uid() = user_id);
```

You should see **"Success. No rows returned."**

---

### Step 3 — Enable Google sign-in

**In Google Cloud Console (console.cloud.google.com):**

1. Create a new project → name it `jiff`
2. Go to **APIs & Services → OAuth consent screen** → select **External** → **Create**
3. Fill in App name (`Jiff`), support email, developer email → **Save and Continue** through all steps
4. Go to **APIs & Services → Credentials → + Create Credentials → OAuth 2.0 Client ID**
5. Application type: **Web application**, Name: `Jiff`
6. Under **Authorised redirect URIs** → **Add URI** → paste:
   ```
   https://YOUR-PROJECT-ID.supabase.co/auth/v1/callback
   ```
   *(Your Project ID is in Supabase → Settings → General → Reference ID)*
7. Click **Create** → copy the **Client ID** and **Client Secret**

**Back in Supabase:**

1. Go to **Authentication → Providers → Google** → toggle **Enable**
2. Paste your **Client ID** and **Client Secret** → **Save**

---

### Step 4 — Get your Supabase API keys

Go to **Supabase → Settings → API**:

| Key | Label in Supabase | Example format |
|---|---|---|
| Project URL | "Project URL" | `https://abcdefgh.supabase.co` |
| Anon key | "anon public" | `eyJhbGci...` (long string) |

---

### Step 5 — Add environment variables to Vercel

Go to **vercel.com → your Jiff project → Settings → Environment Variables**.

Add these (alongside your existing `ANTHROPIC_API_KEY`). Select all three environments for each:

| Variable | Value | Visibility |
|---|---|---|
| `REACT_APP_SUPABASE_URL` | Your Project URL | Frontend safe |
| `REACT_APP_SUPABASE_ANON_KEY` | Your anon/public key | Frontend safe |

---

### Step 6 — Configure redirect URLs in Supabase

Go to **Supabase → Authentication → URL Configuration**:

| Field | Value |
|---|---|
| Site URL | `https://your-app.vercel.app` |
| Redirect URLs | `https://your-app.vercel.app/app` |

Replace `your-app` with your actual Vercel project name. Click **Save**.

---

### Step 7 — Redeploy

```bash
git add .
git commit -m "Add Supabase environment variables"
git push
```

Once deployed, the **Sign in** button appears in the app header and the full auth flow works.

---

## Phase 2 — Meal History (v14+)

### Step 1 — Create the meal_history table

Go to **Supabase → SQL Editor** and run:

```sql
-- Meal generation history per user
create table if not exists meal_history (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid references auth.users(id) on delete cascade,
  meal         jsonb not null,
  meal_type    text default 'any',
  cuisine      text default 'any',
  servings     int  default 2,
  ingredients  text[] default '{}',
  generated_at timestamptz default now()
);

-- Index for fast per-user queries sorted by date
create index if not exists meal_history_user_idx
  on meal_history(user_id, generated_at desc);

alter table meal_history enable row level security;
create policy "history: own data"
  on meal_history for all using (auth.uid() = user_id);
```

---

### Step 2 — Add the service role key to Vercel

The `api/meal-history.js` endpoint uses the service role key server-side to write to the
database. This key must **never** be exposed to the browser.

Go to **Supabase → Settings → API** → copy the **service_role** key (labelled "secret").

| Variable | Value | Visibility |
|---|---|---|
| `SUPABASE_SERVICE_ROLE_KEY` | service_role key from Supabase | Server only — never expose |

Add to Vercel and redeploy. Meal history will now persist to Supabase and appear on `/history`.

---

## Troubleshooting

| Problem | Fix |
|---|---|
| Sign-in button doesn't appear | Check `REACT_APP_SUPABASE_URL` and `REACT_APP_SUPABASE_ANON_KEY` are set in Vercel and redeployed |
| `redirect_uri_mismatch` on Google sign-in | The URI in Google Cloud Console must exactly match the callback URL in Supabase → Auth → Providers → Google |
| 404 after sign-in on Vercel | Check `vercel.json` has `{"handle":"filesystem"}` and `{"src":"/(.*)", "dest":"/index.html"}` |
| `relation "profiles" does not exist` | Re-run the Phase 1 SQL in SQL Editor |
| `relation "meal_history" does not exist` | Run the Phase 2 SQL |
| History not saving | Check `SUPABASE_SERVICE_ROLE_KEY` is set in Vercel |
| "This app isn't verified" on Google | Normal during dev — click **Advanced → Go to Jiff (unsafe)** |
| 401 errors from Supabase | Ensure you're using the `anon public` key for `REACT_APP_SUPABASE_ANON_KEY`, not the service_role key |

---

## What works without Supabase configured

| Feature | Without Supabase | With Supabase |
|---|---|---|
| Meal generation | Works | Works |
| Step timers, scaler, grocery | Works | Works |
| Favourites | Device only (localStorage) | Cloud synced |
| Pantry | Device only | Cloud synced |
| Taste profile | Device only | Cloud synced |
| Meal history | Not saved | Saved to cloud |
| Sign-in | Dev bypass only | Google + magic link |
| Cross-device sync | No | Yes |
