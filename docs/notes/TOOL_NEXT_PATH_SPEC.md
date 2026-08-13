# ツール完了後の「次の1本」（Tool Next Path）

**更新:** 2026-08-13  
**Status:** v1.1（新規公開・Purge ゲート · 逆方向監査）  
**データ:** [`data/tool-next-path.json`](../../data/tool-next-path.json)  
**実装:** [`assets/sg-tool-next-path.js`](../../assets/sg-tool-next-path.js) · `tool_job_done` 後に表示  
**新規公開:** [`TOOL_NAMING_AGENT_PLAYBOOK.md`](TOOL_NAMING_AGENT_PLAYBOOK.md) **A17**  
**非対象:** Hub グリッド並び · 履歴レコメンド · [`relations.json`](../../data/relations.json) の多対多関連

---

## 0. 一言

DONE したあと、**本当に続く仕事があるツールだけ**、編集が書いた **次の道具へのリンクを1本**出す。  
終わったら帰す。推測しない。カルーセルにしない。  
**from→next があるからといって next→from を自動では載せない。** 逆方向は別ジャッジ。

---

## 1. `relations.json` との違い

| | `relations.json` | `tool-next-path.json` |
|--|------------------|------------------------|
| 形 | 多対多（関連の束） | **1ソース → 次1本** |
| 用途 | 将来の Product 関連節 · ガイド | **完了直後の次工程** |
| Hub | 未使用（Phase 2 保留） | 使わない |
| 自動学習 | 禁止 | 禁止 |
| 対称 | 双方向に並べてもよい | **非対称が普通**（工程には向きがある） |

---

## 2. 型（MECE · 必須）

| type | 意味 |
|------|------|
| **A** | 同じ成果物の仕上げ工程が残っている |
| **B** | 持ち運び形式だけ足りない |
| **C** | 中身の正しさを人が確認する工程が残っている |
| **D** | 人・場の段取りが単発ツールの外に続く |
| **E** | 法務・注意書きなど添える文が残っている |

1つの `from` に対し path は **最大1件**。型が複数当てはまるときは **最も近い次工程1本**だけ残す。

---

## 3. UX 契約

| 規則 | 内容 |
|------|------|
| トリガー | `tool_job_done`（copy / pdf / download / print）成功時 |
| 表示 | 画面下部の弱い1行 · 主完了CTAより弱い |
| 回数 | **同一ページ表示あたり1回**（連続コピーで連打しない） |
| 閉じる | × で session 中はその from を出さない |
| 禁止 | モーダル · 3件以上 · 「おすすめ」見出し · 履歴スコア · 自動逆リンク |
| 計測 | クリック時 `tool_next_path_click`（tool_id · next_id · path_type）· 本文は送らない |

---

## 4. 偽の続き（載せない）

- 同じ完了の言い換え  
- カテゴリが近いだけ  
- Hub 人気・Sync 押し（別導線）  
- 履歴共起  
- fair-draw 内で済んだゲートの再掲  
- **工程の逆流**（例: 赤入れ DONE → WebP変換、表変換 DONE → 全角半角）  

---

## 5. ジャッジ手順（新規 · 改修 · Purge）

### 5-1. 新規ツール公開（Playbook A17）

新 id を公開するとき、次を **すべて** YES/NA:

1. **このツール DONE のあと、成果物を外に出す前に残る工程はあるか？**（型 A–E）  
2. あるなら **次の1本の id** は既存のどれか？ 無ければ path を **載せない**（NA）  
3. **既存の path で `nextId` が新ツールになる候補**はあるか？（他ツール → 新ツール）  
4. あるなら、その from ごとに §0 の「本当に続く仕事」で再ジャッジし、**既存 path を上書きしてよいか**（1 from = 1 next）  
5. **逆方向:** 新ツール → 既存（または既存 → 新）を機械的に足さない。§5-3  

