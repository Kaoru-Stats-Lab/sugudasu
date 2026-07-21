# Gemini依頼用: 英語圏 Vibe Coding マイクロツール MECE — ギャップ調査

**用途:** 5ドメイン分類の **深掘り表のみ**（実装仕様・記事本文・コード禁止）  
**更新:** 2026-07-03  
**突合先:** `docs/product/PRODUCT_CONSTITUTION.md`（F1〜F7）· `docs/notes/PRODUCT_IDEA_JUDGMENT_LEDGER.md` §2-2（市場）· `docs/BACKLOG.md` §1-15

**使い方**

1. 新規 Gemini チャット
2. 任意添付: `docs/GEMINI_SESSION_SNAPSHOT.md` · `data/tool-registry.json`（ツール一覧）
3. 下記依頼文をコピペ
4. 出力を Cursor に渡し → 台帳で GO/HOLD/PARK/OUT → `BACKLOG.md` §1-15-x に反映  
5. **突合済み正本:** [`docs/notes/vibe-coding-mece-gemini-RESULT.md`](../notes/vibe-coding-mece-gemini-RESULT.md)（2026-07-03）

## Gemini への依頼文（コピペ用）

```text
あなたは英語圏のインディーハッカー・マイクロSaaS・無料Webユーティリティ市場に詳しい調査アシスタントです。
礼賛・前置き・記事本文・LP全文・コード実装は不要。指定フォーマットの表と箇条書きのみ。
捏造禁止。トラフィック・検索ボリュームは分からなければ「要確認（Similarweb/Ahrefs等）」。
固有名ツールは **実在が確認できるもののみ**（最大3例/行）。不確かなら「要確認」。

【調査の目的】
英語圏で Vibe Coding（Cursor / v0 / Bolt / Claude Artifacts 等）により量産されている
「単機能ブラウザツール（Micro-utilities）」を、**入力データ形式 × 用途** で MECE に整理し、
日本の個人開発ポータル **SUGUDASU**（非送信 · 登録不要 · 静的配信）が **薄い領域** と
**拡張すべき既存 id** を特定する。

【SUGUDASU 憲法 — 破る案は別欄「OUT」へ】
- F2: 処理はブラウザ内完結。機密データを当社サーバーへ POST しない（訴求の芯）
- F3: DB · WebSocket · サーバー同期なし（静的サイト）
- F7: 税務・法務の断定禁止
- 新規 HTML を増やしすぎない — 可能なら既存 id へのプリセット/拡張を優先

【SUGUDASU 既存ツール（id · 要約）— 重複提案禁止】
- normalize: 全角半角・リスト整形（comma_join 済 · sql_in Phase B 予定）
- mask / webp-to-jpg / png-to-webp: 画像非送信
- fair-draw: 公平抽選・景表チェック・証跡PDF
- invoice / receipt / stamp: 帳票・フリーランス向け
- group-split / timeline / warikan / label / report / sns / link-qr / test-data
- shift / present / reverse / font-converter
- planned（未実装）: table-conv · T06 CSVクレンザー · T07 JSON（HOLD）
- PARK: Markdown方言コンバーター · FAX OCR
- Sync（別ドメイン）: sync.sugudasu.com

【5ドメイン（入力データ軸）— この分類で MECE を維持】
1. Text & Formatting（文字列・文章）
2. Data & Code Transform（JSON/CSV/Base64/JWT/Regex 等）
3. Finance & Numbers（計算・見積・タイムゾーン）
4. Visual & Assets（画像・CSS・SVG・アクセシビリティ色）
5. Crypto & Randomizer（PW/UUID/ハッシュ・抽選・乱数）

【依頼1】ドメイン別 — サブカテゴリ MECE 表（各ドメイン1表）
列:
| サブカテゴリ（英） | 典型入力 | 典型出力 | 代表ツール例（英語圏・最大3） | 月間需要感（高/中/低・要確認可） | client-side 可否 | AI代替度（高/中/低） |

各ドメイン **最低8サブカテゴリ**。サブカテゴリは重複禁止（どちらか1ドメインにのみ）。

【依頼2】英語圏の「毎日使われる」定番 — Trust シグナル表（15行以内）
列:
| ツール/サイト | ドメイン | なぜ信頼されるか（非送信/OS/GitHub/評判） | SUGUDASUが真似すべきUX（1行） | 真似しないこと |

TinyWow · CyberChef · Omni Calculator · jsonformatter 等を **例示可**（要確認明記可）。

【依頼3】SUGUDASU ギャップマトリクス（核心）
列:
| ドメイン | サブカテゴリ | SUGUDASU現状（id or なし） | ギャップ（厚/薄/なし） | 推奨アクション | 判定案（GO拡張/HOLD/PARK/OUT） | 理由（日本市場・非送信・1行） |

**全ドメイン合計 25〜40 行**。判定は SUGUDASU 憲法に照らす。
- GO拡張 = 既存 id にプリセット追加で足りる
- GO新規 = 新 id が正当（hub 肥大リスクに言及）
- HOLD = コモディティ红海だが非送信ニッチあり（T07型）
- PARK = AI代替 or ペルソナ乖離
- OUT = 憲法違反 or 別プロダクト

【依頼4】日本特化スパイス — 英語圏ツールに無い Pain（表 · 12行以内）
列:
| 英語圏の定番ツール型 | 日本だけの摩擦（法令・習慣・社内規程） | SUGUDASU既存との接続 id | 新規不要で足りるか |

例の方向性: 全角半角 · 印鑑 · 景表法 · 割勘 · 研修幹事 · 社内規程で外部Converter禁止 · Connpass 等

【依頼5】優先 Top 5（箇条書き · 断定弱め）
各項目:
- ドメイン / サブカテゴリ
- 推奨: 既存 id 拡張 or 新規 id
- 非送信が差別化になるか（1文）
- 競合（英語圏 + 日本語圏 各1例）
- 台帳メモ用1行（PRODUCT_IDEA_JUDGMENT_LEDGER 向け）

【依頼6】深掘りすべき「薄いドメイン」— 追加リサーチ質問リスト
SUGUDASU が最も薄いと判断した **上位2ドメイン** について、
次回 Gemini / 人間が調べるべき **具体的な検索クエリ（英語5本 + 日本語5本）** と
**競合サイトURL候補（各3つまで）** を出す。

【出力ルール】
- 日本語（ツール名・URLは英語可）
- 表は Markdown
- 「Vibe Coding で誰でも作れる」＝ **コモディティ警告** を該当行に必ず1語入れる
- SUGUDASU 未実装を実装済みと書かない
- 礼賛・「最強」「爆発的」禁止
```

