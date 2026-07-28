# Mention Decisions（ADR Index）

**更新:** 2026-07-28  
**役割:** 「なぜそう決めたか」の親索引  
**憲法判断:** Case Law / philosophy（ここには HOW の設計選択を書く。合憲判決の本体は legal）

新機能・方針変更の前に、関連 ADR を確認する。半年後の「やっぱり Dashboard」議論は ADR で止める。

| ID | 決定 | 状態 | ファイル |
|----|------|------|----------|
| 0001 | Side Panel を本命 Surface にする | Accepted | [`decisions/0001-side-panel.md`](./decisions/0001-side-panel.md) |
| 0002 | Dashboard / Analytics / Monitoring を作らない | Accepted · Reject 固定 | [`decisions/0002-no-dashboard.md`](./decisions/0002-no-dashboard.md) |
| 0003 | Local First · クラウド非蓄積 | Accepted | [`decisions/0003-local-first.md`](./decisions/0003-local-first.md) |
| 0004 | optional host permissions · `<all_urls>` 固定禁止 | Accepted | [`decisions/0004-optional-host-permission.md`](./decisions/0004-optional-host-permission.md) |
| 0005 | LLM 文案生成をしない | Accepted · Reject 固定 | [`decisions/0005-no-llm.md`](./decisions/0005-no-llm.md) |
| 0006 | URL/本文貼り付け製品を作らない | Accepted · Reject 固定 | [`decisions/0006-no-paste-product.md`](./decisions/0006-no-paste-product.md) |
| 0007 | 実装初期値（host · 沈黙 · Webhook · Done上限 · 照合 · 課金なし · Storeスコープ HOLD） | Accepted（Store のみ HOLD） | [`decisions/0007-implementation-defaults.md`](./decisions/0007-implementation-defaults.md) |
| 0008 | Browser Brand Layer（親憲法新設 · Mention Constitution 非置換 · Sync は Mention Non-Goal） | Accepted | [`decisions/0008-browser-brand-layer.md`](./decisions/0008-browser-brand-layer.md) |

親層ドキュメント: [`../browser/`](../browser/README.md)

## 新規 ADR の書き方

`decisions/NNNN-slug.md` を追加し、本表に1行足す。

```text
# ADR-NNNN Title
Status: Accepted | Rejected | Superseded
Context / Decision / Consequences
```

価格変更は ADR 不要（[`pricing.md`](./pricing.md)）。Mission を壊す案は philosophy + competition を先に読む。
