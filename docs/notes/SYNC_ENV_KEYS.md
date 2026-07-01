# Sync ライン — 環境変数（秘密は Git 禁止）

**更新:** 2026-06-26  
**スコープ:** 変数名 · 配置先 · Supabase Auth URL 設定のみ（インフラ全体は [`SYNC_INFRA_CLOUDFLARE.md`](SYNC_INFRA_CLOUDFLARE.md)）

## ID 分離ポリシー（最重要）

- **SUGUDASU Sync 専用 Supabase Project / Auth User を新規作成**する。
- **ASL Dashboard 用の既存 Supabase ID を流用・マージしない。**
- 目的: 認証境界・監査境界・障害影響範囲を分離するため。

---

## セットアップ完了状態（2026-06-26 · 提督確認）

| 項目 | 状態 | 確認 |
|------|------|------|
| Supabase プロジェクト（Sync 専用） | **Done** | ASL 本番と別 Project |
| SQL マイグレーション 4 本 | **Done** | 2026-06-26 本番適用確認（#2–4 は Agent 適用 · 下記） |
| Auth URL Configuration | **Done** | Site URL · Redirect URLs |
| Email マジックリンク | **Done** | 本番フォーム表示済み |
| CF `sugudasu-sync` 環境変数 | **Done** | `SYNC_SUPABASE_*` · `SUPABASE_*`（Encrypt） |
| `sync-public-config.json` | **Done** | **anon のみ** · service_role 非含有 |
| 本番 UI 結合 | **Done** | `https://sync.sugudasu.com/timeline/app/` — 環境変数エラー解消 · ログインフォーム表示 |

**未完了（別 SSOT）:** 製品 E2E 受け入れ（マジックリンク受信 → ルーム → 保存 → 再開）→ [`SYNC_S1_ARCHITECTURE.md`](SYNC_S1_ARCHITECTURE.md) §5

---

## ローカルビルド（`npm run build:pages:sync`）

**初回:** リポジトリルートに `.env.sync.local` を **新規作成**（`.gitignore` 済み · Git 禁止）。テンプレートファイルは置かない — 下記 2 行を Supabase Dashboard → **Project Settings → API** の実値で埋める。

```env
SYNC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
SYNC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**禁止:** `PhaseBで…` などの **説明文・プレースホルダーをそのまま貼る** — `sync-public-config.json` に焼き込まれマジックリンクが `ISO-8859-1` エラーになる。anon は **Supabase Dashboard → Project Settings → API → anon public** の `eyJ` で始まる JWT のみ。

**ローカルで `.env.sync.local` を直したのにビルドが失敗する場合:** PowerShell セッションに古い `SYNC_SUPABASE_*` が残っていると、以前はファイルより優先されていた。`Remove-Item Env:SYNC_SUPABASE_ANON_KEY -ErrorAction SilentlyContinue` 後に再実行。現行ビルドは **`.env.sync.local` を常に正本**とする。

ビルド時に `dist-sync/data/sync-public-config.json` へ書き出す（**anon key のみ · 公開可**）。`npm run build:pages:sync` は **eyJ 形式でなければ fail**。

---

## Cloudflare Pages — `sugudasu-sync` ダッシュボード

| 変数 | Production | 備考 |
|------|------------|------|
| `NODE_VERSION` | `20` | 既存 |
| `SYNC_SUPABASE_URL` | 同上 | ビルド時に config JSON 生成 |
| `SYNC_SUPABASE_ANON_KEY` | 同上 | 公開鍵 · クライアント可 |
| `SUPABASE_URL` | 同上 | **Functions** 用（S3 以降） |
| `SUPABASE_SERVICE_ROLE_KEY` | 秘密 | **Functions のみ** · Encrypt · フロント非露出 |

S3 以降:

| 変数 | 用途 |
|------|------|
| `STRIPE_SECRET_KEY` | Checkout Session |
| `STRIPE_WEBHOOK_SECRET` | `/api/webhooks/stripe` 署名 |

### キー責務分離（防波堤）

| 鍵 | 置き場 | 禁止 |
|----|--------|------|
| `anon` | `sync-public-config.json` · ブラウザ | — |
| `service_role` | CF Encrypted env のみ | HTML/JS/Git/チャット |

---

## Supabase ダッシュボード（初回セットアップ手順 · 再現用）

1. **Authentication** → URL Configuration  
   - Site URL: `https://sync.sugudasu.com`  
   - Redirect URLs: `https://sync.sugudasu.com/**` · `http://localhost:8081/**`（プレビュー）
2. **SQL** → 下記マイグレーションを **順番に** 実行
3. **Auth** → **Email + Password** 有効 · マジックリンクのみログインは **OFF**（[`SYNC_AUTH_POLICY.md`](SYNC_AUTH_POLICY.md)）

### マイグレーション順

1. `supabase/migrations/20260625_sync_s1.sql`
2. `supabase/migrations/20260625_sync_retention.sql`
3. `supabase/migrations/20260625_sync_quotas.sql`
4. `supabase/migrations/20260626_sync_billing_layer.sql`

**本番状態（2026-06-26）:** 当初 **#1 のみ** 適用済みだったため `retain_until` が UI で `—` 表示。Agent が **#2–4 を Supabase MCP で適用** · 既存ルームは `created_at + 30日` でバックフィル済み。

---

## 疎通

```text
GET https://sync.sugudasu.com/api/health
```

本番アプリ: `https://sync.sugudasu.com/timeline/app/`（ログイン UI · 環境変数エラーなし）

---

## Free プラン — 一時停止回避

**7 日間 API 活動なしで Paused**（データ削除ではない）。正本: [`SUPABASE_SYNC_KEEPALIVE.md`](SUPABASE_SYNC_KEEPALIVE.md)

| 手段 | コマンド / 設定 |
|------|-----------------|
| GitHub Actions | `.github/workflows/supabase-sync-keepalive.yml` · Secrets: `SYNC_SUPABASE_URL` · `SYNC_SUPABASE_ANON_KEY` |
| 手動 | `npm run keepalive:supabase-sync`（`.env.sync.local`） |

`/api/health` だけでは Supabase タイマーはリセットされない。
