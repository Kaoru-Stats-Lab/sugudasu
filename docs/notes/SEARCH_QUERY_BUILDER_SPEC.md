# 検索式ビルダー — 仕様 SSOT（v0.2）

**更新:** 2026-08-13  
**ステータス:** **v0.2 実装対象** · URL `/search-query`  
**ロードマップ:** `data/roadmap.json` · `search-query-builder`  
**関連:** `PRODUCT_IDEA_JUDGMENT_LEDGER.md` · `TOOL_NAMING_AGENT_PLAYBOOK.md` · `DESIGN_GUIDELINE.md` §1

> **最優先要件:** 利用者は演算子を入力せず、用途を選んでキーワードを入れるだけで、正しい検索式を **30秒以内**に作成できる。

---

## 0. 一言

**調べものの Google 検索式を、演算子を覚えずにフォームから組み立ててコピー／Google で開く。検索結果は出さない。入力は SUGUDASU サーバーに送らない。**

分野寄せ（統計・挿絵・法令サイト等）は **用途プリセット少数 + site チップ** で行う。商用可・著作権フリー・数字の正しさは **保証しない**。

---

## 0.1 マルチAIレビュー突合（v0.1 確定 · 変更なし）

| 論点 | **確定** |
|------|----------|
| 配置 | 新規 id `search-query` |
| www 除去 | 必須 |
| Googleで開く | Must |
| OR / Bing | OUT（filetype OR は別チケット） |
| 複数 filetype | v0.1 単一 · OR は後続 |
| 除外 LocalStorage | Must |
| 競合 | Dork/OSINT ではない |

---

## 1. ペルソナから逆算

### 1-1. 主ペルソナ

| ID | 呼称 | 本機能での姿 |
|----|------|----------------|
| **P-B** | 実務マイクロ修正職人 | 営業企画 · 情シス補助 · 調査。`filetype:` / `site:` を毎回忘れる。社外秘を外部 AI に送りたくない |

**副:** P-A（研修 PDF・挿絵集め）— プリセット／チップで拾う。

### 1-2. Job → 仕様

| # | 声 | 仕様 | 満たさない |
|---|-----|------|------------|
| J1 | `filetype:` を忘れる | ラジオ1択 | 演算子教科書 |
| J2 | まとめ除外 | `-site:` + LS | 除外DB自動メンテ |
| J3 | 官公庁寄り | プリセット go.jp + チップ | 全市町村網羅 |
| J3b | 統計・白書の公的数字 | プリセット e-Stat | マーケデータ提供・最新性保証 |
| J3c | 挿絵・素材サイト | プリセット いらすとや | 商用可保証・素材庫 |
| J3d | 法令・NDL | **site チップのみ** | 専用プリセット乱立 |
| J4 | コピペで終わり | コピー + Googleで開く | 結果一覧 |
| J5 | 非送信 | クライアント完結 | 検索 API |
| J6 | 30秒 | プリセット≤6 · チップは弱いUI | 密度の高い分野ピルだらけ |
| J-X | 年度ごとの補助金一覧 | **やらない** | 年度メンテ地獄 |

### 1-3. 成功 / 失敗

**成功:** 演算子ゼロ手打ち · 30秒以内 · 式をコピーまたは Google 新規タブ。  
**失敗:** プリセット過多で迷う / 「商用可」「最新統計」と誤読 / 補助金プリセットが腐る。

---

## 2. プロダクト境界

### 2-1. Must

| 機能 | 内容 |
|------|------|
| プリセット | §4 · **最大6** · 下に1行説明 |
| キーワード | 1欄 · 全角スペース→半角 · 500字 |
| `filetype:` | 単一選択 |
| `site:` | 1欄 · URL可 · ホスト正規化 |
| site チップ | §4-1 · 弱いリンク型UI · 2段可 |
| 除外 | 最大3 · LocalStorage 直近 |
| コピー / Googleで開く | Must · Google送信注記 |
| 免責 | 利用条件・商用・数値の正しさは元サイト（§6） |

### 2-2. OUT（このバージョン）

| 項目 | 理由 |
|------|------|
| 補助金専用プリセット／年度DB | 年度で腐る · ユーザ設定不能 · Reject |
| 商用可・著作権フリー保証 | F7 |
| マーケデータ提供・論文DB・素材ギャラリー | Outside |
| 結果表示・スクレイプ・API | F2/F3 · 境界 |
| OSINT / Dork 演算子増殖 | 差別化逆 |
| プリセット7個以上 | 30秒・密度 |

---

## 3. UI 密度（必須制約）

| 層 | 上限 | 理由 |
|----|------|------|
| 用途プリセット（排他） | **6** | HCI: 2〜5推奨 · 6が上限感 |
| site チップ | 増やしてよい | 弱いUI · 「よく使うサイト」2段目可 |
| filetype | 現行維持 | いじらない |
| 詳細 | `<details>` のまま | メインに出さない |

