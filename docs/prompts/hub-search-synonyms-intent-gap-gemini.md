# Gemini 向け · Hub 検索 synonyms / intent-map 欠落埋め（COPYPASTE）

**更新:** 2026-07-20  
**用途:** Hub 検索の **Layer 補助**（`synonyms.json` · `tool-intent-map.json`）に、未登録ツール分を追加させる。  
**やらない:** `search-dictionary/{id}.json` の全面作り直し · `search-thesaurus.json`（グローバル from→to）の大量追加 · 機能捏造  
**正本:** [`docs/notes/BRAND_NORMALIZE.md`](../notes/BRAND_NORMALIZE.md) · [`search-dictionary-prompt-v2.md`](search-dictionary-prompt-v2.md)

**欠落（2026-07-20 時点 · Hub カード基準）**

| 層 | 欠落 toolId |
|----|-------------|
| `synonyms.json` | `ai-cleaner` · `broken-input` · `json-view` · `label` · `match-board` · `present` · `report` · `reverse` · `search-query` · `slot-board` · `test-data` · `timeline` |
| `tool-intent-map.json` | `ai-cleaner` · `broken-input` · `json-view` · `reverse` |

---

## 使い方

1. 下記 **「Gemini への依頼文」** を丸ごとコピー
2. 続けて **「製品カード（添付）」** を貼る
3. 出力 JSON を Cursor に渡し、`data/synonyms.json` / `data/tool-intent-map.json` へマージ
4. `npm run validate:hub-ia`（または `npm run build:hub-search`）でバンドル更新

---

## Gemini への依頼文（コピペ用）

````text
# ROLE

あなたは Information Architecture、Search UX、日本語情報検索、JTBD、UX Writing の専門家です。
礼賛・前置き・Markdown 解説は不要です。指定の JSON だけ出力してください。

# プロダクト

SUGUDASU（すぐだす）https://sugudasu.com/
- 登録不要 · ブラウザ完結 · 原則非送信 · 無料の実務 Web 工具集
- Hub 検索は AI / Embedding ではない。辞書・同義語・意図マップの部分一致検索

# 今回の仕事（MECE）

次の **2 ファイル用の追記案だけ**を作る。

1. synonyms.json 用 … `{ "terms": string[], "toolIds": string[] }`
2. tool-intent-map.json 用 … `{ "keyword": string, "toolIds": string[], "weight": number }`

既存エントリの全文書き換え・削除案は出さない。**追加分のみ**。

# 絶対禁止

1. 存在しない toolId を作らない（下記一覧以外禁止）
2. 機能捏造（クラウド同期・ログイン・AI要約・自動スクレイピング等）
3. マーケ空語 alone（効率化・DX・シームレス・革新的）
4. 英語偏重（実務で打たれない英語で埋めない。PDF/JSON/CSV/QR/API 等は可）
5. 他社固有名を主語にしない（freee 等は誤検索としてのみ可。今回は不要なら書かない）
6. 1 toolId に無関係な terms を大量付着させない（取り違えを増やす）
7. weight は 80〜100 の整数のみ（今回の欠落ツールは新規ヒット用なので 90 または 100）
8. 前置き・コードフェンス・謝罪文禁止。**JSON オブジェクト 1 個だけ**

# 良い terms / keyword の条件

- 情シス・受託・ディレクター・QA・事務が **実際に検索窓に打ちそうな日本語**
- 表記ゆれ・略称・口語（例: コピペ、黒塗り、ダミーデータ）
- 「やりたいこと」動詞句も可（例: JSONを見たい、異常系を試したい）
- ブランド正式名の連打は最小（conceptName は 1 回まででよい）

# 出力フォーマット（これ以外禁止）

{
  "synonymsAdd": [
    { "terms": ["…", "…"], "toolIds": ["tool-id"] }
  ],
  "intentAdd": [
    { "keyword": "…", "toolIds": ["tool-id"], "weight": 100 }
  ],
  "notes": [
    "マージ時の注意を短く（任意・3行以内）"
  ]
}

制約:
- synonymsAdd: 欠落 12 toolId を **すべて最低 1 エントリ以上**カバー
- 1 エントリの terms は 3〜8 語（水増し禁止）
- 1 toolId あたり synonyms エントリは 1〜2 個まで
- intentAdd: 欠落 4 toolId（ai-cleaner, broken-input, json-view, reverse）を **すべてカバー**
- intentAdd は各 toolId あたり keyword 2〜5 個（別オブジェクトでよい）
- 複数 toolId を同じ terms に載せるのは、本当に取り違えやすい場合のみ（基本は単一 toolId）

