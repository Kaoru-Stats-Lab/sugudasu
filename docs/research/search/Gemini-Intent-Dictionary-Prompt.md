# Gemini — Intent 辞書プロンプト索引

**種別:** Research（AI プロンプト資産）  
**方針:** プロンプト本文の **正本は `docs/prompts/`** に置く。本ファイルは索引 + 使い分け。

Intent 辞書を MECE に作らせるプロンプトは **再利用資産**。Backlog に書かない。

---

## 正本（コピペ用）

| 用途 | ファイル |
|------|----------|
| **ツール別 search-dictionary 新規/更新** | [`search-dictionary-prompt-v2.md`](../../prompts/search-dictionary-prompt-v2.md)（正本） |
| **synonyms + tool-intent-map 欠落埋め** | [`hub-search-synonyms-intent-gap-gemini.md`](../../prompts/hub-search-synonyms-intent-gap-gemini.md) |
| **v1（初期テンプレ）** | [`search-dictionary-prompt-v1.md`](../../prompts/search-dictionary-prompt-v1.md) |
| **索引** | [`search-dictionary-prompt.md`](../../prompts/search-dictionary-prompt.md) |

---

## 使い方（固定手順）

1. **1 Product = 1 プロンプト** — 返答をマージしてから次へ
2. 出力は **JSON のみ** — 前置き · 機能捏造 · ブランド連呼禁止（各プロンプト内ガードレール）
3. 反映後:
   ```bash
   npm run build:hub-search
   npm run validate:hub-ia
   ```
4. 採否が変わったら ADR を更新。プロンプト改善だけなら本 Research に追記

---

## MECE に Intent 辞書を作らせるときの依頼骨子

Gemini へ渡すときの **追加指示**（プロンプト末尾に足す）:

```text
# 追加: MECE 分割

次の4バケツに terms / jobs を分類してから JSON 出力すること。

1. やりたいこと（動詞・JTBD）
2. 対象物・成果物（名詞）
3. 表記ゆれ・口語・略称
4. 取り違え防止（commonMistakes · 他ツールへ誤ルーティングしうる語）

重複は統合。1 term が無関係な複数 toolId に付かないこと。
```

---

## 成果物の置き場

| 出力 | 置き場 |
|------|--------|
| JSON（マージ済み） | `data/search-dictionary/` · `data/synonyms.json` · `data/tool-intent-map.json` |
| Gemini 生ログ · 比較メモ | `docs/notes/*-gemini-RESULT.md` または本 `research/search/` に追記 |
| 設計判断 | [ADR-006](../../adr/ADR-006-search-ia-principles.md) |

---

## 関連 ADR · Research

- [Intent-Dictionary.md](Intent-Dictionary.md)
- [ADR-003 Search UX](../../adr/ADR-003-search-ux.md)
