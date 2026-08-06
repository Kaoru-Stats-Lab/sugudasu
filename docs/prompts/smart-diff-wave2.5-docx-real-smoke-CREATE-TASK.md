# Cursor Task: Smart Diff Wave 2.5 — 実務 DOCX Smoke + Loss Report

**用途:** Cursor 投入用 COPYPASTE  
**前提:** Wave 2 DOCX → Raw → SLIR → Core PASS  
**Architect verdict:** PDF / UI より先に実務 DOCX 揺れと Loss Aware を閉じる。

---

# 以下を Cursor に投入

```markdown
# Smart Diff Wave 2.5 CREATE TASK

## Goal

制御 fixture ではなく、実務に近い DOCX 揺れを Parser/Normalizer が壊さず吸収できることを確認する。
Loss Report で「捨てた」ではなく「比較対象外として認識した」状態を残す。

## 絶対禁止

- SLIR Schema 変更（Accepted ADR-002）
- Matcher / Delta / Projection / Navigator 契約変更
- UI 実装
- PDF Parser
- TextRunNode 復活

## Smoke Tests

### T1 契約書型
Heading · 条番号 · 長文段落 · 箇条書き → Heading / Paragraph / List が壊れない

### T2 社内規程型
太字 · 下線 · 色文字 · 改行混在 → TextNode + styleSegments（色は Raw→segments または Loss）

### T3 Excel貼付表型
表内改行 · セル結合 · 空セル → TableNode Atomic のみ · セル比較しない

### T4 ヘッダー/フッター · ページ番号
SLIR 本文へ混ぜない · Origin Metadata または Ignored + Loss Report

### T5 画像入り
ImageNode 保持 · OCR しない

## Loss Report（ADR-008）

```json
{
  "losses": [
    {
      "type": "unsupported_feature",
      "source": "docx",
      "feature": "header_footer",
      "target": "slir",
      "severity": "warning",
      "message": "Header/Footer excluded from SLIR body"
    }
  ]
}
```

## Done when

- T1–T5 制御スモーク DOCX が PASS
- 既存 Wave 1 / Wave 2 Core 回帰 PASS
- PDF Go 条件の Loss Report · 実務 DOCX が ✅

## Output

docs/prompts/smart-diff-wave2.5-docx-real-smoke-CREATE-TASK.md（本ファイル）
packages 拡張 · fixtures/docx/smoke-* · scripts/run-wave2.5.mjs
MVP Plan に Wave 2.5 追記
```
