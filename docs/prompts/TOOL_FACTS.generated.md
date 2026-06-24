# TOOL_FACTS（Gemini添付用 · 自動生成）

生成日時: 2026-06-24T13:44:22.599Z
正本: `data/tool-facts/*.json` · `data/tool-registry.json` · `data/lp-marketing-matrix.json`
次に着手: **timeline**（`data/tool-facts/_queue.json`）

## インデックス

| # | tool_id | status | registry | productName | URL |
| --- | --- | --- | --- | --- | --- |
| 1 | warikan | reviewed | live | SUGUDASU 割り勘 | https://sugudasu.com/warikan |
| 2 | group-split | reviewed | live | SUGUDASU 班分け | https://sugudasu.com/group-split |
| 3 | timeline | reviewed | planned | SUGUDASU イベント進行 | https://sugudasu.com/timeline |
| 4 | invoice | reviewed | live | SUGUDASU 請求書 | https://sugudasu.com/invoice |
| 5 | receipt | reviewed | live | SUGUDASU 領収書 | https://sugudasu.com/receipt |
| 6 | fair-draw | reviewed | live | SUGUDASU 抽選 | https://sugudasu.com/fair-draw |
| 7 | normalize | reviewed | live | SUGUDASU 正規化 | https://sugudasu.com/normalize |
| 8 | webp-to-jpg | reviewed | live | SUGUDASU WebP変換 | https://sugudasu.com/webp-to-jpg |
| 9 | shift | reviewed | live | SUGUDASU シフト | https://sugudasu.com/shift |
| 10 | label | reviewed | live | SUGUDASU ラベル | https://sugudasu.com/label |
| 11 | sns | reviewed | live | SUGUDASU SNS | https://sugudasu.com/sns |
| 12 | present | reviewed | live | SUGUDASU ギフト | https://sugudasu.com/present |
| 13 | work-calc | scaffold | planned | SUGUDASU 労働時間一括集計 | https://sugudasu.com/work-calc |
| 14 | table-conv | scaffold | planned | SUGUDASU 表データ相互コンバータ | https://sugudasu.com/table-conv |
| 15 | report | reviewed | live | SUGUDASU 議事録 | https://sugudasu.com/report |
| 16 | reverse | reviewed | live | SUGUDASU 逆引き | https://sugudasu.com/reverse |
| 17 | hub | reviewed | live | ツール一覧 | https://sugudasu.com/ |
| 18 | font-converter | reviewed | live | SUGUDASU フォント変換 | https://sugudasu.com/font-converter |

---

## warikan

status: **reviewed** · updated: 2026-06-23
productName: SUGUDASU 割り勘 · stage: gamma · URL: https://sugudasu.com/warikan

## マーケ（matrix 参照 · 捏造禁止）

- 主Pain: 傾斜はわかっているのに丸めたら合計がズレ、幹事が悪者になる
- 最優先の型: 型A
- △相当: 2次会・3次会は任意参加なのに、1本の表にまとめて計算しようとする手間
- 聞き直し例: 「2次会に来る人だけ、もう一回割り勘すればいいのに…」

## 一行

飲み会幹事の手間と心理的ハードルを減らす、グループ傾斜の精算とLINE清算文

## 実装済み（reviewed のみ Gemini が断定可）

- 傾斜係数モード（グループ名・係数・人数を複数行で設定）
- 合コン固定額モード（一方のグループを固定額、残りをもう一方で按分）
- 端数丸め（100 / 500 / 1000 / 1円）— 最大剰余法（LRM）
- 調整のすき間（不足・余り）の表示 — 幹事の自腹を決めつけない文案
- LINE / Slack 向け精算テキストのワンクリックコピー
- 清算文への多めのご負担へのお礼ブロック（グループ共有向け・ON/OFF）
- 個別に聞かれたとき—グループ別の即答文（DMコピー用）
- 不足・余りの幹事メモ（清算文オプション）
- Xシェア導線（sg-copy-feedback）

