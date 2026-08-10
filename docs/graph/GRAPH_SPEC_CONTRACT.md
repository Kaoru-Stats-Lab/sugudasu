# SUGUDASU Graph — Graph Spec Contract

**Status:** Contract Fixed · **buildGraphSpec GO** · Spec Validator optional · Renderer HOLD  
**Date:** 2026-08-08  
**Upstream:** Decision Engine（`assets/graph-decision-engine.js`）+ confirmation choice（CONDITIONAL 時）  
**Downstream:** Spec Validator（未）→ Renderer（HOLD）

> Decision Engine → **Graph Spec** → Renderer  
> Renderer に Rule / Intent / Observable 判定ロジックを持ち込まない。

---

## 0. 目的

Graph Spec は、Decision の結果を **描画可能な宣言データ** に変換した中間契約である。

| 層 | 責務 | 持ってよいもの | 持ってはいけないもの |
|----|------|----------------|----------------------|
| Decision | なぜこのグラフか | Rule ID · State · reason | SVG · 色 · ピクセル |
| Graph Spec | 何を描くか | series · encoding · axis · transform 結果参照 | Rule 再判定 · Intent 推測 |
| Renderer | どう描くか | SVG/Canvas · スタイル | `GRAPH_RULES` 照合 · MISMATCH 再解釈 |

---

## 1. いつ Graph Spec を生成するか

| Decision `state` | Spec 生成 |
|------------------|-----------|
| MATCH | する |
| CONVERTIBLE | する（derived display を含む） |
| CONDITIONAL | **ユーザーが 1 問に答えた後**のみする（回答前は Spec なし · pending） |
| MISMATCH | **しない**（explanation payload のみ） |
| NO_MATCH | **しない**（uncovered payload のみ） |
| unknown_intent | **しない** |

Renderer は MISMATCH / NO_MATCH を「空グラフ」に落とさない。UI が説明を出す。

---

## 2. Graph Spec スキーマ（v1 契約）

```json
{
  "schema_version": "1.0.0",
  "spec_kind": "graph_spec",
  "source": {
    "matched_rule_id": "RLE-001",
    "decision_state": "MATCH",
    "intent": "TREND",
    "reason_code": "matched:RLE-001",
    "deterministic_kind": "structure_unique | priority_fixed | null",
    "confirmation_id": null,
    "confirmation_choice_id": null
  },
  "chart": {
    "type": "Line",
    "observed_alternative_types": []
  },
  "data": {
    "series": [
      {
        "id": "sales",
        "label": "売上",
        "unit": "UNKNOWN",
        "role": "measure",
        "values": [
          { "category": "2022", "raw": 100, "display": 100 }
        ]
      }
    ],
    "categories": ["2022", "2023"],
    "category_role": "temporal | nominal",
    "preserve_raw": true
  },
  "encoding": {
    "x": { "field": "category", "type": "temporal | nominal" },
    "y": { "field": "display", "type": "quantitative", "zero_baseline": true },
    "color": null,
    "series_field": null
  },
  "transform": {
    "id": null,
    "applied": false
  },
  "constraints": {
    "allow_3d": false,
    "zero_baseline": true,
    "synchronize_zero_line": false,
    "reject_unsynchronized_dual_axis": true,
    "do_not_rely_on_color_alone": true
  },
  "style_ref": {
    "theme": "sugudasu-default",
    "note": "Style is outside Decision. Renderer/theme owns colors/fonts."
  }
}
```

### 2.1 フィールド規範

| フィールド | 必須 | 説明 |
|------------|------|------|
| `source.matched_rule_id` | MATCH/CONVERTIBLE/CONDITIONAL(answered) | 監査用。Renderer は分岐に使わない |
| `chart.type` | 必須 | `GRAPH_RULES.graph_types` の id（recommended） |
| `data.series[].raw` | 必須 | 元値。CONVERTIBLE でも残す |
| `data.series[].display` | 必須 | 描画に使う値（% 変換後など） |
| `encoding` | 必須 | 軸・系列の宣言。Vega-Lite そのものではない |
| `constraints` | 必須 | Decision/Rules から引き継いだ描画制約 |
| `style_ref` | 任意 | 見た目。Decision 正本ではない |

### 2.2 chart.type の決め方（generator 向け · 契約）

