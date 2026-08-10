# SUGUDASU Graph — IR 資料を用いた実務コーパス設計

**Status:** Design Reference  
**Role:** Decision Engine · Graph Constitution · Regression Test を設計するための研究・検証資料仕様  
**更新:** 2026-08-08  
**索引:** [README.md](./README.md)  
**憲法:** [DECISION_CONSTITUTION.md](./DECISION_CONSTITUTION.md) · [PRODUCT_THESIS.md](./PRODUCT_THESIS.md)

«IR 資料を「AI 学習データ」として扱うのではなく、実務上存在する「目的 × データ構造 × グラフ表現」の実例コーパスとして利用する。»

---

## 1. この文書の目的

SUGUDASU Graph が目指すもの:

«Excel / Google Sheets 等の表を貼り付け、「比較したい」「推移を見せたい」「割合を伝えたい」「順位を見せたい」「相関を見たい」「内訳を見たい」という User Intent から、適切なグラフ形式を決定し、再現可能なグラフを生成すること。»

ここで重要なのは、SUGUDASU Graph が「AI にグラフを考えさせる」プロダクトではないことである。

パイプライン:

```text
User Intent → Data Structure Inspection → Deterministic Decision → Graph
```

同じ入力、同じ Intent、同じルールバージョンであれば、原則として同じ Graph Constitution が選択される。

この設計思想を実務上の資料で検証するため、IR 資料を研究コーパスとして利用する。

### 固定する位置づけ（重要）

| やる | やらない |
|------|----------|
| IR を作法検証のコーパスにする | IR 資料を SUGUDASU Graph が直接解析する |
| Observed Practice を記録する | IR グラフを「正解」としてコピーする |
| Structure × Intent × Encoding を突合する | Graph 画像から元データを逆算して学習する |
| Deterministic 推薦の裏付けに使う | LLM · GVAE · AI 推奨エンジン採用の根拠にする |

Deep Research に「LLM＋Draco＋GVAE ハイブリッドが有効」とあっても、それは一般的な高度可視化 AI のアーキテクチャ論であり、SUGUDASU の勝ち筋ではない。持ち込まない。

---

## 2. IR 資料を使う理由

IR 資料は研究対象として適している。理由は単純である。

### 2.1 「数字」と「伝え方」がセットになっている

企業の IR 資料には、売上高 · 営業利益 · 利益率 · 前年比 · 四半期推移 · セグメント別数値 · 構成比 · KPI · 実績と予想 · 地域別・事業別内訳などの実データがある。

同時に、棒 · 折れ線 · 積み上げ · 100%積み上げ · 円／ドーナツ · 複合 · 2軸 · Small Multiples などで「どう伝えるか」も示されている。

つまり IR には、

«データ構造 → 伝えたいこと → 実際に採用された視覚表現»

の実例が大量に存在する。

---

## 3. 重要：IR 資料からグラフを逆算しない

完成したグラフ画像から元データを推測することを主たる研究方法にはしない。

理由: IR グラフには軸の切断 · 2軸 · 累積表示 · 丸め · 単位省略 · 注記 · 強調 · 予想と実績の表現差 · デザイン上の省略などが存在する。

したがって、

«Graph → 元データ»

の逆算には不確実性が残る。

これは SUGUDASU の

«推測しない · 同じ入力なら同じ結果 · 説明可能である»

と相性が悪い。

製品入力経路も同様に、PDF / Image Extraction を主経路にしない。基本は Excel / Spreadsheet → TSV Copy & Paste（Engine §10.1）。

---

## 4. 推奨する IR コーパスの基本単位

可能な限り、以下のペアを取得する。

### A. 元データ側

- 決算短信
- 有価証券報告書
- XBRL 等の構造化財務データ
- 決算説明資料内の数値表

### B. 表現側

- 決算説明資料
- 決算説明会資料
- 業績説明資料

同一企業 · 同一期間 · 同一指標で対応させる。

理想的な研究単位:

```text
Source Data
  ↓
Data Structure
  ↓
Business / Communication Intent
  ↓
Actual Graph Type
```

---

## 5. 「正解データ」とは呼ばない

IR で実際に使われたグラフを、そのまま

«正しいグラフ»

と定義してはいけない。

