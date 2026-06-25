# Sync系プロダクト共通 — メタ基盤ガードレール

**更新:** 2026-06-25  
**用途:** T13-S だけでなく、将来の T11-S / X02-S など Sync 系全体で再利用する共通規律  
**関連:** `SYNC_DB_ARCHITECTURE.md` · `SYNC_EVENT_ID_AND_DASHBOARD_POLICY.md` · `SYNC_URL_INFORMATION_ARCHITECTURE.md`

---

## 1. 共通基盤スキーマ（MECE）

| 層 | 必須テーブル/責務 | SUGUDASU Sync 現状 |
|----|-------------------|--------------------|
| テナント・認証・認可 | users/profiles + memberships + RLS | **部分対応**（個人前提。組織membershipはS2+） |
| 契約・プラン・クォータ | entitlements + quotas + cap強制 | **対応中**（`user_entitlements` / `staff_device_cap`） |
| 監査・アクティビティ | 監査証跡（誰が何を変更） | **未導入**（βは軽量運用） |
| メタ設定・拡張 | tenant/product settings jsonb | **未導入**（必要最小） |
| 揮発性セッション | ephemeral state + TTL purge | **対応**（`retain_until`・接続TTL設計） |

---

## 2. 抜け落ちやすい死角（Sync共通）

| 分類 | 事故 | 防衛策（採用方針） |
|------|------|--------------------|
| セキュリティ | ID列挙攻撃 | `event_public_id` を `^se_[a-z0-9]{12}$` 固定 |
| セキュリティ | RLS多段JOINで劣化 | 早期は owner直結、将来membershipはJWTクレーム最適化 |
| 法務 | 削除権の残存 | 最新1版 + エクスポート前提 + 短期保持 |
| 法務 | データローカリティ | Supabaseリージョンを明示固定（東京） |
| インフラ | jsonb index肥大 | 必要キーのみ物理列化してB-Tree |
| インフラ | TOAST負荷 | 高頻度状態は Presence 等で吸収、DBは確定時のみ |
| 運用 | profiles競合 | 共通最小 + 製品拡張テーブル分離 |
| 運用 | tenant跨ぎ更新事故 | tenant bind 必須化（将来ORM規律） |

---

## 3. jsonb運用ガード（Sync共通）

1. **入口/出口の二重検証**  
   - 入口: TS/Zod  
   - 出口: DB check（必須キー・正規表現・サイズ）
2. **payload version 常設**  
   - `version` キーで将来変換を吸収
3. **更新頻度で物理分離**  
   - 頻繁更新データと長期データを同一blobに混ぜない

---

## 4. 今すぐ境界値検証すべき優先分類

**最優先は A（セキュリティ）と C（インフラ・コスト）**。

### 4-1. A（セキュリティ）を最優先にする理由

- URL共有型サービスでは ID 設計ミスが即漏洩に直結する
- `event_public_id` の制約、`23505` リトライ、`/e/*` noindex を先に固めるべき

### 4-2. C（インフラ・コスト）を次点で検証する理由

- Free枠500MBのため、jsonb/TOAST負荷の失敗耐性が低い
- Presence活用・DB非テレメトリ保存を早期に確認すべき

---

## 5. T13-S（Syncイベント進行）への適用確認

| 項目 | 判定 | 補足 |
|------|------|------|
| event_public_id ランダム化 | **OK（方針済）** | DDL実装は次ステップ |
| 共有URL固定 `/e/{event_public_id}` | **OK（方針済）** | ルータ実装は次ステップ |
| 端末上限cap | **OK（方針済）** | claim/release RPC 実装待ち |
| βメトリクスのDB非保存 | **OK（方針済）** | Cloudflare側計測導線を実装予定 |
| Tool Admin最小情報 | **OK（方針済）** | Presence表示実装待ち |

