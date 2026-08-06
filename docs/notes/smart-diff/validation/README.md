# Smart Diff Validation — このフォルダについて

Wave 6 検証資産。**実装コードは置かない。**

## 情報境界

| 側 | ファイル |
|----|----------|
| **Evaluator Only** | Manifest · Ledger · SESSION_PROTOCOL · EVALUATION_SHEET · SESSION_ASSIGNMENT · INTERVIEW_GUIDE · SESSION_LOG · ROLLUP · WAVE6.3_FOCUS |
| **Participant View** | 旧・新文書バイナリ + タスク文言のみ（Protocol §2）+ 条件Bは Smart Diff UI |

## ファイル一覧

| ファイル | Wave | 内容 |
|----------|------|------|
| [`Golden_Fixture_Manifest.md`](Golden_Fixture_Manifest.md) | 6.1 | Fixture 目的 |
| [`Expected_Delta_Ledger.md`](Expected_Delta_Ledger.md) | 6.1 | 人間正解台帳 |
| [`SESSION_PROTOCOL.md`](SESSION_PROTOCOL.md) | 6.2 | 実施手順 · 情報境界 |
| [`EVALUATION_SHEET.md`](EVALUATION_SHEET.md) | 6.2 | 定量記録 |
| [`SESSION_ASSIGNMENT.md`](SESSION_ASSIGNMENT.md) | 6.2 | S1–S3 割当 |
| [`INTERVIEW_GUIDE.md`](INTERVIEW_GUIDE.md) | 6.2 | 必須質問 |
| [`WAVE6.3_FOCUS.md`](WAVE6.3_FOCUS.md) | 6.3 | 観察焦点 · ログ粒度 · 判定表 |
| [`SESSION_LOG_TEMPLATE.md`](SESSION_LOG_TEMPLATE.md) | 6.3 | 実施記入用（1条件1枚） |
| [`SESSION_RESULTS_ROLLUP.md`](SESSION_RESULTS_ROLLUP.md) | 6.3 | S1–S3 集約 · GO/STOP 準備 |
| [`README.md`](README.md) | — | 本ファイル |

## 実施順序

```text
6.1 Golden ✅
 → 6.2 Design ✅
 → Participant View 用バイナリ配置
 → 6.3 Persona Session（記録 · コード変更禁止）
 → 6.4 Analysis → GO / STOP / Re-scope / PDF限定再設計
```

CREATE-TASK: `docs/prompts/smart-diff-wave6.3-persona-session-CREATE-TASK.md`
