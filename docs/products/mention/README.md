# Mention by SUGUDASU

**id:** `mention` · **URL:** `/mention` · **stage:** alpha（Hub 未掲載）

## Mission

> **Find outside. Finish inside.**  
> **見つけたら、終わらせる。**

Google口コミツールではない。**Current Context Action Engine** である。

---

## Design Order（逆転してはならない）

```text
1. philosophy     Why / Constitution
2. competition    Why this feature? / White Space
3. specification  How (Architecture)
4. scenarios/     Scenario 詳細（仕様の子）
5. decisions/     なぜそう決めたか（ADR）
6. roadmap        When (Engineering)
7. pricing        How to sell (価格)
8. gtm            How to grow (届け方)
9. chrome-store   How to publish
```

**思想 → 市場 → 仕様 → 実装 → 販売** の順に考える。  
実装や価格を先に置いて Constitution を後付けしない。

### Agent / 機能追加ゲート

新機能・方針変更の前に必ず:

1. [`philosophy.md`](./philosophy.md) — Mission · Constitution  
2. [`competition.md`](./competition.md) — White Space · 監視の重力ではないか  
3. 関連 [`decisions.md`](./decisions.md) — 既存 ADR と矛盾しないか  
4. それから [`specification.md`](./specification.md) / [`scenarios/`](./scenarios/)

「なんとなく便利そう」「競合にあるから」は却下理由になる。

---

## First Read

1. [`philosophy.md`](./philosophy.md)  
2. [`competition.md`](./competition.md)  
3. [`specification.md`](./specification.md)  
4. [`roadmap.md`](./roadmap.md)  

## Then

5. [`pricing.md`](./pricing.md) · [`pricing-roadmap.md`](./pricing-roadmap.md)  
6. [`gtm.md`](./gtm.md)  
7. [`decisions.md`](./decisions.md) · [`scenarios/`](./scenarios/)  

## Future / Publish

8. [`chrome-store.md`](./chrome-store.md)  

### 親層（Browser）

Mention は SUGUDASU **Browser** 層の最初の実装（ADR-0008）。  
親憲法: [`../browser/constitution.md`](../browser/constitution.md) · 層マップ: [`../browser/browser.md`](../browser/browser.md)  
**本ディレクトリの `philosophy.md` P1〜P8 は置き換えない。**

### 他AIレビュー用プロンプト

技術スタック · CWS 審査 · Reject タブー評価:  
[`../../prompts/mention-tech-cws-review-prompt.md`](../../prompts/mention-tech-cws-review-prompt.md)

---

## レイヤー分離

| レイヤー | 文書 | 問い |
|----------|------|------|
| Why | philosophy | Mission は何か |
| Why this feature? | competition | 監視か Done か |
| Why that choice? | decisions | なぜ Side Panel / No Dashboard か |
| What | specification · scenarios | Adapter / Scenario / Action |
| When | roadmap | 何を先に実装するか |
| Sell / Grow | pricing · gtm | いくら · どう届けるか |
| Publish | chrome-store | ストアにどう出すか |

価格を変えても Constitution / Specification は書き換えない。

---

## 実装・LP

| パス | 内容 |
|------|------|
| [`../../extensions/mention/`](../../extensions/mention/README.md) | Chrome Extension |
| [`../../tools/mention.html`](../../tools/mention.html) | `/mention` LP |

## 憲法・台帳

条件付き GO · [`../../legal/logs/2026-07-27_mention_constitution_review.md`](../../legal/logs/2026-07-27_mention_constitution_review.md) · 台帳 §20 · BACKLOG §1-17
