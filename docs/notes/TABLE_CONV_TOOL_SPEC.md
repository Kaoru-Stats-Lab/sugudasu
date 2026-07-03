# 表データ相互コンバータ — 仕様SSOT（T06 · 別Agent引き継ぎ用）

**更新:** 2026-07-03（Priority 深掘り · Gemini P0-3 / P1-7 突合）  
**リポジトリ:** `C:\asl_dev\sugudasu`  
**ステータス:** **MVP 配信**（v1.0.0 · registry 登録済）

> **別Agentへ:** 本ファイルを最初に読む。続けて [`data-finance-priority-gemini-RESULT.md`](data-finance-priority-gemini-RESULT.md) · [`NORMALIZE_TEXT_TOOL_SPEC.md`](NORMALIZE_TEXT_TOOL_SPEC.md)（境界） · `docs/DESIGN_GUIDELINE.md` · `docs/BACKLOG.md` §1-15-8。

---

## 1. プロダクト概要

| 項目 | 内容 |
|------|------|
| 仮ファイル | `tools/table-conv.html`（URL `/table-conv`） |
| registry `id` | `table-conv`（**Q4 新規 id 枠** · 実装時に `tool-registry.json` 登録） |
| 命名案 | productName **SUGUDASU 表変換** · navLabel **表変換** · conceptName **表データ変換** |
| 一言 | **Excel コピペ / CSV を、送信せず Markdown · JSON · TSV に** |
| ペルソナ | 社内非エンジニア · Web担当 · 総務（Notion/Backlog/GitHub 移行） |
| ポジション | Table Convert Online / 各種 MD変換サイトの **非送信・Shift-JIS 対応** 代替 |
| SUGUDASU適合 | F1–F7 ◎ · ブラウザ完結 · **5,000行 / 2MB 目安** |

### `normalize` との境界

| 入力 | 管轄 |
|------|------|
| 1列リスト（改行区切りのみ） | **`normalize`** — ソート · 重複削除 · 行フィルタ |
| タブ/カンマで **2列以上** · Excel 複数列コピー · CSV ファイル | **`table-conv`** |

1行目スキャンで区切り文字を検知し、1列のみなら normalize へ誘導するバナーを出してよい。

---

## 2. 設計原則

### 2-1. 非送信・オフライン

- すべて `FileReader` + インライン JS。サーバー API なし
- 初回読込後はオフラインでも動作（静的 HTML）
- ページ上部に **「通信していません」** バッジ · DevTools Network 確認案内

### 2-2. 入力デュアル

| 経路 | 用途 |
|------|------|
| **テキストエリア** | Excel からのコピペ（TSV 自動認識） |
| **ファイル D&D** | `.csv` 等 · Shift-JIS / UTF-8 / BOM 対応 |

### 2-3. 出力

| 形式 | デフォルト | 備考 |
|------|------------|------|
| **Markdown 表** | **◎ ファーストビュー** | Notion · Backlog · GitHub 向け |
| JSON | タブ2 | 配列 of オブジェクト（ヘッダー行あり時） |
| CSV | タブ3 | カンマ区切り · BOM オプション |
| TSV | タブ4 | Excel 再貼付用 |

各タブにワンクリックコピー。

### 2-4. フェーズ（逆変換）

| フェーズ | 範囲 |
|----------|------|
| **v1 MVP** | Excel貼付 / CSVファイル → MD · JSON · CSV · TSV（**片道**） |
| **HOLD** | Markdown 表 → TSV — 需要は限定的 · パース品質リスク大。**方言は対応しない** |
| **対象外（恒久）** | MD 方言 · LaTeX · Mermaid · XML · リッチ表 · API |

---

## 3. 文字コード · BOM

### 3-1. デコード

