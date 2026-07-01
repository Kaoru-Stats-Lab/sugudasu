# 提督残タスク — 呼び出し用 SSOT

**更新:** 2026-06-26（β · 課金API保留）  
**用途:** 提督が「次何する？」と聞いたとき · Agent が **最初に開く** チェックリスト。  
**対象リポ:** `C:\asl_dev\sugudasu`（**asl-dashboard には Cloudflare MCP 入れない**）

**思想付き詳細（なぜ残すか）:** [`SYNC_S1_REMAINING_TASKS.md`](SYNC_S1_REMAINING_TASKS.md) — **§番号は下記 C と対応**

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
| B2 | SQL マイグレーション 4 本 | [x]（#2–4 は 2026-06-26 本番適用） |
| B3 | **Auth** URL Configuration | [x]（**方針転換:** メール+パスワードへ — [`SYNC_AUTH_POLICY.md`](SYNC_AUTH_POLICY.md)） |
| B4 | **Cloudflare** `sugudasu-sync` 環境変数 | [x] |
| B5 | 本番 `/timeline/app/` UI 結合 | [x] |

正本: [`SYNC_ENV_KEYS.md`](SYNC_ENV_KEYS.md) · [`SYNC_INFRA_CLOUDFLARE.md`](SYNC_INFRA_CLOUDFLARE.md)

---

### C. 進行メモ（残タスク · 思想は `SYNC_S1_REMAINING_TASKS.md`）

| § | タスク | 状態 | 誰 |
|---|--------|------|-----|
| **§1b** | **Auth — メール+パスワード**（UI 実装済 · Dashboard 設定待ち） | [ ] | Agent done · 提督: Supabase Auth 設定 |
| §1 | Custom SMTP（確認 · リセットメール用） | [ ] | 提督 |
| §2 | メールテンプレ **日本語化** | [ ] | 提督 · Dashboard |
| §3 | OTP · セッション · クライアント deploy | [ ] | 提督 + Agent |
| **§1c** | **アカウント管理** — 削除 · メール変更 · パスワード変更 | [ ] | Agent + Function |
| §4 | **S1 E2E 完走** | [ ] | 提督 · Auth 後 |
| §5 | **GitHub Secrets** keepalive | [ ] | 提督 |
| §6 | 未コミット差分 · deploy 整理 | [ ] | 提督判断 |

**済み:**

- [x] Sync CF · Supabase 結合 · マジックリンク · クラウド保存（一部 E2E）
- [x] 削除 UI デプロイ `364318ba`
- [x] `retain_until` DB（マイグレーション #2–4）

**ブロッカー:** Auth 方針転換 — **§1b UI 実装** が E2E の前提（マジックリンク試作は廃止）

**β · 課金API:** 決済API（Stripe 本番）は **β では導入しない**。アカウント MECE は **Non課金のみ実装** · 拡張性フックのみ — [`BACKLOG.md`](../BACKLOG.md) §5-4 · [`sync-account-mece-gemini-RESULT.md`](sync-account-mece-gemini-RESULT.md) §11

---

## Agent が提督に聞かれたとき

1. **本ファイル** → 未チェックの **C（§1–6）**
2. 「なぜ？」と聞かれたら **[`SYNC_S1_REMAINING_TASKS.md`](SYNC_S1_REMAINING_TASKS.md)** を開く
3. 完了報告後 · 該当 SSOT · `BACKLOG` §5-4 を更新

---

## 関連 SSOT（MECE）

| ファイル | 内容 |
|----------|------|
| **[`SYNC_AUTH_POLICY.md`](SYNC_AUTH_POLICY.md)** | **Auth 方針 — メール+パスワード（提督確定）** |
| [`SYNC_S1_REMAINING_TASKS.md`](SYNC_S1_REMAINING_TASKS.md) | 残タスク · 背景 · 思想 |
| [`SYNC_S1_E2E_CHECKLIST.md`](SYNC_S1_E2E_CHECKLIST.md) | E2E 操作手順 |
| [`SYNC_S1_E2E_SESSION_LOG_20260626.md`](SYNC_S1_E2E_SESSION_LOG_20260626.md) | 試行錯誤ログ |
| [`SYNC_ENV_KEYS.md`](SYNC_ENV_KEYS.md) | 環境変数 · マイグレーション |
| [`SYNC_CUSTOM_SMTP_SETUP.md`](SYNC_CUSTOM_SMTP_SETUP.md) | Custom SMTP 手順 |
| [`SYNC_S1_ARCHITECTURE.md`](SYNC_S1_ARCHITECTURE.md) | S1 受け入れ |
| [`BACKLOG.md`](../BACKLOG.md) §5-4 | マイルストーン台帳 |
| [`DEPLOY_LOG.md`](DEPLOY_LOG.md) | デプロイ台帳 |
