# Schedule Gantt PoC（frappe-gantt）

親チャート ∞ · 子チャート ∞ · 親色から子シェード · HEX/RGB/透過

## 起動

```bash
npm run poc:schedule-gantt
```

ブラウザ: **http://localhost:8090/tmp/schedule-gantt-poc/**

## できること

- 親チャートを無制限追加（既定パレット 6 色 or カスタム HEX/rgb/rgba or 透過）
- 選択した親に子チャートを無制限追加（色は親系統シェード · 個別上書き可）
- 親ブロックごとに frappe-gantt 1 本（先頭行=親サマリ · 以下=子）
- 読み取り専用（`readonly: true`）

## ファイル

| ファイル | 役割 |
|----------|------|
| `lib/colors.mjs` | パレット · HSL シェード · 透過判定 |
| `lib/model.mjs` | 親子モデル → frappe tasks |
| `lib/render.mjs` | DOM 描画 |
| `app.mjs` | UI 操作 |

仕様: `docs/notes/SCHEDULE_TOOL_SPEC.md` §14
