# SUGUDASU 付箋ルーム — 参考OSS採用判断（SSOT）

**更新:** 2026-07-09  
**正本仕様:** `# SUGUDASU Room 実装仕様書（Cursor向け・v1.0.md`  
**方針:** 1 Repo を fork しない。**層ごとにコンポーネント単位で借りる。**  
**ガードレール正本:** 本ファイル §MUST NOT 以降 · `.cursor/rules/sugudasu-sticky-room.mdc`  
**Release DoD（公開可否）:** `docs/notes/STICKY_ROOM_RELEASE_DOD.md`  
**Release Checklist（作業手順）:** `docs/release-checklist.md`

---

## 開発原則

Room は **Zoom · Miro · FigJam** を作るものではない。付箋を共有するためだけの、小さなブラウザツールである。

機能追加ではなく **削る方向を優先**する。迷ったら「それは本当に付箋共有に必要か？」を基準に判断する。

**OSS は参考資料である。** SUGUDASU の思想と衝突した場合、必ず SUGUDASU を優先する。OSS へ設計を寄せない。

### 横断原則 — 同期OFFでも完成品（SUGUDASU 必須）

```
/room を開く
    ↓
同期しない（ホスト/参加しない）
    ↓
1人でも便利
```

**同期は価値を増やす機能**であり、前提条件にしてはいけない。

| 操作 | 同期OFFで必須 | 同期ONで追加されること |
|------|---------------|------------------------|
| 付箋追加 | ○ | 相手盤面へ配信 |
| 色変更 | ○ | 相手へ配信 |
| コピー（テキスト/一覧） | ○ | — |
| 削除 | ○ | 相手盤面から削除 |
| 並べ替え（D&D） | ○ | 座標を配信 |

**禁止:** Supabase 未設定 · ホスト未開始 · 接続失敗で盤面操作ができないこと。

**検証:** `npm run preview:pages:sync` → `/room` を開き **ホスト/参加せず** 上表を手動確認（機械化は Phase 9 以降で可）。

### 横断原則 — 通信と UI の分離（SUGUDASU 必須）

```
Action（ユーザー操作）
    ↓
boardDispatch → State（Map）更新
    ↓
render（Konva · paint / unpaint）
    ↓
必要なら broadcast（syncBroadcast → sticky-room-sync のみ）
```

**禁止:** Konva 内で `roomSession.send*` · `connState` による送信分岐。  
**正本:** `sticky-room-app.js` — `boardDispatch` + `attachSyncBroadcast`。  
**データフロー図:** `STICKY_ROOM_ARCHITECTURE.md`（引き継ぎ用 · A4 1枚）

### v1 同期ログ（Console · 後で削除可）

リモート受信時に常時出力: `received` → `merged` または `ignored (LWW)`。  
フラグ: `sticky-room-app.js` の `SYNC_LOG_V1`（v2 で `false`）。

---

## MUST NOT（実装中に置き換え禁止）

| カテゴリ | 禁止 |
|----------|------|
| 同期 | Y.js · Liveblocks · Partykit · Firebase Realtime · Supabase Postgres Changes でカード同期 |
| 状態 | Zustand · Redux · Recoil · Jotai · React Context · カスタム Store |
| UI 枠 | React Router · SPA フレームワーク · Layout Provider 階層 |
| 描画 | ReactFlow · tldraw 本体 · Excalidraw 本体 · Fabric.js · 自前 Canvas エンジン |
| 機能 | ファイル転送 · チャット · 画面共有 · 音声 · MindMap 線/矢印（v1） |
| **ホワイトボード化** | **ペン · 消しゴム · 線幅 · 図形（四角/円/線/矢印）· コネクタ · リッチテキスト · Markdown 編集 · 画像 · PDF · グループ枠**（v1 実装禁止 · 下記「オブジェクト種」参照） |

---

## ファイル構成（固定 · これ以上増やさない）

