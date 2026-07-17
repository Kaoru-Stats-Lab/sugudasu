# 検索式ビルダー — 仕様 SSOT（v0.1）

**更新:** 2026-07-17  
**ステータス:** **v0.1 実装済（alpha）** · URL `/search-query`  
**ロードマップ:** `data/roadmap.json` · `search-query-builder`（v0.2 拡張のみ残置）  
**レビュー:** Gemini / Claude / GPT / Grok（同一プロンプト · 2026-07-17）  
**関連:** `PRODUCT_IDEA_JUDGMENT_LEDGER.md` §2-3 · `TOOL_NAMING_AGENT_PLAYBOOK.md` · `DESIGN_GUIDELINE.md` §1

> **最優先要件（GPT §10 · 採用）:** 利用者は演算子を入力せず、用途を選んでキーワードを入れるだけで、正しい検索式を **30秒以内**に作成できる。

---

## 0. 一言

**調べものの Google 検索式（例: `filetype:pdf`）を、演算子を覚えずにフォームから組み立ててコピー／Google で開く。検索結果は出さない。入力は SUGUDASU サーバーに送らない。**

---

## 0.1 マルチAIレビュー突合（確定事項）

| 論点 | 4者の傾向 | **v0.1 確定** |
|------|-----------|----------------|
| 総合 | 全員 GO条件付き | **GO**（下記条件を仕様に取り込み済み） |
| 配置 A/B/C | 全員 **B** | 新規 id `search-query` · normalize 非同居 |
| www 除去 | 全員 Yes | **必須**（ホスト正規化） |
| Googleで開く | 全員 欲しい | **Must** · `target=_blank` · `rel=noopener noreferrer` · 「キーワードは Google に送られる」注記 |
| OR / Bing | 全員 v0.1 OUT寄り | **OUT** |
| プロンプト同居 | 全員 別 | **OUT**（別マイルストーン · v0.1 は導線も出さない） |
| 複数 filetype | Gemini: AND で0件事故 · 単一推奨 | **v0.1 は単一選択（ラジオ）** · 複数 OR は v0.2 |
| intitle | Gemini Must / Claude OUT / 他 Should | **Should**（任意1欄 · 受け入れ必須ではない） |
| 除外 LocalStorage | Claude/GPT/Grok Must | **Must**（直近の除外ドメイン） |
| URL→ホスト抽出 | 全員必須級 | **Must** |
| 競合ポジション | （後追い調査） | **Dork/OSINT 拡張とは別物** · 用途プリセット実務向け |

**採用しなかった少数意見:** 完成式の色分け（Grok Must）→ v0.1 は **Should**（プレーン等幅で可）。除外枠を1に削る（Gemini）→ **最大3** を維持し LocalStorage で手間を減らす。

---

## 1. ペルソナから逆算

### 1-1. 主ペルソナ

| ID | 呼称 | 本機能での姿 |
|----|------|----------------|
| **P-B** | 実務マイクロ修正職人 | 営業企画 · 情シス補助 · 調査。`filetype:` を毎回忘れる。社外秘キーワードを外部 AI に送りたくない |

**副:** P-A（研修 PDF 集め）— プリセットで拾うのみ。

### 1-2. Job → 仕様

| # | 声 | 仕様 | 満たさない |
|---|-----|------|------------|
| J1 | `filetype:` の書き方を忘れる | ファイル種別は **ラジオ1択** → 自動付与 | 演算子の教科書 |
| J2 | まとめを除外したい | `-site:` + **LocalStorage で直近除外を再利用** | 除外 DB の自動メンテ |
| J3 | 官公庁寄りにしたい | プリセット `go.jp` + クイック候補 `lg.jp` / `ac.jp` | 全市町村の完全網羅 |
| J4 | コピペで終わりたい | **コピー** + **Googleで開く** | 結果一覧の表示 |
| J5 | 社外秘を送らない | クライアント完結（F2）。Google 遷移時のみ利用者の意思で送信 | 検索 API · サジェスト |
| J6 | 30秒以内 | プリセット → キーワード → コピー／開く | 正規表現ビルダー |
| J7 | AI プロンプトも | **本ツールでは扱わない** | 同居 UI |
| J8 | URL を貼ってドメインだけ欲しい | **ホスト正規化**（レビュー追加） | 手動で path を削らせる |
| J9 | 前回の除外を打ち直したくない | LocalStorage（レビュー追加） | クラウド同期（Sync は将来） |

### 1-3. 成功 / 失敗

**成功:** 演算子ゼロ手打ち · 30秒以内 · 式をコピーまたは Google 新規タブ。  
**失敗:** 複数 filetype の AND で0件 / URL 生貼りで `site:` が壊れる / 「全角半角」の中に隠れて発見されない。

---

## 2. プロダクト境界

### 2-1. Must（v0.1）

