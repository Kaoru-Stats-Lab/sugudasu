# Schedule × 重機フリート × 現場原価 — 将来連携マップ

**更新:** 2026-06-29  
**ステータス:** 構想 · **v1 スコープ外** — Schedule 単体出荷後に段階接続  
**提督:** 「最後にここと繋げられるといい」— 転記削減の延長線上で設計する

---

## 1. 三層の役割（Google カレンダー型の拡張）

Sync 旗艦 **Schedule**（§3-0c）を中心に、**別リポ・別 DB** の兄弟プロダクトが衛星として回る構想。

| 比喩 | プロダクト | リポジトリ | 時間軸 | 正本データ |
|------|------------|------------|--------|------------|
| **カレンダー** | **Schedule 工程表** | `C:\asl_dev\sugudasu` · `sync.sugudasu.com/schedule` | **工程日**（着工〜完工） | 工種 · 日程 · ops（重機予定・資材） |
| **連絡帳 / 資産台帳** | **fleet 重機フリート** | `C:\asl_dev\machine-dashboard` | **会計年度**（6月決算） | 77台マスタ · 特自検 · 経費 · 装備 |
| **スプレッドシート / 予算** | **site 現場原価** | `C:\asl_dev\site-dashboard` | **現場工期** · 日次 | 実行予算 · 日報 · 予実 · EVM |

**共通する Pain（§0 動機）:** 工程表 → 重機手配 Excel → 日報 → 会社指定 Excel → 特自検台帳 — **同じ現場・同じ日付がコピペで何度も出る**。

**連携のゴール:** Schedule を **日程・工種の正本** にし、fleet / site は **参照・実績の正本** — **共有 DB にせず ID で疎結合**（machine-dashboard **P-001** 維持）。

---

## 2. プロダクト境界（混同禁止）

| 決定 | 内容 | 正本 |
|------|------|------|
| **P-001（fleet）** | fleet と site は **2 Supabase · 2 Vercel** | [`machine-dashboard/BACKLOG.md`](../../../machine-dashboard/BACKLOG.md) §1 |
| **Sync Schedule** | **第 3 スタック** — Sync Supabase · CF Pages | [`SYNC_DB_ARCHITECTURE.md`](SYNC_DB_ARCHITECTURE.md) |
| **将来連携** | `vehicle_key` · `site_external_id` 等 — **API / エクスポート / ディープリンク** | 本ファイル §4 |

**禁止（v1〜接続前）:**

- 3 DB を 1 にマージする
- Schedule payload に fleet の経費・償却を直書き
- fleet リポに Schedule / site の migration を混ぜる

---

## 3. データの使い回し（転記削減シナリオ）

### 3-1. Schedule → fleet（重機・予定）

| Schedule 側 | fleet 側 | 効果 |
|-------------|----------|------|
| ops 行 · `prop_machine` | `vehicle_key` 参照（将来はピッカー） | 週間表の「BH」が **台帳の正式名称** と一致 |
| 行の `start`/`end` | 配属稼働の **予定区間**（参照のみ） | 特自検アラートと **入場予定日** の突合 |
| `site` 現場名 / 外部 ID | fleet の `site_assigned` 配属（任意） | 門番・配車一覧 |

**Gemini 実態:** 週間工程表 → 重機手配 Excel への **再転記** — ここが第一候補。

### 3-2. Schedule → site（予実・出来高）

| Schedule 側 | site 側 | 効果 |
|-------------|----------|------|
| マイルストーン行 · 完了 `status` | 出来高 **計画％** の入力源 | EVM の **計画線** と工程表のズレ検知 |
| 工区 · 工種（`title` / `prop_scope`） | 工種別出来高モードの **行マスタ** | 日報と工程の **工種名一致** |
| 現場 1 件 = Schedule `site` | site **現場マスタ** 1 件 | 二重の「現場登録」を **外部 ID でリンク** |

**site 要件:** 日報を「正」に集約 · 実行予算 vs 累計 — Schedule は **計画・日程の正本**、site は **金額・実績の正本**（役割分担）。

### 3-3. site ↔ fleet（実績）

| site 側 | fleet 側 | 効果 |
|---------|----------|------|
| 日報の重機稼働 | 経費 · 稼働ログ | リース/燃料と **現場配賦** |
| 現場 ID | 配属重機 | 予実ダッシュボードに **どの重機が効いたか** |

**Schedule 経由しない** 直接連携もあり — 3点ではなく **site↔fleet** が先に固まってもよい。

### 3-4. 逆方向（実績 → 計画）

