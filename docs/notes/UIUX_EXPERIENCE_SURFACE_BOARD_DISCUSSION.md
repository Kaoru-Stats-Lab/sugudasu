# S-SURFACE — Visual Hierarchy / Surface（経営会議決議）

**日付:** 2026-08-05  
**状態:** **決議済み**  
**未決ID:** S-SURFACE → **Closed**（実装は S-PILOT 範囲のみ · 一括は引き続き禁止）  
**親:** Experience Implementation Review · [`UIUX_EXPERIENCE_CONSTITUTION_AGENDA.md`](UIUX_EXPERIENCE_CONSTITUTION_AGENDA.md)  
**合成:** [`uiux-experience-research/SYNTHESIS_SURFACE_HIERARCHY.md`](uiux-experience-research/SYNTHESIS_SURFACE_HIERARCHY.md)  
**HOW 昇格:** [`UIUX_EXPERIENCE_IMPLEMENTATION_CONTRACT.md`](UIUX_EXPERIENCE_IMPLEMENTATION_CONTRACT.md) §2.4 · [`../DESIGN_GUIDELINE.md`](../DESIGN_GUIDELINE.md) §2.3.1

> Agent: **色一括 · カード廃止 · Hub/全ツール Surface 一括は禁止。** 許可は **S-PILOT（Hub 検索面の一段上げ）のみ**。  
> AI の「C案」は同名異物だったため、票はオプションIDで固定した（多数決しない）。

---

## 0. Framing（確定）

**Pain:** のっぺり（白カード同型）で Orient / Locate / Operate の境界が知覚しにくい。  
**採択方針:** 色より先に Surface 役割。パターン・コンポーネントは流用。Hub IA（検索ファースト · ADR-0003）は壊さない。

---

## 1. 確認票（両AI一致 → **Keep**）

| ID | 提案 | 票 | 昇格 |
|----|------|-----|------|
| **S-Q3** | Surface / VH は **HOW**（憲法級にしない） | **Keep** | 契約 §2.4 · E-CONST 整合 |
| **S-NO-COLOR** | 色トークン一括再定義は **後段** | **Keep** | 判断ログ |
| **S-NO-CARD-KILL** | Hub カード **廃止しない** | **Keep** | Hub IA 維持 |
| **S-NO-ELEV** | 多層ドロップシャドウで階層を作らない | **Keep** | DESIGN §2.3.1 |

---

## 2. Q1 Hub Locate 核 — **採択**

| # | 問い | 採択 |
|---|------|------|
| H1 | Hub Locate 核 | **Q1-A＋**（下記） |
| H2 | よく使うカードを核 | **採らない** |

### Q1-A＋（定義）

1. **IA 正本は検索ファースト維持**（`HUB_IA_REFRESH_V2` · 発見優先順位 検索→カテゴリ→お気に入り→最近→人気）  
2. **Surface:** 検索欄だけ Locate-**core**（Workspace 級に一段上げ）。カテゴリ / 最近は Locate-**assist**（検索と同列にしない）  
3. **カード一覧は同型のまま**（一覧性）。カード間に視覚ヒエラルキーを付けない  
4. **Q1-C「同列バンド」は不採択**（検索ファーストを希釈する）  
5. **Q1-G タスク文脈アコーディオンは Defer**（Hub IA / ADR 改訂が先。本議題の Surface ではやらない）

**根拠:** 既存 IA を壊さず saliency だけ直す。工具箱＝「名前で探す」が主、段は補助。

---

## 3. Q2 Orient — **採択**

| # | 問い | 採択 |
|---|------|------|
| O1 | Orient 提示ルール | **Q2-split-C を方針** · 実装は **Q2-A-default からパイロット** |
| O2 | Orient の主目的 | **両方**（帳票＝提出ミス予防 · 変換等＝非送信安心はリード/信頼帯で足りることが多い） |

### 方針表（product_voice 対応）

| product_voice | リード以外の使い方・長い Orient | 備考 |
|---------------|--------------------------------|------|
| `formal_document` | **初回だけ開く**（以降折る）を目標 | 提出ミス予防 |
| `fast_utility` | **常に折る**（？で開く） | Transform 短時間 |
| `visual_workbench` | **常に折る** or Workspace 横に最小 | 面積優先 |
| `board_planning` | 常に折る（必要なら初回） | |
| `ephemeral_pad` | 常に折る | |

**固定:** `sg-tool-lead` の What（§4.1）は **折らない**。折る対象は使い方カード・長い How ブロック。  
**実装順:** まず **常に折る＋？**（Q2-A-default）を代表ツールで試し、問題なければ split-C へ寄せる。LocalStorage 必須化は急がない。

**Q2-split-G（帳票を常に折る / 変換を初回）は不採択**（帳票の初回 Orient 価値を落とす）。

---

## 4. モード必須表 — **採択**

| モード | Hub | Product |
|--------|-----|---------|
| **Orient** | **任意** | **任意**※ |
| **Locate** | **必須** | **任意** |
| **Operate** | **禁止** | **必須** |
| **Confirm** | **禁止** | **必須** |

※ Product の `sg-tool-lead` What は契約 §4.1 で **必須**（Surface モードの「Orient 箱」とは別）。追加の使い方箱は上表 Q2。

| # | 問い | 採択 |
|---|------|------|
| M1 | Hub Orient | **任意**（Hero を必須箱にしない · Calm） |
| M2 | Product Locate | **任意**（関連ツール等を禁止しない） |
| M3 | Hub Operate/Confirm | **禁止**（Hub＝探す / Product＝使う · ADR-0003） |

---

## 5. パイロット — **採択**

| ID | 採択 |
|----|------|
| **S-PILOT** | **Hub 先** — 検索面の一段上げ（背景Δ・余白・境界）。カード見た目・色トークン・カテゴリアコーディオンは **触らない** |

代表ツール Orient 折りたたみは Hub パイロット検証後の第2弾。

---

## 6. 尖り — **すべて却下**（明示票）

| 尖り | 票 |
|------|-----|
| Hub を CUI のみ | **Reject** |
| 説明完全廃止 | **Reject** |
| 1px 黒枠のみで階層 | **Reject**（試作メモ可 · 採用しない） |
| Hub カード説明ほぼ削除 | **Reject**（blurb SSOT と別議題） |
| 最近使っただけで Hub | **Reject** |
| Hub 戻る導線を極端に弱く | **Reject** |

---

## 7. 各員見解（要約 · 決議根拠）

| 役割 | 見解 |
|------|------|
| **認知科学** | saliency が先。Hub は Orient 任意・Locate 必須でモードが立つ |
| **シニアUIUX** | カード同型は一覧の正義。差は検索 vs 一覧に置く |
| **CPO** | IA を壊す Q1-G は別 ADR。本議題は Surface |
| **CMO** | Hero 必須箱化は広告バナー化リスク → Orient 任意 |
| **CTO** | HOW 契約 + Hub パイロットのみ。一括・影・色は禁止維持 |

---

## 8. Agent 禁止（決議後も）

- Hub / 全ツールの Surface・カード・Primary **一括** PR  
- Q1-G アコーディオンの先走り（Hub IA 未改訂）  
- 憲法への Surface 昇格  
- S-PILOT 範囲外の「のっぺり解消」実装

**許可:** Hub 検索の一段上げ（S-PILOT）のみ。完了後に判断ログへ結果を追記してから横展開票。
