# SUGUDASU 重複能力の棚卸し（Capability Inventory）

**更新:** 2026-08-05  
**役割:** プロダクト横断で「同じ仕事を何回書いているか」を見える化する台帳  
**下流:** [`TECH_ADOPTION_NOTE.md`](TECH_ADOPTION_NOTE.md)（採用・抽出の実務ルール）  
**対象外:** Sync 専用ランタイム（Auth · Room · Realtime）の詳細 — Sync は別ライン

> Agent: 新ツールで「似た処理」を書く前に本表を見る。  
> **共通化の判断は TECH_ADOPTION_NOTE のゲートに従う。** 本表は事実の棚卸し。  
> **2026-07-29:** P1（vendor · partial bake · canvas mask）と P2（PDF doc limits）を抽出済み。  
> **2026-08-05:** Paper Zoom を Dup に追記（裏紙 · image-trim · pdf-fill パイロット · S-ZOOM）。

---

## 0. 読み方

| 列 | 意味 |
|----|------|
| **能力** | ユーザー価値ではなく、実装が担う技術能力 |
| **出現** | 主なプロダクト / ファイル |
| **状態** | 下表 |
| **抽出優先** | P0（契約だけ）· P1（すぐ薄い shared）· P2（条件付き）· P3（今はしない）· Done |

| 状態 | 意味 |
|------|------|
| **Shared** | 既に `sg-*` / shell / vendor で共有 |
| **Dup** | ほぼ同型のコードが複数箇所にある |
| **Diverge** | 能力は近いがモデル/契約が違う（無理に寄せない） |
| **Spec** | UX/仕様は共通化済み、実装は未横断 |
| **Pattern** | CSS/マークアップの型だけ揃っている（配線は各ツール） |

**抽出ルール（要約）:** 同型が **3 プロダクト目** に出たら shared 候補。2 つは観察。JTBD が違うなら **Diverge のまま契約だけ揃える**。

---

## 1. 全体観（クラスタ）

```text
Chrome / コピー / DnD UI          ← Shared
PDF vendor / 部分焼き / doc上限   ← Shared（sg-pdf-* · 2026-07-29）
キャンバス秘匿（黒・ぼかし）      ← Shared（sg-canvas-mask）
座標 · オーバーレイモデル         ← Diverge（pdf-fill ≠ annotate）· 統一しない
永続（IDB · Continue Later）      ← Spec + 個別実装が混在
Handoff / ZIP / QR                ← 小規模 Shared
帳票・表・テキスト変換            ← プロダクト固有（共通化しない）
```

**判断の軸:** 「同じライブラリを読む」≠「同じ抽象に載せる」。  
例: pdf-fill と annotate はどちらも pdf.js を使うが、座標正本は別物。

---

## 2. 棚卸し表

### A. 既に共通（Done / Shared）

| 能力 | 出現 | 状態 | 備考 | 優先 |
|------|------|------|------|------|
| ヘッダー · ナビ · フッター | `sugudasu-shell.js` · 全ツール | Shared | 触るとき Playbook | Done |
| デザイントークン · 印刷 | `sugudasu.css` · `--sg-*` | Shared | Schedule は ADAPT 正本 | Done |
| コピー成功フィードバック | `sg-copy-feedback.js` · 多数 | Shared | 新規もこれを使う | Done |
| プライバシーバッジ | shell `data-sg-privacy-badge` | Shared | F2 コピー契約 | Done |
| ファイル DnD 見た目 | `.sg-file-drop` | Pattern | watermark / table-conv 等 | Done |
| 印影 → 請求書 | `stamp-handoff.js` | Shared | sessionStorage 1回 | Done |
| テストデータ handoff | `test-data-handoff.js` | Shared | 同上パターン | Done |
| ZIP 生成 | `watermark-engine` → `pdf-images` が import | Shared | 良い抽出例 | Done |
| QR encode/decode 核 | `link-qr-engine` · `qr-reader-parser` | Shared | 小クラスタ | Done |
| フォーム検証 · CSV · paste-scan | `sg-form-validate` 等 | Shared | 必要なツールだけ | Done |

### B. PDF クラスタ（重複の本丸）

| 能力 | 出現 | 状態 | 備考 | 優先 |
|------|------|------|------|------|
| pdf.js vendor 読込 · worker | `sg-pdf-vendor.js` ← pdf-fill · annotate · pdf-images · clip-stash | **Shared** | `ensurePdfjs` / `pdfjsDocumentExtras` | Done |
| pdf-lib vendor 読込 | `sg-pdf-vendor.loadPdfLib` | **Shared** | partial bake 経由 | Done |
| ページ rasterize（viewport） | pdf-fill · annotate · pdf-images | Diverge | scale / 用途が違う | P2（契約だけ） |
| **編集ページだけ焼き · 未編集は copyPages** | `sg-pdf-partial.js` ← pdf-fill · annotate | **Shared** | 既定 `pageSize: 'source'` | Done |
| ページ単位座標（scale=1 正本） | `pdf-fill-engine` `cssToPage` / `pageToCss` · `paintOverlaysToCanvas` | Diverge | annotate はキャンバス px · **統一禁止** | **P3**（統一禁止） |
| キャンバス座標（client→canvas） | annotate · mask · image-trim 等 | Pattern | `getBoundingClientRect` スケール | P2（薄い util 可） |
| PDF 上限（MB · ページ） | `sg-pdf-limits.js` ← pdf-fill · pdf-images（annotate ページ上限も共有 · バイトは 25MB 維持） | **Shared** | Document 向け 40MB/50p | Done |

