# SUGUDASU 付箋ルーム — アーキテクチャ（データフロー）

**更新:** 2026-07-10  
**用途:** 引き継ぎ · 別 AI オンボーディング（**仕様書とは別** · A4 1枚）  
**公開可否:** `STICKY_ROOM_RELEASE_DOD.md`  
**仕様:** `# SUGUDASU Room 実装仕様書（Cursor向け·v1.0.md`  
**ガードレール:** `STICKY_ROOM_REFERENCE_REPOS.md` · `.cursor/rules/sugudasu-sticky-room.mdc`

---

## データフロー（正本）

```
Browser A（ローカル操作）
    │
    ▼
Action                    … クリック · D&D · 編集 · 削除 · 整列
    │                       boardDispatch · 追加は空きグリッドへ
    ▼
Map<Card>                 … cards: Map<cardId, StickyCard> + tombstones
    │                       盤面の唯一の真実（Store ライブラリは使わない）
    ▼
Konva + 縦拡張            … paint · Stage 高さ = 最下付箋まで（横幅固定 · スクロールのみ）
    │
    ▼
Broadcast                 … syncBroadcast → sticky-room-sync.js（WebRTC DataChannel）
    │
    ═════════════ ネットワーク ═════════════
    │
    ▼
Browser B（リモート受信）
    │
    ▼
LWW                       … received → merge（shouldApplyRemote · tombstone）
    │                       merged または ignored（v1: Console ログ）
    ▼
Konva                     … Map 反映後に paint / unpaint
```

**要約:** ローカルは **Action → Map → Konva → Broadcast**。リモートは **受信 → LWW → Map → Konva**。往復とも Map を経由し、Konva は描画だけ。

---

## コード上の対応

| 層 | ファイル | 入口 |
|----|----------|------|
| UI · Action · Map · Konva | `assets/sticky-room-app.js` | `boardDispatch` |
| Broadcast 接続 | 同上 | `attachSyncBroadcast` → `roomSession.sendCard*` |
| 通信 · LWW · TTL | `assets/sticky-room-sync.js` | `createRoomSession` · `shouldApplyRemote` |
| E2E 暗号 | `assets/sticky-room-crypto.js` | URL `#k=` |
| ページ | `tools/sync-room.html` | `sync.sugudasu.com/room` |

### ローカル操作（Browser A）

```
ユーザー → boardDispatch(add|move|edit|delete)
         → Map 更新
         → effects: paint | unpaint | status | broadcast
         → applyBoardEffects
```

### リモート受信（Browser B）

```
sticky-room-sync → onCardRemote / onCardDeleteRemote
                 → boardDispatch(remote-card | remote-delete)
                 → observe（received）
                 → mergeRemote*ToMap（LWW）
                 → paint / unpaint
```

---

## 境界（触るときのルール）

1. **Konva から send しない** — 送信は `broadcast` 効果と `attachSyncBroadcast` のみ。
2. **LWW は Map 更新前** — `mergeRemoteCardToMap` / `mergeRemoteDeleteToMap` で却下してから Konva。
3. **同期 OFF でも Map → Konva は動く** — Broadcast だけが接続時に有効。
4. **コピーはローカルのみ** — Map からクリップボードへ。Broadcast しない（`sg-copy-feedback`）。
5. **自動保存は同期と独立** — `localStorage`（`sugudasu-sticky-room-v1`）· Undo は `boardDispatch` の Action 履歴。

---

*図だけ見れば足りる文書。詳細仕様・Phase DoD · MUST NOT は `STICKY_ROOM_REFERENCE_REPOS.md` へ。*
