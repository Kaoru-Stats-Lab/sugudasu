# HCI · Search IA — 調査メモ

**種別:** Research（根拠）  
**判断の正本:** [ADR-006](../../adr/ADR-006-search-ia-principles.md)  
**更新:** 2026-07-24 — 枠組み作成。Gemini 調査結果は本ファイルに追記する。

---

## 目的

Hub 検索 v2 で「Main Grid 固定 · Pin 別領域 · History なし」を支持する **HCI / 参考 UI** のメモ置き場。

これは Backlog ではない（タスクではない）。ADR に要約が載る。

---

## 調査テーマ（MECE）

| テーマ | 問い | SUGUDASU への示唆 |
|--------|------|-------------------|
| **Spatial Memory** | ユーザーはツール一覧のどこを記憶するか | グリッド順を動的に変えない |
| **Split Menu** | 固定ショートカットと可変一覧を分ける UI | Pin だけ別領域 |
| **Search-first vs Browse-first** | 初見 vs 再訪の比率 | 検索主導は ADR-001 維持。再訪は Pin |
| **Zero-hit recovery** | 言い回し失敗時の行動 | ADR-003 チップ · 0件 UX |
| **Command Palette** | Ctrl+K 型の期待値 | 隠し機能。Hero に載せない |

---

## 参考プロダクト（追記用）

調査時は **借りる / 借りない** を分けて書く。

### IT-Tools

- **URL:** https://it-tools.tech/ （系統参考）
- **借りる:** （Gemini 調査後に追記）
- **借りない:** アカウント · クラウド同期 · グリッドの利用順ソート

### DevToys

- **借りる:** （追記）
- **借りない:** OS ネイティブ前提

### CyberChef

- **借りる:** 非送信 · 処理の見える化（[`vibe-coding-mece-gemini-RESULT.md`](../../notes/vibe-coding-mece-gemini-RESULT.md) 参照）
- **借りない:** 軍用ナイフ UI · 初見学習コスト

---

## HCI 文献 · 概念（追記用）

| 概念 | メモ |
|------|------|
| Spatial Memory | 一覧の **位置** が再訪のショートカットになる。順序シャッフルは認知コスト |
| Recognition vs Recall | 検索チップは Recognition を助ける（Phase1 採用） |
| Hick's Law | 選択肢を増やしすぎない — Pin は件数上限 |

※ 論文タイトル · リンクは調査セッションごとに追記。

---

## 関連 SSOT

- [ADR-001](../../adr/ADR-001-top-page-ia.md) — 発見優先順位
- [ADR-003](../../adr/ADR-003-search-ux.md) — Phase1 検索 UX
- [`decision-log/2026-07-top-page-ux-review.md`](../../decision-log/2026-07-top-page-ux-review.md) — Phase1 凍結
- [`design/search-ux.md`](../../design/search-ux.md)

---

## 追記ログ

| 日付 | 内容 |
|------|------|
| 2026-07-24 | 枠組み作成。IT-Tools / DevToys / CyberChef セクション待ち |
