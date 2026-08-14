# 定性フィードバック受け皿 — 取込仕様（SSOT）

**更新:** 2026-08-14  
**地位:** 役員会採択（フッタ＋失敗時 · Inbox=GitHub Issues）  
**リサーチ:** [`qualitative-feedback-research/SYNTHESIS.md`](qualitative-feedback-research/SYNTHESIS.md)  
**運用:** [`../FEEDBACK_TRIAGE.md`](../FEEDBACK_TRIAGE.md)  
**Google Form:** **2026-08-14 Purge** — ユーザー面リンク全削除（管理者名露出回避 · Cursor 不可読）。窓口は本仕様のインページ FB のみ。

---

## 0. 採択

| ID | 内容 | 判定 |
|----|------|------|
| **QF-1** | シェルフッタの静かな「フィードバック」→ インページ短文＋分類 | **Adopt** |
| **QF-2** | 失敗・空出力付近の「不具合を報告」 | **Adopt** |
| **QF-3** | 送信先 = **GitHub Issues**（Cursor / `gh` が直接読める） | **Adopt** |
| QF-4 | コピー成功直後の催促 | **Reject** |
| QF-5 | Hub 上部バナー | **Defer** |
| QF-6 | 公開★ · NPS · 報酬 | **Reject** |
| QF-7 | 成功定義 = 月数件でも受け皿 OK（件数≠ Discoverability 失敗） | **Adopt** |
| **QF-8** | Google Form をユーザー導線から **Purge**（roadmap/updates/contact/調査LP含む） | **Adopt（2026-08-14）** |

**やらない:** Google Form を主経路・任意第2窓口にする（Cursor が読めない · 遷移摩擦 · 管理者アカウント露出）。

---

## 1. なぜ GitHub Issues か

| 受信箱候補 | Cursor が直接読めるか | 判定 |
|------------|------------------------|------|
| Google Form / スプシ | **不可**（ブラウザ・提督手作業） | 主経路から外す |
| メール | 弱い | 使わない |
| リポ内 MD 自動 commit | 読めるが履歴汚染・競合 | 非採用 |
| Supabase 表 | MCP 経由で読めるが新スタック | 過剰 |
| **GitHub Issues + label** | **`gh issue list` / Agent が読める** | **Adopt** |

**Agent 操作例（予定）:**

```powershell
gh issue list -R Kaoru-Stats-Lab/sugudasu --label feedback-inbox --state open
gh issue view <n> -R Kaoru-Stats-Lab/sugudasu
```

---

## 2. データ経路

```text
[ツール画面]
  フッタ「フィードバック」 または 失敗インライン「不具合を報告」
    → インページパネル（遷移なし）
    → ユーザーが明示「送信」（オプトイン）
        → POST /api/feedback   （Cloudflare Pages Function · core）
            → GitHub Issues API
                title / body / labels: feedback-inbox, tool:<id>, kind:<bug|ux|feature>
```

- **仕事データ・ファイル・プレビュー本文は送らない**（F2）。
- Core の「業務データ非送信」主張と両立するため、UI に **「任意の製品フィードバック送信（メタ＋短文のみ）」** を明示。送信しない限りネットワークしない。
- 返信しない（匿名 · メール欄なし）。パネルに1行明記。

---

## 3. ペイロード（メタのみ）

| フィールド | 必須 | 内容 |
|------------|:----:|------|
| `tool_id` | ○ | registry id（例: `stamp`） |
| `source` | ○ | `footer` \| `failure_inline` \| `updates` \| `contact` \| `roadmap` \| `paper-schedule-research` 等 |
| `kind` | ○ | `bug` \| `ux` \| `feature` \| `other` |
| `message` | ○ | 短文（上限 500 文字 · trim） |
| `app_version` | — | changelog / registry version があれば |
| `error_code` | — | failure 時のみ（本文なしのコード） |
| `ua_short` | — | ブラウザ族＋OS 程度（UA 全文は切る） |
| `viewport` | — | `WxH` 数値のみ |
| `page_path` | — | clean path（`/stamp`） |

**禁止:** メール · 氏名 · 入力本文 · 出力本文 · ファイル名 · プレビュー断片 · GA client_id の突合用キー。

**Issue タイトル例:** `[feedback] stamp · bug`  
**Issue 本文:** 上記フィールドを Markdown 表＋ `message` 引用。冒頭に「ユーザー任意送信 · 返信しない」注記。

---

## 4. UI（配置）

### 4.1 フッタ（QF-1）

- `sugudasu-shell` フッタに **「フィードバック」** テキストリンク（問い合わせの近く · 目立たせない）。
- クリックでページ下部 or インラインパネル展開（モーダル全面は避ける）。
- 分類 1 クリック ＋ 短文 ＋ 「送信（任意）」＋ 注意書き。

