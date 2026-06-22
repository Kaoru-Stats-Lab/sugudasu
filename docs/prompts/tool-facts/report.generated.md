# TOOL_FACTS: report

status: **reviewed** · updated: 2026-06-22
productName: SUGUDASU 議事録 · stage: gamma · URL: https://sugudasu.com/report

## マーケ（matrix 参照 · 捏造禁止）

- 主Pain: 要確認
- 最優先の型: 要確認
- △相当: 要確認
- 聞き直し例: 要確認

## 一行

箇条書きメモをビジネス文面に整形しコピー（Gemini用プロンプト生成可）

## 実装済み（reviewed のみ Gemini が断定可）

- 議事録・報告書など書類種別テンプレ
- ブラウザ内整形＋ワンクリックコピー
- Gemini用指示文の生成・コピー（ユーザーが手動貼付）
- 2タブ（そのまま使う / AIで仕上げる）

## 未実装 / 言い過ぎ注意

- SUGUDASUからGemini API直叩き
- チャット共有Phase2（Backlog記載）
- 自動送信

## データ取り扱い

- upload: false
- serverSave: false
- localStorage: なし
- retention: メモはセッション内。Gemini貼付はユーザー操作

## 信頼 FAQ 素材

- 保存: 整形はブラウザ内。Gemini連携はコピー後ユーザー送信。
- 編集: 入力変更で再整形可。
- 保持: 永続保存なし。

## 完了後導線

- 整形文をメール・チャットへコピー
- Gemini用プロンプトをコピーして仕上げ

## Gemini メモ

「AI下書き」はGeminiへの手動貼付前提。

## Gemini 添付ブロック（1ツール）

```text
【report 事実 · status=reviewed】
SUGUDASU 議事録 / https://sugudasu.com/report
Pain: 要確認
実装: 議事録・報告書など書類種別テンプレ
実装: ブラウザ内整形＋ワンクリックコピー
実装: Gemini用指示文の生成・コピー（ユーザーが手動貼付）
実装: 2タブ（そのまま使う / AIで仕上げる）
未実装: SUGUDASUからGemini API直叩き
未実装: チャット共有Phase2（Backlog記載）
未実装: 自動送信
データ: upload=false serverSave=false retention=メモはセッション内。Gemini貼付はユーザー操作
```

