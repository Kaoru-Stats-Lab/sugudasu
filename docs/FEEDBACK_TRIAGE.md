# 改善リクエスト・トリアージ（運用 SSOT）

更新: 2026-08-14  
**主経路（唯一）:** インページ FB（フッタ＋失敗時＋ roadmap/updates/contact 等）→ GitHub Issues · label `feedback-inbox` — **Cursor / `gh` が直接読める**  
**取込仕様:** [`notes/QUALITATIVE_FEEDBACK_INTAKE.md`](notes/QUALITATIVE_FEEDBACK_INTAKE.md)  
**Google Form:** **Purge（2026-08-14）** — ユーザー面のリンク全削除。管理者名露出回避 · Cursor 不可読のため主経路から廃止。旧スプシはアーカイブのみ（新規着信想定なし）。  
**公開履歴（反映済みのみ）:** `data/changelog.json` · `tools/updates.html`

---

## 0. Inbox 方針（2026-08-14〜）

| 経路 | 正本 | Cursor |
|------|------|--------|
| **インページ FB** | GitHub Issues（`feedback-inbox`） | **読める**（`gh issue list`） |
| **Google Form** | — | **Purge**（リンクなし · 新規誘導禁止） |
| **メール** | AdSense 審査用に `/contact` · `/updates` に当面残置 | 弱い · 主経路にしない |

**Agent:** 未読は `gh issue list -R Kaoru-Stats-Lab/sugudasu --label feedback-inbox --state open`。旧 FB-ID（`FB-20260617-002` 等）は本ファイル下部キュー＋ Backlog を参照。

---

## 1. 3層に分ける（推奨）

| 層 | 置き場 | 誰が見る | 載せるもの |
|----|--------|----------|------------|
| **Inbox** | GitHub Issues `feedback-inbox` | 提督 · Cursor | メタ＋短文（返信なし） |
| **Triage** | 本ファイル + `docs/BACKLOG.md` | 提督・Agent | 要約・ステータス・要件メモ・Backlog 参照 |
| **Shipped** | `data/changelog.json` | 全ユーザー | **編集済み・過去形**のリリースログのみ |

---

## 2. 旧 Google Form / スプシ（アーカイブ）

Form URL はサイトから削除済み。過去回答のスプシは提督ローカル参照のみ（サイト・ドキュメントのユーザー導線に載せない）。

旧 Status 列・FB-ID 運用は **§5 キュー表**に残る履歴のみ。新規は Issue 番号で管理。

---

## 3. 運用フロー（1件あたり）

1. ユーザーがインページ FB 送信 → Issue 着信
2. Agent / 提督が `feedback-inbox` を確認 · 要約
3. 採用なら **BACKLOG** に起票 · Issue に Backlog 参照をコメント
4. 実装・デプロイ後 → `changelog.json` → Issue close

---

## 4. ステータス（Issue / 本ファイル共通語彙）

| Status | 意味 |
|--------|------|
| `inbox` | 未整理 |
| `要件定義` | 採用意欲あり・仕様未確定 |
| `planned` | 仕様確定・実装待ち |
| `done` | 反映済み |
| `wontfix` | 不採用 |
| `duplicate` | 重複 |

---

## 5. 旧キュー表（Form 時代 · 参照のみ）

| FB-ID | Status | Backlog | メモ |
|-------|--------|---------|------|
| `FB-20260617-001` | `done` | `§12-1` | 枠数1-3・名称可変。changelog 2026-06-17 反映済 |
| `FB-20260617-002` | `要件定義` | `§12-2` | 複数人/帯・新人のみ禁止 |

---

## 変更履歴

| 日付 | 内容 |
|------|------|
| 2026-08-16 | token 未設定で全ページ 503 だった。secret 投入 · labels 作成。受信 Inbox は 0件。再デプロイ後に確認 |
| 2026-08-14 | Google Form ユーザー導線 Purge · インページ FB へ収斂 |
| 2026-08-13 | インページ FB → Issues を主経路に採択 |
