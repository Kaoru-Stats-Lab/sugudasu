-- SUGUDASU Sync — ルーム保持期限（retention）
-- SSOT: docs/notes/SYNC_RETENTION_POLICY.md
-- 前提: 20260625_sync_s1.sql 適用後

alter table public.sync_rooms
  add column if not exists event_date date,
  add column if not exists retain_until timestamptz;

comment on column public.sync_rooms.event_date is 'イベント開催日（任意）· retain_until 算出の目安';
comment on column public.sync_rooms.retain_until is 'この日時以降、自動パージ対象（無期限保持禁止）';

-- 既存行: 作成から 30 日（移行用 · 本番はアプリ側で設定）
update public.sync_rooms
set retain_until = created_at + interval '30 days'
where retain_until is null;

alter table public.sync_rooms
  alter column retain_until set default (now() + interval '30 days');

-- オーナーによる DELETE は RLS 既存ポリシーで可 · state は ON DELETE CASCADE
