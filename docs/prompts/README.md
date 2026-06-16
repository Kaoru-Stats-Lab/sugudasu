# プロンプト履歴（SUGUDASU）

Gemini / Claude 向けの要件定義は **HTML に埋め込まず**、このフォルダに Markdown で保管します。

| ファイル | 対応ツール |
|----------|------------|
| [index-invoice.md](index-invoice.md) | `tools/index.html` 請求書 |
| [present.md](present.md) | `tools/present.html` ギフト |
| [label.md](label.md) | `tools/label.html` ラベル |
| [shift.md](shift.md) | `tools/shift.html` シフト |
| [report.md](report.md) | `tools/report.html` 議事録 |
| [reverse.md](reverse.md) | `tools/reverse.html` 逆引き |
| [warikan.md](warikan.md) | `tools/warikan.html` 割り勘 |
| [sns.md](sns.md) | `tools/sns.html` SNSデコ |
| [legal-3docs-gemini.md](legal-3docs-gemini.md) | 法務3文書ドラフト生成（Gemini依頼用） |

実装時は [DESIGN_GUIDELINE.md](../DESIGN_GUIDELINE.md) と [assets/sugudasu-shell.js](../../assets/sugudasu-shell.js) を優先してください。
