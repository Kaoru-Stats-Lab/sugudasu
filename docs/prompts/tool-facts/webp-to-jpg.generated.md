# TOOL_FACTS: webp-to-jpg

status: **reviewed** · updated: 2026-06-22
productName: SUGUDASU WebP変換 · stage: beta · URL: https://sugudasu.com/webp-to-jpg

## マーケ（matrix 参照 · 捏造禁止）

- 主Pain: WebP画像が古いOfficeやレガシーシステムに貼れない
- 最優先の型: 型B
- △相当: 「この画像ファイル、相手のパソコンでもちゃんと表示されるか」の不安
- 聞き直し例: 「このWebPって画像、先方の古いパワーポイントでもそのまま開ける？」

## 一行

WebPをJPG/PNGに端末内だけで変換（アップロード型サービスと差別化）

## 実装済み（reviewed のみ Gemini が断定可）

- WebP→PNG / WebP→JPEG
- 最大20枚・ブラウザ内デコード
- ZIP一括ダウンロード
- 透過WebP→JPEG時は白背景（PNGで透過維持）
- 競合比較表（アップロード型との違い）

## 未実装 / 言い過ぎ注意

- PNG/JPEG→WebP への変換
- サーバーへ画像を送る変換

## データ取り扱い

- upload: false
- serverSave: false
- localStorage: なし
- retention: 画像はメモリ上のみ。ダウンロード後はユーザー管理

## 信頼 FAQ 素材

- 保存: 画像ファイルは SUGUDASU サーバーへ POST しない。
- 編集: 再選択・再変換可。
- 保持: サーバー側に画像を保持しない。

## 完了後導線

- 変換ファイルをダウンロード
- Office・社内システムへ貼付

## Gemini メモ

競合は「アップロード型」一般化で名指し可（ページ内既存表と整合）。

## Gemini 添付ブロック（1ツール）

```text
【webp-to-jpg 事実 · status=reviewed】
SUGUDASU WebP変換 / https://sugudasu.com/webp-to-jpg
Pain: WebP画像が古いOfficeやレガシーシステムに貼れない
実装: WebP→PNG / WebP→JPEG
実装: 最大20枚・ブラウザ内デコード
実装: ZIP一括ダウンロード
実装: 透過WebP→JPEG時は白背景（PNGで透過維持）
実装: 競合比較表（アップロード型との違い）
未実装: PNG/JPEG→WebP への変換
未実装: サーバーへ画像を送る変換
データ: upload=false serverSave=false retention=画像はメモリ上のみ。ダウンロード後はユーザー管理
```

