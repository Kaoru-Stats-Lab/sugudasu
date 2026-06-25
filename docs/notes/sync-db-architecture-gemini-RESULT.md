# Sync DB アーキテクチャ — Gemini 調査結果

**日付:** 2026-06-25  
**依頼:** `docs/prompts/sync-db-architecture-gemini-research.md`  
**採否正本:** `docs/notes/SYNC_DB_ARCHITECTURE.md`

---

## §1 データ配置パターン比較表

| パターン | 初期実装コスト | 運用コスト（DB容量） | クエリ/同期のしやすさ | RLS の書きやすさ | 個人開発向け総合 | 代表採用例 |
| --- | --- | --- | --- | --- | --- | --- |
| **(A) 固定スキーマ + jsonb blob（我々案）** | **極低**（DML不要） | **中**（TOASTストレージ消費） | **高**（PostgRESTで1行落とすだけ） | **極易**（`owner_id` のみで判定） | **◎ 最適** | Firebase / Supabase のドキュメント型実装の定番 |
| **(B) 固定スキーマ + 正規化テーブル** | **高**（テーブル多数、マイグレーション要） | **低**（インデックス効率最高） | **低**（差分同期・結合処理が複雑化） | **難**（階層ごとのJOIN RLSが必要） | **△** | Notion / Airtable（メタデータ層・推測） |
| **(C) PostgreSQL schema 分離** | **極高**（マルチスキーマ管理） | **極高**（コネクションプール枯渇リスク） | **極低**（動的スキーマ切り替えがPostgRESTで難） | **非推奨**（RLSの意味をなさない） | **× 破綻** | エンタープライズB2B SaaS（Tenant-per-schema） |
| **(D) テナントごとに物理テーブル分離** | **極高**（動的DDL発行が必須） | **極高**（カタログキャッシュ肥大化、メモリ圧迫） | **極低**（クライアントコードが動的クエリ化） | **非推奨**（運用不能） | **× 破綻** | 失敗例：初期の動的DDL依存マルチテナントアプリ |
| **(E) ドキュメント DB 型（汎用KV型）** | **低**（`key`, `value` のみ） | **中**（Aと同様） | **中**（キー名衝突の管理が必要） | **易**（メタデータに所有者ID必須） | **○** | Supabase を強引にFirestore風に使う共通スキーマ |
| **(F) ホットPostgres + コールドStorage** | **高**（R2/S3連携ロジック要） | **極低**（DBサイズを最小限に維持） | **低**（読み込み時にStorageを中継） | **中**（Storage側の署名URL制御が必要） | **○** | 大規模 ephemeral ツール（一定期間後アーカイブ） |

---

## §2 TTL・クォータ実装パターン比較表

| 方式 | 強制力 | 実装難度 | Supabase との相性 | 推奨フェーズ |
| --- | --- | --- | --- | --- |
| **アプリ層のみ（Pages Functions）** | **弱**（PostgRESTを直接叩かれたらバイパスされる） | **極低** | ○（FunctionsをAPIゲートウェイ化する場合のみ有効） | プロトタイプのみ |
| **RLSチェックによるサイズ制限** | **強**（DB直前でガード） | **中**（`octet_length(payload::text)` 等の評価が必要） | ◎（`WITH CHECK` 句にサイズ制限をインライン化可能） | **MVP〜成長期（推奨）** |
| **INSERT/UPDATE トリガー（我々案）** | **最強**（トランザクション内で確実にロールバック） | **中**（クォータテーブルとの整合性、デッドロック注意） | ◎（標準的なPL/pgSQLで記述可能） | **MVP〜成長期（推奨）** |
| **定期ジョブによるバッチパージ** | **強**（過去データの非同期クリーンアップ） | **低** | △（Free枠は `pg_cron` 非対応、Cloudflare CronからAPI叩く必要あり・2026年時点要確認） | **MVP（外部Cronトリガー）** |

---

## §3 entitlement 配置の推奨

### 課金モデル別・配置適合マトリクス

