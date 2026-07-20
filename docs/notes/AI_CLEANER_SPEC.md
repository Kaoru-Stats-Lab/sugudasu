# SUGUDASU AIコピペ整形（ai-cleaner）— V1 仕様

**更新:** 2026-07-20  
**id:** `ai-cleaner`（変更しない）  
**表示名:** conceptName / navLabel = AIコピペ整形 · productName = SUGUDASU AIコピペ整形  
**状態:** V1  
**思想:** AIを賢くするツールではない。次のツールへ貼る前の機械的整形。

---

## 1. JTBD

> ChatGPT / Claude / Cursor 等の出力を、Notion・Slack・エディタへ移す前に、意味を理解せず文字列だけ整える。

優先: **貼る → クリーニング → コピー**

---

## 2. 憲法

| 禁止 | |
|------|--|
| API / LLM / サーバー送信 | F2 |
| 登録・履歴・保存 | F1 · タブ寿命 |
| 要約・定型文削除・プロンプト生成 | AI製品化を避ける |
| ツール専用モード（ChatGPT専用等） | 追従コスト |
| 設定画面 · プレビュー · リッチ編集 | 1画面 |

---

## 3. V1 Must

| モード | 処理 |
|--------|------|
| Markdown | 連続空行→最大1空行 · `<b>` `<strong>` `<span>` 除去 · フェンス外 `---` 行除去 |
| コード抽出 | fenced code をすべて抽出し `\n\n` 連結 |
| JSON | `parse` → `stringify(null,2)` · 失敗時修復なし |

コピー成功: toast `✓ コピーしました`（約 0.8s）

---

## 4. Non-Goal

- AI定型文削除（「もちろんです」等）
- 要約 / TODO / 会話整理
- JSON 修復 · Schema
- Markdown プレビュー
- npm / React / Worker

---

## 5. ファイル

- `tools/ai-cleaner.html`
- `assets/ai-cleaner-engine.js` / `ai-cleaner-app.js` / `ai-cleaner.css`
- `scripts/ai-cleaner-engine.test.mjs`

---

## 6. 完了条件（3ケース）

1. ChatGPT コード出力 → コード抽出 → Cursor  
2. Claude Markdown → 汚れ除去 → Notion  
3. AI JSON → 整形 → API テスト  

判断基準: **次の場所へ貼るまでの摩擦を減らすか？**
