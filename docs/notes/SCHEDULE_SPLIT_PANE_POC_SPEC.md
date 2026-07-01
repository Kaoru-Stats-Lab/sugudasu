# Schedule 分割ペイン PoC — 仕様（Phase A）

**更新:** 2026-06-29  
**コード:** `tmp/schedule-split-pane-poc/`  
**起動:** `npm run poc:schedule-split-pane` → http://localhost:8092/tmp/schedule-split-pane-poc/  
**上位計画:** [`SCHEDULE_V3_MASTER_PLAN.md`](SCHEDULE_V3_MASTER_PLAN.md) · 提督確定は §3-2.1  
**議論ログ（WHY）:** [`SCHEDULE_SPLIT_PANE_DECISION_LOG.md`](SCHEDULE_SPLIT_PANE_DECISION_LOG.md) — Agent は判断迷い時に先に読む

> **位置づけ:** frappe-gantt 路線は凍結。Notion「タイムライン + テーブル」の **UI 殻** を検証する PoC。エンジンは `engine-stub.mjs`、Sync は未接続。

---

## 1. 目的・スコープ

| やる（PoC） | やらない（本番フェーズ B 以降） |
|-------------|--------------------------------|
| 左表 + 右棒 · 行高同期 · 縦スクロール連動 | `schedule-engine.js` 本実装 |
| 提出 / 現場プリセット切替 | Supabase 保存 · 組織/監督 |
| Notion 風 sub-items（無制限階層） | 依存矢印の画面描画 |
| 休工日（カレンダー） | Excel Import · ポートフォリオ |
| サイドピーク編集 · プロパティ追加 | レイアウト細部の Notion 完全一致 |
| **印刷: 黒文字・黒罫線（ライト/ダーク共通）** | A3 本番レイアウト · xlsx Export |

**ゲート A:** 提督が「Notion に近い」と言えること。通過まで本番 `assets/schedule-*.js` に入らない。

---

## 2. 提督確定（§3-2.1 反映）

| 項目 | PoC での扱い |
|------|----------------|
| **正本** | 紙 / PDF（電子納品は v2） |
| **提出ビュー** | `preset=submit` — ops 行・ops 列をマスク |
| **現場ビュー** | `preset=site` — ステータス・担当・ops プロパティ表示 |
| **並び** | preset 間で `sortKey` 共有（表示マスクのみ） |
| **はみ出し** | ops 行が親提出期間外 → 橙枠 + バナー。**親棒は伸長しない** |
| **進捗％** | v1 提出では使わない（カタログにはあるが提出列から除外可） |
| **Export 訴求** | 月末提出の短縮が第一（本番フェーズ E） |

---

## 3. データモデル（PoC スタブ）

### 3-1. アイテム階層

- `parentItemId` + **日付なし** = **集約行**（工区ヘッダー等）。Notion sub-items と同様、**同階層フラット + インデント表示**。
- 子孫は `collapsed` で折りたたみ可能。
- 工区名は任意文字列（固定 enum ではない）。

### 3-2. visibility

| 値 | 意味 |
|----|------|
| `submit` | 提出ビューのみ |
| `site` | 現場ビューのみ |
| `both` | 両方 |

### 3-3. properties[].tier

| tier | 提出 | 現場 |
|------|------|------|
| `official` | 表示 | 表示 |
| `ops` | 非表示 | 表示 |

### 3-4. カレンダー

- `calendar.holidays[]` — ISO 日付文字列。
- タイムライン **日付ヘッダクリック** で休工 ON/OFF（`toggle_holiday` op）。
- `countWeekends` — 土日を工事日に含めるか（チェックボックス）。

### 3-5. 依存（Q-INS-01 **A** · 2026-06-29 実装）

| 項目 | 仕様 |
|------|------|
| **データ** | `dependencies[]` は常に保持（工区内 FS チェーン） |
| **既定** | `viewState.dependenciesEnabled: false` — **自動シフト OFF** |
| **opt-in** | ツールバー「依存連動」ON → `maintain_gap` で伝播 |
| **モード** | v1 UI は ON/OFF のみ。ON 時は `maintain_gap` 固定 |
| **稼働日** | `countWeekends: false` 時はシフト後を稼働日に寄せ、工事日数維持 |
| **矢印** | UI 非表示（PoC） |
| **循環** | `add_dependency` 時に拒否 |

伝播トリガ: `move_bar` · `resize_bar`（終了変化）· `edit_cell`（終了変化）— 先行 `end` の delta を後続へ。

モジュール: `lib/dependency-engine.mjs` · 検証 `node tmp/schedule-split-pane-poc/lib/dependency-engine.test.mjs`

---

## 4. UI 仕様

### 4-1. 分割ペイン

