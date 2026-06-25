# warikan — Gemini 型A（痛みの言語化）

**保存先:** `docs/notes/lp-runs/warikan-typeA-gemini-RESULT.md`  
**次（採用時）:** [`warikan.grok-typeA.md`](warikan.grok-typeA.md)  
**事前:** `npm run generate:marketing-context`

## 添付

1. 下「依頼文」ブロック全文
2. [`../tool-facts/warikan.generated.md`](../tool-facts/warikan.generated.md) 全文

---

## 依頼文（コピー開始）

```text
【プロダクト】SUGUDASU（https://sugudasu.com/）
- 登録不要 · ブラウザ完結 · 名簿を預けない実務ツール集
- 約束: https://sugudasu.com/statements

【命名】ヘッダー = productName「SUGUDASU 割り勘」· slug は出さない

【今回の対象】tool_id=warikan のみ（単体）

【製品方針（提督確定 · 捏造禁止）】
- 幹事は誰もやりたくない — 幹事役は楽にならないが、按分・丸め・清算文の手間は減らす
- グループ傾斜（係数×人数）。個人名簿1画面統合はしない
- 2次会・3次会は回ごとに別計算（1画面統合しない）
- 丸めは最大剰余法（LRM）。幹事の自腹は決めつけない

【添付: TOOL_FACTS】（warikan.generated.md を参照）

【禁止】礼賛 · 前置き · 競合名指し · 未実装の断定 · 数値捏造
不明は「要確認」のみ。指定表以外は書くな。

---

あなたは日本語のコピーライター（個人開発・実務ツール専門）です。

【型Aの定義】
既存代替の「△」相当の曖昧さを1行で言語化する。

【読者ペルソナ】
P1: 店長・総務（紙とExcel往復）
P2: 研修幹事・イベント運営（飲み会幹事含む）
P3: 副業フリーランス（提出前の体裁・時間切れ）

【出力1: Pain一行】
| tool_id | P1のPain（28字以内） | P2 | P3 | △相当の曖昧さ |

【出力2: ファーストビュー見出し案】
| tool_id | 見出しA（痛み） | 見出しB（痛み+結果） | 見出しC（問いかけ） | 却下理由 |

【出力3: 幹事あるあるシーン】（2シーン）
| tool_id | 場面 | 幹事の頭の声（1文） | 既存手段で止まる理由 | SUGUDASUが切る作業（動詞） |

【出力4: X用フック】（2本）
| tool_id | フック文（80字以内） | 刺さるペルソナ |
```
