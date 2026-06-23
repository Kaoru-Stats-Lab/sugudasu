# 電子印鑑ツール（/stamp）— SSOT

**更新**: 2026-06-23  
**リポジトリ**: `C:\asl_dev\sugudasu`

## 位置づけ

- **画像型**の**認印（丸）**のみ。印影 PNG をブラウザ内で作成。
- **請求書**の担当者印（`images.stampUser` · 42px）への handoff が主導線。
- **角印（社印）**はスコープ外 → 請求書の画像アップロード（Illustrator / スキャン等）。
- 電子署名・識別情報付き型は **スコープ外**。

## 書体

| 選択 | 実体 |
|------|------|
| 明朝体 | OS 明朝（Hiragino Mincho / Yu Mincho / Noto Serif JP） |
| 行書風 | Google Fonts **Yuji Boku**（OFL · 初回のみ CDN 取得） |

古印体フォント（g_コミック古印体等）は漢字欠け・再配布制約のため **採用しない**。

## handoff

- **キー**: `sessionStorage` · `sg-stamp-handoff-v1`
- **slot**: 常に `user`（担当者印）

## MVP 機能

- 認印（丸）· 最大4文字 · 枠内 auto-fit
- 傾き ±5° · 色 · 透過 PNG · クリップボード
- サイズ: 42px（請求書）/ 400px（高解像度）

## 角印を作らない理由（製品）

角印は字数可変・二重枠・縦横組版が必要。Canvas 簡易実装では品質を保証できない。Benri Lab 等の専門 UI との差は **認印に集中して埋めない** 方針。

## 実装ファイル

| パス | 役割 |
|------|------|
| `assets/stamp-engine.js` | Canvas 描画 |
| `assets/stamp-handoff.js` | handoff |
| `assets/stamp-app.js` | UI |
| `tools/stamp.html` | ページ |

## 憲法

- API なし · 印影データは非送信（フォント CDN のみ例外）
- F7: 黄旗 + FAQ（[freee KB — 電子印鑑](https://www.freee.co.jp/kb/kb-sign/electronic_seals/) の画像型区分に準拠。電子署名との違い · リスク · 書類別目安表を FAQ に掲載）
- Canvas: `clearTransparentSurface` — 描画直前に物理・論理 `clearRect`（Safari 透過 PNG）
- コピー・保存成功: `sg-copy-feedback` のグリーンフラッシュ + `Copied!` / `Saved!`

### FAQ（8問 + 書類別表）

1. 電子印鑑とは何ですか？（画像型の定義）
2. 電子署名や電子契約と同じですか？
3. 請求書・見積書に使えますか？
4. 角印（社印）は作れますか？
5. 領収書の「受領」印には使えますか？
6. 偽造やコピーのリスクはありますか？
7. 書体は何を使っていますか？
8. 入力した名前や印影はサーバーに送られますか？
