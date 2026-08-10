# SUGUDASU Graph — Decision Constitution

**Status:** Design Foundation  
**Role:** 決め方の憲法（Intent · Structure · Boundary · States · Pipeline · Rules · Engineering）  
**更新:** 2026-08-08  
**索引:** [README.md](./README.md)  
**Thesis:** [PRODUCT_THESIS.md](./PRODUCT_THESIS.md)  
**Engine 正本（研究裏付けルール）:** [GRAPH_DETERMINISTIC_ENGINE.md](./GRAPH_DETERMINISTIC_ENGINE.md)

«構造検査なら何でも判定できる、と逃げない。»

---

## 0. この文書の位置

Product Thesis が Why を固定する。本文書は How to decide を固定する。

批判を受けて特に固定する原則:

1. ordinal / categorical、2軸の「意味があるか」などは **構造だけでは決まらない**
2. 最初から **機械的に決まる領域 / 確認が必要な領域 / 決めてはいけない領域** に分ける
3. 「構造検査を厚くすれば意味も決まる」は禁止思想

実行可能なルール詳細・Corpus 比率・RLE ID は Engine 正本へ。本文書は境界と状態の憲法である。

---

## 1. Core Architecture

基本パイプライン:

```text
Paste
  ↓
Input Parsing
  ↓
Structure Inspection（Observable のみ）
  ↓
User Intent（明示選択）
  ↓
Compatibility / Decision Engine
  ↓
Transformation（明示数学のみ · 必要な場合）
  ↓
Graph Constitution → Graph Specification
  ↓
Constraint / Accessibility Validation
  ↓
Rendering
  ↓
Copy / Export
```

重要なのは、

«Data → Graph»

を直接行わないことである。

必ず、

«User Intent × Observable Data Structure → Graph Decision»

という経路を取る。

---

## 2. Structure Inspection

Structure Inspection は「意味理解」ではない。観測可能なデータ特性を検査する。

例:

- 行数 · 列数 · ヘッダーの有無
- 数値 / 文字列 · 日付として解釈可能か
- 数値の連続性 · 重複 · 欠損 · 空白
- 列ごとの型 · 一意値数
- 合計 · 比率らしい値域 · 正負 · 桁
- 列間の対応関係 · ラベル長 · 尺度差 · Target 候補の部分検出

ここで重要なのは、

«構造から確定できない意味を、勝手に推測しない»

ことである。

Observable Structure の特徴一覧と Semantic 境界表は Engine §6。

---

## 3. Deterministic Boundary（最重要）

判断可能性を **3種類** に分ける。ここが SUGUDASU Graph の信頼性の核である。

### A. 機械的に確定できる（Decide）

例:

- 数値列である
- 10 行存在する
- 欠損がある / 重複がある
- X 列と Y 列の行数が一致する
- 数値の合計が 100 である（観測）
- Temporal らしき連続ラベルがある（構文・型としての観測）

→ プログラムが決定する。

### B. 構造から高い確度で候補を提示できるが、意味が確定できない（Confirm）

例:

```text
Aランク
Bランク
Cランク
```

これが A > B > C という順位なのか、単なる分類名なのかは値だけでは保証できない。

→ 必要なら確認する。確認 UI は「何でも聞けばいい」逃げ道ではない（§9）。

### C. 構造から意味を決定できない（Do Not Decide）

例:

«「この 2 つの指標を 2 軸で比較する意味があるか」»

これはデータ構造だけでは決められない。

→ ユーザーの判断に残す。勝手に Dual Axis を確定しない。

| 領域 | プログラムの振る舞い |
|------|----------------------|
| A Decide | Rule で一意決定（MATCH 等） |
| B Confirm | CONDITIONAL · 最小質問 |
| C Do Not Decide | 推測禁止 · ユーザー判断または MISMATCH / 説明 |

«Observable Structure と Semantic Intent を混同しない。»

---

## 4. Decision States

Decision Engine の結果は以下の **5 状態** を持つ（機械正本: [`GRAPH_RULES.json`](./GRAPH_RULES.json) `resolution_states`）。

