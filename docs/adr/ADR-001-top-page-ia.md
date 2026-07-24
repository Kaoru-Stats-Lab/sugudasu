# ADR-001

Top Page Information Architecture

| 項目 | 値 |
|------|-----|
| **Status** | Accepted · **設計凍結（Frozen）** |
| **Date** | 2026-07-20 |
| **Scope** | Hub（`/` · ツール一覧）の発見体験 · 情報階層 |
| **Related** | [ADR-002](ADR-002-card-writing.md) · [ADR-003](ADR-003-search-ux.md) · [ADR-004](ADR-004-badge-system.md) · [ADR-005](ADR-005-hub-layout-alignment.md) · [ADR-006](ADR-006-search-ia-principles.md) · [`HUB_IA_REFRESH_V2.md`](../notes/HUB_IA_REFRESH_V2.md) · [`decision-log/2026-07-top-page-ux-review.md`](../decision-log/2026-07-top-page-ux-review.md) · [`decision-log/2026-07-hub-layout-alignment.md`](../decision-log/2026-07-hub-layout-alignment.md) · [`design/search-ux.md`](../design/search-ux.md) · [`design/hub-layout.md`](../design/hub-layout.md) · [`cursor/guardrail.md`](../cursor/guardrail.md) · [`docs/decisions/ADR-0003-hub-product-independence.md`](../decisions/ADR-0003-hub-product-independence.md) |

**凍結方針:** 議論は成熟した。これ以上は好みの領域。「どちらも正しい」で覆さない。Phase1 を実装し、Phase2（100ツール超）/ Phase3（解析取得後）まで先送り項目に手を出さない。詳細は Decision Log。

---

## Background

なぜ議論したか

SUGUDASU Hub（トップ）は「ツールを探す唯一の入口」である（Header＝サイトナビ / Hub＝探索 / Product＝作業 · ADR-0003）。

ツール数が増え、検索・カテゴリ・人気・バッジ・カード文言が同時に存在すると、**誘導 UI（ランキング・大型カード・Discover 化）**と**目的検索**が衝突しやすい。

2026-07 の Top IA Phase1 で、半年後の別 AI が同じ判断をできるように、採用・保留・非採用を ADR に固定する必要があった。

---

## Problem

何が問題だったか

1. **初見ユーザーが検索を始めにくい** — 検索例が説明テキストだけで、行動に結びつかない。
2. **0件時の離脱** — ヒットなしを放置すると「サイトに無い」と誤解されやすい。
3. **バッジの情報ノイズ** — status・仕様・人気が同列だと、何が重要か分からない。
4. **表示名を SEO 用に変えたくなる圧力** — ブランド用語（概念名）と検索語の衝突。
5. **人気誘導への誘惑** — アクセスを増やすためにランキングや大型カードを置きたくなるが、引き算・検索中心と矛盾する。

---

## Options

検討案

| ID | 案 | 概要 |
|----|-----|------|
| A | **検索主導の引き算 Hub** | 検索チップ · 0件救済 · 同義語辞書 · バッジ階層。カテゴリは補助。人気は「実務で人気」リストに留め、カード押し売りしない |
| B | **Discover / ランキング主導** | Hero 大型カード · おすすめランキング · 人気バッジ強調 |
| C | **カテゴリ第一（ディレクトリ）** | マルチタグ / マルチカテゴリを先に実装し、検索は後回し |
| D | **現状維持** | 文言・チップ・バッジを触らない |

---

## Decision

採用案

**案 A — 検索主導の引き算 Hub** を採用する。

### 採用の中身（Phase1）

| 項目 | 決定 |
|------|------|
| 発見の優先順位 | 1 検索 → 2 カテゴリ（補助）→ 3 お気に入り → 4 最近 → 5 実務で人気 → 6 すべて |
| 検索チップ | Hero 下の例を **クリック可能 Chip**（`hub-config.searchExampleChips`） |
| ゼロ件UX | おすすめ / 人気検索 / 検索例 + 検索解除。キーワード本文は GA に送らない |
| 同義語 | `data/synonyms.json` のみ（表示名・conceptName は不変） |
| バッジ | status 強調 · spec 弱 · カード上「人気」非表示 → [ADR-004](ADR-004-badge-system.md) |
| カード文言 | JTBD 2文 → [ADR-002](ADR-002-card-writing.md) |

### 保留案

| 項目 | 扱い | 理由 |
|------|------|------|
| **マルチカテゴリ / マルチタグ** | TODO のみ（実装しない） | 100 ツール超で必要になり得るが、現状はコスト大。単一 `categoryId` で足りる |

### 理由（採用の Why）

- ユーザーの主行動は「今やりたい作業を探す」であり、**誘導ではない**。
- チップと 0件救済はコンポーネント新造なしで初見摩擦を下げられる。
- 同義語は表示を汚さず SEO / 言い回し差を吸収できる。
- 人気・ランキング・Hero カードは一覧性を壊し、引き算に反する。

---

## Rejected

却下案 · 理由

| 案 | 理由 |
|----|------|
| **人気カード強調**（カード上「人気」バッジ・視覚強調） | 検索主導と矛盾。押し売り感。一覧性を壊す |
| **Hero 大型カード** | UI ノイズ増。引き算思想に反する |
| **おすすめランキング** | 目的検索より誘導を優先してしまう |
| **案 B 全体（Discover 化）** | SUGUDASU はメディアではなく実務ツール集。3分完了の導線を汚す |
| **案 C（カテゴリ第一を先に）** | 今の規模では過剰。検索辞書の方が費用対効果が高い |
| **表示名を検索語に合わせる** | ブランド・命名 3 層（id / concept / product）を壊す。SEO は辞書側 |

---

## Future Review

再検討条件

次のいずれかで **本 ADR を再読し、案 A を見直してよい**。

1. **公開ツールがおおよそ 100 を超えた**とき — マルチカテゴリ / タグの再評価（保留解除候補）
2. **検索ログまたは匿名集計が安定運用**されたとき — チップ文言・同義語・人気リストの根拠更新
3. **アクセス解析（プライバシー方針内）**で 0件率・検索開始率が悪化したとき — 0件UX / チップ密度の再設計
4. **Hub が「探す」以外の責務を持ち始めた**とき — ADR-0003（Hub/Product 独立）ごと見直し

再検討しても壊してはいけないもの → **Constitution**。

---

## Constitution

SUGUDASUが絶対守る思想

本 ADR および派生ガイドラインは、次を破らない。

| 思想 | Hub での意味 |
|------|----------------|
| **引き算** | Hero にランキング・大型カード・誘導ステッカーを置かない |
| **3分で終わる** | 探す時間を短くする。説明のための UI を増やさない |
| **検索中心** | カテゴリ・人気は補助。検索が主役 |
| **ブラウザ完結** | Hub 探索もサーバー保存を前提にしない |
| **完全ローカル思想** | ツール本体の非送信原則を Hub 文言で裏切らない（誇張・「クラウドで安心」等禁止） |

---

## 実装参照（コードは本 ADR の対象外）

| 関心 | 場所 |
|------|------|
| Hub IA 仕様 | `docs/notes/HUB_IA_REFRESH_V2.md` |
| セッション決定メモ | `docs/decision-log/2026-07-top-page-ia.md` |
| 検索ガイドライン | [`../design/search-guideline.md`](../design/search-guideline.md) |
| バッジガイドライン | [`../design/badge-guideline.md`](../design/badge-guideline.md) |