IR 担当者やデザイン会社の表現は、企業独自表現 · ブランド都合 · 投資家向け慣習 · 強調メッセージ · デザイン制約を含む。

したがって IR コーパスは、

「グラフの正解集」ではなく「実務上の選択例（Observed Practice）」

として扱う。

Graph Constitution は、これらの実例に加えて、

- Data Visualization 研究
- HCI
- 認知心理学
- 統計的可視化の原則
- アクセシビリティ
- 実務者テスト

を組み合わせて定義する。

«Observed Graph» と «Recommended Graph» の分離は [DECISION_CONSTITUTION.md](./DECISION_CONSTITUTION.md) §7 · Engine §9 · §21。

---

## 6. IR コーパスから取得する情報

各ケースについて、可能な限り以下を記録する。

| 項目 | 内容 |
|------|------|
| Case ID | 一意なケース ID |
| Source | 企業 · 資料 · 年度 · ページ |
| Input Data | 元となる表データ |
| Column Names | 列名 |
| Row Labels | 行ラベル |
| Data Types | 数値 · 文字列 · 日付等 |
| Temporal Structure | 時系列の有無 |
| Category Structure | カテゴリ構造 |
| Measures | 数値系列 |
| Unit | 円、%、人、件等 |
| User Intent | 推定される伝達目的 |
| Actual Chart | 実際に使用されたグラフ（Observed） |
| Chart Constitution | グラフの構造 |
| Transformation | 増減率 · 構成比等の計算 |
| Notes | 特殊事情 |

重要なのは、Graph Type だけではなく Data Structure を保存すること。

検証済み 100 cases の Tier 定義と結果要約は Engine §1。

---

## 7. User Intent の扱い

初期 Intent 候補（UI 仮説）:

1. 比較したい
2. 推移を見せたい
3. 割合を伝えたい
4. 順位を見せたい
5. 相関を見たい
6. 内訳を見たい

この 6 分類を永久に固定する必要はない。

IR コーパスは、

«「実際にどのような目的が頻繁に存在するか」»

を検証するためにも使用する。

Engine 側の 12 Intent（Core + IR Practice）は研究 taxonomy。UI に全部露出する前提ではない。

---

## 8. 「グラフを作る」ことより重要な問題

核心は Excel からグラフを作ることではない。

本質は、

«ユーザーがやりたいことと、入力された表の構造を対応させること»

である。

例:

| Intent | Data | 扱い |
|--------|------|------|
| 推移を見せたい | 年度 × 売上 | MATCH · 折れ線候補 |
| 推移を見せたい | 部署 × 売上 | MISMATCH · 時間軸なし |

単純に折れ線を生成してはいけない。Intent と Data Structure の整合性検査が価値である。

---

## 9. Decision State（コーパス記録用）

Graph Decision では MATCH · CONVERTIBLE · CONDITIONAL · MISMATCH · **NO_MATCH** を持つ。定義の正本は [DECISION_CONSTITUTION.md](./DECISION_CONSTITUTION.md) §4 · [`GRAPH_RULES.json`](./GRAPH_RULES.json)。

コーパス各ケースには Expected State を付与し、Regression fixture 候補にする。

---

## 10. 「意味理解」を必要以上にしない

検査対象は、可能な限り観測可能な構造に限定する。

一方、

- Aランク/Bランク/Cランクに本当に順序があるか
- 2つの指標を同じグラフで比較する意味があるか

などはデータだけでは決定できない場合がある。

その場合は、

«決定しない。確認する。»

これを「AI なしで何でも自動判定する」ことより優先する。

---

## 11. CONVERTIBLE の境界

事業 A/B/C の売上に対し Intent「割合を見たい」がある場合、構成比の自動計算は数学的に可能。

しかし、

«ユーザーが「売上額そのもの」を見たいのか、「構成比」を見たいのか»

は別問題である。

数学的に計算できること と ユーザーの意図に従って変換してよいこと を分離する。

---

## 12. 2軸グラフは特別扱いする

2軸は重要な研究対象。「実数と割合を一つのグラフで見たい」は Excel 操作コストが高い。

ここは「Excel の操作方法を教える」のではなく、Graph Constitution として肩代わりする候補領域である。

ただし「2軸にする意味がある」を完全自動化する必要はない。機械的条件と人間確認を分離する（Decision Constitution §6）。

