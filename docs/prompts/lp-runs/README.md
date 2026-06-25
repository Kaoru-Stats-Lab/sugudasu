# LP型A-D — ツール別コピペ用プロンプト

**SSOT（型の定義）:** [`../kanji-san-lp-patterns-gemini.md`](../kanji-san-lp-patterns-gemini.md)  
**運用 Backlog:** [`../../BACKLOG.md`](../../BACKLOG.md) §14-9

束単位の並列6本ではなく、**1ツール × 1型 = 1ファイル**で Gemini / Grok に投げるための依頼文です。

---

## 使い方（提督 · Agent 共通）

```text
1. npm run generate:marketing-context
2. 対象ツールの {tool}.gemini-type{A|B|C|D}.md を開く
3. 「依頼文」ブロック + tool-facts/{tool}.generated.md を Gemini に添付
4. 返答 → docs/notes/lp-runs/{tool}-type{X}-gemini-RESULT.md に保存
5. 採用候補だけ {tool}.grok-type{X}.md で Grok 第2パス
6. 返答 → docs/notes/lp-runs/{tool}-type{X}-grok-RESULT.md
7. statements · privacy · registry と突合 → tools/{id}.html 反映
```

**Grok 無料枠:** 全型一括ではなく **採用した表だけ** 第2パス。matrix の `primaryType` から始める。

---

## ファイル一覧

| tool_id | 最優先の型 | Gemini | Grok |
|---------|-----------|--------|------|
| **warikan** | A | `warikan.gemini-type{A,B,C,D}.md` | `warikan.grok-type{A,B,C,D}.md` |
| **group-split** | A | `group-split.gemini-type{A,B,C,D}.md` | `group-split.grok-type{A,B,C,D}.md` |

他ツールは warikan を複製し `{tool_id}` と添付パスを差し替える。

---

## 結果の置き場

`docs/notes/lp-runs/`（Git 管理 · RESULT  suffix）

例: `warikan-typeD-gemini-RESULT.md` · `warikan-typeA-grok-RESULT.md`

---

## Gemini / Grok の役割分担

| | Gemini | Grok |
|---|--------|------|
| **向き** | 表 · Pain · FAQ構造 · 優先度 | 口語化 · AI味除去 |
| **禁止** | 礼賛 · 数値捏造 · planned を実装済みと断定 | 行の増減 · 事実変更 · 競合名指し |

---

## 関連

- 事実添付: `docs/prompts/tool-facts/{tool_id}.generated.md`
- 一括添付（束用・レガシー）: `GEMINI_MARKETING_CONTEXT.generated.md`
- note 用 Grok（別パイプライン）: `note-deai-grok.md`
