-- SUGUDASU Sync Phase S1 — rooms + cloud state
-- SSOT: docs/notes/SYNC_S1_ARCHITECTURE.md
-- Apply in Supabase SQL editor or: supabase db push

create table if not exists public.sync_rooms (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users (id) on delete cascade,
  title text not null default '無題のイベント',
  entitlement text not null default 'trial'
    check (entitlement in ('trial', 'active', 'expired')),
  stripe_customer_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.sync_room_states (
  room_id uuid primary key references public.sync_rooms (id) on delete cascade,
  revision integer not null default 1 check (revision >= 1),
  payload jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create index if not exists sync_rooms_owner_id_idx on public.sync_rooms (owner_id);

alter table public.sync_rooms enable row level security;
alter table public.sync_room_states enable row level security;

drop policy if exists sync_rooms_owner_all on public.sync_rooms;
create policy sync_rooms_owner_all on public.sync_rooms
  for all
  using (auth.uid() = owner_id)
  with check (auth.uid() = owner_id);

drop policy if exists sync_room_states_owner_all on public.sync_room_states;
create policy sync_room_states_owner_all on public.sync_room_states
  for all
  using (
    exists (
      select 1 from public.sync_rooms r
      where r.id = sync_room_states.room_id and r.owner_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.sync_rooms r
      where r.id = sync_room_states.room_id and r.owner_id = auth.uid()
    )
  );

create or replace function public.sync_touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists sync_rooms_touch on public.sync_rooms;
create trigger sync_rooms_touch
  before update on public.sync_rooms
  for each row execute function public.sync_touch_updated_at();

drop trigger if exists sync_room_states_touch on public.sync_room_states;
create trigger sync_room_states_touch
  before update on public.sync_room_states
  for each row execute function public.sync_touch_updated_at();