1. Decision `recommended_graph` を初期値とする
2. CONDITIONAL でユーザーが option を選んだら、その option の `recommended_graph` に置換
3. `observed_graphs` は `chart.observed_alternative_types` にコピーするだけ（自動昇格禁止）
4. Generator は Rule を再実行しない

---

## 3. chart.type → encoding テンプレ（v1）

Generator が Rule ではなく **type マップ** だけで encoding を埋める。

| chart.type | x | y | color / 追加 |
|------------|---|-----|--------------|
| Line | category (temporal) | display | — |
| Column | category | display | — |
| Bar | display | category (nominal) | — |
| Grouped_Bar | display | category | series |
| Grouped_Column | category | display | series |
| Stacked_Column | category (temporal) | display | series (nominal) |
| 100pct_Stacked_Column | category | display (% ) | series |
| Waterfall | category | display | sign |
| Small_Multiples | category | display | facet by series |
| Combination_Column_Line | category | display | series + mark per series |
| Bullet | category | display | target marker |
| Scatter | measure0 | measure1 | — |
| Donut / Pie | — | — | category + display（observed 選択時のみ） |

未定義 type → Spec validation FAIL（Renderer に投げない）。

---

## 4. constraints の引き継ぎ（必須）

Decision / `GRAPH_RULES.validation` / CND safety からコピーする。Renderer はこれを守るだけ。

| constraint | 由来 |
|------------|------|
| `allow_3d: false` | rules.validation.chart |
| `zero_baseline` | rules / CND safety |
| `synchronize_zero_line` | CND-001 safety |
| `reject_unsynchronized_dual_axis` | CND-001 / validation.axis |
| `do_not_rely_on_color_alone` | validation.accessibility |

**禁止:** Renderer が dual axis を「見栄え」で勝手に有効化すること。

---

## 5. Non-Spec ペイロード（描画しない終端）

### 5.1 MISMATCH

```json
{
  "spec_kind": "mismatch_explanation",
  "state": "MISMATCH",
  "reason_code": "stacking_reject_mixed_units",
  "message": "…",
  "graph_spec": null
}
```

### 5.2 NO_MATCH

```json
{
  "spec_kind": "uncovered",
  "state": "NO_MATCH",
  "reason_code": "no_matching_rule",
  "message": "…",
  "graph_spec": null
}
```

### 5.3 CONDITIONAL pending

```json
{
  "spec_kind": "confirmation_required",
  "state": "CONDITIONAL",
  "confirmation_id": "CND-001",
  "options": [],
  "default": "small_multiples",
  "graph_spec": null
}
```

---

## 6. Generator / Validator / Renderer 境界

```text
① Decision.decide(...)
② if CONDITIONAL → UI 1問 → choice_id
③ buildGraphSpec(decision, table, choice_id?)   ← 次の実装
④ validateGraphSpec(spec)                      ← その次
⑤ render(spec)                                 ← HOLD
```

| モジュール | 読んでよい | 読んでいけない |
|------------|------------|----------------|
| buildGraphSpec | decision · extracted table · choice | 独自に Intent 再推定 |
| validateGraphSpec | spec · constraints | GRAPH_RULES.rules の再マッチ |
| render | spec（valid） | Observable 再解析 · Rule ID 分岐で type 変更 |

`matched_rule_id` はログ・説明文用。Renderer の `if (rule === 'RLE-007')` は禁止。

---

## 7. Definition of Done — Contract（本ドキュメント）

- [x] Decision → Spec → Renderer の3段を文書化した
- [x] MATCH/CONVERTIBLE/CONDITIONAL/MISMATCH/NO_MATCH ごとの Spec 有無を定義した
- [x] raw 保全と constraints 引き継ぎを必須にした
- [x] Renderer に Rule ロジックを持ち込まないことを禁止事項にした
- [x] `buildGraphSpec` 実装（`assets/graph-spec-builder.js`）
- [x] Spec unit tests（`npm run test:graph-spec`）
- [x] Spec Validator（`assets/graph-spec-validator.js` · `npm run test:graph-spec-validator`）— **自動修正なし**
- [ ] Renderer（HOLD）

---

## 8. 関連

- Decision 出力: `GRAPH_RULES.json` `output_contract`
- 抽出: `OBSERVABLE_EXTRACTION_SPEC.md`
- 現状判定: `GRAPH_STATUS_GATE.md`
