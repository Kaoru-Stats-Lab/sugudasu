# Gemini + Grok 依頼用: Sync 権利・trial スコープ（人単位 vs 製品単位）

**論点:** `auth.users.id` は一本のまま · **trial / 同時ルーム / 課金権利** をアカウント全体で数えるか、`product_type` ごとに数えるか  
**保存先:**  
- Gemini → `docs/notes/sync-entitlement-scope-gemini-RESULT.md`  
- Grok → `docs/notes/sync-entitlement-scope-grok-RESULT.md`  
**更新:** 2026-06-26

---

## 役割分担（強みを活かす）

| AI | 役割 | 得意領域 |
|----|------|----------|
| **Gemini** | **第1パス — 業界調査・比較表・SSOT 草案** | 他社 SaaS の entitlement 設計 · 料金心理学 · DB スキーマ案の MECE · Stripe 連携パターン |
| **Grok** | **第2パス — 反証・当日幹事視点・ abuse** | Gemini 案への穴あけ · イベント本番パニック · trial 悪用 · 実装落とし穴 · 提督方針との衝突チェック |

```text
Gemini（本ファイル §A）→ RESULT 保存
  → Grok（§B + Gemini RESULT 添付）→ RESULT 保存
  → Agent §12 照合 → SYNC_STORAGE_QUOTAS.md / SYNC_DB_ARCHITECTURE.md へ SSOT 1段落
```

---

## 共有コンテキスト（両 AI に共通 · 変更しない）

### プロダクト

| 項目 | 内容 |
|------|------|
| **ライン** | SUGUDASU Sync · `sync.sugudasu.com` · コア `sugudasu.com` とは **Auth 非共有** |
| **正本 ID** | `auth.users.id`（JWT `sub`）· メールはログイン用のみ · **変更不要** |
| **β** | Stripe 本番なし · S3 まで課金 API 保留 |
| **製品（予定）** | `timeline`（T13-S 進行）· `group`（T11-S 班分け）· `schedule`（X02-S 工程表） |
| **URL** | `/{product}/app` · 共有 `/e/{event_public_id}` → `product_type` で振り分け |
| **1ルーム** | 1イベント · `payload` jsonb · `retain_until` でパージ |
| **幹事** | 年数回イベント · 当日オペ最優先 · UI は最小開示（quota 哲学を FAQ 化しない） |

### 現行 DB（事実）

```text
auth.users.id
  ├─ sync_profiles (1:1 · stripe_customer_id)
  ├─ user_entitlements (type: per_event|subscription · quantity · expires_at)
  │     ※ product_type 列はまだない
  └─ sync_rooms (owner_id · product_type · entitlement trial|active|expired)

quota トリガー（実装済）:
  sync_count_active_rooms(owner_id) — product_type で絞っていない
  trial 同時 1 · active 同時 3 · payload 512KiB/room
```

### 候補スコープ（MECE で比較せよ）

| ID | 名称 | 概要 |
|----|------|------|
| **S-A** | **アカウント全体** | 登録者あたり trial 同時 **1**（製品横断）· 今のトリガーに近い |
| **S-B** | **製品別** | `product_type` ごとに trial 同時 **1**（最大3製品なら最大3 trial ルーム） |
| **S-C** | **ウォレット型** | `user_entitlements` に `product_type`（または `sku`）· Stripe が製品別に INSERT |
| **S-D** | **ハイブリッド** | trial は S-A · 課金 active は S-C（製品別チケット消費） |
| **S-E** | **その他** | あなたが業界から見つけた第5案（1行で命名） |

### 提督の初期仮説（検証対象 · 固定ではない）

- ID は `auth.users.id` 一本で **十分** — 問題は権利の **数え方**
- trial を製品別にすると **コスト・悪用** が増える懸念
- trial をアカウント全体1だと **2製品目を試せない** 不満が出る懸念
- **S3 / 2製品目の前** に SSOT 化したい

---

## §A — Gemini 用（コピペ）

