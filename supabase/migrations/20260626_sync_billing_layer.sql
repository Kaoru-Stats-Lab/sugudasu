-- SUGUDASU Sync — 課金層 + product_type（S3 準備 · S1 から適用可）
-- SSOT: docs/notes/SYNC_DB_ARCHITECTURE.md §2-3

create table if not exists public.sync_profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  stripe_customer_id text,
  updated_at timestamptz not null default now()
);

create table if not exists public.user_entitlements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  type text not null check (type in ('per_event', 'subscription')),
  quantity integer not null default 1 check (quantity >= 0),
  expires_at timestamptz,
  stripe_checkout_session_id text,
  created_at timestamptz not null default now()
);

create index if not exists user_entitlements_user_id_idx on public.user_entitlements (user_id);
create index if not exists user_entitlements_expires_at_idx on public.user_entitlements (expires_at);

alter table public.sync_rooms
  add column if not exists product_type text not null default 'timeline'
    check (product_type in ('timeline', 'group', 'schedule'));

create index if not exists sync_rooms_product_type_idx on public.sync_rooms (product_type);

alter table public.sync_rooms drop column if exists stripe_customer_id;

alter table public.sync_profiles enable row level security;
alter table public.user_entitlements enable row level security;

drop policy if exists sync_profiles_self on public.sync_profiles;
create policy sync_profiles_self on public.sync_profiles
  for all
  using (auth.uid() = id)
  with check (auth.uid() = id);

drop policy if exists user_entitlements_self_read on public.user_entitlements;
create policy user_entitlements_self_read on public.user_entitlements
  for select
  using (auth.uid() = user_id);

-- INSERT/UPDATE は service role（Stripe Webhook）のみ — S3 で Functions から

drop trigger if exists sync_profiles_touch on public.sync_profiles;
create trigger sync_profiles_touch
  before update on public.sync_profiles
  for each row execute function public.sync_touch_updated_at();
