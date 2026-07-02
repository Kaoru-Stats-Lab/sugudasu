# Gemini依頼用（完成版）: note連載 #5 保存レイヤー

**用途:** Geminiにそのまま投入して #5 初稿を生成する  
**話数:** note連載 #5（保存レイヤー）  
**更新:** 2026-07-02  
**参照:** [`note-browser-series-gemini-ROLE.md`](note-browser-series-gemini-ROLE.md) · [`../notes/NOTE_BROWSER_SERIES_OUTLINE.md`](../notes/NOTE_BROWSER_SERIES_OUTLINE.md)

---

## Gemini へ送る本文（コピペ用）

```text
あなたは、非IT読者向けに技術テーマを平易化する「note連載エディター」です。
以下の条件で、note本文を日本語で執筆してください。

【連載情報】
- 連載名: ブラウザはなにをするものぞ
- 話数: #5
- レイヤー: 保存（Storage）
- テーマ: キャッシュ / クッキー / localStorage / SessionStorage / 権限
- 読者の疑問: 「ブラウザを閉じたらデータは消える？」

【読者設定】
- 非IT層（T-Rex Runnerがオフラインの目印でも読める）
- 事務・幹事・バックオフィス中心
- 専門語に抵抗あり

【今回の到達目標】
読了後に読者が次を説明できる状態にする。
1) キャッシュとクッキーの違い
2) localStorage と SessionStorage の違い
3) 「閉じたら消えるもの / 残るもの」の見分け方
4) 共有PCで何に注意すべきか

【絶対条件】
- 断定禁止（100%安全、完全匿名化、絶対安全）
- 競合誹謗禁止
- 暗号アルゴリズムなど高度技術へ脱線しない
- Syncの詳細実装説明に入らない（線引きに1段落触れるのは可）
- 1記事1レイヤー（保存）を守る

【必須で入れる要素】
1. 冒頭で「消したはずなのに残っている」体験をフックにする
2. 次の5つを平易に説明
   - メモリ（一時）
   - キャッシュ
   - Cookie
   - localStorage
   - SessionStorage
3. 権限（カメラ/位置情報/クリップボード）は「保存される設定」であること
4. DevToolsの Application タブを使う最低限の確認（3ステップ）
5. 共有PC向けの注意（ログアウト・保存データ確認・権限見直し）
6. SUGUDASU文脈への接続（invoice下書き、mask/webp-to-jpg/normalize）

【本文トーン】
- 丁寧で短文
- 比喩を使う（例: Cookie=会員証、localStorage=引き出し）
- 不安を煽らず、判断材料を渡す

【文字数】
- 本文 1,900〜2,500字

【出力形式（この順番で）】
1) タイトル案（3案）
2) 採用タイトル（1案）
3) リード（120〜160字）
4) 本文
5) 明日から使えるチェックリスト（3〜5項目）
6) 末尾CTA（下記URLをそのまま掲載）
7) 自己監査（OK/NG + 1行理由）

【CTAリンク（固定）】
- https://sugudasu.com/statements?utm_source=note&utm_medium=social&utm_campaign=note_browser_series
- https://sugudasu.com/invoice?utm_source=note&utm_medium=social&utm_campaign=note_browser_series
- https://sugudasu.com/mask?utm_source=note&utm_medium=social&utm_campaign=note_browser_series
- https://sugudasu.com/normalize?utm_source=note&utm_medium=social&utm_campaign=note_browser_series
- https://sugudasu.com/updates

【自己監査フォーマット】
- MECE軸逸脱がないか
- 前後回との重複が過多でないか
- 断定表現がないか
- 非IT読者でも追える語彙か
- 実務行動（チェックリスト）が具体か
```

---

## Cursor側メモ（受領後）

- 事実整合（用語・挙動）チェック
- 誇大表現の削除
- `NOTE_ARTICLE_BROWSER_05_DRAFT.md` へ保存
- #6（監査回）と重複しすぎる段落を圧縮
