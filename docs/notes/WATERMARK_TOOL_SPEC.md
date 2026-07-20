# SUGUDASU 透かし — 仕様 SSOT（v0.1）

**更新:** 2026-07-20  
**ステータス:** v0.1 実装  
**id:** `watermark` · URL `/watermark`  
**関連:** mask · image-trim · video-frame（画像 Canvas ファミリー）  
**実装依頼:** リポジトリ直下 `watermark 実装依頼.md`（エンジン制約）· DnD 枠は table-conv と同系の `.sg-file-drop`

> **一言:** 資料・スクショに文字またはロゴを焼き込み、複数枚を ZIP で取る。非送信。

## Must

| 項目 | 内容 |
|------|------|
| 入力 | PNG / JPEG / WebP · 複数ドロップ（最大 20 枚） |
| 透かし | 文字 **または** ロゴ 1 枚（排他） |
| 配置 | 9 点（3×3）のみ |
| 透過 | 20% / 40% / 60% の 3 段階 |
| 出力 | 焼き込み **PNG** · 単枚 DL と ZIP 一括（v0.1 固定 · 入力形式維持は OUT） |
| ファイル名 | デフォルトは元名（`.png`）· 任意で透かし情報を接尾辞追加 · ZIP 内重複は `(n)` |
| 非送信 | `data-sg-privacy-badge` subject=`画像` |
| 解像度 | 長辺 4096 超は縮小して処理（警告） |
| DnD UI | `.sg-file-drop`（table-conv と同型 · プロダクト共通） |

## OUT（v0.1）

- タイル / 斜め反復 / 自由ドラッグ
- PDF · 動画透かし
- クラウド保存 · バッチサーバ
- EXIF 改変 · 連続スライダー透過
- 入力形式のまま出力（JPEG→JPEG 等）— エンジン依頼書にあっても v0.1 は PNG 固定

## Non-goal

PDF 圧縮 · ページ全体の画像化（別ツール候補）。埋め込み画像抽出は `/pdf-images`。

---

## エンジン設計（事故防止）

### ① パイプライン

```text
File
  → decode (createImageBitmap + imageOrientation:"from-image")
  → fitWithinMaxEdge
  → shared Canvas に drawImage（smoothing high）
  → 文字: fonts.ready → measureText 縮小 → fillText
     ロゴ: 透明余白 trim → drawImage
  → canvas.toBlob('image/png') のみ（toDataURL 禁止）
  → 単枚 DL / STORE ZIP に追記
  → bitmap.close() · canvas を 1×1 に戻す · ObjectURL revoke
```

逐次: `for...of` + `await` のみ（`Promise.all` 禁止）。

### ② 責務分離

| 層 | 責務 | 禁止 |
|----|------|------|
| `watermark-engine.js` | 純関数 · Canvas/ZIP/ファイル名 | DOM イベント · alert · UI |
| `watermark-app.js` | 入力 · **透かし後プレビュー（1枚）** · DL トリガ | 画像アルゴリズム本体 |

### ③ モジュール

- 定数 · 受理判定 · opacity/position 正規化
- decode / canvas acquire·release / trimTransparentBounds
- measureTextMark · drawWatermark · renderOneToPngBlob
- buildOutputFileName · buildStoreZip

### ④〜⑤ データ / メモリ

- 処理中は **1 枚分**の bitmap + shared canvas を保持
- プレビュー用 ObjectURL は追加時に作り、外す・クリアで必ず revoke
- **透かし後プレビュー**は選択中の 1 枚のみ（長辺 `PREVIEW_MAX_EDGE`）。全枚は ZIP/単枚書き出し時に処理
- ZIP は STORE（無圧縮）· PNG は既圧縮のため Deflate しない

### ⑥ Worker

v0.1 は **メインスレッド逐次**。Worker を使う場合は画像処理のみ（UI 混ぜない）。

### ⑦ 主要関数

| 関数 | 責務 |
|------|------|
| `decodeImageFile` | EXIF 向き込み decode · close 義務 |
| `trimTransparentBounds` | ロゴ余白除去 |
| `measureTextMark` | long/short 双方制約 + 幅フィット縮小 |
| `renderOneToPngBlob` | 1 枚完走 · 必ず release |
| `buildOutputFileName` | 接尾辞 · サニタイズ · 重複回避 |
| `buildStoreZip` | STORE ZIP |

### ⑧ 例外

破損画像 · 非対応形式 · toBlob 失敗 · fonts 未準備 · Canvas 上限 — 呼び出し側へ throw / メッセージ。握りつぶし禁止。

### ⑨ テスト（`scripts/watermark-engine.test.mjs`）

受理 · opacity · position · fit · anchor · 接尾辞ファイル名 · 重複 · CRC/ZIP · trim bounds · font size 上下界。
