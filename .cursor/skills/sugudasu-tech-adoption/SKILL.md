---
name: sugudasu-tech-adoption
description: >-
  SUGUDASU の技術共通化・重複能力棚卸し・Tech Adoption ループを回す。
  Use when the user mentions 共通化, 共通基盤, Tech Adoption, 棚卸し, Dup,
  shared 抽出, sg-pdf, canvas-mask, 技術スタック採用, または capability inventory.
---

# SUGUDASU Tech Adoption ループ

**目的の順:** (1) 体験共通化 → (2) ゼロスクラッチ禁止 / Token 節約。技術寄せは手段。

## 発火したらやること（この順）

1. Read `docs/notes/TECH_ADOPTION_NOTE.md` §0（トリガー · ゲート）
2. Read `docs/notes/CAPABILITY_INVENTORY.md`（該当クラスタ）
3. ユーザー意図を分類:
   - **回帰防止 / ゲート確認** → `npm run validate:tech-adoption`
   - **棚卸し更新** → Inventory に行を追加/状態変更
   - **抽出実装** → G1–G5 + contracts.json に forbidden 追加 + テスト
   - **座標統一したい** → **拒否**（Adoption Note §3）
4. 変更後: `validate:tech-adoption` + 影響ツールの `test:*`

## 機械の正本

| 種類 | パス |
|------|------|
| 禁止パターン契約 | `data/tech-shared-contracts.json` |
| 検証 | `scripts/verify-tech-adoption.mjs` |
| npm | `validate:tech-adoption`（`build:pages` 内） |

## 抽出後の必須

- Inventory の状態を Shared / Done に
- `tech-shared-contracts.json` に **再発明を防ぐ regex** を足す（仕組みが腐らない条件）
- `test:sg-pdf-shared` 等、影響テスト

**禁止:** Platform SDK 先作り · 座標モデル統合 · contracts を増やさず shared だけ増やす
