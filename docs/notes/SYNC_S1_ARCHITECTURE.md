# SUGUDASU Sync — Phase S1 技術アーキテクチャ

**更新:** 2026-06-25  
**フェーズ:** S1（Auth · ルーム · クラウド保存）· 同期プロトコルは **S2**  
**製品 SSOT:** [`SUGUDASU_SYNC_LINE.md`](SUGUDASU_SYNC_LINE.md) · **DB SSOT:** [`SYNC_DB_ARCHITECTURE.md`](SYNC_DB_ARCHITECTURE.md) · インフラ: [`SYNC_INFRA_CLOUDFLARE.md`](SYNC_INFRA_CLOUDFLARE.md)

---

## 1. レイヤ構成（確定方針）

```text
[ ブラウザ @ sync.sugudasu.com ]
  ├─ 静的 HTML/JS（dist-sync/ · focus chrome）
  ├─ Supabase Auth（クライアント · anon key）— マジックリンク / Google
  ├─ PostgREST + RLS（クライアント）— ルーム CRUD · payload 保存
  └─ timeline-engine.js 共有（payload = TimelineState JSON）

[ Cloudflare Pages Functions @ /api/* ]
  ├─ GET /api/health          — 疎通（S1）
  ├─ POST /api/webhooks/stripe  — **S3 のみ**（S1 は 501 スタブ）
  └─ （将来）課金 Checkout セッション作成 · サーバ側 entitlement 更新

[ Supabase Postgres ]
  ├─ sync_rooms（owner · title · entitlement · retain_until）— **固定テーブル · 行＝イベント1件**
  └─ sync_room_states（room_id · revision · payload jsonb）— **ルームあたり1行**
```

**イベントごとに PostgreSQL テーブルは増やさない。** 上限は **アクティブ行数**（`SYNC_STORAGE_QUOTAS.md`）。

**コア `sugudasu.com` には Auth / API / Supabase を載せない。**

---

## 2. 課金 API — 今考えておくこと（提督 Q&A）

### 結論

**はい。`sync.sugudasu.com/api/*` にサーバーレス API 層を置く前提で設計してよい。**  
ただし **S1 では Stripe を実装しない**。次だけ S1 で入れておく:

| 項目 | S1 | S3（課金） |
|------|-----|------------|
| `sync_rooms.entitlement` | `trial` 固定で可 | `active` / `expired` を Webhook で更新 |
| `sync_rooms.stripe_customer_id` | —（`sync_profiles` へ移行） | Checkout 完了後に profile へ設定 |
| `/api/webhooks/stripe` | **501 スタブ**（ルート存在のみ） | 署名検証 + entitlement 更新 |
| `/api/billing/checkout` | なし | Checkout Session 作成 |
| 保存 API の課金ゲート | **未実装**（trial 無制限） | Function or RLS で `entitlement=active` |

### なぜ S1 で Stripe を入れないか

- S1 の成功指標は **登録 → ルーム作成 → 保存 → 再開**（`SUGUDASU_SYNC_LINE.md` §6）
- 課金は **K3 · Phase S3** — Sync の aha! は **S2 の手動反映同期**
- Stripe Webhook は **秘密鍵・署名検証** が必須 → Pages Functions が正しい置き場

### S3 までに揃えるデータモデル（S1 でテーブルだけ用意）

- `entitlement`: `trial` | `active` | `expired`（部屋の実行時状態）
- `user_entitlements`: 課金権利の正本（S3 · Webhook が INSERT）
- `sync_profiles.stripe_customer_id`: Customer Portal 用
- `sync_rooms.staff_device_cap`: イベント単位の同時スタッフ端末上限（価格パックで加算）

**RevenueCat は採用しない**（Web 幹事 SaaS · イベント単位課金 → Stripe Checkout が SSOT 方針）。

---

## 3. S1 スコープ（IN / OUT）

### IN

- [x] Supabase Auth（メールマジックリンク）
- [x] `sync_rooms` 作成 · 一覧（オーナーのみ）
- [x] `sync_room_states` への payload 保存 · 読み込み（`revision` 単調増加）
- [x] `sync-timeline.html` 上の S1 UI（ログイン · ルーム選択 · 保存/再開）
- [x] `/api/health` · `/api/webhooks/stripe` スタブ

