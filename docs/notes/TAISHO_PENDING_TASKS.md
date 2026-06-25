# 提督残タスク — 呼び出し用 SSOT

**更新:** 2026-06-25  
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

### B. Sync S1 — Auth を動かす（Supabase）

| # | 手順 |
|---|------|
| B1 | **Supabase** プロジェクト作成 |
| B2 | SQL マイグレーション実行 → `supabase/migrations/20260625_sync_s1.sql` |
| B3 | **Auth** → URL Configuration · Site URL `https://sync.sugudasu.com` · Redirect `https://sync.sugudasu.com/**` · `http://localhost:8081/**`（プレビュー） |
| B4 | **Cloudflare** `sugudasu-sync` → 環境変数 `SYNC_SUPABASE_URL` · `SYNC_SUPABASE_ANON_KEY` |
| B5 | ローカル `.env.sync.example` → `.env.sync.local` に同値 → `npm run deploy:pages:sync` |

手順正本: [`SYNC_ENV_KEYS.md`](SYNC_ENV_KEYS.md) · 設計: [`SYNC_S1_ARCHITECTURE.md`](SYNC_S1_ARCHITECTURE.md)

**受け入れ:** `sync.sugudasu.com/timeline` でマジックリンクログイン → ルーム作成 → クラウド保存 → 再読込で復元。

---

### C. 進行メモ（2026-06-25）

- [ ] 提督 Terminal で deploy 進行中（`asl-dashboard` / `sugudasu` — セッション要確認）
- [x] Sync プレースホルダー + S1 骨格 · Wrangler 初回デプロイ済み
- [ ] Supabase 未設定のため本番 `/timeline` は「バックエンド設定が必要」表示

---

## Agent が提督に聞かれたとき

1. **本ファイルを開く**（`docs/notes/TAISHO_PENDING_TASKS.md`）
2. 未チェックの **A*** または **B*** をそのまま提示
3. 提督完了報告後、該当行を `[x]` に更新（または日付追記）

---

## 関連 SSOT

| ファイル | 内容 |
|----------|------|
| [`SYNC_INFRA_CLOUDFLARE.md`](SYNC_INFRA_CLOUDFLARE.md) | Pages · 手動デプロイ |
| [`SYNC_ENV_KEYS.md`](SYNC_ENV_KEYS.md) | 環境変数一覧 |
| [`BACKLOG.md`](../BACKLOG.md) §5-4 | Sync インフラ · S1 バックログ |
| [`DEPLOY_CLOUDFLARE_PAGES.md`](DEPLOY_CLOUDFLARE_PAGES.md) | コア deploy |
