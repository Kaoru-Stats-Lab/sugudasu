# SUGUDASU Graph — Waterfall（増減ブリッジ）

**Date:** 2026-08-14  
**Status:** **GO（R1.x+ · BRIDGE Intent 限定）**  
**Related:** [`GRAPH_STATUS_GATE.md`](./GRAPH_STATUS_GATE.md) · [`GRAPH_DEFAULT_PALETTE.md`](./GRAPH_DEFAULT_PALETTE.md) · RLE-004 · [`../notes/GRAPH_ADOPT_REJECT_BOARD_SYNTHESIS.md`](../notes/GRAPH_ADOPT_REJECT_BOARD_SYNTHESIS.md)

---

## 一行

> 期首 → 増減要因 → 期末を **同一ゼロ基線上の橋**で見せる。  
> 達成緑/赤は発明しない。符号色（増/減）は達成色と別トークン。

---

## 入力（Observable）

| 条件 | 内容 |
|------|------|
| Intent | `BRIDGE` |
| Rule | RLE-004（`Net_Change` · 正負混在 · `has_start_end`） |
| 表形 | カテゴリ列 + 数値列。行ラベルに **開始/期首** と **終了/期末**（検出は Observable） |
| 中間行 | 増減（正・負）。絶対水準ではない |

例（RG-BRIDGE）:

```text
要因	増減
開始	100
価格	20
数量	-5
終了	115
```

---

## Spec

- `chart.type` = `Waterfall`
- 各 value: `raw` / `display` / `sign` (`positive`|`negative`|`zero`) / `step_role` (`start`|`end`|`delta`)
- `zero_baseline` = true

---

## 描画

| 要素 | 仕様 |
|------|------|
| start / end | ゼロから絶対値までの棒（`waterfall_total`） |
| delta + | 累積上端から積み上げ（`waterfall_positive`） |
| delta − | 累積から下がる棒（`waterfall_negative`） |
| コネクタ | 隣接ステップの上端を細い線で接続 |
| 値ラベル | Bridge 既定 ON（差分は符号付き可） |
| 軸切断 | 禁止 |

---

## 色（達成色ではない）

| トークン | 用途 |
|----------|------|
| `waterfall_total` | 開始・終了 |
| `waterfall_positive` | 増加ステップ |
| `waterfall_negative` | 減少ステップ（橙系 · 達成赤と混同しない） |

---

## 非ゴール

- Pie/Donut · Dual Axis · 着地見込みブリッジ · 自由アノテ Editor · タイトル自動生成
