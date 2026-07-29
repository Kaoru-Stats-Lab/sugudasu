# SUGUDASU 共通仕様：Continue Later（続きを開く）v1

**更新:** 2026-07-28  
**状態:** 共通仕様案（ガイドライン）· 実装はプロダクト単位で段階導入  
**役割:** 途中再開の思想 · 3層保存 · Document · JSON 契約 · 適用範囲  
**UI/コピー要約:** [`../DESIGN_GUIDELINE.md`](../DESIGN_GUIDELINE.md) §3.x Continue Later  
**Sync（Level 3）:** [`SUGUDASU_SYNC_LINE.md`](SUGUDASU_SYNC_LINE.md)  
**ユーザー向け文言:** [`USER_FACING_COPY_VISIBILITY.md`](USER_FACING_COPY_VISIBILITY.md)（「保存」より「続きを開く」）

> Agent: 途中保存・再開・JSON 下書き・「続きを開く」UI を触る前に本ファイルを読む。  
> 憲法本文の改正ではない。**製品 UX の共通原則**として運用する（Brand Constitution の勝手な書き換え禁止）。

---

## 1. 目的

SUGUDASU はこれまで **「1プロダクト = 1タスク = 数分で終わる」** を前提としてきた。

しかし実際の業務では、行政書類 · 建設工程表 · ドラフト会議 · 班分け · OGP など、一度で終わらない作業が少なくない。

代表例が PDF Fill:

- 「日付だけ決まっていない」
- 「上司確認待ち」
- 「印鑑だけ後日」

**作業は 95% 終わっているが完成できない**ケースが多い。タブ閉鎖や再起動で状態が消えるのは、「すぐ使える」思想と矛盾する。

そこで **「保存」ではなく「続きを開く」** を SUGUDASU 全体の共通 UX として導入する。

---

## 2. 基本思想

ユーザーが欲しいのは「保存」ではない。**続きをやる**である。

```text
Save First     ← 採らない
Continue Later ← 採る
```

### Continue Later Principle

> SUGUDASU は「保存」を提供するのではない。  
> **仕事を途中から再開できる体験**を提供する。

- **「保存」は実装**
- **「続きを開く」はユーザー体験**

PDF Fill だけの改善ではなく、**共通プラットフォーム機能**にする。各プロダクトが個別の保存 UI を発明しない。

---

## 3. 保存レイヤ（3層）

```text
Continue Later
├── Level 1  自動保存（IndexedDB）     … コア · 登録不要
├── Level 2  保存ファイル（JSON）       … コア · 明示エクスポート
└── Level 3  Continue Anywhere（Sync） … Sync ライン · どこでも続き
```

| Level | 手段 | ログイン | 範囲 | 操作 |
|-------|------|----------|------|------|
| 1 | IndexedDB | 不要 | この PC · このブラウザ | 自動（意識させない） |
| 2 | `*_sugudasu.json` | 不要 | ファイルとして持ち出し | 明示「保存」 |
| 3 | Sync | アカウント | どこでも続き | Sync 上乗せ |

Level 3 の価値は「クラウド保存」ではなく **どこでも続きを開ける**（正本: Sync ライン）。

Cookie · 履歴削除と IndexedDB は独立（ユーザー向け説明では「このブラウザに残る下書き」程度に留める）。

---

## 4. Document 思想

各適用プロダクトは **Document**（1 作業単位）を持つ。

| プロダクト例 | Document 例 |
|--------------|-------------|
| PDF Fill | 補助金申請書 |
| 工程表 | A工事工程表 |
| ドラフト会議 | 2026営業部ドラフト |

**1 Document = 1 保存データ。**

ユーザーはプロダクト名ではなく **仕事の名前**で思い出す。

---

## 5. JSON 契約（Level 2）

最低限の内部情報（ファイル名は人間向け · 判定は中身）:

```json
{
  "generator": "sugudasu",
  "schemaVersion": 1,
  "productId": "pdf-fill",
  "title": "補助金申請書",
  "updatedAt": "2026-07-28T12:00:00.000Z",
  "payload": {}
}
```

| フィールド | 役割 |
|------------|------|
| `generator` | SUGUDASU 識別 |
| `schemaVersion` | 後方互換 |
| `productId` | Hub / プロダクトが遷移先を判定 |
| `title` | 最近使用 · ファイル名提案 |
| `payload` | プロダクト固有 |

**命名（デフォルト提案）:** `{タイトル}_sugudasu.json`  
例: `工程表_A工事_sugudasu.json` · `補助金申請書_sugudasu.json`

理由: JSON 維持 · ブランド識別 · メール添付 · 独自拡張子不要 · Hub で扱いやすい。

---

## 6. 最近使用したファイル（Level 1 メタ）

各プロダクト（または共通ストア）は IndexedDB に少なくとも次を持つ:

- 名前（title）
- 更新日時
- 種別 / productId
- 最終アクセス
- サムネイル（必要なら）

---

## 7. UI（共通）

詳細コピー・配置は DESIGN_GUIDELINE § Continue Later。要約:

- 主役ラベルは **「続きを開く」**（「保存」は副次 · 技術寄りの明示エクスポート時）
- 各プロダクト右上（またはツールバー）に「続きを開く」
- パネル: 最近使用 / 保存ファイルを開く · ドラッグ&ドロップ
- Hub に共通 Drop → `productId` で適切なツールへ遷移
- プロダクトページでも JSON Drop 可（Hub 必須ではない）

---

## 8. 適用対象

| 適用する（途中再開需要高） | 適用しない（数分完結） |
|---------------------------|------------------------|
| PDF Fill · 工程表/Schedule · ドラフト会議 · 班分け · SLOT · OGP（案件単位）等 | QR · Base64 · URL Encode · WebP 変換 · 余白トリム等の一発変換 |

新規ツールは「タブを閉じたら困る仕事か？」で判定。迷ったら本表と competition/Mission ではなく **作業時間軸**で見る。

---

## 9. 憲法・F 軸との関係

| 層 | 扱い |
|----|------|
| Level 1–2 | コア合憲寄り（登録不要 · 端末内 · ユーザーがファイルを持ち出す） |
| Level 3 | **Sync 候補**（共有・どこでも続きが本質のときだけ） |
| Brand Constitution | 本ファイルは改正しない。原則は製品 UX SSOT |

「クラウドに溜めて監視する」は Continue Later ではない（Mention 等の Non-Goals と同型の罠）。

---

## 10. 実装順（推奨）

1. 共通 JSON 契約 · `productId` レジストリ整合  
2. パイロット: `pdf-fill`（Level 1 + 2）  
3. UI パターンを shell / 共通コンポーネント化（「続きを開く」）  
4. Hub Drop  
5. 他 Document 型ツールへ横展開  
6. Level 3 は Sync 製品単位で（コアにログインを強制しない）

---

## 関連

- デザイン入口: [`../DESIGN_GUIDELINE.md`](../DESIGN_GUIDELINE.md)  
- Sync: [`SUGUDASU_SYNC_LINE.md`](SUGUDASU_SYNC_LINE.md)  
- 採用基準: [`../product/PRODUCT_CONSTITUTION.md`](../product/PRODUCT_CONSTITUTION.md)  
- 文言: [`USER_FACING_COPY_VISIBILITY.md`](USER_FACING_COPY_VISIBILITY.md)
