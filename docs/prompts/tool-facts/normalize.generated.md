# TOOL_FACTS: normalize

status: **reviewed** · updated: 2026-07-01
productName: SUGUDASU 全角半角整え · stage: beta · URL: https://sugudasu.com/normalize

## マーケ（matrix 参照 · 捏造禁止）

- 主Pain: 社内規程で無料の変換サイトに名簿を貼れず、手打ちやExcel関数地獄になる
- 最優先の型: 型A
- △相当: 社内規程で「無料の全角半角変換サイト」への貼付が禁止されている
- 聞き直し例: 「顧客リスト直すだけなのに、社内ツール申請するほどでもないし…」

## 一行

Excel列コピーの全半角・空白・改行を用途別プリセットで整え、500行まで外部送信ゼロで変換

## 実装済み（reviewed のみ Gemini が断定可）

- 500行上限・行数 Before/After 表示
- 用途プリセット5種（EC登録・名簿・全角英数・改行→カンマ・姓名スペース）
- productName: SUGUDASU 全角半角整え（id=normalize 不変）
- コピー時に最新設定で再変換してからクリップボードへ
- 先頭ゼロ保護・カタカナ長音保護（プリセット依存）
- オフライン動作

## 未実装 / 言い過ぎ注意

- 複数列同時の高度なCSVパース
- サーバー側バッチ処理
- roster_office / crm_import 専用プリセット

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
SUGUDASU 全角半角整え / https://sugudasu.com/normalize
Pain: 社内規程で無料の変換サイトに名簿を貼れず、手打ちやExcel関数地獄になる
実装: 500行上限・行数 Before/After 表示
実装: 用途プリセット5種（EC登録・名簿・全角英数・改行→カンマ・姓名スペース）
実装: productName: SUGUDASU 全角半角整え（id=normalize 不変）
実装: コピー時に最新設定で再変換してからクリップボードへ
実装: 先頭ゼロ保護・カタカナ長音保護（プリセット依存）
実装: オフライン動作
未実装: 複数列同時の高度なCSVパース
未実装: サーバー側バッチ処理
未実装: roster_office / crm_import 専用プリセット
データ: upload=false serverSave=false retention=セッション内のみ
```

