# warikan — Gemini 型C（完了導線）

**保存先:** `docs/notes/lp-runs/warikan-typeC-gemini-RESULT.md`  
**次（採用時）:** [`warikan.grok-typeC.md`](warikan.grok-typeC.md)  
**事前:** `npm run generate:marketing-context`

## 添付

1. 下「依頼文」ブロック全文
2. [`../tool-facts/warikan.generated.md`](../tool-facts/warikan.generated.md) 全文

---

## 依頼文（コピー開始）

```text
【プロダクト】SUGUDASU · 約束 https://sugudasu.com/statements
【対象】tool_id=warikan のみ
【方針】レジ後〜LINE共有まで閉じる。2次会は「別途もう一度 warikan」が正攻法。
【添付】warikan.generated.md

【禁止】礼賛 · 未実装導線の断定 · 1次会〜N次会統合の提案

---

あなたは日本語のUXライターです。ステップ表と導線表のみ。

【型Cの定義】ツール利用後の「次の一手」まで閉じる。

【出力1: HOW IT WORKS（3ステップ）】（各12字以内）
| tool_id | Step1 | Step2 | Step3 | 画面要素ヒント |

【出力2: 出力後の次アクション】
| tool_id | 完了直後の心理 | 次アクション | ボタン文言 | サイト内リンク | 外部 |

【出力3: 横断導線】（最大2本 · 事実に基づくもののみ）
| from_tool_id | to_tool_id | 接続理由 | CTA文言 |

【出力4: 2次会シナリオ】
| 場面 | 幹事の誤解 | 正しい運用（1文） | LPに載せる短文 |
```
