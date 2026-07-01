# Schedule — 現場監督の残 Pain と横展開マップ

**更新:** 2026-06-29  
**根拠:** [`schedule-supervisor-workflow-gemini-RESULT.md`](schedule-supervisor-workflow-gemini-RESULT.md)（2026-06-29 調査済）· [`SCHEDULE_SPLIT_PANE_DECISION_LOG.md`](SCHEDULE_SPLIT_PANE_DECISION_LOG.md) · §3-2.1 提督確定  
**対象:** Sync Schedule（`sync.sugudasu.com/schedule`）— 地場土木 · 工期3ヶ月〜1年 · 監督1〜3名/現場  
**ペルソナ前提:** [`SYNC_SCHEDULE_PRODUCT_DECISION.md`](SYNC_SCHEDULE_PRODUCT_DECISION.md) §0-4〜5 — **CAD+Excel 日常** · IT 独学不可 · 汎用ガント選定 fatigue → **業界特化 preset**

> **Gemini 再調査:** **今回は不要**。依頼1–3で Pain と書類転記は網羅済み。次に Gemini を使うなら **§6 の追問**（週間/日次の優先 · 書類テンプレ ROI 順位）に限定する。

---

## 1. エグゼクティブサマリー

| 問い | 答え |
|------|------|
| **さらなる Pain はあるか？** | **ある。** v1 が解くのは主に「月間提出 × 現場 ops の二重管理」の芯。週間配布・日次朝礼・重機/資材の別 Excel・行政様式・安全台帳は **未着手**。 |
| **横展開で省力化できるか？** | **できる。** 工程表マスタから **転記削減** が効く領域が明確（打設届・占用期間・材料搬入等）。**完全自動化**は様式固定書類で限界。 |
| **v1 のキラーは何か** | 月末 **提出用 A3/PDF Export**（監理への月間工程表）— 既に Q-BAR-01 確定。 |
| **次のキラー候補** | ① **週間 ops リスト Export**（下請配布）— [`SCHEDULE_WEEKLY_LIST_DESIGN.md`](SCHEDULE_WEEKLY_LIST_DESIGN.md) ② 打設届（v2）③ 閲覧 URL |
| **兄弟スタック（将来）** | [`SCHEDULE_CONSTRUCTION_ECOSYSTEM.md`](SCHEDULE_CONSTRUCTION_ECOSYSTEM.md) — **fleet 重機台帳** · **site 現場予実** と `vehicle_key` / `site_external_id` で疎結合 |

---

## 2. いま解決しようとしている Pain（v1 スコープ内）

| Pain | 典型行動 | Schedule の答え | フェーズ |
|------|----------|-----------------|----------|
| 提出用と現場用の **二重入力** | 月次 Excel → ホワイトボードへ書き写し | 1DB · `submit` / `site` preset | PoC→C |
| 重機・資材を提出に載せたくない | 別シート・別ファイル | `visibility: site` 行 · `tier: ops` 列 | PoC |
| 月末の監理提出が面倒 | Excel 整形 · 印刷 | 提出固定 PDF/xlsx Export | E |
| 監督間・他現場の把握 | メール・電話 | 組織内一覧 · 閲覧（編集は割当） | D |
| 下請に現場だけ見せたい | LINE スクショ | ゲスト招待 · 現場単位 | D |
| 日付を勝手に連動される不安 | — | 依存 **既定 OFF** · opt-in | PoC |

---

## 3. まだ解いていない Pain（優先度付き）

Gemini 実態マップ（依頼1）と v1 ギャップの突合。

### 3-1. 高（Schedule データと相性が良い · 横展開候補）

| Pain | 頻度 | なぜ残るか | Schedule で取れる一手 |
|------|------|------------|------------------------|
| **週間工程の再作成・下請配布** | 週次 | 月間表から週を切り出し LINE/紙 | **週ズーム + 週間 Export**（担当・工区フィルタ）· 共有 URL |
| **重機入場の門番・配車連絡** | 日〜週 | 週間表と別 Excel | `site` 行 + `prop_machine` から **一覧 PDF/1枚** |
| **生コン・資材納入の転記** | 日〜週 | 電話/FAX · 天候キャンセル | `prop_material` · 納入 ops 行 · **翌週リスト Export**（通知は v1.1） |
| **打設届の転記** | 都度 | 工程表→届出様式へ手入力 | **v2 テンプレ**（日付·工区·数量を payload から） |
| **道路占用と工程の期間ズレ** | 里程碑 | 申請書と全体表を手で合わせる | `prop_road` + ops 行期間の **期間テキスト Export** |

### 3-2. 中（データは一部使えるが様式・法規が重い）

| Pain | 障壁 | 横展開 |
|------|------|--------|
| **施工計画書添付の工程表** | Word 構成指定 | 提出 preset の A3/xlsx を **添付そのまま**（自動化3/5） |
| **材料搬入・確認書** | 製造所名等は別マスタ | 工程日 + `prop_material` から **下書き** |
| **自主検査チェック** | 社内様式ばらつき | 検査工区名·予定日を **行タイトル+日付から転記** |
| **中間・完了検査申請** | 法定様式 · 出来高％ | v1 は進捗％なし → **v1.1 以降** |

### 3-3. 低 / Schedule 単体では弱い（スコープ外または v2+）

