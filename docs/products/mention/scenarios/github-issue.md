# Scenario: GitHub Issue

## Platform

- adapterId: `github`
- hosts: github.com
- permission: optional  
- **状態:** Roadmap（MVP 外）

## Detection

- Issue タイトル · URL · 本文先頭 · 作者 · labels（構造のみ）

## Scenario

| scenarioId | 条件 |
|------------|------|
| `github_issue_mention` | Issue ページとして検出 |

## Action

| scenarioId | Actions |
|------------|---------|
| `github_issue_mention` | share(`slack_share`) · note(`note_template`) · done |

## Domain 境界

**Assign / クローズ / レビュー承認は作らない。**  
それは仕事本体。Mention は前工程（共有・メモ・Done）に留める。

## Fallback

未許可 · DOM 失敗 → 沈黙。

## Future

- PR コメント Scenario（同様に share/note のみ）  
- competition / philosophy に反する「GitHub 管理ツール化」は Reject
