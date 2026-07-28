# Scenario: YouTube Comment

## Platform

- adapterId: `youtube`
- hosts: youtube.com  
- permission: optional  
- **状態:** Roadmap（MVP 外）

## Detection

- フォーカス中 / 展開中コメントの author · body · datetime  
- 動画タイトル · url

## Scenario

| scenarioId | 条件 |
|------------|------|
| `youtube_comment` | コメントコンテキストを取得できた |

## Action

| scenarioId | Actions |
|------------|---------|
| `youtube_comment` | reply（定型） · share(`slack_share`) · done |

## Fallback

コメント DOM は壊れやすい → 失敗時は正直に unsupported。捏造しない。

## Future

- 動画概要のみ Scenario（share/pr_log）  
- ライブチャットは対象外（監視化しやすい）
