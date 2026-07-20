# Hub UX 文書の置き方（4層）

SUGUDASU は 50〜100 以上のツールを抱える可能性がある。その規模では実装コードより **設計判断の蓄積**が資産になる。

各改善は次の **4点セット**で残す。

| # | 層 | 役割 | 置き場 |
|---|-----|------|--------|
| 1 | **Decision Log** | 何を採用・保留・却下したか · Rejected Ideas · 再検討条件 | `docs/decision-log/` |
| 2 | **Design Guideline** | 普遍的な設計原則 · Phase スコープ | `docs/design/` |
| 3 | **Cursor Prompt** | 実装者（AI）向けの作業指示 | `docs/cursor/*-improvement.md` |
| 4 | **Guardrail** | 絶対に壊してはいけない制約 | `docs/cursor/guardrail.md` |

加えて長期の Architecture Decision Record は `docs/adr/`。

## Top Page UX（2026-07 · 凍結）

| 層 | ファイル |
|----|----------|
| Decision | [`decision-log/2026-07-top-page-ux-review.md`](decision-log/2026-07-top-page-ux-review.md) · [`decision-log/2026-07-hub-layout-alignment.md`](decision-log/2026-07-hub-layout-alignment.md) |
| Design | [`design/search-ux.md`](design/search-ux.md) · [`design/card-guideline.md`](design/card-guideline.md) · [`design/badge-guideline.md`](design/badge-guideline.md) · [`design/search-guideline.md`](design/search-guideline.md) · [`design/hub-layout.md`](design/hub-layout.md) |
| Cursor Prompt | [`cursor/phase1-search-improvement.md`](cursor/phase1-search-improvement.md) |
| Guardrail | [`cursor/guardrail.md`](cursor/guardrail.md) |
| ADR | [`adr/ADR-001-top-page-ia.md`](adr/ADR-001-top-page-ia.md) … [`adr/ADR-005-hub-layout-alignment.md`](adr/ADR-005-hub-layout-alignment.md) |

**運用ルール:** 好みで Rejected を復活させない。再検討条件を満たしたら、先に Decision Log を更新してから実装する。
