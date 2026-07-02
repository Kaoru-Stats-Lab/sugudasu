# Gemini依頼用（完成版）: note連載 #8 mask実践編

**用途:** Geminiにそのまま投入して #8 初稿を生成する  
**話数:** note連載 #8（製品別編1本目 / mask実践）  
**更新:** 2026-07-02  
**参照:** [`note-browser-series-gemini-ROLE.md`](note-browser-series-gemini-ROLE.md) · [`../notes/NOTE_BROWSER_SERIES_OUTLINE.md`](../notes/NOTE_BROWSER_SERIES_OUTLINE.md) · [`note-browser-series-ep07-boundary-gemini-prompt.md`](note-browser-series-ep07-boundary-gemini-prompt.md)

---

## Gemini へ送る本文（コピペ用）

```text
あなたは、非IT読者向けに技術テーマを平易化する「note連載エディター」です。
以下の条件で、note本文を日本語で執筆してください。

【連載情報】
- 連載名: ブラウザはなにをするものぞ
- 話数: #8（製品別編）
- テーマ: mask（スクショ機密消し）を実務で使い分ける
- 読者の疑問: 「黒塗り・モザイク・スタンプ、どれをどう使えば事故を減らせる？」

【読者設定】
- 非IT層（事務・幹事・バックオフィス）
- マニュアル作成・障害報告・外注依頼資料でスクショを使う
- 「とりあえずスタンプで隠したつもり」事故を防ぎたい

【今回の到達目標】
読了後に読者が次を実行できる状態にする。
1) 黒塗り / モザイク / スタンプの用途を使い分けられる
2) 「スタンプだけでは隠れない」を理解できる
3) 作業前後チェック（塗り残し・誤共有）を実務に入れられる
4) 非送信設計の価値と限界を誤解なく説明できる

【絶対条件】
- 1記事1テーマ（mask実践）を守る
- 断定禁止（100%安全、完全匿名化、絶対）
- 「スタンプだけで機密が隠れる」と読める表現は禁止
- 競合誹謗禁止
- 法的断定をしない

【必須で入れる要素】
1. 冒頭フック（「隠したつもり」で流出しそうになった体験）
2. 3機能の使い分け表（黒塗り / モザイク / スタンプ）
3. 実務フロー（読込 → 加工 → 見直し → 出力）
4. ありがちミス3つと回避策
5. 5分チェックリスト（共有前チェック）
6. SUGUDASU文脈（非送信設計の説明。ただし過剰断定しない）
7. 次回 #9（webp-to-jpg実践）への自然な予告

【本文トーン】
- 丁寧で短文
- 実務手順中心
- 不安を煽らず、再現できる手順を渡す

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
6) 次回予告（#9 webp-to-jpg実践）
7) 末尾CTA（下記URLをそのまま掲載）
8) 自己監査（OK/NG + 1行理由）
9) 本文文字数（リンク除外）

【CTAリンク（固定）】
- https://sugudasu.com/statements?utm_source=note&utm_medium=social&utm_campaign=note_browser_series
- https://sugudasu.com/mask?utm_source=note&utm_medium=social&utm_campaign=note_browser_series
- https://sugudasu.com/webp-to-jpg?utm_source=note&utm_medium=social&utm_campaign=note_browser_series
- https://sugudasu.com/normalize?utm_source=note&utm_medium=social&utm_campaign=note_browser_series
- https://sugudasu.com/updates

【自己監査フォーマット】
- mask実践テーマから逸脱していないか
- #7との重複が過多でないか
- 断定表現がないか
- スタンプ単体の危険が明確か
- 次回 #9 への橋渡しが明確か
```

---

## Cursor側メモ（受領後）

- 「スタンプ単体不可」の表現が本文とチェックリストで一致しているか確認
- 非送信の説明が過剰断定になっていれば緩和
- `NOTE_ARTICLE_BROWSER_08_DRAFT.md` として保存
- #9（webp-to-jpg実践）導線を最終調整
