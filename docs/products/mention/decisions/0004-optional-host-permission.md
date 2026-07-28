# ADR-0004 Optional Host Permission

**Status:** Accepted  
**Date:** 2026-07-27

## Context

`<all_urls>` 固定は審査印象が悪く、Current Context Only / 最小権限の憲法にも反する。  
プラットフォームは Adapter であり、ユーザーが開くまで読まない。

## Decision

- 初期から **`<all_urls>` を固定取得しない**  
- **`optional_host_permissions`**（または同等の段階許可）を正とする  
- 未許可 Adapter のページでは沈黙してよい  

α 実装が広い場合は **憲法が先 · 実装を従わせる**。

## Consequences

- Store 説明は「今開いている対応ページの補助」  
- Maps → X のように許可 UX を Adapter 単位で増やす  
- 関連: philosophy P2 · chrome-store.md
