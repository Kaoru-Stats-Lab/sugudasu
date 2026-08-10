# SUGUDASU Graph — Architect Review（GRAPH_RULES 投入前）

**Status:** Architect Decision Log  
**Date:** 2026-08-08  
**Role:** システムアーキテクト判断 · 矛盾 / 瑕疵 / 未明確の分離  
**Machine SoT:** [`GRAPH_RULES.json`](./GRAPH_RULES.json)  
**Human SoT:** [`DECISION_CONSTITUTION.md`](./DECISION_CONSTITUTION.md) · [`GRAPH_DETERMINISTIC_ENGINE.md`](./GRAPH_DETERMINISTIC_ENGINE.md)

推論で埋めない。確定できるものだけ直す。残りは **未明確 / 未解決** と明示する。

---

## 0. アーキテクト結論（要約）

1. **`GRAPH_RULES.json` を実装エンジンの機械正本とする。** 研究報告書の JSON 化ではない。責務は `Observable → Intent → Rule → Graph Spec（描画タイプ決定）` まで。SVG / Vega-Lite 生成は別実装。
2. **Observed ≠ Recommended を構造として固定する。** 同一フィールドに押し込めない。
3. **LLM スロットは作らない。** 未知は MATCH / CONVERTIBLE / CONDITIONAL / MISMATCH / **NO_MATCH**。
3b. **NO_MATCH ≠ MISMATCH（2026-08-08 追記）。** 空マッチを不整合と誤認しない。拡張性に直結。
3c. **deterministic には `structure_unique` と `priority_fixed` がある。** RLE-013 は後者。
3d. **CND-004** は TARGET_VS_ACTUAL で目標を落とす Column を禁止し、Bullet / Grouped_Column（実績+目標）に再整理。
4. **研究資料の「58% / 27% / 15%」は分類軸が壊れている。** CONVERTIBLE を「人間確認 15%」に読ませてはならない。比率の再集計は **未解決**（数値を JSON に確定値として入れない）。
5. 草案 JSON には **到達不能条件・ルール衝突・非 Observable 条件** がある。到達不能は削除、衝突は決定論を壊すため修正、非 Observable は CONDITIONAL 化または **未明確** として排除。

---

## 1. 確定修正（矛盾・瑕疵）

### 1.1 Corpus 比率の軸混同（重大）

