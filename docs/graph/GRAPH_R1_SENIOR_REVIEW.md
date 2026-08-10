# SUGUDASU Graph — R1 シニア3役レビュー（固定）

**Date:** 2026-08-08  
**Roles:** UI/UX · CTO · CPO  
**Verdict:** **GO 継続。R2 HOLD。次は Output Acceptance（機能追加ではない）。**

---

## 総合判定

| 観点 | 判定 | 要点 |
|------|------|------|
| UI/UX | GO | 編集 UI を作らない。品質基準は「編集しなくても貼れる」 |
| CTO | GO | Observable→…→Renderer 境界維持。`matched_rule_id` / Intent 非参照を維持 |
| CPO | GO · R2 HOLD | 次はグラフ種別増ではなく **貼った後の実務検証** |

成功条件（固定）:

> **描画できた ≠ 成功**  
> **Excel コピーから約3分以内に、実務資料にそのまま貼れる = 成功**

貼ってから「読めない」で手戻りすると3分は壊れる。  
Slides+SVG は貼付側で直せないので、**一発で使えるデフォルト**が本命。  
手戻りを編集UIで吸収しない（データ / Intent / スロット → 再出力まで）。
---

## 1. UI/UX — 編集機能を作らない

ユーザーが欲しい流れ:

```text
Excel をコピー → SUGUDASU に貼る → グラフができる → Slides/PPT に貼る
```

欲しくない流れ:

```text
SUGUDASU でグラフを細かくデザインする
```

### R1 で入れないもの（禁止）

- 色変更 UI
- 線幅変更 UI
- 凡例編集
- 軸ラベル編集
- ドラッグ編集
- グラフエディタ
- テーマエディタ

品質基準は「編集できないこと」ではなく:

> **編集しなくても、そのまま資料に貼れる**

特に **Google Slides / PowerPoint 2019 への SVG 貼付は、貼ったあと図を直せない**（PPT2019 は観測）。  
そのため余白・ラベル・線幅などのデフォルト欠陥は、編集UI需要ではなく **出荷品質の欠陥** として重要度が上がる。  
「PPTなら直せる」は一般解にしない。

ただし心情として **「貼ってから PPT で微調整できるのが一番」** は認める（理想・二次価値）。  
一次解はそれでも **一発で読めるデフォルト**。理想を理由にデフォルト品質を後回しにしない。  
SUGUDASU 内の字号・色エディタで微調整を代替しない。

加えて実務では SVG が **比率縮小**され、よくある **左グラフ・右コメント** で半面幅になる。  
デフォルト品質はフルブリード前提ではなく、**縮小・半面でも読める字号・線・余白**を基準にする。  
プレゼン作者が「項目名・目盛をもっと大きく」と思うなら、まず **デフォルトを上げる**（字号スライダーUIは作らない）。

さらに未決: 汎用 640×360 のまま耐性を上げるか、**配置スロットに合わせて出力サイズ自体を決めるか**（Gap C · 裁定待ち）。  
自由サイズUIは Editor 寄り。プリセット少数は Presentation Settings 候補。

達成/乖離（Gap B）も未決だがニーズは明確: **IR に限らず社内資料でも一次情報**。単色ベタ塗りは視認性が弱い。  
目標列があるときのデフォルト表現と、目標が無いときの「嘘の達成色」は分ける（後者は禁止）。

---

## 2. CTO — アーキテクチャ境界を維持

```text
Observable → Decision → Graph Spec → Validator → Renderer → SVG/PNG
```

Renderer は次を見ない（維持必須）:

- `matched_rule_id`
- `intent`
- `RLE-*`

Renderer の問い:

> 「この Spec をどう描画するか」

Renderer の問いではない:

> 「これは何のデータなのか」

Rule 変更が Renderer を巻き込まない構造を崩さない。

---

## 3. CPO — R2 より「貼った後」を検証

今は早い:

- Waterfall / Scatter / Donut を増やす

先に検証する:

> **Output Constitution が PowerPoint / Google Slides / Keynote 貼付で成立するか**

### Acceptance 評価軸（これ以外を増やさない）

| 評価 | 合格条件 |
|------|----------|
| 貼り付け | そのまま貼れる |
| 拡大縮小 | 崩れない |
| 文字 | 読める |
| 線 | 細すぎない |
| 色 | 意味が識別できる |
| 軸 | 何を示しているか分かる |
| 単位 | 誤解を生まない |
| 凡例 | 必要な場合だけ存在 |
| 余白 | スライドに置きやすい |
| 編集 | **編集しなくても完成品** |
| 時間 | Excel コピーから 3 分以内 |

### 品質指標にしないもの

- SVG の編集可能性（一次価値ではない）

| 層 | 価値 |
|----|------|
| 一般ユーザー（一次） | 編集せずそのまま使える |
| デザイナー（二次） | SVG を後加工できる |

---

## 4. 次工程（固定）— R1 Output Acceptance Test

機能追加ではなく、実データでの貼付検証。

```text
Excel/TSV
 → Observable → Decision → Spec → Validator → R1 Renderer
 → SVG
 → PowerPoint / Google Slides / Keynote
 → 「そのまま資料に使えるか」
```

### ケース方針（10〜20）

頻出実務:

- 売上推移
- 営業利益推移
- 部門別売上比較
- 商品別比較
- 年度別比較

詳細・記録フォーマット: [`GRAPH_R1_OUTPUT_ACCEPTANCE.md`](./GRAPH_R1_OUTPUT_ACCEPTANCE.md)

### 学習ループ

「貼ったあとに人間が直したくなる箇所」を記録する。

その数が一定出たとき初めて問う:

1. 編集機能が必要なのか
2. **Renderer のデフォルト品質が足りないだけなのか** ← **先に疑う**

現設計思想では後者を優先する。

> **Graph Editor を作らない。Graph Renderer の品質を上げる。**

これが「3分で終わる」と整合する。

---

## 5. やらないこと（このフェーズ）

- R2 / R3 type 実装
- 編集 UI / テーマエディタ
- 判断系の再設計
- LLM
- 「SVG 編集可能性」を KPI 化

---

## 関連

- Constitution: [`PRESENTATION_OUTPUT_CONSTITUTION.md`](./PRESENTATION_OUTPUT_CONSTITUTION.md)
- Status: [`GRAPH_STATUS_GATE.md`](./GRAPH_STATUS_GATE.md)
- Acceptance: [`GRAPH_R1_OUTPUT_ACCEPTANCE.md`](./GRAPH_R1_OUTPUT_ACCEPTANCE.md)
