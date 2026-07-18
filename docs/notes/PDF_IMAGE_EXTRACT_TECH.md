# SUGUDASU PDF画像抽出 — 実装 TECH（v0.1）

**更新:** 2026-07-18  
**製品SSOT:** [`PDF_IMAGE_EXTRACT_SPEC.md`](PDF_IMAGE_EXTRACT_SPEC.md)  
**役割:** pdf.js 依存の詳細 · 定数 · 参考実装の落とし穴。SSOTを汚さない。

---

## 1. 依存

| 項目 | 方針 |
|------|------|
| ライブラリ | `pdfjs-dist`（Mozilla pdf.js）のみ |
| ラッパー | v0.1 不採用（追加パッケージは増やさない） |
| 読込 | ツールページのみ動的 import · Worker 同梱 |
| バージョン | **5.4.296** を `assets/vendor/pdfjs/` にベンダー（`assets/vendor/pdfjs/README.md`） |

---

## 2. 運用定数（目安 · ハード拒否）

SSOT: 超過は **拒否**（先頭だけ処理しない）。数値はここに置く。

| 定数 | v0.1 初期値 | 意味 |
|------|-------------|------|
| `MAX_FILE_BYTES` | 40 × 1024 × 1024 | **初期値（運用で変更可）** · ファイルサイズ目安。超過 → 拒否 |
| `MAX_PAGES` | 50 | **初期値（運用で変更可）** · ページ数目安。超過 → 拒否 |
| `MIN_SHORT_EDGE_PX` | 16 | 短辺がこれ未満 **かつ** 面積が `MIN_AREA_PX` 未満 → 除外 |
| `MIN_AREA_PX` | 256 | 面積（幅×高さ）の下限。ロゴ細長は短辺単独では落とさない |

メモリはファイルサイズと独立に膨らむ。定数を満たしても落ちうる → SSOT §4 のメモリ文言。

---

## 3. 抽出パイプライン（実装）

```text
ArrayBuffer
  → getDocument (+ worker)
  → for pageIndex in 1..numPages
       getOperatorList
       detect image paint ops
       resolve image object (page objs / commonObjs)
       decode → Blob
  → aggregate by content fingerprint
       keep pages[] for UI
       single blob for download
```

### 3.1 検出すべき描画（実装メモ · pdfjs 5.4）

`paintJpegXObject` は 5.x では OPS から削除。JPEG埋め込みも `paintImageXObject` / inline 系に合流する。

少なくとも次を扱う（ピン留め版の `OPS` を正とする）:

- `paintImageXObject`
- `paintInlineImageXObject`
- `paintImageXObjectRepeat`

### 3.2 オブジェクト解決

- 共有キャッシュ上の画像とページローカルの画像で、参照先が分かれる実装がある  
- 「解決できない / コールバックが来ない」は共有側を見落としていることが多い  
- 実装時はピン留め版のソースと既知Issueを照合してから書く  

### 3.3 画素 → Blob

- JPEGバイトを **再エンコードせず**取れるときだけ `.jpg`  
- それ以外は Canvas / ImageData 経由で PNG  
- RGB / Gray / RGBA などチャンネル数に応じて変換。未対応はスキップまたは警告（SSOTの色注記）  

### 3.4 Dedup（二層）

| 層 | 挙動 |
|----|------|
| UI | 論理画像1件あたり `pages: number[]` を持ち「p.3, p.5」表示 |
| DL/ZIP | 同一内容は **1ファイル**（ファイル名のページは **最初に出現したページ** を使う） |

フィンガープリント案: object key + width + height + バイト長（必要なら crc）。厳密ハッシュは任意。

### 3.5 ファイル名

SSOT必須形:

```text
{sanitize(base)}_p{NN}_img{NN}.png|jpg
```

- `NN` は 01 始まりゼロ埋め2桁  
- `img` 連番は **DL用ユニーク画像** の通し（ページ内連番ではない）  

---

## 4. 参考実装の問題点（そのままコピーしない）

巷・生成AIの「完成スニペット」に多い欠落:

1. JPEG埋め込み経路を拾わない  
2. 共有オブジェクト側の解決漏れ（処理が止まる / 欠ける）  
3. 色空間変換の手抜き  
4. 特定 getDocument オプションを絶対条件として教義化している  
5. Formネスト・マスク・CMYKを無視したまま「無劣化・完了」と謳う  

**方針:** 公式エンジンを直に使い、上記を踏まえた自前 `pdf-images-engine.js` を書く。

---

## 5. 配置予定

| ファイル | 内容 |
|----------|------|
| `assets/pdf-images-engine.js` | 抽出・変換・dedupe・フィルタ（テスト対象） |
| `assets/pdf-images-app.js` | UI |
| `tools/pdf-images.html` | ページ |
| `assets/vendor/pdfjs-…` 等 | ピン留め build + worker |
| `scripts/pdf-images-engine.test.mjs` | 純関数テスト |

ZIP: `watermark-engine.js` の store ZIP を import または共通化。

---

## 6. 実装時チェックリスト

- [ ] `MAX_*` 超過で拒否メッセージ（部分成功なし）  
- [ ] 件数表示 = 一覧件数  
- [ ] 複数ページ出現の併記  
- [ ] ファイル名規則  
- [ ] JPEG維持は「可能なときだけ」  
- [ ] 動的読込（他ページに pdf.js を載せない）  
- [ ] Desktop バナー · privacy-badge · FAQ  
