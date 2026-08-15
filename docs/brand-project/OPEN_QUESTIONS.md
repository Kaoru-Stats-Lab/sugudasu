# SUGUDASU Brand Open Questions

**役割:** ブランド設計でまだ答えが出ていないテーマだけを管理する  
**更新:** 2026-08-15

解決したテーマは結論を
[`DECISION_LOG.md`](DECISION_LOG.md) またはADRへ移し、
このファイルから削除する。

## Q-00 — キャッチコピー（英語タグライン）— 一部解決

**関連Phase:** ブランド露出 · LP · OGP  
**候補・評価:** [`../brand/CATCHPHRASE_CANDIDATES.md`](../brand/CATCHPHRASE_CANDIDATES.md)  
**解決済み:** L0 = **Open. Use. Close.** · L1 = **開く。使う。閉じる。** · Hub 併記（[`DECISION_LOG`](DECISION_LOG.md) 2026-08-13）

- ~~ヒーロー第1を Open. Use. Close. にするか~~ → **確定**
- ~~日本語 L1~~ → **開く。使う。閉じる。確定 · Hub 併記**
- 「No Login. No Upload.」系は L2 サブ降格でよいか
- ~~英コアを本番 Hub に併記するか~~ → **併記済**

---

## Q-01 — Bookmark戦略

**関連Phase:** 2.5 / 4 / 6

- どの瞬間にブックマークを提案すると、作業完了を邪魔しないか
- Hubと個別Productのどちらを保存先として推奨するか
- ブックマーク誘導を囲い込みにしない評価基準は何か

## Q-02 — Habit Formation

**関連Phase:** 2.5 / 6

**閉じた線（CASE-2026-009）:** 「困ったらまず SUGUDASU」という習慣化は新規ツールの採用理由にしない。再訪は次の実務。計測・用語は未解決のまま。

- 「毎日使わせる習慣」ではなく「次の都度実務で思い出す」をどう測るか
- 通知やメールを使わず再訪理由をどう作るか
- Habit Formationという用語がブランド人格に適切か

## Q-03 — Presentの保守境界 — **解決 2026-07-24**

`present` は Legacy ではなく **Reject**（CASE-2026-006）。Hub/ナビ/カタログ除外 · URL はアーカイブ案内のみ · 新機能停止。

→ [`DECISION_LOG.md`](DECISION_LOG.md) · [`../legal/CASE_LAW.md`](../legal/CASE_LAW.md#case-2026-006)

## Q-04 — Hub IAのブランド監査

**関連Phase:** 1 / 5

- 現在のDiscovery設計は「静かに手を貸す」人格と整合するか
- 人気・新着・バッジはSUGUDASU自身を前へ出していないか
- 検索、カテゴリ、一覧の優先順位は36ツール規模で適切か

既存Hub IAの実装判断を再審議するのではなく、ブランド適合だけを監査する。

## Q-05 — Category Design — 一部解決（2026-08-13）

**関連Phase:** 2 / 5  
**議事:** [`../notes/HUB_CATEGORY_BOARD_MINUTES_20260813.md`](../notes/HUB_CATEGORY_BOARD_MINUTES_20260813.md)

**解決済み**

- 厳密一軸MECEを目指さない（実用分類 · 8固定 Keep）
- 欠陥の本丸はチップ短縮の不誠実さ → **ラベル是正は可決**
- ツール大量の categoryId 付け替え · カテゴリ増 · マルチタグ → **Defer / 否決**

**残**

- `chipLabels` 実装後の実機感（文字量 · Mobile）
- ops 中身の個別付け替え提案（ある場合のみ再議）

## Q-06 — Chromeタブ戦略

**関連Phase:** 2.5

- タブを開いたまま使う行動は実在するか
- タイトル、favicon、タブ復帰時の状態に改善余地があるか
- 常駐を促すことが「必要な瞬間だけ使う」と矛盾しないか

## Q-07 — 「検索より先に開く」仮説

**関連Phase:** 2.5

**閉じた線（CASE-2026-009）:** Direct／ブックマークは再訪インフラとして Keep。それをカタログ拡大の理由にはしない。経路の実測は未解決。

- SUGUDASUを検索エンジンより先に開く場面は何か
- Hub、ブックマーク、履歴、社内Wikiのどれが主経路か
- この仮説をどの指標と期間で検証するか

## Q-08 — Phase 1以降の成果物配置

**関連Phase:** 1〜6

- Report / Guide / Blueprint / Strategyをどのフォルダへ置くか
- 完成成果物と調査メモをどう分離するか
- PhaseごとにADRが必要となる判断基準は何か

## Q-09 — 画像の提出容量適合（一括リサイズ HOW）

**関連Phase:** 製品 HOW · CASE-2026-011 PARK  
**閉じた線:** 新規「画像圧縮」HTML は今作らない。Hub Value で GO しない。リサイズ→赤入れ一括注入 Reject。赤入れ画像キューは annotate PARK · **公開 roadmap 載せない**（2026-08-15）。実装ゲートは **① 2026-11-15 HOW レビュー → ② その後 Hub/GSC**（Hub/GSC 単独で 11/15 前に解禁しない）。  
**ログ:** [`../legal/logs/2026-08-15_image_compress_submit_pain.md`](../legal/logs/2026-08-15_image_compress_submit_pain.md)  
**草案:** [`../notes/IMAGE_BATCH_RESIZE_SUBMIT_HOW_20261115.md`](../notes/IMAGE_BATCH_RESIZE_SUBMIT_HOW_20261115.md) §6 · §11.6

- 既存画像出口（`webp-to-jpg` 等）に「メール添付 / フォーム 2MB」プリセットを足すか
- Wasm（jSquash）をいつ vendor 化するか、Canvas `toBlob` だけで足りるか
- 11/15 HOW レビュー後、Hub/GSC（縮小・圧縮・2MB）をどう読むか
- 11/15 GO 後、提出リサイズを `considering` に載せるか（annotate キューは別）

## Q-10 — 仮置き Crop（製品外プロトタイプ）

**関連Phase:** clip-stash · CASE-2026-011 着手不可  
**閉じた線:** 仮置き製品本体・registry には入れない。会議室だけでは再開しない。  
**ラボ:** [`../products/clip-stash/lab/crop-handoff-prototype.html`](../products/clip-stash/lab/crop-handoff-prototype.html)

- 矩形選択は「編集」に見えるか、「持っていく素材を絞る」に見えるか（ユーザー実測）
- 結果を新カード複製にするか、クリップボードへ出すだけにするか