```text
Observable Structure
        ↓
Intent
        ↓
Rule
        ↓
MATCH       → 即決
CONVERTIBLE → 自動変換して即決
CONDITIONAL → 人間に1問だけ（AI相談ではない）
MISMATCH    → 不整合のため作らない
NO_MATCH    → ルール未定義（不整合ではない）
```

### MATCH

入力データと User Intent がルールに整合し、確認なしで Graph Spec が決まる。

«deterministic» には2種ある（JSON `deterministic_semantics`）:

| kind | 意味 |
|------|------|
| `structure_unique` | 構造上ほぼ一意 |
| `priority_fixed` | 複数候補があり得るが、固定 priority / first_match_wins で再現可能な選択（推論ではない） |

例: Intent 推移 · 年度×売上 → 折れ線。

### CONDITIONAL

構造上は候補になるが、意味上の確認が必要（境界 B）。

«CONDITIONAL = AI に相談する状態ではなく、人間に 1 問だけ聞く状態»

v1 では `max_questions: 1` をハード上限とする。

### CONVERTIBLE

明示的・決定論的な数学変換によって Intent に適合させられる。

«CONVERTIBLE ≠ 人間確認»

ただし「勝手に親切変換してよい」ではない。Intent が明示し Rule が許可した変換のみ。変換で元データを破壊しない。

### MISMATCH

User Intent と入力データの構造が **明確に衝突** する。

«MISMATCH = エラー» ではない。適切なグラフを作らないことも成功。

例: Intent「推移」× 部署カテゴリ × 売上（時間軸なし）。

### NO_MATCH

アクティブなルールにヒットしない。構造と Intent が整合する **可能性は残る** が、v1 ルールが未定義。

«NO_MATCH ≠ MISMATCH»

例: Temporal × Quant + Intent DISTRIBUTION → ルール未定義（NO_MATCH）。不整合と誤認して閉じない。将来のルール拡張の受け皿。

空マッチを MISMATCH に落とすことは禁止（拡張性を壊す）。

---

## 5. Transformation

Transformation は「AI によるデータ解釈」ではない。明示された数学的操作だけを行う。

候補:

- 合計 · 平均 · 差 · 増減 · 増減率
- 構成比 · 累積 · 順位

例:

```text
構成比 = 各値 / 全体合計 × 100
前年比 = (今年 - 前年) / 前年 × 100
```

変換式は仕様として固定し、すべてテスト可能にする。

«「勝手に意味を作る処理」» ではなく、

«明示された Intent に対して、定義済みの数学的変換を適用する処理»

とする。

禁止例:

- 実数と前年比等の率を混在させたまま積み上げる
- Unit = % / Ratio / 正負混在比率を Stacked_Column 候補に残す（Engine §10.3）

---

## 6. 2軸 · 3軸

実務上特に重要なのが、

«実数と割合を一つのグラフで見たい»

というケースである。

例: 月 × 売上（実数）× 利益率（%）

Excel では第2軸 · 系列の種類 · 軸の設定 · 単位 · スケールが難しい。

したがって SUGUDASU Graph では、

«2軸グラフを「高度なグラフ機能」としてではなく、実務上の典型ケースとして扱う»

ことを検討する。

ただし、

«「2つの系列を同時に見る意味がある」»

はデータだけから完全には判定できない（境界 C）。

| 機械的に検査できる | 機械的に保証できない |
|--------------------|----------------------|
| X 軸が一致 | 同時に見る意味がある |
| 系列数 · 数値列 | 比較する必要がある |
| 単位候補 · 値域 | 組み合わせが誤解を招かない |

SUGUDASU のデフォルトは認知安全性を優先する（Small Multiples 原則優先 · Dual Axis は明示選択時のみ、Engine §9.1 / CND-001）。

Dual Axis 採用時の制約候補:

- 両 Y 軸の 0 基線を同期
- スケールを明示
- 軸の意味を明示
- 誤認を誘発する自動スケールを禁止
- 同期不能なら Dual Axis を破棄し Small Multiples へ

---

## 7. Graph Constitution（採用ルールの明文化）

