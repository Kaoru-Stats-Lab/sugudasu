# Git push · Agent 委任（SUGUDASU）

**正本（全文）:** [`../machine-dashboard/docs/notes/dev-git-multi-account.md`](../../machine-dashboard/docs/notes/dev-git-multi-account.md) § Agent 委任

## このワークスペース（SUGUDASU Agent）

- **担当:** `C:\asl_dev\sugudasu` → `Kaoru-Stats-Lab/sugudasu` の commit/push のみ
- **禁止:** `machine-dashboard` への push（Cozy762 アカウント · 別 Agent）

fleet 側の変更を push したい場合は **machine-dashboard ワークスペース**の Agent に依頼する。

---

## PowerShell での Commit & Push 手順（Agent 実装メモ）

PowerShell では bash の `<<'EOF'` heredoc が使えないため、**コミットメッセージをファイル経由で渡す**。

### 文字化けの原因（2026-07-30 検証）

この環境のコンソールは **CP932（Shift_JIS）**。Agent が Shell の `command` に日本語を埋め込むと、到達時点で `?` 置換や文字化けが起き、その壊れた文字列が commit message に入る。

| やり方 | 結果 |
|--------|------|
| Cursor **Write** → `.git/COMMIT_MSG_TMP` → `git commit -F` | **正しい UTF-8（推奨）** |
| `Set-Content -Encoding utf8` / `Out-File -Encoding utf8` | UTF-8 **BOM 付き** + 日本語が既に壊れていることが多い |
| `git commit -m "...日本語..."` | PowerShell がパース/再エンコードして壊す |
| bash heredoc（ユーザー規則の例） | **このシェルでは動かない** → 上記の誤った代替に落ちやすい |

ターミナル表示の `???` や文字化けは **コンソール CP932** でも起きる（ファイル自体は正しい UTF-8 のことがある）。**正否は GitHub 上の表示、または Python 等で commit メッセージのバイトを UTF-8 デコードして確認**する。

### 手順（必須）

```text
1. git add …（Shell で可。パスは ASCII）
2. Cursor Write ツールで .git/COMMIT_MSG_TMP を作成（UTF-8 · BOM なし）
3. git commit -F .git/COMMIT_MSG_TMP
4. 必要なら git push origin main
```

```powershell
# ステージと commit 本体だけ Shell で実行（メッセージ本文をここに書かない）
cd C:\asl_dev\sugudasu
git add <ファイル1> <ファイル2> ...
git commit -F .git/COMMIT_MSG_TMP
git push origin main
```

**メッセージ本文の例（Write ツールの contents）:**

```text
fix(tool): 件名

- 変更点1
- 変更点2
```

### 禁止（Token 浪費の元）

- Shell コマンド文字列に **日本語の commit message を埋め込む**
- `Set-Content` / `Out-File` / `echo` / here-string で `COMMIT_MSG_TMP` を作る
- 文字化けした commit を `amend` で直し続ける（手順を正して **新規 commit**。amend はユーザー明示時のみ）

### 注意

- `.git\COMMIT_MSG_TMP` はコミット後も残るが git 管理外（`.gitignore` 不要）。
- SSH タイムアウトになった場合は `ssh -T git@github.com-kaoru` で疎通を確認してから再度 push する。
- Agent 手順の短縮版: `.cursor/rules/learned/powershell-commit-utf8.mdc`
