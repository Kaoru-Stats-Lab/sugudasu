# Gemini依頼用: Data軸 × Finance軸 — 手厚く作る領域ブレスト

**用途:** SUGUDASU の **2本柱**（裏SUGUDASU · 日本帳票）を Token 潤沢に深掘り  
**更新:** 2026-07-03  
**突合先:** `PRODUCT_IDEA_JUDGMENT_LEDGER.md` · `BACKLOG.md` §1-15 · `vibe-coding-mece-gemini-RESULT.md`

**使い方**

1. 新規 Gemini チャット（長文OK）
2. 任意添付: `data/tool-registry.json` · `docs/notes/vibe-coding-mece-gemini-RESULT.md` · `docs/notes/NORMALIZE_TEXT_TOOL_SPEC.md`（先頭80行）
3. 下記依頼文をコピペ
4. 出力を Cursor に渡し → `BACKLOG.md` / `data/roadmap.json` / `PRODUCT_IDEA_JUDGMENT_LEDGER` に反映

---

## Gemini への依頼文（コピペ用）

```text
あなたは日本の個人開発・実務SaaS・無料Webユーティリティ市場に詳しいプロダクトストラテジストです。
礼賛・前置き長文・記事本文・LP全文・コード実装は不要。指定フォーマットの表と箇条書きのみ。
捏造禁止。検索ボリューム・競合シェアは分からなければ「要確認（Keyword Planner / Similarweb等）」。
未実装機能を実装済みと書かない。

【ブレストの問い（核心）】
SUGUDASU はリソース有限の個人開発ポータルです。
**手厚くプロダクトを作るべき2分野**を、次の仮説で固定して深掘りせよ。

| 軸 | 仮称 | 芯 | 代表 id（既存） |
|----|------|-----|----------------|
| **Data軸** | 裏SUGUDASU | 社内規程で外部Converter禁止 · 本番データを**非送信で整える** | normalize · test-data · table-conv（planned）· fair-draw（名簿CSV） |
| **Finance軸** | 表の実務帳票 | インボイス・源泉・割勘など**日本スパイス**の書類・計算 | invoice · receipt · stamp · warikan |

**検証してほしいこと**
- この2軸は MECE か？ 漏れ・重複は？
- 各軸で「手厚く」の定義は何か？（Tier S LP · プリセット数 · ガイド · テスト · 横連携）
- 幹事束（timeline · group-split · link-qr）は **第3クラスタ** としてどう位置づけるか？
- Visual（mask · webp）は **従属** でよいか？
- Sync（sync.sugudasu.com · 有料 · 登録あり）は **別プロダクト** として触らない前提でよいか？

【SUGUDASU 憲法 — 破る案は OUT 列へ】
- 憲法: `docs/product/PRODUCT_CONSTITUTION.md` のF1〜F7を正本とする
- F5 実務3分課題 · F7 税務法務の断定禁止
- 新規 HTML 乱立禁止 — **既存 id 拡張・プリセット優先**
- 「監視回避」「コンプラ突破」コピー禁止 → 「ブラウザ内完結・当社サーバーへPOSTしない」

【既存ツール id — 重複提案禁止】
hub · invoice · receipt · stamp · label · shift · report · reverse · present · sns
normalize · mask · webp-to-jpg · fair-draw · group-split · timeline · warikan · link-qr · test-data
font-converter · updates · roadmap · guides
planned: table-conv · png-to-webp · time-calc（P2）
PARK: Markdown方言 · FAX OCR · password/UUID単体（T19红海）
OUT: 日程調整サーバ · 社内検索 · 音源ホスティング

【既に決まっている採否（覆さない）】
- normalize sql_in · tab_to_comma — GO拡張（最優先）
- fair-draw Connpass CSV D&D — GO拡張（ドラムロール演出は Out）
- ④ Markdown方言 · ⑤ FAX OCR — PARK
- shift 病棟24h · 多店舗勤怠 — 対象外（roadmap out_of_scope）

【ペルソナ（参照）】
- P-B 事務OL / データ整備職人 — Data軸の主読者（Zenn #6 #12 系）
- フリーランス・小規模店舗 — Finance軸
- P-A 幹事 — 第3クラスタ（イベント当日・班分け・抽選）

---

【依頼1】2軸 MECE マップ（表 · 各軸12行以上）

列:
| サブ領域 | 典型Pain（日本語1行） | 典型入力→出力 | 既存 id | 手厚さ（S/A/B/C） | ギャップ | 推奨アクション（GO拡張/GO新規/HOLD/PARK） |

- Data軸と Finance軸で **表を分ける**
- サブ領域は **互いに重複禁止**
- 「手厚さ」基準を冒頭3行で定義してから表を書く

【依頼2】「手厚く」の具体定義（各軸 · 箇条書き各8項目以内）

Data軸について:
- Tier（S/A/B）の付け方
- プリセット / 変換パイプラインの本数目安
- ガイド記事（/guides）の題材
- Zenn/note の切り口
- 競合（日本語圏3 · 英語圏2）との差別化1文
- やりすぎライン（hub肥大 · AI代替 · 红海）

Finance軸についても同構造。

【依頼3】拡張候補マトリクス（25〜35行 · 2軸のみ）

列:
| 軸 | 候補機能 | 新規id要否 | 非送信が差別化か | AI代替度 | 日本特化スパイス | 判定 | 実装順（1-10） | 1行理由 |

含めること:
- normalize Phase B 残（sql_in 以外）
- table-conv（Shift-JIS/BOM）
- test-data 拡張
- fair-draw CSV列ピック
- invoice/receipt/warikan/stamp の次の1機能ずつ
- 意図的に PARK に落とす候補 5 件以上

【依頼4】第3クラスタ「幹事・イベント」との境界

表:
| 領域 | 幹事クラスタ | Data軸 | Finance軸 | 境界ルール（1行） |

例: Connpass CSV は fair-draw（Data/裏）か幹事か — 既存判断を尊重しつつ整理。

【依頼5】12ヶ月ロードマップ案（四半期 × 2軸）

形式:
| 四半期 | Data軸（最大3項目） | Finance軸（最大3項目） | やらないこと | 成功指標（定性で可） |

- 新規 id は **四半期あたり最大1**
- 「手厚く」は **既存 id の深化** を優先

【依頼6】SEO / 記事ネタ（各軸）

Data軸: 検索クエリ候補 日本語10本 + 記事タイトル案5本
Finance軸: 同

「要確認」可。法令断定は避け、実務Pain語彙で。

【依頼7】反証 — 2軸戦略が間違っている条件

箇条書き 5〜8 項目:
- どんなデータが出たら Data軸を縮小すべきか
- どんなデータが出たら Finance軸を縮小すべきか
- 2軸以外に集中すべきシグナル（幹事のみ勝つ等）

【依頼8】提督への質問（未決定事項）

ブレストで **人間が決めないと進めない** 論点を、選択肢付きで最大5問。
（例: table-conv を独立 id にするか normalize に吸収するか）

【出力ルール】
- 日本語
- 表は Markdown
- 礼賛・「最強」「爆発的」禁止
- コモディティ红海の行には必ず「红海」か「AI代替高」を1語
- Sync ラインの新機能提案は不要（1行で境界のみ触れてよい）
```

---

## Cursor 側の反映手順

1. 依頼1・3を `tool-registry.json` と突合
2. 判定列を `docs/product/PRODUCT_CONSTITUTION.md`（F1〜F7）と `PRODUCT_IDEA_JUDGMENT_LEDGER` §2-2（市場）で再チェック
3. 依頼5を `data/roadmap.json` の core レーン候補に
4. 依頼8の質問は提督回答後に `BACKLOG.md` §1-15-x 追記
