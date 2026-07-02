# Gemini依頼用（完成版）: note連載 #12 sync実践編（シリーズ最終回）

**用途:** Geminiにそのまま投入して #12 初稿を生成する  
**話数:** note連載 #12（製品別編5本目 / 最終回 / sync実践）  
**更新:** 2026-07-02  
**参照:** [`note-browser-series-gemini-ROLE.md`](note-browser-series-gemini-ROLE.md) · [`../notes/NOTE_BROWSER_SERIES_OUTLINE.md`](../notes/NOTE_BROWSER_SERIES_OUTLINE.md) · [`note-browser-series-ep11-invoice-practice-gemini-prompt.md`](note-browser-series-ep11-invoice-practice-gemini-prompt.md)

---

## Gemini へ送る本文（コピペ用）

```text
あなたは、非IT読者向けに技術テーマを平易化する「note連載エディター」です。
以下の条件で、note本文を日本語で執筆してください。

【連載情報】
- 連載名: ブラウザはなにをするものぞ
- 話数: #12（シリーズ最終回）
- テーマ: sync（同期運用）を社内で安全に使いこなす実務ルール
- 読者の疑問: 「通信が必要なツールを、どう説明し、どう安全運用する？」

【読者設定】
- 非IT層（事務・幹事・バックオフィス）
- #1〜#11を読了済み想定
- 「非送信は安心」「通信は不安」という二元論に陥りやすい

【今回の到達目標】
読了後に読者が次を説明できる状態にする。
1) Syncが通信を必要とする理由（共同作業成立のため）を説明できる
2) コア非送信製品との違いを誤解なく説明できる
3) 社内申請・情シス説明で通る情報整理ができる
4) 運用ルール（権限、共有範囲、ログ確認）を実務に落とし込める

【絶対条件】
- 1記事1テーマ（sync実践）を守る
- Syncを危険扱いしない（必要機能として説明）
- 断定禁止（100%安全、絶対）
- 競合誹謗禁止
- 実装詳細（CRDTアルゴリズム等）に深入りしない

【必須で入れる要素】
1. 冒頭フック（共有表の行き違い・版ズレ事故）
2. 「なぜ通信が必要か」の非IT向け説明
3. コア非送信 vs Sync の比較（表推奨）
4. 実務運用ルール（最低5項目）
   - 共有対象データの定義
   - 編集権限の分離
   - URL共有ルール
   - 変更履歴/ログの扱い
   - 退職・異動時のアクセス見直し
5. 社内申請テンプレ（短文1本）
6. 「一次確認」と「運用統制」の違いを明示
7. シリーズ総括（#1〜#12の学びを1段で回収）

【本文トーン】
- 丁寧で短文
- 対立ではなく使い分けを強調
- 不安を煽らず、運用基準を渡す

【文字数ルール（重要）】
- 本文の目安文字数: 2,000〜2,700字
- 文字数カウント対象: 「タイトル案」「採用タイトル」「リード」「本文」「チェックリスト」「シリーズ総括」「自己監査」
- 文字数カウント対象外: 「末尾CTAリンクのURL文字列」と「リンク見出し行」
- 出力末尾で「本文文字数（リンク除外）」を自己申告する

【出力形式（この順番で）】
1) タイトル案（3案）
2) 採用タイトル（1案）
3) リード（120〜160字）
4) 本文
5) 5分運用チェックリスト（3〜5項目）
6) 社内申請テンプレ（短文1本）
7) シリーズ総括（読者が得た判断力を1段落で）
8) 末尾CTA（下記URLをそのまま掲載）
9) 自己監査（OK/NG + 1行理由）
10) 本文文字数（リンク除外）

【CTAリンク（固定）】
- https://sugudasu.com/statements?utm_source=note&utm_medium=social&utm_campaign=note_browser_series
- https://sync.sugudasu.com/timeline?utm_source=note&utm_medium=social&utm_campaign=note_browser_series
- https://sugudasu.com/mask?utm_source=note&utm_medium=social&utm_campaign=note_browser_series
- https://sugudasu.com/normalize?utm_source=note&utm_medium=social&utm_campaign=note_browser_series
- https://sugudasu.com/updates

【自己監査フォーマット】
- sync実践テーマから逸脱していないか
- #7/#11との重複が過多でないか
- 断定表現がないか
- 非IT読者が実務運用に落とし込めるか
- シリーズ最終回として回収できているか
```

---

## Cursor側メモ（受領後）

- 「非送信=善 / 同期=悪」構図になっていないか確認
- 申請テンプレが長すぎれば短縮
- `NOTE_ARTICLE_BROWSER_12_DRAFT.md` として保存
- 必要ならシリーズ総集編リンクを追記
