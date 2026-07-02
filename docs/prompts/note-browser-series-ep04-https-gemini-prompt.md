# Gemini依頼用（完成版）: note連載 #4 保護レイヤー（HTTP/HTTPS）

**用途:** Geminiにそのまま投入して #4 初稿を生成する  
**話数:** note連載 #4（保護レイヤー）  
**更新:** 2026-07-02  
**参照:** [`note-browser-series-gemini-ROLE.md`](note-browser-series-gemini-ROLE.md) · [`../notes/NOTE_BROWSER_SERIES_OUTLINE.md`](../notes/NOTE_BROWSER_SERIES_OUTLINE.md) · [`note-browser-series-ep03-network-gemini-prompt.md`](note-browser-series-ep03-network-gemini-prompt.md)

---

## Gemini へ送る本文（コピペ用）

```text
あなたは、非IT読者向けに技術テーマを平易化する「note連載エディター」です。
以下の条件で、note本文を日本語で執筆してください。

【連載情報】
- 連載名: ブラウザはなにをするものぞ
- 話数: #4
- レイヤー: 保護（Protection）
- テーマ: HTTPとHTTPSの違い、鍵マーク、警告UI
- 読者の疑問: 「HTTPSなら100%安全？」

【読者設定】
- 非IT層（事務・幹事・バックオフィス）
- 「鍵マークがある=全部安全」と思いやすい
- 通信の一次確認（#3）は読了済み想定

【今回の到達目標】
読了後に読者が次を説明できる状態にする。
1) HTTPとHTTPSの違い（盗み見・改ざん耐性）
2) HTTPSで守れること / 守れないこと
3) 鍵マークと警告UIの実務的な見方
4) 「暗号化」と「サイトの信頼性」は別だと理解できる

【絶対条件】
- 1記事1レイヤー（保護）を守る
- 暗号アルゴリズム詳細（RSA/ECC/TLSハンドシェイク詳細）は書かない
- 保存レイヤー（Cookie/localStorage）へ脱線しない（#5へ回す）
- 断定禁止（100%安全、絶対安全）
- 競合誹謗禁止

【必須で入れる要素】
1. 冒頭で「鍵マークがあるのに不安」体験フック
2. HTTP/HTTPSを非IT向けに1段落で比較
3. 「守れること」と「守れないこと」を対で提示（最低3項目）
4. 警告UI（証明書警告・保護されていない通信）の読み方
5. 実務ルール（入力前にURL確認、警告時に止まる、社内相談）
6. SUGUDASU文脈に1段落接続（非送信設計の説明と混同しない）
7. 次回 #5（保存レイヤー）への自然な予告

【本文トーン】
- 丁寧で短文
- 不安を煽らず、行動基準を渡す
- 専門語は最小限（出す場合は注釈）

【文字数】
- 本文 1,900〜2,500字

【出力形式（この順番で）】
1) タイトル案（3案）
2) 採用タイトル（1案）
3) リード（120〜160字）
4) 本文
5) 5分セルフチェック（3〜5項目）
6) 次回予告（#5 保存レイヤー）
7) 末尾CTA（下記URLをそのまま掲載）
8) 自己監査（OK/NG + 1行理由）

【CTAリンク（固定）】
- https://sugudasu.com/statements?utm_source=note&utm_medium=social&utm_campaign=note_browser_series
- https://sugudasu.com/mask?utm_source=note&utm_medium=social&utm_campaign=note_browser_series
- https://sugudasu.com/webp-to-jpg?utm_source=note&utm_medium=social&utm_campaign=note_browser_series
- https://sugudasu.com/normalize?utm_source=note&utm_medium=social&utm_campaign=note_browser_series
- https://sugudasu.com/updates

【自己監査フォーマット】
- 保護レイヤーから逸脱していないか
- 前話 #3 と重複しすぎていないか
- 断定表現がないか
- 非IT読者でも判断基準として使えるか
- 次回 #5（保存）への橋渡しが明確か
```

---

## Cursor側メモ（受領後）

- #3との重複（Network手順）を圧縮
- HTTPS=安全の誤解を助長する言い回しを除去
- `NOTE_ARTICLE_BROWSER_04_DRAFT.md` として保存
- #5（保存レイヤー）への接続文を最終調整
