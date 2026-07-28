# ADR-0005 No LLM

**Status:** Accepted（Reject 固定）  
**Date:** 2026-07-27

## Context

LLM 文案は毎回変わり、「炎上しないか」という新しい判断を増やす。  
Zero Thinking · Anti（創造しない）と衝突する。

## Decision

Action Engine は **ルール + 編集可能テンプレ + `{{変数}}` のみ。**  
LLM による返信生成 · 言い換え提案は採用しない。

## Consequences

- UI で「生成」と言わない → 「定型を展開」  
- AI 利用料ビジネスにもしない（pricing）  
- 関連: philosophy P5
