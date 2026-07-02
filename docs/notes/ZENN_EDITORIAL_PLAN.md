# Zenn 編集カレンダー（Gemini 企画 · SSOT）

**更新:** 2026-07-02（§2 #13/#17/#18 · mask 本番 · オフライン地図ネタ）  
**生成:** `docs/prompts/zenn-editorial-gemini.md`  
**採否:** Claude/Cursor 突合済 · 提督執筆前提（Gemini 本文禁止）

---

## 採用サマリー

| 項目 | 判定 |
|------|------|
| §1 編集方針 | **採用** |
| §2 テーマ10本 | **採用**（#6 の主ツールのみ修正 → 下記） |
| §3 ミニアウトライン #1〜5 | **採用**（CTA は直リンクに差し替え済） |
| §4 3ヶ月スケジュール | **採用**（6月〜8月 · 5本） |
| §5 媒体分担 | **採用** |
| §6 リスク | **採用** + 週次更新頻度は X ガイドライン準拠 |
| §7 確認質問 | **回答済**（本ファイル末尾） |

### SSOT 修正（Gemini 出力からの差分）

| # | 修正 |
|---|------|
| **#6** | 主ツール ` /privacy` → **`/`（ポータル）**。本文で `privacy.html` / 非送信設計をリンク。privacy はツールではない。 |
| **CTA** | Gemini が Google 検索 URL を返したため、**すべて直リンク**に差し替え（下表） |
| **#4 H2-3** | 「空白ページ修正」は changelog 事実として可（2026-06 印刷CSS修正） |

---

## §1 Zenn編集方針

- **読者像:** 月数枚の書類作成にクラウド課金を躊躇するフリーランス、地味な店舗事務を自作ツールで効率化したい実務担当者、AIを活用した開発プロセスに関心があるエンジニア層。
- **案A/B/C 配分:** A 70%（月2〜3）/ B 20%（3ヶ月で1〜2）/ C 10%（期間内最大2本）
- **文字数:** 1,500〜2,500字
- **画像:** 操作スクショ基本 · 転用フロー等は短い GIF 併用

---

## §2 テーマ一覧

