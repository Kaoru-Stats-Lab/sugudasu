# SUGUDASU 赤入れ

**id:** `annotate`（後継 · 旧 `mask` は `/annotate` へ 301）  
**プロダクト名:** SUGUDASU 赤入れ  
**ステータス:** **GO** · **v1 公開（2026-07-24）**  
**概要正本:** [overview.md](./overview.md)  
**実装:** `tools/annotate.html` · `assets/annotate-app.js` · `assets/annotate-engine.js`

**提出 · 共有前に、必要な場所だけ整える。** 隠す · 囲む · 指す。  
**Copy First** — コピーして Slack / Teams へ。データは送りません。

## ドキュメント

| ファイル | 責務 |
|----------|------|
| [overview.md](./overview.md) | 概要 · 境界 |
| [philosophy.md](./philosophy.md) | 思想 · Visual Grammar Rule |
| [specification.md](./specification.md) | 機能仕様 |
| [faq.md](./faq.md) | FAQ 正本 |
| [decisions.md](./decisions.md) | 主要判断 |

## 関連ツール

| ツール | 関係 |
|--------|------|
| [PDF記入](../pdf-fill/README.md) | **提出完成**（Paper First）— 赤入れとは別物 |
| 画像切り出し · 余白トリム | 前処理 · 後処理 |
| 透かし | 所有表示（赤入れ = 整える · 隠す） |

旧仕様: [`docs/notes/MASK_TOOL_SPEC.md`](../../notes/MASK_TOOL_SPEC.md)（`mask` · アーカイブ参照）
