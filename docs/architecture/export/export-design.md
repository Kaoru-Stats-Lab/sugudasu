# Smart Diff Export Design v0.1（Wave 5）

| 項目 | 値 |
|------|-----|
| **ADR** | [`../ADR-006-Export-Architecture-v0.1.md`](../ADR-006-Export-Architecture-v0.1.md) · [`../ADR-006-Export-Confirmation-2026-08-06.md`](../ADR-006-Export-Confirmation-2026-08-06.md) |
| **Status** | Wave 5 Implementation Contract |
| **Date** | 2026-08-06 |

> Export は差分エンジンではない。**確認結果の Local 提出補助**。

---

## Pipeline（固定）

```text
Projection Model
  → Export Renderer（Report pages）
  → pdf-lib
  → Local PDF Download
```

### 禁止

```text
Export → SLIR
Export → Matcher
Export → Delta mutate
Upload → Server
```

---

## Input 決定（Wave 5 · Architect）

| 旧 Confirmation Residual | Wave 5 決定 |
|--------------------------|-------------|
| Delta Tree 正本 vs Projection | **Projection Model** を Export 入力とする（UI と同じ契約 · 再計算なし） |
| Filter 適用結果を出すか | **MVP = 全変更**（`visible` 無視 · `kind !== unchanged`） |

理由: Filter で非表示にした重要変更が提出物から消える事故を防ぐ。

---

## Report Model（中間）

```ts
type DiffReport = {
  title: string;
  generatedAt: string; // ISO
  sources?: { oldName?: string; newName?: string };
  changeCount: number;
  entries: DiffReportEntry[];
};

type DiffReportEntry = {
  index: number;
  label: string;
  /** Display type — never invent ChangeKind */
  displayType: "Modified" | "Added" | "Deleted" | "Candidate" | "Table changed";
  before?: string;
  after?: string;
  body?: string; // table note / candidate note
  candidate?: boolean;
};
```

`Projection → DiffReport` は純関数。pdf-lib は DiffReport のみ読む。

---

## Layout（MVP）

```
Smart Diff Report
File: old / new
Changes: N
────────────────
1. {label}
Before: …
After: …
Type: Modified
────────────────
```

Table: body = `表に変更があります`（Before/After 空可）  
Candidate: Type = Candidate · body = 未確定・確認してください

---

## File naming

`{base}_smart-diff.pdf` · base 省略時 `smart-diff-report.pdf`

---

## Phase2（非目標）

Redline PDF · Visual Diff · Filter-scoped export オプション · DOCX Track Changes
