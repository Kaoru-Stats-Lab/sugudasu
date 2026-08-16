# SUGUDASU Brand Decision Log

**役割:** ブランドに関する重要な決定事項だけを時系列で残す  
**書かないもの:** 会話の経緯、議事録、実装手順、未確定案

新しい決定を上へ追加する。
判断理由を詳しく残す必要がある場合は
[`ADR_TEMPLATE.md`](ADR_TEMPLATE.md) からADRを作り、本ログからリンクする。

---

## 2026-08-16 — 提出条件適合の置き場は既存出口に足さない（薄い1画面は Park）

**決定事項**  
手元画像を提出先の容量・長辺に載せる JTBD は棄却しない。Squoosh クローン · コーデックラボ · GIF/SVG/PDF を束ねる圧縮サイトは Reject。`webp-to-jpg` / `image-trim` / `annotate` への容量・長辺追加、next-path のみ、共通エンジン先行も Reject。やるなら提出条件専用の薄い1画面のみだが、**今は ID を切らない · コードを書かない · 2026-11-15 HOW レビューまで Park**。Hub Value · ブックマーク · 「Squoosh にない」は採用理由にしない。憲法本文は改正しない。

**理由**  
既存2ツールの主座（形式変換 · 切り出し）と提出条件適合は一般から見て別仕事。載せ先が無いこと自体は CASE-009 の立法事実にならない。独立 JTBD の実在と既存代替の不足は未証明。Park 理由は実装困難ではない。

**関連ドキュメント**
- [`../notes/IMAGE_SUBMIT_FIT_DECISION_RECORD.md`](../notes/IMAGE_SUBMIT_FIT_DECISION_RECORD.md)
- [`../notes/IMAGE_BATCH_RESIZE_SUBMIT_HOW_20261115.md`](../notes/IMAGE_BATCH_RESIZE_SUBMIT_HOW_20261115.md) §3
- [`OPEN_QUESTIONS.md`](OPEN_QUESTIONS.md) Q-09

---

## 2026-08-15 — TXT-Crypter 型テキスト暗号URLはコア Reject（CASE-2026-012）

**決定事項**  
サーバー非保存のテキスト暗号URLツールをコア（Hub / registry）に新設しない。Vault UI · 仮置き暗号退避 · Wiki/Notion 埋め込み主座 · チャット用 Secret Link のコア掲載は Reject。クライアント暗号＋URL埋め込みは技法として Sync/Secret で必要なときのみ再利用可であり、製品 GO の根拠にしない。憲法本文は改正しない。

**理由**  
F1〜F4 の相似は Persona・市場・C-10 を飛ばせない。同型が既に無料で存在する（CASE-009）。仮置きへの加工は CASE-010/011 と衝突。ユーザの標準は持ち帰りであり、秘密保管を代替しない。

