# SUGUDASU UIUX Experience 実装契約（決定論）

**更新:** 2026-08-05  
**目的:** 新規プロダクト実装時に、どの Agent でも同じ UI/CTA 配列を再現する。  
**親:** `UIUX_EXPERIENCE_CONSTITUTION_AGENDA.md`（役員会決議）  
**根拠:** `UIUX_EXPERIENCE_AUDIT_MATRIX.md` · `uiux-experience-research/SYNTHESIS.md` · `SYNTHESIS_SURFACE_HIERARCHY.md` · CASE-2026-007

> これは **実装契約（HOW）** であり、**憲法（WHAT / identity）ではない。**  
> Identity の正本は Brand Constitution · Commentary · Case Law（E-CONST · 2026-07-30）。  
> 層の差: [`../legal/LEGAL_INTERPRETATION_GUIDE.md`](../legal/LEGAL_INTERPRETATION_GUIDE.md) §2.1。  
> 親アジェンダ: `UIUX_EXPERIENCE_CONSTITUTION_AGENDA.md`（呼称: Experience **Implementation** Review）。

---

## 0. 適用範囲

- 新規 `inNav: true` ツール
- 既存ツールの全面 UI 改修（CTA・コピー・DnD・完了導線）
- Playbook §1.5 の公開チェック

---

## 1. 入力（必須）

実装前に、次の 6 つを **必ず**決める。未確定なら実装しない。

1. `product_id`（例: `invoice`）
2. `completion_model`（下表の 6 択）
3. `product_voice`（下表の 5 択）
4. `lead_profile`（`light` / `heavy` — §4.1）
5. `continue_later`（`yes` / `no` / `separate`）
6. `has_file_drop`（`yes` / `no`）

### 1.1 completion_model（6 択）

| 値 | 意味 |
|----|------|
| `transform_copy` | 変換後コピーが主完了 |
| `print_finish` | 印刷/紙出力が主完了 |
| `bake_download` | 生成してDLが主完了 |
| `canvas_copy` | キャンバス結果コピーが主完了 |
| `continue_later` | 途中再開が主導線（完了とは別） |
| `session_ephemeral` | 使い切り（残さない）が主約束 |

### 1.2 product_voice（5 択）

| 値 | 想定 |
|----|------|
| `formal_document` | 帳票・提出・証跡中心 |
| `fast_utility` | 一発処理・短時間変換 |
| `visual_workbench` | 画像/キャンバス操作中心 |
| `board_planning` | 班分け・配置・会議進行 |
| `ephemeral_pad` | その場限り・即時処理 |

---

## 2. 色と意味（固定）

| トークン | 固定意味 | 禁止 |
|----------|----------|------|
| L2 青 (`.sg-btn-primary`) | 主操作（実行・コピー・次へ · handoff · フル幅の副完了） | 成功状態の常設色 |
| L3 緑 (`bg-emerald-600` / `--sg-print-cta`) | 文脈内の紙出口（印刷/PDFダイアログへ）。**ヘッダー禁止** | 内部操作 · コピー成功のボタン塗り · sticky chrome |
| コピー成功アクセント (`--sg-copy-ok`) | ✓ / 近接 status 文言のみ（1〜2秒） | 印刷CTAと同HEX · ボタン背景への流用 · `body` 全面 flash |
| 黒 (`bg-slate-900` / `.sg-btn-ink`) | **小操作のみ**（下表） | フル幅CTA · クロスツール handoff · ページ主ゴール |

### 2.0 印刷配置（E-L3 · 2026-07-30 FIX）

| 採択 | 内容 |
|------|------|
| 製品 | チャネル非接続 / 手動持ち帰りが主完了学習（旧称 Copy-First · スローガンとしては使わない）。印刷は紙経路の **shortcut** |
| 配置 | sticky ヘッダーに印刷を **置かない**（`sugudasu-shell.js`） |
| 制約 | `window.print()` → ブラウザ印刷ダイアログは **不可避**（受容） |
| 色・Bake | DL/ZIP を L3 同色にするかは **E-L3-COLOR 延期** |

### 2.1 黒ボタン例外表（E-BLACK · 2026-07-30 採択）

**決議:** 小操作黒は残す · フル幅／handoff 級は L2 青へ · 一括置換はしない（帳票ウェーブで是正）。

| 黒にしてよい（小操作） | 黒にしない（L2 青へ） |
|------------------------|------------------------|
| `+ 行を追加` · `＋ スタッフを追加` · `＋ グループを追加` 等の **インライン追加** | `w-full` の黒ボタン |
| 行・枠の横の短い道具操作（主CTAと競合しない幅） | クロスツール handoff（例: stamp→請求書） |
| | 共有URL / 送付文面コピー / 一括反映 / 履歴保存 / メール送信 など **作業の山場** |

`product_voice: formal_document` でも、上表の「黒にしない」は適用する。  
装飾用の黒背景（honor ブロック · プレビュー枠）はボタンではない（本表の対象外）。

