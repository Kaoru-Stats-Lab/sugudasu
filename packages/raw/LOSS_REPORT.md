# Loss Report Contract (Wave 2.5)

ADR-008 Loss Aware の実装寄り契約。  
**捨てたのではなく、比較対象外として認識した**ことを残す。

## Shape

```json
{
  "losses": [
    {
      "type": "unsupported_feature",
      "source": "docx",
      "target": "slir",
      "feature": "header_footer",
      "severity": "warning",
      "message": "Header/Footer excluded from SLIR body; snapshot in chrome/originMetadata",
      "origin": "word/header1.xml"
    }
  ]
}
```

## Phase1 features（DOCX）

| feature | severity | SLIR |
|---------|----------|------|
| `header_footer` | warning | 本文に混ぜない · `raw.chrome` に snapshot |
| `table_cell_merge` | warning | TableNode Atomic に平坦化 |
| `image_ocr` | info | ImageNode のみ · OCR しない |
| `text_color` | info | styleSegments に provisional で載せる |

## Phase1 features（PDF）

| feature / type | severity | 意味 |
|----------------|----------|------|
| `reading_order_uncertain` | warning | 2段組等 · confidence 可 |
| `table_structure_unknown` | warning | 幾何推定のみ · セル Diff 禁止 |
| `ocr_required` | warning | 抽出テキストなし · OCR しない |

PDF Loss も **SLIR に混ぜない**（`normalizePdfWithReport` の `losses`）。


## API

- Parser: `RawDocumentModel.losses` + `chrome`
- Normalizer: `normalizeWithReport(raw) → { slir, losses }`
- Matcher / Delta: Loss を消費しない
