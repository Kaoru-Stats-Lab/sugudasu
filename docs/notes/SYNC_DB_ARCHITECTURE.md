# SUGUDASU Sync — DB アーキテクチャ SSOT

**更新:** 2026-06-26（Auth×課金 ID 境界と DB 対応を §2-0 で明示）  
**Auth 連携:** [`SYNC_AUTH_POLICY.md`](SYNC_AUTH_POLICY.md) §5-6  
**調査:** [`sync-db-architecture-gemini-RESULT.md`](sync-db-architecture-gemini-RESULT.md)  
**関連:** `SYNC_S1_ARCHITECTURE.md` · `SYNC_RETENTION_POLICY.md` · `SYNC_STORAGE_QUOTAS.md` · **env:** [`SYNC_ENV_KEYS.md`](SYNC_ENV_KEYS.md)

---

## 1. メタ原則（採用 · Gemini §8 + 提督修正）

| # | 原則 | 補足 |
|---|------|------|
| **1** | DB は **トランシーバー**（揮発バッファ） | 永続ログは **ユーザー JSON** · `retain_until` でパージ |
| **2** | **構造は JS · DB はガバナンス** | `payload` jsonb · RLS 所有権 · トリガー上限 |
| **3** | **PostgREST 直結** | 中間 CRUD API は作らない · **例外:** Stripe Webhook / Checkout（CF Functions） |

**ID境界:** SUGUDASU の Supabase ID は ASL と統合しない（Project/Auth/User すべて分離）。

**課金主体:** `auth.users.id` = `sync_profiles.id` = `user_entitlements.user_id` = `sync_rooms.owner_id`。アカウント API（退会 · 将来 Checkout）は **JWT の `sub`** のみをキーにする — メールはログイン用。詳細 [`SYNC_AUTH_POLICY.md`](SYNC_AUTH_POLICY.md) §5-6。

**データ配置:** パターン **(A) 固定スキーマ + jsonb blob** を採用。**(C)(D) は禁止。**

---

## 2. テーブル構成

### 2-0. Auth × 課金 × DB — 確定モデル（提督 2026-06-26）

**結論:** `auth.users.id`（UUID）を中心に FK を張る設計は **既にマイグレーションで確定**。メールは `auth.users` の列のみ · **アプリテーブルにメール列は持たない**。

```mermaid
erDiagram
  auth_users ||--o| sync_profiles : "id 1:1"
  auth_users ||--o{ user_entitlements : "user_id"
  auth_users ||--o{ sync_rooms : "owner_id"
  sync_rooms ||--|| sync_room_states : "room_id"

  auth_users {
    uuid id PK
    text email "ログイン用のみ"
  }
  sync_profiles {
    uuid id PK_FK
    text stripe_customer_id "S3 Checkout 後"
    timestamptz updated_at
  }
  user_entitlements {
    uuid id PK
    uuid user_id FK
    text type "per_event|subscription"
    int quantity
    timestamptz expires_at
    text stripe_checkout_session_id
  }
  sync_rooms {
    uuid id PK
    uuid owner_id FK
    text title
    text entitlement "trial|active|expired"
    text product_type "timeline|group|schedule"
    timestamptz retain_until
    date event_date
  }
  sync_room_states {
    uuid room_id PK_FK
    int revision
    jsonb payload
  }
```

| 操作 | DB 上の挙動 |
|------|-------------|
| **新規登録** | `auth.users` INSERT → **`sync_profiles` 1:1 作成**（未実装 · 下記 §6） |
| **退会** | `auth.users` DELETE → **CASCADE** で profiles · entitlements · rooms · states 全消去 |
| **メール変更** | `auth.users.email` のみ更新 · 課金テーブルにメール列なし |
| **Checkout（S3）** | Webhook が `user_entitlements` INSERT + `sync_profiles.stripe_customer_id` 更新 |
| **ルーム活性化** | `user_entitlements` を参照して `sync_rooms.entitlement` を `active` に（S3 ロジック） |

**RLS:** オーナーは `auth.uid() = owner_id` / `id` / `user_id`（SELECT のみ entitlements）。**書き込みは Functions + service role**（Webhook · 退会 · 将来 Checkout）。

### 2-1. 本番現行（2026-06-26 · マイグレーション 4 本適用済み）

```text
auth.users（Supabase 管理）
sync_profiles         — id PK FK → auth.users ON DELETE CASCADE
user_entitlements     — user_id FK → auth.users ON DELETE CASCADE
sync_rooms            — owner_id FK · entitlement · retain_until · product_type
sync_room_states      — room_id FK · revision · payload
```

`sync_rooms.stripe_customer_id` は **削除済み**（billing マイグレーション）。

### 2-2. 目標（S1.5 — room / state 統合）

Gemini §5 採用 — **state を room に内包**し PostgREST を1テーブルに:

```text
sync_profiles         — id (= auth.users) · stripe_customer_id
user_entitlements     — 課金権利（都度 / サブスク）· Webhook が INSERT
sync_rooms            — 汎用コンテナ（下記列）
```

| 列 | 型 | 備考 |
|----|-----|------|
| `product_type` | `timeline` \| `group` \| `schedule` | T13-S / T11-S / X02-S · **クラスター別**（§下記） |

**製品クラスター（提督 2026-06-26）:** `timeline`+`group` = イベント当日 · `schedule` = 工程クラスター（Timeline との横断シナジー薄）— [`SUGUDASU_SYNC_LINE.md`](SUGUDASU_SYNC_LINE.md) §3-0b。enum はルーティング用 · クラスター横断バンドル SKU は S3 まで設計しない。
| `event_public_id` | text unique | 公開共有ID（`se_` + `[a-z0-9]{12}`） |
| `revision` | int | 楽観的ロック |
| `payload` | jsonb | 製品ごとのコア JSON |
| `entitlement` | `trial` \| `active` \| `expired` | **部屋の実行時状態**（キャッシュ） |
| `staff_device_cap` | int | 同時スタッフ端末上限（価格パックで加算） |
| `retain_until` | timestamptz | パージ対象 |

