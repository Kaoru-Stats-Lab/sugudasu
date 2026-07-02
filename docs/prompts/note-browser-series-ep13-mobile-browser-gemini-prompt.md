# Gemini依頼用（完成版）: note連載 #13 スマホ時代のブラウザ実践編

**用途:** Geminiにそのまま投入して #13 初稿を生成する  
**話数:** note連載 #13（スピンオフ / スマホに引っ張られたブラウザ）  
**更新:** 2026-07-02  
**参照:** [`note-browser-series-gemini-ROLE.md`](note-browser-series-gemini-ROLE.md) · [`../notes/NOTE_BROWSER_SERIES_OUTLINE.md`](../notes/NOTE_BROWSER_SERIES_OUTLINE.md) · [`note-browser-series-ep12-sync-practice-gemini-prompt.md`](note-browser-series-ep12-sync-practice-gemini-prompt.md)

---

## Gemini へ送る本文（コピペ用）

```text
あなたは、非IT読者向けに技術テーマを平易化する「note連載エディター」です。
以下の条件で、note本文を日本語で執筆してください。

【連載情報】
- 連載名: ブラウザはなにをするものぞ
- 話数: #13（スピンオフ）
- テーマ: スマホ時代にブラウザがどう変わったか（実務目線）
- 読者の疑問: 「PCと同じ感覚でスマホブラウザを使うと、なぜ詰まる？」

【読者設定】
- 非IT層（事務・幹事・バックオフィス）
- スマホで撮影・確認、PCで提出のハイブリッド運用が多い
- 権限ポップアップや共有導線で迷いやすい

【今回の到達目標】
読了後に読者が次を説明できる状態にする。
1) スマホブラウザがPCと違う理由（入力UI・省電力・権限）
2) スマホ起点で起きる実務事故（形式エラー、誤共有）を予防できる
3) 「便利」と「安全」を両立する運用手順を持てる
4) 次回 #14（HEIC / 互換性）へ自然に接続できる

【絶対条件】
- 1記事1テーマ（スマホ時代ブラウザ）を守る
- 断定禁止（100%安全、絶対）
- 競合誹謗禁止
- OS/端末機種の細かい比較に深入りしすぎない

【必須で入れる要素】
1. 冒頭フック（スマホでは見えるのにPC提出で詰まる体験）
2. スマホブラウザの特徴を実務で説明
   - タップ前提UI
   - 権限ポップアップ（カメラ/写真/クリップボード）
   - 省電力やメモリ制約
3. 実務事故の典型3つと回避策
   - 画像形式（WebP/HEIC）で弾かれる
   - 共有先ミス（公開範囲の誤設定）
   - 入力途中データ消失（タブ切替・再読込）
4. スマホ→PC連携の安全フロー（撮影→整形→確認→提出）
5. SUGUDASU文脈への接続（mask / webp-to-jpg / normalize）
6. 次回 #14（HEICはなぜ詰まりやすい？）への自然な予告

【本文トーン】
- 丁寧で短文
- 実務手順重視
- 不安を煽らず、判断基準を渡す

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
6) 次回予告（#14 HEIC互換性編）
7) 末尾CTA（下記URLをそのまま掲載）
8) 自己監査（OK/NG + 1行理由）
9) 本文文字数（リンク除外）

【CTAリンク（固定）】
- https://sugudasu.com/statements?utm_source=note&utm_medium=social&utm_campaign=note_browser_series
- https://sugudasu.com/webp-to-jpg?utm_source=note&utm_medium=social&utm_campaign=note_browser_series
- https://sugudasu.com/mask?utm_source=note&utm_medium=social&utm_campaign=note_browser_series
- https://sugudasu.com/normalize?utm_source=note&utm_medium=social&utm_campaign=note_browser_series
- https://sugudasu.com/updates

【自己監査フォーマット】
- スマホ時代ブラウザテーマから逸脱していないか
- #9/#12との重複が過多でないか
- 断定表現がないか
- 非IT読者が明日実行できるか
- 次回 #14 への橋渡しが明確か
```

---

## Cursor側メモ（受領後）

- 端末依存の断定があれば緩和（「機種により異なる」を補足）
- 実務フローが抽象的なら「撮影→形式確認→変換→提出」に具体化
- `NOTE_ARTICLE_BROWSER_13_DRAFT.md` として保存
- #14（HEIC互換性編）導線を最終調整