### C. キャンバス · 画像秘匿クラスタ

| 能力 | 出現 | 状態 | 備考 | 優先 |
|------|------|------|------|------|
| 黒塗り · ぼかし · モザイク | `sg-canvas-mask.js` ← annotate-engine · mask-engine re-export | **Shared** | annotate 安全 mosaic 正本 | Done |
| 白塗り / 色塗り | mask · pdf-fill（strip） | Diverge | pdf-fill はオーバーレイモデル | P3 |
| 矢印 · 枠 · 楕円注釈 | annotate · mask（annotate 形状を import） | Shared寄り | mask-app が annotate-engine 形状を使用 | Done/観察 |
| Undo/Redo（キャンバス） | annotate · mask · pdf-fill · sticky-room 等 | Dup | スキーマが違う | P3 |
| 画像読込 · Ctrl+V 画像 | annotate · mask · stamp · clip-stash | Dup | clipboard 画像の取り出し | P2 |
| 長辺リサイズ表示 | annotate 等 | Pattern | 表示用縮小 | P3 |
| **Paper Zoom / Pan（見る距離）** | 裏紙（正本）· image-trim · **pdf-fill（S-ZOOM パイロット）** · annotate/mask 未 | **Dup** | Ctrl+wheel · Space/中ボタン · CSS transform。画面内％なし。3本目抽出候補 | **P2**（契約→薄い util） |

### D. 永続 · 再開クラスタ

| 能力 | 出現 | 状態 | 備考 | 優先 |
|------|------|------|------|------|
| Continue Later（思想 · JSON 契約） | [`CONTINUE_LATER_SPEC.md`](CONTINUE_LATER_SPEC.md) | **Spec** | 実装はパイロット段階 | **P0**（実装横断は別計画） |
| IndexedDB ストア | clip-stash · slot-board · mention ·（予定 pdf-fill） | Diverge | DB 名もスキーマも別でよい | P2（ラッパ強制しない） |
| localStorage 下書き | timeline · sticky-room 等 | Pattern | Document 型は Continue Later へ寄せる | Spec |

### E. 帳票 · 表 · テキスト（共通化しない）

| 能力 | 出現 | 状態 | 理由 |
|------|------|------|------|
| 税計算 · 源泉 | invoice · receipt | 固有 | Pain が帳票ごと |
| シフト公平性 | shift | 固有 | — |
| Unicode 装飾文字 | sns · font-converter | Shared 済み核 | `unicode-math-alpha` |
| 表変換 | table-conv | 固有 | — |
| 文書変更確認 · Projection Export | smart-diff（`smart-diff-export` · pdf-lib） | 固有 + Export | pdf-lib は vendor 経由 · Parser 束ねは別 Wave |
| 工程表 Notion UI | schedule / Sync | 固有 + Sync | ADAPT 正本 |

---

## 3. 優先マップ（今やる / やらない）

| 優先 | 能力 | 次のアクション |
|------|------|----------------|
| Done | pdf.js / pdf-lib bootstrap | `assets/sg-pdf-vendor.js` |
| Done | partial PDF bake | `assets/sg-pdf-partial.js` |
| Done | mask rect ops | `assets/sg-canvas-mask.js` |
| Done | PDF サイズ/ページ上限定数 | `assets/sg-pdf-limits.js` |
| P2 | canvasPoint / normalizeRect | 既に engine 内 — 共有するなら超薄い util |
| P0 | Continue Later | 仕様どおりパイロット。技術スタック議論と混ぜない |
| **P3** | **座標モデル統一（pdf-fill ↔ annotate）** | **禁止。** TECH_ADOPTION_NOTE で契約を書くだけ |
| P3 | Undo 共通フレームワーク | 不要。各ツールの履歴単位が違う |

---

## 4. 具体例：pdf-fill × annotate（会議で出た論点）

| 観点 | 事実 |
|------|------|
| 共通にできる | vendor 読込 · 部分焼き付け ·（任意）キャンバスポインタ変換 |
| 共通にしない | ページ単位オーバーレイ正本（記入） vs 画像キャンバス正本（赤入れ） |
| JTBD | 記入 = 提出用に**完成** · 赤入れ = 共有前に**整える**（コピーでも境界を崩さない） |
| 影響範囲 | shared 化すると 1 バグで両ツール死。だから **契約テスト必須**（Adoption Note） |

---

## 5. メンテ

- 新ツール公開時（Playbook §1.5 **A12**）に、本表へ **1 行追記**（能力が既存クラスタに入るか）
- 抽出完了したら状態を Shared / Done に更新し、**`data/tech-shared-contracts.json` に禁止パターンを追加**（無いと次の Agent が再発明する）
- 回帰確認: `npm run validate:tech-adoption`
- 憲法・命名・デプロイの話は本表に書かない（既存 SSOT）
- 運用ループの全体像: [`TECH_ADOPTION_NOTE.md`](TECH_ADOPTION_NOTE.md) §0

## 関連

- [`TECH_ADOPTION_NOTE.md`](TECH_ADOPTION_NOTE.md)
- [`../../data/tech-shared-contracts.json`](../../data/tech-shared-contracts.json)
- [`CONTINUE_LATER_SPEC.md`](CONTINUE_LATER_SPEC.md)
- [`PRODUCT_CONSTITUTION.md`](../product/PRODUCT_CONSTITUTION.md)（F2 · F4）
- [`TOOL_NAMING_AGENT_PLAYBOOK.md`](TOOL_NAMING_AGENT_PLAYBOOK.md) §1.5 A12
