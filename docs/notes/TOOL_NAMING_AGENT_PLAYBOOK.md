# ツール命名 — Agent 実行手順（Playbook）

**更新:** 2026-07-18  
**リポジトリ:** `C:\asl_dev\sugudasu`（asl-dashboard ではない）  
**読者:** Cursor / Claude 等の別 Agent  
**規範:** `docs/DESIGN_GUIDELINE.md` §1.3（思想） · **本ファイル（手順）** · `data/tool-registry.json`（値の SSOT）

**新規ツールを本番に出すとき:** §1（手順A）のあと **必ず §1.5 MECE チェックリスト** を埋める。毎回ゼロから洗い直さない。

---

## 0. 3層を混同しない

| 層 | JSON キー / コード | 例 | ユーザーが見る場所 |
|----|-------------------|-----|-------------------|
| **id** | レジストリキー · `data-sg-tool-id` · `{id}.html` | `invoice` | 開発者のみ（URL パスは `/invoice`） |
| **概念名** | `conceptName` · ナビは `navLabel` | 請求書 | ダークナビ · 帳票タブ · 本文 |
| **プロダクト名** | `productName` | SUGUDASU 請求書 | 白ヘッダー · Product ページ |
| **Hub カード名** | `conceptName` | 請求書 | hub カード `<h3>`（SUGUDASU 接頭辞なし） |

**鉄則**

- `data-sg-title` = **`productName` と完全一致**（subtitle は機能補足）
- ナビ = **`navLabel`**（`SUGUDASU` 接頭辞 **禁止** — 左ロゴで既出）
- 帳票 UI = **`conceptName`**（「見積書」「請求書」タブ — プロダクト名を繰り返さない）
- slug / ファイル名 = **ASCII id のみ**（`請求書.html` 禁止）

---

## 1. 手順 A — 新規ツール追加（順番固定）

**この順を飛ばさない。** 検証は Step 7 で落ちる。

### Step 1 — `data/tool-registry.json`

`tools` にキー `{id}` を追加（キー = id = 将来のファイル名）。

```json
"my-tool": {
  "file": "my-tool.html",
  "conceptName": "概念の短い日本語",
  "productName": "SUGUDASU ○○",
  "navLabel": "ナビ用4〜8字",
  "navIcon": "📄",
  "inNav": true,
  "navOrder": 15,
  "name": "開発バッジ用の長い名前",
  "version": "0.1.0",
  "stage": "alpha",
  "statusNote": "Backlog 根拠1行"
}
```

| フィールド | 必須 | メモ |
|-----------|------|------|
| `conceptName` | ○ | 本文・説明で使う |
| `productName` | ○ | ツールなら `SUGUDASU ` で始める（法務ページ除く） |
| `navLabel` | △ | `inNav: true` なら必須 |
| `navIcon` / `navOrder` | △ | ナビ掲載時 |
| `inNav` | ○ | 通常ツール `true` · 法務/内部 `false` |

### Step 2 — `tools/{id}.html`

```html
<div id="sg-chrome-top"
     data-sg-title="SUGUDASU ○○"
     data-sg-subtitle="機能補足 · 任意"
     data-sg-tool-id="{id}"
     data-sg-print="true"></div>
```

- `data-sg-title` は registry の **`productName` をコピペ**（手打ち禁止）
- `data-sg-tool-id` = registry キーと **同一**
- 末尾: `sugudasu-shell.js` **同期読込**（`defer` 禁止 · `CHROME_HEADER_GUARDRAILS.md`）
- `<title>` = **検索意図の日本語** + `| SUGUDASU`（productName の機械連結はしない）
- **`og:url`** = `https://sugudasu.com/{id}`（**`.html` 禁止** · `npm run validate:ogp` が FAIL）
- **`<link rel="canonical">` は手書きしない** — `build-pages.mjs` が注入（`docs/notes/SEO_GSC_AND_BUILD_PIPELINE.md`）
- sitemap / robots / `_redirects` も **触らない**（ビルドが生成）
- **FAQ** は `</main>` の外に `.sg-faq-section` > `.sg-faq-inner`（`DESIGN_GUIDELINE` §2.5 · 背景フルブリード）

### Step 3 — `assets/{id}.js`（ロジックがある場合）

HTML と **同名 id**。registry キー · ファイル名 · `data-sg-tool-id` を揃える。

### Step 4 — `tools/hub.html`

カード 1 枚追加:

```html
<a href="{id}.html" class="sg-card block p-5 …">
  <h3 class="font-bold text-slate-900">{conceptName}</h3>
  <p class="text-xs text-slate-500 mt-2">{機能説明 · hub-cards.json}</p>
</a>
```

