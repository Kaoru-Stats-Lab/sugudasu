# SUGUDASU Graph — Deterministic Graph Recommendation Engine

**Status:** Research-Backed Specification  
**Role:** グラフ推薦・生成エンジンに関する正本ドキュメント（人間向け憲法・研究根拠）  
**Principle:** Deterministic / Non-Send / Reproducible / Explainable  
**更新:** 2026-08-08  
**索引:** [README.md](./README.md)

**隣接:**

- Thesis: [PRODUCT_THESIS.md](./PRODUCT_THESIS.md)
- Decision 憲法: [DECISION_CONSTITUTION.md](./DECISION_CONSTITUTION.md)
- IR コーパス設計: [IR_CORPUS_SPEC.md](./IR_CORPUS_SPEC.md)
- Prior Art: [RESEARCH_PRIOR_ART.md](./RESEARCH_PRIOR_ART.md)

**機械可読正本:** [`GRAPH_RULES.json`](./GRAPH_RULES.json)（実行ルール）。本 Markdown は研究根拠・叙述。衝突時は Architect Review → Constitution → 本ファイルの順で判断し、**Rule ID の実行時正本は JSON**。  
**Architect:** [`GRAPH_RULES_ARCHITECT_REVIEW.md`](./GRAPH_RULES_ARCHITECT_REVIEW.md)

---

## 0. Purpose

SUGUDASU Graph は、ユーザーが Excel / Spreadsheet 等から貼り付けた表データをもとに、

«Observable Structure × User Intent → Graph Specification»

という決定論的な規則によって、実務上妥当なグラフ形式を推薦・生成するブラウザ完結型エンジンである。

本システムは、グラフ形式を LLM や生成 AI に「推測」させることを目的としない。

同一の入力データ、同一の Intent、同一のルールセットからは、原則として同一の Graph Specification が生成される。

目的:

- グラフ選択における属人的判断を減らす
- Excel 等で保持されている表構造をそのまま利用する
- 数値をサーバーへ送信しない
- グラフ選択理由を説明可能にする
- 同じ入力から同じ結果を再現する
- 実務慣行と視覚的推奨を明示的に区別する
- 一意に決定できない場合だけユーザーへ最小限の確認を行う

---

## 1. Ground Truth Corpus

### 1.1 Corpus Definition

日本の上場企業が公開する公式 IR 一次資料を対象として、実際に使用されているグラフ表現を収集・検証した。

対象資料:

- 決算説明資料
- 決算説明会資料
- 決算短信
- 有価証券報告書
- 統合報告書
- その他、企業公式 IR 資料

二次情報や推測によるグラフ分類は Ground Truth としない。

可能な限り、同一資料内のグラフ · 表 · 本文 · 財務諸表 · 注記 · XBRL 等の一次情報を突合した。

**注意:** 製品が IR を解析するのではない。コーパス用途の定義は [IR_CORPUS_SPEC.md](./IR_CORPUS_SPEC.md)。Observed ≠ Recommended。

### 1.2 Corpus Size

検証済みケース: **100 cases**

| Source Tier | Definition | Count |
|-------------|------------|-------|
| Tier A | 元数値とグラフ表現を完全照合可能 | 84 |
| Tier B | グラフ表現は明確だが、一部注記数値の完全照合が困難 | 16 |
| VERIFICATION_FAILED | 検証不能または不一致 | Corpus から除外 |

Corpus は検証可能性を優先する。

---

## 2. Intent Taxonomy

Corpus から以下の 12 Intent を識別した。

### 2.1 Core Intent

1. TREND
2. COMPARISON
3. PROPORTION
4. RANKING
5. RELATIONSHIP
6. BREAKDOWN
7. DISTRIBUTION

### 2.2 IR Practice Intent

8. TARGET_VS_ACTUAL
9. BRIDGE
10. MULTI_METRIC
11. STRUCTURE
12. MIX_SHIFT

Intent は「データが何であるか」ではなく、

«ユーザーが何を伝えたいか»

を表す。

