# SUGUDASU Graph（仮称）— Design Pack

**Status:** 判断系 CLOSED · Renderer R1 GO · **次工程 = Output Acceptance**（R2 HOLD · 編集 UI 禁止）  
**Purpose:** Cursor / Product / UX / Engineering 共通参照  
**Principle:** AIではなく、決定論的なプログラムとして実装する  
**更新:** 2026-08-08

> グラフ作成の難しさは、描画ではなく選択にある。  
> R1 成功 = **描画できた** ではなく **約3分で実務資料に貼れる**。

短縮 Thesis:

> 表を貼る。目的を選ぶ。グラフが決まる。

---

## このフォルダの役割

SUGUDASU Graph は未公開の設計パックである。  
既存の `docs/products/{id}/` は **GO 済みプロダクト**用。本パックは実装前の憲法・研究・Decision Engine 正本を `docs/graph/` に置く。

公開・registry 登録・`tools/*.html` は別フェーズ。先に Decision Rule の機械可読化と Regression Test を行う。

---

## 文書マップ（MECE）

| 文書 | 責務（他と重複させない） | 由来 |
|------|--------------------------|------|
| [PRODUCT_THESIS.md](./PRODUCT_THESIS.md) | **Why** · Pain · Positioning · やらないこと · Success Metric · One-line Thesis | Graph1 Thesis 層 + Graph2 教育的価値 |
| [DECISION_CONSTITUTION.md](./DECISION_CONSTITUTION.md) | **How to decide** · Intent-first · 判定境界3領域 · Decision States · Pipeline · Transformation · Graph Constitution · Engineering MUST/MUST NOT · 未解決問題 | Graph1 Constitution 層 + Graph2 境界・状態の補強 |
| [IR_CORPUS_SPEC.md](./IR_CORPUS_SPEC.md) | **研究コーパス設計** · IR の使い方（正解集ではない）· Corpus A/B 二分 · 検証順序 · 限界 | Graph2 本体 |
| [RESEARCH_PRIOR_ART.md](./RESEARCH_PRIOR_ART.md) | **Prior Art / OSS 位置づけ** · AVA · Draco · CompassQL 等 · Deep Research の LLM+GVAE 結論は採用しない | Graph1 Research 層 + Graph2 OSS 方針 |
| [GRAPH_DETERMINISTIC_ENGINE.md](./GRAPH_DETERMINISTIC_ENGINE.md) | **研究裏付け付き Engine 叙述** · 100 case · taxonomy · 旧 RLE 叙述 · P1–P10 | Research-Backed Specification |
| [GRAPH_RULES.json](./GRAPH_RULES.json) | **機械可読ルール正本** · Observable→Intent→Rule→Graph Spec · Observed≠Recommended · LLM スロットなし | Executable SoT |
| [OBSERVABLE_EXTRACTION_SPEC.md](./OBSERVABLE_EXTRACTION_SPEC.md) | **U-06 検出仕様** · Temporal/Unit/Flags · 意味推測禁止 | Extraction Spec |
| [GRAPH_SPEC_VALIDATOR_GATE.md](./GRAPH_SPEC_VALIDATOR_GATE.md) | Spec Validator GO · 自動修正禁止 · Renderer HOLD | Validator Gate |
| [PRESENTATION_OUTPUT_CONSTITUTION.md](./PRESENTATION_OUTPUT_CONSTITUTION.md) | **出力憲法** · 編集させない · SVG/PNG · matched_rule_id禁止 | Output Constitution |
| [GRAPH_RENDERER_API.md](./GRAPH_RENDERER_API.md) | Renderer 最小 API · R1 | Renderer API |
| [GRAPH_RENDERER_R1_PLAN.md](./GRAPH_RENDERER_R1_PLAN.md) | Bar/Column/Line 計画 | R1 Plan |
| [GRAPH_R1_SENIOR_REVIEW.md](./GRAPH_R1_SENIOR_REVIEW.md) | UIUX/CTO/CPO · GO継続 · R2 HOLD · 編集禁止 | Senior Review |
| [GRAPH_R1_OUTPUT_ACCEPTANCE.md](./GRAPH_R1_OUTPUT_ACCEPTANCE.md) | 貼付 Acceptance · 評価軸 · OA-01〜15 | Next step |
| [GRAPH_R1_ROUNDTRIP_JUDGMENT.md](./GRAPH_R1_ROUNDTRIP_JUDGMENT.md) | 貼付後手戻り解法（戻って再コピペ vs 他） | Architect+UX |
| [GRAPH_R1_PROJECTION_COLOR_JUDGMENT.md](./GRAPH_R1_PROJECTION_COLOR_JUDGMENT.md) | 投影・遠距離のデフォルト色／コントラスト | Senior UI/UX |
| [../prompts/graph-r1-acceptance-gap-judgment-COPYPASTE.md](../prompts/graph-r1-acceptance-gap-judgment-COPYPASTE.md) | Acceptance ギャップの GO/HOLD 裁定（ChatGPT） | Judgment prompt |
| [GRAPH_STATUS_GATE.md](./GRAPH_STATUS_GATE.md) | 判断系 CLOSED · R1 GO · Acceptance Active · Editor 禁止 | Status Gate |
| [GRAPH_SPEC_CONTRACT.md](./GRAPH_SPEC_CONTRACT.md) | **Graph Spec 契約** · Decision→Spec→Renderer · Rule を Renderer に持ち込まない | Spec Contract |
| [GRAPH_RULES_IMPLEMENTATION_GATE.md](./GRAPH_RULES_IMPLEMENTATION_GATE.md) | Decision Engine Gate · DoD | Implementation Gate |

