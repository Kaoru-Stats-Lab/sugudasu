# Gemini依頼用（完成版）: note連載 #7 線引きレイヤー（コア非送信 vs Sync）

**用途:** Geminiにそのまま投入して #7 初稿を生成する  
**話数:** note連載 #7（製品編への橋渡し回）  
**更新:** 2026-07-02  
**参照:** [`note-browser-series-gemini-ROLE.md`](note-browser-series-gemini-ROLE.md) · [`../notes/NOTE_BROWSER_SERIES_OUTLINE.md`](../notes/NOTE_BROWSER_SERIES_OUTLINE.md) · [`note-browser-series-ep06-audit-gemini-prompt.md`](note-browser-series-ep06-audit-gemini-prompt.md)

---

## Gemini へ送る本文（コピペ用）

```text
あなたは、非IT読者向けに技術テーマを平易化する「note連載エディター」です。
以下の条件で、note本文を日本語で執筆してください。

【連載情報】
- 連載名: ブラウザはなにをするものぞ
- 話数: #7
- レイヤー: 線引き（Boundary）
- テーマ: 同じSUGUDASUでも「コア非送信」と「Sync」は設計目的が違う
- 読者の疑問: 「同じブランドなのに、なぜ通信する機能があるの？」

【読者設定】
- 非IT層（事務・幹事・バックオフィス）
- 共通編 #1〜#6 を読み終えた想定
- ツール導入時に「全部同じ安全性」と誤解しやすい

【今回の到達目標】
読了後に読者が次を説明できる状態にする。
1) コア非送信製品とSync製品の目的差
2) 「通信の有無」ではなく「業務目的」で使い分ける視点
3) 社内説明時の言い方（混同を避ける）
4) 次回 #8（mask実践）に自然に接続できる

【絶対条件】
- 1記事1レイヤー（線引き）を守る
- コア非送信を過剰断定しない（100%安全/絶対など禁止）
- Syncを危険扱いしない（必要機能として説明）
- 実装の深掘り（CRDT詳細など）には入らない
- 競合誹謗禁止

【必須で入れる要素】
1. 冒頭で「同じサービス名なのに挙動が違って混乱する」フック
2. 2系統を明確に比較（表推奨）
   - コア非送信（mask / webp-to-jpg / normalize / invoice）
   - Sync（共有・同期が必要な機能）
3. 守る対象の違い
   - コア: 入力データを外に出さない設計を重視
   - Sync: 複数人の同時編集・共有の成立を重視
4. 現場の使い分け判断フロー（3ステップ）
5. 社内説明テンプレ（短文1本）
6. 次回 #8（mask実践）への自然な予告

【本文トーン】
- 丁寧で短文
- 対立構図ではなく、用途別の住み分けとして説明
- 不安を煽らず、判断軸を渡す

【文字数】
- 本文 1,900〜2,500字

【出力形式（この順番で）】
1) タイトル案（3案）
2) 採用タイトル（1案）
3) リード（120〜160字）
4) 本文
5) 使い分けチェックリスト（3〜5項目）
6) 社内説明テンプレ（短文1本）
7) 次回予告（#8 mask実践）
8) 末尾CTA（下記URLをそのまま掲載）
9) 自己監査（OK/NG + 1行理由）

【CTAリンク（固定）】
- https://sugudasu.com/statements?utm_source=note&utm_medium=social&utm_campaign=note_browser_series
- https://sugudasu.com/mask?utm_source=note&utm_medium=social&utm_campaign=note_browser_series
- https://sugudasu.com/webp-to-jpg?utm_source=note&utm_medium=social&utm_campaign=note_browser_series
- https://sugudasu.com/normalize?utm_source=note&utm_medium=social&utm_campaign=note_browser_series
- https://sugudasu.com/updates

【自己監査フォーマット】
- 線引きレイヤーから逸脱していないか
- 共通編 #1〜#6 の繰り返しが過多でないか
- 断定表現がないか
- Syncを不必要に危険視していないか
- 次回 #8 への橋渡しが明確か
```

---

## Cursor側メモ（受領後）

- 「非送信=善 / 同期=悪」の構図になっていないか確認
- コア/Syncの比較表が誤解を生む表現になっていないか点検
- `NOTE_ARTICLE_BROWSER_07_DRAFT.md` として保存
- #8（mask実践）の導線を最終調整
