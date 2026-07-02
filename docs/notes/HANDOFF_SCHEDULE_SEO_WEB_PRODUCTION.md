# 引き継ぎ — Schedule SEO · WEB制作ガイド（2026-07-02）

**用途:** 新しい Cursor チャット / 別 Agent へのコピペ用。  
**親会話:** transcript `03329638-6963-4210-a5cb-8579e4226ef7`（normalize · 7原則 · git 委任 docs · Schedule リーチ議論）  
**リポジトリ:** `C:\asl_dev\sugudasu`（**asl-dashboard ではない**）

---

## このセッションで完了したこと

| 項目 | 状態 | ファイル |
|------|------|----------|
| Schedule SEO SSOT v0.1 | **済** | `docs/notes/SYNC_SCHEDULE_SEO_KEYWORDS.md`（Gemini §1–§8 統合） |
| WEB制作 guides 骨子 v0.1 | **済** | `docs/notes/GUIDE_WEB_PRODUCTION_SCHEDULE_OUTLINE.md` |
| Gemini リサーチ用プロンプト | **済** | `docs/prompts/schedule-web-production-seo-gemini-prompt.md` |
| 本引き継ぎ | **済** | 本ファイル |
| guides HTML 実装 | **済** | `tools/guides/web-production-schedule-excel.html` |
| `data/guides.json` · production 柱 | **済** | `GUIDES_CONTENT_STRATEGY.md` 更新済 |
| Sync `/schedule` LP | **未** | 製品・デプロイ別タスク |
| **Gemini 実行 · RESULT 貼付** | **済** | `schedule-web-production-seo-gemini-RESULT.md` · SSOT §4-1 · §11 |
| git commit / push | **未** | 提督指示まで |
| **提督 §0-8** | **済** | WEB = SEO のみ · 製品外 → 建設へ [`HANDOFF_SCHEDULE_SEO_CONSTRUCTION.md`](HANDOFF_SCHEDULE_SEO_CONSTRUCTION.md) |

---

## 背景（30秒）

- Gemini 調査 [`excel-gantt-verticals-gemini-RESULT.md`](excel-gantt-verticals-gemini-RESULT.md) で **8垂直 × Primary/Secondary/避けるKW** が確定済みだったが、**Schedule 用 SEO SSOT が未起票**だった。  
- リーチ戦略: **Secondary（エクセル・雛形）→ guides** · **Primary（共有・クラウド）→ sync `/schedule`**。イベント `/timeline` と混同禁止。  
- PoC SEO 垂直は **#1 広告・WEB制作**（guides **完了**）。**製品・次 SEO = #2 建設**（[`HANDOFF_SCHEDULE_SEO_CONSTRUCTION.md`](HANDOFF_SCHEDULE_SEO_CONSTRUCTION.md)）。  
- 提督 §0-8: **WEB = guides SEO のみ · 製品ペルソナ外**（WBS/カンバン層は対象外）。

---

## 次 Agent のタスク（優先順）

### P0 — コンテンツ

1. ~~Gemini 実行~~ — §1–§8 提督貼付済み。任意で `schedule-web-production-seo-gemini-prompt.md`  
2. **guides HTML 実装** — 骨子 `GUIDE_WEB_PRODUCTION_SCHEDULE_OUTLINE.md` · 雛形 `tools/guides/excel-vs-web-timeline.html`  
3. **`data/guides.json`** — slug `web-production-schedule-excel` · 柱 `production`  
4. **`GUIDES_CONTENT_STRATEGY.md`** — production 柱を1行追加（event/docs/team/brand の隣）  
5. **`npm run build:pages`** → `/guides/web-production-schedule-excel` smoke  

### P1 — SEO 整合

6. **Keyword Planner** — ボリューム取得後 `SYNC_SCHEDULE_SEO_KEYWORDS.md` §1 順位見直し（Gemini §1–§8 は統合済み）  
7. **内部リンク** — `guides.html` 索引 · 将来 hub  

### P2 — 製品（別ストリーム可）

8. **`sync.sugudasu.com/schedule` LP** — §1-1 title/meta/FAQ（[`SCHEDULE_V3_MASTER_PLAN.md`](SCHEDULE_V3_MASTER_PLAN.md)）  
9. guides 末尾 CTA を Sync LP に接続（LP 未公開時は準備中文言）

### しないこと

- 8垂直を一斉に guides 化しない  
- 「ガントチャート 無料」「Asana 代替」を title 主語にしない（§3 除外）  
- `/timeline` の SEO を Schedule 用に書き換えない  

---

## SSOT リンク

| 用途 | パス |
|------|------|
| Schedule SEO 正本 | `docs/notes/SYNC_SCHEDULE_SEO_KEYWORDS.md` |
| ガイド骨子 | `docs/notes/GUIDE_WEB_PRODUCTION_SCHEDULE_OUTLINE.md` |
| 8垂直リサーチ | `docs/notes/excel-gantt-verticals-gemini-RESULT.md` |
| イベント SEO（別ライン） | `docs/notes/SYNC_TIMELINE_SEO_KEYWORDS.md` |
| ガイド戦略 | `docs/notes/GUIDES_CONTENT_STRATEGY.md` |
| 製品決定 | `docs/notes/SYNC_SCHEDULE_PRODUCT_DECISION.md` |
| URL 設計 | `docs/notes/SYNC_URL_INFORMATION_ARCHITECTURE.md` |
| WEB制作 SEO 深掘り RESULT | `docs/notes/schedule-web-production-seo-gemini-RESULT.md` |
| Gemini プロンプト | `docs/prompts/schedule-web-production-seo-gemini-prompt.md` |

---

## デプロイ注意

- **core** guides のみ → `npm run release:pages:free` + `DEPLOY_LOG` + `git push origin main`  
- **sync** LP → `deploy:pages:sync`（別ゲート）  
- commit / push は **提督が明示指示するまで実行しない**（前セッションの git 委任 docs は push 済 `4d29b54`）

---

## 引き継ぎチャット（コピペ用）

```text
【引き継ぎ】SUGUDASU Schedule SEO — WEB制作ガイド実装

リポジトリ: C:\asl_dev\sugudasu（このフォルダを Open Folder）

SSOT:
- docs/notes/HANDOFF_SCHEDULE_SEO_WEB_PRODUCTION.md（本ファイル）
- docs/notes/SYNC_SCHEDULE_SEO_KEYWORDS.md（Schedule SEO v0）
- docs/notes/GUIDE_WEB_PRODUCTION_SCHEDULE_OUTLINE.md（guides 骨子）

状況:
- SEO SSOT v0.1 · guides 骨子 v0.1 済み（Gemini §1–§8 論拠統合済み）
- HTML 実装済 · build:pages OK · commit 未

次（P0）:
1. ~~tools/guides/web-production-schedule-excel.html~~ 済
2. ~~data/guides.json + GUIDES_CONTENT_STRATEGY.md~~ 済
3. ~~npm run build:pages~~ 済

禁止:
- /timeline と Schedule の SEO 混同
- 避けるKW（Asana・ガント無料等）を title 主語にしない
- 8垂直一斉投入

commit/push は提督指示まで保留。
```

---

## 変更履歴

| 日付 | 内容 |
|------|------|
| 2026-06-29 | §0-8 反映 · WEB 垂直クローズ · 建設 HANDOFF へ |
| 2026-07-02 | Gemini 依頼1–6 HTML追従（meta · FAQ5 · 失敗H3×5）· build:pages OK |
| 2026-07-02 | 初版（SEO 起票 · 骨子 · 引き継ぎ） |
