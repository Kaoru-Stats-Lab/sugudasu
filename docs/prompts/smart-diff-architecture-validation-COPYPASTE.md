# Smart Diff — Architecture Validation COPYPASTE v1

**更新:** 2026-08-06  
**種別:** 設計監査（Architecture Validation）— コードレビューではない  
**テンプレ正本:** [`architecture-validation-PROMPT.md`](architecture-validation-PROMPT.md)  
**RUNBOOK:** [`architecture-validation-RUNBOOK.md`](architecture-validation-RUNBOOK.md)  
**Engineering Governance（Pilot · 凍結）:** [`../notes/ENGINEERING_GOVERNANCE.md`](../notes/ENGINEERING_GOVERNANCE.md)  
**Design Pack Manifest:** [`../notes/smart-diff/DESIGN_PACK_MANIFEST.md`](../notes/smart-diff/DESIGN_PACK_MANIFEST.md)（正本性 J-01 未決）  
**未決判断:** [`engineering-governance-open-judgments-COPYPASTE.md`](engineering-governance-open-judgments-COPYPASTE.md)  
**製品プロセスメモ:** [`../notes/smart-diff/DEVELOPMENT_CONSTITUTION.md`](../notes/smart-diff/DEVELOPMENT_CONSTITUTION.md)  
**ロードマップ:** `data/roadmap.json` · id `smart-diff`（considering）  
**既存実装の正:** `tools/diff.html` · `assets/diff-app.js` · [`../notes/DIFF_PRECOMPARE_CLEANSE_SPEC.md`](../notes/DIFF_PRECOMPARE_CLEANSE_SPEC.md)

> Smart Diff は **新規 URL を作らず** 既存「差分チェック」を強化する想定。Browser 版を巨大化させず、Enterprise は Sync へ逃がす前提で監査する。

---

## 0. 投げる前チェック

- [ ] 設計パック（Architecture / Interface 等）が存在する。無い項目は INPUT に「未作成」と明記  
- [ ] 共通憲法ドキュメントを添付（下表）  
- [ ] 本ファイルの「コピペ用」全文をそのまま渡し、INPUT 実体を末尾に足す  

---

## 1. INPUT マッピング（リポジトリ実体）

| プロンプト上のラベル | 現状の実体（2026-08-06） | 備考 |
|----------------------|---------------------------|------|
| Constitution | `docs/brand/BRAND_CONSTITUTION.md` · `docs/product/PRODUCT_CONSTITUTION.md` · `docs/legal/CONSTITUTION_COMMENTARY.md` · `docs/legal/CASE_LAW.md` · `docs/legal/LEGAL_INTERPRETATION_GUIDE.md` · `docs/brand/ANTI_PRINCIPLES.md` | 必須添付 |
| Sync 境界 | `docs/notes/SUGUDASU_SYNC_LINE.md` | Escalation by Sync |
| Development Constitution | `docs/notes/smart-diff/DEVELOPMENT_CONSTITUTION.md` | プロセス · Browser/Sync · 独立ゲート |
| Design Pack Manifest | `docs/notes/smart-diff/DESIGN_PACK_MANIFEST.md` | Pack 一覧の唯一索引 |
| Architecture | **未作成（欠落）** · 暫定: 本 COPYPASTE の前提一文 + 既存 diff 実装概要 | 次着手 · Manifest 参照 |
| ADR | 関連があれば列挙 · 無ければ欠落 | HOW のみ |
| Roadmap | `data/roadmap.json` → `smart-diff` · `diff-normalize-option` | |
| UX Guideline | `docs/DESIGN_GUIDELINE.md` · Copy/Print First 関連節 | |
| Technology | 既存 diff の依存（実装から列挙）· `docs/notes/CAPABILITY_INVENTORY.md` 該当 | |
| Interface Contract | **未作成なら欠落**（Delta schema 等）· SLIR は ADR-002 | Data Model 監査の核 |
| ADR | [`../notes/smart-diff/ADR-001-origin-metadata.md`](../notes/smart-diff/ADR-001-origin-metadata.md) · [`../architecture/adr/ADR-002-slir-schema.md`](../architecture/adr/ADR-002-slir-schema.md) · [`../architecture/adr/ADR-003-matcher-engine.md`](../architecture/adr/ADR-003-matcher-engine.md) · [`../architecture/adr/ADR-004-delta-tree-model.md`](../architecture/adr/ADR-004-delta-tree-model.md) | Origin · SLIR · Matcher · Delta |
| Architecture | [`../notes/smart-diff/ARCHITECTURE.md`](../notes/smart-diff/ARCHITECTURE.md) | Pack 入口 · ADR 一覧 |
| Product Constitution（Smart Diff） | [`../notes/smart-diff/PRODUCT_CONSTITUTION.md`](../notes/smart-diff/PRODUCT_CONSTITUTION.md) | Table Diff 対象外理由など |
| UI Constitution | [`../notes/smart-diff/UI_CONSTITUTION.md`](../notes/smart-diff/UI_CONSTITUTION.md) | ChangeKind |
| 既存仕様 | `docs/notes/DIFF_PRECOMPARE_CLEANSE_SPEC.md` | 比較前クレンジング境界 |
| 製品コピー境界 | Tsukutta / hub の diff 説明（事実のみ） | 任意 |

