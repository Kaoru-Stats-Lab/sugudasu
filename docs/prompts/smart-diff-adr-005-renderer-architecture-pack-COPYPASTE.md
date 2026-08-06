# Cursor Task: Smart Diff Renderer Architecture ADR-005 作成指示

**用途:** Cursor 投入用 COPYPASTE  
**成果物（作成済み Proposed Pack）:**

- [`docs/architecture/renderer/ADR-005-Smart-Diff-Renderer-Architecture-v0.1.md`](../architecture/renderer/ADR-005-Smart-Diff-Renderer-Architecture-v0.1.md)
- [`docs/architecture/renderer/renderer-architecture.md`](../architecture/renderer/renderer-architecture.md)

**絶対条件:** Delta Tree のみ · SLIR 直接禁止 · 表示都合の Engine 逆流禁止。

**採番注意:** 次工程プロンプトの「ADR-006 Parser」は既存 **ADR-006 Export** Proposed と衝突。

---

# Cursor Task: Smart Diff Renderer Architecture ADR-005 作成

## Role

UI Architecture 担当。Delta Tree → 人間確認可能な差分表示の設計正本。実装ではない。

成果物: `ADR-005 …md` · `renderer-architecture.md`

## 必須結論

1. MVP 表示方式（2+Navigator vs 3 等分を比較し採用理由）
2. Delta → UI Mapping
3. Change Navigation
4. Highlight 粒度
5. Noise Filter 範囲
6. PDF Overlay
7. 非対象範囲

## 完了条件

Delta のみ · 再 Diff なし · 確認短縮 · Word 非クローン · SUGUDASU 制約 · Phase2 余地

次（プロンプト案）: Parser Architecture（DOCX/PDF/HTML/MD · Normalizer 境界）。採番は Board。
