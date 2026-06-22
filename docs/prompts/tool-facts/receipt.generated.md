# TOOL_FACTS: receipt

status: **reviewed** · updated: 2026-06-22
productName: SUGUDASU 領収書 · stage: gamma · URL: https://sugudasu.com/receipt

## マーケ（matrix 参照 · 捏造禁止）

- 主Pain: 手取り逆算やインボイス要件を満たす手間の煩雑さ
- 最優先の型: 型B
- △相当: 但し書きが「お品代」で本当に監査を通るかという社内規定の曖昧さ
- 聞き直し例: 「領収書の但し書き、お品代じゃなくてセミナー参加費って書き直す？」

## 一行

手取り逆引きで源泉・消費税を算出し、インボイス対応領収書PDFを発行

## 実装済み（reviewed のみ Gemini が断定可）

- 希望手取りからの源泉・消費税逆算
- 1枚出力・A4マルチ出力
- インボイス対応項目の領収書プレビュー
- PDF保存・印刷
- URL共有（領収書データのエンコードリンク）
- Slack等チャット送付文＋送信先URL（invoiceと同型・localStorage）

## 未実装 / 言い過ぎ注意

- 法的助言・監査保証
- サーバー側での領収書ホスティング（URLはデータ埋め込み型）

## データ取り扱い

- upload: false
- serverSave: false
- localStorage: チャット送信先URLのみ
- retention: 計算データはサーバー非保存

## 信頼 FAQ 素材

- 保存: 金額入力はブラウザ内計算。外部送信なし。
- 編集: フォームで再入力・再計算可。
- 保持: URL共有はリンク先データに依存。サーバー台帳なし。

## 完了後導線

- PDF保存・印刷
- チャット送付文コピー
- URL共有リンクのコピー

## Gemini メモ

適格請求書としての要件充足はユーザー確認事項として書く。

## Gemini 添付ブロック（1ツール）

```text
【receipt 事実 · status=reviewed】
SUGUDASU 領収書 / https://sugudasu.com/receipt
Pain: 手取り逆算やインボイス要件を満たす手間の煩雑さ
実装: 希望手取りからの源泉・消費税逆算
実装: 1枚出力・A4マルチ出力
実装: インボイス対応項目の領収書プレビュー
実装: PDF保存・印刷
実装: URL共有（領収書データのエンコードリンク）
実装: Slack等チャット送付文＋送信先URL（invoiceと同型・localStorage）
未実装: 法的助言・監査保証
未実装: サーバー側での領収書ホスティング（URLはデータ埋め込み型）
データ: upload=false serverSave=false retention=計算データはサーバー非保存
```

