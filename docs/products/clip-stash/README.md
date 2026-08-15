# SUGUDASU 仮置き

**id:** `clip-stash` · **stage:** beta

## 概要

`docs/products/clip-stash/specification.md` が操作の正本。  
出口（仮置き→外部 DnD）は `SPEC_HANDOFF.md`（CASE-2026-010）。

作業中の素材を一旦卓上に広げ、コピーまたはドラッグで次の場所へ渡す。メモ帳・Excel・チャットへの退避を減らす。

## 思想 · Non-Goals

`philosophy.md` — 知識管理ではない。Edge Drop / PowerToys の移植でもない。タグ · 検索 · ピン留め · 同期は実装しない。形式コピー常時ボタン · 矩形クロップ · OCR は仮置きに入れない（CASE-2026-011）。

## 関連

- 憲法: [`CASE-2026-002`](../../legal/CASE_LAW.md#case-2026-002) · [`CASE-2026-010`](../../legal/CASE_LAW.md#case-2026-010) · [`CASE-2026-011`](../../legal/CASE_LAW.md#case-2026-011)
- 役員会ログ: `docs/legal/logs/2026-08-15_clip-stash_edge_drop.md` · `docs/legal/logs/2026-08-15_powertoys_friction.md` · `docs/legal/logs/2026-08-15_image_compress_submit_pain.md`
- Crop 製品外ラボ: `docs/products/clip-stash/lab/`（本体に入れない）
- 画像一括 / 提出容量 HOW 草案: `docs/notes/IMAGE_BATCH_RESIZE_SUBMIT_HOW_20261115.md`
- 初期意思決定: `docs/decisions/copipe-taihijo.md`
- 加工系との違い: `normalize` · `table-conv` · `ai-cleaner`
