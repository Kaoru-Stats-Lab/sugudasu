# SUGUDASU Sync — Cloudflare インフラ正本

**更新:** 2026-06-23（インフラ完了報告 · 運用マニュアル追記）  
**Sync URL:** [https://sync.sugudasu.com/](https://sync.sugudasu.com/)（SSL: Enabled / Active）  
**コア URL:** [https://sugudasu.com/](https://sugudasu.com/)（影響なし）

> **Agent / 別セッション:** 製品仕様は [`SUGUDASU_SYNC_LINE.md`](SUGUDASU_SYNC_LINE.md) · コアデプロイは [`DEPLOY_CLOUDFLARE_PAGES.md`](DEPLOY_CLOUDFLARE_PAGES.md) · Backlog **§5-4**

---

## 1. 構成（1 リポ · 2 Pages プロジェクト）

| 項目 | コア `sugudasu` | Sync `sugudasu-sync` |
|------|-----------------|----------------------|
| **本番 URL** | `sugudasu.com` | `sync.sugudasu.com` |
| **Repository** | `Kaoru-Stats-Lab/sugudasu` (Private) | 同一 |
| **Production branch** | `main` | `main` |
| **Framework preset** | None | None |
| **自動 git デプロイ** | **ON**（通常） | **OFF**（2026-06-23 設定済 · ビルド枠節約） |
| **ads.txt** | あり | なし |

DNS は **Cloudflare のみ**（お名前.com の NS 移譲済み · 追加操作不要）。  
カスタムドメインは **Pages 側から追加** → CNAME（プロキシ ON）が自動生成。

---

## 2. ダッシュボード確定値（2026-06-23 提督報告）

`sugudasu-sync` プロジェクトで **完了・Active** となった設定:

| 設定項目 | 確定値 |
|----------|--------|
| **Project name** | `sugudasu-sync` |
| **Repository** | `Kaoru-Stats-Lab/sugudasu` (Private) |
| **Production branch** | `main` |
| **Framework preset** | `None` |
| **Build command** | `npm run build:pages` |
| **Build output directory** | `dist` |
| **Custom domain** | `sync.sugudasu.com`（SSL: Enabled / Active） |
| **Automatic git deploys** | **Disabled** |

環境変数（両プロジェクト共通推奨）: `NODE_VERSION` = `20`

### 2-1. コード正本との整合（必須 · プレースホルダー反映前）

リポジトリ側は **コアと Sync でビルド成果物を分離** している（`dist/` と `dist-sync/`）。  
上記ダッシュボードの `build:pages` + `dist` のまま手動デプロイすると、**コア全ツールが Sync ドメインに載る**ため、次のいずれかで **必ず揃える**:

| 方式 | Build command | Output directory | 備考 |
|------|---------------|------------------|------|
| **A（推奨）** | `npm run build:pages:sync` | `dist-sync` | コード正本と一致 |
| **B（Wrangler のみ）** | ダッシュボードは据え置き可 | — | ローカル `build:pages:sync` → `wrangler pages deploy dist-sync`（§4-1） |

**提督アクション:** プレースホルダーを Sync 本番に載せる前に、ダッシュボードを **方式 A** に更新するか、初回のみ **方式 B** で `dist-sync` を直デプロイする。

---

## 3. ビルド分岐（コード SSOT）

| コマンド | 出力 | 対象 HTML |
|----------|------|-----------|
| `npm run build:pages` | `dist/` | コア全ツール（`sync-*` 除外） |
| `npm run build:pages:sync` | `dist-sync/` | `tools/sync-*.html` のみ |

内部引数: `--target=sync` または `SUGUDASU_PAGES_TARGET=sync`

マッピング:

- `tools/sync-index.html` → `dist-sync/index.html`（`/`）
- `tools/sync-timeline.html` → `dist-sync/timeline.html` · `dist-sync/timeline/index.html`
- `SITE_ORIGIN` = `https://sync.sugudasu.com`
- `_redirects` / `sitemap.xml` は Sync 最小構成（コア `hub` リダイレクト等なし）

ローカル検証:

```powershell
cd C:\asl_dev\sugudasu
npm run build:pages:sync
npm run preview:pages:sync   # http://localhost:8081/
```

---

## 4. デプロイ運用マニュアル（S1 プレースホルダー期）

**背景:** 同一リポの `main` push でコア（`sugudasu`）と Sync（`sugudasu-sync`）が **同時にビルド** されると、Free 枠 **500 回/月** が倍速消費する。  
そのため Sync 側の **Automatic git deploys は意図的に OFF**。コアは従来どおり push → 自動デプロイ。

### 4-1. 方式 A — Wrangler CLI 手動デプロイ（推奨 · 自動デプロイ OFF のまま）

**前提:** `CLOUDFLARE_API_TOKEN`（Pages Edit 権限）· 提督端末に [Wrangler](https://developers.cloudflare.com/workers/wrangler/) ログイン済み。

```powershell
cd C:\asl_dev\sugudasu

# Sync 専用ビルド（dist-sync/）
npm run build:pages:sync

# 本番反映（プロジェクト名はダッシュボードと一致）
npx wrangler pages deploy dist-sync --project-name=sugudasu-sync --branch=main
```

確認:

- [https://sync.sugudasu.com/](https://sync.sugudasu.com/) — Sync LP プレースホルダー
- [https://sync.sugudasu.com/timeline](https://sync.sugudasu.com/timeline) — 進行 Sync プレースホルダー
- [https://sugudasu.com/](https://sugudasu.com/) — 従来どおり（影響なし）

**Agent 制約:** トークン未設定時は Wrangler を実行しない · 手順提示のみ（`.cursor/rules/sugudasu-deploy.mdc`）。

### 4-2. 方式 B — 一時的に Automatic deploys を ON

Sync 用コードを push した **直後だけ** 自動ビルドさせたい場合:

1. Cloudflare → `sugudasu-sync` → **設定** → **ビルド＆デプロイ**
2. **Build command** = `npm run build:pages:sync` · **Output** = `dist-sync` に修正（§2-1）
3. **Automatic git deploys** を **有効**
4. `main` に push（または **Deployments** → **Retry deployment**）
5. Production が **Success** になったら **Automatic git deploys を再び無効**

> 忘れず OFF に戻すこと。ON のままだとコアと同様に毎 push で Sync もビルドされる。

### 4-3. コアのみ更新するとき

- `sugudasu` プロジェクト: 従来どおり `git push origin main` のみ
- `sugudasu-sync`: 自動 OFF のため **何も起きない**（意図どおり）

---

## 5. 将来 — Build watch paths（自動デプロイ再開時）

Sync の自動デプロイを **再有効化** する段階で、**Sync 関連パスの変更時のみ** `sugudasu-sync` をビルドさせる。

### 5-1. `sugudasu-sync` に設定する Include paths（案）

Cloudflare → `sugudasu-sync` → **設定** → **ビルド＆デプロイ** → **Build watch paths**（Include）:

```text
tools/sync-*
assets/**
scripts/build-pages.mjs
scripts/verify-chrome-mount.mjs
scripts/verify-pages-free-plan.mjs
package.json
package-lock.json
data/changelog.json
```

**意図:** コア専用 HTML（`tools/timeline.html` 等）の変更では Sync ビルドを走らせない。

### 5-2. コア `sugudasu` 側（対称案 · 任意）

Include から Sync 専用を外す、または Exclude:

```text
tools/sync-*
```

（Cloudflare UI の Exclude 対応状況に応じて調整。Include のみの場合はコア用に `tools/*` から `sync-*` を除くパターン設計が必要。）

### 5-3. 導入タイミング

| フェーズ | 運用 |
|----------|------|
| **S1 プレースホルダー** | 自動 OFF + Wrangler 手動（§4-1） |
| **S1 本実装〜** | watch paths 設定後、Sync 自動 ON を検討 |
| **S2 以降** | Functions 追加時は `functions/**` を Include に追加 |

---

## 6. 成功時の確認チェックリスト

| # | URL / 画面 | 期待 |
|---|------------|------|
| 1 | Pages · `sync.sugudasu.com` | **アクティブ**（緑チェック） |
| 2 | DNS · `sync` CNAME | `sugudasu-sync.pages.dev` · プロキシ ON |
| 3 | `https://sync.sugudasu.com/` | 200 · Sync LP |
| 4 | `https://sync.sugudasu.com/timeline` | 200 · 進行プレースホルダー |
| 5 | SSL 鍵マーク | 警告なし |
| 6 | `https://sugudasu.com/` | コア hub · 影響ゼロ |
| 7 | `https://www.sugudasu.com/` | apex リダイレクト維持 |

---

## 7. トラブルシューティング

| 現象 | 対策 |
|------|------|
| **522** | `sugudasu-sync` でデプロイ Success か確認 · 初回は Wrangler 手動 |
| **SSL 保留** | 15 分待つ · カスタムドメイン削除→再追加 |
| **Sync にコア 16 本ナビが出る** | `dist` を誤デプロイ — §2-1 · `build:pages:sync` + `dist-sync` |
| **コアが Sync にリダイレクト** | `_redirects` 混同 — 出力ディレクトリを確認 |

---

## 8. 将来拡張

- **Pages Functions** … `sync.sugudasu.com/api/*`（Supabase 中継）
- **Cookie** … `Domain=sync.sugudasu.com` に限定しコアとログイン分離

---

## 9. 変更履歴

| 日付 | 内容 |
|------|------|
| 2026-06-23 | インフラ完了報告 · ダッシュボード確定値 · 運用マニュアル · watch paths 案 |
| 2026-06-23 | 初版 · `build:pages:sync` · `dist-sync` コード分岐 |