| リポジトリ上のパス | 論理名 | 役割 |
|-------------------|--------|------|
| `tools/sync-room.html` | `room.html` | 1 HTML · Sync `sync.sugudasu.com/room` |
| `assets/sticky-room-app.js` | — | Konva · Map · UI |
| `assets/sticky-room-sync.js` | — | LWW · WebRTC |
| `assets/sticky-room-crypto.js` | — | WebCrypto |
| `assets/sticky-room.css` | — | 盤面スタイル |

**SPA 禁止** — 上記以外の JS を増やさない（テスト `scripts/sticky-room-sync.test.mjs` のみ例外）。

---

## 状態管理

| 許可 | 禁止 |
|------|------|
| モジュールスコープ変数 | useState / useReducer（React 前提） |
| `Map` / `Set` | Context · Provider |
| DOM 参照をオブジェクトにまとめる（`els` パターン） | Zustand / Redux / イベントバス |

Vanilla ES modules のみ。React は使わない。

---

## Bundle Size

- 初期ロード合計 **gzip 250KB 以内**（仕様書 §8）
- **Bundle を増やすライブラリは原則禁止**
- 追加する場合は **(1) 必要理由をコメント (2) 本 SSOT に追記 (3) gzip 見積もり** の3点セット

| ライブラリ | 導入フェーズ | 備考 |
|------------|--------------|------|
| Konva | Phase 0 | CDN ESM · 計測必須 |
| simple-peer-light | Phase 2 | DataChannel |
| （他） | — | 原則禁止 |

---

## 開発ルール（1機能ずつ）

```
1. 1機能実装
2. npm run test:sticky-room（該当時）
3. npm run build:pages:sync
4. ブラウザで動作確認
5. 次の機能へ
```

一気に5機能作らない。リアルタイム同期はデバッグが重いので **小さく積む**。

---

## 最終採用スタック（v1 · これ以外は原則増やさない）

| 層 | 採用 | 役割 |
|----|------|------|
| **描画** | Konva.js（CDN ESM · Vanilla） | 付箋1枚 = Group + Rect + Text · ドラッグ |
| **通信** | simple-peer-light または素の RTCPeerConnection | Phase 2 まで未導入可 |
| **同期** | **自前 LWW**（`sticky-room-sync.js`） | `updatedAt` 比較 · Map |
| **シグナリング** | Supabase Realtime **Broadcast** | Phase 3 · SDP/ICE のみ |
| **暗号** | WebCrypto AES-GCM（`sticky-room-crypto.js`） | Phase 4 |
| **一時Blob** | Supabase UPSERT | Phase 5 · 暗号化済みのみ |
| **UI** | Vanilla ES modules + `Map` | React / Context **禁止** |
| **FAQ** | `sg-faq` + `<details>` | `docs/notes/STICKY_ROOM_FAQ_DRAFT.md` · JS 0行 |

**v1 で入れない:** Y.js · tldraw 本体 · ファイル転送 · TURN · Undo/Redo · チャット · 線/矢印

---

## 最低限見るべき3つ（学習コスト vs 価値）

| 優先 | 対象 | 何を見るか | 所要目安 |
|------|------|------------|----------|
| ★★★★★ | **simple-peer** README + examples | DataChannel 接続 · `signal` イベント · JSON 送信 | 2〜3h |
| ★★★★★ | **swifttarrow/collabBoard** README + LWW 説明 | オブジェクト単位 LWW · Presence 思想 | 1〜2h |
| ★★★★★ | **Konva 公式** Drag & Drop + React 例 | ドラッグ中 transform · レイヤー分離 | 2h |

この3つで v1 の **80%** が埋まる。他は必要になったときだけピンポイント参照。

---

## 優先度マップ（保守性 · 学習コスト · 得られる価値）