| 資料の書き方 | 問題 |
|--------------|------|
| MATCH 58% / CONDITIONAL 27% / User Confirmation **/** Convertible 15% | 第3桶が「確認」と「変換」を OR している |
| 後段パイプラインの MATCH / CONDITIONAL / **CONVERTIBLE** | CONVERTIBLE は決定論的変換側（確認ではない） |

**判断:** 2軸を分離する。比率の再ラベルは Corpus 再集計なしでは確定できない → **未解決**。

| 軸 | 値 | 意味 |
|----|-----|------|
| **Decision State** | MATCH · CONVERTIBLE · CONDITIONAL · MISMATCH · NO_MATCH | エンジン状態機械 |
| **Automation（研究用・再集計待ち）** | auto_deterministic · needs_confirmation · （他は未明確） | 100 case の％用。State と 1:1 ではない |

- MATCH ⊆ 多くは auto_deterministic
- CONVERTIBLE ⊆ **原則 auto_deterministic**（確認が要る変換は別フラグ。現状スキーマでは `conversion_requires_confirmation` を予約、値の運用は **未明確**）
- CONDITIONAL = needs_confirmation
- 「85% は一意 or 1回確認」は **仮説のまま。再集計まで実装 KPI にしない**

### 1.2 到達不能ロジック（草案 JSON）

| 箇所 | 瑕疵 | 処置 |
|------|------|------|
| RLE-001 `if.cardinality.min:4` + `fallback.temporal_cardinality.max:3` | fallback は if 成立時に発火しない | fallback 削除。短系列 TREND は別ルール（RLE-002） |
| RLE-005 `if.nominal_cardinality.max:5` + `exceptions.gt:5` | exception 到達不能 | exception 削除。高 cardinality は別ルールまたは CND へ |

### 1.3 決定論を壊すルール衝突

| 衝突 | 問題 | 処置 |
|------|------|------|
| RLE-013 Grouped_Bar と RLE-014 Grouped_Column | 同一 `if` で両方 MATCH | Grouped_Bar を default MATCH。縦向きは **未明確**（ラベル長等の Observable 条件が未定義）のため RLE-014 を v1 から外すか `status: deferred` |
| RLE-006 と RLE-010 | ほぼ同条件の BREAKDOWN → Stacked_Column | 統合（1本化） |
| RLE-005 と RLE-011 | ほぼ同条件の MIX_SHIFT → 100pct | 統合（1本化） |
| RLE-001 vs RLE-002（cardinality 4–5） | 両方 TREND | priority で Line 優先は可。RLE-002 は max 3 に限定して重複解消 |

### 1.4 非 Observable 条件（憲法違反疑い）

| 条件 | 問題 | 処置 |
|------|------|------|
| `when.emphasis: absolute_volume`（旧 RLE-002） | 意味強調は Observable ではない | 削除。短系列は cardinality だけで Column |
| `when.preferred_orientation: vertical`（旧 RLE-014） | 好みは Intent でも Structure でもない | ルール除外（deferred） |
| `sort_order: Descending` | 「データが既に降順か」の検出定義が **未明確** | v1 では `max_label_length` のみ、または RANKING intent 時は常に Bar+sort descending（Intent 明示に依存） |

### 1.5 RLE-007 / CND-001 の graph 不一致

草案: `then.graph = Combination_Column_Line` なのに CND-001 `default = small_multiples`。

**判断:** CONDITIONAL では `then.graph` を最終確定にしない。  
`recommended_graph` = CND default（Small_Multiples）、`observed_graphs` / options に Combination / Dual_Axis 系を置く。

### 1.6 Dual_Axis 欠落

Engine 研究 taxonomy に Dual_Axis があるが草案 `graph_types` に無い。CND-001 は Combination_Column_Line にマップしている。

**判断:** v1 は Dual_Axis を独立 type として **追加予約**するが、描画差（真正 Dual Axis vs Combo）は Renderer 側。Rule 出力は `Combination_Column_Line`（重ね）と `Small_Multiples`（分離）の二択で足りるかは **未明確**（研究は Dual_Axis を別称で数えている）。

### 1.7 Engine MD の RLE-001〜008 と JSON ID の不一致

研究正本の RLE 番号と草案 JSON の番号がずれている。

**判断:** **`GRAPH_RULES.json` の `rules[].id` を実行時正本とする。** Engine MD の旧 RLE-001〜008 は研究叙述。対応表は本レビュー §4。MD 本文の一括リネームは後続（必須ではないが Drift 注意）。

---

## 2. 未明確 · 未解決（推論しない）

| ID | 項目 | 状態 |
|----|------|------|
| U-01 | 100 case の 58/27/15 を Decision State 軸で再集計した正確な％ | **未解決** · 再監査が必要 |
| U-02 | CONVERTIBLE のうち「自動変換してよい」と「変換前確認が必要」の境界一覧（構成比以外） | **未明確** · Constitution は分離を要求するがカタログ未確定 |
| U-03 | DISTRIBUTION / STRUCTURE Intent に対応するルールが無い | **未明確** · taxonomy のみで v1 ルールなし → `no_matching_rule` |
| U-04 | Graph Type 24種のうち JSON 未収録（Treemap, Multi_Line, Bubble 運用など） | **未解決** · v1 は収録分のみ実行対象 |
| U-05 | RELATIONSHIP → Scatter の Observable（「Nominal × measure_count:2」でよいか） | **未明確** · 通常は Quant×Quant。定義再確認が必要 |
| U-06 | `has_target` / `measure_type: Net_Change` / Temporal 検出のアルゴリズム | **未明確** · Observable 宣言はあるが検出仕様が別途必要 |
| U-07 | WCAG 4.5 / 3.0 を validation にハードコードしてよいか | Engine は「未検証閾値をハードコードするな」→ **暫定参照**として入れ、実装保証値ではないと注記 |
| U-08 | CONDITIONAL `max_questions: 1` と複数 CND 連鎖の可否 | **未明確** |
| U-09 | UI 初期 Intent 6語と Engine 12 Intent のマッピング表 | Thesis 仮説あり · **製品確定前** |
| U-10 | CND-003 を発火させる rule id が草案に無い | **瑕疵（欠落）** · BREAKDOWN vs MIX_SHIFT をユーザーが選ぶ経路が未配線。v1 は Intent を先に選ばせる前提なら CND-003 は予備。配線は **未解決** |
| U-11 | `dual_axis_scale_ratio: 10` の根拠 | **未明確** · 研究本文に確定根拠なし。thresholds に残すが強制 reject には使わない |
| U-12 | PAT / Evidence CASE ID と rules の機械リンク | 研究に CASE 列挙あり · JSON には未移植（任意） |

---

## 3. 実装境界（確定）

```text
[In scope of GRAPH_RULES.json]
  intents, observable feature vocabulary, thresholds (as constants),
  rules, conditional_rules, transformations (declarative),
  resolution_states, validation policy flags,
  output_contract (what decision may promise)

[Out of scope — Cursor / app implementation]
  TSV parse, structure extraction algorithms,
  SVG / Canvas / Vega-Lite rendering,
  clipboard / PNG export code,
  UI chrome, SEO, registry
```

Pipeline:

```text
Observable Structure
  + User Intent
  → Rule match (priority desc)
  → Decision State
  → Graph Spec { recommended_graph, observed_graphs?, transformation?, cnd? }
  → (Renderer — separate)
```

---

## 4. Rule ID 対応（研究叙述 → 実行正本）

| 研究 Engine MD（旧） | テーマ | GRAPH_RULES.json（実行） |
|----------------------|--------|---------------------------|
| RLE-001 Temporal Trend | Line / 短系列 Column | RLE-001 Line · RLE-002 Column（cardinality≤3） |
| RLE-002 Nominal Rank/Compare | Bar | RLE-003 |
| RLE-003 Bridge | Waterfall | RLE-004 |
| RLE-004 Composition Shift | 100pct | RLE-005（統合） |
| RLE-005 Breakdown | Stacked | RLE-006（統合） |
| RLE-006 Proportion | Bar vs Donut | RLE-008 |
| RLE-007 Multi Metric | Small Multiples / Combo | RLE-007 |
| RLE-008 Target vs Actual | Bullet | RLE-009 |
| （Pattern 拡張） | High card / Grouped / Scatter | RLE-012 · RLE-013 · RLE-015 |

旧草案 RLE-010/011/014 は統合または deferred。

---

## 5. 文書修正方針

| 文書 | 修正 |
|------|------|
| `GRAPH_DETERMINISTIC_ENGINE.md` §4 | 軸混同を訂正 · 比率を未解決と明記 |
| `DECISION_CONSTITUTION.md` §9 | 同上 |
| `README.md` | `GRAPH_RULES.json` を機械正本として記載 |

---

## 6. 次アクション（実装順）

1. `GRAPH_RULES.json` をエンジンが読む
2. fixture で Rule ID → State → Graph を単体テスト（描画なし）
3. U-01 再集計（任意だが状態設計の検証に必要）
4. U-06 Observable 抽出仕様を別ファイル化
5. Renderer は Decision が緑になってから
