# CASE-2026-007 残件清掃（2026-08-13）

憲法判決後に残っていた「チャネル/𝕏共有」残骸の撤去メモ。実装の正本は本ノートではなく `docs/legal/CASE_LAW.md` CASE-2026-007。

## やったこと

| 対象 | 変更 |
|------|------|
| `tools/warikan.html` | `#btn-x-share`（𝕏 結果をシェア）・`shareToX` 配線を削除。コピー CTA のみ残す |
| `tools/invoice.html` | 見出し「🔗 共有・クライアント送付」→「送付文面をコピー」。補助文を Copy-First に明確化 |
| `tools/receipt.html` | 変更なし（「共有用URLをコピー」は合憲） |
| `assets/sugudasu-growth.js` | `openXIntent` · `shareXWarikan` · `shareXInvoice` · `shareXReceipt` 削除。ブックマーク誘導のみ残す |
| `assets/sugudasu.css` | 未使用 `.sg-btn-x` 削除 |
| `data/cta.json` | invoice/receipt/warikan の死セレクタ（share_*/x-share/chat-config）削除 |

## 残さないもの（再確認）

- プラットフォーム名付き共有ボタン（Slack/Teams 等）
- 送信先 URL 設定 UI
- 帳票・割り勘主面の 𝕏 intent シェア

## 合憲のまま残すもの

- 送付文面コピー（invoice）
- 共有用URLコピー（receipt）
- 清算テキストコピー（warikan）
- 印刷 / PDF
