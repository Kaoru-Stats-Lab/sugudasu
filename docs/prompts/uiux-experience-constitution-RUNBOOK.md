# Experience Constitution — マルチAI リサーチ RUNBOOK

**更新:** 2026-07-29  
**目的:** 役員会の前に、集合知（総意 + 尖った意見）と低学習コストの類推を集める。**最終決定は役員会のみ。**  
**使わない自由:** 下表の AI は全部必須ではない。空欄のまま進めてよい。

---

## 0. パイプライン

```text
BRIEF（共通）
  → 各AIへ ROLE付き COPYPASTE（並列可）
  → 生出力を docs/notes/uiux-experience-research/raw-*.md に保存
  → Cursor/提督が SYNTHESIS に総意 / 尖り / 却下を整理
  → 役員会（AGENDA）で Keep/Change/Defer
  → DESIGN / 必要なら Case Law へ昇格（実装は後）
```

**禁止:** AI出力をそのまま憲法・DESIGNに貼る · リサーチ中に全ツールCTA一括実装

---

## 1. AI × ROLE × リサーチ目的（意図的にずらす）

| AI | 使う? | ROLE | リサーチ目的（このAIだけの仕事） | COPYPASTE |
|----|-------|------|----------------------------------|-----------|
| **Claude** | 任意 | プロダクト体験アーキテクト | **完了モデル**と Copy-First 再定義 · 「意図的に揃えない」リスト | [`uiux-experience-claude-COPYPASTE.md`](uiux-experience-claude-COPYPASTE.md) |
| **ChatGPT** | 任意 | HCI / デザインシステム実務家 | **色の意味表**（恒常 vs 一時）· CTA 文法 · 業界デフォルトと反論 | [`uiux-experience-chatgpt-COPYPASTE.md`](uiux-experience-chatgpt-COPYPASTE.md) |
| **Gemini** | 任意 | パターン司書 | **低学習コスト類推**（Notion/Stripe/Google/iOS · **TVリモコン · ゲームパッド**）を完了動詞に写像 | [`uiux-experience-gemini-COPYPASTE.md`](uiux-experience-gemini-COPYPASTE.md) |
| **Grok** | 任意 | 反・ジェネリックUX評論 | emerald「成功」・Copied劇場・黒/青混在を **刺す**。削る提案 | [`uiux-experience-grok-COPYPASTE.md`](uiux-experience-grok-COPYPASTE.md) |
| **Perplexity** | 任意 | 出典付き調査員 | 実プロダクト・HIG/Material/NN/g 等を **URL付き**で裏取り（総意の根拠） | [`uiux-experience-perplexity-COPYPASTE.md`](uiux-experience-perplexity-COPYPASTE.md) |
| **Cursor** | 任意 | リポジトリ監査 | マトリクス事実の更新のみ。意見は出さない（依頼時のみ） | （本リポ Agent） |

同じ質問を全AIに投げて「多数決」しない。**役割が違うので答えの形が違うのが正常。**

---

## 2. 手順（提督 / Agent）

1. [`uiux-experience-constitution-BRIEF.md`](uiux-experience-constitution-BRIEF.md) を読む（必要なら要約して貼る）
2. 使う AI だけ COPYPASTE を実行（並列推奨）
3. 出力を `docs/notes/uiux-experience-research/raw-{ai}-YYYYMMDD.md` に保存
4. [`../notes/uiux-experience-research/SYNTHESIS.md`](../notes/uiux-experience-research/SYNTHESIS.md) を埋める（テンプレあり）
5. 役員会は [`../notes/UIUX_EXPERIENCE_CONSTITUTION_AGENDA.md`](../notes/UIUX_EXPERIENCE_CONSTITUTION_AGENDA.md) の決議欄へ

---

## 3. 合成のルール（集合知の腐り方を防ぐ）

| 採る | 採らない |
|------|----------|
| 2つ以上のAIが独立に同じ提案 → **総意候補** | 「みんなそう言ってるから」だけで憲法化 |
| 1AIだけの尖った提案 → **少数意見**として残す（却下も明示） | 尖りを消して平均的な中庸だけ残す |
| 物理メタファーが完了動詞と対応するもの | 学習コスト高いニッチUIの礼賛 |
| SUGUDASU 制約内の提案 | ログイン必須・通知・クラウド保存前提 |

---

## 4. 成果物チェックリスト

- [ ] raw が1つ以上ある（ゼロでも役員会は可 · その場合はリポジトリ監査のみ）
- [ ] SYNTHESIS に「総意候補 / 尖り / 却下」の3欄
- [ ] AGENDA 決議は **人間**が書いた（AIの文章のコピペ決定禁止）
