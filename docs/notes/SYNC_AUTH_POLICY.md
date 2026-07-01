# Sync Auth 方針 — メール + パスワード

**更新:** 2026-06-26  
**ステータス:** **提督確定** — S1 以降の Auth 正本  
**関連:** [`SYNC_S1_REMAINING_TASKS.md`](SYNC_S1_REMAINING_TASKS.md) · [`SYNC_S1_ARCHITECTURE.md`](SYNC_S1_ARCHITECTURE.md) · [`SUGUDASU_SYNC_LINE.md`](SUGUDASU_SYNC_LINE.md) §K1

---

## 1. 決定

| 項目 | 方針 |
|------|------|
| **ログイン ID** | **メールアドレス + パスワード**（両方必須） |
| **マジックリンク単独** | **採用しない**（S1 試作で一度入れたが **製品方針から外す**） |
| **メールの役割** | **初回確認** · **パスワードリセット** · （将来）セキュリティ通知 — **毎回ログインの主経路ではない** |
| **OAuth** | Google 等は **後追い可**（パスワードと併存） |

利用規約 [`docs/legal/terms-of-use.md`](../legal/terms-of-use.md) §2 の「メールアドレスおよびパスワード等」管理義務と **整合**。

---

## 2. なぜそうするか — フィッシング（背景）

### マジックリンクのみの問題

メールアドレスだけでログインできる方式では、攻撃者が **本物そっくりのメール** を送るだけで被害が成立しうる。

| 攻撃 | マジックリンクのみ | メール + パスワード |
|------|-------------------|---------------------|
| **偽メールのリンクを踏ませる** | 1クリックでセッション奪取 or 偽サイトに誘導 | リンクだけでは **ログイン完了しない** |
| **なりすまし From** | `Supabase Auth` / 似たドメインで信頼を誤らせやすい | ログインは **常に `sync.sugudasu.com` のフォーム** + 本人だけが知るパスワード |
| **幹事の心理** | 「届いたリンクを踏めば楽」→ 確認が甘くなる | **URL とパスワード**の2点確認が習慣になる |

**思想:** Sync は **幹事のクラウド下書き** を預かる有料ライン。Auth は「便利さ優先のパスワードレス」より **なりすまし耐性** を優先する。コア無料の「送信しない・登録不要」とは **意図的に別設計**。

### 残るリスク（正直に）

- **偽ログインページ**（クレデンシャルフィッシング）はパスワード方式でも可能 → **ブックマーク · ドメイン表示 · 公式導線のみ** を UI / FAQ で補強
- **パスワード使い回し** → 将来の強度ポリシー · Have I Been Pwned 等は S2+ で検討

---

## 3. 製品・運用への影響

### メリット

| 点 | 内容 |
|----|------|
| **SMTP 負荷** | ログインのたびにメール不要 → **2通/時間問題の影響が激減**（リセット時のみ） |
| **セッション** | ブラウザに refresh が残れば **再ログイン頻度が下がる** |
| **幹事の行動** | イベント前後で **同じパスワードで戻る** — 生活リズムに合う |

### 実装・設定（Supabase）

| 設定 | 方針 |
|------|------|
| Email provider | **Email + Password ON** |
| Magic Link / OTP ログイン | **OFF**（またはサインアップ経路から外す） |
| Confirm email | **ON**（初回のみメール · Custom SMTP 推奨） |
| Password reset | **ON**（リセットメール · 日本語テンプレ） |
| クライアント | `signUp({ email, password })` · `signInWithPassword` · `resetPasswordForEmail` |

### UI（`/timeline/app/`）

- [x] **新規登録** — メール · パスワード · 確認用パスワード
- [x] **ログイン** — メール · パスワード
- [x] **パスワードを忘れた** — メール送信 → リセットリンク
- [x] **リカバリ** — メールリンク経由で新パスワード設定
- [x] マジックリンク送信フォームは **削除**

### E2E の置き換え

[`SYNC_S1_E2E_CHECKLIST.md`](SYNC_S1_E2E_CHECKLIST.md) E2E-1 を **パスワードログイン** に差し替え（2026-06-26 までのマジックリンク E2E は **試作記録** としてセッションログに残すのみ）。

---

## 4. 残タスクでの位置づけ

