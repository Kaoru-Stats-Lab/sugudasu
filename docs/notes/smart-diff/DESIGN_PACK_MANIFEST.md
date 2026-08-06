# Smart Diff — Design Pack Manifest

**更新:** 2026-08-06  
**Governance:** [`../ENGINEERING_GOVERNANCE.md`](../ENGINEERING_GOVERNANCE.md)（v0.9 Pilot · **議論凍結**）  
**未決:** Manifest の正本性は **J-01** — [`../../prompts/engineering-governance-open-judgments-COPYPASTE.md`](../../prompts/engineering-governance-open-judgments-COPYPASTE.md)

> **ガバナンス増設禁止。** 義解・Interpretation・新 Governance 文書を作らない。  
> 他ドキュメントは本 Manifest を参照する（複写しない）。正本性の確定は J-01 後。

**既存実装:** `tools/diff.html` · `assets/diff-app.js` · [`../DIFF_PRECOMPARE_CLEANSE_SPEC.md`](../DIFF_PRECOMPARE_CLEANSE_SPEC.md)  
**ロードマップ:** `data/roadmap.json` · id `smart-diff`  
**設計監査:** [`../../prompts/smart-diff-architecture-validation-COPYPASTE.md`](../../prompts/smart-diff-architecture-validation-COPYPASTE.md)

---

## Pack（存在確認）

