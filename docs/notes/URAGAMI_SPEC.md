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
| 16:9 一枚 · 5mm 相当方眼 | Infinite Canvas · Viewport UI（+/- · ミニマップ） |
| Paper Zoom / Pan（ジェスチャ） | ズームボタン · % 表示 |
| 紙をめくる | 削除/ゴミ箱 · 履歴一覧 |
| PNG · 印刷 | ファイル読込 · IndexedDB · Auto Save |
| SessionStorage（F5 のみ） | LocalStorage 永続 · Recent |

### Paper Fit（表示領域）と Paper Zoom（見る距離）

二軸。混ぜない。

| 軸 | 意味 | 操作 | 範囲 |
|----|------|------|------|
| **paperFit** | 机の中で紙が占める割合 | 右下ドラッグ · Alt+ホイール | 60%〜95%（既定 **90%**） |
| **viewZoom** | 紙を見る距離 | Ctrl+ホイール · ピンチ | 60%〜300% |
| Pan | 見た位置のずらし | Space+Drag · 中ボタン | — |

描画座標は論理 1600×900 固定。Fit を変えても線は崩れない。

### Paper Affordance（境界）

| 項目 | 値 |
|------|-----|
| 机 | `#E7EBF2` |
| 紙 | `#F8F5EC` |
| 縁 | 1px `#DDD7CA` |
| 影 | `0 2px 6px rgba(0,0,0,0.05)`（接地） |

## 技術

- `assets/uragami-engine.js` — ストローク · グリッド · session · PNG
- `assets/uragami-app.js` — pointer · ツールバー · zoom/pan
- `tools/uragami.html`

詳細は ADR-000〜009。