```text
あなたは B2B/B2C ハイブリッド SaaS のプロダクトアーキテクト兼課金設計の専門家です。

**SUGUDASU Sync**（イベント幹事向け · 複数製品ライン `sync.sugudasu.com`）について、
**trial と課金権利（entitlement）を「人単位（アカウント全体）」と「製品単位（product_type）」のどちらで数えるべきか**
を調査し、**SSOT 草案**を出してください。

前置き不要。**日本語** · 構造化ドキュメントのみ · 推測は「仮説」と明記。

---

## 1. リサーチ依頼

### 1-1. 比較調査（各 5〜10 行）

以下が **マルチプロダクト / マルチSKU** で trial・枠・権利をどう数えているか:

- **Notion** — Workspace vs 個人 · 複数プロダクト横断
- **Figma** — ファイル数 / チーム / SKU
- **Airtable** — Base 数とプラン
- **Canva** — 複数ツール横断の無料枠
- **Basecamp** — アカウント単位のシンプル枠
- **Stripe Billing 自体のベストプラクティス** — Customer 1人 + 複数 Price/Product
- **イベント単位都度課金 SaaS**（チケット型 · 参考: イベント管理・予約系）

### 1-2. 必須の問い

1. **trial を製品別にする SaaS は多いか？** メリット・デメリット（コスト · 転換率 · サポート）
2. **1 Customer · 複数 Product（Stripe）** と **DB の user_entitlements** はどう対応させるか？
3. **同時アクティブルーム上限** を製品横断で数える場合の **UX 文言**（説教なしで事実だけ伝える方法）
4. **悪用:** 製品別 trial で同一人物が3製品×複数アカウント — 防ぎ方は人単位とどう違うか
5. **2製品目 launch 時** にスコープを後から変える **マイグレーションリスク**（S-A→S-B 等）
6. **SUGUDASU の幹事ペルソナ**（年数回 · 進行+班分けを別イベントで使う）にとって直感が合うのはどちらか

---

## 2. 出力フォーマット（順序固定）

### §1 Executive Summary（300字 · 推奨スコープを1つ明示: S-A〜E）

### §2 候補スコープ比較マトリクス（必須）

| スコープ | trial 数え方 | 課金権利 | DB 変更 | Stripe 連携 | 幹事UX | コスト防衛 | 2製品目 launch | 総合 |
|----------|-------------|----------|---------|-------------|--------|------------|----------------|------|
| S-A アカウント全体 | … | … | 小/中/大 | … | ◎△× | … | … | … |
| S-B 製品別 | … | … | … | … | … | … | … | … |
| S-C ウォレット | … | … | … | … | … | … | … | … |
| S-D ハイブリッド | … | … | … | … | … | … | … | … |
| S-E （あなたの案） | … | … | … | … | … | … | … | … |

### §3 推奨 SSOT 草案（SUGUDASU Sync · β→S3）

**必須サブセクション:**

#### 3-1. 採用スコープ（1つ）と却下理由

#### 3-2. 数値表（trial · active 同時 · 製品横断か否か）

| 状態 | スコープ | 同時上限 | 備考 |
|------|----------|----------|------|

#### 3-3. `user_entitlements` スキーマ追記案（列名 · 型 · 例）

`product_type` を足すか · `stripe_price_id` か · 両方か

#### 3-4. quota トリガー変更案（疑似 SQL 1ブロック）

`sync_count_active_rooms` をどうフィルタするか

#### 3-5. UI 露出（最小開示 · アカウントに載せない）

ルーム一覧 / 作成時 / 編集画面 — 事実のみ（日付 · 枠数字 · ロック理由）

#### 3-6. Stripe（S3 接続時）

Checkout metadata · Webhook が INSERT する entitlement 行の形

### §4 移行・段階導入

- **β（今）:** トリガーはそのまま / 微修正どちらか
- **2製品目（group）リリース前:** 必須変更リスト
- **S3 課金接続時:** Webhook 実装順

### §5 未決・要提督判断（最大5件）

### §6 参考 URL

---

## 3. 禁止・制約

- `auth.users.id` 正本を覆す提案（メールを ID にする等）は不要
- β で Stripe 実装手順の詳細コードは不要（データ形だけ）
- **無制限 trial / 無制限ルーム** は禁止（Supabase コスト防衛）
- ユーザー向け FAQ に grace 日数・quota 哲学の長文説教を推奨しない
- コア sugudasu.com と Auth 統合は論外

出力ファイル名: `sync-entitlement-scope-gemini-RESULT.md`
```

