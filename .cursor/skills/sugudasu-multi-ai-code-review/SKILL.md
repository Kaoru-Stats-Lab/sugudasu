---
name: sugudasu-multi-ai-code-review
description: >-
  Surfaces the SUGUDASU multi-AI refactor workflow as a ready-to-use bundle
  (Gemini/GLM/Cursor COPYPASTE prompts, RUNBOOK, ROLE docs, short usage, repo
  links). Use when the user asks for コードレビュー, code review, safe refactoring,
  リファクタ, マルチAI, 3AI分業, GLM, Gemini PM, 壊さずにきれいに, or wants review/test
  specs before refactoring in sugudasu. Do not start implementing until INV + PKG exist.
---

# SUGUDASU マルチAI · コードレビュー案内

## 発火条件

次のいずれかで **即このスキルの「標準バンドル」をユーザーに提示** する（実装は別依頼まで開始しない）:

- 「コードレビュー」「code review」
- 安全なリファクタ · スパゲッティを壊さず整理
- マルチAI · 3AI · Gemini / GLM / Cursor 分業
- レビュー仕様 · テスト仕様の確認

**リポジトリ:** `C:\asl_dev\sugudasu` のみ。asl-dashboard ではない。

---

## Agent の最初の一手

1. ユーザーが **実装依頼** か **体制・手順の確認** かを 1 行で判定
2. **体制・手順・レビュー** → 下記「標準バンドル」を **そのまま全文出力**（4セクションすべて）
3. **実装依頼** → INV + 実装パケットの有無を確認。無ければ標準バンドル → 「まず Gemini から」と案内
4. 必要なら `docs/notes/MULTI_AI_CODER_PLAYBOOK.md` を Read して詳細を補足

**禁止:** バンドル未提示でいきなり大規模リファクタ · ついでリファクタ

---

## 標準バンドル（ユーザーへ毎回この4セットを出す）

以下を **コピペ用（メイン）→ 手順書・ROLE → 使い方（最短）→ 連携更新** の順で提示する。

---

### 1. コピペ用（メイン）

| 順 | 担当 | ファイル |
|----|------|----------|
| 1 | **Gemini**（PM · INV） | `docs/prompts/multi-ai-refactor-gemini-COPYPASTE.txt` |
| 2 | **GLM**（監査 · 設計図） | `docs/prompts/multi-ai-refactor-glm-COPYPASTE.txt` |
| 3 | **Cursor**（実装） | `docs/prompts/multi-ai-refactor-cursor-COPYPASTE.txt` |

空欄テンプレ: `docs/templates/multi-ai/`

---

### 2. 手順書 · ROLE

| ファイル | 内容 |
|----------|------|
| `docs/prompts/multi-ai-refactor-RUNBOOK.md` | 提督向け 3 段フロー |
| `docs/prompts/multi-ai-refactor-gemini-ROLE.md` | Gemini 役割索引 |
| `docs/prompts/multi-ai-refactor-glm-ROLE.md` | GLM 役割索引 |
| `docs/notes/MULTI_AI_CODER_PLAYBOOK.md` | コーダー正本（レビュー · テスト L0–L6 · BLOCKED） |

---

### 3. 使い方（最短）

```
提督の目的
  → ① Gemini: gemini-COPYPASTE.txt + コード + 目的 → INV + GLM依頼文
  → ② GLM:    glm-COPYPASTE.txt + INV + ソース     → 実装パケット（or BLOCKED）
  → ③ Cursor: cursor-COPYPASTE.txt + INV + パケット → 実装 · テスト · 報告
```

**鉄則:** INV と実装パケットの **両方** が揃うまで Cursor を起動しない。

**最初のパイロット:** ツール `test-data` · 確認 `npm run test:test-data`

**成果物の保存（推奨）:** `docs/notes/refactor/REF-YYYYMMDD-nn-INV.md` · `...-PKG-01.md`

---

### 4. 連携更新（リポジトリ内の入口）

| 場所 | 内容 |
|------|------|
| `.cursorrules` | マルチAIリファクタ行 → Playbook + RUNBOOK |
| `docs/prompts/README.md` | プロンプト一覧に 3 本 + RUNBOOK |
| `docs/notes/MULTI_AI_CODER_PLAYBOOK.md` | §8 専用プロンプト一覧 |
| `.cursor/rules/sugudasu-multi-ai-refactor.mdc` | Cursor 実装時ルール（`alwaysApply: false`） |
| `package.json` | `npm run test:all`（8 エンジン一括） |
| **本 Skill** | `.cursor/skills/sugudasu-multi-ai-code-review/SKILL.md` |

---

## 3役の境界（1行ずつ）

| 役 | やる | やらない |
|----|------|----------|
| Gemini | INV · 提督向けサマリ · GLM依頼文 | ファイル書き換え |
| GLM | 監査 · 実装パケット（関数全文の前後） | ファイル書き換え |
| Cursor | 設計図再現 · ゲート実行 · BLOCKED報告 | ついでリファクタ |

---

## テスト・ゲート（Cursor 実装時の最小）

| 層 | コマンド例 |
|----|------------|
| L1 単体 | `npm run test:{tool}` または `npm run test:all` |
| L2 検証 | `npm run validate:tool-naming` · `validate:ogp` |
| L3 ビルド | `npm run build:pages` |
| L5 本番 | 提督依頼時のみ `release:pages:free` + `DEPLOY_LOG.md` |

ツール別テスト対応表 → `MULTI_AI_CODER_PLAYBOOK.md` §4.1

---

## BLOCKED 時の戻し先

| 段階 | 戻す先 | 典型原因 |
|------|--------|----------|
| GLM | Gemini | INV 厳しすぎ · ソース不足 |
| Cursor | GLM | コード古い · パッチ不一致 |
| Cursor | Gemini | INV と設計図の矛盾 |

---

## 追加リソース

詳細は Read してよい（バンドル提示後）:

- `docs/notes/SUGUDASU_OOPS_GUARDRAILS.md` — 行ズレ · 変質 · コピー先祖返り
- `docs/notes/DEV_GIT_AGENT_DELEGATION.md` — push は sugudasu のみ
