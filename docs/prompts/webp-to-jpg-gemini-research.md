# Gemini依頼用: WebP→JPG/PNG（T09 · webp-to-jpg）リサーチ

**用途:** Zenn / SEO / 製品境界の **調査表のみ**（本文執筆禁止）  
**実装:** `tools/webp-to-jpg.html` · `assets/webp-to-jpg.js`  
**更新:** 2026-06-19

---

## Gemini への依頼文（コピペ用）

```text
あなたは日本語の業務効率化・デスクトップ周辺UXに詳しい調査アシスタントです。
礼賛・前置き・記事本文は不要。指定フォーマットの表と箇条書きのみ出力してください。

【背景（調査の前提）】
- ユーザー痛点: WebP 画像を Excel / Word / 旧ソフト / 社内ツールに貼れない・開けない
- 既存解: iLovePDF 等のアップロード型コンバータ、OS標準アプリ、画像ビューア
- 自作ツール方向: ブラウザ内 Canvas のみ（非送信）· WebP⇄PNG/JPEG · PDF/一括圧縮は対象外

【依頼1】WebP 変換まわりの「ユーザーあるある」表
次の列で **最大15行**（各セル100字以内）。

列: シーン | 困りごと | よく使う回避策 | 回避策の弱点 | ローカル変換が効く条件

シーン例: Excel貼付 / PowerPoint / 印刷 / メール添付 / 社内ポータル / Windows標準ビューア 等

【依頼2】アップロード型 vs ブラウザ内処理 — 比較表
**特定サービス名は最大3つまで**（例: iLovePDF 程度の代表格）。それ以外は「アップロード型コンバータ一般」。

列: 観点 | アップロード型（一般） | ブラウザ内Canvas（一般） | 向いている人

観点例: データの行き先 / 機能の厚み（PDF・圧縮） / 待ち時間 / アカウント / 機密スクショ / オフライン / 枚数上限 / 透過→JPEG

【依頼3】SUGUDASU webp-to-jpg の位置づけ用 — 1段落以内×3項目（箇条書き）
- iLovePDF で足りるケース（正直に）
- webp-to-jpg を選ぶ合理的理由（非送信・WebP特化・3秒、など）
- webp-to-jpg で **やってはいけない** 約束（PDF、リサイズ、OCR 等）

【依頼4】検索意図・キーワード候補
日本語ロングテール **8〜12件** · 形式: キーワード | 検索意図（1行）| 記事で触れるべき注意（1行）

例: webp png 変換 / webp 開けない / webp excel 貼り付け 等

【禁止】
- 記事本文・Zenn下書き・Markdown記事
- 未確認の統計数字（「〇%のユーザーが」等）。不明は「要確認」
- SUGUDASU の礼賛文
- 「100%安全」「完全非送信保証」等の断定
- 実在しない機能（PDF結合、一括圧縮、AI upscale 等）を webp-to-jpg に帰属させないこと

【出力順】
§1 あるある表 → §2 比較表 → §3 位置づけ箇条書き → §4 キーワード表
```

---

## 出力の扱い

1. Gemini の返答 → [`docs/notes/webp-to-jpg-gemini-research-RESULT.md`](../notes/webp-to-jpg-gemini-research-RESULT.md) **保存済（2026-06-19）**
2. Zenn ネタ → [`docs/notes/ZENN_WEBP_TO_JPG_DRAFT_MEMO.md`](../notes/ZENN_WEBP_TO_JPG_DRAFT_MEMO.md)
3. 事実は提督が1行ずつ突合（特に WebP の OS/Office 対応状況は年月で変わる）

---

## 突合チェック（結果受取後）

- [ ] WebP と Office の互換は **バージョン依存** と書いてあるか
- [ ] iLovePDF を「駄目」と断定していないか
- [ ] webp-to-jpg スコープ外（PDF 等）が §3 にあるか
- [ ] 架空の利用統計がないか