Graph Constitution は、

«「この目的とデータ構造なら、どのグラフを採用するか」»

を明文化する。

これは「絶対的な美学」ではなく、SUGUDASU Graph が採用する決定ルールである。

初期マトリクス（仮説 · Engine の Pattern / RLE で精緻化）:

| User Intent | Data Structure | Primary Graph |
|-------------|----------------|---------------|
| 比較 | カテゴリ × 数値 | 棒 |
| 推移 | 時系列 × 数値 | 折れ線 |
| 割合 | 構成比 | 100%積み上げ / 適切な構成比表現 |
| 順位 | 順序 × 数値 | 横棒 |
| 相関 | 数値 × 数値 | 散布図 |
| 内訳 | カテゴリ × 構成 | 積み上げ等 |

### Practice ≠ Recommendation

IR 実務で多用される表現と、SUGUDASU が推奨する表現は一致しないことがある。

例:

- Dual Axis（実務多用）≠ Small Multiples（推奨原則）
- Donut / Pie（実務多用）≠ Bar（比較精度優先の推奨）

«Observed Graph ≠ Recommended Graph» を明示的に保持する。  
IR を「正解グラフ集」にしない（[IR_CORPUS_SPEC.md](./IR_CORPUS_SPEC.md) §5）。

---

## 8. Graph Selection is not Free-form Chart Making

最初からユーザーに大量のグラフ種類を選ばせない。

棒 · 折れ線 · 円 · 散布図 · レーダー · 面 · 複合… を並べるのではなく、

«何を伝えたいですか？» の Intent 選択から開始する。

専門知識を持たないユーザーを救うことが目的だからである。

---

## 9. 確認 UI の規律

確認 UI は境界 B のための最小インタフェースである。

確認が多すぎれば、

«「迷わず 3 分で終わる」»

という SUGUDASU の価値を壊す。

したがって実データで、

«何 % の入力で確認が必要になるか»

を測定する。

Engine Corpus（100 cases）の旧「58% / 27% / 15%」表記は **軸混同** だった（CONVERTIBLE を人間確認桶に入れていた）。訂正の正本は [`GRAPH_DETERMINISTIC_ENGINE.md`](./GRAPH_DETERMINISTIC_ENGINE.md) §4 · [`GRAPH_RULES_ARCHITECT_REVIEW.md`](./GRAPH_RULES_ARCHITECT_REVIEW.md)。

- CONVERTIBLE = 原則 auto_deterministic（確認が要る変換は別カタログ・**未明確 U-02**）
- CONDITIONAL = needs_confirmation
- 再集計％は **未解決（U-01）**。確認 UI 発生率は実測する。

«85% 以上は一意決定または 1 回程度の確認» は仮説のまま。実装 KPI にしない。

---

## 10. Reproducibility

«同じ入力 + 同じ User Intent → 同じ Decision → 同じ Graph Structure»

を保証する。

「毎回なんとなく違うグラフを生成する AI」ではなく、

«同じ表・同じ目的なら、毎回同じグラフになる»

ことをプロダクト特性とする。技術仕様であると同時に UX 上の信頼性である。

---

## 11. Rule Engine Design Principle

ルール追加によって既存ルールが壊れないことを重視する。

各ルールは少なくとも以下を持つ。

| フィールド | 意味 |
|------------|------|
| Rule ID | 一意 ID（例: RLE-001） |
| Condition | 発火条件 |
| Intent | 対象 Intent |
| Required Structure | 必須構造 |
| Forbidden Structure | 禁止構造 |
| Priority | 衝突時順位 |
| Decision | 出力 |
| Explanation | 説明可能理由 |
| Test Cases | fixture 参照 |

優先順位レイヤ（衝突時）:

1. Hard Constraint
2. Compatibility Rule
3. Recommendation Rule
4. Fallback

「後から if 文を足していく」構造にはしない。

推薦結果の追跡チェーン:

```text
Input Structure
  → Detected Features
  → Intent
  → Matched Rule ID
  → Decision
  → Reason
  → Exceptions
  → Graph Specification
```

