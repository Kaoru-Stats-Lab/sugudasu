# SUGUDASU Sync — アカウント問題 MECE（Gemini 調査結果）

**生成:** 2026-06-26（Gemini · プロンプト: [`docs/prompts/sync-account-mece-gemini-prompt.md`](../prompts/sync-account-mece-gemini-prompt.md)）  
**ステータス:** **βスコープ分割済**（§11）· 課金APIは β 対象外 · 提督 2026-06-26

---

## 1. Executive Summary

SUGUDASU Syncは、コア無料層（localStorage）とSync有料層（独立Supabase）を物理的に分離した「アカウント非共有二層モデル」を採用する。本分析では、課金・権利の絶対正本である `auth.users.id` を軸に、進行表クラウド同期に特有の「短期バッファ」「都度課金モデル」が引き起こすアカウント、認可、データ割当、セキュリティの境界問題および未決事項をMECEに網羅した。S1完了および以降のインフラ設計の防波堤となるアーキテクチャ定義である。

## 2. MECE トップレベル軸

### 2-A. 採用案：コンポーネント・ドメイン境界軸

1. **主体（Identity）** — 誰がアカウントか
2. **認証（Authentication）** — 本人証明
3. **認可・権利（Authorization / Entitlement）** — 何ができるか
4. **データライフサイクル（Data lifecycle）** — ルーム・payload・保持
5. **商取引（Commerce）** — Stripe・Checkout・解約
6. **境界越え（Boundary）** — コア↔Sync・export/import・共有 URL
7. **運用・法務・信頼（Ops / Legal / Trust）** — 退会・削除権・表示方針
8. **脅威・不正（Abuse / Security）** — なりすまし・quota 回避・列挙

**採用理由:**
各ドメインがSupabaseのスキーマ、Cloudflare Pages Functionsの各種エンドポイント、およびStripe Webhookの各コンポーネントの物理的な境界と1:1で対応するため、実装時の防波堤（バリデーション・監査境界）を最も強固に設計できる。

### 2-B. 代替案：ユーザー・ライフサイクルステージ軸

* 登録・初期化 → 日常利用（ルーム作成） → 決済・権利昇格 → 権利失効（ダウングレード・grace） → 退会・パージ。
* **不採用理由:** 時系列の変化を追うには適しているが、同一ステージ内で複数の技術レイヤ（AuthとStripeなど）が混在し、相互排他（MECE）なセキュリティ境界の定義が難しくなるため。

---

## 3. カテゴリ別問題一覧

### 3-1. 主体（Identity）

| ID | 問題 / シナリオ | 現状の決定 | ギャップ / リスク | 推奨方針 | フェーズ | 優先度 |
| --- | --- | --- | --- | --- | --- | --- |
| ACC-ID-01 | 新規サインアップ直後、CF Functionsの不具合で `sync_profiles` へのINSERTが失敗したとき | 課金キーは `auth.users.id` 正本。 | `auth.users` にのみ行が存在し、Stripe連携に必要なプロファイルが存在しない不整合。 | `auth.users` のトリガー、またはCF側での冪等な確認・自動リトライ生成を必須とする。 | S1 | P0 |
| ACC-ID-02 | 幹事がログインメールアドレスを変更したが、Stripe Customerの連絡先メールアドレスが同期されていないとき | メールは連絡先・表示のみ。 | 督促メールや領収書が旧アドレスに飛び、不着やクレームに繋がるリスク。 | メール変更完了時、CF FunctionsからStripe APIを叩き、Customer情報を非同期更新する。 | S1.5 | P1 |
| ACC-ID-03 | ユーザーが同一ブラウザでコア無料版の表と、Sync有料版のルームを同時にいじっているとき（別ID扱い） | アカウントは共有しない。コアはlocalStorage。 | ユーザーが「Syncにログインしたからコアのデータも勝手に同期される」と誤認するUXリスク。 | ログイン状態の有無に関わらず、同期トグルを明示的にONにしない限りコアは独立している旨のUI警告。 | S1 | P0 |
| ACC-ID-04 | 将来Google OAuthを追加した際、既存の「メール+パスワード」アカウントと同一メールアドレスだったとき | OAuthは後追い可。キーは `auth.users.id`。 | Supabase側で自動リンク（Link）を許容すると、パスワード側が未確認の場合にアカウント乗っ取りの仮説リスク。 | 初回OAuth連携時は同一メールであっても既存パスワードでの認証を一度挟む、または別UUIDとして扱い、手動統合のみ。 | S3 | P2 |
| ACC-ID-05 | 幹事が退会（アカウント削除）を要求したが、Stripeに有効なサブスクリプションや未決済残高が残っているとき | 退会時はStripe解約 → `admin.deleteUser` → CASCADE。 | Stripe側の即時解約が失敗した場合、Supabase側だけが消えて売掛金が迷子になるリスク。 | CF FunctionsがStripeの解約完了フック（Webhook）を検知してから、SupabaseのCASCADE削除を実行する。 | S1 | P0 |