| エンコード | 方針 |
|------------|------|
| UTF-8 | デフォルト · BOM (`EF BB BF`) は除去 |
| Shift-JIS / CP932 | `TextDecoder('shift-jis')` · 手動トグル切替 |
| 自動判定 | UTF-8 優先 · 文字化け検知時に Shift-JIS 提案 |

**既知制約（要実機確認）:** CP932 拡張文字（①・㈱等）はブラウザ依存。外字は `` になる場合あり — 出力前に **置換文字検知** で警告。

### 3-2. エンコード出力

- Excel 向け **UTF-8 BOM 付き CSV** オプション（チェックボックス）
- BOM 除去忘れで JSON キー先頭に BOM が混入しないよう、パース時に必ず strip

---

## 4. 変換ロジック

### 4-1. Excel コピペ（TSV）

- セル区切り: タブ `\t`
- 行区切り: `\n` / `\r\n`
- **結合セル:** 左上の値のみ · 他は空セル（FAQ 明記）
- **セル内改行:** Markdown 出力時 `<br>` に置換（表構造維持）
- **数式:** クリップボードの**表示値**のみ（復元不可）
- **日付:** 見た目の文字列通り（ISO 強制変換は v1.1 オプション検討）

### 4-2. CSV パース

- ダブルクォート囲み · エスケープ `""` 対応
- 列数不一致行: ハイライト or スキップ + 「不正な行を除外しました」通知

### 4-3. Markdown 出力

```markdown
| 列A | 列B |
| --- | --- |
| 値1 | 値2 |
```

- セル内 `|` はエスケープ（`\|` または HTML エンティティ — 実装時に1つに固定）
- ヘッダー行: 1行目をヘッダーとみなすトグル（デフォルト ON）

### 4-4. JSON 出力

- ヘッダーあり: `[{ "列A": "値1", "列B": "値2" }, ...]`
- ヘッダーなし: `[["値1","値2"], ...]`（上級者折りたたみ）

---

## 5. UI フロー（案）

```
[非送信バッジ] [オフライン動作確認済み]
[入力: テキストエリア]  [または CSV D&D]
[エンコード] ○ UTF-8  ○ Shift-JIS  ○ 自動
[ヘッダー行を1行目とみなす] ☑
[変換]
[出力タブ] Markdown | JSON | CSV | TSV
[各タブ: プレビュー + コピー]
[文字化け警告バナー]（該当時）
[行数] 入力 N 行 · M 列
```

---

## 6. 上限 · エラー

| 項目 | 値 |
|------|-----|
| 行数目安 | **5,000行** 超過で警告 · 処理制限 |
| サイズ目安 | **2MB** |
| パースエラー | 停止せずスキップ可 · 行番号を表示 |
| XSS | 出力は `textContent` 経由 · innerHTML 禁止 |

---

## 7. やらないこと（方針 · 理由付き）

**原則:** 表データの**運搬**（Excel/CSV → 素朴な MD·JSON·TSV）に徹する。Markdown の方言統合やリッチ表現は**意図的に非対応**（環境ごとに解釈が割れ、ユーザー期待と実装が一致しなくなるため）。

