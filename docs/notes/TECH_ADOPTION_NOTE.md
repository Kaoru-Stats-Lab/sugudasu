# SUGUDASU Tech Adoption Note（実務）

**更新:** 2026-07-29  
**役割:** 「どの技術を採用するか」「いつ共通化するか」を Agent / 実装者が迷わず決めるための短い契約  
**前提の全体観:** [`CAPABILITY_INVENTORY.md`](CAPABILITY_INVENTORY.md)（先に読む）  
**機械契約:** [`../../data/tech-shared-contracts.json`](../../data/tech-shared-contracts.json)  
**ゲート:** `npm run validate:tech-adoption`（`build:pages` に内蔵）  
**対象:** コア（静的 · ブラウザ完結）。Sync 専用は [`SUGUDASU_SYNC_LINE.md`](SUGUDASU_SYNC_LINE.md) · [`SYNC_INFRA_CLOUDFLARE.md`](SYNC_INFRA_CLOUDFLARE.md)

> これは **Platform SDK 宣言ではない**。  
> 巨大基盤を先に積まず、棚卸し表の **Dup / P1** から薄いモジュールを増やす。  
> **一回の抽出で終わらせない。** 下の §0 が永続ループ。

### 目的の階層（これより下位の理由で動かない）

| 順 | 目的 | 意味 |
|----|------|------|
| **1（高次）** | **SUGUDASU の体験を共通化する** | 同じ JTBD 層では、Agent や実装の違いがユーザーに見えない。Continue Later · 非送信 · コピー成功 · 提出の仕上がりなどがブレない |
| **2** | **技術のゼロスクラッチをしない（Token 節約）** | 既に血を流した契約・`sg-*` を再利用し、Agent が毎回再発明しない |
| （結果） | 影響範囲の特定 · 回帰ゲート | 体験共通化と Token 節約の**副作用**。目的に昇格させない |

技術共通化そのものは目的ではない。**体験が揃うために技術を寄せる。** 体験境界が違う（記入 vs 赤入れの座標など）なら、無理に寄せない（§3）。

---

## 0. 運用ループ（永続化 · トリガー）

仕組み = **誰かがトリガーを引く → 機械 or Agent が契約どおり動く → 回帰はゲートが止める**。

```text
トリガー
  ├─ build:pages / release:pages:free
  │     → validate:tech-adoption（自動 · FAIL でデプロイ不可）
  ├─ 新規ツール公開 §1.5 A12
  │     → Agent が Inventory 追記 or NA
  ├─ assets/sg-* · *-engine · *-app を編集
  │     → Cursor rule sugudasu-tech-adoption
  ├─ 「共通化」「棚卸し」「Tech Adoption」
  │     → Skill sugudasu-tech-adoption
  └─ 同型能力が 3 プロダクト目
        → 抽出（G1–G5）→ Inventory 更新
        → tech-shared-contracts.json に禁止パターン追加  ← ここを忘れると仕組みが腐る
```

| 部品 | 役割 |
|------|------|
| `CAPABILITY_INVENTORY.md` | 何が Dup / Shared か（人間向け台帳） |
| `TECH_ADOPTION_NOTE.md`（本ファイル） | 採用契約 · ゲート · No-Go |
| `data/tech-shared-contracts.json` | 機械が検査する禁止パターン · トリガー一覧 |
| `scripts/verify-tech-adoption.mjs` | 回帰防止（再発明を exit 1） |
| `.cursor/rules/sugudasu-tech-adoption.mdc` | 触ったときに Agent へ強制適用 |
| `.cursor/skills/sugudasu-tech-adoption/` | ユーザー発話でループ起動 |

**抽出完了の定義（Done）:** コード寄せ + Inventory Shared + **contracts に禁止ルール追加** + 影響 `test:*` 緑。  
contracts を増やさない抽出は「仕組み化していない」とみなす。

---

## 1. 原則（5行）

1. **Pain → 技術。** 技術からプロダクトを始めない（Product Constitution）。
2. **許可リストは短い。** ここに無いライブラリは「新規採用レビュー」が要る。
3. **3 回目の同型で抽出。** 2 プロダクトは観察、3 つ目で shared（Inventory 参照）。
4. **JTBD が違うならモデルを混ぜない。** 同じ vendor でも座標正本は分けてよい。
5. **shared を壊したら影響ツールのテスト。** 「特定しやすい」は契約テストがあって初めて効く。

---

## 2. 採用スタック（コア · 現状正）

