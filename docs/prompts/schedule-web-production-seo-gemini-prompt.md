# Gemini依頼: Schedule · WEB制作 — SEO 深掘り（guides + Sync LP）

**用途:** [`SYNC_SCHEDULE_SEO_KEYWORDS.md`](../notes/SYNC_SCHEDULE_SEO_KEYWORDS.md) v0 の補強 · [`GUIDE_WEB_PRODUCTION_SCHEDULE_OUTLINE.md`](../notes/GUIDE_WEB_PRODUCTION_SCHEDULE_OUTLINE.md) の表・FAQ 用素材  
**出力保存先:** `docs/notes/schedule-web-production-seo-gemini-RESULT.md`（次 Agent が作成）  
**更新:** 2026-07-02

---

## Gemini への依頼文（コピペ用）

```text
あなたは日本のWEB制作・広告制作業界に詳しい編集リサーチャーです。
礼賛・前置き・LP全文・記事散文のリライトは不要。指定フォーマットの表と箇条書きのみ出力してください。
数値・検索ボリュームはソース明記。不明は「要確認」。捏造禁止。

【我々のプロダクト（誤解禁止）】

- NOT: Asana / Monday / Jira / ガントチャート SaaS の代替としての正面競争
- NOT: イベント司会の進行表（別製品）
- IS: 小規模制作チームが Excel / スプレッドシートで回している「制作スケジュール・工程表」の
  - 版ズレ・PDF再送の痛み
  - クライアント確認遅延時の後続手動ずらし
  - 共有 URL で閲覧1本化（将来の Sync 製品）
- 流入記事は sugudasu.com/guides（無料・登録不要ガイド）
- 商用 LP は sync.sugudasu.com/schedule（未公開でも SEO 文案を先に作る）

【依頼1】検索意図クラスター（WEB制作垂直のみ）

次のキーワードを Informational / Commercial / Transactional に分類し、各クラスターに代表クエリを3つずつ:

Primary（商用）:
- 制作 スケジュール 共有 ツール
- WEB制作 工程表 クラウド
- デザイン 進行管理 ツール

Secondary（無料流入）:
- 制作スケジュール表 エクセル
- WEBディレクター スケジュール 管理
- 案件 進行管理 シート
- クリエイティブ 進行表 雛形
- スケジュール 逆算 表

避ける（主語にしない）:
- ガントチャート 無料 / プロジェクト管理 Asana / タスク管理 アプリ

【依頼2】表A「制作進行でよくある失敗」

列: 失敗パターン | 典型症状（1行） | 根本原因 | ディレクターの即応（1行）
行は最低5行（版ズレ / クライアント遅延 / 外注古い納期 / 式崩れ / スマホ確認 等）

【依頼3】表B「Excel向き vs 苦手」

列: 観点 | Excel/SS | 評価（◎○△×） | 制作現場の具体例（1行）
行は最低6行（初版づくり / クライアントPDF / 遅延連動 / 外注周知 / スマホ / 複数案件）

【依頼4】FAQ 質問文

検索質問型の FAQ を5本。各質問は40〜60字。
Secondary キーワードを自然に含める。避けるKWは含めない。

【依頼5】競合 SERP 観察（定性）

Google 日本で「制作スケジュール表 エクセル」を検索したときに上位に出やすい
コンテンツタイプ（テンプレDL / 記事 / SaaS LP / Q&A）を推定し、
我々の guides が差別化すべき1行を垂直ごとに（WEB制作のみ）。

【依頼6】title / meta 改善案

以下2ページについて、title 55字前後 · meta 120字前後 を各2案:

1. guides: 制作スケジュール表をExcelで回すときの落とし穴
2. Sync LP: 制作スケジュールの共有ツール（WEB制作工程表）

【禁止】
- 未確認の月間検索ボリュームの断定
- 我々が未実装の機能（リアルタイム同時編集等）を「できる」と書く
- 婚礼・研修・放送の進行表
```

---

## 提督メモ

- Keyword Planner の数値は **別途** Google Ads で取得 → `SYNC_SCHEDULE_SEO_KEYWORDS.md` §6 に貼る  
- RESULT 受取後、guides 実装 Agent が骨子 §「Gemini に足してもらうブロック」をマージする
