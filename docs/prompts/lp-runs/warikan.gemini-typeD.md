# warikan — Gemini 型D（信頼・FAQ）

**保存先:** `docs/notes/lp-runs/warikan-typeD-gemini-RESULT.md`  
**次（採用時）:** [`warikan.grok-typeD.md`](warikan.grok-typeD.md)  
**事前:** `npm run generate:marketing-context`

## 添付

1. 下「依頼文」ブロック全文
2. [`../tool-facts/warikan.generated.md`](../tool-facts/warikan.generated.md) 全文
3. （任意）https://sugudasu.com/statements · https://sugudasu.com/privacy の要点

---

## 依頼文（コピー開始）

```text
【プロダクト】SUGUDASU · 約束 https://sugudasu.com/statements
【対象】tool_id=warikan のみ

【既知の事実（変更禁止）】
- 金額・人数・傾斜はサーバー非送信（ブラウザ内計算）
- 将来 URL 共有を入れても同方針（現時点 URL 共有は未実装）
- localStorage なし · 閉じると消える · 記録は清算文コピー
- URL/JSON 復元はロードマップ候補
- 100円単位 LRM で一致を目指す。調整のすき間は幹事自腹と決めつけない
- 透明精算文 · 合計一致の画面確認（幹事個人の得が目的ではない）

【添付】warikan.generated.md · trust.typeD 参照

【禁止】100%安全 · 法務断定 · 競合名 · 未実装を「できる」と書く

---

あなたは日本語の信頼設計ライターです。FAQ表のみ。

【型Dの定義】どこに残る・誰に見える・いつ消えるを先に答える。

【出力1: 不安マッピング】
| tool_id | 不安（口語） | 種類(保存/共有/削除/精度/法務) | 重要度 |

【出力2: FAQ 4問】（各Q/A 80字以内 · 未確定は要確認）
| tool_id | Q1 | A1 | Q2 | A2 |
（続けて Q3/A3 · Q4/A4 を同表の列追加 or 2行目表で）

必須テーマ: ①サーバー送信 ②ページを閉じたら ③端数・調整のすき間 ④幹事が得していないか

【出力3: 信頼バッジ】
| tool_id | バッジ1 | バッジ2 | バッジ3 | statements照合 |

【出力4: NGコピー】
| tool_id | NG | 理由 | 代替 |
```
