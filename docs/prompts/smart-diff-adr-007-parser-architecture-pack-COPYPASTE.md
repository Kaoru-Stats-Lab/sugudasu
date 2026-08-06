# Cursor Task: Smart Diff Parser Architecture 作成指示

**用途:** Cursor 投入用 COPYPASTE  
**成果物（作成済み Proposed Pack）:**

- [`docs/architecture/parser/ADR-007-Smart-Diff-Parser-Architecture-v0.1.md`](../architecture/parser/ADR-007-Smart-Diff-Parser-Architecture-v0.1.md)
- [`docs/architecture/parser/parser-architecture.md`](../architecture/parser/parser-architecture.md)

**採番:** 投入プロンプトは「ADR-006 Parser」。Architecture では **Export = ADR-006** のため本 Pack は **ADR-007**。Board で統一。

**結論要約:** DOCX = Hybrid（主 JSZip+OpenXML · mammoth は Simple 補助）· PDF = pdf.js · HTML = DOMParser · MD = remark · Track Changes MVP 外 · Parser は Diff しない。

---

# Cursor Task: Smart Diff Parser Architecture ADR-006（呼称）作成

## Role

Input Architecture 担当。DOCX/PDF/HTML/MD →（ParserResult）→ Normalizer → SLIR の設計正本。実装ではない。

成果物: ADR · `parser-architecture.md`

## 必須決定

1. DOCX MVP（mammoth vs OpenXML vs Hybrid）
2. PDF 抽出
3. HTML/MD
4. Parser/Normalizer 境界
5. Track Changes
6. Origin Metadata

## 原則

Parser を賢くしすぎない。同一性・差分・意味最終確定禁止。

## 完了条件

Diff 非担当 · SLIR 一致 · OSS/Build 明確 · Product 未決を拡張しない · Local First

次: Normalizer Architecture（変換頭脳）。
