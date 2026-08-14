# SUGUDASU Graph — 目標表現の固定（研究済み3型）

**Date:** 2026-08-14  
**Status:** **LOCKED / GO（R1.x）**  
**Intent:** `TARGET_VS_ACTUAL`  
**Confirmation:** `CND-004`  
**Out of scope:** 通年目標×累計達成（YTD）· 達成緑/赤の自動発明 · 累計変換の勝手な生成

---

## 一行

> 目標の見せ方は **目標線 / Bullet / 並棒** の3択に固定する。  
> どれも目標を落とさない（CND-004 invariant）。累計YTDは別ジャッジ。

---

## 3型（MECE）

| ID | 選択 | Graph type | いつ向く | 見た目 |
|----|------|------------|----------|--------|
| **T-line** | `target_as_line` | **Column** | Temporal · 単一主体 · 目標が定数または月次で並ぶ | 実績棒＋**目標線**（定数なら水平1本、変動ならカテゴリを結ぶ線） |
| **T-marker** | `target_as_marker` | **Bullet** | Nominal · 複数部署/KPIが**各自目標** | 横棒＋カテゴリごとの目標ティック |
| **T-series** | `target_as_series` | **Grouped_Column** | 実績と目標を左右で並べたい文化 | 実績棒｜目標棒（目標は中立色） |

### 既定（confirmation_default）

| Rule | 次元 | 既定選択 | recommended_graph |
|------|------|----------|-------------------|
| RLE-009 | Temporal | `target_as_line` | Column |
| RLE-009A | Nominal | `target_as_marker` | Bullet |

ユーザーは CND-004 で他の2型へ変更できる。

### 禁止

| 禁止 | 理由 |
|------|------|
| 目標を落とす素の Column / Bar | Intent と矛盾（rejected: `ignore_target_plain_column`） |
| 達成率からの緑/赤自動割当 | 意味色の発明。GAP は位置・長さで見せる |
| 月次から累計を勝手に作って通年線を載せる | 未研究パターン。Observable/変換の別ジャッジが必要 |

---

## 先行研究との対応

| 研究（`GRAPH_DETERMINISTIC_ENGINE` RLE-008 / PAT-009） | 本固定 |
|------------------------------------------------------|--------|
| Bullet | T-marker |
| Column + Target Line | T-line |
| （実務の並棒） | T-series（CND-004） |

CND-004 旧文案の「目標ライン ON/OFF」は、OFF＝目標落としになるため **廃し**、常に目標を含む3表現へ置換済み。

---

## 実装境界

```text
Observable  has_target（ヘッダトークン）
Decision    RLE-009 / 009A → CND-004
Spec        実績 + target（values[].target または series role=target）
Renderer    type に応じて線 / ティック / 並棒（matched_rule_id 分岐なし）
```

- 定数目標 → 全幅の水平線（Excel「目標値」文化）
- 行ごとに違う目標 → 水平1本に潰さない（線で結ぶ or ティック or 並棒）

---

## Acceptance

| ID | 型 |
|----|-----|
| OA-16 | Bullet（T-marker） |
| OA-17 | Grouped_Column（T-series） |
| OA-18 | Column + Target Line（T-line） |

セッション記録: [`GRAPH_SESSION_LOG_2026-08-14_TARGET_LANDING.md`](./GRAPH_SESSION_LOG_2026-08-14_TARGET_LANDING.md)  
着地（別件）: [`GRAPH_LANDING_FORECAST_PARKING.md`](./GRAPH_LANDING_FORECAST_PARKING.md)

---

## 次にやらない

- YTD / 通年残り注釈つき複合図
- **前年比・前年実績を目標線と同じ図に載せる**（Intent が違う。COMPARISON / MULTI_METRIC / Combination 側。OA-18 の拡張にしない）
- Combination_Column_Line の本実装（R3 HOLD · observed のみ）
- 目標線のラベル吹き出し必須化（Settings 候補）
- Acceptance の PNG 併記（SVG のみ）
