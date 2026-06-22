# TOOL_FACTS: shift

status: **reviewed** · updated: 2026-06-22
productName: SUGUDASU シフト · stage: beta · URL: https://sugudasu.com/shift

## マーケ（matrix 参照 · 捏造禁止）

- 主Pain: ブラウザを閉じたり誤ってリロードした際に入力データが消失
- 最優先の型: 型C
- △相当: 「仮で組んだシフト」を確定前に一度ブラウザを閉じて保存する手段
- 聞き直し例: 「来月のシフト、まだ未確定なんだけど一回下書き保存できる？」

## 一行

希望休と定休を考慮したシフトを自動生成し、FIX後にA4印刷

## 実装済み（reviewed のみ Gemini が断定可）

- スタッフ登録・希望休入力
- シフト自動生成
- FIX（確定）で下書き透かし解除
- A4横・印刷/PDF
- 複数月の作成
- localStorage による sugudasu_pro_snapshot 復元

## 未実装 / 言い過ぎ注意

- 従業員への自動通知
- クラウド同期・複数端末共同編集
- 労基法チェックの法的保証

## データ取り扱い

- upload: false
- serverSave: false
- localStorage: sugudasu_pro_snapshot（同一ブラウザで復元）
- retention: localStorage に端末内保存。サーバー非送信

## 信頼 FAQ 素材

- 保存: シフトデータはサーバーに送信しない。localStorage は端末内。
- 編集: FIX前は編集・再生成可。
- 保持: localStorage クリア・別端末では引き継がない。

## 完了後導線

- FIX → 印刷/PDF
- 店舗掲示用出力

## Gemini 添付ブロック（1ツール）

```text
【shift 事実 · status=reviewed】
SUGUDASU シフト / https://sugudasu.com/shift
Pain: ブラウザを閉じたり誤ってリロードした際に入力データが消失
実装: スタッフ登録・希望休入力
実装: シフト自動生成
実装: FIX（確定）で下書き透かし解除
実装: A4横・印刷/PDF
実装: 複数月の作成
実装: localStorage による sugudasu_pro_snapshot 復元
未実装: 従業員への自動通知
未実装: クラウド同期・複数端末共同編集
未実装: 労基法チェックの法的保証
データ: upload=false serverSave=false retention=localStorage に端末内保存。サーバー非送信
```

