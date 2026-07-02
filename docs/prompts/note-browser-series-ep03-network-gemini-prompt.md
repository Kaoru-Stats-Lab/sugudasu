# Gemini依頼用（完成版）: note連載 #3 通信レイヤー

**用途:** Geminiにそのまま投入して #3 初稿を生成する  
**話数:** note連載 #3（通信レイヤー）  
**更新:** 2026-07-02  
**参照:** [`note-browser-series-gemini-ROLE.md`](note-browser-series-gemini-ROLE.md) · [`../notes/NOTE_BROWSER_SERIES_OUTLINE.md`](../notes/NOTE_BROWSER_SERIES_OUTLINE.md) · [`../notes/NOTE_ARTICLE_OFFLINE_BROWSER_DRAFT.md`](../notes/NOTE_ARTICLE_OFFLINE_BROWSER_DRAFT.md)

---

## Gemini へ送る本文（コピペ用）

```text
あなたは、非IT読者向けに技術テーマを平易化する「note連載エディター」です。
以下の条件で、note本文を日本語で執筆してください。

【連載情報】
- 連載名: ブラウザはなにをするものぞ
- 話数: #3
- レイヤー: 通信（Network）
- テーマ: データ送信の発生点（POST / upload）と一次確認
- 読者の疑問: 「このツール、本当に送ってないの？」

【読者設定】
- 非IT層（事務・幹事・バックオフィス）
- F12を使ったことがない人が多い
- 「ブラウザで動く = 送っていない」と思いがち

【今回の到達目標】
読了後に読者が次を説明できる状態にする。
1) 見た目だけでは送信有無は分からない
2) POST / upload が何を意味するか
3) F12 → Network で最低限の一次確認ができる
4) 一次確認と最終判断（規約・社内ルール）は別だと理解できる

【絶対条件】
- 1記事1レイヤー（通信）を守る
- HTTPS詳細は深掘りしない（#4へ回す）
- 保存レイヤー（Cookie/localStorage）の詳細も深掘りしない（#5へ回す）
- 断定禁止（100%安全、完全匿名化、絶対）
- 競合誹謗禁止

【必須で入れる要素】
1. 冒頭で「見た目では判断できない」体験フック
2. POST / upload を非IT向けに1行ずつ説明
3. F12 → Network の3ステップ（Windows/Mac軽く併記可）
4. 「何を見ればよいか」の実務目線（リクエスト増加、送信先、ファイル名らしき項目）
5. 一次確認の限界（これだけで最終保証ではない）
6. SUGUDASU文脈への接続（mask / webp-to-jpg / normalize / invoice）
7. 次回 #4（HTTP/HTTPS）への自然な予告

【本文トーン】
- 丁寧で短文
- 不安を煽らず、判断手順を渡す
- 専門語は最小限（出す場合は簡単な注釈）

【文字数】
- 本文 1,900〜2,500字

【出力形式（この順番で）】
1) タイトル案（3案）
2) 採用タイトル（1案）
3) リード（120〜160字）
4) 本文
5) 5分セルフチェック（3〜5項目）
6) 次回予告（#4 保護レイヤー）
7) 末尾CTA（下記URLをそのまま掲載）
8) 自己監査（OK/NG + 1行理由）

【CTAリンク（固定）】
- https://sugudasu.com/statements?utm_source=note&utm_medium=social&utm_campaign=note_browser_series
- https://sugudasu.com/mask?utm_source=note&utm_medium=social&utm_campaign=note_browser_series
- https://sugudasu.com/webp-to-jpg?utm_source=note&utm_medium=social&utm_campaign=note_browser_series
- https://sugudasu.com/normalize?utm_source=note&utm_medium=social&utm_campaign=note_browser_series
- https://sugudasu.com/updates

【自己監査フォーマット】
- 通信レイヤーから逸脱していないか
- 前話 #2 と重複しすぎていないか
- 断定表現がないか
- 非IT読者でも実行できる手順になっているか
- 次回 #4（HTTP/HTTPS）への橋渡しが明確か
```

---

## Cursor側メモ（受領後）

- #2との重複（入出力説明）を圧縮
- HTTPS詳細や保存レイヤー論が入りすぎた段落を次回へ移動
- `NOTE_ARTICLE_BROWSER_03_DRAFT.md` として保存
- F12手順が実際の操作順になっているか最終確認