| Pack | パス | 存在 |
|------|------|------|
| Product Constitution | [`PRODUCT_CONSTITUTION.md`](PRODUCT_CONSTITUTION.md) | あり |
| Development Constitution（作業メモ） | [`DEVELOPMENT_CONSTITUTION.md`](DEVELOPMENT_CONSTITUTION.md) | あり |
| Architecture | [`ARCHITECTURE.md`](ARCHITECTURE.md) | あり（入口 · ADR 一覧） |
| Interface | — | **欠落** |
| ADR-001 Origin Metadata Isolation | [`ADR-001-origin-metadata.md`](ADR-001-origin-metadata.md) | あり |
| ADR-002 SLIR Schema v0.1 | [`../../architecture/adr/ADR-002-slir-schema.md`](../../architecture/adr/ADR-002-slir-schema.md) | あり（**Accepted** · TextNode+segments · 009 Adopt） |
| ADR-002 SLIR Proposed Draft（旧 TextRun） | [`../../architecture/slir/ADR-002-Smart-Diff-SLIR-Schema-v0.1.md`](../../architecture/slir/ADR-002-Smart-Diff-SLIR-Schema-v0.1.md) | **Superseded** |
| ADR-009 SLIR Adopt Decision Log | [`../../architecture/slir/ADR-009-SLIR-Schema-Accepted-Candidate-v0.1.md`](../../architecture/slir/ADR-009-SLIR-Schema-Accepted-Candidate-v0.1.md) · [`Brief`](../../architecture/slir/BOARD_ADOPT_BRIEF_ADR-009.md) | **Adopted** |
| ADR-002（旧パス · スタブ） | [`ADR-002-slir-schema.md`](ADR-002-slir-schema.md) | スタブ → Accepted 正本へ |
| ADR-003 Matcher Engine | [`../../architecture/adr/ADR-003-matcher-engine.md`](../../architecture/adr/ADR-003-matcher-engine.md) | あり（**Accepted 正本**） |
| ADR-003 Matcher Proposed Draft | [`../../architecture/ADR-003-Matcher-Engine-v0.1.md`](../../architecture/ADR-003-Matcher-Engine-v0.1.md) → Pack [`../../architecture/matcher/`](../../architecture/matcher/) | あり（**Board 再審用 · 正本ではない**） |
| ADR-003 Matcher Pack | [`../../architecture/matcher/ADR-003-Smart-Diff-Matcher-Engine-v0.1.md`](../../architecture/matcher/ADR-003-Smart-Diff-Matcher-Engine-v0.1.md) · [`matcher-design.md`](../../architecture/matcher/matcher-design.md) | あり（Proposed Pack） |
| ADR-004 Delta Tree | [`../../architecture/adr/ADR-004-delta-tree-model.md`](../../architecture/adr/ADR-004-delta-tree-model.md) | あり（**Accepted 正本**） |
| ADR-004 Delta Proposed Draft | [`../../architecture/ADR-004-Delta-Tree-v0.1.md`](../../architecture/ADR-004-Delta-Tree-v0.1.md) → Pack [`../../architecture/delta/`](../../architecture/delta/) | あり（**Board 再審用 · 正本ではない**） |
| ADR-004 Delta Pack | [`../../architecture/delta/ADR-004-Smart-Diff-Delta-Tree-Schema-v0.1.md`](../../architecture/delta/ADR-004-Smart-Diff-Delta-Tree-Schema-v0.1.md) · [`delta-tree-schema`](../../architecture/delta/delta-tree-schema.md) · [`sample`](../../architecture/delta/samples/fictional-contract-walkthrough.md) | あり（Proposed Pack） |
| ADR-005 Renderer Pack（先行草案） | [`../../architecture/renderer/ADR-005-Smart-Diff-Renderer-Architecture-v0.1.md`](../../architecture/renderer/ADR-005-Smart-Diff-Renderer-Architecture-v0.1.md) | **→ ADR-010** |
| ADR-010 Renderer Pack | [`../../architecture/renderer/ADR-010-Smart-Diff-Renderer-Architecture-v0.1.md`](../../architecture/renderer/ADR-010-Smart-Diff-Renderer-Architecture-v0.1.md) · [`renderer-design`](../../architecture/renderer/renderer-design.md) | あり（**Proposed** · Review First · レビュー反映） |
| ADR-011 Interaction Pack | [`../../architecture/renderer/ADR-011-Smart-Diff-Interaction-Architecture-v0.1.md`](../../architecture/renderer/ADR-011-Smart-Diff-Interaction-Architecture-v0.1.md) · [`interaction-design`](../../architecture/renderer/interaction-design.md) | あり（**Proposed** · Navigator Primary） |
| ADR-006 Export Confirmation | [`../../architecture/ADR-006-Export-Confirmation-2026-08-06.md`](../../architecture/ADR-006-Export-Confirmation-2026-08-06.md) | あり |
| ADR-013 Performance Budget | [`../../architecture/ADR-013-Performance-Budget-v0.1.md`](../../architecture/ADR-013-Performance-Budget-v0.1.md) | あり（**Proposed**） |
| Architecture Freeze | [`ARCHITECTURE_FREEZE.md`](ARCHITECTURE_FREEZE.md) | あり |
| MVP Non Goals | [`MVP_NON_GOALS.md`](MVP_NON_GOALS.md) | あり |
| MVP Implementation Plan | [`MVP_IMPLEMENTATION_PLAN.md`](MVP_IMPLEMENTATION_PLAN.md) | あり（Wave 2 DOCX path） |
| Wave 0 型契約 | [`../../packages/`](../../packages/) | あり |
| Wave 0 CREATE-TASK | `docs/prompts/smart-diff-wave0-core-type-contract-CREATE-TASK.md` | あり |
| Wave 1 Fixture Core | [`../../packages/`](../../packages/) · Projection [`CONTRACT`](../../packages/projection/CONTRACT.md) | あり |
| Wave 1 CREATE-TASK | `docs/prompts/smart-diff-wave1-fixture-core-CREATE-TASK.md` | あり |
| Wave 2 DOCX→Raw→SLIR | `packages/parser` · `packages/normalizer` · `packages/raw` · `fixtures/docx` | あり |
| Wave 2 CREATE-TASK | `docs/prompts/smart-diff-wave2-docx-parser-normalizer-CREATE-TASK.md` | あり |
| Wave 2.5 実務 smoke · Loss | `fixtures/docx/smoke` · [`LOSS_REPORT`](../../packages/raw/LOSS_REPORT.md) | あり |
| Wave 2.5 CREATE-TASK | `docs/prompts/smart-diff-wave2.5-docx-real-smoke-CREATE-TASK.md` | あり |
| Wave 3 PDF→Raw→SLIR | `packages/parser/pdf.mjs` · `packages/normalizer/pdf-to-slir.mjs` · `fixtures/pdf` | あり |
| Wave 3 CREATE-TASK | `docs/prompts/smart-diff-wave3-pdf-parser-normalizer-CREATE-TASK.md` | あり |
| Wave 4 Change Navigator UI | [`../../ui/smart-diff/`](../../ui/smart-diff/) · `assets/smart-diff-navigator.js` | あり |
| Wave 4 CREATE-TASK | `docs/prompts/smart-diff-wave4-ui-change-navigator-CREATE-TASK.md` | あり |
| Wave 5 Export PDF Report | [`../../architecture/export/`](../../architecture/export/) · `packages/export` | あり |
| Wave 5 CREATE-TASK | `docs/prompts/smart-diff-wave5-export-local-report-CREATE-TASK.md` | あり |
| Wave 6 Validation Pack | [`VALIDATION_PACK.md`](VALIDATION_PACK.md) · Interview · Fixture Brief | あり |
| Wave 6 CREATE-TASK | `docs/prompts/smart-diff-wave6-validation-plan-CREATE-TASK.md` | あり |
| Wave 6.1 Golden Fixture | [`validation/Golden_Fixture_Manifest.md`](validation/Golden_Fixture_Manifest.md) · [`Expected_Delta_Ledger`](validation/Expected_Delta_Ledger.md) | あり |
| Wave 6.1 CREATE-TASK | `docs/prompts/smart-diff-wave6.1-golden-fixture-CREATE-TASK.md` | あり |
| Wave 6.2 Execution Design | [`validation/SESSION_PROTOCOL.md`](validation/SESSION_PROTOCOL.md) · Sheet · Assignment · Interview | あり |
| Wave 6.2 CREATE-TASK | `docs/prompts/smart-diff-wave6.2-validation-execution-CREATE-TASK.md` | あり |
| Wave 6.3 Persona Session | [`validation/WAVE6.3_FOCUS.md`](validation/WAVE6.3_FOCUS.md) · Log Template · Results Rollup | あり（記録のみ · 実装禁止） |
| Wave 6.3 CREATE-TASK | `docs/prompts/smart-diff-wave6.3-persona-session-CREATE-TASK.md` | あり |
| ADR-006 Export | [`../../architecture/ADR-006-Export-Architecture-v0.1.md`](../../architecture/ADR-006-Export-Architecture-v0.1.md) | あり（**Proposed** · [Confirmation](../../architecture/ADR-006-Export-Confirmation-2026-08-06.md)） |
| ADR-007 Parser Pack | [`../../architecture/parser/ADR-007-Smart-Diff-Parser-Architecture-v0.1.md`](../../architecture/parser/ADR-007-Smart-Diff-Parser-Architecture-v0.1.md) · [`parser-design`](../../architecture/parser/parser-design.md) | あり（**Proposed** · Parser≠SLIR） |
| ADR-008 Normalizer | [`../../architecture/normalizer/ADR-008-Smart-Diff-Normalizer-Architecture-v0.1.md`](../../architecture/normalizer/ADR-008-Smart-Diff-Normalizer-Architecture-v0.1.md) · [`normalizer-design`](../../architecture/normalizer/normalizer-design.md) | あり（**Proposed** · Option C TextNode+segments） |
| ADR-009 SLIR Accepted化 | — | **未**（008 後） |
| ADR-010 Renderer（再採番案） | Renderer Pack は ADR-005 既存 | 採番整理待ち |
| UI Constitution | [`UI_CONSTITUTION.md`](UI_CONSTITUTION.md) | あり |
| Performance Budget | — | 欠落 |
| Security Constitution | — | 欠落 |

