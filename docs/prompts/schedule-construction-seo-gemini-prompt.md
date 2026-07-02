# Gemini依頼: Schedule · 建設 — SEO 深掘り（guides + Sync LP）

**用途:** [`SYNC_SCHEDULE_SEO_KEYWORDS.md`](../notes/SYNC_SCHEDULE_SEO_KEYWORDS.md) v0.2 の補強 · [`GUIDE_CONSTRUCTION_SCHEDULE_OUTLINE.md`](../notes/GUIDE_CONSTRUCTION_SCHEDULE_OUTLINE.md) の表・FAQ 用素材  
**出力保存先:** `docs/notes/schedule-construction-seo-gemini-RESULT.md`  
**更新:** 2026-06-29

**前提:** WEB制作垂直は **guides SEO のみ完了 · 製品外** — [`SYNC_SCHEDULE_PRODUCT_DECISION.md`](../notes/SYNC_SCHEDULE_PRODUCT_DECISION.md) §0-8

---

## Gemini への依頼文（コピペ用）

```text
あなたは日本の建設現場（内装・リフォーム・小規模土木）に詳しい編集リサーチャーです。
礼賛・前置き・LP全文・記事散文のリライトは不要。指定フォーマットの表と箇条書きのみ出力してください。
数値・検索ボリュームはソース明記。不明は「要確認」。捏造禁止。

【我々のプロダクト（誤解禁止）】

- NOT: ANDPAD / 施工管理システム / 本格 ERP の代替としての正面競争
- NOT: WBS · カンバン · プロジェクト管理 SaaS の話
- NOT: イベント司会の進行表（別製品 · timeline）
- NOT: 図面管理 · 日報 · 施工写真の一元化（刺さらない領域として正直に）
- IS: 現場監督が Excel で回している「工事工程表・週間工程」の
  - 提出用と現場用の二重管理・転記
  - LINE画像・紙・PDF再送の版混乱
  - 天候・仕様変更時の手動ずらし
  - 下請・職人への URL1本共有（将来の Sync 製品 · 一般論）
- 流入記事は sugudasu.com/guides（無料 · 登録不要）
- 商用 LP は sync.sugudasu.com/schedule（建設語彙 · 未公開でも SEO 文案を先に作る）

【参照ペイン（監督実務）】
提出用工程表 / 週間工程 / 日次予定 / 重機・資材 / 下請配置 — 二重管理と転記が典型。
詳細は schedule-supervisor-workflow-gemini-RESULT の依頼1–2 を想定してよい。

【依頼1】検索意図クラスター（建設垂直のみ）

次のキーワードを Informational / Commercial / Transactional に分類し、各クラスターに代表クエリを3つずつ:

Primary（商用）:
- 小規模 工事 工程表 共有
- 内装工事 工程表 エクセル
- リフォーム 工程表 アプリ

Secondary（無料流入）:
- 工程表 テンプレート エクセル 無料
- 工事工程表 自動計算
- 住宅リフォーム スケジュール表
- 工事 進行表 作成
- 建築 工程管理 簡単

避ける（主語にしない）:
- 施工管理システム ANDPAD / ガントチャート フリーソフト / 施工体制台帳 建設業

【依頼2】表A「現場工程でよくある失敗」

列: 失敗パターン | 典型症状（1行） | 根本原因 | 監督の即応（1行）
行は最低5行（版ズレ/LINE古い画像 / 提出用と現場用の乖離 / 週間工程の下請周知漏れ / 天候・変更の手動ずらし / スマホで横長表が読めない 等）

【依頼3】表B「Excel向き vs 苦手」

列: 観点 | Excel | 評価（◎○△×） | 現場の具体例（1行）
行は最低6行（初版・監理提出 / 週間下請配布 / 天候リスケ連動 / 職人スマホ閲覧 / 複数現場俯瞰 / 図面・日報一元化）

【依頼4】FAQ 質問文

検索質問型の FAQ を5本。各質問は40〜60字。
Secondary キーワードを自然に含める。避けるKWは含めない。

【依頼5】競合 SERP 観察（定性）

Google 日本で「工程表 テンプレート エクセル 無料」または「内装工事 工程表 エクセル」を検索したときに上位に出やすい
コンテンツタイプを推定し、我々の guides が差別化すべき1行（建設のみ）。

【依頼6】title / meta 改善案

以下2ページについて、title 55字前後 · meta 120字前後 を各2案:

1. guides: 工事工程表をExcelで回すときの落とし穴
2. Sync LP: 工事工程表の共有（内装・リフォーム）

【禁止】
- WEB制作 · Asana · WBS · カンバンの主語化
- 未確認の月間検索ボリュームの断定
- 未実装機能（リアルタイム同時編集等）の断定
- 婚礼 · 研修 · 放送の進行表
```

---

## 提督メモ

- Keyword Planner → `SYNC_SCHEDULE_SEO_KEYWORDS.md` §6  
- RESULT 受取後、guides 実装 Agent が骨子とマージ  
- Grok 第2パスは WEB 用プロンプトを建設向けに複製してから
