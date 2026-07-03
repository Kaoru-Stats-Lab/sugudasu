# マルチAI — Antigravity ハイブリッド委譲ログ（採用見送り · 将来メモ）

**記録日:** 2026-07-03  
**提督判断:** **現時点では採用しない**（ログのみ）  
**参照:** [Gemini を Claude の「サブエージェント」に —— 大規模開発でコストを実測](https://zenn.dev/google_cloud_jp/articles/63205d90345627)（Google Cloud Japan · 2026-06-25）

---

## 何の話か（1行）

**Claude Code が指揮**し、**Antigravity CLI（`agy` · Gemini）が量産実行**する Plugin（`antigravity-for-claude-code`）。大規模ビルドで Claude 側コスト **27〜64% 削減**（同一品質ゲート通過）の実測記事。

---

## 採用見送り（2026-07-03）

| 項目 | 判断 |
|------|------|
| **SUGUDASU** | **採用しない** — 現状は「量産」フェーズではない。小〜中規模の静的ツール中心で、委譲の往復コストが効きにくい（記事の「小さな単発は Claude 直で十分」と同型） |
| **Cursor** | 記事の Plugin は **Claude Code 専用**。Cursor では `/plugin install` 等はそのまま使えない |
| **いまやること** | なし。本ファイルと Playbook §10 への索引のみ |

---

## ASL（`asl-dashboard`）なら効く可能性

記事の **効きどころ** は SUGUDASU より ASL 側に近い。

| 条件 | ASL で当てはまりうる例 |
|------|------------------------|
| 大規模機能・一括移行 | Vercel/DB 横断リファクタ · レガシー移行 |
| 網羅テスト生成 | 既存テスト薄い領域の一括追加 |
| 多エージェント構築 | ADK / Agent Engine 系の試行 |
| 長文 digest | Cloud Run ログ · 障害解析（記事の `cloud-run-debug` 型） |
| コストが経営課題化 | エージェント利用が月次で伸びるフェーズ |

**前提:** ASL は **別リポ · 別 Agent ウィンドウ**（`DEV_GIT_AGENT_DELEGATION.md`）。導入するなら ASL 側の判断・ログに書く。

---

## Cursor で「似たこと」はできるか

| 方式 | 可否 |
|------|------|
| 記事の Plugin をそのまま | **不可**（Claude Code 専用） |
| `agy` をターミナルから手動委譲 + Cursor がレビュー | **可能**（半自動 · 自前運用） |
| Cursor Subagent（Task）で Gemini 系を呼ぶ | 可能だが Plugin 同梱のフック・権限制限・計測は **自作** |

---

## 再検討トリガー（将来）

- [ ] ASL で **まとまった量**の実装・移行・テスト生成が常態化
- [ ] Claude / Cursor の **トークンコスト**が月次で問題化
- [ ] **Claude Code** を ASL 開発の主戦場にする方針が固まる
- [ ] Vertex / `agy` が既に ASL の GCP 課金に乗っている

再検討時の入口: [GitHub — antigravity-for-claude-code](https://github.com/yuting0624/antigravity-for-claude-code) · 記事 TL;DR の「4つの勘所」（分岐点の上で委譲 · コンテキスト薄く · 単発バッチ · diff だけレビュー）

---

## 関連（SUGUDASU 現行のマルチAI）

| 文書 | 役割 |
|------|------|
| [`MULTI_AI_CODER_PLAYBOOK.md`](MULTI_AI_CODER_PLAYBOOK.md) | Gemini（PM）· GLM（設計図）· Cursor（実装）— **ファイル書き換えなしの分業** |
| [`docs/prompts/multi-ai-refactor-RUNBOOK.md`](../prompts/multi-ai-refactor-RUNBOOK.md) | 上記の手順 |

本ログの Antigravity 構成は **別軸**（実行層を別 CLI に完全委譲）。現行 Playbook と置き換えではなく、**大規模時の追加オプション候補**。