**前提（設計意図 · 監査対象として明示）:**

- Browser: 左右差分 · 危険変更の優先表示 · 非送信 · 登録不要 · コピー/印刷  
- Sync: 共有・履歴・権限・監査証跡など Enterprise 寄りは **入れない**（Escalation）  
- MVP: AI 書き換え後の「見逃すとまずい変更」を数分で確認できること  

---

## 2. コピペ用プロンプト（Smart Diff 固定）

以下をそのまま外部 AI に貼り、続けて【INPUT 実体】にファイル内容またはパス付き抜粋を付ける。

````text
# ROLE

あなたは以下7名で構成される独立アーキテクチャ監査委員会です。

・Google Chrome / Web Platform Architect
・Microsoft Office / OpenXML Architect
・PDF Association / PDF Technical Reviewer
・Large-scale Web Application Architect
・Human Computer Interaction (HCI) Researcher
・Enterprise Software Architect
・SUGUDASU Constitution Reviewer

あなた達の仕事は設計を褒めることではありません。

10年以上運用できない設計、
将来破綻する設計、
責務分離の失敗、
保守性の低い設計、
MVPを壊す設計

だけを見つけてください。

仕様を擁護してはいけません。

「もっとAIを入れましょう」
「もっとクラウドを使いましょう」

というレビューは禁止です。

レビューは必ず

「SUGUDASU Constitution」

を最優先してください。

Browser First

Zero Server Egress

Copy First

Print First

Progressive Capability

Escalation by Sync

この思想は絶対に変更してはいけません。

（注: 「Zero Server Egress」はユーザー入力・成果物・業務データの非送信・非保存を指す。ページ配信・広告等の別レイヤを「通信ゼロ」と断定して監査対象外にしないこと。立法意思は CONSTITUTION_COMMENTARY に従う。）

あなたの仕事は

この思想の中で

どこが壊れるか

を見つけることです。

対象プロダクト: Smart Diff（既存 SUGUDASU 差分チェック /diff の強化。新規URLは作らない想定）

--------------------------------

# INPUT

以下をレビュー対象とします。

・Constitution.md
・Architecture.md
・ADR
・Roadmap
・UX Guideline
・Technology
・Interface Contract

無い文書は推測で埋めず「欠落」として Critical または High に上げること。

【INPUT 実体】
（ここに添付・抜粋を列挙）

--------------------------------

# 検証項目

## 1 Constitution監査

設計がConstitutionに違反していないか。

BrowserとSyncの責務は混ざっていないか。

Immutable Principleを破っていないか。

Progressive Capabilityになっているか。

