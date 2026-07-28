# Mention by SUGUDASU — 仕様

**id:** `mention`  
**更新:** 2026-07-28  
**stage:** alpha（Extension MVP · Hub 未掲載）  
**思想正本:** `philosophy.md`（Mission · Constitution）

> これは **Google口コミツール仕様ではない。**  
> **Current Context Action Engine** の仕様である。Google Maps は最初の Adapter に過ぎない。

---

## 1. Mission（再掲）

**Find outside. Finish inside.** / **見つけたら、終わらせる。**

| 項目 | 値 |
|------|-----|
| id / URL | `mention` · `/mention`（固定） |
| productName | Mention by SUGUDASU |
| Store 表記 | Mention by SUGUDASU（productName と同一） |
| Surface | Chrome Extension Side Panel（MV3） |
| LP | `https://sugudasu.com/mention`（インストール導線のみ） |
| Hub | 未掲載（`inNav: false`）· Playbook §1.5 後続 |

---

## 2. Constitution（要約）

詳細は `philosophy.md`。実装が従う固定境界:

1. Single Purpose — 監視/分析/収集なし  
2. Current Context Only — 巡回しない · 未許可 Adapter では沈黙  
3. Non-Exfiltration — クラウド非保存 · 端末内 Done/Template は痕跡のみ  
4. Explicit Network — Webhook のみ · 押下時のみ  
5. No LLM · No Paste Product  
6. Platform = Adapter · Scenario = 構造ルール（評価しない）

---

## 3. Core Architecture

```text
Current Page
  → Platform Adapter          （DOM → ContextEnvelope）
  → Scenario Detector         （Envelope → Scenario）
  → Action Engine             （Scenario → Action Cards + Template fill）
  → Done
```

**Google Maps 専用コードは Core に置かない。** Adapter の中だけ。

| 層 | 責務 | 置かないもの |
|----|------|----------------|
| Platform Adapter | 今のページから構造フィールドを取る | 感情分析 · サーバー送信 |
| Scenario Detector | 構造ルールで Scenario id を決める | 評価 · 断定 · LLM |
| Action Engine | Scenario → 少数の Action · 定型展開 | 文案の毎回生成 |
| UI | Action Cards · Copy/Webhook · Done | ダッシュボード |

内部モジュール名（実装時）:

```text
Mention Engine
  ├── Platform Adapter(s)
  ├── Scenario Engine
  └── Action Engine
```

### 3.1 ContextEnvelope（Adapter 出力）

旧称 StructuralSignals。Adapter が返す正規化済みコンテキスト。

| フィールド | 必須 | 備考 |
|------------|------|------|
| `adapterId` | ○ | 例: `google_maps` · `x` · `web` |
| `title` · `url` · `author` · `datetime` · `body` | ○ | 取れなければ空 |
| `brand` | ○ | Setting 照合結果 |
| `stars` | △ | 口コミ系のみ |
| `hasImages` · `hasReply` | ○ | boolean |
| `domain` · `ogTitle` · `ogImage` | △ | |
| `supported` | ○ | Adapter が意味ある抽出できたか |

感情スコアはフィールドにも持たない。

### 3.2 Action プリミティブ

Scenario ごとに見せるボタンは違うが、**種類はこれだけ**に収束させる。

| Primitive | 意味 | 実装例（action id） |
|-----------|------|---------------------|
| `reply` | 相手へ返す定型 | `google_reply` · `google_reply_improve` |
| `share` | 社内/SNS へ渡す | `slack_share` · `internal_share` · `sns_share` · `quote_post` |
| `copy` | クリップボード（UI 操作） | 全 Action の共通出口 |
| `webhook` | 明示送信（UI 操作） | Setting の URL へ POST |
| `note` | 確認メモ · ログ行 | `note_template` · `pr_log` · `thanks_mail` · `correction_request` |
| `done` | 完了 | `done` |

「Google Maps だから Reply」ではない。**Scenario が Action を選ぶ。**

---

## 4. Platform Adapters

すべて Adapter。Mission ではない。

| adapterId | 状態 | 備考 |
|-----------|------|------|
| `google_maps` | **MVP** | GBP / Maps 口コミ |
| `web` | **MVP** | 一般記事 · Google Alert で開いたページ |
| `google_search` | α | 検索結果断片 |
| `x` | α | ポスト · 引用 |
| `youtube` · `reddit` · `github` · `indeed` · `amazon_review` · `rakuten_review` · … | Roadmap | Adapter 追加のみで拡大 |

**権限:** 初期から `<all_urls>` を取らない。  
理想は `optional_host_permissions`（Maps 許可 → 必要時に X 許可…）。  
未許可 Adapter のページでは沈黙（または最小 `done` のみ · 仕様は MVP で「未対応」表示）。

**Reject:** 手動 URL/本文貼りを Adapter の代替にすること。

---

## 5. Scenario Catalog

Scenario の**詳細正本**は [`scenarios/`](./scenarios/)。本節は索引。

Scenario は「何のページか」の業務ラベルではない。**構造条件 → 次の一手**の名前である。評価語（Positive 等）は付けない。

### MVP