| 優先 | タスク | 備考 |
|------|--------|------|
| **P0** | 本ドキュメントに沿った **Auth UI + Supabase 設定** | マジックリンク削除 |
| **P0** | Custom SMTP | **初回確認 · パスワードリセット** 用（毎ログインではない） |
| **P1** | テンプレ日本語化 | Confirm · Reset 用 |
| **P1** | 偽サイト注意 · 公式 URL の FAQ / LP 1行 | フィッシング補強 |

詳細チェックリスト: [`SYNC_S1_REMAINING_TASKS.md`](SYNC_S1_REMAINING_TASKS.md) §1–§2 · **§1b** · **§1c（アカウント管理）**

---

## 5. アカウント管理 — 全体像（MECE）

幹事アカウント（`auth.users` 1人 = Sync の課金・ルームオーナー単位）で **揃えるべき機能**。

### 5-1. 状態一覧

| 区分 | 機能 | 状態 | 優先 | 備考 |
|------|------|------|------|------|
| **認証** | 新規登録（メール+パスワード） | [x] | — | 確認メールは Supabase 設定依存 |
| | ログイン | [x] | — | |
| | ログアウト | [x] | — | |
| | パスワードを忘れた（リセットメール） | [x] | — | |
| | メールリンクから新パスワード設定 | [x] | — | リカバリ画面 |
| **アカウント設定** | **パスワード変更**（ログイン中・現パスワード確認） | [ ] | **P1** | リセットメールとは別経路 |
| | **メールアドレス変更** | [ ] | **P1** | 新旧両方の確認が一般的 · Supabase `updateUser` + 確認メール |
| | **アカウント削除（退会）** | [ ] | **P0** | プライバシーポリシー §5-3 · 利用規約と整合 |
| **セキュリティ** | 初回メール確認 | [ ] 設定 | P0 | Dashboard · Custom SMTP |
| | 全端末ログアウト / セッション一覧 | [ ] | P2 | Supabase セッション管理 · S2 以降で可 |
| | MFA（2要素） | [ ] | P3 | 幹事向け · 要望が出たら |
| **将来** | Google OAuth 連携 | [ ] | S2+ | `SUGUDASU_SYNC_LINE` K1 |
| | Stripe Customer Portal（請求先メール等） | [ ] | S3 | 課金ライン |

### 5-2. アカウント削除 — なぜ P0 か

[`privacy-policy.md`](../legal/privacy-policy.md) §5-3:

> アカウント情報は、**退会手続き完了まで**保持

退会 UI が無いと **ポリシーと製品が矛盾**する。ルーム手動削除だけでは不十分（`auth.users` · `sync_profiles` · 認証メールが残る）。

**削除時に消すもの（想定）:**

| 対象 | 手段 |
|------|------|
| `sync_room_states` · `sync_rooms` | オーナー行は **CASCADE** または事前 DELETE |
| `sync_profiles` · `user_entitlements` | `auth.users` ON DELETE CASCADE（マイグレーション済） |
| `auth.users` | **service role** — クライアントから直接削除不可 · Pages Function 等 |
| ローカル `sg-sync-auth` | クライアントで `signOut` + storage クリア |

**UX 思想:**

- 確認ダイアログ + **パスワード再入力**（なりすまし削除防止）
- 「ルームデータもすべて消え、復旧不能」を明示（[`SYNC_RETENTION_POLICY.md`](SYNC_RETENTION_POLICY.md) と同調）
- 可能なら削除前に **JSON エクスポート** を促す（S1 は import のみ · export は S2 でも可）

### 5-3. メールアドレス変更 — 要点

- Supabase: `updateUser({ email })` → **新旧メールへの確認**（secure email change デフォルト ON）
- ログイン ID が変わるため **再ログイン** またはセッション更新を UI で案内
- フィッシング対策: **ログイン中のみ** 設定画面から · 変更完了メールは日本語テンプレ

### 5-4. パスワード変更（ログイン中）— 要点

- `updateUser({ password })` — 多くの設定で **直近の re-auth** または現パスワード入力を UI で要求
- 「忘れた」経路（リセットメール）との **役割分担** を設定画面で明示

### 5-5. アカウント設定 UI（β · Notion 適用 — 2026-06-26）