---

## 13. IR コーパスの最大の価値

学ぶべきなのは「この会社は棒を使った」という表面ではない。

重要なのは、

```text
Data Structure
  ↓
Communication Intent
  ↓
Visual Encoding
```

の対応関係である。

例パターン:

| Structure | Intent | Encoding |
|-----------|--------|----------|
| 時間 × 数値 | 推移 | 折れ線 |
| カテゴリ × 数値 | 比較 | 棒 |
| カテゴリ × 構成比 | 内訳 / 割合 | 100%積み上げ等 |
| 時間 × 実数 + 時間 × 割合 | 同一時間軸 | 複合 / 2軸候補 |

---

## 14. 既存研究との位置づけ（要約）

SUGUDASU Graph は既存の可視化推薦研究の系譜に位置づけられる。

«採用すべき技術» と «設計思想を検証するための研究資料» を区別する。詳細は [RESEARCH_PRIOR_ART.md](./RESEARCH_PRIOR_ART.md)。

---

## 15. AI を採用しないことについて

既存研究に LLM や機械学習を使ったシステムがあることは、SUGUDASU が AI を採用する理由にならない。

目的は完全ローカル · Non-Send · 再現性 · 説明可能性 · テスト可能性 · 低遅延 · 3分以内 · 同じ入力なら同じ結果である。

Decision Engine の中核は決定論的ルールで構築する。AI は必要条件ではない。

---

## 16. OSS 調査の利用方針（要約）

| Layer | Reference（候補） |
|-------|-------------------|
| Input Parsing | PapaParse |
| Data Processing | Arquero |
| Visualization Recommendation | CompassQL |
| Visualization Constraints | Draco |
| Chart Knowledge | AntV AVA |
| Declarative Visualization | Vega-Lite |
| Rendering | ECharts 等 |
| Image Export | html-to-image 等 |
| Regression Test | Vitest / Jest |
| CI | GitHub Actions |

「OSS があるから採用する」のではなく、Constitution 適合を先に判断する。サーバー送信 · 外部 API · AI API 依存は Non-Send と衝突し得る。

---

## 17. Regression Test への接続

IR コーパスは最終的に Regression Test の候補にもなる。

例:

**Case 001** — Intent 推移 · 年度×売上 → MATCH · Line  
**Case 002** — Intent 推移 · 部署×売上 → MISMATCH  
**Case 003** — 事業×売上×利益率 · 実数と割合を同時に → CONDITIONAL / 2-axis candidate

このケース群を fixture として保存する。Engine の 100 cases が当面の Ground Truth 候補。

---

## 18. 「正解」の決め方

Regression の Expected Result は開発者の美意識だけで決めない。

根拠候補:

1. Data Visualization 研究
2. HCI / 認知心理学
3. 統計 · 可視化の一般原則
4. IR 実務の実例
5. 実務ユーザーテスト
6. 専門家レビュー

IR はその中の一つであり、絶対的な正解ではない。

---

## 19. IR コーパスの限界

### 19.1 財務データに偏る

売上 · 利益 · KPI · セグメントが中心。アンケート · 人員 · 工数 · 在庫 · 工事進捗 · 顧客属性 · 品質管理等とは異なる。

### 19.2 プロが作ったデータ

グラフ作法を知らないユーザーが作ったものではない。「初心者がどこで困るか」を直接検証する資料にはならない。

### 19.3 曖昧な入力データを十分に含まない

実 Excel の文脈依存ラベル（前年比 · 実績 · 計画 · A事業部…）の曖昧性は IR だけでは十分に検証できない。

---

## 20. したがって研究は二つに分ける（最重要の二分）

### Corpus A：IR Corpus

| 項目 | 内容 |
|------|------|
| 目的 | 「どのデータ構造に、どの可視化が実務上使われているか」を調べる |
| 対象 | 決算資料 · 有報 · 決算説明資料 · XBRL 等 |
| 用途 | Graph Constitution · Decision Matrix · Graph Type taxonomy · Regression · 実務パターン抽出 |

### Corpus B：Real User Corpus

