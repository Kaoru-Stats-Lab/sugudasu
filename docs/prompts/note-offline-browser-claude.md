# Claude依頼用: note記事「オフラインブラウザ地図」初稿

**用途:** note向け初稿の生成（非IT層向け・T-Rex Runner理解層）  
**関連:** [`docs/notes/NOTE_OFFLINE_BROWSER_DRAFT_MEMO.md`](../notes/NOTE_OFFLINE_BROWSER_DRAFT_MEMO.md) · [`docs/notes/NOTE_ARTICLE_OFFLINE_BROWSER_DRAFT.md`](../notes/NOTE_ARTICLE_OFFLINE_BROWSER_DRAFT.md) · [`docs/notes/ZENN_ARTICLE_06_DRAFT.md`](../notes/ZENN_ARTICLE_06_DRAFT.md)  
**更新:** 2026-07-02

---

## Claude への依頼文（コピペ用）

```text
あなたは、日本の非エンジニア向けIT啓蒙記事を得意とする編集者です。
目的は、note向けの記事初稿を作ることです。
「技術的に正確さを保ちつつ、難語を避ける」ことを最優先にしてください。

【記事テーマ】
「オフラインのブラウザは何ができるのか」
- 想定読者は、T-Rex Runner（オフライン時の恐竜ゲーム）を目印にしている層
- ブラウザを「Webサイトを見るアプリ」としか認識していない人
- 画像/PDFビューアーとしてブラウザを使っている自覚が薄い人

【狙い】
1) 「オフライン」を3つに分けて理解してもらう
2) 「ブラウザで動く」=「送信していない」ではないと伝える
3) 社内で説明できる最低限の判断軸を渡す

【前提事実（この範囲で書く）】
- ブラウザは表示だけでなく、画像/PDF閲覧、ローカル処理、印刷などにも使われる
- サービスによってはブラウザUIでも裏でアップロード（POST）が発生する
- SUGUDASUのコア系ツール（normalize / webp-to-jpg / mask）はローカル処理中心
- Sync系は同期APIを使う別ラインであり、同じ「非送信」とは扱わない
- 「完全オフライン」「100%安全」は言わない

【絶対に避けること】
- 法的・セキュリティ上の断定（例: 絶対安全、完全匿名化）
- 競合サービスの誹謗
- 専門用語を連発して読者を置き去りにすること
- 実装していない機能（PWA完全対応等）の示唆

【出力仕様】
- 日本語
- note本文としてそのまま貼れる体裁
- 文字数: 1,800〜2,400字
- トーン: やさしいが、幼稚にしない
- 見出しは H2/H3 相当で読みやすく
- 箇条書きは最小限（多用しない）
- 最後に「明日から使えるチェックリスト（3〜5項目）」を入れる
- 末尾にCTAリンクを5本入れる（URLは下記をそのまま使用）

【必須で入れる要素】
1. 導入で「T-Rex Runner」への言及
2. 「3つのオフライン」の説明
   - ネット接続がない
   - 端末内で処理できる
   - サーバーへ送らない
3. ありがちな誤解を3つ
   - Wi-Fiを切れば安全
   - ブラウザで動く=非送信
   - 一度開けたら何でも使える
4. F12/DevToolsを使った最低限の確認手順（3ステップ）
5. SUGUDASUへの当てはめ（normalize / webp-to-jpg / mask / sync）

【CTAリンク（末尾にそのまま掲載）】
- https://sugudasu.com/statements?utm_source=note&utm_medium=social&utm_campaign=note_offline_browser_map
- https://sugudasu.com/mask?utm_source=note&utm_medium=social&utm_campaign=note_offline_browser_map
- https://sugudasu.com/webp-to-jpg?utm_source=note&utm_medium=social&utm_campaign=note_offline_browser_map
- https://sugudasu.com/normalize?utm_source=note&utm_medium=social&utm_campaign=note_offline_browser_map
- https://sugudasu.com/updates

【出力形式】
以下の順番で出力してください。
1) タイトル案（3案）
2) 採用タイトル（1案）
3) リード文（140字前後）
4) 本文
5) 末尾CTA
```

---

## 使い分けメモ（運用）

- **Claude:** 本文初稿（本プロンプト）
- **ChatGPT:** 平易化・短文化（スマホ読了最適化）
- **Gemini:** タイトル量産（10案）

---

## 結果受取後チェック

- [ ] 「3つのオフライン」が一読で区別できる
- [ ] 断定表現（絶対/100%/完全）が紛れ込んでいない
- [ ] Sync をコア非送信と混同していない
- [ ] DevTools 手順が非エンジニアでも追える
- [ ] CTA が note 文脈に自然につながる
