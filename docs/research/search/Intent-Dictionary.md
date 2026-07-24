# Intent Dictionary — Job→Tool 設計

**種別:** Research（辞書設計の根拠）  
**実装 SSOT:** `data/search-dictionary/{toolId}.json` · `data/synonyms.json` · `data/tool-intent-map.json`  
**判断:** [ADR-006](../../adr/ADR-006-search-ia-principles.md) · [ADR-003](../../adr/ADR-003-search-ux.md)

---

## 目的

SUGUDASU Hub 検索は **AI / Embedding ではない**。  
ユーザーが打つ **Intent（やりたいこと）** を辞書で吸収し、適切な `toolId` にルーティングする。

> 紹介文を書くのではない。**検索窓に打たれる言葉**を予測する。

---

## レイヤ（MECE）

| 層 | ファイル | 役割 |
|----|----------|------|
| L1 | `search-dictionary/{id}.json` | ツール別 · aliases · jobs · commonMistakes |
| L2 | `synonyms.json` | 短い同義語 → toolIds |
| L3 | `tool-intent-map.json` | keyword + weight → toolIds |
| L4 | `search-thesaurus.json` | グローバル from→to（慎重に） |
| バンドル | `hub-search-bundle.json` | `npm run build:hub-search` 生成物 |

エンジン: `assets/hub-search-engine.js`

---

## Job → Tool の書き方

1. **動詞句優先** — 「JSONを見たい」「黒塗りしたい」「班分けしたい」
2. **conceptName は最小** — ユーザーはまず「請求書」で探す。「SUGUDASU 請求書」連打禁止
3. **commonMistakes** — 取り違えを減らす（例: 景表法 vs 公平抽選）
4. **機能捏造禁止** — 存在しない能力を検索語に入れない

正本プロンプト: [`Gemini-Intent-Dictionary-Prompt.md`](Gemini-Intent-Dictionary-Prompt.md) · [`search-dictionary-prompt-v2.md`](../../prompts/search-dictionary-prompt-v2.md)

---

## MECE チェック（辞書追加時）

- [ ] 1 Product = 1 `search-dictionary` ファイル
- [ ] `synonyms.json` / `tool-intent-map.json` に Hub カード上の全 toolId がカバーされているか
- [ ] `npm run validate:hub-ia` · `npm run build:hub-search` exit 0
- [ ] 表示名（conceptName / navLabel）は変えていない

---

## 運用 · 継続コスト（ADR-006 Cons）

- 新ツール公開時: 辞書 3 層 + バンドル再生成
- 0件検索の定期レビュー（キーワード本文は外部送信しない）
- Gemini プロンプトで追記 → 人間がマージ（自動全置換禁止）

---

## 関連

- [`docs/prompts/search-dictionary-prompt-v2.md`](../../prompts/search-dictionary-prompt-v2.md) — ツール別辞書生成（正本）
- [`docs/prompts/search-dictionary-prompt-v1.md`](../../prompts/search-dictionary-prompt-v1.md) — v1 初期テンプレ
- [`docs/prompts/hub-search-synonyms-intent-gap-gemini.md`](../../prompts/hub-search-synonyms-intent-gap-gemini.md) — synonyms / intent 欠落埋め
- [`docs/notes/BRAND_NORMALIZE.md`](../../notes/BRAND_NORMALIZE.md)
