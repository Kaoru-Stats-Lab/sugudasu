# SUGUDASU マスク — ツール仕様（MVP）

**更新:** 2026-07-02  
**id:** `mask`  
**根拠:** [`mask-gemini-research-RESULT.md`](mask-gemini-research-RESULT.md) · [`BACKLOG.md`](../BACKLOG.md) §1-15-2

---

## 1. Pain · ポジション

引き継ぎマニュアル · 障害報告 · 社内FAQ用スクショから **顧客名 · ID · 金額** を隠したいが、ペイントは面倒 · **アップロード型加工サイトは社内規程で禁止**。

**NOT:** 顔認識 · OCR自動検出 · PDF一括 · 完全匿名化の保証  
**IS:** ブラウザ内 Canvas · 矩形ぼかし/黒塗り/背景同色 · 事務スタンプ · PNG出力

---

## 2. MVP Must

| 機能 | 備考 |
|------|------|
| D&D · ファイル選択 · **Ctrl+V** | PNG/JPEG/WebP/GIF |
| 矩形 **ぼかし** | マニュアル向けデフォルト · 強度2段 |
| 矩形 **黒塗り** | 不透過 #000 · 高機密向け |
| 矩形 **同色塗り** | 色指定 · 背景に合わせる（文字は消えない） |
| **スタンプ** | サンプル · ダミー · テスト（下の画像は消さない） |
| **Undo / Redo** | 最大20段 |
| **PNG ダウンロード** | ラスター統合済み |
| **クリップボードコピー** | Should · 非対応ブラウザは案内 |

---

## 3. 上限

| 項目 | 値 |
|------|-----|
| 1ファイル | 25MB（webp-to-jpg 踏襲） |
| 長辺 | 8192px（超過は縮小描画 + 注意表示） |
| 同時編集 | **1枚** |

---

## 4. 誠実線（FAQ必須）

- 画像は **当社サーバーへ POST しない**（静的HTML + Canvas）
- **塗り残しは利用者責任** · 出力前に目視確認
- パスワード · マイナンバー等は **黒塗り推奨**（ぼかしは限界あり）
- **同色塗り**は下の文字を消さない（ぼかし/黒塗りと併用）
- スタンプは **注記** であり、下の実データを削除しない
- 「完全匿名化」「100%安全」は **禁止**

---

## 5. 命名（registry）

| 層 | 値 |
|----|-----|
| id | `mask` |
| conceptName | スクショ消し |
| productName | SUGUDASU マスク |
| navLabel | マスク |
| navOrder | 10.5 |

---

## 6. ファイル

| パス | 役割 |
|------|------|
| `tools/mask.html` | LP + エディタ |
| `assets/mask-engine.js` | 検証 · 描画 · 出力 |
| `assets/mask-app.js` | UI（module） |

---

## 7. 未着手（v2）

- OCR / 顔検出  
- 複数枚キュー  
- EXIF 除去の明示検証 · FAQ確定

---

## 8. Prior Art（参考実装）

**探索手順:** `MULTI_AI_CODER_PLAYBOOK.md` §9

### Prior Art — mask · 2026-07-03

- **Pain:** スクショ矩形マスク · ドラッグ確定 · ブラウザ内非送信
- **候補:** [blurrr](https://github.com/creativar/blurrr)（パターン採用）· redactsensitiveinfo（思想参考 · コード未参照）
- **借りるパターン:** `attachDrag` · ドラッグ中のみ `document` pointermove/up · プレビューと確定の分離（SUGUDASU はオーバーレイ canvas）
- **借りない:** React · 顔検出/OCR · pan/zoom · 形状編集
- **SUGUDASU 載せ先:** `mask-app.js` ドラッグ層 · `mask-engine.js` は既存のまま拡張
