# 見積会議 — 同時公開 / 多人投票 仕様FIX（正本）

**更新:** 2026-07-15  
**ステータス:** **提督確定候補を Agent が文章化 · FIX**（4 AI 比較を統合）  
**製品:** `sugudasu.com/planning-poker` · `tools/planning-poker.html`  
**roadmap:** `planning-poker-simultaneous-reveal`  
**調査プロンプト:** [`docs/prompts/planning-poker-simultaneous-reveal-infra-prompt.md`](../prompts/planning-poker-simultaneous-reveal-infra-prompt.md)  
**関連:** Sticky Room（`STICKY_ROOM_ARCHITECTURE.md`）· Sync S1 · `warikan-url-share`

---

## 0. 一文の定義（ぶらさない）

> **Planning Poker は同期ツールではない。認識差を最短で発見するエンジンであり、同期（Transport）は交換可能なアダプタに過ぎない。**

| 優先 | 層 | 星 |
|------|----|---|
| 1 | Engine（Story · Vote · Reveal · Revote · Reason） | ★★★★★ |
| 2 | Reveal UX（伏せ → 一斉公開 · 投票済み表示） | ★★★★★ |
| 3 | Transport（Single / URL / WebRTC / Realtime…） | ★★☆☆☆ |
| 4 | 暗号 | ★★☆☆☆ |
| 5 | クラウド永続 | ★☆☆☆☆ |

**Reveal 前に点数を隠す目的は「秘密保持」ではない。アンカリング防止である。**  
E2E は手段のひとつ。UI 隠蔽・ホスト権限・タイミング制御の方がプロダクト価値に直結する。

---

## 1. 現状（FIX 時点の事実）

| 項目 | 事実 |
|------|------|
| 動作域 | **1 ブラウザ完結**（core） |
| 投票 UI | **`あなたの名前` 1 名分のみ** |
| サーバ | 投票を送らない |
| LP 文案 | 「Revealは同時公開のみ」— **思想**。多人同時収集は **未実装** |

---

## 2. アーキテクチャ（必須 · 層分離）

```
┌─────────────────────────────────────┐
│ UI（投票済み · Reveal · 結果 · 理由） │
└─────────────────┬───────────────────┘
                  │ commands / projections
┌─────────────────▼───────────────────┐
│ Engine（純関数 · 同期ゼロ）             │
│ Story · Vote · Reveal · Revote · Reason│
│ ← 既存 planning-poker-engine.js を正本 │
└─────────────────┬───────────────────┘
                  │ ports（イベント出入）
┌─────────────────▼───────────────────┐
│ Transport Adapter（差し替え）          │
│ Single | Facilitator | URL | WebRTC | RT │
└─────────────────────────────────────┘
```

### DO（層）

- Engine は単機でも多人でも **同一**。Transport で分岐しない。
- 多人用コードは `planning-poker-sync.js`（仮）等の **Adapter に閉じる**。
- Sticky Room の WebRTC / LWW / E2E は **Adapter 実装の素材として共有してよい**。盤面モデルや Room UI は **流用しない**。

### DON'T（層）

- 「WebRTC 対応」「P2P 会議ツール」を製品価値の主役にしない。
- Engine に `PeerConnection` / Supabase クライアントを入れない。
- Sticky Room 画面に Planning Poker をねじ込まない（**別画面**）。

---

## 3. 製品ライン分割（core / Sync）

### 3.1 core（無料 · `sugudasu.com`）— 登録不要 · 非送信を維持

| 段階 | 内容 | 状態 |
|------|------|------|
| **今（実装済み）** | 単機 · 自分1名投票 · Reveal | shipped |
| **次（core MUST · 同期なし）** | **司会代行入力** — 参加者全員分を司会が「伏せて」入力し、Reveal で一斉表示 | **shipped（2026-07-15）** |
| **core MAY** | 結果の **URL/ハッシュ共有**（閲覧・復元。ライブ同時投票の主経路にしない） | considering（`warikan-url-share` と同族） |

**core でやらない**