| 優先 | 名前 | 移植率 | 学習コスト | 借り方 |
|------|------|--------|------------|--------|
| ★★★★★ | simple-peer(-light) | **95%** | 低 | API をそのまま利用 |
| ★★★★★ | collabBoard（LWW部分） | **40%** | 低 | README + マージ関数の**思想**のみ |
| ★★★★★ | Konva 公式 | **90%** | 低 | ドキュメント通りに実装 |
| ★★★★★ | match-board（社内） | **55%** | 極低 | パターン移植 · コードコピーは限定 |
| ★★★★★ | Sync Crypto Arch v3（社内） | **85%** | 低 | 鍵導出 · AES-GCM を流用 |
| ★★★★ | webrtc-controller | **70%** | 低 | シグナリング配線の雛形（50行級） |
| ★★★★ | tldraw | **20%** | 高 | Shape ID · 選択 · Room 寿命の**設計メモ**のみ |
| ★★★ | Supabase Broadcast ドキュメント | **80%** | 低 | シグナリングチャンネル実装 |
| ★★ | y-webrtc | **15%** | 中 | メッシュ接続の**配線図**のみ（Y.Doc は使わない） |
| ★★ | postitup | **25%** | 中 | 付箋見た目 · 紙UI（同期層は借りない） |
| ★★ | pragmatic-drag-and-drop | **30%** | 中 | 大量D&D時の性能設計メモ（v1はKonva内ドラッグで足りる） |
| ★ | canvie | **10%** | 高 | Ephemeral Room の**商品コピー**参考 |
| ★ | Excalidraw | **15%** | 高 | URL参加 UX の断片のみ |
| ★ | CollabBoard 全体 | **25%** | 中 | Supabase 永続同期は Room 非ゴール |
| ✕ | tldraw / Excalidraw fork | **&lt;5%** | 極高 | 採用しない |

---

## コンポーネント単位 — 何を借りるか

### A. 社内 · match-board（`group-split-assign-app.js` + engine）

| 借りる | 借りない |
|--------|----------|
| カード状態を `Map` で持つ発想 | 配属エンジン（`buildAssignFromInput` 等） |
| ドラッグ移動の UX（ホバー · 選択 · 会議モード） | スロット / プール / 希望順位ドメイン |
| Undo スタックの**データ構造**（v2用メモ） | v1 Undo 実装そのもの（Room v1 は Undo 非ゴール） |
| setup ↔ meeting の**画面モード切替**パターン | たたき台生成 · 満足度 · TSV 出力 |
| `copyWithFeedback` 連携パターン | JSON スナップショット形式（Room は別スキーマ） |

**移植率 55%** — ロジックより **UX状態機械** の参考。Konva 盤面に載せ替える。

---

### B. simple-peer / simple-peer-light

| 借りる | 借りない |
|--------|----------|
| `new Peer({ initiator })` ライフサイクル | サンプルの手動 `signal` 貼り付け UI |
| `peer.on('signal')` → シグナリングサーバへ | Node.js 専用 `wrtc` パス |
| `peer.on('data')` で JSON パース | ビデオ/音声 `stream` オプション |
| `peer.send(Buffer|string)` | ファイル転送拡張 |

**移植率 95%** — npm 依存としてそのまま。gzip 後サイズを計測して 250KB 目標に含める。

---

### C. swifttarrow/collabBoard（LWW のみ）

| 借りる | 借りない |
|--------|----------|
| README の LWW 説明（`updated_at` 比較） | Supabase Realtime ブロードキャスト実装 |
| 「リモート適用時に新しい方だけ勝つ」疑似コード | AI エージェント · OpenAI 連携 |
| Sticky を Konva コンポーネントで表す**ファイル構成のヒント** | Postgres `board_objects` 永続化 |
| Presence / カーソル throttle の考え方 | IndexedDB outbox · オフライン同期 |

**移植率 40%** — **関数1本**（`applyRemoteCard(remote, local)`) 相当を自前実装。Repo を fork しない。

