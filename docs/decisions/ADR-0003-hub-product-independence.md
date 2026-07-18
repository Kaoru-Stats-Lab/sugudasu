# ADR-0003 — Hub と Product の独立進化

**Status:** Accepted  
**Date:** 2026-07-18  
**関連:** `docs/notes/HUB_IA_REFRESH_V2.md`

## Context

ツール数が増えると、発見（一覧）と作業（個別ツール）を同じ UI 構造で抱え込むと、片方の改修がもう片方に波及する。

## Decision

**Hub と Product は独立して進化する。**

- **Hub** = Discovery（探す場所）
- **Product** = Task Completion（作業する場所）

そのため:

- Product 改修を Hub IA に依存させない
- Hub IA は Product テンプレートを知らなくても成立する
- 両者は **データ（SSOT）のみ共有**し、UI 構造は独立して進化できる

## Architecture Principle

Hub は「探す場所」であり、Product は「作業する場所」である。両者は責務が異なる。

- Hub の改善が Product HTML の改修を要求してはならない
- Product のテンプレート変更が Hub IA へ影響してはならない

## Consequences

- Phase 1（Hub IA）は Product HTML 30 本を触らない
- Product テンプレートは `docs/notes/product-template.md` に設計のみ置き、適用は Phase 2
- 共有は `categories.json` · `tool-registry.json` · `synonyms.json` · `relations.json` に限定する
