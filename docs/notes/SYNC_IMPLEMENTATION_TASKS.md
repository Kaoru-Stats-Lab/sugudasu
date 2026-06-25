# SUGUDASU Sync — 実装タスク（S1.5→S2）

**更新:** 2026-06-25  
**目的:** 既存SSOTを実装順に分解し、着手迷いをなくす  
**関連:** `SYNC_EVENT_ID_AND_DASHBOARD_POLICY.md` · `SYNC_URL_INFORMATION_ARCHITECTURE.md` · `SYNC_CAPACITY_AND_PRICING_POLICY.md` · `SYNC_META_PLATFORM_GUARDRAILS.md`

---

## 0. 実装優先順（結論）

1. **A: セキュリティ境界**（公開ID・共有URL・RLS）
2. **C: インフラ/コスト境界**（接続cap・Presence・DB非テレメトリ）
3. **LP/SEO運用**（index/noindex・構造化データ）

---

## 1. S1.5 タスク（ID境界を先に固定）

### 1-1. DBマイグレーション

- [ ] `supabase/migrations/20260626_sync_event_public_id.sql` を作成
- [ ] `sync_rooms.event_public_id` 追加（NOT NULL）
- [ ] `CHECK (event_public_id ~ '^se_[a-z0-9]{12}$')`
- [ ] B-Tree unique index 追加
- [ ] 既存行 backfill（`se_` + 12桁）

### 1-2. 生成ロジック

- [ ] Sync専用ID生成ユーティリティ追加（小文字+数字のみ）
- [ ] insert時 `23505` を最大3回リトライ
- [ ] 3回失敗時 `event_id_generation_failed` を返す

### 1-3. 受け入れ

- [ ] `event_public_id` がすべて正規表現に一致
- [ ] 重複生成テストでリトライ動作確認

---

## 2. S2 タスク（共有URLと接続上限）

### 2-1. 共有URL `/e/{event_public_id}`

- [ ] `/e/{event_public_id}` の解決ルート追加
- [ ] `event_public_id -> room_id + product_type` を解決
- [ ] `/{product}/app?event={event_public_id}` へ 302
- [ ] `/e/*` は `X-Robots-Tag: noindex, nofollow` を維持

### 2-2. 同時端末上限

- [ ] `sync_room_connections` テーブル追加（短命セッション）
- [ ] `sync_claim_device_slot` RPC
- [ ] `sync_release_device_slot` RPC
- [ ] heartbeat 更新（15〜30秒）
- [ ] cap超過時 `device_cap_reached` をUI表示

### 2-3. Tool Admin（最小）

- [ ] 接続数/上限表示（Presence state件数ベース）
- [ ] 保存期限（retain_until）表示
- [ ] 共有URLコピー導線

---

## 3. β運用タスク（Dev Ops 可視化）

運用窓口:

- 不具合・改善フォーム: [SUGUDASU Sync β 不具合・改善フォーム](https://docs.google.com/forms/d/e/1FAIpQLSchvqtu9j3FL4KTxSG70txXwbREaJFZ-IrdwAKjuCRWz5jaPw/viewform?usp=publish-editor)
- 回答管理シート: [Sync β フィードバック管理](https://docs.google.com/spreadsheets/d/1LNjUDMiQW5klQlmrtRjDx_AHtf-EQRKYVnOZAJedl64/edit?usp=sharing)

回答管理シート `status` 運用定義:

- `new`: 新規受付（未トリアージ）
- `triaged`: 分類・優先度判定済み
- `in_progress`: 対応中（修正/調査）
- `resolved`: 対応完了（反映済み）

### 3-1. メトリクス収集（Postgres非保存）

- [ ] Cloudflare Analytics/Logs へ送信導線
- [ ] `device_cap_reached` カウント
- [ ] 反映遅延P95（save→反映完了）計測
- [ ] save/claim失敗率の計測

### 3-2. Dev Opsダッシュボード

- [ ] 日別アクティブイベント数
- [ ] 同時接続ピーク
- [ ] 上限到達回数
- [ ] 失敗率

### 3-3. ガード

- [ ] PostgresにDev Ops専用ログテーブルを作らない
- [ ] 接続率70%/85%アラート導線

---

## 4. LP/SEOタスク

- [ ] `sync.sugudasu.com/` をHub LPとして整備
- [ ] `/{product}` LP、`/{product}/app` 実作業の2層を実装
- [ ] Appは noindex,nofollow（X-Robots-Tag）
- [ ] LPに `SoftwareApplication` + `Offer` JSON-LD
- [ ] sitemap をLP中心で生成

---

## 5. 完了定義（Done）

- [ ] 共有URL `/e/{event_public_id}` が安定動作
- [ ] event_public_id衝突ガード（regex+unique+retry）完了
- [ ] 同時端末capが実効（claim/release/heartbeat）
- [ ] Tool Admin と Dev Ops の最小ダッシュボード表示
- [ ] βテレメトリがPostgres非依存で運用開始

