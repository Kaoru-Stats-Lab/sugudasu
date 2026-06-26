# 提督残タスク — 呼び出し用 SSOT

**更新:** 2026-06-26  
**用途:** 提督が「次何する？」と聞いたとき · Agent が **最初に開く** チェックリスト。  
**対象リポ:** `C:\asl_dev\sugudasu`（**asl-dashboard には Cloudflare MCP 入れない**）

---

## すぐ出す — 提督の次の一手

### A. Cursor + Cloudflare（一度だけ · sugudasu ワークスペース）

| # | 手順 | 自律 |
|---|------|------|
| A1 | チャットで `/add-plugin cloudflare` または [Cursor Marketplace — Cloudflare](https://cursor.com/marketplace/cloudflare) | **提督のみ** |
| A2 | **Settings → MCP** → `cloudflare-api` · `cloudflare-docs` · `cloudflare-builds` が緑（初回 OAuth） | **提督のみ** |
| A3 | 赤いままなら **Developer: Reload Window** | **提督のみ** |

詳細: [`CURSOR_CLOUDFLARE_AGENT_SETUP.md`](CURSOR_CLOUDFLARE_AGENT_SETUP.md)

**済み（Agent）:** `sugudasu/.cursor/mcp.json` に Cloudflare MCP 3 本登録済み。

---

### B. Sync S1 — Supabase インフラ（**完了 2026-06-26**）

| # | 手順 | 状態 |
|---|------|------|
| B1 | **Supabase** プロジェクト作成（Sync 専用 · ASL 分離） | [x] |
| B2 | SQL マイグレーション 4 本 | [x] |
| B3 | **Auth** URL Configuration · マジックリンク | [x] |
| B4 | **Cloudflare** `sugudasu-sync` 環境変数 | [x] |
| B5 | 本番 `/timeline/app/` UI 結合 | [x] |

正本: [`SYNC_ENV_KEYS.md`](SYNC_ENV_KEYS.md) · [`SYNC_INFRA_CLOUDFLARE.md`](SYNC_INFRA_CLOUDFLARE.md)

**次の受け入れ（未完了）:** マジックリンク受信 → ログイン → ルーム作成 → クラウド保存 → 再読込復元  
→ [`SYNC_S1_ARCHITECTURE.md`](SYNC_S1_ARCHITECTURE.md) §5-2

---

### C. 進行メモ

- [x] Sync CF インフラ · Wrangler 初回デプロイ（2026-06-25）
- [x] Supabase 結合 · 本番ログインフォーム（2026-06-26）
- [ ] **GitHub Secrets** — `SYNC_SUPABASE_URL` · `SYNC_SUPABASE_ANON_KEY`（keepalive GHA · [`SUPABASE_SYNC_KEEPALIVE.md`](SUPABASE_SYNC_KEEPALIVE.md)）
- [ ] S1 製品 E2E 受け入れ（上記）
- [ ] S1.5 `event_public_id`（[`SYNC_IMPLEMENTATION_TASKS.md`](SYNC_IMPLEMENTATION_TASKS.md) §1）

---

## Agent が提督に聞かれたとき

1. **本ファイルを開く**（`docs/notes/TAISHO_PENDING_TASKS.md`）
2. 未チェックの **A*** または **C**（E2E / S1.5）を提示
3. 提督完了報告後、該当 SSOT を更新（本ファイル · `BACKLOG` §5-4）

---

## 関連 SSOT（MECE）

| ファイル | 内容 |
|----------|------|
| [`SYNC_ENV_KEYS.md`](SYNC_ENV_KEYS.md) | 環境変数 · Supabase セットアップ完了 |
| [`SYNC_INFRA_CLOUDFLARE.md`](SYNC_INFRA_CLOUDFLARE.md) | Pages · 手動デプロイ |
| [`SYNC_S1_ARCHITECTURE.md`](SYNC_S1_ARCHITECTURE.md) | S1 受け入れ（インフラ vs E2E） |
| [`SYNC_IMPLEMENTATION_TASKS.md`](SYNC_IMPLEMENTATION_TASKS.md) | S1.5 以降の実装タスク |
| [`BACKLOG.md`](../BACKLOG.md) §5-4 | マイルストーン台帳 |
| [`DEPLOY_LOG.md`](DEPLOY_LOG.md) | デプロイ台帳（core / sync） |
| [`DEPLOY_CLOUDFLARE_PAGES.md`](DEPLOY_CLOUDFLARE_PAGES.md) | コア deploy 手順 |
| [`SUPABASE_SYNC_KEEPALIVE.md`](SUPABASE_SYNC_KEEPALIVE.md) | Free 一時停止回避 |
