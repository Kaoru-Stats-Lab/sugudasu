# ADR-006

Search Information Architecture Principles（Search v2 方針）

| 項目 | 値 |
|------|-----|
| **Status** | Accepted（Phase2 設計方針 · 実装は Backlog 管理） |
| **Date** | 2026-07-24 |
| **Scope** | Hub 検索 IA · Pin · History · Intent 辞書 · 隠しショートカット |
| **Related** | [ADR-001](ADR-001-top-page-ia.md) · [ADR-003](ADR-003-search-ux.md) · [ADR-005](ADR-005-hub-layout-alignment.md) · [`../research/search/HCI-Search-IA.md`](../research/search/HCI-Search-IA.md) · [`../research/search/Intent-Dictionary.md`](../research/search/Intent-Dictionary.md) · [`../backlog/Search-v2.md`](../backlog/Search-v2.md) |

**位置づけ:** これは「いつかやるタスク」ではなく **SUGUDASU 全体の設計判断**。Phase1（ADR-003 · 凍結済み）を置き換えない。Search v2 で Pin / Intent 強化に進むときの原則。

---

## Background

Hub 検索は辞書ベース（Embedding / AI 検索ではない）。Phase1 でチップ · 0件救済 · 同義語を採用した。

次の論点は **空間記憶を壊さず**、**LocalStorage のみ**で、**Intent 辞書**の精度を上げること。Pin / History / Ctrl+K / Main Grid の扱いはプロダクト憲法（引き算 · 非送信）に直結する。

根拠調査: [`../research/`](../research/README.md)

---

## Decision

採用（Search v2 の原則）

| # | 決定 |
|---|------|
| 1 | **Main Grid（カード一覧）は固定** — 並べ替え · おすすめ差し替え · ランキングでグリッドを動かさない |
| 2 | **Pin（お気に入り）だけ別領域** — メイングリッドと視覚的分離。Split Menu 的な「固定ショートカット」 |
| 3 | **History（最近使った）は持たない** — LocalStorage 増殖 · プライバシー期待 · メンテコストを避ける |
| 4 | **Intent 辞書検索を主軸** — `tool-intent-map` · `search-dictionary` · Job→Tool。表示名は変えない |
| 5 | **Ctrl+K は隠し機能** — 初見 UI に載せない。上級者向けショートカット（実装時） |

### 保留 · Phase1 維持

- 検索チップ · 0件救済（ADR-003）
- 4 列左寄せ Hub（ADR-005）
- マルチタグ / AI 検索

---

## Rationale

### HCI · 空間記憶

- ユーザーは **カードの位置** を覚えて再訪する（Spatial Memory）。グリッドを動的ソートすると記憶が無効化される。
- 詳細: [`../research/search/HCI-Search-IA.md`](../research/search/HCI-Search-IA.md)

### 参考プロダクト（調査メモ）

| プロダクト | 借りる | 借りない |
|------------|--------|----------|
| **IT-Tools** | カテゴリ + 検索 · 実務ツール箱 | 全面コピー · アカウント |
| **DevToys** | ローカル · シンプル箱 | Windows ネイティブ前提 |
| **CyberChef** | 処理透明 · 非送信 | 軍用ナイフ UI · 学習コスト |

### Pin vs History

- **Pin** — 意図的な「戻る場所」。件数上限 · 別領域で空間記憶と両立。
- **History** — 自動記録は期待値管理が重い（削除 · 順序 · 端末間非同期）。SUGUDASU では採用しない。
- 詳細: [`../research/personalization/Favorites-vs-History.md`](../research/personalization/Favorites-vs-History.md)

### Intent 辞書

- 「ツール名検索」ではなく **やりたいこと → 道具**（JTBD）。
- 整備コストは継続運用。プロンプト資産: [`../research/search/Gemini-Intent-Dictionary-Prompt.md`](../research/search/Gemini-Intent-Dictionary-Prompt.md)

---

## Consequences

### Pros

- 空間記憶を壊さない（Main Grid 固定）
- LocalStorage のみ · 非送信と整合
- 引き算維持（History なし · ランキングでグリッドを動かさない）

### Cons

- Intent 辞書の整備コスト（ツール追加ごと）
- 検索精度改善の継続運用（0件ログ · 同義語メンテ）
- Pin UI は Phase1「お気に入り強調禁止」との境界要管理（**別領域**なら Phase2 可）

---

## Rejected（Search v2）

| 案 | 理由 |
|----|------|
| Main Grid の利用順ソート | 空間記憶破壊 · Discover 化 |
| 最近使った（History）自動記録 | 期待値 · LS 肥大 · 引き算 |
| Ctrl+K を Hero に露出 | 初見の認知負荷 |
| Embedding / 外部検索 API | Constitution · コスト |
| Fuse.js 先行（辞書未整備） | インフラ先行。辞書 SSOT 優先 |

---

## Implementation

実装 TODO のみ: [`../backlog/Search-v2.md`](../backlog/Search-v2.md)

---

## Future Review

1. ツール **100 超** — マルチタグ再評価（ADR-003 保留解除候補）
2. Pin 利用率が低い — Pin 領域ごと見直し
3. 0件率悪化 — Intent 辞書監査サイクル
