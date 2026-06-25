# SUGUDASU Sync — イベントフィードバック仕掛け SSOT（実装必須）

**更新:** 2026-06-25（v2 · In-Context マイクロ + Dev Ops ダッシュボード必須）  
**ステータス:** **S2 出荷ゲート（Must）** · T11-S / T13-S 共通  
**関連:** `SYNC_EVENT_ID_AND_DASHBOARD_POLICY.md` · `SYNC_IMPLEMENTATION_TASKS.md` · `GROUP_SPLIT_SYNC_BILLING_CTA_AND_QUOTE.md` · `SYNC_RETENTION_POLICY.md`

> **採用モデル:** ① **In-Context（Aha / エクスポート直後）** ＋ ② **Zoom型マイクロサーベイ（1タップ）**。  
> **却下:** Uber 相互ロック · 数日後メール追撃（主導線） · 割引インセンティブ · Postgres への本文保存。

**実装必須:** 本仕様の **§3〜§6** は Sync S2 の **Done 条件**。Dev Ops ダッシュボードに **生フィードバックが表示されない状態で S2 完了としない。**

---

## 1. メタ原則（3本 · 採用/却下）

| # | 原則 | SUGUDASU での適用 |
|---|------|-------------------|
| **① In-Context** | 価値を感じた直後・作業終着点に 1 タップ | **JSON エクスポート完了直後**（Owner）· **初回「確定反映」成功直後**（Owner · 1回） |
| **② 相互インセンティブ（非金銭）** | 次アクションの一部にする | エクスポート完了オーバーレイ · 👎 時のみ深掘り（2問まで） |
| **③ Closing the Loop** | 声が届いた手応え | Dev Ops で集計可視化 · LP Changelog へ月次反映（手動） |

| 却下 | 理由 |
|------|------|
| Uber/Airbnb 相互レビューロック | 合同イベントの Editor に不適合 |
| G2 全文フォーム（初期） | 重い。稟議向け1問は Owner 深掘りのみ |
| メール「ご利用はいかがでしたか」主導線 | 回収率 1–3%。補助リマインドのみ可 |

---

## 2. 収集ポイント（3箇所 · すべて実装必須）

### 2-1. Owner — エクスポート直後マイクロ（**主・網羅の核**）

**トリガー:** `JSONをエクスポート` 成功直後、または `retain_until` 24h 前のパージ警告からエクスポートした直後。

```text
🎉 エクスポートが完了しました。データはお手元に保存されました。

Q. 本日の Sync 同期はいかがでしたか？（1タップ）
[ 😭 遅延・切断 ]  [ 😮 普通 ]  [ ◎ 助かった ]

（😭 のみ次画面）
  どこが困りましたか？（複数可 · 最大3）
  □ 反映が遅い / 切断  □ 班・進行が更新されない  □ 端末上限
  □ 画面が分かりにくい  □ その他（任意1行）

[ 領収書を作成（invoice） ]   [ 閉じる ]
```

| 項目 | 値 |
|------|-----|
| `source` | `export_overlay` |
| `signal` | `bad` / `ok` / `great` |
| ブロック | **しない**（未回答でもエクスポートは完了済み） |

### 2-2. Owner — 初回「確定反映」成功直後（**Aha · 1イベント1回**）

**トリガー:** 当日初めて `現場に反映（確定）` が成功し、2端末以上 Presence があったとき。

```text
全スタッフに反映しました。全員の画面は更新されましたか？
[ はい ]  [ いいえ・遅れた ]
```

| `source` | `flush_success` |
| `signal` | `up` / `down` |

### 2-3. Editor / Viewer — 常駐 👍/👎（**Zoom型 · ノンブロッキング**）

**配置:** 共有 URL 画面 **最下部固定1行**（本番中も表示可。モーダル禁止）。

```text
本日の進行・班分けの周知はスムーズでしたか？
[ 👍 ]  [ 👎 ]     ← 1タップで送信
```

**👎 時のみ** インラインで最大2問:

```text
□ 更新に気づけなかった  □ 表示が分かりにくい  □ その他
（Editor のみ）次回ご自身が主催する可能性: はい / たぶん / いいえ
```

