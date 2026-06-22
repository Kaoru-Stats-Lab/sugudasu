# ツール命名 — Agent 実行手順（Playbook）

**更新:** 2026-06-20  
**リポジトリ:** `C:\asl_dev\sugudasu`（asl-dashboard ではない）  
**読者:** Cursor / Claude 等の別 Agent  
**規範:** `docs/DESIGN_GUIDELINE.md` §1.3（思想） · **本ファイル（手順）** · `data/tool-registry.json`（値の SSOT）

---

## 0. 3層を混同しない

| 層 | JSON キー / コード | 例 | ユーザーが見る場所 |
|----|-------------------|-----|-------------------|
| **id** | レジストリキー · `data-sg-tool-id` · `{id}.html` | `invoice` | 開発者のみ（URL パスは `/invoice`） |
| **概念名** | `conceptName` · ナビは `navLabel` | 請求書 | ダークナビ · 帳票タブ · 本文 |
| **プロダクト名** | `productName` | SUGUDASU 請求書 | 白ヘッダー · hub カード `<h3>` |

**鉄則**

- `data-sg-title` = **`productName` と完全一致**（subtitle は機能補足）
- ナビ = **`navLabel`**（`SUGUDASU` 接頭辞 **禁止** — 左ロゴで既出）
- 帳票 UI = **`conceptName`**（「見積書」「請求書」タブ — プロダクト名を繰り返さない）
- slug / ファイル名 = **ASCII id のみ**（`請求書.html` 禁止）

---

## 1. 手順 A — 新規ツール追加（順番固定）

**この順を飛ばさない。** 検証は Step 7 で落ちる。

### Step 1 — `data/tool-registry.json`

`tools` にキー `{id}` を追加（キー = id = 将来のファイル名）。

```json
"my-tool": {
  "file": "my-tool.html",
  "conceptName": "概念の短い日本語",
  "productName": "SUGUDASU ○○",
  "navLabel": "ナビ用4〜8字",
  "navIcon": "📄",
  "inNav": true,
  "navOrder": 15,
  "name": "開発バッジ用の長い名前",
  "version": "0.1.0",
  "stage": "alpha",
  "statusNote": "Backlog 根拠1行"
}
```

| フィールド | 必須 | メモ |
|-----------|------|------|
| `conceptName` | ○ | 本文・説明で使う |
| `productName` | ○ | ツールなら `SUGUDASU ` で始める（法務ページ除く） |
| `navLabel` | △ | `inNav: true` なら必須 |
| `navIcon` / `navOrder` | △ | ナビ掲載時 |
| `inNav` | ○ | 通常ツール `true` · 法務/内部 `false` |

### Step 2 — `tools/{id}.html`

```html
<div id="sg-chrome-top"
     data-sg-title="SUGUDASU ○○"
     data-sg-subtitle="機能補足 · 任意"
     data-sg-tool-id="{id}"
     data-sg-print="true"></div>
```

- `data-sg-title` は registry の **`productName` をコピペ**（手打ち禁止）
- `data-sg-tool-id` = registry キーと **同一**
- 末尾: `sugudasu-shell.js` **同期読込**（`defer` 禁止 · `CHROME_HEADER_GUARDRAILS.md`）
- `<title>` = **検索意図の日本語** + `| SUGUDASU`（productName の機械連結はしない）

### Step 3 — `assets/{id}.js`（ロジックがある場合）

HTML と **同名 id**。registry キー · ファイル名 · `data-sg-tool-id` を揃える。

### Step 4 — `tools/hub.html`

カード 1 枚追加:

```html
<a href="{id}.html" class="sg-card block p-5 …">
  <h3 class="font-bold text-slate-900">{productName}</h3>
  <p class="text-xs text-slate-500 mt-2">{conceptName ベースの機能説明}</p>
</a>
```

- `<h3>` = **`productName` 完全一致**
- hub title / OG に **ツール件数（N選）を書かない**（`BACKLOG.md` §8-11）

### Step 5 — `assets/sugudasu-shell.js` の `TOOLS`

