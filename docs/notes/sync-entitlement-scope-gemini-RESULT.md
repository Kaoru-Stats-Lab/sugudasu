# SUGUDASU Sync — 権利・trial スコープ（Gemini 結果）

**生成:** 2026-06-26（Gemini · プロンプト: [`docs/prompts/sync-entitlement-scope-gemini-grok-prompt.md`](../prompts/sync-entitlement-scope-gemini-grok-prompt.md)）  
**ステータス:** 全文受領 · **提督 案 C 確定**（実装は S-A' · S3 で S-D 再評価）

> **Gemini 推奨 S-D** は調査正本として温存 · **採用は S3 ゲート**。確定 SSOT: [`SYNC_STORAGE_QUOTAS.md`](SYNC_STORAGE_QUOTAS.md) §3-1a  
> Grok: [`sync-entitlement-scope-grok-RESULT.md`](sync-entitlement-scope-grok-RESULT.md) §13

---

## §1 Executive Summary

本案では、幹事ペルソナの「年数回の利用・複数製品の同時並行需要」と「悪用によるリソース枯渇防衛」を両立するため、**「S-D: ハイブリッド型（Trialはアカウント制限、Activeは製品別ウォレット管理）」** を推奨スコープとして明示する。

他社ベンチマーク（Figmaの製品別シート課金やイベント都度課金SaaSのチケット制）の調査に基づき、悪用リスクが高いTrialは「アカウント全体で同時1ルーム」に絞ってコストを徹底防衛する。一方で、課金権利（Entitlement）はStripeのマルチプロダクト構成と1:1で対応する製品別ウォレット型（`product_type` 単位）で数える。これにより、2製品目（group）ローンチ時のスキーマ拡張性を担保し、幹事が「進行（timeline）」と「班分け（group）」を同一イベント内でストレスなく同時併用できるUXを実現する。

---

## §2 候補スコープ比較マトリクス

| スコープ | trial 数え方 | 課金権利 | DB 変更 | Stripe 連携 | 幹事UX | コスト防衛 | 2製品目 launch | 総合 |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **S-A** アカウント全体 | 全製品で同時1 | 全製品で同時3（プール） | 小 | 単純 | × | ◎ | △ | △ |
| **S-B** 製品別 | 製品ごとに同時1 | 製品ごとに同時3 | 中 | 並列 | ◯ | × | ◯ | △ |
| **S-C** ウォレット | Trial除外 | `product_type`別残高 | 大 | 柔軟 | △ | ◯ | ◯ | ◯ |
| **S-D ハイブリッド（推奨）** | **全製品で同時1** | **`product_type`別枠** | 中 | 標準 | ◎ | ◎ | ◎ | **◎** |
| **S-E** 都度払型 | 初回1回のみ | 使い切りチケット | 大 | 単純 | ◯ | ◎ | ◎ | ◯ |

### 比較調査ファクト

* **Notion** — Workspace 単位プラン · Trial はアカウント全体で厳制限
* **Figma** — 製品別 SKU · 無料枠は製品別制限
* **Airtable** — Workspace 内の「量」で制限
* **Canva** — アカウント単位の Pro ロック
* **Basecamp** — 定額・全機能のシンプルモデル
* **Stripe Billing** — Customer＝人 · Subscription Item＝製品権利
* **イベント都度課金 SaaS** — チケット/従量 · 非稼働ルームは原価ゼロ

---

## §3 推奨 SSOT 草案（SUGUDASU Sync · β→S3）

### 3-1. 採用スコープ（S-D）と却下理由

* **S-D採用:** 課金枠は製品別（価格差別化 · timeline+group 併用）。Trial はアカウント横断1（コスト防衛）。
* **S-B却下:** 製品別 trial → 無料3ルーム常時占有 · 悪用コスト3倍。
* **2製品目試用:** trial ルームの `product_type` 切替（排他）または active 顧客向け期間限定アクティベーション。

### 3-2. 数値表

| 状態 | スコープ | 同時上限 | 備考 |
| :--- | :--- | :--- | :--- |
| **trial** | アカウント全体 | **1** | 未課金 · 製品横断 |
| **active**（timeline） | 製品別 | **3** | サブスク or イベントチケット |
| **active**（group） | 製品別 | **3** | 同上 |
| **active**（schedule） | 製品別 | **3** | 同上 |

### 3-3. `user_entitlements` スキーマ追記案

```sql
ALTER TABLE public.user_entitlements
  ADD COLUMN IF NOT EXISTS product_type text NOT NULL DEFAULT 'timeline'
    CHECK (product_type IN ('timeline', 'group', 'schedule')),
  ADD COLUMN IF NOT EXISTS stripe_price_id text,
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'expired', 'cancelled'));

CREATE INDEX IF NOT EXISTS user_entitlements_lookup_idx
  ON public.user_entitlements (user_id, product_type, expires_at)
  WHERE status = 'active';
```

**データ例:**

| 列 | 例 |
|----|-----|
| user_id | `auth.users.id` |
| type | `subscription` |
| product_type | `group` |
| quantity | `3` |
| stripe_price_id | `price_…` |
| expires_at | `2026-07-27` |

### 3-4. quota トリガー変更案（疑似 SQL）

Gemini 案を **`retain_until > now()` 条件付き**に修正（現行 `SYNC_STORAGE_QUOTAS` と整合）:

