# Search UX Design

Hub 検索 UX · 設計凍結版  
**Version:** 1.0 · **更新:** 2026-07-20  
**Status:** Frozen（Phase1 実装対象のみ）  
**Decision Log:** [`../decision-log/2026-07-top-page-ux-review.md`](../decision-log/2026-07-top-page-ux-review.md)  
**原則の詳細:** [`search-guideline.md`](search-guideline.md) · [ADR-003](../adr/ADR-003-search-ux.md)

---

## 設計凍結

議論は成熟した。これ以上の「どちらも正しい」議論は好みの領域になる。

SUGUDASU は引き算が憲法なので、**本ファイルの Phase1 を実装し、Phase2/3 は条件到来まで触らない。**

---

## Phase1（実装する）

| 項目 | 内容 |
|------|------|
| 検索チップ | Hero 下の例をクリック可能 Chip（`hub-config.searchExampleChips`） |
| ゼロ件UX | おすすめ / 人気検索 / 検索例 + 検索解除。クエリ本文を不用意に外部送信しない |
| バッジ整理 | status 強調 · spec 弱 · カード上「人気」非表示 → [`badge-guideline.md`](badge-guideline.md) |
| 同義語辞書 | `synonyms.json` 等。表示名・カード名は書き換えない |

### Phase1 でやらない

- カード強調（人気大型化等）
- お気に入り強調
- カテゴリ追加 · 小分類 · ツリー · マルチタグ
- デザイン刷新（カードサイズ・余白・新コンポーネント）

---

## Phase2（100 ツール超で検討）

- カテゴリ小分類
- マルチタグ
- 検索順位最適化

---

## Phase3（アクセス解析取得後）

- お気に入り改善
- カード並び順
- おすすめ表示

解析なしの「おすすめ」は Phase1 では禁止（Rejected）。

---

## 不変ルール（要約）

1. **検索が主役** — カテゴリ・人気は補助
2. **人気誘導しない** — 検索の代替にランキングを置かない
3. **ゼロ件を放置しない**
4. **辞書を育てる** — 表示名を SEO 用に曲げない
5. **引き算** — UI を増やして探させるな

詳細・チェックリストは [`search-guideline.md`](search-guideline.md)。

---

## 成功条件（Phase1）

- 目的のツールへ、クリック数を増やさず、より早く到達できる
- UI が複雑にならない
- カード数が 100 になっても、検索中心の構造で耐えられる（誘導に逃げない）
