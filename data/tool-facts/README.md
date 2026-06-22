# TOOL_FACTS 手動正本

**更新:** 2026-06-22  
**生成:** `npm run generate:tool-facts` → `docs/prompts/TOOL_FACTS.generated.md`  
**運用:** `docs/BACKLOG.md` §14-9 · `docs/prompts/kanji-san-lp-patterns-gemini.md`

## 思想

- **registry** = 実装の機械可読正本（id · stage · statusNote）
- **lp-marketing-matrix** = Pain · △問題 · 型A-D（マーケ企画）
- **tool-facts/{id}.json** = Gemini が捏造しないための**人間レビュー済み事実**

プロダクトが増えても **1ツール = 1 JSON** を追加するだけ。プロンプト型は変えない。

## status

| 値 | 意味 | Geminiに渡す |
|----|------|--------------|
| `scaffold` | registry/matrix から自動骨格のみ | 可（未記入は「要確認」） |
| `draft` | 提督が記入中 | 可 |
| `reviewed` | 実装・statements と突合済み | 推奨 |

## JSON スキーマ（`{tool_id}.json`）

```json
{
  "tool_id": "warikan",
  "status": "reviewed",
  "updatedAt": "2026-06-22",
  "oneLiner": "40字以内の一行説明",
  "personas": ["飲み会幹事"],
  "implemented": ["確認済み機能のみ · 箇条書き"],
  "notImplemented": ["マーケで言いがちだが未実装のこと"],
  "dataHandling": {
    "upload": false,
    "serverSave": false,
    "localStorage": "なし | あり（用途） | 要確認",
    "retention": "セッションのみ 等"
  },
  "trust": {
    "faqStorage": "保存先の事実（privacy と矛盾しない）",
    "faqEdit": "再編集可否",
    "faqRetention": "保持期間"
  },
  "postCompletion": ["出力後の次アクション"],
  "relatedTools": ["group-split"],
  "captainChecks": ["提督が実装前に確認すること"],
  "promptNotes": "Geminiへの禁止・言い換えメモ"
}
```

## 順番に作る（キュー）

正本: `_queue.json` · 次に着手: **`next` フィールド**

```bash
# 未作成 JSON を registry + matrix から骨格生成
npm run scaffold:tool-facts

# 1件レビュー後
npm run generate:tool-facts
npm run generate:marketing-context
```

## 完了の Definition of Done（1ツール）

- [ ] `implemented` が HTML/JS と一致
- [ ] `notImplemented` にマーケの言い過ぎを明記
- [ ] `dataHandling` が privacy / statements と矛盾しない
- [ ] `status` を `reviewed` に更新
- [ ] `_queue.json` の `next` を次ツールへ
- [ ] `generate:marketing-context` 実行
