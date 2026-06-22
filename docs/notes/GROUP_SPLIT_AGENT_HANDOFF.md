# group-split — Agent 引き継ぎ（2026-06-20）

**リポジトリ:** `C:\asl_dev\sugudasu`（**asl-dashboard ではない**）  
**本番:** https://sugudasu.com/group-split  
**直近リモート:** `72604c5` — **ローカル commit 済 · push は提督保留**  
**会話正本:** Cursor transcript `105ea7e4-d680-4c92-84ed-35a7ca827df8`（asl-dashboard 側）

---

## このセッションで完了したこと

| 項目 | 状態 | 主要ファイル |
|------|------|--------------|
| M02 Resilience | 実装済 **v1.2.2** | タップ除外 · セッション JSON |
| 各組必須・緩和モード | 実装済 **v1.2.3** | `relaxRequiredEach` · `unmetRequired` |
| PC→会場スマホパネル | 実装済 **v1.2.4** | 常時表示 · Google Keep 等同期メモ手順 |
| 復元・欠席手順書 | 済 | `GROUP_SPLIT_REPRODUCE_AND_ABSENCE.md` |
| 提督実体験ドキュメント | 済 | `GROUP_SPLIT_SWITCHER_PREP.md` · SPEC §1-2 |
| M13 起票 | Backlog P1 | スイッチャー対応表 O8（**未実装**） |
| Zenn 下書き #14 | 済 | `ZENN_ARTICLE_14_DRAFT.md`（レビュー・スクショ待ち） |

**テスト:** `npm run test:group-split` — 全 pass（22×23緩和 · セッション往復 · タップ除外相当）

---

## P0 リリース整合（2026-06-20 更新）

| # | 項目 | 状態 |
|---|------|------|
| 1 | `npm run build:pages` → `dist/` | **済** v1.2.4 |
| 2 | 自動スモーク（テスト + ソルバ） | **済** |
| 2b | **ブラウザ手動スモーク** | **提督確認待ち**（下記チェックリスト） |
| 3 | changelog / tool-registry 整合 | **済** 1.2.4 |
| 4 | commit | **済**（ローカル） |
| 4b | **push** | **保留**（提督指示まで） |
| — | deploy | 未依頼 |

### 提督ブラウザ手動スモーク（`localhost:8080/group-split.html`）

- [x] **緩和モード** — 営業サポート22名+他 · 23組 · 各組必須 → 警告 → 緩和 → 未充足1組バッジ（提督確認 2026-06-20）
- [ ] **v1.2.4 同期** — 実行 →「JSONをコピー（同期メモへ）」→ 貼り付け欄へ → 読み込んで再実行 → 名簿指紋一致
- [ ] **欠席タップ** — 名前タップ → 再構成トースト → Slack 再コピー

**プレビュー:** `cd dist && python -m http.server 8080`

---

## 次 Agent に託すタスク（優先順）

### P1 — 製品

1. **M13 スイッチャー対応表（O8）** — Backlog §1-11 · `GROUP_SPLIT_SWITCHER_PREP.md` §4  
2. **Zenn #14 公開準備** — スクショ · 提督レビュー · UTM `article_14_group_split`

### P1 — 別ツール（Backlog §1-12）

3. **M01 timeline.html** — 未着手

### P2 · HOLD

4. M03 warikan PayPay スパイク  
5. 制約 Excel インポート  
6. インタビュー5問

---

## コード地図

| 用途 | ファイル |
|------|----------|
| 実行エントリ | `assets/group-split.js` · `runGroupSplit` |
| ソルバ | `assets/group-split-constraints.js` |
| UI | `tools/group-split.html` |
| テスト | `scripts/group-split.test.mjs` |
| 復元・欠席 SSOT | `docs/notes/GROUP_SPLIT_REPRODUCE_AND_ABSENCE.md` |

**バージョン定数:** `TOOL_VERSION = '1.2.4'` in `group-split.js`

---

## 提督への確認事項

- [x] v1.2.2〜1.2.4 — **1 commit** でローカル保存済
- [ ] **push / deploy** のタイミング
- [ ] ブラウザ手動スモーク（上記チェックリスト）
- [ ] Zenn #14 タイトル最終
- [ ] M13 を次スプリントに入れるか

---

## 新セッション開始時に読むファイル（順）

1. **本ファイル**
2. `docs/notes/GROUP_SPLIT_REPRODUCE_AND_ABSENCE.md`
3. `docs/BACKLOG.md` §1-11
4. `docs/notes/GROUP_SPLIT_TOOL_SPEC.md` §1-2