| `source` | `sticky_footer` |
| `signal` | `up` / `down` |

**頻度:** 同一 `event_public_id` + 端末 `localStorage` で **1日1回** まで（スパム防止）。

---

## 3. データ経路（Postgres 非保存 · ダッシュボード必須）

```text
[Sync App マイクロ UI]
    → POST /api/sync/feedback  (Cloudflare Pages Function)
        → Google スプレッドシート `post_event_review` タブに追記
        → （任意）GAS → Telegram 即時通知（😭 / 👎）

[Sync Dev Ops Dashboard]
    → GET /api/sync/feedback/summary  (CF Function)
        → GAS Web App doGet（シート集計 JSON）をプロキシ
        → 提督向け画面に一覧・集計を表示
```

**Postgres にフィードバック本文を保存しない**（`SYNC_META_PLATFORM_GUARDRAILS` · 500MB 枠温存）。  
**Dev Ops で見えない収集は禁止** — Sheet 経由でも必ずダッシュボードに載せる。

### 3-1. API — `POST /api/sync/feedback`

| フィールド | 型 | 必須 |
|------------|-----|------|
| `event_public_id` | string | ○ |
| `product_type` | `timeline` \| `group` | ○ |
| `role` | `owner` \| `editor` \| `viewer` | ○ |
| `source` | `export_overlay` \| `flush_success` \| `sticky_footer` | ○ |
| `signal` | `great` \| `ok` \| `bad` \| `up` \| `down` | ○ |
| `drilldown` | string[] | — |
| `editor_next_host` | `yes` \| `maybe` \| `no` | Editor👎時のみ |
| `lp_quote` | string ≤80 | — |
| `revision_count` | number | — |
| `staff_peak` | number | — |

**レート制限:** 同一 `event_public_id` + IP で **20件/日**（Function 側）。

### 3-2. スプレッドシート列（`post_event_review` タブ）

| 列 | ヘッダー |
|----|----------|
| A | タイムスタンプ |
| B | event_public_id |
| C | product_type |
| D | role |
| E | source |
| F | signal |
| G | drilldown |
| H | editor_next_host |
| I | revision_count |
| J | staff_peak |
| K | consent_aggregate |
| L | consent_lp_quote |
| M | lp_quote |
| N | status |

`status`: `new` → `triaged` → `quoted`（LP可）/ `archived`  
列定義の正本は §8-4 と同一。

### 3-3. 長文フォーム（補助 · Must ではない）

