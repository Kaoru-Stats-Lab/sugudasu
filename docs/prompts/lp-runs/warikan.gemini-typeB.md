# warikan — Gemini 型B（削減されるやり取り）

**保存先:** `docs/notes/lp-runs/warikan-typeB-gemini-RESULT.md`  
**次（採用時）:** [`warikan.grok-typeB.md`](warikan.grok-typeB.md)  
**事前:** `npm run generate:marketing-context`

## 添付

1. 下「依頼文」ブロック全文
2. [`../tool-facts/warikan.generated.md`](../tool-facts/warikan.generated.md) 全文

---

## 依頼文（コピー開始）

```text
【プロダクト】SUGUDASU · 約束 https://sugudasu.com/statements
【対象】tool_id=warikan のみ
【方針】機能ではなく「消える連絡・手戻り」。幹事の手間削減が主眼。
【添付】warikan.generated.md（実装済みのみ断定可）

【禁止】礼賛 · 競合名 · 未実装断定 · 数値捏造

---

あなたは日本語のプロダクトマーケターです。比較表中心。前置き不要。

【型Bの定義】機能ではなく「消える連絡・手戻り」を売る。

【出力1: 削減タスク表】（3行）
| tool_id | Before（担当者の作業） | After | 削減される連絡の典型文 |

【出力2: ベネフィット翻訳表】
| tool_id | 機能（事実のみ） | ユーザーが言う価値（口語） | LP一文（32字以内） | 載せない理由 |

【出力3: 差分見出し】（5項目 · TOOL_FACTS/registry のみ根拠）
| tool_id | # | 差分見出し（12字以内） | 説明（60字以内） | 根拠 |

【出力4: サブコピー3層】（各28字以内）
| tool_id | 層1:痛み | 層2:減る手間 | 層3:始め方 |
```