- アカウント必須の多人リアルタイム
- 投票のクラウド永続
- 「複数端末で安全に同時投票」と LP に書くこと（未実装のまま禁止）

### 3.2 Sync（`sync.sugudasu.com`）— 多人ライブ

| 項目 | FIX |
|------|-----|
| 置き場 | **見積会議用の別画面**（Sticky Room とは別 URL） |
| Transport 第1候補 | **WebRTC DataChannel + 最小シグナル**（Sticky 同型） |
| 内部共有 | WebRTC / 暗号ユーティリティは **モジュール共有可**。UI・セマンティクスは別 |
| Auth | Sync の約束に合わせる（メール+パスワード等）。core の「登録不要」を Sync 画面に持ち越して嘘をつかない |
| DB | **MVP では投票を DB 永続しない**（ephemeral）。将来 Realtime に替えるなら Adapter 差し替え |

**Supabase を使う場合の分解（Claude 採用）**

| 亜種 | 用途 | MVP |
|------|------|-----|
| Realtime **Broadcast のみ**（DB なし） | 票の配送 · Reveal 合図 | Sync MVP の次点候補 |
| Realtime + **DB 行** | 永続・再開・監査 | **初期採用しない**（クラウド ★☆） |

---

## 4. 要件（FIX · 実装チェックリスト）

| ID | 要件 | 必須 | 備考 |
|----|------|:----:|------|
| R-value | 目的は認識差の可視化。同期は手段 | MUST | 一文定義 |
| R-hide-ui | Reveal 前、他者 UI に **点数を出さない**（投票済みのみ可） | MUST | アンカリング防止 |
| R-collect | 複数参加者の vote を Engine が保持できる | MUST | 単機でも代行入力で満たす |
| R-sim | Reveal は一斉反映（多人時は ±数秒を目標に仕様化） | MUST（多人時） | |
| R-host | **ホスト（または明示ロール）だけが Reveal / Story 進行を発火** | MUST（多人時） | |
| R-host-fail | ホスト切断時の挙動を文書化（再選出 / ルーム解散 / 単機フォールバック） | MUST（多人時） | Claude |
| R-tamper | 信頼境界を FAQ に書く（UI 隠蔽 ≠ 完全秘匿。Network・改ざんの限界） | MUST | Claude · GPT |
| R-join | 参加摩擦を低く（URL · QR）。規模はまず **3〜8 人** | SHOULD | 企業 NAT/TURN は後回し |
| R-ephemeral | 会議後に票を残さない（Sync MVP）。残すなら所有者と保持期間を明示 | MUST（Sync MVP） | |
| R-copy | LP/FAQ は実装と一致。「同時公開」を多人未実装のまま過大主張しない | MUST | |

---

## 5. Transport 順位（技術）

4 AI は **多人ライブの技術として案2 WebRTC で一致**。本 FIX でも多人の第1候補は WebRTC。

ただし採用順は次とする（思想 > 技術）:

| 順位 | 何を出荷するか | 理由 |
|------|----------------|------|
| 1 | core **司会代行入力**（案4） | 同期ゼロで「認識差 → Reveal」が完成。最短 · **shipped 2026-07-15** |
| **2** | core MAY **URL 結果共有**（案1・弱） | ライブ投票の主経路にしない |
| **3** | Sync **WebRTC Adapter**（案2） | Sticky 資産活用 · ephemeral · 別画面 |
| **4** | Sync **Realtime Broadcast**（案3亜種） | WebRTC が社内で死ぬ分岐条件での次点 |
| **—** | Sync **DB 永続リアルタイム** | 初期 DENY |

**Grok から採用:** Sync MVP は「接続 + 伏せ投票 + Reveal」だけに切る。  
**Grok から不採用:** 「E2E だから OK」でアンカリング要件を代替すること。

---

## 6. Cursor / Agent ガードレール（実装時）

### DO

