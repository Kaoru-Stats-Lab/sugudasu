# SUGUDASU 仮置き — 仕様（β）

**id:** `clip-stash`  
**更新:** 2026-08-15  
**stage:** beta

## WHY

仕事中に発生した一時情報を、思考を止めずに手元へ広げ、次の場所へ渡す。PureRefでもメモでもノートでもクリップボード管理でもない。

**作業中の素材を、次の場所へ渡す卓上**である。置く · 確認する · 持っていく。詳細: `philosophy.md`

出口（仮置き→外部 DnD）の実装 HOW: [`SPEC_HANDOFF.md`](./SPEC_HANDOFF.md)（CASE-2026-010）

## Non-Goals（実装しない）

知識管理ツールではない。管理行為を生む機能は**ブランド憲法により意図的に採用しない**（「今は作らない」ではない）。

判断: **管理するため → Reject · 次へ渡す / 確認するため → 検討** — `philosophy.md`

- タグ · フォルダ · ラベル · ノート · コメント · 名前付け
- 検索 · フィルター · 種類フィルタ · 色分け
- ピン留め · お気に入り · 手動グループ · 画像スタック
- スマート配置 · 自動整列 · AI分類
- OCR検索 · 履歴 · バージョン管理
- 画面端ホットエッジ · 細かいカスタマイズ · 端末間同期 · 自分への送信

## カード種（6種）

Text · Table · URL · Image · Color · PDF

Image: PNG · JPG · WebP · GIF · SVG（元バイト保持 · 再エンコードしない）  
PDF: ローカル投入 · 1ページ目プレビューのみ生成 · PDF 本体は変更しない

## 操作（以上。）

| 操作 | 動作 |
|------|------|
| Single Click | 選択 |
| Double Click | コピー（Preview中も。コピー後 Preview 終了） |
| Space | Preview（確認のみ · 編集不可） |
| Esc | Preview 閉じる |
| Delete | 削除 |
| Ctrl+V | 追加（Clipboard） |
| ファイル DnD / 選択 | 画像 · PDF を追加（アップロードではない · 端末内読込のみ） |
| カード DnD（ボード内） | 並び替え（**選択中のカードのみ**） |
| カード DnD（ウィンドウ外） | **出口**（他アプリ / デスクトップへ渡す · カードは残す） |
| Ctrl+Click | 複数選択トグル |

**Reject:** Enter · ヒントテキスト · 編集 · 独自ズーム · Shift+Click範囲選択 · 投げ縄 · Non-Goals 一覧（上記） · Word/Excel/PowerPoint/ZIP/動画/音声/フォルダ（**ファイルとして置く**のは画像·PDFのみ。アプリ名は Input Bridge）

## DnD

1. クリックで選択
2. 選択したカードをそのままドラッグ（専用ハンドルなし）
3. **空スロット・他カードのスロット**いずれも Drop 対象（空白も通常インデックス）
4. ドロップは **その位置へ配置**（空きなら移動のみ · 占有なら入れ替え）。**他カードの自動詰め・圧縮はしない**
5. 途中空白の保持は許可する（ユーザーが空けた穴はそのまま）
6. ドラッグ中はドロップ先をハイライト（占有時のみ入れ替え相手をスライドプレビュー）
7. Drop 後も選択状態を維持
8. 未選択カードはドラッグ不可
9. **出口（ADR-CS-004）:** 同一ドラッグをウィンドウ外へ出すと内容を渡す。ボード上なら並び替え。切り取りにしない

**ADR:** 空白は自由に使えるが、システムは空白に意味を与えない（グループ · セクション · 見出し · 色分け · 自動整列などは追加しない）。

## 削除

- 各カード右上 **×** · Delete キー
- 削除後も**スロット位置は維持**（空スロットとして残る · 次のペーストが埋める）
- 新規貼付は空スロットを優先（先頭の空白へ。DnD とは独立）

## ADR-CS-001 Input Bridge

**目的:** ユーザーはファイル形式ではなく、扱っているアプリケーションで認識する。Clipboard へ橋渡しすることが目的。

**原則**

- エラーメッセージで拡張子を書かない
- Excel / Word / PowerPoint などアプリ名で案内する
- 「非対応」は使わない
- 必ず「こうすると置けます」で終える
- トーストは失敗通知ではなく入力誘導
- Blocking Dialog 禁止 · 赤色エラー禁止 · 3〜5秒で自動消滅 · 操作を止めない

**実装:** `classifyInputBridge` · `INPUT_BRIDGE_MESSAGES` · `#cs-bridge-toast`（dragenter / drop）

| 入力 | 案内 |
|------|------|
| Excel | Excelはセルをコピーすると表として置けます。 |
| Word | Wordは文章をコピーするとそのまま置けます。 |
| PowerPoint | PowerPointは画像や文字をコピーすると置けます。 |
| ZIP | ZIPは解凍して画像やPDFを置いてください。 |
| フォルダ | フォルダではなく中のファイルを置いてください。 |

## Image

