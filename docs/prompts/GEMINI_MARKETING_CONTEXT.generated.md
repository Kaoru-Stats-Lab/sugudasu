# GEMINI マーケ添付コンテキスト（自動生成）

生成日時: 2026-06-22T07:25:51.029Z
正本プロンプト: `docs/prompts/kanji-san-lp-patterns-gemini.md`

---

# TOOL_FACTS（Gemini添付用・自動生成）

生成日時: 2026-06-22T07:25:50.701Z
source: `data/tool-registry.json`

| tool_id | productName | conceptName | stage | statusNote | URL |
| --- | --- | --- | --- | --- | --- |
| hub | ツール一覧 | ツール一覧 | gamma | ツール入口 · SEO・回遊導線を継続改善（Backlog §2-5） | https://sugudasu.com/ |
| invoice | SUGUDASU 請求書 | 請求書 | beta | P0残: 税計算・複数税率・印刷崩れの品質担保（§4-1 · §6） | https://sugudasu.com/invoice |
| receipt | SUGUDASU 領収書 | 領収書 | gamma | MVP+A4マルチ+URL共有済 · 内税等は後続（§9） | https://sugudasu.com/receipt |
| label | SUGUDASU ラベル | 宛名ラベル | gamma | 一括貼付: ヘッダー行除外 · 姓名スペース保護 · sg-segment統一済 | https://sugudasu.com/label |
| shift | SUGUDASU シフト | シフト表 | beta | P1: 公平性・改ページ・FIXロックの品質担保（§4-1 · §6） | https://sugudasu.com/shift |
| report | SUGUDASU 議事録 | 議事録 | gamma | UX改善済 · チャット共有Phase2は未（§2-4） | https://sugudasu.com/report |
| reverse | SUGUDASU 逆引き | 逆引き辞典 | gamma | STEP5 UX改善完了 · sns相互導線はP2（§1-2 · §4-3b） | https://sugudasu.com/reverse |
| normalize | SUGUDASU 正規化 | 文字列正規化 | beta | 500行cap · 行数Before/After · 用途プリセット3 · T03 Phase A | https://sugudasu.com/normalize |
| webp-to-jpg | SUGUDASU WebP変換 | WebP変換 | beta | WebP→JPG/PNG · 非送信（アップロード型と差別化）· T09 | https://sugudasu.com/webp-to-jpg |
| group-split | SUGUDASU 班分け | 班分け | beta | PC→スマホ同期メモ · 緩和モード · M02 タップ再編 · セッションJSON · Phase C · 250名cap · T11 | https://sugudasu.com/group-split |
| present | SUGUDASU ギフト | ギフト提案 | gamma | Amazon主戦場 · アフィ最適化はP1（§2-1 · §2-3） | https://sugudasu.com/present |
| fair-draw | SUGUDASU 抽選 | 公平抽選 | beta | キャンペーン識別名必須 · 証跡3点セット · 名簿スナップショット | https://sugudasu.com/fair-draw |
| warikan | SUGUDASU 割り勘 | 割り勘 | gamma | 端数過不足ヒーロー表示 · sg-copy-feedback · Xシェア導線済 | https://sugudasu.com/warikan |
| sns | SUGUDASU SNS | SNSデコ文字 | gamma | 自動変換UX済 · 拡張ユースケースはP2（§4-3b） | https://sugudasu.com/sns |

## Gemini 添付ブロック（コピペ）