`inNav: true` のツールを **`navOrder` 順**で配列に 1 行追加:

```javascript
{ id: 'my-tool', file: 'my-tool.html', label: 'ナビ用', icon: '📄' },
```

- `label` = registry の **`navLabel` と完全一致**
- コメント: `registry navLabel と同期（validate:tool-naming で検証）`
- 読込後は registry からナビを上書きするが、**初回描画フォールバック**のため必須

### Step 6 — `data/changelog.json`

先頭に 1 エントリ（`tools` 配列に `{id}.html`）。

### Step 7 — 検証（必須）

```bash
cd C:\asl_dev\sugudasu
npm run validate:tool-naming
npm run build:pages
```

両方 **exit 0** まで直す。

---

## 2. 手順 B — 既存ツールの改名・表記修正

1. **`data/tool-registry.json`** の `conceptName` / `productName` / `navLabel` を先に直す
2. **`tools/{id}.html`** の `data-sg-title`（= productName）· 必要なら `data-sg-subtitle`
3. **`tools/hub.html`** の該当カード `<h3>`
4. **`assets/sugudasu-shell.js`** の `TOOLS[].label`（= navLabel）
5. ユーザー向け比較表（`statements.html` 等）に slug 表記が残っていれば **productName** に
6. **`npm run validate:tool-naming`** → **`npm run build:pages`**
7. **`data/changelog.json`** 1 行

**id（ファイル名）の変更**は URL 破壊 → `_redirects` · 旧ファイル削除 · 全リンク grep が別タスク（本 Playbook の範囲外）。

---

## 3. 手順 C — 検証コマンド

```bash
npm run validate:tool-naming
```

| チェック | 内容 |
|---------|------|
| registry 完全性 | 全ツールに `conceptName` · `productName` |
| HTML ヘッダー | `data-sg-tool-id` があるページで `data-sg-title` === `productName` |
| shell ナビ | `TOOLS[].label` === registry `navLabel`（`inNav` のみ） |
| hub カード | ナビ掲載ツールの `<h3>` に `productName` が含まれる |

失敗時は `[tool-naming-guard] FAIL:` のファイル名と期待値を読んで **registry 起点**で直す。

---

## 4. サイトページ（ツール以外）

| id | productName | data-sg-tool-id |
|----|-------------|-----------------|
| hub | ツール一覧 | `hub` |
| updates | 更新履歴 | `updates` |
| statements | SUGUDASU の約束 | `statements` |
| privacy / terms / disclaimer | 各ページ名（接頭辞なし） | 任意 |
| not-a-car | 車ではなく書類 | なし可 |

法務ページに `SUGUDASU 利用規約` のような接頭辞は **付けない**。

---

## 5. 禁止 · よくあるミス

| NG | OK |
|----|-----|
| ヘッダー `見積・納品・請求書` のみ | `SUGUDASU 請求書` + subtitle `見積 · 納品 · 請求` |
| ナビ `SUGUDASU請求書` | ナビ `請求書` |
| hub / statements に `invoice` · `group-split` | `SUGUDASU 請求書` · `SUGUDASU 班分け` |
| registry なしで HTML だけ直す | **必ず registry 先** |
| `TOOLS` だけ直して registry 放置 | 両方 + validate |

---

## 6. 参照リンク

| ドキュメント | 用途 |
|-------------|------|
| `docs/DESIGN_GUIDELINE.md` §1.3 | 命名思想 · 全ツール対応表 |
| `docs/notes/CHROME_HEADER_GUARDRAILS.md` | `data-sg-title` · shell 読込 |
| `docs/BACKLOG.md` §8-11-4 | 新規ツール追加チェックリスト（SEO · hub） |
| `data/tool-registry.json` | 値の SSOT |
| `scripts/verify-tool-naming.mjs` | 検証実装 |

---

## 7. Agent 完了報告テンプレ

```text
命名: registry 更新 → HTML/shell/hub 反映 → validate:tool-naming OK → build:pages OK
変更 id: invoice, …
触った従量: なし（静的のみ）
```
