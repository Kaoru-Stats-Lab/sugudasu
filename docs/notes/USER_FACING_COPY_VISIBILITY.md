# ユーザー向け文言の可視性 — 見せる / 見せない（SSOT）

**更新:** 2026-07-16  
**目的:** 本番 HTML に「リポジトリ内のメモ」「開発者パス」「Agent 向け注記」が漏れるのを止める。一方で **検索意図に必要な語彙は残す**  
**読者:** Agent · 提督 · 外部 AI（Zenn / note 下書き）  
**関連:** [`DESIGN_GUIDELINE.md`](../DESIGN_GUIDELINE.md) §1.1–1.3 · [`DEV_TRANSPARENCY_RULES.md`](DEV_TRANSPARENCY_RULES.md) · [`TOOL_NAMING_AGENT_PLAYBOOK.md`](TOOL_NAMING_AGENT_PLAYBOOK.md) · Hub カード文案 [`TOOL_CARD_WRITING_GUIDELINE.md`](TOOL_CARD_WRITING_GUIDELINE.md)

---

## 0. 一言

| 置き場 | 誰向け | 何を書いてよいか |
|--------|--------|------------------|
| **本番画面**（`sugudasu.com` / `sync.*`） | ペルソナ（§1） | 仕事の言葉 · 概念名 · 検証手順 · 約束 · **検索語（FAQ/meta）** |
| **開発資料**（`docs/` · Agent プロンプト · DEPLOY_LOG） | 提督 · Agent | パス · SSOT 名 · ゲート · 実装メモ |

**結論**

- 「Alpha / Beta だから内部メモを出してよい」は **誤り**
- 「Diff を全部消す」も **誤り**（検索意図・類義語は FAQ / meta で拾う）
- 第1画面は仕事語。開発パスは画面に出さない

---

## 1. ペルソナから逆算

[`DESIGN_GUIDELINE.md`](../DESIGN_GUIDELINE.md) §1.1 の1人を固定する。

| 属性 | コピーへの含意 |
|------|----------------|
| 総務・幹事・フリーランス · Notion/スプシは使える | **仕事語**で書く。ファイルパスは読めない |
| ログインなし・その場で終わる | 「次に何をタップするか」以外のメタ情報はノイズ |
| データ送信への不安 | 検証手順は載せてよい。通信ゼロの過大主張は禁止 |
| 地味だがミスなく早い | 内部ドキュメント名は信頼を落とす |

### 一読テスト（必須）

> 総務の人に渡したとき「自分の仕事に関係ある」と感じるか？  
> No → 消すかユーザー語へ。

### 開発者テスト（逆向き · 必須）

> GitHub を開かないと意味が通じないか？  
> Yes → `docs/` へ閉じる。

### SEO 残存テスト（必須）

> その語を消すと、検索ユーザーがページを見つけられなくなるか？（例: Diff · 差分比較 · Planning Poker）  
> Yes → **第1画面の主役にはしない**が、FAQ・`<title>`・`meta description`・括弧補足で残す。

---

## 2. 文言の置き場（U / T / I）

| 層 | 置き場 | 載せてよい | 載せない |
|----|--------|------------|----------|
| **U ユーザー面** | hub · ツール · guides · statements · contact · footer | 概念名 · 手順 · FAQ · α/β · 検索語（適切配置） | `docs/` · Agent · SSOT · Phase コードの生出し |
| **T 透明性** | `/updates` public · `/roadmap` | 仕事が変わった事実 | ファイル名羅列 · CSS |
| **I 内部** | `docs/` · changelog `internal` · `.cursor/` | パス · ゲート · プロンプト | （自由。本番にコピーしない） |

changelog 粒度は [`DEV_TRANSPARENCY_RULES.md`](DEV_TRANSPARENCY_RULES.md)。

---

## 3. 検索語・専門語の扱い（SEO 例外）

| 方針 | 内容 |
|------|------|
| **第1画面（h1 / リード / 主ボタン）** | 仕事語のみ（例: 「危険な変更を確認」「差分チェック」） |
| **FAQ · meta · JSON-LD · 括弧** | 検索語を明示してよい（例: Diff · 差分比較ツール · Planning Poker） |
| **禁止** | 検索語を理由に `docs/notes/...` や Agent 用語を出すこと |

### よい配置例（`/diff`）

| 場所 | 文例 |
|------|------|
| h1 | AIに書き直させた文の、危険な変更から確認 |
| title / description | …差分チェック · Diff… |
| FAQ | 「Diff（差分比較）ツールと同じですか？」→ 概念で答え、Diff 語を残す |

### 残してよい語の例

| 語 | 理由 |
|----|------|
| Diff · 差分 · 差分比較 | ツールカテゴリの検索語 |
| Planning Poker · プランニングポーカー | 手法名の検索語（画面主役は「見積会議」） |
| インボイス · 適格請求書 | 法令・実務検索語 |
| CSV · PDF · QR · Excel | 実務で通じる略語 |

### 消すべき語の例