### 2.2 コピー成功フィードバック（E-TOAST / E-FLASH · 案 C+ · 2026-07-30 採択）

**決議:** チャネル非接続の持ち帰り確認は薄くしない（旧称 Copy-First · スローガン不可）。削るのは視線外の派手さのみ。

| 必須 | 禁止 |
|------|------|
| 操作点: ラベル「コピーしました」（青ボタンは青のまま · `.sg-copy-btn--confirmed`） | `body` 全面緑フラッシュ |
| Transform-Copy: 近接ペイロード（行数 · 先頭行 · 必要ならフィルター注意） | 成功用浮遊グローバル Toast |
| `role="status"` / フォーカス移動なし | ボタン背景の印刷 emerald 一時化 |
| 失敗・警告の近接 status（維持） | 英語 `Copied!` · `alert` 成功 · 確認の意図的薄化 |

成功アクセント色は `--sg-copy-ok`（印刷 `--sg-print-cta` と別）。詳細: `UIUX_EXPERIENCE_TOAST_FLASH_BOARD_DISCUSSION.md` · リサーチ `COPY_FEEDBACK_WEB_PRACTICE.md`。

### 2.3 体感SLA（E-SLA · 2026-07-30 FIX · ハイブリッド）

**憲法には上げない。** 原則は本契約 · 数値目安は `DESIGN_GUIDELINE.md` §3.9。層の差: `LEGAL_INTERPRETATION_GUIDE.md` §2.1。

| 原則（必須） | 禁止 |
|--------------|------|
| 操作への即時フィードバック | 押下後の沈黙 |
| 成功は非ブロッキング | `alert` 成功 |
| 長処理は busy / 進捗を見せる | 完了だけ突然表示 |

数値 ms の未達は **下手**であり **違憲ではない**。機械ゲートは「長処理なのに busy なし」など観測可能なものに限る（必須ゲートは段階導入）。

### 2.4 Surface / Visual Hierarchy（S-SURFACE · 2026-08-05）

**性質:** HOW（実装契約）。Brand / Case に昇格しない（E-CONST · S-Q3）。  
**討議:** `UIUX_EXPERIENCE_SURFACE_BOARD_DISCUSSION.md` · 合成 `uiux-experience-research/SYNTHESIS_SURFACE_HIERARCHY.md`  
**見た目の目安:** `DESIGN_GUIDELINE.md` §2.3.1

#### 認知モード（Orient / Locate / Operate / Confirm）

| モード | Hub | Product |
|--------|-----|---------|
| Orient | 任意 | 任意（※ `sg-tool-lead` What は §4.1 で必須 · 箱化は任意） |
| Locate | **必須** | 任意 |
| Operate | **禁止** | **必須** |
| Confirm | **禁止** | **必須** |

#### Hub（Locate）

| 層 | 役割 | Surface |
|----|------|---------|
| 検索 | Locate-**core** | **一段上げ**（Workspace 級）。IA は検索ファースト維持 |
| カテゴリ / 最近 | Locate-**assist** | 検索と同列にしない |
| ツールカード | 一覧 | **同型維持**（カード間ヒエラルキー禁止 · 廃止禁止） |

#### Product（Operate）

| 規則 | 内容 |
|------|------|
| Workspace | **1画面に原則1つ**（触る塊） |
| リード What | 折らない（§4.1） |
| 長い使い方 / How 箱 | `product_voice` に応じ折る（方針: formal=初回開、fast/visual/ephemeral=常に折る＋？）。実装は折る＋？からパイロット |
| 境界の作り方 | 余白 · 線 · 背景Δ。**多層影禁止**（S-NO-ELEV） |

#### 禁止（Agent）

- Primary / 色トークンの一括再定義（S-NO-COLOR · 階層の後）
- Hub カード廃止 · カード間の見た目ヒエラルキー付け
- Hub / 全ツール Surface 一括改修
- Material 風多段 Elevation を階層の主手段にする
- Hub を作業机化（Operate/Confirm を Hub に置く）

#### パイロット（S-PILOT）

| ID | 範囲 | 状態 |
|----|------|------|
| S-PILOT | Hub 検索（`.sg-hub-locate-core`） | **実装済** |
| **S-PILOT-2** | `pdf-fill` 記入ツール+キャンバス（`.sg-surface-workspace`）· 完成カードは `.sg-surface-section` | **仮説検証中** |

共通クラス: `.sg-surface-workspace` / `.sg-surface-section`（DESIGN §2.3.1）。色一括・全ツール横展開は禁止。

**語彙ゲート（検索ファースト必須）:** Hub カード全 toolId に `search-dictionary` · `synonyms` · `tool-intent-map` が無いと `validate:hub-ia` が fail。手順: `docs/prompts/hub-search-vocab-on-new-tool.md` · Playbook §1.5 A15。

---

## 3. CTA 配列アルゴリズム（決定論）

### 3.1 スロット定義（順序固定）

