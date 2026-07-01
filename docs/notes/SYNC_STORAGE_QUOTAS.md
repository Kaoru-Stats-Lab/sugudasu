# SUGUDASU Sync — 保存上限・エクスポート（クォータ）

**更新:** 2026-06-26（§3-1b 案 C 確定 · 提督）  
**関連:** `SYNC_RETENTION_POLICY.md` · `SUGUDASU_SYNC_LINE.md` §4

---

## 1. 用語の整理（「テーブル」≠ PostgreSQL テーブル）

| 言い方 | 実体 |
|--------|------|
| ユーザー mental model の「イベント1件」 | `sync_rooms` の **1行** + `sync_room_states` の **1行** |
| Supabase 上のテーブル | **固定2枚のみ**（`sync_rooms` · `sync_room_states`）— イベントごとに増えない |
| 上限の対象 | **アクティブなルーム行数**（オーナーあたり）· **payload サイズ**（ルームあたり） |

DB 維持コストは **行数 × jsonb サイズ × 保持日数** で決まる。無制限ルームは採用しない。

---

## 2. 原則

| 原則 | 内容 |
|------|------|
| **課金 ≠ 無制限クラウド** | 有料でも同時保持ルーム数に上限 |
| **長期ログはユーザー保管** | 終了前後に **JSON エクスポート** → ローカル / Drive 等 |
| **サーバは作業用バッファ** | 当日〜数日の共有 · それ以降はエクスポート前提 |
| **上限は DB で強制** | アプリ UI だけに頼らない（トリガー） |

---

## 3. クォータ（案 · 提督調整可）

### 3-1. 同時アクティブルーム数（`sync_rooms` 行）

**アクティブ** = `retain_until > now()` のルーム（パージ前）。

#### 3-1a. スコープ — **確定（提督 2026-06-26 · 案 C）**

**調査:** [`sync-entitlement-scope-gemini-RESULT.md`](sync-entitlement-scope-gemini-RESULT.md) · [`sync-entitlement-scope-grok-RESULT.md`](sync-entitlement-scope-grok-RESULT.md)  
**実装:** Cursor（β〜2製品目は **S-A'** · トリガー現状維持）

> **案 C:** β〜2製品目は **S-A'**（active **アカウントプール**）· `product_type` は参照のみ先行追加 · **S3** で製品別 SKU が必須なら **S-D** を再評価。  
> **製品クラスター:** Timeline+Schedule の横断併用は想定しない（[`SUGUDASU_SYNC_LINE.md`](SUGUDASU_SYNC_LINE.md) §3-0b）— プール枠はインフラ共通枠。

| 状態 | 数え方 | 同時上限 | フェーズ |
|------|--------|----------|----------|
| **trial** | アカウント横断（`product_type` 不問） | **1** | β〜 |
| **active** | **アカウントプール**（製品横断） | **3** | β〜2製品目 |
| **active** | `product_type` 別（S-D） | 3 / 製品 | **S3 再評価時のみ** |

**実装拘束（Cursor）:**

| 項目 | β〜2製品目 | やらない |
|------|------------|----------|
| `sync_count_active_rooms` | **現行維持**（`owner_id` + `retain_until > now()`） | product_type での active 分離 |
| `user_entitlements` | `product_type` · `stripe_price_id` · `status` **列追加**（着地・参照） | クォータ判定への結合 |
| `sync_rooms.product_type` | 作成コンテキストから注入 · `/e/` ルーティング | — |
| UI 枠表示 | **単一** `残り X/Y`（極小） | 製品別「進行 2/3 \| 班分け 3/3」 |
| 超過時 | 1行ロック + **既存ルーム整理提案**（Grok §5） | quota 哲学の長文 |

| プラン | 上限 | 備考 |
|--------|------|------|
| **trial** | **1** | アカウント横断 |
| **active** | **3** | **プール**（timeline+group 合算） |
| **将来 Pro** | **5** | 未 GO · 横断プール想定 |

**新規ルーム作成時:** 上限超過 → `room_quota_exceeded`（削除 or エクスポート後に再試行）。

**イベント単位課金（¥980/件）:** 1 決済 = 1 ルーム枠の **延長 + active 化** が基本。同時 3 枠までスタック可 · 4 件目は古いルームを消すかエクスポート後削除。

### 3-2. payload サイズ（`sync_room_states.payload`）

| 項目 | 上限 |
|------|------|
| **1ルームあたり jsonb** | **512 KiB**（UTF-8 実バイト） |
| 超過時 | 保存拒否 · UI で「エクスポートしてルームを整理」 |

進行表1件分として十分 · 画像バイナリは載せない（コア方針と同じ）。

### 3-3. 保持期限との組み合わせ

期限・上限は **別軸**（`SYNC_RETENTION_POLICY.md`）:

- **期限** — いつ自動パージするか（`retain_until`）
- **上限** — 同時に何件持てるか（本書）

---

## 4. JSON エクスポート（ユーザー側アーカイブ · S1+）

クラウドから消える前に **幹事が自分で保存**する正規手段。

### 4-1. ファイル形式

