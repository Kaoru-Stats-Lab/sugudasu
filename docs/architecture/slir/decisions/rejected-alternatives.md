# SLIR v0.1 — Rejected Alternatives

| 項目 | 値 |
|------|-----|
| **ADR** | [`../ADR-002-Smart-Diff-SLIR-Schema-v0.1.md`](../ADR-002-Smart-Diff-SLIR-Schema-v0.1.md) |
| **Date** | 2026-08-06 |

---

## Path Based Stable ID

**Rejected.** 位置変更・途中挿入に弱い。後続 Node 全体が Changed 扱いになる。

---

## Random UUID only を Identity とする

**Rejected.** 再 Parse で全 Node 変更になる。一時 id としての UUID は可。Identity にはしない。

---

## Parser Output 直接比較

**Rejected.** 形式依存。DOCX/PDF/HTML/MD 横断不能。

---

## PDF 座標中心 SLIR

**Rejected.** 意味構造比較にならない。bbox は Origin Isolation。

---

## mammoth HTML を SLIR SSOT にする

**Rejected.** 比較構造不足。SLIR 生成は Build（Normalizer）。

---

## TableRow / TableCell を Phase1 Diff Node にする

**Rejected.** Product Constitution — Table Diff Phase2。Atomic TableNode のみ。

---

## AI Semantic Diff

**Rejected.** No unnecessary AI · Local First · 再現性。

---

## Track Changes 完全対応を ADR-002 で決定

**Rejected as decision.** Product 未決定。Metadata 候補記載のみ（OQ-003）。

---

## Identity Score / Candidate 判定を SLIR に閉じる

**Rejected.** Matcher ADR-003 責務。本 ADR は境界のみ。

---

## TextSpan 断片列を正とする案（旧 Accepted）

**Superseded by ADR-009 Adopt.** TextNode + styleSegments に置換。

---

## TextRunNode / Paragraph→TextRun

**Rejected / Superseded.** OpenXML 依存。009 Adopt で確定。