1. `S1` 主完了（最も重要）
2. `S2` 副完了（共有・検算・補完）
3. `S3` 継続/再開（Continue Later）
4. `S4` 破壊/リセット

### 3.2 completion_model から S1 を決める

| completion_model | S1 の型 | 色 |
|------------------|---------|----|
| `transform_copy` | `copy_result` | L2 青 |
| `print_finish` | `print_or_export` | L3 緑 |
| `bake_download` | `download_output` | L2 青（暫定）※ L3 同色化は E-L3-COLOR 延期 |
| `canvas_copy` | `copy_canvas` | L2 青 |
| `continue_later` | `open_continue_panel` | L2 青 |
| `session_ephemeral` | `run_now` | L2 青 |

### 3.3 voice で S2-S4 の順序と有無を決める

| product_voice | 並び（左→右） |
|---------------|---------------|
| `formal_document` | `S1 > S2(copy/share) > S3(continue if yes) > S4` |
| `fast_utility` | `S1 > S2(download if exists) > S4` |
| `visual_workbench` | `S1 > S2(export) > S2b(copy alt) > S4` |
| `board_planning` | `S1 > S2(copy) > S2b(export) > S3(if yes) > S4` |
| `ephemeral_pad` | `S1 > S2(copy optional) > S4` |

> `S2b` は `S2` の後ろ固定。`S1` より前に置かない。

### 3.4 Continue Later の扱い

- `continue_later=yes` のときだけ `S3` を表示
- `continue_later=no` のとき `S3` を作らない
- `continue_later=separate`（`clip-stash` 等）は専用導線。`S3` へ混ぜない

### 3.5 DnD の決定論

- `has_file_drop=yes` のとき:
  - 見た目は `.sg-file-drop`
  - クリック代替（file input）を必ず同居
  - drop 未実装なら見た目を出さない（詐欺禁止）
- `has_file_drop=no` のとき:
  - `.sg-file-drop` を使わない

---

## 4. 文言契約（固定）

- コピー成功: `コピーしました`
- 印刷開始: `印刷を開始しました`（印刷完了と断定しない）
- ダウンロード開始: `ダウンロードを開始しました`
- Continue Later: `続きを開く`（「保存」を主CTAにしない）

禁止:
- `Copied!`
- `alert()` による成功通知
- チャネル名付き共有CTA（CASE-2026-007）
- コピー成功の `body` 全面フラッシュ · ボタン印刷緑一時化 · 成功確認の薄化（§2.2）

### 4.1 リード文（`sg-tool-lead`）— 2026-07-30 決議

**SSOT分類:** `data/tool-lead-profiles.json`  
**討議:** `UIUX_EXPERIENCE_LEAD_COPY_BOARD_DISCUSSION.md`

| 層 | ルール |
|----|--------|
| **What**（何か・誰向け） | **全ツール必須**（1〜2文）。`sg-tool-lead` に置く |
| **Why**（非代替・差別化） | **heavy のみ** · リードに **最大1句**。詳細は FAQ。長文重複禁止 |
| **How**（操作手順） | **リード禁止**（UI直下の短い手順 or FAQ） |
| **トップ / statements** | 本節の対象外（価値観・約束ページ） |
| **Hub カード** | 別 SSOT（`TOOL_CARD_WRITING_GUIDELINE.md`） |

`lead_profile`:

| 値 | リード構成 |
|----|------------|
| `light` | What 1〜2文のみ。Why/How をリードに置かない |
| `heavy` | What +（任意）シナリオ1句 +（任意）Boundary予防線1句 |

第一軸は **複雑度（light/heavy）**。`completion_model` は CTA 軸であり、リード型の主軸にしない。

マークアップ（標準）:

```html
<header class="sg-tool-intro space-y-2 no-print">
  <div class="sg-tool-lead-deck">
    <p class="sg-tool-lead"><strong>…What…</strong> — …</p>
    <!-- heavy のみ任意: Boundary 1句 -->
  </div>
</header>
```

---

## 5. 実装出力（Agent 必須）

新規実装時、PR説明またはコミット前メモに以下をコピペして埋める。

```text
[UIUX_DECISION_BLOCK]
product_id:
completion_model:
product_voice:
copy_success_mode: point_confirm | point_plus_payload
lead_profile: light|heavy
continue_later: yes|no|separate
has_file_drop: yes|no
cta_order: S1 > S2 > S3 > S4
S1_action:
S2_action:
S3_action:
S4_action:
```

`copy_success_mode`: 通常コピーは `point_confirm`。Transform-Copy（行構造）は `point_plus_payload`（近接行数必須）。

このブロックが無い実装はレビューに出さない。

---

## 6. 変更管理（立ち戻り用）

- 判断の背景・証拠は `UIUX_EXPERIENCE_JUDGMENT_LOG.md` に追記
- 憲法判断が必要になった場合のみ `docs/legal/CASE_LAW.md` に昇格
- 実装前提の変更はまず本契約を更新してからコードを変える