| 層 | 採用 | 禁止・避ける | 根拠 |
|----|------|--------------|------|
| 配信 | 静的 HTML + `assets/` · Cloudflare Pages | コアに必須バックエンド | F3 |
| 言語 | Vanilla JS（ESM）· 必要なら小さな engine 分割 | React/Vue をコア既定にしない | F4 · バンドル肥大 |
| UI | `sugudasu.css` `--sg-*` · shell | ツール単独のデザインシステム | DESIGN_GUIDELINE |
| PDF 表示 | **pdf.js** via `sg-pdf-vendor`（`ensurePdfjs`） | 別 PDF レンダラの乱立 · app 内に CDN URL 直書き | Inventory B |
| PDF 組立 | **pdf-lib** via `sg-pdf-vendor.loadPdfLib` · 編集ページ焼きは `sg-pdf-partial` | サーバー側 PDF 生成をコア前提にしない | F2/F3 |
| PDF 上限 | `sg-pdf-limits`（Document 40MB/50p） | ツールごとに違う Document 上限を増やす | Inventory B |
| 秘匿ブラシ | `sg-canvas-mask`（黒・ぼかし・モザイク） | mask / annotate に二重実装を戻す | Inventory C |
| 永続 L1 | IndexedDB（プロダクト別 DB 名可） | 業務データのサーバー保存 | Continue Later L1 |
| 永続 L2 | `*_sugudasu.json` | 独自バイナリ必須拡張子 | Continue Later |
| クリップボード | `sg-copy-feedback` + Clipboard API | 独自トースト乱立 | Shared |
| 画像キャンバス | Canvas 2D | WebGL 必須化 | 実務書類向け |
| テスト | `scripts/*-engine.test.mjs` · `test:sg-pdf-shared` | shared 変更でテスト無し | 下記 §5 |

**Sync だけ許可が広がるもの**（コアに持ち込まない）: Supabase Auth · Realtime · 有料クラウド保存。

---

## 3. 座標・PDF 契約（混ぜない）

Inventory の最重要 Diverge。Agent が「共通座標エンジン」を作ろうとしたら **止める**。

| モデル | 正本の単位 | 使うプロダクト | 向いている仕事 |
|--------|------------|----------------|----------------|
| **Page unit** | pdf.js viewport **scale=1** のページ座標。表示は `displayScale` で写像 | `pdf-fill`（`cssToPage` / `pageToCss` · 焼き付け描画は `paintOverlaysToCanvas` · 結合は `sg-pdf-partial`） | 記入 · 印 · 提出用完成 |
| **Canvas pixel** | 表示キャンバスの px（`getBoundingClientRect` スケール） | `annotate` · `mask` 系 | 画像/ページ画像への注釈 · 秘匿 |

**ルール**

- 新規ツールはどちらか **1 つを選んで明記**する（engine 先頭コメントで可）。
- Page unit ツールの書き出しは **displayScale に依存させない**（pdf-fill: オーバーレイはページ単位正本 · `EXPORT_SCALE` のみ写像）。
- 編集ページの PDF 寸法は **元ページのポイントサイズ**に合わせる（`sg-pdf-partial` 既定 `pageSize: 'source'`。巨大 `addPage([rasterW, rasterH])` 禁止）。
- 両モデルを 1 ファイルの「万能座標」に統合しない。
- 共通化してよいのは **vendor · partial bake · limits · canvas-mask** まで。**座標写像（Page unit ↔ Canvas pixel）の統合はしない。**

**正本（詳細）:** [`docs/products/pdf-fill/technical-design.md`](../products/pdf-fill/technical-design.md)（Page unit）· `assets/sg-pdf-partial.js` · `assets/annotate-engine.js`（Canvas pixel）

---

## 4. 共通化ゲート（Go / No-Go）

新しい shared（`assets/sg-*.js` または既存 engine からの抽出）は、次をすべて満たすこと。

| # | ゲート | 不合格なら |
|---|--------|------------|
| G1 | Inventory で **Dup かつ P1/P2**、または 3 プロダクト目 | コピーして観察 |
| G2 | 抽出後も各ツールの JTBD / コピー境界が壊れない | 抽出中止 |
| G3 | F2（業務データ非送信）· F4（静的）を破らない | Reject / Sync 候補へ |
| G4 | API 面が小さい（関数数を抑える · フレームワーク化しない） | 設計やり直し |
| G5 | 影響ツールに **engine テスト or smoke** がある / 追加する | マージしない |

**No-Go 例**

- 「座標を全部共通化したい」
- 「Undo フレームワークを先に作りたい」
- 「全 Document 型に同じ IDB スキーマを強制」
- React 化・モノレポ Platform を共通化の前提にする

---

## 5. shared 変更時の影響範囲

