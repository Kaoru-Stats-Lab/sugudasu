# ガイド記事ブラッシュアップ — 完了サマリー

**完了日:** 2026-06-27  
**パイプライン:** Gemini（構造・表・FAQ）×5 → Grok（口語トーン）×5 → Cursor HTML 反映  
**プロンプト正本:** `docs/prompts/guides/README.md`

---

## 完了記事一覧

| slug | Gemini RESULT | Grok RESULT | HTML |
|------|---------------|-------------|------|
| `event-runbook` | ✓ | ✓ | `tools/guides/event-runbook.html` |
| `training-timeline-tips` | ✓ | ✓ | `tools/guides/training-timeline-tips.html` |
| `excel-vs-web-timeline` | ✓ | ✓ | `tools/guides/excel-vs-web-timeline.html` |
| `fair-group-split` | ✓ | ✓ | `tools/guides/fair-group-split.html` |
| `invoice-browser-workflow` | ✓ | ✓ | `tools/guides/invoice-browser-workflow.html` |

---

## Cursor 突合で修正した主な点（全記事共通）

| Gemini/Grok 出力 | 修正方針 |
|------------------|----------|
| 「自動消去」「URL同期」「リアルタイム周知」 | statements 準拠の非送信・テキストコピー共有に |
| 「忖度ゼロ」「100%フラット」 | シード再現・手順説明の実務表現に |
| 税務・電帳法の断定 | 「要確認」+ 税理士相談・免責維持 |
| 登録番号を「数件発行」 | 請求書複数件発行の誤記として修正 |

---

## 成果物パス

```
docs/prompts/guides/          … 10プロンプト + README
docs/notes/guides-brushup/    … *-gemini-RESULT.md ×5, *-grok-RESULT.md ×5, SUMMARY.md
tools/guides/*.html           … 反映済み5本
data/guides.json              … updatedAt: 2026-06-27
```

---

## 次のステップ（提督）

1. `cd c:\asl_dev\sugudasu && npm run build:pages`
2. commit / push / Cloudflare Pages デプロイ
3. AdSense 再審査（デプロイ後 3〜7日 → Search Console → 修正申告）
