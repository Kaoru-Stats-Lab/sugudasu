# Gemini セッションスナップショット — SUGUDASU

**更新:** 2026-06-20  
**用途:** 新規 Gemini チャット開始時に **最初に添付**（チャット履歴の代替）  
**リポ:** `C:\asl_dev\sugudasu` · **本番:** https://sugudasu.com/ · **直近 push:** `72604c5`（main）

---

## 1. プロダクト憲法（30秒）

| 項目 | 内容 |
|------|------|
| 名称 | SUGUDASU（すぐだす） |
| 配信 | Cloudflare Pages · 静的 · GitHub `Kaoru-Stats-Lab/sugudasu` |
| 思想 | **登録不要 · ブラウザ内完結 · 名簿/機密は原則非送信** |
| 収益 | **現状:** AdSense + Amazon（present）· **将来:** Pro 等（広告非表示 · 高度機能）検討可 — **F1: コア実務を人質にしない** |
| 運営表記 | カオル（社名・勤務先・実名は公開しない） |
| 開発 | 非エンジニア + AI（Cursor/Claude 実装 · Gemini は企画表・調査） |

**Desktop-first 例外:** 帳票系（invoice 等）は PC 最終確認が正。スマホは **補助 or モバイル完結が価値になる別ツール** で設計（Backlog §8-8）。

---

## 2. ツール一覧（2026-06-20 · 20+ ページ）

| slug | 名称 | stage | 一言 |
|------|------|-------|------|
| `/` | ハブ | gamma | 全ツール入口 |
| `/invoice` | 見積・請求 | beta | Desktop-first · PDF · 下書きJSON |
| `/receipt` | 手取り逆算・領収 | gamma | スマホPDF/URL共有あり |
| `/warikan` | 傾斜割り勘 | gamma | 幹事 · LINE精算文 · モバイル利用多 |
| `/shift` | シフト表 | beta | 店長 · 印刷 |
| `/label` | 宛名ラベル | gamma | 一括貼付 |
| `/report` | 議事録整形 | gamma | メモ→報告書 |
| `/reverse` | 逆引き辞典 | gamma | 言い換え |
| `/present` | ギフトサジェスター | gamma | Amazon |
| `/sns` | SNSデコ文字 | gamma | 装飾 |
| `/normalize` | 文字列正規化 | beta | T03 · 500行cap |
| `/webp-to-jpg` | WebP→JPG/PNG | beta | T09 · 非送信変換 |
| `/group-split` | グループ分け | beta v1.2.1 | **T11 S** · Phase A–C + UX C1 · 250名 |
| `/fair-draw` | 公平抽選・景品チェック | beta v1.5.1 | 景表 Phase0 + 抽選 + 証跡PDF · **スマホ即抽選** |
| `/updates` | 更新履歴 | gamma | changelog SSOT |

**正本:** `data/tool-registry.json` · `docs/BACKLOG.md`

---

## 3. 直近スプリント成果（2026-06-19〜20）

### group-split（T11 · Tier S）

- Phase A: 均等割り · TSV/Slack/LINE/告知 · シード再現
- Phase B: 固定班 · 固定配置 · 離すペア · 定員超過表示
- Phase C: Excel 複数列 · 属性2〜3 · 分散/各組必須 · **cap 250**
- UX C1: Step ①〜④ · 名簿ピッカー · preset「各組に役員1名」· FAQ 2層（`data/group-split-faq.json`）
- SEO/Resilience: meta に「欠席時貼り直し再構成」1句 · 詳細は Backlog §1-11（UI コピー乱立なし）

### その他新規（同一 push）

- **normalize**（T03）· **webp-to-jpg**（T09）· **fair-draw**（景表+抽選 · 証跡3点）
- 共有: `sg-copy-feedback` · `sg-form-validate` · `sg-paste-scan` · `tool-registry.json`
- テスト: group-split / normalize / webp-to-jpg / prize-law-eval すべて pass

---

## 4. モバイルに関する既存方針（ブレストの前提）

| 領域 | 方針 |
|------|------|
| invoice / shift / label | **Desktop-first**（§8-8）。スマホ帳票UX最適化は Non-goal |
| warikan / receipt | 現場・スマホ利用は想定済み |
| fair-draw | **スマホ即抽選** · 箱/用紙代替 · チャットコピー（投影演出はスコープ外） |
| group-split | 名簿は PC Excel 想定が主 · **会場での結果共有**（Slack/告知コピー）がモバイル接点 |
| 全体 | PWA/ホーム追加は未着手 · ネイティブアプリ化はスコープ外 |

**問い（今回 Gemini に渡す）:** 上記制約の中で **「スマホだけで完結するキラープロダクト」** は何か。既存ツールの **モバイル特化版** か **新 Tier S** か。

---

## 5. アイディア評価の SSOT

- **二軸:** SUGUDASU適合（F1–F7）× 市場（M1–M7）— `docs/notes/PRODUCT_IDEA_JUDGMENT_LEDGER.md`
- **Tier S 候補（実装済/次）:** T03 normalize ✓ · T09 webp ✓ · T11 group-split ✓ · T13 タイムライン（未）· fair-draw ✓
- **ペルソナ:** P-A 幹事 · P-B テキスト職人 · P-C 資料職人

---

## 6. Gemini に渡さないもの

- `.env` · API キー · Form private URL
- 未公開の利用者数・売上
- 記事本文の執筆依頼（企画表のみ）

---

## 7. 関連ファイル（深掘り用）

| ファイル | 内容 |
|----------|------|
| `docs/notes/MOBILE_KILLER_GEMINI_RESULT.md` | **Gemini §1–§5 保存 + Cursor 突合 · Backlog §1-12** |
| `docs/prompts/mobile-killer-product-gemini.md` | **今回のブレスト依頼文** |
| `docs/BACKLOG.md` §1-11 · §8-8 · §15 | group-split · desktop · fair-draw |
| `docs/notes/REVENUECAT_SOSA_SUGUDASU_SSOT.md` | サブスク市場の転用（**ネイティブ課金は採らない** · Web Pro は将来可） |
| `docs/prompts/GEMINI_COLLABORATION_GUIDE.md` | 聞き方・役割分担 |
| `data/changelog.json` | 事実の正本（直近5件を添付可） |
