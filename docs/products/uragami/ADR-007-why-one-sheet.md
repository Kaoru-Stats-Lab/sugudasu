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

### Paper Fit と Paper Zoom（二軸）

| 許可 | 禁止 |
|------|------|
| **paperFit**（机の中の占有率 · 既定 **90%** · 60–95%） | ズームボタン · % 常時表示 UI |
| Ctrl + マウスホイール（見る距離） | ミニマップ |
| トラックパッド ピンチ | Infinite Canvas |
| Space + Drag / 中ボタン パン | Viewport Navigation UI |
| 右下ドラッグ · Alt+ホイールで Fit | |

> The sheet may be viewed at different scales.  
> The sheet itself never changes size.  
> Zoom changes the viewer, not the paper.  
> Fit changes how much of the desk the sheet occupies — not the sheet’s logical size.

範囲の目安（Zoom）: **60%〜300%**。紙は広がらない。

### 紙の視覚（採用 · Paper Affordance）

| 項目 | 値 |
|------|-----|
| 比率 | 16:9 |
| 机 | `#E7EBF2` |
| 紙色 | `#F8F5EC`（純白禁止） |
| 縁 | 1px `#DDD7CA` |
| 影 | `0 2px 6px rgba(0,0,0,0.05)`（接地 · 浮遊禁止） |
| 方眼 | 5mm 相当 · `#D8DDE6` · 透明度 ~25% |
| 折り返し | 右上（めくり）を紙らしさの主アフォーダンスに |

PNG: 透過禁止 · 紙ごと。  
印刷: ブラウザ印刷 · 品質維持（16:9 を崩さない）。

## Reason

重要なのは A4 ではなく **一枚**であること。  
モニタや液タブごとに「紙が小さすぎる」問題は **Fit（占有率）** で解き、細部は **Zoom（見る距離）** で解く。  
境界の明度差は色覚以前に、0.2 秒で「ここが紙」と分かる認知の問題である。

## Consequences

- 座標系・エクスポートは単一シート · 論理解像度固定 · 16:9
- Fit / Zoom は CSS・ビュー変換。論理紙サイズは不変
- 「Letter にして」「無限に広げて」は Reject または将来別議論

## Follow-up

- [x] 実装: 16:9 · Paper Fit · Paper Zoom / Pan · 境界トークン
- [x] 憲法判断: 「説明モード」は [CASE-2026-008](../../legal/CASE_LAW.md#case-2026-008) で Reject（Fit で解く）
