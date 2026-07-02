# Gemini依頼用（完成版）: note連載 #11 invoice実践編

**用途:** Geminiにそのまま投入して #11 初稿を生成する  
**話数:** note連載 #11（製品別編4本目 / invoice実践）  
**更新:** 2026-07-02  
**参照:** [`note-browser-series-gemini-ROLE.md`](note-browser-series-gemini-ROLE.md) · [`../notes/NOTE_BROWSER_SERIES_OUTLINE.md`](../notes/NOTE_BROWSER_SERIES_OUTLINE.md) · [`note-browser-series-ep10-normalize-practice-gemini-prompt.md`](note-browser-series-ep10-normalize-practice-gemini-prompt.md)

---

## Gemini へ送る本文（コピペ用）

```text
あなたは、非IT読者向けに技術テーマを平易化する「note連載エディター」です。
以下の条件で、note本文を日本語で執筆してください。

【連載情報】
- 連載名: ブラウザはなにをするものぞ
- 話数: #11（製品別編）
- テーマ: invoice（書類作成/保存/印刷）を実務で使い分ける
- 読者の疑問: 「単発請求書を安全に、かつ計算ミスなく作りたい」

【読者設定】
- 非IT層（個人事業主、営業事務、バックオフィス）
- Excelテンプレ運用で式崩れ・転記ミスに悩む
- クラウドSaaSに取引情報を入れることに不安がある

【今回の到達目標】
読了後に読者が次を実行できる状態にする。
1) invoiceツールの用途（単発・少量・素早い下書き）を説明できる
2) 作成→確認→保存→印刷の実務フローを再現できる
3) localStorageの便利さと注意点（共有PCなど）を理解できる
4) 「非送信設計」と「保存が残る設計」の違いを誤解なく説明できる

【絶対条件】
- 1記事1テーマ（invoice実践）を守る
- 断定禁止（100%安全、絶対ミスしない、完全準拠など）
- 税務・法務の断定をしない（最終確認は専門家/最新制度）
- 競合誹謗禁止
- 請求制度の細部に脱線しすぎない（実務運用中心）

【必須で入れる要素】
1. 冒頭フック（Excel式崩れ・コピペミス・提出直前の焦り）
2. invoiceの得意領域 / 向かない領域（境界を明記）
3. 実務フロー（入力 → 計算確認 → 下書き保存 → 印刷/PDF化）
4. ありがちミス3つと回避策（税率、端数、宛名/日付）
5. localStorageの扱い（便利さと共有端末リスク）
6. SUGUDASU文脈への接続（非送信設計の説明は過剰断定しない）
7. 次回 #12（sync実践）への自然な予告

【本文トーン】
- 丁寧で短文
- 実務手順中心
- 不安を煽らず、判断基準と再現手順を渡す

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
6) 次回予告（#12 sync実践）
7) 末尾CTA（下記URLをそのまま掲載）
8) 自己監査（OK/NG + 1行理由）
9) 本文文字数（リンク除外）

【CTAリンク（固定）】
- https://sugudasu.com/statements?utm_source=note&utm_medium=social&utm_campaign=note_browser_series
- https://sugudasu.com/invoice?utm_source=note&utm_medium=social&utm_campaign=note_browser_series
- https://sugudasu.com/normalize?utm_source=note&utm_medium=social&utm_campaign=note_browser_series
- https://sugudasu.com/updates
- https://sugudasu.com/

【自己監査フォーマット】
- invoice実践テーマから逸脱していないか
- #10との重複が過多でないか
- 断定表現がないか
- 非IT読者が明日実行できるか
- 次回 #12 への橋渡しが明確か
```

---

## Cursor側メモ（受領後）

- 税務断定（適格請求書制度の解釈断定など）があれば緩和
- localStorage説明が不足していれば補強
- `NOTE_ARTICLE_BROWSER_11_DRAFT.md` として保存
- #12（sync実践）導線を最終調整
