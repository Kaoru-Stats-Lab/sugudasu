# SUGUDASU Graph — Research / Prior Art

**Status:** Design Reference  
**Role:** 既存研究・OSS を「Prior Art（設計検証用）」として位置づける。採用リストではない。  
**更新:** 2026-08-08  
**索引:** [README.md](./README.md)

«SUGUDASU Graph は奇抜な発明ではない。既存の Intent × Data Structure × Rules 系譜を、実務・ローカル・決定論・3分以内に極端に絞り込むプロダクトである。»

---

## 1. 位置づけ

SUGUDASU Graph は独自発明として「ルールベースの可視化推薦」を発明するものではない。

Data Visualization / HCI には既に、

«Data Structure + User Intent + Visualization Rules»

によって可視化候補を決定する研究系譜が存在する。

SUGUDASU Graph はその考え方を、

«日本の実務ユーザー × Excel 貼り付け × Non-Send × 3分以内»

という SUGUDASU の制約に適用する。

### 採用 vs 参照

| 扱い | 意味 |
|------|------|
| Prior Art / 参照 | 設計を検証する · 用語 · 制約思想 · 仕様パターンを借りる |
| 採用候補 | Constitution 適合を個別判断したうえで依存に入れる |
| 不採用（明示） | Deep Research の「LLM＋Draco＋GVAE ハイブリッド」結論 |

OSS は「そのまま使うもの」ではなく、

«SUGUDASU Graph の設計を検証するための Prior Art»

として扱う。

---

## 2. Deep Research 結論の扱い（固定）

Deep Research 結果には SUGUDASU 思想とズレる部分がある。

| Deep Research 側の典型結論 | SUGUDASU の扱い |
|----------------------------|-----------------|
| LLM による意味理解・推奨 | Core に採用しない |
| GVAE 等の生成モデル | 採用しない |
| LLM＋制約ソルバのハイブリッド高度可視化 AI | 一般論としてはあり得るが、勝ち筋ではない。持ち込まない |

既存研究は、

«決定論的な可視化推薦が成立することの裏付け»

として利用する。AI 採用の根拠にはしない。

---

## 3. AntV AVA / ChartAdvisor

**Reference:** antvis/AVA · ChartAdvisor · Chart Knowledge Base (CKB)

重要な参考点:

- User Intent とデータ属性からチャート候補を扱う
- Chart Knowledge Base を持つ
- ルールベースで可視化候補を扱える
- 推薦理由を構造化できる

SUGUDASU では特に、

«Intent × Data Structure → Chart»

という考え方を参照する。

AVA をそのまま採用することを意味しない。

---

## 4. Draco / Draco 2

**Reference:** uwdata/draco · cmudig/draco2  
University of Washington Interactive Data Lab 系。

重要な参考点:

- Visualization の設計原則を論理制約として表現
- Hard / Soft Constraint
- 「不適切な可視化を生成しない」方向性
- ルールをテスト可能な形式で扱う

SUGUDASU の

«Graph Constitution · Constraint · Regression Test»

を設計する上で重要な参考資料。

Draco をそのまま埋め込む必然はない。制約思想とテスト可能性を借りる。

---

## 5. CompassQL

**Reference:** vega/compassql

重要な参考点:

- Quantitative · Nominal · Ordinal · Temporal 等のデータ属性で可視化空間を探索

SUGUDASU では、

«「データの構造を観測し、その構造に適合する表現を決める」»

というアーキテクチャの参考とする。

ただし CompassQL のように巨大な可視化探索空間を目的としない。

目的は、

«実務で迷わないための少数の決定的な選択»

である。

---

## 6. Arquero

**Reference:** uwdata/arquero

用途候補:

- Data transformation · filtering · grouping · aggregation
- type handling · local processing

Transformation Layer の参考。ブラウザ内処理と相性が良い候補。

---

## 7. PapaParse

**Reference:** mholt/PapaParse

用途候補:

- CSV / TSV parsing
- Clipboard text parsing

Excel / Google Sheets からコピーされたタブ区切りデータをブラウザ内で処理する際の候補。

---

## 8. Vega-Lite

**Reference:** vega/vega-lite

重要な参考点:

«Visualization specification をデータと構造から宣言的に記述する。»

検討構造:

```text
Decision Engine
  ↓
Graph Specification
  ↓
Renderer
```

ただし、

«「Vega-Lite を採用すれば自動的に 100% 同じ出力になる」»

という意味ではない。

再現性は SUGUDASU 側の Decision / Specification 生成ルールによって保証する。

---

## 9. Apache ECharts

**Reference:** apache/echarts

候補用途: Browser rendering · SVG / Canvas · interactive chart · export。

ただしインタラクティブ性を増やすこと自体を目的にしない。基本は作る → 確認する → 資料へ持っていく。

---

## 10. 優先参照順

1. AntV AVA / ChartAdvisor — Intent × Data Structure による推薦
2. Draco / Draco 2 — 可視化ルールを Constraint として表現
3. CompassQL — Data Type × Visualization Specification
4. Vega-Lite — Declarative Visualization Specification
5. Arquero — ローカル変換
6. PapaParse — 貼り付けパース

Rendering / Export（ECharts · html-to-image 等）は Decision の後段であり、優先度は低い。

---

## 11. Layer 対応表（実装検討用）

| Layer | Reference | 備考 |
|-------|-----------|------|
| Input Parsing | PapaParse | Constitution 適合しやすい |
| Data Processing | Arquero | ローカル |
| Visualization Recommendation | CompassQL / AVA 思想 | 巨大探索はしない |
| Visualization Constraints | Draco 思想 | Hard/Soft · 不適切禁止 |
| Chart Knowledge | AntV AVA CKB | 知識ベース思想 |
| Declarative Spec | Vega-Lite | Spec 層の参考 |
| Rendering | ECharts 等 | 後段 |
| Image Export | html-to-image 等 | Copy First |
| Regression Test | Vitest / Jest | 必須思想 |
| CI | GitHub Actions | ルール回帰 |

「OSS があるから採用」禁止。Non-Send · Deterministic · Browser-only を先に判定する。

---

## 12. 研究系譜と SUGUDASU の差分

| 研究系譜の一般形 | SUGUDASU の絞り込み |
|------------------|---------------------|
| 広い可視化探索空間 | 少数の決定的選択 |
| 意味理解・学習による推薦 | Observable + Explicit Intent + Rules |
| サーバー / API 前提もあり得る | Non-Send · Browser-only |
| 「良いチャート」の最適化 | 実務3分 · 説明可能 · 回帰可能 |
| Practice の模倣 | Practice ≠ Recommendation を保持 |

---

## 13. 関連文書

| 文書 | 関係 |
|------|------|
| [PRODUCT_THESIS.md](./PRODUCT_THESIS.md) | AI を使わない理由 · Positioning |
| [DECISION_CONSTITUTION.md](./DECISION_CONSTITUTION.md) | Rule Engine · Constraint · Regression |
| [IR_CORPUS_SPEC.md](./IR_CORPUS_SPEC.md) | 実務コーパスで憲法を検証 |
| [GRAPH_DETERMINISTIC_ENGINE.md](./GRAPH_DETERMINISTIC_ENGINE.md) | 100 case に基づくルール正本 |
