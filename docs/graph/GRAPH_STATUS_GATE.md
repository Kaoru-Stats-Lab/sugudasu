# SUGUDASU Graph — 現状アーキテクト判定

**Date:** 2026-08-08  
**Judgment stack:** **CLOSED / 全 GO**（再設計禁止）  
**Renderer:** **R1 GO**（Bar / Column / Line）· **R2/R3 HOLD**  
**次工程:** **R1 Output Acceptance**（貼付検証）· **編集 UI 禁止** · グラフ種別追加禁止

> Presentation Output Constitution 固定。Renderer は考えない。`matched_rule_id` 分岐禁止。  
> R1 成功条件 = **描画できた** ではなく **Excel コピーから約3分で実務資料に貼れる**。

シニア3役レビュー: [`GRAPH_R1_SENIOR_REVIEW.md`](./GRAPH_R1_SENIOR_REVIEW.md)

---

## パイプライン

```text
Observable Extraction       ✓ GO
   ↓
Decision Engine              ✓ GO
   ↓
Graph Spec Builder           ✓ GO
   ↓
Graph Spec Contract          ✓ GO
   ↓
Spec Validator               ✓ GO
   ↓
Presentation Settings        （R1 最小 · Decision 外）
   ↓
Renderer R1                  ✓ GO（Bar/Column/Line）
   ↓
SVG / PNG
   ↓
Output Acceptance（手動貼付）  ← 次工程
```

---

## 層判定

| 層 | 状態 |
|----|------|
| 判断系（Observable〜Validator） | **CLOSED / GO** |
| Presentation Output Constitution | **固定** |
| Renderer R1 | **GO** |
| Renderer R2/R3 | **HOLD** |
| Graph Editor / 編集 UI | **禁止** |
| R1 Output Acceptance | **Active** |
| LLM | **不要・固定** |

---

## 凍結（判断系）

1. Decision / Spec Builder / Validator を再設計しない
2. 別推論層・AI/LLM を入れない
3. U-01〜U-12 を推測で埋めない
4. Renderer 実装中に Rule 問題を見つけてもその場で Engine を変えず Issue 化する

---

## R1 フェーズ方針（3役固定）

1. **編集 UI を作らない**（色・線幅・凡例・軸・DnD・テーマエディタ）
2. 品質基準は「編集しなくても、そのまま資料に貼れる」
3. R2（Waterfall / Scatter / Donut 等）は Acceptance 前に増やさない
4. 「貼ったあとに直したくなる箇所」はまず **Renderer デフォルト不足** として扱う
5. SVG 編集可能性はユーザー向け KPI にしない（二次価値）

---

## Renderer 責務

```text
Graph Spec → type dispatcher → SVG / PNG
```

禁止: Rule 再評価 · Intent 推測 · データ再解釈 · Spec 補正 · 色の意味推測 · LLM · **`matched_rule_id` 分岐**

Invalid Spec → Validator REJECT → 描画しない。

---

## 正本

| 文書 | 役割 |
|------|------|
| [`GRAPH_R1_SENIOR_REVIEW.md`](./GRAPH_R1_SENIOR_REVIEW.md) | UIUX/CTO/CPO 判定 |
| [`GRAPH_R1_OUTPUT_ACCEPTANCE.md`](./GRAPH_R1_OUTPUT_ACCEPTANCE.md) | 貼付 Acceptance 手順 |
| [`PRESENTATION_OUTPUT_CONSTITUTION.md`](./PRESENTATION_OUTPUT_CONSTITUTION.md) | 出力憲法 |
| [`GRAPH_RENDERER_API.md`](./GRAPH_RENDERER_API.md) | API |
| [`GRAPH_RENDERER_R1_PLAN.md`](./GRAPH_RENDERER_R1_PLAN.md) | R1 計画 |
| [`GRAPH_SPEC_CONTRACT.md`](./GRAPH_SPEC_CONTRACT.md) | Spec |
| [`GRAPH_SPEC_VALIDATOR_GATE.md`](./GRAPH_SPEC_VALIDATOR_GATE.md) | Validator |
| [`GRAPH_RULES.json`](./GRAPH_RULES.json) | Rules |