Version の書き方は J-01 後に従う（未決中は各文書ヘッダを正とする）。

### 関連（存在確認）

| 資産 | パス | 存在 |
|------|------|------|
| Engineering Governance Pilot | [`../ENGINEERING_GOVERNANCE.md`](../ENGINEERING_GOVERNANCE.md) | あり |
| 未決判断プロンプト | `docs/prompts/engineering-governance-open-judgments-COPYPASTE.md` | あり |
| Architecture Validation COPYPASTE | `docs/prompts/smart-diff-architecture-validation-COPYPASTE.md` | あり |
| ADR-002 SLIR Cursor 投入プロンプト（矛盾潰し版 · 設計生成） | `docs/prompts/smart-diff-adr-002-slir-schema-CURSOR-PROMPT.md` | あり |
| ADR-002 SLIR 作成 Task（Proposed Draft 生成用） | `docs/prompts/smart-diff-adr-002-slir-schema-CREATE-TASK.md` | あり |
| ADR-002 SLIR Pack 作成指示（COPYPASTE · TextRun 再審） | `docs/prompts/smart-diff-adr-002-slir-schema-pack-COPYPASTE.md` | あり |
| ADR-002 作成指示（COPYPASTE · 正本上書き禁止） | `docs/prompts/smart-diff-adr-002-slir-schema-COPYPASTE.md` | あり |
| ADR-003 作成指示（COPYPASTE · 正本上書き禁止） | `docs/prompts/smart-diff-adr-003-matcher-engine-COPYPASTE.md` | あり |
| ADR-003 Matcher Pack 作成指示（COPYPASTE） | `docs/prompts/smart-diff-adr-003-matcher-engine-pack-COPYPASTE.md` | あり |
| ADR-003 Matcher 作成 Task（Proposed Draft） | `docs/prompts/smart-diff-adr-003-matcher-engine-CREATE-TASK.md` | あり |
| ADR-004 作成指示（COPYPASTE · 正本上書き禁止） | `docs/prompts/smart-diff-adr-004-delta-tree-COPYPASTE.md` | あり |
| ADR-004 Delta Pack 作成指示（COPYPASTE） | `docs/prompts/smart-diff-adr-004-delta-tree-pack-COPYPASTE.md` | あり |
| ADR-004 Delta 作成 Task（Proposed Draft） | `docs/prompts/smart-diff-adr-004-delta-tree-CREATE-TASK.md` | あり |
| ADR-005 Renderer Pack 作成指示（COPYPASTE） | `docs/prompts/smart-diff-adr-005-renderer-architecture-pack-COPYPASTE.md` | あり |
| ADR-007 Parser Pack 作成指示（COPYPASTE · プロンプトは006呼称） | `docs/prompts/smart-diff-adr-007-parser-architecture-pack-COPYPASTE.md` | あり |
| ADR-007 Parser 作成 Task（Raw≠SLIR · 情報逆算） | `docs/prompts/smart-diff-adr-007-parser-architecture-CREATE-TASK.md` | あり |
| ADR-011 Interaction 作成 Task | `docs/prompts/smart-diff-adr-011-interaction-architecture-CREATE-TASK.md` | あり |
| ADR-010 Renderer 作成 Task | `docs/prompts/smart-diff-adr-010-renderer-architecture-CREATE-TASK.md` | あり |
| ADR-009 SLIR Accepted化 作成 Task | `docs/prompts/smart-diff-adr-009-slir-schema-CREATE-TASK.md` | あり |
| ADR-008 Normalizer 作成 Task | `docs/prompts/smart-diff-adr-008-normalizer-architecture-CREATE-TASK.md` | あり |
| ADR-005 Parser 作成指示（COPYPASTE · 採番衝突あり） | `docs/prompts/smart-diff-adr-005-parser-architecture-COPYPASTE.md` | あり |
| ADR-006 Normalizer 作成指示（COPYPASTE · 採番衝突あり） | `docs/prompts/smart-diff-adr-006-normalizer-architecture-COPYPASTE.md` | あり |
| ADR-003 呼称の Normalizer 設計指示（COPYPASTE · **003=Matcher と衝突**） | `docs/prompts/smart-diff-adr-003-normalizer-design-COPYPASTE.md` | あり |
| ADR-004 呼称の Matcher 設計指示（COPYPASTE · **004=Delta と衝突**） | `docs/prompts/smart-diff-adr-004-matcher-engine-design-COPYPASTE.md` | あり |
| ADR-007 Renderer 作成指示（COPYPASTE · 採番衝突あり） | `docs/prompts/smart-diff-adr-007-renderer-architecture-COPYPASTE.md` | あり |
| Checklist（人間管理 · AI 非生成） | — | 欠落 |
| Engineering / Smart Diff 判例ログ | （J-02 待ち） | 未定 |

