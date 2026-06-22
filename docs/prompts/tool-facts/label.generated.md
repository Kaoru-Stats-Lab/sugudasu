# TOOL_FACTS: label

status: **reviewed** · updated: 2026-06-22
productName: SUGUDASU ラベル · stage: gamma · URL: https://sugudasu.com/label

## マーケ（matrix 参照 · 捏造禁止）

- 主Pain: 郵便番号や住所の分割エラーで市販ラベル印刷がズレる
- 最優先の型: 型D
- △相当: 住所録の「マンション名が長すぎて枠からはみ出る」文字数の揺らぎ
- 聞き直し例: 「この長い住所、ラベルの枠内に収まるように途中で改行していい？」

## 一行

市販ラベル型番に合わせて宛名シールを一括印刷（CSV取込・非送信）

## 実装済み（reviewed のみ Gemini が断定可）

- 主要メーカー型番検索・レイアウト反映
- 宛名ラベル / 差出人ラベルモード
- Excel・CSV一括取込
- 印刷プレビュー
- localStorage の address_label_history_v1（履歴・再呼出）

## 未実装 / 言い過ぎ注意

- 全メーカー全型番の網羅保証
- 郵便番号APIによる住所自動分割（手入力・CSV前提）
- 長い住所の自動折返し最適化の保証

## データ取り扱い

- upload: false
- serverSave: false
- localStorage: address_label_history_v1（住所履歴）
- retention: 履歴は端末内 localStorage。サーバー非送信

## 信頼 FAQ 素材

- 保存: 住所データはブラウザ内処理。外部送信なし。
- 編集: 履歴から再編集・印刷可。
- 保持: localStorage 履歴はユーザーが端末で管理。

## 完了後導線

- ブラウザ印刷でラベル出力
- 履歴に保存して再利用

## Gemini メモ

マンション名はみ出しは手動調整前提。自動改行保証は書かない。

## Gemini 添付ブロック（1ツール）

```text
【label 事実 · status=reviewed】
SUGUDASU ラベル / https://sugudasu.com/label
Pain: 郵便番号や住所の分割エラーで市販ラベル印刷がズレる
実装: 主要メーカー型番検索・レイアウト反映
実装: 宛名ラベル / 差出人ラベルモード
実装: Excel・CSV一括取込
実装: 印刷プレビュー
実装: localStorage の address_label_history_v1（履歴・再呼出）
未実装: 全メーカー全型番の網羅保証
未実装: 郵便番号APIによる住所自動分割（手入力・CSV前提）
未実装: 長い住所の自動折返し最適化の保証
データ: upload=false serverSave=false retention=履歴は端末内 localStorage。サーバー非送信
```

