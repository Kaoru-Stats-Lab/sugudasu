# LocalStorage UX — Pin · 非送信

**種別:** Research  
**判断:** [ADR-006](../../adr/ADR-006-search-ia-principles.md)

---

## 原則

SUGUDASU Hub の Pin（将来）は:

- **LocalStorage のみ** — アカウント · サーバー同期なし
- **非送信** — ツール本体の Constitution と矛盾しない
- **削除可能** — 端末を変えればリセット（期待値として明記）

History を持たない理由の一つ: LS キー増殖 · 「何を見たか」の期待値管理。

---

## 実装時の検討（Research · 未実装）

| 項目 | 方針案 |
|------|--------|
| キー | `sugudasu:hub:pins:v1` 等 · バージョン付き |
| 上限 | 例: 8件（Hick's Law · 別領域の高さ） |
| 移行 | v1 → v2 はマイグレーション関数1本 |
| クリア | 設定 UI は最小。FAQ で「端末ローカル」と説明 |

実装 TODO: [`../../backlog/Search-v2.md`](../../backlog/Search-v2.md)

---

## ユーザー向けコピー（案）

> ピン留めはこのブラウザだけに保存されます。別の端末やブラウザでは引き継がれません。

FAQ / ツールページに載せる候補。実装時に [`USER_FACING_COPY_VISIBILITY.md`](../../notes/USER_FACING_COPY_VISIBILITY.md) を確認。

---

## 関連

- [Favorites-vs-History.md](Favorites-vs-History.md)
- [`docs/brand/BRAND_CONSTITUTION.md`](../../brand/BRAND_CONSTITUTION.md) — 非送信
