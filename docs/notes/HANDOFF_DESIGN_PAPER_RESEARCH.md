# 引き継ぎ — 紙媒体進行管理 · 需要調査（2026-07-02）

**製品ステータス:** **Hold** — SUGUDASU本体 · Sync Schedule（建設）とは**別ライン**  
**目的:** 登録なしLP + Googleフォームで需要検証 · 合成インタビューは仮説補強のみ

---

## 公開済み（2026-07-02 · 配信完了）

| 項目 | URL |
|------|-----|
| **Googleフォーム** | https://docs.google.com/forms/d/e/1FAIpQLScIBvXQdPXBmLPqxvqdoYPRchaobhdCohVUEXgp3jWmiR157w/viewform |
| **Note** | https://note.com/sugudasu/n/n699773e53349 |
| **X** | https://x.com/sugudasu/status/2072529517193908608 |
| **LP（任意 · noindex）** | `https://sugudasu.com/paper-schedule-research`（デプロイ後） |

**配信:** Note + X **済** · 以降はフォーム回答待ち（週1確認 · 3件でGo/No-Go）

---

## 公開済み（旧表 · LPのみ先行時）

---

## SSOT · プロンプト

| 用途 | ファイル |
|------|----------|
| Gemini リサーチ RESULT | `docs/notes/design-paper-schedule-gemini-RESULT.md` |
| 評価（記入済） | `docs/notes/design-paper-lp-evaluation-FILLED.md` |
| フォーム設計プロンプト | `docs/prompts/design-paper-google-form-gemini-prompt.md` |
| 合成インタビュー ROLE | `docs/prompts/design-paper-synthetic-interview-ROLE.md` |
| 合成インタビュー RESULT（4モデル） | `docs/notes/design-paper-synthetic-interview-RESULT.md` |
| LP文案仕様 | `docs/notes/design-paper-lp-waitlist-spec.md` |

---

## 判断基準（2週間）

| シグナル | 次 |
|----------|-----|
| フォーム回答 **0件** | 訴求変更 · X/note で1本配信して再計測 |
| 回答 **1〜2件** | 合成インタビュー突合 · ヒーロー文案AB |
| 回答 **3件以上** | 15分ヒアリング1社 · Go/No-Go |
| ヒアリング協力 + メールあり | 謝礼つき深掘り（先着5） |

---

## やらないこと

- Sync Schedule（建設）と並行で製品実装
- sitemap 主導のSEO（LPは noindex）
- guides 索引への掲載（ペルソナ混同防止）
- 「Excel卒業」「完全自動」訴求

---

## 次タスク

1. ~~`npm run build:pages` → LP 反映確認~~ **済**  
2. ~~合成インタビュー~~ — **済** · `design-paper-synthetic-interview-RESULT.md`（Gemini/Grok/ChatGPT/Claude 4本突合）  
3. **フォーム回答**スプレッドシートを週1で確認 · 合成RESULTと突合列を追加  
4. 配信: note/X 用の短文案（`design-paper-lp-waitlist-spec.md`）  
5. 実回答3件+で Go/No-Go判断

**commit/deploy:** 提督指示まで保留（`DEPLOY_LOG` 未更新）
