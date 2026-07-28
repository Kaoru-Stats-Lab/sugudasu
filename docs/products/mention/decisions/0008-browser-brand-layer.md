# ADR-0008 Browser Brand Layer

**Status:** Accepted  
**Date:** 2026-07-28

## Context

SUGUDASUのブランド構造として、Web / Browser / Sync の3層構想が提示された。
Browser層のMissionは「ブラウザで見つけたものを、その場で終わらせる」であり、
Mentionはその最初の実装として位置づけられる。

同時に、新構想には既存の `philosophy.md`（Mention Constitution P1〜P8）と
**番号・文言が異なる**独自のConstitution（P1〜P8）が含まれていた。
これをそのまま採用すると、正本が2つ生まれ、実装・審査文言・ADRの整合が崩れる。

## Decision

1. **Browser Constitutionを新設する。Mention Constitutionは置き換えない。**
   - `docs/products/browser/constitution.md` に新規作成
   - `docs/products/mention/philosophy.md` のP1〜P8は**一字一句変更しない**（Accepted継続）
   - 両者の関係は「Browser Constitution ⊃ Mention Constitution」の親子関係とし、
     Mention側の各原則がBrowser側のどれに対応するかを対応表として明記する

2. **Syncを Mention の Non-Goal として明記する。**
   - Browser構想の第三の柱「Sync（クラウド・同期・アカウント）」は、
     Mentionには適用しない。ADR-0003（Local First / Non-Exfiltration）を守るため、
     Mentionの `specification.md` Non-Goals に一行追記する:
     「クラウド同期・アカウント機能（Sync層）はMentionのスコープ外」

3. **Pricing / GTM / Roadmap（Phase0〜4）はドキュメントとして採用する。**
   - コード・課金導線には影響させない（ADR-0007「Phase 0は無料のみ」を継続）
   - 国際展開（日本語圏外）は `productName: "Mention by SUGUDASU"` の命名が
     既に対応済みであり、追加の実装判断は不要

4. **`docs/products/browser/` を新設する。**
   - `README.md` / `philosophy.md` / `constitution.md` / `architecture.md` / `browser.md`
   - `docs/products/mention/` の既存ファイルは移動・リネームしない

## Consequences

- Mentionの実装（`extensions/mention/`）には一切の変更が発生しない
- 将来Browser Family（Capture / Share / Fill 等）が追加される際、
  Browser Constitutionを共通の親として参照できる
- 「Sync」がMentionに紛れ込む提案が出た場合、本ADRとADR-0003を根拠に
  Reject判定できる
- 関連: ADR-0002（No Dashboard）, ADR-0003（Local First）, specification.md §10（Non-Goals）

## 対応表（Browser Constitution ↔ Mention Constitution）

| Browser | 対応する Mention（philosophy.md） |
|---|---|
| P1 Single Purpose | P1 Single Purpose |
| P2 User Opens First | P2 Current Context Only |
| P3 Current Context Only | P2 Current Context Only（重複統合、Browser側で吸収） |
| P4 Non-Send | P3 Local First / Non-Exfiltration |
| P5 Explicit Network | P4 Explicit Network |
| P6 Local First | P3 Local First / Non-Exfiltration |
| P7 Rule Based | P5 Zero Thinking / No LLM · P8 Scenario is Structural |
| P8 Minimal Permission | P7 optional host permissions（新設: 対応する条文がP番号として独立していなかったため、Mention側にも将来的に明記を検討） |

## 文書ポインタ

- Browser 層: [`../../browser/`](../../browser/README.md)
- Mention Constitution（子・変更禁止）: [`../philosophy.md`](../philosophy.md)