### 3-2. 認証（Authentication）

| ID | 問題 / シナリオ | 現状の決定 | ギャップ / リスク | 推奨方針 | フェーズ | 優先度 |
| --- | --- | --- | --- | --- | --- | --- |
| ACC-AUTH-01 | 幹事がパスワードリセットを申請したが、他の端末で既存のセッション（JWT）が生き残っているとき | メール+パスワード（マジックリンク単独は不採用）。 | パスワード変更後も、盗まれた古いトークンを持つ端末がパージされず、操作を継続できるリスク。 | パスワード変更イベント（RPC）をトリガーに、該当ユーザーの `auth.refresh_tokens` をすべて失効（Revoke）させる。 | S1 | P0 |
| ACC-AUTH-02 | 攻撃者が特定の幹事メールアドレスに対して、パスワード総当たり（ブルートフォース）を試みたとき | 課金・特定キーは `auth.users.id`。 | 幹事アカウントがロックされ、イベント当日にログインできなくなる運用リスク（DoS）。 | 同一IP・同一アカウントの短時間での失敗にしきい値を設け、ロックではなく文字認証や時間ペナルティで防御。 | S1 | P0 |
| ACC-AUTH-03 | 幹事が当日の結婚式二次会会場（電波微弱）で、パスワードを忘れてマジックリンク単独でログインしようとしたとき | マジックリンク単独ログインは不採用（フィッシング対策）。 | パスワードを思い出すまでログインできず、15分復旧の思想が破綻するUXリスク。 | パスワードリセットフローを極限まで slim 化し、登録メールへのリセットコード送付から現場で即時再設定可能にする。 | S1 | P0 |
| ACC-AUTH-04 | パスワードリセットメール内のトークンURLを、幹事が誤ってSNSやグループチャットに誤貼付したとき | 秘密鍵はチャットに貼らない。 | 第三者がURLを踏むことでパスワードが勝手に変更されるセキュリティリスク。 | リセットトークンの有効期限を15分〜30分に短縮し、かつ1回消費で即時無効化（シングルユース）を徹底する。 | S1 | P0 |
| ACC-AUTH-05 | イベント当日の本番直前、セッションの有効期限（JWTのExpire）が切れ、突然画面が未認証状態に戻ったとき | Solution = 当日の進行変更を追従。 | 進行中に再ログインを求められ、オペレーションが停止する致命的なUXリスク。 | クライアント側で `refresh_token` を用いたサイレント更新をバックグラウンドで高頻度に走らせ、当日はセッションを維持。 | S1 | P0 |

### 3-3. 認可・権利（Authorization / Entitlement）

