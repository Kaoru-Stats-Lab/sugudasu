# Gemini依頼: Schedule · 建設 — 補完リサーチ（印刷 MUST · LP · 抜け埋め）

**用途:** [`SYNC_SCHEDULE_PRODUCT_DECISION.md`](../notes/SYNC_SCHEDULE_PRODUCT_DECISION.md) **§0-9** 反映後の穴埋め · [`schedule-construction-seo-gemini-RESULT.md`](../notes/schedule-construction-seo-gemini-RESULT.md) の**追補**（依頼1–6の再実行は不要）  
**出力保存先:** `docs/notes/schedule-construction-seo-gemini-RESULT-SUPPLEMENT.md`  
**更新:** 2026-06-29

**前提（済み · 再出不要）**

- 建設 SEO 依頼1–6 · guides HTML `construction-schedule-excel`  
- 監督ワークフロー [`schedule-supervisor-workflow-gemini-RESULT.md`](../notes/schedule-supervisor-workflow-gemini-RESULT.md)  
- 週間リスト [`SCHEDULE_WEEKLY_LIST_DESIGN.md`](../notes/SCHEDULE_WEEKLY_LIST_DESIGN.md)

---

## Gemini への依頼文（コピペ用）

```text
あなたは日本の建設現場（内装・リフォーム・小規模工務）に詳しい編集リサーチャーです。
礼賛・前置き・長文散文は不要。指定フォーマットの表と箇条書きのみ。
数値・検索ボリュームはソース明記。不明は「要確認」。捏造禁止。

【我々のプロダクト（誤解禁止）】

- NOT: ANDPAD 代替 · WBS/カンバン · 図面・日報一元化
- IS: 現場監督の Excel 工程表 — 提出/現場/週間の二重管理の転記削減
- **建設現場では工程表の「印刷」が MUST**（監理 A3 · 週間 A4 · 朝礼 · 掲示 · 事務所プリンタ）
- URL 共有は印刷の**代替ではなく併用**（版ズレ防止）
- 製品は DB 正本 → UI 印刷 / 提出用 PDF / xlsx（実装予定 · 未実装機能は断定しない）

【既存調査（重複しないこと）】
schedule-construction-seo-gemini-RESULT の失敗5件・FAQ5問・表Bは済み。
今回は**印刷・週間配布・LP**の抜けのみ。

【依頼A】検索意図クラスター追補（建設 · 印刷・週間）

次の語を Informational / Commercial / Transactional に1つずつ分類し、
既存9語クラスターと**重複しなければ**代表クエリを各クラスターに2つ追加:

- 週間工程 エクセル
- 工事 工程表 印刷
- 監理 工程表 テンプレート
- 現場 工程表 掲示
- 内装 リフォーム 工期表

【依頼B】表A追補「印刷まわりの失敗」（最低3行）

列: 失敗パターン | 典型症状（1行） | 根本原因 | 監督の即応（1行）
例の方向: 印刷版とExcel版のズレ / 週間を印刷し忘れ / 掲示板が古いまま / プリンタ縮小で読めない

【依頼C】表B追補「Excel向き vs 苦手」（印刷・配布の観点で3行）

列: 観点 | Excel | 評価（◎○△×） | 現場の具体例（1行）
必須観点: 監理提出のA3印刷 / 週間の事務所印刷+LINE併用 / 掲示用の週間A4

【依頼D】FAQ 質問文（印刷・週間 · 3本追加）

各40〜60字。検索質問型。避けるKW: ANDPAD · ガント無料 · WBS
（既存5問と重複しないこと）

【依頼E】Sync LP 用 FAQ 回答の骨子（5問 · 各2〜3 bullet）

質問テーマ（回答は箇条書きのみ · 礼賛なし）:
1. 小規模工事の工程表を Excel から卒業できるか
2. 提出用と現場用を1本にできるか
3. 週間工程を職人にどう渡すか（印刷 vs URL）
4. 雨天で1日ずれたとき何が変わるか
5. 図面・日報まで必要か（→ 非対応の正直線）

【依頼F】競合 · 印刷観点の差別化1行

テンプレDL型・Excel作り方記事が多い中、**印刷 MUST の現場**向け guides/LP の差別化を1行（「次世代」「劇的」禁止）

【依頼G】title / meta 追案（印刷KWを自然に1つ含む · 各1案）

1. guides: 工事工程表をExcelで回すときの落とし穴
2. Sync LP: 工事工程表の共有（内装・リフォーム）

title 55字前後 · meta 120字前後 · 「5選！」「限界？」禁止

【禁止】
- WEB制作 · Asana · 未実装の「自動同期」「リアルタイム同時編集」の断定
- 依頼1–6 の表・FAQ の丸ごと再出力
```

---

## 提督メモ — この補完のあと

| 順 | 作業 | 担当 |
|----|------|------|
| 1 | 上記 Gemini → RESULT-SUPPLEMENT | 提督/Gemini |
| 2 | SSOT · guides HTML 追補（表行 · FAQ · meta 必要なら） | Cursor |
| 3 | **Grok 第2パス**（`construction-schedule-excel.grok.md` 起票後） | Grok → Cursor |
| 4 | Keyword Planner（建設 Primary 順位見直し） | 提督 · Google Ads |
| 5 | Sync `/schedule` LP HTML | 別タスク |

**Grok は Gemini 補完 + Cursor マージ後**がよい（印刷 MUST の文言が固まってから口語化）。
