# Zenn 編集カレンダー（Gemini 企画 · SSOT）

**更新:** 2026-06-20  
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
| 3 | 合コンで揉めない固定額割り勘計算 | A | /warikan | 幹事 | 固定額控除・端数・LINE文 | P1 | 1,500 | article_03_warikan_fixedmode |
| 4 | 店舗に合わせて枠数を変えるシフト表 | A | /shift | 店長 | 可変枠1〜3・公平生成・印刷 | P1 | 1,600 | article_04_shift_flexslots |
| 5 | 箇条書きメモを議事録に整形するアプローチ | A | /report | 事務 | 構造化・コピー・ローカル処理 | P1 | 1,500 | article_05_report_format |
| 6 | 顧客データをサーバーに送らないWebツールの設計 | B | **/** | セキュリティ関心 | 静的配信・ブラウザ内処理 | P1 | 2,000 | article_06_privacy_design |
| 7 | 宛名シールの型番検索と印刷 | A | /label | 発送担当 | 型番・CSV・位置ズレ | P2 | 1,600 | article_07_label_spec |
| 8 | ニュアンス類語検索でマンネリ回避 | C | /reverse | ビジネス | 言い換え手順 | P2 | 1,500 | article_08_reverse |
| 9 | マナーを意識したギフト提案の仕組み | C | /present | 一般 | 関係性・予算絞り込み | P2 | 1,500 | article_09_present |
| 10 | SNSプロフィールを文字化けさせずに飾る | A | /sns | SNS運用者 | フォント・文字数カウンター | P2 | 1,600 | article_10_sns |
| 11 | （候補 · 未確定）fair-draw — Excel抽選卒業 / 景表法一次整理 | A (+B) | /fair-draw | マーケ幹事 · FL | 公平抽選 · 証跡3点 · 非送信 | **P2** | 2,000 | article_11_fairdraw_* |
| 12 | Excel列コピーと全角半角サイトの「あるある」— 行数チェック付き正規化 | A (+B) | /normalize | EC·名簿担当 · FL | Gemini事故カタログ · 非送信 · コピーゲート | **P1** | 2,000 | article_12_normalize_oops |
| **14** | **研修の班分けを Excel の RAND() からやめる** — 納会・ハッカソンで重さが違う | A (+B) | /group-split | 人事 · 研修 · **ハッカソン運営** | 非送信 · 職能名簿 · スイッチャー · TSV/Slack | **P1** | 2,200 | article_14_group_split |

**#11 詳細:** [`docs/notes/ZENN_FAIR_DRAW_DRAFT_MEMO.md`](ZENN_FAIR_DRAW_DRAFT_MEMO.md)  
**#12 詳細:** [`docs/notes/ZENN_NORMALIZE_DRAFT_MEMO.md`](ZENN_NORMALIZE_DRAFT_MEMO.md) — **Gemini `SUGUDASU_OOPS_GUARDRAILS.md` 連動**  
**#14 詳細:** [`docs/notes/ZENN_GROUP_SPLIT_DRAFT_MEMO.md`](ZENN_GROUP_SPLIT_DRAFT_MEMO.md) · **初稿:** [`ZENN_ARTICLE_14_DRAFT.md`](ZENN_ARTICLE_14_DRAFT.md)

**避けること（共通）:** 競合名指し · 100%安全/完全対応 · 未実装機能 · Vibe Coding

---

## §3 ミニアウトライン（#1〜#5）

### #1 見積→請求転用（P0 · 6月4週）

- **状態:** 予約投稿済み（2026-06-18 · スクショ差し替え済）

- **リード:** 会員登録なしで、見積データをそのまま請求書へ変える実務フローです。
- **H2:** アカウント不要で始められる理由 / 下書きをローカル保存する意味 / 書類タブ切替で転用
- **CTA:** https://sugudasu.com/invoice?utm_source=zenn&utm_medium=social&utm_campaign=article_01_invoice_convert

### #2 開発の裏側（7月3週）

- **状態:** アウトライン `docs/notes/ZENN_ARTICLE_02_OUTLINE.md`（§4 同名キーワード節追記済 · 執筆前）
- **リード:** プログラミング未経験の視点から、AIと並走して作った知見を共有します。
- **H2:** AIの使い分け / Cloudflare Pages の選択 / Form→changelog の速度 / **「スグダス」同名キーワードと Query Disambiguation**
- **CTA:** https://sugudasu.com/?utm_source=zenn&utm_medium=social&utm_campaign=article_02_hub_devstory

### #3 固定額割り勘（7月1週）

- **リード:** 特定グループだけ「一律3,000円」にする精算の手間を短くします。
- **H2:** 固定額控除ロジック / 端数丸め / LINE用清算文
- **CTA:** https://sugudasu.com/warikan?utm_source=zenn&utm_medium=social&utm_campaign=article_03_warikan_fixedmode

### #4 可変シフト（8月1週）

- **リード:** 早番・遅番固定に縛られない、1〜3枠のシフトを自動生成します。
- **H2:** 枠名の変更 / 希望休と偏り / A4印刷の工夫
- **CTA:** https://sugudasu.com/shift?utm_source=zenn&utm_medium=social&utm_campaign=article_04_shift_flexslots

### #5 議事録整形（8月3週）

- **リード:** 会議中の雑多なメモを、提出できる体裁に整えます。
- **H2:** 構造化のメリット / コピーしてチャットへ / ローカル処理
- **CTA:** https://sugudasu.com/report?utm_source=zenn&utm_medium=social&utm_campaign=article_05_report_format

---

## §4 3ヶ月スケジュール

| 時期 | # | 軸 | X連動メモ |
|------|---|-----|-----------|
| **6月4週** | #1 | A | W1-D2 invoice とURL共有 · 固定ピンと連動 |
| **7月1週** | #3 | A | 固定額割り勘 · 夏の飲み会 |
| **7月3週** | #2 | B | 非エンジニア×AI開発（社名なし） |
| **8月1週** | #4 | A | お盆シフト · 可変枠 |
| **8月3週** | #5 | A | 盆明け · 議事録 |

**9月以降（案）:** #6 非送信設計 → #7 label · receipt は **10月以降**（確定申告前）

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