結果を `data/tool-next-path.json` に反映（追加・変更・**載せないなら触らない**）。  
`npm run validate:hub-ia`。

### 5-2. ツール Purge / 非公開（必須）

id を registry / hub から外す・削除するとき:

1. `tool-next-path.json` の **`paths[id]` を削除**  
2. **`nextId === id` の全エントリを列挙**し、各 from について:  
   - 別の次工程に差し替えるか  
   - path 自体を削除するか  
   を再ジャッジ（放置禁止）  
3. `relations.json` からも当該 id を除去（多対多 · 別作業だが同 PR 推奨）  
4. `npm run validate:hub-ia`（未知 id で FAIL する）

### 5-3. 逆方向ジャッジ（from←→next）

エッジ `A → B` があるとき、**必ず**次を問う（自動追加は禁止）:

| 問い | YES のとき | NO のとき |
|------|------------|-----------|
| B DONE のあと、**同じ成果物の工程として A が残るか？** | `B → A` を検討（型を付け直す） | 逆エッジは載せない |
| B DONE のあと、**別の C が残るか？**（A ではない） | `B → C` を検討（A→B とは独立） | B は終端のまま |
| A→B と B→A の両方を載せると **往復ループ**にならないか？ | **入口が違う独立ワークフロー**なら両方可（例: 帳票→印影 と 印影→請求書）。同一DONEの自動往復ではない | どちらか一方だけ残す |

**典型:** 帳票 → 印影は有り。印影 → 帳票は「判子を先に用意してから請求書を開く」なら有り（別ペルソナの入口）。赤入れ → 変換系は工程逆流なので無し。

---

## 6. 監査ログ（2026-08-13）

### 6-1. 採用 path

| from | next | type | 理由要約 |
|------|------|------|----------|
| pdf-fill | stamp | A | 記入後の判子 |
| invoice | stamp | A | 帳票後の社印 |
| receipt | stamp | A | 同上 |
| stamp | invoice | A | 印影用意後に請求書へ（handoff と同方向 · 逆の入口） |
| webp-to-jpg | annotate | A | 変換後の共有前整え |
| image-trim | annotate | A | 切り出し後の指示・黒塗り |
| clipboard-trim | annotate | A | クリップボード画像の共有前整え |
| group-split | timeline | D | 班のあと当日進行 |
| normalize | table-conv | C | 列整えのあと表化（条件付きだが編集固定で許容） |

### 6-2. 逆方向を載せなかったもの

| 既存エッジ | 逆 `next→from` | 判定 | 理由 |
|------------|----------------|------|------|
| pdf-fill → stamp | stamp → pdf-fill | **Reject** | 印影後の主戦場は帳票。pdf-fill より invoice を採用 |
| invoice/receipt → stamp | stamp → receipt | **Reject** | stamp の next は1本のみ · invoice を優先 |
| webp / trim → annotate | annotate → webp/trim | **Reject** | 工程逆流。赤入れ後は外へ出す完了が多い |
| group-split → timeline | timeline → group-split | **Reject** | 進行表のあとに班分けは稀（順序が逆） |
| normalize → table-conv | table-conv → normalize | **Reject** | 表化後に列整形は主経路ではない |

### 6-3. 終端のまま（next なし）— 明示

annotate · table-conv · timeline · fair-draw · diff · pdf-images · watermark · clip-stash · ai-cleaner ほか、**続く工程を編集が断言できないもの**は載せない。

---

## 7. 追加・変更の操作手順

1. §5 でジャッジ（逆方向含む）  
2. `data/tool-next-path.json` を更新  
3. **`npm run sync:tool-next-path`** — from ページへ `data-sg-next-*` + インライン導線を反映 · **非 from から削除**  
4. `npm run validate:hub-ia`  
5. 本番 smoke: from ページにインライン Next · DONE 後にフロート（任意）  

憲法・Hub IA を変えない。回遊 KPI のために増やさない。
