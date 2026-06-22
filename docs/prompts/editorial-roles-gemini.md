# 編集チャネル ROLE 一覧（Gemini / 提督協業 SSOT）

**更新:** 2026-06-21  
**用途:** note · Zenn · X · Qiita など**媒体ごとの AI ロール**とプロンプト入口を1枚に固定する  
**正本トーン:** `docs/operator-profile.md` · `docs/x_guideline.md` · `tools/statements.html`

---

## 1. チャネル × ROLE 早見表

| チャネル | 優先 | 月間目安 | Gemini の ROLE | 本文執筆 | プロンプト正本 |
|----------|------|----------|----------------|----------|----------------|
| **Zenn** | P0 | 2〜4本 | 編集プランナー + アウトライン補助 | **提督 / Cursor が執筆**（Gemini 長文禁止） | [`zenn-editorial-gemini.md`](zenn-editorial-gemini.md) · [`zenn-article-draft-gemini.md`](zenn-article-draft-gemini.md) |
| **X** | P0 | 週5〜7本 | 文案監査 + 短文案生成 | Gemini 案 → 提督採否 | [`x-editorial-gemini.md`](x-editorial-gemini.md) |
| **note** | P2 | 1〜2本 | 下書き編集者（「引き算の記録」） | Gemini たたき台 → **Grok AI 味除去** → 提督事実追記 | [`note-editorial-gemini.md`](note-editorial-gemini.md) · [`note-deai-grok.md`](note-deai-grok.md) |
| **Qiita** | P1 | 月0〜1本 | 短技術メモの構成係 | 提督執筆 · Gemini は見出しのみ | [`qiita-editorial-gemini.md`](qiita-editorial-gemini.md) |

**鉄則（全チャネル）:** 1 Gemini セッション = 1 ROLE。企画表と本文執筆を混ぜない（[`GEMINI_COLLABORATION_GUIDE.md`](GEMINI_COLLABORATION_GUIDE.md) §1）。

---

## 2. ペルソナ軸 A / B / C（媒体への載せ方）

| 軸 | 中身 | Zenn | note | X |
|----|------|------|------|---|
| **A** | 静かな実務職人 · 幹事・店長・FL の Pain | **主軸 70%** | 各記事の H2-1〜2 | 課題解決型 50% |
| **B** | 開発ストーリー · 設計 · 非送信 | 月1本まで | NOTE-08 等 · 技術は Zenn へ link | 更新告知・信頼投稿 |
| **C** | 5分で使えるライトガイド | 最大2本/期 · 多くは note へ | 月1まで | FAQ ユーモア 20% |

**カオル公開境界:** 実名 · 勤務先社名 · 法人名 · 利用者数 · 売上 — **全チャネル禁止**（`operator-profile.md`）。

---

## 3. 媒体別「引き算」ナラティブ（note / Zenn 共通語彙）

| やらないこと | 言い方の例 |
|--------------|------------|
| Zoom / Slack / Teams **自動 API** | 「OAuth と名簿送信を避ける」 |
| 懸賞 **統制 SaaS** 化 | 「幹事向け事務 · 説明可能な公平さ」 |
| **100% 安全** 断定 | 「入力データをサーバーに送らない設計」（statements FAQ 準拠） |
| 競合 **名指し** 批判 | 「登録必須のクラウド型」まで |
| Changelog **転載** | updates へ1行 link のみ |

---

## 4. UTM 規約（チャネル別）

| チャネル | utm_source | utm_medium | utm_campaign 例 |
|----------|------------|------------|-----------------|
| Zenn | `zenn` | `social` | `article_01_invoice_convert` |
| note | `note` | `social` | `NOTE-01` |
| X | `x` | `social` | `invoice_pain` · `pin_hub_v2` |
| Qiita | `qiita` | `social` | `qiita_invoice_short` |

**URL:** 必ず `https://sugudasu.com/...` 直リンク。Google 検索経由 URL **禁止**。

---

## 5. 成果物の置き場

| 種別 | パス |
|------|------|
| Zenn 採用プラン | `docs/notes/ZENN_EDITORIAL_PLAN.md` |
| Zenn ドラフト | `docs/notes/ZENN_ARTICLE_*_DRAFT.md` |
| note 推敲済み例 | `docs/drafts/note-01-group-split-draft.md` |
| note ネタ索引 | `note-editorial-gemini.md` §記事ネタカタログ |
| X 運用 SSOT | `docs/x_guideline.md` |
| Gemini 聞き方 | `GEMINI_COLLABORATION_GUIDE.md` |

---

## 6. 提督ワークフロー（推奨順）

```text
1. editorial-roles-gemini.md でチャネルと ROLE を決める
2. 該当 prompts/*.md の依頼文をコピー
3. GEMINI_SESSION_SNAPSHOT.md + operator-profile L2 + changelog 直近5件を添付
4. Gemini 出力 → 監査ミニプロンプト（GEMINI_COLLABORATION_GUIDE §3）
5. Cursor / 提督が事実追記 → 公開
6. X で URL 共有（Zenn / note 公開当日）
```

---

## 変更履歴

| 日付 | 内容 |
|------|------|
| 2026-06-21 | 初版（ROLE 索引 · A/B/C · UTM · ワークフロー） |
