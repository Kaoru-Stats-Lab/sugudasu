# Sync S1 — 製品 E2E 受け入れチェックリスト

**更新:** 2026-06-26  
**Auth 方針:** [`SYNC_AUTH_POLICY.md`](SYNC_AUTH_POLICY.md) — **E2E-1 はメール+パスワードに差し替え予定**（現チェックリストはマジックリンク試作用）

提督が本番（または `npm run preview:pages:sync`）で **1 回通す** と S1 製品 E2E 完了。

---

## 事前

- [ ] Supabase Auth の **Redirect URLs** に `https://sync.sugudasu.com/timeline/app`（末尾 `/` 有無両方推奨）が入っている
- [ ] テスト用メール（実在 inbox）を用意
- [ ] **E2E 中はログアウトしない**（再ログインでマジックリンクを消費する）
- [ ] コード反映後: `npm run deploy:pages:sync`（または提督手動デプロイ）

---

## E2E-1 ログイン（メール + パスワード）

| # | 操作 | 期待 |
|---|------|------|
| 1 | 未ログインで `/timeline/app/` を開く | ログインフォーム（メール · パスワード） |
| 2 | 登録済みアカウントでログイン | ルーム UI 表示 · メールアドレス表示 |
| 3 | ログアウト → 再ログイン | 同じアカウントで復帰 |
| 4 | `sugudasu.com` を別タブで開く · DevTools → Local Storage | **`sg-sync-auth` が sugudasu.com に無い** |

---

## E2E-2 ルーム作成 · 保存 · 復元

| # | 操作 | 期待 |
|---|------|------|
| 1 | 新規ルーム作成（例: `E2Eテスト 0626`） | 一覧に表示 · 選択中になる |
| 2 | **保持期限** がルーム行と詳細に表示される | `retain_until`（作成+30日付近） |
| 3 | **イベント名** を変更（例: `E2E保存確認`）→ **クラウドに保存** | `rev.1` 以上 · 成功メッセージ |
| 4 | **別タブ**で同じ URL を開く（同アカウント） | 同ルーム選択 → 同イベント名 · 同コマ数 |
| 5 | **ハードリロード**（F5） | 同上 |

---

## E2E-3 ルーム削除

| # | 操作 | 期待 |
|---|------|------|
| 1 | テストルームを選択 → **ルームを削除** → 確認 OK | 一覧から消える |
| 2 | 再読込 | 削除したルームが **復活しない** |

---

## 失敗時の切り分け

| 症状 | 確認 |
|------|------|
| **`email rate limit exceeded`** | **組み込み SMTP は約2通/時間（プロジェクト全体）** — 1時間待つ · **以前届いたマジックリンク**を再利用 · 本番は Custom SMTP（[`BACKLOG.md`](../BACKLOG.md) §5-4） |
| マジックリンク失敗 · `ISO-8859-1` | `SYNC_SUPABASE_ANON_KEY` に全角/不可視文字 — CF 再貼り付け · 再ビルド |
| **`Failed to fetch`** | **メールは無関係** — `SYNC_SUPABASE_URL` のホストが DNS 解決できない（誤 URL · プロジェクト削除/停止）。Dashboard → Settings → API の **Project URL** を再コピー · `nslookup YOURREF.supabase.co` で確認 · `.env.sync.local` → 再ビルド |
| ルーム作成 401/403 | RLS · ログインセッション · `sync_rooms` ポリシー |
| `room_quota_exceeded` | trial は **active ルーム1件** — 古いルームを削除 |
| 保存できない | Network タブ · `sync_room_states` upsert エラー |
| ルーム削除が効かない | 一覧各行の **「削除」** を使用（`364318ba`+）· 確認モーダル · Network で `DELETE sync_rooms` · `room_delete_failed` = セッション切れ |

---

## 完了後（Agent / 提督）

1. `SYNC_S1_ARCHITECTURE.md` §5-2 の `[ ]` を `[x]` に更新（実施日を記載）
2. `TAISHO_PENDING_TASKS.md` §C の S1 E2E を `[x]`
3. `DEPLOY_LOG.md` に `target: sync` エントリ（該当時）
