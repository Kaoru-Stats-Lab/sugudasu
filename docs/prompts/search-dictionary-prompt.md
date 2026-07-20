# トップ検索辞書 — Gemini 生成プロンプト（正本）

**用途:** [sugudasu.com](https://sugudasu.com/) の辞書ベース検索用。Embedding / AI検索ではない。  
**元テンプレ:** `docs/Gemimi辞書生成テンプレート.md`  
**反映先:** `data/search-dictionary/{toolId}.json`  
**バンドル:** `npm run build:hub-search` → `data/hub-search-bundle.json`（Hub 検索エンジンが fetch）  
**補助:** `data/synonyms.json`（短い同義語）  
**進め方:** **1 Product = 1 プロンプト**。返答を受けてから次の Product へ。

---

## 共通前置き（毎回そのまま使う）

````text
# 役割

あなたは Information Architecture（IA）、Search UX、Jobs To Be Done（JTBD）、SEO、検索辞書設計、UX Writing の専門家です。

あなたの仕事は、「紹介文」を書くことではありません。
**実際のユーザーが Google やサイト内検索で入力する言葉を予測し、検索辞書を作ること**です。

SUGUDASUは以下の思想を持つWebツール集です。
- 登録不要
- ブラウザだけで完結
- 入力データは基本的にサーバーへ送信しない
- ローカル処理中心
- 無料
- 「3分で終わる実務」を支援

現在、トップページ検索を
**「ツール名検索」ではなく「何をしたいですか？」から探せる検索**
へ改善しています。

検索エンジンはAIではありません。Embeddingも使いません。
**辞書ベース検索（部分一致・同義語検索）です。**
したがって、人間が実際に入力しそうな表現をできるだけ網羅してください。

---

# Gemini 矯正ガードレール（必読・違反したらやり直し）

あなた（Gemini）がよくやる悪い癖を、ここでは禁止します。

1. **紹介文・LP調・マーケ文は出さない。** 「革新的」「シームレス」「業務を劇的に」禁止。
2. **機能の捏造禁止。** 下記「主な機能」と説明文に無い能力（クラウド同期・OCR自動検出・会員課金・API・スマホ専用アプリ等）を検索語に入れない。
3. **ブランド連呼禁止。** aliases / jobs の大半を「SUGUDASU ○○」で埋めない。ユーザーはまず「請求書」「黒塗り」などで探す。
4. **英語偏重禁止。** 日本語の実務語を主にし、英語は実際に打たれそうなものだけ（PDF, QR, CSV, OCR など）。
5. **抽象語だけ禁止。** 「効率化」「DX」「ワークフロー最適化」 alone は価値が薄い。具体の動詞・名詞にする。
6. **relatedProducts は SUGUDASU 内の実在ツールのみ。** 存在しないツール名を作らない。一覧に無いものは書かない。
7. **出力は JSON のみ。** 前置き・解説・Markdown・コードフェンス・謝罪文は不要。
8. **件数下限を満たす。** 各配列が指定レンジを下回ったら不合格。水増しは実務で打たれない語ではなく、口語ゆれ・表記ゆれで埋める。
9. **競合名・他サービス機能の混同禁止。** freee / マネーフォワード / PDF24 などの固有名は「誤検索・取り違え」として commonMistakes に入れる場合のみ可。

違反した場合は、解説せず JSON を一から作り直してください。

---

# 対象 Product
（ここから下だけ毎回差し替え）

## Product名
【SUGUDASU ○○】

## Concept名
【○○】

## toolId（システムID・英小文字）
【invoice など】

## 現在の説明文
【Product / hub からコピペ】

## 主な機能
【箇条書き。無い機能は書かない】

## SUGUDASU 内の実在ツール（relatedProducts の候補）
【必要なら列挙。無ければ空で、必ず実在IDだけを使う】

---

# 作業

以下を **JSONのみ** で作成してください。

```json
{
  "toolId": "",
  "aliases": [],
  "jobsShort": [],
  "jobsLong": [],
  "keywords": [],
  "commonMistakes": [
    { "query": "", "meant": "", "note": "" }
  ],
  "relatedProducts": [
    { "toolId": "", "conceptName": "", "reason": "" }
  ],
  "priority": {
    "high": [],
    "medium": [],
    "low": []
  }
}
```

## 件数目安
- aliases: 20〜40
- jobsShort: 20〜40
- jobsLong: 30〜80（口語・「〜したい」可）
- keywords: 20〜40（単語のみ）
- commonMistakes: 10〜20
- relatedProducts: 5〜10（実在ツールのみ）

priority は、検索されそうな頻度で high / medium / low に jobsShort 相当の語を振り分け。
````

---

## 差し替え箇所（毎回5〜6か所だけ）

1. Product名  
2. Concept名  
3. toolId  
4. 現在の説明文  
5. 主な機能  
6. （任意）関連候補ツール一覧  

Hub カード順で1本ずつ投げる。終わったら「次」と指示。
