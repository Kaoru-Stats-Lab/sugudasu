# SUGUDASU Graph — Renderer Phase R1 Plan

**Status:** Active  
**Scope:** Bar · Column · Line のみ  
**Out of scope:** R2/R3 types · PPTX · EMF · 編集 UI

---

## 目的

Renderer 基盤を代表 3 type で検証する。

- axis · grid · scale · baseline
- category / value labels（Text Layer 最小）
- color · stroke
- SVG structure（viewBox · deterministic order）
- PNG export

---

## 実装順

1. `renderGraph` 入口 + Validator ゲート
2. type dispatcher（R1 以外 REJECT）
3. shared: scale · padding · axes · grid
4. Column renderer
5. Bar renderer
6. Line renderer
7. SVG 文字列の決定論的シリアライズ
8. PNG（sharp · SVG → raster）
9. Contract tests

---

## R2 / R3（まだ実装しない）

**R2:** Grouped_Bar · Stacked_Column · 100pct_Stacked_Column · Waterfall  
**R3:** Combination_Column_Line · Bullet · Scatter · Donut · Pie · Small_Multiples

R2 着手は R1 テスト緑 + 明示判断後。

---

## 判断系

変更禁止:

```text
assets/graph-decision-engine.js
assets/graph-spec-builder.js
assets/graph-spec-validator.js
```

Issue 発見時は Rule をその場で変えず記録する。