```text
【各ツール事実（捏造禁止 · 不明は「要確認」）
- hub: ツール一覧 / stage=gamma / ツール入口 · SEO・回遊導線を継続改善（Backlog §2-5） / https://sugudasu.com/
- invoice: SUGUDASU 請求書 / stage=beta / P0残: 税計算・複数税率・印刷崩れの品質担保（§4-1 · §6） / https://sugudasu.com/invoice
- receipt: SUGUDASU 領収書 / stage=gamma / MVP+A4マルチ+URL共有済 · 内税等は後続（§9） / https://sugudasu.com/receipt
- label: SUGUDASU ラベル / stage=gamma / 一括貼付: ヘッダー行除外 · 姓名スペース保護 · sg-segment統一済 / https://sugudasu.com/label
- shift: SUGUDASU シフト / stage=beta / P1: 公平性・改ページ・FIXロックの品質担保（§4-1 · §6） / https://sugudasu.com/shift
- report: SUGUDASU 議事録 / stage=gamma / UX改善済 · チャット共有Phase2は未（§2-4） / https://sugudasu.com/report
- reverse: SUGUDASU 逆引き / stage=gamma / STEP5 UX改善完了 · sns相互導線はP2（§1-2 · §4-3b） / https://sugudasu.com/reverse
- normalize: SUGUDASU 正規化 / stage=beta / 500行cap · 行数Before/After · 用途プリセット3 · T03 Phase A / https://sugudasu.com/normalize
- webp-to-jpg: SUGUDASU WebP変換 / stage=beta / WebP→JPG/PNG · 非送信（アップロード型と差別化）· T09 / https://sugudasu.com/webp-to-jpg
- group-split: SUGUDASU 班分け / stage=beta / PC→スマホ同期メモ · 緩和モード · M02 タップ再編 · セッションJSON · Phase C · 250名cap · T11 / https://sugudasu.com/group-split
- present: SUGUDASU ギフト / stage=gamma / Amazon主戦場 · アフィ最適化はP1（§2-1 · §2-3） / https://sugudasu.com/present
- fair-draw: SUGUDASU 抽選 / stage=beta / キャンペーン識別名必須 · 証跡3点セット · 名簿スナップショット / https://sugudasu.com/fair-draw
- warikan: SUGUDASU 割り勘 / stage=gamma / 端数過不足ヒーロー表示 · sg-copy-feedback · Xシェア導線済 / https://sugudasu.com/warikan
- sns: SUGUDASU SNS / stage=gamma / 自動変換UX済 · 拡張ユースケースはP2（§4-3b） / https://sugudasu.com/sns
】
```

---

# LP マーケティングマトリクス（自動生成）

生成日時: 2026-06-22T07:25:50.979Z
source: `data/lp-marketing-matrix.json` · version 2026-06-22

## §1 優先度表

| tool_id | productName | registry | 主Pain（1行） | 最優先の型 | 理由（40字以内） | 実装難易度 |
| --- | --- | --- | --- | --- | --- | --- |
| warikan | SUGUDASU 割り勘 | live | 遅刻者や早退者が混ざる飲み会の集金計算が面倒 | 型A | 遅刻・早退の曖昧なグラデーションを傾斜に反映 | 低 |
| group-split | SUGUDASU 班分け | live | 開始直前のドタキャンでせっかく組んだ班のバランスが崩壊 | 型A | 名簿の貼り直しなしにワンタップで欠席者を除外 | 低 |
| timeline | SUGUDASU イベント進行 | planned | 現場でタイムスケジュールが巻いた・押した時の手計算が破綻 | 型A | 1箇所の時間変更から後続の全予定を連動再計算 | 中 |
| work-calc | SUGUDASU 労働時間一括集計 | planned | 15分・30分刻みの出退勤テキストの丸め処理と合計が重労働 | 型A | 各社で異なる端数丸めの曖昧さを吸収して一括集計 | 低 |
| fair-draw | SUGUDASU 公平抽選 | live | キャンペーンの抽選で「内定・サクラ」を疑われる恐怖 | 型D | 一般懸賞か社内イベントかの目的別全自動最適化 | 低 |
| normalize | SUGUDASU 文字列正規化 | live | 名簿やコードの全半角混在やスペース崩れを直す手間の多さ | 型D | EC登録用・名簿用など目的別プリセットで最適化 | 低 |
| table-conv | SUGUDASU 表データ相互コンバータ | planned | ExcelとMarkdownの間で表データをコピペすると構造が壊れる | 型D | コピペ元の形式に合わせた双方向変換の自動最適化 | 低 |
| label | SUGUDASU 宛名ラベル | live | 郵便番号や住所の分割エラーで市販ラベル印刷がズレる | 型D | 市販ラベル用紙メーカーの型番プリセット最適化 | 中 |
| invoice | SUGUDASU 見積・請求書 | live | 計算後の金額をもとに請求書PDFを発行する際の手数 | 型B | PDF出力と同時にチャット送付用メッセージを成形 | 中 |
| receipt | SUGUDASU 領収書 | live | 手取り逆算やインボイス要件を満たす手間の煩雑さ | 型B | 発行完了後にメールやチャットへ貼る通知文を成形 | 中 |
| sns | SUGUDASU SNS文章整形 | live | スマホ特有の改行崩れや特殊文字による誤メンションの発生 | 型B | 整形後に対象チャットの画面幅に合わせた一括コピー | 低 |
| webp-to-jpg | SUGUDASU 画像変換 | live | WebP画像が古いOfficeやレガシーシステムに貼れない | 型B | 変換完了と同時に軽量化率の明示と次工程の案内 | 低 |
| shift | SUGUDASU シフト表 | live | ブラウザを閉じたり誤ってリロードした際に入力データが消失 | 型C | LocalStorageによる入力内容の自動復元 | 低 |
| present | SUGUDASU ギフトサジェスター | live | 相手の属性や予算に合った適切な贈り物を選ぶ基準が曖昧 | 型B | 決定後にAmazon等のECへ即座に繋ぐ次工程動線 | 低 |

