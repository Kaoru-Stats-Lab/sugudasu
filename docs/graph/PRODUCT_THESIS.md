# SUGUDASU Graph — Product Thesis

**Status:** Design Foundation  
**Role:** Why / Pain / Positioning / Anti / Success（Decision の詳細は [DECISION_CONSTITUTION.md](./DECISION_CONSTITUTION.md)）  
**更新:** 2026-08-08  
**索引:** [README.md](./README.md)

«AIではなく、決定論的なプログラムとして実装する»

---

## 1. 解決する問題

実務で「グラフを作りたい」とき、ユーザーが本当に困っているのは、グラフ描画そのものではない。

多くの場合、入力はすでに Excel や Google スプレッドシートに存在する。

ユーザーは、

- Excel / Google Sheets で表を作る
- その表を PowerPoint 等に持っていきたい
- しかし、どのグラフが適切なのかわからない
- Excel のグラフ機能を触って、それっぽいものを作る
- 「これでいいのか」がわからない
- 必要なら検索やブログ、AI に「こういうグラフはどう作る？」と聞く

という状態にある。

本質的な問題は、

«「グラフを描けない」のではなく、「表から目的に合ったグラフ形式を選べない」»

ことである。

SUGUDASU Graph は、この「グラフ選択の作法」をプログラムとして肩代わりする。

### 検証すべき仮説（最重要）

«「Excel でグラフを作ることが難しい」のではなく、「何を伝えたいかに対して、どのグラフを使えばよいかを決めることが難しい」»

Excel にはすでに多数のグラフ作成機能がある。それでも折れ線 / 棒 / 積み上げ / 100%積み上げ / 2軸 / 散布図 / 円 / 複合で迷う。

肩代わりするのは Excel の描画機能ではなく「作法の選択」である。

---

## 2. User Intent First

SUGUDASU Graph は「どんなグラフを作れるか」から始めない。

最初に、

«何を伝えたいのか»

を起点とする。

### 初期 Intent 候補（仮説 · 永久固定ではない）

| Intent（ユーザー向け） | 意味の目安 |
|------------------------|------------|
| 比較したい | カテゴリ間の大小 |
| 推移を見せたい | 時間に沿った変化 |
| 割合を伝えたい | 全体に対する比率 |
| 順位を見せたい | 順序づけられた比較 |
| 相関を見たい | 2数値の関係 |
| 内訳を見たい | 全体と部分の同時提示 |

これは「グラフの種類」を選ばせる UI ではない。

ユーザーが「折れ線グラフ」「棒グラフ」「散布図」などの専門用語を知らなくても、

«「何を伝えたいですか？」»

から適切な表現形式へ導く。

実ユーザーが実際にどの言葉を使うかは、[IR_CORPUS_SPEC.md](./IR_CORPUS_SPEC.md) の Real User Corpus と Prototype Validation で検証する。

Engine 側の拡張 Intent taxonomy（IR 実務由来）は [GRAPH_DETERMINISTIC_ENGINE.md](./GRAPH_DETERMINISTIC_ENGINE.md) §2 を参照。UI に全部出さない。

---

## 3. 「グラフを教える」プロダクト

SUGUDASU Graph は単なる Chart Generator ではない。

大学や実務では、

«「推移を強調して見せたいなら折れ線グラフ」»

のようなグラフ作法が、講義・先輩・上司・同僚などから口伝的に伝わっている。機会がなかった人もいる。

SUGUDASU Graph は、その作法をプログラムとして提供する。

重要なのは、

«AI が賢く推測することではなく、グラフの作法を決定論的なルールとして教えること»

である。

### 教育的価値の例

Intent「推移を見せたい」が選ばれた場合:

```text
時間の順序を見せる
  ↓
時間軸が必要
  ↓
今回の表には年度列がある
  ↓
推移として扱える
  ↓
折れ線グラフを推奨
```

«SUGUDASU がグラフを作るだけでなく、なぜそのグラフなのかを教える。»

