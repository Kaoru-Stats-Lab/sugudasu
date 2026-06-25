# SUGUDASU Workflow

最終更新: 2026-06-25

**提督の残タスク（呼び出し用）:** [`docs/notes/TAISHO_PENDING_TASKS.md`](notes/TAISHO_PENDING_TASKS.md) — Cloudflare プラグイン · Supabase Auth 等

このファイルは「何をする時に、どのコマンドを使うか」の運用正本です。

## 0) 別Agent引き継ぎ（景品チェック＋公平抽選）

**次の実装タスク:** `tools/lottery.html`（未着手）

1. 読む: [`docs/notes/LOTTERY_PRIZE_LAW_TOOL_SPEC.md`](notes/LOTTERY_PRIZE_LAW_TOOL_SPEC.md)（仕様SSOT）
2. 読む: [`docs/notes/PRODUCT_IDEA_JUDGMENT_LEDGER.md`](notes/PRODUCT_IDEA_JUDGMENT_LEDGER.md)（**なぜ lottery か · 他案のGO/HOLD/OUT**）
3. タスク: [`docs/BACKLOG.md`](BACKLOG.md) §15 · §8-9
4. UI: [`docs/DESIGN_GUIDELINE.md`](DESIGN_GUIDELINE.md) · Sync は [`docs/DESIGN_GUIDELINE_SYNC.md`](DESIGN_GUIDELINE_SYNC.md) · [`docs/notes/CHROME_HEADER_GUARDRAILS.md`](notes/CHROME_HEADER_GUARDRAILS.md)
5. 着手順: JSON + テスト → Phase 0 HTML → Phase 1 抽選 → Hub/changelog

## 1) 日常開発

- **ツール画面を手早く確認したい（ビルド不要）**
  - `cd C:\asl_dev\sugudasu\tools`
  - `python -m http.server 8080`
  - 開く: `http://localhost:8080/hub.html`

- **本番相当の出力を確認したい**
  - `cd C:\asl_dev\sugudasu`
  - `npm run preview:pages`
  - 開く: `http://localhost:8080/`

## 2) Cloudflare Free 枠を守る

- **静的上限を検査する（ファイル数/サイズ/_headers/_redirects）**
  - `npm run guard:pages-free`

- **月間ビルド予算の現在値を確認する**
  - `npm run guard:pages-budget:show`

- **月間ビルド予算を超過していないかチェックする**
  - `npm run guard:pages-budget`

- **本番リリース前の必須コマンド（推奨）**
  - `npm run release:pages:free`
  - 実行内容:
    1. `build:pages`（dist 作成 + 静的上限チェック）
    2. `guard:pages-budget`（月次予算チェック）
    3. `consume`（台帳を +1）

## 3) Cloudflare Pages デプロイ

**Agent / 提督 正本:** [`docs/notes/DEPLOY_CLOUDFLARE_PAGES.md`](notes/DEPLOY_CLOUDFLARE_PAGES.md)（手順 · CF 公式 URL · トラブル表 · チェックリスト D1–D8）

- **Cloudflare Pages ダッシュボード設定**
  - Build command: `npm run build:pages`
  - Output directory: `dist`
  - Framework preset: `None`
  - `NODE_VERSION=20`
  - 公式: [Build configuration](https://developers.cloudflare.com/pages/configuration/build-configuration/) · [Limits](https://developers.cloudflare.com/pages/platform/limits/)

- **カスタムドメイン `sugudasu.com`**
  - 手順: [`docs/notes/CUSTOM_DOMAIN_SUGUDASU_COM.md`](notes/CUSTOM_DOMAIN_SUGUDASU_COM.md)

- **重要**
  - push 前: `npm run release:pages:free`
  - 反映: `git push origin main` → CF 自動ビルド
  - 台帳: `.ops/cloudflare-pages-build-budget.json`（Git 管理外）

## 4) GitHub 運用（推奨ベスト）

現状、`invoice-pdf-generator` リポジトリは「請求書機能の正本」としては有効ですが、
SUGUDASU 全体（8ツール + 法務 + 共通アセット）の運用母艦としては分離した方が管理しやすいです。

### 推奨構成

- **`sugudasu` 専用リポジトリ**を新規作成し、ここを運用正本にする
- `invoice-pdf-generator` は「参照元 / 部分流用元」として維持する

### 初期化コマンド（sugudasu を Git 管理化）

```powershell
cd C:\asl_dev\sugudasu
git init
git add .
git commit -m "chore: bootstrap sugudasu project"
git branch -M main
git remote add origin <YOUR_SUGUDASU_REPO_URL>
git push -u origin main
```

## 5) 変更作業の最短ループ

1. `tools/` で画面確認（必要なら）
2. 実装
3. `npm run build:pages`
4. `npm run release:pages:free`（リリース前）
5. Cloudflare Pages に反映

## 6) トラブル時

- **デプロイ / 本番不具合**
  - まず [`docs/notes/DEPLOY_CLOUDFLARE_PAGES.md`](notes/DEPLOY_CLOUDFLARE_PAGES.md) §6 トラブル表
  - Cloudflare [Deployments](https://dash.cloudflare.com/) の build log **末尾のみ**

- **build が失敗**
  - まず `npm run build:pages` の出力を確認
  - 次に `npm run guard:pages-free` で上限超過箇所を特定

- **無料枠予算で止まる**
  - `npm run guard:pages-budget:show`
  - 月次台帳 `.ops/cloudflare-pages-build-budget.json` を確認
  - 必要なら `PAGES_MONTHLY_BUILD_BUDGET` を調整（ただし 500 を超えない）
