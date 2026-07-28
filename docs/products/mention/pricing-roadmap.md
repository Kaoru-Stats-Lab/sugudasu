# Pricing Roadmap

**更新:** 2026-07-28  
**正本（思想・価格帯）:** [`pricing.md`](./pricing.md)  
**非役割:** 技術実装の順序（それは [`roadmap.md`](./roadmap.md)）  
**採用:** ADR-0008 — Phase 0〜4 をドキュメントとして採用。実装・課金フックは ADR-0007 どおり Phase 0 では混ぜない

価格の出し方・いつ何を売るかだけを管理する。Constitution / Specification は触らない。

---

## Phase 0

- 無料
- Chrome Web Store 公開（準備含む）
- 市場検証

---

## Phase 1

- **Lifetime（買い切り）のみ**追加
- Japan: **4,980円**
- Global: **49 USD**
- サブスクはまだ導入しない

---

## Phase 2

- Monthly 追加
- Japan: **780円**
- Global: **9.99 USD**
- 法人経費需要へ対応する

---

## Phase 3

- Scenario Packs
- 業種 · 用途別（例: Google Maps · GitHub · News · X）
- Pack は **Platform Adapter の追加**であり、Core の思想は変えない

---

## Phase 4

- Team Features
- Webhook 共有 · Template 共有 · Scenario 共有
- ここでも Dashboard · Analytics · Monitoring は追加しない

---

## Phase 5

- Enterprise — 要望が十分ある場合のみ検討
- Constitution を壊す次は採用しない:
  - クラウド監視
  - データ蓄積
  - AI 返信
  - Dashboard
