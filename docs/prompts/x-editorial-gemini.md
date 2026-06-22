# Gemini依頼用: X（@sugudasu）文案 — 生成・監査

**用途:** 週5〜7本の投稿案 · 公開告知 · トーンチェック  
**正本運用:** `docs/x_guideline.md`  
**更新:** 2026-06-21

---

## ROLE 早見

| 型 | 割合 | Gemini がやること |
|----|------|-------------------|
| ① 課題解決型 | 50% | Pain 1行 + 便益 + 直リンク |
| ② FAQユーモア型 | 20% | invoice FAQ 由来の Q&A のみ |
| ③ エゴサリプライ型 | 20% | **1行テンプレ** · 長文禁止 |
| ④ 更新告知 | 10% | changelog 事実のみ |

**禁止:** 挨拶単体 · 競合名指し · 「No.1」· Google 検索 URL · リプライ長文

---

## Gemini への依頼文 — 文案生成（コピペ用）

```text
あなたは B2B/SMB 向け実務ツールの X 文案担当です。
礼賛・前置き不要。指定フォーマットのみ出力。

【ROLE】
@sugudasu 向け投稿案を {N} 本。各280字以内（URL除く）。ハッシュタグは0〜2個。

【プロダクト】
SUGUDASU — 登録不要 · ブラウザ内完結 · 入力データは原則非送信
https://sugudasu.com/

【今回の指定】
- 主ツール: {TOOL}（例: group-split / invoice）
- 型: {①課題解決 | ②FAQユーモア | ④更新告知 | 混合}
- 素材（事実のみ）:
{BULLETS}

【トーン】
- 実利9割 · ユーモア1割（FAQ型のみ）
- 「100%」「業界最強」禁止
- クラウド型 vs その場完結型まで（freee/MF 名指し禁止）
- 政治・税制批判禁止

【URL 規約 — 必須】
https://sugudasu.com/{path}?utm_source=x&utm_medium=social&utm_campaign={campaign}
※ google.com/search 経由 URL は絶対に出さない

【出力フォーマット】

### 投稿案 1
本文:
URL:
campaign:
型:
添付画像メモ（1行 · 任意）:

（… N 本繰り返し）

### NG 自己チェック
| 項目 | OK/NG |
| 直リンク | |
| 280字以内 | |
| 名指し批判なし | |
```

---

## Gemini への依頼文 — 文案監査（コピペ用）

```text
あなたは X 運用の監査編集者です。礼賛禁止。書き直しは最小限。

添付文案について、次のみ出力:

§1 x_guideline 違反（最大5件 · 該当行を引用）
§2 直リンク/UTM 不備
§3 誇大表現の言い換え案（各1行 · 最大3件）
§4 採用判定（Go / 修正後Go / 却下）

本文の全面リライトはしない。
```

---

## 公開告知テンプレ（Zenn / note 連動）

```text
【今回の指定】
- 型: ④更新告知 + ①課題解決の混合 1本
- 素材:
  - 新規公開: {Zenn|note}「{タイトル}」
  - リンク: {ARTICLE_URL}?utm_source=x&utm_medium=social&utm_campaign={campaign}
  - 1 Pain: {1行}
```

**campaign 例:** `zenn_article_14_group_split` · `note_subtraction_01`

---

## 関連

- 初回5本コピペ: `docs/x_guideline.md` §8
- チャネル ROLE: `editorial-roles-gemini.md`