### OUT（S2 以降）

- Push / Pull · 「新しい版があります」バナー
- 閲覧専用 URL · RBAC
- Stripe Checkout · 本番 Webhook
- スタッフ端末 cap を使った入室制御（上限到達時の拒否/待機）
- `timeline-sync-app.js` フルエディタ（コア UI 相当）は S1 後半〜S2
- **サーバ側の revision 履歴**（最新1版のみ · 版歴はエクスポートで代替）

### 保持・削除（S1 必須）

正本: [`SYNC_RETENTION_POLICY.md`](SYNC_RETENTION_POLICY.md) · [`SYNC_STORAGE_QUOTAS.md`](SYNC_STORAGE_QUOTAS.md)

- オーナー **手動削除**（ルーム + state CASCADE）
- `retain_until` — **無期限保持しない**
- **同時アクティブルーム上限**（trial 1 · active 3）— DB トリガー
- **JSON エクスポート** — 長期ログはユーザー保管
- 「アーカイブ」= クラウド永久保存 **ではない**

### 容量・同時接続（S2 必須）

正本: [`SYNC_CAPACITY_AND_PRICING_POLICY.md`](SYNC_CAPACITY_AND_PRICING_POLICY.md)

- 1イベント課金に同時スタッフ端末上限を内包（初期 5 端末）
- 追加課金で `staff_device_cap` を加算
- 入室時に cap 超過なら拒否（または待機）
- ルーム画面に「現在接続数 / 上限」を常時表示
- 実装は `sync_room_connections` + heartbeat TTL + claim/release RPC（`SYNC_CAPACITY_AND_PRICING_POLICY.md` §6）

### LP とアプリのURL分離（課金導線）

正本: [`SYNC_CAPACITY_AND_PRICING_POLICY.md`](SYNC_CAPACITY_AND_PRICING_POLICY.md) §7

- LP: `https://sync.sugudasu.com/`
- 実作業: `https://sync.sugudasu.com/timeline`
- 課金導線（Checkout）は LP 経由で説明責務を満たす

---

## 4. 環境変数

正本: [`SYNC_ENV_KEYS.md`](SYNC_ENV_KEYS.md)

| 層 | 変数 | 公開 |
|----|------|------|
| ビルド（Sync） | `SYNC_SUPABASE_URL` · `SYNC_SUPABASE_ANON_KEY` | anon はクライアント可 |
| CF Functions | `SUPABASE_URL` · `SUPABASE_SERVICE_ROLE_KEY` | 秘密 · S3 以降で本格利用 |
| CF Functions（S3） | `STRIPE_SECRET_KEY` · `STRIPE_WEBHOOK_SECRET` | 秘密 |

---

## 5. 受け入れ基準（S1）

- [ ] 未ログイン → メール入力 → マジックリンク → `sync.sugudasu.com` に戻ってセッション成立
- [ ] ルーム新規作成 → タイトル表示
- [ ] 進行表 JSON をクラウド保存 → 別タブ/再読込で同じ内容を復元
- [ ] **ルーム削除** → クラウドから消え閲覧不可 · `retain_until` 表示
- [ ] `sugudasu.com` に Auth Cookie が漏れない（Supabase storage は sync ドメインのみ）
- [ ] `/api/health` が 200

---

## 6. 関連

| パス | 内容 |
|------|------|
| `supabase/migrations/20260625_sync_s1.sql` | rooms + states · RLS |
| `supabase/migrations/20260625_sync_retention.sql` | retain_until |
| `supabase/migrations/20260625_sync_quotas.sql` | トリガー上限 |
| `supabase/migrations/20260626_sync_billing_layer.sql` | profiles · entitlements · product_type |
| `docs/notes/SYNC_CAPACITY_AND_PRICING_POLICY.md` | 同時端末上限 · 価格 · フロント性能予算 |
| `docs/notes/SYNC_DB_ARCHITECTURE.md` | DB メタ原則 · Gemini 採否 |
| `assets/sync-auth.js` | Auth UI |
| `assets/sync-room-store.js` | ルーム · state CRUD |
| `assets/sync-timeline-s1-app.js` | S1 画面 |
| `functions/api/*` | Pages Functions |
