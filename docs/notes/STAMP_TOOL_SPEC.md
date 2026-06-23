# 電子印鑑ツール（/stamp）— SSOT

**更新**: 2026-06-23  
**リポジトリ**: `C:\asl_dev\sugudasu`

## 位置づけ

- **画像型**の電子印鑑（印影 PNG）をブラウザ内だけで作成する。
- **請求書**の担当者印（`images.stampUser` · 42px）・社印（`images.stampComp` · 62px）への handoff が主導線。
- 電子署名・識別情報付き型・押印ログは **スコープ外**（freee KB 区分に準拠）。

参照: [freee — 電子印鑑とは](https://www.freee.co.jp/kb/kb-sign/electronic_seals/)

## registry

| 項目 | 値 |
|------|-----|
| `id` | `stamp` |
| URL | `/stamp` |
| `productName` | `SUGUDASU 電子印鑑` |
| `navOrder` | 3（請求書の次） |

## handoff

- **キー**: `sessionStorage` · `sg-stamp-handoff-v1`
- **遷移**: `/stamp` → 「請求書に使う」→ `/invoice?from=stamp`
- **受信**: `invoice.html` が `from=stamp` 時に読み込み → `setImageFromDataUrl` → キー削除

```json
{ "v": 1, "slot": "user"|"comp", "dataUrl": "data:image/png;base64,...", "label": "山田" }
```

## MVP 機能

| 種別 | 請求書スロット | 出力直径 |
|------|----------------|----------|
| 認印（丸） | `stampUser` | 42px 既定 |
| 角印 | `stampComp` | 62px 既定 |

加工: 傾き ±5° · 色 · 明朝/古印体風 · 透過 PNG · クリップボード

## 実装ファイル

| パス | 役割 |
|------|------|
| `assets/stamp-engine.js` | Canvas 描画 |
| `assets/stamp-handoff.js` | handoff 定数・読み書き |
| `assets/stamp-app.js` | UI |
| `tools/stamp.html` | ページ |

## 憲法

- API なし · サーバー非送信
- F7: 黄旗 + FAQ で画像型であることを明示