これが Excel の「おすすめグラフ」と異なる可能性のある価値である。説明文は LLM 生成ではなく、Decision Engine の理由コードから決定的に生成する。

---

## 4. AI を使わない理由（Core）

SUGUDASU Graph は AI による意味理解・生成を目的としない。

| 理由 | 効果 |
|------|------|
| 同じ入力に対して同じ結果を返す | Reproducibility |
| 判断理由を説明できる | Explainability |
| 回帰テストできる | Testability |
| ローカル完結できる | Browser-only |
| データを外部へ送らない | Non-Send |
| 通信障害に依存しない | Reliability |
| AI API 費用に依存しない | Cost |
| 「なぜこのグラフになったか」を仕様として固定できる | Spec freeze |

したがって、

«SUGUDASU Graph = AI によるグラフ提案ではなく、ルールベースの可視化決定プログラム»

と位置づける。

技術的ラベル:

«Deterministic Visualization Decision Engine»

既存研究に LLM / GVAE / 機械学習推薦があることは、SUGUDASU が AI を採用する理由にならない。詳細は [RESEARCH_PRIOR_ART.md](./RESEARCH_PRIOR_ART.md)。

「LLM 不要」は将来の全機能禁止ではない。Core Decision Engine に決定権を持たせない補助レイヤーのみ検討対象（Engine §15）。

---

## 5. Main Input

典型的な入力は Excel / Google Sheets の表のコピー＆ペーストである。

例:

```text
年度	売上	利益
2022	120	20
2023	145	28
2024	170	35
2025	190	42
```

または:

```text
事業部	売上
A事業部	120
B事業部	180
C事業部	90
```

Excel に関数が入っていても、コピー時には基本的に表示値を取得できる。

実務の表には、年・月・事業部名・商品名・担当者名・地域・金額・件数・比率など、グラフ化に必要な「構造を示す手掛かり」が自然に含まれることが多い。

一方で曖昧さも存在する。

- 単位が書かれていない
- 「売上」なのか「売上高」なのか明示されていない
- 2024 が年度なのか単なる数値なのかわからない
- A / B / C に順序があるのかないのかわからない

この曖昧さを「AI で意味理解して解決する」のではなく、機械的に確定できる範囲と、確定できない範囲を分離する → [DECISION_CONSTITUTION.md](./DECISION_CONSTITUTION.md) § Deterministic Boundary。

IR PDF / 画像からの数値逆算は入力経路にしない（[IR_CORPUS_SPEC.md](./IR_CORPUS_SPEC.md) §3）。製品入力は TSV 貼り付けを基本とする。

---

## 6. Copy First（出口）

SUGUDASU の既存思想に従い、

«作ったグラフをそのまま使える»

ことを重視する。

候補: SVG · PNG · Clipboard API · html-to-image。

特に PowerPoint 等への貼り付けを想定する。

重要なのは、

«「ファイルをダウンロードさせる」»

よりも、

«「できたグラフをコピーして、資料に貼る」»

という出口である。

基本思想:

«作る → 確認する → PowerPoint 等へ持っていく»

インタラクティブ性を増やすこと自体を目的にしない。

---

## 7. Style は Decision と分離する

| Layer | 含むもの |
|-------|----------|
| Decision | Chart Type · Axis · Encoding · Series · Transformation |
| Style | Color · Font · Size · Line · Layout |

«何のグラフにするか» と «どういう見た目にするか» を混同しない。

ブランドカラーや PowerPoint 向けトンマナは、Decision Engine の正しさとは別レイヤーで扱う。

---

## 8. やらないこと

- LLM による意味理解
- AI による自由なグラフ生成
- 勝手なデータ解釈
- 勝手なデータ補完
- 勝手な意味変換
- 無限種類のグラフ提供
- Excel の完全代替
- PowerPoint の完全代替
- 高度な BI ダッシュボード
- サーバーへのデータ送信
- ユーザーアカウント必須化
- IR 資料の直接解析・模倣 AI
- 「見た目を改善するために決定論を壊す」こと

