# SUGUDASU Graph — Observable Extraction Spec（U-06）

**Status:** Implementation Spec · v1  
**Date:** 2026-08-08  
**Issue:** U-06  
**Depends on:** [`GRAPH_RULES.json`](./GRAPH_RULES.json) · [`GRAPH_RULES_IMPLEMENTATION_GATE.md`](./GRAPH_RULES_IMPLEMENTATION_GATE.md)  
**Output consumer:** `assets/graph-decision-engine.js`  
**Renderer:** HOLD（本仕様の範囲外）

> Decision Engine は「与えられた Observable を正しく判定する」。  
> Extraction は「TSV から Observable を **決定論的に** 作る」。  
> 意味理解・Intent 推測・LLM は禁止。

---

## 0. パイプライン位置

```text
TSV / clipboard text
  ↓
① Parse table（区切り · ヘッダー）
  ↓
② Column / Row role（dimension vs measure）
  ↓
③ Feature detectors（本仕様）
  ↓
Observable Structure
  ↓
(+ User Intent — Extraction の外)
  ↓
Decision Engine
```

Extraction は Intent を読まない・推測しない。

---

## 1. 原則

| MUST | MUST NOT |
|------|----------|
| 同じ TSV → 同じ Observable | LLM / 外部 API |
| ルールはテスト可能なパターン | 桁の大きさから通貨を推測 |
| 不明は `Unknown` / flag false | A/B/C を順位と決めつける |
| 検出根拠を `evidence` に残す | Intent を自動選択 |
| raw セル値を改変しない | 「たぶん時系列」の曖昧推測 |

検出できないものは **未検出（false / Unknown）** とし、Decision 側で NO_MATCH / CONDITIONAL / MISMATCH に任せる。

---

## 2. 入力

| 項目 | 仕様 |
|------|------|
| 形式 | Excel / Sheets 貼り付け想定の **TSV 優先**（`\t`）。タブが無い場合のみ CSV（`,`） |
| エンコーディング | UTF-8（BOM 可） |
| 空行 | 無視 |
| 数値 | カンマ区切り・全角数字を半角正規化してパース。パース失敗は非数値セル |

### 2.1 ヘッダー行

次のいずれかなら先頭行をヘッダーとする。

1. 先頭行に **非数値セルが 1 つ以上** あり、かつ 2 行目以降に数値セルが多い
2. 先頭行のいずれかのセルが単位・役割トークンにマッチ（`円|%|売上|実績|目標|計画|年度|年月` 等）

どちらでもなければヘッダーなし（列名は `col_0` …）。

---

## 3. 列ロール

各列について:

- **numeric_ratio** = データ行のうち数値としてパースできた割合
- `numeric_ratio ≥ 0.8` → **measure 候補**
- それ以外 → **dimension 候補**

例外: ヘッダーが明確に日付/年度系トークンでも、値がほぼ数値の年（2022 等）だけの列は **dimension（Temporal 候補）** とする（measure にしない）。

---

## 4. 検出アルゴリズム（v1 固定）

### 4.1 Temporal 判定（ラベル）

セル文字列 `s` が次のいずれかにマッチすれば **temporal_token**:

| パターン | 例 |
|----------|-----|
| `^(19\|20)\d{2}$` | 2022 |
| `^(19\|20)\d{2}[-/年]\d{1,2}(月)?$` | 2022-04, 2022年4月 |
| `^(19\|20)\d{2}\s*Q[1-4]$` / `^Q[1-4]$` | 2022Q1, Q3 |
| `^(19\|20)\d{2}\s*FY$` / `^FY(19\|20)\d{2}$` | 2022 FY |
| `^([1-9]\|1[0-2])月$` | 4月 |
| `^(Jan\|Feb\|…\|Dec)([a-z]*)?$` i | Apr, April |
| `^(年度\|年月\|月\|四半期\|期間)$` | ヘッダー語 |

**列が Temporal**: dimension 候補列の **非空ラベルの ≥70%** が temporal_token。

