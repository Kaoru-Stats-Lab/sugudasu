# Gemini依頼用（完成版）: note連載 #14 HEIC互換性編

**用途:** Geminiにそのまま投入して #14 初稿を生成する  
**話数:** note連載 #14（スピンオフ / HEIC互換性）  
**更新:** 2026-07-02  
**参照:** [`note-browser-series-gemini-ROLE.md`](note-browser-series-gemini-ROLE.md) · [`../notes/NOTE_BROWSER_SERIES_OUTLINE.md`](../notes/NOTE_BROWSER_SERIES_OUTLINE.md) · [`note-browser-series-ep13-mobile-browser-gemini-prompt.md`](note-browser-series-ep13-mobile-browser-gemini-prompt.md)

---

## Gemini へ送る本文（コピペ用）

```text
あなたは、非IT読者向けに技術テーマを平易化する「note連載エディター」です。
以下の条件で、note本文を日本語で執筆してください。

【連載情報】
- 連載名: ブラウザはなにをするものぞ
- 話数: #14（スピンオフ）
- テーマ: HEICはなぜ実務で詰まりやすいのか（互換性と対処）
- 読者の疑問: 「iPhone写真が提出先で弾かれるのはなぜ？どう直せば安全？」

【読者設定】
- 非IT層（事務・幹事・バックオフィス）
- スマホ撮影→PC提出の運用が多い
- ファイル形式の違いを普段意識していない

【今回の到達目標】
読了後に読者が次を説明できる状態にする。
1) HEICが“悪い形式”ではなく“互換性ギャップ”で詰まると理解できる
2) 実務で使う形式（JPG/PNG）を状況に応じて選べる
3) 変換前後の確認手順（文字可読性・向き・容量）を実行できる
4) 外部送信リスクに配慮した運用を説明できる

【絶対条件】
- 1記事1テーマ（HEIC互換性）を守る
- 断定禁止（100%安全、絶対）
- 競合誹謗禁止
- 規格史の深掘り（技術史）に脱線しすぎない
- 法的断定をしない

【必須で入れる要素】
1. 冒頭フック（「スマホでは見えるのに提出先で弾かれる」）
2. HEIC / JPG / PNG の実務比較（難語なし）
3. なぜ詰まるか（受け側システムの対応差）を平易に説明
4. 実務フロー（撮影 → 形式確認 → 変換 → 目視確認 → 提出）
5. よくあるミス3つと回避策
   - 変換後の向き崩れ
   - 文字潰れ
   - 元ファイル再添付
6. SUGUDASU文脈への接続（webp-to-jpg など）
7. 次回 #15（ブラウザ安全処理の歴史スピンオフ）への自然な予告

【本文トーン】
- 丁寧で短文
- 実務手順中心
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
6) 次回予告（#15 スピンオフ）
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
- HEIC互換性テーマから逸脱していないか
- #9/#13との重複が過多でないか
- 断定表現がないか
- 非IT読者が明日実行できるか
- 次回 #15 への橋渡しが明確か
```

---

## Cursor側メモ（受領後）

- 「HEIC=危険」という誤解を生む文を削除
- 互換性の問題を「送信安全性」と混同していないか確認
- `NOTE_ARTICLE_BROWSER_14_DRAFT.md` として保存
- #15導線（歴史スピンオフ）を最終調整
