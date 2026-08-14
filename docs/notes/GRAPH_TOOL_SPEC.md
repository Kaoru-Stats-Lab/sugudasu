# SUGUDASU グラフ — ツール仕様（公開面）

**更新:** 2026-08-14  
**id:** `graph` · **productName:** SUGUDASU グラフ  
**stage:** alpha  
**完了モデル:** SVG をクリップボードへコピー（`completion_model: copy_outcome`）

## 1行

Excel（TSV）を貼り、「何を伝えたいか」を選ぶとグラフの形が決まり、色を整えて SVG をコピーする。サーバー非送信。AI 推測なし。

## 正本（設計 · 判断）

ツールページの「なぜこの形か」は `docs/notes/` ではなくグラフ系統の正本に置く。

| 主題 | 正本 |
|------|------|
| 現状ゲート | `docs/graph/GRAPH_STATUS_GATE.md` |
| 目標3型 | `docs/graph/GRAPH_TARGET_REPRESENTATION.md` |
| 着地見込み Parking | `docs/graph/GRAPH_LANDING_FORECAST_PARKING.md` |
| Rules | `docs/graph/GRAPH_RULES.json`（配信コピー `assets/graph-rules.json`） |
| Renderer API | `docs/graph/GRAPH_RENDERER_API.md` |
| 既定色 | `docs/graph/GRAPH_DEFAULT_PALETTE.md` |
| Color Lab（noindex） | `docs/graph/lab/graph-color-lab.html` |

## ユーザーフロー

1. 表を貼る（Excel コピー / TSV）— **起動時は見本表＋実プレビュー**（伝わる見せ方の例）
2. Intent をカード＋ミニ図で選ぶ（種類名ではなく目的）— αでプレビュー可能なのは推移・比較・順位・達成・**単位の違う2指標**
3. プレビューは貼付・Intent変更ですぐ更新 → **SVGをコピー**
4. 達成のときだけ目標の見せ方（線 / Bullet / 並棒）をミニ図付きで選ぶ
5. 単位の違う2指標のときは **上下分離（Small_Multiples）** を推奨表示。重ね2軸（Combination / Dual_Axis）は **α未対応（選択不可）**
6. 主色・強調色・強調項目（変えるとプレビュー更新）
7. ラベル: **項目名** / **軸の数値** / 値ラベル を ON/OFF（目盛り間隔の自由指定は HOLD）

**期待合わせ:** Intent 横のミニ図は装飾見本（Renderer出力ではない）。本番プレビューは常に実パイプライン。内訳・増減要因は R1 未対応のため選択不可（準備中表示）。
**2指標見本:** `年度 / 売上（円） / 利益率（%）` — Intent「単位の違う2指標」で投入。
**コピー:** 「目的を選ぶと形が決まる」＝種類名ではなく、資料で伝わる見せ方が決まる、とリード／FAQで説明（「決定論」等の技術語はユーザー面に出さない）。
**SVG:** パワポ等へ貼れる・ドローソフトでも開ける、を FAQ で明示。貼付後編集は必須にしない。

## 非ゴール（公開 α）

- Graph Editor（要素ごとの塗り分け UI）
- Pie / Donut / Waterfall（R2/R3 HOLD）
- **重ね2軸（Dual_Axis / Combination_Column_Line）** — CND-001 の安全既定は上下分離のみ
- 達成緑・未達赤の自動発明
- 着地見込み Intent
- 貼付後 SVG 編集前提
- 目盛り間隔の自由カスタム

## 計測

`data/tool-job-contracts.json` · inputs: `paste`/`type` · output: `copy`  
着手: `SG_ANALYTICS.bindTextJobStarted` · 完了: `notifyJobDone('copy')`

## 関連

- 表の形式変換のみ → `table-conv`
- Hub 検索語彙 → `data/search-dictionary/graph.json`
