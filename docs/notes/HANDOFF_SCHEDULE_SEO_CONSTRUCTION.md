# 引き継ぎ — Schedule SEO · 建設ガイド（2026-06-29）

**用途:** 新しい Cursor チャット / 別 Agent へのコピペ用。  
**親判断:** [`SYNC_SCHEDULE_PRODUCT_DECISION.md`](SYNC_SCHEDULE_PRODUCT_DECISION.md) **§0-8** — WEB制作 = SEO のみ · **建設 = 製品正本**  
**リポジトリ:** `C:\asl_dev\sugudasu`（**asl-dashboard ではない**）

---

## このセッションで完了したこと

| 項目 | 状態 | ファイル |
|------|------|----------|
| §0-8 WEB = 製品外 · 建設 = 正本 | **済** | `SYNC_SCHEDULE_PRODUCT_DECISION.md` |
| SEO SSOT v0.2（垂直トラック） | **済** | `SYNC_SCHEDULE_SEO_KEYWORDS.md` §0-2 · §1-1 · §1-2b |
| 建設 guides 骨子 v0.1 | **済** | `GUIDE_CONSTRUCTION_SCHEDULE_OUTLINE.md` |
| Gemini リサーチ用プロンプト | **済** | `docs/prompts/schedule-construction-seo-gemini-prompt.md` |
| 本引き継ぎ | **済** | 本ファイル |
| Gemini 実行 · RESULT | **済** | `schedule-construction-seo-gemini-RESULT.md` |
| guides HTML 実装 | **済** | `tools/guides/construction-schedule-excel.html` |
| §0-9 印刷 MUST | **済** | `SYNC_SCHEDULE_PRODUCT_DECISION.md` |
| Gemini 補完プロンプト（印刷・LP） | **起票** | `schedule-construction-seo-gemini-SUPPLEMENT-prompt.md` |
| Gemini 補完 RESULT | **済** | `schedule-construction-seo-gemini-RESULT-SUPPLEMENT.md` · SSOT/HTML 反映 |
| Grok 第2パス | **済** | `construction-schedule-excel.grok.md` · `guides-brushup/construction-schedule-excel-grok-RESULT.md` |

**前提（WEB 垂直）:** [`HANDOFF_SCHEDULE_SEO_WEB_PRODUCTION.md`](HANDOFF_SCHEDULE_SEO_WEB_PRODUCTION.md) — guides **完了 · 凍結**

---

## 背景（30秒）

- 提督判断: WEB 系は **WBS/カンバン/Asana を既に使う** — Schedule の製品ペルソナではない。  
- **dogfood 正本 = 現場監督** · CAD+Excel · 提出/現場/週間/下請の二重管理（[`schedule-supervisor-workflow-gemini-RESULT.md`](schedule-supervisor-workflow-gemini-RESULT.md)）。  
- リーチ: **Secondary → guides** · **Primary → sync `/schedule`**（建設語彙）。ANDPAD 正面比較禁止。

---

## 次 Agent のタスク（優先順）

### P0 — コンテンツ（guides 初版は済）

1. ~~Gemini 依頼1–6~~ — **済**  
2. ~~guides HTML~~ — **済**  
3. ~~**Grok 第2パス**~~ — **済**（プロンプト起票 · HTML 口語反映）
4. **Sync `/schedule` LP** — §1-1 · 依頼E FAQ骨子

### P1 — SEO 整合

7. **Keyword Planner** — 建設 KW ボリューム → `SYNC_SCHEDULE_SEO_KEYWORDS.md` §1-2b  
8. **内部リンク** — WEB ガイド末尾から建設ガイドへは **張らない**（ペルソナ混同防止）· 必要なら「イベント進行との違い」のみ

### P2 — 製品

9. **`sync.sugudasu.com/schedule` LP** — §1-1 建設 title/meta/FAQ  
10. guides 末尾 CTA → Sync LP（準備中文言維持可）

### しないこと

- WEB ガイドの追加展開 · WEB 主語の Sync LP を先に出す  
- WBS · カンバン · ANDPAD 代替を title 主語にする  
- `/timeline` と Schedule の SEO 混同  
- 8垂直一斉 guides 化

---

## SSOT リンク

| 用途 | パス |
|------|------|
| 製品決定 §0-8 | `docs/notes/SYNC_SCHEDULE_PRODUCT_DECISION.md` |
| Schedule SEO 正本 | `docs/notes/SYNC_SCHEDULE_SEO_KEYWORDS.md` |
| 建設ガイド骨子 | `docs/notes/GUIDE_CONSTRUCTION_SCHEDULE_OUTLINE.md` |
| 監督ワークフロー調査 | `docs/notes/schedule-supervisor-workflow-gemini-RESULT.md` |
| 週間リスト設計 | `docs/notes/SCHEDULE_WEEKLY_LIST_DESIGN.md` |
| 8垂直リサーチ | `docs/notes/excel-gantt-verticals-gemini-RESULT.md` |
| WEB guides（完了） | `HANDOFF_SCHEDULE_SEO_WEB_PRODUCTION.md` |

---

## 引き継ぎチャット（コピペ用）

```text
【引き継ぎ】SUGUDASU Schedule SEO — 建設 guides 完了 → Sync LP 次

リポジトリ: C:\asl_dev\sugudasu

済: construction-schedule-excel HTML · Gemini+補完 · Grok口語 · FAQ8 · build OK
未: Sync LP HTML · Keyword Planner · commit/deploy

次: sync.sugudasu.com/schedule LP（§1-1 title/meta · 依頼E FAQ骨子 · 印刷+URL併用）
禁止: WEB展開 · ANDPAD · 煽りtitle · 未実装断定
```

---

## 変更履歴

| 日付 | 内容 |
|------|------|
| 2026-06-29 | 建設 Gemini 統合 · HTML · build:pages |
| 2026-06-29 | 初版（§0-8 反映 · 建設垂直着手） |