```js
// 借りる中身のイメージ（自前実装 · 仕様 §7-2）
function applyRemoteCard(local, remote) {
  if (!local || remote.updatedAt > local.updatedAt) return remote;
  return local;
}
```

---

### D. Konva.js 公式

| 借りる | 借りない |
|--------|----------|
| `Group` + `draggable` + `dragend` で座標確定 | 全ツール（ペン · 矢印 · 画像） |
| `Stage` ズーム/パン（`scale` + `position`） | カスタム Canvas エンジン自前実装 |
| ドラッグ中は `requestAnimationFrame` + `transform` | ドラッグ中の全体 `batchDraw` 連打 |
| Layer 分離（背景 / カード / カーソル） | 500オブジェクト超の最適化（v1は不要） |

**移植率 90%** — 公式どおり。付箋1種類に絞ればコード量は小さい。

---

### E. WebRTC シグナリング雛形 · webrtc-controller

| 借りる | 借りない |
|--------|----------|
| `?room=` でペアリングする URL 設計 | WebSocket 自前サーバ（Node） |
| offer → answer → ICE の**順序** | ゲームコントローラ DOM |
| DataChannel ラベル名の付け方 | Glitch デプロイ構成 |

**移植率 70%** — 50〜100行の配線を Supabase Broadcast に置き換える。

---

### F. tldraw（設計のみ · fork しない）

| 借りる | 借りない |
|--------|----------|
| Shape = `{ id, type, x, y, props }` の**データ形** | `@tldraw/tldraw` パッケージ |
| Room ID · 参加者 · 期限の**プロダクト概念** | 描画ツールバー · 手書き · 矢印 |
| 選択状態を shapeId 1つに集約する UX | エクスポート · 永続DB |

**移植率 20%** — 1ページメモで足りる。実装は読まない。

---

### G. Sync 暗号（社内 SSOT）

| 借りる | 借りない |
|--------|----------|
| URL fragment から鍵導出 | Sync Auth（メールログイン） |
| AES-GCM encrypt/decrypt ユーティリティ | 恒久 `sync_room_states` の平文 payload |
| 「サーバーは Blob だけ」思想 | 帳票 PDF 連携 |

**移植率 85%** — 関数抽出して Room 専用モジュール化。

---

### H. Supabase Realtime Broadcast

| 借りる | 借りない |
|--------|----------|
| `channel.send({ type: 'broadcast', event: 'signal', payload })` | Postgres Changes でカード同期 |
| Presence で「誰がいるか」 | Auth 必須フロー（Room は fragment 鍵） |
| チャンネル名 = roomId | RLS 付き CRUD の丸コピー |

**移植率 80%** — ドキュメント通り。シグナリング専用に閉じる。

---

### I. FAQ · UI（SUGUDASU 既存）

| 借りる | 借りない |
|--------|----------|
| `sg-faq-section` + `details.sg-faq` | Origin UI / Accordion.js |
| `STICKY_ROOM_FAQ_DRAFT.md` の2層FAQ | 一般向けに E2E 詳細を前面出し |

**移植率 100%** — 文言差し替えのみ。

---

## 移植コスト一覧（SUGUDASU距離感）

| 資産 | 移植率 | 移植コスト | 理由 |
|------|--------|------------|------|
| simple-peer | 95% | **1日** | API ラップのみ · React 非依存 |
| Konva 付箋 | 90% | **2〜3日** | 新規だが公式パターンそのまま |
| WebCrypto（Sync流用） | 85% | **1〜2日** | 既存仕様書どおり抽出 |
| Supabase Broadcast | 80% | **1日** | 既存 Sync プロジェクト流用 |
| webrtc-controller 配線 | 70% | **0.5日** | 雛形コピー + Broadcast 差し替え |
| match-board パターン | 55% | **1日** | モード切替 · Map 状態の読み替え |
| collabBoard LWW | 40% | **0.5日** | 関数1本 · README のみ |
| postitup UI | 25% | **2日** | 見た目だけ · Next 前提を捨てるコスト |
| tldraw 設計 | 20% | **2h** | メモのみ |
| y-webrtc | 15% | **1日** | 配線理解 · Y 本体は捨てる無駄 |
| canvie / Excalidraw | 10〜15% | **高** | 読む価値が低い |