- `planning-poker-engine.js` を純関数の正本に保つ。同期は Adapter。
- core の司会代行入力を先に入れるときは **Transport なし**で R-collect / R-hide-ui / Reveal UX を満たす。
- Sync 多人は **新ページ**（例: `sync.sugudasu.com/...`）。Sticky Room HTML に乗せるな。
- Reveal 前の他者点数は描画しない。ホストのみ Reveal。
- R-host-fail · R-tamper を FAQ または仕様節に残してからマージ。
- ユーザー文案を実装に合わせて直す（多人未実装なら単機・司会入力の説明にする）。

### DON'T

- core 公開物に Sync 秘密・service role を持ち込まない。
- 「E2E で絶対読めない」「登録不要のまま多人クラウド」と書かない。
- 同期方式を changelog / LP の売りにする（「WebRTC 対応」単独の public 見出し禁止。価値は認識差）。
- Sticky の付箋 LWW を Planning Poker の Story/Reveal セマンティクスに無理当てしない。
- 企業 NAT・TURN 完備を v1 必須にしない（まず小チーム）。

### ファイル境界（想定）

| 触ってよい | 触るな（先に仕様レビュー） |
|------------|---------------------------|
| `assets/planning-poker-*.js` · `tools/planning-poker.html` | `sticky-room-*.js` の盤面セマンティクス改変 |
| Sync 側の **新規** poker ページ · Adapter | `sync_rooms` スキーマの場当たり追加（Broadcast で足りる段階） |
| `data/roadmap.json` · 本 FIX · FAQ | statements / グローバル「非送信」約束の勝手な書き換え |

---

## 7. 出荷順序（確定）

```
[shipped] 単機 · 自分1票 · Reveal
    ↓
[core next] 司会代行入力（全員分を伏せて集め → Reveal）← 同期なしで価値完成
    ↓
[core MAY] 結果 URL 共有（任意）
    ↓
[Sync] WebRTC Adapter · 別画面 · Reveal/ホスト必須 · ephemeral
    ↓
[分岐] 社内で WebRTC 全滅 → Realtime Broadcast Adapter
```

roadmap `planning-poker-simultaneous-reveal` は **この順序の総称**。完了したら段階ごとに changelog · roadmap 更新。

---

## 8. 4 AI 採否メモ（監査用）

| 由来 | 採る | 捨てる / 弱める |
|------|------|-----------------|
| Grok | Sticky 資産転用 · MVP 小さ切り | E2E＝成功の置き換え |
| Claude | R-host-fail · R-tamper · DB vs Broadcast 分解 · まず代行入力 | 企業 NAT 先回りを v1 必須化 |
| Gemini | （Claude と重複のため独立採用なし） | — |
| GPT | Engine/Adapter/UI · Transport を価値にしない · core/Sync 分割 | — |

---

## 参考 OSS（クローンしない · Sync 後半の読み物）

| Repo | ライセンス | 判定 |
|------|------------|------|
| [tomaisthorpe/prophet-poker](https://github.com/tomaisthorpe/prophet-poker) | MIT · PeerJS | Sync Adapter 参考。**いまの core 代行入力には不要** |
| [howar31/scrum-poker](https://github.com/howar31/scrum-poker) | MIT · React+PeerJS | ホスト再選出の考察用。Stack 不合 · Sticky と二重投資 |
| [lucasliet/planning-poker](https://github.com/lucasliet/planning-poker) | （要確認）· vanilla+PeerJS | 薄い。シグナルを PeerJS 公開に依存 |
| [psykzz/planning-poker](https://github.com/psykzz/planning-poker) | MIT · Supabase | Sync Realtime 次点の参考。**初期 DENY（DB）** |
| [ceuk/planning-poker](https://github.com/ceuk/planning-poker) | **GPL-3** | **組み込み禁止**（ライセンス） |

**結論:** core 司会代行は自前実装。多人 WebRTC は Sticky Room 資産を Adapter 化する方が、外部 Poker アプリを丸ご取り込むより Spec 整合が高い。

---

## 9. 変更履歴

| 日付 | 内容 |
|------|------|
| 2026-07-15 | 司会代行入力 shipped · core 次を完了 |
| 2026-07-15 | 初版 FIX。4 AI 統合 · 一文定義 · 層分離 · core 先代行入力 · Sync は WebRTC 別画面 |
