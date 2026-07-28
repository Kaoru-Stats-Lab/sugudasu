# Mention Pricing Strategy

**更新:** 2026-07-28  
**役割:** Product Strategy（Why → Market → Pricing → Packaging → Roadmap）  
**非役割:** 実装仕様 · Constitution · Architecture  
**実装ロードマップ:** [`roadmap.md`](./roadmap.md) · **価格フェーズ:** [`pricing-roadmap.md`](./pricing-roadmap.md)  
**採用:** ADR-0008 — ドキュメントとして採用。コード・課金導線には載せない（ADR-0007 Phase 0 無料継続）

> Pricing は仕様ではない。価格を変えても Constitution / Specification / Architecture は書き換えない。

---

## Positioning

Mention は SaaS ではない。

Dashboard を売る製品ではなく、

「現在開いているページで仕事を終わらせる」

**Action Dispatcher** である。

そのため価格も

- データ保存  
- クラウド容量  
- AI 利用料  

ではなく、**時間短縮**へ課金する。

---

## Pricing Philosophy

基本思想:

- 現場担当者が即決できる価格
- 稟議を書かなくて済む価格
- ROI を数分で回収できる価格
- Local First に見合う信頼
- AI 利用料を徴収しない価格

---

## Regional Pricing

価格はローカライズする。固定為替換算ではなく **Market Based Pricing**。

### Japan

| プラン | 価格帯 |
|--------|--------|
| Free | 無料 |
| Pro Lifetime | 4,980〜6,800円 |
| Pro Monthly | 780〜980円 |

### Global

| プラン | 価格帯 |
|--------|--------|
| Free | Free |
| Pro Lifetime | 49〜79 USD |
| Pro Monthly | 9.99〜14.99 USD |

導入順・確定額は [`pricing-roadmap.md`](./pricing-roadmap.md)（Phase 1 は買い切りのみ）。

---

## Why Regional Pricing

日本と欧米では、インフレ率 · B2B ツール相場 · 経費文化 · 購買心理が異なる。

そのため **JPY を USD 換算した価格**ではなく、**各市場の心理価格**を採用する。

---

## Packaging

### Free

- Action 回数制限
- Webhook 1 個
- Template 数制限

### Pro

- 無制限 Action
- 複数 Webhook
- Template 編集
- Template Export
- Scenario Pack（将来 · Adapter 追加であり Core は変えない）

### Enterprise

**現時点では作らない。**

要望が十分ある場合のみ検討。その場合も Constitution を壊すもの（クラウド監視 · データ蓄積 · AI 返信 · Dashboard）は採用しない。

---

## Business Model

収益源は **ライセンス販売** である。

- データ保存ではない  
- クラウド容量ではない  
- AI 利用料ではない  

ユーザーの時間短縮へ課金する。

---

## Pricing Principles

価格決定は次を優先する（上から）。

1. 導入速度  
2. ROI  
3. 現場担当者の決済権限  
4. Local First  
5. 市場相場  

**ARR 最大化は目的ではない。**

---

## Future

将来価格を変更しても:

- Constitution（`philosophy.md`）
- Specification / Architecture（`specification.md`）
- 実装ロードマップの技術方針（`roadmap.md`）

には影響しない。

Pricing は独立戦略として進化させる。フェーズは [`pricing-roadmap.md`](./pricing-roadmap.md)。
