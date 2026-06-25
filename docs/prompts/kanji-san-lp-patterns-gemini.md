# 幹事さん分析 → SUGUDASU LP型プロンプト（Gemini SSOT）

**更新:** 2026-06-22  
**ROLE 索引:** [`editorial-roles-gemini.md`](editorial-roles-gemini.md)  
**協業ガイド:** [`GEMINI_COLLABORATION_GUIDE.md`](GEMINI_COLLABORATION_GUIDE.md)  
**運用 Backlog:** [`../BACKLOG.md`](../BACKLOG.md) **§14-9**

---

## 0. 背景と思想

### なぜ幹事さん型を借りるか

[幹事さん](https://kanji-san.com/)（日程調整）が効いているのは機能の多さではなく、**既存代替の「△」を言語化し、聞き直しコストを消す**構造にある。

| 幹事さんの核 | SUGUDASUへの翻訳 |
|--------------|------------------|
| △の聞き直しが消える | 各ツールの「曖昧な手作業」を1行Painにする |
| 5段階回答 | 機能列挙ではなく「削減されるやり取り」を売る |
| 店予約・カレンダーまで接続 | 出力後の次アクションまで閉じる |
| 編集可・共有範囲・保持期間 | 信頼FAQで意思決定を速める |

**競合名指し批判は禁止。** 構造（型A-D）だけ借りる。

### SUGUDASUのポジション（コピー前提）

- 登録不要 · ブラウザ完結 · 名簿を預けない
- 約束: https://sugudasu.com/statements
- 個別ツールは「1 Pain · 1 Tool」— ポータル羅列LPにしない

### プロダクト増加への冗長性設計

| 層 | 正本 | 役割 | 更新タイミング |
|----|------|------|----------------|
| **実装** | `data/tool-registry.json` | id · productName · stage · statusNote | ツール実装・昇格時 |
| **マーケ行列** | `data/lp-marketing-matrix.json` | Pain · 型A-D · 束 · △問題 · Top3 | 企画・Gemini振り分け後 |
| **事実添付** | `data/tool-facts/{tool_id}.json` | 人間レビュー済み事実（1ツール1ファイル） |
| **事実生成** | `docs/prompts/TOOL_FACTS.generated.md` | 上記 + registry + matrix から自動 |
| **行列添付** | `docs/prompts/LP_MARKETING_MATRIX.generated.md` | matrix から自動 | `npm run generate:lp-matrix` |
| **結合添付** | `docs/prompts/GEMINI_MARKETING_CONTEXT.generated.md` | 上記2つを結合 | `npm run generate:marketing-context` |
| **プロンプト型** | **本ファイル** | 型0/A/B/C/D · Grok第2パス | 型の定義変更時のみ |
| **ツール別コピペ** | **`docs/prompts/lp-runs/`** | 1ツール×1型の Gemini/Grok 依頼文 | ツール追加時に warikan を複製 |

**原則:** ツールが増えても **本ファイルのプロンプト型は書き換えない**。増えるのは JSON と生成物だけ。

```bash
# 新規ツール追加後 · Gemini回す前に必ず
npm run scaffold:tool-facts   # 未作成 JSON を骨格生成
# 1ツールレビュー後
npm run generate:marketing-context
```

---

## 1. マーケティングマトリクス（§1-§4）

手動正本: `data/lp-marketing-matrix.json`  
自動出力: [`LP_MARKETING_MATRIX.generated.md`](LP_MARKETING_MATRIX.generated.md)

`registryStatus: planned` は **未実装ツール**（Gemini出力に「要確認」を強制）。

---

## 2. Gemini セッション設計（並列6本）

| # | プロンプト | 入力 `{TOOL_BUNDLE}` 例 | Grok |
|---|-----------|-------------------------|------|
| 1 | **型0** 振り分け | 全ツール（matrix §1参照） | 不要 |
| 2 | **型A** 痛み | 幹事イベント束 | Grok-A |
| 3 | **型A** 痛み | 帳票束 | Grok-A |
| 4 | **型B+C** | 幹事イベント束 | Grok-B · Grok-C |
| 5 | **型B+C** | 事務効率化束 | 同上 |
| 6 | **型D** | 対象束 or 全live | Grok-D |

**1セッション = 1役割 · 1型 × 1束**（`GEMINI_COLLABORATION_GUIDE` 鉄則）

---

## 3. 共通添付ブロック（全プロンプトの先頭）

```text
【プロダクト】SUGUDASU（https://sugudasu.com/）
- 登録不要 · ブラウザ完結 · 名簿を預けない実務ツール集
- 約束: https://sugudasu.com/statements
- プライバシー: https://sugudasu.com/privacy

【命名】
- ヘッダー表記 = productName（例: SUGUDASU 班分け）
- ナビ = navLabel（例: 班分け）
- slug / tool_id はユーザー向けコピーに出さない

【今回の対象ツール束】{TOOL_BUNDLE}
例: 幹事イベント束 = warikan, group-split, timeline, fair-draw, present

【添付1: TOOL_FACTS】（GEMINI_MARKETING_CONTEXT.generated.md からコピー）
【添付2: LPマトリクス §3 △問題】（該当 tool_id 行のみ抜粋可）

【参照した競合の型（名指し禁止）】
- 幹事さん型: △の聞き直し削減 · 5段階回答 · 完了後導線 · 信頼FAQ

【禁止】
- 礼賛 · 前置き · 「はじめに」
- 競合サービス名の名指し
- registryStatus=planned の機能を実装済みと断定
- 利用者数 · 売上 · 効果の数値捏造
- 「100%安全」「業界No.1」
- 指定フォーマット以外の長文エッセイ

出力は指定表のみ。説明文・総括・励ましは書くな。
不明な事実はセルに「要確認」とだけ書け。
```

---

## 4. 型0 — 振り分け（優先度マトリクス）

**Geminiの得意:** 表 · 優先度 · 束の再編案

```text
あなたは日本語の個人開発マーケター兼編集プランナーです。
礼賛・前置き不要。指定フォーマットのみ出力。

【タスク】
添付の LP マトリクス §1 を読み、{TOOL_BUNDLE} 内ツールについて
型A-Dのうち「LP改善で最初に回すべき型」を優先度付けせよ。
registryStatus=planned は「要確認」列を必ず設ける。

【出力1: 優先度表】
| tool_id | productName | registry | 主Pain | 最優先の型 | 理由（40字以内） | 実装難易度 |

【出力2: ツール束の見直し案】
| 束名 | 含むtool_id | 共通ペルソナ | 先に回す順 | 変更理由 |

【出力3: △問題の追加候補】
| tool_id | 追加すべき△曖昧さ | 幹事の聞き直し1文 | 根拠 |

【出力4: 今週Top3の更新案】
| 順位 | tool_id | 型 | 期待KPI | 提督が確認すべき事実1つ |
```

---

## 5. 型A — 痛みの言語化

```text
あなたは日本語のコピーライター（個人開発・実務ツール専門）です。
礼賛・前置き不要。表と短文のみ。

【型Aの定義】
既存代替の「△」相当の曖昧さを1行で言語化する。
幹事さんの「△って結局なんなの？」と同型。

【対象】{TOOL_BUNDLE}

【読者ペルソナ（3種固定）】
P1: 店長・総務（紙とExcel往復）
P2: 研修幹事・イベント運営（当日トラブル回避）
P3: 副業フリーランス（提出前の体裁・時間切れ）

【出力1: Pain一行マトリクス】
| tool_id | P1のPain（28字以内） | P2 | P3 | △相当の曖昧さ |

【出力2: ファーストビュー見出し案】
| tool_id | 見出しA（痛み） | 見出しB（痛み+結果） | 見出しC（問いかけ） | 却下理由 |

【出力3: 幹事あるあるシーン】
| tool_id | 場面 | 幹事の頭の声（1文） | 既存手段で止まる理由 | SUGUDASUが切る作業（動詞） |
（各ツール2シーン）

【出力4: X用フック】
| tool_id | フック文（80字以内） | 刺さるペルソナ |
（各ツール2本）
```

---

## 6. 型B — 機能→削減されるやり取り

```text
あなたは日本語のプロダクトマーケターです。
礼賛・前置き不要。比較表中心。

【型Bの定義】
機能ではなく「消える連絡・手戻り」を売る。

【対象】{TOOL_BUNDLE}

【出力1: 削減タスク表】
| tool_id | Before（担当者の作業） | After | 削減される連絡の典型文 |
（各ツール3行）

【出力2: ベネフィット翻訳表】
| tool_id | 機能（事実のみ） | ユーザーが言う価値（口語） | LP一文（32字以内） | 載せない理由 |

【出力3: HERE'S THE DIFFERENCE 相当】
| tool_id | # | 差分見出し（12字以内） | 説明（60字以内） | 根拠 |
（各ツール5項目 · statements/registryのみ）

【出力4: サブコピー3層】
| tool_id | 層1:痛み | 層2:減る手間 | 層3:始め方 |
（各28字以内）
```

---

## 7. 型C — 完了導線

```text
あなたは日本語のUXライター（コンバージョン設計）です。
礼賛・前置き不要。ステップ表と導線表のみ。

【型Cの定義】
ツール利用後の「次の一手」まで閉じる。

【対象】{TOOL_BUNDLE}

【出力1: HOW IT WORKS（3ステップ）】
| tool_id | Step1 | Step2 | Step3 | 画面要素ヒント |
（各12字以内 · 未実装は要確認）

【出力2: 出力後の次アクション】
| tool_id | 完了直後の心理 | 次アクション | ボタン文言 | サイト内リンク | 外部 |

【出力3: 横断導線（SUGUDASU内）】
| from_tool_id | to_tool_id | 接続理由 | CTA文言 |
（各ツール最大2本）

【出力4: 実装優先度】
| tool_id | 幹事さん型の完了後動線 | SUGUDASUで現実的な代替 | 優先度(高/中/低) |
```

---

## 8. 型D — 信頼・FAQ

```text
あなたは日本語の信頼設計ライターです。
礼賛・前置き不要。FAQ表のみ。法務断定禁止。

【型Dの定義】
どこに残る・誰に見える・いつ消えるを先に答える。

【対象】{TOOL_BUNDLE}

【出力1: 不安マッピング】
| tool_id | 不安（口語） | 種類(保存/共有/削除/精度/法務) | 重要度 |

【出力2: FAQ 3問固定】
| tool_id | Q1 | A1 | Q2 | A2 | Q3 | A3 |
（各80字以内 · 未確定は要確認）

【出力3: 信頼バッジ】
| tool_id | バッジ1 | バッジ2 | バッジ3 | statements照合 |

【出力4: NGコピー】
| tool_id | NG | 理由 | 代替 |
```

---

## 9. Grok 第2パス（型別）

**パイプライン:** Gemini（型A-D）→ **Grok（本節）** → 提督事実突合 → LP/HTML反映

### Grok-A（型A出力）

```text
添付は Gemini の型A出力です。
表構造・行数・tool_id は変えず、AIっぽさだけ除去せよ。

【やること】
- 「幹事の頭の声」を口語・具体に
- 同語尾 · 三段論法 · 「〜ですよね」連打を削る

【やらないこと】
- 行の追加削除 · 競合名 · 事実変更

【出力】
完成版（同じ表） + ### 変更メモ（3 bullet）
```

### Grok-B / Grok-C / Grok-D

Grok-A と同型。添付表構造を維持 · 事実変更禁止。

---

## 10. 採用〜反映フロー

```text
1. npm run generate:marketing-context
2. Gemini 型0 → 束ごとに型A-D（並列可）— または lp-runs/{tool}.gemini-type{X}.md で単体
3. Grok 第2パス（採用候補のみ）— lp-runs/{tool}.grok-type{X}.md
4. 提督: statements / privacy / registry と突合
5. 反映先（優先順）:
   - tools/{id}.html ファーストビュー · FAQ
   - data/changelog.json（ユーザー向け文言変更時）
   - note / X（editorial-roles 経由）
6. npm run build:pages → release:pages:free → push
```

---

## 11. 関連ファイル

| ファイル | 用途 |
|----------|------|
| `data/lp-marketing-matrix.json` | §1-§4 手動正本 |
| `data/tool-registry.json` | 実装・命名正本 |
| `TOOL_FACTS.generated.md` | registry 事実 |
| `LP_MARKETING_MATRIX.generated.md` | 行列 |
| `GEMINI_MARKETING_CONTEXT.generated.md` | Gemini 一括添付 |
| **`lp-runs/`** | **ツール別 Gemini/Grok コピペ用**（[`lp-runs/README.md`](lp-runs/README.md)） |
| `note-deai-grok.md` | 記事用 Grok（LPとは別パイプライン） |
