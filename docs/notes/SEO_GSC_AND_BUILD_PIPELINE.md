# SEO · GSC · ビルドパイプライン（SSOT）

**更新:** 2026-07-18  
**対象:** `sugudasu.com`（core · Cloudflare Pages）  
**正本コード:** `scripts/build-pages.mjs` · `scripts/verify-ogp.mjs`

---

## 0. 目的

Search Console の警告を「ゼロにする」ことではない。  
**Google 推奨の正規 URL 構成を保ちつつ、新規ツール追加で SEO 手作業が増えない**こと。

---

## 1. GSC 分類 — 触る / 触らない

| 報告例 | 原因 | 対応 |
|--------|------|------|
| `http://sugudasu.com/` · `http://www…` | http→https（CF / ホスト）の **正常な 301** | **触らない**（エラーではない · ゼロ化しない） |
| `https://www.sugudasu.com/` | www→apex（意図） | **コード不要** · apex canonical で補強済み · www→apex は CF |
| `…/index.html` | `/` への clean URL | **触らない** · sitemap は `/` のみ |
| `/{slug}.html`（report · fair-draw 等） | `_redirects` の clean path 301 | **リダイレクトは維持** · `og:url` / canonical は clean path |
| `fair-draw?tab=*` · `fair-draw.html?tab=*` | 同一 HTML · UI 状態クエリ | **canonical = `/fair-draw`**（ビルド注入 · クエリなし） |
| `/data/*.json` | 内部データ · 検索不要 | **robots `Disallow: /data/` + `_headers` `X-Robots-Tag: noindex, nofollow`** |

### 内部リンク（再発防止 · 2026-07-18）

| 事象 | 原因 | 対策 |
|------|------|------|
| トップ／ツールから「どこにも遷移しない」 | 相対 `href="invoice.html"` が `/guides/` 等の配下で `/guides/invoice.html` に解決 → 未知URLが **index（トップ）に落ちる** | **本番リンクはルート絶対のクリーン URL**（`/invoice`）。`build-pages` が `*.html` を置換 · `sugudasu-shell.js` のナビ／フッタも同様 |
| `/guides/slot-board.html` がトップに見える | 枠取りは `/slot-board`（ガイドではない）· 上記フォールバック | 正しい URL は [`/slot-board`](https://sugudasu.com/slot-board) |

**禁止:** hub・ナビ・フッタで本番向けに相対 `*.html` を残すこと（`tools/` 直開き用ソースは可 · dist で必ず書き換え）。

### やらないこと

- URL 構造変更 · SPA 化 · ページ削除で件数を消す
- リダイレクト削除で GSC「ページにリダイレクト」をゼロ化
- `?tab=` の廃止（ディープリンク用途）
- ツール HTML への広範 noindex
- ツールごとに個別 robots ルールを増やす
- sitemap から公開ツール（`report` / `not-a-car` / `webp-to-jpg` 等）を外す

---

## 2. ビルドが面倒を見るもの

新規 `tools/{id}.html` を追加すると、ビルドが自動で:

| 成果物 | 内容 |
|--------|------|
| `sitemap.xml` | clean path のみ（`.html` なし） |
| `_redirects` | `/{id}.html` → `/{id}` 301 |
| `robots.txt` | `Disallow: /data/` |
| `_headers` | `/data/*` に `X-Robots-Tag: noindex, nofollow` |
| 各 HTML | `<link rel="canonical">` + `og:url` を apex clean path に正規化 |

**Agent が手書きしない:** `<link rel="canonical">` · sitemap · robots · `_redirects` の個別追記。

**Agent がソースに書く:** `og:url` = `https://sugudasu.com/{id}`（**`.html` 禁止** · `validate:ogp` が FAIL）。

ビルド末尾で機械検査: `robots.txt` の `Disallow: /data/` · `_headers` の `X-Robots-Tag: noindex`。

---

## 3. `/data/*` 方針

- ブラウザ `fetch('/data/...')` は **利用可能のまま**
- 検索エンジンには載せない（sitemap 未掲載 + Disallow + X-Robots-Tag）
- JSON ファイルが増えても **パス単位**で一括除外（列挙不要）

---

## 4. 検証

```bash
npm run validate:ogp
npm run build:pages
# dist/robots.txt → Disallow: /data/
# dist/_headers → /data/* に X-Robots-Tag
# dist/fair-draw.html → canonical = https://sugudasu.com/fair-draw
```

デプロイ手順は `DEPLOY_CLOUDFLARE_PAGES.md` · `DEPLOY_LOG.md`。

---

## 5. 関連

- 命名 · 新規ツール手順: `TOOL_NAMING_AGENT_PLAYBOOK.md`
- ポータル件数 · SEO チェックリスト: `docs/BACKLOG.md` §8-11
- OGP ゲート: `scripts/verify-ogp.mjs`
