# SUGUDASU デザインガイドライン

**対象**: `tools/*.html` 全 core ツール（レイアウト選定: [`notes/PAGE_LAYOUT_SELECTOR.md`](notes/PAGE_LAYOUT_SELECTOR.md)）  
**Sync 層（別ライン）**: [`DESIGN_GUIDELINE_SYNC.md`](DESIGN_GUIDELINE_SYNC.md) — `sync.sugudasu.com` · タイムライン共有  
**情報ページ（法務·約束）**: [`DESIGN_GUIDELINE_INFO_PAGES.md`](DESIGN_GUIDELINE_INFO_PAGES.md) — statements · privacy 等（**tool lead 対象外**）  
**Schedule Notion Like（参照 · Agent 必須）**: [`DESIGN_GUIDELINE_NOTION_LIKE.md`](DESIGN_GUIDELINE_NOTION_LIKE.md) + **色マップ SSOT** [`notes/DESIGN_NOTION_SUGUDASU_ADAPT.md`](notes/DESIGN_NOTION_SUGUDASU_ADAPT.md)（`.cursor/rules/sugudasu-design-schedule.mdc`）  
**ツールリード文**: [`notes/TOOL_LEAD_COPY_AGENT_PLAYBOOK.md`](notes/TOOL_LEAD_COPY_AGENT_PLAYBOOK.md) · Experience 契約 [`notes/UIUX_EXPERIENCE_IMPLEMENTATION_CONTRACT.md`](notes/UIUX_EXPERIENCE_IMPLEMENTATION_CONTRACT.md) §4.1 · Surface [`同契約 §2.4`](notes/UIUX_EXPERIENCE_IMPLEMENTATION_CONTRACT.md) / 本ガイド §2.3.1  
**読者**: Claude / 人間の実装者  
**更新**: 2026-08-05（§2.3.1 Surface / VH · S-SURFACE）

---

## 0. このガイドの目的と設計根拠

### 0.1 何を守るか

Gemini 生成物にありがちな「PROバッジ・絵文字多め・ギフトショップ風・色がツールごとにバラバラ」を抑え、**20〜30代・ITリテラシーあり**が日常的に触る **無料Webツール / 軽量SaaS**（Notion・freee風の入力、Stripe Docs・Vercel Dashboard 風の余白とコントラスト）に寄せる。

