# Gemini → Cursor 実装レビュー（AdSense有用性・2026-07-15）

Gemini 出力パックの **事実確認結果**。実装はこの判定に従う。

| Gemini主張 | 実装での扱い |
|------------|--------------|
| ツールID `estimate-meeting` | **誤り** → `planning-poker`（`/planning-poker`） |
| 各自ブラウザで秘匿投票 | **誤り** → 司会1画面の代行入力 + Reveal |
| マスクでPDF墨消し本体 | **誤り** → 画像（PNG/JPEG等）のみ。PDFは「画像化→マスク」手順で記述 |
| タイムラインの秒単位一括シフト | **誤り** → **分単位**連動再計算。秒は対象外（FAQ正本） |
| 請求書の LocalStorage 自動保存 | **未確認/なし** → 自動保存を断定しない。手動エクスポート中心 |
| 「通信が一切発生しない」 | **過大** → 業務データPOST無し。静的アセット・広告・解析は別。NetworkのFetch/XHRで**業務データ送信が無い**と書く |
| 「100%復元不可能」 | **緩和** → 黒塗りピクセル上書きの説明 + 塗り漏れ・ぼかしは別問題の免責 |
| Google検索/gmailラップURL | **除去** → `/invoice` `/mask` `/planning-poker` へ直リンク |
| slug `event-seconds-timeline` | **改名** → `event-day-timeline-recovery`（秒を謳わない） |

再申請ゲートの「新規3本」＝本実装の privacy / poker / mask ガイド。残り2本も同日追加。