| shared / 対象 | 少なくとも確認 |
|---------------|----------------|
| `sg-copy-feedback` | 主要コピー CTA の1ツール smoke |
| `sg-pdf-vendor` | pdf-fill · annotate · pdf-images · clip-stash |
| `sg-pdf-partial` | pdf-fill · annotate（未編集ページ保持）· `npm run test:sg-pdf-shared` |
| `sg-pdf-limits` | pdf-fill · pdf-images · `test:pdf-fill` · `test:pdf-images` |
| `sg-canvas-mask` | annotate · mask · `test:annotate` · `test:mask` |
| `pdf-fill-engine` の座標写像 / `paintOverlaysToCanvas` | `npm run test:pdf-fill` · 配置→リサイズ→保存 smoke |
| `sugudasu-shell` / css | ヘッダー未表示ガード · 印刷1本 |

変更 PR / コミットメッセージに **影響ツール id** を書く（例: `shared: pdf vendor · pdf-fill, annotate, pdf-images`）。

---

## 6. 新規ライブラリ採用レビュー（短いチェック）

許可リスト外を入れたいとき、実装前に1段落で答える。

1. どの Inventory クラスタの Pain か
2. 既存 vendor / `sg-*` で足りない理由（1文）
3. バンドル/Pages サイズへの影響
4. F2（入力・成果物が外に出ないか）
5. 捨てるときのコスト（1ファイル削除で足りるか）

合格したら Inventory に1行追記し、本 Note §2 を更新する。

---

## 7. 直近の実務バックログ（Inventory 由来）

実装チケット化するときの順序（合意案）。**座標統一（pdf-fill ↔ annotate）は含めない · 禁止。**

| # | 状態 | 項目 |
|---|------|------|
| 1 | **Done** | **P1** `sg-pdf-vendor.js` — `ensurePdfjs` / `loadPdfLib` / `pdfjsDocumentExtras` |
| 2 | **Done** | **P1** `sg-pdf-partial.js` — pdf-fill · annotate が `buildPartialAnnotatedPdf` を共有（既定 `pageSize: 'source'`） |
| 3 | **Done** | **P1** `sg-canvas-mask.js` — 黒・ぼかし・モザイク正本 · engines は re-export |
| 4 | **Done** | **P2** `sg-pdf-limits.js` — Document PDF 40MB / 50p（annotate の画像 25MB は別） |
| 5 | 別トラック | Continue Later（仕様正本は CONTINUE_LATER_SPEC） |

**回帰テスト:** `npm run test:sg-pdf-shared` · `test:pdf-fill` · `test:pdf-images` · `test:annotate` · `test:mask`

**Done（座標契約 · 2026-07-29 · pdf-fill）**

- Page unit 正本（`cssToPage` / `pageToCss`）
- 焼き付け描画 `paintOverlaysToCanvas`（displayScale 非依存）
- 結合は `sg-pdf-partial`（`pageSize: 'source'`）
- 同一 PDF セッションの sticky 書体
- annotate との座標統合は **しない**

---

## 8. Agent 向け（1分）

```text
似た処理を書く？
  → CAPABILITY_INVENTORY を見る
  → Dup+P1 なら既存/抽出を使う（sg-pdf-* · sg-canvas-mask）
  → Diverge（座標など）ならモデルを選んで明記。統合しない
  → 許可リスト外ライブラリ → §6 レビュー
  → shared を触る → §5 影響ツールをテスト
  → 抽出したら tech-shared-contracts.json に禁止ルール追加
  → npm run validate:tech-adoption
```

対外コピー・Hub・命名は本 Note の管轄外（Playbook · Card Guideline · USER_FACING_COPY）。

---

## 関連

- [`CAPABILITY_INVENTORY.md`](CAPABILITY_INVENTORY.md)
- [`../../data/tech-shared-contracts.json`](../../data/tech-shared-contracts.json)
- [`CONTINUE_LATER_SPEC.md`](CONTINUE_LATER_SPEC.md)
- [`../products/pdf-fill/technical-design.md`](../products/pdf-fill/technical-design.md)（Page unit 実装）
- `assets/sg-pdf-vendor.js` · `sg-pdf-partial.js` · `sg-pdf-limits.js` · `sg-canvas-mask.js`
- [`PRODUCT_CONSTITUTION.md`](../product/PRODUCT_CONSTITUTION.md)
- [`DESIGN_GUIDELINE.md`](../DESIGN_GUIDELINE.md)
- [`MULTI_AI_CODER_PLAYBOOK.md`](MULTI_AI_CODER_PLAYBOOK.md)（横断リファクタ時）
- [`TOOL_NAMING_AGENT_PLAYBOOK.md`](TOOL_NAMING_AGENT_PLAYBOOK.md) §1.5 A12
