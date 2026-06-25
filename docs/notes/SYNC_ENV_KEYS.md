# Sync ライン — 環境変数（秘密は Git 禁止）

**更新:** 2026-06-25

## ID 分離ポリシー（最重要）

- **SUGUDASU 用 Supabase Project / Auth User は新規で作成**する。
- **ASL 用の既存 Supabase ID を流用・マージしない。**
- 目的: 認証境界・監査境界・障害影響範囲を分離するため。

## ローカルビルド（`npm run build:pages:sync`）

`.env.sync.local`（Git 無視 · 提督端末のみ）:

```env
SYNC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
SYNC_SUPABASE_ANON_KEY=eyJ...
```

ビルド時に `dist-sync/data/sync-public-config.json` へ書き出す（anon key のみ · 公開可）。

## Cloudflare Pages — `sugudasu-sync` ダッシュボード

| 変数 | Production | 備考 |
|------|------------|------|
| `NODE_VERSION` | `20` | 既存 |
| `SYNC_SUPABASE_URL` | 同上 | ビルド時に config JSON 生成 |
| `SYNC_SUPABASE_ANON_KEY` | 同上 | 公開鍵 |
| `SUPABASE_URL` | 同上 | **Functions** 用（S3 以降） |
| `SUPABASE_SERVICE_ROLE_KEY` | 秘密 | **Functions のみ** · Encrypt |

S3 以降:

| 変数 | 用途 |
|------|------|
| `STRIPE_SECRET_KEY` | Checkout Session |
| `STRIPE_WEBHOOK_SECRET` | `/api/webhooks/stripe` 署名 |

## Supabase ダッシュボード

1. **Authentication** → URL Configuration  
   - Site URL: `https://sync.sugudasu.com`  
   - Redirect URLs: `https://sync.sugudasu.com/**` · `http://localhost:8081/**`（プレビュー）
2. **SQL** → `supabase/migrations/20260625_sync_s1.sql` を実行
3. **Auth** → Email マジックリンク有効（Google OAuth は任意 · 後追い可）

## 疎通

```text
GET https://sync.sugudasu.com/api/health
```
