# Research — 設計根拠の置き場

**用途:** 「なぜその設計にしたか」の**根拠・調査・比較**を残す。  
**やらない:** 実装 TODO（→ [`../backlog/`](../backlog/)）· 最終判断（→ [`../adr/`](../adr/)）

---

## 三層の分け方

| 層 | 置くもの | 例 |
|----|----------|-----|
| **ADR** | SUGUDASU 全体の設計判断（Accepted / Rejected） | Main Grid 固定 · History なし |
| **Research** | HCI · 競合 · 辞書設計 · AI プロンプト資産 | IT-Tools · Intent 辞書 MECE |
| **Backlog** | いつかやる実装チェックリストのみ | Fuse.js 検討 · Pin 実装 |

混ぜない。半年後に「判断 → 根拠 → タスク」の順で追えるようにする。

---

## 検索（Search）

| ファイル | 内容 |
|----------|------|
| [search/HCI-Search-IA.md](search/HCI-Search-IA.md) | HCI · Spatial Memory · 参考プロダクト |
| [search/Intent-Dictionary.md](search/Intent-Dictionary.md) | Job→Tool · 辞書レイヤ設計 |
| [search/Gemini-Intent-Dictionary-Prompt.md](search/Gemini-Intent-Dictionary-Prompt.md) | Intent 辞書生成プロンプト索引 |

**関連 ADR:** [ADR-006](../adr/ADR-006-search-ia-principles.md) · [ADR-003](../adr/ADR-003-search-ux.md) · [ADR-001](../adr/ADR-001-top-page-ia.md)

**既存 SSOT（実装正本）:** `data/search-dictionary/` · `data/synonyms.json` · `data/tool-intent-map.json` · [`search-dictionary-prompt-v2.md`](../prompts/search-dictionary-prompt-v2.md)

---

## パーソナライズ（Pin · History）

| ファイル | 内容 |
|----------|------|
| [personalization/Favorites-vs-History.md](personalization/Favorites-vs-History.md) | Pin vs History · 参考 UI |
| [personalization/LocalStorage-UX.md](personalization/LocalStorage-UX.md) | LocalStorage のみ · 非送信 |

---

## 更新ルール

1. Gemini / 外部調査の**生データ**は Research に追記
2. 採否が決まったら ADR に要約（Research 全文は転記しない）
3. 実装可能になったら Backlog に □ を追加（Research に TODO を書かない）