- `<h3>` = **`conceptName`**（Hub。productName は Product ヘッダー専用）
- 実運用は `data/hub-cards.json` + `npm run validate:hub-ia` で生成（手メンテ禁止）
- hub title / OG に **ツール件数（N選）を書かない**（`BACKLOG.md` §8-11）

### Step 5 — `assets/sugudasu-shell.js` の `TOOLS`

`inNav: true` のツールを **`navOrder` 順**で配列に 1 行追加:

```javascript
{ id: 'my-tool', file: 'my-tool.html', label: 'ナビ用', icon: '📄' },
```

- `label` = registry の **`navLabel` と完全一致**
- コメント: `registry navLabel と同期（validate:tool-naming で検証）`
- 読込後は registry からナビを上書きするが、**初回描画フォールバック**のため必須

### Step 6 — `data/changelog.json` · `data/statements-product.json` · README

1. **`data/changelog.json`** — 先頭に public（＋必要なら internal rollup）エントリ。`tools` に id。
2. **`data/statements-product.json`** — `inNav: true` なら **必須**（`validate:statements-product` が registry と突合）。`categoryId` は既存カテゴリのみ。
3. **`README.md` ツール表** — `npm run sync:readme-tools`（手書き禁止）。

### Step 7 — 検証（必須）

```bash
cd C:\asl_dev\sugudasu
npm run validate:tool-naming
npm run validate:ogp
npm run validate:statements-product
npm run build:pages
```

すべて **exit 0** まで直す。本番反映は `docs/notes/DEPLOY_LOG.md` + `npm run release:pages:free` → `git push origin main`（`DEPLOY_CLOUDFLARE_PAGES.md`）。

---

## 1.5 新規ツール公開 — MECE チェックリスト（Agent 必読 · 再発明禁止）

**目的:** 毎回「何を触るべきか」を考えない。下表を **上から順に YES/NA** するだけで完了判定する。  
**正本:** 本節。命名手順は §1 · デプロイ手順は `DEPLOY_LOG.md` / `DEPLOY_CLOUDFLARE_PAGES.md`。

### A. 必須（欠けたら公開禁止）

| # | 箇所 | 確認内容 | 機械ゲート |
|---|------|----------|------------|
| A1 | `data/tool-registry.json` | id · file · conceptName · productName · navLabel · inNav · navOrder · stage | `validate:tool-naming` |
| A2 | `tools/{id}.html` | `data-sg-tool-id` = id · `data-sg-title` = productName · `og:url` = `https://sugudasu.com/{id}`（`.html` なし）· FAQ は main 外 | naming · ogp |
| A3 | `assets/{id}-*.js` / 専用 CSS | ロジックがあるなら同 id プレフィックス。**既存 `sugudasu.css` 構造を壊さない**（専用 CSS 追加は可） | （目視 · build） |
| A4 | `tools/hub.html` + `data/hub-cards.json` | カード · `<h3>` = **conceptName** | naming · hub-ia |
| A5 | `assets/sugudasu-shell.js` `TOOLS[]` | id · file · label=navLabel · icon · **navOrder 順** | naming |
| A6 | `data/statements-product.json` · `categories.json` | inNav 1行 · productName 一致 · categoryId | statements · hub-ia |
| A7 | `data/changelog.json` | public エントリ · `tools: ["{id}"]` | `verify-changelog`（build 内） |
| A8 | `README.md` | ツール表が registry と一致 | `sync:readme-tools --check` |
| A9 | `package.json` | 単体テストがあるなら `test:{id}`（任意だが追加したら `test:all` にも） | （任意） |
| A10 | 仕様 SSOT | **`docs/notes/` 配下**（例: `SLOT_BOARD_SPEC.md`）。リポジトリ直下のメモは正本にしない | （目視） |

### B. 本番反映（必須 · core）

| # | 箇所 | 確認内容 |
|---|------|----------|
| B1 | `docs/notes/DEPLOY_LOG.md` | `target=core` · `status=approved` · 同一日2回目以降は **P7 override** 明示 |
| B2 | `npm run release:pages:free` | exit 0（gate + build + budget） |
| B3 | `git push origin main` | CF Pages 自動ビルド |
| B4 | smoke | `https://sugudasu.com/` にカード · `https://sugudasu.com/{id}` が 200 · hub HTML に `{id}.html` |

### C. 対象外（触らない · 「足りない」と勘違いしない）

