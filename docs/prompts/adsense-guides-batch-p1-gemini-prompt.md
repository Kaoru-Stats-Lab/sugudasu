# Gemini依頼用: AdSense P1 — ガイド小分けプロンプト集

**用途:** Gemini に **1セッション＝1タスク** で依頼し、品質を落とさない  
**更新:** 2026-07-16  
**背景:** [`ADSENSE_LOW_VALUE_CONTENT_AUDIT_20260715.md`](../notes/ADSENSE_LOW_VALUE_CONTENT_AUDIT_20260715.md) §3 P1  
**戦略正本:** [`GUIDES_CONTENT_STRATEGY.md`](../notes/GUIDES_CONTENT_STRATEGY.md)  
**事実確認:** [`ADSENSE_GEMINI_PACK_REVIEW_20260715.md`](../notes/ADSENSE_GEMINI_PACK_REVIEW_20260715.md)

---

## 実行順（推奨）

| 順 | プロンプト | 何を出すか | 保存先（例） |
|----|-----------|-----------|--------------|
| 0 | [P0 共通制約](#p0-共通制約貼り付け用) | （参照のみ · 各Pに内包済み） | — |
| 1 | [P1 候補選定](#p1-候補選定表のみ) | 候補表 3〜5行 | `adsense-p1-01-candidates.md` |
| 2 | [P2 planning-poker](#p2-記事1本-planning-poker-estimation) | 記事パック1本 | `adsense-p1-02-planning-poker.md` |
| 3 | [P3 mask](#p3-記事1本-pdf-image-masking-security) | 記事パック1本 | `adsense-p1-03-mask.md` |
| 4 | [P4 非送信](#p4-記事1本-browser-data-privacy) | 記事パック1本 | `adsense-p1-04-browser-privacy.md` |
| 5 | [P5 見積請求](#p5-記事1本-client-invoice-dispute-prevention) | 記事パック1本 | `adsense-p1-05-invoice-dispute.md` |
| 6 | [P6 当日遅れ](#p6-記事1本-event-day-timeline-recovery) | 記事パック1本 | `adsense-p1-06-timeline-recovery.md` |
| 7 | [P7 event-runbook 加筆](#p7-加筆1本-event-runbook) | 追記ブロック1本 | `adsense-p1-07-event-runbook.md` |
| 8 | [P8 training-timeline 加筆](#p8-加筆1本-training-timeline-tips) | 追記ブロック1本 | `adsense-p1-08-training-timeline.md` |
| 9 | [P9 excel-vs-web 加筆](#p9-加筆1本-excel-vs-web-timeline) | 追記ブロック1本 | `adsense-p1-09-excel-vs-web.md` |

**鉄則:** 1チャットに複数の P を混ぜない。P2〜P6 は **別セッション** で順に実行。  
**パイプライン:** Gemini →（任意 Grok）→ Cursor 事実確認 → HTML  
**結果置き場:** `docs/notes/guides-brushup/`

### 2026-07-15 時点のスキップ目安

| slug | 状態 | 使うプロンプト |
|------|------|----------------|
| planning-poker-estimation 他4本 | HTML 済 | P2〜P6 は **加筆依頼** に差し替え可（下記「加筆版1行」参照） |
| event 系3本 | 薄い | **P7〜P9 を優先** |

---

## P0 共通制約（貼り付け用）

各プロンプトに要約を内包済み。**単独で貼る必要はない。** 事実確認時だけ参照。

```text
■ サイト: https://sugudasu.com · 登録不要ブラウザツール集 · /guides/{slug}
■ 柱: event / production / docs / team / brand（1記事1柱）
■ 品質: 本文2,000字+ · 失敗談2+ · 表orチェックリスト1+ · ツール直リンク
■ 禁止: 通信ゼロ · 完全匿名 · PDF直墨消し · 多人端末同期 · 秒単位シフト · 競合名指し
■ 既存13 slug（重複禁止）:
event-runbook, training-timeline-tips, excel-vs-web-timeline, fair-group-split,
invoice-browser-workflow, construction-schedule-excel, web-production-schedule-excel,
office-roster-normalize, planning-poker-estimation, pdf-image-masking-security,
browser-data-privacy, client-invoice-dispute-prevention, event-day-timeline-recovery
```

---

## P1 候補選定（表のみ）

**出力:** Markdown 表 3〜5行だけ。**本文は書かない。**

```text
ROLE: コンテンツ企画の編集者。礼賛禁止。表のみ出力。

【タスク】
SUGUDASU（sugudasu.com）の AdSense「有用性の低いコンテンツ」対策として、
/guides に追加すべき記事候補を **優先順つきで3〜5行** 提案せよ。

【必須テーマ（3つは必ず行に含める）】
1. planning-poker / 見積会議
2. mask / 画像黒塗り・機密消し
3. 非送信実務（総務・情シス向け検証手順）

【4〜5本目の候補プール】
見積→請求合意 / 当日タイムライン遅れ / 名簿整備(normalize) / QR現場運用

【制約】
- 既存 slug と被る場合は slug 列に既存名を書き、新規は別角度の kebab-case を提案
- 1行あたり関連ツール最大2 · ドアウェイ化しない
- 推測は「推測」

【出力フォーマット — この表だけ】
| 優先 | slug | 柱 | タイトル(40字内) | ペルソナ1文 | tools | AdSenseに効く理由1文 |

【禁止】本文 · FAQ · 記事パック · WordPress助言 · 礼賛
```

---

## P2 記事1本: planning-poker-estimation

**新規作成時:** そのまま貼る。  
**既に HTML 済みのとき:** 末尾の1行を `既存記事の加筆。新規slugは作らない。` に差し替え。

```text
ROLE: 見積会議ファシリテーションの実務ライター。礼賛禁止。

【今回の slug】planning-poker-estimation（柱: team）
【関連ツール】planning-poker, timeline（最大2）

【ツール事実 — 崩すと却下】
- /planning-poker · 見積会議（Planning Poker）。工数を当てるAIではない
- 司会が1画面で全員分を伏せ入力 → Reveal で同時公開
- 別端末個別投票は未対応（検討中）。画面共有＋代行入力が正
- デッキ: 0,1,2,3,5,8,13,21,34,55,89,?,☕ · Reveal前は点数非表示
- CSV出力 · 非送信（業務データPOSTなし）
- 誤り禁止: estimate-meeting / 各自ブラウザ秘匿投票

【タスク】
上記 slug の **記事パック1本のみ** 出力。他記事・他slugは書かない。

【出力 — この構造だけ】

### PACK: planning-poker-estimation
- title / description(120字内) / pillar / tools / published候補日

#### 対象読者・場面（リード2段落）

#### この記事でわかること（bullet 4 · 各40字内）

#### 見出しアウトライン（h2/h3 · 6〜10個）

#### 本文ドラフト（2,000字以上 · 表orチェックリスト1以上 · 失敗談2以上）
SUGUDASU操作は司会代行→Revealの5ステップを含める。

#### 関連ツール CTA（/planning-poker 直リンク）

#### FAQ 3問（Q+A各2〜4文）

#### Cursor実装メモ（guides.json JSON · 内部リンクslug · 要確認フラグ）

【禁止】他slug · 通信ゼロ · 未実装機能 · 競合名指し · 礼賛
【トーン】PM/ディレクター向け実務。明日の会議で使える粒度。
```

---

## P3 記事1本: pdf-image-masking-security

```text
ROLE: 情報セキュリティ寄りの実務ライター（法務断定はしない）。礼賛禁止。

【今回の slug】pdf-image-masking-security（柱: brand）
【関連ツール】mask（1つのみ）

【ツール事実 — 崩すと却下】
- /mask · 画像(PNG/JPEG等)の機密消し: 黒塗り/ぼかし/同色塗り + スタンプ・矢印注釈
- **PDF直接読み込み墨消しなし** → 「PDF→画像化→マスクでピクセル上書き」手順で書く
- Canvasピクセル上書き · OCR自動検出なし
- 非送信（業務画像をサーバPOSTしない）
- 誤り禁止: 「100%復元不可能」「PDF墨消し本体」の断定

【タスク】
上記 slug の記事パック1本のみ。

【出力 — P2と同構造】
### PACK: pdf-image-masking-security
（title〜Cursor実装メモまで同じ見出し構成）

【本文で必ず含めるブロック】
- 「見た目だけ黒塗り」の危険性（具体例1）
- 正しい手順チェックリスト（塗り漏れ・ぼかし残りの免責含む）
- PDFを扱う場合の画像化ルート（印刷/スクショ等 · 断定しすぎない）

【禁止】他slug · OCR未実装の断定 · 通信ゼロ · 礼賛
```

---

## P4 記事1本: browser-data-privacy

```text
ROLE: 総務・情シス向けの説明責任ライター。礼賛禁止。

【今回の slug】browser-data-privacy（柱: docs）
【関連ツール】invoice, mask（最大2）

【事実 — 崩すと却下】
- 正: 業務データ（請求書・名簿・マスク画像等）を当社サーバへ送信しない設計
- 検証: DevTools → Network → Fetch/XHR で業務POSTが無いことを自分で確認
- 別レイヤ: 静的アセット · AdSense · 解析タグは別問題として1段落で触れる
- 誤り禁止: 「通信が一切ない」「完全匿名」「全ツールLocalStorage自動保存」

【タスク】
上記 slug の記事パック1本のみ。情シスが社内稟議に使える **検証手順** を中心に。

【出力 — P2と同構造】
### PACK: browser-data-privacy

【本文で必ず含めるブロック】
- 非送信の定義（何を送らないか / 何は別か）
- DevTools検証ステップ（番号付き 5〜7手順）
- 稟議・社内説明用の一言台本（2例）
- 失敗談: 「ブラウザ完結＝監査不要」誤解 等

【禁止】他slug · 通信ゼロ · 礼賛
```

---

## P5 記事1本: client-invoice-dispute-prevention

```text
ROLE: フリーランス・受託向けの実務ライター。税務断定はしない。礼賛禁止。

【今回の slug】client-invoice-dispute-prevention（柱: docs）
【関連ツール】invoice, planning-poker

【事実】
- /invoice · ブラウザでインボイス請求書PDF · 手動エクスポート中心（自動保存を断定しない）
- /planning-poker · 変更当日の見積会議に使える（司会代行+Reveal）
- 税率・記載事項は「要確認」+ 国税庁リンクプレースホルダ

【タスク】
「仕様変更の追加工数をうやむやにしない」合意フローの記事パック1本のみ。

【出力 — P2と同構造】
### PACK: client-invoice-dispute-prevention

【本文で必ず含めるブロック】
- 変更発生→当日見積会議→見積/請求PDF合意のフロー表
- クライアント同席時の進め方（失敗談1）
- 「口頭OKだけ」で終わった案件の分岐（失敗談1）

【禁止】税率断定 · 他slug · 礼賛
```

---

## P6 記事1本: event-day-timeline-recovery

```text
ROLE: イベント幹事向けの当日運用ライター。礼賛禁止。

【今回の slug】event-day-timeline-recovery（柱: event）
【関連ツール】timeline

【ツール事実 — 崩すと却下】
- /timeline · 分単位の連動再計算 · アンカー
- **秒単位一括シフトは対象外**（秒を謳わない）
- 非送信

【タスク】
当日の遅れ補正・巻き戻し実務の記事パック1本のみ。

【出力 — P2と同構造】
### PACK: event-day-timeline-recovery

【本文で必ず含めるブロック】
- 遅れ発生時の判断分岐（巻き戻す/削る/延長する）
- 分単位再計算の考え方（具体シナリオ2）
- Excel進行表との併用時の失敗談1

【禁止】秒単位機能 · 他slug · 礼賛
```

---

## P7 加筆1本: event-runbook

**添付:** `tools/guides/event-runbook.html` の `<article>` 内テキスト

```text
ROLE: イベント幹事向け編集者。礼賛禁止。**新規slugは作らない。**

【対象】既存 slug: event-runbook（柱: event · 関連: timeline）

【タスク】
現行原稿を読んだうえで、**追記ブロック1つだけ** 出力。全文リライト禁止。

【出力 — この4項目だけ】
1. 現状の弱い点（1文）
2. 追記見出し（h2 1つ + h3 0〜2）
3. 追記本文（400〜600字 · 失敗談1 · チェックリスト1）
4. 追記後の推定総文字数

【追記テーマの提案（この中から1つに絞って書く）】
- 当日朝のパニックチェック（幹事あるある）
- ウェビナー vs 対面で変わる準備差分表

【禁止】他slug · 未実装機能 · 礼賛 · 全文書き直し
```

---

## P8 加筆1本: training-timeline-tips

**添付:** `tools/guides/training-timeline-tips.html` の article 内テキスト

```text
ROLE: 人事・研修ファシリ向け編集者。礼賛禁止。新規slug禁止。

【対象】既存 slug: training-timeline-tips（柱: event · 関連: timeline）

【タスク】
追記ブロック1つのみ。全文リライト禁止。

【出力】P7と同4項目

【追記テーマ（1つに絞る）】
- 遅れパターン別の対処表（休憩削る/ワーク短縮/終了延長）
- アイスブレイク時間の配分失敗談

【禁止】他slug · 秒単位 · 礼賛
```

---

## P9 加筆1本: excel-vs-web-timeline

**添付:** `tools/guides/excel-vs-web-timeline.html` の article 内テキスト

```text
ROLE: 幹事向け編集者。礼賛禁止。新規slug禁止。

【対象】既存 slug: excel-vs-web-timeline（柱: event · 関連: timeline）

【タスク】
追記ブロック1つのみ。全文リライト禁止。

【出力】P7と同4項目

【追記テーマ（1つに絞る）】
- 当日トイレから直せない失敗談 + Webが効く条件
- Excel #REF! / 版ズレの具体エピソード

【禁止】他slug · 礼賛
```

---

## 加筆版1行（P2〜P6 を既存記事向けに差し替えるとき）

各プロンプトの【タスク】直前に、次の1行を足して貼る。

```text
【モード】既存記事の加筆のみ。slugは変えない。追記ブロック（見出し+400〜800字+失敗談1+表1）とFAQ追記2問だけ出力。全文リライト禁止。
```

---

## Cursor 側の受け渡し

1. `docs/notes/guides-brushup/adsense-p1-*.md` に Gemini 出力を保存  
2. [`ADSENSE_GEMINI_PACK_REVIEW_20260715.md`](../notes/ADSENSE_GEMINI_PACK_REVIEW_20260715.md) で事実確認  
3. 新規: `data/guides.json` + `tools/guides/{slug}.html`  
4. 加筆: 既存 HTML の `sg-guide-body` に追記  
5. ツール FAQ → `/guides/{slug}` 1リンク · `changelog.json` 1行 · `npm run build:pages`

---

## 変更履歴

| 日付 | 内容 |
|------|------|
| 2026-07-16 | 初版（一括プロンプト） |
| 2026-07-16 | P1〜P9 に小分け。1セッション1タスク化 |