```
┌─ ツールバー（プリセット · PDF · テーマ · ズーム）────────────┐
├ 左: 表（タスク · 開始 · 終了 · [現場のみ] ステータス・担当) ─┤
│     行ホバー → OPEN（サイドピーク）                          │
├ 右: タイムラインヘッダ + 棒（親集約棒 / 子棒）              │
└ 縦スクロール同期 · 横スクロールはタイムライン側のみ ─────────┘
```

- 行追加: 表末尾「＋新規」、親行下「＋サブアイテム / ＋グループ」。
- 棒 DnD / リサイズ → `move_bar` / `resize_bar`（スタブ）。
- ズーム: 週 / 月。

### 4-2. 提出 / 現場プリセット

- ツールバー `提出` | `現場` タブ → `viewState.activePreset`。
- 提出: `visibility` が `site` の行を非表示、ステータス・担当列非表示、`tier=ops` プロパティ非表示。
- 現場: 上記すべて表示。はみ出し警告あり。

### 4-3. 編集 UX（Notion 風）

- `window.prompt` は **使用しない**。
- 行ホバー **OPEN** → 右 **サイドピーク**（`editorMode: peek`）。
- ピーク内 **全画面** → `editorMode: full`（PoC は骨格のみ、細部は後続）。
- 編集項目: タイトル、開始/終了、visibility、ステータス、担当、追加プロパティ、**削除**。
- プロパティ追加: ドメイン限定カタログから選択（CRM 化防止）。

### 4-4. プロパティカタログ（工程表ドメイン）

基本列（表）: 名前、開始、終了、（現場のみ）ステータス、担当。

追加候補（Edit から）:

| id | ラベル | kind | tier |
|----|--------|------|------|
| `prop_scope` | 施工工区・位置（測点） | text | official |
| `prop_subcontractor` | 協力会社（下請） | text | ops |
| `prop_labor` | 配置予定人工数 | number | ops |
| `prop_machine` | 投入予定重機・車両 | text | ops |
| `prop_material` | 主要資材・予定数量 | text | ops |
| `prop_progress` | 進捗率（出来高％） | number | official |
| `prop_inspection` | 段階確認・立会種別 | select | official |
| `prop_road` | 道路規制・占用フラグ | checkbox | ops |
| `prop_delay` | 直前変更・遅延理由 | text | ops |
| `prop_notice` | 届出区分 | text | official |
| `prop_note` | 備考 | text | official |

※ 工種名・計画期間は `title` / `start` / `end`。表示ティアは `visibility` + `tier`。

### 4-5. テーマ

| 項目 | 仕様 |
|------|------|
| **既定** | **ライト**（`ui.theme: 'light'`） |
| 切替 | ツールバー「ダーク」/「ライト」 |
| 画面 | `:root` = ライト、`schedule-shell.theme-dark` = ダーク |
| **印刷** | **画面テーマと独立** — 常に白地・黒文字・黒罫線（§5） |

テスト用: `?theme=dark` / `?theme=light` で初期テーマ指定可。

### 4-6. カラースキーム（画面 · 2026-06-29）

**設計方針（`DESIGN_NOTION_SUGUDASU_ADAPT.md` 準拠）:** 現場監督が毎日見る画面は **静かな slate ベース** + **進捗だけに意味のある色**。チャート棒は **工区ごとの多色をやめ、ニュートラルな slate 系**（印刷は白黒が正本のため、棒の色に依存しない）。

| 領域 | 色の役割 | トークン |
|------|----------|----------|
| **キャンバス** | 目の疲れを抑える | `--sg-bg` slate-100 · `--sg-surface` 白 |
| **構造・CTA** | 操作の規律 | `--sg-primary` blue-600 |
| **表ステータス** | **モチベーション・進捗把握**（Notion 風ピル + ドット） | 未着手=灰 · 進行中=青 · 完了=緑 |
| **工区親行** | 表のみ左アクセント 3px（棒には使わない） | `--sg-zone-0..3-accent` |
| **チャート棒** | **名前のみ**（Notion タイムライン同様 · ステータスは表列） | `--sg-bar-*` |
| **棒クリック** | ドラッグなしクリック → サイドピーク Edit | `commitDrag` · 親棒も同様 |
| **親集約棒** | 枠線のみ（中は半透明白） | `--sg-bar-parent-*` |
| **ops / はみ出し** | 破線・橙リング（警告は色を残す） | 既存 warning 系 |

**やらないこと:** 工区ごとに棒を多色化 · 棒内ステータス表示 · xlsx `color` の UI 反映。

**ダークテーマ:** 同じ意味論でトークン差し替え（ステータスピルは表列のみ）。

### 4-7. 名前 vs ステータス（Notion 準拠 · 2026-06-29）

**デザイナー判断: 採用する。**

Notion タイムライン＋表では、**名前とステータスは別レイヤー**に置かれる。

