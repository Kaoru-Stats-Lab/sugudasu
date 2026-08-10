# SUGUDASU Graph — Renderer API（最小）

**Status:** R1 Active  
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
  presentation: {},        // optional Presentation Settings (R1: colors/widths only)
  width: 640,
  height: 360,
});
```

### 成功

```js
{
  ok: true,
  format: 'svg',
  mime: 'image/svg+xml',
  body: '<svg ...>...</svg>',   // png 時は Buffer
  chart_type: 'Line',
  network_required: false,
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

## Presentation Settings（R1 最小）

```js
{
  series_color: '#2F6FED',
  grid: true,
  show_category_labels: true,
  show_value_axis_labels: true,
  line_width: 2,
}
```

Unit 推定・Intent・Rule は扱わない。

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
