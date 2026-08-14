# SUGUDASU Graph — Renderer API（最小）

**Status:** R1 + R1.x（目標） Active  
**Constitution:** [`PRESENTATION_OUTPUT_CONSTITUTION.md`](./PRESENTATION_OUTPUT_CONSTITUTION.md)  
**Implementation:** `assets/graph-renderer.js`

---

## 公開 API

```js
import { renderGraph } from '../assets/graph-renderer.js';
import { validateGraphSpecPayload } from '../assets/graph-spec-validator.js';

// payload = buildGraphSpec(...) の結果
const result = await renderGraph(payload, {
  format: 'svg',           // 'svg' | 'png'
  deck_slot: 'half_left',  // 'generic' | 'full' | 'half_left'
  presentation: {
    series_color: '#1D4ED8',
    accent_color: '#EA580C',
    accent_categories: ['12月'],
    target_marker_color: '#0F172A',   // Bullet
    target_line_color: '#EA580C',     // Column 目標線
    target_series_color: '#64748B',   // Grouped_Column 目標棒
    show_value_labels: false,         // 既定OFF · true で棒/点に数値
    show_unit_label: true,
  },
  // width/height optional — deck_slot defaults apply when omitted
});

// Roundtrip S2 — コピー用 SVG とは別物の半面プレビュー
import { wrapDeckHalfLeftPreview } from '../assets/graph-renderer.js';
const preview = wrapDeckHalfLeftPreview(result.body, {
  chartWidth: result.width,
  chartHeight: result.height,
});
```

### R1 / R1.x 対応 type

| type | 役割 |
|------|------|
| `Bar` / `Column` / `Line` | R1 |
| `Column` + `encoding.target=line` | R1.x T-line · 定数は水平線、変動は polyline |
| `Bullet` | R1.x T-marker · CND-004 `target_as_marker` |
| `Grouped_Column` | R1.x T-series · CND-004 `target_as_series` |
| `Small_Multiples` | 単位違い2指標 · CND-001 |
| `Waterfall` | R1.x+ BRIDGE · [`GRAPH_WATERFALL_SPEC.md`](./GRAPH_WATERFALL_SPEC.md) |

正本: [`GRAPH_TARGET_REPRESENTATION.md`](./GRAPH_TARGET_REPRESENTATION.md) · Waterfall [`GRAPH_WATERFALL_SPEC.md`](./GRAPH_WATERFALL_SPEC.md)

他 type（Pie 等）→ `renderer_type_not_in_r1` REJECT。達成緑/赤は描かない。Waterfall の増減色は符号識別のみ。

### 成功

```js
{
  ok: true,
  format: 'svg',
  mime: 'image/svg+xml',
  body: '<svg ...>...</svg>',   // png 時は Buffer
  chart_type: 'Line',
  network_required: false,
  deck_slot: 'half_left',
  width: 560,
  height: 420,
}
```

### 失敗（描画しない）

```js
{
  ok: false,
  reason_codes: ['validator_reject' | 'renderer_type_not_in_r1' | ...],
  errors: [...],
  body: null,
}
```

Invalid Spec → Validator REJECT → **Renderer は描画しない・修正しない。**

---

## 入力契約

| 読んでよい | 読んでいけない |
|------------|----------------|
| `payload.graph_spec.chart.type` | `matched_rule_id` で分岐 |
| `encoding` · `data` · `constraints` · `axis` | `intent` |
| `accessibility` · `style_ref` · Presentation Settings | Observable 再解析 |
| | Rule / Decision 再実行 |
| | Spec の自動補正 |

**`source.matched_rule_id` はログ用途のみ。`if (matched_rule_id === 'RLE-…')` は禁止。**

---

## R1 対応 type

| type | 状態 |
|------|------|
| Bar | GO |
| Column | GO |
| Line | GO |
| その他 | `renderer_type_not_in_r1` で REJECT（描画しない） |

---

## Presentation Settings（R1）

正本トークン: [`GRAPH_DEFAULT_PALETTE.md`](./GRAPH_DEFAULT_PALETTE.md)

```js
{
  series_color: '#1D4ED8',
  series_muted_color: '#93C5FD',
  accent_color: '#EA580C',
  accent_categories: [],      // 特定項目だけ accent
  series_stroke: '#0F172A',
  mark_stroke_width: 0,       // 棒枠線は既定OFF。投影用に1可
  grid: true,
  show_category_labels: true,
  show_value_axis_labels: true,
  show_unit_label: true,      // unit≠UNKNOWN のとき右上に（単位）
  show_value_labels: false,   // 棒/点の数値 · 既定OFF
  line_width: 3,
  deck_slot: 'generic',       // or options.deck_slot
}
```

| deck_slot | 既定サイズ | 用途 |
|-----------|------------|------|
| `generic` | 640×360 | 互換 |
| `full` | 960×540 | スライドほぼ全面 |
| `half_left` | 560×420 | 左グラフ・右コメント |

### 半面プレビュー（S2）

`wrapDeckHalfLeftPreview(chartSvg)` — 16:9（960×540）フレームに左チャート・右「コメント」ゴースト。  
**コピー用本体 SVG とは別。** 貼る前の可読性確認用（Roundtrip S2）。

Bar はカテゴリラベル幅に応じて左余白を広げる（切れ防止）。

Unit 推定・Intent·Rule は扱わない。

---

## レイヤ（SVG 構造）

```text
svg
 ├── g.sg-graphic   (axes, grid, marks, baseline)
 └── g.sg-text      (category / value labels only in R1; no title/source)
```

---

## テスト

`npm run test:graph-renderer`

- same Spec → same SVG
- Invalid Spec → REJECT
- no `matched_rule_id` / `intent` branching in source
- R1 types only
- PNG from same Spec（sharp）
- network_required === false