---

## v1 実装フェーズ（Cursor 向け · 固定順）

| Phase | 内容 | 実装 Gate |
|-------|------|-----------|
| **0** | Card 型 + Map + Konva 1枚描画（単機） | Gate 0 |
| **1** | LWW（`applyRemoteCard` 等）単体テスト | Gate 0 |
| **2** | WebRTC Host/Join · DataChannel ping · 再接続 | Gate 1–2 |
| **3** | DataChannel 付箋**追加**のみ | Gate 3 |
| **4** | 移動同期 | Gate 4 |
| **5** | 編集同期 | Gate 5 |
| **6** | 削除同期 | Gate 6 |
| **7** | WebCrypto E2E 暗号化 | Gate 7 |
| **8** | TTL · Auto Destroy · no-store | Gate 8 |

**並行してやらない:** tldraw 調査 · Yjs 比較 · ファイルアップロード · TURN 選定

---

## P2 品質保証 — ストレステスト

**目的:** 100 / 200 / 500 枚で **FPS · Drag · Memory** を観測（ゲートではなく記録）。

| 実行 | コマンド |
|------|----------|
| 自動（Playwright） | `npm run stress:sticky-room` |
| 手動 UI | `npm run preview:pages:sync` → `/room?stress=1` |
| 枚数指定 | `/room?stress=auto&counts=100,200,500` |

**指標**

| 列 | 意味 |
|----|------|
| spawn ms | 付箋 N 枚を盤面に追加する時間 |
| idle FPS | `layer.batchDraw()` ループ（1.5s サンプル） |
| drag FPS | 中央付箋を 90 フレームドラッグ模擬 |
| drag p95 ms | ドラッグ 1 フレームあたり描画時間 p95 |
| heap MB | `performance.memory.usedJSHeapSize`（Chromium のみ） |

**API:** `window.__stickyRoomStress` · 結果 `window.__stickyRoomStressResults`

### LWW 競合テスト（1000 回）

A · B が同時編集 → 相互 `applyRemote*` → **両者が収束**することを Node で検証。

```bash
npm run test:sticky-room:lww
STICKY_ROOM_LWW_ROUNDS=1000 npm run test:sticky-room:lww
```

`npm run test:sticky-room` に同梱。

### 長時間テスト（2h 放置 → 再接続 → 編集 → TTL）

| 層 | コマンド | 内容 |
|----|----------|------|
| Node（即時） | `npm run test:sticky-room:longevity` | 2h 放置後 1h 残 · 編集可 · TTL expire |
| E2E（圧縮） | `npm run longevity:sticky-room` | `ttlMs=180s` · idle 120s · 編集 · 満了 |
| **手動（本番 2h）** | 下記手順 | 実時間 2h + 3h TTL |

**手動（本番タイムライン）**

1. `/room` → ルームを作る · 参加 URL で別タブ参加
2. 付箋を数枚置く
3. **2 時間放置**（タブは開いたまま · スリープ OFF 推奨）
4. 切断していれば **再接続**（または「ルームから出る」→ 1人で続行）
5. **付箋を追加/編集**（まだ TTL 前なら可能 — 残り約 1h）
6. ホスト開始から **3 時間**で TTL 満了 → 盤面クリア · `expired`

圧縮 E2E: `/room?longevity=1&ttlMs=180000`（`STICKY_ROOM_LONGEVITY_TTL_MS` / `IDLE_MS` で上書き可）

---

## 盤面ポリシー（v1）

