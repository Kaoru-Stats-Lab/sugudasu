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
| [../PR_TIMES_LAUNCH_2026.md](../PR_TIMES_LAUNCH_2026.md) | PR TIMES 入稿原稿（代表カオル） |

**Form 回答のトリアージ:** [FEEDBACK_TRIAGE.md](../FEEDBACK_TRIAGE.md)（スプシ + Status + Backlog 連携）

実装時は [DESIGN_GUIDELINE.md](../DESIGN_GUIDELINE.md) と [assets/sugudasu-shell.js](../../assets/sugudasu-shell.js) を優先してください。
