# Product Page テンプレート（Phase 2 · 設計のみ）

**更新:** 2026-07-18  
**状態:** 設計。**HTML への一斉適用はしない**（ADR-0003 · Hub IA Phase 1 と独立）  
**関連データ:** `data/relations.json`

## 構造（上から）

1. Hero（`sg-tool-intro` · プライバシーバッジ · リード）
2. こんな時に使います
3. 特徴
4. 使い方（3ステップ等）
5. **ツール本体**（操作 UI）
6. FAQ
7. 関連ツール（`relations.json` の `relations[toolId]`）
8. 広告（任意 · 結果直下 / ページ下部のみ。操作途中へ挿入しない）

## 原則

- Hub のカード見た目・カテゴリチップを Product に持ち込まない
- 関連ツールラベルは registry の `conceptName` / `productName` から取得（ハードコード禁止）
- 既存 URL `/{tool}` · canonical · FAQ JSON-LD を壊さない

## 適用順（将来）

1. Tier S 手本（例: normalize）で1本適用
2. 検証スクリプト追加
3. クラスタ単位で横展開
