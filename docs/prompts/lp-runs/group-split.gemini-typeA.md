# group-split — Gemini 型A（痛みの言語化）

**保存先:** `docs/notes/lp-runs/group-split-typeA-gemini-RESULT.md`  
**次（採用時）:** [`group-split.grok-typeA.md`](group-split.grok-typeA.md)  
**事前:** `npm run generate:marketing-context`

## 添付

1. 下「依頼文」ブロック全文
2. [`../tool-facts/group-split.generated.md`](../tool-facts/group-split.generated.md) 全文

---

## 依頼文（コピー開始）

```text
【プロダクト】SUGUDASU（https://sugudasu.com/）
- 登録不要 · ブラウザ完結 · 名簿を預けない
- 約束: https://sugudasu.com/statements

【対象】tool_id=group-split のみ

【製品方針】
- 研修・ブレイクアウトの幹事向け事務ツール（演出ルーレットではない）
- 名簿は非送信 · シードで再現説明 · TSV/Slackコピー
- M02: 結果画面で名前タップ除外→同seedで再構成（実装済み）

【添付】group-split.generated.md

【禁止】礼賛 · 競合名 · Zoom/Slack API連携など未実装の断定

---

あなたは日本語のコピーライター（実務ツール専門）です。表のみ。

【型A】△相当の曖昧さを1行で言語化。

【ペルソナ】P1店長総務 P2研修幹事 P3副業フリーランス

【出力1: Pain一行】
| tool_id | P1 | P2 | P3 | △相当の曖昧さ |

【出力2: ファーストビュー見出し案】
| tool_id | 見出しA | 見出しB | 見出しC | 却下理由 |

【出力3: 幹事あるある】（2シーン）
| tool_id | 場面 | 幹事の頭の声 | 既存手段で止まる理由 | SUGUDASUが切る作業 |

【出力4: Xフック】（2本）
| tool_id | フック（80字以内） | ペルソナ |
```
