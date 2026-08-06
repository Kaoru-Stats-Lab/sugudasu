# Cursor Task: Smart Diff Wave 2 — DOCX Parser → Raw → Normalizer → SLIR

**用途:** Cursor 投入用 COPYPASTE  
**前提:** Wave 1 Fixture Core PASS · Architecture Freeze  
**Architect verdict:** UI 配線は後回し。DOCX 経路を先に閉じる。

---

# 以下を Cursor に投入

```markdown
# Smart Diff Wave 2 CREATE TASK

## Goal

DOCX → Raw Document Model → Normalizer → SLIR → 既存 Wave 1 Core を通過させる。

## 絶対条件

### Parser ≠ SLIR
.docx → JSZip → OpenXML XML → Raw Document Model
禁止: Parser が直接 SLIR を作ること

### Normalizer のみが SLIR を作る
Raw → TextNode + styleSegments（ADR-009）
Table → TableNode Atomic（セル SLIR 禁止）

### 変更禁止
- UI 実装
- Matcher / Delta / Projection / Navigator の契約変更
- SLIR schema（ADR-002 Accepted）変更

## OSS

| 用途 | 採用 |
|------|------|
| ZIP | JSZip |
| XML | DOMParser（Browser）· Node 検証は xmldom 可 |
| 表示 | docx-preview 非採用 |
| Semantic HTML | mammoth 補助可 · 主経路にしない |
| SLIR | 自作 Normalizer |

## 実装順

Wave 2-0 Raw Document Model Type 固定
Wave 2-1 DOCX XML Reader
Wave 2-2 Paragraph / Heading
Wave 2-3 Style（runs → segments 素材）
Wave 2-4 Table Atomic 素材
Wave 2-5 Annotation placeholder
Wave 2-6 Normalizer 接続
Wave 2-7 DOCX Fixture → Wave 1 Core PASS

## DOCX Fixtures（制御された最小セット）

A 本文変更 → Modified
B 前方挿入 / 段落追加 → 後続 cascade なし · Unchanged 保持
C 書式変更 → style_only
D 表 → TableNode Atomic · table_changed

## Output

packages/raw · parser · normalizer
packages/fixtures/docx/*
packages/scripts/run-wave2.mjs
docs MVP Plan / Manifest 更新

## Done when

制御 DOCX fixture が既存 Matcher → Delta → Projection を通り、
A/B/C/D の期待 ChangeKind / changeDetail を満たす。
```
