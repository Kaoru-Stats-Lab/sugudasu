# SUGUDASU 裏紙 — 仕様メモ（実装 SSOT 入口）

**正本（思想 · ADR）:** [`docs/products/uragami/`](../products/uragami/README.md)  
**ProductID:** `uragami` · `/uragami`  
**状態:** Implementation Approved · α

## Mission（要約）

説明のために描く。描くこと自体がゴールではない。  
判断軸: **説明が速くなるか？** かつ **裏紙で現実にできるか？**（ADR-000）

## MVP 範囲

| ある | ない |
|------|------|
| 黒/赤ペン · 消しゴム · Undo | テキスト · 図形 · レイヤー |
| A4 一枚 · 5mm 方眼 | Infinite Canvas · ズーム UI |
| 紙をめくる | 削除/ゴミ箱 · 履歴一覧 |
| PNG · 印刷 | ファイル読込 · IndexedDB · Auto Save |
| SessionStorage（F5 のみ） | LocalStorage 永続 · Recent |

## 技術

- `assets/uragami-engine.js` — ストローク · グリッド · session · PNG
- `assets/uragami-app.js` — pointer · ツールバー
- `tools/uragami.html`

詳細は ADR-000〜009。
