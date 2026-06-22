# TOOL_FACTS: invoice

status: **reviewed** · updated: 2026-06-22
productName: SUGUDASU 請求書 · stage: beta · URL: https://sugudasu.com/invoice

## マーケ（matrix 参照 · 捏造禁止）

- 主Pain: 計算後の金額をもとに請求書PDFを発行する際の手数
- 最優先の型: 型B
- △相当: 税率が10%か8%（軽減税率）か混在する品目のグレーゾーン
- 聞き直し例: 「このお弁当代の請求、中のジュースは消費税何パーセント計算？」

## 一行

見積・納品・請求書を登録なしで作り、PDFとチャット送付文まで完結

## 実装済み（reviewed のみ Gemini が断定可）

- 見積・納品・請求書の3種（タブ切替）
- 見積下書きから納品・請求への転用
- インボイス登録番号・10%/8%税額内訳
- ブラウザ印刷によるPDF保存
- 下書きデータのファイル保存・読み込み
- Slack/Chatwork/Google Chat/Teams/LINE WORKS 送付文コピー＋URL起動（Phase1）
- 送信先URLの localStorage 保存

## 未実装 / 言い過ぎ注意

- Webhook 直送信（Phase2）
- 会計ソフトへの直接取込
- 複数税率混在品目の自動判定（税率は行ごと手動選択）

## データ取り扱い

- upload: false
- serverSave: false
- localStorage: チャット送信先URLのみ（CHAT_TARGETS_KEY）
- retention: 帳票データはサーバー非保存。下書きはユーザーがJSONファイルで自行保管

## 信頼 FAQ 素材

- 保存: 明細・宛先はブラウザ内。サーバーへ帳票内容は送信しない。
- 編集: 下書き読込で編集継続可。
- 保持: 永続保存なし。PDF/下書きファイルはユーザー管理。

## 完了後導線

- PDF保存後にチャット送付文をコピー
- 見積→請求タブ切替で転用

## Gemini メモ

「PDFと同時に自動送信」は不可。文面コピー＋ユーザーがチャットで送信。

## Gemini 添付ブロック（1ツール）

```text
【invoice 事実 · status=reviewed】
SUGUDASU 請求書 / https://sugudasu.com/invoice
Pain: 計算後の金額をもとに請求書PDFを発行する際の手数
実装: 見積・納品・請求書の3種（タブ切替）
実装: 見積下書きから納品・請求への転用
実装: インボイス登録番号・10%/8%税額内訳
実装: ブラウザ印刷によるPDF保存
実装: 下書きデータのファイル保存・読み込み
実装: Slack/Chatwork/Google Chat/Teams/LINE WORKS 送付文コピー＋URL起動（Phase1）
実装: 送信先URLの localStorage 保存
未実装: Webhook 直送信（Phase2）
未実装: 会計ソフトへの直接取込
未実装: 複数税率混在品目の自動判定（税率は行ごと手動選択）
データ: upload=false serverSave=false retention=帳票データはサーバー非保存。下書きはユーザーがJSONファイルで自行保管
```

