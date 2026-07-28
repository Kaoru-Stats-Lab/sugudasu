# SUGUDASU Browser Layer

**更新:** 2026-07-28  
**役割:** Web / Browser / Sync の3層のうち **Browser** の親正本  
**最初の実装:** [`../mention/`](../mention/README.md)（Mention by SUGUDASU）  
**決定:** [`../mention/decisions/0008-browser-brand-layer.md`](../mention/decisions/0008-browser-brand-layer.md)

> Browser は製品一つではない。  
> **ブラウザで見つけたものを、その場で終わらせる** Family の層である。

---

## First Read

1. [`browser.md`](./browser.md) — 3層と Browser の位置  
2. [`philosophy.md`](./philosophy.md) — Browser Mission  
3. [`constitution.md`](./constitution.md) — Browser Constitution（親）  
4. [`architecture.md`](./architecture.md) — Family · 子プロダクトの置き方  

子（Mention）の Constitution は **置き換えない**:  
[`../mention/philosophy.md`](../mention/philosophy.md)（P1〜P8 Accepted · ADR-0008）

---

## レイヤー分離

| 文書 | 問い |
|------|------|
| browser.md | Web / Browser / Sync のどれか |
| philosophy.md | Browser 層の Mission は何か |
| constitution.md | Family 共通で破ってはいけない境界 |
| architecture.md | 子プロダクトをどう載せるか |

実装・価格・GTM の正本は **各子プロダクト**側。  
Mention の Pricing / GTM / Roadmap（Phase 0〜4）は **ドキュメントとして採用済**（コード・課金導線には載せない · ADR-0007 / ADR-0008）。

| Mention 文書 | パス |
|--------------|------|
| pricing | [`../mention/pricing.md`](../mention/pricing.md) |
| pricing-roadmap（Phase0〜4） | [`../mention/pricing-roadmap.md`](../mention/pricing-roadmap.md) |
| gtm | [`../mention/gtm.md`](../mention/gtm.md) |
| roadmap（実装） | [`../mention/roadmap.md`](../mention/roadmap.md) |

---

## Family（想定）

| 子 | 状態 | 一言 |
|----|------|------|
| Mention | α | 言及を見つけたら終わらせる |
| Capture / Share / Fill 等 | 未着手 | Browser Constitution を親として追加検討 |

Sync（クラウド・同期・アカウント）は **Browser 層の第三の柱ではなく別層**。  
Mention には適用しない（Non-Goal · ADR-0003 / ADR-0008）。
