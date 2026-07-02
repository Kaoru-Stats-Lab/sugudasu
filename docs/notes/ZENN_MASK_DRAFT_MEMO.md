# Zenn 向け mask（マスク）記事ネタ — 備忘録

**更新:** 2026-07-02  
**製品:** T09b · URL `/mask` · `tools/mask.html` · `assets/mask-engine.js` · `assets/mask-app.js`  
**製品境界:** 画像 **1枚** · 矩形 **黒塗り / モザイク / 注記スタンプ** · PNG DL · 非送信 · OCR/自動検出なし  
**Gemini 正本:** [`mask-gemini-research-RESULT.md`](mask-gemini-research-RESULT.md) · 仕様 [`MASK_TOOL_SPEC.md`](MASK_TOOL_SPEC.md)  
**編集カレンダー:** [`ZENN_EDITORIAL_PLAN.md`](ZENN_EDITORIAL_PLAN.md) **#17** · **#6 非送信設計の実例続編**

---

## 推奨タイトル

**マニュアル用スクショの機密消し — iLoveIMG に載せない黒塗り（DevTools で確認できる非送信）**

| 項目 | 内容 |
|------|------|
| 軸 | A 50%（引き継ぎマニュアル · 障害報告のあるある）+ B 50%（**アップロード型との差** · DevTools） |
| utm_campaign | `article_17_mask_screenshot` |
| 字数 | 1,800〜2,200 |
| CTA | `https://sugudasu.com/mask` |
| 公開タイミング案 | **#6 非送信設計の直後**（8月）または mask 本番直後の速報1本 |

---

## 記事の核心

**「ブラウザで黒塗りできる」だけでは差がつかない。** 差は **画像が運営サーバーを経由するか** と **スタンプで済ませていいか**。

| | アップロード型画像加工 | SUGUDASU マスク |
|---|------------------------|-----------------|
| 代表 | iLoveIMG · Photopea クラウド版 · 各種「オンライン黒塗り」 | このツール |
| 画像の行き先 | 運営サーバーへ POST | **端末の Canvas のみ** |
| スタンプ | 装飾用が多い | **サンプル/ダミーは注記用** — 下の実データは消えない（FAQ 明記） |
| 向く用途 | 大量一括 · 顔自動検出 | 社内規程で外部アップロード禁止 · 今日1枚のマニュアル用 |

### 記事に入れる一文（コピペ可）

> 引き継ぎマニュアルのスクショから顧客名を隠すのに、画像加工サイトへアップロードするのは社内規程で禁止、という現場は多いです。F12 のネットワークタブで **画像 POST が出ない** ことを自分で確認できるツールの方が、情報セキュリティ担当への説明がしやすいです。

### DevTools デモ手順（#6 · webp-to-jpg と同型）

1. F12 → ネットワーク
2. 競合のオンライン黒塗りで画像1枚 → **upload / multipart**
3. SUGUDASU `/mask` で同じファイル → **画像 POST なし**
4. 黒塗り矩形を1つ適用 → 依然として画像 POST なし（処理は Canvas）

---

## H2 案

1. あるある — ペイントの手動黒塗りは面倒 · アップロード型は規程で NG
2. **黒塗り vs モザイク vs スタンプ** — 機密は黒塗り推奨 · スタンプ単体は不可
3. **「ブラウザで動く」の罠** — 比較表 · 競合はカテゴリ比較まで
4. DevTools で見分ける — 手順 · スクショ1枚
5. mask の設計（非送信 · 25MB cap · Undo · クリップボード）
6. **やらないこと** — 顔自動検出 · 完全匿名化 · PDF 多ページ
7. CTA → `/mask` · 姉妹記事 `#6` · `/webp-to-jpg` · `/normalize`

---

## 書かないこと

- 「完全匿名化」「100%安全」
- スタンプだけで機密が隠れる旨
- 競合名の誹謗 · 顔認識の有無を断定

---

## SEO キーワード

`スクリーンショット 黒塗り` · `画像 黒塗り 無料` · `スクショ モザイク` · `マニュアル 個人情報 隠す` · `画像 加工 アップロード しない`

---

## 内部リンク

- Zenn **#6** 非送信設計（背骨）· [`ZENN_ARTICLE_06_DRAFT.md`](ZENN_ARTICLE_06_DRAFT.md)
- Zenn **#18** オフラインのブラウザは何ができるか（傘記事 · 未執筆）
- webp-to-jpg 記事メモ [`ZENN_WEBP_TO_JPG_DRAFT_MEMO.md`](ZENN_WEBP_TO_JPG_DRAFT_MEMO.md)
- [`statements.html`](../../tools/statements.html) · [`MASK_TOOL_SPEC.md`](MASK_TOOL_SPEC.md)

---

## 実装ファイル

| 種別 | パス |
|------|------|
| ページ | `tools/mask.html` |
| ロジック | `assets/mask-engine.js` · `assets/mask-app.js` |
| テスト | `scripts/mask-engine.test.mjs` · `npm run test:mask` |
