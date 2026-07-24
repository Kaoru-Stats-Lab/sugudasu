# SUGUDASU PDF記入

**仮 id:** `pdf-fill`  
**プロダクト名:** SUGUDASU PDF記入  
**ステータス:** **GO** · **α v0.1.0 実装済**（本番 deploy は未）· **仕様: Paper First v4（2026-07-22）**  
**概要正本:** [overview.md](./overview.md)  
**変更履歴:** [CHANGELOG.md](./CHANGELOG.md)

提出用PDFを、ブラウザ内だけで完成させるツール。  
編集ページだけ見たまま固定し、未編集は元PDFのまま残す。  
体験の基準は Viewer ではなく **A4用紙へ書く（Paper First）**。

## 思想マップ

| 概念 | 要点 | 正本 |
|------|------|------|
| **Paper First** | PDFビューアではなく、紙へ記入する体験（空間） | [philosophy.md](./philosophy.md) · [ux.md](./ux.md) · ADR-014 |
| **Calm UX / Calm Motion** | 迷う時間を消す。動きは 150〜180ms ease-out | ADR-015 · ADR-028 |
| **Direct Manipulation** | 置いたものはすぐずらす。移動ツールなし | ADR-016 |
| **Inline Text** | prompt ではなく紙の上で書く | ADR-017 |
| **Unified Object** | 文字・印・黒・白・Strip·Marker を同一モデル | ADR-018 |
| **Minimal Type** | 内容・位置・大きさ・明朝/ゴシックのみ | ADR-019 · ADR-020 · ADR-023 |
| **Clipboard First** | 電子印鑑→Ctrl+C→本ツール→Ctrl+V が最短 | ADR-021 |
| **Image Natural Resize** | 画像は縦横比固定が標準。Shiftのみ自由変形 | ADR-022 |
| **Minimal Font UI** | UIに実フォント名を出さない | ADR-023 |
| **Readable Default Font** | 内部は可読フォント。UIは明朝/ゴシックのみ | ADR-024 |
| **Input Strip** | 複数印字位置を一つの入力のまとまりとして扱う | ADR-025 |
| **日時** | Input Strip Template #1。年・月・日・時・分 | [ux.md](./ux.md) |
| **Marker Palette** | 文字ツール内記号。紙へ記号を書く（図形ツールではない） | ADR-026 |
| **Adaptive Snap** | 紙優先 Hard Snap · ヒステリシス · 速度連動 | ADR-027 |
| **Unified Focus Ring** | 全 Object の選択枠を統一 | ADR-029 |
| **Cursor Language** | grab / grabbing / text / nwse-resize | ADR-030 |
| **Horizontal Slot Adjust** | Input Strip の slot は横だけ寄せる | ADR-031 |
| **完成ファイル名** | 書類名 + 利用者名（任意）。プレビュー＝ダウンロード名 | [specification.md](./specification.md) · [ux.md](./ux.md) |
| **編集ページ** | オーバーレイ数 > 0 のページのみ | [specification.md](./specification.md) |
| **保存** | 編集ページだけ見たまま固定（UIボタン名。内部は焼き付け） | [specification.md](./specification.md) · [ux.md](./ux.md) |

サンプル人物名（SUGUDASU全体）: **佐藤薫**。本ツールのファイル名プレースホルダーは **薫**（提出書類の氏名入力ではない）。

## ドキュメント

| ファイル | 責務 |
|----------|------|
| [overview.md](./overview.md) | 概要 |
| [philosophy.md](./philosophy.md) | 思想 |
| [specification.md](./specification.md) | 仕様 |
| [ux.md](./ux.md) | UI / UX |
| [faq.md](./faq.md) | FAQ（安心・思想・使い方のオンボーディング） |
| [technical-design.md](./technical-design.md) | 技術 |
| [decisions.md](./decisions.md) | ADR |
| [CHANGELOG.md](./CHANGELOG.md) | 設計変更履歴 |
