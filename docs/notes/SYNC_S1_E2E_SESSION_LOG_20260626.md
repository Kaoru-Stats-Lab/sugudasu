# Sync S1 E2E — 試行錯誤ログ（2026-06-26）

**用途:** 本セッションの成功・失敗・要因・背景の正本（提督 · Agent 共有）  
**短い引き継ぎ:** [`HANDOFF_SYNC_S1_20260626.md`](HANDOFF_SYNC_S1_20260626.md)  
**E2E 手順:** [`SYNC_S1_E2E_CHECKLIST.md`](SYNC_S1_E2E_CHECKLIST.md)  
**デプロイ台帳:** [`DEPLOY_LOG.md`](DEPLOY_LOG.md) · `DEPLOY-20260626-003`

---

## 0. 背景（何をしていたか）

| 項目 | 内容 |
|------|------|
| **ゴール** | Sync Phase S1 の **製品 E2E** — マジックリンクログイン · ルーム作成 · クラウド保存 · 削除 · `retain_until` |
| **本番 URL** | https://sync.sugudasu.com/timeline/app/ |
| **リポ** | `C:\asl_dev\sugudasu` のみ（**ASL `asl-dashboard` は別ウィンドウ · 別 Supabase · 触らない**） |
| **デプロイ経路** | `npm run deploy:pages:sync` → ローカル `build:pages:sync` + **Wrangler 手動**（CF の git 自動デプロイは **OFF**） |
| **env 正本** | 手動デプロイ時は **`.env.sync.local` のみ**（CF ダッシュボードの `SYNC_SUPABASE_*` は手動 Wrangler では効かない） |
| **Supabase** | SUGUDASU Sync **専用**プロジェクト（ASL 流用禁止 · [`SYNC_ENV_KEYS.md`](SYNC_ENV_KEYS.md)） |
| **並行作業** | ASL の Vercel prebuilt デプロイは別ターミナルで進行 — sugudasu Agent は干渉しない |

---

## 1. 時系列（試行錯誤）

### フェーズ A — デプロイゲート・ビルド（解決済み）

| # | 症状 | 要因 | 結果 |
|---|------|------|------|
| A1 | `deploy:pages:sync` 即 BLOCK | `DEPLOY_LOG` に `target=sync` · `approved` 無し | `DEPLOY-20260626-003` 追記で通過 |
| A2 | ビルド FAIL「anon が JWT ではない」 | `.env.sync.local` に日本語プレースホルダー `PhaseBで控えた…` | 提督が実 `eyJ...` に差し替え |
| A3 | ファイルを直したのにまだ FAIL | `loadEnvSyncLocal` が **シェル env 優先**（古いプレースホルダー残存） | **コード修正** — `.env.sync.local` を常に正本 |
| A4 | CF ダッシュボード env を直しても本番変わらず | **Wrangler 手動デプロイ = ローカルビルドのみ** | ドキュメント追記 · 教訓化 |

### フェーズ B — 本番 `Failed to fetch`（一部解決）

| # | 症状 | 要因 | 結果 |
|---|------|------|------|
| B1 | `/timeline/app/` でマジックリンク送信 → `Failed to fetch` | 当初メールの全角文字を疑ったが **無関係**（Gmail ASCII） | 切り分け完了 |
| B2 | 同上 | 本番 `sync-public-config.json` のホスト **`trtghjxacpixmolqehbt`** が **DNS NXDOMAIN**（存在しない Project ref） | 誤 URL と判明 |
| B3 | Agent が「Supabase にプロジェクト無し」 | **Supabase MCP は ASL 用**（`asl-dashboard`）— SUGUDASU プロジェクトは見えない | 提督指摘 · DNS は `nslookup` で十分 |
| B4 | 提督が CF Pages env も更新 | 手動 Wrangler では **本番 config に反映されない** | 再デプロイ必須と再確認 |

### フェーズ C — Project URL 修正（解決済み · 2026-06-26 午後）

