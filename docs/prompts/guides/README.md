# ガイド記事ブラッシュアップ — Gemini / Grok パイプライン

**更新:** 2026-06-27  
**対象:** `tools/guides/*.html`（初回5本）  
**戦略 SSOT:** [`docs/notes/GUIDES_CONTENT_STRATEGY.md`](../../notes/GUIDES_CONTENT_STRATEGY.md)

---

## 役割分担（LP型A-D と同型）

| | Gemini | Grok |
|---|--------|------|
| **向き** | 比較表 · シナリオ分類 · FAQ構造 · キーワード自然配置 · E-E-A-T 補強 | 口語リズム · 幹事あるある · AI定型句除去 |
| **禁止** | 礼賛 · 数値捏造 · 未実装機能の断定 · 競合名指し | 見出し数・順の変更 · 事実追加 · 大幅な文字数増 |

**鉄則:** Gemini 第1パス → Grok 第2パス → Cursor/提督が statements 突合 → HTML 反映。

---

## 記事 × AI 得意分野の割当

| slug | Gemini のタスク（構造） | Grok のタスク（トーン） | プロンプト |
|------|------------------------|-------------------------|------------|
| `event-runbook` | 3段階タイムライン表 · イベント種別×準備焦点表 · FAQ 3問 | 幹事の「当日朝パニック」導入 · 箇条書きの体言止め混ぜ | `event-runbook.gemini.md` · `event-runbook.grok.md` |
| `training-timeline-tips` | 時間配分比率表 · 遅れパターン表 · アンカー例 | 人事兼務の独白 · 「〜することが重要です」連打除去 | `training-timeline-tips.gemini.md` · `training-timeline-tips.grok.md` |
| `excel-vs-web-timeline` | Excel vs Web 比較マトリクス · 併用フロー表 | 現場の一言（#REF! · トイレから直せない） | `excel-vs-web-timeline.gemini.md` · `excel-vs-web-timeline.grok.md` |
| `fair-group-split` | 制約優先度表 · シード説明 · 説明用台本 | ワークショップ幹事の口調 · 不満エピソードの具体化 | `fair-group-split.gemini.md` · `fair-group-split.grok.md` |
| `invoice-browser-workflow` | 記載事項チェック表 · ステップ責任分担表 | フリーランスの締切前不安 · 税務断定の回避維持 | `invoice-browser-workflow.gemini.md` · `invoice-browser-workflow.grok.md` |

---

## 使い方

```text
1. npm run generate:marketing-context（任意 · timeline/group-split 事実参照時）
2. {slug}.gemini.md の依頼文 + 現行 HTML 本文を Gemini に貼付
3. 返答 → docs/notes/guides-brushup/{slug}-gemini-RESULT.md
4. Gemini 出力を {slug}.grok.md で Grok 第2パス
5. 返答 → docs/notes/guides-brushup/{slug}-grok-RESULT.md
6. Cursor が HTML 反映 · statements 突合 · npm run build:pages
```

**Grok 無料枠:** 5本一括ではなく、Gemini 採用案がある slug から順に。

---

## 添付セット（全記事共通）

- `docs/operator-profile.md` L2（公開境界）
- `tools/statements.html` の FAQ 抜粋（非送信の言い方）
- `docs/notes/TIMELINE_SEO_MECE.md`（event 系3本のみ）
- 現行 `tools/guides/{slug}.html` の `<article>` 内テキスト

---

## 結果の置き場

`docs/notes/guides-brushup/` — `*-gemini-RESULT.md` · `*-grok-RESULT.md`

---

## 関連

- Gemini 聞き方: [`../GEMINI_COLLABORATION_GUIDE.md`](../GEMINI_COLLABORATION_GUIDE.md)
- Grok AI味除去（note 版）: [`../note-deai-grok.md`](../note-deai-grok.md)
- LP 型プロンプト: [`../lp-runs/README.md`](../lp-runs/README.md)