---

## 9. 特に避けるべき思想

### 「AI に聞けばいい」を置き換えない

競合が AI だから AI で対抗する、という発想を取らない。

### 「Excel のグラフ機能を Web で再現する」でもない

グラフの種類を大量に提供することが目的ではない。最初から棒・折れ線・円・散布図・レーダー・面・複合…を並べない。

### 「何でも自動化する」でもない

決定できないことは決定しない。確認 UI は逃げ道ではなく、発生率を測って最小化する対象である。

---

## 10. MISMATCH Philosophy（製品価値）

MISMATCH は失敗ではない。

例: Intent「割合を見せたい」× 満足度 1〜5 × 人数。

無理に円グラフを生成して「完成」とするより、

«「このデータは満足度の分布を示すデータです。構成比として表示するには、人数から割合を計算できます。」»

のように、何ができ何ができないかを説明する。

適切なグラフを作らないことも成功である。

詳細状態モデルは [DECISION_CONSTITUTION.md](./DECISION_CONSTITUTION.md) および Engine §18。

---

## 11. Success Metric

最初から「美しいグラフ」を KPI にしない。

重要なのは、

«ユーザーが目的に合ったグラフを、迷わず、短時間で作れること»

候補:

| Metric | 見るもの |
|--------|----------|
| Paste → Graph までの時間 | 実務3分適合 |
| Intent 選択の迷い | 語彙の自然さ |
| 確認 UI 発生率 | 逃げ道化していないか |
| MISMATCH 理解率 | 「作れない説明」が価値になっているか |
| Graph 変更率 | 初回推奨の妥当性 |
| Copy 成功率 | 出口 |
| 「これでいい」と判断できる率 | 属人不安の解消 |

性能のハード数値（例: 10ms）はベンチマーク完了まで仕様保証にしない。

---

## 12. Product Positioning

SUGUDASU Graph は、

«Excel からグラフを作るツール»

ではない。

より正確には、

«「何を伝えたいか」から、適切なグラフの作法を教えてくれるツール»

である。

| 層 | 表現 |
|----|------|
| 技術 | Deterministic Visualization Decision Engine |
| ユーザー価値 | 「グラフの選び方がわからない」を終わらせる |
| 差別化 | 同じ表・同じ目的なら、毎回同じグラフになる |

---

## 13. One-line Thesis

候補（長め）:

«SUGUDASU Graph は、Excel の表を貼り付け、「何を伝えたいか」を選ぶだけで、グラフの作法に沿った表現を決定論的に作る。»

短縮:

«表を貼る。目的を選ぶ。グラフが決まる。»

Constitution 級の一文:

«グラフ作成の難しさは、描画ではなく選択にある。»

---

## 14. Final Design Principle（Thesis 側）

核心は、

«「AI がデータを理解してグラフを考える」ことではない。»

そうではなく、

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

そして、

«決められないものは、決められないと扱う。»

最終的な価値は、

«「同じ表・同じ目的なら、毎回同じグラフになる」»

という再現性にある。これは AI 時代における重要な差別化要素である。

---

## 15. Validation Agenda（Thesis 検証）

思想を文章だけで精緻化するのではなく、以下を検証する。

### A. User Research

対象: «グラフ作法を体系的に学んでいない実務者»

確認すること:

- 「比較したい」「推移を見せたい」等の言葉が自然か
- 「割合」「内訳」「相関」が理解されるか
- Excel で普段どのようにグラフを作っているか
- どこで迷うか
- Excel のおすすめグラフを使うか
- Google 検索するか / AI に聞くか
- 2軸グラフで何に困るか

### B. Prototype Validation

紙芝居または低精度 Prototype で最低限検証する。

1. Intent 選択
2. Excel 貼り付け
3. Decision 結果
4. MISMATCH
5. CONDITIONAL
6. 2軸グラフ
7. Copy

コーパス側の Phase 順序は [IR_CORPUS_SPEC.md](./IR_CORPUS_SPEC.md) §26。
