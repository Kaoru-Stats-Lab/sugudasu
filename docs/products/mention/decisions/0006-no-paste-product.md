# ADR-0006 No Paste Product

**Status:** Accepted（Reject 固定）  
**Date:** 2026-07-27

## Context

URL/本文貼り付けはブラウザのみで実装できるが、体験価値（Find outside → Finish inside）が半減する。

## Decision

手動 URL 貼り · 本文貼りを **入力経路にも代替製品にもしない。**  
入力は Current Tab（Adapter）のみ。

## Consequences

- `/mention` に作業用ペースト UI を作らない  
- 関連: ADR-0001 · philosophy P6