| # | 症状 | 要因 | 結果 |
|---|------|------|------|
| C1 | 依然 `Failed to fetch` | Project URL が **`http://`** または **Project ID の typo** | 提督が Dashboard → API から再コピー |
| C2 | 旧 ref `trt**gh**jxacpixmolqehbt` | 1 文字順序違い · **NXDOMAIN** | 捨てる |
| C3 | 正 ref `trtg**jh**xacpixmolqehbt` | **`https://`** · `nslookup` → `104.18.38.10` 等 | **有効** |
| C4 | 1 回目デプロイ後も本番が旧ホストのまま | `.env.sync.local` がまだ旧 ID のまま再ビルドされていた | 提督が env 修正後 **2 回目デプロイ** |
| C5 | 2 回目デプロイ `770637be` | 本番 config = `trtgjhxacpixmolqehbt.supabase.co` | **ログイン経路復旧** |

### フェーズ D — 製品 E2E（進行中）

| # | 操作 | 結果 | 備考 |
|---|------|------|------|
| D1 | E2E-1 マジックリンク送信 | **OK** | 「送信しました」表示 |
| D2 | メール受信 · リンククリック | **OK**（提督確認） | From: `Supabase Auth <noreply@mail.app.supabase.io>` — **文面・送信者は要改善** |
| D3 | ログイン後 UI | **OK** | `support@sugudasu.com` · ルーム UI 表示 |
| D4 | E2E-2 ルーム作成 | **OK** | 例: `2026年社員研修　対象：事業部係長以上` |
| D5 | E2E-2 クラウド保存 | **OK** | `rev.1` 以上 · 「クラウドに保存しました」 |
| D6 | E2E-2 別タブ復元 · ハードリロード | **未確認** | 提督未実施 |
| D7 | E2E-3 ルーム削除 | **NG** | UI で消えない · 下記 §3 |
| D8 | `retain_until` 表示 | **UI は `—`** → **DB 未マイグレーションが原因** | #2–4 を 2026-06-26 本番適用 · 既存行は +30日バックフィル |

### フェーズ E — リポ・Agent 環境（本件の副次作業）

| 項目 | 内容 |
|------|------|
| `.env.sync.example` 削除 | テンプレ誤貼りリスク · SSOT は `SYNC_ENV_KEYS.md` のみ |
| RTK 導入 | グローバル Cursor hook · [`RTK_CURSOR.md`](RTK_CURSOR.md) |
| CodeGraph 導入 | `.cursor/mcp.json` + `codegraph init` · [`CODEGRAPH_CURSOR.md`](CODEGRAPH_CURSOR.md) |
| Cloudflare MCP OAuth | Read only 推奨 · [`CURSOR_CLOUDFLARE_AGENT_SETUP.md`](CURSOR_CLOUDFLARE_AGENT_SETUP.md) |

---

## 2. 成功したこと（確定）

- Sync 専用 Supabase 結合 · Auth Redirect URLs（`https://sync.sugudasu.com/**` · `http://localhost:8081/**`）
- 本番 `sync-public-config.json` — **正しいホスト** + anon `eyJ` 形式
- マジックリンクログイン · セッション成立（`sync.sugudasu.com` ドメイン）
- `sync_rooms` への INSERT（提督確認データあり）
- `sync_room_states` への保存（UI `rev.1`+）
- `deploy:pages:sync` ×2（`1c71ab93` → `770637be`）· `DEPLOY-20260626-003` executed
- ビルドガード（anon JWT 必須 · 日本語検出 · `loadEnvSyncLocal` ファイル正本）
- S1 UI 骨格（ルーム一覧 · イベント名編集 · 削除ボタン · エラー文言）

---

## 3. 失敗・未完了と要因

### 3-1. ログイン障害（解決済み · 教訓として残す）

**症状:** `Failed to fetch`  
**真因（複合）:**

1. **誤 Project ref** `trtghjxacpixmolqehbt` → 全世界 NXDOMAIN  
2. **正 ref への修正後も**、手動 Wrangler デプロイなので **`.env.sync.local` 変更 + 再ビルド + 再デプロイ** までやらないと本番が変わらない  
3. **`https://` 必須**（`http://` は不可）  
4. CF ダッシュボード env だけ直しても **手動経路では無意味**（混乱の元）

**無関係だったもの:** メールアドレスの ASCII/全角 · Supabase MCP でのプロジェクト有無確認

### 3-2. ルーム削除（UI + API 修正デプロイ済 · E2E-3 確認待ち）

**症状:** 「ルームを削除」押下後も一覧に残る · ホバーは効くがクリック無効

**要因（UI）:** 本番 HTML に `disabled` 属性 · ルーム未選択のまま（先頭自動選択 JS 未反映）