# 欠落 toolId と製品カード（機能はこれ以外捏造しない）

## ai-cleaner / AIコピペ整形
- 一言: AI出力の Markdown・コード抽出・JSON を次へ渡す前に機械整形。要約・定型文削除なし。非送信。
- 検索されそうな語の例の方向: コピペ整形、AI出力 整形、Markdown 空行、コード抽出、JSON整形、受け渡し

## broken-input / 壊れ入力
- 一言: 異常系テスト用コピペデータ。長さ・多言語・絵文字・見えない文字などを選んでコピー。Faker/ランダムなし。テストデータ（正常系）の対。
- 方向: 異常系テスト、境界値、入力チェック、文字化け、最大文字数、ゼロ幅、フォーム崩れ

## json-view / JSON構造
- 一言: JSONを貼ってツリー表示。キー・値検索、Path/値コピー。編集・Schema・保存なし。
- 方向: JSONビューア、JSONツリー、APIレスポンス確認、キー検索、pretty

## reverse / 逆引き辞典（concept: 逆引き）
- 一言: 記号・特殊文字から読み・用途を逆引き（既存辞書の範囲）。捏造しない。
- 方向: 逆引き、記号 調べる、特殊文字 意味、文字コード 調べる（言い過ぎ注意）

## label / 宛名ラベル
- 宛名ラベル印刷・PDF 向け。帳票系。

## match-board / ドラフト会議
- メンバーを枠に割り当てるドラフト UI。班分けとは別。

## present / ギフト
- 景品・プレゼント関連の工具（景表法ツールと混同注意。fair-draw と取り違えやすい語は commonMistakes 相当で避け、present 固有語に寄せる）

## report / 議事録整形
- 議事録テキストの整形・受け渡し。AI要約製品化はしない。

## search-query / Google検索式
- 検索演算子・検索式の組み立て。Google 専用に寄せすぎないが実務語は可。

## slot-board / 枠取りパレット
- 枠・スロットの取り合い・割当パレット。

## test-data / テストデータ
- 正常系の綺麗なダミー（氏名・CSV 等）。壊れ入力と混同する語は test-data 側に「ダミー」「社員マスタ」など正常系語を置く。

## timeline / イベント進行
- イベント当日の進行タイムライン。スケジュール表全般と混同しやすいので「進行」「当日」「タイムテーブル」寄り。

# 取り違えガード（必須意識）

- test-data ⟷ broken-input（正常系ダミー vs 異常系コピペ）
- group-split ⟷ match-board（班分け vs ドラフト）
- ai-cleaner ⟷ normalize（AIコピペ整形 vs 全角半角名簿）
- json-view ⟷ table-conv / ai-cleaner（構造閲覧 vs 表変換 / JSON整形）
- fair-draw ⟷ present（抽選 vs ギフト）

取り違えやすい語を同じ terms 配列に同居させない。

# 作業開始

上記フォーマットの JSON のみ出力せよ。
````

---

## 製品カード（添付 · 依頼文の直後に貼る）

```text
【registry 抜粋 · conceptName】
ai-cleaner = AIコピペ整形
broken-input = 壊れ入力
json-view = JSON構造
reverse = 逆引き
label = 宛名ラベル
match-board = ドラフト会議
present = ギフト
report = 議事録整形
search-query = Google検索式
slot-board = 枠取りパレット
test-data = テストデータ
timeline = イベント進行

【既存 synonyms.json の書き方サンプル（これに合わせる）】
{ "terms": ["余白トリム", "余白除去", "余白カット"], "toolIds": ["clipboard-trim"] }
{ "terms": ["ぼかし", "黒塗り", "マスキング"], "toolIds": ["mask"] }

【既存 tool-intent-map.json の書き方サンプル】
{ "keyword": "透かし", "toolIds": ["watermark"], "weight": 100 }
{ "keyword": "画像", "toolIds": ["watermark", "image-trim", "mask", "pdf-images"], "weight": 100 }
```

---

## Cursor へのマージ指示（Gemini 返答後）

```text
Gemini の JSON を data/synonyms.json の entries 末尾と
data/tool-intent-map.json の entries 末尾に追加せよ。
既存エントリは消すな。重複 keyword/terms は統合またはスキップ。
完了後 npm run build:hub-search と npm run validate:hub-ia。
```

---

## 受け入れチェック

- [ ] synonymsAdd が欠落 12 id をすべてカバー
- [ ] intentAdd が欠落 4 id をすべてカバー
- [ ] 捏造 toolId なし
- [ ] test-data / broken-input の語が混線していない
- [ ] `validate:hub-ia` exit 0
