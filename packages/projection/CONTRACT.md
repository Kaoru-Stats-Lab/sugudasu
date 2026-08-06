# Projection Contract — Navigator items (Wave 1 freeze)

UI / Interaction MUST consume this shape only. Do not walk Delta Tree in views.

## Input

```text
Delta Tree
+ ViewState (selectedId, filter)
```

## Output

```json
{
  "items": [
    {
      "id": "delta-001",
      "kind": "modified",
      "label": "第3条",
      "visible": true,
      "selected": false,
      "candidate": false,
      "changeDetail": "text_only",
      "beforeText": "…",
      "afterText": "…",
      "confidence": "high",
      "oldNodeRef": "…",
      "newNodeRef": "…",
      "originHint": { "page": 1 }
    }
  ],
  "view": {
    "selectedId": null,
    "filter": {
      "content": true,
      "addedDeleted": true,
      "style": false,
      "showModified": true,
      "showAdded": true,
      "showDeleted": true,
      "showUnchanged": false
    },
    "activeView": "review",
    "expandedIds": []
  },
  "changeCount": 1
}
```

## Rules

- Filter flips `visible` only — never delete Delta nodes
- `changeCount` = visible items where `kind !== "unchanged"`
- Renderer never recomputes Match / Delta / SLIR
