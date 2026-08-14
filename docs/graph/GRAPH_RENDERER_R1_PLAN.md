# SUGUDASU Graph — Renderer Phase R1 Plan

**Status:** Active（R1 + R1.x target）  
**Scope:** Bar · Column · Line · **Bullet** · **Grouped_Column（目標経路のみ）**  
**Out of scope:** 汎用 Grouped/Stacked · Pie/Donut/Waterfall · PPTX · EMF · 編集 UI · 達成色自動発明

---

## 目的

Renderer 基盤を代表 type で検証する。

- axis · grid · scale · baseline
- category / value labels（Text Layer 最小）
- color · stroke
- SVG structure（viewBox · deterministic order）
- PNG export
- **目標 GAP:** Bullet（マーカー）/ Grouped_Column（並棒）

---

## 実装順

1. `renderGraph` 入口 + Validator ゲート
2. type dispatcher（R1/R1.x 以外 REJECT）
3. shared: scale · padding · axes · grid
4. Column renderer
5. Bar renderer
6. Line renderer
7. SVG 文字列の決定論的シリアライズ
8. PNG（sharp · SVG → raster）
9. Contract tests
10. **R1.x** 目標3型 — Column+目標線 / Bullet / Grouped_Column（[`GRAPH_TARGET_REPRESENTATION.md`](./GRAPH_TARGET_REPRESENTATION.md)）

---

## R2 / R3（まだ実装しない）

**R2:** Grouped_Bar（汎用）· Stacked_Column · 100pct_Stacked_Column · Waterfall  
**R3:** Combination_Column_Line · Scatter · Donut · Pie · Small_Multiples  

※ Bullet / Grouped_Column（目標）は **R1.x で解禁済み**（汎用多系列 Grouped はまだ HOLD）。

R2 着手は Acceptance + 明示判断後。

---

## 判断系

変更禁止:

```text
assets/graph-decision-engine.js
assets/graph-spec-builder.js
assets/graph-spec-validator.js
```

Issue 発見時は Rule をその場で変えず記録する。
