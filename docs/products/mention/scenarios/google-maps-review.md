# Scenario: Google Maps Review

## Platform

- adapterId: `google_maps`
- hosts（例）: Google Maps · Google Business（口コミ UI）
- permission: optional（初回 Maps 系から）

## Detection

構造シグナルのみ:

- URL / DOM が Maps・口コミカード系
- `stars`（1–5 または null）
- `hasReply`
- `author` · `body` · `url`

感情スコアは使わない。

## Scenario

| scenarioId | 条件 |
|------------|------|
| `review_stars_45` | stars 4–5 · !hasReply |
| `review_stars_3` | stars 3 · !hasReply |
| `review_stars_12` | stars 1–2 |
| `review_already_replied` | hasReply |

## Action

| scenarioId | Actions（最大4） |
|------------|------------------|
| `review_stars_45` | reply(`google_reply`) · share(`slack_share`) · done |
| `review_stars_3` | reply(`google_reply_improve`) · share(`slack_share`) · done |
| `review_stars_12` | share(`internal_share`) · note(`note_template`) · done |
| `review_already_replied` | share(`slack_share`) · done |

低星で「返信するな」と断定しない（F7）。

## Fallback

カードが取れない / DOM 変更 → `supported=false` → `unsupported`（slack_share · done）または沈黙（未許可時）。

## Future

- 複数口コミ一覧からの「今フォーカス中の1件」精度向上  
- 店舗名の自動推定（Setting 優先は維持）
