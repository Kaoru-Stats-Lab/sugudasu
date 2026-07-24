# SUGUDASU Hub — Constitution Review & Specification

**更新:** 2026-07-24  
**状態:** 思想正本 · 実装は Phase 2 まで反映済み · 性能改善は Open Issues  
**上位正本:** [`BRAND_CONSTITUTION.md`](../../brand/BRAND_CONSTITUTION.md) · [`ANTI_PRINCIPLES.md`](../../brand/ANTI_PRINCIPLES.md) · [`PRODUCT_CONSTITUTION.md`](../../product/PRODUCT_CONSTITUTION.md)

---

## 目次

1. [Hub Philosophy](#1-hub-philosophy)
2. [Hub IA](#2-hub-ia)
3. [Hub UX](#3-hub-ux)
4. [Hub UI Specification](#4-hub-ui-specification)
5. [Hub Technical Specification](#5-hub-technical-specification)
6. [Search Architecture](#6-search-architecture)
7. [Data Architecture](#7-data-architecture)
8. [Performance Architecture](#8-performance-architecture)
9. [SEO Strategy](#9-seo-strategy)
10. [Accessibility](#10-accessibility)
11. [Guard Rails](#11-guard-rails)
12. [ADR（重要判断）](#12-adr重要判断)
13. [Open Issues](#13-open-issues)
14. [Non Goals（将来やらないこと）](#14-non-goals将来やらないこと)

---

# 1. Hub Philosophy

## 1.1 WHY（ブランド憲法から）

SUGUDASU は **成果を出す人が本来向き合うべき仕事へ、迷わず辿り着ける状態** を作る（`BRAND_CONSTITUTION.md`）。

Hub はその **最初の一歩** である。

```
仕事中
  ↓ 困った
  ↓ Hub（探す · 見つける）
  ↓ Product（3分で終える）
  ↓ コピー / PDF / 印刷
  ↓ 仕事へ戻る
```

Hub 自身は **前工程の前工程**。長時間滞在させる場所ではない（F5 · 存在様式）。

## 1.2 Hub の定義

| Hub は | Hub はない |
|--------|------------|
| 仕事へ戻るための **探索入口** | プロダクト一覧の **カタログサイト** |
| 検索 → 開く → 終わる UI | SNS · ニュース · 学習サイト |
| 静かな同僚が隣に置いた **索引** | ブランドが語り始める **ショーケース** |

## 1.3 Hub が提供する価値

- **思い出せる** — 仕事の言葉（Pain · Moment · Job）で辿れる
- **すぐ見つかる** — 検索第一 · 辞書が吸収
- **迷わない** — 情報階層が固定 · 誘導しない
- **すぐ開ける** — 登録不要 · 1クリックで Product へ
- **仕事へ戻れる** — 結果は Product 側 · Hub に留まらせない

## 1.4 成功指標（唯一）

> **仕事へ戻るまでの速さ**

測らないもの: 滞在時間 · エンゲージメント · 回遊率 · PV · 広告 CTR · おすすめクリック率

## 1.5 三層責務（ADR-0003）

| 層 | 責務 | 例 |
|----|------|-----|
| **Header** | サイトを移動する | 実務ガイド · 更新履歴 · ロードマップ |
| **Hub** | ツールを探す（**唯一の探索入口**） | 検索 · カテゴリ · カード |
| **Product** | ツールを使う | 入力 → 結果 → Copy First |

個別ツールを Header に横並びしない。Hub が探索の SSOT。

## 1.6 ブランド監査（Meta Principle Check）

| 原則 | Hub への適用 |
|------|--------------|
| ユーザーを主役に | カードは JTBD · ブランドコピーを主役にしない |
| 技術を誇示しない | Hero に WASM / AI / 高速を並べない |
| 教え込まない | チュートリアル前置きなし · 検索例 Chip で開始 |
| 囲い込まない | お気に入り/最近は端末内 · サーバー保存なし |
| 提案しすぎない | AI おすすめ · ランキング · 記事回遊なし |

---

# 2. Hub IA

## 2.1 Hub の責務（MECE）

Hub が **やること** のみ:

1. **発見** — ユーザーが今の Pain に合う Product へ最短到達させる
2. **索引** — 全公開 Product を漏れなく列挙する（SEO · 初見の安全網）
3. **短記憶** — 端末内のお気に入り · 最近使ったで **再訪の摩擦** を下げる
4. **信頼の最小提示** — 非送信 · 登録不要を **1行** で示す（説教しない）

Hub が **やらないこと**:

- Product の作業 UI
- 学習 · ガイド本文（→ `/guides`）
- 約束の詳細（→ `/statements`）
- 更新内容の告知本文（→ `/updates`）
- 関連ツールの自動レコメンド（→ Product 側 · `relations.json` は Phase 2 保留）

## 2.2 情報要素の判定（憲法照合）

| 要素 | 判定 | Persona / WHY | 憲法 |
|------|------|---------------|------|
| **検索** | **必須 · 第1優先** | Pain / Moment / Job で探す実務ユーザー | F5 · 検索中心 · Anti #9 |
| **カテゴリ** | **採用 · 補助** | 「帳票系だったよな」の **思い出し** | 管理用ディレクトリではない |
| **最近使った** | **採用 · 条件付き** | 再訪の摩擦削減 · 登録不要の代替 | F1 · localStorage のみ |
| **お気に入り** | **採用 · 控えめ** | よく使う入口の固定 · 登録不要 | F1 · 前面押し売り禁止 |
| **全ツール** | **必須** | 網羅 · SEO · 検索失敗時の安全網 | 索引として必要 |
| **よく使うツール** | **採用 · 控えめ** | 初見の **0→1** 補助（固定4件） | ランキング化禁止 |
| **新着（NEW）** | **カードバッジのみ · 前面禁止** | 開発透明性 ≠ 回遊促進 | 下記 §2.3 |
| **更新履歴フィード** | **Reject** | ニュース化 · 滞在促進 | Anti #14 |
| **おすすめ記事** | **Reject** | ブログ化 | Guard Rails |
| **AI レコメンド** | **Reject** | 判断・提案の入口 | Anti #6 · #9 |
| **ランキング** | **Reject** | エンゲージメント KPI | Guard Rails |
| **ゲーミフィケーション** | **Reject** | ブランド人格と矛盾 | — |

## 2.3 新着（NEW）の判定

**結論: 前面に出さない。カード上の status バッジに留める。**

| 採用 | 不採用 |
|------|--------|
| カード右上 `NEW` / `Beta` / `正式` | Hero 下の「新着ツール」レール |
| changelog へのリンク（Header · サイトナビ） | NEW 順ソート · NEW 専用カルーセル |
| 開発ステージの **一般向け1行**（Product のみ · 版数非表示） | 「今週のおすすめ新機能」 |

理由:

- 新着は **開発者の都合** であり、ユーザーの Pain ではない
- 前面化すると **Discover / ニュースサイト** の期待値を生む
- 実務ユーザーは「今困っていること」で来る。新着で回遊させない

## 2.4 発見優先順位（固定）

```
1. 検索（query 非空 → 検索モード）
2. カテゴリ（検索中も交差フィルタ）
3. お気に入り（データがあるときのみ表示）
4. 最近使った（データがあるときのみ表示）
5. よく使うツール（hub-config.popularToolIds · 固定）
6. すべてのツール（全カード · 左→右 · 上→下）
```

検索モード中: ⑤⑥ の browse レールは隠す。カテゴリは残す。

## 2.5 カテゴリ IA

**WHY:** ユーザーが **仕事の塊** を思い出す補助。ファイル管理のためではない。

| 原則 | 内容 |
|------|------|
| 数 | **8 固定**（100 ツール超で小分類を **検討** · 今は増やさない） |
| 排他 | 1 ツール = 1 `categoryId`（マルチタグは Phase 2 保留） |
| ラベル | 実務の言葉（`帳票` `画像` `テキスト`）· slug 禁止 |
| チップ | Desktop 8 · Mobile primary 4 + 「その他」 |
| ページ | `/category/{id}` — カテゴリ単体の SEO ランディング |

カテゴリを増やして「探しやすくする」は **本末転倒**。まず検索辞書を疑う。

---

# 3. Hub UX

## 3.1 ユーザーフロー（Happy Path）

```
到着（/ または /hub）
  → Hero: 非送信 · 登録不要を確認（既知ならスキップ）
  → 検索框に Pain を入力（または Chip をクリック）
  → 結果 1–3 件 → カードクリック
  → Product ページ
  → 3分以内に Copy / PDF
  → 元の仕事（Slack / Excel / メール）へ戻る
```

**再訪 Path:**

```
到着
  → 「最近使った」または「お気に入り」から 1 クリック
  → Product
```

## 3.2 検索 UX 原則

- 検索語は **ツール名ではない** — Pain · Moment · Job
- 例: `提出` · `黒塗り` · `インボイス` · `班分け` · `コピペ`
- 表示名（conceptName）は **変えない** — 辞書が吸収
- 0 件は **離脱点** — 必ず次の一手（Chip · 解除 · 全表示）

## 3.3 モード

| モード | 条件 | 表示 |
|--------|------|------|
| **Browse** | query 空 | お気に入り · 最近 · よく使う · すべて |
| **Search** | query 非空 | 検索結果パネル · 件数 · 解除 · 0件救済 |
| **Filtered** | カテゴリ選択 | 全カードに `sg-is-filtered` · 検索と交差 |

## 3.4 インタラクション原則

| やる | やらない |
|------|----------|
| 1 クリックで Product へ | カード → モーダル → 詳細 → 開く |
| Chip クリック = 検索語投入 | ホバーでプレビュー |
| ☆ = お気に入り toggle | お気に入り登録ウィザード |
| Esc / × = 検索解除 | 多段確認ダイアログ |

## 3.5 コピー UX

Hero は **信頼の最小提示** + **検索開始**。

- 主役: 検索框 `何をしたいですか？`
- 副: 非送信 · 登録不要（1–2 文 · 説教しない）
- 禁止: ブランドストーリー · 機能羅列 · 「最強のツール集」

**競合名・「〜ではない」訴求も Hero では書かない**（Product と同じ · WHY 前面）。

## 3.6 お気に入り UX（F1 整合）

| 項目 | 仕様 |
|------|------|
| 登録 | **不要** — ☆ クリックのみ |
| 保存 | `localStorage.favoriteTools` · string[] |
| 上限 | なし（実務上 数十件未満） |
| 表示 | 1 件以上あるときのみレール表示 |
| 前面化 | **禁止** — Hero 下の巨大セクションにしない |

## 3.7 最近使った UX

| 項目 | 仕様 |
|------|------|
| 記録 | Product 打开時 · `sugudasu-shell.js` が push |
| 保存 | `localStorage.recentTools` · 最大 **8** · LRU |
| サーバー | **禁止** |
| 表示 | 1 件以上 · お気に入りの下 |

---

# 4. Hub UI Specification

## 4.1 画面構成（上→下 · 左寄せ）

```
[ Header — サイトナビ · data-sg-nav="hub" ]

[ main.sg-main-shell--wide ]

  § Hero
    h2 — 登録不要 · 非送信（短い）
    lead × 1–2 — 実務向け · 非送信
    [ 検索 input ]
    検索例 Chips
    meta — 実務ガイド / 約束 へのリンク
    trust — 「完全ローカル処理」

  § Homonym banner（条件表示 · スグダス中古車混同）

  § Category chips (+ その他)

  § Browse rails（検索中 hidden）
    お気に入り
    最近使った

  § Search panel（検索中 visible）
    件数 · 解除
    0件救済 blocks

  § よく使うツール（4列 grid）

  § すべてのツール（4列 grid · SSOT 生成カード）

[ Footer — サイト共通 ]
```

## 4.2 カード UI — 表示するもの / しないもの

カードは **宣伝ではなく仕事の入口**。

| 表示する | 理由 |
|----------|------|
| `conceptName`（h3 · 1行 ellipsis） | 一瞬で「何の道具か」 |
| `blurb`（2文 JTBD · 2行 clamp） | 「自分の用事か」を判定 |
| status バッジ（NEW/Beta/正式） | 成熟度の **事実** のみ |
| spec バッジ（完全ローカル / PC推奨） | 環境制約の **事実** のみ |
| ☆ お気に入り | 再訪摩擦削減 |

| 表示しない | 理由 |
|------------|------|
| `productName`（SUGUDASU ○○） | ブランド主張 · 冗長 |
| slug / toolId | 内部識別子 |
| スクリーンショット · イラスト | カタログ化 · 重量化 |
| 星評価 · 利用者数 | ランキング文化 |
| 「人気」バッジ on card | 押し売り（人気は grid 属性 `data-popular` のみ） |
| 長い機能リスト | ブログ化 · Product へ |
| CTA ボタン（「使ってみる」） | カード全体がリンクで足りる |
| 価格 · プラン | 常に無料 · ノイズ |

**Blurb 正本:** `TOOL_CARD_WRITING_GUIDELINE.md` — 「○○したい時に。」「○○します。」2文固定。

## 4.3 バッジ体系

| 種類 | 値 | 視覚 |
|------|-----|------|
| status | new / beta / ga | 強調 |
| spec | local / pc | 弱 |
| popular | — | **カード上に出さない** |

## 4.4 レイアウト

| 項目 | 値 |
|------|-----|
| 幅 | `sg-main-shell--wide` · max ~92rem |
| Grid | `sm:2` · `lg:4` **固定** |
| 寄せ | **左寄せ** — センター Hero 禁止 |
| 密度 | カード大型化 · 5–6 列禁止 |

## 4.5 レスポンシブ（PC 優先）

| ブレークポイント | 方針 |
|------------------|------|
| Desktop（lg+） | 4 列 · 8 チップ · 検索 + rails |
| Tablet（sm） | 2 列 |
| Mobile | 1 列 · 4 チップ + その他 · Header drawer |

Hub の主戦場は **デスクワーク中の PC ブラウザ**。モバイルは「使える」で足りる。

## 4.6 デザイン思想

- **高級感ではない** — 静かな安心感
- 色は `--sg-*` · violet は CTA / 検索 focus のみ
- アニメーション · パララックス · 自動再生 **禁止**
- ブランドロゴは Header に留め · Hero で主張しない

---

# 5. Hub Technical Specification

## 5.1 スタック制約

| 許可 | 禁止 |
|------|------|
| 静的 HTML + CSS + vanilla JS | SPA · React 導入 |
| Cloudflare Pages Free | SSR · API · DB |
| localStorage（メタのみ） | ユーザー入力のサーバー保存 |
| fetch 静的 JSON | WebSocket · 常時通信 |
| GA4 イベント（集計のみ） | 検索クエリ本文の送信 |

## 5.2 DOM 構造（要約）

```html
<body>
  <div id="sg-chrome-top" data-sg-nav="hub" />
  <main class="sg-main-shell sg-main-shell--wide">
    <section class="sg-hub-hero">…</section>
    <section id="sg-homonym-banner" class="hidden">…</section>
    <div id="sg-hub-chips" role="tablist" />
    <div id="sg-hub-browse-rails">…</div>
    <section id="sg-hub-search-panel" class="hidden">…</section>
    <section id="sg-hub-popular-section">…</section>
    <section id="sg-hub-all-section">
      <section id="sg-hub-grid"><!-- hub-cards:start/end --></section>
    </section>
  </main>
  <div id="sg-chrome-bottom" />
</body>
```

カード 1 枚:

```html
<a class="sg-hub-card sg-card" data-tool-id href data-category-id data-search data-popular>
  <button type="button" class="sg-hub-fav" data-fav-toggle aria-pressed />
  <div class="sg-hub-card__badges">…</div>
  <h3 class="sg-hub-card__title">conceptName</h3>
  <p class="sg-hub-card__blurb">JTBD 2文</p>
</a>
```

## 5.3 CSS 責務

| ファイル | 責務 |
|----------|------|
| `assets/sugudasu.css` | `--sg-*` · `.sg-hub-*` · `.sg-hub-card` · badge modifiers |
| `assets/tw-build.css` | Tailwind ユーティリティ（grid · spacing） |
| Hub HTML inline | **禁止方向** — 新規は sugudasu.css へ |

**DECISION:** カード非表示は `.hidden` ではなく `.sg-is-filtered` + `[hidden]`（Tailwind 詳細度競合回避）。

## 5.4 JS 責務

| モジュール | 責務 |
|------------|------|
| `sugudasu-shell.js` | Header/Footer · `pageHref` · `dataUrl` · recent push · GA |
| `hub-search-engine.js` | 辞書検索 · normalize · score · **UI 非依存 ESM** |
| `hub-search-boot.js` | `globalThis.SUGUDASU_HUB_SEARCH` 公開 |
| `hub-ia.js` | チップ · フィルタ · 検索モード · rails · fav · paint |

**Hub HTML から直読み:** `categories.json` · `hub-config.json` · `tool-registry.json` · `hub-search-bundle.json`

## 5.5 イベント

| イベント | トリガ | 副作用 |
|----------|--------|--------|
| `input` on `#sg-hub-search` | 入力 | 検索モード · paint · GA `search_used`（has_query のみ） |
| `click` category chip | チップ | `selectedCategory` LS · フィルタ |
| `click` `data-fav-toggle` | ☆ | `favoriteTools` LS · stopPropagation |
| `click` card | カード | `recentTools` push · navigate |
| `click` clear search | × | query 空 · browse 復帰 |
| `click` example chip | Chip | query 設定 · 検索 |
| `pageshow` persisted | bfcache 戻り | `resetCatalogView` |
| `sg-hub-search-ready` | module loaded | hub-ia init 続行 |

## 5.6 初回表示 · ロード順

```
1. HTML parse — カード DOM は SSR 相当（build 時生成 · 即表示可能）
2. sugudasu.css + tw-build.css
3. sugudasu-shell.js — Header 描画
4. hub-search-boot.js (module) — engine 公開
5. hub-ia.js boot:
   a. parallel fetch: categories, hub-config, registry, hub-search-bundle
   b. waitHubSearch (module ready)
   c. init → renderChips, renderRails, paint, resetCatalogView
6. 検索 bundle 未到着時: data-search 属性フォールバック（cards 上の legacy 文字列）
```

## 5.7 localStorage スキーマ

| Key | 型 | 用途 | 変更 |
|-----|-----|------|------|
| `favoriteTools` | `string[]` | toolId 一覧 | **禁止** |
| `recentTools` | `string[]` | toolId · max 8 LRU | **禁止** |
| `selectedCategory` | `string` | 最後のカテゴリ chip | **禁止** |
| `homonymBannerDismissed` | flag | 中古車混同 banner | 可 |
| `sgWorkContextFirstSeenAt` | ISO8601 | 初回訪問（H-UI-07） | 可 · [PHASE_H-UI-07](./PHASE_H-UI-07-work-context.md) |
| `sgWorkContextUniqueTools` | `string[]` | 利用 toolId 集合 | 可 |
| `sgWorkContextAnswer` | string | 仕事コンテキスト回答 | 可 · **GA 送信禁止** |
| `sgWorkContextAnsweredAt` | ISO8601 | 回答済み | 可 |
| `sgWorkContextDismissedAt` | ISO8601 | スキップ · 180 日冷却 | 可 |

**禁止:** 入力本文 · PDF · 画像 · **検索クエリ履歴** · **work context 回答本文の Analytics 送信**。

## 5.8 ビルドパイプライン

```
hub-cards.json + registry → render-hub-cards.mjs → tools/hub.html カード部
search-dictionary/* + synonyms + … → build-hub-search-bundle.mjs → hub-search-bundle.json
npm run build:pages → dist/index.html · verify-hub-ia
```

---

# 6. Search Architecture

## 6.1 思想

検索は **ツール名検索ではない**。

```
ユーザーが頭の中にある言葉  →  辞書  →  toolId  →  カード
         (Pain)              (3層)              (JTBD blurb)
```

## 6.2 語彙 3 層

| 層 | SSOT | 役割 |
|----|------|------|
| 1. ブランド正規化 | `brand-normalize.json` | 写真→画像 · HP→Webサイト |
| 2. シソーラス | `synonyms.json` | 請求書↔インボイス · 表記ゆれ |
| 3. 意図マップ | `tool-intent-map.json` | Pain → toolId 候補 |

表示名（conceptName）は **層 1–3 で変えない**。

## 6.3 ツール別辞書（`search-dictionary/{toolId}.json`）

| フィールド | 用途 | 例 |
|------------|------|-----|
| `aliases` | 別名 · 読み | インボイス · せいきゅうしょ |
| `jobsShort` | 短い Job | 請求書作成 |
| `jobsLong` | 長い Pain 文 | 登録なしで請求書を作りたい |
| `keywords` | 補助語 | PDF · 印刷 |
| `hiddenKeywords` | SEO/誤検索吸収 · **UI非表示** | 競合名 · 誤用語 |
| `commonMistakes` | 0件救済 · meant リダイレクト | query→meant |
| `priority` | high/medium/low ブースト | インボイス制度 |
| `relatedProducts` | **検索内のみ** · Hub UI 未使用 | pdf-fill 境界 |

## 6.4 スコアリング（Phase 1）

```
normalizeKeyword(query)
  → titleExact / titlePartial / identity     (tier 0)
  → hiddenKeyword / alias / priority           (tier 1)
  → category                                   (tier 2)
  → synonym / jobsShort / commonMistake          (tier 3)
  → description / hubBlurb / jobsLong          (tier 4 · 最弱)
```

**DECISION:** Embedding / AI なし。明示重み。description 単独が title を上回らない。

## 6.5 実行時データ

- Hub は **`hub-search-bundle.json` 1 本だけ** fetch（~620KB · 要改善 → §8）
- ビルド時に辞書を merge · `terms[]` インデックス生成
- Node テスト: `scripts/hub-search-engine.test.mjs`

## 6.6 0 件 UX

| Block | 内容 | SSOT |
|-------|------|------|
| おすすめ | 定番 Pain Chip | `hub-config.emptyRecommendChips` |
| 人気検索 | よくある語 | `emptyPopularSearchChips` |
| 検索例 | 探索用 | `emptyExampleChips` |
| 解除 | 全カード表示 | clearSearch |

「人気検索」は **固定 Chip** でありランキングではない。

## 6.7 Analytics 境界

| 送る | 送らない |
|------|----------|
| `search_used` { has_query: true } | クエリ本文 |
| `category_selected` { category_id } | 入力データ |
| `favorite_added/removed` { tool_id } | — |
| `product_opened` { tool_id, from: hub } | — |

---

# 7. Data Architecture

## 7.1 責務分離（MECE）

```
data/
├── tool-registry.json      … 命名 · nav · categoryId · stage（Hub/Product 共通）
├── hub-cards.json          … blurb · badges（Hub 表示専用）
├── hub-config.json         … チップ順 · popular · 検索例 Chip（Hub 表示専用）
├── categories.json         … ドメイン定義（8分類 · 相互排他）
├── hub-search-bundle.json  … ビルド生成 · Hub 実行時 fetch のみ
├── search-dictionary/      … ツール別 Pain 辞書（ソース）
├── synonyms.json           … 横断同義語
├── brand-normalize.json      … 語彙正規化
├── search-thesaurus.json     … 追加シソーラス
├── tool-intent-map.json      … Pain→tool 意図
├── relations.json            … Product 関連（Hub 未使用 · 将来）
├── statements-product.json   … 約束 · カテゴリ比較（/statements）
├── hub-search-bundle.json    … （生成物 · Git 管理）
├── changelog.json            … 更新履歴（/updates · バッジ根拠）
└── roadmap.json              … ロードマップ（/roadmap）
```

## 7.2 各ファイルの Hub 関与

| ファイル | Hub が読む | Product が読む |
|----------|------------|----------------|
| tool-registry | ○（命名 · category） | ○ |
| hub-cards | ○（build→HTML） | × |
| hub-config | ○ | × |
| categories | ○ · `/category` | △ |
| hub-search-bundle | ○ | × |
| search-dictionary | ×（bundle 経由） | × |
| statements-product | × | △（約束ページ） |

## 7.3 禁止パターン

- Hub HTML にカテゴリ名 · blurb · 検索語を **ハードコード**（チップ間の markup 除く）
- `tool-registry` に `tags[]` を復活させる
- 1 ファイルに naming + search + blurb を混ぜる
- `hub-cards` に SEO キーワード羅列

## 7.4 Guardrail コマンド

```bash
npm run validate:hub-ia    # verify-hub-ia.mjs
npm run validate:tool-naming
npm run build:hub-search
```

---

# 8. Performance Architecture

## 8.1 原則

> Hub は **最初の表示** を最優先。巨大 JSON を初回必須にしない。

## 8.2 現状（2026-07-24）

| 資産 | サイズ目安 | 初回 |
|------|------------|------|
| HTML + インラインカード | ~100KB+ | **必須 · 即描画** |
| sugudasu.css + tw-build.css | ~70KB | 必須 |
| hub-search-bundle.json | **~620KB** | **必須（改善対象）** |
| hub-ia.js | ~20KB | 必須 |
| hub-search-engine.js | ~15KB | module |

カードは HTML に baked — **JS 前でも一覧は見える**（検索精度は bundle 待ち）。

## 8.3 推奨改善（Open Issue）

1. **遅延ロード:** `hub-search-bundle.json` を `search focus` または `requestIdleCallback` まで defer
2. **分割:** brand/thesaurus を初回不要なら chunk 化
3. **圧縮:** Brotli（CF Pages 既定）· 辞書フィールドの trim（reviewNotes 等は既に除外）
4. **インメモリ cache:** session 中の再 fetch 禁止

## 8.4 禁止

- 全辞書を HTML に inline
- 起動時に 38 個の search-dictionary を個別 fetch
- 画像サムネの preload

---

# 9. SEO Strategy

## 9.1 原則

**実務ユーザー > 検索エンジン。** UX を壊す SEO は Reject。

## 9.2 Hub ページ

| 項目 | 方針 |
|------|------|
| URL | `/` canonical · `/hub` → 301 |
| Title / Meta | 登録不要 · 実務ツール · 非送信（既存維持 · 誇張禁止） |
| JSON-LD | WebApplication · FAQ は最小 |
| 内部リンク | 全 tool へ `<a href="/tool">` · clean URL |
| `/data/*` | **noindex** · Disallow |

## 9.3 カテゴリページ

- `/category/{id}` — BreadcrumbList · カテゴリ description
- Hub カード blurb を **そのまま転載しない**（duplicate 回避 · 要約のみ）

## 9.4 検索 SEO

- Pain 語は **search-dictionary** · `hiddenKeywords` で吸収
- conceptName / blurb を SEO 用に変形 **禁止**
- sitemap: `/` + 各 tool + category · `/data` 除外

## 9.5 ホモニム

- `sg-homonym-banner` — SUBARU SUGDAS 混同 · dismiss LS
- `not-a-car.html` — 補助ページ

---

# 10. Accessibility

## 10.1 必須

| 項目 | 実装 |
|------|------|
| 検索 label | `.sr-only` + `for=sg-hub-search` |
| カテゴリ | `role="tablist"` · chip keyboard |
| 検索結果 | `aria-live="polite"` on panel |
| お気に入り | `aria-pressed` · `aria-label="お気に入り"` |
| フォーカス | 可視 outline · `:focus-visible` |
| Homonym | `role="note"` |

## 10.2 禁止

- Hover のみで意味が変わる UI
- 色だけで status を伝える（バッジにテキストあり）
- 自動フォーカスで検索框を奪う（初回）

## 10.3 キーボード

- Tab: 検索 → チップ → カード → Header
- Enter on card: navigate
- Esc: 検索解除（推奨 · Open Issue）

---

# 11. Guard Rails

## 11.1 ブランド違反（禁止）

- ブランドを語り始める Hero
- コピーを主役にする
- 長時間滞在を促す（記事 · 動画 · チュートリアル Hub 化）
- 回遊率 KPI
- ランキング · おすすめ押し付け · AI おすすめ
- SNS 化 · ニュース化 · 学習サイト化

## 11.2 UX 違反（禁止）

- モーダルだらけ · カルーセル · 自動再生
- スクロール演出 · パララックス · 派手アニメ
- Hover 依存 · 設定画面増殖 · クリック数増加

## 11.3 IA 違反（禁止）

- カテゴリ乱立 · 検索よりカテゴリ優先
- カード説明の長文化 · カードの広告化 · ブログ化

## 11.4 実装違反（禁止）

- SPA 化 · React 前提 · SSR · API · DB · WebSocket
- Firebase / Supabase on Hub
- ユーザー入力送信 · 検索クエリ保存
- Analytics 本文送信 · 巨大 JSON 初回必須（改善まで要注意）

## 11.5 Agent 向け

一般的な SaaS ベストプラクティス（Discover feed · onboarding · personalization）を **そのまま適用しない**。

変更前チェック:

1. 仕事へ戻る速さが上がるか
2. 引き算を増やしていないか
3. ADR-001 Rejected を復活させていないか
4. SSOT を経由せず HTML を書いていないか

---

# 12. ADR（重要判断）

| ID | 決定 | 理由 |
|----|------|------|
| **H-001** | Hub = 探索入口 · Product = 作業 | ADR-0003 三層 |
| **H-002** | 検索 > カテゴリ > fav > recent > popular > all | Pain 最短 · 誘導しない |
| **H-003** | 検索語彙 3 層 · 表示名不変 | ブランド用語と SEO 分離 |
| **H-004** | カード = JTBD 2 文 · 辞書 = Pain | ADR-002 |
| **H-005** | NEW はバッジのみ · 新着レール禁止 | ニュース化 Reject |
| **H-006** | 人気バッジ on card 禁止 · popular grid のみ | ランキング文化 Reject |
| **H-007** | Desktop 4 列 · 左寄せ固定 | ADR-005 |
| **H-008** | localStorage のみ · キー変更禁止 | F1 · F2 |
| **H-009** | hub-search-bundle 1 本 fetch | MECE · 辞書直 fetch 禁止 |
| **H-010** | クエリ本文 GA 送信禁止 | プライバシー · Anti #14 |
| **H-011** | Header にツール横並び禁止 | Hub = 唯一探索入口 |
| **H-012** | Embedding / AI 検索 Reject（Phase 1–2） | 引き算 · 説明不能 reco 禁止 |
| **H-013** | 仕事コンテキスト質問 · 条件付き1回 · 本文非送信 · **Persona分類禁止** | H-UI-07 · Pain/Moment/Job のみ |

**H-013 一文（憲法裁判所）:**

```text
取得した回答は Persona 分類には利用しない。

必ず Pain / Moment / Job へ正規化し、
検索辞書・検索例・Hub IA 改善のみに利用する。
```

補強判例: 調査ではなく改善への参加 · Moment 正規化 · マーケセグメント禁止 · おすすめ生成禁止 → [PHASE_H-UI-07](./PHASE_H-UI-07-work-context.md) · **[CASE-2026-004](../../legal/CASE_LAW.md#case-2026-004)**

**Phase 仕様:** [PHASE_H-UI-07-work-context.md](./PHASE_H-UI-07-work-context.md)

**既存 ADR 参照:** ADR-001 〜 ADR-006 · ADR-0003 · `decision-log/2026-07-top-page-ux-review.md`

---

# 13. Open Issues

| ID | 課題 | 優先 | 備考 |
|----|------|------|------|
| O-1 | hub-search-bundle ~620KB の遅延ロード | **高** | §8.3 |
| O-2 | 100 ツール超での categoryIds[] マルチタグ | 低 | Phase 2 · TODO in hub-ia.js |
| O-3 | relations.json の Product / Hub 反映方針 | 低 | reco 化しない前提 |
| O-4 | Hero コピーの憲法監査（ブランド語量） | 中 | 機能羅列を削る余地 |
| O-5 | 検索框 Esc 解除 | 低 | a11y |
| O-6 | searchExampleChips の Pain 化（PDF→提出 等） | 中 | 辞書思想と整合 |
| O-7 | `/category` ページの blurb duplicate SEO | 低 | GSC 監視 |
| O-8 | Phase 3「解析後おすすめ」の再評価条件明文化 | 低 | データがあっても reco 黒箱は Reject 維持 |
| **O-9** | **Phase H-UI-07 仕事コンテキスト入力** | 中 | [PHASE_H-UI-07-work-context.md](./PHASE_H-UI-07-work-context.md) · 未実装 |
| O-10 | 匿名集計 ADR（work context 回答の集約） | 低 | 本文 GA 禁止 · サーバー送信は ADR 後 |

---

# 14. Non Goals（将来やらないこと）

Hub に **永続的に載せない** 機能:

| Non Goal | 理由 |
|----------|------|
| ユーザアカウント · クラウド同期 fav/recent | F1 · Sync 線と混同 |
| AI おすすめ · パーソナライズ feed | Anti #6 · #9 |
| ランキング · 利用数表示 · レビュー | エンゲージメント文化 |
| ブログ · ニュース · チュートリアル Hub | 滞在促進 |
| カードサムネ · 動画プレビュー | 重量 · カタログ化 |
| Autocomplete サーバー | API 禁止 |
| Embedding / ベクトル検索 | 説明不能 · インフラ |
| 新着レール · Hero 大型カード | Discover 化 |
| 5–6 列 grid · センター Hero | ADR-005 Rejected |
| 検索履歴 sync | 囲い込み |
| A/B テスト基盤 Hub 専用 | 複雑化 |
| 広告クリック最適化レイアウト | ユーザー価値と矛盾 |
| Hotjar / Clarity 等ヒートマップ追加 | スコープ外 · プライバシー |
| Hub から Product へのモーダル quick view | クリック増 · 作業場所の混同 |
| **毎回の仕事コンテキスト質問** | 前工程化 · H-UI-07 で条件付きのみ可 |
| work context を reco / 広告 / プロファイルに使う | Anti #9 · #14 |
| work context を Persona 分類 · 「○○向け」ページに使う | H-013 · Pain 起点逸脱 |
| work context からおすすめ棚を生成する | Hub = 探させる · おすすめしない |

---

## 改訂履歴

| 日付 | 内容 |
|------|------|
| 2026-07-24 | 初版 — ブランド憲法レビュー · 14 章 MECE · 実装 Phase 2 整合 |
| 2026-07-24 | Phase H-UI-07 cross-link · localStorage · ADR H-013 |
| 2026-07-24 | H-013 補強判例（Moment 正規化 · Persona/マーケ/reco 禁止） |
