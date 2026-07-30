# UIUX Experience MECE ツール別チェックリスト

**更新:** 2026-07-30  
**目的:** P0 を「全ツール漏れなく・重複なく」進めるための運用台帳。  
**契約:** `UIUX_EXPERIENCE_IMPLEMENTATION_CONTRACT.md`  
**監査起点:** `UIUX_EXPERIENCE_AUDIT_MATRIX.md`

---

## 使い方（固定）

1. 1ツールごとに `UIUX_DECISION_BLOCK` を埋める  
2. P0-1〜P0-4 を `done|na|hold` で更新  
3. `hold` は理由を「備考」に1行で残す  
4. 週次で `hold` を潰す（放置禁止）

---

## ステータス凡例

- `done`: 対応完了
- `na`: そのツールには不要
- `hold`: 保留（理由必須）

---

## A. Transform-Copy

| tool | voice | continue | file_drop | P0-1 | P0-2 | P0-3 | P0-4 | 備考 |
|------|-------|----------|-----------|------|------|------|------|------|
| report | fast_utility | no | no | done | done | done | na | P0-3: チャネル共有CTAなし |
| reverse | fast_utility | no | no | done | done | done | na | 同上 |
| normalize | fast_utility | no | no | done | done | done | na | 仕様 Copied! 掃除済 |
| search-query | fast_utility | no | no | done | na | done | na | P0 pilot（2026-07-30） |
| table-conv | fast_utility | no | yes | done | done | done | done | P0-4: drop+input 同居確認 |
| test-data | fast_utility | no | no | done | done | done | na | |
| broken-input | fast_utility | no | no | done | done | done | na | |
| group-split | board_planning | yes | custom | done | done | done | na | P0-3: 形式ラベル改称 · P0-4=na（file dropなし）· SEO残はリード議題 |
| fair-draw | board_planning | no | yes | done | done | done | done | P0-3: 共有用コピー文言 · CSV drop確認 |
| budget-trim | fast_utility | no | no | done | done | done | na | |
| warikan | fast_utility | no | no | done | done | done | na | P0-3: 清算見出し・toast 手動貼付 |
| sns | fast_utility | no | no | done | done | done | na | |
| link-qr | fast_utility | no | no | done | done | done | na | |
| diff | fast_utility | no | no | done | done | done | na | FAQ貼付例は disclosure 層 |
| json-view | fast_utility | no | no | done | done | done | na | |
| ai-cleaner | fast_utility | no | no | done | done | done | na | |
| time-calc | fast_utility | no | no | na | done | done | na | |
| font-converter | fast_utility | no | no | done | done | done | na | |

## B. Print-Finish

| tool | voice | continue | file_drop | P0-1 | P0-2 | P0-3 | P0-4 | 備考 |
|------|-------|----------|-----------|------|------|------|------|------|
| invoice | formal_document | no | custom | done | done | done | na | P0-4=na（行DnD≠file） |
| receipt | formal_document | no | no | done | done | done | na | |
| label | formal_document | no | no | done | done | done | na | |
| shift | formal_document | yes | no | done | done | done | na | |

## C. Bake-Download

| tool | voice | continue | file_drop | P0-1 | P0-2 | P0-3 | P0-4 | 備考 |
|------|-------|----------|-----------|------|------|------|------|------|
| webp-to-jpg | visual_workbench | no | custom | done | done | done | done | custom drop 確認 |
| video-frame | visual_workbench | no | custom | na | done | done | done | assets/video-frame.js drop 確認 |
| watermark | visual_workbench | no | yes | na | done | done | done | bindDrop 確認 |
| pdf-fill | formal_document | yes | yes | na | done | done | done | pdff-drop 確認 |
| pdf-images | visual_workbench | no | yes | na | done | done | done | pdfi-drop 確認 |

## D. Canvas-Copy

| tool | voice | continue | file_drop | P0-1 | P0-2 | P0-3 | P0-4 | 備考 |
|------|-------|----------|-----------|------|------|------|------|------|
| stamp | visual_workbench | no | no | done | done | done | na | 仕様 Copied! 掃除済 |
| annotate | visual_workbench | no | yes | done | done | done | done | P0-3 lead CASE整合 · drop 確認 |
| image-trim | visual_workbench | no | yes | done | done | done | done | |
| clipboard-trim | visual_workbench | no | yes | done | done | done | done | |

## E. Continue-Later

| tool | voice | continue | file_drop | P0-1 | P0-2 | P0-3 | P0-4 | 備考 |
|------|-------|----------|-----------|------|------|------|------|------|
| match-board | board_planning | yes | no | done | done | done | na | |
| slot-board | board_planning | yes | custom | done | done | done | na | P0-4=na（枠DnD≠file） |
| timeline | board_planning | yes | no | done | done | done | na | 仕様 Copied! 掃除済 |

## F. Session-Ephemeral / 別JTBD

| tool | voice | continue | file_drop | P0-1 | P0-2 | P0-3 | P0-4 | 備考 |
|------|-------|----------|-----------|------|------|------|------|------|
| planning-poker | ephemeral_pad | no | no | done | done | done | na | |
| qr-reader | ephemeral_pad | no | no | done | done | done | na | |
| uragami | ephemeral_pad | no | no | na | na | done | na | CASE-2026-008 · 意図的非永続 |
| clip-stash | board_planning | separate | yes | done | done | done | done | sg-file-drop 確認 |
| mention | board_planning | separate | no | na | na | done | na | Extension · CL=別 |

---

## パイロット記録

### search-query（2026-07-30）

```text
[UIUX_DECISION_BLOCK]
product_id: search-query
completion_model: transform_copy
product_voice: fast_utility
continue_later: no
has_file_drop: no
cta_order: S1 > S2 > S4
S1_action: copy_result
S2_action: open_google_search
S3_action: none
S4_action: clear_inputs (将来)
```

### hold 消化ウェーブ（2026-07-30）

```text
[UIUX_P0_REPORT]
scope: MECE hold消化（P0-1/P0-2 横断）
tools: match-board · mask · warikan(growth) · sticky-room · updates + 台帳一括精査
P0-1: done（実務ツールの alert 残を解消 · Bake系は na）
P0-2: done（内部緑CTAは印刷/shell以外なし）
P0-3: hold（Copy-First文言の横断監査は次）
P0-4: hold（file_drop / custom DnD の目視ゲート）
regression_risk: low（confirm は維持 · CTA色の大幅変更なし）
followups: P0-3 文言監査 · P0-4 DnD 詐欺解消
```

### P0-3 / P0-4 ウェーブ（2026-07-30）

```text
[UIUX_P0_REPORT]
scope: P0-3 Copy-First文言 + P0-4 DnD目視
tools: annotate · fair-draw · warikan · group-split · statements + .sg-file-drop全件 + custom file drop
P0-1: done（前ウェーブ）
P0-2: done（前ウェーブ）
P0-3: done（CASE整合 · リード役割の一括統一は未決=Agenda §3 #6）
P0-4: done（見た目だけドロップ可 0 · 行/枠DnDは na）
regression_risk: low（CTA色一括変更なし · 形式タブ表示名のみ）
followups: 役員会でリード文の第一声を決める · group-split SEO残 · Zenn下書きの Copied! は任意掃除
```
