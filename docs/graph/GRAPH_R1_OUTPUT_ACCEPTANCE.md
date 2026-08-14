# SUGUDASU Graph — R1 Output Acceptance Test

**Status:** Active（次工程）  
**R2:** HOLD  
**Edit UI:** 禁止  
**Goal:** 「描画できた」ではなく「3分で実務資料に貼れる」を検証する

正本レビュー: [`GRAPH_R1_SENIOR_REVIEW.md`](./GRAPH_R1_SENIOR_REVIEW.md)

### 貼付先ロック（重要 · 確定）

**判定（2026-08-14 · 提督確認）:** SVG は貼付後に編集できない。  
**製品方針:** **編集できない前提でプロダクトを作る。** Office は版が多く、MS-Office と OpenOffice / LibreOffice Impress では挙動が違う。特定版の「図形に変換できる」に依存すると汎用性が落ちる。

| 経路 | 扱い |
|------|------|
| Google Slides + SVG | 編集不可 |
| PowerPoint（買い切り・365・各版）+ SVG | 編集不可として扱う |
| OpenOffice / LibreOffice Impress + SVG | 編集不可として扱う（MS と挙動が違う） |
| Keynote 等 | 同上（環境依存の救済は一次にしない） |
| PNG | 編集不可 |
| 一部環境の「図形に変換」 | **ボーナスのみ** · 合否・一次解に使わない |

したがって文字切れ・ラベル欠け・読めない軸は「あとで直す」前提で合格にできない。一次解は **出力時点で完成**。  
MS 固有機能に合わせた出力最適化より、**どのデッキでも貼って読めるデフォルト**を優先する。

さらに実務では:

- スライド枠に合わせて **比率縮小**される（出力 640×360 のまま見えない）
- **左にグラフ・右にコメント**で、グラフが半面幅になることが多い

→ Acceptance は「フルサイズで読めた」だけでなく、**縮小・半面配置でもカテゴリ名・軸・線が読めるか**を見る。  
データ資料の作者は Slides 上で **項目名・目盛をもっと大きくしたくなる**のが自然。それは編集UI需要ではなく、**デフォルトが細すぎるサイン**として記録する。

### 未決ジャッジ（ChatGPT 裁定対象 · Gap C）

現行デフォルトは汎用 **640×360**。  
縮小前提なら、**PPT / Slides / Impress / Keynote の配置スロット（半面左 / 全面 など）に合わせて canvas・字号を決めて描く**方が正しい可能性がある。

- これはグラフエディタではない（色・線の自由編集ではない）
- 候補は「プリセット少数」または「デフォルトを半面前提に変える」まで
- **理想:** 貼付後に PPT 等で微調整できること（環境依存・二次・当てにしない）
- **一次:** 編集不可前提で一発完成。微調整可能性を合否条件にしない
- **汎用性:** MS 固有挙動より、OpenOffice/LibreOffice を含む広いデッキで読めること
- 裁定プロンプト: [`../prompts/graph-r1-acceptance-gap-judgment-COPYPASTE.md`](../prompts/graph-r1-acceptance-gap-judgment-COPYPASTE.md)

---

## 1. 手順

1. fixture TSV（下表）を用意
2. Intent を指定してパイプライン実行（Observable→Decision→Spec→Validator→R1 Renderer）
3. SVG（必要なら PNG）を出力
4. PowerPoint / Google Slides / Keynote に貼る
5. 評価表を埋める
6. 「直したくなる箇所」を記録（編集機能要望ではなく、まずデフォルト品質ギャップとして扱う）
7. **貼付後に「読めない」で手戻りしたか**も記録する（手戻り回数・理由。編集UI需要と混同しない）

### 手戻り（Acceptance で見る）

```text
作る → 貼る → 可読性不足に気づく → 戻ってやり直す → また貼る
```

これは「3分」を壊す。Slides+SVG は貼付側で直せないので、**一発で使える**が本命。  
手戻りが必要でも許容するのは **データ / Intent / 配置スロット変更 → 再出力** まで。図の中を編集させない。
機械生成（任意）:

```bash
npm run test:graph-renderer
# 手動貼付用 SVG は scripts または一時出力で生成してよい（判断系は変更しない）
```

---

## 2. ケースセット（18 · 拡充可〜20）

