# Interaction Design v0.1（ADR-011）

| 項目 | 値 |
|------|-----|
| **ADR** | [`ADR-011-Smart-Diff-Interaction-Architecture-v0.1.md`](ADR-011-Smart-Diff-Interaction-Architecture-v0.1.md) |

> 実装コードではない。操作フロー契約。

---

## 1. Primary vs Secondary

| Primary | Secondary |
|---------|-----------|
| Change Navigator · 次/前 · 件数 · Jump | 文書キャンバスの自由スクロール探索 |

```text
1. 比較完了 → Review View（一覧が先 = Difference First）
2. 件数を把握
3. 次/前 or クリックで Jump
4. Before|After で旧新確認（Anchor Sync）
5. Candidate はラベル付きで目視
6. Filter で視界だけ絞る（DOM 削除しない）
7. 確認終了 → Print/Export 導線
```

---

## 2. Anchor Sync（semantic）

```text
Delta Node Anchor
  ├ Before Position（projection）
  └ After Position（projection）

onSelect(deltaNodeId):
  selectedId = deltaNodeId
  scroll Before to anchor(before)
  scroll After to anchor(after)
```

禁止:

```text
after.scrollTop = before.scrollTop
after.scrollTop = before.scrollHeight * ratio
```

---

## 3. Filter = visibility

```text
Delta Tree → Projection.visibility
  true  → 一覧・ペイン強調の対象
  false → hidden（DOM 破棄しない · Anchor 維持）
```

例: Modified のみ → Added/Deleted は hidden。選択中が hidden になったら次の可視変更へフォールバック。

---

## 4. Candidate UI（表示のみ）

```text
同一候補として推定
confidence: 72%
[確認する]
```

- ナビに含める（必須確認候補）
- Interaction が ChangeKind を書き換えない

---

## 5. Table / Annotation

| OK | NG |
|----|-----|
| 表1 · 変更があります | 3行2列目が変更 |
| コメント追加（本文と別 entry） | 本文 Modified に見せる |

---

## 6. Keyboard（Phase1 · 中優先だが含める）

| Key | 動作案 |
|-----|--------|
| j / n / ↓ | 次の**可視**変更 |
| k / p / ↑ | 前の**可視**変更 |
| Enter | 選択 / フォーカス |
| Esc | 選択解除 |

---

## 7. Accept / Reject（任意）

```text
emit → Delta Controller → Delta update → Projection rebuild
```

直接 `deltaNode.accept = true` 禁止。
