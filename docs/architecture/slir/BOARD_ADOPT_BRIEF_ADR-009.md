# Smart Diff — Architect Verdict & ADR-009 Board Adopt Brief

| 項目 | 値 |
|------|-----|
| **Date** | 2026-08-06 |
| **Status** | **EXECUTED — Adopted** |
| **結論** | TextNode + styleSegments Adopt · TextRunNode Reject · Accepted ADR-002 更新済み |

---

## Board 投票結果

```text
[x] Adopt ADR-009: TextNode + styleSegments を Accepted ADR-002 に最小マージ
[ ] Reject ADR-009
[ ] Defer

Candidate: confidence のまま（ChangeKind に Candidate を足さない）— [x] 同意

Adopt 時の追随:
[x] ADR-003 Accepted の TextSpan 言及を TextNode に追随
[x] ADR-004 Accepted の TextSpan 言及を segments / changeReason に追随
[x] 旧 SLIR Proposed（TextRun）を Superseded 注記
```

---

## Decision（記録）

採用: TextNode → styleSegments[]  
不採用: TextRunNode  

confidence は Matcher/Delta · SLIR に混ぜない。  
Section = optional。range 単位 = 実装詳細。Track Changes = Phase1 特別扱いなし。

---

## 次工程

**ADR-010 / Renderer Pack（既存 ADR-005）本格接続確認** — SLIR 直接参照禁止 · Delta 入力固定済みのため着手可。
