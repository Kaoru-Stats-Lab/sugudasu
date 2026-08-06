# 通し検証: 架空契約書（SLIR → Matcher → Delta）

| 項目 | 値 |
|------|-----|
| **Status** | Draft sample（設計検証用 · 実装データではない） |
| **目的** | Schema が綺麗でも差分表現で破綻しないか確認する |
| **ADR** | [`../ADR-004-Smart-Diff-Delta-Tree-Schema-v0.1.md`](../ADR-004-Smart-Diff-Delta-Tree-Schema-v0.1.md) |

> 架空。実在契約ではない。Board / 実装前の sanity check。

---

## シナリオ

旧契約書 → 新契約書で次が起きる:

1. 第3条 契約期間: 「1年」→「2年」（Strong Modified）
2. 第4条: 削除（Deleted）
3. 第5条 支払条件: 新規（Added）
4. 「重要」→ 太字「重要」（Style only）
5. 第2条本文は不変 + コメント追加（Annotation Added）
6. 「第6条 秘密」っぽい段落が曖昧一致 Score 72（Candidate）
7. 料金表 Table: 中身変更（TableBlock Modified · Cell なし）

---

## 1. SLIR（要約）

### Old（抜粋）

```json
{
  "type": "document",
  "id": "old-doc",
  "children": [
    { "type": "heading", "id": "o-h2", "level": 2, "text": "第2条 目的" },
    {
      "type": "paragraph",
      "id": "o-p2",
      "children": [{ "type": "textRun", "id": "o-r2", "text": "本契約の目的は…", "normalizedText": "本契約の目的は…" }]
    },
    { "type": "heading", "id": "o-h3", "level": 2, "text": "第3条 契約期間" },
    {
      "type": "paragraph",
      "id": "o-p3",
      "children": [
        { "type": "textRun", "id": "o-r3a", "text": "契約期間は", "normalizedText": "契約期間は" },
        { "type": "textRun", "id": "o-r3b", "text": "1年", "normalizedText": "1年" }
      ]
    },
    { "type": "heading", "id": "o-h4", "level": 2, "text": "第4条 旧条項" },
    { "type": "paragraph", "id": "o-p4", "children": [{ "type": "textRun", "id": "o-r4", "text": "廃止予定の条項", "normalizedText": "廃止予定の条項" }] },
    {
      "type": "paragraph",
      "id": "o-p-imp",
      "children": [{ "type": "textRun", "id": "o-r-imp", "text": "重要", "normalizedText": "重要", "style": {} }]
    },
    { "type": "heading", "id": "o-h6", "level": 2, "text": "第6条 秘密保持" },
    { "type": "paragraph", "id": "o-p6", "children": [{ "type": "textRun", "id": "o-r6", "text": "秘密情報を第三者に開示しない。", "normalizedText": "秘密情報を第三者に開示しない。" }] },
    { "type": "table", "id": "o-t1", "contentHash": "hash-old-fee", "rowCount": 3, "columnCount": 2 }
  ]
}
```

### New（抜粋）

```json
{
  "type": "document",
  "id": "new-doc",
  "children": [
    { "type": "heading", "id": "n-h2", "level": 2, "text": "第2条 目的" },
    {
      "type": "paragraph",
      "id": "n-p2",
      "children": [
        { "type": "textRun", "id": "n-r2", "text": "本契約の目的は…", "normalizedText": "本契約の目的は…" },
        { "type": "annotation", "id": "n-a2", "kind": "comment", "text": "法務確認済", "targetRef": "n-p2" }
      ]
    },
    { "type": "heading", "id": "n-h3", "level": 2, "text": "第3条 契約期間" },
    {
      "type": "paragraph",
      "id": "n-p3",
      "children": [
        { "type": "textRun", "id": "n-r3a", "text": "契約期間は", "normalizedText": "契約期間は" },
        { "type": "textRun", "id": "n-r3b", "text": "2年", "normalizedText": "2年" }
      ]
    },
    { "type": "heading", "id": "n-h5", "level": 2, "text": "第5条 支払条件" },
    { "type": "paragraph", "id": "n-p5", "children": [{ "type": "textRun", "id": "n-r5", "text": "月末締め翌月末払い", "normalizedText": "月末締め翌月末払い" }] },
    {
      "type": "paragraph",
      "id": "n-p-imp",
      "children": [{ "type": "textRun", "id": "n-r-imp", "text": "重要", "normalizedText": "重要", "style": { "bold": true } }]
    },
    { "type": "heading", "id": "n-h6", "level": 2, "text": "第6条 秘密保持等" },
    { "type": "paragraph", "id": "n-p6", "children": [{ "type": "textRun", "id": "n-r6", "text": "秘密情報を第三者へ開示してはならない。", "normalizedText": "秘密情報を第三者へ開示してはならない。" }] },
    { "type": "table", "id": "n-t1", "contentHash": "hash-new-fee", "rowCount": 3, "columnCount": 2 }
  ]
}
```

