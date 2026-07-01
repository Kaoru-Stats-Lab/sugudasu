# Schedule 分割ペイン PoC — 設計議論ログ（Agent 向け SSOT）

**作成:** 2026-06-29  
**ステータス:** **議論の正本** — 実装詳細は [`SCHEDULE_SPLIT_PANE_POC_SPEC.md`](SCHEDULE_SPLIT_PANE_POC_SPEC.md) · ロードマップは [`SCHEDULE_V3_MASTER_PLAN.md`](SCHEDULE_V3_MASTER_PLAN.md)  
**コード:** `tmp/schedule-split-pane-poc/`  
**議論セッション:** Cursor Agent（分割ペイン PoC · 2026-06-26〜29）— 要約・抜け漏れ補完を本ファイルに集約

> **Agent へ:** Schedule Phase A の「なぜそうしたか」は **本ファイルを先に読む**。WHAT は POC_SPEC、WHEN（フェーズ順）は MASTER_PLAN、提督5問は MASTER_PLAN §3-2.1。

---

## 1. 判断基準（横断 · 今後も同じ物差し）

| # | 基準 | 説明 |
|---|------|------|
| J0 | **転記を減らす** | 新しい書類を増やさない · 同じ日付・工種をコピペさせない · Export は正本から（§0 動機） |
| J0b | **監督に設計させない** | IT リテラシー前提不可 · preset/schema は製品固定 · Web 業界型「載せないものは載せない」はユーザー任せにしない（§0-4） |
| J0c | **文案は Excel 粒度** | 現場語 OK · IT 語は画面に出さない · [`SCHEDULE_UI_COPY.md`](SCHEDULE_UI_COPY.md) D2 |
| J0d | **コアブランドと別トーン** | IT 高層は Schedule スコープ外 · 統一感より勝ち筋 · §0-7 |
| J1 | **現場監督の毎日** | 一見で工種・日程が読めるか。勝手に日付が動く驚きがないか |
| J2 | **印刷/PDF 正本** | §3-2.1: 紙/PDF が提出の正。画面の色・ステータスは印刷に引きずらない |
| J3 | **Notion の本質** | 表と棒の同期 · sub-items · プロパティ列 — ロードマップ DB の表面クローンではない |
| J4 | **ADAPT 色** | `DESIGN_NOTION_SUGUDASU_ADAPT.md` — slate + blue-600 · 棒の多色ガント禁止 |
| J5 | **フェーズ A 境界** | エンジン本番・Sync・矢印 SVG・Notion モーダル丸写しはスコープ外 |
| J6 | **opt-in 既定** | 監督を驚かせる自動化（依存シフト）は **OFF 既定**（Q-INS-01 A） |

---

## 2. 決定クイック参照

| ID | 論点 | 決定 | 状態 | POC_SPEC |
|----|------|------|------|----------|
| D-01 | frappe-gantt PoC | **凍結** · 分割ペインに一本化 | 計画 | MASTER §1 |
| D-02 | 左表 + 右棒 | **必須**（Notion タイムライン本体） | PoC | §4-1 |
| D-03 | 提出 / 現場 | 同 `sortKey` · 行/列マスクのみ | 提督 §3-2.1 | §2 |
| D-04 | 依存矢印 UI | **非表示**（データは保持） | PoC | §3-5 |
| D-05 | 依存自動シフト | **Q-INS-01 A** · 既定 OFF · ON=`maintain_gap` | **実装済** | §3-5 |
| D-06 | 印刷 | ライト/ダーク問わず **黒文字・黒罫線** | **実装済** | §5 |
| D-07 | 棒の色 | **ニュートラル slate** · 工区色は棒に使わない | **実装済** | §4-6 |
| D-08 | ステータス色 | **表列のピルのみ**（進捗のモチベ） | **実装済** | §4-6 |
| D-09 | 棒内ステータス | **載せない**（Notion 分離） | **実装済** | §4-7 |
| D-10 | 棒ラベル優先 | **名前のみ** · 狭い棒も名前優先 | **実装済** | §4-7 |
| D-11 | 棒クリック | **Edit（サイドピーク）** · ドラッグと区別 | **実装済** | §4-7 |
| D-12 | テーマ | **ライト既定** · ダーク任意 | PoC | §4-5 |
| D-13 | Notion Table タブ | **v1 不要** · 左表付き分割ペインで足りる | 議論のみ | §4-7 補足 |
| D-14 | 粗いマイルストーン表 | **工程表正本にしない** | 議論のみ | — |
| D-15 | Dependencies 3モード UI | **v1 不要** · ON/OFF + `maintain_gap` のみ | 議論→A実装 | §3-5 |
| D-16 | Avoid weekends | **稼働日カレンダー**に統合（休工・土日チェック） | 部分実装 | §3-4 |

---

## 3. 時系列ログ（議論の流れ）

### 3-1. 2026-06-26 以前（計画・v2 教訓 · 本ログで初めて PoC 文脈に接続）