- **無限キャンバスは採用しない**（パン · ズーム · ミニマップ · カメラなし）
- **横幅は画面幅固定** · **縦方向のみ自動拡張**（最下付箋 + 余白 → Stage 高さ）
- 閲覧は **`.sticky-room-board-wrap` の縦スクロール**のみ
- **追加**は空きグリッドへ自動配置（上→左優先）· **重ね置きは手動ドラッグで許可**
- **整列 ▾** — 「整列」（盤面先頭へグリッド詰め · スクロール先頭へ）· 「画面に収める」（いま見えている範囲の上端へ詰め）
- Stage 高さは `cachedMaxBottom` で維持する。追加・下方向移動は O(1)。最下端が上へ動いた/消えたときだけ全件再計算。
- 空きグリッドは `occupied: Set` を維持する。連続追加は Set 再利用で O(1) amortized（毎回到建ての O(n²) 回避）。

正本コード: `layoutCardsInGrid` · `layoutCardsInGridAtOrigin` · `findFreeGridSlot`（`sticky-room-sync.js`）

---

## オブジェクト種（確定 · 2026-07-10）

Room はホワイトボードではない。盤上オブジェクトは **2 種だけ**。

```
Object
├─ sticky   … 既存付箋（色付き · グリッド追加）
└─ heading  … 見出し（分類ラベル）
```

### なぜ heading か（DECISION）

ブレスト実務では「営業 / 開発 / Must·Should·Could」など **分類の見出し** が欲しくなる。  
自由テキストや描画で解決するとホワイトボード化し、SUGUDASU（迷わない · 1用途）から外れる。

| 案 | 判定 | 理由 |
|----|------|------|
| ドロー（ペン・線・図形） | **却下** | ツールバー・Undo・当たり判定が増え、付箋共有→ホワイトボードになる |
| 自由テキスト / リッチテキスト | **却下** | 装飾・Markdown・編集モードが膨らむ |
| グループ枠 | **v1 不要** | 分類は見出し + 付箋の位置で十分伝わる |
| **heading（見出し）** | **採用** | グルーピングに十分 · 実装小 · データほぼ増えない |

### heading の見た目・操作（仕様）

- UI: `＋` ▾ → **付箋** / **見出し**（これだけ）
- 背景なし · 枠なし · **太字テキストのみ**
- ドラッグ可 · ダブルクリックで plain text 編集
- 色は任意で **黒 / グレー** のみ（装飾は増やさない）
- `fontSize` は固定寄り（例: 20）。ユーザーが自由に変えない

### データ（最小）

```js
// sticky（既存）
{ cardId, kind: 'sticky', x, y, text, color, updatedAt }

// heading
{ cardId, kind: 'heading', x, y, text, color?: 'black'|'gray', updatedAt }
```

- `kind` 省略時は **`sticky`**（既存 JSON / 同期互換）
- 同一 `cards: Map` · 同一 LWW · move/edit/delete を共有
- 整列・グリッド追加の対象は **sticky のみ**（heading は手動配置 · 整列から除外）

### v1 で絶対に増やさない

```
ペン · 消しゴム · 線幅 · 図形（四角/円/線/矢印）· コネクタ
テキスト装飾 · リッチテキスト · Markdown · 画像 · PDF · グループ枠
```

迷ったら「それは sticky / heading のどちらかで足りるか？」— **足りなければ削る**。

---

**全 Phase 共通（横断）— 同期OFF完成品**

- [ ] `/room` を **ホスト/参加せず** 開いても盤面が使える（Supabase 不要）
- [ ] 付箋追加 · 並べ替え · 編集 · 削除が **接続なし** でできる
- [x] 色変更が **選択中/既存付箋** でできる（ツールバー ●×4 · `boardDispatch recolor`）
- [x] コピー（**コピー ▼** · 選択付箋 / 全付箋 · プレーンテキスト）が **接続なし** でできる
- [x] 同期系 UI（ホスト/参加/接続バッジ）は **盤面をブロックしない**（1人モード既定 · 下部「ルームを作る」）

