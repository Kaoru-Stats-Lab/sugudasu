# SUGUDASU — Brand Layers（Web / Browser / Sync）

**更新:** 2026-07-28  
**役割:** ブランド構造の3層マップ  
**非役割:** 個別製品の Constitution・実装仕様（子プロダクトへ）  
**決定:** ADR-0008

---

## 1. 三層

```text
Web        サイト上で仕事が終わる道具（sugudasu.com のツール群）
Browser    ブラウザ上で「今見ているもの」をその場で終わらせる Family
Sync       クラウド・同期・アカウントが本質の価値になるレーン
```

| 層 | Mission（要約） | 典型 Surface |
|----|-----------------|--------------|
| **Web** | 帳票・計算・変換など、ページ内で完結する道具 | `sugudasu.com/{tool}` |
| **Browser** | ブラウザで見つけたものを、その場で終わらせる | Chrome Extension（Side Panel 等） |
| **Sync** | 複数端末・複数人・永続共有が仕事の本体 | `sync.sugudasu.com` 等 |

層を混ぜると人格が崩れる。  
例: Browser 製品に Sync の「常時クラウド同期」を足すと Local First が壊れる。

---

## 2. Browser 層

**Mission:** ブラウザで見つけたものを、その場で終わらせる。

- 巡回・監視・蓄積が本体ではない  
- ユーザーが開いた現在ページが起点  
- Family 内の子（Mention · 将来の Capture / Share / Fill 等）は  
  共通の親憲法 [`constitution.md`](./constitution.md) に従う  

**最初の実装:** Mention by SUGUDASU（[`../mention/`](../mention/README.md)）

---

## 3. Sync との境界（重要）

Sync は SUGUDASU 全体の第三の柱として存在するが、

- **Browser Family の必須機能ではない**
- **Mention のスコープ外**（ADR-0003 · ADR-0008 · `specification.md` Non-Goals）

「便利だから Mention にログイン同期を」は、Browser 構想の柱名を借りた **層越え** であり、Reject 候補。

---

## 4. Web との境界

Web ツール（請求書・PDF 等）は Browser Extension 化しない限り Web 層のまま。  
`/mention` LP は Web 上の導線だが、製品本体は Browser（Extension）である。

---

## 関連

- [`philosophy.md`](./philosophy.md)  
- [`constitution.md`](./constitution.md)  
- [`architecture.md`](./architecture.md)  
- Sync ライン（別層の正本）: [`../../notes/SUGUDASU_SYNC_LINE.md`](../../notes/SUGUDASU_SYNC_LINE.md)
