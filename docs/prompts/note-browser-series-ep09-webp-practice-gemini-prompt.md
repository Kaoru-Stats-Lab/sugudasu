# Gemini依頼用（完成版）: note連載 #9 webp-to-jpg実践編

**用途:** Geminiにそのまま投入して #9 初稿を生成する  
**話数:** note連載 #9（製品別編2本目 / webp-to-jpg実践）  
**更新:** 2026-07-02  
**参照:** [`note-browser-series-gemini-ROLE.md`](note-browser-series-gemini-ROLE.md) · [`../notes/NOTE_BROWSER_SERIES_OUTLINE.md`](../notes/NOTE_BROWSER_SERIES_OUTLINE.md) · [`note-browser-series-ep08-mask-practice-gemini-prompt.md`](note-browser-series-ep08-mask-practice-gemini-prompt.md)

---

## Gemini へ送る本文（コピペ用）

```text
あなたは、非IT読者向けに技術テーマを平易化する「note連載エディター」です。
以下の条件で、note本文を日本語で執筆してください。

【連載情報】
- 連載名: ブラウザはなにをするものぞ
- 話数: #9（製品別編）
- テーマ: webp-to-jpg（画像変換）を実務で使い分ける
- 読者の疑問: 「WebP/HEICが提出先で弾かれる。安全にJPGへ変換したい」

【読者設定】
- 非IT層（事務・幹事・バックオフィス）
- 経費精算、社内Wiki、フォーム添付で画像形式エラーを経験済み
- 外部アップロード型ツールへの不安がある

【今回の到達目標】
読了後に読者が次を実行できる状態にする。
1) WebPが業務で詰まりやすい理由を説明できる
2) JPG/PNGの使い分けを実務で判断できる
3) 変換前後のチェック（画質・向き・文字つぶれ）を習慣化できる
4) 非送信設計の価値と限界を誤解なく説明できる

【絶対条件】
- 1記事1テーマ（webp-to-jpg実践）を守る
- 断定禁止（100%安全、絶対、完全対応）
- 競合誹謗禁止
- 法的断定をしない
- HEICの詳細規格史へ脱線しすぎない（実務中心）

【必須で入れる要素】
1. 冒頭フック（「提出先で画像が弾かれた」あるある）
2. WebP/HEIC/JPG/PNGの超実務比較（難語なし）
3. 変換時の判断ポイント
   - 文字の可読性
   - 写真の劣化許容
   - 透過の要否
4. 実務フロー（読込 → 変換 → 目視確認 → 提出）
5. よくあるミス3つと回避策
6. SUGUDASU文脈への接続（ブラウザ内処理・非送信説明は過剰断定しない）
7. 次回 #10（normalize実践）への自然な予告

【本文トーン】
- 丁寧で短文
- 実務で即使える判断基準を優先
- 不安を煽らず、手順を渡す

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
6) 次回予告（#10 normalize実践）
7) 末尾CTA（下記URLをそのまま掲載）
8) 自己監査（OK/NG + 1行理由）
9) 本文文字数（リンク除外）

【CTAリンク（固定）】
- https://sugudasu.com/statements?utm_source=note&utm_medium=social&utm_campaign=note_browser_series
- https://sugudasu.com/webp-to-jpg?utm_source=note&utm_medium=social&utm_campaign=note_browser_series
- https://sugudasu.com/normalize?utm_source=note&utm_medium=social&utm_campaign=note_browser_series
- https://sugudasu.com/mask?utm_source=note&utm_medium=social&utm_campaign=note_browser_series
- https://sugudasu.com/updates

【自己監査フォーマット】
- webp-to-jpg実践テーマから逸脱していないか
- #8との重複が過多でないか
- 断定表現がないか
- 非IT読者が明日実行できるか
- 次回 #10 への橋渡しが明確か
```

---

## Cursor側メモ（受領後）

- 「HEIC規格史」の説明が長すぎる場合は実務判断へ圧縮
- JPG/PNGの使い分け表現が過剰断定なら緩和
- `NOTE_ARTICLE_BROWSER_09_DRAFT.md` として保存
- #10（normalize実践）導線を最終調整