---

## §B — Grok 用（Gemini 受取後にコピペ）

```text
【役割】懐疑的な SaaS 課金アーキテクト + イベント当日幹事のオペ体験レビュアー。礼賛禁止。
【タスク】添付 Gemini 結果を突合し、trial/権利スコープ（人単位 vs 製品単位）の盲点・反証・ abuse を洗い出し、最終推奨を1つに絞るか「Gemini維持」と明示。
【禁止】auth.users.id 正本の変更 · 無制限枠 · β Stripe 実装コード · 全体の書き直し
【必須】指定フォーマットのみ。挨拶不要。日本語。

---

## 提督の制約（覆すなら §6 で反証必須）

- ID: `auth.users.id` 一本 · 製品が数本増えてもアカウントは1つ
- β: 課金 API なし
- UI: 最小開示 — quota 内訳の FAQ 化しない
- 現行トリガー: `sync_count_active_rooms(owner_id)` は product_type 非フィルタ
- 製品: timeline · group · schedule

---

## あなたにやってほしいこと

1. Gemini §2 マトリクスの **総合列** を再採点（当日幹事 · 個人開発コスト · abuse の3軸）
2. **S-A（アカウント全体1 trial）** と **S-B（製品別1 trial）** を正面から比較 — 幹事が「進行は試したが班分けは試せない」パターン
3. **ウォレット型 S-C** が over-engineering かどうか（3製品規模で）
4. Gemini の `user_entitlements` スキーマ案の **マイグレーション地獄** リスク
5. **悪用シナリオ** 3つ（製品別 trial を選んだ場合 / 人単位を選んだ場合で差があるもの）

---

## 出力フォーマット

### §1 総評（200字 · Gemini 推奨への賛否）

### §2 スコープ再採点表

| スコープ | 幹事当日 | コスト | abuse耐性 | 実装コスト | 再判定 |

### §3 S-A vs S-B 深掘り（表 + 各2つの具体シナリオ）

シナリオは「イベント前日」「本番30分前」で幹事の行動を1文ずつ

### §4 スキーマ・トリガーへの反証

| Gemini 提案 | 判定（支持/修正/却下） | 理由 | 代替 |

### §5 abuse シナリオ（3件）

### §6 最終推奨（1つ · S-A〜E）

**採用スコープ名** · **trial 数値** · **active 数値** · **user_entitlements 追記列（あれば）**

### §7 提督への一言（100字以内）

### §8 実装落とし穴（bullet 5つ以内）

---

## 添付

（`sync-entitlement-scope-gemini-RESULT.md` 全文をここに貼る）

出力ファイル名: `sync-entitlement-scope-grok-RESULT.md`
```

---

## Agent 照合（両 RESULT 受取後）

- [x] 推奨スコープ **案 C 確定**（2026-06-26）
- [x] `SYNC_STORAGE_QUOTAS.md` §3-1a · `SYNC_DB_ARCHITECTURE.md` §2-3 反映済
- [ ] `user_entitlements` 追記が `20260626_sync_billing_layer.sql` と整合（**ENT-SCOPE-01** マイグレーション）
- [x] UI 方針 — 単一 X/Y · 最小開示（`SYNC_RETENTION_POLICY` §3-2）
- [x] `BACKLOG.md` §5-4 ENT-SCOPE-* 更新済

**SSOT 反映先（確定後）:**

| ドキュメント | 追記内容 |
|--------------|----------|
| `SYNC_STORAGE_QUOTAS.md` | §3-1 スコープ列 · 製品横断/別 |
| `SYNC_DB_ARCHITECTURE.md` | §2-3 `user_entitlements.product_type` |
| `BACKLOG.md` §5-4 | マイグレーションタスク |

---

## 変更履歴

| 日付 | 内容 |
|------|------|
| 2026-06-26 | 初版 · 人単位 vs 製品単位 · Gemini/Grok 2パス |