機械可読正本は将来 `GRAPH_RULES.yaml`（または JSON）。本 Markdown は人間向け憲法・根拠。

---

## 12. Regression Test

Decision Engine は 100% 再現性を要求するため、回帰テストをプロダクトの一部として設計する。

```text
fixtures/
  case-001.json
  case-002.json
  ...
```

各ケース:

- Input Table
- User Intent
- Expected Structure Classification
- Expected Decision State
- Expected Graph Type
- Expected Transformation
- Expected Explanation
- Matched Rule ID（可能な場合）

初期目標: «100〜300 ケース程度の代表ケース»

正解を開発者の主観だけで決めない。根拠候補:

1. Data Visualization 研究
2. HCI / 認知心理学
3. 統計・可視化の一般原則
4. IR 実務の実例（Observed · 絶対正解ではない）
5. 実務ユーザーテスト
6. 専門家レビュー

Rule 変更時は既存 Corpus への影響を確認してから採用する（Engine §20）。  
«見た目を改善するために決定論を壊す» ことを禁止する。

---

## 13. Accessibility / Visual Safety（Constraint）

Graph 生成時に Constraint として検証する候補:

- 0 基線
- 軸スケール
- 凡例可読性
- ラベル長 · カテゴリ数
- 色だけに依存しない識別
- 3D Graph 禁止
- 過度な装飾禁止

Contrast ratio 等の具体閾値は、採用するアクセシビリティ基準と実装仕様を確定した後に固定する。未検証の数値をルールとしてハードコードしない。

---

## 14. Engineering Principle

### MUST

- Browser-only
- Non-Send
- Deterministic
- Testable
- Reproducible
- Explainable
- Intent-first
- Structure-first（Observable）
- Transformation と Decision の分離
- Decision と Style の分離
- MISMATCH を正常結果として扱う
- 判断不能なものを勝手に推測しない
- 同一入力 → 同一結果
- ルールをテスト可能にする
- 元データを変換で破壊しない

### MUST NOT

- LLM API を Decision Engine に組み込む
- Server-side data processing（ユーザー業務データ）
- hidden semantic inference
- random recommendation
- untested rule addition
- arbitrary chart recommendation
- 外部 AI にユーザーデータを送る
- グラフを「それっぽさ」で生成する
- IR 資料の見た目をそのまま模倣する
- 開発者の主観を暗黙のルールにする
- 「AI ならできる」という理由で仕様を拡張する
- UI 都合で Decision Rule を変える

---

## 15. 重要な未解決問題（仕様確定ではなく検証対象）

### 15.1 User Intent の分類

6 分類で十分か。実ユーザー語彙を調査する。Engine の 12 Intent は研究 taxonomy であり、UI 露出 Imply ではない。

### 15.2 曖昧なデータ

A / B / C はカテゴリか順位か。プログラムが決定できない場合、

- 確認する
- 安全なデフォルトを使う
- 複数候補を提示する

のどれが最も速いかを検証する。

### 15.3 確認 UI の発生率

§9 参照。測定必須。

### 15.4 CONVERTIBLE の境界

特に構成比 · 順位 · 増減率 · 累積 · 平均について、自動変換可能とユーザー確認必要を明確に分ける。

### 15.5 2軸グラフ

§6 参照。Decision Engine だけで完結させず、ユーザー判断を残す可能性が高い。

---

## 16. Cursor / 実装者への固定メッセージ

Cursor は以下を勝手に変更してはならない（IR_CORPUS §25 と整合）。

- User Intent を起点にする
- Data Structure を検査する（Observable のみ）
- Decision を決定論的にする
- 境界 A/B/C を潰して「全部自動」にしない
- Non-Send / Local-First を維持する
- Practice と Recommendation を混同しない

次フェーズの正しい順序:

1. Rule Schema（`GRAPH_RULES.yaml`）へ落とし込む
2. Corpus / fixtures を Regression Test にする
3. TSV → Structure → Intent → Rule ID → State → Graph Type を検証
4. その後に Rendering / UI

Graph 描画 UI を先に作らない。
