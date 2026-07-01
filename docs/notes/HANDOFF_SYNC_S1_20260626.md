# 引き継ぎ — SUGUDASU Sync S1（2026-06-26）

**用途:** 新しい Cursor ウィンドウ / 新 Agent チャットへのコピペ用。  
**詳細ログ:** [`SYNC_S1_E2E_SESSION_LOG_20260626.md`](SYNC_S1_E2E_SESSION_LOG_20260626.md)（試行錯誤 · 成功/失敗 · 要因の正本）  
**正本リポ:** `C:\asl_dev\sugudasu`（**このフォルダを Open Folder で開く**）  
**関連:** ASL は `C:\asl_dev\asl-dashboard` — **別ウィンドウ · 別デプロイ · 別 Supabase**

---

## 現状サマリ（2026-06-26 終盤）

| 項目 | 状態 |
|------|------|
| 本番 Supabase 接続 | **OK** — `trtgjhxacpixmolqehbt.supabase.co` |
| E2E-1 ログイン | **OK**（提督確認） |
| E2E-2 作成・保存 | **OK** · 別タブ/リロードは **未確認** |
| E2E-3 削除 | **NG** — fix 済み · **再デプロイ待ち** |
| メール From/文面 | **要改善**（テンプレ or Custom SMTP） |
| git commit | **未**（提督判断） |

---

## 1. 悪戦苦闘（時系列 · 要約）

| 段階 | 症状 | 原因 | 対応状況 |
|------|------|------|----------|
| A | deploy BLOCK | `DEPLOY_LOG` 未 approved | `DEPLOY-20260626-003` |
| B | anon JWT ビルド FAIL | プレースホルダー日本語 | 実 `eyJ` + ビルドガード |
| C | env 直しても FAIL | シェル env 優先 | `loadEnvSyncLocal` 修正 |
| D | CF env 直しても駄目 | Wrangler = ローカルビルドのみ | ドキュメント化 |
| E | `Failed to fetch` | 誤 Project ref **NXDOMAIN** + `http`/`https` + typo | **解決** — 正 ref + 再デプロイ `770637be` |
| F | 削除ボタン無効 | DELETE 0 行でも成功扱い | **コード修正** · 未デプロイ |
| G | メールが Supabase 名義 | 標準 SMTP は From 固定 | テンプレ/SMTP は **未着手** |

詳細は [`SYNC_S1_E2E_SESSION_LOG_20260626.md`](SYNC_S1_E2E_SESSION_LOG_20260626.md) §1–3。

---

## 2. 成功したこと

- [x] マジックリンクログイン · `support@sugudasu.com` セッション
- [x] ルーム作成 · クラウド保存（`rev.1`+）
- [x] 本番 config 正ホスト · DNS 解決
- [x] `deploy:pages:sync` ×2 · `DEPLOY-20260626-003` executed
- [x] S1 UI · ビルドガード · E2E チェックリスト · Agent ツール（RTK / CodeGraph / CF MCP）
- [x] `.env.sync.example` 削除 · `SYNC_ENV_KEYS.md` 一本化

---

## 3. 失敗・未完了

- [ ] **ルーム削除 E2E** — fix デプロイ後に再試行
- [ ] **E2E-2** 別タブ · ハードリロード
- [ ] **メール** 日本語化 · SUGUDASU Sync 名義（SMTP は後追い可）
- [ ] **`retain_until` UI** — DB 列確認
- [ ] **`SYNC_S1_ARCHITECTURE.md` §5-2** `[x]` 化
- [ ] **git commit / push** · keepalive Secrets

---

## 4. 残タスク（優先順）

### P0

1. `npm run deploy:pages:sync`（削除 fix）
2. E2E-3 削除 · E2E-2 復元確認
3. Auth Email Template 日本語化

### P1

- git 整備 · §5-2 受け入れ更新

---

## 5. 技術メモ

### env / デプロイ

| コマンド | 読む env | 出力 |
|----------|----------|------|
| `npm run build:pages:sync` | `.env.sync.local` | `dist-sync/data/sync-public-config.json` |
| `npm run deploy:pages:sync` | 上 + `DEPLOY_LOG` gate | Wrangler → `sugudasu-sync` |

**CF ダッシュボード env は手動 Wrangler では無視。**

### Auth URL（設定済みで OK）

- Site URL: `https://sync.sugudasu.com`
- Redirect: `https://sync.sugudasu.com/**` · `http://localhost:8081/**`

### SSOT リンク

- [`SYNC_S1_E2E_SESSION_LOG_20260626.md`](SYNC_S1_E2E_SESSION_LOG_20260626.md)
- [`SYNC_S1_E2E_CHECKLIST.md`](SYNC_S1_E2E_CHECKLIST.md)
- [`SYNC_ENV_KEYS.md`](SYNC_ENV_KEYS.md)
- [`DEPLOY_LOG.md`](DEPLOY_LOG.md)

---

## 6. 引き継ぎチャット（コピペ用）

```text
【引き継ぎ】SUGUDASU Sync S1 E2E（続き）

SSOT: docs/notes/SYNC_S1_E2E_SESSION_LOG_20260626.md → HANDOFF_SYNC_S1_20260626.md

状況:
- ログイン・保存は本番 OK（Project URL 修正 · deploy 770637be）
- 削除ボタン fix はローカルのみ — deploy:pages:sync 要
- メール文面・From は Supabase テンプレ/SMTP 要調整
- E2E §5-2 未完了

次:
1. deploy:pages:sync（削除 fix）
2. E2E-2 復元 · E2E-3 削除
3. Email Template 日本語化
```

---

## 7. 変更履歴

| 日付 | 内容 |
|------|------|
| 2026-06-26 | 初版 |
| 2026-06-26 | ログイン成功後の現状に全面更新 · SESSION_LOG へ詳細分離 |