Zero Server Egressを壊していないか。

--------------------------------

## 2 Architecture監査

責務分離

依存方向

循環依存

境界

レイヤー

Data Flow

Pipeline

Renderer

Export

Parsing

Diff

すべてレビューしてください。

将来機能追加時に破綻しないか。

--------------------------------

## 3 Browser限界監査

Browserだけでは不可能なことを

Browserで実現しようとしていないか。

以下を重点的に見ること。

Memory

Worker

WASM

Rendering

File API

Sandbox

IndexedDB

Canvas

PDF

OpenXML

--------------------------------

## 4 Sync境界監査

Syncへ逃がすべき責務が

Browserへ入っていないか。

逆に

Browserで十分なのに

Syncへ逃がしていないか。

境界線が妥当か評価してください。

--------------------------------

## 5 MVP監査

MVPが

3分で終わる実務

という思想を壊していないか。

MVPへ不要な機能が入っていないか。

逆に

最低限必要なものが抜けていないか。

--------------------------------

## 6 UX監査

画面数

クリック数

認知負荷

差分理解速度

キーボード操作

アクセシビリティ

印刷

Browserらしい軽さ

これらをレビューしてください。

--------------------------------

## 7 Data Model監査

Delta Tree

SLIR

Interface

Schema

Version

Migration

Renderer Separation

これらが

10年間耐えられるか。

--------------------------------

## 8 Technology監査

採用OSS

差し替え可能性

Vendor Lock-in

メンテナンス性

ライセンス

ブラウザ互換性

を評価してください。

--------------------------------

## 9 Roadmap監査

MVP

Phase2

Sync

Enterprise

の責務が適切か。

後戻りが発生しないロードマップになっているか。

--------------------------------

## 10 保守性監査

5年後

10年後

React終了

pdf.js終了

新ブラウザAPI

WebGPU

などが来ても

設計は崩壊しないか。

--------------------------------

# 出力形式

## Executive Summary

100点満点で採点

合格なら理由

不合格なら理由

--------------------------------

## Critical Issues

重要度

Critical

High

Medium

Low

で分類してください。

--------------------------------

## Constitution違反

違反箇所

理由

修正案

--------------------------------

## Architecture問題

問題

原因

修正案

--------------------------------

## Browser責務

Browserから削除すべきもの

Browserへ残すべきもの

--------------------------------

## Sync責務

Syncへ移動すべきもの

理由

--------------------------------

## MVP修正

追加

削除

延期

--------------------------------

## ADR追加

追加すべきADR

理由

--------------------------------

## ADR削除

不要なADR

理由

--------------------------------

## Interface改善

型

Version

Contract

改善点

--------------------------------

## Technology改善

OSS変更提案

ライブラリ抽象化

ライセンス問題

--------------------------------

## UX改善

改善点

優先順位

--------------------------------

## 10年保守評価

10年間保守可能か。

理由。

--------------------------------

## Cursor投入判定

YES

NO

条件付きYES

のいずれか。

Cursorへ投入する前に修正すべき点を列挙してください。

--------------------------------

# 最重要ルール

レビューは

「Browser版をEnterprise化する」

方向へ誘導してはいけません。

逆に

Enterprise向け機能を

Syncへ逃がす提案

は積極的に行ってください。

Smart Diffは

Browser版

Sync版

という二層構造で設計されています。

Browser版を巨大化させる提案は減点対象です。

最終目的は

SUGUDASU Constitutionに忠実な

10年間保守できる設計

を完成させることです。
````

---

## 3. 出力の置き場

| 成果物 | パス案 |
|--------|--------|
| 生出力 | `docs/notes/smart-diff-architecture-validation/raw-YYYYMMDD-{model}.md` |
| 提督サマリ | 同ディレクトリ `SYNTHESIS.md`（Keep/Change/Defer · Cursor投入判定） |

Cursor 実装は **投入判定 YES / 条件付きYES の条件クリア後**のみ。