| Pain | 理由 |
|------|------|
| **日次朝礼・当日看板** | 解像度が **日次・人員単位** — 月間工程表 DB の1段上の粒度が必要 |
| **施工打合せ簿** | 様式固定 · 協議文面 — ドキュメント製品の領域 |
| **特自検・グリーンサイト** | 安全台帳は **3年保管** · 別法規 — 連携はメモ程度 |
| **電子納品 XML** | 竣工時一括 · スキーマ固定 — v2 以降（Q-SUB-01） |
| **設備サブコン別 Excel** | 組織間 · 元請以外の編集権 — ゲストでは不足の可能性 |
| **天候直前の一斉連絡** | リアルタイム通知 · LINE 文化 — WebSocket/通知 v2 |

---

## 4. 横展開マトリクス（工程表データ → 出力）

**原則:** 正本は `payload.items[]` + `properties[]`。**提出 Export は `submit` 固定**（DECISION_LOG D-03）。

| 出力 | 使うデータ | 自動化余地 (Gemini) | 推奨フェーズ | v1? |
|------|------------|---------------------|--------------|-----|
| 月間工程表 PDF/xlsx | 提出行 · 開始/終了 | 5 | E | **キラー** |
| 週間工程（下請向け） | site 行 · 担当フィルタ · 週範囲 | 4 | E.1 / v1.1 | 次点 |
| 重機・車両入場一覧 | ops 行 · `prop_machine` | 4 | v1.1 | 候補 |
| 資材納入予定一覧 | ops 行 · `prop_material` · `prop_qty` | 4 | v1.1 | 候補 |
| コンクリート打設届 | 打設工種 · 日付 · 数量プロパティ | 5 | v2 | H4-1 |
| 道路占用期間明細 | `prop_road` · 占有 ops 行 | 3–4 | v2 | H4-3 |
| 施工計画添付工程表 | submit Export そのまま | 3 | E | 同時 |
| 材料搬入確認書 | 日付 · 資材 · 協力会社 | 4 | v2 | — |
| 検査申請（希望日） | 立会 `prop_inspection` · 里程碑 | 4 | v2 | 進捗％後 |
| 電子納品成果品 | 全工期イベント | 4 | v2+ | × |

---

## 5. プロパティ設計との対応（既に PoC カタログにあるもの）

| プロパティ | 横展開先 |
|------------|----------|
| `prop_subcontractor` | 週間配布 · 担当フィルタ |
| `prop_machine` | 重機入場一覧 · 門番シート |
| `prop_material` / `prop_qty` | 納入予定 · 打設届数量 |
| `prop_road` | 道路占用申請期間 |
| `prop_inspection` | 立会・検査申請日 |
| `prop_notice` | 届出区分メモ（打設届の種別） |
| `prop_delay` | 監理説明用メモ（提出には載せない） |

**足りない可能性があるプロパティ（v1.1 検討）:** 打設 m³ · 生コン工場名 · 警察署提出済みフラグ · 天候待ちフラグ。

---

## 6. Gemini をいつ再投入するか

| 状況 | 判断 |
|------|------|
| **今（PoC〜v1 設計）** | **不要** — [`schedule-supervisor-workflow-gemini-RESULT.md`](schedule-supervisor-workflow-gemini-RESULT.md) で H1–H5 検証済み |
| **ゲート C 前（dogfood）** | 推奨 — **週間 vs 日次** どちらを先に Export するか、監督3名の優先順位 |
| **v2 書類着手前** | 推奨 — **打設届・占用届** の様式サンプル収集 · フィールドマッピング表 |
| **建築 vs 土木分岐** | 任意 — 現状は **地場土木第一**（Gemini 依頼1 より） |

### 追問プロンプト案（必要時）

`docs/prompts/schedule-supervisor-workflow-gemini-prompt.md` に §4 として追記可:

- 週間工程表の **必須列**（下請が LINE で欲しい情報 top5）
- 日次朝礼看板を Schedule で代替する **現実性**（1–5）
- v2 書類3種（打設届・占用·材料）の **フィールド対応表**

---

## 7. 製品判断（提督向け · 推奨ロードマップ）

```
v1 キラー     月間提出 Export（済み方針）+ 1DB 二重管理解消
     ↓
v1.1 時短     週間リスト Export · 重機/資材一覧 · 閲覧URLの配布UX
     ↓
v2 書類       打設届ドラフト · 道路占用期間 · 材料搬入下書き
     ↓
v2+           通知 · 日次粒度 · 電子納品連携
```

**やらない（維持）:** ERP · リソース平準化 · 施工打合せ簿の完全代替 · Notion 式ドキュメント統合（v1）

---

## 8. 関連リンク

| 文書 | 役割 |
|------|------|
| [`schedule-supervisor-workflow-gemini-RESULT.md`](schedule-supervisor-workflow-gemini-RESULT.md) | 一次調査（実態マップ · H4 上位3書類） |
| [`SCHEDULE_SPLIT_PANE_DECISION_LOG.md`](SCHEDULE_SPLIT_PANE_DECISION_LOG.md) | PoC 議論 · 1DB 思想 |
| [`SCHEDULE_V3_MASTER_PLAN.md`](SCHEDULE_V3_MASTER_PLAN.md) §3-2.1 | 提督5問 |
| [`SYNC_SCHEDULE_PRODUCT_DECISION.md`](SYNC_SCHEDULE_PRODUCT_DECISION.md) | 製品境界 |

---

## 9. 変更履歴

| 日付 | 内容 |
|------|------|
| 2026-06-29 | 初版 — Gemini 結果突合 · 残 Pain 優先度 · 横展開マトリクス · Gemini 再調査要否 |
