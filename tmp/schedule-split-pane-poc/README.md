# Schedule 分割ペイン PoC — Phase A

Notion「タイムライン + テーブル」の UI 殻。§3-2.1 提督確定を反映。

**仕様正本:** [`docs/notes/SCHEDULE_SPLIT_PANE_POC_SPEC.md`](../../docs/notes/SCHEDULE_SPLIT_PANE_POC_SPEC.md)

## 起動

```bash
npm run poc:schedule-split-pane
```

→ http://localhost:8092/tmp/schedule-split-pane-poc/

## §3-2.1 対応（PoC）

| 機能 | 説明 |
|------|------|
| **提出 / 現場** | `viewState.activePreset` · ops行・ops列をマスク |
| **依存連動** | `viewState.dependenciesEnabled` 既定 **OFF** · ON で `maintain_gap`（Q-INS-01 A） |
| **提出用PDF** | `preset=submit` 固定プレビュー + 印刷（黒文字・黒罫線） |
| **画面印刷** | `@media print` — ライト/ダーク問わず黒文字・黒罫線 |
| **はみ出し警告** | ops行が親提出行の期間外 → バナー + 橙枠（親は伸長しない） |
| **数量列** | `properties[].tier=ops` · 現場ビューのみ |

## 印刷チェック

```bash
node tmp/schedule-split-pane-poc/verify-print.mjs
```

手動: ライト / ダーク各で Ctrl+P と「提出用PDF」— 文字・罫線が黒であること。

## サンプル

- 第1工区のみ: `重機入場（BH）`（site · はみ出し）· `資材納入`（site · 期間内）

計画: `docs/notes/SCHEDULE_V3_MASTER_PLAN.md` §3-2.1

議論ログ: [`docs/notes/SCHEDULE_SPLIT_PANE_DECISION_LOG.md`](../../docs/notes/SCHEDULE_SPLIT_PANE_DECISION_LOG.md)
