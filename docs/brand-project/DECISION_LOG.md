# SUGUDASU Brand Decision Log

**役割:** ブランドに関する重要な決定事項だけを時系列で残す  
**書かないもの:** 会話の経緯、議事録、実装手順、未確定案

新しい決定を上へ追加する。
判断理由を詳しく残す必要がある場合は
[`ADR_TEMPLATE.md`](ADR_TEMPLATE.md) からADRを作り、本ログからリンクする。

---

## 2026-08-13 — Hub カテゴリは厳密MECEではない · チップラベル是正を可決

**決定事項**  
カテゴリ8箱の id 構造は Keep。一軸MECE再設計・箱の増設・マルチタグは否決/凍結。チップ「イベント」「配属」等の短縮が実体を偽る点を欠陥と認定し、`hub-config` ラベル是正を可決。ツール大量の categoryId 付け替えは Defer。

**理由**  
Hub憲法どおりカテゴリは想起補助でありファイル分類ではない。競議議事: [`../notes/HUB_CATEGORY_BOARD_MINUTES_20260813.md`](../notes/HUB_CATEGORY_BOARD_MINUTES_20260813.md)。

**関連ドキュメント**

- [`../notes/HUB_CATEGORY_BOARD_MINUTES_20260813.md`](../notes/HUB_CATEGORY_BOARD_MINUTES_20260813.md)
- `data/categories.json` · `data/hub-config.json`

---

## 2026-08-13 — Hub に Open. Use. Close. / 開く。使う。閉じる。を併記

**決定事項**  
Hub ヒーローに L0 英語 **Open. Use. Close.** と L1 日本語 **開く。使う。閉じる。** を併記。従来ヒーロー「ブラウザだけで完結。登録不要。」は L2 事実行へ降格（リード本文は維持）。

**理由**  
L0 記号と母語世界観を同面に置き、事実（登録不要）は下段で支える。

**関連ドキュメント**

- [`../brand/CATCHPHRASE_CANDIDATES.md`](../brand/CATCHPHRASE_CANDIDATES.md)
- `tools/hub.html` · `assets/sugudasu.css`（`.sg-hub-tagline-*`）

---

## 2026-08-13 — ブランド記号 L0 を Open. Use. Close. に確定

**決定事項**  
英語ブランド記号（L0）を **Open. Use. Close.** に確定。日本語ヒーロー（L1）・事実コピー（L2）・面への実装は未決。姉妹案・否定並列は候補ドキュメントにストック。

**理由**  
存在様式（開いて使い、閉じる／戻る）と一致。仕様リスト（No Login…）より世界観。英語 Native 観点でも Japlish ではなく、セッション寿命のコンセプトは伝わる（F1/F2 は L2 の役割）。

**関連ドキュメント**

- [`../brand/CATCHPHRASE_CANDIDATES.md`](../brand/CATCHPHRASE_CANDIDATES.md)（§1.5 置き場 · §1.6 Native 監査）

---

## 2026-07-25 — 帳票のチャネル名付き共有UIを撤去（Copy-First）

**決定事項**  
invoice / receipt の Slack・Teams・Chatwork 等の名前付き共有ボタンと送信先URL設定を撤去。主CTAはコピー（送付文面 / 共有用URL）と印刷・PDFに戻す。𝕏シェアも帳票主面から外す。チャット共有 Phase 2 横展開は打ち切り。CASE-2026-007。

**理由**  
SUGUDASU が準備するのは持ち帰る成果（コピー・PDF）まで。配信チャネルのサジェストは Domain・Persona（隣の同僚）・Copy-First と衝突する。F2 技術適合だけでは足りない。

**関連ドキュメント**

- [`../legal/CASE_LAW.md`](../legal/CASE_LAW.md#case-2026-007)

---

## 2026-07-24 — present（ギフト）を Reject · アーカイブする

**決定事項**  
`present` を Legacy から **Reject** へ昇格。Hub/ナビ/カタログ除外。URL は noindex のアーカイブ案内のみ。CASE-2026-006。  
理由を更新履歴に公開する（誠実さ）。

**理由**  
**SUGUDASUのコンセプトに合わない。** AI ギフト提案は Domain・提案しすぎない・AI 前面と衝突。市場検証の試行は終了。

**関連ドキュメント**

- [`../legal/CASE_LAW.md`](../legal/CASE_LAW.md#case-2026-006)
- [`../products/present/README.md`](../products/present/README.md)

---

## 2026-07-24 — PCT-6 任意性（Discretion）を Persona Trait として固定する

**決定事項**  
`docs/legal/PERSONA_CONSTITUTION_TRAITS.md` に PCT-6 を追加。「能力があること」と「振る舞うこと」は別。人格はいつ能力を使わないかで定義される。憲法本文は変更しない。

**理由**  
常時支援義務と読むと、できる機能の常時発動が正当化される。介入しない選択を合憲として明示する必要がある。

**関連ドキュメント**

- [`../legal/PERSONA_CONSTITUTION_TRAITS.md`](../legal/PERSONA_CONSTITUTION_TRAITS.md)
- [`../legal/logs/2026-07-24_pct6_discretion.md`](../legal/logs/2026-07-24_pct6_discretion.md)

---

## 2026-07-24 — 憲法義解・判例法体系（docs/legal）を新設する

**決定事項**  
`docs/legal/` に Commentary · Case Law · Interpretation Guide · logs を置く。憲法改正ではなく立法意思と判例で運用する。Judicial Decision は ADR に書かず Case Law へ。F1〜F7 単独の合憲判定を禁止。

**理由**  
アンケート事件 · F2 字面解釈事件で、条文だけでは立法意思が再現できないことが証明された。

**影響範囲**  
全 Agent 判定 · ADR 境界 · 製品 decisions のリンク先。

**関連ドキュメント**

- [`../legal/README.md`](../legal/README.md)
- [`../legal/logs/2026-07-24_constitution_review.md`](../legal/logs/2026-07-24_constitution_review.md)

**未解決事項**  
製品 decisions への Case ID バックリンクの網羅。

---

## 2026-07-24 — 憲法義解を法体系に追加する

**決定事項**  
（superseded in part）当初 `docs/brand/CONSTITUTIONAL_INTERPRETATION.md` に義解を置いた。同日 `docs/legal/` へ移管し、brand 側はポインタとした。

**関連ドキュメント**

- [`../legal/CONSTITUTION_COMMENTARY.md`](../legal/CONSTITUTION_COMMENTARY.md)

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
