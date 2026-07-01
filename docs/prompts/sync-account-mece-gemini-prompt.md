# Gemini依頼用: SUGUDASU Sync — アカウント問題の MECE 洗い出し

以下をそのまま Gemini に入力して使ってください。  
**保存先（Gemini 出力）:** `docs/notes/sync-account-mece-gemini-RESULT.md`

```text
あなたは B2B/B2C ハイブリッド SaaS のプロダクトアーキテクト兼セキュリティレビュアーです。
日本の個人開発チームが作る **SUGUDASU Sync**（イベント進行表のクラウド同期ライン）について、
**アカウントにまつわる問題・境界・未決事項** を MECE（相互排他・全体 exhaustive）に整理してください。

前置き・挨拶不要。**構造化された分析ドキュメントのみ** 出力すること。
推測は「仮説」と明記し、確定事項と混ぜないこと。

---

## 1. プロダクト思想（分析の制約 · 変更しない）

### 1-A. コア無料 vs Sync 有料（意図的な二層）

| 層 | ドメイン | 登録 | データ | 課金 |
|----|----------|------|--------|------|
| **コア SUGUDASU** | sugudasu.com | **不要** | localStorage · 非送信 | 無料 |
| **SUGUDASU Sync** | sync.sugudasu.com | **必須** | クラウド短期バッファ | 有料（Stripe · S3 以降） |

- Sync はコアの **上乗せ（任意）**。コアを人質にしない（F1 憲法）。
- コアと Sync は **エンジン共有**（timeline-engine.js）だが **アカウントは共有しない**。
- 真の Solution = **当日の進行変更を全員の画面で追従**（Push/Pull · 「新しい版があります」）。

### 1-B. T13-S イベント進行 Sync の mental model

- **1ルーム = 1イベント**（幹事オーナー1人 · 進行表1本）。
- クラウドは **共有用の短期バッファ** — 永久アーカイブではない（`retain_until` でパージ）。
- 長期ログは **ユーザー側 JSON エクスポート**（自己保管）。
- 幹事ペルソナ: 年数回イベント · 当日差し込み多い · スマホ現場。
- 課金モデル（進行）: **イベント単位都度**（例 ¥980/件 · event_date+7日保持）が主。月額 Pro は横断案。
- trial: 同時アクティブルーム **1** · active: **3** · payload **512KiB/room**。

---

## 2. アカウント ID 思想（分析の制約 · 提督確定）

### 2-A. 正本 ID

```text
auth.users.id  (= Supabase JWT sub · UUID)
    ├─ sync_profiles.id          — 1:1 · stripe_customer_id（S3）
    ├─ user_entitlements.user_id — 権利の正本（Stripe Webhook が INSERT）
    └─ sync_rooms.owner_id       — ルームオーナー（entitlement は実行時キャッシュ）