**temporal_equal_interval**（参考 flag）: Temporal 列がすべて年（4桁）で、ソート後の差分がすべて 1 → true。それ以外は false（未検証は false）。

### 4.2 Nominal

dimension 候補かつ Temporal でない → **Nominal**。

### 4.3 Ordinal

v1 では **原則検出しない**（Semantic 境界）。  
明示トークン `^(第?[1-9]\d*位)$` / `^[1-9]\d*(st|nd|rd|th)$` のみ Ordinal 候補。Decision ルールが Ordinal を要求しない限り、dimension 出力は Nominal にフォールバックしてよい。

**v1 出力:** `dimension` に `Ordinal` を単独で出さない（未明確のため）。証拠だけ `evidence.ordinal_like` に残す。

### 4.4 Cardinality

選択した主 dimension 列の **ユニーク非空ラベル数**。

- 単一 dimension → `cardinality`
- Temporal+Nominal → `cardinality` = temporal 側ユニーク数、`nominal_cardinality` = nominal 側ユニーク数

### 4.5 Measure Count

measure 候補列の数 → `measure_count`。  
0 の場合は Extraction 失敗ではなく `measure_count: 0`（Decision は NO_MATCH になりやすい）。

### 4.6 Unit / Measure Type

列ヘッダー（と単位行があればそのセル）に対するトークン:

| 検出 | トークン（部分一致 · 大文字小文字無視） | measure_type |
|------|----------------------------------------|--------------|
| Percentage | `%` `％` `率` `百分比` `percent` | Percentage |
| Currency | `円` `千円` `百万円` `億円` `¥` `yen` `usd` `$` | Currency |
| Count | `件` `人` `個` `回` `社` | Count |
| Rate | `倍率` `倍` `rate`（単独） | Rate |
| Net_Change | `増減` `差分` `変化額` `net change` `差額` | Net_Change |
| Absolute | 上記なし · 数値列 | Absolute |
| Unknown | 判定不能 | Unknown |

`unit` フィールド: 列から取れた単位文字列。無ければ `"UNKNOWN"`。

**values_share_common_unit:** measure が 2+ かつ検出 unit/type がすべて同一（Unknown 同士は common とみなさない → false）。

**values_have_different_units:** measure が 2+ かつ（type または unit 文字列）が不一致。

複数 measure の代表 `measure_type`: すべて同一ならその値。混在なら `Unknown` とし、`measure_type_mixed_percentage_absolute` を Percentage と Absolute/Currency/Count の混在時 true。

### 4.7 Positive / Negative / Zero

全 measure セル（数値）について:

- すべて ≥ 0 かつ 0 を含む → `positive_only` true, `zero_included` true
- すべて > 0 → `positive_only` true, `zero_included` false
- 正と負が両方存在 → `positive_negative_mixed` true（`positive_only` false）

### 4.8 has_total

次のいずれか:

1. dimension ラベルが `/^(合計|計|小計|総計|total|sum)$/i`
2. ヘッダーが `/合計|総計|total/i`

→ `has_total: true`

### 4.9 has_start_end

dimension ラベル集合が次を **両方** 含む（正規化後）:

- Start 側: `/^(開始|始点|期首|期初|start|beginning|期初残高)$/i`
- End 側: `/^(終了|終点|期末|end|ending|期末残高)$/i`

またはヘッダー行に Start と End の列がある。

片方だけ → false（推測で補完しない）。

### 4.10 has_target

ヘッダーまたは dimension ラベルが:

`/目標|計画|予算|見込み|target|plan|budget|forecast/i`

→ `has_target: true`  
（「この列が目標値である」意味確定ではなく、**トークン存在の観測**）

### 4.11 Net_Change（measure_type）

次の **いずれか**（OR）:

1. ヘッダーが Net_Change トークン（§4.6）
2. `positive_negative_mixed === true` **かつ** `has_start_end === true` **かつ** `measure_count === 1`