---

## 入口（リンクのみ · 複写禁止）

| 用途 | 参照 |
|------|------|
| EG Pilot（凍結） | [`../ENGINEERING_GOVERNANCE.md`](../ENGINEERING_GOVERNANCE.md) |
| 未決 J-01〜J-05 | [`../../prompts/engineering-governance-open-judgments-COPYPASTE.md`](../../prompts/engineering-governance-open-judgments-COPYPASTE.md) |
| 製品プロセスメモ | [`DEVELOPMENT_CONSTITUTION.md`](DEVELOPMENT_CONSTITUTION.md) |
| Product Constitution | [`PRODUCT_CONSTITUTION.md`](PRODUCT_CONSTITUTION.md) |
| UI Constitution | [`UI_CONSTITUTION.md`](UI_CONSTITUTION.md) |
| Architecture（ADR 一覧） | [`ARCHITECTURE.md`](ARCHITECTURE.md) |
| ADR-001 Origin Metadata Isolation | [`ADR-001-origin-metadata.md`](ADR-001-origin-metadata.md) |
| ADR-002 SLIR Schema v0.1 | [`../../architecture/adr/ADR-002-slir-schema.md`](../../architecture/adr/ADR-002-slir-schema.md) |
| ADR-003 Matcher Engine | [`../../architecture/adr/ADR-003-matcher-engine.md`](../../architecture/adr/ADR-003-matcher-engine.md) |
| ADR-004 Delta Tree Model | [`../../architecture/adr/ADR-004-delta-tree-model.md`](../../architecture/adr/ADR-004-delta-tree-model.md) |
| 比較前クレンジング | [`../DIFF_PRECOMPARE_CLEANSE_SPEC.md`](../DIFF_PRECOMPARE_CLEANSE_SPEC.md) |
| Validation RUNBOOK | [`../../prompts/architecture-validation-RUNBOOK.md`](../../prompts/architecture-validation-RUNBOOK.md) |
| Product Constitution | [`../../product/PRODUCT_CONSTITUTION.md`](../../product/PRODUCT_CONSTITUTION.md) |
| Sync 境界 | [`../SUGUDASU_SYNC_LINE.md`](../SUGUDASU_SYNC_LINE.md) |
| ADR テンプレ（Intent） | [`../../brand-project/ADR_TEMPLATE.md`](../../brand-project/ADR_TEMPLATE.md) |
| ブランド判例 | [`../../legal/CASE_LAW.md`](../../legal/CASE_LAW.md) |

---

## 凍結後の次順（実装優先）

1. **J-01〜J-05** を Board で閉じる（矛盾だけ · 制度増設なし）
2. **Smart Diff Constitution**（Identity = J-04 · Version 番号は対象外）
3. **Architecture Pack v0.9**（Architecture / Interface / ADR · Intent）
4. Architecture Validation を 1 回通す → Critical 修正
5. Cursor 実装
6. 実装中の問題だけ判例化（J-02）
7. **J-05 卒業条件** 達成後に初めて Governance v1.0

**現在地:** Product Constitution · Architecture 入口 · ADR-001/002 あり · Interface **欠落** · Pilot 卒業条件未決（J-05）· 実装は Architecture Approved まで禁止（EG-ADR-001）
