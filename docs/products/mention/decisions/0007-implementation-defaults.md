# ADR-0007 Implementation Defaults（α→憲法追随）

**Status:** Accepted（Store スコープのみ HOLD）  
**Date:** 2026-07-28  
**Context:** 5 AI 技術評価の一致後、実装前初期値を固定。再議論不要項目（Side Panel / No LLM / No Dashboard 等）の上に載せる運用値。

## Decision

| 項目 | 決定 |
|------|------|
| 初回許可 host | **google_maps Adapter のドメイン**（Maps パス + `https://business.google.com/*`）。X / 汎用 `*://*/*` は含めない。ADR-0007「Mapsのみ」= Adapter 単位（仕様 §4 GBP/Maps） |
| 未許可ページ | **沈黙がデフォルト**。Side Panel を開いたときだけ「未対応/未許可」+ 許可ボタン。ページ上バッジは出さない |
| Webhook 送信内容 | **ユーザーが見た展開後テキスト** + 最小メタ（`scenarioId` · `sourceUrl` · `timestamp` 程度）。ContextEnvelope 全体 · DOM 生データは送らない |
| Done 保持 | **件数上限 200** + 手動削除。自動 expire は今は不要 |
| ブランド照合 | **部分一致のみ**。曖昧ならヒットさせない（false negative 許容 · false positive 回避） |
| 課金フック | **Phase 0 はコードに一切混ぜない** |
| Firefox / Edge | **対象外**（manifest / API 差分コードを混ぜない） |
| 初回 Store スコープ | **HOLD** — 推奨は **Maps のみ提出**（web は通過後）。仕様 MVP の Maps+web との差は GTM 判断。提督確定まで HOLD |

## Consequences

- manifest の `http://*/*` / `https://*/*` は **憲法違反状態** → 縮小が P0
- content script の常時全サイト注入も P0 でやめる
- 診断: [`../diagnostics/2026-07-28_constitution-gap.md`](../diagnostics/2026-07-28_constitution-gap.md)
