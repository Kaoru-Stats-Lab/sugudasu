# Hub IA Refresh v2 — 仕様正本（Phase 1）

**更新:** 2026-07-18  
**状態:** Phase 1 実装対象  
**ADR:** [`ADR-0003`](../decisions/ADR-0003-hub-product-independence.md)

## 目的

デザイン刷新ではなく **情報設計（IA）**。ツール数が 100 になっても迷わない発見体験。

## スコープ

| やる | やらない |
|------|----------|
| Hub 検索 · カテゴリ · 最近/お気に入り · `/category/{id}` | Product HTML 一斉改修 |
| カテゴリ SSOT 昇格 | SPA / React / デザイン刷新 |
| GA4 維持（キーワード非送信） | Hotjar / Clarity 等の追加解析 |

## Architecture Principle

Hub は「探す場所」、Product は「作業する場所」。データ（SSOT）のみ共有し、UI は独立進化（ADR-0003）。

## SSOT（データと表示の分離）

| ファイル | 内容 |
|----------|------|
| `data/categories.json` | **ドメインのみ** id / label / order / description |
| `data/hub-config.json` | Hub 表示: chipOrder / chipLabels / primaryCategories / maxVisibleChips* |
| `data/tool-registry.json` | 命名 + `categoryId`（**tags 禁止**） |
| `data/synonyms.json` | 検索同義語のみ |
| `data/hub-cards.json` | Hub カード説明文 |
| `data/relations.json` | 関連ツール（Phase 2 · Hub 未使用） |
| `data/statements-product.json` | tools[] + categoryCompare（categories 定義は持たない） |

### SSOT Guardrail

Agent / Cursor は UI 実装のついでに次を勝手に変えない:

- `categories.json` の追加・削除・名称・順番
- `tool-registry.json` の命名・categoryId の恣意的変更
- `synonyms.json` の大量書き換え

設計判断が必要なら TODO / コメントを残し、提督判断を待つ。

### Build Guardrail

- Hub UI は SSOT からのみ生成する
- UI 側へカテゴリ名・検索語・関連ツールをハードコードしない
- `validate`（`verify-hub-ia` · `verify-statements-product` · `verify-tool-naming`）→ `build`

## Hub UI

- Hero 内検索（「何をしたいですか？」）
- カテゴリチップ（`hub-config` 制御。Mobile は primary + その他）
- カード h3 = `conceptName`（請求書）。Product ヘッダー = `productName` のまま
- localStorage: `favoriteTools` · `recentTools`（最大8）· `selectedCategory`
- 入力本文・PDF・画像は LocalStorage 禁止

## SEO

- `/{tool}` 不変
- `/category/{id}` 追加 · BreadcrumbList はカテゴリページのみ
- 既存ツールの Title / Meta / FAQ JSON-LD は変更しない

## Analytics

- 既存 GA4 維持
- 許可イベント例: `search_used` · `category_selected` · `favorite_*` · `recent_opened` · `product_opened`
- **検索キーワード本文は送らない**

## Phase 2

- `docs/notes/product-template.md` の適用（Product HTML）
- `relations.json` による関連ツール節
