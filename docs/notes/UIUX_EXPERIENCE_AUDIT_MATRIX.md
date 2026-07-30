# SUGUDASU UIUX Experience — 監査マトリクス

**更新:** 2026-07-30  
**状態:** P0-1〜P0-4 実行後スナップショット。リード文役割は Agenda §3 #6 未決。  
**親:** [`UIUX_EXPERIENCE_CONSTITUTION_AGENDA.md`](UIUX_EXPERIENCE_CONSTITUTION_AGENDA.md)  
**実装契約:** [`UIUX_EXPERIENCE_IMPLEMENTATION_CONTRACT.md`](UIUX_EXPERIENCE_IMPLEMENTATION_CONTRACT.md)  
**正本（仕様）:** [`../DESIGN_GUIDELINE.md`](../DESIGN_GUIDELINE.md) §3.2 · §3.8

> 列の値は **監査メモ**。仕様適合の最終判定ではない。  
> Review 決議前に、この表を根拠に全ツール CTA を一括変更しない。

---

## 列の定義

| 列 | 意味 |
|----|------|
| **完了系統** | 仮説ラベル（Agenda §1）。会議で公式化 |
| **Copy** | `shared` = `sg-copy-feedback` 利用 · `raw` = 独自 clipboard · `maybe` = コピー導線あるが共有未確認 · `-` = 主にコピーUIなし |
| **alert** | コピー成功等で `alert(` が残る |
| **slate900** | `bg-slate-900` 出現回数（HTML+app 合算の目安） |
| **emerald600** | `bg-emerald-600` 出現回数（印刷以外の緑乱用チェック） |
| **primary** | `sg-btn-primary` または `bg-blue-600` あり |
| **DnD** | `sg` = `.sg-file-drop` · `custom` = 独自/行DnD · `-` = ファイルDnDなし |
| **体感メモ** | 知覚レイテンシ・busy の粗いメモ（未計測は空） |
| **メモ** | 監査上の特記 |

---

## マトリクス（実務ツール）