| 領域 | Web | 印刷 |
|------|-----|------|
| **左表・名前列** | 工種名を最優先表示（ellipsis は名前列のみ） | 名前 · 開始 · 終了 |
| **左表・ステータス列** | ピル＋ドット（進捗の色はここだけ） | **非表示** |
| **右チャート棒** | **工種名のみ**（ステータスは載せない） | 工種名のみ（白黒枠） |

**理由**

1. **一見把握** — 棒の中で「除草」と「未…」が潰れると、タイムラインの意味が失われる  
2. **Notion と同型** — プロパティ（ステータス）は表の列、棒は期間のラベル  
3. **印刷との一貫** — 画面の棒も印刷も「名前が主役」。色付きステータスは Web の表だけ  
4. **監督のモチベ** — 進捗の色は **表を見たとき** に効く。棒は日程の地図として静かに保つ  

狭い棒では `title` 属性で `工種名 · ステータス` を tooltip 表示（補助情報のみ）。

---

## 5. 印刷仕様（2026-06-29 確定）

**要件:** ライトテーマでもダークテーマでも、印刷結果の **文字と罫線は黒** で読めること。レイアウト（A3・余白・列幅）は本番フェーズ E で詰める。

### 5-1. 画面からの印刷（Ctrl+P）

- `poc.css` の `@media print` が適用される。
- ツールバー・ヒント・編集 UI・OPEN ボタン・追加行 UI は非表示。
- `--sg-*` を印刷時に白/黒へ強制。`.theme-dark` でも同じ。
- 棒は **白塗り + 黒枠**、ラベルは黒文字。
- 土日・休工日は薄灰背景（`#f5f5f5`）のみ許可。文字・罫線は黒。
- `@page { size: landscape; margin: 12mm; }`（PoC 暫定）。

### 5-2. 提出用 PDF（ツールバー「提出用PDF」）

- `preset=submit` 固定の簡易 HTML を **別ウィンドウ** で生成。
- インライン CSS で **常に `#000` 文字・`#000` 罫線**（画面テーマ非参照）。
- `window.print()` で OS 印刷ダイアログを開く。
- 出力列: 工種 · 開始 · 終了（ops 行・ステータス・担当は除外）。

### 5-3. 検証

```bash
node tmp/schedule-split-pane-poc/verify-print.mjs
```

**手動チェックリスト:**

1. 既定（ライト）で Ctrl+P → プレビューで文字・表罫線・棒枠が黒
2. ダーク切替（または `?theme=dark`）後 Ctrl+P → 同上（白地に黒、画面が暗いまま印刷されない）
3. 「提出用PDF」→ 別窓プレビューで表の罫線・文字が黒（ライト/ダークどちらの画面状態からでも）

---

## 6. モジュール構成

| ファイル | 責務 |
|----------|------|
| `app.mjs` | マウント · `?theme=` |
| `lib/split-pane.mjs` | DOM · ツールバー · 描画 · Edit · 提出 PDF |
| `lib/engine-stub.mjs` | op 適用（insert / edit / delete / holiday / set_ui …） |
| `lib/item-tree.mjs` | 階層 · 集約行判定 |
| `lib/view-preset.mjs` | 提出/現場フィルタ · はみ出し · export 行 |
| `lib/visible-items.mjs` | 折りたたみ · 表示行 |
| `lib/dates.mjs` | 稼働日 · 休工 · チャート範囲 |
| `lib/sample-data.mjs` | ダミーデータ |
| `poc.css` | ライト/ダーク + **@media print** |

---

## 7. 未実装・後続

| 項目 | フェーズ |
|------|----------|
| `schedule-engine.js` 本実装 · 依存伝播 | B |
| 依存矢印 SVG | B 以降（要否再評価） |
| A3 本番レイアウト · xlsx | E |
| Notion OPEN 位置・ホバー完全一致 | A 磨き込み |
| 全画面 Edit の細部 | A 磨き込み |
| `assets/schedule-split-pane.js` への移植 | A ゲート通過後 |
| デザイン SSOT 本番 CSS（`--sg-*`） | 本番化時 · ADAPT 準拠 |

---

## 8. 関連ドキュメント

- [`SCHEDULE_V3_MASTER_PLAN.md`](SCHEDULE_V3_MASTER_PLAN.md) — 全体ロードマップ
- [`SCHEDULE_TOOL_SPEC.md`](SCHEDULE_TOOL_SPEC.md) — 本番ツール仕様（v3 改訂待ち）
- [`schedule-supervisor-workflow-gemini-RESULT.md`](schedule-supervisor-workflow-gemini-RESULT.md) — 監督ワークフロー調査
- [`DESIGN_NOTION_SUGUDASU_ADAPT.md`](DESIGN_NOTION_SUGUDASU_ADAPT.md) — 本番色（PoC は `poc.css` ローカル変数）