| 機能 | 内容 |
|------|------|
| プリセット | §4 の4種 · 下に1行説明 |
| キーワード | 1欄 · プレースホルダーで「空白区切り＝AND」· **全角スペース→半角** |
| フレーズ | 任意 · `"..."` で囲む1フレーズ |
| `filetype:` | **単一選択**（なし / pdf / xlsx / docx / pptx / csv） |
| `site:` | 1欄 · URL 貼付可 → ホスト正規化 · ラベル「含めるサイト」 |
| `-site:` | 最大 **3** · ラベル「除くサイト」· 直近を LocalStorage から候補表示 |
| site と -site の矛盾 | 同一ホストなら警告し、式から除外側を優先しない／付与しない（実装は「警告＋どちらも付けない」） |
| 完成式プレビュー | リアルタイム · 等幅 |
| コピー | 成功時トースト「コピーしました」+ プレビュー一瞬ハイライト · `aria-live` |
| Googleで開く | 新規タブ · `noopener noreferrer` · 注記「開くとキーワードは Google に送られます」 |
| 非送信 | 「SUGUDASU のサーバーには送りません」 |
| 免責 | §5-3 |

### 2-2. Should（v0.1 にあればよい · なくても出荷可）

| 機能 | 内容 |
|------|------|
| `intitle:` | 任意1欄 |
| 官公庁クイック | `go.jp` / `lg.jp` / `ac.jp` を1クリックで site にセット |
| 式パーツの薄い色分け | keyword / filetype / site の視認 |

### 2-3. OUT（v0.1）

| やらない | 理由 |
|----------|------|
| 複数 filetype（OR 括弧） | v0.2。v0.1 は単一で AND 事故をゼロに |
| キーワード間 OR UI | 複雑化 |
| Bing 切替 | 需要未検証 |
| 検索結果の取得・表示 | F2/F3 · 憲法 |
| LLM 提案 · プロンプト生成同居 | 別マイルストーン |
| normalize タブ同居 | 発見性ゼロ（4者一致） |
| 脅威 URL 診断 | 別 OUT |

---

## 3. 配置 · 命名（確定）

| 層 | 値 |
|----|-----|
| id | `search-query` |
| ファイル | `tools/search-query.html` · URL `/search-query` |
| productName | **SUGUDASU 検索式ビルダー** |
| navLabel | **検索式**（`SUGUDASU` 接頭辞禁止） |
| conceptName | **検索式** |

**配置:** 案 **B**（新規）。`normalize`（全角半角）とは別道具。

実装時: `data/tool-registry.json` → `validate:tool-naming` → hub · shell。

---

## 4. プリセット

| ID | ラベル | 1行説明 | 初期セット |
|----|--------|---------|------------|
| `pdf_gather` | PDFだけ集める | 資料・料金表を PDF に絞る | filetype=`pdf` |
| `gov_jp` | 官公庁・自治体寄り | まず go.jp。lg.jp / ac.jp はワンタッチ | site=`go.jp` |
| `exclude_noise` | まとめを除いて探す | 除外欄を前面。直近除外を候補表示 | 除外欄フォーカス |
| `free` | 自由に組み立て | すべて手動 | クリア（キーワードは保持） |

プリセット変更時: **キーワードは保持** · 演算子フィールドだけ差し替え。

---

## 5. 式の組み立て規則（v0.1）

```
keywords = toHalfWidthSpace(keywordsRaw).trim()
phrase   = phraseRaw.trim()
hostSite = normalizeHost(siteRaw)
hostsEx  = excludes.map(normalizeHost).filter(Boolean).slice(0, 3)

// 矛盾: hostSite が hostsEx に含まれる → 警告し site も exclude も付けない
parts = []
if (phrase) parts.push(`"${phrase}"`)
if (keywords) parts.push(keywords)
if (filetype) parts.push(`filetype:${filetype}`)   // 0 or 1
if (hostSite && !conflict) parts.push(`site:${hostSite}`)
for (h of hostsEx) if (!conflict || h !== hostSite) parts.push(`-site:${h}`)
if (intitle) parts.push(`intitle:${intitle.trim()}`)  // Should
query = parts.join(' ')
```

### 5-1. ホスト正規化（Must · レビュー条件の核）

入力例 → 出力:

| 入力 | 出力 |
|------|------|
| `https://www.example.co.jp/path?x=1` | `example.co.jp` |
| `www.go.jp` | `go.jp` |
| `pref.hokkaido.lg.jp` | `pref.hokkaido.lg.jp` |
| 空 · スペースのみ | （付与なし）+ 警告 |

規則:

1. trim  
2. scheme（`http://` `https://`）除去  
3. path / query / hash 除去（最初の `/` `?` `#` 以降）  
4. 先頭の `www.` を **1回**除去（`www2.` は残す）  
5. 残がホストっぽくない（`.` なし等）→ 付与せず警告  

**UI（実装確定 · 実装後レビュー反映）:** 「含めるサイト」入力欄からフォーカスが外れた（blur）とき、プレビュー文言ではなく **入力欄のテキスト自体をドメイン名のみに書き換える**。クイックチップ（go.jp 等）も同じ正規化後の値を入れる。

**キーワード:** 全角スペース（`U+3000`）は組み立て前に半角スペースへ置換する（実装済）。

### 5-2. キーワード正規化

- 全角スペース（`U+3000`）→ 半角スペース  
- 連続空白は1つに畳まない（ユーザー意図を残す）が、**先頭末尾 trim** はする  

