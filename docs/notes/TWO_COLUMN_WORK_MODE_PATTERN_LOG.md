# 2カラム「作業モード」パターン — 横展開ログ

**更新:** 2026-07-09  
**状態:** Phase 1 完了 · **Phase 2（折りたたみ編集）は未実施（次段階）**  
**参照実装:** `tools/match-board.html` · `assets/group-split-assign-app.js` · `assets/sugudasu.css`（`.gsa-layout`）

---

## 背景

2カラム実務ツール（設定左 · 成果物右）では、設定入力が終わったあと**成果物側を主役**にしたい。  
左パネルに `max-height` + `overflow-y-auto` を付けると、設定途中で内側スクロールが出て作業が分断される。

---

## Phase 1（2026-07-09 · 本番反映）

| 対象 | 変更 |
|------|------|
| **shift** | 左「シフト基盤・ルール設定」から `max-h-[calc(100vh-100px)] overflow-y-auto` を除去 → `.sg-setup-panel` |
| **label** | 左「モード切替」パネルから `max-h-[88vh] overflow-y-auto` を除去 → `.sg-setup-panel` |
| **table-conv / stamp** | FAQ を `main` 外の `sg-faq-section` に移動（横100%白背景 · sns 正） |
| **match-board** | 既存: setup / meeting 2モード（参考実装） |
| **qr-reader** | FAQ 新規追加 |

**原則:** 設定パネルはページと一緒に縦に伸ばす。人工的な高さ制限は付けない。

---

## Phase 2（未実施 · 次段階）

match-board と同型の **「作業モード」** を、印刷系2カラムツールへ横展開する。

### パターン（match-board 正）

```
setup モード   … 左:設定（38%） + 右:成果物（62%）
meeting モード … 右:成果物（100%）+ 左:折りたたみ編集（⚙ 条件を編集）
```

- たたき台生成後に「会議を開始」で meeting へ遷移
- 編集パネルはオーバーレイ or スライドイン（`gsa-edit-open`）
- キーボード: `E` 編集トグル · `Esc` 閉じる

### 横展開候補（優先度順）

| ツール | 左（設定） | 右（成果物） | 備考 |
|--------|-----------|-------------|------|
| **shift** | シフト基盤・ルール設定 | カレンダー表 | スタッフ登録後は表が主役。FIX 印刷フローと整合 |
| **label** | モード切替・規格・宛名入力 | 印刷プレビュー | リスト反映後はプレビューが主役 |
| group-split | （既存） | — | match-board へ分岐済み |
| timeline | 編集パネル | プレビュー | 既にモバイルタブあり。PC は折りたたみ検討 |

### 実装時の共通 CSS（案）

- `.sg-work-layout` — grid 列比率切替
- `.sg-work-mode-setup` / `.sg-work-mode-active` — モードクラス
- `.sg-setup-panel--collapsed` — meeting 時の編集パネル

match-board の `.gsa-*` を汎用化して `sugudasu.css` に昇格するか、ツール別プレフィックスで段階導入。

### やらないこと（Phase 2 でも）

- 全2カラムツールへの一括適用（印刷不要・単一カラムは対象外）
- 設定パネルの再び `max-height` 固定（Phase 1 で解消済み · 回帰禁止）

---

## 判断メモ（2026-07-09）

> メタ的に同じロジックでやったほうがユーザビリティは上がるか？

**はい。** ただし Phase 1（スクロール除去 + FAQ 統一）と Phase 2（作業モード遷移）は分ける。  
Phase 1 だけでも「設定が見切れる」痛点は解消。Phase 2 は shift / label でプロトタイプ後に横展開判断。

---

## 関連 SSOT

- [`PAGE_LAYOUT_SELECTOR.md`](PAGE_LAYOUT_SELECTOR.md) — 系統 C（印刷作業）
- [`UI_LAYOUT_REFRESH_GUIDE.md`](UI_LAYOUT_REFRESH_GUIDE.md)
- [`BACKLOG.md`](../BACKLOG.md) — 作業モード広告配置（§2-2）