| ID | 問題 / シナリオ | 現状の決定 | ギャップ / リスク | 推奨方針 | フェーズ | 優先度 |
| --- | --- | --- | --- | --- | --- | --- |
| ACC-AUTHZ-01 | Stripeでの決済完了直後、Webhookの遅延や二重INSERTにより `user_entitlements` の処理が詰まったとき | 権利の正本は `user_entitlements`。 | 決済したのにルームがactiveにならず、幹事が当日パニックになる決済ギャップリスク。 | 冪等なUPSERT処理を実装し、Webhookが遅延した場合はクライアント側から一時的にSync用Receiptを投げて仮有効化。 | S1 | P0 |
| ACC-AUTHZ-02 | 都度課金（¥980/件）で購入したイベント権利が、どの `sync_rooms`（ルーム）に紐づくべきか未決のとき | 都度課金は event_date+7日保持が主。 | 購入した権利が未使用のまま放置されたり、別ルームに誤って適用される割当リスク。 | 購入完了後、幹事に「どのルームにこの権利（チケット）を適用するか」を選択させ、適用時に `sync_rooms.entitlement` にキャッシュ。 | S1.5 | P1 |
| ACC-AUTHZ-03 | 初回利用の幹事が決済エラーを起こしたが、当日の進行を止めるわけにいかず「救済後払い」を適用するとき | 救済後払いは初回1回のみ・アカウントID紐付け。 | 悪意あるユーザーがアカウントを量産して「初回救済」を何度も騙し取る abuse リスク。 | `sync_profiles` に救済適用済みフラグ（`had_emergency_relief`）を刻印し、同一Stripeカードや同一名義での多重適用をガード。 | S2 | P1 |
| ACC-AUTHZ-04 | ユーザーがダウングレード（無料化）した状態で、過去の「有料特権付きJSON」を偽造して再インポートしたとき | JSON内の権利・期限は無効化してサーバ再計算。 | クラウド側で有料枠（active）が不正に復活してしまう認可バイパスリスク。 | インポート時は、JSON内のメタデータ（権利等）を完全無視し、現在の `user_entitlements` テーブルの状態のみを参照してルームを構築。 | S1 | P0 |
| ACC-AUTHZ-05 | S1段階で entitlement による RLS 分岐が未実装のまま、他人がルームIDを推測してGET/POSTしてきたとき | S1はオーナーなら読書き可（entitlement ゲート未実装）。 | ルームUUID漏洩時の改ざんリスク。共有URLは別ID（`event_public_id`）。 | **owner RLS は適用済** — 追加で `expired` 時 INSERT/UPDATE 拒否 · `retain_until` 条件を S3 で AND 結合。 | S1/S3 | P0 |

### 3-4. データライフサイクル（Data lifecycle）

| ID | 問題 / シナリオ | 現状の決定 | ギャップ / リスク | 推奨方針 | フェーズ | 優先度 |
| --- | --- | --- | --- | --- | --- | --- |
| ACC-LIFE-01 | 無料（trial）枠の制限（同時1枠）の状態で、すでに1つルームがあるのに2つ目のルームを作ろうとしたとき | trial枠は同時アクティブルーム1。DBトリガーあり。 | UI文言・エラーマップの polish。 | `room_quota_exceeded` を明示メッセージにマップ。古いルームの自動削除は **しない**（提督方針）。 | S1 | P0 |
| ACC-LIFE-02 | 有料から無料へダウングレードし、grace（期限切れ）期間中になったルームの共有URLへゲスト（司会等）がアクセスしたとき | grace中は閲覧・JSON export・手動削除のみ。 | 同期停止を「最新」と誤認するUXリスク。 | 閲覧URLに同期停止の短い表示（赤帯等）· 最終版のみ。FAQ化はしない（§3-2）。 | S2 | P1 |
| ACC-LIFE-03 | `retain_until`（自動パージ）の時刻が迫っているが、幹事が多忙で通知に気づかないとき | `retain_until < now()` で日次パージ。 | 突然消滅クレーム。 | **ルーム行の保持期限表示** + 期限直前のコンテキスト通知。Telegram等はスコープ外。 | S2 | P1 |
| ACC-LIFE-04 | 幹事がJSONエクスポート（自己保管）を怠ったまま自動パージ時刻を迎え、クラウドからデータが完全消滅したとき | 無期限クラウド保存はしない。 | 復元要求・法務リスク。 | **法務（TOS・データライフサイクル）** で非永続・復旧不可を規定。製品UIでの説教は最小（§3-2）。 | S1 | P0 |
| ACC-LIFE-05 | 幹事（PC）と司会（スマホ）が当日の現場で全く同時に同一ルームのセルを編集・送信したとき | 1ルーム=1イベント、進行表1本。 | 上書きコンフリクト。 | `revision` 楽観的ロック（S2）。 | S2 | P0 |

