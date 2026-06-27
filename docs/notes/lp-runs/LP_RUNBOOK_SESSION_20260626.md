# LP型A-D RUNBOOK セッションログ — 2026-06-26

**リポ:** `C:\asl_dev\sugudasu` · **deploy:** [`DEPLOY-20260626-004`](../DEPLOY_LOG.md) · **commit:** `b0bb674`

---

## 完了ツール

| tool_id | RUNBOOK | RESULT | HTML反映 | changelog |
|---------|---------|--------|----------|-----------|
| **warikan** | [`warikan-RUNBOOK.md`](../../prompts/lp-runs/warikan-RUNBOOK.md) 8/8 ✅ | `warikan-type*-{gemini,grok}-RESULT.md` ×8 | `tools/warikan.html` | 2026-06-26 improve |
| **group-split** | [`group-split-RUNBOOK.md`](../../prompts/lp-runs/group-split-RUNBOOK.md) 8/8 ✅ | `group-split-type*-{gemini,grok}-RESULT.md` ×8 | `tools/group-split.html` | 2026-06-26 improve |

**手順:** Gemini 型A → Grok 型A → … → Gemini 型D → Grok 型D（1プロンプトずつ · 提督貼付）

---

## 採用文案の要点

### warikan

- **主Pain:** 直前ドタキャン · 丸めで合計ズレ · 幹事の心理ハードル
- **型D FAQ:** サーバー非送信 · 閉じると消滅 · LRM/調整すき間（幹事裁量）· 透明清算文
- **信頼バッジ:** 非送信 / 非永続 / LRMすき間明示

### group-split

- **主Pain:** 直前欠席で属性バランス崩壊 · Excel再計算地獄
- **型D FAQ:** 名簿非送信 · JSON復元（Keep等）· シード再現 · タップ除外＋同一シード自動再構成
- **信頼バッジ:** 非送信 / 非永続 / シード完全再現

---

## Git / Deploy

```
7858bf8  chore: Pages Free guardrails + Sync keepalive（同日先行 push）
b0bb674  improve: LP型A-D RUNBOOK文案をwarikan・group-splitに反映
```

- **push:** `git push origin main` · 2026-06-26 · 提督依頼
- **CF Pages:** `core` · 自動ビルド（push トリガー）
- **smoke 推奨:** `/warikan.html` · `/group-split` — FV · 3ステップ · FAQ4問

---

## 未着手 / 次

- [ ] 本番 smoke（提督 · ハードリロード）
- [ ] CF Dashboard — 月次ビルド残数（450 ソフト上限）
- [ ] 他ツール LP RUNBOOK（`lp-runs/` に warikan 複製パターン）

---

## 関連 SSOT

- 型定義: [`docs/prompts/kanji-san-lp-patterns-gemini.md`](../../prompts/kanji-san-lp-patterns-gemini.md)
- 入口: [`docs/prompts/lp-runs/README.md`](../../prompts/lp-runs/README.md)
- 製品 changelog: `data/changelog.json`