| ID | シナリオ | Intent | 期待 R1 type | fixture |
|----|----------|--------|--------------|---------|
| OA-01 | 売上推移（4年） | TREND | Line | `fixtures/acceptance/OA-01-sales-trend.json` |
| OA-02 | 売上推移（3年・短系列） | TREND | Column | `OA-02-sales-trend-short.json` |
| OA-03 | 営業利益推移 | TREND | Line | `OA-03-op-profit-trend.json` |
| OA-04 | 部門別売上比較 | COMPARISON | Bar | `OA-04-dept-compare.json` |
| OA-05 | 部門別売上（順位） | RANKING | Bar | `OA-05-dept-rank.json` |
| OA-06 | 商品別件数比較 | COMPARISON | Bar | `OA-06-product-compare.json` |
| OA-07 | 年度別売上（5年） | TREND | Line | `OA-07-sales-5y.json` |
| OA-08 | 地域別売上比較 | COMPARISON | Bar | `OA-08-region-compare.json` |
| OA-09 | 月次売上（12ヶ月は R1 で可読性確認） | TREND | Line | `OA-09-monthly-sales.json` |
| OA-10 | 四半期売上 | TREND | Line | `OA-10-quarterly.json` |
| OA-11 | 担当者別売上 | RANKING | Bar | `OA-11-owner-rank.json` |
| OA-12 | 費用推移 | TREND | Line | `OA-12-cost-trend.json` |
| OA-13 | 店舗別比較 | COMPARISON | Bar | `OA-13-store-compare.json` |
| OA-14 | 未知単位の推移 | TREND | Line | `OA-14-unknown-unit-trend.json` |
| OA-15 | 短ラベル部門比較 | COMPARISON | Bar | `OA-15-short-label-compare.json` |
| OA-16 | 部門別・実績対目標（マーカー） | TARGET_VS_ACTUAL | Bullet | `OA-16-dept-target-bullet.json` |
| OA-17 | 部門別・実績対目標（並棒） | TARGET_VS_ACTUAL | Grouped_Column | `OA-17-dept-target-grouped.json` |
| OA-18 | 月次売上・一定目標線 | TARGET_VS_ACTUAL | Column | `OA-18-monthly-target-line.json` |

R1.x 目標3型（OA-16〜18）は [`GRAPH_TARGET_REPRESENTATION.md`](./GRAPH_TARGET_REPRESENTATION.md) に固定。Waterfall / Pie / YTD累計は含めない。  
CONDITIONAL は fixture の `confirmation_choice_id` で固定（CND-004）。

機械生成:

```bash
npm run graph:r1-acceptance-export
# → docs/graph/fixtures/acceptance/out/OA-*.svg (+ .png)
```

---

## 3. 評価シート（ケースごと）

| 評価 | Pass? (Y/N) | メモ |
|------|-------------|------|
| 貼り付け | | |
| 拡大縮小 | | スライド枠／半面に合わせた縮小後も読めるか |
| 文字 | | |
| 線 | | 縮小後に細すぎて消えないか |
| 色 | | |
| 軸 | | |
| 単位 | | |
| 凡例 | | |
| 余白 | | |
| 編集なしで完成 | | |
| 3分以内 | | 貼付後の手戻りを含めても約3分か |

### 直したくなる箇所（必須記録）

| # | 箇所 | 人間がやりたい修正 | 仮説: デフォルト不足 / 編集機能が必要 |
|---|------|-------------------|--------------------------------------|
| 1 | | | デフォルト不足 を先に疑う |
| 2 | | | |

---

## 4. 合否の扱い

- 多数が「デフォルト不足」→ Renderer の既定スタイル/余白/字号/線幅を改善（**Editor は作らない**）
- 「編集機能が必要」が支配的かつデフォルト改善で埋まらない → 別判断（現フェーズでは結論を急がない）
- SVG 編集可能性は合否に使わない
- **やる/やらないのジャッジ**（例: ラベル切れ vs 前年比）→ ChatGPT 裁定プロンプト  
  [`../prompts/graph-r1-acceptance-gap-judgment-COPYPASTE.md`](../prompts/graph-r1-acceptance-gap-judgment-COPYPASTE.md)

---

## 5. 結果ログ置き場

手動結果は:

`docs/graph/fixtures/acceptance/RESULTS.md`

にケース ID 単位で追記する（チャットログの貼り付け禁止 · 表のみ）。