### 実装コード（Decision + Extraction · Renderer HOLD）

| パス | 役割 |
|------|------|
| `assets/graph-decision-engine.js` | Decision Engine（JSON のみ参照） |
| `assets/graph-observable-extractor.js` | TSV → Observable（仕様準拠） |
| `scripts/graph-decision-engine.test.mjs` | `npm run test:graph-decision` |
| `scripts/graph-observable-extractor.test.mjs` | `npm run test:graph-observable` |
| `assets/graph-spec-builder.js` | Decision → Graph Spec（中間契約） |
| `assets/graph-spec-validator.js` | Spec Validator（REJECT only · 自動修正なし） |
| `assets/graph-renderer.js` | Renderer R1（Bar/Column/Line · SVG/PNG）· 考えない |
| `scripts/graph-renderer.test.mjs` | `npm run test:graph-renderer` |
| `scripts/graph-r1-acceptance-export.mjs` | `npm run graph:r1-acceptance-export` → SVG/PNG for paste |
| `docs/graph/fixtures/` | observable + regression + **acceptance** |

### 意図的分離（Editor を作らない）

| ファイル / 領域 | 役割 |
|-----------------|------|
| `GRAPH_RULES.json` | 「何を描くか」だけ決める（Graph Spec） |
| Renderer R1 | Spec → SVG/PNG · 考えない · 編集 UI なし |
| Graph Editor / テーマエディタ | **作らない**（デフォルト品質を上げる） |
| UI · SEO · registry | 別フェーズ |

---

## 読み順（固定）

1. **PRODUCT_THESIS** — 何を解くか / 何を解かないか
2. **DECISION_CONSTITUTION** — 決め方の憲法（特に判定境界3領域）
3. **IR_CORPUS_SPEC** — 実務コーパスで憲法を検証する設計
4. **RESEARCH_PRIOR_ART** — 奇抜発明ではなく既存研究の絞り込みであることの根拠
5. **GRAPH_DETERMINISTIC_ENGINE** — 100 case 研究叙述
6. **GRAPH_RULES_ARCHITECT_REVIEW** — 投入前の矛盾整理
7. **GRAPH_RULES.json** — 実装が読むルール

実装に入る前ゲート:

```text
TSV
 → Observable Structure
 → Intent
 → Rule ID
 → Decision State
 → Graph Type
```

までを決定論的に検証する。**Graph 描画 UI を先に作らない。**

---

## Source of Truth Hierarchy（Engine 判断）

1. Ground Truth / Research Corpus（検証可能な事例）
2. Decision Rules（**`GRAPH_RULES.json`**）
3. Product / Decision Constitution · Architect Review
4. Implementation（Renderer は Decision の後）
5. UI / Visual Design

実装がルールと矛盾する場合、実装を修正する。  
UI 都合で Decision Rule を変更しない。

---

## 核心原則（1枚）

```text
User Intent
  +
Observable Structure
  +
Explicit Rules
  ↓
Deterministic Decision
  ↓
Graph
```

- 決められないものは、決められないと扱う
- 同じ表・同じ目的なら、毎回同じグラフになる
- **NO_MATCH ≠ MISMATCH**（ルール未定義を不整合と誤認しない）
- IR 資料は「AI学習データ」でも「直接パース対象」でもない（コーパス）
- Observed Practice ≠ Recommended Graph を分離する

---

## 上位憲法との関係

| 上位 | 役割 |
|------|------|
| [`docs/brand/BRAND_CONSTITUTION.md`](../brand/BRAND_CONSTITUTION.md) | ブランド思想 |
| [`docs/product/PRODUCT_CONSTITUTION.md`](../product/PRODUCT_CONSTITUTION.md) | プロダクト採用判定（F1〜F7 等） |
| [`docs/legal/`](../legal/) | Commentary · Case Law · Interpretation Guide |

本パックは Graph 固有の HOW / 研究根拠である。憲法判断（Judicial Decision）は ADR や本フォルダに書かず `docs/legal/CASE_LAW.md` へ。

---

## ステータス要約

| 項目 | 状態 |
|------|------|
| Product Thesis | Draft · Design Foundation |
| Decision Constitution | Draft · 境界3領域を固定方針 |
| IR Corpus Spec | Design Reference |
| Prior Art | Design Reference（採用≠参照） |
| Deterministic Engine | Research Complete · Implementation Not Frozen |
| `GRAPH_RULES.yaml` | 未作成 |
| UI / Rendering | 未着手（意図的） |