```sql
CREATE OR REPLACE FUNCTION public.sync_count_active_rooms(
  p_owner_id uuid,
  p_product_type text DEFAULT NULL,
  p_entitlement text DEFAULT NULL
) RETURNS integer
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT count(*)::integer
  FROM public.sync_rooms r
  WHERE r.owner_id = p_owner_id
    AND r.retain_until > now()
    AND (
      (p_entitlement = 'trial' AND r.entitlement = 'trial')
      OR (
        p_entitlement = 'active'
        AND r.entitlement = 'active'
        AND r.product_type = p_product_type
      )
      OR (p_entitlement IS NULL)  -- 後方互換 · β
    );
$$;
```

**判定ルール:**

- **trial ルーム作成:** `sync_count_active_rooms(owner, NULL, 'trial') >= 1` → 拒否
- **active ルーム作成:** `sync_count_active_rooms(owner, product_type, 'active') >= limit` → 拒否（limit は `user_entitlements.quantity` または既定3）

### 3-5. UI 露出（最小開示 · 事実のみ）

Gemini の長文エラーは **採用しない**（`SYNC_RETENTION_POLICY` §3-2 整合）。実装は次のトーン:

| 画面 | 表示（例） |
|------|------------|
| ルーム一覧上部 | `試用 0/1` · `進行 2/3` · `班分け 3/3`（極小 · 製品名は concept） |
| 作成ロック | 「同時上限に達しています」（1行） |
| 編集画面上部 | `同期: 正常` · `容量 87%`（EDIT-IND-01） |
| 保存失敗 | 「保存できませんでした」（容量超過時のみ補足1行） |

### 3-6. Stripe（S3）

**Checkout metadata:**

```json
{
  "client_reference_id": "<auth.users.id>",
  "metadata": {
    "product_type": "group",
    "sku": "group_pro_sub_monthly"
  }
}
```

**Webhook:** `user_entitlements` に `product_type` 付き INSERT/UPDATE · `type` = `subscription` | `per_event`（既存列）併存。

---

## §4 移行・段階導入

### β（今 · Stripe なし · timeline のみ）

1. `user_entitlements` に列追加（DEFAULT `timeline`）
2. トリガーを S-D ロジックに差し替え（1製品のみなら **挙動は実質同じ**）
3. `sync_profiles` bootstrap 完了を前提

### 2製品目（group）前

1. `/e/{event_public_id}` → `product_type` で `/timeline/app` | `/group-split/app` へ 302（`SYNC_URL_INFORMATION_ARCHITECTURE` · **Next.js ではなく CF/Pages**）
2. ルーム作成時にコンテキストから `product_type` を注入
3. trial `product_type` 切替 UI（排他1ルーム）— 要設計

### S3（課金）

1. `checkout.session.completed` → entitlements INSERT
2. `invoice.payment_failed` / `subscription.deleted` → `status=expired`
3. `expires_at < now()` → ルーム `entitlement=expired`（読取専用 grace · `SYNC_RETENTION_POLICY` §3-1 と整合）

---

## §5 未決・要提督判断

1. **expired ルーム** — 即ロック vs 読取専用 grace → 既決 §3-1（読取専用）と整合 · **採用可**
2. **統合パック SKU** — Webhook で entitlements **2行 INSERT** 推奨（`product_type=all` は却下候補）
3. **都度チケット vs 月額** — `user_entitlements.type` = `per_event` | `subscription` **併存**（`SUGUDASU_SYNC_LINE` 主導線は都度）
4. **Sybil / Trial 量産** — IP レートリミット vs 許容 · Turnstile は当日避けたい

---

## §6 参考 URL

* [Stripe Billing — 料金モデル](https://docs.stripe.com/billing/subscriptions/models)
* [Stripe — subscription_items](https://docs.stripe.com/api/subscription_items)
* [Supabase — RLS とトリガー](https://supabase.com/docs/guides/database/postgres/row-level-security)

---

## §11 Agent 照合（2026-06-26）

| 論点 | Gemini | リポジトリ | 判定 |
|------|--------|------------|------|
| 推奨スコープ S-D | trial 横断1 · active 製品別 | 提督 **案 C** | **S3 まで保留** · β は S-A' |
| trial 上限1 | アカウント横断 | トリガー実質一致 | **β 維持** |
| active ×3 / 製品 | product_type 別 | 未実装 | **S3 + 2製品目** |
| `retain_until` in count | **欠落**（Gemini 3-4 原文） | SSOT 必須 | **修正済み** §3-4 |
| UI 長文エラー | 3-5 に FAQ 調 | §3-2 最小開示 | **短文化** §3-5 |
| Next.js Rewrites | §4 に記載 | 素 JS · CF Pages | **却下** · URL IA 正本を参照 |
| ON CONFLICT upsert | 3-6 | UNIQUE 制約なし | **S3 前に制約設計** |
| expired 読取専用 | §5-1 | `SYNC_RETENTION_POLICY` §3-1 | **整合** |
| `auth.users.id` 正本 | 変更なし | §5-6 | **維持** |

**SSOT 確定:** [`SYNC_STORAGE_QUOTAS.md`](SYNC_STORAGE_QUOTAS.md) §3-1a · [`SYNC_DB_ARCHITECTURE.md`](SYNC_DB_ARCHITECTURE.md) §2-3

## §14 提督決定（2026-06-26）

**案 C（段階）** — Cursor 実装方針を支持。

| フェーズ | スコープ |
|----------|----------|
| β〜2製品目 | **S-A'** — active プール3 · トリガー現状 · UI 単一 X/Y |
| 先行 | `user_entitlements.product_type` 等（参照 · Stripe 着地） |
| S3 | **クラスター別** SKU（横断バンドルなし）· 製品別必須なら **S-D 再評価**（本 RESULT §3） |
