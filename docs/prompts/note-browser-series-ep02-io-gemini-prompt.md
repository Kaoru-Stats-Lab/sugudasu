# Gemini依頼用（完成版）: note連載 #2 入出力レイヤー

**用途:** Geminiにそのまま投入して #2 初稿を生成する  
**話数:** note連載 #2（入出力レイヤー）  
**更新:** 2026-07-02  
**参照:** [`note-browser-series-gemini-ROLE.md`](note-browser-series-gemini-ROLE.md) · [`../notes/NOTE_BROWSER_SERIES_OUTLINE.md`](../notes/NOTE_BROWSER_SERIES_OUTLINE.md) · [`../notes/NOTE_ARTICLE_OFFLINE_BROWSER_DRAFT.md`](../notes/NOTE_ARTICLE_OFFLINE_BROWSER_DRAFT.md)

---

## Gemini へ送る本文（コピペ用）

```text
あなたは、非IT読者向けに技術テーマを平易化する「note連載エディター」です。
以下の条件で、note本文を日本語で執筆してください。

【連載情報】
- 連載名: ブラウザはなにをするものぞ
- 話数: #2
- レイヤー: 入出力（I/O）
- テーマ: 表示・保存・印刷・画像/PDFビュー
- 読者の疑問: 「画像やPDFをブラウザで開くのは危ない？」

【読者設定】
- 非IT層（T-Rex Runnerがオフラインの目印でも読める）
- 事務・幹事・バックオフィス中心
- ブラウザを「サイトを見るだけのアプリ」と思っている

【今回の到達目標】
読了後に読者が次を説明できる状態にする。
1) ブラウザは表示だけでなく、入出力の作業面でも使われる
2) 「開ける」と「送っていない」は別問題
3) 表示 / 保存 / 印刷の違い
4) 次回（通信レイヤー）で何を確認すべきか

【絶対条件】
- 1記事1レイヤー（入出力）を守る
- 通信の詳細（POST/upload）は深掘りしない（次回予告に回す）
- 断定禁止（100%安全、完全匿名化、絶対）
- 競合誹謗禁止
- Syncの詳細実装に入らない（1文で別ラインと触れるのは可）

【必須で入れる要素】
1. 冒頭で「画像/PDFを無意識にブラウザで開いている」体験をフックにする
2. 次の4つを平易に説明
   - 表示
   - 保存（ダウンロード）
   - 印刷（プレビュー含む）
   - 変換/加工（ローカルで完結しうる作業）
3. 「できること」と「まだ分からないこと（送信有無）」を分けて書く
4. SUGUDASU文脈への接続（mask / webp-to-jpg / normalize / invoice）
5. 次回 #3（通信レイヤー）への自然な予告

【本文トーン】
- 丁寧で短文
- 比喩を使う（例: ビューアー、作業台、印刷前の下見）
- 不安を煽らず、判断材料を渡す

【文字数】
- 本文 1,800〜2,300字

【出力形式（この順番で）】
1) タイトル案（3案）
2) 採用タイトル（1案）
3) リード（120〜160字）
4) 本文
5) 明日から使えるチェックリスト（3〜5項目）
6) 次回予告（#3 通信レイヤー）
7) 末尾CTA（下記URLをそのまま掲載）
8) 自己監査（OK/NG + 1行理由）

【CTAリンク（固定）】
- https://sugudasu.com/statements?utm_source=note&utm_medium=social&utm_campaign=note_browser_series
- https://sugudasu.com/mask?utm_source=note&utm_medium=social&utm_campaign=note_browser_series
- https://sugudasu.com/webp-to-jpg?utm_source=note&utm_medium=social&utm_campaign=note_browser_series
- https://sugudasu.com/normalize?utm_source=note&utm_medium=social&utm_campaign=note_browser_series
- https://sugudasu.com/invoice?utm_source=note&utm_medium=social&utm_campaign=note_browser_series

【自己監査フォーマット】
- 入出力レイヤーから逸脱していないか
- 前話 #1 と重複しすぎていないか
- 断定表現がないか
- 非IT読者でも追える語彙か
- 次回 #3（通信）への橋渡しが明確か
```

---

## Cursor側メモ（受領後）

- #1との重複段落を圧縮（恐竜導入の繰り返し回避）
- 通信論の深掘りが入りすぎた箇所を次回へ移動
- `NOTE_ARTICLE_BROWSER_02_DRAFT.md` として保存
- CTA先と本文の整合確認