### 3-5. 商取引（Commerce）

| ID |  problem / シナリオ | 現状の決定 | ギャップ / リスク | 推奨方針 | フェーズ | 優先度 |
| --- | --- | --- | --- | --- | --- | --- |
| ACC-COMM-01 | ユーザーが一度も有料決済を行っておらず、Stripe Customer ID（`stripe_customer_id`）が NULL のまま退会するとき | 退会時: Stripe解約 → admin.deleteUser。 | Stripe NULL で削除フローがハング。 | `stripe_customer_id` NULL なら Stripe スキップ → CASCADE。 | S1 | P0 |
| ACC-COMM-02 | 月額サブスクリプションを月の途中で解約（`cancel_at_period_end`）したが、まだ有効期間が残っているとき | 期間末までA（有効）。`retain_until` は短縮しない。 | 即 grace 化の誤認。 | `period_end` まで `active` 維持。 | S1.5 | P1 |
| ACC-COMM-03 | サブスクの月次自動決済（カード残高不足等）が失敗し、Stripeから決済失敗のインベントが飛んできたとき | ログインは維持。 | 当日進行中の即凍結リスク。 | Stripe Smart Retries 連動の猶予（数日）— 詳細は S3。 | S3 | P1 |
| ACC-COMM-04 | 都度課金の決済（Stripe Checkout）が完了したが、領収書メールがユーザーに届かず、アカウント画面からも履歴が見えないとき | 売掛・督促はStripe側。 | 再購入躊躇。 | Stripe Customer Portal リンク（S3）。 | S3 | P2 |
| ACC-COMM-05 | 幹事が複数のメールアドレスで別々にログインし、それぞれの意図で同じクレジットカードを使って決済したとき | 課金キーは `auth.users.id`。 | Stripe Customer 乱立。 | 1アカウント=1 Customer · 合算不可（仕様）。 | S1.5 | P2 |

### 3-6. 境界越え（Boundary）

| ID | 問題 / シナリオ | 現状の決定 | ギャップ / リスク | 推奨方針 | フェーズ | 優先度 |
| --- | --- | --- | --- | --- | --- | --- |
| ACC-BOUND-01 | コア無料版（localStorage）のデータを、新しく契約したSync（クラウド）へ初めてインポート（取込）するとき | コアを人質にしない（Syncは上乗せ）。 | スキーマ衝突。 | 新規ルームとして取込 or 明示上書き。S1は localStorage 取込のみ実装済。 | S1 | P0 |
| ACC-BOUND-02 | SyncのルームからエクスポートしたJSONを、翌年の別イベントの「無料版テンプレート」としてコア側（非ログイン）へ食わせるとき | コア取込は可。 | クラウドメタが混入。 | export/import 時にインフラ列を strip。 | S1 | P0 |
| ACC-BOUND-03 | 幹事が共有した閲覧URL（`/e/{event_public_id}`）が関係者以外（SNS等）に漏洩し、部外者にアクセスされたとき | 共有URLはログイン不要（S2）。 | 個人情報漏洩・責任。 | 共有画面・設定に URL 漏洩は自己責任の短い注意（TOS 整合）。 | S2 | P1 |
| ACC-BOUND-04 | 現場のタイムライン編集を「幹事」と「副幹事」の2人で行いたいが、アカウントが1つ（S1仕様）しかないとき | 席課金・招待はS4+。 | 同時ログイン競合。 | S1は1編集者 · 他は閲覧URL。 | S1 | P0 |
| ACC-BOUND-05 | `sugudasu.com`（コア）にいる未認証ユーザーが、`sync.sugudasu.com`（Sync）のボタンを押したときのセッション遷移 | アカウント非共有 · 別 Supabase。 | セッション混線。 | 外部リンク遷移 · 状態引数なし。 | S1 | P0 |

