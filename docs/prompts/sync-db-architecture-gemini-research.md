# Gemini依頼用: Sync ライン — DB構成のメタ設計（ポートフォリオ横断）

**用途:** システムアーキテクチャ調査 — **単一プロダクトの実装案**ではなく、**個人開発・低予算 SaaS** における Postgres（Supabase）のデータ設計パターン比較  
**前提 SSOT:** `docs/notes/SYNC_S1_ARCHITECTURE.md` · `SYNC_RETENTION_POLICY.md` · `SYNC_STORAGE_QUOTAS.md` · `SUGUDASU_SYNC_LINE.md`  
**更新:** 2026-06-25

---

## 提督の問い（調査前の仮説）

> イベントごとに DB が膨らむ設計は避けたい。課金ユーザにもクラウド保存上限を設け、長期ログはユーザーが JSON で持つ。  
> この方針はメタ的に正しいか？ Supabase/Postgres では **テーブル構成をどう揃えるべきか**（複数 Sync 製品を見据えて）。

**現行案（S1）:**

- 固定2テーブル: `sync_rooms`（メタ + entitlement + `retain_until`）+ `sync_room_states`（`revision` + `payload` jsonb 1行/ルーム）
- イベント = **行**（PostgreSQL テーブルは増やさない）
- trial 同時1枠 · 課金 active 同時3枠 · payload 512KiB · 期限後パージ
- 版歴はサーバに積まず · クライアント JSON エクスポート

---

## Gemini への依頼文（コピペ用）

