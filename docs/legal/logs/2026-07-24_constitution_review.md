# Constitution Review Log — 2026-07-24

**種別:** 法体系新設 · 義解移管 · 初判例セット  
**立法者指示:** 憲法を頻繁に改正せず、Commentary · Case Law で運用する

---

## 1. 立法事実

- 条文だけでは判断できない · 条文同士が衝突する · 新ユースケースが増えた
- **F2 非送信事件:** 字面「一切送るな」 vs 立法意思「業務データの非送信・非保存」
- **Hub アンケート事件:** 「匿名だから OK」「改善だから OK」 vs Persona · 提案しすぎない
- PureRef / Clip Stash / Annotate で「カテゴリ一式の期待値」問題が反復

## 2. 解釈変更

| 項目 | 変更前 | 変更後 |
|------|--------|--------|
| 義解の置き場 | `docs/brand/CONSTITUTIONAL_INTERPRETATION.md` 単体 | **`docs/legal/CONSTITUTION_COMMENTARY.md` が正本** · brand 側はポインタ |
| 憲法判断の置き場 | 製品 decisions · ADR · Phase 仕様に散在 | **`docs/legal/CASE_LAW.md`** に Judicial Decision を集約 |
| ADR の範囲 | 憲法判決も含みがち | **設計選択（HOW）のみ** · 憲法判断は Case Law |
| F2 | 字面で一切通信禁止と読まれやすい | Commentary C-05 で Intent 固定 |
| 解釈手順 | 未文書化 | `LEGAL_INTERPRETATION_GUIDE.md` · F1〜F7 単独判定禁止 |

## 3. 追加判例

| ID | 事件 | 判決 |
|----|------|------|
| CASE-2026-001 | PureRef 期待値 | Reject（PureRef化） |
| CASE-2026-002 | Clip Stash 管理機能 | Reject（管理）· GO（戻すのみ） |
| CASE-2026-003 | Annotate 視覚言語 | テキスト Reject · 矢印 HOLD · コピー GO |
| CASE-2026-004 | Hub アンケート | 条件付き合憲（H-UI-07） |
| CASE-2026-005 | F2 字面解釈 | 義解確定（通信全面禁止ではない） |

## 4. 採用理由

- 憲法改正を最後の手段にし、立法意思と判例を蓄積する方が一貫する
- Agent が条文字面だけで仕様変更することを Guard Rail で防ぐ
- アンケート事件は「義解が無いと立法意思が再現できない」ことの証明判例

## 5. 作成・更新ファイル

- `docs/legal/README.md`
- `docs/legal/CONSTITUTION_COMMENTARY.md`
- `docs/legal/CASE_LAW.md`
- `docs/legal/LEGAL_INTERPRETATION_GUIDE.md`
- `docs/legal/logs/2026-07-24_constitution_review.md`（本ファイル）
- `docs/brand/CONSTITUTIONAL_INTERPRETATION.md` → ポインタ化
- Agent / Brand Project / ADR テンプレの相互リンク

## 6. 今後

- 新論点はまず判例候補として本 logs に記録
- 製品 `decisions.md` の憲法判決は Case ID へリンク付けを進める
- 憲法本文の改正は Interpretation Guide §6 の条件を満たすまで行わない