## 未実装 / 言い過ぎ注意

- 1次会〜N次会の出欠を1画面に統合する機能（回ごと別計算が正攻法）
- 開始・終了時刻からの自動時間傾斜（遅刻・早退は係数を手動で調整する運用）
- サーバーへの名簿・精算結果の保存
- localStorage による下書き復元
- URLハッシュによる入力状態の共有（ロードマップ候補）

## データ取り扱い

- upload: false
- serverSave: false
- localStorage: なし
- retention: ページを閉じると入力は失われる。記録は清算文コピーを幹事が自行保管

## 信頼 FAQ 素材

- 保存: 入力した金額・人数は SUGUDASU サーバーに送信しない。ブラウザ内で計算する。URL共有は未実装。
- 編集: 同一タブで入力を変えて再計算できる。
- 保持: 永続保存なし。再訪問時は空フォーム。清算文コピーが正攻法の記録。

## 完了後導線

- 精算テキストを LINE / Slack へコピーして共有
- X でシェア（任意）

## Gemini メモ

幹事は誰もやりたくない前提で手間削減を訴求。2次会は別途ツール使用。型D: サーバー非送信・永続なしを正直に。URL共有は未実装と明記。幹事自腹決めつけ禁止。

## Gemini 添付ブロック（1ツール）

```text
【warikan 事実 · status=reviewed】
SUGUDASU 割り勘 / https://sugudasu.com/warikan
Pain: 傾斜はわかっているのに丸めたら合計がズレ、幹事が悪者になる
実装: 傾斜係数モード（グループ名・係数・人数を複数行で設定）
実装: 合コン固定額モード（一方のグループを固定額、残りをもう一方で按分）
実装: 端数丸め（100 / 500 / 1000 / 1円）— 最大剰余法（LRM）
実装: 調整のすき間（不足・余り）の表示 — 幹事の自腹を決めつけない文案
実装: LINE / Slack 向け精算テキストのワンクリックコピー
実装: 清算文への多めのご負担へのお礼ブロック（グループ共有向け・ON/OFF）
実装: 個別に聞かれたとき—グループ別の即答文（DMコピー用）
実装: 不足・余りの幹事メモ（清算文オプション）
実装: Xシェア導線（sg-copy-feedback）
未実装: 1次会〜N次会の出欠を1画面に統合する機能（回ごと別計算が正攻法）
未実装: 開始・終了時刻からの自動時間傾斜（遅刻・早退は係数を手動で調整する運用）
未実装: サーバーへの名簿・精算結果の保存
未実装: localStorage による下書き復元
未実装: URLハッシュによる入力状態の共有（ロードマップ候補）
データ: upload=false serverSave=false retention=ページを閉じると入力は失われる。記録は清算文コピーを幹事が自行保管
```


---

## group-split

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


---

## timeline

status: **reviewed** · updated: 2026-06-24
productName: SUGUDASU イベント進行 · stage: alpha · URL: https://sugudasu.com/timeline

## マーケ（matrix 参照 · 捏造禁止）

- 主Pain: 現場でタイムスケジュールが巻いた・押した時の手計算が破綻
- 最優先の型: 型A
- △相当: 各プログラムの「大体5分くらい巻きそう・押しそう」な空気感
- 聞き直し例: 「今のセッション少し押してるけど、休憩時間何分削る？」

## 一行

司会・研修の当日進行表 — 1コマずらすと後続が連動再計算（非送信）

## 実装済み（reviewed のみ Gemini が断定可）

