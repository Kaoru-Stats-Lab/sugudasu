# SUGUDASU 裏紙

> **Uragami is not software that lets you draw. It is software that helps you explain.**

**ProductID / URL:** `uragami` · `/uragami`  
**一言:** ブラウザに、いつでも一枚の裏紙。  
**状態:** ADR Accepted · Implementation Approved

## Mission

```text
Uragami exists to explain ideas, not to create drawings.

The drawing is never the goal.

Helping someone understand is the goal.

Every design decision should optimize the speed from
"I need to explain something"
to
"They understood."
```

将来の機能提案（図形 · テキスト · レイヤー · オブジェクト等）は、まず  
**「説明が速くなるか？」** で判定する。速くならないなら Reject（ADR-000）。

## JTBD

説明のために描く（同僚 · 会議 · Cursor · ChatGPT · Slack · 電話しながら）。  
成果物制作・ホワイトボード・ノートではない。Zoom 専用でもない。

## 競合認識

Excalidraw / Miro / FigJam ではない。  
競合は **コピー機の横に積んである裏紙**。

## 紙の形

- 常に **一枚**（Infinite Canvas 禁止）
- 既定 **16:9**（初期。A4 は将来検討可）
- **Paper Zoom / Pan** 可（見る距離 · 位置）。Viewport UI（+/- · ミニマップ）禁止

## ADR

| ID | 題 | Status |
|----|-----|--------|
| [ADR-000](./ADR-000-constitution.md) | Constitution — 裏紙で現実にできないことは実装しない | **Accepted** |
| [ADR-001](./ADR-001-why-digital-scrap-paper.md) | Why "Digital Scrap Paper" | **Accepted** |
| [ADR-002](./ADR-002-why-no-infinite-canvas.md) | Why No Infinite Canvas（Paper Zoom は別） | **Accepted** |
| [ADR-003](./ADR-003-why-no-text-tool.md) | Why No Text Tool | **Accepted** |
| [ADR-004](./ADR-004-why-no-file-import.md) | Why No File Import | **Accepted** |
| [ADR-005](./ADR-005-why-sessionstorage-only.md) | Why SessionStorage Only | **Accepted** |
| [ADR-006](./ADR-006-why-pen-first.md) | Why Pen First（描き味最優先） | **Accepted** |
| [ADR-007](./ADR-007-why-one-sheet.md) | Why One Sheet（16:9 · Paper Zoom） | **Accepted** |
| [ADR-008](./ADR-008-why-turn-page.md) | Why Turn Page Instead of Delete | **Accepted** |
| [ADR-009](./ADR-009-why-no-persistence.md) | Why No Persistence | **Accepted** |

## 実装優先順位

1. 描き味 · 2. レイテンシ · 3. 紙らしさ · 4. Paper Turn · 5. PNG · 6. 印刷

判断軸: **説明が速くなるか？**（Mission）かつ **裏紙で現実にできるか？**（ADR-000）