### 3-7. 運用・法務・信頼（Ops / Legal / Trust）

| ID | 問題 / シナリオ | 現状の決定 | ギャップ / リスク | 推奨方針 | フェーズ | 優先度 |
| --- | --- | --- | --- | --- | --- | --- |
| ACC-OPS-01 | 幹事が「ルームの削除」だけを行って退会した気になっているが、アカウント（サブスク）自体は課金継続しているとき | 退会とルーム削除は別。 | 誤認・返金トラブル。 | ルーム削除UIでサブスクは別操作と短く明示（S3）。 | S1.5 | P1 |
| ACC-OPS-02 | 無料プランのユーザーが、画面上の「パージ予定日」を見て「なぜこの日数なのか」の根拠をFAQ等で探そうとしたとき | grace・quota は FAQ 化しない（§3-2）。 | 不信・問い合わせ増。 | **日付の事実のみ** · 内訳説明は法務要約に留める。 | S1 | — |
| ACC-OPS-03 | パージ日を過ぎて進行表が完全自動消滅したあと、ユーザーから損害賠償要求があったとき | UIは保持期限日付。 | 法務リスク。 | TOS・データライフサイクルポリシーで防御。登録時同意は法務判断。 | S1 | P0 |
| ACC-OPS-04 | 特定のルームが利用規約違反通報され、運営側で緊急ロックするとき | 退会は Functions。 | 全アカウントBANの過剰制限。 | **該当 `sync_rooms` 行のみ** ブロックフラグ（S2+ · 未スキーマ）。 | S2 | P2 |
| ACC-OPS-05 | 登録後、一度も有料決済を行わず、ルームも作成していないアカウント（休眠）が滞留したとき | 永久アーカイブなし。 | auth.users 肥大。 | 休眠削除は **監視のみ**（個人開発 · 数万件前は不要）。 | S2+ | 監視のみ |

### 3-8. 脅威・不正（Abuse / Security）

| ID | 問題 / シナリオ | 現状の決定 | ギャップ / リスク | 推奨方針 | フェーズ | 優先度 |
| --- | --- | --- | --- | --- | --- | --- |
| ACC-ABUSE-01 | 攻撃者がサインアップ画面やパスワードリセット画面で、大量のメールアドレスの存在有無を走査（列挙）したとき | メールはログインID。 | 登録済みメール漏洩。 | 応答の同一化（Supabase デフォルト + UI文言）。 | S1 | P0 |
| ACC-ABUSE-02 | 悪意ある幹事が、使い捨てメールで trial 量産するとき | trial同時1ルーム。 | 売上蒸発。 | 使い捨てMX制限 · IP監視（S1.5）。 | S1.5 | P1 |
| ACC-ABUSE-03 | `sync.sugudasu.com` に酷似したフィッシングサイト | パスワード必須。 | クレデンシャル窃取。 | 公式URL案内 · `window.location.origin` 確認（Next.js 変数は **不採用**）。 | S1 | P0 |
| ACC-ABUSE-04 | 攻撃者が payload を肥大化して512KiB突破を試みたとき | 512KiB/room · トリガーあり。 | DoS。 | `sync_enforce_payload_size` 適用済 — E2E確認。 | S1 | P0 |
| ACC-ABUSE-05 | `expired` ルームに古いトークンで POST 保存を試みたとき | grace中は保存停止（方針）。 | APIバイパス。 | RLS に `entitlement` / `retain_until` 条件を S3 で追加。 | S3 | P0 |

---

## 4. 横断マトリクス

（Gemini 原文 — 列 `status` は本リポでは `entitlement` に読み替え）

