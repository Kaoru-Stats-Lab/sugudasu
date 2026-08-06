# Cursor Task: Smart Diff Wave 0 — Core Type Contract

**用途:** Cursor 投入用 COPYPASTE  
**成果物:** `packages/slir|matcher|delta|projection` の型のみ  
**禁止:** Parser 実装 · UI 実装 · Accepted ADR 変更 · Matcher/Delta アルゴリズム実装

**前提:** Architecture Freeze（Gate ✅）· Wave 0 から開始

---

# 以下を Cursor に投入

```markdown
# Smart Diff Wave 0: Core Type Contract CREATE TASK

## Role

Type Contract Engineer。Smart Diff の実装境界を TypeScript 型として固定する。
アルゴリズム・Parser・UI は書かない。

## 絶対条件

- ADR-002〜013 を参照（Accepted を勝手に変更しない）
- SLIR / Match Map / Delta / Projection / ViewState の型のみ
- Parser 実装禁止 · UI 実装禁止 · Diff 再計算ロジック禁止
- Origin を SLIR 比較フィールドに混ぜない（隔離型）
- ChangeKind に candidate / conflict / moved / styleChanged を足さない
- style は changeDetail / styleSegments · TextRunNode なし

## ディレクトリ

```text
packages/
  slir/schema.ts · types.ts
  matcher/types.ts
  delta/types.ts
  projection/types.ts
  fixtures/old.slir.json · new.slir.json  （人工 SLIR · Phase A）
```

## SLIR

TextNode + styleSegments。tempId。Table Atomic。Annotation。Unknown + loss。
悪い例: wordXmlPath / pdfX を Node 必須フィールドにしない。

## Matcher

MatchMap · confidence high|candidate|none · score。Candidate 判定ロジックは書かない。

## Delta

ChangeKind = added|deleted|modified|unchanged のみ。
changeDetail / confidence で style_only · candidate を表現。

## Projection

deltaNodeId · visibility · highlightRanges · collapsed · selected。
Diff 再計算フィールド禁止。

## 完了条件

- 型が ADR と矛盾しない
- Fixture 2 本が型に沿う
- MVP Plan の Wave 順が「Fixture→Matcher→Delta→Parser→Renderer」に更新されている
```
