# SUGUDASU Graph — デフォルト配色（HCI / 認知）

**Date:** 2026-08-14  
**Status:** Defaults SoT（Renderer `DEFAULT_PRESENTATION` はこれに寄せる）  
**Related:** [`GRAPH_R1_PROJECTION_COLOR_JUDGMENT.md`](./GRAPH_R1_PROJECTION_COLOR_JUDGMENT.md) · [`GRAPH_R1_COLOR_MUST_JUDGMENT.md`](./GRAPH_R1_COLOR_MUST_JUDGMENT.md) · `--sg-*`（`assets/sugudasu.css`）

---

## 一行

> Excel の「青・赤・緑」並びは **カテゴリ識別の最低限** にはなるが、色覚・投影・ブランドのいずれにも弱い。  
> SUGUDASU デフォルトは **輝度差優先 · 色覚耐性 · アクセント1色 · 凡例必須**。意味は長さ／位置が主、色は補助。

反例（提督提示）: 産業別就業者の積み上げ — 「いかにも Excel」。機能はするが、会議室・色覚・VI 差し替えのどれも一次解にならない。  
スクショ: [`fixtures/acceptance/ref/ref-excel-like-stacked-industries.png`](./fixtures/acceptance/ref/ref-excel-like-stacked-industries.png)

---

## HCI / 認知科学からの要件

### 1. 色は補助エンコーディング

Bertin / 可視化の定石: 棒の **長さ**・線の **位置** が量の主チャネル。  
色は「同じ系列か／強調か／カテゴリ差」の補助。色が洗われても壊れないこと（投影裁定と同旨）。

### 2. カテゴリ色は「色相の派手さ」より「輝度＋色相差」

| 悪い例（Excel風） | なぜ弱いか |
|-------------------|------------|
| 青・赤・緑を等彩度で並べる | 赤緑は色覚多様性で潰れやすい |
| 明度が近い3色 | 投影で全部グレーっぽくなる |
| 凡例依存のみ | 半面縮小で凡例が読めないと崩壊 |

良い方向:

- 隣り合う系列は **明度をずらす**（濃い／中／やや明るい）
- 色相は Okabe–Ito / Paul Tol 系のように **色覚耐性のある並び**
- 単系列では **1色＋強調1色** で足りる（特定項目アクセント）

### 3. 意味色の勝手な割当をしない

「第1次＝緑（農業）」のような **セマンティック色の自動推定はしない**（Observable が意味を推測しない憲法と整合）。  
デフォルトは **中立の識別パレット**。ユーザーが HEX/ピッカーで VI や強調を載せる。

### 4. 同時に使える色数は少なく

ワーキングメモリと凡例負荷: デフォルト同時提示は **最大4系列色**（5本目以降はパターン or 再設計案内）。  
積み上げの多カテゴリはそもそも Decision/R2 側の問題。色で救わない。

### 5. 文字・軸は近黒

色付き背景の上でも、ラベルは `#0F172A` 級。薄グレー軸は投影で消える。

---

## SUGUDASU デフォルトトークン（v1）

ブランドとの関係: UI の `--sg-primary` / `--sg-brand-orange` / `--sg-brand-navy` に寄せるが、**グラフは投影向けに一段コントラストを上げた値**を別トークンとして持つ。

### 単系列（R1 の大半: Bar / Column / Line）

| トークン | HEX | 用途 |
|----------|-----|------|
| `paper` | `#FFFFFF` | 背景 |
| `ink` | `#0F172A` | カテゴリ・目盛・値ラベル |
| `axis` | `#334155` | 軸線 |
| `baseline` | `#0F172A` | ゼロ線 |
| `grid` | `#E2E8F0` | グリッド（主役を食わない） |
| `series` | `#1D4ED8` | 主系列（`--sg-primary-hover` 寄り・投影耐性） |
| `series_muted` | `#93C5FD` | 非強調の棒（特定項目アクセント時の「地」） |
| `accent` | `#EA580C` | **特定項目の強調**（ブランド橙 `#FF851B` を投影向けにやや濃く） |
| `series_stroke` | `#0F172A` | 棒輪郭色（使うときだけ） |
| `mark_stroke_width` | `0`（既定） | **枠線デフォルトOFF**。投影で輪郭が欲しいときだけ `1` |
| `line` | `#1D4ED8` | 折れ線（series と同系） |
| `line_width` | `3` | px（投影で消えにくい） |
| `point_radius` | `3.5`（現行） | 折れ点円。**次の Renderer 調整で検討:** `4.5〜5` または白フチ＋濃色塗り（投影・縮小で点が線に埋もれない） |
| `target_marker` | `#0F172A` | Bullet 目標ティック（達成色ではない） |
| `target_line` | `#EA580C` | Column 目標線（Excel「目標値」文化・accent と同系） |
| `target_line_width` | `2` | px |
| `target_series` | `#64748B` | Grouped_Column の目標棒（中立グレー） |
| `waterfall_total` | `#1E3A5F` | Waterfall 開始・終了（合計棒） |
| `waterfall_positive` | `#1D4ED8` | Waterfall 増加ステップ（series と同系） |
| `waterfall_negative` | `#EA580C` | Waterfall 減少ステップ（accent 橙 · **達成赤ではない**） |

