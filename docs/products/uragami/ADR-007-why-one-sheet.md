# ADR-007: Why One Sheet

**Status:** Accepted  
**Date:** 2026-07-26  
**Owner:** 提督 · Cursor  
**Product:** `uragami`  
**Supersedes:** 初期案「Why A4 Only」（紙の本質はサイズではなく **一枚**）

## Context

紙サイズの選択肢（A3 · Letter · 自由サイズ）やズームボタンは「正しさ」に見えるが、設定画面と迷いを生む。  
一方、現代の説明は画面 · PNG · チャットが中心であり、初期の既定比率は **16:9** が説明の速度に合う。

液タブ等では「顔を近づける／離す」に相当する **見た目の拡大縮小**が必要になる。これは Infinite Canvas ではない。

## Options

### Option A — サイズ選択 UI · Viewport Navigation UI（+/- · % · ミニマップ）

- 利点: 用途に合わせられる · 慣れたズーム UI
- 欠点: 初回設定 · ホワイトボード感 · 「5秒で描き始める」に反する

### Option B — 常に一枚 · 既定 16:9 · Paper Zoom / Pan のみ（ジェスチャ）

- 利点: 紙が主役のまま · 印刷/PNG が自明 · 顔の距離に相当する操作だけ持つ
- 欠点: A4 縦専用の紙感覚は後回し（将来検討可）

## Decision

**Option B。**

- 常に **一枚だけ**。ページ一覧 · ノート · フォルダ禁止。
- 既定アスペクトは **16:9**（初期実装。将来 A4 対応の可能性はあるが、今は 16:9 のみ）。
- サイズ変更 UI なし。

### Paper Zoom / Pan（許可）

> The sheet may be viewed at different scales.  
> The sheet itself never changes size.  
> Zoom changes the viewer, not the paper.

| 許可 | 禁止 |
|------|------|
| Ctrl + マウスホイール | ズームボタン · % 表示 UI |
| トラックパッド ピンチ | ミニマップ |
| Space + Drag パン | Infinite Canvas |
| 中ボタンドラッグ パン | Viewport Navigation UI |

範囲の目安: **60%〜300%**。紙は広がらない。大きく見える／小さく見えるだけ。

### 紙の視覚（採用）

| 項目 | 値 |
|------|-----|
| 比率 | 16:9 |
| 紙色 | `#F8F5EC`（純白禁止） |
| 方眼 | 5mm 相当 · `#D8DDE6` · 透明度 ~25% |
| 影 | 極めて弱い |

PNG: 透過禁止 · 紙ごと。  
印刷: ブラウザ印刷 · 品質維持（16:9 を崩さない）。

## Reason

重要なのは A4 ではなく **一枚**であること。  
説明の持ち出し先（画面 · チャット）に合わせた比率が、Mission（説明が速くなるか）に直結する。  
Paper Zoom は物理の「顔を近づける」に対応し、Constitution「Infinite Canvas 禁止」を破らない。

## Consequences

- 座標系・エクスポートは単一シート · 16:9 前提
- ズームは CSS / ビュー変換。論理紙サイズは不変
- 「Letter にして」「無限に広げて」は Reject または将来別議論

## Follow-up

- [x] 実装: 16:9 · Paper Zoom / Pan（ジェスチャのみ）