| 方向 | 例 | 原則 |
|------|-----|------|
| site → Schedule | 遅延が確定 → 監督が日付変更 | **自動シフトは opt-in**（Q-INS-01） |
| fleet → Schedule | 重機故障 → 代替機提案 | v3 以降 · 通知のみから |
| site → Schedule | 出来高％が計画より遅れ | ダッシュボード **警告** · 工程表は監督が確定 |

---

## 4. 疎結合キー（案 · 凍結前）

| キー | 発行元 | 用途 |
|------|--------|------|
| `schedule_org_id` | Sync `schedule_orgs` | 同一会社の3アプリ横断（将来 SSO は別論点） |
| `site_external_id` | Schedule 現場 UUID | site 現場マスタ · fleet 配属の **共通現場キー** |
| `vehicle_key` | fleet 重機マスタ | Schedule `items[].values.machineRef`（名称 `prop_machine` の後継） |
| `schedule_item_id` | Schedule payload | site 日報「本日の工程行」リンク · 監査 |

**時間軸の不一致（設計注意）:**

| 軸 | fleet | Schedule | site |
|----|-------|----------|------|
| 主軸 | FY 7月〜6月 | 工程カレンダー日 | 現場工期 · 日次 |

連携 API は **日付 + site_external_id** を必ず含める。FY 変換は fleet 側の責務。

---

## 5. 認証・入口（現状と将来）

| プロダクト | 認証 | 利用者 |
|------------|------|--------|
| Schedule | Supabase Auth · メール+PW | 現場監督 · ゲスト下請 |
| fleet | **Basic 認証** | 社内経理 · 機材担当 |
| site | Supabase Auth · メール+PW | 監督 · 経理（少数） |

**SSO 一本化は v1 不要。** 接続は **ディープリンク + 読取 API** から:

- Schedule 行の「重機詳細」→ fleet `/vehicles/{key}`（Basic 済みセッションは別タブ）
- Schedule 現場ヘッダ「予実」→ site `/sites/{id}`（同一メールなら Auth 共有可能性 — **別 Supabase のため未確定**）

---

## 6. フェーズ案（Schedule 出荷後）

| 段階 | 内容 | 依存 |
|------|------|------|
| **E0** | 本ファイル + 各リポ BACKLOG に相互リンク | 今 |
| **E1** | Schedule Export に `site_external_id` · 機械名 **正式表記** 列 | Schedule v1 |
| **E2** | `vehicle_key` 手動貼付 · fleet マスタ CSV を Schedule インポート **しない** — ピッカーは **参照 API** | fleet マスタ安定 |
| **E3** | site 現場マスタと `site_external_id` 双方向リンク · 出来高％を Schedule マイルストーンから **初期値** | site MVP |
| **E4** | 週間 Export の重機列 = fleet 正式名 · 特自検 **要確認** バッジ（読取のみ） | E2 |
| **E5** | 日報の「本日工程」= Schedule 当日行の **1クリック転記** | site 日報 |

**やらない（長期も）:** 3アプリを 1 画面に統合 · fleet 経費を Schedule 棒グラフに表示 · 完全リアルタイム双方向同期

---

## 7. Sync ラインとの位置づけ

| 層 | 製品 |
|----|------|
| **sync.sugudasu.com 旗艦** | Schedule |
| **Sync 衛星** | Timeline 進行 · Group 班分け |
| **建設社内スタック（Sync 外 · 兄弟）** | fleet · site — **同じ監督が使うが別 URL · 別課金想定** |

Schedule が **時間と工程のハブ** になれば、fleet / site は **資産とお金のハブ** — カレンダー · Drive · Sheets に相当する **業界特化クラスター**。

---

## 8. 関連リンク

| リポ | ファイル |
|------|----------|
| sugudasu | [`SYNC_SCHEDULE_PRODUCT_DECISION.md`](SYNC_SCHEDULE_PRODUCT_DECISION.md) §0 · [`SCHEDULE_SUPERVISOR_PAIN_HORIZON.md`](SCHEDULE_SUPERVISOR_PAIN_HORIZON.md) §3-1 |
| machine-dashboard | [`BACKLOG.md`](../../../machine-dashboard/BACKLOG.md) P-001 · [`PRODUCT.md`](../../../machine-dashboard/PRODUCT.md) |
| machine-dashboard | [`docs/specs/fleet-cost-requirements.md`](../../../machine-dashboard/docs/specs/fleet-cost-requirements.md) |
| site-dashboard | [`docs/specs/site-cost-requirements.md`](../../../machine-dashboard/docs/specs/site-cost-requirements.md) · [`../site-dashboard/BACKLOG.md`](../../../site-dashboard/BACKLOG.md) |

---

## 9. 変更履歴

| 日付 | 内容 |
|------|------|
| 2026-06-29 | 初版 — 提督構想 · P-001 整合 · 疎結合キー · フェーズ E0–E5 |
