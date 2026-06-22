# TOOL_FACTS: sns

status: **reviewed** · updated: 2026-06-22
productName: SUGUDASU SNS · stage: gamma · URL: https://sugudasu.com/sns

## マーケ（matrix 参照 · 捏造禁止）

- 主Pain: スマホ特有の改行崩れや特殊文字による誤メンションの発生
- 最優先の型: 型B
- △相当: スマホの画面によって改行の位置がズレて読みづらくなる表示崩れ
- 聞き直し例: 「さっきSlackに投稿したアナウンス、スマホからだと文字化けしてない？」

## 一行

SNS向けデコ文字・縦書きへ一括変換してコピー（非送信）

## 実装済み（reviewed のみ Gemini が断定可）

- 複数フォントスタイルへの一括変換
- 入力時自動変換
- カードごとのワンクリックコピー
- 2行目キャッチコピー対応

## 未実装 / 言い過ぎ注意

- X/Instagram API 投稿
- チャット別の画面幅自動プレビュー
- 絵文字・CJK混在の完全保証

## データ取り扱い

- upload: false
- serverSave: false
- localStorage: なし
- retention: セッション内のみ

## 信頼 FAQ 素材

- 保存: 入力テキストはブラウザ内変換。外部送信なし。
- 編集: 入力変更で即再変換。
- 保持: 永続保存なし。

## 完了後導線

- 各スタイルをコピーしてSNSプロフィール・投稿へ貼付

## Gemini 添付ブロック（1ツール）

```text
【sns 事実 · status=reviewed】
SUGUDASU SNS / https://sugudasu.com/sns
Pain: スマホ特有の改行崩れや特殊文字による誤メンションの発生
実装: 複数フォントスタイルへの一括変換
実装: 入力時自動変換
実装: カードごとのワンクリックコピー
実装: 2行目キャッチコピー対応
未実装: X/Instagram API 投稿
未実装: チャット別の画面幅自動プレビュー
未実装: 絵文字・CJK混在の完全保証
データ: upload=false serverSave=false retention=セッション内のみ
```

