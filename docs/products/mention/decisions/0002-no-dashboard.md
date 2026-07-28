# ADR-0002 No Dashboard

**Status:** Accepted（Reject 固定）  
**Date:** 2026-07-27

## Context

競合は Monitoring → Store → Dashboard が重力中心。  
「便利そう」で Analytics / 時系列 / 全文検索を足すと、Mention は監視ツールに吸い込まれ、Mission（Done）が死ぬ。

## Decision

**Dashboard · Analytics · Monitoring · 全文検索 · データ収集 UI は作らない。**  
Mission は Done。進化方向も Done 速度と Adapter 追加のみ。

## Consequences

- 「やっぱり Dashboard」提案 → 本 ADR と [`../competition.md`](../competition.md) で議論終了  
- Team 機能（Template 共有等）でも Dashboard は足さない（pricing-roadmap Phase 4）  
- 憲法: philosophy P1 Single Purpose
