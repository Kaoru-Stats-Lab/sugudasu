# SUGUDASU Graph — GRAPH_RULES.json 実装前アーキテクトレビュー（Gate）

**Status:** Architecture GO · Decision Engine GO · Renderer HOLD  
**Date:** 2026-08-08  
**Machine SoT:** [`GRAPH_RULES.json`](./GRAPH_RULES.json)（schema ≥ 1.1.0）

> JSON をさらに弄る段階ではない。実装正本として固定し、Decision Engine 単体テストで実行可能性を検証する。

---

## 結論

**Architecture: GO**  
**GRAPH_RULES.json: 実装正本として採用**  
**Decision Engine 実装: GO**  
**Graph Renderer 実装: HOLD**

次工程:

> `Observable Structure → Intent → Rule Matching → Decision State → Graph Spec`

の **Decision Engine 単体テストを先に実装する。**

研究報告書を再度 JSON へ戻す必要はない。

---

## 1. GRAPH_RULES.json の位置づけ

`docs/graph/GRAPH_RULES.json` を実行時ルールの機械正本とする。

研究報告書 · 設計説明書 · アーキテクトレビューは人間向け。実行時判断は JSON のみを参照する。

衝突時は **GRAPH_RULES.json を優先**する（README · 研究 MD · 旧 RLE 番号含む）。

---

## 2. GO として維持する点

1. Observable / Semantic 分離（`no_hidden_inference` · `observable_before_semantic` · `user_intent_required`）
2. Decision State と Automation の分離（`CONVERTIBLE ≠ User Confirmation`）
3. Observed ≠ Recommended
4. LLM を Decision Engine に入れない
5. `priority_desc_then_id_asc` · `first_match_wins`
6. **NO_MATCH ≠ MISMATCH**（schema 1.1.0 · 空マッチを不整合と誤認しない）

### Decision States（5）

| State | 意味 | 自動化 |
|-------|------|--------|
| MATCH | 一意決定（structure_unique または priority_fixed） | 自動 |
| CONVERTIBLE | 数学変換で決定 | 自動 |
| CONDITIONAL | 人間に 1 問 | 確認後 |
| MISMATCH | Intent と構造が明確に衝突 | 生成しない |
| NO_MATCH | ルール未定義 | 将来拡張 |

---

## 3. Contract Tests（最低限）

| ID | 入力 | 期待 |
|----|------|------|
| T01 | Temporal 5 × 1 × TREND | RLE-001 / MATCH / Line |
| T02 | Temporal 3 × 1 × TREND | RLE-002 / MATCH / Column |
| T03 | Nominal 5 × 1 × RANKING | RLE-003 / MATCH / Bar |
| T04 | Net_Change + Start/End + BRIDGE | RLE-004 / MATCH / Waterfall |
| T05 | Temporal+Nominal 4 × Absolute × MIX_SHIFT | RLE-005 / CONVERTIBLE / 100pct_Stacked_Column |
| T06 | Temporal+Nominal 4 × Absolute × BREAKDOWN | RLE-006 / MATCH / Stacked_Column |
| T07 | Temporal × 2 × different units × TREND/MULTI_METRIC | RLE-007 / CONDITIONAL |
| T08 | Nominal 3 × total × PROPORTION | RLE-008 / CONDITIONAL |
| T09 | Temporal × target × TARGET_VS_ACTUAL | RLE-009 / CONDITIONAL |
| T10 | Nominal 20 × 1 × RANKING | RLE-012 / CONDITIONAL |
| T11 | Nominal × 2 × common unit × COMPARISON | RLE-013 / MATCH / Grouped_Bar |
| T12 | RELATIONSHIP candidate | RLE-015 / provisional |
| T13 | Mixed units + BREAKDOWN | MISMATCH |
| T14 | Positive/negative mixed + Stacked intent | MISMATCH |
| T15 | Unknown unit | numeric preserved · unit UNKNOWN |
| T16 | Unknown intent | ask_user（推論しない） |
| T17 | No matching rule | **NO_MATCH**（MISMATCH ではない） |

> Gate 草案に T17=MISMATCH とあった箇所は、schema 1.1.0 の正本に合わせて **NO_MATCH** に訂正する。JSON 優先。

---

## 4. Negative Tests（必須）

- Percentage + Currency を同一 Stack に入れない
- positive + negative mixed を通常 Stacked_Column へ流さない
- different units を無条件 Dual Axis へ流さない
- unknown structure を LLM / 暗黙推論で補完しない

---

## 5–14. 実装規律（要約）

- RLE-014 は deferred · active として扱わない
- CND-001 default = small_multiples · zero sync 制約は Spec Validator / Renderer へ引き継ぐ（今は HOLD）
- CONVERTIBLE は raw を破壊しない（derived display のみ）
- CND-003 は defined_unwired · 存在確認のみ
- U-01〜U-12 を実行条件にしない（特に U-11 scale_ratio で hard reject しない）
- 「85%」仮説は KPI/SLA 禁止
- Decision と Renderer を混ぜない
- テスト不足で通すな · JSON 不足は仕様不足として記録

### 実装順序（固定）

```text
① GRAPH_RULES.json（固定）
② Decision Engine
③ Decision Unit Tests
④ Rule Boundary / Negative Tests
⑤ Graph Spec生成        ← まだ進まない
⑥ Graph Spec Validation ← HOLD
⑦ SVG Renderer          ← HOLD
⑧ PNG / Clipboard       ← HOLD
```

### Definition of Done — Decision Engine

- [x] GRAPH_RULES.json を唯一の Rule Source として読める
- [x] active / active_provisional のみ実行 · deferred は実行しない
- [x] priority · first-match-wins
- [x] MATCH / CONDITIONAL / CONVERTIBLE / MISMATCH / NO_MATCH
- [x] Negative · Unknown Unit · Unknown Intent · 再現性
- [x] LLM/API/Network 非要求
- [x] RLE-014 が shadowing しない

（チェックは `npm run test:graph-decision` で機械検証）

---

## 最終判断

次に作るものは新しいルールでも新しいグラフでもない。

> **`GRAPH_RULES.json` を入力として、Observable + Intent から `Rule ID → State → Graph` を決定する純粋な Decision Engine と、その境界・Negative Test。**

このテストが通れば、研究結果は「実装可能な決定論的仕様」へ移行したと判断する。
