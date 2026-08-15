# 2026-08-15 — 仮置き × Edge Drop（役員会DD）

**判例:** [CASE-2026-010](../CASE_LAW.md#case-2026-010)  
**思想:** [`../../products/clip-stash/philosophy.md`](../../products/clip-stash/philosophy.md)  
**製品仕様:** [`../../products/clip-stash/specification.md`](../../products/clip-stash/specification.md)  
**実装仕様:** [`../../products/clip-stash/SPEC_HANDOFF.md`](../../products/clip-stash/SPEC_HANDOFF.md)  
**決定ログ:** [`../../brand-project/DECISION_LOG.md`](../../brand-project/DECISION_LOG.md)

**材料:** Microsoft Edge「ドロップ」（端末間の簡易ファイル共有）。Microsoft は Drop 終了を案内済み。競合の現行仕様を追う対象ではない。

## この会議で決めたこと

Edge Dropから機能を移植しない。仮置きの目的へ翻訳する。

定義を更新する。

> コピーしたものを置く場所、ではない。  
> **作業中の素材を、次の場所へ渡すための卓上**である。

流れは `コピー → 仮置き → 使う → 終わる`。ここに保存・分類・検索・再利用を足さない。

## 採った線

| Edge Drop | 仮置き | 判定 |
|-----------|--------|------|
| 画面端からパネルを呼び出す | 仮置きは主作業面そのもの | **Reject** |
| 外部から DnD で置く | 既に思想一致 | **Keep** |
| 仮置きから他アプリへ DnD | Copy-First の出口 | **GO（P0）** |
| 画像/PDF の大型プレビュー | 置いたものの確認 | **GO（P0）** |
| ドラッグ中に置ける場所を明示 | 入口を消さない · 出口を見せる | **GO（P0）** |
| 複数カードの一括操作 | 整理ではなく作業操作 | **GO（P1）** · グループ化はしない |
| 種類フィルタ · ピン留め · 手動グループ | 管理ツール化 | **Reject** |
| 細かいカスタマイズ | 3分タスクから外れる | **Reject** |
| 端末間同期 · 自分への送信 | Sync レーン · 通信 | **Reject** |

## この会議で決めなかったこと

- ブラウザが OS / Office へファイル DnD を渡せる範囲の実機保証（HOW。実装仕様の制約節 · **成功保証ではなく成功時のデータ品質**）
- 複数選択のキーバインド詳細（Shift 範囲選択は P1 対象外）
- リード文・FAQ の本番コピー改稿（実装と同時）

## 仕様への GPT レビュー（実装前に反映済）

方向は GO。修正は HOW のみ（判例は動かさない）。

1. `DownloadURL` / デスクトップ DnD を製品保証にしない  
2. 置いたデータを変質させない、を出口でも前面に  
3. PDF P0-B の合格は iframe サイズではなく横方向の識別性  
4. 外部 DnD 失敗はトーストせず、既存コピーをフォールバックとして保証  
5. 持ち出し中の視覚（「エクスポート」と書かない）を仕様化

正本: [`SPEC_HANDOFF.md`](../../products/clip-stash/SPEC_HANDOFF.md)

## 既存判例との関係

- CASE-2026-001（PureRef）: カテゴリ一式の模倣は Reject。本件はクリップボード管理 / Drop 一式。
- CASE-2026-002（管理機能）: 管理 Reject · 戻す GO は維持。「戻す」を **コピーだけでなく出口 DnD** まで含むと明文化。
- CASE-2026-007（Copy-First）: チャネルへ送る UI ではない。ローカルの次の窓へ渡す。

## 憲法本文

改正しない。