---

## 2. Match Map（要約）

```json
[
  { "oldNodeId": "o-p2", "newNodeId": "n-p2", "score": 96, "confidence": "high" },
  { "oldNodeId": "o-p3", "newNodeId": "n-p3", "score": 94, "confidence": "high" },
  { "oldNodeId": "o-p4", "newNodeId": null, "confidence": "none" },
  { "oldNodeId": null, "newNodeId": "n-p5", "confidence": "none" },
  { "oldNodeId": "o-p-imp", "newNodeId": "n-p-imp", "score": 98, "confidence": "high" },
  { "oldNodeId": "o-p6", "newNodeId": "n-p6", "score": 72, "confidence": "candidate" },
  { "oldNodeId": "o-t1", "newNodeId": "n-t1", "score": 88, "confidence": "high" }
]
```

Annotation `n-a2` は本文 Match と分離（本文 high · Annotation は new only → Added）。

---

## 3. Delta Tree（期待）

```json
{
  "root": {
    "id": "d-doc",
    "kind": "Unchanged",
    "children": [
      {
        "id": "d-p2",
        "kind": "Unchanged",
        "before": "o-p2",
        "after": "n-p2",
        "confidence": "high",
        "children": [
          { "id": "d-a2", "kind": "Added", "after": "n-a2", "metadata": { "summary": "コメント追加" } }
        ]
      },
      {
        "id": "d-p3",
        "kind": "Modified",
        "before": "o-p3",
        "after": "n-p3",
        "confidence": "high",
        "metadata": {
          "changeReason": "TextChanged",
          "beforeText": "契約期間は1年",
          "afterText": "契約期間は2年",
          "inlineChanges": [{ "type": "replace", "before": "1年", "after": "2年" }]
        }
      },
      {
        "id": "d-p4",
        "kind": "Deleted",
        "before": "o-p4",
        "metadata": { "summary": "第4条 旧条項" }
      },
      {
        "id": "d-p5",
        "kind": "Added",
        "after": "n-p5",
        "metadata": { "summary": "第5条 支払条件" }
      },
      {
        "id": "d-p-imp",
        "kind": "Modified",
        "before": "o-p-imp",
        "after": "n-p-imp",
        "confidence": "high",
        "metadata": { "changeReason": "StyleChanged", "beforeText": "重要", "afterText": "重要" }
      },
      {
        "id": "d-p6",
        "kind": "Candidate",
        "before": "o-p6",
        "after": "n-p6",
        "confidence": 72,
        "metadata": {
          "summary": "第6条 秘密保持（自動判定候補）",
          "beforeText": "秘密情報を第三者に開示しない。",
          "afterText": "秘密情報を第三者へ開示してはならない。"
        }
      },
      {
        "id": "d-t1",
        "kind": "Modified",
        "before": "o-t1",
        "after": "n-t1",
        "confidence": "high",
        "metadata": { "summary": "料金表（表単位）" }
      }
    ]
  }
}
```

Accepted 互換なら `d-p6` は:

```json
{ "kind": "modified", "confidence": "candidate", "oldNodeRef": "o-p6", "newNodeRef": "n-p6" }
```

---

## 4. 検証チェック

| 観点 | 結果 |
|------|------|
| 第3条が Deleted+Added になっていない | OK（Modified） |
| Candidate が Deleted+Added になっていない | OK |
| コメントが本文 Modified になっていない | OK（Unchanged + Annotation Added） |
| Style が独立 ChangeKind になっていない | OK（Modified + StyleChanged） |
| Table に Cell が無い | OK |
| Renderer が読むのは Delta のみで足りる | OK（before/after ref + summary） |
| 文字単位 `[間]` 表示を正としていない | OK（1年 → 2年） |

---

## 5. 見つかった設計メモ

1. Candidate を `kind` にするか `confidence` にするかで JSON 形が分岐する → **Board 必須**。
2. Heading を Delta に載せるか Paragraph に summary で吸収するかは Renderer 契約で決める。
3. 通し検証は Schema 変更のたびに本サンプルを更新する（推測で埋めない）。
