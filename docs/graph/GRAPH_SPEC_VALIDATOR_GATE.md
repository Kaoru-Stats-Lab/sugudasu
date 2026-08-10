# SUGUDASU Graph — Spec Validator Gate

**Date:** 2026-08-08  
**Status:** Spec Validator **GO** · Renderer **HOLD**

> **Spec Validator GO → Contract Test GO → Renderer HOLD解除はまだしない（次ゲート）。**  
> Validator は自動修正しない。Invalid Spec → REJECT + reason_code。

---

## パイプライン

```text
TSV
 ↓
Observable Extraction       ✓
 ↓
Decision Engine              ✓
 ↓
Graph Spec Builder           ✓
 ↓
Graph Spec Contract          ✓
 ↓
Spec Validator               ✓  ← 今ここ
 ↓
[ここまで決定論的 · 不正SpecはREJECT]
 ↓
Renderer                     HOLD
```

## 責務

| 層 | 壊れたときの見え方 |
|----|-------------------|
| Decision | Rule / State が違う |
| Spec Builder | type/encoding/data が契約と違う |
| Spec Validator | 不正 Spec を Renderer に渡さない |
| Renderer | 描画だけが壊れる |

## 検証項目（実装済み）

| 検証 | Reject reason_code（例） |
|------|--------------------------|
| type | `undefined_graph_type` |
| axis | `axis_required_missing` |
| data | `series_missing` · `value_raw_display_missing` · `series_category_mismatch` |
| unit | `unit_mismatch_on_stack` |
| stacking | `stacking_percent_absolute_mixed` · `normalize_not_applied` |
| baseline | `zero_baseline_violation` |
| target | `target_missing_on_bullet` |
| transformation | `normalize_flag_false` · `normalize_data_missing` |
| conditional | `spec_forbidden_for_terminal_state`（未回答なのに Spec） |
| mismatch / no_match | `spec_forbidden_for_terminal_state` |
| determinism | `determinism_spec_changed` |

## 非破壊（必須 · テスト済み）

Validator は入力 Spec / payload を変更しない。

保証テスト: `scripts/graph-spec-validator.test.mjs`（validate 前後の `JSON.stringify` 同一性）。

---

## 禁止

- Validator が Spec を勝手に直す
- Renderer が不正 Spec を黙って描く
- Rule 再判定を Validator に入れる

## Renderer 解禁

前提: Validator 全テスト成功 + 非破壊保証（**現状満たす**）。  
解除は [`GRAPH_STATUS_GATE.md`](./GRAPH_STATUS_GATE.md) の明示判断まで **HOLD**。

## 実行

```bash
npm run test:graph-spec-validator
```

実装: `assets/graph-spec-validator.js`
