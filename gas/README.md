# GAS — Form 着信通知

**正本スクリプト:** `form-on-submit-notify.gs`  
**回答スプレッドシート:** [改善リクエスト（回答）](https://docs.google.com/spreadsheets/d/1rLYbcqHJMpcj3FIfbCi4LypUM-TKYyQ_g8lt4JWfmhw/edit)

Form 送信時に **メール通知** + **FB-ID / Status 自動入力** を行う。GitHub や Agent とは独立（提督が気づくための層）。

---

## Phase 0（コード不要・5分）

Google Form 編集画面 → **回答** タブ → **新しい回答のメール通知を受け取る** を ON。

- 届く内容は簡素だが、**着信に気づく**には十分
- FB-ID 自動付与は Phase 1 の GAS

---

## Phase 1 — GAS 設置（推奨）

### 1. スクリプトを貼る

1. [回答スプレッドシート](https://docs.google.com/spreadsheets/d/1rLYbcqHJMpcj3FIfbCi4LypUM-TKYyQ_g8lt4JWfmhw/edit) を開く
2. **拡張機能** → **Apps Script**
3. `form-on-submit-notify.gs` の内容を貼り付け（既存 `Code.gs` を置換で可）
4. プロジェクト名例: `SUGUDASU Form Notify`

### 2. トリガー追加

1. 左 **トリガー**（時計アイコン）→ **トリガーを追加**
2. 設定:
   - 実行する関数: `onFormSubmitNotify`
   - イベントのソース: **スプレッドシートから**
   - イベントの種類: **フォーム送信時**
3. 初回は Google の **権限承認**（Gmail 送信）が必要

### 3. 通知先メール（任意）

Apps Script → **プロジェクトの設定** → **スクリプト プロパティ**

| キー | 値 |
|------|-----|
| `NOTIFY_EMAIL` | 通知を受け取る Gmail（未設定時はスプシ所有者） |

### 4. Telegram（任意）

| キー | 値 |
|------|-----|
| `TELEGRAM_BOT_TOKEN` | BotFather のトークン |
| `TELEGRAM_CHAT_ID` | チャット ID |

**トークンは Git にコミットしない。** Script Properties のみ。

### 5. Status 列プルダウン（初回1回）

Apps Script エディタで **`setupStatusDropdown`** を選択 → **実行**。

H 列（行 2 以降）に次の6択が付きます:

`inbox` · `要件定義` · `planned` · `done` · `wontfix` · `duplicate`

新規 Form 着信行にも `onFormSubmitNotify` が同じプルダウンを付けます。  
スクリプトを更新したら **GAS エディタに再貼付** → `setupStatusDropdown` を再実行。

### 6. 動作確認

- エディタで `testNotifyLastRow` を選択 → **実行**（最終行をテスト通知）
- または Form からテスト送信 → G 列に `FB-YYYYMMDD-001` · H 列 `inbox` · メール着信

---

## スクリプトがやること

| タイミング | 処理 |
|------------|------|
| Form 送信直後 | G 列 `FB-ID` が空なら自動採番 |
| 同上 | H 列 `Status` が空なら `inbox` |
| Form 送信直後 | H 列に Status プルダウン（6択） |
| 同上 | 提督宛メール（種別・対象・内容・スプシ URL） |
| Telegram 設定時 | 短いプッシュ通知 |

**やらないこと:** GitHub Issue 自動起票 · Agent 起動 · スプシ以外への生データ複製

---

## Phase 2（将来・任意）

| 案 | メリット | 注意 |
|----|----------|------|
| GAS → GitHub Issue API | Agent が Issue を読める | PAT を Script Properties に置く ·  private repo |
| GAS → Slack Webhook | チーム共有 | Webhook URL は秘密 |
| Zapier / Make | ノーコード | 無料枠・外部依存 |

現状は **Phase 0 + Phase 1** で「気づく」までを完結させる。

---

## トラブル

| 症状 | 対処 |
|------|------|
| メールが来ない | トリガーが `onFormSubmitNotify` か · スパムフォルダ · 権限再承認 |
| FB-ID が付かない | ヘッダー行が1行目 · G 列が FB-ID か確認 |
| Telegram だけ失敗 | プロパティ名 typo · chat_id が数値文字列か |
| プルダウンが出ない | `setupStatusDropdown` を1回実行 · GAS を最新版に差し替え |

運用全体: `docs/FEEDBACK_TRIAGE.md`
