# SUGUDASU 仮置き — 仕様（β）

**id:** `clip-stash`  
**更新:** 2026-07-24  
**stage:** beta

## WHY

仕事中に発生した一時情報を、思考を止めずに退避する。PureRefでもメモでもノートでもない。

**仮置きしたものを、一時的に戻すだけ**である。詳細: `philosophy.md`（判断フレームワーク含む）

## Non-Goals（実装しない）

知識管理ツールではない。管理行為を生む機能は**ブランド憲法により意図的に採用しない**（「今は作らない」ではない）。

判断: **管理するため → Reject · 戻すため → 検討** — `philosophy.md`

- タグ · フォルダ · ラベル · ノート · コメント
- 検索 · フィルター · 色分け
- ピン留め · お気に入り
- スマート配置 · 自動整列 · AI分類
- OCR検索 · 履歴 · バージョン管理

## カード種（5種固定）

Text · Table · URL · Image · Color — これ以上増やさない。

## 操作（以上。）

| 操作 | 動作 |
|------|------|
| Single Click | 選択 |
| Double Click | コピー（Preview中も。コピー後 Preview 終了） |
| Space | Preview（確認のみ · 編集不可） |
| Esc | Preview 閉じる |
| Delete | 削除 |
| Ctrl+V | 追加 |
| DnD | 並び替え（**選択中のカードのみ**） |

**Reject:** Enter · ヒントテキスト · 編集 · 独自ズーム · **複数選択（Ctrl/Shift+Click）** · Non-Goals 一覧（上記）

## DnD

1. クリックで選択
2. 選択したカードをそのままドラッグ（専用ハンドルなし）
3. 空スロットまたは他カードのスロットへ Drop（占有時は入れ替え）
4. Drop 後も選択状態を維持
5. 未選択カードはドラッグ不可

## 削除

- 各カード右上 **×** · Delete キー
- 削除後も**スロット位置は維持**（空スロットとして残る）
- 新規貼付は空スロットを優先

## Image

PNG · JPG · WebP · SVG のみ。**GIF は非対応**（スコープ外 · 記載なし）。

## Preview

- 画面中央オーバーレイ · 背景暗転
- コピー · URLを開く（リンククリック）のみ
- ブラウザ全体はズームしない

## レイアウト

- カード固定 17.5rem × 13.5rem
- 列数: ≤1199px=3 · 1200–1699=4 · 1700–2199=5 · ≥2200=6
- 表示倍率はブラウザ標準に委譲

## 保存

IndexedDB `sugudasu-clip-stash` · 非送信 · 同期なし（コア）

## 入力 UI

- **0枚:** `sg-file-drop` 入力パネル（[赤入れ `/annotate`](https://sugudasu.com/annotate) 同型 · 旧 `/mask`）
- **1枚目以降:** 入力パネル非表示 · **Ctrl+V のみ**

## 実装

- `assets/clip-stash-engine.js` — 分類 · 表示 · コピー
- `assets/clip-stash-db.js` — IndexedDB
- `assets/clip-stash-app.js` — UI
- `tools/clip-stash.html`
