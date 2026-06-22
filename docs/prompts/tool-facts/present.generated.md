# TOOL_FACTS: present

status: **reviewed** · updated: 2026-06-22
productName: SUGUDASU ギフト · stage: gamma · URL: https://sugudasu.com/present

## マーケ（matrix 参照 · 捏造禁止）

- 主Pain: 相手の属性や予算に合った適切な贈り物を選ぶ基準が曖昧
- 最優先の型: 型B
- △相当: 相手の役職や関係性に対して、高すぎず安すぎない予算感の揺らぎ
- 聞き直し例: 「取引先の周年祝い、予算1万円って安すぎて失礼にならないかな？」

## 一行

関係性・予算・NG条件からギフト候補をブラウザ内マッチングしAmazonへ

## 実装済み（reviewed のみ Gemini が断定可）

- 関係性・シーン・予算上限・趣味・NGキーワード入力
- 内蔵ルールによる候補提案（サーバーAI呼び出しなし）
- Amazon アフィリエイトリンクから商品確認
- 地雷ワード除外

## 未実装 / 言い過ぎ注意

- LLM API によるリアルタイム生成
- 購入・配送の代行
- 相手の好みの自動学習

## データ取り扱い

- upload: false
- serverSave: false
- localStorage: なし
- retention: 条件入力はセッション内。Amazon遷移はユーザー操作

## 信頼 FAQ 素材

- 保存: 条件マッチングはブラウザ内。Amazonリンクはユーザーが開く。
- 編集: 条件変更で再提案可。
- 保持: サーバーに選定履歴なし。

## 完了後導線

- Amazonで商品確認・購入検討

## Gemini メモ

「AIサジェスター」は内蔵ルールベース。ChatGPT連携ではない。

## Gemini 添付ブロック（1ツール）

```text
【present 事実 · status=reviewed】
SUGUDASU ギフト / https://sugudasu.com/present
Pain: 相手の属性や予算に合った適切な贈り物を選ぶ基準が曖昧
実装: 関係性・シーン・予算上限・趣味・NGキーワード入力
実装: 内蔵ルールによる候補提案（サーバーAI呼び出しなし）
実装: Amazon アフィリエイトリンクから商品確認
実装: 地雷ワード除外
未実装: LLM API によるリアルタイム生成
未実装: 購入・配送の代行
未実装: 相手の好みの自動学習
データ: upload=false serverSave=false retention=条件入力はセッション内。Amazon遷移はユーザー操作
```