```json
{
  "sugudasuSyncExport": 1,
  "exportedAt": "2026-06-25T12:00:00.000Z",
  "room": {
    "id": "uuid",
    "title": "第10回 総会",
    "eventDate": "2026-06-20",
    "entitlement": "active",
    "retainUntil": "2026-06-27T23:59:59.000Z"
  },
  "timeline": {
    "revision": 42,
    "payload": { }
  }
}
```

- `payload` — コア `TimelineState` と同型（`timeline-engine.js`）
- 拡張時は `sugudasuSyncExport` をインクリメント

### 4-2. UI

| 操作 | 動作 |
|------|------|
| **エクスポート** | 上記 JSON を `sugudasu-sync-{slug}-{date}.json` で DL |
| **インポート** | 新規ルーム作成 or コア `/timeline` へ取込（S2+） |
| **削除の前** | 確認ダイアログで「エクスポートしましたか？」を促す（任意チェック） |

### 4-2b. ダウングレード後に Sync JSON を再アップロードするか（提督 Q&A · 2026-06-26）

**技術的には UI があれば画面に出せる。** ただし **エクスポート JSON に書かれた課金メタ（`entitlement: active` · 長い `retainUntil`）をそのまま復元してはいけない** — 無料枠の抜け道になる。

| 経路 | ダウングレード後 | 業界判断 |
|------|------------------|----------|
| **コア `/timeline` へ取込** | **可**（localStorage · サーバ負荷ゼロ） | ◎ データポータビリティの正道 |
| **Sync クラウドへ再保存** | **trial 枠のみ**（同時1ルーム · trial `retain_until` · `entitlement=trial`） | △ 可だが **有料相当にはしない** |
| **grace 中（`expired` · 読取専用）** | **クラウドへの import+保存は不可** | ◎ オフボーディングの read-only と整合 |
| **JSON 内の `entitlement` / `retainUntil` を信頼** | **禁止** — インポート時は捨ててサーバ側で再計算 | ◎ Jotform 型の「無料で有料容量復活」防止 |

**画面に出るか:** ログイン →（quota 内で）新規ルーム → JSON 取込 → 保存できれば **Sync UI に表示される**。ただし **ライブ同期 · 閲覧 URL · 端末 cap · 長期保持** は `user_entitlements` / 新規 Checkout なしでは付かない。

**業界のふつう:**

- **エクスポートは downgrade 前に** — Zenovay · Typeform 等はプラン変更前の export を推奨
- **無料枠は容量・機能で制限** — 超過データは非表示 or アップグレード要求（Jotform）
- **再アップロードで有料特権を復元させない** — メタデータより **サーバ側の entitlement 正本**
- **ローカル持ち帰りは歓迎** — Google Forms 型 · コア無料への取込は問題なし

**S2+ 実装拘束:** `sugudasuSyncExport` ファイル取込 UI は **(1) grace 中は save 拒否** · **(2) import 時に room メタを trial 初期化** · **(3) 同期系は entitlement ゲート**。

---

### 4-3. 運営指針（ユーザー向け FAQ には載せない）

**正本は運営内規。** LP · アプリ内 FAQ にそのまま貼らない（§3-2 [`SYNC_RETENTION_POLICY.md`](SYNC_RETENTION_POLICY.md)）。

| 指針（運営） | ユーザーに見せる代替 |
|--------------|---------------------|
| 長期ログは端末側 JSON | ルームの **保持期限** 日付 · 必要時のみエクスポート導線 |
| クラウドは共有用バッファ | 法務文書の要約のみ · 製品 UI では説教しない |
| 課金＝同期・共有の対価（永久ストレージではない） | LP は **価値訴求** · ストレージ哲学の FAQ 化はしない |

---

## 5. DB 実装

マイグレーション: `supabase/migrations/20260625_sync_quotas.sql`

| 仕組み | 内容 |
|--------|------|
| `sync_enforce_room_quota()` | `INSERT` 前 · オーナーのアクティブルーム数を数える |
| trial 上限 | 1 |
| active 上限 | 3 |
| `sync_enforce_payload_size()` | `INSERT`/`UPDATE` 前 · `octet_length(payload::text)` ≤ 512KiB |

クライアントは `23514`（check_violation）を `room_quota_exceeded` / `payload_too_large` にマップ。

---

## 6. S3 課金との接続

1. Stripe Checkout 完了 → Webhook が対象ルームの `entitlement=active` · `retain_until` 延長  
2. 同時 active 枠は **3** — 4 件目の新規イベントは **別ルーム削除** or **別アカウント**（FAQ で明示）  
3. 月額 Pro を出す場合も **5 枠 cap** を維持（DB 定数を1箇所で変更）

---

## 7. 受け入れ

- [ ] trial ユーザーが 2 件目作成 → エラー + 「削除またはエクスポート」案内
- [ ] 課金 active が 4 件目 → 同上
- [ ] エクスポート DL が上記スキーマに準拠
- [ ] 512KiB 超の保存 → 拒否

---

## 8. 変更履歴

| 日付 | 内容 |
|------|------|
| 2026-06-26 | §4-2b 再インポートは trial 枠のみ · JSON 課金メタは無効 |
| 2026-06-26 | §4-3 を運営内規化 · ユーザー FAQ 化しない方針 |
| 2026-06-25 | 初版 — ルーム数上限 · payload cap · JSON エクスポート SSOT |
