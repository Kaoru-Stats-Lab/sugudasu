# group-split — Gemini 型D（信頼・FAQ）

**保存先:** `docs/notes/lp-runs/group-split-typeD-gemini-RESULT.md`  
**次:** [`group-split.grok-typeD.md`](group-split.grok-typeD.md)

## 添付

1. 依頼文ブロック
2. [`../tool-facts/group-split.generated.md`](../tool-facts/group-split.generated.md)

## 依頼文

```text
【対象】group-split のみ

【既知の事実】
- 名簿・班結果はサーバー非送信
- localStorage なし · セッションJSON貼り付けで復元
- シード値で再現説明可能（監査PDFは fair-draw 側の話と混同しない）

【出力1: 不安マッピング】
| tool_id | 不安（口語） | 種類 | 重要度 |

【出力2: FAQ 4問】（80字以内）
必須: 名簿送信 · 公平性の説明 · 閉じたら消えるか · 再現性/シード

【出力3: 信頼バッジ】
| tool_id | バッジ1 | バッジ2 | バッジ3 | statements照合 |

【出力4: NGコピー】
| tool_id | NG | 理由 | 代替 |
```