したがって Intent は Observable Structure だけから完全には推測しない。

UI 初期露出は Thesis の 6 語彙仮説。本 taxonomy は研究・Rule 用。全 Intent を UI に並べる前提ではない。

---

## 3. Graph Type Taxonomy

Corpus では実務上のグラフ表現を正規化し、**24種類**の Graph Type として扱う。

代表例:

- Line
- Column
- Bar
- Grouped_Column
- Grouped_Bar
- Stacked_Column
- 100pct_Stacked_Column
- Combination_Column_Line
- Dual_Axis
- Small_Multiples
- Pie
- Donut
- Waterfall
- Scatter
- Bubble
- Bullet
- Treemap
- Multi_Line

Graph Type は「見た目の名称」ではなく、内部的には Graph Specification の出力形式として扱う。

最初からユーザーに 24 種を選ばせない（Decision Constitution §8）。

---

## 4. Deterministic Capability Bound

### 4.1 訂正（重大）

旧稿は次のように書いていた。

| Category | Corpus Ratio | Meaning（旧・誤りを含む） |
|----------|--------------|---------------------------|
| MATCH | 58% | 一意決定 |
| CONDITIONAL | 27% | 条件付き決定 |
| User Confirmation / Convertible | 15% | 意味判断 **または** 変換・確認 |

これは **Decision State 軸** と **Automation 軸** を混同している。

«CONVERTIBLE ≠ 人間確認»

CONVERTIBLE は明示的数学変換のうえでの決定論的処理である（例: MIX_SHIFT → `normalize_to_percentage` → 100pct_Stacked_Column）。CONDITIONAL だけが確認 UI 側である。

したがって旧「58 / 27 / 15」を MATCH / CONDITIONAL / CONVERTIBLE の比率として読んではならない。  
**100 case の再集計は未解決（U-01）。** 実装 KPI・JSON 確定値にしない。

### 4.2 使うべき 2 軸

| 軸 | 値 |
|----|-----|
| Decision State | MATCH · CONVERTIBLE · CONDITIONAL · MISMATCH · **NO_MATCH** |
| Automation（研究用・再集計待ち） | auto_deterministic（MATCH + 確認不要 CONVERTIBLE）· needs_confirmation（CONDITIONAL 等） |

旧仮説「85% 以上は一意決定または 1 回確認」は **仮説のまま**。全問題への一般化禁止。

境界 A/B/C（Decide / Confirm / Do Not Decide）と対応させて読むこと。構造検査で意味まで全部決まる、とは読まない。

---

## 5. Pattern Dataset

Corpus から以下の主要パターンを抽出した。

| Pattern | Structure | Intent | Observed Graph | Count | Deterministic |
|---------|-----------|--------|----------------|-------|---------------|
| PAT-001 | Temporal >=4 × Quant | TREND | Line | 32 | Yes |
| PAT-002 | Temporal 2–5 × Quant | TREND | Column | 18 | Yes |
| PAT-003 | Nominal 3–10 × Quant | RANKING / COMPARISON | Bar | 14 | Yes |
| PAT-004 | Net_Change + Start_End | BRIDGE | Waterfall | 5 | Yes |
| PAT-005 | Temporal × Nominal × Quant | MIX_SHIFT / PROPORTION | 100pct_Stacked_Column | 4 | Yes |
| PAT-006 | Temporal × Nominal × Quant | BREAKDOWN | Stacked_Column | 6 | Yes |
| PAT-007 | Temporal × Quant × Quant | TREND / MULTI_METRIC | Combination / Dual Axis | 9 | Conditional |
| PAT-008 | Nominal 2–4 × Quant + Total | PROPORTION | Donut / Pie | 4 | Conditional |
| PAT-009 | Temporal × Quant + Target | TARGET_VS_ACTUAL | Combination / Bullet | 5 | Conditional |
| PAT-010 | Nominal × Quant × Quant | COMPARISON | Grouped Bar / Column | 3 | Yes |

---

## 6. Observable Structure