> 参考イメージ: [invoice-pdf-generator](https://github.com/Kaoru-Stats-Lab/invoice-pdf-generator) の **2カラム＋用紙プレビュー＋印刷分離** は採用。**過剰な装飾・バッジ・FAQの装いすぎ** は採用しない。

### 0.2 なぜこのガイドラインにしたか

| 判断 | 理由 |
|------|------|
| **ツール横断で色を統一**（indigo/amber 等を廃止） | 9本を行き来するユーザーが「別サイトに飛んだ」と感じないため。差別化はヘッダー1アイコン＋タイトルのみで足りる |
| **3層アクション**（L1 セグメント / L2 青 / L3 緑） | モード切替・実行・印刷の役割が混ざると誤タップと AdSense 審査リスクが増える。Stripe・iOS 設定画面と同様、**色の意味を固定**する |
| **L1 は無彩色ピル**（`sg-segment`） | 青塗りタブは「押せる主ボタン」と誤認されやすい。選択状態は白ピル＋スライド（180ms）で十分伝わる |
| **L3 緑は印刷/PDFのみ・1画面1つ** | 請求・領収・ラベルで「保存」と「印刷」が競合しないよう、収益導線（印刷完了）を最も目立たせつつ他CTAを青に集約 |
| **流行UIを追わない** | グラデCTA・ダーク＋蛍光・PROバッジはチープ感と有料誤解を招く。実務ツールは **3年後も古く見えない** 中立トーンが正 |
| **ローカル完結バッジ**（emerald pill） | 「データを送らない」はペルソナの不安解消に直結。緑はこの用途に限定し他へ流用しない |

実装の詳細メモ（PoC 差分）は [`archive/UI_MODE_SWITCH_DESIGN_PROPOSAL.md`](archive/UI_MODE_SWITCH_DESIGN_PROPOSAL.md)（**アーカイブ · 正本は §3.2–3.3**）。

---

## 1. ペルソナとトーン

### 1.1 想定ユーザー（プロダクト視点）

**名前は付けないが、常にこの1人を想定して文案・UIを決める。**

| 属性 | 内容 |
|------|------|
| 年齢・職種 | 25〜34歳。副業フリマ・小規模店舗・現場リーダー・総務まわりのオフィスワーカー |
| ITリテラシー | Notion / Google スプレッドシート / freee 試用 / Chatwork 日常利用。アカウント作成は面倒と感じる |
| 利用シーン | 移動中・店舗バックヤード・会議直後。**ログインなし・その場で終わる**ことを最優先 |
| 不安 | 個人情報・売上・名簿が外部に送られること。クラウド請求の月額 |
| 成功像 | 「地味だがミスなく早い」ツール。SNSで派手に宣伝するサービスより信頼できる |
| 避けたい体験 | PROバッジ・AI感の強い演出・色がツールごとに違う・印刷でレイアウトが崩れる |

運営者プロフィール（カオル）の公開文言は `docs/operator-profile.md`。**ペルソナ＝ユーザー像、カオル＝開発者**と混同しない。

### 1.2 トーン（表現）

| 項目 | 方針 |
|------|------|
| 言葉 | 敬体だが堅すぎない。「すぐ終わる」「ブラウザだけで完結」「データは送らない」 |
| 見た目 | **実用ファースト**。装飾より読みやすさ・タップしやすさ・印刷の確実さ |
| 避ける | キラキラ感、和風セリフ多用、PRO/AI感の強いバッジ、絵文字の連打、ダークヘッダー＋蛍光グリーンの定型 |

### 1.2.1 ユーザー向けコピー方針（リード · FAQ · hub）— **固定**

**誰に書くか:** §1.1 の1人（Notion / スプシは使えるが **エンジニアではない**）。エンジニア向け ROLE や社内コードネームで書かない。

**ツールリード文の構造（2026-07-30 決議）:** 詳細・手順は [`notes/TOOL_LEAD_COPY_AGENT_PLAYBOOK.md`](notes/TOOL_LEAD_COPY_AGENT_PLAYBOOK.md) · 契約 [`notes/UIUX_EXPERIENCE_IMPLEMENTATION_CONTRACT.md`](notes/UIUX_EXPERIENCE_IMPLEMENTATION_CONTRACT.md) §4.1 · 分類 `data/tool-lead-profiles.json`。本節は **トーンと語彙**、Playbook は **What/Why/How の出し分け**。食い違うときは Playbook §4.1 を優先。

| `lead_profile` | リードに置く | 置かない |
|----------------|--------------|----------|
| **light** | **What**（何か・誰向け）1〜2文 | 長い競合比較 · **How（操作手順）** |
| **heavy** | What +（任意）シナリオ1句 +（任意）Boundary予防線1句 | How（UI直下 or FAQへ） |

- **FAQ** = 境界・誤解解消（Pull）。リード What の代替にしてはならない。
- **Hub カード** = 別 SSOT（[`notes/TOOL_CARD_WRITING_GUIDELINE.md`](notes/TOOL_CARD_WRITING_GUIDELINE.md)）。tool lead と兼用しない。

**どこまでわかりやすくするか（線引き）**

| 層 | 載せてよい | 載せない（画面外·FAQ深部へ） |
|----|------------|------------------------------|
| **第1画面のリード（`sg-tool-lead`）** | 仕事の言葉の **What**（必須）。heavy のみ短い Why / 非代替1句 | 英語のコードネーム · Diff / LCS / Workbench / Audit · API · CSS · **操作手順の列挙** |
| **ボタン · ラベル** | 「危険な変更を確認」「元の文」「書き換え後」 | 「Run diff」「Mini map」を説明なしで主役にしない |
| **FAQ / statements** | 必要なら専門語を**定義してから**使う · できる/できない | ユーザーが覚えなくてよい実装詳細 |

**一読テスト（必ず）:** 「この文を、チャットと Excel は使える総務の人に読ませたとき、**1回で手元の作業が想像できるか**」。No なら書き換え。迷ったら日本語の仕事語に落とす。

**悪い → よい（差分チェック）**

| 悪い | よい |
|------|------|
| AI Rewrite Audit Workbench | （h1 はプロダクト名で足りる。副題は日本語） |
| Diffの網羅表示ではなく… | すべての違いを並べるのではなく、**見逃すとまずい変更（数字・日付・URLなど）から確認**します |
| Network（入力データの POST） | `{対象}はサーバーに送信しません`（通信全般ゼロは禁止 · [`DATA_PRIVACY_CLAIM_POLICY`](notes/DATA_PRIVACY_CLAIM_POLICY.md)） |
| ①登録 → ②生成 → ③印刷（をリードに） | What のみ。手順は UI 直下の短いヒントか FAQ |

**ROLE を使うなら:** Agent に「§1.1 ペルソナとして書け」と渡すのは可。**ROLE でペルソナを上書きしない**（別ペルソナを発明しない）。コピーの SSOT は本節 + `TOOL_NAMING_AGENT_PLAYBOOK` の概念名 + **リード構造は `TOOL_LEAD_COPY_AGENT_PLAYBOOK`**。

**本番に出してよいか（見せる / 見せない）:** [`notes/USER_FACING_COPY_VISIBILITY.md`](notes/USER_FACING_COPY_VISIBILITY.md) — `docs/` パス · slug ラベル · Agent 用語はユーザー面禁止。Alpha/Beta バッジとは別問題。

**英語・略語の扱い**

- **実務で通じるもの**（CSV · PDF · QR · Excel 貼付）→ そのまま可
- **開発者の道具名**（Diff · Workbench · canonical · LCS）→ **第1画面禁止**。概念名は日本語（差分チェック · 危険な変更）
- ナビは常に `navLabel`（概念）。英語製品名を h1 にしない

### 1.3 命名の3層（id · 概念 · プロダクト）

**SSOT**: `data/tool-registry.json` の各ツールキー（`id`）と `conceptName` / `productName` / `navLabel`。

ユーザーが「どのツールか」を迷わないよう、**用途語（概念）** と **製品名（プロダクト）** と **コード識別子** を混在させない。

| 層 | キー | 例（invoice） | 使う場所 |
|----|------|---------------|----------|
| **コード id** | レジストリキー · `data-sg-tool-id` · ファイル名 | `invoice` · `invoice.html` | JS · changelog · GA · 開発者向け |
| **概念名** | `conceptName` | 請求書 | ナビ短ラベル · 本文 · 帳票種別 · FAQ「請求書とは」 |
| **プロダクト名** | `productName` | SUGUDASU 請求書 | 白ヘッダー見出し（`data-sg-title`）· hub カード見出し · ツール間リンク |

**ルール**

1. **ヘッダー見出し** = `productName`（`SUGUDASU` + 半角スペース + 概念の短称）。機能の補足は `data-sg-subtitle` に置く（例: 請求書ツール → product `SUGUDASU 請求書` · subtitle `見積 · 納品 · 請求`）。
2. **ダークナビ** = `navLabel`（= 概念の短縮。`SUGUDASU` は付けない — 左ロゴで既出）。
3. **本文・帳票 UI** = `conceptName`（「見積書」「請求書」タブ等）。プロダクト名を帳票内に繰り返さない。
4. **`<title>` / SEO** = 機能説明 + `| SUGUDASU`（検索意図優先。プロダクト名の機械的連結はしない）。
5. **法務・サイトページ**（privacy / terms / hub / updates / statements）= プロダクト接頭辞なし可。**ページ種別ごとのレイアウト選定**: [`notes/PAGE_LAYOUT_SELECTOR.md`](notes/PAGE_LAYOUT_SELECTOR.md)（着手前必須）。法務タイポ: [`DESIGN_GUIDELINE_INFO_PAGES.md`](DESIGN_GUIDELINE_INFO_PAGES.md) · ガイド記事は別系統（`sg-guide-page`）。
6. **Sync ライン**（`sync.sugudasu.com`）= 本ファイルの対象外。**env / インフラ**: [`notes/SYNC_ENV_KEYS.md`](notes/SYNC_ENV_KEYS.md) · [`notes/SYNC_INFRA_CLOUDFLARE.md`](notes/SYNC_INFRA_CLOUDFLARE.md) · UI: [`DESIGN_GUIDELINE_SYNC.md`](DESIGN_GUIDELINE_SYNC.md)
7. **新規ツール追加時** — **`docs/notes/TOOL_NAMING_AGENT_PLAYBOOK.md`** の手順 A（registry 先 → HTML · hub · shell → `npm run validate:tool-naming`）。値の SSOT は `data/tool-registry.json`。

**全ツール対応表（2026-06）**

| id | conceptName | productName | navLabel |
|----|-------------|-------------|----------|
| hub | ツール一覧 | ツール一覧 | 一覧 |
| invoice | 請求書 | SUGUDASU 請求書 | 請求書 |
| receipt | 領収書 | SUGUDASU 領収書 | 領収書 |
| label | 宛名ラベル | SUGUDASU ラベル | ラベル |
| shift | シフト表 | SUGUDASU シフト | シフト |
| report | 議事録 | SUGUDASU 議事録 | 議事録 |
| reverse | 逆引き辞典 | SUGUDASU 逆引き | 逆引き |
| normalize | テキスト整え | SUGUDASU 全角半角整え | 全角半角 |
| webp-to-jpg | WebP変換 | SUGUDASU WebP変換 | WebP→JPG |
| group-split | 班分け | SUGUDASU 班分け | 班分け |
| present | ギフト提案 | SUGUDASU ギフト | ギフト |
| fair-draw | 公平抽選 | SUGUDASU 抽選 | 抽選 |
| warikan | 割り勘 | SUGUDASU 割り勘 | 割り勘 |
| sns | SNSデコ文字 | SUGUDASU SNS | SNS |

**Agent 手順（詳細）:** `docs/notes/TOOL_NAMING_AGENT_PLAYBOOK.md` · 検証: `npm run validate:tool-naming`

---

## 2. デザイントークン（全ツール共通）

### 2.1 カラー

```text
ページ背景      #F1F5F9  (slate-100)
カード背景      #FFFFFF
ボーダー        #E2E8F0  (slate-200)
本文            #1E293B  (slate-800)
補助テキスト    #64748B  (slate-500)
プライマリ      #2563EB  (blue-600)   … 主CTA・リンク
プライマリ hover #1D4ED8  (blue-700)
セカンダリ      #0F172A  (slate-900)   … ヘッダー・強調ボタン
成功・印刷CTA   #059669  (emerald-600) … 印刷/PDFのみ（1画面1つまで）
警告            #D97706  (amber-600)
エラー          #DC2626  (rose-600)
```

- **ツールごとに indigo / amber / rose のテーマ色を変えない**（差別化はアイコン1つ＋ページタイトルのみ）。
- プレビュー用紙内の **帳票・ラベル** はモノクロ＋1アクセント（表ヘッダー `slate-800` など）に限定。

### 2.2 タイポグラフィ

```html
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Noto+Sans+JP:wght@400;500;700&display=swap" rel="stylesheet">
```

| 用途 | サイズ | ウェイト |
|------|--------|----------|
| ページタイトル（ヘッダー内） | 15–16px | 700 |
| セクション見出し | 13–14px | 700 |
| ラベル | 11–12px | 600, `text-slate-600` |
| 入力・本文 | 13–14px | 400–500 |
| 金額・型番 | `Roboto Mono` or `Inter` tabular | 500–700 |

- **Shippori Mincho / Marcellus 等の装飾フォントは使わない**（プレゼント・逆引きも Noto のみで統一）。
- 見出しに絵文字を付ける場合は **最大1つ/セクション**。

### 2.3 余白・角丸・影

| トークン | 値 |
|----------|-----|
| ページ左右 padding | `px-4 sm:px-6 lg:px-8` |
| カード padding | `p-5 lg:p-6` |
| カード角丸 | `rounded-xl`（`2xl` はヒーローのみ） |
| カード影 | `shadow-sm` + `border border-slate-200`（影だけに頼らない） |
| 入力角丸 | `rounded-lg` |
| セクション間 | `space-y-5` または `gap-6` |

#### 2.3.1 Surface / 視覚階層（S-SURFACE · 2026-08-05）

**契約正本:** [`notes/UIUX_EXPERIENCE_IMPLEMENTATION_CONTRACT.md`](notes/UIUX_EXPERIENCE_IMPLEMENTATION_CONTRACT.md) §2.4（HOW · 憲法ではない）。

| 原則 | 内容 |
|------|------|
| 階層の手段 | **余白 · 境界線 · 背景の明度差（ΔL）**。多層ドロップシャドウを主手段にしない |
| Hub | 検索だけ一段上げ（Locate-core）。カテゴリ/最近は補助。**カードは同型** |
| Product | Workspace（触る面）は原則1つ。クラス: `.sg-surface-workspace` / 非作業: `.sg-surface-section` |
| 禁止 | Primary 一括再定義 · カード廃止 · Hub/全ツール一括 Surface · Hub の作業机化 |

パイロット: Hub Locate-core（済）· **pdf-fill S-PILOT-2（仮説検証）**。

### 2.5 Core UI Refresh（2026-07）

`docs/notes/UI_LAYOUT_REFRESH_GUIDE.md` を正本として、core は次を共通化する。

- 本文コンテナ: `.sg-main-shell`（標準幅 76rem） / 帳票ワイド: `.sg-main-shell--wide` / 印刷: `.sg-main-shell--print`
- ツール冒頭: `.sg-tool-intro` + `.sg-tool-lead-deck`（**単列スタック** · 補足は `.sg-tool-lead--meta`）— **シェル幅いっぱい** · `max-w-3xl` 禁止 · **PC 2列リード禁止**（読みづらい）。文案の出し分けは [`notes/TOOL_LEAD_COPY_AGENT_PLAYBOOK.md`](notes/TOOL_LEAD_COPY_AGENT_PLAYBOOK.md)
- セクション外枠: `.sg-section-shell`
- FAQ（**必須テンプレ**）: `</main>` の**外**に置く。`.sg-faq-section` > `.sg-faq-inner` > `.sg-faq-title` + `.sg-faq-list`。`main` / `.sg-main-shell` 内に置かない（背景がシェル幅に縮む）
- 最小文字サイズ: 本文14px・補助12px・マイクロ11px（10px常用禁止）

### 2.4 レイアウト

**ページ全体の幅・系統**は [`notes/PAGE_LAYOUT_SELECTOR.md`](notes/PAGE_LAYOUT_SELECTOR.md) と [`notes/UI_LAYOUT_REFRESH_GUIDE.md`](notes/UI_LAYOUT_REFRESH_GUIDE.md) を正とする。実務ツールは `sg-main-shell`（標準 / `--wide` / `--print`）。`max-w-*` の直書きは新規禁止。

```text
┌─────────────────────────────────────────────┐
│ Header（slate-900・高さ 56–64px・sticky可）    │
├──────────────────┬──────────────────────────┤
│ フォームカード     │ プレビューカード            │
│ lg:col-span-6    │ lg:col-span-6            │
│ .no-print        │ .print-target 含む        │
└──────────────────┴──────────────────────────┘
│ Footer / FAQ（.no-print）                     │
└─────────────────────────────────────────────┘
```

- スマホ: 1カラム。**フォーム → プレビュー** の順（プレビューが先だと入力しづらい）。
- 旧 `max-w-7xl` / `max-w-[1600px]` 指定は廃止 — 経緯は [`archive/DESIGN_LAYOUT_PRE_UI_REFRESH_2026-07.md`](archive/DESIGN_LAYOUT_PRE_UI_REFRESH_2026-07.md)。

---

## 3. コンポーネント規約

### 3.1 ヘッダー（全ツール共通 · shell マウント）

命名の3層は **§1.3** · SSOT は `data/tool-registry.json`。マークアップ・属性・禁止事項は **[`notes/CHROME_HEADER_GUARDRAILS.md`](notes/CHROME_HEADER_GUARDRAILS.md)** のみ参照（各 HTML への `<header>` 直書きは禁止）。

- **「PRO」バッジは付けない**（有料感・チープ感が出る）。
- モバイルナビは横スクロール前提（固定5列グリッドは禁止）。

### 3.1b Continue Later（続きを開く · 共通）

途中再開が必要な **Document 型**ツール（PDF Fill · 工程表 · ドラフト会議 · 班分け等）の共通 UX。  
**正本（思想 · 3層 · JSON · 適用範囲）:** [`notes/CONTINUE_LATER_SPEC.md`](notes/CONTINUE_LATER_SPEC.md)

| 採る | 採らない |
|------|----------|
| ユーザー向け主役: **「続きを開く」** | 「保存」を主 CTA にすること（実装用語） |
| Level 1 自動（IndexedDB）+ Level 2 JSON | 全ツール一律（QR · WebP 等の一発変換は不要） |
| Hub / ツールへの JSON Drop（`productId` で遷移） | プロダクトごとに独自の保存ダイアログを発明 |

**共通パネル（要約）:** 続きを開く → 最近使用したファイル（仕事名）→ 保存ファイルを開く / DnD。  
明示エクスポート時の副ボタンだけ「保存」（`*_sugudasu.json`）。  
Level 3（どこでも続き）は Sync — [`notes/SUGUDASU_SYNC_LINE.md`](notes/SUGUDASU_SYNC_LINE.md)。

### 3.2 ボタン（3層アクション）

| 層 | 種別 | クラス | 用途 |
|----|------|--------|------|
| L2 | プライマリ | `.sg-btn-primary` または `bg-blue-600 hover:bg-blue-700 …` | 実行・生成・計算・**handoff**・フル幅の副完了。**1画面の「進む」系は青** |
| L3 | 印刷・PDF（文脈内） | `bg-emerald-600 hover:bg-emerald-500` | **成果物を紙へ出す出口**（プレビュー／結果直下）。**1画面1つ**。**sticky ヘッダーには置かない**（E-L3 · 2026-07-30 確定 · Copy-First と競合するため） |
| — | セカンダリ | `bg-white border border-slate-200 text-slate-700 hover:bg-slate-50` | 補助操作 |
| — | インク（小操作） | `bg-slate-900 hover:bg-slate-800`（任意 `.sg-btn-ink`） | **行追加など短い道具操作のみ** |
| — | 危険 | `text-rose-600 hover:text-rose-700` | 削除など（テキストのみ可） |

- グラデーションボタン（`from-emerald-600 to-indigo-600`）は **使わない**。
- **黒の可否（E-BLACK · 2026-07-30）:** 小操作黒は可。`w-full` 黒・クロスツール handoff・共有URL/一括反映/履歴保存級は **L2 青**。例外表の正本は [`notes/UIUX_EXPERIENCE_IMPLEMENTATION_CONTRACT.md`](notes/UIUX_EXPERIENCE_IMPLEMENTATION_CONTRACT.md) §2.1。一括置換禁止。

### 3.3 タブ・セグメント（L1 モード切替）

```html
<div class="sg-segment sg-segment--cols-3 sg-segment--mode-estimate" id="doc-type-segment" role="tablist" aria-label="…">
  <span class="sg-segment__pill" aria-hidden="true"></span>
  <button type="button" role="tab" data-segment-value="estimate" class="sg-segment__btn" aria-selected="true">見積書</button>
  <!-- … -->
</div>
<p class="sg-segment-hint" id="doc-type-hint" role="note">モードごとの1行説明</p>
```

| 項目 | 正本 |
|------|------|
| スタイル | `assets/sugudasu.css`（`.sg-segment*` · `--mode-*` 文字色） |
| 挙動 | `assets/sugudasu-segment.js` — `SUGUDASU_SEGMENT.mount({ segmentId, order, hints, modeClassMap, previewSelector, onChange })` |
| 参照実装 | `tools/invoice.html`（3分割）· `tools/receipt.html`（2分割） |

**展開済みツール:** `invoice` · `receipt` · `warikan` · `report` · `reverse` · `label`  
見積/納品/請求、ローカル/Gemini、係数/固定額、ラベル/カードは **すべて同一パターン**（アクティブ文字色のみ `sg-segment--mode-*` で差分）。

- キーボード: 左右矢印でタブ移動（`prefers-reduced-motion` 時はヒントフェード省略）。
- **青塗りセグメントは禁止**（主CTAと役割が衝突する）。

**Notion Like variant（2026-06）:** 詳細は `docs/notes/DESIGN_NOTION_SUGUDASU_ADAPT.md` §7。L1 は **ハイブリッド** — `sg-segment` ピルは維持し、トラックに `sg-segment--notion-soft`（影・青枠弱体化）。モード説明は `.sg-segment-hint`（Callout · ℹ 左 · hairline · indigo 文字禁止）。全面テキストタブ（`.sg-notion-tabs`）への置換は L1 視認性のため **行わない**。

### 3.4 入力

```html
<label class="block text-xs font-semibold text-slate-600 mb-1">ラベル</label>
<input class="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white
  focus:outline-none focus:ring-2 focus:ring-blue-500/25 focus:border-blue-500">
```

- ファイルアップロード: `border-2 border-dashed border-slate-200 rounded-lg` の正方形エリア。

**必須未入力（EFO）** — `alert` のみにしない。`assets/sg-form-validate.js` を使い:

1. 失敗時: 入力枠を **rose 枠 + 薄赤背景**（`.sg-field--error`）· 直下に **11px エラーメッセージ** · **focus + scrollIntoView**
2. 入力開始でエラー解除（`bindFieldErrorClear`）
3. `block` 系 `alert` は **通信失敗・権限** など入力では直せないケースのみ

```javascript
import { validateFields, bindFieldErrorClear } from '../assets/sg-form-validate.js';
bindFieldErrorClear(document.getElementById('in-prize-name'));
if (!validateFields([{
  el: document.getElementById('in-prize-name'),
  message: '景品名を入力してください（証跡PDFに必須）。',
  test: (el) => el.value.trim().length > 0,
}])) return;
```

### 3.5 プレビュー「用紙」

| 種類 | 画面 | 印刷 |
|------|------|------|
| A4縦（請求書・ラベル・カード） | `width: 210mm`、影 `shadow-md`、背景白 | 影なし・scale(1) |
| A4横（シフト） | 同上 `297mm × 210mm` | `@page { size: A4 landscape }` |

- 画面内縮小: `transform: scale(0.65~0.85)` + `origin-top-left`。**印刷時は必ず scale(1)**。

### 3.6 信頼バッジ

「ローカル完結」系の emerald pill は、**入力データを処理目的でサーバーに送らない**不安解消に使う。緑はこの用途に限定し他へ流用しない。

### 3.6b 入力データ非送信の主張（恒久 · SSOT）

**正本:** [`notes/DATA_PRIVACY_CLAIM_POLICY.md`](notes/DATA_PRIVACY_CLAIM_POLICY.md)

| ルール | 内容 |
|--------|------|
| 浅いバッジの核 | `{対象物}はサーバーに送信しません`（例: 入力内容 · 名簿 · 景品情報） |
| 禁止表現 | `通信ゼロ` · `外部送信ゼロ` · 「通信が一切ない」· 「Network でリクエストが出ない」など **通信全般の不在** |
| 深い説明 | `/statements` のみ。テレメトリ（GA4 · AdSense予定 · Fonts）は誠実開示 |
| 新規ツール | **共通コンポーネント必須**（承認後実装）。ハードコードでの都度実装を禁止 |
| Sync | 非送信バッジと混同しない専用表示 · デフォルトオフ · コア既定は非送信のまま |

```html
<!-- 承認後は共通コンポーネント経由。ハードコード禁止 -->
<p class="text-[11px] text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full">
  入力内容はサーバーに送信しません
</p>
```

- ヘッダー右 or フォーム直上。緑は **この用途のみ**。バッジに約束ページへのリンクを足さない（フッター導線のみ）。

### 3.7 AdSense プレースホルダ（導入時）

```html
<aside class="no-print ad-slot border border-dashed border-slate-200 rounded-lg bg-slate-50
  text-[10px] text-slate-400 text-center py-6">
  広告枠
</aside>
```

- プレビュー用紙・入力テーブルの **上に重ねない**。

### 3.8 コピー・クリップボード契約（全ツール必須）

**根拠:** 高リテラシーほどノールックでコピーする → 構造破壊・先祖返り・変換前データ混入を UI で防ぐ。  
**詳細事例:** `docs/notes/SUGUDASU_OOPS_GUARDRAILS.md` · 参照実装: `tools/normalize.html`

| ルール | 必須度 | 内容 |
|--------|--------|------|
| **A. コピー＝最新出力** | 変換・整形・計算があるツール **必須** | 「コピー」押下時に **出力を再計算**してから `clipboard` へ。入力欄の生テキストはコピーしない |
| **B. 行数 N → M** | 行構造を維持するツール **必須** | `入力 N 行 → 出力 M 行` を目立たせる。一致=緑 · 不一致=黄 + **コピー前チェック必須** |
| **C. コピー成功フィードバック（C+）** | **全ツール必須**（コピーボタンがあるもの） | **操作点:** ラベル「コピーしました」~2s（`.sg-copy-btn--confirmed` · **ボタン色は変えない**）。**Transform-Copy:** 近接 status に行数+先頭プレビュー（`toastEl`）。アクセントは `--sg-copy-ok`（印刷緑と別）。`role="status"` |
| **D. フィルター注意** | 行単位データをExcelへ戻すツール | コピー成功の近接 status 末尾に1行（非表示行・フィルター） |

**禁止（E-TOAST/E-FLASH C+ · 2026-07-30）:** `body` 全面フラッシュ · ボタンの印刷 emerald 一時塗り · 成功用グローバル浮遊 Toast · 確認の意図的薄化 · `Copied!` · `alert` 成功

**実装 SSOT:** `assets/sg-copy-feedback.js`（`SG_COPY_FEEDBACK` グローバル）· 討議録 `notes/UIUX_EXPERIENCE_TOAST_FLASH_BOARD_DISCUSSION.md`

```html
<!-- 変換系ツール末尾（shell の前） -->
<script type="module" src="../assets/sg-copy-feedback.js"></script>
```

```javascript
// パターン1: 整形・計算結果のコピー（report / warikan / reverse 等）
await SG_COPY_FEEDBACK.copyWithFeedback(text, btn, {
  toastEl: document.getElementById('copy-toast'),
  lineCount: SG_COPY_FEEDBACK.countLines(text),
  previewLine: text.split('\n')[0],
  toastPrefix: '出力',
});

// パターン2: 行数維持の変換（normalize）
SG_COPY_FEEDBACK.updateLineMatchDisplay(lineMatchEl, inLines, outLines);
SG_COPY_FEEDBACK.syncCopyGate({ gateEl, checkEl, copyBtn, inputLines, outputLines });
await SG_COPY_FEEDBACK.copyLatestTransform({
  computeOutput: () => normalizeText(input).output,
  buttonEl: btnCopy,
  toastEl,
  showFilterReminder: true,
  gate: { gateEl, checkEl, getInputLines, getOutputLines },
});
```

**HTML マークアップ（行数チェックあり）**

```html
<div id="line-match" class="sg-line-match sg-line-match--ok hidden" aria-live="polite"></div>
<div id="copy-gate" class="sg-copy-gate hidden rounded-lg border px-3 py-2 text-xs">
  <p class="font-bold">行数が変わっています。意図した変換か確認してください。</p>
  <label class="flex items-start gap-2 mt-2 cursor-pointer">
    <input type="checkbox" id="copy-gate-check" class="mt-0.5">
    <span>行数の変化を理解したうえでコピーします</span>
  </label>
</div>
<button type="button" id="btn-copy" class="sg-btn-primary">コピー（最新の出力）</button>
<p id="copy-toast" class="sg-copy-toast hidden" role="status"></p>
```

**適用マトリクス**

| ツール | A | B | C |
|--------|---|---|---|
| report / reverse | ○ | △（行数は変わり得る） | ○ 適用済 |
| warikan / fair-draw | ○ | — | ○ 適用済 |
| invoice / receipt | ○ | — | ○ 適用済 |
| sns / updates | — | — | ○ 適用済 |
| normalize | ○ | ○ | ○ 参照実装 |
| label / shift / present | — | — | △（コピーUIなし） |

- **禁止:** 変換と同時の自動クリップボード上書き（Before/After 確認チャンスを奪う）
- **L2 青コピー** と **C フィードバック** は競合しない（`コピーしました` 後にボタン文言を復元 · **色は青のまま**）

### 3.9 体感SLA（E-SLA · 2026-07-30 FIX · ガイドライン級）

**置き場:** DESIGN + Experience 契約の原則。**憲法には上げない**（identity ではなく出来のよさ · [`legal/LEGAL_INTERPRETATION_GUIDE.md`](legal/LEGAL_INTERPRETATION_GUIDE.md) §2.1）。  
**討議:** [`notes/UIUX_EXPERIENCE_SLA_BOARD_DISCUSSION.md`](notes/UIUX_EXPERIENCE_SLA_BOARD_DISCUSSION.md)

**原則（硬）**

1. 操作には **即時の視覚フィードバック**（沈黙禁止）
2. 成功は **非ブロッキング**（`alert` 成功禁止 · C+）
3. 長処理には **進捗または busy** を見せる（完了だけ突然出さない）

**目安（軟 · 端末・データ量で変動してよい）**

| 系統 | 目安 | 備考 |
|------|------|------|
| 押下→ボタン/UI反応 | ≤ 100ms 体感 | 主観。憲法ゲートにしない |
| Transform-Copy（軽量） | ≤ 300ms 体感即時 | 行数上限とセット |
| Bake-Download（重） | busy 必須 · 完了は status | ZIP 等 |
| コピー成功表示 | ~2s（C+） | 既決 |
| 印刷ダイアログ以降 | OS 管轄 | E-L3 受容 · SLA 対象外 |

**対外コピー:** 「サクサク」など未定義の速さ語は新規に増やさない。既存は段階置換（「すぐ使える」「ブラウザ内で完結」等へ）。

---

## 4. 印刷ガイドライン（@media print）

### 4.1 原則

1. **操作用UIは一切印刷しない**（フォーム・ヘッダー・FAQ・広告・ツールチップ）。
2. **用紙1枚＝意図した物理サイズ**（A4縦が基本。シフトのみ横）。
3. ブラウザのヘッダー/フッター（URL・日付）はユーザー側でオフ推奨（UIに短い注記）。
4. 色は `-webkit-print-color-adjust: exact` で表ヘッダー等を維持。

### 4.2 必須クラス命名

| クラス | 意味 |
|--------|------|
| `.no-print` | 印刷時 `display: none !important` |
| `.print-only` | 画面では非表示、印刷時のみ表示（稀に使用） |
| `.print-target` | 印刷対象のルート（プレビュー親） |
| `.a4-page` / `.a4-sheet` | 物理用紙1枚 |

**ルール**: ボタン・ナビ・フォームには必ず `no-print`。プレビュー用紙自体には付けない。

### 4.3 標準 CSS スニペット（A4縦）

各 `tools/*.html` の `<style>` にコピーし、ツール固有部分だけ上書きする。

```css
@media print {
  @page {
    size: A4 portrait;
    margin: 0;
  }

  html, body {
    width: 210mm;
    min-height: 297mm;
    margin: 0 !important;
    padding: 0 !important;
    background: #fff !important;
    color: #000 !important;
  }

  .no-print {
    display: none !important;
  }

  .print-target {
    display: block !important;
    padding: 0 !important;
    margin: 0 !important;
    overflow: visible !important;
    background: transparent !important;
  }

  .print-target .preview-scaler {
    transform: none !important;
    scale: 1 !important;
  }

  .a4-page,
  .a4-sheet {
    box-shadow: none !important;
    margin: 0 !important;
    width: 210mm !important;
    min-height: 297mm !important;
    page-break-after: always;
    break-after: page;
  }

  .a4-page:last-child,
  .a4-sheet:last-child {
    page-break-after: auto;
    break-after: auto;
  }

  .label-cell {
    border-color: transparent !important; /* 補助破線を消す */
  }

  * {
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
  }
}
```

### 4.4 ツール別印刷仕様

| ツール | 用紙 | 余白（印刷） | 改ページ |
|--------|------|--------------|----------|
| `index.html` 請求書 | A4縦 | 15–20mm（帳票内 padding） | 明細が長い場合は用紙内で改ページ検討 |
| `label.html` | A4縦 | **0mm `@page margin`**。シール寸法は JS 規格マスタ通り | 24面/12面/10面ごとに1枚 |
| `shift.html` | A4横 | 5mm 程度 | **月ごと** `page-break-before: always` |
| `present.html` 等（印刷なし） | — | 印刷ボタン非表示 or 印刷対象なし | — |
| `warikan.html` | 任意 | 結果エリアのみ印刷する場合は `.print-target` を結果カードに限定 | 1ページ想定 |

### 4.5 画面用 scale と印刷の分離（重要）

```html
<div class="print-target bg-slate-200/50 p-4 rounded-xl no-print:bg-slate-100">
  <div class="preview-scaler scale-[0.75] origin-top-left ...">
    <div class="a4-page">...</div>
  </div>
</div>
```

```css
@media print {
  .preview-scaler { transform: none !important; margin: 0 !important; }
}
```

- **よくあるバグ**: 画面用 `scale(0.45)` が印刷に残り、用紙が小さくなる → 必ずリセット。

### 4.6 印刷前チェックリスト

- [ ] ヘッダー・フォーム・FAQ が消える
- [ ] 用紙が A4 1枚に収まる（Chrome 印刷プレビューで確認）
- [ ] 罫線・表ヘッダー色が消えない
- [ ] ラベル: 補助破線が印刷されない
- [ ] シフト: 2ヶ月目が2枚目に改ページされる

---

## 5. Gemini 生成物からの修正チェックリスト

実装・レビュー時に以下があれば **ガイドライン違反** として直す。

| 違反例 | 修正 |
|--------|------|
| `PRO` / `AI` バッジ | 削除 |
| ヘッダーがツールごとに indigo/amber/stone | `slate-900` に統一 |
| グラデーションCTA | 単色 `blue-600` or `emerald-600` |
| セリフ・ギフトショップフォント | Noto Sans JP のみ |
| 絵文字だらけの見出し | 0〜1個に |
| Tailwind CDN v3 と v4 混在 | **開発**は `@tailwindcss/browser@4` · **本番**は `npm run build:pages` で `tw-build.css` に事前コンパイル（browser CDN 禁止） |
| `<head>` 内の長文プロンプトコメント | `docs/prompts/` へ移し HTML から削除 |
| `flex-col` の typo (`flex-col: column`) | 修正 |
| 印刷時に `scale` 残存 | `@media print` で解除 |

---

## 6. ツール別の最小差分（アイコン・印刷の有無）

| ファイル | ヘッダーアイコン | 印刷 |
|----------|------------------|------|
| index.html | 書類 SVG | ○ A4縦 |
| label.html | ラベル SVG | ○ A4縦 |
| shift.html | カレンダー SVG | ○ A4横 |
| report.html | 文書 SVG | △（コピー中心・印刷任意） |
| reverse.html | 辞書 SVG | × |
| present.html | ギフト SVG | × |
| warikan.html | 天秤 SVG | △（清算文のみ） |
| sns.html | テキスト SVG | × |

---

## 7. 共通化（実装済み）

| レイヤ | パス | 役割 |
|--------|------|------|
| トークン・印刷・コンポーネント | `assets/sugudasu.css` | `:root` トークン、`sg-card` / `sg-input` / `sg-trust-badge`、`@media print`（請求・ラベル・シフト含む） |
| クローム | `assets/sugudasu-shell.js` | ヘッダー・ナビ・フッター。`#sg-chrome-top` の `data-sg-title` 等で **読込時自動マウント**（詳細: `docs/notes/CHROME_HEADER_GUARDRAILS.md`） |
| **コピー契約** | `assets/sg-copy-feedback.js` | §3.8 C+ — `copyWithFeedback` · 行数チェック · 操作点「コピーしました」· 近接ペイロード |
| **フォーム EFO** | `assets/sg-form-validate.js` | §3.4 — 必須未入力の枠ハイライト · インラインエラー · focus |
| 貼付スキャン | `assets/sg-paste-scan.js` | 文字化け・CRLF（normalize 等） |
| 文字正規化 | `assets/text-normalize.js` | normalize 専用ロジック |
| ツール本体 | `tools/*.html` | **帳票ロジック・規格マスタ・ツール固有 DOM のみ**（`<style>` は原則なし） |

### 各 HTML の最小ヘッド（開発）

```html
<script src="https://cdn.jsdelivr.net/npm/@tailwindcss/browser@4"></script>
<link rel="stylesheet" href="../assets/sugudasu.css">
```

本番 `dist/` では `build-pages.mjs` が browser CDN を除去し、`/assets/tw-build.css`（Tailwind v4 CLI ビルド）と Google Fonts の `preconnect` + `stylesheet` を注入する。

### 各 HTML の末尾

```html
<div id="sg-chrome-top" data-sg-title="SUGUDASU 請求書" data-sg-subtitle="見積 · 納品 · 請求" data-sg-tool-id="invoice" data-sg-print="true"></div>
<!-- main … -->
<div id="sg-chrome-bottom"></div>
<script src="../assets/sugudasu-segment.js"></script>  <!-- モード切替があるツールのみ・shell の直前 -->
<script type="module" src="../assets/sg-copy-feedback.js"></script>  <!-- コピーボタンがあるツール · §3.8 -->
<script src="../assets/sugudasu-shell.js"></script>
```

- シフトのみ `data-sg-landscape="true"` を追加。
- **インライン `SUGUDASU_SHELL.mount` は禁止**（ヘッダー未表示の再発防止 · `CHROME_HEADER_GUARDRAILS.md`）。
- フォント: 開発は `sugudasu.css` 前提（Noto + Montserrat）。本番はビルドが `<head>` に注入（`@import` ブロッキング回避）。

### 本番ビルド（Cloudflare Pages）

```bash
npm install          # tailwindcss + @tailwindcss/cli（devDependencies）
npm run build:pages   # → dist/（/assets/ 絶対パス・index.html = hub・tw-build.css・_headers）
```

開発時は従来どおり `cd tools && python -m http.server`（`../assets/` 相対パス）。

---

## 8. 参照

- 請求書リファレンス実装: [Kaoru-Stats-Lab/invoice-pdf-generator](https://github.com/Kaoru-Stats-Lab/invoice-pdf-generator)  
- プロンプト履歴: `docs/prompts/`  
- ペルソナ（運営者）: `docs/operator-profile.md`  
- モード切替提案（アーカイブ）: [`archive/UI_MODE_SWITCH_DESIGN_PROPOSAL.md`](archive/UI_MODE_SWITCH_DESIGN_PROPOSAL.md)  
- **ツールリード文:** [`notes/TOOL_LEAD_COPY_AGENT_PLAYBOOK.md`](notes/TOOL_LEAD_COPY_AGENT_PLAYBOOK.md) · Experience 契約 [`notes/UIUX_EXPERIENCE_IMPLEMENTATION_CONTRACT.md`](notes/UIUX_EXPERIENCE_IMPLEMENTATION_CONTRACT.md)  
- Hub カード文案: [`notes/TOOL_CARD_WRITING_GUIDELINE.md`](notes/TOOL_CARD_WRITING_GUIDELINE.md)  
- サイト構成: 別紙（統合ドメイン設計）
