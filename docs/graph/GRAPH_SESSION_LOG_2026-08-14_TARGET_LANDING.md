# SUGUDASU Graph — セッション判定ログ（目標3型 · 着地見込み）

**Date:** 2026-08-14  
**Status:** 記録完了（チャット転記ではない · 決定と次工程のみ）  
**Related:** [`GRAPH_TARGET_REPRESENTATION.md`](./GRAPH_TARGET_REPRESENTATION.md) · [`GRAPH_LANDING_FORECAST_PARKING.md`](./GRAPH_LANDING_FORECAST_PARKING.md) · [`GRAPH_STATUS_GATE.md`](./GRAPH_STATUS_GATE.md)

---

## このセッションで固まったこと

### 1. 目標表現（研究済み）→ LOCKED

| ID | 選択 | type | 用途 |
|----|------|------|------|
| T-line | `target_as_line` | Column + 目標線 | Temporal · 定数は全幅水平線 · 変動は polyline |
| T-marker | `target_as_marker` | Bullet | Nominal · 部署ごと目標 |
| T-series | `target_as_series` | Grouped_Column | 実績｜目標並棒 |

- CND-004 は上記3択（目標落とし禁止）
- RLE-009（Temporal）既定 = T-line · RLE-009A（Nominal）既定 = T-marker
- 達成緑/赤の自動発明 = REJECT
- Acceptance: OA-16 / OA-17 / OA-18 · **SVGのみ**（PNG併記廃止）

正本: [`GRAPH_TARGET_REPRESENTATION.md`](./GRAPH_TARGET_REPRESENTATION.md)

### 2. 想定しないもの（本線に混ぜない）

| テーマ | 裁定 |
|--------|------|
| 前年比・前年実績を OA-18 に載せる | **しない**（COMPARISON / MULTI_METRIC 側） |
| 通年目標 × 累計達成（YTD） | **未収録** · 別ジャッジ |
| 着地見込み一式（二重リング·受注残·確度積み上げ·着地ブリッジ等） | **Parking** · Intent にしない |

### 3. 着地見込み（Intent / 必須列）

- **Intent `LANDING_FORECAST` は作らない**（ストーリー族であり単一動詞ではない）
- 必須列は型 A–E に分解（単純計画対実績だけが現行 TARGET と重なる）
- 再開条件・詳細: [`GRAPH_LANDING_FORECAST_PARKING.md`](./GRAPH_LANDING_FORECAST_PARKING.md)

### 4. 実装・運用メモ

- Acceptance export = SVG only（token / 成果物節約）
- 判断系の大規模再設計はしない（Rules への最小追記のみ: RLE-009/009A · CND-004 · confirmation_default 上書き）

---

## 次にやること（順序 · 実行用）

```text
① 本ログ + Parking + Status Gate 更新          ✅
② Acceptance（OA-16 · 17 · 18 · OA-05）       ✅ SVG確認 PASS 2026-08-14
③ RESULTS 記入                                 ✅
④ 既知ギャップ修正（単位ラベル S0）            ✅（OA-05）
⑤ 値ラベル on/off · 半面プレビュー            ✅
⑥ Color Lab（HEX/ピッカー · hub非掲載）      ✅
⑦ 着地 / YTD / Pie は触らない（Parking）
⑧ registry / hub 公開（§1.5 MECE）                   ✅ 配線完了 · 本番 push は DEPLOY_LOG 承認後
```

**次の本線:** 本番反映は DEPLOY_LOG + release:pages:free + push。着地は Parking。