### 5-3. 免責・注記（UI）

固定文言:

> このツールは検索式を作成します。結果の件数・順位・表示内容は検索エンジン側で決まり、網羅性は保証しません。

> 「Googleで開く」を使うと、キーワードは Google に送られます。SUGUDASU のサーバーには送信しません。

0件向け（コピー欄近く · 常時でなくてよい）:

> 結果が0件のときは、キーワードを減らすか、ファイル形式・サイト限定を外してみてください。

---

## 6. UI 骨格

```
[プリセット: PDFだけ集める ▼]
（PDFだけ集める — 資料・料金表を PDF に絞る）

キーワード       [競合A 料金表　　　　]  ← 空白=AND
完全一致フレーズ [（任意）　　　　　　]
タイトルに含む   [（任意 · intitle）　]  ← Should · 折りたたみ可

ファイル種別     ( )なし (•)PDF ( )Excel ( )Word ( )PowerPoint ( )CSV

含めるサイト     [URLでも可 → example.co.jp]
  [go.jp] [lg.jp] [ac.jp]   ← gov プリセット時 or 常時クイック

除くサイト       [domain] [+] … 最大3
  直近: [matome.example] [spam.example]  ← LocalStorage

—— 完成した検索式 ——
競合A 料金表 filetype:pdf
[コピー]  [Googleで開く（新規タブ）]

ⓘ SUGUDASU には送りません · Googleで開くとキーワードは Google へ
```

---

## 7. LocalStorage（Must）

| キー（案） | 内容 | 上限 |
|------------|------|------|
| `sg-search-query-excludes` | 直近除外ホスト配列 | 10件 · FIFO |
| `sg-search-query-last` | 直近のプリセット・filetype・site（任意） | 1式 |

- 機密キーワードの永続保存は **しない**（キーワードは保存しない）  
- クリア操作を設定またはフッターに1つ  

---

## 8. 非機能

| 項目 | 方針 |
|------|------|
| 送信 | SUGUDASU へなし。Google は利用者操作時のみ |
| 上限 | キーワード **500文字** · 除外 **3** · filetype **1** |
| テスト | `normalizeHost` · 全角スペース · site/-site 矛盾 · 単一 filetype · 空キーワード |
| a11y | ラベル関連 · コピー成功 `aria-live` |

---

## 9. 競合 · 差別化

**差別化1文:** 営業・情シス・総務向けに、用途プリセットで30秒以内に検索式を作る。OSINT / Google Dork スイートではない。

### 9-1. 近い既存（参考調査 2026-07-17）

| 名前 | 近い点 | SUGUDASUと違う点 |
|------|--------|------------------|
| DorkBuilder（Chrome拡張） | site / filetype / intitle / 除外 / プレビュー / Googleで開く | OSINT・Dork色が強く機能過多。拡張インストールが必要 |
| Good Old Search 等（OSS） | クエリビルダー | Shodan / crt.sh / Wayback 等・セキュリティ調査向け |
| 個人開発 Advanced Query Builder | フォーム→演算子 | SEO/汎用寄り。非送信・日本実務プリセットは薄い |

GitHub の `google dork builder` 系は拡張・ペンテスト用途が大半。**「実務担当・用途ファースト・非送信・登録不要・Web単体」で一致する定番OSSは見当たらない**（調査時点）。

### 9-2. やらない（競合に寄せない）

| OUT | 理由 |
|-----|------|
| `inurl:` / `intext:` / `cache:` / `index of` 等の Dork 網羅 | 30秒 UX と逆 |
| Shodan · crt.sh · Wayback 切替 | ペルソナ外 |
| Chrome 拡張必須 | 情シスブロック · F3 外 |
| 「自然文→式」の LLM | F2 外 |

公開情報だけの調べなら ChatGPT で済ませる場面もある — 非送信が効くのは **社外秘語を含む調べ**。

---

## 10. v0.1 受け入れ条件

1. プリセット「PDFだけ集める」+ キーワード → 式に `filetype:pdf`（1つのみ）  
2. `https://www.example.co.jp/a` を site に貼る → 式は `site:example.co.jp`  
3. 除外1つ → `-site:` が付く · 再訪で直近除外が候補に出る  
4. コピー成功フィードバックが見える  
5. Googleで開く → 新規タブで Google 検索  
6. 同一ホストを site と -site に入れたとき警告  
7. Network: SUGUDASU へ入力 POST なし  
8. FAQ: 「結果は表示しますか？ → しません」

---

## 11. v0.2 候補（いま書かない実装）

- 複数 filetype → `(filetype:pdf OR filetype:xlsx)`  
- 式の履歴（キーワードを含まないメタのみ）  
- Sync への除外リスト同期  

---

## 12. 実装チェックリスト（着手時）

- [ ] `tools/search-query.html` + `assets/search-query-*.js`  
- [ ] `normalizeHost` 単体テスト  
- [ ] `data/tool-registry.json` · hub · shell · `validate:tool-naming`  
- [ ] FAQ · changelog（public）· roadmap から本項目削除または shipped 処理  

---

*End of SSOT v0.1（レビュー反映）*
