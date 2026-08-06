# Cursor Task: Smart Diff Wave 3 — PDF Parser → Raw → Normalizer → SLIR

**用途:** Cursor 投入用 COPYPASTE  
**前提:** Wave 2.5 DOCX smoke + Loss Report PASS · PDF Go 条件充足  
**Architect verdict:** PDF は DOCX の延長ではない。構造欠落を早期に潰す。UI/Export は後。

---

# 以下を Cursor に投入

```markdown
# Smart Diff Wave 3 CREATE TASK

## Goal

PDF → pdf.js → Raw PDF Model → PDF Normalizer → SLIR
既存 Wave1 Core と DOCX 回帰を壊さない。

## 絶対禁止

- PDF から直接 SLIR 生成（Normalizer 必須）
- Matcher / Delta / Projection / SLIR Schema 変更
- UI / Export
- 外部 OCR API · AI 解析
- Section 生成（改ページでも）
- 完全な表解析 · セル Diff · 手書き認識 · フォーム解析

## OSS

採用: pdfjs-dist（decode · textContent · viewport）
Node 検証: legacy build 可
既存 sg-pdf-vendor と能力を共有する（再発明禁止の精神）

## Raw PDF Model（最低）

PdfDocumentRaw { pages[] }
PdfPageRaw { pageNumber, width, height, items[] }
PdfTextItemRaw { text, x, y, width, height, fontName, fontSize }
PdfImageRaw { bbox }
PdfVectorRaw { type }

## Phase1 対応

| PDF | SLIR |
|-----|------|
| 文字 | TextNode |
| 行 | Paragraph 候補 |
| 大きい文字 | Heading 候補 |
| 画像 | ImageNode |
| 表らしい並び | Table Atomic 候補 |
| 座標 | Origin metadata |

## Loss Report（必須 · SLIR に混ぜない）

reading_order_uncertain · table_structure_unknown · ocr_required 等

## Fixtures（最低5）

A 普通の契約書 → Heading + Paragraph
B 2段組 → reading_order_uncertain
C 表 → Table Atomic · セル比較なし
D スキャンPDF → Text なし · ImageNode · ocr_required
E 改ページ → ページ境界は origin · Section 禁止

## Done when

PDF → Raw → Normalizer → SLIR
+ Wave1 Core PASS
+ DOCX Wave2 / 2.5 PASS
+ Loss Report 生成

## Output

packages/raw/pdf-types.ts
packages/parser/pdf.mjs
packages/normalizer/pdf-to-slir.mjs
packages/fixtures/pdf/*
packages/scripts/build-pdf-fixtures.mjs · run-wave3.mjs
docs MVP Plan 更新（Wave4=UI · Wave5=Export）
```