| 語 | 理由 |
|----|------|
| `docs/notes/...` · リポジトリ内 | ユーザーが開けない |
| Phase S1 · Phase 0（開発番号） | 成熟度は α/β/準備中 で足りる |
| Agent · SSOT · Cursor · GEMINI パック | 開発プロセス |
| `` `/invoice` `` をラベルに | 概念名リンクへ |

---

## 4. Alpha / Beta

| 種別 | 本番 | 理由 |
|------|------|------|
| α · β · 試験公開 · 準備中 | **可** | 期待値調整 |
| スコープ外の明示 | **可** | サポート負荷低減 |
| docs パス · Agent · Phase 番号の生出し | **不可** | 内部情報 |

---

## 5. ツールの呼び方

| 見える文字 | 層 | 例 |
|------------|-----|-----|
| 本文 · 表 · FAQ | 概念名 | 請求書 · マスク · 見積会議 |
| ヘッダー · hub | プロダクト名 | SUGUDASU 請求書 |
| `href` のみ | id | `href="/invoice"` |

---

## 6. ページ監査マトリクス（MECE）

監査単位は **URL 1本**。状態: `OK` / `修正済` / `継続`。

### A. 情報・信頼（コア）

| # | URL | 観点 | 状態 |
|---|-----|------|------|
| A1 | `/` hub | Phase N | 修正済 |
| A2 | `/guides` | リポジトリ脚注 | 修正済 |
| A3 | `/guides/*` | `` `/id` `` ラベル | 修正済（監査メモ） |
| A4 | `/statements` | 「一覧の正本」口調 | 修正済 |
| A5 | `/updates` · `/roadmap` | public 粒度 | 別 SSOT |
| A6 | 法務 · `/contact` | ユーザー語 | OK 想定 |

### B. 実務ツール

| # | URL | 観点 | 状態 |
|---|-----|------|------|
| B1 | `/diff` | 仕事語＋Diff SEO | 修正済（FAQ/meta） |
| B2 | 主要ツール群 | 概念名 · 非送信表現 | 修正済（FAQ slug · hub · statements · font-converter · test-data · 景品パターン文言） |
| B3 | `/qr-reader` · `/fair-draw` | slug · Phase 番号 | 修正済（FAQ HTML + JSON-LD · P11–13 は仕事語へ） |

### C. Sync

| # | URL | 観点 | 状態 |
|---|-----|------|------|
| C1 | sync `/` | Phase S1 | 修正済 |
| C2 | `/timeline` LP | Phase · RLS 生出し | 修正済 |
| C3 | `/timeline/app` | docs · 提督文言 | 修正済（S1/S2 口調も仕事語化） |
| C4 | `/schedule` · `/room` | 同上 | 継続（Pending · 目視未着手） |

### 1ページずつの手順

1. ユーザー可視テキストだけ読む  
2. 一読 · 開発者 · SEO 残存テスト  
3. 直す → マトリクス更新  

---

## 7. 画面種別ルール · 外部記事

| 画面 | 書いてよい | 書いてはいけない |
|------|------------|------------------|
| ツール | 手順 · FAQ · 検索語（FAQ/meta） | Playbook · Backlog ID · docs |
| guides | 場面 · チェックリスト · 概念名リンク | リポジトリパス |
| statements | 約束 · DevTools 検証 | Secret · 社内メモ |
| Zenn/note | 公開 URL · 仕事語 · 検索語 | docs · Agent · slug 主役 |

---

## 8. 公開前チェックリスト

- [ ] 一読テスト OK  
- [ ] `docs/` · リポジトリ · Agent · SSOT · Cursor がユーザー可視に無い  
- [ ] ツールは概念名＋リンク  
- [ ] 検索語は FAQ/meta 等に残した（消して損していないか）  
- [ ] α/β は成熟度説明のみ  
- [ ] changelog `audience` が正しい（該当時）  

---

## 9. 悪い例 → よい例

| 悪い | よい |
|------|------|
| `docs/notes/GUIDES_CONTENT_STRATEGY.md（リポジトリ内）` | 削除 |
| `` `/invoice`, `/mask` `` | 請求書 · マスク のリンク |
| `正本: docs/notes/SYNC_ENV_KEYS.md` | 削除。設定未完了なら問い合わせ導線 |
| h1 を「Diff Workbench」だけにする | h1 は仕事語 · FAQ で「Diff（差分比較）」 |
| Diff をサイトから全部消す | **しない**（SEO 損失） |

---

## 10. 参照

| テーマ | 正本 |
|--------|------|
| ペルソナ · 第1画面 | `DESIGN_GUIDELINE.md` §1 |
| 命名 3層 | `TOOL_NAMING_AGENT_PLAYBOOK.md` |
| changelog | `DEV_TRANSPARENCY_RULES.md` |
| ガイド戦略（内部のみ） | `GUIDES_CONTENT_STRATEGY.md`（本番リンク禁止） |

---

## 変更履歴

| 日付 | 内容 |
|------|------|
| 2026-07-16 | 初版 |
| 2026-07-16 | MECE ページマトリクス · SEO 例外（Diff 等）· ページ修正実施 |
| 2026-07-16 | 他ツール FAQ / hub / statements の微細 slug 口調を概念名へ（schedule·room は Pending） |