(2) は Bridge 表の典型。曖昧な増減列は (1) がない限り Absolute のまま。

### 4.12 Dimension 合成: Temporal+Nominal

次のいずれか:

**A. ロング形式**  
Temporal 列 1 + Nominal 列 1 + measure ≥1  
→ `dimension: "Temporal+Nominal"`

**B. ワイド形式**  
先頭列が Nominal、残りのヘッダーがすべて temporal_token、ボディが数値  
→ `dimension: "Temporal+Nominal"` · `measure_count: 1` · `nominal_cardinality` = 行ユニーク · `cardinality` = Temporal ヘッダー数

**C. 単一 Temporal 列 + measures**  
→ `dimension: "Temporal"`

**D. 単一 Nominal + measures**  
→ `dimension: "Nominal"`

複数 Nominal のみ・複数 Temporal のみなど v1 未対応形は `dimension: "Nominal"`（または第一 dimension）とし、`evidence.unsupported_layout: true`。Decision は NO_MATCH になり得る。

---

## 5. Observable 出力契約

Decision Engine が読むフィールド（最低）:

```json
{
  "dimension": "Temporal | Nominal | Temporal+Nominal",
  "cardinality": 0,
  "nominal_cardinality": null,
  "measure_count": 0,
  "measure_type": "Absolute | Currency | Percentage | Count | Rate | Net_Change | Unknown",
  "unit": "UNKNOWN | string",
  "positive_only": false,
  "positive_negative_mixed": false,
  "zero_included": false,
  "has_total": false,
  "has_start_end": false,
  "has_target": false,
  "values_have_different_units": false,
  "values_share_common_unit": false,
  "temporal_equal_interval": false,
  "max_label_length": 0,
  "measure_type_mixed_percentage_absolute": false
}
```

付帯（Decision 非必須）:

```json
{
  "evidence": { "...": "..." },
  "measures": [{ "id": "売上", "value": 120, "raw": 120 }],
  "table": { "headers": [], "rows": [] }
}
```

`measures` は CONVERTIBLE テスト用に、**先頭 measure 列の行方向値**、またはワイド形式では行合計ではなく **行×時系列の展開は行わない**（v1: 単一系列ベクトル。ワイド Temporal+Nominal では Decision 用フラグのみで measures は省略可）。

---

## 6. 明示的に v1 でやらないこと

- Intent 推定
- A/B/C ランクの順序意味
- 2 指標を「同時に見る意味があるか」
- 単位の欠落を金額と断定
- PDF / 画像からの抽出
- PapaParse 必須化（単純 split で足りる。将来置換可）

---

## 7. Fixture 方針

`docs/graph/fixtures/` に置く。

| 種別 | 目的 |
|------|------|
| `observable/*.json` | Extraction のみ（expected_observable） |
| `regression/*.json` | Extraction → Decision（intent + expected_decision） |

最初に固定する境界（壊してはいけない基準）:

- Temporal cardinality 3 / 4 / 5
- Nominal 4 / 10 / 15
- Currency only · Percentage only · Currency+Percentage
- positive only · positive+negative
- has_total · has_target · has_start_end
- unknown unit · unknown intent · no matching rule（DISTRIBUTION 等）

100 IR case の全移植はしない。

---

## 8. Definition of Done — Extraction

- [x] 本仕様に反する検出を入れない
- [x] `npm run test:graph-observable` PASS
- [x] regression fixture が Decision まで通る（intent 付き）
- [x] 同一 TSV → 同一 Observable → 同一 Decision
- [x] U-06 を「未明確のまま実装」にしない（本仕様で v1 範囲を閉じる）
- [x] Renderer に進まない

---

## 9. U-06 ステータス更新

本仕様の確定をもって、GRAPH_RULES 上の U-06 は:

```text
unclear → specified_v1（実装・テストで検証）
```

仕様外の検出要求は新しい U 項目として追加する（勝手に拡張しない）。
