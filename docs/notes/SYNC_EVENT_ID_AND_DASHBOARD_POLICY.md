# SUGUDASU Sync — Event ID 衝突防止とダッシュボード方針

**更新:** 2026-06-25  
**関連:** `SYNC_URL_INFORMATION_ARCHITECTURE.md` · `SYNC_DB_ARCHITECTURE.md` · `SUGUDASU_SYNC_LINE.md`

---

## 1. Event ID 衝突防止（コア無料 vs Sync）

結論: **外部公開IDは名前空間を分離**し、同一文字列の偶然衝突を構造的に防ぐ。

### 1-1. 原則

- コア無料（`sugudasu.com`）と Sync（`sync.sugudasu.com`）で、公開IDの発行器を分離する。
- Sync の共有URLは `event_public_id` のみを使い、内部PK（uuid）を外に出さない。
- 「同じIDでもログインで弾ける」前提に依存しない。ID層で先に事故を潰す。

### 1-2. 推奨仕様（採用）

| 項目 | 仕様 |
|------|------|
| 共有URL | `https://sync.sugudasu.com/e/{event_public_id}` |
| 形式 | `a-z0-9` の 12文字（Base36 変種） |
| 名前空間 | 先頭プレフィックス `se_`（sync event）を必須化 |
| 例 | `se_k3j9f2n8m7q5` |

> UIでは `se_` を見せなくてもよい（コピー文字列では保持）。

### 1-3. DB ガードレール

- `sync_rooms.event_public_id` 列を追加（B-Tree unique index）
- `check (event_public_id ~ '^se_[a-z0-9]{12}$')`
- 生成関数は Sync 専用（コア側と共有しない）

### 1-4. 一意制約違反の再試行（必須）

- `event_public_id` 生成時、`23505`（unique_violation）を検知したら自動リトライ
- 最大 3 回まで再生成して再INSERT
- 3回失敗時のみ `event_id_generation_failed` を返し、500生表示を避ける

---

## 2. β期間ダッシュボード（課金APIなし）

課金APIを使わないβでは、**売上管理ではなく利用状況可視化**を優先する。

### 2-1. 2種類のダッシュボード

| 種別 | 対象 | 目的 |
|------|------|------|
| Tool Admin Dashboard | 各ツール運営者（幹事側） | 現場運用に必要な最小情報 |
| Sync Dev Ops Dashboard | Sync 開発/運用者（提督） | 全体の負荷・品質・改善判断 |

### 2-2. Tool Admin Dashboard（最小）

表示は絞る（「見せる情報は少なくてよい」という方針を採用）:

- 現在のイベント名
- 共有URLコピー
- 現在接続数 / 上限（**Supabase Realtime Presence の state 件数**）
- 最終更新時刻
- 保存期限（retain_until）

### 2-3. Sync Dev Ops Dashboard（β必須 · **S2 出荷ゲート**）

β運用で見るべき KPI。**フィードバックはデフォルトタブ**（品質改善が主目的）。

**正本（マイクロ UI · API · 必須ウィジェット）:** [`SYNC_POST_EVENT_REVIEW.md`](SYNC_POST_EVENT_REVIEW.md)

#### 運用メトリクス（Postgres非保存 · Cloudflare 側）

- 日別アクティブイベント数
- 同時接続ピーク（5分刻み）
- 上限到達回数（`device_cap_reached`）
- 反映遅延P95（手動反映含む）
- 失敗率（save失敗 / claim失敗）
- 無料コア → Sync 遷移数（流入把握）

#### フィードバック（**実装必須 · Sheet 経由**）

| ID | ウィジェット | 必須 |
|----|-------------|------|
| F1 | 直近フィードバック一覧（50件） | ○ |
| F2 | シグナル集計 7日（great/ok/bad/up/down） | ○ |
| F3 | 😭+👎 24h アラート（≥3件で赤バナー） | ○ |
| F4 | Editor → Owner 見込み（`editor_next_host`） | ○ |
| F5 | LP 引用候補（`lp_quote`） | ○ |
| F6 | ドリルダウン内訳 | ○ |
| F7 | LP用 分子/分母/率（R1–R5）+ コピーテンプレ | ○ |

**データ経路:** アプリ → `POST /api/sync/feedback` → Google Sheet `post_event_review` → `GET /api/sync/feedback/summary` → Dev Ops UI。**Postgres に本文を保存しない。**

**LP 公開ルール:** `SYNC_POST_EVENT_REVIEW.md` §8 — **分子・分母・期間・対象** なしの率は LP に載せない。F7 が唯一の正本。

**受け入れ:** マイクロ送信後 **60秒以内** に F1 に行が出ること。出ない場合 **S2 未完了**。

**テレメトリ方針:**

- Dev Ops メトリクスは Cloudflare 側（Analytics/Logs）＋ **Sheet 集計（フィードバック）**
- Postgres に専用メトリクス／フィードバックテーブルを作らない（500MB枠温存）

---

## 3. フェーズ

| フェーズ | 出荷物 |
|---------|--------|
| S1.5 | `event_public_id` 導入（`se_`） |
| S2 | `/e/{event_public_id}` 解決 + Tool Admin 最小表示 + **フィードバック収集・Dev Ops 表示** |
| S2+ | Sync Dev Ops βダッシュボード（集計 · F1–F6 完了） |

---

## 4. 受け入れ基準

- [ ] Sync の公開URL ID が `^se_[a-z0-9]{12}$` を満たす
- [ ] `event_public_id` に B-Tree unique index がある
- [ ] `23505` 時に最大3回のサイレント再試行が実装されている
- [ ] Tool Admin 画面の接続数が Presence 由来（DBポーリングなし）で表示される
- [ ] Dev Ops 画面で日別イベント数・接続ピーク・失敗率が見える
- [ ] **Dev Ops で直近フィードバック50件（F1）とシグナル集計（F2）が見える**（`SYNC_POST_EVENT_REVIEW.md`）
- [ ] マイクロ送信後60秒以内に F1 に行が出る
- [ ] Postgres 内に Dev Ops 専用ログテーブルが存在しない
- [ ] Postgres 内にフィードバック本文テーブルが存在しない

