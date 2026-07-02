# Gemini依頼用（完成版）: note連載 #10 normalize実践編

**用途:** Geminiにそのまま投入して #10 初稿を生成する  
**話数:** note連載 #10（製品別編3本目 / normalize実践）  
**更新:** 2026-07-02  
**参照:** [`note-browser-series-gemini-ROLE.md`](note-browser-series-gemini-ROLE.md) · [`../notes/NOTE_BROWSER_SERIES_OUTLINE.md`](../notes/NOTE_BROWSER_SERIES_OUTLINE.md) · [`note-browser-series-ep09-webp-practice-gemini-prompt.md`](note-browser-series-ep09-webp-practice-gemini-prompt.md)

---

## Gemini へ送る本文（コピペ用）

```text
あなたは、非IT読者向けに技術テーマを平易化する「note連載エディター」です。
以下の条件で、note本文を日本語で執筆してください。

【連載情報】
- 連載名: ブラウザはなにをするものぞ
- 話数: #10（製品別編）
- テーマ: normalize（文字整形）を実務で使い分ける
- 読者の疑問: 「全角半角・改行・スペース混在を手作業で直す地獄を終わらせたい」

【読者設定】
- 非IT層（事務・幹事・バックオフィス）
- 名簿、CSV、フォーム入力、EC登録、請求関連で表記揺れに悩む
- コピペ時の崩れや再入力ミスが多い

【今回の到達目標】
読了後に読者が次を実行できる状態にする。
1) 表記揺れが業務事故を生む理由を説明できる
2) normalizeで何をどこまで整えるか判断できる
3) 変換前後チェック（行数・桁・記号）を習慣化できる
4) 「整形」と「意味変更」の境界を理解できる

【絶対条件】
- 1記事1テーマ（normalize実践）を守る
- 断定禁止（100%ミス防止、絶対）
- 競合誹謗禁止
- 法的断定をしない
- CSV仕様の細部に脱線しすぎない（実務優先）

【必須で入れる要素】
1. 冒頭フック（全角半角混在で弾かれた体験）
2. 表記揺れの典型例（数字、英字、スペース、改行、記号）
3. normalizeの使いどころ / 使わない方がよい場面
4. 実務フロー（貼り付け → 変換設定 → 差分確認 → 反映）
5. ありがちミス3つと回避策
6. SUGUDASU文脈への接続（ブラウザ内処理・非送信説明は過剰断定しない）
7. 次回 #11（invoice実践）への自然な予告

【本文トーン】
- 丁寧で短文
- 実務手順中心
- 不安を煽らず、再現可能な手順を渡す

【文字数ルール（重要）】
- 本文の目安文字数: 1,900〜2,500字
- 文字数カウント対象: 「タイトル案」「採用タイトル」「リード」「本文」「チェックリスト」「次回予告」「自己監査」
- 文字数カウント対象外: 「末尾CTAリンクのURL文字列」と「リンク見出し行」
- 出力末尾で「本文文字数（リンク除外）」を自己申告する

【出力形式（この順番で）】
1) タイトル案（3案）
2) 採用タイトル（1案）
3) リード（120〜160字）
4) 本文
5) 5分チェックリスト（3〜5項目）
6) 次回予告（#11 invoice実践）
7) 末尾CTA（下記URLをそのまま掲載）
8) 自己監査（OK/NG + 1行理由）
9) 本文文字数（リンク除外）

【CTAリンク（固定）】
- https://sugudasu.com/statements?utm_source=note&utm_medium=social&utm_campaign=note_browser_series
- https://sugudasu.com/normalize?utm_source=note&utm_medium=social&utm_campaign=note_browser_series
- https://sugudasu.com/invoice?utm_source=note&utm_medium=social&utm_campaign=note_browser_series
- https://sugudasu.com/webp-to-jpg?utm_source=note&utm_medium=social&utm_campaign=note_browser_series
- https://sugudasu.com/updates

【自己監査フォーマット】
- normalize実践テーマから逸脱していないか
- #9との重複が過多でないか
- 断定表現がないか
- 非IT読者が明日実行できるか
- 次回 #11 への橋渡しが明確か
```

---

## Cursor側メモ（受領後）

- 「変換で意味が変わる」注意喚起が弱ければ補強
- 例が抽象的すぎる場合は名簿・請求・フォームの具体例を追加
- `NOTE_ARTICLE_BROWSER_10_DRAFT.md` として保存
- #11（invoice実践）導線を最終調整
