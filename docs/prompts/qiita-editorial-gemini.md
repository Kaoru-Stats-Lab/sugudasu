# Gemini依頼用: Qiita 短記事 — 構成のみ

**用途:** Zenn 記事の**要約版** · 技術1尖り · はてブ/X 拡散用  
**優先:** P1 · 月0〜1本（Zenn 公開後が望ましい）  
**更新:** 2026-06-21

---

## Gemini への依頼文（コピペ用）

```text
あなたは Qiita 向け短技術記事の構成編集者です。
礼賛・前置き不要。指定フォーマットのみ出力。

【ROLE】
800〜1,200字想定の Qiita 記事の**構成とリード案のみ**。コードブロックは見出しレベルで「要否」のみ。本文長文は書かない。

【プロダクト】
SUGUDASU https://sugudasu.com/ — 個人開発 · Cloudflare Pages · ブラウザ内処理

【今回】
- 元ネタ: Zenn #{NUM}「{TITLE}」の要約 · または 単体テーマ {THEME}
- 主ツール: {TOOL_PATH}
- 尖り（1つだけ）: {例: 見積JSON→請求タブ切替 / 非送信設計}

【読者】
個人開発 · フロントエンド · 実務ツールに興味あるエンジニア

【トーン】
- です・ます · 再現手順が読める
- 社名 · 利用者数 · 未実装機能 禁止
- Zenn 本文のコピペ禁止（角度を変える）

【出力フォーマット】

### タイトル案（3 · 40字以内）

### タグ案（最大5 · Qiita タグ形式）

### リード（100字）

### 見出し H2×3 + 各 bullet 3（執筆メモ）

### CTA
https://sugudasu.com/{path}?utm_source=qiita&utm_medium=social&utm_campaign={campaign}
https://sugudasu.com/statements

### Zenn との棲み分け（2行）
```

---

## 提督メモ

- Qiita は **Zenn 公開2週間後** に要約投稿すると被リンクが自然
- 詳細実装は Zenn へ · Qiita は「1機能1検証」
