# STICKY_ROOM_RELEASE_DOD.md

**何が揃えば公開していいのか** — v1 公開の Definition of Done。  
**仕様書**は「何を作るか」。**本ファイル**は「公開可否」。  
**作業用チェックリスト（手順・コマンド）:** `docs/release-checklist.md`  
**更新:** 2026-07-10

**ルール:** Core · UX · SUGUDASU は原則すべて `[x]`。Quality の手動項は提督確認後に `[x]`。1 つでも Core / SUGUDASU が `[ ]` なら **公開しない**。

---

## Core

同期と生存の最低ライン。欠けると「付箋ルーム」として出せない。

- [x] **単機で利用できる** — ホスト/参加なしで追加 · 移動 · 編集 · 削除
- [ ] **2人同期できる** — Host → Join → 付箋が双方向に映る（手元ブラウザ必須 · Agent ICE は未達になりやすい）
- [x] **LWW 競合解決** — `npm run test:sticky-room:lww`（1000 回収束）
- [x] **暗号化通信** — DataChannel AES-GCM · 鍵は URL `#k=` のみ
- [x] **TTL 削除** — 3h 満了で破棄 · `expired` · no-store（`verify:sticky-room:no-store`）

---

## UX

「SUGUDASU らしい」操作面。同期より先にここで完成させる。

- [x] **コピー** — Copy-first · 選択 / 全付箋（接続不要）
- [x] **色変更** — 既存付箋を選択して ●×4
- [x] **一人モード** — 盤面主役 · 「ルームを作る」は下部オプション
- [x] **整列・縦スクロール盤面** — パン/ズームなし · 追加は空きグリッド · 整列 ▾（整列 / 画面に収める）· 200枚も縦スクロールで閲覧可
- [x] **見出し（heading）** — `＋` ▾ 付箋/見出し · 背景なし太字 · ドラッグ/編集 · ドロー・グループ枠は作らない（`REFERENCE` §オブジェクト種）
- [x] **Host 終了 UI** — バナー · 付箋残す · 1人続行可
- [x] **Join 終了 UI** — ホスト待機継続
- [x] **ICE failed UI** — 再接続 or 退出 · 盤面はロックしない

---

## Quality

機械ゲート + 感触確認。

- [ ] **Console Error 0** — 一人 / Host-Join / 切断後に DevTools 赤エラーなし
- [x] **build 成功** — `npm run build:pages:sync`
- [x] **test 成功** — `npm run test:sticky-room`
- [ ] **200 付箋で快適** — 縦スクロールで全枚閲覧可 · 追加はグリッド · 整列可 · `/room?stress=1` で 200 枚が実用的（パン/ズームは不要）
- [ ] **主要ブラウザ動作確認** — Chromium + 最低もう1つ（Safari または Firefox）で一人 + 可能なら2人同期

---

## SUGUDASU

製品思想。ここが `[ ]` なら「動くが SUGUDASU ではない」。

- [x] **登録不要** — アカウントなしで `/room` が使える
- [x] **非送信** — 付箋本文をサーバー永続化しない（E2E · TTL · ephemeral）
- [x] **3分で使える** — 開く → 付箋追加まで説明なしで到達（ロビーを主役にしない）
- [x] **Copy-first** — コピーが第一級 · 同期OFFでも結果を持ち出せる

---

## 公開判定

| 条件 | 必須 |
|------|------|
| Core 全 `[x]`（**2人同期含む**） | Yes |
| UX 全 `[x]` | Yes |
| SUGUDASU 全 `[x]` | Yes |
| Quality: build · test | Yes |
| Quality: Console · 200枚 · 主要ブラウザ | Yes（提督サインオフ） |

**いま公開できるか:** **No** — 残りは主に **2人同期の手元確認** · Console · 200枚感触 · 主要ブラウザ。

実装順（参考 · 完了済みは飛ばす）:

1. コピー → 色変更 → 一人モード UI → **本 DoD** → ストレステスト → 手元 Quality / 2人同期 → v1 公開

---

## Agent 向け

1. 着手前に本ファイルを読む。次の作業は **最初の `[ ]`（上から）**。
2. 詳細手順・切断表・コマンドは `docs/release-checklist.md`。
3. MUST NOT · ファイル固定は `STICKY_ROOM_REFERENCE_REPOS.md`。
4. 公開前に提督が「2人同期 · Console · 200枚 · ブラウザ」を `[x]` したことを確認する。

---

## 変更履歴

| 日付 | 内容 |
|------|------|
| 2026-07-10 | 初版 — Core / UX / Quality / SUGUDASU |