**要因（API）:** PostgREST の `DELETE` は RLS で 0 行でも **エラーを返さない**。旧 `deleteRoom` が `.select()` 無し → **削除失敗でも「削除しました」表示** し得る。

**対応:**

- `sync-timeline-s1-app.js` — `disabled` 廃止 · 確認ダイアログ · 行ごと「削除」 · 起動時先頭ルーム自動選択
- `sync-room-store.js` — `.delete().select('id')` + 0 行なら `room_delete_failed`

**デプロイ:** `364318ba`（2026-06-26 · 4 回目）

**確認手順:** ハードリロード → ルーム行右の **「削除」** または下部ボタン → モーダルで「削除する」

### 3-3. マジックリンクメール（未対応 · 製品品質）

**症状:** 英語テンプレ · `Supabase Auth <noreply@mail.app.supabase.io>` — SUGUDASU Sync と分からない

| やりたいこと | 手段 |
|--------------|------|
| 文面日本語化 | Dashboard → Auth → **Email Templates**（SMTP 不要） |
| 送信者名・From を `SUGUDASU Sync` に | **Custom SMTP** 必須（Resend / SendGrid 等 + ドメイン DNS） |

標準 SMTP では **From は変更不可** · テンプレのみ即変更可。

### 3-4. E2E 未完了項目

- [ ] E2E-2 別タブ · ハードリロードで復元確認  
- [ ] E2E-3 削除 · 再読込で復活しない  
- [ ] `retain_until` の UI 表示（DB 列・マイグレーション確認）  
- [ ] `sugudasu.com` に `sg-sync-auth` が無いこと（DevTools 確認）  
- [ ] `SYNC_S1_ARCHITECTURE.md` §5-2 の `[x]` 化  
- [ ] ワークツリー **git commit / push**（提督判断）  
- [ ] GitHub Secrets `SYNC_SUPABASE_*`（keepalive GHA）

---

## 4. Supabase 上の確認データ（提督 · 2026-06-26）

`sync_rooms` に登録済み（抜粋 · 秘密以外）:

| 列 | 値 |
|----|-----|
| `id` | `36af2a9f-9f4c-4e8a-a9e7-d5ec8f78f830` |
| `owner_id` | `02fd0475-b4b7-41ce-8ea9-b305be0e6640` |
| `title` | `2026年社員研修　対象：事業部係長以上` |
| `entitlement` | `trial` |
| `created_at` | `2026-06-26 12:39:25 UTC` |

**提督確認用 SQL:**

```sql
-- retain_until · 保存 state
select id, title, retain_until from public.sync_rooms
where id = '36af2a9f-9f4c-4e8a-a9e7-d5ec8f78f830';

select room_id, revision, updated_at from public.sync_room_states
where room_id = '36af2a9f-9f4c-4e8a-a9e7-d5ec8f78f830';
```

`stripe_customer_id` が Table Editor に見える場合、`20260626_sync_billing_layer.sql` 未適用 or 旧スキーマ表示の可能性あり（S1 ブロッカーではない）。

---

## 5. デプロイ履歴（本日 · sync）

| 回 | `cf_deployment_id` | 本番 config ホスト | 結果 |
|----|-------------------|-------------------|------|
| 1 | `1c71ab93` | `trtghjxacpixmolqehbt`（NXDOMAIN） | UI のみ · ログイン NG |
| 2 | `770637be` | `trtgjhxacpixmolqehbt`（DNS OK） | ログイン · 保存 OK |
| 3 | `be661ae5` | 削除 API（`.select('id')`） | OK |
| 4 | `364318ba` | 削除 UI（disabled 廃止 · 行削除 · 確認モーダル） | **E2E-3 確認待ち** |

Pages ビルド予算: **18/450**（2026-06 · `DEPLOY_LOG` 参照）

---

## 6. 教訓（次に同じ轍を踏まない）

1. **ASL と sugudasu を同じ Cursor ウィンドウでやらない** — MCP · コンテキスト混線  
2. **Sync 手動デプロイ = `.env.sync.local` → build → wrangler** — CF ダッシュボード env は別経路  
3. **Project URL は Dashboard からコピペ** — `https://{ref}.supabase.co` · **`nslookup {ref}.supabase.co` 必須**  
4. **ref の 1 文字 typo でも NXDOMAIN** — `trtghjx` vs `trtgjhx`  
5. **DELETE は `.select()` で行数確認** — 黙って失敗する  
6. **メールの From は標準 SMTP では変えられない** — テンプレ日本語化は即日可  