`sync_room_states` は **廃止**（JOIN 削減 · RLS 単純化）。

### 2-3. 課金の二層 + クォータスコープ（**確定 · 案 C · 2026-06-26**）

**調査:** [`sync-entitlement-scope-gemini-RESULT.md`](sync-entitlement-scope-gemini-RESULT.md) · [`sync-entitlement-scope-grok-RESULT.md`](sync-entitlement-scope-grok-RESULT.md)  
**SSOT 数値:** [`SYNC_STORAGE_QUOTAS.md`](SYNC_STORAGE_QUOTAS.md) §3-1a

| 層 | テーブル | 役割 |
|----|----------|------|
| **権利の正本** | `user_entitlements` | Stripe Webhook · **`product_type` 列**（着地 · 参照 · S3） |
| **部屋の実行時** | `sync_rooms.entitlement` | キャッシュ · **`product_type`**（ルーティング · 既存列） |

| 状態 | β〜2製品目（**S-A'**） | S3（再評価） |
|------|------------------------|--------------|
| trial | アカウント横断 **1** | 同左 |
| active | アカウント **プール 3** | **クラスター別** SKU · 製品別必須なら **S-D** 検討 |
| トリガー | **現行維持** | S-D 採用時のみ改修 |

`stripe_customer_id` は **`sync_profiles`** のみ。

**Cursor 実装:** entitlements 列追加 · ルーム `product_type` 注入 · **クォータトリガーは触らない**（`20260625_sync_quotas.sql` 正本）。

---

## 3. 採用数値（Gemini §6 との差分）

Gemini の「同時50ルーム / TTL30日」は **コスト防衛のため採用しない**。

| 項目 | **採用値** | Gemini | 理由 |
|------|------------|--------|------|
| trial 同時ルーム | **1** | 3 | 試用は1イベント体験 |
| 課金 active 同時 | **3** | — | 幹事の現実的並行数 |
| 将来 Pro 月額 | **5** | 50 | 個人開発 Supabase 枠内 |
| payload 上限 | **512 KiB** | 200KiB〜2MiB | 班分け1,000行も想定 · 中間 |
| trial TTL | **30日**（作成基準） | 3日 | 検証猶予 |
| 課金 TTL | **event_date + 7日** | 30日 | イベント単位課金と整合 |
| パージ | **1日1回**（CF Cron） | 1h | MVP は日次で十分 |

---

## 4. ガバナンス実装

| 制御 | 方式 | フェーズ |
|------|------|----------|
| 所有権 | RLS `owner_id = auth.uid()` | S1 |
| payload サイズ | トリガー `payload_too_large` | S1 |
| 同時ルーム数 | トリガー `room_quota_exceeded` | S1 |
| 同時ルーム数（将来） | `user_entitlements` 参照に拡張 | S3 |
| 同時スタッフ端末数 | `staff_device_cap` で入室時に強制 | S2 |
| 公開ID衝突防止 | `event_public_id` unique + 正規表現check + `23505`再試行 | S1.5 |
| 期限切れ削除 | CF Cron → service role DELETE | S2 |
| 楽観的ロック | `UPDATE … WHERE revision = $expected` | S2 |

RLS へのインライン化は **任意**（トリガー優先 · コード重複時に統合）。

**βテレメトリ規律:** Dev Ops の利用状況指標は Postgres に保存しない（Cloudflare 側で集計）。

---

## 5. 版歴（Gemini §4 採用）

| サーバ | クライアント |
|--------|--------------|
| **最新1版のみ** | JSON エクスポート · localStorage ロールバック |
| revision 履歴テーブル **なし** | fair-draw 系は署名付き JSON DL（将来） |
| 競合 | Last-Write-Wins + revision 不一致で再読込 |

---

## 6. マイグレーション順

| ファイル | 内容 |
|----------|------|
| `20260625_sync_s1.sql` | rooms + states | **適用済** 2026-06-26 |
| `20260625_sync_retention.sql` | `retain_until` | **適用済**（2026-06-26 本番） |
| `20260625_sync_quotas.sql` | トリガー | **適用済** |
| `20260626_sync_billing_layer.sql` | profiles · entitlements · `product_type` · drop `stripe_customer_id` on room | **適用済** |
| `20260628_sync_entitlements_product.sql`（**未作成**） | `user_entitlements.product_type` · `stripe_price_id` · `status`（**案 C** · クォータ非結合） | **ENT-SCOPE-01** |
| `20260626_sync_event_public_id.sql`（未作成） | `event_public_id` 追加 · unique · prefix check | **未**（S1.5） |
| `20260626_sync_room_unify.sql`（未作成） | payload/revision を room に移し states 廃止 | **未**（S1.5） |

**本番適用の手順・変数:** [`SYNC_ENV_KEYS.md`](SYNC_ENV_KEYS.md) · 未作成マイグレーションは S1.5 で追加。

---

## 7. 変更履歴

| 日付 | 内容 |
|------|------|
| 2026-06-26 | §2-3 クォータスコープ **案 C 確定**（S-A' β · S3 で S-D 再評価） |
| 2026-06-26 | §2-0 Auth×課金 ER 確定 · `sync_profile_bootstrap` マイグレーション予定 |
| 2026-06-26 | 本番 Supabase 4 マイグレーション適用 · S1.5 用 2 本は未作成のまま |
| 2026-06-25 | Gemini 結果採否 · 数値オーバーライド · billing 二層 |