| 項目 | 理由 |
|------|------|
| `data/roadmap.json` に「完了」行を追加 | shipped は **JSON から削除**が正（`DEV_TRANSPARENCY_RULES.md`） |
| `sitemap` / `robots` / `_redirects` / canonical 手書き | `build:pages` が生成 |
| guides / LP / `lp-marketing-matrix` | マーケ別タスク。ツールα公開の必須ではない |
| 他ツールからの相互リンク | 仕様に書いてあるときだけ |
| Sync / Supabase / `deploy:pages:sync` | core と別経路 |
| 無関係ファイルの整形 · 共通化 · リファクタ | 禁止 |

### D. Agent 完了報告（コピペ）

```text
MECE 新規ツール公開: {id}
A1–A10: OK / NA（欠番があれば列挙）
B1–B4: OK · smoke: / と /{id}
C: 触っていない（roadmap追加なし · guidesなし）
validate:tool-naming · statements · ogp · build:pages: exit 0
```

---

## 2. 手順 B — 既存ツールの改名・表記修正

1. **`data/tool-registry.json`** の `conceptName` / `productName` / `navLabel` を先に直す
2. **`tools/{id}.html`** の `data-sg-title`（= productName）· 必要なら `data-sg-subtitle`
3. **`data/hub-cards.json`** を更新し `npm run validate:hub-ia`（カード再生成）
4. **`assets/sugudasu-shell.js`** の `TOOLS[].label`（= navLabel）
5. ユーザー向け比較表は **`data/statements-product.json`** を更新（`npm run validate:statements-product`）。手書きで `statements.html` の表だけ直さない。
6. **`npm run validate:tool-naming`** → **`npm run build:pages`**
7. **`data/changelog.json`** 1 行

**id（ファイル名）の変更**は URL 破壊 → `_redirects` · 旧ファイル削除 · 全リンク grep が別タスク（本 Playbook の範囲外）。

---

## 3. 手順 C — 検証コマンド

```bash
npm run validate:tool-naming
```

| チェック | 内容 |
|---------|------|
| registry 完全性 | 全ツールに `conceptName` · `productName` |
| HTML ヘッダー | `data-sg-tool-id` があるページで `data-sg-title` === `productName` |
| shell ナビ | `TOOLS[].label` === registry `navLabel`（`inNav` のみ） |
| hub カード | ナビ掲載ツールの `<h3>` に **`conceptName`** が含まれる（productName は Hub に出さない） |

失敗時は `[tool-naming-guard] FAIL:` のファイル名と期待値を読んで **registry 起点**で直す。

---

## 4. サイトページ（ツール以外）

| id | productName | data-sg-tool-id |
|----|-------------|-----------------|
| hub | ツール一覧 | `hub` |
| updates | 更新履歴 | `updates` |
| statements | SUGUDASU の約束 | `statements` |
| privacy / terms / disclaimer | 各ページ名（接頭辞なし） | 任意 |
| not-a-car | 車ではなく書類 | なし可 |

法務ページに `SUGUDASU 利用規約` のような接頭辞は **付けない**。

---

## 5. 禁止 · よくあるミス

| NG | OK |
|----|-----|
| ヘッダー `見積・納品・請求書` のみ | `SUGUDASU 請求書` + subtitle `見積 · 納品 · 請求` |
| ナビ `SUGUDASU請求書` | ナビ `請求書` |
| hub / statements に `invoice` · `group-split` | `SUGUDASU 請求書` · `SUGUDASU 班分け` |
| registry なしで HTML だけ直す | **必ず registry 先** |
| `TOOLS` だけ直して registry 放置 | 両方 + validate |

---

## 6. 参照リンク

| ドキュメント | 用途 |
|-------------|------|
| `docs/notes/TOOL_NAMING_AGENT_PLAYBOOK.md` §1.5 | **新規ツール公開 MECE**（再発明禁止） |
| `docs/DESIGN_GUIDELINE.md` §1.3 | 命名思想 · 全ツール対応表 |
| `docs/notes/CHROME_HEADER_GUARDRAILS.md` | `data-sg-title` · shell 読込 |
| `docs/BACKLOG.md` §8-11-4 | 新規ツール追加チェックリスト（SEO · hub） |
| `data/tool-registry.json` | 値の SSOT |
| `scripts/verify-tool-naming.mjs` | 検証実装 |

---

## 7. Agent 完了報告テンプレ

```text
命名: registry 更新 → HTML/shell/hub 反映 → validate:tool-naming OK → build:pages OK
変更 id: invoice, …
触った従量: なし（静的のみ）
```

**新規公開時は §1.5 D を優先**（MECE A/B/C）。