| 出来事 | 内容 | 参照 |
|--------|------|------|
| frappe-gantt PoC 不採用 | 表がない · 親ごと別チャート → 手戻り | MASTER §1 |
| v3 でガント DnD **復活** | Notion クローンに合わせ OUT を撤回 | `SYNC_SCHEDULE_PRODUCT_DECISION.md` |
| 提督 SCH-A〜H | v2 Excel 表路線の回答（親ID直列等）— **v3 では依存グラフ + sub-items に置換** | `schedule-spec-taisho-answers.md` |
| Gemini 監督ワークフロー | 地場土木 · 1DB+ビュー · Export 訴求 | `schedule-supervisor-workflow-gemini-RESULT.md` |
| 提督5問確定 | 紙PDF正本 · v1進捗％なし · はみ出し警告 等 | MASTER §3-2.1 |

### 3-2. 2026-06-26〜28 — PoC UI 殻（会話前半 · 要約）

| 論点 | 決定 | 基準 |
|------|------|------|
| Notion 風 UI | 工区ヘッダー=親行 · 提出で status/担当非表示 · 「＋新規」 | J3 |
| 依存矢印 | UI 描画 **削除**（engine にデータ残す） | J5 · 描画負荷 |
| 休工日 | `calendar.holidays[]` · ヘッダ日付クリック | J1 |
| 階層 | `parentItemId` · 日付なし=集約行 · 無制限階層 | J3 |
| Edit | `prompt` 廃止 · サイドピーク / 全画面骨格 | J3 |
| プロパティ | CRM 化防止 · 工程表ドメイン 12 項目カタログ | J1 · Gemini 表 |
| テーマ | **ライト既定**（監督はライト好み仮説） | J1 |

### 3-3. 2026-06-29 — 印刷

| 論点 | 決定 | 基準 |
|------|------|------|
| 画面印刷 Ctrl+P | `@media print` で白地・黒文字・黒罫線 · ダークも同じ | J2 |
| 提出用PDF | 別窓 HTML · インライン `#000` · `preset=submit` 固定 | J2 |
| レイアウト | **後回し** — まず読める黒 | J2 · J5 |
| 検証 | `verify-print.mjs` · `verify-print-browser.mjs` | — |

### 3-4. 2026-06-29 — カラースキーム（デザイナー目線）

| 論点 | 決定 | 基準 |
|------|------|------|
| 棒の工区色 | **廃止** · slate ニュートラル | J2 · J4 |
| 進捗の色 | **表ステータスピル**（未着手/進行中/完了） | J1 · J4 |
| 工区識別 | **表の親行**左 3px アクセントのみ | J4 |
| 印刷 | 色は反映されない前提で問題なし | J2 |

### 3-5. 2026-06-29 — 名前 vs ステータス

| 論点 | 決定 | 基準 |
|------|------|------|
| 棒内で名前とステータスが競合 | **名前優先** → 最終的に **棒は名前のみ** | J1 · J3 |
| Notion 参照 | ステータスはプロパティ列 · 棒はラベル | J3 |
| 表の名前列 vs ステータス列 | **別グリッド列** · 狭いときはステータス側を縮める | J1 |
| 印刷 | ステータス列は **非表示**（名前・日付） | J2 |

### 3-6. 2026-06-29 — 依存関係（Notion Dependencies モーダル）

**論点:** Notion の3モード + Avoid weekends + Turn on dependencies は全部必要か？

| 選択肢 | 内容 |
|--------|------|
| 製品決定（旧） | v1 必須 · 既定 `maintain_gap` |
| Gemini | 自動伝播は **opt-in** |
| **採用 A** | データ常時保持 · **既定 OFF** · ON で `maintain_gap` + 稼働日 |

**実装（A）:**

- `viewState.dependenciesEnabled` 既定 `false`
- ツールバー「依存連動」チェック
- `lib/dependency-engine.mjs` — 伝播 · 循環検出
- サンプル: 工区内 FS チェーン（除草→掘削→…）
- **未実装:** Notion 風3モードモーダル · 矢印 SVG · `overlap_shift` UI

### 3-7. 2026-06-29 — Notion Table View タブの必要性

**論点:** Timeline と連動する Table View（キャプチャのロードマップ表）は監督に必要か？

| 判断 | 内容 |
|------|------|
| **Table タブ（別ビュー）** | **v1 不要** — ロードマップ粒度は現場工程と合わない |
| **分割ペイン左表** | **必要** — 日付編集 · 提出/現場 · Export の正本入力 |
| 社内レポート | 同画面 or PDF · 別 Table タブは増やさない |
| 検査書類 | **別帳票**（v2）— 工程表の行リストでは代替しない |
| 汎用タスク管理 | **スコープ外** — 行は工種・作業（日〜週）が正 |

---

## 4. 総合判断（この議論で確定した「製品の芯」）

1. **工程表は「表付きタイムライン」1画面** — Notion の Timeline|Table タブ乱立ではない。  
2. **色と進捗は表に寄せ、棒は静かな地図** — 印刷とも矛盾しない。  
3. **提出はマスク、現場は全部** — 同じデータ · 驚きのない切替（§3-2.1）。  
4. **依存は持つが驚かせない** — OFF 既定 · 監督が明示 ON した現場だけ連動。  
5. **正本は紙/PDF** — 画面の装飾やステータス色は Web 閲覧用の付加価値。

