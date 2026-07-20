# プロダクト仕様書：`/slot-board`（枠取りパレット）

**正本パス:** `docs/notes/SLOT_BOARD_SPEC.md`  
**更新:** 2026-07-20  
**ステータス:** v0.2（実装依頼 `SUGUDASU-SLOT 実装依頼.md` を正本化）  
**id:** `slot-board` · URL `/slot-board`

> **一言:** 枠と人数を数えるだけの、送信しないカンバン。配置は人の手で。持ち帰りは復元コード・JSON・TSV。

---

## 0. v0.2 で変わった憲法（明示改定）

| 旧 v0.1 DENY | v0.2 |
|--------------|------|
| IndexedDB・永続禁止（閉じたら消える） | **許可** — 端末ローカル IndexedDB。サーバー送信はしない |
| JSON ファイル DL 禁止 | **許可** — 会議の日跨ぎ・別PC再開の必須手段 |
| React SPA | **採用しない** — 静的配信・機内モード・ビルドレスのため **vanilla ESM** で Hooks 相当の状態管理。データモデル・機能は依頼どおり |

旧ナラティブ（グラフ禁止・サーバ同期禁止・認証禁止・AI自動配置禁止）は **維持**。

---

## 1. データモデル（依頼どおり）

### projects
`id`, `name`, `createdAt`, `updatedAt`, `isReadOnly`, `hideEvidence`, `participants: string[]`

### lanes（賞レーンのみ。未配置・保留は含めない）
`id`, `projectId`, `title`, `capacity`（null=無制限）, `order`

### candidates
`id`, `projectId`, `laneId: string|null`, `status: 'pool'|'pending'|'assigned'|'removed'`, `name`, `rawText`, `order`, `isMaskedOverride: boolean|null`

### historyLogs（append-only · Undo · 直近100件でローテーション）
`id`, `projectId`, `seq`, `timestamp`, `candidateId`, `candidateName`, `fromStatus`, `fromLaneId`, `fromLaneLabel`, `toStatus`, `toLaneId`, `toLaneLabel`, `action: 'move'|'capacity_change'|'lane_create'|'lane_delete'`, `actor: string|null`

### uiState（メモリのみ · DB に保存しない）
`selectedCandidateId`, `activePlacementTarget` など

---

## 2. P0 機能

1. Box1（`最優秀賞=1` 等）→ lanes  
2. Box2（候補フリーテキスト）→ status `pool`  
3. DnD: pool ⇄ pending ⇄ assigned(laneId)  
4. 定員超過でヘッダー赤＋超過人数（配置はブロックしない）  
5. Undo（history 最新1件の逆再生）  
6. 目隠し（`hideEvidence` + `isMaskedOverride`）  
7. 読み取り専用（`isReadOnly` · いつでも解除可）  
8. JSON 完全エクスポート/インポート（インポート時 ID 再採番 → 新規プロジェクト）  
9. PPT 階層テキスト / TSV（status チェックで出力対象）  
10. タップ配置（選択→配置ボタン／レーンタップ · DnD と同じく超過レーン可）

互換: 旧 `SUGUDASU-SLOT-` 復元コード · 旧 TSV「名前\tランク」一括も受け付ける。

---

## 3. やらないこと

- 認証・ログイン  
- 複数選択・一括配置  
- 30秒毎の自動スナップショット（JSON 手動で代替）  
- 定員超過専用待機ゾーン  
- 保留専用レーン（`status:'pending'` · `laneId:null`）  
- AI 自動配置  
- グラフ · サーバ同期

---

## 4. 受け入れ

- 30〜50 件でも操作ラグなし  
- リロードで IndexedDB から復元（uiState 除く）  
- JSON を別ブラウザでインポートし同一盤面  
- Network に業務データ POST なし  

---

## 5. リード・FAQ（コピー）

- 見出し直下: 案C「枠と人数を数えるだけの、送信しないカンバン。配置は人の手で。持ち帰りは復元コードかTSVで。」  
- 補足: 案A寄りの説明  
- FAQ: 人事考課 FAQ 追加 ·「復元コード」表記統一  

---

## 6. 技術配置

| ファイル | 責務 |
|----------|------|
| `assets/slot-board-db.js` | IndexedDB CRUD |
| `assets/slot-board-engine.js` | パース・移動・履歴・Undo・入出力純粋関数 |
| `assets/slot-board-app.js` | UI · DnD · タップ · 永続化呼出 |
| `assets/slot-board.css` | ツール専用スタイル |
| `tools/slot-board.html` | 骨格 · FAQ |
