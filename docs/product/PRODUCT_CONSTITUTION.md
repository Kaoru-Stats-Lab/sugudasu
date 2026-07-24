# SUGUDASU Product Constitution

**役割:** 何を作るか・作らないかを判断するプロダクト採用基準  
**対象:** コア SUGUDASU。Syncの詳細は `docs/notes/SUGUDASU_SYNC_LINE.md`  
**Project:** [`../brand-project/BRAND_PROJECT_CHECKLIST.md`](../brand-project/BRAND_PROJECT_CHECKLIST.md)

ブランド思想は [`../brand/BRAND_CONSTITUTION.md`](../brand/BRAND_CONSTITUTION.md)、
Reject基準は [`../brand/ANTI_PRINCIPLES.md`](../brand/ANTI_PRINCIPLES.md) を正本とします。
立法意思（F2「非送信」の真意 · Persona · Pain 起点など）は
[`../legal/CONSTITUTION_COMMENTARY.md`](../legal/CONSTITUTION_COMMENTARY.md) を参照します。
判例は [`../legal/CASE_LAW.md`](../legal/CASE_LAW.md)。解釈手順は [`../legal/LEGAL_INTERPRETATION_GUIDE.md`](../legal/LEGAL_INTERPRETATION_GUIDE.md)。
**F1〜F7 だけで合憲性を判断してはならない。**

## 判定順

新しいプロダクト案は、必ず次の順で判定します。

```text
Persona
  ↓
Pain
  ↓
市場（M1〜M7）
  ↓
F1〜F7
  ↓
GO / HOLD / Reject / Sync候補 / Legacy / Outside Scope
```

技術、作れそうな機能、ブランドコピーから判定を始めません。

## F1〜F7

| # | 基準 | 適合の目安 | 外れる例 |
|---|---|---|---|
| F1 | **登録不要** | URLを開いて3秒で使える | アカウント・OAuth |
| F2 | **データ非送信** | 処理がブラウザ内完結 · **業務データ非送信・非保存**（ブランドコピーの字面≠一切のHTTP禁止） | サーバー保存・外部API常時依存 |
| F3 | **静的配信** | Cloudflare Pages Freeで運用可能 | DB・WebSocket・同期サーバー |
| F4 | **1ファイル完結寄り** | `tools/*.html` + 共有アセット | 重いバックエンド常駐 |
| F5 | **実務3分課題** | コピペ → 結果 → コピー/PDF | 常時利用ダッシュボード |
| F6 | **印刷/PDF価値** | 帳票・証跡・幹事共有文 | ゲーム常時接続のみ |
| F7 | **過剰断定回避** | 免責・黄旗で運用可能（法務・税務） | 「合法です」自動判定 |

## 市場判定との関係

F1〜F7への適合と、市場で勝てることは別軸です。

| SUGUDASU適合 | 市場性 | 基本判定 |
|---|---|---|
| 高い | 高い | `GO`・最優先 |
| 高い | 低〜中 | ブランド・横連携用として採否判断 |
| 低い | 高い | 仕様縮小または`Sync候補` |
| 低い | 低い | `HOLD`または`Reject` |

市場性M1〜M7の採点と個別案の判例は
[`../notes/PRODUCT_IDEA_JUDGMENT_LEDGER.md`](../notes/PRODUCT_IDEA_JUDGMENT_LEDGER.md) に残します。

## 判定ラベル

| 判定 | 意味 |
|---|---|
| `GO` | Persona・Pain・市場・F1〜F7が揃い、コアで採用する |
| `HOLD` | 根拠、技術成立性、優先度のいずれかが不足している |
| `Reject` | ブランド人格またはAnti Principlesに反する |
| `Sync候補` | 共有・同期・保存が価値の核心で、コアとは分離すべき |
| `Legacy` | 憲法制定以前の歴史的プロダクト。保守のみ |
| `Outside Scope` | SUGUDASU / Syncのどちらにも置かない |

## コアとSyncの分岐

F2またはF3を根本から破る案は、コアへ入れません。

次の順で分岐します。

1. 共有・同期・クラウド保存が、Painを解くための本質か
2. コアの登録不要・非送信・単独完結を奪わず、任意の上乗せにできるか
3. Yesなら`Sync候補`、Noなら`Reject`または`Outside Scope`

Syncではアカウント・クラウド保存・同期サーバーを許可できますが、
コア機能をログイン必須のペイウォールへ移しません。

正本: [`../notes/SUGUDASU_SYNC_LINE.md`](../notes/SUGUDASU_SYNC_LINE.md)

## 実装制約

- PCブラウザだけで十分成立する仕事を扱う
- 「ブラウザでできる」だけでは採用理由にしない
- 1 Pain = 1 URLを基本とする
- 入力 → 処理 → 結果 → コピー/印刷/PDFまでを短くつなぐ
- バックエンド常駐、外部API、DB、通知をコアの前提にしない
- AIによる意味判断・創造・評価を主要機能にしない
- 専門判断は注意点と確認材料までに留める
- 既定値で主要タスクが終わるようにし、設定を価値の前提にしない
- 成果物へPowered byやブランド露出を強制しない

## Legacy

憲法制定以前の試行プロダクトは、歴史的経緯を尊重し、
現行憲法へ無理に適合させません。

原則は保守のみ、新機能追加停止、同系統ツールの新規採用停止です。

現時点の Legacy: （なし）

## Reject（公開カタログ除外）

| id | 理由 | 扱い |
|----|------|------|
| `present` | **SUGUDASUのコンセプトに合わない**（AIギフト提案 · Domain外 · 提案しすぎない）· **CASE-2026-006** | Hub/nav/カタログ除外 · URL はアーカイブ案内 · 新機能停止 · 更新履歴に理由を公開 |

詳細: [`../legal/CASE_LAW.md`](../legal/CASE_LAW.md#case-2026-006)