**ゲート A までに「議論として」残す価値がある理由:** frappe 手戻り・v2/v3 矛盾・Notion 表面模倣の罠を、PoC の一連の判断で一度ほどけた。後続 Agent が Table タブや棒内ステータスを「Notion だから」再提案しないための根拠になる。

---

## 5. 過去議論の抜け漏れ（本ログで初めて PoC に接続したもの）

以下は MASTER_PLAN / PRODUCT_DECISION にあったが、**PoC セッション議論としては明示されていなかった**項目。本ログで接続済み。

| 項目 | 以前の所在 | PoC での扱い |
|------|------------|--------------|
| 提督 SCH-B 親ID直列 | `schedule-spec-taisho-answers.md` | v3 では **依存グラフ** · 直列は `sortKey`+依存 |
| v1 依存矢印 IN | `SYNC_SCHEDULE_PRODUCT_DECISION.md` | **UI は OUT**（PoC）· データ IN |
| MASTER 既定 `maintain_gap` | MASTER §3-2 / §4 | **Q-INS-01 A で上書き** — 既定 OFF |
| 進捗％ | §3-2.1 Q-SUB-03 | v1 提出に出さない · カタログには残置可 |
| ゲスト招待 | MASTER §3-5 | PoC 非スコープ · フェーズ D |
| プロパティ tier | Gemini + PoC | `official` / `ops` · 提出で ops 列マスク |
| OPEN / 全画面 Edit | Notion スクショ参照 | 骨格のみ · 完全一致は後回し |
| `tmp/schedule-gantt-poc/` | MASTER | **参照禁止（凍結）** |

---

## 6. 未決・次のアクション

| ID | 論点 | 候補 | ブロック |
|----|------|------|----------|
| U-01 | ゲート A 提督判定 | 「Notion に近い」可否 | 人間 |
| U-02 | A3 印刷レイアウト | フェーズ E | ゲート A 後 |
| U-03 | 依存 `overlap_shift` UI | v1.1 | 監督 dogfood |
| U-04 | 矢印 SVG 復活 | 要否再評価 | パフォーマンス計測 |
| U-05 | 表のみフォーカスモード | v1.1 狭画面 | U-01 後 |
| U-06 | `SCHEDULE_TOOL_SPEC.md` v3 改訂 | Q-INS-01 A を本文反映 | 0-2 ゲート |
| U-07 | MASTER_PLAN 既定 shift | 本文を「OFF 既定」に同期 | 提督確認 |
| U-08 | 週間 Export / 下請配布 | v1.1 候補 | [`SCHEDULE_WEEKLY_LIST_DESIGN.md`](SCHEDULE_WEEKLY_LIST_DESIGN.md) |
| U-09 | 打設届・占用届テンプレ | v2 | 同上 §4 · Gemini 追問は v2 着手前 |

---

## 7. 実装マッピング（Agent がコードを探すとき）

| 領域 | ファイル |
|------|----------|
| UI 殻 | `tmp/schedule-split-pane-poc/lib/split-pane.mjs` |
| op スタブ | `lib/engine-stub.mjs` |
| 依存伝播 | `lib/dependency-engine.mjs` |
| 提出/現場 | `lib/view-preset.mjs` |
| 稼働日 | `lib/dates.mjs` |
| スタイル | `poc.css`（`@media print` 末尾） |
| 印刷検証 | `verify-print.mjs` · `verify-print-browser.mjs` |
| 依存検証 | `lib/dependency-engine.test.mjs` |
| サンプル依存チェーン | `lib/sample-data.mjs` |

---

## 8. 関連ドキュメント（読む順）

1. **本ファイル** — WHY（議論・判断基準）  
2. [`SCHEDULE_SPLIT_PANE_POC_SPEC.md`](SCHEDULE_SPLIT_PANE_POC_SPEC.md) — WHAT（PoC 仕様）  
3. [`SCHEDULE_V3_MASTER_PLAN.md`](SCHEDULE_V3_MASTER_PLAN.md) §3-2.1 — 提督5問  
4. [`schedule-supervisor-workflow-gemini-RESULT.md`](schedule-supervisor-workflow-gemini-RESULT.md) — 監督調査 · Q-INS-01  
5. [`SYNC_SCHEDULE_PRODUCT_DECISION.md`](SYNC_SCHEDULE_PRODUCT_DECISION.md) — 製品 v3 方針  
6. [`DESIGN_NOTION_SUGUDASU_ADAPT.md`](DESIGN_NOTION_SUGUDASU_ADAPT.md) — 色  
7. [`SCHEDULE_SUPERVISOR_PAIN_HORIZON.md`](SCHEDULE_SUPERVISOR_PAIN_HORIZON.md) — **残 Pain · 横展開 · Gemini 要否**

---

## 9. 変更履歴

| 日付 | 内容 |
|------|------|
| 2026-06-29 | 初版 — Phase A PoC セッション全議論 · 判断基準 · 抜け漏れ補完 · Agent 索引 |
