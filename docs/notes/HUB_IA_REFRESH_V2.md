# Hub IA Refresh v2 — 仕様正本（Phase 1–2）

**更新:** 2026-07-20  
**状態:** Phase 2 実装済み  
**ADR:** [`ADR-0003`](../decisions/ADR-0003-hub-product-independence.md)

## 目的

デザイン刷新ではなく **情報設計（IA）**。ツール数が 100 になっても迷わない発見体験。

責務分離:

| 層 | 責務 |
|----|------|
| **Header** | サイトを移動する（サイトナビ） |
| **Hub** | ツールを探す（唯一の探索入口） |
| **Product** | ツールを使う |

## スコープ

| やる | やらない |
|------|----------|
| Hub 検索 · カテゴリ · 最近/お気に入り · `/category/{id}` | Product HTML 本文の改修 |
| **サイト全体 Header = サイトナビ**（ツール横並び廃止） | SEO Metadata / JSON-LD / GA4 変更 |
| 検索モード UI（件数 · 解除 · 0件強化） | Autocomplete / AI 検索 · localStorage キー変更 |
| 実務で人気 · バッジ体系 · 2行 blurb | Hero コピー変更 · カード見た目リデザイン |
| カテゴリ SSOT 昇格 | SPA / React |
| 開発帯の一般向け文言（版数・Backlog 非表示） | Hotjar / Clarity 等の追加解析 |

## Architecture Principle

Hub は「探す場所」、Product は「作業する場所」。データ（SSOT）のみ共有し、UI は独立進化（ADR-0003）。

## 発見の優先順位

1. 検索  
2. カテゴリ（検索中も補助フィルタ）  
3. お気に入り  
4. 最近使った  
5. 実務で人気（`hub-config.popularToolIds`）  
6. すべてのツール  

## 検索モード

- query 非空 → **検索結果**パネル表示（`N件見つかりました` · `× 検索解除`）
- 人気 / お気に入り / 最近は隠す。カテゴリは交差フィルタ
- 0件: 提案チップ + 「すべてのツールを見る」
- エンジン: `assets/hub-search-engine.js` + `data/hub-search-bundle.json`（辞書ベース · Embedding なし）

## SSOT（データと表示の分離）

| ファイル | 内容 |
|----------|------|
| `data/categories.json` | **ドメインのみ** id / label / order / description |
| `data/hub-config.json` | chipOrder / chipLabels / primaryCategories / maxVisibleChips* / **popularToolIds** |
| `data/tool-registry.json` | 命名 + `categoryId`（**tags 禁止**） |
| `data/synonyms.json` | 検索同義語のみ |
| `data/search-dictionary/{toolId}.json` | Jobs / aliases / mistakes |
| `data/hub-search-bundle.json` | ビルド生成 · Hub が fetch |
| `data/hub-cards.json` | blurb + **badges**（status / spec / popular）。eyebrow・meta 廃止 |
| `data/relations.json` | 関連ツール（Phase 2 · Hub 未使用） |
| `data/statements-product.json` | tools[] + categoryCompare |

### カードコピー（JTBD blurb）

**正本（別 Agent 必読）:** [`TOOL_CARD_WRITING_GUIDELINE.md`](TOOL_CARD_WRITING_GUIDELINE.md)

- `hub-cards.json` の `blurb` = 「〜したい時に。〜します。」**2文固定**
- Hub カード `h3` = `registry.conceptName`（一般名称 · だいたい 2〜8 字）
- blurb は辞書検索バンドルにも載せる（`hubBlurb` · 検索アルゴリズム変更なし）
- カード説明は CSS 2 行固定（`line-clamp` + 固定 height）· タイトルは 1 行 ellipsis
- 誇張 · UI操作説明 · SEO羅列 · 保証できない「AI/自動/高速」は禁止（正本のチェック表）

### 検索 UX（2026-07 Top IA）

正本: [`docs/decision-log/2026-07-top-page-ux-review.md`](../decision-log/2026-07-top-page-ux-review.md)

