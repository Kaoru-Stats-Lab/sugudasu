# SUGUDASU Sync Statements — ページドラフト（未実装）

**更新:** 2026-06-26  
**ステータス:** **ブレスト + 起票** — HTML 未実装 · Go/要件は別途  
**想定 URL:** `https://sync.sugudasu.com/statements`（`tools/sync-statements.html` または Sync ビルド配下）  
**種別:** 法務ではない · **Sync ラインの製品哲学**（非契約 · 読み物）

> **なぜ別ページか:** コア [`STATEMENTS_PAGE_DRAFT.md`](STATEMENTS_PAGE_DRAFT.md)（`sugudasu.com/statements`）は **登録不要 · 非送信 · 名簿を預けない** が正。Sync は **アカウント · クラウド短期バッファ · 有料** で約束が逆になるため、**同じ文言を流用すると誤認**する。  
> **正本:** コア約束は変更しない · [`SUGUDASU_SYNC_LINE.md`](SUGUDASU_SYNC_LINE.md) §1 · [`SYNC_STORAGE_QUOTAS.md`](SYNC_STORAGE_QUOTAS.md) §4-3

---

## 1. コア Statements との住み分け

| | **コア** `sugudasu.com/statements` | **Sync** `sync.sugudasu.com/statements` |
|--|-----------------------------------|----------------------------------------|
| 読者 | 無料ツール利用者全般 | 稟議・購入検討 · 現場スタッフ |
| 登録 | 不要 | **必須**（共有のため） |
| データ | ブラウザ内 · 設計上サーバー非保存 | **イベント単位の短期クラウド** |
| 広告 | あり（現状） | **なし** |
| 課金 | 無料（将来 Pro はコアを人質にしない） | **事前チケット**（本番中 Checkout なし） |
| 相互リンク | フッター「Sync は別ライン」→ Sync statements | 冒頭「無料コアの約束は [こちら](https://sugudasu.com/statements)」 |

---

## 2. SEO 案

```text
title: SUGUDASU Sync の約束 — 短期バッファ · 手動反映 · コアは登録不要のまま | すぐだす
description: SUGUDASU Sync はイベント進行の共有・同期ライン。クラウドは短期バッファ、版は手動反映、本番中の決済は求めません。コア無料版との境界を公開しています（非契約）。
```

**避ける:** 「完全同期」「永久保存」「名簿を預けない」（Sync では不正確）

---

## 3. 30秒で読む要点（文案たたき）

> **SUGUDASU Sync** は、コア無料ツールの上に載せる **任意の共有ライン** です。  
> 進行表などは **イベント単位の短期バッファ** に載せ、期限後は削除します。  
> 閲覧者への反映は **手動** を基本とし、勝手に画面を書き換えません。  
> **登録不要・非送信のコア**（`sugudasu.com`）は、これまでどおり維持します。

**ピル（案）**

| ピル | 意味 |
|------|------|
| 短期バッファ | retain_until 後に削除 · 永久アーカイブではない |
| 手動反映 | 新版検知 ≠ 自動上書き |
| コアは無料 | Sync を買わなくても幹事作業は完結 |

---

## 4. Sync の設計原則（案 · 7本 — コア F1–F7 とは別軸）

| # | 原則（公開見出し） | 意味（1行） |
|---|-------------------|-------------|
| **S1** | **コアは人質にしない** | `sugudasu.com` の登録不要ツールは、Sync 未契約でも使える |
| **S2** | **共有は任意** | 1人で足りる現場に Sync を強制しない |
| **S3** | **短期バッファ** | クラウドはイベント運用のための一時領域 · 期限後削除（[`SYNC_STORAGE_QUOTAS.md`](SYNC_STORAGE_QUOTAS.md)） |
| **S4** | **手動反映が既定** | 閲覧者は新版を **自分で取り込む**（本番事故防止） |
| **S5** | **本番中に課金しない** | 事前チケット · 当日は消費 or 救済のみ（[`GROUP_SPLIT_SYNC_BILLING_CTA_AND_QUOTE.md`](GROUP_SPLIT_SYNC_BILLING_CTA_AND_QUOTE.md)） |
| **S6** | **広告を載せない** | Sync ドメインに AdSense を置かない |
| **S7** | **開発中は隠さない** | S1/S2 などフェーズをページ上で開示（LP と一致） |

---

## 5. 正直な但し書き（Sync 用）

- 同期には **インターネット経由でデータがサーバーに送信** されます（コアとは異なる）。
- **実名・名簿の全面預け** を前提にしない設計を目指すが、**E2EE 等の詳細は要確認**（LP と同じ誠実さ）。
- **アクセス解析** 等、インフラ・運用上の通信は発生しうる → `privacy` と整合。
- **RLS** で他アカウントからの隔離を図るが、**安全性の保証** ではない。

---

## 6. あえてやらないこと（Sync）

| やらない | 理由 |
|----------|------|
| コア機能のログイン必須化 | F1 維持 |
| 永久クラウドアーカイブ（既定） | ストレージコスト · 稟議上のデータ持ち越し |
| 本番中の Checkout / 3DS | 現場 UX |
| Zoom/Teams 自動制御 | OAuth · 従量（`SUGUDASU_SYNC_LINE`） |
| 社内掲示板・全社ポータル | スコープ外 |
| 「100% リアルタイム同期」の断定 | S2 設計中 |

---

## 7. 実装メモ（将来）

| 項目 | 案 |
|------|-----|
| ファイル | `tools/sync-statements.html` |
| Chrome | Sync **focus**（ナビなし · `SUGUDASU_SYNC_LINE` §1-1） |
| ビルド | `build-pages.mjs` Sync ルートに `/statements` |
| フッター | `sync-timeline-lp.html` · 将来 `sync-timeline.html` app からリンク |
| 稟議 PDF | [`GROUP_SPLIT_SYNC_BILLING_CTA_AND_QUOTE.md`](GROUP_SPLIT_SYNC_BILLING_CTA_AND_QUOTE.md) §1-6 概要 PDF から **§4 へ要約リンク** |
| FAQ JSON-LD | 2〜3問（コアとの違い · 保存期限 · S2 状況） |

---

## 8. 変更履歴

| 日付 | 内容 |
|------|------|
| 2026-06-26 | 初版 — コア Statements との分離理由 · S1–S7 たたき · 未実装 |