| id | 完了系統（仮） | Copy | alert | slate900 | emerald600 | primary | DnD | 体感メモ | メモ |
|----|----------------|------|-------|----------|------------|---------|-----|----------|------|
| invoice | Print-Finish | shared |  | 8 | 0 | | custom | | 2026-07-30 P0 pilot: 下書き保存/読込を含む通知を inline toast 化 |
| stamp | Canvas-Copy | shared | | 2 | 0 | | - | | 請求書へが黒 · PNGコピーは shared |
| receipt | Print-Finish | shared |  | 2 | 0 | | - | | 2026-07-30 P0 pilot: 共有URLコピー失敗通知を inline toast 化 |
| label | Print-Finish | maybe |  | 4 | 0 | | - | | 2026-07-30 P0 pilot: 履歴保存/復元系の alert を inline toast 化 |
| shift | Print-Finish / Continue | - |  | 4 | 0 | Y | - | | 2026-07-30 P0 pilot: 保存完了通知を inline toast 化 |
| report | Transform-Copy | shared |  | 0 | 0 | Y | - | | 2026-07-30 P0 pilot: コピー前ガイドを alert から inline toast へ移行 |
| reverse | Transform-Copy | shared |  | 0 | 0 | Y | - | | 2026-07-30 P0 pilot: コピー前ガイドを alert から inline toast へ移行 |
| normalize | Transform-Copy | shared |  | 0 | 0 | Y | - | | 2026-07-30 P0 pilot: コピー系 alert 廃止（inline toast 化） |
| clip-stash | Session / 別JTBD | shared | | 0 | 0 | | sg | | CL=別 · ボード並び替えDnDあり |
| search-query | Transform-Copy | shared | | 0 | 0 | Y | - | | 2026-07-30 P0 pilot: sg-copy-feedback 適用 |
| table-conv | Transform-Copy | shared | | 0 | 0 | Y | sg | | |
| webp-to-jpg | Bake-Download | maybe |  | 0 | 0 | Y | custom | | 2026-07-30 P0 pilot: 枚数上限/入力不正通知を inline toast 化 |
| video-frame | Bake-Download | - | | 1 | 0 | Y | custom | | 独自破線DnD |
| annotate | Canvas-Copy | shared |  | 0 | 0 | Y | sg | | P0-3: lead を手動持ち帰りへ · P0-4 drop確認 · status通知化済 |
| image-trim | Canvas-Copy | shared | | 1 | 0 | Y | sg | | |
| clipboard-trim | Canvas-Copy | shared | | 0 | 0 | Y | sg | | Ctrl+V 入口が主 |
| watermark | Bake-Download | maybe | | 0 | 0 | Y | sg | | ZIP成果物 |
| pdf-fill | Bake-Download / Continue | maybe | | 0 | 0 | Y | sg | Calm局所 | 提出完成≠コピー · Calm UX |
| pdf-images | Bake-Download | maybe | | 0 | 0 | Y | sg | | |
| test-data | Transform-Copy | shared | | 0 | 0 | Y | - | | |
| broken-input | Transform-Copy | shared | | 0 | 0 | Y | - | | |
| group-split | Transform-Copy / Continue | shared |  | 0 | 0 | Y | custom | | P0-3: 形式タブをチャット/短文へ · SEO残はリード議題 |
| match-board | Continue | maybe | | 0 | 0 | Y | - | | CL=YES · JSON再開 |
| slot-board | Continue | shared | | 0 | 0 | Y | custom | | CL=YES · 枠DnD |
| planning-poker | Session-Ephemeral | shared | | 0 | 0 | Y | - | | |
| timeline | Continue | shared | | 2 | 0 | | - | | 2026-07-30 P0 pilot: +5分/行追加 の内部緑CTAを剥奪 |
| uragami | Session-Ephemeral | maybe | | 0 | 0 | | - | | 意図的非永続 · CASE-2026-008 |
| fair-draw | Transform-Copy | shared |  | 0 | 2 | Y | custom | | P0-3: 共有用コピー文言 · P0-4 CSV drop確認 · 内部緑剥奪済 |
| budget-trim | Transform-Copy | shared | | 0 | 0 | Y | - | | |
| warikan | Transform-Copy | shared |  | 2 | 0 | Y | - | | P0-3: 清算見出しを手動貼付へ · toast化済 |
| sns | Transform-Copy | shared | | 0 | 0 | Y | - | | チップ独自 `--copied` 演出 |
| link-qr | Transform-Copy | shared | | 0 | 0 | Y | - | | |
| qr-reader | Session-Ephemeral | shared | | 0 | 0 | Y | - | | |
| diff | Transform-Copy | shared | | 0 | 0 | Y | - | | |
| json-view | Transform-Copy | shared | | 0 | 0 | Y | - | | |
| ai-cleaner | Transform-Copy | shared | | 0 | 0 | Y | - | | |
| time-calc | Transform-Copy | - | | 0 | 0 | Y | - | | コピーUI薄い |
| font-converter | Transform-Copy | maybe | | 0 | 0 | | - | | ナビ外 · チップ演出 |
| mention | 別JTBD | maybe | | 0 | 0 | | - | | Extension · CL=別 |

---

## 横断サマリ（2026-07-30）

| 観察 | 件数・代表 |
|------|------------|
| Copy `shared` | 多数（§3.8 適用ウェーブの成果） |
| Copy `raw` / 穴 | 一部二重配線（report/reverse） |
| `alert` 残 | 実務ツールHTML / assets: **0**（confirm は維持） |
| 黒 CTA 濃い | invoice（8）· label/shift（4）· stamp/receipt/warikan |
| emerald 非印刷疑い | なし |
| DnD `sg` | 全件 drop+file input 同居確認（P0-4 done · 見た目だけ詐欺 0） |
| DnD `custom` file | webp · video · fair-draw CSV — 実装あり |
| DnD `custom` 非file | invoice行 · slot枠 — P0-4 対象外 |
| 実行コードの `Copied!` | **0** · 主要仕様（NORMALIZE/TIMELINE/STAMP）掃除済 · Zenn下書きは任意 |
| Copy-First CTA | チャネル名付き共有ボタンを除去 · statements を責任分界へ |
| リード文役割 | **未決**（Agenda §3 #6）— 一括統一禁止 |
| 体感 SLA | **未契約**（pdf-fill Calm のみ局所） |

---

## ゲート候補（CTO 議題用 · 未決定）

| 案 | 内容 |
|----|------|
| A | `data/tech-shared-contracts.json` 風に copy/CTA forbidden regex + `verify-uiux-experience.mjs` |
| B | カタログに Copy/CTA/DnD 列を追加（目視 SSOT） |
| C | A+B（機械 + 人間） |

採否は Experience Constitution Review の統合決議で決める。

---

## 更新ルール

- ツール公開（Playbook §1.5）時: 本表に1行追加（完了系統は仮で可）
- Review 決議後: 完了系統を公式値に置換し、P0 ウェーブ対象に印
- 製品知識の長文は Agenda へ。本表は監査の表のみ