---

## 7. 次の一手（優先順）

1. **Auth UI** — メール+パスワード実装済 · **§1c アカウント管理**（削除 · メール変更）— **課金 ID 境界に従う**（§8-4）
2. **提督:** Custom SMTP · Supabase Auth 設定
3. E2E 完走 · commit

---

## 8. 提督決定ログ（製品 · 実装方針）

### 8-1. Auth — メール + パスワード（フィッシング）

マジックリンク単独は不採用。正本 [`SYNC_AUTH_POLICY.md`](SYNC_AUTH_POLICY.md)。

### 8-2. アカウント管理 MECE

退会 · メール変更 · ログイン中パスワード変更が残タスク。正本 `SYNC_AUTH_POLICY.md` §5 · `SYNC_S1_REMAINING_TASKS.md` §1c。

### 8-3. 実装順序

**機能 → デザイン**（`DESIGN_GUIDELINE` · Notion Like は後追い）。

### 8-4. 課金 API との ID 境界（2026-06-26 · 提督）

| 決定 | 内容 |
|------|------|
| **主体 ID** | `auth.users.id`（UUID）= `sync_profiles.id` = 課金・退会のキー |
| **メール** | ログイン用のみ · Stripe 顧客の正本キーにしない |
| **Stripe** | `sync_profiles.stripe_customer_id` · 権利は `user_entitlements` |
| **API** | アカウント削除等は Pages Functions · JWT から `user_id` · S3 で Stripe 解約を同フローに挿入 |
| **登録時** | `sync_profiles` 1:1 作成を必須化 |

詳細 [`SYNC_AUTH_POLICY.md`](SYNC_AUTH_POLICY.md) §5-6。

### 8-5. DB 設計 — Auth / 課金 ID に追随（2026-06-26）

Auth の主体が `auth.users.id` に固定されたため、DB も **すでにその形**（`sync_profiles` · `user_entitlements` · `owner_id` FK · CASCADE 退会）。

| 状態 | 内容 |
|------|------|
| **確定済** | 4 本マイグレーション本番適用 · 課金二層 · RLS · quota トリガー |
| **残り 1 本（S1）** | `sync_profiles` 自動作成トリガー（signup 1:1） |
| **S1.5** | `sync_room_states` → `sync_rooms` 統合 · `event_public_id` |
| **S3** | Webhook が `user_entitlements` を書く（スキーマ追加不要） |

正本 [`SYNC_DB_ARCHITECTURE.md`](SYNC_DB_ARCHITECTURE.md) §2-0。

### 8-6. 売掛追跡の責務（2026-06-26 · 提督 Q&A）

**売掛は Stripe が追う。Sync は権利状態だけ。**

- 主導線は **前払いチケット** — 売掛を発生させない
- 救済後払い（初回1回）のみ例外 · 回収は Stripe 導線
- Sync は `user_entitlements` / entitlement ゲートのみ

正本 [`SYNC_S1_ARCHITECTURE.md`](SYNC_S1_ARCHITECTURE.md) §2「売掛を誰が追うか」。

### 8-7. 保持・ダウングレード — 運営内規 vs ユーザー表現（2026-06-26）

**grace · quota · バッファ性は運営ドキュメント正本。表立った FAQ 化はしない。**

- ユーザーには **保持期限の日付** と **操作できないときの短い理由** のみ
- 法務（規約・プライバシー）の要約は維持

正本 [`SYNC_RETENTION_POLICY.md`](SYNC_RETENTION_POLICY.md) §3-2。

---

## 9. 変更履歴

| 日付 | 内容 |
|------|------|
| 2026-06-26 | §8-7 保持ポリシーは運営内規 · ユーザー FAQ 化しない |
| 2026-06-26 | §8-6 売掛は Stripe · Sync は権利ミラーのみ |
| 2026-06-26 | §8-5 DB 設計が Auth/課金 ID に追随することを確定 |
| 2026-06-26 | §8 提督決定ログ — Auth パスワード · アカウント MECE · 課金 ID 境界 |
| 2026-06-26 | 初版 — 本セッション試行錯誤の統合ログ |