| 問題 ID | `auth.users.id` | `entitlement` | `retain_until` | `Stripe` | `UI` |
| --- | --- | --- | --- | --- | --- |
| ACC-ID-01 | ● | — | — | — | — |
| ACC-ID-02 | — | — | — | ● | — |
| ACC-ID-03 | ● | — | — | — | ● |
| ACC-AUTHZ-05 | ● | ● | — | — | — |
| ACC-ABUSE-05 | — | ● | ● | — | — |
| … | （全文は Gemini 出力参照 · 上表と同趣旨） | | | | |

---

## 5. 未決事項トップ10（提督判断が必要なもの）

1. **SCH-B01** — entitlement 書込ゲートの S1 先行 vs S3 一括（owner RLS は **済**）
2. **SCH-B02** — 都度課金チケット：購入直後紐付け vs プールスタック
3. **SCH-B03** — trial 超過：作成ロック（**採用案**）vs 最古自動アーカイブ
4. **SCH-B04** — grace 日数（14日案 · 調整可）
5. **SCH-B05** — 救済後払いの abuse 防止ライン（`had_emergency_relief` + カード fingerprint 等）
6. **SCH-B06** — 閲覧 URL の任意パスワード（S2）
7. **SCH-B07** — 休眠アカウント自動削除（**当面監視のみ** でよいか）
8. **SCH-B08** — 512KiB 超過時の UI 文言
9. **SCH-B09** — 退会時 Stripe Customer delete vs cancel のみ
10. **SCH-B10** — ブルートフォース時のロック解除フロー

---

## 6. 明示的にスコープ外

* コア無料の localStorage 暗号化
* Schedule 別 SKU 連携
* Stripe Checkout UI カスタム

---

## 7. 推奨ロードマップ

### S1 ブロッカー（Agent 修正済み優先度）

| 必須 | ID | 備考 |
|------|-----|------|
| ○ | ACC-ID-01 | `sync_profile_bootstrap` マイグレーション予定 |
| ○ | ACC-AUTH-05 | refresh サイレント更新 |
| ○ | ACC-AUTHZ-04 | JSON メタ無視 |
| ○ | ACC-AUTHZ-05 | **owner RLS 済** · entitlement ゲートは S3 |
| ○ | ACC-LIFE-01 | トリガー済 · UI マップ |
| ○ | ACC-COMM-01 | 退会 API NULL 分岐 |
| ○ | ACC-ABUSE-04 | トリガー済 |
| △ | ACC-AUTHZ-01 | **クライアント仮有効化は不採用** — Webhook 冪等 + ポーリングのみ |

### S1.5 / S2

ACC-ID-02 · ACC-AUTHZ-02 · ACC-LIFE-02 · ACC-LIFE-03 · ACC-BOUND-03 · ACC-OPS-01 · ACC-ABUSE-02

### S3 / S4+

ACC-COMM-03/04 · ACC-ID-04 · ACC-BOUND-04 · ACC-ABUSE-05（entitlement RLS）

---

## 8. 業界ベンチマークとの乖離（Gemini 原文要約）

1. 解約後も `retain_until` で容赦なくパージ（倉庫にしない）
2. サーバ版歴なし · JSON 自己保管
3. ログイン維持 + 保存のみロック（grace）
4. FAQ に内規日数を載せない（**ただしルームごとの保持期限日付は UI に表示 — §3-2 補正**）

---

## 9. SSOT 照合メモ（Agent · 2026-06-26）

Gemini 結果を本リポジトリの確定方針と照合。**採用前に提督が確認。**

### 9-1. 事実誤り・用語の修正

| Gemini 記述 | 正本 |
|-------------|------|
| 「S1 RLS 未実装」 | **`auth.uid() = owner_id` RLS は `20260625_sync_s1.sql` で適用済**。未実装なのは **entitlement による書込拒否** のみ |
| `sync_rooms.status = 'active'` | 列名は **`entitlement`**（trial/active/expired） |
| `projectId` · `is_blocked` | スキーマは **`sync_rooms.id`** · モデレーション列は **未設計** |
| `NEXT_PUBLIC_SITE_URL` | スタックは **Cloudflare Pages + 素の JS** — env は `SYNC_*` |
| Telegram パージ通知 | **スコープ外** — メール · ルーム内 UI のみ |

