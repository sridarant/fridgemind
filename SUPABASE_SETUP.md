
---

## Phase 2 — Meal history table (v14+)

Run this in **Supabase → SQL Editor** to add meal history:

```sql
-- Meal history
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

create index if not exists meal_history_user_idx on meal_history(user_id, generated_at desc);

alter table meal_history enable row level security;
create policy "history: own data" on meal_history for all using (auth.uid() = user_id);
```

Then add the service role key to Vercel environment variables:

| Name | Value |
|---|---|
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase → Settings → API → service_role (secret) key |

This key stays server-side only — the `api/meal-history.js` endpoint uses it to bypass RLS for trusted server operations.
