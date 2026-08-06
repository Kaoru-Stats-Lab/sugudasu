# Cursor Task: Smart Diff Wave 5 — Local PDF Report Export

**用途:** Cursor 投入用 COPYPASTE  
**前提:** Wave 0–4 PASS · ADR-006 Confirmed  
**Architect:** Export = 確認結果の保存・提出補助。差分エンジンではない。

---

# 以下を Cursor に投入

```markdown
# Smart Diff Wave 5 CREATE TASK

## Goal

Projection Model → Export Renderer → Local PDF Report（pdf-lib）

## 絶対禁止

- Export から SLIR 参照
- Matcher 再実行
- Delta mutate
- 現在 Filter 表示中だけ Export（事故防止 · MVP は全変更）
- Candidate を「変更あり」扱い
- 表のセル差分（「3行2列」禁止）
- 元文書書き換え · Track Changes · サーバーアップロード

## Input

Projection Model（表示可能状態の保持データ）  
Export 時は `visible` Filter を無視し、kind !== unchanged を全件出す。

## Output

`{name}_smart-diff.pdf` / `smart-diff-report.pdf`

内容: ファイル名・変更件数・各変更の Before/After/Type  
Table → 「表に変更があります」  
Candidate → 「Candidate · 未確定 · 確認してください」

## OSS

pdf-lib（既存 TECH_ADOPTION / sg-pdf-vendor と整合）

## Fixtures

A Modified 30→45  
B Added  
C Table  
D Candidate  

## Done when

Projection → PDF Report  
+ Wave1–5 PASS  
→ MVP Architecture Freeze（次は実務ユーザーテスト優先）

## Output paths

docs/prompts/smart-diff-wave5-export-local-report-CREATE-TASK.md
docs/architecture/export/export-design.md
packages/export/*
packages/scripts/run-wave5.mjs
```