| 課金モデル | room 行に直持ち | user / profile 行に直持ち | 別 `purchases` / `entitlements` テーブル |
| --- | --- | --- | --- |
| **イベント単位課金**（Stripe Checkout 都度） | ◎（購入トークンと部屋が1:1、最も直観的） | ×（複数イベントを同時並行で買えない） | ○（履歴監査には向くが、RLSが2ホップになり低速化） |
| **月額サブスクリプション** | ×（部屋を作るたびに課金状態を書き換えるのは非効率） | ◎（ユーザーが現在「Proプラン」か否かを一発判定） | ○（Stripe Webhookのイベントログをそのまま流し込む） |

### 推奨1案および現行案からの修正点

- **推奨案:** 部屋ごとの認可状態を担保する `sync_rooms.entitlement`（初期値 `'trial'`）とは別に、**独立した `user_entitlements` テーブル**を設置。Stripe Webhook から購入レコードをインサート。
- **修正点:** `sync_rooms.stripe_customer_id` は削除。`user_entitlements` を参照してクォータ枠を検証し `entitlement` を確定。

---

## §4 版歴の要否マトリクス

| ユースケース | 最新1版のみ | snapshot 履歴 | event log | 推奨 |
| --- | --- | --- | --- | --- |
| **内部監査・証明（fair-draw等）** | × | ○ | ◎ | **最新1版 ＋ クライアント側で署名付きJSONをダウンロード（DBに溜めない）** |
| **意図しない変更の巻き戻し** | × | ◎ | ○ | **最新1版 ＋ クライアント側（localStorage）にRollbackバッファ** |
| **同時編集時の同期衝突** | × | △ | ◎ | **最新1版 ＋ Last-Write-Wins（`revision` 条件付きUPDATE）** |
| **コンプライアンス（個人情報パージ）** | ◎ | × | × | **最新1版のみ（削除時の残存リスクゼロ）** |

---

## §5 ポートフォリオ共通スキーマ案

### 推奨 ER 概要

```text
[sync_profiles] (Supabase Auth 紐付け)
   id (PK, uuid) / stripe_customer_id / updated_at

[user_entitlements] (課金権利バッファ層)
   id (PK, uuid) / user_id (FK) / type (enum: 'per_event', 'subscription')
   / expires_at / quantity / stripe_checkout_session_id

[sync_rooms] (製品共通・短期バッファの部屋)
   id (PK, uuid) / owner_id (FK) / product_type (enum: 'timeline', 'group', 'schedule')
   / title / entitlement / retain_until / revision (int4) / payload (jsonb)
```

`sync_rooms` を汎用コンテナ化 · `product_type` で識別 · プレフィックス `sync_` 統一 · スネークケース徹底。

---

## §6 数値の推奨レンジ

| 項目 | 保守的（Free枠想定） | 積極的（Pro枠想定） | 根拠 |
| --- | --- | --- | --- |
| **1ユーザーあたりの同時アクティブルーム数** | 3 ルーム | 50 ルーム | Free 500MB · 悪意ループ防止 |
| **1ルームあたり jsonb** | 200 KiB | 2 MiB | 進行表300行≈50KiB未満（推測） |
| **TTL** | 3 日間 | 30 日間 | イベント前後のみ同期 |
| **パージ頻度** | 1日1回 | 1時間1回 | VACUUM 負荷分散（推測） |

---

## §7 我々現行案への判定

| 論点 | 判定 | 理由1行 | 変更提案 |
| --- | --- | --- | --- |
| 固定2テーブル構成 | ◎ | 最小インフラで複数製品ホスト | 1テーブル統合を検討（§5） |
| jsonb blob | ◎ | マイグレーション運用ゼロ | そのまま |
| トリガークォータ | ○ | 確実 · RLS併用可 | プロトタイプ検証 |
| ユーザーJSONエクスポート | ◎ | ストレージ責任の委譲 | UI常駐 |
| 版歴なし | ◎ | 容量逼迫防止 | `revision` 楽観的ロック |
| room 単位 entitlement | △ | サブスク+都度の合算で破綻 | `user_entitlements` 分離 |

---

## §8 結論（メタ原則3条）

1. **DBは「倉庫」ではなく「トランシーバー」** — TTL付き揮発バッファ · 永続化はユーザー JSON
2. **構造はJavaScriptに、Postgresにはガバナンスのみ** — jsonb blob · RLS + トリガーで上限
3. **APIを排し PostgREST+RLS 直結** — 課金 Webhook 以外は中間APIを増やさない
