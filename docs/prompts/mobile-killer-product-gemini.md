# Gemini依頼用: スマホ向けキラープロダクト・ブレスト（SUGUDASU）

**更新:** 2026-06-20  
**用途:** 企画表・比較表・優先度付け **のみ**（実装仕様・記事本文は書かない）  
**前提添付:** `docs/GEMINI_SESSION_SNAPSHOT.md`（必須）· `docs/product/PRODUCT_CONSTITUTION.md` · 任意で `docs/notes/PRODUCT_IDEA_JUDGMENT_LEDGER.md` §2-2〜§3

---

## 使い方

1. 新規 Gemini チャットを開く
2. **`docs/GEMINI_SESSION_SNAPSHOT.md` 全文** を添付
3. 下記 **「Gemini への依頼文」** をコピペ
4. 出力を Cursor に渡し、採否は `PRODUCT_IDEA_JUDGMENT_LEDGER.md` で突合 → `BACKLOG.md` に反映

---

## Gemini への依頼文（コピペ用）

```text
あなたは個人開発・実務系Webプロダクトのプロダクトプランナーです。
礼賛・前置き不要。「画期的」「革命的」「最強」「No.1」禁止。
記事本文・HTML・コードの執筆は一切しない。企画表と論点整理のみ。

【役割】
SUGUDASU の **スマホ向けキラープロダクト** をブレストし、優先順位付きの候補表を出す。

【添付コンテキスト】
GEMINI_SESSION_SNAPSHOT.md に現状ツール・憲法・直近成果を記載済み。
Desktop-first（invoice 等）と mobile-first（fair-draw 等）の境界も記載。

【憲法 — 破る案は「別プロダクト」欄へ】
- 登録不要 · ブラウザ内完結 · 機密データ非送信（F2）
- Cloudflare Pages 静的 · DB/WebSocket なし（F3）
- ストア課金・サブスクアプリ化はスコープ外
- 法令・税務の断定禁止（景表は fair-draw 同様、ルール表+免責）

【モバイルの定義（本ブレスト）】
次の **すべて** を満たす案を「スマホキラー」候補とする:
1) 幹事/実務者が **スマホだけ** で入力→結果→コピー/共有まで完結できる
2) **3分以内** に初回価値（Day0）
3) 既存ツール群と **導線または差別化** が説明できる（孤立1ページは△）
4) SEO または SNS/口コミで **検索意図 or 拡散** が1文で言える

【既にモバイル寄りの実装 — 重複案は「既存拡張」に分類】
- fair-draw: スマホ即抽選 · 景表チェック · 証跡PDF · チャットコピー
- warikan: LINE精算文 · 幹事
- receipt: スマホPDF/URL
- group-split: PC名簿が主 · 会場共有がモバイル接点

【評価軸 — 各案に ◎○△× で採点】
A. SUGUDASU適合（F1–F7 要約）
B. モバイル完結度（片手操作 · 貼付 · カメラ · 共有シート）
C. 市場（検索意図 · コモディティ度 · 差別化1文）
D. 収益整合（AdSense · Amazon · 幹事ニッチ）
E. 実装コスト感（小/中/大 — 具体日数は捏造しない）

【タスク】
§1 スマホキラー候補を **8〜12案** 出す（新規 + 既存拡張の両方）
§2 各案を上記 A–E で採点し、**Tier S/A/B** を付与
§3 **Top3** について「なぜスマホで勝てるか」「Desktop-first 帳票と競合しない理由」を各5行以内
§4 **却下リスト** 3件（スコープ外だが検索ボリュームが大きい罠）
§5 次アクション（提督が Cursor で検証すべきこと）を **5 bullet**

【出力フォーマット — この見出しのみ】

#### §1 候補一覧表
| ID | 案名（15字以内） | 新規/拡張 | 主ペルソナ(P-A/B/C) | モバイル完結シナリオ（1行） | Tier |

#### §2 採点マトリクス
| ID | A適合 | Bモバイル | C市場 | D収益 | Eコスト | 差別化1文 |

#### §3 Top3 深掘り
（案名 · 5行 × 3）

#### §4 却下リスト（罠）
| 案 | 却下理由（憲法 or コモディティ） |

#### §5 Cursor 検証 TODO
- bullet 5件

【禁止】
- 未実装機能を「既にある」と書かない
- 利用者数・PV・売上の捏造
- ネイティブアプリ・サブスク課金を正案にしない
- Zoom/Teams 自動連携などサーバー同期必須案を Tier S にしない
- 競合サービスの名指し貶し
```

---

## 添付ブロック（任意 · 依頼文の直後）

```text
【changelog 直近5件 — 事実のみ】
- group-split UX C1（Step · 名簿ピッカー · preset）
- group-split Phase C（Excel列 · 属性 · cap250）
- group-split Phase B（制約 · 超過表示）
- group-split Phase A リリース
- webp-to-jpg 非送信変換

【Ledger から未実装 Tier S】
- T13 イベント進行タイムライン（時間連動再計算 · shift と親和）

【店長の関心（ヒント · 断定しない）】
- イベント当日の **欠席・やり直し**（group-split Resilience）
- 懸賞・キャンペーン幹事（fair-draw GTM）
- 「スマホで箱の代わり」は fair-draw で着手済 — **次のモバイル空白** を探したい
```

---

## 出力後の Cursor 側手順

1. §2 の ◎/× が `PRODUCT_CONSTITUTION.md` と `PRODUCT_IDEA_JUDGMENT_LEDGER.md` §2-2に矛盾しないか突合
2. Tier S 案があれば `docs/notes/<TOOL>_TOOL_SPEC.md` 骨子を新規 or Backlog §1 に追記
3. 「既存拡張」は新規 HTML より **fair-draw / warikan / group-split のモバイル UX** タスク化を優先検討
4. Gemini 出力は **そのまま公開しない**

---

## 変更履歴

| 日付 | 内容 |
|------|------|
| 2026-06-20 | Gemini ブレスト結果 → `docs/notes/MOBILE_KILLER_GEMINI_RESULT.md` |
| 2026-06-20 | 初版（group-split push 後 · Resilience 整理反映） |
