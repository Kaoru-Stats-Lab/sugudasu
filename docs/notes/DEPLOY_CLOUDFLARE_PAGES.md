# SUGUDASU 本番デプロイ手順（Cloudflare Pages · Agent SSOT）

**更新:** 2026-06-22  
**リポジトリ:** `C:\asl_dev\sugudasu` · GitHub [`Kaoru-Stats-Lab/sugudasu`](https://github.com/Kaoru-Stats-Lab/sugudasu)  
**本番 URL:** [https://sugudasu.com/](https://sugudasu.com/)  
**暫定 URL:** [https://sugudasu.pages.dev/](https://sugudasu.pages.dev/)

> **asl-dashboard（Vercel）とは別物。** SUGUDASU を Vercel に載せない · ASL の `deploy:vercel` 手順を流用しない。

---

## 1. デプロイの仕組み（前提）

| 項目 | 内容 |
|------|------|
| **ホスティング** | [Cloudflare Pages](https://developers.cloudflare.com/pages/)（**Free プラン**） |
| **トリガー** | `main` への **git push** → Cloudflare がリモートで `npm run build:pages` を実行 → `dist/` を配信 |
| **正本ソース** | `tools/*.html` · `assets/` · `data/*.json`（**`dist/` は Git に含めない**） |
| **ビルド出力** | `dist/`（ローカル生成物 · `.gitignore` 対象） |
| **DNS** | `sugudasu.com` → Cloudflare（手順: [`CUSTOM_DOMAIN_SUGUDASU_COM.md`](CUSTOM_DOMAIN_SUGUDASU_COM.md)） |

### Cloudflare Pages プロジェクト設定（ダッシュボード正本）

[Pages プロジェクト](https://dash.cloudflare.com/) → **Workers & Pages** → `sugudasu`（名称は環境により `sugudasu` / `invoice-pdf-generator` 等 — **Build ログのリポジトリ名で確認**）

| 設定項目 | 値 | 公式 |
|----------|-----|------|
| **Production branch** | `main` | [Build configuration](https://developers.cloudflare.com/pages/configuration/build-configuration/) |
| **Build command** | `npm run build:pages` | 同上 |
| **Build output directory** | `dist` | 同上 |
| **Framework preset** | **None** | 静的サイト |
| **Environment variable** | `NODE_VERSION` = `20` | [Build image](https://developers.cloudflare.com/pages/configuration/build-image/) |

### Free プラン上限（公式 · 超えたら build 失敗 or 課金）

| 制限 | 値 | 根拠 |
|------|-----|------|
| **ビルド回数** | 500 / 月 | [Pages limits](https://developers.cloudflare.com/pages/platform/limits/) |
| **配信ファイル数** | 20,000 / デプロイ | 同上 · ローカル `verify-pages-free-plan.mjs` |
| **単体ファイル** | 25 MiB | 同上 |
| **`_headers` ルール** | 100 | [Headers](https://developers.cloudflare.com/pages/configuration/headers/) |
| **`_redirects` static** | 2,000 | [Redirects](https://developers.cloudflare.com/pages/configuration/redirects/) |
| **`_redirects` dynamic** | 100 | 同上 |

ローカルでは **ソフト上限 450 回/月**（`.ops/cloudflare-pages-build-budget.json` · 提督端末のみ）で早めに止める。

---

## 2. Agent 必須チェックリスト（デプロイ前）

**すべて YES でなければ push しない。**

| # | 確認 | コマンド / 根拠 |
|---|------|-----------------|
| D1 | 作業ディレクトリが **`sugudasu`**（`asl-dashboard` ではない） | `cd C:\asl_dev\sugudasu` |
| D2 | 新規 HTML に **OGP 必須タグ**がある | `npm run validate:ogp` |
| D3 | 命名 3 層が registry と一致 | `npm run validate:tool-naming` |
| D4 | **本番相当ビルド成功** | `npm run build:pages` → exit 0 |
| D5 | **月次ビルド予算 OK**（提督端末） | `npm run release:pages:free` |
| D6 | `data/changelog.json` にユーザー向け変更を追記（該当時） | 手動 |
| D7 | **コミット → push**（Agent は提督依頼時のみ commit） | `git push origin main` |
| D8 | Cloudflare ダッシュボードで **Production deploy Success** | 下記 §5 |

### `npm run build:pages` の内部順（失敗時の切り分け用）

```
verify-tool-naming.mjs
  → verify-ogp.mjs
  → build-pages.mjs（dist 生成 · sitemap · _redirects · Tailwind コンパイル）
  → verify-pages-free-plan.mjs
  → verify-chrome-mount.mjs（dist 上の sg-chrome 検証）
```

| ログプレフィックス | 意味 | SSOT |
|--------------------|------|------|
| `[tool-naming-guard]` | registry / HTML / shell / hub 不整合 | `TOOL_NAMING_AGENT_PLAYBOOK.md` |
| `[ogp-guard]` | OGP 欠落 · `og-card.png` なし | `scripts/verify-ogp.mjs` |
| `[cf-pages-free-guard]` | dist が Free 静的上限超過 | `scripts/verify-pages-free-plan.mjs` |
| `[chrome-mount-guard]` | ヘッダー未表示 · defer 付与 | `CHROME_HEADER_GUARDRAILS.md` |

---

## 3. 提督 / Agent 実行手順（コピペ可）

### 3-A. ローカル検証（push 前 · 必須）

```powershell
cd C:\asl_dev\sugudasu

# 個別（デバッグ用）
npm run validate:tool-naming
npm run validate:ogp
npm run build:pages

# 本番リリースゲート（推奨 · ビルド + 月次台帳 +1）
npm run release:pages:free

# 目視確認（dist 配信）
npm run preview:pages
# → http://localhost:8080/ · /updates · 変更したツール
```

### 3-B. GitHub へ反映（= 本番デプロイ開始）

```powershell
cd C:\asl_dev\sugudasu
git status -sb
git add <対象ファイル>
git commit -m "feat: ..."
git push -u origin main
```

push 後、Cloudflare が **自動で 1 回ビルド**する（ローカルの `release:pages:free` の consume に加え、**リモートでも 1 回カウント**される）。

### 3-C. Agent がやらないこと

| 禁止 | 理由 |
|------|------|
| `npx wrangler pages deploy`（トークンなし） | `CLOUDFLARE_API_TOKEN` 未設定で失敗 · 正本は **Git 連携** |
| `dist/` を手編集して本番に直置き | 次の `build:pages` で上書き · Git 正本は `tools/` |
| `tools/` だけ `python -m http.server` の結果を「本番 OK」と判断 | Tailwind CDN · パス正規化 · shell 検証が未通過 |
| 同一日に **push 連打**（build 失敗後の再 push 含む） | Free 500 回/月 · 提督判断 |

---

## 4. デプロイ後確認（5 分）

| # | 確認 | URL |
|---|------|-----|
| V1 | ポータル | [https://sugudasu.com/](https://sugudasu.com/) |
| V2 | 変更ツール | 例 [https://sugudasu.com/updates](https://sugudasu.com/updates) |
| V3 | 共通ヘッダー（白地 · ナビ） | 任意ツールページ上部 |
| V4 | OGP（note / X カード） | [https://sugudasu.com/statements](https://sugudasu.com/statements) · `/updates` |
| V5 | CF ビルド Success | [Cloudflare Dashboard → Deployments](https://dash.cloudflare.com/) |

**キャッシュ:** 反映に 1〜3 分。古い CSS なら Hard Reload · `build-pages` の `?v=` バスターを確認。

---

## 5. Cloudflare ダッシュボードでの Deploy 確認

1. [Cloudflare Dashboard](https://dash.cloudflare.com/) → **Workers & Pages**
2. プロジェクト `sugudasu` → **Deployments**
3. **Production** 行が **Success**（緑）か確認
4. 失敗時 → **View build log** の **末尾 30 行**だけ読む（全件ダンプ禁止）

よくあるログ:

- `npm run build:pages` 内の `[ogp-guard] FAIL` → OGP 未設定 HTML あり
- `Command failed` + Node バージョン → `NODE_VERSION=20` を Dashboard に設定
- `Fatal error` + メモリ → 通常 SUGUDASU では稀（静的サイト）

---

## 6. トラブルシューティング早見表

| 症状 | 第一容疑 | 手がかり（ファイル / コマンド） |
|------|----------|--------------------------------|
| **本番だけヘッダー真っ白** | shell.js の defer · 手動 dist コピー | `CHROME_HEADER_GUARDRAILS.md` · `[chrome-mount-guard]` |
| **note / SNS でリンクカードが灰色** | `og:image` 未設定 | `npm run validate:ogp` · `tools/updates.html` 等 |
| **`build:pages` が OGP で FAIL** | 新規 HTML に meta 不足 | `scripts/verify-ogp.mjs` · `assets/og-card.png` 存在確認 |
| **`[cf-pages-free-guard] FAIL`** | dist が大きすぎ | 巨大 JSON を `public/data` 相当に入れていないか · `guard:pages-free` |
| **`[pages-build-budget] FAIL`** | 月 450 回超過 | `npm run guard:pages-budget:show` · `.ops/cloudflare-pages-build-budget.json` |
| **push したのに本番変わらない** | CF build 失敗 · 別ブランチ | Dashboard Deployments · `main` か確認 |
| **localhost:8080 (tools/) と本番で見た目が違う** | 未ビルド | `npm run preview:pages`（**dist** を配信） |
| **404 on /invoice 等** | `_redirects` / ファイル名 | `scripts/build-pages.mjs` · `dist/_redirects` |
| **Tailwind が効かない** | browser CDN のまま dist 未生成 | `build:pages` が `tw-build.css` を注入しているか |

### ログ grep 用キーワード

```
[tool-naming-guard] FAIL
[ogp-guard] FAIL
[cf-pages-free-guard] FAIL
[chrome-mount-guard] FAIL
[pages-build-budget] FAIL
build:pages OK
```

---

## 7. 関連 SSOT · 公式リンク

| 用途 | パス / URL |
|------|------------|
| **本ファイル（Agent デプロイ正本）** | `docs/notes/DEPLOY_CLOUDFLARE_PAGES.md` |
| 運用コマンド早見 | `docs/WORKFLOW.md` |
| カスタムドメイン | `docs/notes/CUSTOM_DOMAIN_SUGUDASU_COM.md` |
| ヘッダー再発防止 | `docs/notes/CHROME_HEADER_GUARDRAILS.md` |
| ツール命名 | `docs/notes/TOOL_NAMING_AGENT_PLAYBOOK.md` |
| デザイン | `docs/DESIGN_GUIDELINE.md` |
| 変更履歴（ユーザー向け） | `data/changelog.json` → `/updates` |
| Cloudflare Pages 概要 | https://developers.cloudflare.com/pages/ |
| ビルド設定 | https://developers.cloudflare.com/pages/configuration/build-configuration/ |
| プラン上限 | https://developers.cloudflare.com/pages/platform/limits/ |
| `_headers` | https://developers.cloudflare.com/pages/configuration/headers/ |
| `_redirects` | https://developers.cloudflare.com/pages/configuration/redirects/ |
| GitHub リポ | https://github.com/Kaoru-Stats-Lab/sugudasu |

---

## 8. 変更履歴

| 日付 | 内容 |
|------|------|
| 2026-06-22 | 初版（Agent 必須チェックリスト · CF 公式 URL · トラブル表） |