```text
あなたは B2B/B2Pro 向けマルチテナント SaaS と Postgres（Supabase 含む）のデータアーキテクト調査アシスタントです。
礼賛・前置き・記事本文は不要。指定フォーマットの表と箇条書きのみ。不明は「要確認」、推測は「推測」と明記。

【調査のスコープ】
- **メタ視点**: 1製品だけでなく「個人開発・月額インフラ数千円以内」の Sync 系製品群に共通する DB パターン
- **技術スタック前提**: Supabase Auth + Postgres RLS + PostgREST クライアント直叩き · API は Cloudflare Pages Functions（課金 Webhook のみ）
- **ビジネス前提**: イベント単位課金（都度）中心 · 無期限クラウド保存は提供しない · 長期データはユーザー側 JSON/ファイル

【我々の製品ポートフォリオ（Sync 候補）】
| ID | 製品 | コアデータ | Sync で共有するもの |
|----|------|------------|---------------------|
| T13-S | イベント進行表 Sync | TimelineState JSON | 多端末同期 · 閲覧 URL |
| T11-S（将来） | 班分け Sync | 名簿 + 班割当 JSON | 幹事複数人 · 当日再編 |
| X02-S（将来） | 日程テンプレ Sync | 小さな JSON | テンプレ共有 |

コア製品は **localStorage のみ（非送信）**。Sync は **短期クラウドバッファ**。

【現行スキーマ案（批判的に評価せよ）】
- sync_rooms: id, owner_id, title, entitlement, event_date, retain_until, stripe_customer_id
- sync_room_states: room_id PK, revision, payload jsonb（最新1版のみ）
- クォータ: INSERT トリガーでアクティブルーム数 · payload バイト上限
- 削除: 手動 DELETE + retain_until 経過後バッチパージ

【調査の核心質問】

Q1. マルチテナント Postgres で「イベント/プロジェクト1件」のデータを載せるとき、
    次のどれが **低トラフィック・低予算** に最適か？ 代表例・失敗例つきで比較せよ。
    (A) 固定スキーマ + 行/ルーム + jsonb blob（我々案）
    (B) 固定スキーマ + 正規化テーブル（行=コマ、列=フィールド）
    (C) テナント/イベントごとに PostgreSQL schema 分離
    (D) テナント/イベントごとに物理テーブル分離
    (E) ドキュメント DB 型（1 event = 1 document、Firestore 等）を Postgres でエミュレート
    (F) ホット Postgres + コールド Object Storage（R2/S3）に JSON アーカイブ

Q2. **保持期限（TTL）・同時件数上限・ペイロード上限** を DB で強制するベストプラクティスは？
    （アプリ層のみ vs RLS vs trigger vs 定期ジョブ · 業界の定番パターン名があれば記載）

Q3. **課金 entitlement** は `room` 行に持つべきか `user/profile` 行に持つべきか？
    イベント単位課金（Stripe Checkout 1回=1イベント）と月額サブの両方を見据えた推奨。

Q4. **revision / 同期** 向けに、サーバ側で版歴テーブルを作る境界線はどこか？
    （最新1版のみ + クライアントエクスポート vs event sourcing vs snapshot 履歴）

Q5. 複数 Sync 製品（進行表・班分け・日程）を **1 Supabase プロジェクト** に載せる場合の
    テーブル命名・共通 `profiles` / `billing` 層の推奨パターンは？

Q6. Supabase 無料/Pro 枠における **現実的な上限設計**（同時ルーム数 · jsonb サイズ · 行数）の目安は？
    根拠は Supabase 公式ドキュメント・コミュニティベンチマーク・「推測」明示。

【必ず参照・比較する製品/パターン（公開情報のみ）】
| 参照対象 | 観点 |
|----------|------|
| Rundown Studio / Shoflo 系 | イベントデータのクラウド保持の仕方（推測可·要ラベル） |
| Notion / Coda / Airtable | workspace + page/document モデル |
| Firebase / Supabase Realtime 公式例 | document-per-room パターン |
| Stripe + usage-based / per-seat / per-event 課金 | entitlement の置き場 |
| 「ephemeral collaboration」系（Miro board 期限など） | TTL・エクスポート訴求 |

【出力1】データ配置パターン比較表（Q1）
列: パターン | 初期実装コスト | 運用コスト（DB容量） | クエリ/同期のしやすさ | RLS の書きやすさ | 個人開発向け総合 | 代表採用例

【出力2】TTL・クォータ実装パターン比較表（Q2）
列: 方式 | 強制力 | 実装難度 | Supabase との相性 | 推奨フェーズ（MVP/成長期）

【出力3】entitlement 配置の推奨（Q3）
- 表: 課金モデル × room 行 / user 行 / 別 `purchases` テーブル
- **推奨1案**（200字）+ 我々現行案からの修正点（あれば）

【出力4】版歴の要否マトリクス（Q4）
行: ユースケース（監査 · 巻き戻し · 同期競合 · コンプライアンス）
列: 最新1版のみ | snapshot 履歴 | event log | 推奨

【出力5】ポートフォリオ共通スキーマ案（Q5）
- 推奨 ER 概要（テキストまたは mermaid）
- 共通テーブル案: profiles, sync_rooms 汎用化の可否, product_type 列の要否
- **命名規則** 1段落

【出力6】数値の推奨レンジ（Q6）
| 項目 | 保守的 | 積極的 | 根拠 |
（同時ルーム/ユーザー · jsonb KiB · 保持日数 · パージ頻度）

【出力7】我々現行案への判定
| 論点 | 判定（◎/○/△/×） | 理由1行 | 変更提案（あれば） |
（固定2テーブル · jsonb blob · トリガークォータ · ユーザー JSON エクスポート · 版歴なし · room 単位 entitlement）

【出力8】結論（300字以内）
「個人開発 Sync ラインの Postgres SSOT として何を採るべきか」— メタ原則を3条。

【禁止】
- 我々が採用しない RevenueCat を推奨しない
- 無制限クラウドストレージを前提にしない
- エンタープライズ専用（Kubernetes マルチリージョン等）の過剰構成をデフォルト推奨しない
```

---

## Cursor（システムアーキテクト）暫定見解 — Gemini 結果待ち

Gemini 結果は `docs/notes/sync-db-architecture-gemini-RESULT.md` に貼る。  
採否は提督 + Cursor が SSOT に反映。

| 論点 | 暫定判定 | メモ |
|------|----------|------|
| 固定スキーマ + 行/イベント | ◎ | テーブル増殖は運用・マイグレーション地獄 |
| jsonb 最新1版 | ○（S1–S2） | 正規化は検索・集計が要るまで後回し |
| TTL + クォータ + エクスポート | ◎ | コストと mental model の三要素 |
| entitlement on room | △ | イベント課金なら `purchases` 中間表の方がきれい（Gemini に聞く） |
| 版歴なし | ○ | 進行表は「今」の共有が価値 · 監査要件は低い |

---

## 結果の貼り付け先

`docs/notes/sync-db-architecture-gemini-RESULT.md` — **済（2026-06-25）** · 採否は `SYNC_DB_ARCHITECTURE.md`

---

## 関連

| パス | 内容 |
|------|------|
| `docs/prompts/GEMINI_COLLABORATION_GUIDE.md` | 依頼の型 |
| `docs/GEMINI_SESSION_SNAPSHOT.md` | セッション再添付用 |
