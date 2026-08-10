# SUGUDASU Graph — Presentation Output Constitution

**Status:** Formal · Fixed  
**Date:** 2026-08-08  
**Audience:** Renderer / UX / Product  
**Judgment stack:** CLOSED（変更禁止）  
**Renderer:** R1 解禁（Bar / Column / Line のみ）

> Excel から貼って、Intent を選び、必要なら最小限の表示調整をして、約3分以内にプレゼンへ貼れる品質のグラフを完成させる。  
> **ユーザーにグラフ編集作業をさせない。**

成功条件は「編集可能性の最大化」ではない。

> **そのまま資料に貼れる 80〜90 点のグラフ**

---

## POC-001 — Graph Spec が意味を決める

Renderer はグラフの意味を判断してはいけない。

```text
Graph Spec → SVG / PNG
```

禁止:

- Rule 再判定
- Intent 推定
- Observable 再解釈
- グラフタイプの再選択
- データ変換
- Unit 推定
- 色の意味推論
- 自動的な Spec 修正
- **`matched_rule_id` による分岐**（特に禁止）

---

## POC-002 — SVG を主出力とする

高品質出力。PowerPoint / Keynote / デザイナー二次加工 / 印刷 / パンフレット / 高解像度 / ベクター資産。

SVG は「完全編集可能なグラフデータ」を目的としない。  
**完成したグラフィック資産として出力する。**

---

## POC-003 — PNG を汎用出力とする

Google Slides / PowerPoint / Keynote / その他 Office / 汎用コピー＆ペースト向け安定出力。  
SVG と PNG の両方を提供する。

---

## POC-004 — Graphic Layer / Text Layer の論理分離

```text
Graph Output
│
├── Graphic Layer
│   ├── axis · grid · bars · columns · lines · markers
│   ├── baseline · target · fill · stroke · opacity · geometry
│
└── Text Layer
    ├── title · axis labels · category labels · unit
    ├── legend · data labels · source
```

「SVG から文字を全部排除」ではない。  
図形と文字を論理分離し、二次編集・レイアウト変更に耐える構造にする。  
ユーザーが SVG 内部をレイヤー編集する UI は提供しない。

### SVG に含めてよいもの（図形中心）

plot area · axis · tick · grid · bar · column · line · marker · area · baseline · target · data point · fill · stroke · stroke-width · opacity · shape geometry

### SVG に原則含めないもの（資料固有文）

グラフタイトル · 出典 · 長文注釈 · 説明文 · プレゼン固有の文章

軸ラベル・カテゴリラベル等、意味成立に必要な文字は Text Layer として分離して扱う。

---

## POC-005 — Presentation Settings（Decision の外）

```text
Decision → Graph Spec → Presentation Settings → Spec Validator → Renderer
```

候補: series/accent/baseline/target color · line width · solid/dashed · title/legend/unit/data labels/grid on/off · 表示単位・位置・表示倍率

**単位の意味推定は Settings では行わない**（Observable / Decision / Spec が与える）。

---

## POC-006 — 編集性の境界（やらない）

PowerPoint / Slides / Keynote 完全互換編集 · Illustrator 的ノード編集 · SVG path editor · 自由配置テキスト · 高度な凡例レイアウト · Office/PPTX/EMF 生成 · グラフ内自由オブジェクト編集 · ユーザーによる Rule/Decision 変更

理由: 「3分で終わる」から「簡易 Illustrator」へ逸脱するため。

---

## POC-007 — UX フロー

```text
Excel → copy → SUGUDASU → paste → Intent
  → Graph → （必要なら色・線・表示の微調整） → Copy / Download
```

---

## POC-008 — デザイナーとの二層

デザイナーを置き換えない。デザイナーがいなくても十分使えるまで自動で持っていく。  
関与する場合は SVG を渡して二次加工できる。

対象に含まれる: 営業 · 経営者 · 経理 · IR · 管理職 · 中小企業担当 · 毎回デザイナー依頼できない担当者

---

## POC-009 — 出力品質の優先順位

1. 正確性  
2. 再現性  
3. 可読性  
4. SVG 品質  
5. PNG 品質  
6. 編集・二次利用性  
7. 装飾性  

「かっこよさ」は最後。

---

## 責務境界（再掲）

| 層 | 責務 |
|----|------|
| Decision Engine | 何を描くか決める |
| Graph Spec Builder | どう描くかを機械仕様化する |
| Spec Validator | 描いてよいか検査する（修正しない） |
| Renderer | 決められたものを忠実に描く |

関連: [`GRAPH_RENDERER_API.md`](./GRAPH_RENDERER_API.md) · [`GRAPH_RENDERER_R1_PLAN.md`](./GRAPH_RENDERER_R1_PLAN.md) · [`GRAPH_STATUS_GATE.md`](./GRAPH_STATUS_GATE.md)