**リサーチ正本:** [`sync-account-ux-notion-gemini-RESULT.md`](sync-account-ux-notion-gemini-RESULT.md) · **表示項目:** [`sync-account-page-content-gemini-RESULT.md`](sync-account-page-content-gemini-RESULT.md) · **Grok 突合:** [`sync-account-page-content-grok-RESULT.md`](sync-account-page-content-grok-RESULT.md) · 色は [`DESIGN_NOTION_SUGUDASU_ADAPT.md`](DESIGN_NOTION_SUGUDASU_ADAPT.md)

**入口:** `/timeline/app/` ヘッダー **「アカウント」** → 同一 SPA 内オーバーレイ（Notion 型 · 左ナビは **「アカウント」1項目のみ** · Workspace 節なし）

#### 認証画面（未ログイン）

| 要素 | Sync β |
|------|--------|
| レイアウト | 中央白カード · `slate-100` キャンバス · 余白多め |
| ログイン / 登録 | **タブ切替** · 同一カード内 |
| フィールド | メール + パスワード（**表示/非表示**）· 登録時は確認用パスワード |
| Primary CTA | `sg-btn-primary`（**blue-600** · Notion 黒は使わない） |
| OAuth | **β 未実装** — 将来 Google を区切り線「または」の上に配置 |
| **借りない** | メール先行のみの Progressive · **ログインコード / マジックリンク** |
| 規約 | 登録フッター文言 · チェックボックス要否は法務と整合 |
| リセット | 列挙対策 — 送信完了画面は登録有無を出さない |

#### アカウント設定（ログイン後）

**構成:** **4要素 + 安全弁**（P0 コア · P1 フッター）— アカウントに載せない制限・インフラ情報は §5-5b

