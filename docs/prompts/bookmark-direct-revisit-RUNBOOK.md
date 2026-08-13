# Bookmark / Direct 再訪 — Deep Research RUNBOOK

**更新:** 2026-08-13  
**目的:** Direct（ブックマーク · ホーム画面 · 社内Wiki URL）の再訪戦略を、産経型割り込みを避けたまま役員会で決めるための調査。  
**最終決定は役員会のみ。リサーチ中にグロースバナーの一括改修をしない。**

---

## 0. パイプライン

```text
BRIEF
  → Deep Research COPYPASTE（1エンジン以上）
  → raw を docs/notes/bookmark-direct-revisit-research/ に保存
  → SYNTHESIS（総意 / 尖り / 却下）
  → 役員会 Keep/Change/Defer（必要なら Case Law or DESIGN ノートへ）
  → 実装（sugudasu-growth.js 等）は決議後
```

---

## 1. ファイル

| 役割 | パス |
|------|------|
| 共通 BRIEF | [`bookmark-direct-revisit-BRIEF.md`](bookmark-direct-revisit-BRIEF.md) |
| Deep Research 本文 | [`bookmark-direct-revisit-deep-research-COPYPASTE.md`](bookmark-direct-revisit-deep-research-COPYPASTE.md) |
| 生出力 | `docs/notes/bookmark-direct-revisit-research/raw-{engine}-YYYYMMDD.md` |
| 合成 | `docs/notes/bookmark-direct-revisit-research/SYNTHESIS.md`（初回はテンプレを作成） |

補助（任意）: 同じ BRIEF を Perplexity / Claude に短く投げ、Deep Research の穴埋めだけさせる。多数決しない。

---

## 2. 手順

1. BRIEF を読む（憲法ポインタ・現行実装・暫定 Keep/Reject）  
2. Deep Research に BRIEF + COPYPASTE を投入（エンジン名と日付を記録）  
3. 生出力を raw に保存  
4. SYNTHESIS を埋める（下表）  
5. 役員会で配置・トリガー・コピー原則を決議 → その後だけ実装  

---

## 3. SYNTHESIS 欄（最低限）

| 欄 | 内容 |
|----|------|
| 総意候補 | 2ソース以上 |
| 尖り | 1ソースだが検討価値 |
| 却下 | 産経型・通知・入場時モーダル等 |
| 推奨実装案 | D章の1案（または「何もしない」） |
| 役員会の問い | 最大3 |

---

## 4. 禁止

- AI出力をそのまま憲法・ANTI に貼る  
- リサーチ中に全ツールへ新バナー横展開  
- 「Retentionを上げるために通知を」系の結論を採用候補に残す（Reject固定）  
