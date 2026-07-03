# マルチAIリファクタ — 提督 RUNBOOK

**更新:** 2026-07-03  
**対象:** SUGUDASU（`C:\asl_dev\sugudasu`）  
**正本:** `docs/notes/MULTI_AI_CODER_PLAYBOOK.md`

---

## 流れ（3段 · 1タスクずつ）

```
提督の目的
    ↓
① Gemini  … INV チェックリスト + GLM 依頼文
    ↓
② GLM     … 実装パケット（設計図のみ · ファイルは触らない）
    ↓
③ Cursor  … 実装 · テスト · 報告（コミットは明示依頼時のみ）
```

**鉄則:** INV と実装パケットの **両方** が揃うまで Cursor を起動しない。

**新規ツール / 難解 UI バグ:** Cursor 着手前（または GLM 依頼前）に **Prior Art 探索**（Playbook **§9** · 日英独仏検索 · 15〜20 分）。mask 実例は `MASK_TOOL_SPEC.md` §8。

---

## ① Gemini への貼り付け

**ファイル:** `docs/prompts/multi-ai-refactor-gemini-COPYPASTE.txt`

1. ファイル全文を Gemini に貼る
2. 末尾に **対象コード** と **目的** を追記
3. 受け取る: 提督向けサマリ · INV · GLM 依頼文

**保存先（推奨）:** `docs/notes/refactor/REF-YYYYMMDD-nn-INV.md`（手動作成可）

---

## ② GLM への貼り付け

**ファイル:** `docs/prompts/multi-ai-refactor-glm-COPYPASTE.txt`

1. ファイル全文を GLM に貼る
2. Gemini の **INV 全文** + **GLM 依頼文** + **ソースコード** を続けて貼る
3. 受け取る: 実装パケット（`PKG-...`）— BLOCKED なら③に進まない

**保存先（推奨）:** `docs/notes/refactor/REF-YYYYMMDD-nn-PKG-01.md`

---

## ③ Cursor への貼り付け

**ファイル:** `docs/prompts/multi-ai-refactor-cursor-COPYPASTE.txt`

1. SUGUDASU ワークスペースで Cursor を開く
2. プロンプト全文 + INV + 実装パケットを貼る
3. 受け取る: 自己レビュー結果 → 実装完了報告 or BLOCKED

---

## コピペ用ファイル一覧

| 順 | 担当 | ファイル |
|----|------|----------|
| 1 | Gemini | `docs/prompts/multi-ai-refactor-gemini-COPYPASTE.txt` |
| 2 | GLM | `docs/prompts/multi-ai-refactor-glm-COPYPASTE.txt` |
| 3 | Cursor | `docs/prompts/multi-ai-refactor-cursor-COPYPASTE.txt` |

テンプレ（空欄例）: `docs/templates/multi-ai/`

---

## 最初のパイロット

| 項目 | 推奨 |
|------|------|
| ツール | `test-data` |
| 目的例 | 1関数の重複削除（CSV 不変） |
| 確認 | `npm run test:test-data` |

テストのないツールは **先にテスト追加タスク** を検討。

---

## BLOCKED になったら

| 段階 | 戻り先 | 典型原因 |
|------|--------|----------|
| GLM | Gemini | INV が厳しすぎる / ソース不足 |
| Cursor | GLM | コードが古い / パッチ不一致 |
| Cursor | Gemini | INV と設計図の矛盾 |

**推測で進めない** — 該当 AI に差し戻し。

---

## 本番反映（任意 · 別タスク）

1. 提督が Cursor に「コミットして」と明示
2. push 依頼時: `DEPLOY_LOG.md` → `npm run release:pages:free` → push
3. 詳細: `docs/notes/DEPLOY_CLOUDFLARE_PAGES.md`
