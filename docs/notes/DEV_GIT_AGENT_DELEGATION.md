# Git push · Agent 委任（SUGUDASU）

**正本（全文）:** [`../machine-dashboard/docs/notes/dev-git-multi-account.md`](../../machine-dashboard/docs/notes/dev-git-multi-account.md) § Agent 委任

## このワークスペース（SUGUDASU Agent）

- **担当:** `C:\asl_dev\sugudasu` → `Kaoru-Stats-Lab/sugudasu` の commit/push のみ
- **禁止:** `machine-dashboard` への push（Cozy762 アカウント · 別 Agent）

fleet 側の変更を push したい場合は **machine-dashboard ワークスペース**の Agent に依頼する。

---

## PowerShell での Commit & Push 手順（Agent 実装メモ）

PowerShell では bash の `<<'EOF'` heredoc が使えないため、**コミットメッセージをファイル経由で渡す**。

```powershell
# 1. DEPLOY_LOG に approved エントリを追記（ゲート確認）

# 2. 対象ファイルをステージ
cd C:\asl_dev\sugudasu
git add <ファイル1> <ファイル2> ...

# 3. コミットメッセージをファイルへ書き出し（Write ツールで作成）
#    パス: .git\COMMIT_MSG_TMP
#    内容例:
#      fix(tool): 件名
#
#      - 変更点1
#      - 変更点2

# 4. ファイルを参照してコミット
git commit -F .git/COMMIT_MSG_TMP

# 5. push（SSH カスタムホスト経由）
git push origin main
```

### 注意

- `git commit -m "..."` に日本語や記号を含めると PowerShell がパースエラーを起こす → **必ず `-F` 方式**を使う。
- `.git\COMMIT_MSG_TMP` はコミット後も残るが git 管理外（`.gitignore` 不要）。
- SSH タイムアウトになった場合は `ssh -T git@github.com-kaoru` で疎通を確認してから再度 push する。
