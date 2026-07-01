# Sync Auth — Custom SMTP セットアップ（提督用）

**更新:** 2026-06-26  
**目的:** 組み込み SMTP（**約2通/時間**）を脱却。**初回メール確認 · パスワードリセット** 用（ログイン主経路はメール+パスワード — [`SYNC_AUTH_POLICY.md`](SYNC_AUTH_POLICY.md)）。  
**関連:** [`BACKLOG.md`](../BACKLOG.md) §5-4 · [`SYNC_ENV_KEYS.md`](SYNC_ENV_KEYS.md)

---

## なぜ必須か

| 組み込み SMTP | Custom SMTP 後 |
|---------------|----------------|
| **2通/時間**（プロジェクト全体） | プロバイダ上限（Resend 無料 **100通/日** 等） |
| From: `noreply@mail.app.supabase.io` | `noreply@sync.sugudasu.com` 等 |
| 再ログイン不能が日常起きる | 幹事の再送・別端末ログインが現実的 |

DNS は **お名前.com → NS を Cloudflare 委譲済み**なら、**Cloudflare DNS に SPF/DKIM を追加**するだけで可。

---

## 推奨: Resend（最短）

### 1. Resend

1. [resend.com](https://resend.com) でアカウント作成
2. **Domains** → `sync.sugudasu.com` を追加
3. 表示される **DNS レコード**（SPF · DKIM · 場合により DMARC）をメモ

### 2. Cloudflare DNS（`sync.sugudasu.com` ゾーン）

| 種別 | 注意 |
|------|------|
| TXT / CNAME（Resend 指定） | **DNS only（灰雲）** — メール用はプロキシ OFF |
| 検証完了まで数分〜数時間 | Resend Dashboard で Verify |

### 3. Supabase Dashboard（`SUGUDASU Sync` プロジェクト）

**Authentication → SMTP Settings**

| 項目 | 例 |
|------|-----|
| Enable Custom SMTP | ON |
| Host | `smtp.resend.com` |
| Port | `465`（SSL） |
| Username | `resend` |
| Password | Resend **API Key**（`re_...`） |
| Sender email | `noreply@sync.sugudasu.com` |
| Sender name | `SUGUDASU Sync` |

**Authentication → Email Templates** — 各テンプレを日本語化（件名例: `SUGUDASU Sync — ログイン用リンク`）

**Authentication → Providers → Email → Email OTP Expiration** — **86400**（24時間 · 幹事がメールを後から開く想定）

**Authentication → Rate Limits → Email sent** — Custom SMTP 有効化後に **30〜100/時間** 程度へ（E2E · β 用）

### 4. 疎通

1. 本番 `/timeline/app/` でテスト用メールにマジックリンク送信
2. From が `SUGUDASU Sync <noreply@sync.sugudasu.com>` であること
3. リンククリックでログインできること

---

## GitHub Secrets（keepalive · 別タスク）

SMTP とは無関係。並行で:

| Secret | 値 |
|--------|-----|
| `SYNC_SUPABASE_URL` | `https://trtgjhxacpixmolqehbt.supabase.co` |
| `SYNC_SUPABASE_ANON_KEY` | Dashboard → API → anon |

→ [`SUPABASE_SYNC_KEEPALIVE.md`](SUPABASE_SYNC_KEEPALIVE.md)

---

## 完了チェック

- [ ] Resend ドメイン Verified
- [ ] Supabase Custom SMTP 送信成功
- [ ] Email Templates 日本語化
- [ ] OTP 有効期限 24h
- [ ] `email_sent` レート上限を実用値に
- [ ] `BACKLOG.md` §5-4 の Auth メール項目を `[x]` 化
