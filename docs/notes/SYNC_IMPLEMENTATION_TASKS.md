# SUGUDASU Sync — 実装タスク（S1.5→S2）

**更新:** 2026-06-26  
**目的:** 既存SSOTを実装順に分解し、着手迷いをなくす  
**関連:** `SYNC_EVENT_ID_AND_DASHBOARD_POLICY.md` · `SYNC_URL_INFORMATION_ARCHITECTURE.md` · `SYNC_CAPACITY_AND_PRICING_POLICY.md` · `SYNC_META_PLATFORM_GUARDRAILS.md`

### ドキュメント分担（MECE）

| ドキュメント | スコープ |
|--------------|----------|
| [`SYNC_ENV_KEYS.md`](SYNC_ENV_KEYS.md) | 環境変数 · Supabase Auth URL · セットアップ完了表 |
| [`SYNC_INFRA_CLOUDFLARE.md`](SYNC_INFRA_CLOUDFLARE.md) | CF Pages · 手動デプロイ · DNS |
| [`SYNC_S1_ARCHITECTURE.md`](SYNC_S1_ARCHITECTURE.md) | S1 技術境界 · 受け入れ（インフラ vs E2E） |
| **本ファイル** | **これから着手する実装タスク**（S1.5 以降） |
| [`BACKLOG.md`](../BACKLOG.md) §5-4 | マイルストーン台帳 |

---

## 0. S1 インフラ・結合（完了 2026-06-26）

詳細は上記 SSOT 参照。ここでは **Done のみ** 記録する。

- [x] Sync 専用 Supabase プロジェクト（ASL 非混線）
- [x] マイグレーション 4 本 · RLS
- [x] Auth URL · マジックリンク
- [x] CF `sugudasu-sync` 環境変数（anon / service_role 分離）
- [x] 本番 `/timeline/app/` UI 結合（env エラー解消 · ログインフォーム）

---

## 0.5. 実装優先順（結論 · S1.5 以降）

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
- [ ] JSONエクスポート（`SYNC_RETENTION_POLICY`）— 成功直後に **フィードバックオーバーレイ**（§2-4）

### 2-4. フィードバック収集（**S2 Must · 出荷ゲート**）

**正本:** [`SYNC_POST_EVENT_REVIEW.md`](SYNC_POST_EVENT_REVIEW.md)

#### フロント（アプリ内マイクロ UI）

- [ ] `assets/sync-feedback-client.js` — POST · localStorage 抑制
- [ ] `assets/sync-feedback-export-overlay.js` — エクスポート直後 😭/😮/◎ + 😭時ドリルダウン
- [ ] `assets/sync-feedback-sticky.js` — 共有URL最下部 👍/👎（1日1回/端末）
- [ ] 初回「確定反映」成功直後 — はい/いいえ（`flush_success` · 1イベント1回）
- [ ] エクスポートオーバーレイ内 **invoice 領収書** 導線
- [ ] 「詳しく報告」→ 既存 β 不具合フォーム（別タブ）

#### API（Cloudflare Pages Functions）

- [ ] `functions/api/sync/feedback.js` — POST · Sheet 追記 · レート制限
- [ ] `functions/api/sync/feedback-summary.js` — GET · Dev Ops 集計 JSON

#### Dev Ops ダッシュボード（**必須**）

- [ ] `tools/sync-dev-ops.html`（または `/dev-ops` ルート）
- [ ] F1 直近50件一覧
- [ ] F2 シグナル集計7日
- [ ] F3 😭+👎 24h アラート
- [ ] F4 Editor→Owner 見込み
- [ ] F5 LP 引用候補
- [ ] F6 ドリルダウン内訳
- [ ] F7 LP用 分子/分母/率 + コピーテンプレ（§8-3）
- [ ] 送信後60秒以内に F1 反映（受け入れ）

#### GAS · Sheet

- [ ] スプレッドシート `post_event_review` タブ
- [ ] `gas/sync-feedback-ingest.gs` — 追記 · doGet 集計
- [ ] 😭 / 👎 で Telegram 通知（任意だが推奨）

---

## 3. β運用タスク（Dev Ops 可視化）

運用窓口:

- 不具合・改善フォーム: [SUGUDASU Sync β 不具合・改善フォーム](https://docs.google.com/forms/d/e/1FAIpQLSchvqtu9j3FL4KTxSG70txXwbREaJFZ-IrdwAKjuCRWz5jaPw/viewform?usp=publish-editor)
- 回答管理シート: [Sync β フィードバック管理](https://docs.google.com/spreadsheets/d/1LNjUDMiQW5klQlmrtRjDx_AHtf-EQRKYVnOZAJedl64/edit?usp=sharing)
- **イベント終了レビュー仕様:** [`SYNC_POST_EVENT_REVIEW.md`](SYNC_POST_EVENT_REVIEW.md)（Form 新規 · 割引インセンティブなし）

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
- [ ] **フィードバック F1–F7**（§2-4 · `SYNC_POST_EVENT_REVIEW.md`）— **S2 未完了扱い if 欠落**

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
- [ ] **フィードバック3箇所（エクスポート直後 · 確定反映 · 👍/👎）が動作**
- [ ] **Dev Ops で直近フィードバック50件が60秒以内に表示**
- [ ] βテレメトリがPostgres非依存で運用開始