分野名を全部プリセットにしない。**ジョブ名だけプリセット、ドメインはチップ。**

---

## 4. プリセット

| ID | ラベル | 1行説明 | 初期セット |
|----|--------|---------|------------|
| `pdf_gather` | PDFだけ集める | 資料・料金表を PDF に絞る | filetype=`pdf` |
| `gov_jp` | 官公庁・自治体寄り | まず go.jp。lg.jp 等はチップ | site=`go.jp` |
| `estat_stats` | 統計・白書寄り | 公的統計サイトに寄せる。正しさは元サイト | site=`e-stat.go.jp` |
| `illust_sites` | 挿絵・素材サイト寄り | よく使う挿絵サイトに寄せる。利用条件は元サイト | site=`irasutoya.com` |
| `exclude_noise` | まとめを除いて探す | 除外欄を前面。直近除外を候補表示 | 除外フォーカス |
| `free` | 自由に組み立て | すべて手動 | クリア（キーワード保持） |

プリセット変更時: **キーワードは保持** · 演算子フィールドだけ差し替え。

### 4-1. site チップ（SSOT: `SITE_CHIPS`）

| 表示 | host |
|------|------|
| go.jp | `go.jp` |
| lg.jp | `lg.jp` |
| ac.jp | `ac.jp` |
| e-Stat | `e-stat.go.jp` |
| e-Gov | `e-gov.go.jp` |
| 法令 | `elaws.e-gov.go.jp` |
| 国会図書館 | `ndl.go.jp` |
| いらすとや | `irasutoya.com` |

UI: 1行目に既存3、**「よく使うサイト」** で残り（または2段）。押下で `site` 欄に代入して式更新。

---

## 5. 式の組み立て規則

v0.1 と同じ（`normalizeHost` · 単一 filetype · site/-site 矛盾警告）。変更なし。

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
if (intitle) parts.push(`intitle:${intitle.trim()}`)
query = parts.join(' ')
```

### 5-1. ホスト正規化（Must）

| 入力 | 出力 |
|------|------|
| `https://www.example.co.jp/path?x=1` | `example.co.jp` |
| `www.go.jp` | `go.jp` |

---

## 6. ユーザー向け免責（Must）

画面または FAQ に含める:

- このツールは検索式を作るだけです。  
- **利用条件・商用可否・著作権・統計の正しさは各サイトで確認**してください。SUGUDASU は保証しません。  
- マーケデータ提供・論文検索DB・素材ダウンロードではありません。

---

## 7. LocalStorage（Must）

| キー | 内容 | 上限 |
|------|------|------|
| `sg-search-query-excludes` | 直近除外ホスト配列 | 10件 |
| `sg-search-query-last` | 直近のプリセット・filetype・site（任意） | 1式 |

- 機密キーワードの永続保存は **しない**

---

## 8. 非機能

| 項目 | 方針 |
|------|------|
| 送信 | SUGUDASU へなし。Google は利用者操作時のみ |
| 上限 | キーワード **500文字** · 除外 **3** · filetype **1** · プリセット **≤6** |
| テスト | `normalizeHost` · プリセット初期 site · チップ host · site/-site 矛盾 · 単一 filetype |
| a11y | ラベル関連 · コピー成功 `aria-live` |

---

## 9. 競合 · 差別化

**差別化1文:** 営業・情シス・総務向けに、用途プリセットと実務 site チップで30秒以内に検索式を作る。OSINT / Google Dork スイートではない。保証なし。

---

## 10. 受け入れテスト（v0.2 追加）

1. プリセット「統計・白書寄り」→ 式に `site:e-stat.go.jp`  
2. プリセット「挿絵・素材サイト寄り」→ 式に `site:irasutoya.com`  
3. チップ「法令」→ `site:elaws.e-gov.go.jp`  
4. プリセットは6個以下 · 補助金プリセットが無い  
5. FAQ/注記に「保証しない」がある  
6. v0.1 受け入れ（単一 filetype · 矛盾警告 · 非送信）退行なし  

---

## 11. v0.x 後続（いま書かない）

- 複数 filetype → `(filetype:pdf OR …)`  
- 式メタ履歴 · Sync 除外同期  
- キーワード例チップ（公募要領など · **年度補助金DBは作らない**）  

---

## 12. 実装チェックリスト

- [x] `assets/search-query.js` — `SEARCH_PRESETS` · `SITE_CHIPS`  
- [x] `tools/search-query.html` — チップ2段 · リード/FAQ  
- [x] `scripts/search-query.test.mjs`  
- [x] 本 SPEC · roadmap 要約更新  

---

*End of SSOT v0.2*