```

| ルール | 内容 |
|--------|------|
| **課金・退会・権利照会のキー** | 常に `auth.users.id` — **メール文字列でユーザーを特定しない** |
| **メール** | ログイン ID · 表示 · Stripe Customer **連絡先** のみ |
| **Stripe Customer** | `sync_profiles.stripe_customer_id` のみ |
| **権利の正本** | `user_entitlements` · `sync_rooms.entitlement` は trial/active/expired のキャッシュ |
| **売掛・督促・カード情報** | **Stripe 側** — Sync は持たない |
| **API** | アカウント削除・Checkout は CF Pages Functions + service role |

### 2-B. Auth 方針

- **メール + パスワード**（マジックリンク単独ログインは **不採用** — フィッシング対策）。
- OAuth（Google）は後追い可。
- 1幹事アカウント = 課金主体 = ルームオーナー（**席課金・チームメンバー招待は S4+**）。

### 2-C. アカウント管理 MECE（機能リスト · 実装状態混在）

| 区分 | 項目 | 状態 |
|------|------|------|
| 認証 | 登録・ログイン・ログアウト・PWリセット | 実装済 |
| 設定 | PW変更・メール変更・退会 | **未実装 P0–P1** |
| 将来 | OAuth · MFA · セッション一覧 · Stripe Portal | 未 |

退会時: Stripe 解約 → `admin.deleteUser` → CASCADE（rooms · profiles · entitlements）。

---

## 3. データ・課金ライフサイクル（分析の制約 · 提督確定）

### 3-A. 削除・保持

- **手動削除**: オーナーがルームごと削除（一等市民）。
- **自動パージ**: `retain_until < now()`（日次 Cron · S2+）。
- **無期限クラウド保存はしない**。

### 3-B. ダウングレード（有料→無料 · アカウントは残る）

| 段階 | データ | ユーザー操作 |
|------|--------|--------------|
| A 有効 | 保持 | 編集・同期・新規ルーム |
| B grace | **削除しない** | **閲覧・JSON export・手動削除のみ**（保存・同期停止） |
| C パージ | 自動削除 | — |

- `retain_until` は原則 **短縮しない**（既払い期間尊重）。
- サブスクは `cancel_at_period_end` — 期間末まで A。
- grace 中の閲覧 URL: **最終版表示のみ** · ライブ同期停止。
- **ログインは維持**（即アカウントロックしない）。

### 3-C. JSON 再インポート（ダウングレード後）

| 経路 | 方針 |
|------|------|
| コア `/timeline`（localStorage） | **常に可** |
| Sync クラウド | **trial 枠のみ** · JSON 内の `entitlement`/`retainUntil` は **無効化してサーバ再計算** |
| grace（expired）中のクラウウド save | **不可** |

### 3-D. ユーザー向け表現

- 上記オペレーション内訳は **運営内規** — LP/FAQ に grace 日数・quota 哲学は **表立てて載せない**。
- UI には **保持期限の日付** と **操作不可時の短い理由** のみ。

---

## 4. 技術スタック（境界のため）

- Auth/DB: Supabase（PostgREST + RLS · 中間 CRUD API は作らない · 例外: Stripe Webhook/Checkout/退会 Functions）
- 配信: Cloudflare Pages（sync.sugudasu.com）
- 共有 URL: `/e/{event_public_id}`（`se_` プレフィックス · S2）
- 現状 S1: entitlement による RLS 分岐は **未実装**（オーナーなら読書き可）

---

## 5. あなたへの依頼（MECE 分析）

### 5-1. 目的

「アカウントにまつわる問題」を、**§2 の ID 思想** と **§1 のイベント進行 Sync 思想** から逸脱しないよう、
**トップレベルカテゴリが相互排他・下位が網羅的** になるよう洗い出す。

### 5-2. MECE の切り方（必須）

まず **トップレベル分割軸** を 5〜8 個提案し、採用案を1つ選んで理由を述べよ。
採用案の例（変更可）:

1. **主体（Identity）** — 誰がアカウントか
2. **認証（Authentication）** — 本人証明
3. **認可・権利（Authorization / Entitlement）** — 何ができるか
4. **データライフサイクル（Data lifecycle）** — ルーム・payload・保持
5. **商取引（Commerce）** — Stripe・Checkout・解約（Sync はミラーのみ）
6. **境界越え（Boundary）** — コア↔Sync・export/import・共有 URL
7. **運用・法務・信頼（Ops / Legal / Trust）** — 退会・削除権・表示方針
8. **脅威・不正（Abuse / Security）** — なりすまし・quota 回避・列挙

**重複禁止:** 同じ問題を2カテゴリに入れない。漏れがあれば「その他」に逃げず軸を再設計して報告。

### 5-3. 各問題の記述フォーマット（表）

各カテゴリごとに表を作る。列:

| 列 | 内容 |
|----|------|
| ID | `ACC-{カテゴリ}-{連番}` |
| 問題 / シナリオ | 幹事・司会・攻撃者のどれが何をしたときか |
| 現状の決定 | §1–3 の確定事項があれば引用 · なければ「未決」 |
| ギャップ / リスク | 実装・法務・UX・コストのどれか |
| 推奨方針 | 1–3文 · イベント進行 Sync に合うか |
| フェーズ | S1 / S1.5 / S2 / S3 / S4+ |
| 優先度 | P0 / P1 / P2 / 監視のみ |

**最低件数:** カテゴリあたり **5件以上** · 全体 **40件以上**。

### 5-4. 必ず含めるシナリオ（チェックリスト）

漏れなく表に落とすこと:

**Identity / Auth**
- 新規登録直後 `sync_profiles` 未作成
- メール変更後の Stripe 連絡先ずれ
- 同じ人がコア無料と Sync 有料を併用（別 ID）
- OAuth 追加時の ID 統合
- パスワードリセット中のセッション
- 退会 vs ルーム手動削除のみ

**Entitlement / Billing**
- イベントチケット購入とルーム active 化の対応
- サブスク解約と進行 Sync ルームの関係（別 SKU）
- `user_entitlements` 空・Webhook 遅延・二重 INSERT
- 救済後払い（初回1回）とアカウント ID
- JSON 再 import による有料特権復元の抜け道
- Stripe Customer なしで退会

**Data lifecycle**
- trial 1枠超過時の既存ルーム
- ダウングレード後 grace 中の保存・同期・閲覧 URL
- `retain_until` パージ直前の通知
- エクスポート未実施でパージ
- 複数端末での同時編集とアカウント

**Boundary**
- コア localStorage → Sync 取込
- Sync export → コア取込（翌年テンプレ）
- 閲覧 URL 漏洩（ログイン不要）とオーナーアカウントの責任分界
- 編集者2人（S4）とオーナー1アカウント

**Abuse**
- メール列挙 · ルーム ID 列挙
- quota 回避（複数アカウント trial）
- 偽ログインページ
- エクスポート JSON の改ざん import

### 5-5. 業界ベンチマーク（簡潔）

イベント系 SaaS（Rundown 等）· フリーミウム · Stripe Billing の慣行と比較し、
**Sync の「イベント都度・短期バッファ」モデルで外れる判断** を3〜5点列挙。

### 5-6. 出力セクション（この順序固定）

1. **Executive Summary**（200字以内 · 日本語）
2. **MECE トップレベル軸**（採用案 + 代替案1つ）
3. **カテゴリ別問題一覧**（§5-3 の表 · 全カテゴリ）
4. **横断マトリクス** — 行=問題 ID · 列=`auth.users.id` / `entitlement` / `retain_until` / `Stripe` / `UI` のどれが主たる制御点か
5. **未決事項トップ10**（優先度順 · 提督判断が要るもの）
6. **明示的にスコープ外**（コア無料・Schedule 別 SKU 等 · なぜ今回の MECE に入れないか）
7. **推奨ロードマップ** — S1 完了ブロッカー / S2 / S3 に問題 ID をマッピング

### 5-7. 禁止・注意

- コア無料を「登録必須にすべき」等、§1 の思想を覆す提案は **「思想変更案」** として別枠に隔離。
- 「無制限クラウド」「永久アーカイブ」をデフォルト推奨しない。
- RevenueCat 採用は **不採用**（方針固定）。
- メールを課金キーにする案は **不採用**。
- ユーザー向け FAQ にオペレーション内訳を書く案は **低評価**（§3-D）。

---

## 6. 参考（既存ドキュメント名のみ · 本文は持たない）

リポジトリ内 SSOT（参照用キーワード）:
SYNC_AUTH_POLICY.md · SYNC_DB_ARCHITECTURE.md · SYNC_RETENTION_POLICY.md ·
SYNC_STORAGE_QUOTAS.md · SYNC_S1_ARCHITECTURE.md · SUGUDASU_SYNC_LINE.md ·
SYNC_CAPACITY_AND_PRICING_POLICY.md · GROUP_SPLIT_SYNC_BILLING_CTA_AND_QUOTE.md

出力ファイル名: `sync-account-mece-gemini-RESULT.md`
```

---

## 使い方

1. 上記 ```text``` ブロックを Gemini に貼る
2. 出力を `docs/notes/sync-account-mece-gemini-RESULT.md` に保存
3. **§9 SSOT 照合** を読み、提督が §5 未決10件を決定 → `SYNC_AUTH_POLICY.md` / `BACKLOG.md` に昇格