| scenarioId | 条件（構造） | Actions（最大4 · done 含む） | 詳細 |
|------------|--------------|------------------------------|------|
| `review_stars_45` | google_maps · stars 4–5 · !hasReply | reply(`google_reply`) · share(`slack_share`) · done | [google-maps-review](./scenarios/google-maps-review.md) |
| `review_stars_3` | google_maps · stars 3 · !hasReply | reply(`google_reply_improve`) · share(`slack_share`) · done | 同上 |
| `review_stars_12` | google_maps · stars 1–2 | share(`internal_share`) · note(`note_template`) · done | 同上 |
| `review_already_replied` | google_maps · hasReply | share(`slack_share`) · done | 同上 |
| `web_mention` | web（紹介/一般） | share(`quote_post`) · note(`thanks_mail`) · share(`slack_share`) · done | [news-article](./scenarios/news-article.md) |
| `news_mention` | news-like host / adapter | note(`pr_log`) · share(`sns_share`) · done | 同上 |
| `unsupported` | supported=false / 未知 | share(`slack_share`) · done | — |

### 後続

| scenarioId | 詳細 |
|------------|------|
| `sns_brand_mention` | [x-post](./scenarios/x-post.md) |
| `github_issue_mention` | [github-issue](./scenarios/github-issue.md) |
| `youtube_comment` | [youtube-comment](./scenarios/youtube-comment.md) |

炎上 · 誤情報は煽るラベルで出さない。後続でも構造ルール + 注意付き share/note に留める。

---

## 6. Action Catalog · Template

### 6.1 Action id（MVP 実装キー）

| id | Primitive | ラベル（仮） |
|----|-----------|--------------|
| `google_reply` | reply | Google返信 |
| `google_reply_improve` | reply | 改善付き返信 |
| `internal_share` | share | 社内共有 |
| `slack_share` | share | Slack共有 |
| `sns_share` · `quote_post` | share | SNS共有 · 引用ポスト |
| `note_template` · `thanks_mail` · `pr_log` · `correction_request` | note | 確認メモ等 |
| `done` | done | 完了 |

### 6.2 Template

- キー: `actionId|variant`（例: `stars_45`）または `actionId|default`
- ユーザー編集可 · 既定に戻す可
- 未定義 `{{変数}}` → **空文字**
- UI 禁止語: 「生成」「AIが…」→ **定型を展開**

変数: `{{customer}}` · `{{store}}` · `{{article_title}}` · `{{url}}` · `{{site}}` · `{{date}}` · `{{stars}}` · `{{body}}` · `{{brand}}`

---

## 7. Chrome Extension Architecture

```text
extensions/mention/
  manifest.json          # MV3 · sidePanel · 最小 / optional hosts
  sidepanel.*            # Inbox · Done · Template · Setting
  background.js
  content/               # Platform Adapters（ページ側）
  lib/
    action-engine.js     # Scenario → Actions → fill（純関数）
    templates-default.js
    idb.js
```

### UI Tabs（これだけ）

`Inbox` · `Done` · `Template` · `Setting`

Inbox はボタン中心。分析ラベルなし。

### IndexedDB（`sugudasu-mention`）

| Store | 内容 |
|-------|------|
| `templates` | ユーザー定型 |
| `settings` | brands · store · webhookUrl |
| `done` | 完了痕跡（検索 UI なし） |

### Permissions（憲法どおり）

| 方針 | 内容 |
|------|------|
| 禁止 | 初期 `<all_urls>` 固定取得 |
| 推奨 | `optional_host_permissions` + プラットフォームごとの許可 UX |
| α 現状 | 実装が広い場合は **憲法が先 · 実装を従わせる**（縮小タスク） |

---

## 8. MVP Scope

**入れる**

1. Adapter: `google_maps` + `web`
2. Scenario: 上表 MVP 行
3. Action: reply / share / note / copy / webhook / done
4. Side Panel · IndexedDB · `/mention` LP
5. Slack Incoming 等 Webhook（明示送信のみ）

**入れない（MVP）**

- 監視 · 通知 · BI · LLM · 貼り付け入力
- Hub ナビ掲載（§1.5 後）
- Instagram / LinkedIn 等の高難度 Adapter
- GitHub Assign など「仕事本体」に見える操作

---

## 9. Roadmap

実装順序の正本: [`roadmap.md`](./roadmap.md)  
価格フェーズは書かない（[`pricing-roadmap.md`](./pricing-roadmap.md)）。

---

## 10. Non-Goals · Metrics · Risks

### Non-Goals

| カテゴリ | Reject |
|----------|--------|
| 監視/分析 | ダッシュボード · 巡回 · 通知 · 感情分析 · 全文検索 |
| 管理 | 担当 · 期限 · CRM · タグ検索 |
| 創造 | LLM 文案 · 言い換え提案 |
| 入力劣化 | URL/本文貼り製品化 |
| Mission 汚染 | 「Google口コミツール」としてのブランド固定 |
| 層越え（Sync） | クラウド同期・アカウント機能（Sync層）はMentionのスコープ外（ADR-0003 · ADR-0008） |

### Success Metric

良い: Action 完了率 · 返信/共有までの時間 · タブ切替少 · コピー回数  
悪い: 滞在時間 · レポート数 · 閲覧ページ数  

### Risks

| リスク | 潰し方 |
|--------|--------|
| 口コミツールに見える | Mission/LP/Store 説明を Action Engine 語彙に固定 |
| Adapter DOM 破綻 | versioned selector · 失敗時は unsupported |
| 抽象化過多 | MVP は Maps+Web の速さ優先 |
| Domain 越え（Assign 等） | 前工程（share/note）に留め、仕事本体は人に残す |

---

## 11. 実装ポインタ

- コード: [`extensions/mention/`](../../extensions/mention/README.md)
- テスト: `npm run test:mention`
- BACKLOG: [`../../BACKLOG.md`](../../BACKLOG.md) §1-17

**次の実装タスク（憲法追随）:** host permissions を optional / Priority ドメインへ縮小し、Core から platform 分岐を Scenario Catalog 側へ寄せる。
