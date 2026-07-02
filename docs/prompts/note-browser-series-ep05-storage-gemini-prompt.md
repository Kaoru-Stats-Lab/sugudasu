# Gemini依頼用（完成版）: note連載 #5 保存レイヤー

**用途:** Geminiにそのまま投入して #5 初稿を生成する  
**話数:** note連載 #5（保存レイヤー）  
**更新:** 2026-07-02  
**参照:** [`note-browser-series-gemini-ROLE.md`](note-browser-series-gemini-ROLE.md) · [`../notes/NOTE_BROWSER_SERIES_OUTLINE.md`](../notes/NOTE_BROWSER_SERIES_OUTLINE.md) · [`note-browser-series-ep04-https-gemini-prompt.md`](note-browser-series-ep04-https-gemini-prompt.md)

---

## Gemini へ送る本文（コピペ用）

```text
あなたは、非IT読者向けに技術テーマを平易化する「note連載エディター」です。
以下の条件で、note本文を日本語で執筆してください。

【連載情報】
- 連載名: ブラウザはなにをするものぞ
- 話数: #5
- レイヤー: 保存（Storage）
- テーマ: メモリ / キャッシュ / Cookie / localStorage / SessionStorage / 権限
- 読者の疑問: 「ブラウザを閉じたらデータはどこへ消える？」

【読者設定】
- 非IT層（事務・幹事・バックオフィス）
- 「消したはずなのに残る」「ログインが残る」の体験がある
- 技術用語は最小限にしたい

【今回の到達目標】
読了後に読者が次を説明できる状態にする。
1) メモリ・キャッシュ・Cookie・localStorage・SessionStorage の違い
2) 「閉じる/再起動/ログアウト」で何が残るかの見方
3) 権限設定（カメラ/位置情報/クリップボード）は別管理だと理解
4) 共有PCでの最低限の運用ルールを実行できる

【絶対条件】
- 1記事1レイヤー（保存）を守る
- 通信（POST）やHTTPS詳細へ脱線しない（#3/#4へ回す）
- 断定禁止（100%安全、完全削除、絶対）
- 競合誹謗禁止
- 法的断定をしない

【必須で入れる要素】
1. 冒頭で「消したはずなのに残っていた」体験フック
2. 次を非IT向け比喩で説明
   - メモリ（机の上）
   - キャッシュ（近道用コピー）
   - Cookie（会員証）
   - localStorage（引き出し）
   - SessionStorage（その作業中だけの引き出し）
3. 「タブを閉じる」「ブラウザを閉じる」「再起動」「ログアウト」での違い
4. 権限設定は保存データと別に残ること（許可/ブロック）
5. DevTools Applicationタブの最低限確認ポイント（難しくしない）
6. SUGUDASU文脈への接続（invoice・normalize・mask・webp-to-jpg）
7. 次回 #6（5分セルフ監査）への自然な予告

【本文トーン】
- 丁寧で短文
- 不安を煽らず、運用ルールを渡す
- 専門語は最小限（出す場合は1行注釈）

【文字数】
- 本文 2,000〜2,600字

【出力形式（この順番で）】
1) タイトル案（3案）
2) 採用タイトル（1案）
3) リード（120〜160字）
4) 本文
5) 5分セルフチェック（3〜5項目）
6) 次回予告（#6 5分セルフ監査）
7) 末尾CTA（下記URLをそのまま掲載）
8) 自己監査（OK/NG + 1行理由）

【CTAリンク（固定）】
- https://sugudasu.com/statements?utm_source=note&utm_medium=social&utm_campaign=note_browser_series
- https://sugudasu.com/invoice?utm_source=note&utm_medium=social&utm_campaign=note_browser_series
- https://sugudasu.com/normalize?utm_source=note&utm_medium=social&utm_campaign=note_browser_series
- https://sugudasu.com/mask?utm_source=note&utm_medium=social&utm_campaign=note_browser_series
- https://sugudasu.com/updates

【自己監査フォーマット】
- 保存レイヤーから逸脱していないか
- 前話 #4 と重複しすぎていないか
- 断定表現がないか
- 非IT読者でも明日実行できる内容か
- 次回 #6 への橋渡しが明確か
```

---

## Cursor側メモ（受領後）

- #3/#4の通信・保護話が混入していれば圧縮
- 「完全削除」「絶対残らない」などの言い切りを除去
- `NOTE_ARTICLE_BROWSER_05_DRAFT.md` として保存
- #6（セルフ監査回）に繋がる締めを最終調整
