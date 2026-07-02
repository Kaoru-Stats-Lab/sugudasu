# Gemini依頼: テストデータ Raw CSV — 再レビュー（v0.3.1 · 地雷乱数修正後）

**用途:** 前回 **2/5** の Gemini レビューを、**乱数分離修正後**の同一 fixture で再採点  
**前回結果:** [`test-data-dataset-review-RESULT.md`](../notes/test-data-dataset-review-RESULT.md)  
**比較:** ChatGPT full **4/5**（同じ wedge · 同じ seed42）  
**結果置き場:** `test-data-dataset-review-RESULT.md` の Gemini 欄を上書き

---

## 使い方

1. **`test-data-dataset-review-gemini-rerun-COPYPASTE.txt`** を全文コピー
2. Gemini に貼付（長文OK · 約60KiB）
3. **セクション0（バグ修正検証）** が先に来る — ここを飛ばさないこと
4. 回答を RESULT.md に追記

再生成:

```bash
node scripts/export-test-data-review-fixtures.mjs
```

---

## 修正内容（プロンプトに同梱）

| 項目 | 前回（Gemini指摘） | 修正後 |
|------|-------------------|--------|
| mine0 vs mine5 同一シード | 2行目が別人（佐藤→中村） | **同一人物**（佐藤拓也） |
| 地雷の仕組み | 主乱数を消費して全行ズレ | **ベース生成後に独立乱数で上書き** |
| mine5 差分行（期待） | — | 主に 0020 · 0021 · 0080 の3行 |

※ 前回 ChatGPT/Gemini が引用した `EMP-0065=19760717` 等は **修正前の mine5**。今回のCSVには無い可能性が高い — セクション0で確認させる。

---

## コピペ用

`test-data-dataset-review-gemini-rerun-COPYPASTE.txt` を正本。  
`node scripts/export-test-data-review-fixtures.mjs` で CSV 全文込みで再生成される。