**関連ドキュメント**
- [`../legal/CASE_LAW.md`](../legal/CASE_LAW.md#case-2026-012)
- [`../legal/logs/2026-08-15_txt_crypter_url_crypto.md`](../legal/logs/2026-08-15_txt_crypter_url_crypto.md)
- [`../notes/PRODUCT_IDEA_JUDGMENT_LEDGER.md`](../notes/PRODUCT_IDEA_JUDGMENT_LEDGER.md) §24

---

## 2026-08-15 — 提出リサイズの実装ゲートは 11/15 HOW → Hub/GSC

**決定事項**  
画像一括リサイズ · 提出容量の製品コード解禁順は **① 2026-11-15 HOW レビュー → ② その後 Hub/GSC**。Hub/GSC が先に目立っても 11/15 前に実装しない。公開 roadmap は今載せない。

**理由**  
HOW 未確定のまま需要信号だけで HTML を足すと CASE-009 型の Hub Value GO に戻る。観測はレビュー後の優先度・`considering` 再審に使う。

**関連ドキュメント**
- [`../notes/IMAGE_BATCH_RESIZE_SUBMIT_HOW_20261115.md`](../notes/IMAGE_BATCH_RESIZE_SUBMIT_HOW_20261115.md) §6
- [`../legal/logs/2026-08-15_powertoys_friction.md`](../legal/logs/2026-08-15_powertoys_friction.md)

---

## 2026-08-15 — 赤入れ複数枚キューは roadmap に載せない

**決定事項**  
リサイズ成果の赤入れ一括注入は Reject。赤入れの画像キュー切替は annotate 側 PARK のまま。**公開 `/roadmap` には載せない**。台帳 · HOW §11.6 で足りる。提出一括リサイズ本体も 11/15 HOW GO 前は roadmap に載せない。製品コード（annotate キュー · 提出リサイズ HTML）はトリガー前に着手しない。

**理由**  
`considering` は公開の優先シグナル。OCR 候補と並ぶと期待が膨らむ。効率の痛みは認めるが、解く場所は annotate であり提出リサイズの出荷条件ではない。

**関連ドキュメント**
- [`../notes/IMAGE_BATCH_RESIZE_SUBMIT_HOW_20261115.md`](../notes/IMAGE_BATCH_RESIZE_SUBMIT_HOW_20261115.md) §11.6
- [`../notes/PRODUCT_IDEA_JUDGMENT_LEDGER.md`](../notes/PRODUCT_IDEA_JUDGMENT_LEDGER.md) §23-3

---

## 2026-08-15 — 画像圧縮の新規 HTML は今作らない（提出容量は 11/15 HOW）

**決定事項**  
クライアントサイド画像圧縮の新規 HTML は HOLD。Hub「あるかも」期待・「リサイズがあるから圧縮も」は採用理由にしない。メール添付 25MB / フォーム 2MB などの提出容量 JTBD は棄却せず、**2026-11-15** の画像一括リサイズ HOW と同じ案件で既存出口のプリセットとして検討する。仮置きには圧縮を入れない。憲法本文は改正しない。

**理由**  
非送信で圧縮できることとカタログに足すことは別。競合（Squoosh 等）が F1〜F5 を満たす領域では Hub Value で GO しない（CASE-2026-009）。閉域の Pain はしばしば配送路であり、圧縮だけでは解けない。

**関連ドキュメント**
- [`../legal/logs/2026-08-15_image_compress_submit_pain.md`](../legal/logs/2026-08-15_image_compress_submit_pain.md)
- [`../notes/IMAGE_BATCH_RESIZE_SUBMIT_HOW_20261115.md`](../notes/IMAGE_BATCH_RESIZE_SUBMIT_HOW_20261115.md)
- [`../legal/CASE_LAW.md`](../legal/CASE_LAW.md#case-2026-011) CASE-2026-011 · [`../legal/CASE_LAW.md`](../legal/CASE_LAW.md#case-2026-009) CASE-2026-009

---

## 2026-08-15 — PowerToys 一式は移植しない（新規 HTML 0）

**決定事項**  
PowerToys の機能セットは SUGUDASU へ移植しない。OS 常駐・ランチャー・設定・OCR・AI ペーストで新規 HTML を足さない。**本件監査の新規ツールは 0**（カタログ全体の凍結ではない）。Peek（確認）と出口 DnD は CASE-2026-010 のまま Keep。仮置きの形式コピー常時ボタンは Reject（出口は `table-conv`）。テキスト全画面 Peek と矩形クロップは **着手不可**（HOLD を着手可と読まない）。セッション破棄は Reject。一括リサイズ・Normalize 自動判別・PowerRename は範囲付き PARK（トリガー前は実装しない。Normalize に一括改名を足さない）。外向けに「機能を増やさない」と宣言しない。憲法本文は改正しない。

**理由**  
PowerToys は OS↔アプリの摩擦をネイティブ特権で解く。SUGUDASU は業務データ↔ブラウザ。一式を足すと常駐ランチャーのカテゴリ期待になる。OCR は目視校正という別摩擦を生む。形式変換の JTBD は価値があるが、仮置きのボタン増殖は Copy-First とヒックの法則に反する。第二読で HOLD と「今すぐ足さない」の二重管理を廃止した。

**関連ドキュメント**
- [`../legal/CASE_LAW.md`](../legal/CASE_LAW.md#case-2026-011) CASE-2026-011
- [`../legal/logs/2026-08-15_powertoys_friction.md`](../legal/logs/2026-08-15_powertoys_friction.md)
- [`../legal/logs/2026-08-15_powertoys_friction_source.md`](../legal/logs/2026-08-15_powertoys_friction_source.md)

---

## 2026-08-15 — 仮置きは Edge Drop を移植しない（卓上 · 出口）

**決定事項**  
Edge Drop の機能セットは仮置きへ移植しない。仮置きの定義は「作業中の素材を次の場所へ渡す卓上」。出口 DnD と画像/PDF の確認プレビューは GO。複数選択は一括削除・一括出口に限り条件付き GO。フィルタ · ピン留め · グループ管理 · ホットエッジ · 同期は Reject。憲法本文は改正しない。

**理由**  
保存（あとで取り出す）と仮置き（今、次へ渡す）は逆。Drop 一式を足すとクリップボード管理になり、CASE-2026-002 の管理 Reject を破る。出口は Copy-First の持ち帰りであり、チャネル送信ではない。

**関連ドキュメント**
- [`../legal/CASE_LAW.md`](../legal/CASE_LAW.md#case-2026-010) CASE-2026-010
- [`../legal/logs/2026-08-15_clip-stash_edge_drop.md`](../legal/logs/2026-08-15_clip-stash_edge_drop.md)
- [`../products/clip-stash/philosophy.md`](../products/clip-stash/philosophy.md)
- [`../products/clip-stash/SPEC_HANDOFF.md`](../products/clip-stash/SPEC_HANDOFF.md)

---

## 2026-08-14 — カタログ線引き（漢字拡大 Reject · Hub Value / 端末）

**決定事項**  
漢字拡大はコアカタログに採用しない。Hub Value（道具箱にあること・Direct 再訪）は採用の主因にしない。横連携は同一仕事系列の直前・直後に限る。端末は採用・排除の主軸にしない（割り勘は合憲）。憲法本文は改正しない。

**理由**  
「SUGUDASUっぽい」と「作るべき」は別。競合が既に F1〜F5 を満たす領域では憲法適合は差別化ではない。習慣化を採用理由にすると存在様式と衝突する。初日の「スマホ主戦場禁止」は割り勘と衝突するため否決。憲法判断は判例へ。

**関連ドキュメント**
- [`../legal/CASE_LAW.md`](../legal/CASE_LAW.md#case-2026-009) CASE-2026-009
- [`../legal/logs/2026-08-14_catalog_line.md`](../legal/logs/2026-08-14_catalog_line.md)
- [`../product/PRODUCT_CONSTITUTION.md`](../product/PRODUCT_CONSTITUTION.md)（横連携・PC原則の運用）

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
