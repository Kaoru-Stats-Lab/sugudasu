-- SUGUDASU Sync — ルーム数・payload サイズ上限
-- SSOT: docs/notes/SYNC_STORAGE_QUOTAS.md
-- 前提: 20260625_sync_s1.sql + 20260625_sync_retention.sql

-- アクティブ = retain_until が未来（パージ前）
create or replace function public.sync_count_active_rooms(p_owner_id uuid)
returns integer
language sql
stable
security definer
set search_path = public
as $$
  select count(*)::integer
  from public.sync_rooms r
  where r.owner_id = p_owner_id
    and r.retain_until > now();
$$;

create or replace function public.sync_room_quota_for_entitlement(p_entitlement text)
returns integer
language sql
immutable
as $$
  select case
    when p_entitlement = 'active' then 3
    else 1
  end;
$$;

create or replace function public.sync_enforce_room_quota()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_count integer;
  v_limit integer;
begin
  v_limit := public.sync_room_quota_for_entitlement(new.entitlement);
  v_count := public.sync_count_active_rooms(new.owner_id);

  if v_count >= v_limit then
    raise exception 'room_quota_exceeded'
      using errcode = 'P0001',
            hint = format('active room limit %s for entitlement %s', v_limit, new.entitlement);
  end if;

  return new;
end;
$$;

drop trigger if exists sync_rooms_quota on public.sync_rooms;
create trigger sync_rooms_quota
  before insert on public.sync_rooms
  for each row execute function public.sync_enforce_room_quota();

-- entitlement が trial→active に上がったとき、既存 active 数 + この行が上限超なら拒否
create or replace function public.sync_enforce_room_quota_on_entitlement_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_count integer;
  v_limit integer;
begin
  if old.entitlement is not distinct from new.entitlement then
    return new;
  end if;

  v_limit := public.sync_room_quota_for_entitlement(new.entitlement);
  v_count := public.sync_count_active_rooms(new.owner_id);

  if v_count > v_limit then
    raise exception 'room_quota_exceeded'
      using errcode = 'P0001',
            hint = format('cannot set entitlement %s: %s active rooms exceed limit %s',
              new.entitlement, v_count, v_limit);
  end if;

  return new;
end;
$$;

drop trigger if exists sync_rooms_quota_entitlement on public.sync_rooms;
create trigger sync_rooms_quota_entitlement
  before update of entitlement on public.sync_rooms
  for each row execute function public.sync_enforce_room_quota_on_entitlement_change();

-- payload 512 KiB（jsonb テキスト表現のバイト長）
create or replace function public.sync_enforce_payload_size()
returns trigger
language plpgsql
as $$
declare
  v_max integer := 524288;
  v_len integer;
begin
  v_len := octet_length(new.payload::text);
  if v_len > v_max then
    raise exception 'payload_too_large'
      using errcode = 'P0001',
            hint = format('payload %s bytes exceeds limit %s', v_len, v_max);
  end if;
  return new;
end;
$$;

drop trigger if exists sync_room_states_payload_size on public.sync_room_states;
create trigger sync_room_states_payload_size
  before insert or update of payload on public.sync_room_states
  for each row execute function public.sync_enforce_payload_size();
