# Scenario: News / Web Article

## Platform

- adapterId: `web`（news-like host は `news` platform ヒント可）
- 例: メディア記事 · Google Alert から開いたページ
- permission: optional（ドメイン段階許可）または web 汎用は後続設計

## Detection

- `og:title` / `title` · `url` · 本文スニペット（長文は truncate）
- `author` · `article:published_time`（取れれば）
- news-like host パターン（構造ヒューリスティックのみ）

## Scenario

| scenarioId | 条件 |
|------------|------|
| `web_mention` | 一般 / 紹介記事 |
| `news_mention` | news-like host 等 |

## Action

| scenarioId | Actions |
|------------|---------|
| `web_mention` | share(`quote_post`) · note(`thanks_mail`) · share(`slack_share`) · done |
| `news_mention` | note(`pr_log`) · share(`sns_share`) · done |

## Fallback

本文が空でも title+url があれば最小 share。完全失敗は `unsupported`。

## Future

- 誤情報疑い Scenario（注意付き share/note · 煽りラベルなし）  
- 紹介 vs 批判の構造ルール（評価語を UI に出さない）
