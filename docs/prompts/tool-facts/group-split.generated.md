# TOOL_FACTS: group-split

status: **reviewed** · updated: 2026-06-22
productName: SUGUDASU 班分け · stage: beta · URL: https://sugudasu.com/group-split

## マーケ（matrix 参照 · 捏造禁止）

- 主Pain: 開始直前のドタキャンでせっかく組んだ班のバランスが崩壊
- 最優先の型: 型A
- △相当: 「体調不良でいけたら行く」という直前までの出欠の流動性
- 聞き直し例: 「もうすぐ受付締め切るけど、Aさん今日来られそう？」

## 一行

研修・イベントの名簿を貼って公平に班分けし、TSV/Slackで共有する（非送信）

## 実装済み（reviewed のみ Gemini が断定可）

- Excel名簿の貼り付け（最大250名）
- 属性条件（所属分散・各組必須など）
- 名前ルール（固定班・離すペア・組番号固定）
- シード値による再現可能な班構成
- Excel TSV / Slack / 告知文 / JSON の1クリックコピー
- セッションJSONのコピー・貼り付け（PC→スマホ同期メモ経由）
- M02: 結果画面で名前タップ除外 → 同seedで再構成
- 緩和モード（制約不足時の実行）
- normalize.html への導線

## 未実装 / 言い過ぎ注意

- Zoom/Slack API 連携・BR自動割当
- O8 スイッチャー対応表（BR名・Slack列テンプレ）— Backlog P1
- 部分移動・最適候補提示
- 遅刻者の自動再追加

## データ取り扱い

- upload: false
- serverSave: false
- localStorage: なし（セッションJSONはクリップボード/同期メモで手動運搬）
- retention: ページを閉じると入力は失われる。復元はセッションJSON貼り付けが正攻法

## 信頼 FAQ 素材

- 保存: 名簿・班結果は SUGUDASU サーバーに送信しない。ブラウザ内処理。
- 編集: 名簿貼り直し・タップ除外・JSON読込で再実行可能。
- 保持: 永続保存なし。記録はTSV/Slack/JSONを幹事が自行保管。

## 完了後導線

- Excel TSV または Slack 用テキストをコピーして共有
- 欠席時: 名前タップ → 再構成 → Slack文を再コピー
- normalize で名簿前処理

## Gemini メモ

「ワンタップでドタキャン除外」は JSON読込済み or 同一端末の結果画面が前提。名指しルーレット批判禁止。

## Gemini 添付ブロック（1ツール）

```text
【group-split 事実 · status=reviewed】
SUGUDASU 班分け / https://sugudasu.com/group-split
Pain: 開始直前のドタキャンでせっかく組んだ班のバランスが崩壊
実装: Excel名簿の貼り付け（最大250名）
実装: 属性条件（所属分散・各組必須など）
実装: 名前ルール（固定班・離すペア・組番号固定）
実装: シード値による再現可能な班構成
実装: Excel TSV / Slack / 告知文 / JSON の1クリックコピー
実装: セッションJSONのコピー・貼り付け（PC→スマホ同期メモ経由）
実装: M02: 結果画面で名前タップ除外 → 同seedで再構成
実装: 緩和モード（制約不足時の実行）
実装: normalize.html への導線
未実装: Zoom/Slack API 連携・BR自動割当
未実装: O8 スイッチャー対応表（BR名・Slack列テンプレ）— Backlog P1
未実装: 部分移動・最適候補提示
未実装: 遅刻者の自動再追加
データ: upload=false serverSave=false retention=ページを閉じると入力は失われる。復元はセッションJSON貼り付けが正攻法
```

