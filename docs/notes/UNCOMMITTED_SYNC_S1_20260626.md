# 未コミット差分整理 — Sync S1（2026-06-26）

**用途:** 提督がコミット判断する前のレビュー用。コミット後は削除可。

---

## コミット対象（推奨）

### A. 機能 · ビルド（1 コミット `feat(sync): S1 E2E prep — room delete, JWT build guard`）

| ファイル | 内容 |
|----------|------|
| `assets/sync-supabase-sanitize.js` | **新規** — ASCII / env サニタイズ |
| `assets/sync-auth.js` | `pingSupabaseAuth` · jsdelivr SDK |
| `assets/sync-public-config.js` | 設定読み込み改善 |
| `assets/sync-room-store.js` | ルーム削除 API |
| `assets/sync-timeline-s1-app.js` | 削除 UI · `retain_until` · イベント名編集 |
| `scripts/build-pages.mjs` | `loadEnvSyncLocal` ファイル正本 · eyJ 必須 |
| `scripts/supabase-sync-keepalive.mjs` | sanitize 連携 |
| `tools/sync-timeline.html` | sanitize スクリプト読み込み |

### B. ドキュメント（1 コミット `docs(sync): E2E checklist, deploy log, env keys`）

| ファイル | 内容 |
|----------|------|
| `docs/notes/SYNC_S1_E2E_CHECKLIST.md` | **新規** — E2E-1〜3 |
| `docs/notes/HANDOFF_SYNC_S1_20260626.md` | **新規** — 引き継ぎ SSOT |
| `docs/notes/DEPLOY_LOG.md` | `DEPLOY-20260626-003` approved |
| `docs/notes/SYNC_ENV_KEYS.md` | ローカル env 正本 · プレースホルダー禁止 |
| `docs/notes/SYNC_S1_ARCHITECTURE.md` | E2E チェックリストリンク |
| `docs/notes/TAISHO_PENDING_TASKS.md` | E2E 未完了明示 |

### C. 別コミット（既存 · push 待ち）

- `7858bf8` — Pages Free ガードレール（`main` ahead 1）

---

## コミットしない

| パス | 理由 |
|------|------|
| `.env.sync.local` | Git 無視 · 秘密 |
| `Timelist01.txt` | 作業メモ |
| `tmp/**` | 一時検証 |
| `dist-sync/**` | ビルド成果物 |

### D. 削除（意図的 · `chore(sync): drop .env.sync.example` または B に含めて可）

| ファイル | 理由 |
|----------|------|
| `.env.sync.example` | どのスクリプトも未参照 · プレースホルダー誤貼りリスク · SSOT は `SYNC_ENV_KEYS.md` |

---

## デプロイ後に更新

1. `DEPLOY_LOG.md` — `DEPLOY-20260626-003` を `executed` + `cf_deployment_id`
2. `SYNC_S1_E2E_CHECKLIST.md` — E2E 完了チェック
3. `SYNC_S1_ARCHITECTURE.md` §5-2 — `[x]` 化
4. `TAISHO_PENDING_TASKS.md` §C — S1 E2E `[x]`