PNG · JPG · WebP · GIF · SVG。**動画は非対応**。元 Blob を保持（Canvas 再エンコード · JPEG→PNG 変換なし）。

**ボード上のサムネ:** `object-fit: cover` · `object-position: center`（一覧での把握。縦長スクショは中央帯を優先）。  
**Preview（Space）:** `contain`（全体確認。隣接カードへの巡回ナビは持たない）。

## PDF

**ADR-CS-002 Data Fidelity First** — 入力データの意味を保持する。PDF↔画像の自動変換はしない。  
**ADR-CS-003 PDF Is Container** — PDF は画像でもテキストでもなく情報コンテナ。1カードとして保持し、表示はブラウザ標準ビューアへ委譲。

### 入力ケース（必ず区別）

| Case | 操作 | Clipboard / 入力 | カード |
|------|------|------------------|--------|
| 1 | Explorer → PDF DnD | `application/pdf` File | **PDF** |
| 2 | Explorer → PDF Ctrl+C → Ctrl+V | `application/pdf` または File | **PDF** |
| 3 | ビューアでページコピー → Ctrl+V | 多くは `image/png` | **IMAGE** |
| 4 | PDF内の文字コピー | `text/plain` 等 | **TEXT**（/Table/URL） |
| 5 | PDF内画像だけコピー | `image/*` | **IMAGE** |

判定順: `ClipboardItem.type` → `File.type` → 拡張子 → 推測（拡張子で MIME を上書きしない）。

### 保持

Blob（`pdfData`）· MIME · Name · Size。プレビュー PNG は**ボード表示専用キャッシュ**（元データは常に PDF）。

### Space プレビュー

Blob URL + **iframe**（ブラウザ標準ビューア）。`#toolbar=0&navpanes=0&view=FitH` を付与（ブラウザ依存）。pdf.js / Canvas で Space を描画しない。

## Preview

- 画面中央オーバーレイ · 背景暗転
- コピー · URLを開く（リンククリック）のみ
- PDF は iframe 委譲（上記）
- ブラウザ全体はズームしない · 独自ズーム UI なし
- **隣接カードへのスムーズ移動はしない**（確認は1枚単位 · 閉じてから次を選ぶ）
- **ADR-CS-005:** 合格はパネルサイズではなく**ファイル識別性**。image は切れずに contain。PDF は本文の横方向が見切れず 1 ページを識別できること（iframe 拡大だけでは不足）。text / table / url / color は現行サイズのまま

## ADR-CS-004 出口 DnD（Handoff）

**判決:** CASE-2026-010 GO。HOW 正本: [`SPEC_HANDOFF.md`](./SPEC_HANDOFF.md) P0-A / P0-C。

- 内部並び替えと出口は同一ジェスチャ · モードなし
- `text/plain` にカード UUID を載せない
- 出口後もカードは残る（コピー。切り取りではない）
- 置いた image / PDF は変質させない（再エンコードしない · MIME を変えない）
- 外部 DnD の成立はベストエフォート。Web が保証できないことを製品保証にしない
- OS / Office が受け取らない経路をダイアログ・トーストで埋めない。**フォールバックは既存のダブルクリックコピー**
- チャネル名付き「送りました」は出さない（CASE-2026-007）

## ADR-CS-005 確認のための大型 Preview

**判決:** CASE-2026-010 GO。HOW: SPEC_HANDOFF P0-B。

Fit（大きく見せる）であり Zoom（操作を足す）ではない。裏紙 CASE-2026-008 と同型。ギャラリー化しない。  
合格は iframe の CSS サイズではなく、**置いたファイルを識別できること**。PDF 本文の横見切れはプレビューの敗北。

## ADR-CS-006 複数選択は作業操作

**判決:** CASE-2026-010 条件付き GO。HOW: SPEC_HANDOFF P1。

Ctrl+Click · 一括削除 · 一括出口のみ。グループ名・結合・フィルタ・範囲選択は Reject。ボード上への複数ドロップは並び替えしない（誤操作で机を崩さない）。

## レイアウト

- カード固定 17.5rem × 13.5rem
- 列数: ≤1199px=3 · 1200–1699=4 · 1700–2199=5 · ≥2200=6
- 表示倍率はブラウザ標準に委譲

## 保存

IndexedDB `sugudasu-clip-stash` · 非送信 · 同期なし（コア）

## 入力 UI

- **常設 Input Strip:** 「ここへ貼り付け・ドラッグ」（Ctrl+V · 画像 · PDF · URL · テキスト）
- 目立たない「ファイルを選択」（主役は DnD）
- **0枚時のみ** Empty コピー（整理しない / 編集しない …）を Strip 内に表示
- ラベルに「アップロード」は使わない

## 実装

- `assets/clip-stash-engine.js` — 分類 · 表示 · コピー · ローカルファイル読込
- `assets/clip-stash-db.js` — IndexedDB
- `assets/clip-stash-app.js` — UI · PDF プレビュー生成（pdf.js）
- `tools/clip-stash.html`