Observable Structure はプログラムがデータから直接取得可能な特徴である。

主要な特徴:

- Dimension
- Cardinality
- Measure Count
- Measure Type
- Unit
- Sign
- Start / End
- Target presence
- Temporal structure
- Label length
- Scale difference
- Common unit
- Total presence
- Category count

### 6.1 Observable / Semantic Boundary

| Feature | Observable | Semantic | Deterministic Detection |
|---------|------------|----------|-------------------------|
| Temporal Axis | Yes | No | Yes |
| Measure Scale Difference | Yes | No | Yes |
| Net Change / Bridge structure | Yes | No | Yes |
| Label Text Length | Yes | No | Yes |
| User Intent | No | Yes | No |
| Target Metric recognition | Partially | Yes | Conditional |
| Dual Axis Scaling Intent | No | Yes | No |
| Semantic Category Order | No | Yes | No |

重要原則:

«Observable Structure と Semantic Intent を混同しない。»

プログラムが観測できない「何を伝えたいか」を勝手に推測してはならない。

ordinal/categorical の意味順序、2軸の「意味があるか」は Semantic。Decide 領域に押し込めない。

---

## 7. Decision Rules

### RLE-001 — Temporal Trend

**IF**

- Dimension = Temporal
- Cardinality >= 4
- Measure_Count = 1
- Intent = TREND

**THEN** `"Line"`

期間数が少ない場合は Column へフォールバック可能。

**Evidence:** CASE-004, 023, 031, 042, 045, 062, 083, 090

---

### RLE-002 — Nominal Ranking / Comparison

**IF**

- Dimension = Nominal
- Cardinality = 3–10
- Measure_Count = 1
- Max_Label_Length > 5 OR Sort_Order = Descending

**THEN** `"Bar"`

長いラベルまたはランキング用途では横棒を優先する。

例外:

- 地域コード等の業務上定義された順序
- 財務諸表等の伝統的並び順

**Evidence:** CASE-005, 012, 017, 030, 053, 057, 088, 094

---

### RLE-003 — Bridge

**IF**

- Measure_Type = Net_Change
- Positive / Negative mixed
- Start / End totals exist
- Intent = BRIDGE

**THEN** `"Waterfall"`

会計的増減要因分析に限定する。

**Evidence:** CASE-006, 019, 026, 041, 078

---

### RLE-004 — Composition Shift

**IF**

- Dimension = Temporal × Nominal
- Nominal_Cardinality <= 5
- Measure_Type = Absolute
- Intent = MIX_SHIFT / PROPORTION

**THEN** `"100pct_Stacked_Column"`

実数を構成比へ変換する場合は変換処理を明示する。

Nominal cardinality > 5 の場合は色・凡例の可読性を考慮して別形式へフォールバックする。

**Evidence:** CASE-002, 022, 043, 082

---

### RLE-005 — Breakdown

**IF**

- Dimension = Temporal × Nominal
- Nominal_Cardinality <= 5
- Measure_Type = Absolute
- Intent = BREAKDOWN

**THEN** `"Stacked_Column"`

全体量と内訳を同時に表現する。

Negative value が含まれる場合は通常の積層表現をそのまま適用しない。

**Evidence:** CASE-011, 038, 048, 058, 069, 080, 091

---

### RLE-006 — Proportion

**IF**

- Dimension = Nominal
- Cardinality = 2–4
- Has_Total = True
- Intent = PROPORTION

**Recommended:** `"Bar"`  
**Observed Practice:** `"Donut / Pie"`

実務では円・ドーナツが多用されるが、数値比較の精度では横棒を優先する。

**Evidence:** CASE-008, 020, 035, 071, 074

---

### RLE-007 — Multiple Metrics

**IF**

- Dimension = Temporal
- Measure_Count = 2
- Values_Have_Different_Units = True

**THEN** 原則として `"Small_Multiples"`

従来の実務では `"Combination_Column_Line / Dual_Axis"` が多用される。

Dual Axis を採用する場合:

- 両 Y 軸の 0 基線を同期
- スケールを明示
- 軸の意味を明示
- 誤認を誘発する自動スケールを禁止

**Evidence:** CASE-001, 003, 014, 016, 021, 033, 052, 055

---

### RLE-008 — Target vs Actual

**IF**

- Dimension = Temporal
- Measure_Count = 1
- Has_Target = True
- Intent = TARGET_VS_ACTUAL

**Recommended:** `"Bullet"` または `"Column + Target Line"`

Target は破線または明示的マーカーとして表現する。

**Evidence:** CASE-010, 028, 032, 046, 049, 060, 089

---

## 8. Conditional Rules

Observable Structure だけでは一意に決定できないケースでは、ユーザーへ 1〜2 個の確認を行う。

### CND-001 — Dual Axis vs Small Multiples

対象: Temporal × 2 Measures、異単位

問い:

«「2つのグラフの目盛りを左右に分けて1つに重ねますか？それとも上下に分けて表示しますか？」»

UI:

- [重ねて表示（2軸）]
- [上下に分離]

SUGUDASU のデフォルトは認知安全性を優先する。

---

### CND-002 — Donut vs Bar

対象: Nominal 2–4 × Absolute Measure

問い:

«「ドーナツ型で割合の雰囲気を強調しますか？それとも横棒で正確な大きさを比較しますか？」»

UI: プレビュー付き選択カード。

---

### CND-003 — Absolute Breakdown vs Composition

問い:

«「強調したいのは『全体の金額の増減』ですか？それとも『内訳の割合（%）の変化』ですか？」»

選択:

- [金額の合計推移]
- [構成比（%）推移]

---

### CND-004 — Target Representation

問い:

«「目標値を『達成ライン』としてグラフに重ねて表示しますか？」»

Target Line の ON/OFF。

---

### CND-005 — High Cardinality

対象: Nominal 15 項目以上

問い:

«「上位 N 項目に絞って表示しますか？（残りは『その他』にまとめます）」»

Top N または全件表示。

---

## 9. Practice vs Recommendation

本 Corpus では、企業の実務グラフと視覚的推奨が一致しないケースが存在した。

全体傾向:

- MATCHING: 73%
- DIFFERENT: 27%

### 9.1 Dual Axis

実務では頻繁に利用される。しかし左右 Y 軸の独立した自動スケーリングにより、傾向を誤認させる可能性がある。

SUGUDASU では:

«Small Multiples を原則優先»

Dual Axis はユーザーが明示的に選択した場合のみ許可する設計を基本とする。

### 9.2 Pie / Donut

実務では頻繁に利用される。一方、カテゴリ間の正確な比較には Bar の方が適する。

したがって:

«Observed Graph ≠ Recommended Graph»

を明示的に保持する。

---

## 10. Failure Analysis

### 10.1 PDF / Image Extraction

問題:

- 単位がグラフ外にある
- 脚注に分散
- 表とグラフの数値が抽出時に崩れる

SUGUDASU では IR 資料を解析対象にするのではなく、

«Excel / Spreadsheet → TSV Copy & Paste»

を基本入力とする。これにより表構造を保持する。

Unit が存在しない場合: `"Unit = UNKNOWN"`。推測によって数値を改変しない。

### 10.2 Dual Axis Visual Deception

問題: 左右 Y 軸が独立スケールになると、実際には減少している指標が右肩上がりに見える場合がある。

対応:

1. 0 基線を同期
2. 同期不能なら Dual Axis を破棄
3. Small Multiples へフォールバック

### 10.3 Percentage / Absolute Value Mixing

実数と前年比等の率を混在させた状態で積み上げることを禁止する。

以下の場合:

- Unit = %
- Ratio / Rate
- 正負混在の比率

`"Stacked_Column"` の候補から除外する。

---

## 11. Data Transformation

SUGUDASU Graph は単に Graph Type を選択するだけではない。

必要な場合、入力データを可逆的・説明可能な数学変換によって Graph-ready Data へ変換する。

代表例 — Composition:

```text
入力: A, B, C
変換: A/(A+B+C), B/(A+B+C), C/(A+B+C)
出力: 100% Stacked Column
```

重要:

«変換結果は元データを破壊してはならない。»

CONVERTIBLE の意味境界は Decision Constitution §4–5 · IR_CORPUS §11。

---

## 12. Architecture

基本 Pipeline:

```text
[User Data Input]
Excel / Spreadsheet Paste
        ↓
1. Observable Structure Extraction
   - row / column count
   - data types
   - signs
   - cardinality
   - label length
   - temporal pattern
        ↓
2. Data Type / Unit Detection
   - date / year / quarter / month
   - percentage / currency / count
   - scale difference
   - target candidate
        ↓
[User Intent Selection]
比較 / 推移 / 割合 / 順位 / 内訳 / 達成 …
        ↓
3. Deterministic Rule Engine
        ↓
   ├─ MATCH → Graph Spec
   ├─ CONDITIONAL → User Confirmation → Graph Spec
   └─ CONVERTIBLE → Data Transformation → Graph Spec
        ↓
4. Constraint / Accessibility Validation
        ↓
5. Rendering
   SVG / PNG
        ↓
Clipboard / Export
```

MISMATCH 分岐は Graph を生成せず、入力修正または Intent 変更を促す（正常結果）。

---

## 13. Rule Engine Design Principle

Rule Engine はブラックボックスにしない。

各推薦結果は最低限以下を保持できる構造とする。

```text
Input Structure
  ↓
Detected Features
  ↓
Intent
  ↓
Matched Rule ID
  ↓
Decision
  ↓
Reason
  ↓
Exceptions
  ↓
Graph Specification
```

例:

```text
Structure: Temporal × Quant
Detected: Cardinality = 5, Measure_Count = 1, Unit = Currency
Intent: TREND
Matched: RLE-001
Decision: Line
Reason: Temporal >= 4 and single measure
Confidence: Deterministic
```

これにより、ユーザーや開発者が

«「なぜこのグラフになったのか」»

を追跡できる。

---

## 14. LLM / Generative AI Policy

### 14.1 Core Principle

SUGUDASU Graph の Graph Recommendation Engine に、LLM は必須ではない。

理由:

| 観点 | 説明 |
|------|------|
| Reproducibility | 同じ入力に対して同じ結果 |
| Numeric Safety | 数値解釈を確率的モデルへ依存しない |
| Non-Send | ユーザーデータをサーバーへ送らない |
| Explainability | Rule ID まで遡れる |
| Performance | 構造判定・ルール照合・SVG 生成はブラウザ内で可能 |

---

## 15. Important Qualification

「LLM 不要」は、

«すべての将来機能に LLM を使用してはならない»

という意味ではない。

本 Corpus が扱った範囲では、

«Observable Structure + User Intent»

によって Graph Recommendation の大部分を決定論的に処理できる。

LLM を利用するとすれば、将来的には Graph Recommendation そのものではなく、別レイヤーに限定する。

例:

- ユーザーの自然言語 Intent を選択肢へ変換
- 列名の意味候補提示
- 業務用語の補助
- グラフの説明文生成

ただし、それらは Core Decision Engine の決定権を持たない。

Deep Research の LLM＋GVAE ハイブリッド結論は採用しない（[RESEARCH_PRIOR_ART.md](./RESEARCH_PRIOR_ART.md) §2）。

---

## 16. Non-Send Principle

ユーザーが入力したデータを外部サーバーへ送信しないことを基本原則とする。

処理: Browser · JavaScript · WebAssembly · Local computation のみで完結させる。

特に財務・IR・社内管理資料等の機密性を考慮し、

«Graph 生成のためにデータを外部 AI へ送信しない»

ことを設計上の強みとする。

---

## 17. Accessibility / Visual Safety

Graph 生成時に以下を Constraint として検証する。

- 0 基線
- 軸スケール
- 凡例可読性
- ラベル長
- カテゴリ数
- 色だけに依存しない識別
- 3D Graph 禁止
- 過度な装飾禁止

