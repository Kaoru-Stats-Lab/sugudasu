# SUGUDASU UIUX Experience 実装契約（決定論）

**更新:** 2026-07-30  
**目的:** 新規プロダクト実装時に、どの Agent でも同じ UI/CTA 配列を再現する。  
**親:** `UIUX_EXPERIENCE_CONSTITUTION_AGENDA.md`（役員会決議）  
**根拠:** `UIUX_EXPERIENCE_AUDIT_MATRIX.md` · `uiux-experience-research/SYNTHESIS.md` · CASE-2026-007

> これは **実装契約（HOW）**。  
> 憲法（WHAT）への昇格可否は役員会で決める。ここは判断を実装に再現するための決定論。

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
| L2 青 (`.sg-btn-primary`) | 主操作（実行・コピー・次へ） | 成功状態の常設色 |
| L3 緑 (`bg-emerald-600`) | 成果物を外へ出す（印刷/DL/Bake/ZIP） | 内部状態変更（+5分・名簿反映） |
| 一時成功（緑/✓） | 成功瞬間のみ（1〜2秒） | ボタン常設色へ昇格 |
| 黒 (`bg-slate-900`) | 小操作・道具操作のみ | ページ主CTA化（例外表なし） |

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
| `bake_download` | `download_output` | L3 緑 |
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
lead_profile: light|heavy
continue_later: yes|no|separate
has_file_drop: yes|no
cta_order: S1 > S2 > S3 > S4
S1_action:
S2_action:
S3_action:
S4_action:
```

このブロックが無い実装はレビューに出さない。

---

## 6. 変更管理（立ち戻り用）

- 判断の背景・証拠は `UIUX_EXPERIENCE_JUDGMENT_LOG.md` に追記
- 憲法判断が必要になった場合のみ `docs/legal/CASE_LAW.md` に昇格
- 実装前提の変更はまず本契約を更新してからコードを変える
