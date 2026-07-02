# プロンプト履歴（SUGUDASU）

Gemini / Claude 向けの要件定義は **HTML に埋め込まず**、このフォルダに Markdown で保管します。

| ファイル | 対応ツール |
|----------|------------|
| [index-invoice.md](index-invoice.md) | `tools/invoice.html` 請求書 |
| [present.md](present.md) | `tools/present.html` ギフト |
| [label.md](label.md) | `tools/label.html` ラベル |
| [shift.md](shift.md) | `tools/shift.html` シフト |
| [report.md](report.md) | `tools/report.html` 議事録 |
| [reverse.md](reverse.md) | `tools/reverse.html` 逆引き |
| [warikan.md](warikan.md) | `tools/warikan.html` 割り勘 |
| [sns.md](sns.md) | `tools/sns.html` SNSデコ |
| [receipt.md](receipt.md) | `tools/receipt.html` 手取り逆引き・領収書 |
| [calc-furima.md](calc-furima.md) | `tools/calc.html` フリマ送料・手数料比較（提案・未実装） |
| [legal-3docs-gemini.md](legal-3docs-gemini.md) | 法務3文書ドラフト生成（Gemini依頼用） |
| [google-form-feedback-gemini.md](google-form-feedback-gemini.md) | 改善リクエスト用 Google Form（Gemini作成用） |
| [operator-profile-gemini.md](operator-profile-gemini.md) | 運営者プロフィール L0〜L4（Gemini · 履歴書はリポ外） |
| [../operator-profile.md](../operator-profile.md) | 運営者プロフィール SSOT（L0〜L4-public） |
| [../L3-press.TEMPLATE.md](../L3-press.TEMPLATE.md) | PR TIMES担当者欄（社名あり · 入稿専用ひな形） |
| [../x_guideline.md](../x_guideline.md) | 公式X運用ガイドライン（投稿ネタ · UTM · NG） |
| [grok-pr-times-review.md](grok-pr-times-review.md) | PR TIMES推敲（Grok 5パス） |
| [pr-times-gemini-meta.md](pr-times-gemini-meta.md) | PR TIMESメタ解析（Gemini · 書き直し禁止） |
| `zenn-editorial-gemini.md` | Zenn編集カレンダー・テーマ設計（Gemini · 本文執筆禁止） |
| [editorial-roles-gemini.md](editorial-roles-gemini.md) | **チャネル ROLE 索引**（note / Zenn / X / Qiita） |
| [zenn-article-draft-gemini.md](zenn-article-draft-gemini.md) | Zenn 記事アウトライン拡張（長文は提督執筆） |
| [note-editorial-gemini.md](note-editorial-gemini.md) | note「引き算の記録」下書き（Gemini たたき台 · 第1パス） |
| [note-deai-grok.md](note-deai-grok.md) | note 原稿 AI 味除去（Grok · 第2パス） |
| [kanji-san-lp-patterns-gemini.md](kanji-san-lp-patterns-gemini.md) | **幹事さん型 LPプロンプト SSOT**（型0/A/B/C/D · Grok第2パス · 運用） |
| [lp-runs/README.md](lp-runs/README.md) | **ツール別 LP Gemini/Grok コピペ用**（warikan · group-split 済） |
| [TOOL_FACTS.generated.md](TOOL_FACTS.generated.md) | `npm run generate:tool-facts` — 結合出力 |
| [tool-facts/](tool-facts/) | ツール別 `*.generated.md`（Gemini 1ツール添付） |
| `data/tool-facts/` | 手動正本 · `npm run scaffold:tool-facts` |
| [LP_MARKETING_MATRIX.generated.md](LP_MARKETING_MATRIX.generated.md) | `npm run generate:lp-matrix` — Pain · 束 · △問題 · Top3 |
| [GEMINI_MARKETING_CONTEXT.generated.md](GEMINI_MARKETING_CONTEXT.generated.md) | `npm run generate:marketing-context` — 上記結合（Gemini一括添付） |
| `data/lp-marketing-matrix.json` | マーケ行列の手動正本（§1-§4） |
| **マルチAIリファクタ** | [`multi-ai-refactor-RUNBOOK.md`](multi-ai-refactor-RUNBOOK.md) · Gemini [`multi-ai-refactor-gemini-COPYPASTE.txt`](multi-ai-refactor-gemini-COPYPASTE.txt) · GLM [`multi-ai-refactor-glm-COPYPASTE.txt`](multi-ai-refactor-glm-COPYPASTE.txt) · Cursor [`multi-ai-refactor-cursor-COPYPASTE.txt`](multi-ai-refactor-cursor-COPYPASTE.txt) · 正本 [`../notes/MULTI_AI_CODER_PLAYBOOK.md`](../notes/MULTI_AI_CODER_PLAYBOOK.md) |
| [../scripts/verify-ogp.mjs](../scripts/verify-ogp.mjs) | OGP 必須タグ検証（`npm run validate:ogp`） |
| [x-editorial-gemini.md](x-editorial-gemini.md) | X 文案生成・監査 |
| [qiita-editorial-gemini.md](qiita-editorial-gemini.md) | Qiita 短記事構成 |
| [../drafts/note-01-group-split-draft.md](../drafts/note-01-group-split-draft.md) | note NOTE-01 推敲済ドラフト |
| [../PR_TIMES_LAUNCH_2026.md](../PR_TIMES_LAUNCH_2026.md) | PR TIMES 入稿原稿（代表カオル） |

**Form 回答のトリアージ:** [FEEDBACK_TRIAGE.md](../FEEDBACK_TRIAGE.md)（スプシ + Status + Backlog 連携）

実装時は [DESIGN_GUIDELINE.md](../DESIGN_GUIDELINE.md) と [assets/sugudasu-shell.js](../../assets/sugudasu-shell.js) を優先してください。