Contrast ratio 等の具体的な閾値は、採用するアクセシビリティ基準と実装仕様を確定した後に固定する。

未検証の数値をルールとしてハードコードしない。

---

## 18. Deterministic State Model

| State | 意味 | 自動化 |
|-------|------|--------|
| MATCH | Rule 命中 · Graph Spec 即決（structure_unique または priority_fixed） | 自動 |
| CONVERTIBLE | 数学変換のうえ即決 | 自動 |
| CONDITIONAL | 人間に 1 問（AI 相談ではない） | 確認後 |
| MISMATCH | Intent と構造が明確に衝突 · 生成しない | 生成しない |
| NO_MATCH | ルール未定義 · 不整合ではない | 将来拡張 |

```text
Observable → Intent → Rule Match → Resolution State → Graph Spec → Validation → Renderer
```

«NO_MATCH ≠ MISMATCH» — 空マッチを MISMATCH に落とすな。  
«LLM を入れない» ことより、この誤認を防ぐことの方が実装上重要。

MISMATCH はエラーではない。NO_MATCH も失敗ではない（カバレッジ不足の信号）。

正本: [`GRAPH_RULES.json`](./GRAPH_RULES.json) `resolution_states` · [`DECISION_CONSTITUTION.md`](./DECISION_CONSTITUTION.md) §4。

---

## 19. Corpus as Regression Test

100 ケースの Ground Truth Corpus は、単なる研究資料ではなく、将来の Rule Engine の Regression Test Dataset として利用する。

各 CASE について最低限以下を検証する。

- Input Structure
- Intent
- Expected Graph Type
- Expected State
- Matched Rule

Rule 変更時:

```text
Corpus 100 cases
  ↓
Rule Engine
  ↓
Expected Output
  ↓
Diff
```

によって既存ケースへの影響を検証する。

---

## 20. Rule Change Policy

Rule Engine の変更は、既存 Corpus への影響を確認してから採用する。

変更時に確認する項目:

1. 既存 100 ケースの結果
2. MATCH → CONDITIONAL への変化
3. CONDITIONAL → MATCH への変化
4. Observed Graph との一致率
5. Recommended Graph との一致率
6. 新しい例外の発生
7. Accessibility への影響

特に、

«「見た目を改善するために決定論を壊す」»

ことを禁止する。

---

## 21. Ground Truth / Recommendation Separation

Corpus では以下を混同しない。

| 概念 | 意味 |
|------|------|
| Observed Graph | 企業が実際に使っていた形式 |
| Recommended Graph | SUGUDASU が推奨する形式 |

実務慣行が必ずしも視覚的に最適とは限らない。

したがって SUGUDASU Graph は企業慣行を「正解」としてコピーするのではなく、

«実務で実際に使われているパターンを Ground Truth として観察し、そこから決定論的な推薦ルールを構築する。»

（「学習」は ML 学習ではなく、規範抽出・検証の意味。）

---

## 22. Core Product Definition

SUGUDASU Graph は、

«「データを見て AI がそれっぽいグラフを作るサービス」ではない。»

以下のプロダクトである。

«表の構造と、ユーザーが伝えたいことを組み合わせ、再現可能なルールによってグラフ仕様を決めるツール。»

核心は Graph Rendering ではなく、

**Graph Decision Engine**

にある。

---

## 23. Product Constitution（Engine 側 P1–P10）

| ID | 原則 | 要点 |
|----|------|------|
| P1 | Deterministic First | 同じ入力から同じ結果 |
| P2 | Observable Before Semantic | 観測可能な構造を先に確定 |
| P3 | Intent Is Explicit | 意図を勝手に推測しない |
| P4 | Ask Only When Necessary | 決定不能な場合だけ質問 |
| P5 | Practice ≠ Recommendation | 実務慣行と視覚的推奨を分離 |
| P6 | Non-Send | 外部送信しない |
| P7 | Explainable | Rule ID まで追跡 |
| P8 | Reversible | 変換で元データを破壊しない |
| P9 | Regression-Testable | Corpus を継続 Regression に使う |
| P10 | No AI Dependency | Core Decision Engine は LLM なしで成立 |