| 行 | 動作 | 優先度 |
|----|------|--------|
| メールアドレス | 表示 · **変更** → 現パスワード → Supabase `updateUser` + 確認メール | P0 |
| パスワード | **変更** → 現パスワード + 新パスワード（ログイン中） | P0 |
| 改善を提案する | 外部リンク「改善を提案する ↗」→ [β 不具合・改善フォーム](https://docs.google.com/forms/d/e/1FAIpQLSchvqtu9j3FL4KTxSG70txXwbREaJFZ-IrdwAKjuCRWz5jaPw/viewform?usp=publish-editor)（`BACKLOG` §5-4 正本） | P1 |
| ログアウト | **グレーテキストリンク** · 二次確認なし · **赤にしない**（退会のみ赤 · 提督 2026-06-26 確定） | P0 |
| **危険な操作** | 赤枠セクション · **アカウントを削除** | P0 |
| フッター | 利用規約 · プライバシーポリシー（小・グレー）· **ビルド番号**（`text-xs` 相当 · 極小 · 右下 · 提督 2026-06-26 確定） | P1/P2 |

#### 5-5b. 表示の載せ場所（アカウント外 — 2026-06-26）

**正本:** [`sync-account-page-content-gemini-RESULT.md`](sync-account-page-content-gemini-RESULT.md) §3 · §4 · **Grok 突合:** [`sync-account-page-content-grok-RESULT.md`](sync-account-page-content-grok-RESULT.md) §11

| 情報 | 載せ場所 | アカウントに載せない |
|------|----------|---------------------|
| `retain_until` · trial 1枠 | ルーム一覧（枠極小 + カード countdown）· 作成時 | ◎ |
| payload 512KiB 逼迫 | **編集画面上部インジケータ**（極小）· 保存失敗強調 | ◎ |
| 同期状態 | **編集画面上部インジケータ**（極小） | ◎ |
| 同期遅延 · 保存失敗 · 障害 · Supabase Paused | 全局バナー / **優先度トースト1件** · Paused はログイン直後モーダル（P1） | ◎ |
| アクセス数 · UUID · quota 哲学 · プラン名 | — | ◎ 載せない |

#### 退会 UX（Notion / **Supabase Danger zone** 型）

**誤タップ防止:** 確認ダイアログだけでは不十分 — **登録メール全文のタイプ入力** で削除ボタンを活性化（Supabase プロジェクト削除と同型 · 提督 2026-06-26）。

1. 確認ダイアログ — ルーム全消去 · 復元不可
2. **現パスワード** 再入力
3. **登録メールアドレスの全文タイプ** — 一致時のみ「削除する」活性化
4. `POST /api/account/delete`（JWT `sub`）· β は Stripe 空分岐

**β に載せない:** プラン · 請求 · カード · Stripe Portal（S3）· アバター · 表示名（P2）· UUID · ワークスペース切替

#### 実装チェック（Auth UI）

- [ ] 中央カード + タブログイン/登録
- [ ] PW 表示切替
- [ ] アカウントオーバーレイ（リスト行 + ヘアライン）
- [ ] メール変更（現PW + 確認メール）
- [ ] フッター — 規約 · プライバシー · [フィードバック](https://docs.google.com/forms/d/e/1FAIpQLSchvqtu9j3FL4KTxSG70txXwbREaJFZ-IrdwAKjuCRWz5jaPw/viewform?usp=publish-editor) · ビルド番号（極小）
- [ ] 退会 — 現PW + **メール全文タイプ**（Supabase Danger zone 型）
- [ ] 列挙同一応答（登録/リセット）
- [ ] 制限・インフラは **アカウント外**（§5-5b）— ルーム行 / 全局バナーのみ

### 5-6. 課金 API との ID 境界（提督指示 · 実装必須）

**`auth.users.id`（UUID）が Sync における唯一の課金・アカウント主体。** メールアドレスはログイン用であり、Stripe 顧客キーにしない。

```text
auth.users.id  (= JWT sub)
    ├─ sync_profiles.id          — stripe_customer_id（S3 · Checkout 後）
    ├─ user_entitlements.user_id   — 権利の正本（Webhook が INSERT）
    └─ sync_rooms.owner_id         — ルーム（entitlement は実行時キャッシュ）
```

| ルール | 内容 |
|--------|------|
| **正本 ID** | 課金 · 退会 · 権利照会はすべて **`user_id` = `auth.users.id`** |
| **メール** | 表示 · ログイン · Stripe Customer **連絡先** のみ — ID として扱わない |
| **Stripe Customer** | `sync_profiles.stripe_customer_id` **のみ**（room 行に置かない · マイグレーション済） |
| **権利** | `user_entitlements` が正本 · `sync_rooms.entitlement` は消費後のキャッシュ |
| **API 層** | アカウント削除 · 将来の課金操作は **CF Pages Functions + service role**（クライアントに Stripe 秘密を載せない） |
| **新規登録時** | `sync_profiles` 行を **必ず 1:1 作成**（signup 直後 or DB trigger）— Checkout 前の土台 |

**アカウント削除（S3 連携時の順序）:**

1. JWT から `user_id` 特定 · パスワード再確認  
2. `stripe_customer_id` があれば **Stripe でサブスク解約 / Customer 無効化**（`/api/account/delete` 内）  
3. `auth.admin.deleteUser(user_id)` → `sync_rooms` · `sync_profiles` · `user_entitlements` は **ON DELETE CASCADE**  
4. クライアント `signOut` · `sg-sync-auth` クリア  

**メール変更（S3 連携時）:** `updateUser({ email })` 成功後、Functions で `stripe.customers.update(customerId, { email })`（`stripe_customer_id` がある場合のみ）。

**S1 実装方針（Stripe 未接続でも）:**

- エンドポイントは **`user_id` を JWT から取る**形で先に作る（メール文字列でユーザーを引かない）  
- 削除 API に **Stripe 呼び出しのフックコメント / 空分岐** を残す（S3 で中身を足す）  
- 登録成功時に `sync_profiles` upsert（`ensureSyncProfile(userId)`）  

正本: [`SYNC_S1_ARCHITECTURE.md`](SYNC_S1_ARCHITECTURE.md) §2 · [`SYNC_DB_ARCHITECTURE.md`](SYNC_DB_ARCHITECTURE.md) §2-3 · [`SYNC_ENV_KEYS.md`](SYNC_ENV_KEYS.md)（`STRIPE_*` は Functions のみ）

---

## 6. 変更履歴

| 日付 | 内容 |
|------|------|
| 2026-06-26 | §5-5 Notion 適用 UI 契約（β · ワイヤー） |
| 2026-06-26 | §5-6 課金 API との ID 境界（`auth.users.id` 正本） |
| 2026-06-26 | §5 アカウント管理 MECE |
| 2026-06-26 | 提督確定 — マジックリンク単独を廃止 · メール+パスワードへ |