---

## Cursor 側の深掘り手順（提督・Agent用）

1. **マップ** — Gemini 依頼3の表を `tool-registry.json` と突合
2. **判定** — 各行を `PRODUCT_CONSTITUTION.md` でF1〜F7、`PRODUCT_IDEA_JUDGMENT_LEDGER` §2-2でM1〜M3
3. **収束** — GO拡張は `BACKLOG.md` §1-15 に「新規HTMLなし」で追記（例: §1-15-7 normalize）
4. **記事** — Trust/非送信は Zenn #6 系。ドメイン別に **1記事1Pain** まで
5. **やらない** — MECE 全埋め。薄い＋红海＋AI代替高 = PARK

## 提督メモ（2026-07-03 · 先行ギャップ感）

| ドメイン | SUGUDASU | 深掘り価値 |
|----------|----------|------------|
| 1 Text | sns · normalize · report | 中 — 日本特化は厚い。slug/title case は低 |
| 2 Data Transform | normalize(拡張中) · test-data · T07 HOLD | **高** — 裏SUGUDASUの本命 |
| 3 Finance | invoice · receipt · warikan · receipt | 中〜厚 — 日本帳票は差別化済 |
| 4 Visual | webp · mask · brand-logo | 中 — CSS/SVGジェネレータは薄 |
| 5 Crypto/Random | fair-draw · group-split | 中 — PW/UUID は T19 HOLD 红海 |
