# Scenario: X Post

## Platform

- adapterId: `x`
- hosts: x.com · twitter.com
- permission: optional（ユーザーが X で使うとき許可）

## Detection

- `article[data-testid="tweet"]` 等から author · body · datetime · 画像有無
- ブランド名は Setting の brands と本文/表示名の照合（構造）

## Scenario

| scenarioId | 条件 |
|------------|------|
| `sns_brand_mention` | ブランド照合ヒット（またはユーザーが開いている自社関連ポスト） |

MVP 粗分類でも可: ポストが取れたら `sns_brand_mention`。

## Action

| scenarioId | Actions |
|------------|---------|
| `sns_brand_mention` | share(`quote_post`) · share(`slack_share`) · done |

Reply 定型は文化差が大きい → ロケール別テンプレ束で後続。

## Fallback

ツイート DOM 取得失敗 → unsupported / 沈黙。

## Future

- 引用ポスト専用 Scenario  
- スレッド親への share 要約  
- Assign しない（仕事本体は人）
