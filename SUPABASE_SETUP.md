# Supabase Setup Guide for Jiff — Phase 3

Supabase is a free database + auth platform. This guide takes you from zero to fully wired up. Takes about 15 minutes.

---

## Step 1 — Create a free Supabase account

1. Go to **supabase.com** and click **Start your project**
2. Sign up with GitHub (easiest) or email
3. Click **New project**
4. Fill in:
   - **Name:** `jiff`
   - **Database Password:** generate a strong one and save it somewhere
   - **Region:** pick the closest to you (Asia South for India)
5. Click **Create new project** — wait ~2 minutes for it to spin up

---

## Step 2 — Create the database tables

Once your project is ready, click **SQL Editor** in the left sidebar. Paste this entire block and click **Run**:

```sql
-- User profiles (taste preferences)
create table if not exists profiles (
  id           uuid primary key references auth.users(id) on delete cascade,
  email        text,
  name         text,
  avatar_url   text,
  spice_level  text default 'medium',
  allergies    text[] default '{}',
  preferred_cuisines text[] default '{}',
  skill_level  text default 'intermediate',
  created_at   timestamptz default now(),
  updated_at   timestamptz default now()
);

-- Saved pantry per user
create table if not exists pantry (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid references auth.users(id) on delete cascade unique,
  ingredients  text[] default '{}',
  updated_at   timestamptz default now()
);

-- Saved favourite meals
create table if not exists favourites (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid references auth.users(id) on delete cascade,
  meal         jsonb not null,
  saved_at     timestamptz default now()
);

-- Row Level Security — users can only see their own data
alter table profiles  enable row level security;
alter table pantry    enable row level security;
alter table favourites enable row level security;

create policy "profiles: own data"   on profiles   for all using (auth.uid() = id);
create policy "pantry: own data"     on pantry      for all using (auth.uid() = user_id);
create policy "favourites: own data" on favourites  for all using (auth.uid() = user_id);
```

Click **Run** — you should see "Success. No rows returned."

---

## Step 3 — Enable Google sign-in

1. In Supabase, go to **Authentication → Providers**
2. Find **Google** and toggle it on
3. You'll need a Google Client ID and Secret — here's how to get them:
   - Go to **console.cloud.google.com**
   - Create a new project (or use existing)
   - Go to **APIs & Services → Credentials**
   - Click **Create Credentials → OAuth 2.0 Client ID**
   - Application type: **Web application**
   - Add to **Authorised redirect URIs:**
     ```
     https://your-project-id.supabase.co/auth/v1/callback
     ```
     (find your project ID in Supabase → Settings → General)
   - Copy the **Client ID** and **Client Secret**
4. Paste them into Supabase → Authentication → Google provider
5. Save

---

## Step 4 — Get your Supabase keys

1. In Supabase, go to **Settings → API**
2. Copy two values:
   - **Project URL** — looks like `https://abcdefgh.supabase.co`
   - **anon / public key** — a long string starting with `eyJ...`

---

## Step 5 — Add environment variables to Vercel

1. Go to **vercel.com** → your Jiff project → **Settings → Environment Variables**
2. Add these (in addition to your existing `ANTHROPIC_API_KEY`):

| Name | Value |
|------|-------|
| `REACT_APP_SUPABASE_URL` | your Project URL from Step 4 |
| `REACT_APP_SUPABASE_ANON_KEY` | your anon/public key from Step 4 |

3. Select all three environments (Production, Preview, Development)
4. Save each one

---

## Step 6 — Add your live URL to Supabase allowed redirects

1. In Supabase → **Authentication → URL Configuration**
2. Set **Site URL** to your Vercel URL: `https://jiff.vercel.app`
3. Add to **Redirect URLs:** `https://jiff.vercel.app/app`
4. Save

---

## Step 7 — Redeploy

```bash
git add .
git commit -m "Phase 3: Supabase auth, cloud sync, pantry, taste profile"
git push
```

Vercel picks it up automatically. Done.

---

## For local development

Create a `.env` file in your project root (copy from `.env.example`):

```
ANTHROPIC_API_KEY=your_key
REACT_APP_SUPABASE_URL=https://your-project-id.supabase.co
REACT_APP_SUPABASE_ANON_KEY=eyJ...your_anon_key...
```

Then `npm start` as usual.

---

## What works without Supabase

If `REACT_APP_SUPABASE_URL` is not set, the app falls back gracefully:
- Favourites saved to localStorage (device-only)
- No sign-in buttons shown
- Profile page still works locally
- All cooking features work normally

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| "Invalid API key" on sign-in | Check `REACT_APP_SUPABASE_ANON_KEY` in Vercel env vars — must start with `eyJ` |
| Google sign-in redirects to wrong URL | Check redirect URIs in Google Cloud Console match exactly |
| Data not saving | Check SQL ran without errors — verify RLS policies exist |
| `relation "profiles" does not exist` | Re-run the SQL from Step 2 |