上位ブランド / プロダクト憲法との関係は [README.md](./README.md)。

---

## 24. Research Conclusion

100 ケースの日本企業 IR Ground Truth Corpus から、

- 12 Intent
- 24 Graph Type
- 10 主要 Pattern
- 8 主要 Deterministic Rules
- 5 Conditional Rules

を整理した。

分析結果から、グラフ推薦の大部分は、

Observable Structure × Intent

によって決定論的に処理できることが確認された。

特に、

- Temporal → Line / Column
- Ranking → Bar
- Bridge → Waterfall
- Breakdown → Stacked Column
- Composition Shift → 100% Stacked Column

などは、明確な構造条件によって高い再現性を持つ。

一方、

- Dual Axis vs Small Multiples
- Donut vs Bar
- Absolute vs Composition
- Target の表現
- High Cardinality の表示方法

などは、ユーザーの視覚的・業務的意図が必要である。

したがって SUGUDASU Graph の最適な設計は、

«完全自動化ではなく、「決められるものは機械的に決め、決められないものだけユーザーに聞く」»

ことである。

これは AI による推測を減らす設計ではなく、

«そもそも推測が不要な問題としてグラフ選択を再定義する»

ということである。

---

## 25. Implementation Boundary

この文書は Graph Recommendation Engine の設計原則・研究根拠・ルール正本である。

以下は別仕様として管理する。

- UI 詳細
- SVG 実装
- Vega-Lite 実装
- Clipboard API
- PNG export
- TSV parser
- Excel parser
- Unit detection implementation
- Accessibility exact thresholds
- Browser compatibility
- Performance benchmark
- Export format
- SEO / landing page
- Advertisement placement

特に、「10ms 以内」等の性能値はベンチマーク完了まで仕様保証値としない。

---

## 26. Source of Truth Hierarchy

Graph Engine に関する判断は以下の優先順位とする。

```text
1. Ground Truth Corpus
        ↓
2. Decision Rules（将来 GRAPH_RULES.yaml）
        ↓
3. Product / Decision Constitution
        ↓
4. Implementation
        ↓
5. UI / Visual Design
```

実装がルールと矛盾する場合、実装を修正する。

UI 都合で Decision Rule を変更しない。

---

## 27. Current Status

| 項目 | 状態 |
|------|------|
| Research | Complete（叙述） |
| Corpus | 100 cases · **比率再集計 U-01 未解決** |
| Pattern Extraction | Complete |
| Initial Decision Rules | Defined in research · **実行正本は GRAPH_RULES.json** |
| Conditional UX | Defined · CND-003 unwired（U-10） |
| Architecture | Defined |
| `GRAPH_RULES.json` | **Created · schema 1.1.0 · 実装正本固定** |
| Architect Review | [`GRAPH_RULES_ARCHITECT_REVIEW.md`](./GRAPH_RULES_ARCHITECT_REVIEW.md) |
| Implementation Gate | [`GRAPH_RULES_IMPLEMENTATION_GATE.md`](./GRAPH_RULES_IMPLEMENTATION_GATE.md) · **Architecture GO** |
| Decision Engine | `assets/graph-decision-engine.js` · `npm run test:graph-decision` |
| Observable Extraction | Spec `OBSERVABLE_EXTRACTION_SPEC.md` · `assets/graph-observable-extractor.js` · `npm run test:graph-observable` · fixtures `docs/graph/fixtures/` |
| Implementation | Decision + Extraction **PASS** · **Renderer HOLD** |

次フェーズは、

«`GRAPH_RULES.json` を読む Decision Engine の単体テスト（描画なし）と、Observable 抽出仕様（U-06）」

とする。

Graph 描画 UI を先に作らない。

まず、

```text
TSV
 → Observable Structure
 → Intent
 → Rule ID
 → Decision State
 → Graph Type
```

までを決定論的に検証する。
