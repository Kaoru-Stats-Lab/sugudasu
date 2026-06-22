# TOOL_FACTS: normalize

status: **reviewed** · updated: 2026-06-22
productName: SUGUDASU 正規化 · stage: beta · URL: https://sugudasu.com/normalize

## マーケ（matrix 参照 · 捏造禁止）

- 主Pain: 名簿やコードの全半角混在やスペース崩れを直す手間の多さ
- 最優先の型: 型D
- △相当: スペースの有無や全半角の「パッと見では揃って見える」不揃いさ
- 聞き直し例: 「コピペした名簿、苗字と名前の間のスペース全角半角混ざってない？」

## 一行

Excel列コピーの全半角・空白を用途別プリセットで整え、500行まで非送信変換

## 実装済み（reviewed のみ Gemini が断定可）

- 500行上限・行数 Before/After 表示
- 用途プリセット3種（EC登録・名簿・CSV）
- コピー時に最新設定で再変換してからクリップボードへ
- 先頭ゼロ保護・カタカナ長音保護（プリセット依存）
- オフライン動作

## 未実装 / 言い過ぎ注意

- 複数列同時の高度なCSVパース
- サーバー側バッチ処理

## データ取り扱い

- upload: false
- serverSave: false
- localStorage: なし
- retention: セッション内のみ

## 信頼 FAQ 素材

- 保存: 入力テキストはブラウザ内のみ。外部送信なし。
- 編集: 入力欄で随時編集・再変換可。
- 保持: 永続保存なし。

## 完了後導線

- 変換結果をExcel/スプシへコピー
- group-split へ名簿を渡す

## Gemini 添付ブロック（1ツール）

```text
【normalize 事実 · status=reviewed】
SUGUDASU 正規化 / https://sugudasu.com/normalize
Pain: 名簿やコードの全半角混在やスペース崩れを直す手間の多さ
実装: 500行上限・行数 Before/After 表示
実装: 用途プリセット3種（EC登録・名簿・CSV）
実装: コピー時に最新設定で再変換してからクリップボードへ
実装: 先頭ゼロ保護・カタカナ長音保護（プリセット依存）
実装: オフライン動作
未実装: 複数列同時の高度なCSVパース
未実装: サーバー側バッチ処理
データ: upload=false serverSave=false retention=セッション内のみ
```

