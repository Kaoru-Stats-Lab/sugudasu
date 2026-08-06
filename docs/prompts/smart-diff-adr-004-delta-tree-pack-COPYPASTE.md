# Cursor Task: Smart Diff Delta Tree Schema ADR-004 作成指示

**用途:** Cursor 投入用 COPYPASTE  
**成果物（作成済み Proposed Pack）:**

- [`docs/architecture/delta/ADR-004-Smart-Diff-Delta-Tree-Schema-v0.1.md`](../architecture/delta/ADR-004-Smart-Diff-Delta-Tree-Schema-v0.1.md)
- [`docs/architecture/delta/delta-tree-schema.md`](../architecture/delta/delta-tree-schema.md)
- [`docs/architecture/delta/samples/fictional-contract-walkthrough.md`](../architecture/delta/samples/fictional-contract-walkthrough.md)（通し検証）

**注意:** Accepted [`docs/architecture/adr/ADR-004-delta-tree-model.md`](../architecture/adr/ADR-004-delta-tree-model.md) は上書き禁止。Candidate を `kind` にするか `confidence` にするかは Board。

---

# Cursor Task: Smart Diff Delta Tree Schema ADR-004 作成

## Role

Architecture 担当。実装ではなく、SLIR + Matcher 結果を人間確認用変更モデルへ変換する Delta Tree Schema v0.1 を設計する。

成果物: `ADR-004 …md` · `delta-tree-schema.md`

## Pipeline

```text
Parser → Normalizer → SLIR → Matcher → Delta Tree → Renderer
```

Delta = 何が変わったか。SLIR 代替・UI 状態・PDF 描画禁止。

## 固定

- Added / Deleted / Modified 定義
- Candidate 保持 · Deleted+Added 禁止
- Style = Modified + reason（ChangeKind 増やすな）
- Annotation 本文分離
- TableBlock まで
- Unchanged 保持
- Renderer は Delta のみ

## 完了条件

境界 · Matcher 受信 · Kind 定義 · Candidate · Table · Annotation · Renderer 接続

推奨: 架空契約書で SLIR→Matcher→Delta 通し検証。

次: ADR-005 Renderer（2ペイン · ジャンプ · ノイズ制御）。