**禁止:** 達成率からの緑/赤自動割当。GAP は長さ・位置（バー端 vs マーカー／並棒／目標線）で見せる。正本 [`GRAPH_TARGET_REPRESENTATION.md`](./GRAPH_TARGET_REPRESENTATION.md)。  
Waterfall の増減色は **符号（+/−）の識別**であり、目標達成の意味付けではない。正本 [`GRAPH_WATERFALL_SPEC.md`](./GRAPH_WATERFALL_SPEC.md)。

特定項目アクセント時の塗り分け:

```text
通常カテゴリ → series_muted（または series の低彩度）
accent_categories → accent
```

単系列で強調が無いとき: 全部 `series`（単色で長さが主）。

### Pie / Donut への転用

**配色トークン自体は使える。** 扇形の塗りは多系列の `cat_1…n`、特定扇の強調は `accent` と同じ契約。

| | |
|--|--|
| パレット | GO — 棒と同じ SoT。Excel 青赤緑より識別しやすい |
| 強調1扇 | GO — `accent` + カテゴリ指定（棒の「12月だけ」と同型） |
| **Renderer 実装** | **R3 HOLD**（Pie / Donut はまだ描かない） |
| Decision | 割合でも実務では Bar 推奨がありうる（比較精度）。観測として Pie を出してもよいが、推奨は Rules に従う |

HCI 注意（種別が解禁されても色では救えない）:

- 同時スライスは **多くて4〜5**（凡例＋角度の限界）
- 量の読み取りは棒の長さより弱い → 「かっこいい円」だけでデフォルト種別にしない
- 真ん中穴（Donut）は装飾ではなく「合計の余白」程度に留める

今の R1 / R1.x では **Bar / Column / Line / Bullet / Grouped_Column（目標経路）** にこのパレットを載せる。Pie/Donut は解禁時に同じトークンを読む。


| 順 | トークン | HEX | メモ |
|----|----------|-----|------|
| 1 | `cat_1` | `#0072B2` | 青（主） |
| 2 | `cat_2` | `#E69F00` | 橙（Excel赤の代わり・色覚に強い） |
| 3 | `cat_3` | `#009E73` | 青み緑（Excel黄緑の代わり） |
| 4 | `cat_4` | `#CC79A7` | 赤紫（必要なときだけ） |

禁止デフォルト: `#4472C4` + `#ED7D31` + `#A9D08E` のような **Officeテーマ直写し**。

達成/未達（データがあるときのみ）:

| トークン | HEX | 注意 |
|----------|-----|------|
| `positive` | `#0F766E` | 青緑寄り（赤緑だけに依存しない） |
| `negative` | `#C2410C` | 橙赤。**形（目標線）と併用必須** |

---

## プリセット（Presentation Settings）

| id | 内容 |
|----|------|
| `sg_default` | 上表（通常） |
| `sg_proj_contrast` | ink/axis さらに濃く、series/accent 彩度↑、grid 弱め |
| `sg_mono` | ほぼ単色＋アクセントのみ（印刷・コピー向け） |

VI/CI: `series` / `accent` を HEX で上書き（Color Must）。パレット全体のテーマエディタは作らない。

---

## 実装メモ

- 現行 Renderer: `series_color: #2F6FED` → **`#1D4ED8` に寄せる**候補（本 SoT 採用時）
- `accent` / `series_muted` / `accent_categories` は Color Must 契約と同時に Renderer へ
- 多系列パレットは R1 単系列では未使用でよいが、**トークンは先に固定**して後からぶらさない

---

## Acceptance チェック

- [ ] ノートPCで「Excelっぽい原色レインボー」に見えない  
- [ ] 半面縮小でも棒と文字が残る  
- [ ] 特定項目アクセント（12月だけ橙）が一目で分かる  
- [ ] 可能なら色覚シミュレーション（赤緑弱）で多系列3色が区別できる  
- [ ] 投影想定（彩度落ち）でも ink と series の輝度差が残る  

---

## やらないこと

- Excel / Office テーマ色のコピーをデフォルトにしない  
- 「産業＝緑」などの意味色自動割当  
- パステル多色ダッシュボード風  
- 色だけに達成/未達を載せる（形・ラベルと二重化）  