- イベント開始日時・タイトル入力
- コマ行（所要分・タイトル・運営メモ・最大80行）
- 累積分数モデルによる連動再計算（timeline-engine.js）
- 選択行 ±5分クイック調整
- 行追加・削除・上下移動（差し込みイベント対応）
- アンカー行（固定開始時刻）と衝突警告
- 目標終了時刻と early/over サマリー
- 現在時刻・残り時間（進行中コマ / 任意行フォーカス）
- プレーンテキスト・TSV の1クリックコピー
- 編集 / プレビュー2カラム（スマホはタブ切替）
- focus chrome（当日集中 · 16本ナビ非表示）
- A4 印刷（緑ヘッダー · 時刻/分/コマ/備考4列 · 目標終了フッター）
- group-split / warikan からの相互導線

## 未実装 / 言い過ぎ注意

- localStorage / JSON 下書き保存・読込（v1.1）
- セクション見出し行・設営/バラシテンプレ（v1.1）
- 複数マイルストーン・表示時間窓 displayFrom/until（v1.2）
- 行 DnD（v1.1）
- SUGUDASU Sync イベント進行（timeline-sync · ドメイン準備までサイト非掲載）

## データ取り扱い

- upload: false
- serverSave: false
- localStorage: なし（v1.1 で下書き予定）
- retention: ページを閉じると入力は失われる。記録はコピー/印刷で幹事が自行保管

## 信頼 FAQ 素材

- 保存: 進行表は SUGUDASU サーバーに送信しない。ブラウザ内処理。
- 編集: 行の所要分・±5・差し込みで即再計算。アンカー衝突は画面で警告。
- 保持: 永続保存なし。司会台本はプレーン/TSVコピーが正攻法。

## 完了後導線

- 司会台本（プレーン）または TSV をコピーして Slack/共有
- 5分押し: 該当行選択 → +5 → 再コピー
- 差し込み: 行選択 → 行追加 → 所要・メモ入力
- 事前班分けは group-split へ

## Gemini メモ

Sync（多端末共有）は未掲載。断定しない。AI による所要分提案は禁止（F7）。

## Gemini 添付ブロック（1ツール）

```text
【timeline 事実 · status=reviewed】
SUGUDASU イベント進行 / https://sugudasu.com/timeline
Pain: 現場でタイムスケジュールが巻いた・押した時の手計算が破綻
実装: イベント開始日時・タイトル入力
実装: コマ行（所要分・タイトル・運営メモ・最大80行）
実装: 累積分数モデルによる連動再計算（timeline-engine.js）
実装: 選択行 ±5分クイック調整
実装: 行追加・削除・上下移動（差し込みイベント対応）
実装: アンカー行（固定開始時刻）と衝突警告
実装: 目標終了時刻と early/over サマリー
実装: 現在時刻・残り時間（進行中コマ / 任意行フォーカス）
実装: プレーンテキスト・TSV の1クリックコピー
実装: 編集 / プレビュー2カラム（スマホはタブ切替）
実装: focus chrome（当日集中 · 16本ナビ非表示）
実装: A4 印刷（緑ヘッダー · 時刻/分/コマ/備考4列 · 目標終了フッター）
実装: group-split / warikan からの相互導線
未実装: localStorage / JSON 下書き保存・読込（v1.1）
未実装: セクション見出し行・設営/バラシテンプレ（v1.1）
未実装: 複数マイルストーン・表示時間窓 displayFrom/until（v1.2）
未実装: 行 DnD（v1.1）
未実装: SUGUDASU Sync イベント進行（timeline-sync · ドメイン準備までサイト非掲載）
データ: upload=false serverSave=false retention=ページを閉じると入力は失われる。記録はコピー/印刷で幹事が自行保管
```


---

## invoice

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


---

## receipt

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


---

## fair-draw

status: **reviewed** · updated: 2026-06-22
productName: SUGUDASU 抽選 · stage: beta · URL: https://sugudasu.com/fair-draw

## マーケ（matrix 参照 · 捏造禁止）

- 主Pain: キャンペーンの抽選で「内定・サクラ」を疑われる恐怖
- 最優先の型: 型D
- △相当: キャンペーンが「一般消費者向け」か「社内身内向け」かの境界
- 聞き直し例: 「このアマギフ抽選、対外キャンペーン用の法律上限って何円だっけ？」