### 4.2 失敗時（QF-2）

- 空出力・ゲート拒否・明示エラーの **メッセージ直下** に「不具合を報告」（任意）。
- `source=failure_inline` · 可能なら `error_code` を自動付与。
- `tool_job_failed`（GA4）とは別物（定性本文は GA に載せない）。

### 4.3 コピー成功時

- **何もしない**（QF-4 Reject）。

---

## 5. サーバ（CF Function）

| 項目 | 方針 |
|------|------|
| パス | `functions/api/feedback.js` → `POST /api/feedback`（core Pages） |
| 秘密 | `GITHUB_FEEDBACK_TOKEN`（Issues 作成のみ · fine-grained） |
| レート制限 | IP ハッシュあたり **10件/日**（Captcha なし） |
| スパム | 空 message 拒否 · 文字種異常 · 同一 message 連投拒否 |
| CORS | `sugudasu.com` のみ |
| レスポンス | `{ ok: true, issue_number?: n }`（URL はユーザーに見せないでも可） |

**憲法メモ:** このエンドポイントは **製品フィードバック専用レーン**。業務データのアップロード API ではない。privacy / statements に1行追記が必要（実装時）。

---

## 6. トリアージ（Cursor 向け運用）

旧: Form → スプシ（提督のみ）→ 要約を Git へ。  
新:

| 層 | 置き場 | 誰 |
|----|--------|-----|
| **Inbox** | GitHub Issues · `feedback-inbox` | 提督 · **Cursor Agent** |
| **Triage** | Issue コメント or `FEEDBACK_TRIAGE.md` キュー · Backlog | 同上 |
| **Shipped** | `changelog.json` | 公開 |

1. Agent / 提督が `gh issue list --label feedback-inbox` で未読確認  
2. 採用 → Backlog 節 + Issue を close（または `triaged` label）  
3. 不採用 → `wontfix` label + 理由コメント  
4. Form 着信（レガシー）は当面スプシのまま。新規 UI は Issues のみ。

---

## 7. 実装チェックリスト

- [x] `functions/api/feedback.js` + レート制限（Cache API 近似）
- [ ] CF Pages（sugudasu）に `GITHUB_FEEDBACK_TOKEN` 設定 · 任意で OWNER/REPO
- [ ] label `feedback-inbox` · `feedback-kind-bug|ux|feature|other` 作成
- [x] `assets/sg-feedback.js`（パネル · 失敗ストリップ）
- [x] `sugudasu-shell.js` フッタリンク + module 読込
- [x] `notifyJobFailed` → `sg:job-failed` → 失敗ストリップ
- [x] privacy に任意送信レーン追記
- [x] updates / contact — インページ主経路 · **運営メールは AdSense 通過まで残す**
- [x] `FEEDBACK_TRIAGE.md` を本 SSOT 参照に更新

### 7.1 提督セットアップ（初回のみ）

1. GitHub fine-grained PAT: repo `Kaoru-Stats-Lab/sugudasu` · **Issues: Read and write**
2. Cloudflare Dashboard → Pages → `sugudasu` → Settings → Environment variables  
   - `GITHUB_FEEDBACK_TOKEN` = PAT（Encrypt）  
   - 任意: `GITHUB_FEEDBACK_OWNER=Kaoru-Stats-Lab` · `GITHUB_FEEDBACK_REPO=sugudasu`
3. Labels（一度だけ）:

```powershell
gh label create feedback-inbox -R Kaoru-Stats-Lab/sugudasu -c "0E8A16" -d "User in-page feedback inbox"
gh label create feedback-kind-bug -R Kaoru-Stats-Lab/sugudasu -c "D73A4A"
gh label create feedback-kind-ux -R Kaoru-Stats-Lab/sugudasu -c "FBCA04"
gh label create feedback-kind-feature -R Kaoru-Stats-Lab/sugudasu -c "1D76DB"
gh label create feedback-kind-other -R Kaoru-Stats-Lab/sugudasu -c "BFDADC"
```

4. Agent 読み取り: `gh issue list -R Kaoru-Stats-Lab/sugudasu --label feedback-inbox --state open`

### 7.2 AdSense 暫定

`updates` / `contact` / `privacy` に表示する `banzai.millionaire@gmail.com` は **審査通過後に削除**する（HTML コメント `AdSense 審査対策` で検索）。

---

## 改訂履歴

| 日付 | 内容 |
|------|------|
| 2026-08-14 | QF-8 · Google Form ユーザー導線 Purge · source に roadmap/updates/contact 等 |
| 2026-08-13 | 初版 — QF-1/2/3/7 Adopt · Inbox=GitHub Issues · Form 主経路廃止方針 |
