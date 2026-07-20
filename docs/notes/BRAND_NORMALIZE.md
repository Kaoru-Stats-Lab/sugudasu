# Brand Normalize · Search Thesaurus · Tool Intent（3層）

**更新:** 2026-07-20  
**データ**

| Layer | ファイル | 役割 |
|-------|----------|------|
| **1** | [`data/brand-normalize.json`](../../data/brand-normalize.json) | ユーザー語 → **ブランド語彙**（表示は変えない） |
| **2** | [`data/search-thesaurus.json`](../../data/search-thesaurus.json) | 誤変換・俗称・英語 → ブランド語彙（検索拡張） |
| **3** | [`data/tool-intent-map.json`](../../data/tool-intent-map.json) | ブランド語彙・キーワード → **実 toolId** + weight |

**生成プロンプト:** [`docs/prompts/brand-normalize-gemini-prompt.md`](../prompts/brand-normalize-gemini-prompt.md)  
**再生成シード:** `node scripts/_seed-search-layers.mjs`（架空 ID → registry 写像込み）

---

## なぜ 3 層に分けたか

一枚の巨大「類語辞典」にすると、ブランド統一と検索ヒットとツール推薦が混ざる。保守不能になる。

保守性の高い順番:

1. **ブランド語彙への正規化**（今回の Layer 1）
2. **検索シソーラス**（Layer 2）
3. **意図マップ / JTBD 辞書**（Layer 3 + 既存 `search-dictionary/`）
4. ゼロ件フォールバック
5. ランキング重み

`synonyms.json` は従来どおり **toolId ルーティング補助**として残す（Layer 3 と併存。将来は intent に寄せてよい）。

---

## パイプライン

```
ユーザー入力
  → 1. brand-normalize（厳密なブランド語）
  → 2. search-thesaurus（ヒット拡張）
  → 3a. tool-intent-map（keyword → toolId ブースト）
  → 3b. search-dictionary / synonyms / hub blurb（既存スコア）
  → 4. zero-hit UX
  → 5. ranking（hub-search-engine.js）
```

実装: `assets/hub-search-engine.js` の `prepareSearchQuery` + `search` 内 intent ブースト。  
バンドル: `npm run build:hub-search` → `data/hub-search-bundle.json`（`brandRules` · `thesaurusRules` · `intentRules`）。

---

## 変えないもの

- `conceptName` · `productName` · カード見出し · ナビラベル
- UI に「正規化後の語」を出さない（内部マッチのみ）

---

## toolId について

Gemini 草案の `img-watermark` 等は **架空 ID**。本番は registry の実 ID のみ:

| 草案 | 実 ID |
|------|--------|
| img-watermark | watermark |
| img-crop | image-trim |
| img-blur | mask |
| pdf-extract-images | pdf-images |
| doc-invoice-gen | invoice |
| doc-receipt-gen | receipt |
| qr-scanner | qr-reader |
| qr-generator | link-qr |
| calc-split-bill | warikan |
| calc-time-card | time-calc |
| text-diff | diff |
| hr-group-divider | group-split |
| hr-shift-scheduler | shift |
| mkt-gift-picker | present |
| video-frame-extract | video-frame |

存在しない機能（PDF結合・文字数カウント等）は intent から落としている。

---

## 検証

```powershell
npm run validate:hub-ia
node scripts/hub-search-engine.test.mjs
```

必須マッピング例: `スクショ→画像` · `ハンコ→印鑑` · `透かし` top = `watermark`
