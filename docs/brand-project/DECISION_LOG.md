# SUGUDASU Brand Decision Log

**役割:** ブランドに関する重要な決定事項だけを時系列で残す  
**書かないもの:** 会話の経緯、議事録、実装手順、未確定案

新しい決定を上へ追加する。
判断理由を詳しく残す必要がある場合は
[`ADR_TEMPLATE.md`](ADR_TEMPLATE.md) からADRを作り、本ログからリンクする。

---

## 2026-07-21 — ブランド設計をプロジェクト管理する

**決定事項**  
ブランド設計の現在地を `docs/brand-project/` で管理し、チェックリスト・決定・未解決事項・ADR雛形を分離する。

**理由**  
数週間〜数ヶ月にわたる議論をチャットログへ埋もれさせず、誰でも現在地と次の課題を確認できるようにするため。

**影響範囲**  
ブランドに関する今後の議論、Agent運用、進捗管理。

**関連ドキュメント**

- [`BRAND_PROJECT_CHECKLIST.md`](BRAND_PROJECT_CHECKLIST.md)
- [`OPEN_QUESTIONS.md`](OPEN_QUESTIONS.md)
- [`ADR_TEMPLATE.md`](ADR_TEMPLATE.md)

**未解決事項**  
Phase 1以降の着手順と成果物ファイルの配置。

---

## 2026-07-21 — ブランド知識を5つのSSOTへ分離する

**決定事項**  
ブランド知識を `BRAND_CONSTITUTION`、`ANTI_PRINCIPLES`、`PRODUCT_CONSTITUTION`、`BRAND_RATIONALE`、`BRAND_AUDIT_PROMPT` の5つへ分離する。

**理由**  
思想、Reject基準、採用基準、判断理由、監査手順を混ぜず、各文書を単一責任にするため。

**影響範囲**  
ブランド文書、プロダクト評価台帳、AIプロンプト、Cursor Rule。

**関連ドキュメント**

- [`../brand/BRAND_CONSTITUTION.md`](../brand/BRAND_CONSTITUTION.md)
- [`../brand/ANTI_PRINCIPLES.md`](../brand/ANTI_PRINCIPLES.md)
- [`../product/PRODUCT_CONSTITUTION.md`](../product/PRODUCT_CONSTITUTION.md)
- [`../brand/BRAND_RATIONALE.md`](../brand/BRAND_RATIONALE.md)
- [`../prompts/BRAND_AUDIT_PROMPT.md`](../prompts/BRAND_AUDIT_PROMPT.md)

**未解決事項**  
なし。

---

## 2026-07-21 — Meta Principleを最上位原則とする

**決定事項**  
「ユーザーを賢く見せる。SUGUDASU自身は賢く見せない。」を、WHY・Persona・F1〜F7・Anti Principlesを解釈する最上位原則とする。

**理由**  
技術、UI、AI、ブランド演出が前へ出て、ユーザーの成果を奪うことを防ぐため。

**影響範囲**  
新機能、UI、コピー、LP、アイコン、ロゴ、演出、ヘルプ、チュートリアル、ブランド監査。

**関連ドキュメント**

- [`../brand/ANTI_PRINCIPLES.md`](../brand/ANTI_PRINCIPLES.md)
- [`../prompts/BRAND_AUDIT_PROMPT.md`](../prompts/BRAND_AUDIT_PROMPT.md)

**未解決事項**  
既存36ツールがこの原則へ適合しているかの監査。

---

## 2026-07-21 — F1〜F7をプロダクト採用基準の正本とする

**決定事項**  
F1〜F7、判定順、Sync分岐、実装制約を `PRODUCT_CONSTITUTION.md` の責務とする。個別アイデアの市場性と判例は既存Ledgerへ残す。

**理由**  
ブランド思想と採用基準を分け、F1〜F7の重複正本をなくすため。

**影響範囲**  
新規プロダクト提案、既存Ledger、Backlog、Sync判定、関連プロンプト。

**関連ドキュメント**

- [`../product/PRODUCT_CONSTITUTION.md`](../product/PRODUCT_CONSTITUTION.md)
- [`../notes/PRODUCT_IDEA_JUDGMENT_LEDGER.md`](../notes/PRODUCT_IDEA_JUDGMENT_LEDGER.md)
- [`../notes/SUGUDASU_SYNC_LINE.md`](../notes/SUGUDASU_SYNC_LINE.md)

**未解決事項**  
なし。

---

## 2026-07-21 — PresentをLegacyとして扱う

**決定事項**  
`present` は保守のみとし、新機能追加と同系統ツールの新規採用を行わない。

**理由**  
ブランド憲法制定以前の市場・アフィリエイト検証プロダクトで、現行憲法と設計思想が一部異なるため。

**影響範囲**  
`present` のBacklog、Portfolio、同系統の新規提案。

**関連ドキュメント**

- [`../product/PRODUCT_CONSTITUTION.md`](../product/PRODUCT_CONSTITUTION.md)
- [`../brand/BRAND_RATIONALE.md`](../brand/BRAND_RATIONALE.md)

**未解決事項**  
Hub掲載と最低限の保守範囲をPortfolio Phaseで明文化する。
