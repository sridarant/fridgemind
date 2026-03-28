# Supabase Setup — Jiff

This guide covers all Supabase configuration for Jiff v16. Complete all phases in order.

---

## Quick status check

In Supabase → **SQL Editor**, run this to see which tables exist:

```sql
select table_name from information_schema.tables
where table_schema = 'public'
order by table_name;
```

You should see: `api_keys`, `favourites`, `feedback`, `meal_history`, `pantry`, `profiles`

---

## Phase 1 — Auth, Favourites, Pantry & Taste Profile

### Step 1 — Create a Supabase account

1. Go to [supabase.com](https://supabase.com) → **New project**
2. Choose a region closest to your users (e.g. Mumbai / Singapore for India/SEA)
3. Set a strong database password — save it

### Step 2 — Create Phase 1 tables

In **SQL Editor**, run:

```sql
-- User profiles (taste preferences)
create table if not exists profiles (
  id           uuid primary key references auth.users(id) on delete cascade,
  name         text,
  email        text,
  spice_level  text default 'medium',
  allergies    text[] default '{}',
  preferred_cuisines text[] default '{}',
  skill_level  text default 'intermediate',
  food_type    text[] default '{}',   -- stored as text[] e.g. ARRAY['veg']
  diet_requirements text[] default '{}',
  country      text,
  updated_at   timestamptz default now()
);
alter table profiles enable row level security;
create policy "profiles: own data" on profiles for all using (auth.uid() = id);

-- Pantry items
create table if not exists pantry (
  id      uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  items   text[] default '{}',
  updated_at timestamptz default now()
);
alter table pantry enable row level security;
create policy "pantry: own data" on pantry for all using (auth.uid() = user_id);

-- Favourites
create table if not exists favourites (
  id        uuid primary key default gen_random_uuid(),
  user_id   uuid references auth.users(id) on delete cascade,
  meal      jsonb not null,
  saved_at  timestamptz default now()
);
alter table favourites enable row level security;
create policy "favourites: own data" on favourites for all using (auth.uid() = user_id);

-- Auto-create profile on signup
create or replace function handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, name, email)
  values (new.id, new.raw_user_meta_data->>'name', new.email)
  on conflict (id) do nothing;
  return new;
end;
$$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();
```

### Step 3 — Enable Google sign-in

1. Go to [console.cloud.google.com](https://console.cloud.google.com)
2. **APIs & Services → Credentials → Create OAuth 2.0 Client ID**
   - Application type: Web application
   - Authorised redirect URI: `https://YOUR_PROJECT_REF.supabase.co/auth/v1/callback`
3. Copy the **Client ID** and **Client Secret**
4. In Supabase → **Authentication → Providers → Google** → enable and paste both

### Step 4 — Get your API keys

In Supabase → **Settings → API**:
- **Project URL** → `REACT_APP_SUPABASE_URL`
- **anon/public key** → `REACT_APP_SUPABASE_ANON_KEY`
- **service_role key** → `SUPABASE_SERVICE_ROLE_KEY` (keep secret — server-side only)

### Step 5 — Add to Vercel environment variables

In [vercel.com](https://vercel.com) → your project → **Settings → Environment Variables**:

| Variable | Value | Scope |
|---|---|---|
| `REACT_APP_SUPABASE_URL` | Your Project URL | All |
| `REACT_APP_SUPABASE_ANON_KEY` | Your anon key | All |
| `SUPABASE_SERVICE_ROLE_KEY` | Your service_role key | All |
| `ANTHROPIC_API_KEY` | Your Claude API key | All |

### Step 6 — Configure redirect URLs

In Supabase → **Authentication → URL Configuration**:
- **Site URL**: `https://jiff-ecru.vercel.app`
- **Redirect URLs**: Add `https://jiff-ecru.vercel.app/**`

### Step 7 — Redeploy

Push any commit or click **Redeploy** in Vercel.

---

## Phase 2 — Meal History

### Step 1 — Create meal_history table

```sql
create table if not exists meal_history (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid references auth.users(id) on delete cascade,
  meal         jsonb,
  meal_type    text default 'any',
  cuisine      text default 'any',
  servings     int default 2,
  ingredients  text[] default '{}',
  generated_at timestamptz default now()
);
alter table meal_history enable row level security;
create policy "meal_history: own data" on meal_history for all using (auth.uid() = user_id);
create index if not exists meal_history_user_idx on meal_history(user_id, generated_at desc);
```

### Step 2 — Verify SUPABASE_SERVICE_ROLE_KEY is set in Vercel

The meal history API uses the service role key for server-side writes. Without it, history won't persist to Supabase (but localStorage fallback still works within the browser session).

---

## Phase 3 — Feedback & Public API (v16)

### Step 1 — Create feedback and api_keys tables

```sql
-- User feedback (for the floating feedback widget)
create table if not exists feedback (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references auth.users(id) on delete set null,
  email       text,
  rating      int check (rating >= 1 and rating <= 5),
  category    text default 'other',
  message     text,
  page        text,
  user_agent  text,
  created_at  timestamptz default now()
);
alter table feedback enable row level security;
create policy "feedback: insert only" on feedback for insert with check (true);
create policy "feedback: admin read" on feedback for select using (false); -- only service role

-- Public API keys (for /api/v1/suggest endpoint)
create table if not exists api_keys (
  id          uuid primary key default gen_random_uuid(),
  key         text unique not null,
  tier        text default 'free' check (tier in ('free','starter','pro')),
  user_id     uuid references auth.users(id) on delete cascade,
  usage_count int default 0,
  usage_date  date,
  created_at  timestamptz default now()
);
alter table api_keys enable row level security;
create policy "api_keys: own data" on api_keys for all using (auth.uid() = user_id);
```

### Step 2 — Add country column to profiles (if not exists)

```sql
alter table profiles add column if not exists country text;
```

### Step 3 — Verify all tables

```sql
select table_name, (select count(*) from information_schema.columns c where c.table_name = t.table_name) as col_count
from information_schema.tables t
where table_schema = 'public'
order by table_name;
```

Expected output:
| table_name | col_count |
|---|---|
| api_keys | 7 |
| favourites | 4 |
| feedback | 9 |
| meal_history | 8 |
| pantry | 4 |
| profiles | 11 |

---

## Phase 4 — v17 features (broadcast, ratings, admin tools)

### Step 1 — Broadcasts table (admin broadcast feature)

```sql
create table if not exists broadcasts (
  id         uuid primary key default gen_random_uuid(),
  message    text not null,
  active     boolean default true,
  created_at timestamptz default now()
);
alter table broadcasts enable row level security;
-- Users can read active broadcasts (for in-app banner)
create policy "broadcasts: read active" on broadcasts for select using (active = true);
-- Only service role can insert (via /api/admin/broadcast)
-- No insert policy needed — service role bypasses RLS
```

### Step 2 — Recipe ratings column on meal_history

```sql
alter table meal_history add column if not exists rating int check (rating >= 1 and rating <= 5);
```

### Step 3 — Verify all tables (Phases 1–4)

```sql
select table_name, (
  select count(*) from information_schema.columns c
  where c.table_name = t.table_name and c.table_schema = 'public'
) as col_count
from information_schema.tables t
where table_schema = 'public'
order by table_name;
```

Expected tables: `api_keys`, `broadcasts`, `favourites`, `feedback`, `meal_history`, `pantry`, `profiles`

---


## Phase 5 — v18 features (family mode, nutrition goals, releases)

### Step 1 — Add columns to profiles table

```sql
-- Family members (JSONB array of {name, dietary, allergies})
alter table profiles add column if not exists family_members jsonb default '[]';

-- Nutrition goals (JSONB: {calories, protein})
alter table profiles add column if not exists nutrition_goals jsonb default '{"calories":2000,"protein":80}';

-- Language + units preference (persist cross-device)
alter table profiles add column if not exists lang  text default 'en';
alter table profiles add column if not exists units text default 'metric';
```

### Step 2 — Releases table (admin build tracker)

```sql
create table if not exists releases (
  id          uuid primary key default gen_random_uuid(),
  version     text not null,
  title       text not null,
  summary     text,
  status      text default 'deployed' check (status in ('deployed','draft','rollback')),
  deployed_at timestamptz default now()
);
-- No RLS needed — admin-only via service role
```

### Step 3 — WhatsApp webhook env vars (add to Vercel)

```
WHATSAPP_ACCESS_TOKEN=your_meta_access_token
WHATSAPP_VERIFY_TOKEN=jiff-whatsapp-2026
WHATSAPP_PHONE_NUMBER_ID=your_phone_number_id
```
See `WHATSAPP_SETUP.md` for full configuration.

---

## Why Admin shows "Phase 3 not complete"

The admin page checks `process.env.REACT_APP_SUPABASE_URL` and `REACT_APP_SUPABASE_ANON_KEY` — if both are set it shows ✓. If it still shows incomplete, check:

1. Both Supabase env vars are set in Vercel (Settings → Environment Variables)
2. You redeployed after adding them
3. The `feedback` table exists with RLS enabled
4. The `SUPABASE_SERVICE_ROLE_KEY` is set (server-side variable — NOT prefixed with `REACT_APP_`)

To test: go to `/api/stats` — if it returns data instead of an error, Supabase is connected.

---

## What works without Supabase

| Feature | Without Supabase | With Supabase |
|---|---|---|
| Recipe generation | ✓ | ✓ |
| Meal history | ✓ localStorage only | ✓ Synced to cloud |
| Favourites | ✓ localStorage only | ✓ Synced to cloud |
| Pantry | ✗ | ✓ |
| Taste profile | ✗ | ✓ |
| Auth (sign-in) | ✗ | ✓ |
| Week plan | ✓ | ✓ |
| Goal plans | ✓ | ✓ |

---

## Environment variables — complete list

| Variable | Required | Used by |
|---|---|---|
| `ANTHROPIC_API_KEY` | **Yes** | All recipe generation |
| `REACT_APP_SUPABASE_URL` | For auth/sync | Frontend + API |
| `REACT_APP_SUPABASE_ANON_KEY` | For auth/sync | Frontend |
| `SUPABASE_SERVICE_ROLE_KEY` | For history/feedback | API routes only |
| `RAZORPAY_KEY_ID` | For India payments | create-order.js |
| `RAZORPAY_KEY_SECRET` | For India payments | verify-payment.js |
| `REACT_APP_RAZORPAY_KEY_ID` | For India payments | Frontend |
| `MAILCHIMP_API_KEY` | For email capture | email-subscribe.js |
| `MAILCHIMP_AUDIENCE_ID` | For email capture | email-subscribe.js |
| `MAILCHIMP_SERVER_PREFIX` | For email capture | email-subscribe.js |