| やらないこと | 理由 |
|--------------|------|
| **Markdown 方言の入力・出力**（Zenn `:::message` · Qiita 拡張 · Obsidian 固有記法など） | サービスごとにレンダラが異なり、同じ MD でも見え方が変わる。方言を判別・変換すると**サポート範囲が説明不能**になり、貼った先で崩れたときにツールのせいにされやすい |
| **リッチ表**（結合セル復元 · セル内箇条書き · 列幅 · 色） | Excel の表示値以外はクリップボードに載らない。MD 側も GitHub 風の `\| col \|` 程度に限定し、**壊れにくい最小表**だけを出す |
| **LaTeX · Mermaid · XML · SQL ジェネレータ** | ペルソナは社内非エンジニア · 総務 · Web 担当（Notion/Backlog 貼付）。論文・README 図表は [TableConvert](https://tableconvert.com/ja/about/) 等の専門ツール向け |
| **30形式超の変換 · REST API · 会員制** | SUGUDASU は非送信・最短ルート。多機能追従はスコープ外 |
| **スプレッドシート型インライン編集** | 表変換器ではなく Excel/スプシの代替にならない |
| **サーバー保存 · アカウント** | 非送信ポジションと矛盾 |
| **Markdown 表 → TSV の汎用逆変換**（v1） | パイプ表だけでも `\|` エスケープ · 区切り行の揺れ · プラットフォーム固有 MD が混ざると**列ズレが静かに起きる**。v1.1 でもやるなら「素朴な GitHub 風のみ・非対応は明示」とする（**方言対応はしない**） |
| **レシート OCR 等の画像入力** | 別ツール管轄 |

**出力する Markdown:** ヘッダー行 + `| --- |` + データ行の**最小 GFM 風**。セル内 `\|` はエスケープ · 改行は `<br>`（実装固定）。これ以外の拡張は**書かない**。

---

## 8. FAQ（Tier A LP · 採用）

1. **Excel / スプレッドシート → Markdown 表** — タブ区切り貼付 · Notion/Backlog/GitHub（NOVEBLO 同型）
2. **CSV ⇔ JSON** — 同一入力から出力タブ切替（片道 · MD逆変換は非対応）
3. **データは外部に送信されますか？** — いいえ · Network 確認可（TableConvert 同様のブラウザ内処理）
4. **Shift-JIS CSV** — トグル · BOM 出力 · 置換文字警告
5. **TableConvert との違い** — 非送信 · Shift-JIS · 最短ルート（30形式/API/エディタはなし）
6. **連続変換** — 出力タブ切替 / 手動で入力へ貼戻し（→入力へ ボタンは将来）
7. **1列リスト** — normalize へ誘導
8. **会員登録・課金・オフライン** — 不要 · 静的 HTML
9. **結合セル・数式** — 表示値のみ · 非再現

実装: `tools/table-conv.html` #tc-faq · JSON-LD `data-sg-faq`

---

## 9. SEO · ガイド

**ロングテール（採用）:** `Excel Markdown 変換` · `Shift-JIS CSV 文字化け` · `エクセル コピペ マークダウン` · `CSV Notion 変換` 等（正本: `data-finance-priority-gemini-RESULT.md` §2 P0-3）

**ガイド案 `/guides/`**

1. 社内秘 Excel/CSV を Notion/Markdown へ送信せず変換  
2. Shift-JIS と BOM の仕組みとブラウザでの直し方  
3. Excel コピペから JSON/Markdown 表を1秒で作る

---

## 10. 実装順 · チェックリスト

### Q3 — SSOT + PoC

- [x] 本 SSOT 初稿
- [ ] `TextDecoder('shift-jis')` スパイク（サンプル CSV 3本）
- [ ] BOM strip ユニットテスト骨子
- [ ] registry 下書き（`inNav: false` でも可）

### Q4 — MVP 配信

- [x] `tools/table-conv.html` + `assets/table-conv.js`
- [x] `tool-registry.json` · hub カード
- [ ] `npm run validate:tool-naming` · `build:pages`（デプロイ時）
- [x] FAQ JSON-LD · Tier A LP 5問
- [x] normalize 境界バナー（1列時誘導）

---

## 11. 免責

> 本ツールは一般的な表変換例を提供するものです。フォント・色・数式・結合セル等の書式は完全再現しません。税務・会計データの正確性は保証しません。要専門家確認。

---

## 12. 関連ファイル

| パス | 用途 |
|------|------|
| `docs/notes/data-finance-priority-gemini-RESULT.md` | Priority 突合正本 |
| `docs/notes/NORMALIZE_TEXT_TOOL_SPEC.md` | 1列リスト境界 |
| `data/roadmap.json` | `table-conv-mvp` 公開項目 |

---

*End of SSOT*