- Hero 下の検索例は **クリック可能 Chip**（`hub-config.searchExampleChips`）
- 0件: おすすめ · 人気検索 · 検索例 + 検索解除
- バッジ: status 強調 · spec 弱 · カード上の「人気」バッジは出さない
- 同義語は `synonyms.json` のみ（表示名不変）※語彙 3 層は [`BRAND_NORMALIZE.md`](BRAND_NORMALIZE.md)
- **禁止:** 人気カード大型化 · ランキング · Hero カード · Discover 化
- **レイアウト:** 左寄せ · Desktop **4 列**維持 · 5〜6 列・センター寄せ禁止 → [`ADR-005`](../adr/ADR-005-hub-layout-alignment.md) · [`hub-layout.md`](../design/hub-layout.md)

### バッジ（再掲）

| 種類 | 値 | 表示 |
|------|-----|------|
| status | `new` / `beta` / `ga` | NEW / Beta / 正式 |
| spec | `local` / `pc` | 完全ローカル / PC推奨 |
| popular | boolean | 人気 |

意味別に CSS modifier を分ける（同色で意味混在させない）。

### Header（Phase 2 · サイトナビ）

`assets/sugudasu-shell.js` の `resolveNavMode` / `siteChromeHtml`。`#sg-chrome-top` の `data-sg-nav`:

| モード | `data-sg-nav` | Desktop リンク |
|--------|---------------|----------------|
| **Hub** | `hub` | 実務ガイド · 更新履歴 · ロードマップ（ツール探索は Hero のみ） |
| **Product** | （省略可 · 自動） | ← ツール一覧 · 実務ガイド（+ 淡い productName） |
| **Site** | （更新履歴等 · 自動） | ツール一覧 · 実務ガイド · 更新履歴 · ロードマップ |

- Sticky · 高さ目安 56–64px · アイコン/グラデ追加禁止
- モバイル: LOGO + ☰ → drawer（上記 + **約束**）
- **個別ツール横並びリンクは出さない**（Hub が唯一の探索入口）
- focus モード（timeline）は従来どおりコンパクト「← ツール一覧」

### 開発ステージ帯（一般向け）

- 版数（`v1.1.0`）· Backlog 参照 · 「アルファ/ガンマ」等の内部名は **出さない**
- 例: 「新しい機能を試験公開しています」
- Hub / site ナビでは帯を出さない

### SSOT Guardrail

Agent / Cursor は UI 実装のついでに次を勝手に変えない:

- `categories.json` の追加・削除・名称・順番
- `tool-registry.json` の命名・categoryId の恣意的変更
- `synonyms.json` の大量書き換え

設計判断が必要なら TODO / コメントを残し、提督判断を待つ。

### Build Guardrail

- Hub UI は SSOT からのみ生成する
- UI 側へカテゴリ名・検索語・関連ツールをハードコードしない
- `validate:hub-ia`（`build:hub-search` · `render-hub-cards` · `verify-hub-ia`）→ `build`

## Hub UI

- Hero 内検索（「何をしたいですか？」）· Hero 本文は現行維持
- カテゴリチップ（`hub-config` 制御。Mobile は primary + その他）
- カード h3 = `conceptName`（請求書）。Product ヘッダー = `productName` のまま
- localStorage: `favoriteTools` · `recentTools`（最大8）· `selectedCategory`（キー変更禁止）
- 入力本文・PDF・画像は LocalStorage 禁止

## SEO

- `/{tool}` 不変
- `/category/{id}` 追加 · BreadcrumbList はカテゴリページのみ
- 既存ツールの Title / Meta / FAQ JSON-LD は変更しない

## Analytics

- 既存 GA4 維持
- 許可イベント例: `search_used` · `category_selected` · `favorite_*` · `recent_opened` · `product_opened`
- **検索キーワード本文は送らない**

## 以降（参考）

- `docs/notes/product-template.md` の適用（Product HTML）
- `relations.json` による関連ツール節