| # | 仮タイトル | 軸 | 主ツール | 読者 | フォーカス | 優先 | 字数 | utm_campaign |
|---|-----------|-----|----------|------|------------|------|------|----------------|
| 1 | 登録不要・下書きから転用する見積書と請求書 | A | /invoice | 個人事業主 | 下書き保存・タブ切替転用 | **P0** | 1,800 | article_01_invoice_convert |
| 2 | 非エンジニアがAIと作った実務ツールの裏側 | B | / | 開発者 | AI使い分け・静的配信・changelog速度 | P1 | 2,200 | article_02_hub_devstory |
| 3 | 飲み会幹事の傾斜割り勘（固定額＋残り按分・丸め・LINE） | A | /warikan | 幹事 | 固定額控除・端数・LINE文 | P1 | 1,500 | article_03_warikan_fixedmode |
| 4 | 店舗に合わせて枠数を変えるシフト表 | A | /shift | 店長 | 可変枠1〜3・公平生成・印刷 | P1 | 1,600 | article_04_shift_flexslots |
| 5 | 箇条書きメモを議事録に整形するアプローチ | A | /report | 事務 | 構造化・コピー・ローカル処理 | P1 | 1,500 | article_05_report_format |
| 6 | 顧客データをサーバーに送らないWebツールの設計 | B | **/** | セキュリティ関心 | 静的配信・ブラウザ内処理 | P1 | 2,000 | article_06_privacy_design |
| 7 | 宛名シールの型番検索と印刷 | A | /label | 発送担当 | 型番・CSV・位置ズレ | P2 | 1,600 | article_07_label_spec |
| 8 | ニュアンス類語検索でマンネリ回避 | C | /reverse | ビジネス | 言い換え手順 | P2 | 1,500 | article_08_reverse |
| 9 | マナーを意識したギフト提案の仕組み | C | /present | 一般 | 関係性・予算絞り込み | P2 | 1,500 | article_09_present |
| 10 | SNSプロフィールを文字化けさせずに飾る | A | /sns | SNS運用者 | フォント・文字数カウンター | P2 | 1,600 | article_10_sns |
| 11 | SNS懸賞の抽選を Excel からやめた話 — 公平シャッフルと説明用PDF | A (+B) | /fair-draw | マーケ幹事 · FL | 証跡3点 · 非送信 · note=景表法 | **P2** | 2,200 | article_11_fairdraw_excel |
| 12 | Excel列コピーと全角半角サイトの「あるある」— 行数チェック付き正規化 | A (+B) | /normalize | EC·名簿担当 · FL | Gemini事故カタログ · 非送信 · コピーゲート | **P1** | 2,000 | article_12_normalize_oops |
| **14** | **研修の班分けを Excel の RAND() からやめる** — 納会・ハッカソンで重さが違う | A (+B) | /group-split | 人事 · 研修 · **ハッカソン運営** | 非送信 · 職能名簿 · スイッチャー · TSV/Slack | **P1** | 2,200 | article_14_group_split |
| **15** | **イベント進行表を同時編集しても行が混ざらない** — 幹事向け衝突フリー同期（CRDT） | B (+A) | sync/timeline | 幹事 · FE · 個人開発 | LSeq · 手動反映 · 短期バッファ · 現場 | **P1** | 2,200 | article_15_sync_crdt_field |
| **13** | **WebPをJPGに変換するとき** — iLoveIMGに載せない選択肢 | A (+B) | /webp-to-jpg | 経費 · Wiki · FL | DevTools · 非送信 · 20枚 cap | **P1** | 2,000 | article_13_webp_to_jpg |
| **17** | **マニュアル用スクショの機密消し** — アップロード型黒塗りの代替 | A (+B) | /mask | 情シス · 引き継ぎ担当 | Canvas · スタンプ注記 · 非送信 | **P1** | 2,000 | article_17_mask_screenshot |
| **18** | **オフラインのブラウザは何ができるのか** — 非送信ツールを選ぶ地図 | B (+A) | /statements | 幹事 · 事務 · FL | 3つのオフライン · DevTools · ツール当てはめ | **P1** | 2,500 | article_18_offline_browser_map |

**#11 詳細:** [`docs/notes/ZENN_FAIR_DRAW_DRAFT_MEMO.md`](ZENN_FAIR_DRAW_DRAFT_MEMO.md) · **初稿:** [`ZENN_ARTICLE_11_DRAFT.md`](ZENN_ARTICLE_11_DRAFT.md) · **公開:** #14 後推奨  
**#12 詳細:** [`docs/notes/ZENN_NORMALIZE_DRAFT_MEMO.md`](ZENN_NORMALIZE_DRAFT_MEMO.md) · **初稿:** [`ZENN_ARTICLE_12_DRAFT.md`](ZENN_ARTICLE_12_DRAFT.md) — **Gemini `SUGUDASU_OOPS_GUARDRAILS.md` 連動**  
**#6 詳細:** [`docs/notes/ZENN_PRIVACY_DESIGN_DRAFT_MEMO.md`](ZENN_PRIVACY_DESIGN_DRAFT_MEMO.md) · **初稿:** [`ZENN_ARTICLE_06_DRAFT.md`](ZENN_ARTICLE_06_DRAFT.md)  
**#3 詳細:** [`docs/notes/ZENN_WARIKAN_DRAFT_MEMO.md`](ZENN_WARIKAN_DRAFT_MEMO.md) · **初稿:** [`ZENN_ARTICLE_03_DRAFT.md`](ZENN_ARTICLE_03_DRAFT.md)  
**#14 詳細:** [`docs/notes/ZENN_GROUP_SPLIT_DRAFT_MEMO.md`](ZENN_GROUP_SPLIT_DRAFT_MEMO.md) · **初稿:** [`ZENN_ARTICLE_14_DRAFT.md`](ZENN_ARTICLE_14_DRAFT.md)  
**#15 詳細:** [`docs/notes/ZENN_CRDT_SYNC_DRAFT_MEMO.md`](ZENN_CRDT_SYNC_DRAFT_MEMO.md) · **公開ゲート:** S4 行 CRDT または設計メモ明示  
**#13 詳細:** [`docs/notes/ZENN_WEBP_TO_JPG_DRAFT_MEMO.md`](ZENN_WEBP_TO_JPG_DRAFT_MEMO.md)  
**#17 詳細:** [`docs/notes/ZENN_MASK_DRAFT_MEMO.md`](ZENN_MASK_DRAFT_MEMO.md) · **α v0.1.0 本番 2026-07-02** · #6 実例続編  
**#18 詳細:** [`docs/notes/ZENN_OFFLINE_BROWSER_DRAFT_MEMO.md`](ZENN_OFFLINE_BROWSER_DRAFT_MEMO.md) · **#6 の読み物版ハブ** · 提督 2026-07-02 起票

**避けること（共通）:** 競合名指し · 100%安全/完全対応 · 未実装機能 · Vibe Coding

---

## §3 ミニアウトライン（#1〜#5）

### #1 見積→請求転用（P0 · 6月4週）

- **状態:** 予約投稿済み（2026-06-18 · スクショ差し替え済）

- **リード:** 会員登録なしで、見積データをそのまま請求書へ変える実務フローです。
- **H2:** アカウント不要で始められる理由 / 下書きをローカル保存する意味 / 書類タブ切替で転用
- **CTA:** https://sugudasu.com/invoice?utm_source=zenn&utm_medium=social&utm_campaign=article_01_invoice_convert

### #2 開発の裏側（P1 · 初稿あり · 9月上旬予定）

- **状態:** [`ZENN_ARTICLE_02_DRAFT.md`](ZENN_ARTICLE_02_DRAFT.md) · Zenn 下書き保存可
- **公開:** **9月上旬**（#11 の後 · B軸締め）
- **タイトル案:** `9月上旬エンジニアではないけれど、AIと並走して実務ツールを直すまで`
- **リード:** ツール連載のあと · AI分担 · Cloudflare · changelog
- **CTA:** https://sugudasu.com/?utm_source=zenn&utm_medium=social&utm_campaign=article_02_hub_devstory

### #3 固定額割り勘（P1 · 初稿あり · 9月中旬〜）

- **状態:** [`ZENN_ARTICLE_03_DRAFT.md`](ZENN_ARTICLE_03_DRAFT.md) · Zenn 下書き保存可
- **公開:** **9月中旬〜下旬**（#2 の後 · A軸再開）
- **タイトル:** `飲み会幹事の傾斜割り勘 — 固定額＋残り按分・丸め・LINE清算文`
- **尖り:** 傾斜係数 · 固定額＋残り按分（合コン以外も）· LRM · LINE清算文 · 2次会は別計算
- **CTA:** https://sugudasu.com/warikan?utm_source=zenn&utm_medium=social&utm_campaign=article_03_warikan_fixedmode

### #4 可変シフト（8月1週）

- **リード:** 早番・遅番固定に縛られない、1〜3枠のシフトを自動生成します。
- **H2:** 枠名の変更 / 希望休と偏り / A4印刷の工夫
- **CTA:** https://sugudasu.com/shift?utm_source=zenn&utm_medium=social&utm_campaign=article_04_shift_flexslots

### #5 議事録整形（8月3週）

- **リード:** 会議中の雑多なメモを、提出できる体裁に整えます。
- **H2:** 構造化のメリット / コピーしてチャットへ / ローカル処理
- **CTA:** https://sugudasu.com/report?utm_source=zenn&utm_medium=social&utm_campaign=article_05_report_format

### #11 fair-draw（P2 · **スリム版ドラフト** · #14 後）

- **状態:** [`ZENN_ARTICLE_11_DRAFT.md`](ZENN_ARTICLE_11_DRAFT.md)（~2,200字）· note [`NOTE_ARTICLE_FAIR_DRAW_DRAFT.md`](NOTE_ARTICLE_FAIR_DRAW_DRAFT.md)
- **Zenn 尖り:** RAND 卒業 · 疑惑3事例 · Phase 1 · 証跡3点 · 限界（抽選まで）· Phase 0 は note へ1段落
- **note 尖り:** 景表法 · 消費者庁 · 法務なし · SNSナレッジ
- **CTA:** https://sugudasu.com/fair-draw?utm_source=zenn&utm_medium=social&utm_campaign=article_11_fairdraw_excel

### #6 非送信設計（P1 · 初稿あり）

- **状態:** 初稿 [`ZENN_ARTICLE_06_DRAFT.md`](ZENN_ARTICLE_06_DRAFT.md) · 予約投稿は提督判断
- **リード:** ブラウザは多層 · オンライン/オフラインの切り分け · DevTools
- **H2:** 静的配信 / Copy-first / 通信レイヤ / DevTools / Sync は別ライン
- **CTA:** https://sugudasu.com/statements?utm_source=zenn&utm_medium=social&utm_campaign=article_06_privacy_design

### #14 班分け（予約投稿準備 · P1）

- **状態:** 初稿 [`ZENN_ARTICLE_14_DRAFT.md`](ZENN_ARTICLE_14_DRAFT.md) · **予約投稿待ち**（スクショ後）
- **リード:** `RAND()` は再現説明できない — シード付きシャッフルで「説明できる公平」
- **H2:** あるある / 納会・ハッカソンで重さが違う / RAND vs シード / ルーレットとの住み分け / TSV·Slack
- **X 連動:** [`X_POST_ZENN14_LAUNCH.md`](X_POST_ZENN14_LAUNCH.md)
- **CTA:** https://sugudasu.com/group-split?utm_source=zenn&utm_medium=social&utm_campaign=article_14_group_split

### #15 CRDT × 現場同期（S4 前後 · P1）

- **状態:** アウトライン [`docs/notes/ZENN_CRDT_SYNC_DRAFT_MEMO.md`](ZENN_CRDT_SYNC_DRAFT_MEMO.md) · 執筆未
- **公開ゲート:** S4 行序列 CRDT 実装 **または** 全文を「設計メモ」トーンに固定
- **リード:** 同じ位置に行を足すと進行表が読めなくなる — interleaving と NonInterleaving LSeq の話。
- **H2:** mom/dad 問題 / CRDT 一言 / Google表型 vs 現場Sync / LSeq / S1→S4 ロードマップ / なぜ今 Zenn に書くか
- **CTA:** https://sync.sugudasu.com/timeline?utm_source=zenn&utm_medium=social&utm_campaign=article_15_sync_crdt_field

---

## §4 3ヶ月スケジュール

### ストック状況（#12〜#3 · 2026-07-01）

| # | 初稿 | メモ | Zenn 下書き |
|---|------|------|-------------|
| #12 normalize | ✅ **Excel深堀り · 5プリセット · 事務OL** | `ZENN_NORMALIZE_DRAFT_MEMO` | 予約 **7/7** |
| #14 group-split | ✅ | `ZENN_GROUP_SPLIT_DRAFT_MEMO` | 可 |
| #6 非送信 | ✅ | `ZENN_PRIVACY_DESIGN_DRAFT_MEMO` | 可 |
| #11 fair-draw | ✅ | `ZENN_FAIR_DRAW_DRAFT_MEMO` + note 景表法 | 可 |
| #2 開発裏側 | ✅ | `ZENN_ARTICLE_02_OUTLINE` | 可 |
| **#3 warikan** | ✅ | `ZENN_WARIKAN_DRAFT_MEMO` | 可（9月） |

**note ストック:** `NOTE_ARTICLE_FAIR_DRAW_DRAFT` · `note-01-group-split-draft`（公開可）

### 確定・進行中（2026年7〜9月 · Zenn）

| 時期 | # | 状態 | 軸 | メモ |
|------|---|------|-----|------|
| 6月 | #1 invoice | **公開済** | A | 初回 |
| 7月 | #15 CRDT | **公開済** | B | Sync 入口（計画より先行可） |
| **7/7** | #12 normalize | **予約** | A | Excel vs サイト vs SUGUDASU · 5プリセット · 約2,800字 |
| **7月中旬〜下旬** | #14 group-split | 下書き | A | RAND 卒業 · 班分け |
| **8月上旬** | #6 非送信設計 | 下書き | B | 背骨 · DevTools |
| **8月中旬** | **#18 オフライン地図** | 企画 | B+A | **#6 の翌週** · ツール選びハブ |
| **8月下旬** | **#17 mask** | メモ | A+B | #6/#18 実例 · DevTools |
| **9月上旬** | #13 webp-to-jpg | メモ | A+B | 画像系非送信3部作 |
| **8月中旬** | #11 fair-draw | 下書き | A | 懸賞抽選 · note 景表法と同週可 |
| **9月上旬** | **#2 開発裏側** | 下書き可 | B | AI分担 · changelog · **B軸締め** |
| **9月中旬〜下旬** | **#3 warikan** | 下書き可 | A | 固定額 · LRM · LINE清算文 |

### 繰越（shift / report — 未執筆）

| 時期 | # | 軸 | X連動メモ |
|------|---|-----|-----------|
| 案 | #4 shift | A | お盆シフト |
| 案 | #5 report | A | 議事録整形 |

**媒体:** note — [`NOTE_ARTICLE_FAIR_DRAW_DRAFT.md`](NOTE_ARTICLE_FAIR_DRAW_DRAFT.md)（#11 同週）· [`note-01-group-split`](../../drafts/note-01-group-split-draft.md)（#14 連動可）

---

## §5 媒体分担

| 媒体 | 役割 | 初月 |
|------|------|------|
| X | 痛みの言語化 · 更新速報 | 週5〜7 |
| Zenn | 実務解説 · 被リンク | 1〜2 |
| Qiita | 実装短編（静的配信・UI） | 1 |

---

## §6 リスク（採用）

- インボイス「完全対応」断定禁止
- 競合名指し禁止 · カテゴリ比較まで
- changelog にない機能は書かない
- 「絶対安全」禁止 · DevTools 検証には触れてよい

---

## §7 確認質問への回答（提督確定案）

### Q1: #2 で事業開発部長の経験をどこまで書くか？

**→ 非エンジニア×AI並走を主軸。経歴は抽象1段落まで。**

- 書いてよい: 「事業開発・マーケ・営業の調整経験」「要件とUIの間の調整」
- 書かない: スタートアップ社名 · 法人名 · 事業開発部長などの肩書き固有名
- 根拠: `operator-profile.md` 公開境界

### Q2: 7〜8月に案Cを先行検証すべきか？

**→ Zenn では不要。案Cは note に逃がすか、9月以降の #8/#9 で様子見。**

- 7〜8月は A（#3,#4,#5）+ B（#2）で十分
- Zenn 初月は被リンクと invoice 信頼が優先

### Q3（Gemini が2つしか出していない場合の補足）

**#1 初稿の画像:** `press/assets/invoice-sugudasu01.png` + 転用フロー GIF（あれば）

---

## 次アクション

- [x] #1 本文 · スクショ · **Zenn 予約投稿**（2026-06-18）
- [ ] **公開当日〜翌日:** X で記事 URL 共有 — 文案 `docs/notes/X_POST_ZENN01_LAUNCH.md`
- [ ] 公開後: Zenn URL を控えておく（`updates.html` 掲載は任意）
- [ ] Qiita: #6 か invoice 税計算のどちらか1本を8月以降