### 9-2. 提督確定方針と矛盾する Gemini 推奨（採用しない）

| ID | Gemini | 本リポ |
|----|--------|--------|
| ACC-AUTHZ-01 | クライアントから仮有効化レシート | **不採用** — 権利正本はサーバ · Webhook 冪等 + UI「反映待ち」 |
| ACC-ID-05 | Webhook 完了まで deleteUser 待ち | **過剰** — Functions 内で Stripe API 解約 → 成功後 deleteUser で足りる |
| ACC-OPS-02 | FAQ に「短期バッファ仕様」を書く | **§3-2** — 内規 FAQ 化しない |
| ACC-LIFE-04 | UI に「JSON 自己保管必須」を大きく | **§3-2** — 法務文書 + 保持期限日付のみ |
| ACC-LIFE-01 | 古いルーム自動削除の選択肢 | **不採用** — 作成ロックのみ（`SYNC_RETENTION_POLICY` §3-1） |
| ACC-LIFE-03 | Telegram 通知 | 不採用 |

### 9-3. そのまま採用してよい軸

* 8 カテゴリ MECE 分割（§2-A）
* ACC-AUTHZ-04（JSON 課金メタ無視）
* ACC-BOUND-02（export strip）
* ACC-COMM-01（Stripe NULL スキップ）
* grace = 閲覧可 · 保存不可（§3-1b）
* 未決 SCH-B02（チケット紐付け）· SCH-B06（閲覧 URL パスワード）

### 9-4. 次アクション（提督）

1. **SCH-B02 · B03 · B04 · B09** を決める → `SYNC_AUTH_POLICY.md` または `SYNC_RETENTION_POLICY.md` に昇格
2. ACC-ID-01 · §1c 退会 · ACC-AUTH-05 を `SYNC_S1_REMAINING_TASKS.md` と突合
3. 採用した問題 ID を `BACKLOG.md` §5-4 に必要分のみ追記

---

## 10. 変更履歴

| 日付 | 内容 |
|------|------|
| 2026-06-26 | §11 β期間 — Non課金 / 課金（S3+）分割 · 拡張性フック |
| 2026-06-26 | Gemini 初版 + Agent §9 SSOT 照合 |

---

## 11. β期間スコープ — Non課金 vs 課金（提督 2026-06-26）

**方針:** βは **決済API（Stripe 本番 · Checkout · Webhook）を導入しない**。審査・接続に時間がかかるため **課金列の設計判断・E2E・実装は今やらない**。  
ただし **課金接続を前提に、スキーマ · ID 境界 · Functions フック · スタブだけは β で入れておく**（冗長性・拡張性）。

**Backlog 正本:** [`BACKLOG.md`](../BACKLOG.md) §5-4「β期間 — アカウント MECE」

### 11-1. βで実装する（Non課金 · 今やる）

