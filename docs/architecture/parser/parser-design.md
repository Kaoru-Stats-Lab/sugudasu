# Parser Design v0.1

| 項目 | 値 |
|------|-----|
| **ADR** | [`ADR-007-Smart-Diff-Parser-Architecture-v0.1.md`](ADR-007-Smart-Diff-Parser-Architecture-v0.1.md) |

> 実装コードではない。Raw Document Model と OSS/Build 境界。

---

## 1. Principle

```text
Parser = Format → Raw Document Model
Normalizer = Raw → SLIR
```

Parser が「これは Paragraph だ」と最終確定しない場合もある（特に PDF）。推定ヒントは Raw に載せ、確定は Normalizer + Loss Aware。

---

## 2. Raw Document Model（Parser Output Contract）

```typescript
type RawDocumentModel = {
  format: "docx" | "pdf" | "html" | "markdown" | string;
  metadata?: {
    title?: string;
    parser?: { name: string; mode?: "simple" | "high-fidelity" };
  };
  blocks: RawBlock[];
  originMetadata?: Record<string, unknown>;
};

/** 形式依存の緩いブロック。SLIR Node 型名を強制しない */
type RawBlock = {
  kindHint?: "paragraph" | "heading" | "list" | "table" | "image" | "unknown" | string;
  text?: string;
  runs?: Array<{ text: string; style?: Record<string, unknown> }>;
  level?: number;
  tableSummary?: string;
  origin?: {
    xmlPath?: string;
    page?: number;
    boundingBox?: { x: number; y: number; width: number; height: number };
    domPath?: string;
    sourcePosition?: number;
  };
  annotations?: Array<{ kind?: string; text: string }>;
  raw?: unknown; // 形式ネイティブ断片（比較に使わない）
};
```

**明示:** これは SLIR ではない。Matcher / Delta は Raw を直接消費しない。

---

## 3. OSS / Build

| Format | Buy | Build | 備考 |
|--------|-----|-------|------|
| DOCX HF | JSZip | document.xml 走査 → Raw | 主経路 |
| DOCX Simple | mammoth | HTML → Raw への薄い写像 | 非 SSOT |
| DOCX Viewer | docx-preview | — | **Parser 主経路外** |
| PDF | pdf.js | — | Block 化は Normalizer |
| HTML | DOMParser · DOMPurify 候補 | — | |
| Markdown | remark/unified | mdast → Raw | mdast ≠ SLIR |
| SLIR 意味 | — | **Normalizer ADR-008** | |

---

## 4. DOCX Options（再掲）

| Option | 判定 |
|--------|------|
| A mammoth 中心 | Simple のみ |
| B OpenXML のみ | 主経路の核 |
| **C Hybrid** | **採用** |

docx-preview: ブラウザ表示参考。比較パイプラインの Parser としては不採用。

---

## 5. PDF

描画情報。Text / bbox / page を Raw へ。Reading order 不確実は `kindHint: unknown` + origin +（Normalizer 側 Loss Aware）。

---

## 6. Boundary Checklist

- [ ] Diff していない  
- [ ] Stable ID していない  
- [ ] ChangeKind していない  
- [ ] UI 情報なし  
- [ ] AI なし  
- [ ] SLIR 型を Parser が完成させていない  

---

## 7. Handoff to Normalizer（ADR-008）

Normalizer が確定する例:

- Paragraph / Heading の最終判定  
- 空行ポリシー  
- PDF Geometry → Block  
- runs → TextRunNode  
- Table Atomic contentHash  
- Annotation Attach  

本 Design の Raw フィールドは ADR-008 で締めうる（OQ-N1）。