## §2 ツール束提案

| 束名 | 含むtool_id | 共通ペルソナ | 先に回すGeminiプロンプト順 |
| --- | --- | --- | --- |
| 幹事イベント束 | warikan / group-split / timeline / fair-draw / present | 飲み会・社内研修・ワークショップ・SNS懸賞の運営者 | warikan -> group-split -> timeline -> fair-draw -> present |
| 事務効率化・整形束 | work-calc / normalize / table-conv / sns / webp-to-jpg | 総務・Web担当・ライター・店舗店長・営業実務者 | work-calc -> normalize -> table-conv -> sns -> webp-to-jpg |
| ビジネス帳票束 | invoice / receipt / label / shift | フリーランス・小規模店舗主・人事労務担当者 | invoice -> receipt -> label -> shift |

## §3 「幹事さん△問題」相当

| tool_id | 既存手段の「△」に相当する曖昧さ | 幹事が聞き直す典型1文 |
| --- | --- | --- |
| warikan | 遅刻や早退、1次会のみ参加といったグラデーション | 「遅れて来るって言ってたけど、結局何時から合流できそう？」 |
| group-split | 「体調不良でいけたら行く」という直前までの出欠の流動性 | 「もうすぐ受付締め切るけど、Aさん今日来られそう？」 |
| timeline | 各プログラムの「大体5分くらい巻きそう・押しそう」な空気感 | 「今のセッション少し押してるけど、休憩時間何分削る？」 |
| work-calc | 「10:03着」などの打刻に対し、何分単位で切り捨てるかの規律 | 「うちの店って、一分単位の遅刻も15分単位で丸めていいんだっけ？」 |
| fair-draw | キャンペーンが「一般消費者向け」か「社内身内向け」かの境界 | 「このアマギフ抽選、対外キャンペーン用の法律上限って何円だっけ？」 |
| normalize | スペースの有無や全半角の「パッと見では揃って見える」不揃いさ | 「コピペした名簿、苗字と名前の間のスペース全角半角混ざってない？」 |
| table-conv | Excelのセルをテキストに貼ったときのタブ区切りの見えない構造 | 「Notionにこの表貼りたいんだけど、セル崩れずにコピペできる？」 |
| label | 住所録の「マンション名が長すぎて枠からはみ出る」文字数の揺らぎ | 「この長い住所、ラベルの枠内に収まるように途中で改行していい？」 |
| invoice | 税率が10%か8%（軽減税率）か混在する品目のグレーゾーン | 「このお弁当代の請求、中のジュースは消費税何パーセント計算？」 |
| receipt | 但し書きが「お品代」で本当に監査を通るかという社内規定の曖昧さ | 「領収書の但し書き、お品代じゃなくてセミナー参加費って書き直す？」 |
| sns | スマホの画面によって改行の位置がズレて読みづらくなる表示崩れ | 「さっきSlackに投稿したアナウンス、スマホからだと文字化けしてない？」 |
| webp-to-jpg | 「この画像ファイル、相手のパソコンでもちゃんと表示されるか」の不安 | 「このWebPって画像、先方の古いパワーポイントでもそのまま開ける？」 |
| shift | 「仮で組んだシフト」を確定前に一度ブラウザを閉じて保存する手段 | 「来月のシフト、まだ未確定なんだけど一回下書き保存できる？」 |
| present | 相手の役職や関係性に対して、高すぎず安すぎない予算感の揺らぎ | 「取引先の周年祝い、予算1万円って安すぎて失礼にならないかな？」 |

## §4 今週やるTop3

| 順位 | tool_id | 型 | 期待KPI | 提督が確認すべき事実1つ |
| --- | --- | --- | --- | --- |
| 1 | warikan | 型A | ページ滞在時間およびクリップボードコピー転換率の向上 | 途中参加・早退者の「時間傾斜」を反映したLINE精算文の需要 |
| 2 | group-split | 型A | リピート利用率（ドタキャン時の中断・離脱の低下） | 現場のスマホから「名前タップ1回で除外再計算」する際のDOM負荷 |
| 3 | timeline | 型A | 新規オーガニック検索流入数（進行表計算ニーズのハント） | 1つの項目の所要分変更が、配列上の後続時間に及ぼす連動ロジック |
