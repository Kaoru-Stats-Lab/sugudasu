# Gemini依頼用: 運営者プロフィール L0〜L4（カオル）

更新: 2026-06-17

職務経歴書（**リポ外・非公開**）から、公開用プロフィール段階を生成する。  
**正本:** `docs/operator-profile.md`

---

## Gemini への依頼文（コピペ用）

```text
【役割】編集者。礼賛・誇張禁止。捏造禁止。
【タスク】添付の職務経歴書から、公開用プロフィールを段階別に各1案ずつ作成。

【公開方針】
- 表記名: カオル（本名・勤務先社名・法人名・連絡先は一切出力しない）
- サービス: SUGUDASU（https://sugudasu.com/）— 登録不要・ブラウザ内処理
- 開発: 非エンジニア · Claude/Gemini/Grok 活用 · Cloudflare Pages
- 「Vibe Coding」は使わない（飽和のため）
- 利用者数・テストユーザー数など未記載の数字は書かない

【字数（厳守・末尾に実字数を記載）】
- L0: 40字以内 — 肩書き1行
- L1: 80字以内 — 取材用一言
- L2: 160字以内 — Xプロフィール（URL含めてよい）
- L3-public: 350字以内 — 社名なし（公開用）
- L4: 700字以内 — サイト運営者紹介

【文体】
- です・ます調または体言止め（媒体に合わせ統一）
- 「画期的」「実務家」「完全」「極限」禁止

【出力形式】
■ L0 …（N字）
■ L1 …
（以下同様）

【禁止】履歴書にない実績 · 会社名 · 礼賛の総評

【添付】
（職務経歴書をここに貼る）
```

---

## L3-press 専用（別チャット · 社名あり）

**保存先:** `docs/private/L3-press.md`（gitignore）· ひな形 `docs/L3-press.TEMPLATE.md`

```text
【役割】編集者。礼賛禁止。捏造禁止。
【タスク】職務経歴書から PR TIMES 担当者欄用 L3-press を1案。350字以内。

【公開方針】
- 表記名: カオル（本名・現職社名・連絡先は出さない）
- 社名は履歴書にあるもののみ、最大2社。「株式会社○○（当時）」形式
- 役職は短く。SUGUDASU 個人開発・Cloudflare・非送信設計で締める
- Vibe Coding / 利用者数 / 礼賛語 禁止

【出力】L3-press 本文のみ + 実字数。L0〜L4 は出さない。

【添付】職務経歴書
```

---

## 反映手順

1. Gemini 出力を `operator-profile.md`（L0〜L4-public）と突合
2. L3-press は `docs/private/L3-press.md` に手動保存（**コミットしない**）
3. PR方針（`PR_TIMES_LAUNCH_2026.md`）と矛盾があれば Claude で修正

---

## 関連

- `docs/operator-profile.md`
- `docs/L3-press.TEMPLATE.md`
- `docs/private/`（L3-press 正本 · gitignore）
