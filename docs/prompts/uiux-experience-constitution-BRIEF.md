# SUGUDASU Experience Constitution — 共通 BRIEF（全AI共通）

**更新:** 2026-07-29  
**使い方:** 各AIの COPYPASTE の前に、この BRIEF を1回貼る（長い場合は「下記 BRIEF を前提に」と書いてリンク相当の要約を貼る）。  
**正本アジェンダ:** [`../notes/UIUX_EXPERIENCE_CONSTITUTION_AGENDA.md`](../notes/UIUX_EXPERIENCE_CONSTITUTION_AGENDA.md)  
**監査:** [`../notes/UIUX_EXPERIENCE_AUDIT_MATRIX.md`](../notes/UIUX_EXPERIENCE_AUDIT_MATRIX.md)

---

## プロダクト（事実）

SUGUDASU は **登録不要・ブラウザ完結** の実務ツール群（請求・変換・PDF記入・班分け等）。  
収益は主に広告。**チャット自動投稿やWebhook直送は Reject**（Copy-First = チャネル非接続 · CASE-2026-007）。  
「Copy-First」「L1/L2/L3（セグメント/青主CTA/緑印刷）」「Calm UX」は仕様にあるが、**実装の濃淡**がある。

### 監査で分かっているズレ（要約）

- コピー成功: 共有は「コピーしました」+ emerald。一部 raw / `alert` / 独自トースト
- CTA: 青主・緑印刷が正だが、**黒ボタンが主に見える**帳票系、**緑が非印刷**（timeline +5分 · fair-draw 名簿反映）
- DnD: `.sg-file-drop` は CSS のみ。JS はツールごと
- 体感 SLA: 全ツール契約なし（pdf-fill の Calm は局所）
- 実行コードの英語 `Copied!` はほぼ消えた。仕様残骸あり

### 完了系統（仮説 · 採否は役員会）

Transform-Copy / Print-Finish / Bake-Download / Canvas-Copy / Continue-Later / Session-Ephemeral

### 制約（提案してよい範囲）

| してよい | してはいけない |
|----------|----------------|
| 色の意味表 · 完了モデル · 文言 · フィードバックの分離 | ログイン必須・常時サーバー保存を前提にする |
| メジャーWeb / 物理リモコン / ゲームパッド等の**学習コスト低い類推** | 「全部同じコピー緑ボタン」だけの結論 |
| **尖った少数意見**（合意と明記して併記） | SUGUDASU を汎用 SaaS ダッシュボードに再設計 |
| 「意図的に揃えない」リスト | Platform SDK 先作り · 流行グラデCTA |

### 出力に求める共通ルール

1. **世の中の総意**だけにしない。総意と **少数の尖った意見**を分けて書く
2. 最終決定はしない（「役員会への提案」まで）
3. 日本語。表を多用。礼賛・ポエム禁止
4. 根拠は「どの学習済みパターンか / どの物理メタファーか」を1行で