## 一行

景表法の一次チェックと公平抽選・証跡PDFをブラウザ内で生成

## 実装済み（reviewed のみ Gemini が断定可）

- 景品表示法ルール表による一次スクリーニング（合法/違法断定なし）
- Web Crypto ベースの公平抽選（シード再現）
- キャンペーン識別名（必須）
- 監査PDF（印刷）・結果JSONダウンロード
- 名簿スナップショットダウンロード
- TSVコピー（Excel貼付向け）
- 社内イベント / 対外キャンペーンの Step0 分岐
- sessionStorage に実施者名のみ短期保持（CP名は毎回入力）

## 未実装 / 言い過ぎ注意

- 社内統制システム・操作ログ・権限管理
- 応募フォーム・応募者取得
- コース選択UI（コースごとに名簿を分ける運用推奨）
- 法的助言の代替

## データ取り扱い

- upload: false
- serverSave: false
- localStorage: なし
- retention: sessionStorage: 実施者名のみ。名簿・結果はユーザーがPDF/JSONで自行保管

## 信頼 FAQ 素材

- 保存: 名簿はブラウザ内シャッフル。サーバー非送信。
- 編集: 抽選前なら名簿修正可。確定後は証跡を新規実行で残す運用。
- 保持: 90日自動削除などのサーバー保持なし。PDF/JSONは幹事保管。

## 完了後導線

- 監査PDF保存
- 名簿スナップショット・JSON保存
- TSVをExcelへ

## Gemini メモ

「合法」「違法」断定禁止。統制システムの代替ではないと明記。

## Gemini 添付ブロック（1ツール）

```text
【fair-draw 事実 · status=reviewed】
SUGUDASU 抽選 / https://sugudasu.com/fair-draw
Pain: キャンペーンの抽選で「内定・サクラ」を疑われる恐怖
実装: 景品表示法ルール表による一次スクリーニング（合法/違法断定なし）
実装: Web Crypto ベースの公平抽選（シード再現）
実装: キャンペーン識別名（必須）
実装: 監査PDF（印刷）・結果JSONダウンロード
実装: 名簿スナップショットダウンロード
実装: TSVコピー（Excel貼付向け）
実装: 社内イベント / 対外キャンペーンの Step0 分岐
実装: sessionStorage に実施者名のみ短期保持（CP名は毎回入力）
未実装: 社内統制システム・操作ログ・権限管理
未実装: 応募フォーム・応募者取得
未実装: コース選択UI（コースごとに名簿を分ける運用推奨）
未実装: 法的助言の代替
データ: upload=false serverSave=false retention=sessionStorage: 実施者名のみ。名簿・結果はユーザーがPDF/JSONで自行保管
```


---

## normalize

status: **reviewed** · updated: 2026-06-22
productName: SUGUDASU 正規化 · stage: beta · URL: https://sugudasu.com/normalize

## マーケ（matrix 参照 · 捏造禁止）

- 主Pain: 名簿やコードの全半角混在やスペース崩れを直す手間の多さ
- 最優先の型: 型D
- △相当: スペースの有無や全半角の「パッと見では揃って見える」不揃いさ
- 聞き直し例: 「コピペした名簿、苗字と名前の間のスペース全角半角混ざってない？」

## 一行

Excel列コピーの全半角・空白を用途別プリセットで整え、500行まで非送信変換

## 実装済み（reviewed のみ Gemini が断定可）

- 500行上限・行数 Before/After 表示
- 用途プリセット3種（EC登録・名簿・CSV）
- コピー時に最新設定で再変換してからクリップボードへ
- 先頭ゼロ保護・カタカナ長音保護（プリセット依存）
- オフライン動作

## 未実装 / 言い過ぎ注意

