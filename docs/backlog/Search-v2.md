# Search v2 — 実装 Backlog

**種別:** Backlog（TODO のみ）  
**設計判断:** [ADR-006](../adr/ADR-006-search-ia-principles.md)  
**根拠:** [research/README.md](../research/README.md)

ここには **チェックリストだけ** 書く。HCI 論文 · プロンプト · 採否理由は Research / ADR へ。

---

## P2

- [ ] Intent 辞書作成 · 拡充（`search-dictionary` · `tool-intent-map` · `synonyms.json`）
- [ ] ゼロヒット検索収集（キーワード本文は外部送信しない · ローカル or 手動レビュー）
- [ ] Fuse.js 導入検討（辞書 SSOT 整備 **後**。ADR-006 Rejected 参照）
- [ ] お気に入り（Pin）— 別領域 · LocalStorage · 件数上限
- [ ] Ctrl+K 隠しショートカット（上級者向け · Hero 非露出）

---

## 着手前ゲート

- [ ] Phase1 凍結との境界確認（[`cursor/guardrail.md`](../cursor/guardrail.md)）
- [ ] `npm run validate:hub-ia` · `npm run build:hub-search` 手順確認
- [ ] ADR-006 と実装 diff のレビュー

---

## やらない（ADR-006）

- Main Grid の利用順ソート
- History（最近使った）自動記録
- Embedding / 外部検索 API
- Pin を Hero 大型カードで「強調」（Discover 化）