**切断 UI（本番シナリオ · v1 必須 4 種）**

| 状態 | いつ | 盤面 |
|------|------|------|
| **Host 終了** | ホストが `ルームから出る` / タブ閉じ | 付箋は端末に残す · 1人で続行可 |
| **Join 終了** | 参加者が退出 | ホストは待機継続 |
| **ICE failed** | Wi-Fi / FW / 複製タブ等 | 再接続 or 退出 · 付箋は残す |
| **Room expired** | TTL 満了 | 付箋破棄 · 新規ホストへ |

シグナル: `host-leave` · `join-leave`（graceful）· 再接続枯渇時も上記 UI へ。

### Phase 0 完了条件

- [ ] 単機で付箋を追加 · D&D · ダブルクリック編集できる
- [ ] `Map<cardId, Card>` に `x/y/text/color/updatedAt` が入る
- [ ] `npm run build:pages:sync` 成功
- [ ] `npm run test:sticky-room` 成功

### Phase 1 完了条件

- [ ] `applyRemoteCard` / `shouldApplyRemote` の LWW 単体テストが通る
- [ ] `applyRemoteCardDelete` / tombstone の単体テストが通る
- [ ] Konva を触らず Map だけで検証できる

### Phase 2 完了条件

- [ ] Host から Join できる
- [ ] 5 回連続接続成功
- [ ] リロード後も再接続できる
- [ ] `npm run build:pages:sync` 成功
- [ ] `npm run test:sticky-room` 成功

**機械検証（一括）:** `npm run verify:sticky-room:phase2-dod`  
- test · build · Playwright E2E（Host/Join ×5 · リロード）を順に実行  
- WebRTC は **本物の Chrome（headed）+ UDP** が必要。Agent/headless では ICE が張れないことがある  
- Windows では `STICKY_ROOM_DOD_HEADED=1` を自動設定  

**手動（E2E が失敗したとき）:**

```powershell
npm run preview:pages:sync
# タブA: ルームをホスト → 参加 URL をコピー
# タブB: 参加 URL を開く → 両方「接続済み」
# 上記を 5 回繰り返す（毎回新規ホスト可）
# タブB をリロード → 再接続を確認
```

**CI で E2E を飛ばす:** `STICKY_ROOM_DOD_SKIP_E2E=1 npm run verify:sticky-room:phase2-dod`（test/build のみ）

### Phase 3 完了条件

- [ ] 接続済みタブ間で付箋**追加**のみ同期（移動・編集は未送信）
- [ ] リモート受信は `observe → mergeRemoteCardToMap → paintCardOnStage` の 3 段
- [ ] `npm run test:sticky-room` · `build:pages:sync` 成功

### Phase 4 完了条件

- [ ] dragend の座標が相手タブに反映される
- [ ] 編集テキストはまだ同期しない

### Phase 5 完了条件

- [ ] ダブルクリック編集が相手タブに反映される

### Phase 6 完了条件

- [ ] 削除が相手タブに反映される（tombstone LWW）

### Phase 7 完了条件

- [ ] 全 DC payload が AES-GCM 暗号化（`#k=` 鍵）
- [ ] 平文クライアントと混在しない

### Phase 8 完了条件

- [ ] ホスト開始から TTL カウントダウン表示
- [ ] 期限切れで鍵 · 付箋 · 接続を破棄
- [x] `/room` に `Cache-Control: no-store`（`verify:sticky-room:no-store`）

---

## 旧フェーズ一覧（参考 · 上表に統合）

```
1. Card 型 + Map 状態 + Konva 1枚描画（単機）
2. applyRemoteCard (LWW) + DataChannel JSON（2タブ手動でも可）
3. simple-peer + Supabase Broadcast シグナリング
4. WebCrypto で payload 暗号化
5. ICE failed フォールバック UI（仕様 MUST）
6. Auto Destroy · TTL · no-store
```