| 項目 | 内容 |
|------|------|
| 目的 | 「グラフ作法を知らない実務者が、実際にどんな表を入力するか」を調べる |
| 対象 | Excel · Google Sheets · 社内資料 · アンケート · 工程 · 売上 · 人員 · 実績等 |
| 用途 | Structure Inspection · Ambiguity · MISMATCH · Confirmation UI · User Intent vocabulary · 実際のエラー／迷い |

**この二つを混ぜない。**

| Corpus | 検証するもの |
|--------|----------------|
| IR | 作法の規範 · Pattern · Practice vs Recommendation |
| Real User | 初心者の入力 · 曖昧性 · UX · 確認発生率 |

---

## 21. 最重要の検証仮説

«「Excel でグラフを作ることが難しい」のではなく、「何を伝えたいかに対して、どのグラフを使えばよいかを決めることが難しい」»

SUGUDASU Graph が肩代わりするのは、Excel の描画機能ではなく「作法の選択」である。

---

## 22. 教育的価値（コーパスから見える物語）

例: Intent「推移を見せたい」→ 時間軸が必要 → 年度列がある → 折れ線推奨、という作法を見せる。

«なぜそのグラフなのかを教える» ことが Excel おすすめグラフとの差になり得る。説明は理由コードから決定的に生成する。

---

## 23. Product Thesis（コーパス文書側の再掲）

- グラフ作成の難しさは、描画ではなく選択にある。
- 人間が毎回判断している「グラフの作法」を、決定論的なルールとして肩代わりする。
- 同じ表・同じ目的なら、誰が使っても同じグラフになる。

正本の展開は [PRODUCT_THESIS.md](./PRODUCT_THESIS.md)。

---

## 24. Research Position

IR を使う目的は、IR を解析する AI を作ることでも、IR グラフを模倣する AI を作ることでもない。

目的は、

«実務で実際に使われている「データ構造 × 伝達目的 × 可視化形式」の組み合わせを収集し、SUGUDASU Graph の決定論的 Graph Constitution を検証すること。»

---

## 25. Cursor 実装時の原則

### MUST

- User Intent を起点にする
- Data Structure を検査する
- Decision を決定論的にする
- 同一入力 → 同一結果
- ルールをテスト可能にする
- Transformation と Interpretation を分離する
- Graph Structure と Style を分離する
- Non-Send / Local-First を維持する
- MISMATCH を正常な結果として扱う
- 判断不能なものを勝手に推測しない

### MUST NOT

- LLM API を Decision Engine に組み込まない
- 外部 AI にユーザーデータを送らない
- グラフを「それっぽさ」で生成しない
- IR 資料の見た目をそのまま模倣しない
- 開発者の主観を暗黙のルールにしない
- 判断不能なデータを勝手に意味付けしない
- 「AI ならできる」という理由で仕様を拡張しない

---

## 26. 今後の検証順序

実装を急がず、以下の順番で検証する。

| Phase | 内容 |
|-------|------|
| 1 | IR から代表的な Data Structure × Intent × Graph Type を収集 |
| 2 | 6 つ程度の User Intent を仮説として分類 |
| 3 | 各 Intent について Graph Constitution を定義 |
| 4 | 100〜300 件程度の Regression Case を作成 |
| 5 | 実務者の Excel / Spreadsheet データを収集（Corpus B） |
| 6 | Ambiguous / MISMATCH / CONDITIONAL の発生率を測定 |
| 7 | 確認 UI をプロトタイプ化 |
| 8 | Decision Engine を実装 |

Engine 現状: Research Complete · Corpus 100 · Initial Rules Defined · Implementation Not Frozen。次は Rule Schema 機械可読化と Regression 実装。

---

## 27. 最終的な設計思想

SUGUDASU Graph は、

«「AI に Excel を渡したら、いい感じのグラフを作ってくれる」»

ものではない。

«「あなたが伝えたいことはこれですね。このデータ構造なら、このグラフが適切です」»

を決定論的に実行する道具である。

Excel や PowerPoint には「描く機能」はすでにある。肩代わりするのは「何をどう見せるか」という作法の判断。

IR 資料は、その作法を実務の大量事例から観察・検証するための重要な Corpus である。ただし IR だけではユーザーの曖昧な入力行動を検証できない。

したがって:

```text
IR Corpus     = Graph Constitution を検証する
Real User Corpus = Structure Inspection と UX を検証する
```

という二層構造で研究・実装を進める。
