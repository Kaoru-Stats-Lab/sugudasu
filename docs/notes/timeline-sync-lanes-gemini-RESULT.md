# Sync Timeline — 2レーン要否 Gemini 調査結果

**更新:** 2026-06-25  
**依頼正本:** [`docs/prompts/timeline-sync-lanes-gemini-research.md`](../prompts/timeline-sync-lanes-gemini-research.md)  
**仕様反映:** `TIMELINE_TOOL_SPEC.md` §7-6 · `SUGUDASU_SYNC_LINE.md` §3-4

---

## §1 製品 × レーン構造 判定表

| 製品 | 正本データ数 | 司会/ステージ用ビュー | 運営/クルー用ビュー | 来場者公開の有無 | 根拠URL or 機能名 |
| --- | --- | --- | --- | --- | --- |
| **Rundown Studio** | 1 | ○ Presenter view（行ID共有、特定列を巨大化表示） | ◎ Grid view（全カスタム列、マルチ編集） | △（共有リンクはあるがクルー用） | rundownstudio.app/features · Presenter View / Column Hiding |
| **Shoflo** | 1 | ○ Prompter/MC view（行ID共有、台本・時間を連動） | ◎ Full rundown（役割別列フィルタリング） | ×（基本なし・バックステージ専用） | lasso.io/rundown/ · ShoTrack / Personal Highlights |
| **Stagetimer** | 1 | ◎ Presenter Link（メモ・残り時間を巨大表示） | ◎ Controller screen（タイマー操作、メッセージ） | ○ Public Viewer Link（タイマー・現項目のみ） | stagetimer.io/features/ · Presenter View / Viewer Link |
| **EZStageManager** | 1 | ○ Presenter/Timer view（進行行の強調表示） | ◎ Full Cue Sheet（Who, Tech, Description列） | ×（要確認・公開用動線なし） | ezstagemanager.com · Dual-view / Live Tracking |
| **Google スプレッドシート** | 1〜2 | △ 特定の列を手動で非表示・縮小 | ◎ 全列表示（音響・照明・司会をすべて並列） | △ 別タブに数式参照で簡易公開 | 日本の現場運用（行コピーによる同期崩壊の回避） |

---

## §2 ビュー差分マトリクス

| 行＝情報要素 | Rundown | Shoflo | Stagetimer | EZStage | スプレッドシート | **我々への示唆（1行）** |
| --- | --- | --- | --- | --- | --- | --- |
| **コマ開始・終了時刻** | 同一連動 | 同一連動 | 同一連動 | 同一連動 | 同一（数式破壊リスク） | 全ビューで同一秒/分の連動が必須 |
| **タイトル（公開/内部）** | 単一（列で補足） | 単一（列で補足） | 分離可能（非表示トグル） | 単一（列で補足） | 単一、または2列 | 司会向けに「公開しても恥ずかしくないタイトル」が要る |
| **担当者・スピーカー** | 専用列 | 専用列（Cast） | 別枠（Speaker） | 専用列（Who） | 専用列 | スマホ縦ではタイトルと同等に優先表示 |
| **運営メモ・キュー** | 各役割列 | 各役割列 | Notes機能 | Tech列 | 役割ごとに複数列 | crew 以外ではノイズとして隠す |
| **場所・移動** | 専用列 | 専用列 | Notes内 | Description列 | 備考列 | 複数会場時のみ1列表示 |
| **残り時間・現在時刻線** | 固定ヘッダー | 進行行連動 | 全画面/巨大化 | ヘッダー | なし | 司会ビューのコア要素 |
| **編集権限** | 役割割当 | 役割割当 | リンク別制限 | アカウント制限 | シート保護 | 司会は閲覧専用が安全 |

---

## §3 SUGUDASU Sync への推奨

| 案 | 実装コスト | mental model | 同期の複雑さ | 日本幹事適合 | 推奨 |
| --- | --- | --- | --- | --- | --- |
| **A:** 1 State / プロファイル（stage/crew、note隠し） | 極低 | 普通 | ゼロ | ○ 小規模研修 | ○ |
| **B:** 1 State / `publicTitle` + `crewNote` 分離 | 低 | 最高 | ゼロ | ◎ | **◎ MVP** |
| **C:** 2レーン（Linked rows） | 極高 | 難解 | 破綻リスク高 | × | × |

**提督採用（2026-06-25）:** **案B** — データは1本 · 表示は2レーン以上（ビュープロファイル）。

---

## §4 日本の現場用語マッピング

| 現場の呼び方 | 典型役割 | 見るべき情報 | 推奨ビュー名 |
| --- | --- | --- | --- |
| **司会 / MC** | 進行アナウンス、登壇者呼び出し | タイトル、話者、残り時間、台詞メモ（公開範囲のみ） | **Stage** |
| **運営デスク / 進行D** | 全体時間管理、巻き押し | 全時刻、全キュー、修正権限 | **Crew / Controller** |
| **音響 / 映像 / 配信** | キュー、機材 | きっかけ、コマ番号、技術メモ | **Crew**（メモ列トグル） |
| **受付 / 会場案内** | 誘導 | 現在アジェンダ、次の休憩時刻 | **Viewer / Signage** |
| **参加者向けモニター** | タイムテーブル | 次のタイトル・開始時刻（内部メモ非表示） | **Public** |

---

## §5 結論

**条件付き Yes（データ1本 · 表示2レーン以上）。**

業界標準は正本1つ（行ID・時刻連動）。2タイムライン同期（案C）は否定。  
日本の現場でも司会画面に音響キューが載ると読み間違えリスクが高いため、**`publicTitle` と `crewNote` を分離し、司会画面ではクルーメモを非表示**する案Bが必須。

---

## 実装フェーズ対応

| フェーズ | 内容 |
|----------|------|
| **コア** | `title` + `note` のまま（1人・コピー共有） |
| **Sync S2** | ビュー `crew` / `stage` · 閲覧 URL は `stage` 既定 |
| **Sync S2+** | 閲覧 URL `public`（Signage · Stagetimer 型） |
| **Sync S4+** | 役割別列（音響/照明）は **列追加ではなく** `crewNote` 内タグ or v2 検討 |