## 矛盾の解消（社内メモ vs Room 仕様）

| 文書 | 記載 | 採用 |
|------|------|------|
| `DRAFT_ASSIGNMENT_PRODUCT_NOTE.md` §9 | Yjs + y-webrtc | **×** Room v1 では不採用 |
| Room 実装仕様書 v1.0 §7-2, §8 | LWW · Y.js 不採用 | **◎ 正本** |

---

## Cursor への依頼テンプレ（コピペ用）

```text
SUGUDASU 付箋ルーム v1 を実装する。

SSOT:
- # SUGUDASU Room 実装仕様書（Cursor向け・v1.0.md
- docs/notes/STICKY_ROOM_REFERENCE_REPOS.md（本ファイル）
- docs/notes/STICKY_ROOM_FAQ_DRAFT.md

採用スタック（これ以外増やさない）:
Konva · simple-peer · 自前LWW · WebCrypto · Supabase Broadcast のみ

参照:
- simple-peer: DataChannel
- collabBoard README: LWW のみ
- Konva 公式: draggable Group
- match-board: 会議モード状態機械のみ

禁止:
Y.js · Zustand/Redux · ファイル転送 · tldraw fork · チャット · 線/矢印 · v1 Undo

最初の成果物:
単機で付箋を D&D でき、cardId/x/y/text/color/updatedAt を Map で持つ Konva Stage。
```

---

## 変更履歴

| 日付 | 内容 |
|------|------|
| 2026-07-10 | オブジェクト種確定 + **heading 実装**（追加 ▾ 付箋/見出し · 整列は sticky のみ） |
| 2026-07-10 | オブジェクト種確定（sticky + heading のみ · ドロー/自由テキスト/グループ枠は v1 禁止） |
| 2026-07-10 | 整列 ▾「画面に収める」（可視範囲の上端へグリッド詰め） |
| 2026-07-10 | 盤面ポリシー（縦自動拡張 · グリッド追加 · 整列 · パン/ズームなし） |
| 2026-07-10 | `STICKY_ROOM_RELEASE_DOD.md`（公開可否の正本） |
| 2026-07-10 | Import JSON（書き出し ▾）· `verify:sticky-room:no-store` |
| 2026-07-10 | `docs/release-checklist.md`（v1 RC · P0–P3） |
| 2026-07-10 | 長時間テスト（2h 放置→編集→TTL · `test:sticky-room:longevity` · `longevity:sticky-room`） |
| 2026-07-10 | LWW 競合テスト 1000 回（A↔B 同時編集 · `test:sticky-room:lww`） |
| 2026-07-10 | P2 ストレステスト（100/200/500 · FPS/Drag/Memory · `stress:sticky-room`） |
| 2026-07-10 | P1 Undo/Redo · localStorage 自動保存 · Export（JSON/MD/TSV） |
| 2026-07-10 | P0 一人モード UX（盤面主役 · 下部「みんなで編集したい？」· 同期は任意） |
| 2026-07-10 | P0 既存付箋の色変更（選択時 ●×4 · recolor → card-edit 同期） |
| 2026-07-10 | P0 コピー（ツールバー ▼ · 選択/全付箋 · sg-copy-feedback） |
| 2026-07-10 | 横断 DoD「同期OFFでも完成品」· 操作一覧（追加/色/コピー/削除/並べ替え） |
| 2026-07-10 | Definition of Done（Phase 0–8）· Phase 2 機械検証 `verify:sticky-room:phase2-dod` |
| 2026-07-09 | 暴走防止ガードレール追加（MUST NOT · SPA禁止 · ファイル固定 · 開発原則） |
| 2026-07-09 | 初版 — Repo紹介から設計判断SSOTへ（提督FB反映） |
