# Cursor Task: Smart Diff Wave 1 — Fixture Core Loop

**用途:** Cursor 投入用 COPYPASTE  
**前提:** Wave 0 型契約済み · Architecture Freeze  
**禁止:** DOCX/PDF Parser · UI 本実装 · Accepted ADR 変更 · Matcher が ChangeKind を確定すること

---

# 以下を Cursor に投入

```markdown
# Smart Diff Wave 1 CREATE TASK

## Goal

人工 SLIR Fixture だけで Matcher → Delta → Projection → Navigator State を完成させる。
実ドキュメント投入は Wave 2。

## 絶対条件

### Matcher = 候補生成のみ
Input: Before SLIR + After SLIR
Output: Match Map (high|candidate|none)
禁止: Modified/Added/Deleted の確定（Delta 責務）

### Delta = 変更意味化
Match Map → Delta Tree
Candidate → confidence:candidate · Deleted+Added 自動変換禁止
style_only は changeDetail

### Projection
Delta → Navigator items contract（UI が Delta に直接触らない）
Filter = visibility · DOM 削除しない

### Primary UX
Change Navigator driven · canvas secondary

## Fixtures（最低5）

A 本文変更 Modified
B 段落追加 Added · 後続が全部 Modified にならない
C 前方挿入 · 第1〜3条 Unchanged（Stable Identity）
D スタイル変更 style_only
E Table Atomic · Cell Diff 禁止

## Navigator MVP

必須: 次/前 · 件数 · 選択同期 · Modified filter
推奨: Added/Deleted filter
禁止: コメント編集 · Accept All · Auto Merge

## Benchmark

1000 nodes: Matcher / Delta / Projection 時間を計測（切り分け用）

## 出力

packages/ 配下の engine + fixtures A–E + run/bench スクリプト
docs の MVP Plan Wave 1 を更新
```