| ID | 要約 | βでの実装 |
|----|------|-----------|
| ACC-ID-01 | signup 後 `sync_profiles` 1:1 | DB trigger or `ensureSyncProfile` |
| ACC-ID-03 | コア↔Sync データ非共有の明示 | UI 1行 · 取込は明示操作のみ |
| ACC-ID-05 | 退会 | **β:** JWT `user_id` · PW再確認 · `deleteUser` CASCADE · **Stripe 分岐は空** |
| ACC-AUTH-01〜05 | 認証・セッション | パスワード Auth · refresh · 列挙同一応答 |
| ACC-AUTHZ-04 | JSON 課金メタ無視 | import 時 strip（S2 ファイル import） |
| ACC-AUTHZ-05 | RLS | **owner RLS 済** · `expired` 書込拒否は **ポリシー骨格のみ**（常に trial 相当でも可） |
| ACC-LIFE-01 | trial 1枠 | トリガー済 · UI `room_quota_exceeded` |
| ACC-LIFE-02 | grace 閲覧のみ | **β:** `entitlement=expired` の手動テスト用 · 本番は S2 UI |
| ACC-LIFE-03 | パージ前通知 | ルーム行 `retain_until` 表示 · 直前バナー（S2） |
| ACC-LIFE-04 | パージ後復元不可 | 法務文書 · UI は日付のみ（§3-2） |
| ACC-LIFE-05 | 同時編集コンフリクト | `revision` 楽観ロック（S2） |
| ACC-BOUND-01〜05 | コア境界 · 共有URL設計 | localStorage 取込 · 外部リンク · S2 `/e/` |
| ACC-OPS-02〜03 | 表示・法務 | FAQ 内規化しない · TOS/データライフサイクル |
| ACC-OPS-04 | モデレーション | 将来 `sync_rooms` ブロック列 — 設計メモのみ可 |
| ACC-OPS-05 | 休眠アカウント | **監視のみ** |
| ACC-ABUSE-01〜04 | 列挙 · trial 乱用 · フィッシング · payload | 応答同一化 · MX（S1.5）· origin · トリガー確認 |
| ACC-ABUSE-05 | expired への POST | RLS 骨格（`retain_until` AND）— β は trial 固定で実質未発火可 |

**未決（Non課金 · β内で決めてよい）:** SCH-B03（trial 超過=作成ロック）· SCH-B06（閲覧 URL パスワード · S2）· SCH-B08（512KiB 文言）· SCH-B10（ブルートフォース解除）

### 11-2. 課金API接続後まで保留（課金 · 今考えない）

| ID | 要約 | 接続時フェーズ |
|----|------|----------------|
| ACC-ID-02 | メール変更 → Stripe Customer | S3 |
| ACC-AUTHZ-01 | Webhook 遅延 · entitlement 反映 | S3 |
| ACC-AUTHZ-02 | チケット↔ルーム紐付け | S3 |
| ACC-AUTHZ-03 | 救済後払い abuse 防止 | S2/S3 |
| ACC-COMM-01 | 退会時 Stripe 解約（NULL 以外） | S3 |
| ACC-COMM-02 | `cancel_at_period_end` | S3 |
| ACC-COMM-03 | 決済失敗 Smart Retries grace | S3 |
| ACC-COMM-04 | Stripe Customer Portal | S3 |
| ACC-COMM-05 | 1アカウント=1 Customer | S3 |
| ACC-OPS-01 | ルーム削除≠サブスク解約 UI | S3 |
| ACC-ID-04 | Google OAuth | S3+（課金とは独立だが後追い） |

**未決（課金接続前に決めなくてよい）:** SCH-B02 · SCH-B04 · SCH-B05 · SCH-B07 · SCH-B09

### 11-3. βで入れる拡張性フック（課金なしでも実装）

| フック | 場所 | βの状態 |
|--------|------|---------|
| 正本 ID = `auth.users.id` | 全 API · RLS | **必須** — メールでユーザー検索しない |
| `sync_profiles` + `stripe_customer_id` NULL可 | DB | マイグレーション済 · bootstrap 残 |
| `user_entitlements` 空テーブル | DB | マイグレーション済 |
| `sync_rooms.entitlement` | DB · UI | β は `trial` 固定運用可 |
| `POST /api/account/delete` | Functions | JWT `sub` · **Stripe 呼び出し空分岐** |
| `POST /api/webhooks/stripe` | Functions | **501 スタブ** |
| signup `ensureSyncProfile(userId)` | クライアント/Functions | 未実装 P0 |
| entitlement 書込 RLS | DB | ポリシー雛形 or コメント — S3 で有効化 |
| Checkout ルート予約 | Functions | 未実装 · ルートだけでも可 |

**禁止（β）:** Stripe 本番キー · Checkout 導線の本番公開 · クライアント仮有効化レシート（ACC-AUTHZ-01）
