# SUGUDASU Sync — 同時端末上限・価格・フロント性能ポリシー

**更新:** 2026-06-25  
**関連:** `SUGUDASU_SYNC_LINE.md` · `SYNC_S1_ARCHITECTURE.md` · `SYNC_DB_ARCHITECTURE.md`

---

## 1. 方針

- 1イベント課金に **同時スタッフ端末上限** を必ず含める。
- 「課金 = 無制限」は採用しない。端末上限は価格で段階提供する。
- DB はバックオフィスで上限制御できるが、フロント遅延はクレーム直結のため、読み込みと描画に性能予算を設ける。
- 課金開始時は **価格LPを同時公開**し、上限・保存期限・エクスポート責務を明示する。

---

## 2. 価格と同時端末上限（初期値）

| プラン | 価格（案） | 同時スタッフ端末上限 | 用途 |
|------|-----------|-------------------|------|
| Event Base | ¥980 / event | 5 | 小規模運営 |
| Device Pack +5 | +¥480 | +5 | 中規模運営 |
| Device Pack +10 | +¥880 | +10 | 会場分散運営 |

### 2-1. ハード上限（技術）

| 実行環境 | 1イベント上限（初期） |
|--------|------------------|
| Free 運用 | 35 端末 |
| Pro 運用 | 70 端末 |

上限超過時は入室を拒否し、UI で「上限到達（追加購入 or 別ルーム）」を表示する。

---

## 3. 課金とDBの責務分離

- `user_entitlements` が課金権利の正本。
- `sync_rooms.staff_device_cap` はそのイベントの実行時上限。
- チェックアウト成功時に `staff_device_cap` を加算し、`retain_until` 範囲内で有効化する。

---

## 4. Cloudflare Pages はネックになるか

結論: **通常はネックにならない**。ネックになるのは「重いフロント実装」であり、配信基盤ではなくクライアント実装が主因。

### 4-1. ネックを避ける性能予算（初期）

- 初回JS（gzip）: **<= 220KB**
- First Contentful Paint（4G中位）: **<= 2.5s**
- 1回の反映（[今すぐ反映]）で再描画する行数: **可視範囲優先**
- 長大表は仮想化または段階描画（全行即DOM化を避ける）
- `revision` ヘッド取得は軽量API（payload本文を毎回取らない）

### 4-2. 運用ガード

- 同時接続率が 70% を超えたら新規入室を段階制限。
- 接続率 85% でアラートし、追加イベント作成を一時停止。
- フロント遅延（P95 > 3s）が連続したら描画機能を縮退（装飾OFF）。

---

## 5. 受け入れ基準

- [ ] 1イベントで `staff_device_cap` を超える入室が拒否される
- [ ] 追加購入で `staff_device_cap` が増加する
- [ ] ルーム画面に「現在接続数 / 上限」を常時表示する
- [ ] 初回ロードが性能予算を満たす（220KB / FCP 2.5s）

---

## 6. 同時端末上限の実装方式（S2）

### 6-1. データモデル

| テーブル/列 | 役割 |
|------------|------|
| `sync_rooms.staff_device_cap` | そのイベントの許可上限 |
| `sync_room_connections`（新設） | 現在接続中の端末セッション（短命） |
| `sync_room_connections.last_seen_at` | ハートビート時刻（TTL判定） |

### 6-2. 入室フロー

1. クライアントが `device_session_id`（UUID/NanoID）を生成して保持  
2. RPC `sync_claim_device_slot(event_id, device_session_id)` を実行（内部では `room_id` と同一）  
3. RPC 内で `last_seen_at > now() - 90 seconds` の接続数を数える  
4. 件数 `< staff_device_cap` なら insert/update して許可、超過なら `device_cap_reached` を返す  
5. 画面は 15〜30 秒ごとに heartbeat（`last_seen_at` 更新）

### 6-3. 解放フロー

- 正常終了: `beforeunload` で `sync_release_device_slot` 実行（ベストエフォート）
- 異常終了: heartbeat TTL 切れで自動解放
- 日次 Cron: 古い接続行を掃除（保守）

### 6-4. 攻撃/誤作動対策

- `device_session_id` は room + user 単位で unique 制約
- RLS は `owner` と `room membership` のみ更新可
- RPC はトランザクションで `FOR UPDATE` を使い同時claimレースを抑止

---

## 7. LP URL ポリシー

| 種別 | URL | 役割 |
|------|-----|------|
| コア無料アプリ | `https://sugudasu.com/timeline` | 非送信・登録不要の無料本体 |
| Sync アプリ | `https://sync.sugudasu.com/timeline` | ログイン後の実作業画面 |
| Sync 共有URL（現場） | `https://sync.sugudasu.com/e/{event_public_id}` | 現場配布用の安定リンク（noindex） |
| **Sync LP（正本）** | `https://sync.sugudasu.com/` | 価格・上限・FAQ・CTA を説明する販売ページ |
| キャンペーン LP（任意） | `https://sync.sugudasu.com/lp/{slug}` | 広告/記事流入向け派生LP |

**規約:** 課金導線（Checkout）への直リンクは原則 LP 経由。アプリ画面直リンクを広告着地にしない。

詳細正本は [`SYNC_URL_INFORMATION_ARCHITECTURE.md`](SYNC_URL_INFORMATION_ARCHITECTURE.md) を参照。

