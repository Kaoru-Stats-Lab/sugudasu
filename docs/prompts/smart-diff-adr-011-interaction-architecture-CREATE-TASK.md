# Cursor Task: ADR-011 Interaction Architecture CREATE TASK

**用途:** Cursor 投入用 COPYPASTE  
**成果物:**
- `docs/architecture/renderer/ADR-011-Smart-Diff-Interaction-Architecture-v0.1.md`
- `docs/architecture/renderer/interaction-design.md`

**前提:** ADR-010 Renderer（描画境界）固定済み · 入力 = Delta · Projection 必須 · Review Primary · Redline Phase2  
**目的:** 「3分で確認できる」UX の操作・同期・フィルタ仕様を固定する（描画ライブラリ選定ではない）

**採番注意:** Export は既存 **ADR-006**。プロンプトの「ADR-012 Export」は 006 と衝突しうる。

---

# 以下を Cursor に投入

```markdown
# Smart Diff ADR-011 Interaction Architecture CREATE TASK

## Role

HCI / Interaction Architect。Renderer（ADR-010）の上に乗る操作モデルを Proposed ADR として定義する。
実装コード・ビジュアルデザインカンプは禁止。

---

# 絶対条件

- 「何が変更か」は触らない（Delta 正本）
- Projection / ViewState のみ操作する（Delta 直接 mutate 禁止 · Accept/Reject は Controller）
- Phase1 = Review View · Redline 操作は Phase2
- SLIR / Parser を Interaction が見ない

---

# 必須決定（Phase1）

1. Change Navigator（一覧 · 次/前 · 件数 · ジャンプ）
2. 選択同期（一覧 ↔ Before/After ペイン）
3. Before/After 同期スクロール（Delta Anchor Sync · scrollTop 単純同期禁止）
4. 折り畳み（Unchanged 文脈 · セクション）
5. Filter（内容 / 追加削除 / 書式 / コメント · 初期値）
6. Candidate 表示インタラクション（確認必須の見せ方 · スキップ可否）
7. Table Atomic 表示（表変更として1エントリ · Cell UI 禁止）
8. Annotation 表示（本文と分離 · コメント変更のナビ）
9. Keyboard map（最低限）
10. Accept/Reject UI がある場合のイベント境界（ADR-010 D8）

---

# Non Goals

- Redline 編集操作（Phase2）
- Move / Conflict / Cell Diff UI
- Canvas vs DOM 最終選定（010 OQ）
- Export UI 詳細（ADR-006）

---

# 出力

ADR-011 + interaction-design.md
Manifest / ARCHITECTURE 更新

---

# 完了条件

操作フローが「3分確認」を支える形で読める。
描画責務（010）と操作責務（011）が分離されている。
```