- 複数列同時の高度なCSVパース
- サーバー側バッチ処理

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
SUGUDASU 正規化 / https://sugudasu.com/normalize
Pain: 名簿やコードの全半角混在やスペース崩れを直す手間の多さ
実装: 500行上限・行数 Before/After 表示
実装: 用途プリセット3種（EC登録・名簿・CSV）
実装: コピー時に最新設定で再変換してからクリップボードへ
実装: 先頭ゼロ保護・カタカナ長音保護（プリセット依存）
実装: オフライン動作
未実装: 複数列同時の高度なCSVパース
未実装: サーバー側バッチ処理
データ: upload=false serverSave=false retention=セッション内のみ
```


---

## webp-to-jpg

status: **reviewed** · updated: 2026-06-22
productName: SUGUDASU WebP変換 · stage: beta · URL: https://sugudasu.com/webp-to-jpg

## マーケ（matrix 参照 · 捏造禁止）

- 主Pain: WebP画像が古いOfficeやレガシーシステムに貼れない
- 最優先の型: 型B
- △相当: 「この画像ファイル、相手のパソコンでもちゃんと表示されるか」の不安
- 聞き直し例: 「このWebPって画像、先方の古いパワーポイントでもそのまま開ける？」

## 一行

WebPをJPG/PNGに端末内だけで変換（アップロード型サービスと差別化）

## 実装済み（reviewed のみ Gemini が断定可）

- WebP→PNG / WebP→JPEG
- 最大20枚・ブラウザ内デコード
- ZIP一括ダウンロード
- 透過WebP→JPEG時は白背景（PNGで透過維持）
- 競合比較表（アップロード型との違い）

## 未実装 / 言い過ぎ注意

- PNG/JPEG→WebP への変換
- サーバーへ画像を送る変換

## データ取り扱い

- upload: false
- serverSave: false
- localStorage: なし
- retention: 画像はメモリ上のみ。ダウンロード後はユーザー管理

## 信頼 FAQ 素材

- 保存: 画像ファイルは SUGUDASU サーバーへ POST しない。
- 編集: 再選択・再変換可。
- 保持: サーバー側に画像を保持しない。

## 完了後導線

- 変換ファイルをダウンロード
- Office・社内システムへ貼付

## Gemini メモ

競合は「アップロード型」一般化で名指し可（ページ内既存表と整合）。

## Gemini 添付ブロック（1ツール）

```text
【webp-to-jpg 事実 · status=reviewed】
SUGUDASU WebP変換 / https://sugudasu.com/webp-to-jpg
Pain: WebP画像が古いOfficeやレガシーシステムに貼れない
実装: WebP→PNG / WebP→JPEG
実装: 最大20枚・ブラウザ内デコード
実装: ZIP一括ダウンロード
実装: 透過WebP→JPEG時は白背景（PNGで透過維持）
実装: 競合比較表（アップロード型との違い）
未実装: PNG/JPEG→WebP への変換
未実装: サーバーへ画像を送る変換
データ: upload=false serverSave=false retention=画像はメモリ上のみ。ダウンロード後はユーザー管理
```


---

## shift

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


---

## label

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


---

## sns

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


---

## present

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


---

## work-calc

status: **scaffold** · updated: 2026-06-22
productName: SUGUDASU 労働時間一括集計 · stage: unknown · URL: https://sugudasu.com/work-calc

## マーケ（matrix 参照 · 捏造禁止）

- 主Pain: 15分・30分刻みの出退勤テキストの丸め処理と合計が重労働
- 最優先の型: 型A
- △相当: 「10:03着」などの打刻に対し、何分単位で切り捨てるかの規律
- 聞き直し例: 「うちの店って、一分単位の遅刻も15分単位で丸めていいんだっけ？」

## 実装済み（reviewed のみ Gemini が断定可）

- 要確認（status が reviewed でない、または未記入）

## 未実装 / 言い過ぎ注意

- ツール未実装（planned · registry 未登録）
- 出退勤テキストの端数丸め一括集計

## データ取り扱い

- upload: false
- serverSave: false
- localStorage: 要確認（実装時）
- retention: 要確認（実装時）

## 信頼 FAQ 素材

- 保存: 要確認
- 編集: 要確認
- 保持: 要確認

## Gemini メモ

planned — 断定コピー禁止

## Gemini 添付ブロック（1ツール）

```text
【work-calc 事実 · status=scaffold】
SUGUDASU 労働時間一括集計 / https://sugudasu.com/work-calc
Pain: 15分・30分刻みの出退勤テキストの丸め処理と合計が重労働
未実装: ツール未実装（planned · registry 未登録）
未実装: 出退勤テキストの端数丸め一括集計
データ: upload=false serverSave=false retention=要確認（実装時）
```


---

## table-conv

status: **scaffold** · updated: 2026-06-22
productName: SUGUDASU 表データ相互コンバータ · stage: unknown · URL: https://sugudasu.com/table-conv

## マーケ（matrix 参照 · 捏造禁止）

- 主Pain: ExcelとMarkdownの間で表データをコピペすると構造が壊れる
- 最優先の型: 型D
- △相当: Excelのセルをテキストに貼ったときのタブ区切りの見えない構造
- 聞き直し例: 「Notionにこの表貼りたいんだけど、セル崩れずにコピペできる？」

## 実装済み（reviewed のみ Gemini が断定可）

- 要確認（status が reviewed でない、または未記入）

## 未実装 / 言い過ぎ注意

- ツール未実装（planned · registry 未登録）
- Excel⇔Markdown 双方向変換

## データ取り扱い

- upload: false
- serverSave: false
- localStorage: 要確認（実装時）
- retention: 要確認（実装時）

## 信頼 FAQ 素材

- 保存: 要確認
- 編集: 要確認
- 保持: 要確認

## Gemini メモ

planned — 断定コピー禁止

## Gemini 添付ブロック（1ツール）

```text
【table-conv 事実 · status=scaffold】
SUGUDASU 表データ相互コンバータ / https://sugudasu.com/table-conv
Pain: ExcelとMarkdownの間で表データをコピペすると構造が壊れる
未実装: ツール未実装（planned · registry 未登録）
未実装: Excel⇔Markdown 双方向変換
データ: upload=false serverSave=false retention=要確認（実装時）
```


---

## report

status: **reviewed** · updated: 2026-06-22
productName: SUGUDASU 議事録 · stage: gamma · URL: https://sugudasu.com/report

## マーケ（matrix 参照 · 捏造禁止）

- 主Pain: 要確認
- 最優先の型: 要確認
- △相当: 要確認
- 聞き直し例: 要確認

## 一行

箇条書きメモをビジネス文面に整形しコピー（Gemini用プロンプト生成可）

## 実装済み（reviewed のみ Gemini が断定可）

- 議事録・報告書など書類種別テンプレ
- ブラウザ内整形＋ワンクリックコピー
- Gemini用指示文の生成・コピー（ユーザーが手動貼付）
- 2タブ（そのまま使う / AIで仕上げる）

## 未実装 / 言い過ぎ注意

- SUGUDASUからGemini API直叩き
- チャット共有Phase2（Backlog記載）
- 自動送信

## データ取り扱い

- upload: false
- serverSave: false
- localStorage: なし
- retention: メモはセッション内。Gemini貼付はユーザー操作

## 信頼 FAQ 素材

- 保存: 整形はブラウザ内。Gemini連携はコピー後ユーザー送信。
- 編集: 入力変更で再整形可。
- 保持: 永続保存なし。

## 完了後導線

- 整形文をメール・チャットへコピー
- Gemini用プロンプトをコピーして仕上げ

## Gemini メモ

「AI下書き」はGeminiへの手動貼付前提。

## Gemini 添付ブロック（1ツール）

```text
【report 事実 · status=reviewed】
SUGUDASU 議事録 / https://sugudasu.com/report
Pain: 要確認
実装: 議事録・報告書など書類種別テンプレ
実装: ブラウザ内整形＋ワンクリックコピー
実装: Gemini用指示文の生成・コピー（ユーザーが手動貼付）
実装: 2タブ（そのまま使う / AIで仕上げる）
未実装: SUGUDASUからGemini API直叩き
未実装: チャット共有Phase2（Backlog記載）
未実装: 自動送信
データ: upload=false serverSave=false retention=メモはセッション内。Gemini貼付はユーザー操作
```


---

## reverse

status: **reviewed** · updated: 2026-06-22
productName: SUGUDASU 逆引き · stage: gamma · URL: https://sugudasu.com/reverse

## マーケ（matrix 参照 · 捏造禁止）

- 主Pain: 要確認
- 最優先の型: 要確認
- △相当: 要確認
- 聞き直し例: 要確認

## 一行

ビジネス場面別の言い換え辞典とGemini拡張用コピー

## 実装済み（reviewed のみ Gemini が断定可）

- 場面別内蔵辞書（メール・謝罪・SNS等）
- ワンクリックコピー
- Gemini用プロンプト生成・コピー（手動貼付）
- 2タブ（すぐ使える / AIで広げる）

## 未実装 / 言い過ぎ注意

- 辞書のユーザー追加・クラウド同期
- Gemini API 直結

## データ取り扱い

- upload: false
- serverSave: false
- localStorage: なし
- retention: セッション内のみ

## 信頼 FAQ 素材

- 保存: 辞書検索はブラウザ内。
- 編集: 入力・場面変更で再検索可。
- 保持: 永続保存なし。

## 完了後導線

- 言い換えをコピー
- Gemini用文面をコピーして拡張

## Gemini 添付ブロック（1ツール）

```text
【reverse 事実 · status=reviewed】
SUGUDASU 逆引き / https://sugudasu.com/reverse
Pain: 要確認
実装: 場面別内蔵辞書（メール・謝罪・SNS等）
実装: ワンクリックコピー
実装: Gemini用プロンプト生成・コピー（手動貼付）
実装: 2タブ（すぐ使える / AIで広げる）
未実装: 辞書のユーザー追加・クラウド同期
未実装: Gemini API 直結
データ: upload=false serverSave=false retention=セッション内のみ
```


---

## hub

status: **reviewed** · updated: 2026-06-22
productName: ツール一覧 · stage: gamma · URL: https://sugudasu.com/

## マーケ（matrix 参照 · 捏造禁止）

- 主Pain: 要確認
- 最優先の型: 要確認
- △相当: 要確認
- 聞き直し例: 要確認

## 一行

SUGUDASU全ツールの入口・回遊ハブ（登録不要・静的ポータル）

## 実装済み（reviewed のみ Gemini が断定可）

- 全ツールカード一覧・ナビ連動
- FAQ回遊導線
- homonym注意バナー（localStorage で dismiss）
- statements / updates への導線

## 未実装 / 言い過ぎ注意

- ユーザーアカウント・お気に入り
- ツール横断の統合検索

## データ取り扱い

- upload: false
- serverSave: false
- localStorage: sg-homonym-dismiss のみ
- retention: ポータル自体はデータを保持しない

## 信頼 FAQ 素材

- 保存: ポータルは各ツールへリンクするのみ。
- 編集: —
- 保持: —

## 完了後導線

- 各ツールページへ遷移
- statements で設計原則確認

## Gemini メモ

ポータル単体のPainコピーは作らない。各ツールへ誘導。

## Gemini 添付ブロック（1ツール）

```text
【hub 事実 · status=reviewed】
ツール一覧 / https://sugudasu.com/
Pain: 要確認
実装: 全ツールカード一覧・ナビ連動
実装: FAQ回遊導線
実装: homonym注意バナー（localStorage で dismiss）
実装: statements / updates への導線
未実装: ユーザーアカウント・お気に入り
未実装: ツール横断の統合検索
データ: upload=false serverSave=false retention=ポータル自体はデータを保持しない
```


---

## font-converter

status: **reviewed** · updated: 2026-06-23
productName: SUGUDASU フォント変換 · stage: gamma · URL: https://sugudasu.com/font-converter

## マーケ（matrix 参照 · 捏造禁止）

- 主Pain: 要確認
- 最優先の型: 要確認
- △相当: 要確認
- 聞き直し例: 要確認

## 一行

SNS向けUnicodeフォント23種＋特殊記号をブラウザ内変換・コピー

## 実装済み（reviewed のみ Gemini が断定可）

- 23フォントスタイル一括変換（白抜き・筆記体・ギャル文字等）
- 定番/英数字/日本語フィルタ
- ミニ特殊文字・444記号のワンタップコピー
- /sns との役割分担ナビ

## 未実装 / 言い過ぎ注意

- API投稿
- ユーザー辞書の保存
- ハッシュタグの検索互換保証

## データ取り扱い

- upload: false
- serverSave: false
- localStorage: なし
- retention: セッション内のみ

## 信頼 FAQ 素材

- 保存: 入力はブラウザ内変換のみ。外部送信なし。
- 編集: 入力変更で即再変換。
- 保持: 永続保存なし。

## 完了後導線

- 各スタイルまたは記号をコピーしてSNSプロフィールへ貼付

## Gemini 添付ブロック（1ツール）

```text
【font-converter 事実 · status=reviewed】
SUGUDASU フォント変換 / https://sugudasu.com/font-converter
Pain: 要確認
実装: 23フォントスタイル一括変換（白抜き・筆記体・ギャル文字等）
実装: 定番/英数字/日本語フィルタ
実装: ミニ特殊文字・444記号のワンタップコピー
実装: /sns との役割分担ナビ
未実装: API投稿
未実装: ユーザー辞書の保存
未実装: ハッシュタグの検索互換保証
データ: upload=false serverSave=false retention=セッション内のみ
```


---

## Gemini 一括添付（コピペ）

```text
【各ツール事実（捏造禁止 · reviewed 以外は要確認）】
- warikan [OK]: SUGUDASU 割り勘 / 型A / https://sugudasu.com/warikan
- group-split [OK]: SUGUDASU 班分け / 型A / https://sugudasu.com/group-split
- timeline [OK]: SUGUDASU イベント進行 / 型A / https://sugudasu.com/timeline
- invoice [OK]: SUGUDASU 請求書 / 型B / https://sugudasu.com/invoice
- receipt [OK]: SUGUDASU 領収書 / 型B / https://sugudasu.com/receipt
- fair-draw [OK]: SUGUDASU 抽選 / 型D / https://sugudasu.com/fair-draw
- normalize [OK]: SUGUDASU 正規化 / 型D / https://sugudasu.com/normalize
- webp-to-jpg [OK]: SUGUDASU WebP変換 / 型B / https://sugudasu.com/webp-to-jpg
- shift [OK]: SUGUDASU シフト / 型C / https://sugudasu.com/shift
- label [OK]: SUGUDASU ラベル / 型D / https://sugudasu.com/label
- sns [OK]: SUGUDASU SNS / 型B / https://sugudasu.com/sns
- present [OK]: SUGUDASU ギフト / 型B / https://sugudasu.com/present
- work-calc [要確認]: SUGUDASU 労働時間一括集計 / 型A / https://sugudasu.com/work-calc
- table-conv [要確認]: SUGUDASU 表データ相互コンバータ / 型D / https://sugudasu.com/table-conv
- report [OK]: SUGUDASU 議事録 / 型? / https://sugudasu.com/report
- reverse [OK]: SUGUDASU 逆引き / 型? / https://sugudasu.com/reverse
- hub [OK]: ツール一覧 / 型? / https://sugudasu.com/
- font-converter [OK]: SUGUDASU フォント変換 / 型? / https://sugudasu.com/font-converter
```

