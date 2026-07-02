# Gemini依頼用（完成版）: note連載 #6 5分セルフ監査（共通編最終回）

**用途:** Geminiにそのまま投入して #6 初稿を生成する  
**話数:** note連載 #6（確認レイヤー / 共通編最終回）  
**更新:** 2026-07-02  
**参照:** [`note-browser-series-gemini-ROLE.md`](note-browser-series-gemini-ROLE.md) · [`../notes/NOTE_BROWSER_SERIES_OUTLINE.md`](../notes/NOTE_BROWSER_SERIES_OUTLINE.md) · [`note-browser-series-ep05-storage-gemini-prompt.md`](note-browser-series-ep05-storage-gemini-prompt.md)

---

## Gemini へ送る本文（コピペ用）

```text
あなたは、非IT読者向けに技術テーマを平易化する「note連載エディター」です。
以下の条件で、note本文を日本語で執筆してください。

【連載情報】
- 連載名: ブラウザはなにをするものぞ
- 話数: #6（共通編の最終回）
- レイヤー: 確認（5分セルフ監査）
- テーマ: 新しいWebツールを使う前に、5分で安全性を一次確認する手順
- 読者の疑問: 「結局、何を見れば“使ってよいか”判断できるの？」

【読者設定】
- 非IT層（事務・幹事・バックオフィス）
- これまで #1〜#5 をざっくり読んだ想定
- 情シスに丸投げせず、最低限の自己判断をしたい

【今回の到達目標】
読了後に読者が次を実行できる状態にする。
1) 5分セルフ監査の手順を上から順に実施できる
2) 「一次確認」と「最終判断」の違いを説明できる
3) 社内共有用に短い説明文をコピペできる
4) 次回 #7（コア非送信 vs Sync）へ自然に入れる

【絶対条件】
- 1記事1レイヤー（確認）を守る
- #1〜#5の詳細解説を繰り返しすぎない（要約に留める）
- 断定禁止（100%安全、絶対安全、完全匿名化）
- 競合誹謗禁止
- 法的断定をしない

【必須で入れる要素】
1. 冒頭で「情シス待ちで止まる現場」の共感フック
2. 5分セルフ監査のチェック手順（時系列）
   - URL/警告UI確認
   - F12 Networkで送信有無の一次確認
   - F12 Applicationで保存レイヤー確認
   - 規約/プライバシー説明の確認
   - 社内ルール照合（迷ったら相談）
3. 「GO / 保留 / NG」の三段判定ルール
4. 社内共有用の短文テンプレ（コピペ可）
5. SUGUDASU文脈への接続（#7 線引きレイヤーの予告）

【本文トーン】
- 丁寧で短文
- 実務手順重視（抽象論を減らす）
- 不安を煽らず、判断フレームを渡す

【文字数】
- 本文 2,000〜2,700字

【出力形式（この順番で）】
1) タイトル案（3案）
2) 採用タイトル（1案）
3) リード（120〜160字）
4) 本文
5) 5分セルフ監査シート（そのまま使える箇条書き）
6) 社内共有テンプレ（短文2パターン）
7) 次回予告（#7 コア非送信 vs Sync）
8) 末尾CTA（下記URLをそのまま掲載）
9) 自己監査（OK/NG + 1行理由）

【CTAリンク（固定）】
- https://sugudasu.com/statements?utm_source=note&utm_medium=social&utm_campaign=note_browser_series
- https://sugudasu.com/mask?utm_source=note&utm_medium=social&utm_campaign=note_browser_series
- https://sugudasu.com/webp-to-jpg?utm_source=note&utm_medium=social&utm_campaign=note_browser_series
- https://sugudasu.com/normalize?utm_source=note&utm_medium=social&utm_campaign=note_browser_series
- https://sugudasu.com/updates

【自己監査フォーマット】
- 確認レイヤーから逸脱していないか
- #1〜#5の重複が過多でないか
- 断定表現がないか
- 非IT読者が5分で実行できるか
- 次回 #7 への橋渡しが明確か
```

---

## Cursor側メモ（受領後）

- #1〜#5の説明が長い場合は監査手順中心に圧縮
- GO/保留/NG判定が曖昧なら明文化
- `NOTE_ARTICLE_BROWSER_06_DRAFT.md` として保存
- #7（線引きレイヤー）への接続文を最終調整
