# warikan — LP型 実行順（1プロンプトずつ）

**全8ステップ:** Gemini 型A → Grok 型A → Gemini 型B → Grok 型B → Gemini 型C → Grok 型C → Gemini 型D → Grok 型D  
**結果保存:** `docs/notes/lp-runs/warikan-type{X}-{gemini|grok}-RESULT.md`

---

## ステップ1 / 8 — **Gemini** · 型A（痛み）

**状態:** ✅ 完了（2026-06-23）  
**保存先:** `docs/notes/lp-runs/warikan-typeA-gemini-RESULT.md`

### 投げ先

**Gemini**（Grok ではない。Grok はステップ2で Gemini の返答を貼ってから）

### コピペ用プロンプト（このブロック全体）

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

【TOOL_FACTS · warikan · status=reviewed】
SUGUDASU 割り勘 / https://sugudasu.com/warikan
Pain: 傾斜はわかっているのに丸めたら合計がズレ、幹事が悪者になる
△相当: 2次会・3次会は任意参加なのに、1本の表にまとめて計算しようとする手間
聞き直し例: 「2次会に来る人だけ、もう一回割り勘すればいいのに…」
実装: 傾斜係数モード · 合コン固定額モード · 端数丸め（LRM）· 調整のすき間表示
実装: LINE/Slack清算文コピー · 多めのご負担へのお礼 · 個別に聞かれたとき即答文
未実装: 1画面に全回統合 · localStorage · URL入力共有（ロードマップ候補）
データ: サーバー非送信 · 閉じると消える · 記録は清算文コピー

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

### Gemini 返答

→ `docs/notes/lp-runs/warikan-typeA-gemini-RESULT.md` に保存済み

---

## ステップ2 / 8 — **Grok** · 型A

**状態:** ✅ 完了（2026-06-23）  
**保存先:** `docs/notes/lp-runs/warikan-typeA-grok-RESULT.md`

---

## ステップ3 / 8 — **Gemini** · 型B（削減されるやり取り）

**状態:** ✅ 完了（2026-06-23）  
**保存先:** `docs/notes/lp-runs/warikan-typeB-gemini-RESULT.md`

---

## ステップ4 / 8 — **Grok** · 型B

**状態:** ✅ 完了（2026-06-23）  
**保存先:** `docs/notes/lp-runs/warikan-typeB-grok-RESULT.md`

---

## ステップ5 / 8 — **Gemini** · 型C（完了導線）

**状態:** ✅ 完了（2026-06-23）  
**保存先:** `docs/notes/lp-runs/warikan-typeC-gemini-RESULT.md`

---

## ステップ6 / 8 — **Grok** · 型C

**状態:** ✅ 完了（2026-06-23）  
**保存先:** `docs/notes/lp-runs/warikan-typeC-grok-RESULT.md`

---

## ステップ7 / 8 — **Gemini** · 型D（信頼・FAQ）

**状態:** ✅ 完了（2026-06-23）  
**保存先:** `docs/notes/lp-runs/warikan-typeD-gemini-RESULT.md`

---

## ステップ8 / 8 — **Grok** · 型D（最終）

**状態:** ✅ 完了（2026-06-23） · **HTML反映済**  
**保存先:** `docs/notes/lp-runs/warikan-typeD-grok-RESULT.md`

---

## RUNBOOK 完了後

1. `docs/notes/lp-runs/warikan-*-RESULT.md` 8本 — ✅ 保存済
2. 採用文案 — ✅ `tools/warikan.html`（FV · 3ステップ · 信頼バッジ · FAQ · JSON-LD）
3. `data/changelog.json` — 反映時に追記 · commit/push は提督判断
