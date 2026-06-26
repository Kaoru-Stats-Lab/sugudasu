# Sync Supabase — 一時停止回避 · バックアップ方針

**更新:** 2026-06-26  
**対象:** SUGUDASU Sync **専用** Supabase プロジェクト（ASL 本番 DB とは別）  
**関連:** [`SYNC_ENV_KEYS.md`](SYNC_ENV_KEYS.md) · [`SYNC_INFRA_CLOUDFLARE.md`](SYNC_INFRA_CLOUDFLARE.md)

---

## 1. 制約の正確な理解（Free プラン）

| 項目 | 内容 | 根拠 |
|------|------|------|
| **一時停止** | **1 週間** API / DB / Edge Functions の活動がないと **Paused** | [Supabase Pricing](https://supabase.com/pricing) |
| **データ** | 一時停止時も **削除されない**（ダッシュボードから **Restore** 可能） | 公式 Pricing · コミュニティドキュメント |
| **自動バックアップ** | **Free には含まれない**（Pro で 7 日保持） | 同上 |
| **復旧時間** | 停止後の初回リクエストで **数十秒** のウェイクアップがあり得る | 運用報告 |

**結論:** 「1 週間で DB が消える」ではなく **インフラが止まる**。ただし Sync 本番では **ログイン不能・ルーム保存不能** になるため、回避は必須。

---

## 2. 回避策（推奨順）

### 2-1. 週次 keepalive（採用 · コスト $0）

**方針:** 7 日以内に **必ず 1 回以上** Supabase へ API リクエストを送る。

| 手段 | 実装 | 頻度 |
|------|------|------|
| **GitHub Actions**（正本） | [`.github/workflows/supabase-sync-keepalive.yml`](../../.github/workflows/supabase-sync-keepalive.yml) | 週 2 回（月・木 12:00 UTC） |
| **ローカル手動** | `npm run keepalive:supabase-sync` | 旅行前など |
| **本番ヘルス** | `GET https://sync.sugudasu.com/api/health` | **Supabase には届かない**（CF Functions のみ） |

**Secrets（GitHub リポジトリ）**

| Secret | 内容 |
|--------|------|
| `SYNC_SUPABASE_URL` | `https://xxxx.supabase.co` |
| `SYNC_SUPABASE_ANON_KEY` | anon 公開鍵（service_role **禁止**） |

**注意:** `/api/health` だけでは **タイマーはリセットされない**。keepalive は **Supabase REST への直接 ping** が必要。

### 2-2. Pro へ昇格（本番データ・課金ユーザーが乗ったら）

| メリット | 内容 |
|----------|------|
| 一時停止なし | Pausing: **Never** |
| 自動バックアップ | **7 日**（Pro 標準） |
| 運用負荷 | keepalive ワークフローは **任意で停止**可 |

**目安:** Sync に **有料ユーザー・本番イベントデータ**が載る段階で Pro（~$25/月/プロジェクト）を検討。

### 2-3. 手動バックアップ（Free でも推奨 · 重要変更前）

| 方法 | いつ | 保存先 |
|------|------|--------|
| **Supabase Dashboard → Database → Backups** | Pro 移行後 | マネージド |
| **`supabase db dump`（CLI）** | マイグレーション前 · 大量テストデータ投入前 | 提督端末 · **Git 禁止** · 暗号化ディスク |
| **Table CSV export** | 緊急・少数テーブル | 同上 |

**Free での答え:** 自動バックアップは **ない** が、**手動 dump は取るべき**（スキーマ変更 · 本番データ投入 · Pro 移行前）。一時停止はデータ破壊ではないが、**運用停止リスク**は別問題。

---

## 3. Agent / 提督チェックリスト

| # | 確認 |
|---|------|
| K1 | GitHub Actions `Supabase Sync Keepalive` が **有効**（Secrets 設定済み） |
| K2 | 直近 run が **Success**（Actions タブ） |
| K3 | 7 日以上開発休止する前に `npm run keepalive:supabase-sync` を手動実行 |
| K4 | マイグレーション適用前に **手動 dump**（または Pro バックアップ） |
| K5 | **service_role** を keepalive · GHA · クライアントに載せない |

---

## 4. 変更履歴

| 日付 | 内容 |
|------|------|
| 2026-06-26 | 初版 · GHA keepalive · Free/Pro 方針 |
