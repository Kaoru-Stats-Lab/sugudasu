# Cursor Task: Smart Diff Wave 4 — Change Navigator UI

**用途:** Cursor 投入用 COPYPASTE  
**前提:** Wave 0–3 PASS · ADR-011 Navigator Primary  
**Architect:** UI は Projection の消費者。SLIR / Matcher / Delta mutate 禁止。

---

# 以下を Cursor に投入

```markdown
# Smart Diff Wave 4 CREATE TASK

## Goal

Projection Model → Change Navigator → Semantic Anchor → Review View（Before/After）

計算済みの意味ある差分を 3 分で確認できる UI。差分を再計算する UI にしない。

## 絶対禁止

- UI から SLIR 参照
- UI から Matcher 再実行
- UI から Delta Tree mutate
- pixel / scrollTop を Anchor 正本にする
- 表のセル差分表示（「3行2列目」禁止）
- Candidate を Modified 扱い
- 全 SLIR 再 Render
- React 必須化（既存ツールは vanilla · Projection 契約さえ守れば可）

## Primary UX

変更一覧 → クリック → Anchor 移動 → 左右比較

## Anchor

{ deltaId, semanticNodeId, originHint? } — 再生成可能

## Filter

visibility toggle のみ · DOM ノード削除禁止

## Table Phase1

「表に変更があります」のみ

## Perf

1000 Delta: Navigator render <100ms · selection <50ms（計測スクリプト）

## Fixtures

A DOCX 第3条 30→45 · Navigator 選択
B PDF page origin Anchor
C Table 表示のみ

## Done when

Projection → Navigator → Anchor Sync → Review View
+ Wave1–3 regression PASS

## Output

docs/prompts/smart-diff-wave4-ui-change-navigator-CREATE-TASK.md
docs/ui/smart-diff/{CHANGE_NAVIGATOR,PROJECTION_VIEW_MODEL,INTERACTION_SPEC}.md
assets/smart-diff-navigator.js（Projection 消費者）
packages/fixtures/ui/* · packages/scripts/run-wave4.mjs
tools/diff.html にプレビュー配線（既存テキスト Diff を壊さない）
```
