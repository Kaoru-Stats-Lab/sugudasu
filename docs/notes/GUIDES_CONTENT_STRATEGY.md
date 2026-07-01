# SUGUDASU ガイドコンテンツ戦略 — MECE（Web ディレクター正本）

**更新:** 2026-06-29  
**目的:** Google AdSense「有用性の低いコンテンツ」突破 **と** 幹事・フリーランスへの実益を両立する **永続資産** の設計  
**実装:** `tools/guides.html` · `tools/guides/*.html` · `data/guides.json`

---

## A. 目的（Why）— 審査要件とユーザー価値の対応

| 軸 | AdSense / Google が見るもの | ユーザーが得るもの |
|----|-----------------------------|-------------------|
| **独自性** | コピペでないオリジナル文 | 現場の判断材料（チェックリスト・手順） |
| **深さ** | 1 URL あたり十分なプレーンテキスト | 読んでからツールを使える |
| **サイト全体** | ドメイン内の情報密度 | ツール横断のナレッジハブ |
| **信頼（E-E-A-T）** | 運営者・ポリシー・更新日 | 非送信設計の根拠がわかる |
| **体験** | 薄いドアウェイページでない | 記事 → 該当ツールへの自然な導線 |

**原則:** 審査用の「餌」ではなく、**3年後もメンテできる記事**だけを `/guides/` に置く。Zenn / note は補助チャネル、**正本は sugudasu.com ドメイン内**。

---

## B. 情報設計（IA）— URL と柱

```
sugudasu.com/
├── /                    … ツール一覧（hub）+ ブランド説明（常時表示テキスト）
├── /guides              … ガイド索引
├── /guides/{slug}       … 個別記事（1,500字以上 · 折りたたみなし本文）
├── /statements          … 製品約束（E-E-A-T）
├── /updates             … 更新履歴
├── /privacy · /terms    … 法務（AdSense 必須）
└── /{tool}              … 各ツール（FAQ は補助 · ガイドが深い層）
```

### コンテンツ柱（MECE）

| 柱 | コード | 対象ペルソナ | 代表ツール |
|----|--------|--------------|------------|
| **イベント運営** | `event` | 幹事 · 人事 · 司会 | timeline · group-split |
| **書類・経理** | `docs` | フリーランス · 店舗 | invoice · receipt · stamp |
| **チーム運用** | `team` | 店長 · 総務 | shift · warikan |
| **ブランド横断** | `brand` | 初訪問者 | hub · statements |

新規記事は **必ず1柱に属させ、1本あたり関連ツール1〜2個** に限定（ドアウェイ化を防ぐ）。

---

## C. コンテンツ資産（What）— 初回5本 + 拡張ルール

**初回ローンチ（2026-06-29）**

| slug | タイトル | 柱 | 関連ツール | 狙いキーワード |
|------|----------|-----|------------|----------------|
| `event-runbook` | イベント幹事の事前準備チェックリスト | event | timeline | 進行表 準備 幹事 |
| `training-timeline-tips` | 社内研修の進行表をスムーズに作る3つのコツ | event | timeline | 研修 進行表 作成 |
| `excel-vs-web-timeline` | Excel進行表とWebツールの使い分け | event | timeline | 進行表 エクセル 代替 |
| `fair-group-split` | 研修・ハッカソンで公平な班分けをする方法 | event | group-split | 班分け 公平 研修 |
| `invoice-browser-workflow` | ブラウザだけでインボイス請求書を作る手順 | docs | invoice · stamp | インボイス 請求書 無料 |

**拡張ルール（記事追加時）**

1. `data/guides.json` にメタデータ追加  
2. `tools/guides/{slug}.html` を追加（`sg-info-prose` · 関連ツール CTA）  
3. `npm run build:pages` で sitemap 自動反映  
4. 該当ツールページ FAQ から `/guides/{slug}` へ1リンク  
5. `changelog.json` に1行追記  

**品質ゲート（公開前）**

- [ ] 本文 **1,500字以上**（プレーンテキスト · 折りたたみ内のみは不可）  
- [ ] 冒頭100字で「誰の・どんな場面の」記事か明示  
- [ ] 見出し `h2`/`h3` でスキャン可能  
- [ ] 関連ツールへのリンク **1箇所以上**  
- [ ] 更新日・カテゴリ表示  
- [ ] Gemini 生成時も **事実確認**（税率・法令は免責＋公式リンク）

---

## D. 技術実装（How）

| 項目 | 方針 |
|------|------|
| 正本 | HTML in `tools/guides/`（ビルドで `/guides/{slug}`） |
| 索引 | `tools/guides.html` |
| メタ | `data/guides.json`（将来の動的索引用） |
| スタイル | `sg-info-page` · `sg-info-prose`（`DESIGN_GUIDELINE_INFO_PAGES.md`） |
| SEO | 各記事に `meta description` · `og:*` · 更新日 |
| サイトマップ | `build-pages.mjs` が `/guides` と各 slug を自動登録 |
| 内部リンク | hub · footer · ツール FAQ から guides へ |

---

## E. 品質・運用（Governance）

| 項目 | 頻度 |
|------|------|
| 記事の事実確認（税率・料金） | 四半期 or ツール改定時 |
| リンク切れチェック | `build:pages` 後の目視 |
| AdSense 再審査 | 初回5本デプロイ **3〜7日後** |
| Search Console URL 検査 | 再審査前に `/` `/guides` 主要2本 |

**AdSense 再申請チェックリスト**

- [ ] `/guides` に5本以上 · 各1,500字+  
- [ ] hub に常時表示のブランド説明（800字+）  
- [ ] privacy に AdSense Cookie 記載（済）  
- [ ] ads.txt 承認（済）  
- [ ] 支払い情報入力（収益化開始用 · 審査とは別）  

---

## F. 計測（Measure）

| 指標 | 手段 |
|------|------|
| 記事 PV | GA4（導入済みなら `guides` パスフィルタ） |
| 検索流入 | Search Console · `/guides/*` |
| ツール遷移 | 記事内 CTA クリック（将来 `data-sg-cta`） |
| AdSense 状態 | AdSense サイト管理画面 |

---

## 参照

- イベント SEO 正本: [`TIMELINE_SEO_MECE.md`](TIMELINE_SEO_MECE.md)  
- 情報ページ UI: [`DESIGN_GUIDELINE_INFO_PAGES.md`](../DESIGN_GUIDELINE_INFO_PAGES.md)  
- AdSense Backlog: [`BACKLOG.md`](../BACKLOG.md) §3 · §2-5
