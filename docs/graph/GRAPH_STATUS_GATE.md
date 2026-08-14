# SUGUDASU Graph — 現状アーキテクト判定

**Date:** 2026-08-14（目標3型 LOCKED · 着地 Parking · Acceptance=SVGのみ · **registry 公開準備**）  
**Judgment stack:** **CLOSED / 全 GO**（再設計禁止）  
**Renderer:** **R1 GO**（Bar / Column / Line）· **R1.x GO**（目標3型）· **R2/R3 HOLD**  
**次工程:** **§1.5 MECE 配線済み**（`tools/graph.html` · hub · registry）· 本番 push は `DEPLOY_LOG` 承認後

> Presentation Output Constitution 固定。Renderer は考えない。`matched_rule_id` 分岐禁止。  
> R1 成功条件 = **描画できた** ではなく **Excel コピーから約3分で実務資料に貼れる**。  
> **確定:** SVG は貼付後に編集できない（一次解として当てにしない）。  
> **方針:** 編集できない前提で作る方が、Office 各版・OpenOffice/LibreOffice まで含めて **より汎用**。MS 固有の編集挙動に最適化しない。  
> **色:** **特定箇所の色は必須**（HEX＋ピッカー）。デフォルト配色 SoT [`GRAPH_DEFAULT_PALETTE.md`](./GRAPH_DEFAULT_PALETTE.md)（Excel風青赤緑は採らない）。  
> **目標 / GAP:** 目標線 / Bullet / 並棒の3型 LOCKED（[`GRAPH_TARGET_REPRESENTATION.md`](./GRAPH_TARGET_REPRESENTATION.md)）。達成緑/赤は発明しない。  
> **着地見込み:** Intent にしない · Parking（[`GRAPH_LANDING_FORECAST_PARKING.md`](./GRAPH_LANDING_FORECAST_PARKING.md)）。  
> **セッション記録:** [`GRAPH_SESSION_LOG_2026-08-14_TARGET_LANDING.md`](./GRAPH_SESSION_LOG_2026-08-14_TARGET_LANDING.md)  
> **公開面仕様:** [`../notes/GRAPH_TOOL_SPEC.md`](../notes/GRAPH_TOOL_SPEC.md)  
> **軸向き・出典:** Excel式の書式設定／テキストボックスは **つけない**。正本 [`GRAPH_AXIS_SOURCE_JUDGMENT.md`](./GRAPH_AXIS_SOURCE_JUDGMENT.md)

## 確定 / 未確定（実装可否）

**全体が「未確定ゼロ」ではない。** だが **R1 品質スライスは実装してよい。**

### 確定（実装してよい）

| 項目 | 状態 |
|------|------|
| 判断系パイプライン境界 | CLOSED / GO |
| R1 種別 Bar/Column/Line | GO |
| R1.x 目標3型（線 / Bullet / 並棒 · CND-004） | **LOCKED / GO** |
| R2/R3（Pie/Donut/Waterfall 等） | **HOLD · 実装しない** |
| 貼付後 SVG 編集不可前提 | 確定 |
| Acceptance 成果物 | **SVGのみ**（PNG併記しない） |
| Editor / テーマ一式 / 軸書式UI / 出典テキストボックス | REJECT |
| 色ロール（series/accent + HEX/ピッカー） | MUST · GO |
| デフォルトパレットトークン | SoT 固定 |
| 長ラベル切れ → 左余白・自動向き | GO |
| 配置スロット（半面/全面） | GO（Roundtrip S1） |
| 出典はデッキ側 | 確定 |

### 未確定・HOLD（実装を止める／後回し）

| 項目 | 扱い |
|------|------|
| Gap C の寸法数値・ChatGPT未返却分 | スロット GO で先行可。カスタムpxは REJECT 済み |
| 達成率カラー（緑達成・赤未達の自動割当） | **REJECT** |
| 前年比を目標図に混載 | **REJECT（OA-18拡張禁止）** |
| 通年×累計 YTD | **HOLD · 別ジャッジ** |
| 着地見込み（リング·受注残·確度·着地ブリッジ） | **PARKING** · Intent にしない |
| 値ラベル必須か | **既定OFF** · `show_value_labels: true` でON（必須にしない） |
| 半面プレビュー S2 | **GO** · `wrapDeckHalfLeftPreview`（コピー本体とは別） |
| 単位ラベル（Spec unit ≠ UNKNOWN） | **GO** · 図右上に `（単位）`（`show_unit_label`） |
| 出典1行フィールド | HOLD |
| U-01〜U-12（Rules open_issues） | 推測で埋めない |
| Pie/Donut | R3 HOLD |
| ツールページ / registry 公開 | **配線済み** · `tools/graph.html` · hub · A15 語彙 · 本番は DEPLOY_LOG 後 |
| Color Must UI（主色·強調·カテゴリ） | **GO** · ツールページ + [`lab/graph-color-lab.html`](./lab/graph-color-lab.html)（ラボは noindex） |

### 推奨キュー（この順 · 2026-08-14 更新）

1. ~~Palette / 長ラベル / accent / deck / 目標3型~~ ✅  
2. ~~手動 Acceptance OA-16/17/18 · OA-05~~ ✅（SVG確認 PASS）  
3. ~~単位ラベル（S0 · OA-05ギャップ）~~ ✅  
4. ~~（任意）値ラベル on/off · 半面プレビュー~~ ✅（`show_value_labels` · `wrapDeckHalfLeftPreview`）  
5. ~~UI HEX/ピッカー · ツール HTML（公開前）~~ ✅（ラボ + `tools/graph.html`）  
6. 着地 / YTD — Parking  
7. ~~registry / hub 公開（§1.5 MECE）~~ ✅ 配線 · **本番 push は別承認**

**今やらない:** Pie/Donut、汎用 Grouped/Stacked（目標以外）、達成色発明、着地Intent、YTD勝手変換、軸書式UI、判断系作り直し。


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
   + R1.x target 3型         ✓ GO（線 / Bullet / 並棒）
   ↓
SVG（PNG は Acceptance で出さない）
   ↓
Output Acceptance（手動貼付）  ← **次 = OA-16/17/18 · OA-05**
```

---

## 層判定

| 層 | 状態 |
|----|------|
| 判断系（Observable〜Validator） | **CLOSED / GO** |
| Presentation Output Constitution | **固定** |
| Renderer R1 | **GO** |
| Renderer R1.x（目標） | **GO** |
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

1. **グラフ Editor を作らない**（全要素色塗り・字号スライダー・軸 DnD・**テーマ一式**エディタ）。**ロール色の HEX/ピッカーは必須**
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
