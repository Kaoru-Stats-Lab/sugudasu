# SUGUDASU 付箋ルーム — Release Checklist

**対象:** `sync.sugudasu.com/room`（v1 Release Candidate）  
**更新:** 2026-07-10  
**使い方:** リリース前の**作業用**チェック（手順・コマンド）。  
**公開可否の正本（DoD）:** `docs/notes/STICKY_ROOM_RELEASE_DOD.md` — 「何が揃えば公開していいのか」  
**関連:** `docs/notes/STICKY_ROOM_REFERENCE_REPOS.md` · `docs/notes/STICKY_ROOM_ARCHITECTURE.md` · `# SUGUDASU Room 実装仕様書（Cursor向け・v1.0.md`

**凡例:** `[x]` 実装済み · `[ ]` 未達 / 手動確認待ち · `(v2)` 意図的に後回し

---

## P0 — 同期OFFでも完成品

- [x] **一人で使える** — `/room` をホスト/参加せず開いても付箋追加 · 移動 · 編集 · 削除ができる
- [x] **コピー** — コピー ▾ · 選択 / 全付箋（接続不要）
- [x] **既存付箋の色変更** — 選択中に ●×4
- [x] **同期はオプション** — 下部「みんなで編集したい？」· 「ルームを作る」のみ（ロビー主役にしない）

**手動確認**

```text
npm run preview:pages:sync → /room
ホスト/参加せず · 追加 → 色 → コピー → 削除
```

---

## P0 — 切断 UI（4 種）

- [x] **Host 終了** — ホストが退出 / タブ閉じ → 参加者にバナー · 付箋は端末に残る · 1人で続行可
- [x] **Join 終了** — 参加者が退出 → ホストは待機継続
- [x] **ICE failed** — 接続失敗バナー · 再接続 or 退出 · 付箋は残す（盤面ロックしない）
- [x] **TTL / Room expired** — 3h 満了 → 付箋破棄 · 盤面ロック · 新規ルームへ

**手動確認**

| ケース | 手順の目安 |
|--------|------------|
| Host 終了 | タブA ホスト · タブB 参加 → A「ルームから出る」 |
| Join 終了 | B「ルームから出る」 |
| ICE failed | ネットワーク切断 / 再接続枯渇を再現 |
| TTL | `?longevity=1&ttlMs=180000` または本番 3h · `npm run longevity:sticky-room` |

---

## P1 — 品質（ローカル）

- [x] **Export** — 書き出し ▾ · JSON ダウンロード · Markdown / TSV コピー
- [x] **Import** — 書き出し ▾ · **JSON を読み込む**（Export / autosave 互換 · 既存盤面は確認後に置換）
- [x] **Undo / Redo** — 戻す · やり直し · Ctrl+Z / Ctrl+Y（同期と独立 · localStorage 自動保存あり）
- [ ] **Undo (v2)** — Command Pattern の本格化 · リモート操作との履歴統合（仕様書 v2 · 現状はローカル履歴のみ）

---

## P2 — 品質保証（機械）

- [x] **LWW 競合** — `npm run test:sticky-room:lww`（1000 回収束）
- [x] **長時間（圧縮）** — `npm run longevity:sticky-room`（放置 → 編集 → TTL）
- [ ] **長時間（本番 2h）** — 手動 · スリープ OFF · Host/Join 接続ありで再確認推奨
- [x] **ストレステスト** — `npm run stress:sticky-room` または `/room?stress=1`（100/200/500 · FPS/Drag/Memory）
- [x] **単体 + build** — `npm run test:sticky-room` · `npm run build:pages:sync`

---

## P3 — リリース前ゲート（手動）

- [ ] **Console Error なし** — DevTools Console · 一人モード / Host-Join / 切断後に赤エラー 0
- [ ] **Lighthouse** — Performance / Accessibility の致命的指摘なし（Sync `/room` · モバイル想定）
- [ ] **Mobile 最低限** — 幅 ~390px · 付箋追加 · D&D またはタップ選択 · コピー · ルームを作るが使える
- [x] **no-store** — `/room` · `/room/*` に `Cache-Control: no-store`（`npm run verify:sticky-room:no-store` · meta も確認）
- [ ] **E2E Host/Join** — 実ブラウザで Host → Join → 付箋同期（Agent 環境は ICE 未達になりやすい · 手元必須）

---

## リリース直前コマンド

```powershell
cd C:\asl_dev\sugudasu
npm run test:sticky-room
npm run build:pages:sync
npm run verify:sticky-room:no-store
# 任意: npm run stress:sticky-room
# 任意: npm run longevity:sticky-room   # 圧縮 TTL
# 本番反映は DEPLOY_LOG + release:pages:sync（別手順）
```

---

## Agent 向けメモ

1. 未チェック（`[ ]`）を埋める実装を優先する。`(v2)` は提督承認なしにスコープ拡大しない。
2. **Import** は Export JSON（`version: 1` · `cards`）と autosave 互換。`parseBoardImportJson` · 書き出し ▾「JSON を読み込む」。
3. 切断 UI · 一人モード · LWW の正本は `STICKY_ROOM_REFERENCE_REPOS.md` · データフローは `STICKY_ROOM_ARCHITECTURE.md`。
4. Console / Lighthouse / Mobile / Host-Join 手元は機械化しにくい — チェック後に本ファイルの `[ ]` を `[x]` に更新する。

---

## 変更履歴

| 日付 | 内容 |
|------|------|
| 2026-07-10 | Import JSON · no-store 機械検証 · checklist 更新 |
| 2026-07-10 | 初版（P0–P3 · RC 向け） |