詳細報告・不具合は既存 [β 不具合・改善フォーム](https://docs.google.com/forms/d/e/1FAIpQLSchvqtu9j3FL4KTxSG70txXwbREaJFZ-IrdwAKjuCRWz5jaPw/viewform?usp=publish-editor) へ。  
マイクロ UI から **「詳しく報告」リンク** のみ（別タブ）。

---

## 4. Sync Dev Ops ダッシュボード（**実装必須 · S2 ゲート**）

**正本:** `SYNC_EVENT_ID_AND_DASHBOARD_POLICY.md` §2-3  
**URL（案）:** `https://sync.sugudasu.com/dev-ops`（提督認証 · Basic または Auth 限定）

### 4-1. 必須ウィジェット

| # | ウィジェット | 内容 |
|---|-------------|------|
| **F1** | **直近フィードバック一覧** | 最新 **50件**。列: 時刻 · product · role · signal · source · event_id · drilldown |
| **F2** | **シグナル集計（7日）** | `great/ok/bad/up/down` 件数 · 日別棒 |
| **F3** | **😭+👎 アラート** | 直近24hで `bad`+`down` が **3件以上** → 画面上部に赤バナー |
| **F4** | **Editor → Owner 見込み** | `editor_next_host=yes|maybe` 件数（7日） |
| **F5** | **LP 引用候補** | `lp_quote` 非空 · `status=new` の行をピン留め |
| **F6** | **ドリルダウン内訳** | `delay` / `not_updated` / `cap_reached` 等の集計 |

### 4-2. 既存 KPI との同居

§2-3 の運用 KPI（イベント数 · 接続ピーク · 失敗率）と **同一ダッシュボード** に載せる。  
フィードバックタブを **デフォルト表示**（品質改善が主目的の β 期間）。

### 4-3. 受け入れ基準（Dev Ops）

- [ ] マイクロ送信後 **60秒以内** に F1 一覧に行が出る
- [ ] F2 集計が日次で更新される（GAS キャッシュ ≤5分でも可）
- [ ] F3 アラートが `bad`/`down` 閾値で点灯する
- [ ] Postgres にフィードバック用テーブルが **ない**

---

## 5. フロント実装ファイル（Must）

| ファイル | 責務 |
|----------|------|
| `assets/sync-feedback-client.js` | マイクロ UI · POST · localStorage 抑制 |
| `assets/sync-feedback-export-overlay.js` | エクスポート直後オーバーレイ |
| `assets/sync-feedback-sticky.js` | 👍/👎 フッター |
| `functions/api/sync/feedback.js` | POST 受付 · Sheet 追記 |
| `functions/api/sync/feedback-summary.js` | GET 集計（Dev Ops 用） |
| `tools/sync-dev-ops.html`（または app 内ルート） | Dev Ops ダッシュボード UI |
| `gas/sync-feedback-ingest.gs` | Sheet 追記 · doGet 集計 · Telegram |

---

## 6. ROLE × 販拡（割引なし）

| ROLE | マイクロ | 販拡接続 |
|------|----------|----------|
| **Owner** | エクスポート3択 · 確定反映はい/いいえ | invoice 領収書 · Device Pack バナー（`cap` 系 drilldown） |
| **Editor** | 👍/👎 + 次回主催 | 次回 Owner 候補（F4） |
| **Viewer** | 👍/👎 のみ | 改善データのみ |

---

## 7. 計測 · Go ライン

各率は **必ず分子・分母をセットで定義**する（§8）。パーセントだけを単体で残さない。

| 指標ID | 指標名 | 分子 | 分母 |
|--------|--------|------|------|
| **R1** | Owner エクスポート回答率 | `source=export_overlay` の POST 件数 | 同期ルームで JSON エクスポート完了イベント数 |
| **R2** | Owner ポジティブ率（エクスポート時） | `signal ∈ {great, ok}` の件数 | `source=export_overlay` の POST 件数 |
| **R3** | 確定反映「はい」率 | `source=flush_success` かつ `signal=up` | `source=flush_success` の POST 件数 |
| **R4** | 現場 👍 率 | `source=sticky_footer` かつ `signal=up` | `source=sticky_footer` の POST 件数 |
| **R5** | Editor 次回主催見込み率 | `editor_next_host ∈ {yes, maybe}` | `role=editor` かつ 👎 深掘り回答件数 |

**β Go:** R1 **≥30%** · R2 分子/(R2分母) **≥50%** · F3 アラートが週1回以下で対応可能。

**禁止:** R2 と R4 の合算 · 分母未定義の「満足率」単独表記。

---

## 8. LP・外部表示倫理（**分子/分母必須 · 提督確定**）

景品表示法上の **有利誤認** を避け、数値のブレを防ぐため、LP・X・資料に載せる **すべての率** は次の4点セットを **必ず併記**する。1つでも欠けたら **公開禁止**。

| # | 必須要素 | 内容 |
|---|----------|------|
| **1** | **指標名** | 何の率か（例: 「エクスポート時ポジティブ率」） |
| **2** | **分子** | 何に該当する件数か（定義をそのまま） |
| **3** | **分母** | 母集団の件数（定義をそのまま） |
| **4** | **期間・対象** | 例: `2026-06–08` · `Sync Owner` · `product_type=group` |

### 8-1. 公開してよい / してはいけない

| 判定 | 表現 |
|------|------|
| **◎ 可** | 上記4点セット + 率（小数1位まで） |
| **◎ 可** | `lp_quote` 掲載同意済みの一言（率と混ぜない） |
| **△ 条件付き** | n（分母）**< 30** → LP 本文では **率を出さず** Dev Ops のみ。出すなら脚注で n 明示 |
| **✗ 禁止** | 「プロダクト満足率 ○○%」のみ |
| **✗ 禁止** | 指標IDの混在（R2+R4 等） |
| **✗ 禁止** | ネガ（`bad`/`down`）除外後の再計算 |
| **✗ 禁止** | 「全幹事」「業界標準」等の代表主張 |

### 8-2. LP 掲載用コピーテンプレ（そのまま使う）

**率（良い例）:**

```text
β期間中、イベント後に Sync を利用した幹事（Owner）のうち、
データエクスポート時に回答いただいた方の 78% が
「助かった」または「普通」と回答しました。

（分子: 33件 · 分母: 42件 · 期間: 2026年6月1日–8月31日 ·
 対象: source=export_overlay · signal=great|ok · product: timeline|group）
```

**声（良い例）:**

```text
「欠席が出ても、受付の1タップで会場の班分けが揃った」
— 社内研修幹事（30名規模 · 掲載許可済み · 2026年7月）
```

**悪い例（公開禁止）:**

```text
プロダクト満足率 92%
```

### 8-3. Dev Ops — LP 用スナップショット（実装必須）

LP 更新時に手作業で数え直さないよう、Dev Ops に **指標IDごとの分子/分母/率** を固定表示する。

| ウィジェット | 内容 |
|-------------|------|
| **F7** | R1–R5 各々の **分子 · 分母 · 率 · 期間**（集計定義は §7 表と同一文言） |
| **F7b** | 「LPコピー用」— 8-2 テンプレに自動差し込みしたテキスト（コピーボタン） |

**ルール:** F7 の数字と LP に載せる数字は **同一ソース**（`feedback-summary` API）のみ。スプレッドシート手計算で LP だけ変えない。

### 8-4. 収集時の同意（Sheet 列 · 実装推奨）

| 列 | ヘッダー | 用途 |
|----|----------|------|
| M | `consent_aggregate` | 匿名統計（分子/分母）への利用同意 |
| N | `consent_lp_quote` | 一言の LP 掲載同意 |
| O | `lp_quote` | 掲載用テキスト（≤80字） |
| P | `status` | `new` / `triaged` / `quoted` / `archived` |

**LP に載せる率:** 原則 **全回答を分母**（同意はクオート用）。同意なし回答も集計分子に含めてよいが、**個人が特定される掲載は禁止**。

### 8-5. 算出方法ページ（LP フッターリンク · 1ページ）

`sync.sugudasu.com/legal/feedback-metrics`（または LP アンカー）に以下を常時公開:

- 指標 R1–R5 の定義表（§7 と同一）
- 収集タイミング（§2）
- 自己選択バイアスの注記（「回答者ベースであり全ユーザーを代表しない」）
- 最終更新日

---

## 9. 実装チェックリスト（S2 Must · すべて必須）

- [ ] `assets/sync-feedback-*.js`（§5）
- [ ] `POST /api/sync/feedback` + Sheet 追記
- [ ] `GET /api/sync/feedback/summary`
- [ ] `tools/sync-dev-ops.html` — §4 ウィジェット F1–F6
- [ ] **F7 LP用 分子/分母/率** + F7b コピーテンプレ（§8-3）
- [ ] エクスポート直後オーバーレイ（§2-1）
- [ ] 初回確定反映マイクロ（§2-2）
- [ ] 共有URL 👍/👎 常駐（§2-3）
- [ ] GAS ingest + Telegram（😭/👎）
- [ ] `localStorage` 抑制キー `sg_fb_{event_public_id}_{source}`
- [ ] invoice 領収書導線（エクスポートオーバーレイ内）
- [ ] **S2 Done:** Dev Ops で直近50件が見えること
- [ ] LP 算出方法ページ（§8-5）または LP アンカー原稿
- [ ] 収集 UI に `consent_lp_quote`（任意）· `lp_quote` 入力

---

## 10. 意思決定ログ

| 日付 | 決定 |
|------|------|
| 2026-06-25 | v1 Form 主導線 |
| 2026-06-25 | **v2:** In-Context + Zoom 1タップ · Sheet+CF · **Dev Ops 必須** |
| 2026-06-25 | Postgres 非保存維持 · S2 出荷ゲートに昇格 |
| 2026-06-25 | **LP 率は分子/分母/期間/対象を必須併記** · 「満足率」単独禁止 · F7 追加 |
