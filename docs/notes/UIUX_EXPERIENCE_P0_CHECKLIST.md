# UIUX Experience P0 実行チェックリスト

**更新:** 2026-07-30  
**入力:** `UIUX_EXPERIENCE_CONSTITUTION_AGENDA.md` §4 決議表  
**実装契約:** `UIUX_EXPERIENCE_IMPLEMENTATION_CONTRACT.md`

---

## P0-1 コピー成功導線の統一

- [x] 全コピー導線を `sg-copy-feedback` に寄せる（残 raw は個別フォロー）
- [x] 成功文言を `コピーしました` に統一
- [x] `alert()` 成功通知を削除（`tools/` · `assets/` 実務面）
- [x] 実行コードの `Copied!` 文字列を削除
- [x] 主CTA色は成功で恒常変更しない（Action/Feedback 分離）

## P0-2 内部緑CTAの剥奪

- [x] `bg-emerald-600` の使用箇所を監査
- [x] 印刷/DL/Bake/ZIP 以外の緑CTAを L2 青またはセカンダリへ変更
- [x] 非送信バッジ（説明用途）の緑は維持

## P0-3 Copy-First 文言の憲法整合

- [x] 「Copy-First = 自動送信しない責任分界」に文言統一（statements · 実装契約 · 主要CTA）
- [x] チャネル名付き共有CTAが残っていないことを確認（annotate / fair-draw / warikan / group-split 形式ラベル）
- [x] 仕様文書の「コピー主CTA化」誤読を除去（Agenda/契約で切り分け済み）· `Copied!` 仕様残骸掃除（NORMALIZE / TIMELINE / STAMP）

**意図的に残した層:** disclosure · FAQ の貼付先例（商標注記付き）。SEO/長い FAQ のチャネル語はリード文議題（Agenda §3 #6）に合流し、一括 rewrite しない。

## P0-4 見た目だけDnD可の解消

- [x] `.sg-file-drop` を使う画面で drop 実装が有効か確認（annotate · table-conv · watermark · image-trim · clipboard-trim · clip-stash · pdf-fill · pdf-images）
- [x] drop 未実装なら見た目を通常入力へ戻す — **該当なし**（見た目だけ詐欺 0）
- [x] file input クリック代替を必ず同居
- [x] custom file drop（webp-to-jpg · video-frame · fair-draw CSV）も drop+input 同居を確認

**対象外:** invoice 行DnD · slot-board 枠DnD（ファイル入口ではない）

---

## 新規ツール公開時のゲート（追加）

- [ ] `UIUX_DECISION_BLOCK` を埋める
- [ ] `completion_model` と `product_voice` から `cta_order` を確定
- [ ] `continue_later` 判定（`CONTINUE_LATER_SPEC.md` §8.1）を記録
- [ ] Playbook A1–A13 をすべて YES/NA

---

## 完了報告テンプレート

```text
[UIUX_P0_REPORT]
scope:
tools:
P0-1: done|na
P0-2: done|na
P0-3: done|na
P0-4: done|na
regression_risk:
followups:
```
