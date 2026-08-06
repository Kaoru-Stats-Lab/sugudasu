# Smart Diff MVP — Non Goals

| 項目 | 値 |
|------|-----|
| **Status** | Fixed for MVP |
| **Date** | 2026-08-06 |
| **Related** | [`MVP_IMPLEMENTATION_PLAN.md`](MVP_IMPLEMENTATION_PLAN.md) |

> 実装中の誘惑を断つための1ページ。Architecture と矛盾する機能を「ついでに」入れない。

---

## Smart Diff MVP does not aim to

- Word 完全互換
- Track Changes 互換
- Table cell diff
- Semantic AI judgment
- Auto merge
- Document editing（元文書書き換え · Accept/Reject 編集 SaaS）
- Redline 完全再現（Phase2）
- Move / Conflict UI
- サーバ側 compute / OCR API / 登録必須

---

## MVP does aim to

- Local Browser で比較
- Change Navigator driven Review
- Candidate を誤って Deleted+Added にしない
- PDF Report Export（ADR-006）
- Performance Budget（ADR-013）内で動く
