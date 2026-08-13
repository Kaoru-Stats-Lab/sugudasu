# AIプロンプトビルダー（prompt-handoff）— 仕様 SSOT（v0.1）

**更新:** 2026-08-13  
**ステータス:** **v0.1 実装** · URL `/prompt-handoff`  
**命名:** productName = SUGUDASU AIプロンプトビルダー · conceptName = AIプロンプト · navLabel = プロンプト（検索式ビルダー姉妹）  
**関連:** 検索式は別物（`SEARCH_QUERY_BUILDER_SPEC.md`）· Anti · Commentary C-05 · F2

> **一文:** SUGUDASU の出力（表・差分）を、外の AI に渡すための **閉じた** プロンプトを組み立ててコピーする。オープンな AI 入口ではない。モデルは呼ばない。

---

## 0. 合憲ガード（必須）

| 層 | 判定 |
|----|------|
| WHY | 前工程＝型の穴埋め。判断・創造・評価は外の AI とユーザ |
| Anti | 丸投げしない · AIらしさを出さない · 断定しない |
| F2 | 入力・完成文を SUGUDASU サーバーへ送らない |
| F7 | 「ハルシネしない」「正しい説明」を保証しない |

**違憲化する実装:** 画面内 LLM · 「AIが生成しました」· 汎用オープン質問 · 法務断定スロット

---

## 1. プロダクト境界

### IN（クローズド）

| プリセット ID | ラベル | 前提ツール | 貼るもの |
|---------------|--------|------------|----------|
| `table_explain` | 表・CSVの意味説明 | normalize / table-conv | ヘッダ＋数行（または変換結果） |
| `diff_explain` | 差分・変更点の説明文 | diff / smart-diff | 差分テキスト or 変更要約 |

### OUT

| 項目 | 理由 |
|------|------|
| 汎用要約・敬語・議事・手順 | オープンクエスチョン化 |
| 補助金・マーケ・創作 | プロダクト非連動 |
| 結果生成・API 呼び出し | F2 · Anti |
| プリセット 3 個以上（v0.1） | 密度 · 閉じた範囲を守る |

---

## 2. UI（検索式ライク · 低密度）

```
[用途: 表の意味説明 | 差分の説明]   ← 排他 · ≤2
[関連ツールへのリンク]               ← 弱い導線
[貼り付け欄]（必須）
[宛先・目的]（任意 · 1行）
[完成プロンプト]
[コピー]  ※ Googleで開くに相当する「ChatGPTを開く」は任意・後回し可
```

- 詳細は増やさない  
- ハルシネ対策ブロックは **完成文に必ず含め、UIから削除不可**

---

## 3. 完成プロンプトの構造（Must）

```
# 役割
（プリセット固定の短い文）

# 入力（SUGUDASUの出力）
（ユーザ貼付）

# 目的（任意）
（宛先・目的欄）

# 制約（ハルシネ対策 · 全preset共通 · 削除不可）
- 入力に無い事実・数字・固有名を補わない
- 分からないことは「不明」または「要確認」と書く
- 推測する場合は推測だと明示する
- 法務・税務・人事の結論を断定しない
- 出力の根拠は、上記入力の範囲に限る
（+ プリセット固有1行）

# 出力形式
（プリセット固定）
```

### 3-1. プリセット固有

| ID | 役割（要約） | 追加制約 | 出力形式 |
|----|--------------|----------|----------|
| `table_explain` | 表データを読み、人が理解できる説明を書く | 列に無い値を捏造しない | 列の意味 · 注意点 · 不明点（箇条書き） |
| `diff_explain` | 差分を読み、レビュー依頼用の説明文を書く | 差分に無い変更を書かない | 変更点一覧 · 確認してほしい点 · 不明点 |

---

## 4. ユーザー向け免責（Must）

- このツールはプロンプトを作るだけです。AI の回答は生成しません。  
- 回答の正しさ・ハルシネの有無は保証しません。  
- 業務データを外の AI に貼る可否は、各自のルールで判断してください。

---

## 5. 非機能

| 項目 | 方針 |
|------|------|
| 保存 | 貼付本文は LocalStorage に保存しない |
| 上限 | 貼付 **20,000字** · 目的 **200字** |
| テスト | プリセット2 · 共通制約が出力に含まれる · 空貼付でコピー不可 |
| a11y | 用途 radiogroup · コピー `aria-live` |

---

## 6. DONE後の次の1本（A17）

| from | next | type | 理由 |
|------|------|------|------|
| `table-conv` | `prompt-handoff` | C | 表にしたあと人向け説明が要るとき |
| `diff` | `prompt-handoff` | C | 差分のあと依頼文が要るとき |
| `smart-diff` | `prompt-handoff` | C | 同上 |

逆方向（prompt-handoff → table-conv / diff）: **Reject**（戻るとループ）

normalize → table-conv は維持（差し替えない）。

---

## 7. UIUX_DECISION_BLOCK

```
UIUX_DECISION_BLOCK
tool_id: prompt-handoff
completion_model: copy_primary
product_voice: quiet_peer
lead_profile: light
cta_order: [copy]
surface: none (sg-card hairline only)
notes: 検索式と同型の組立て。オープンAI入口にしない。ハルシネ制約は完成文固定。
```

---

## 8. 実装チェックリスト

- [x] `docs/notes/PROMPT_HANDOFF_SPEC.md`
- [x] `assets/prompt-handoff.js` · `tools/prompt-handoff.html`
- [x] registry · hub · shell · statements · changelog · catalog
- [x] lead profile · search-dictionary · job-contracts · next-path
- [x] `scripts/prompt-handoff.test.mjs`

---

*End of SSOT v0.1*
