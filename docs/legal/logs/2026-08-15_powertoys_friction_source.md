# PowerToys 摩擦監査 — 原料（正本ではない）

**役割:** リポジトリ直下に置かれた戦略監査報告書の整形原文。判決ではない。  
**判決:** [CASE-2026-011](../CASE_LAW.md#case-2026-011)  
**レビュー:** [`2026-08-15_powertoys_friction.md`](./2026-08-15_powertoys_friction.md)  
**由来:** `Microsoft PowerToysの摩擦構造分析に基づくSUGUDASUプロダクト戦略監査報告書 .md` を 2026-08-15 に移管。運用は判例とレビューログを見る。

報告書は「即時実装」を含む。レビュー側で CASE-2026-010 と突合し、Adapt 常時ボタンは **Reject**、Crop・テキスト全画面 Peek は **着手不可**、セッション破棄は **Reject**。Peek / Handoff は既に出荷済。第二読で HOLD≠着手可 に揃えた。

---

## 1. Executive Verdict

PowerToys が解いてきた対象は OS 機能の不足そのものではなく、アプリケーション境界の微小な摩擦である。解消手段は OS 常駐・グローバルキーフック・オーバーレイというネイティブ特権である。

SUGUDASU（登録不要・ブラウザ完結・静的配信・ローカル処理）でネイティブ特権の操作体系を模倣すると設計が破綻する。

### 8原則

1. **摩擦の局在性:** PowerToys は OS↔アプリ。SUGUDASU は業務データ↔ブラウザ。ウィンドウ管理・システム設定の代替は管轄外。
2. **設定・常駐・ショートカットの排除:** 開いた瞬間の視覚アフォーダンスのみ。
3. **仮置きは税関（Transit Handoff）:** 編集ワークベンチでも保管庫でもない。異種データを整流して外へ出す乗降プラットフォーム。
4. **形式変換は決定論パーサー:** Advanced Paste の JTBD は価値が高い。AI プロンプトやモーダル設定は介さない。仮置き / Normalize へ透過吸収。
5. **汎用 OCR の棄却:** 誤認識が 1% でも全件目視校正という別摩擦になる。日本帳票・縦書き・混在文字・表構造では WASM-OCR は品質基準を満たさない。
6. **一括処理は新規 HTML なし:** PowerRename / Image Resizer は既存画像・テキストの入力ハンドラへ「一括ドロップ・即時変換」。
7. **色・寸法は持ち込んだ画像の局所インスペクタのみ:** 画面全体のピクセル抽出はサンドボックス上不可能に近い。
8. **新規 HTML 増設ゼロ:** 有効 JTBD は仮置き・Normalize・既存テキスト/画像ツールの入口と出口で足りる。

報告書の「Text Inspector」は registry に無い。近い既存は `normalize` / `clipboard-trim` / `json-view`。

---

## 2. PowerToys → 摩擦パターン

| PowerToys | 表面 | 本当の JTBD | 摩擦 | SUGUDASU |
|-----------|------|-------------|------|----------|
| Advanced Paste | AI / 形式指定ペースト | コピー元と貼付先の構造・記法・改行をゼロクリックで揃えたい | 形式不一致 | INTEGRATE: 仮置き / Normalize の自動判定・ワンクリック出力 |
| Always On Top | 最前面固定 | 参照と入力の視線移動をなくしたい | 視覚的参照の中断 | REJECT: OS責務 |
| Awake | スリープ抑止 | 長時間バッチや閲覧中に環境を維持したい | 状態維持 | REJECT: OS責務。3分 JTBD に反する |
| Color Picker | 画面の色コード | 見えている色をドキュメントで再現したい | 視覚属性抽出 | INTEGRATE: ドロップ画像のスポイトを既存画像ツールへ |
| Crop And Lock | 切り抜き同期表示 | 巨大画面から今必要な領域だけ手元に置きたい | 情報ノイズ隔離 | INTEGRATE: 仮置き内の矩形クロップ |
| FancyZones | グリッド整列 | 複数アプリを並べて同時視認したい | 作業領域配置 | REJECT: OS責務 |
| Explorer add-ons | 拡張プレビュー | 重いアプリを開かず内容を確認したい | 内容確認起動 | INTEGRATE: 仮置き Space プレビュー |
| Image Resizer | 右クリック一括リサイズ | 添付・アップロード用に一括で落としたい | 物理仕様適合 | INTEGRATE: 既存画像ツールの一括ドロップ |
| Peek | Space 即時プレビュー | 探しているファイルかを一瞬で弁別したい | 同一性検証遅延 | INTEGRATE: 仮置き Space |
| PowerRename | 正規表現・一括改名 | 乱れた多数の文字列に同一ルールを適用したい | 反復置換 | INTEGRATE: Normalize の実務トグル |
| PowerToys Run | ランチャー | 思考を止めずに次アクションへ直結したい | 起動・探索 | REJECT: コマンド学習は Calm UX に反する |
| Screen Ruler | ピクセル寸法 | 余白が意図通りか確かめたい | 幾何的属性 | REINTERPRET: 画像/PDF 内の局所計測 |
| Text Extractor | 画面 OCR | 選べない文字を再入力せず手に入れたい | 非テキスト障壁 | REJECT / DEFERRED |
| Workspaces | 複数アプリ一括起動 | 業務コンテキストを一瞬で整列したい | 業務文脈復元 | REJECT: 状態を持たない |
| Keyboard Manager | キー再配置 | 慣行に合わない操作を矯正したい | 身体操作不整合 | REJECT: 設定させない |
| Mouse utilities | カーソル強調 | 見失った焦点を把握したい | 焦点認知喪失 | REJECT: OS アクセシビリティ |
| ZoomIt | 画面拡大・注釈 | 相手の視線を誘導したい | 意図伝達 | REJECT: 会議補助。ドキュメント実務から逸脱 |
| File Locksmith | ハンドル追跡 | （報告書: 判定表） | OS プロセス | REJECT |
| New+ | テンプレート生成 | ファイルシステム生成 | 管理 | REJECT |
| Quick Accent | 特殊文字 | IME で足りる | 低頻度 | REJECT |
| Registry Preview | レジストリ | 対象読者外 | OS | REJECT |
| Shortcut Guide | ショートカット一覧 | 暗記前提 | 学習 | REJECT |

---

## 3. 全機能の判定（報告書原文の分類）

高: Advanced Paste · Explorer add-ons / Peek · Image Resizer  
中: Color Picker · Crop And Lock · PowerRename  
低: Screen Ruler  
破棄: Always On Top · Awake · FancyZones · File Locksmith · Keyboard Manager · Mouse utilities · New+ · PowerToys Run · Quick Accent · Registry Preview · Shortcut Guide · Text Extractor · Workspaces · ZoomIt

報告書は Advanced Paste / Crop / Peek を仮置き INTEGRATE としている。レビューは Adapt 常時ボタンと Crop を **HOLD**、Peek の画像/PDF は **Keep（出荷済）**、テキスト全画面 Peek は **HOLD**。

---

## 4. 仮置きへの集中分析（報告書）

警戒: 多機能 IDE / 仮想デスクトップ化。本質はアプリ間の不連続を解消する乗降プラットフォーム。

流れ: 外部 → ドロップ/ペースト → 非破壊の整流・検証・形式適合 → コピー/ドラッグアウト → 外部宛先。報告書は「セッション終了とともに破棄」と書く。現行実装は IndexedDB 永続。レビューは自動破棄を **Reject**。

### 4.1 5機能

1. **Peek** — Space 一時拡大。画像/PDF に加え CSV/TSV の表オーバーレイ、長文の全画面確認。インライン編集なし。Esc / キー離しで復帰。
2. **Crop** — 矩形選択を新カード複製またはクリップボードへ。表は行列の部分コピー。レイヤー・色調・リサイズ変形は排除。
3. **Extract** — OCR 棄却。URL / メール / テーブル→TSV など決定論抽出のみ。AI 要約なし。
4. **Adapt** — テーブルカードに TSV / Markdown / HTML Table コピーを常時配置。プレーンは改行保持・除去・カンマ区切り。AI ダイアログ・JSON スキーマ設定なし。
5. **Handoff** — ワンクリックコピー、ボード外 DnD、複数の結合コピー。クラウド upload / API 送信なし。

### 4.2 境界（報告書）

| 区分 | 許可 | 禁止 |
|------|------|------|
| データ処理 | 決定論フォーマット変換 | AI 要約・自然言語変換 |
| 画像 | 非破壊矩形クロップ、メタデータ非破壊コピー | フィルタ・レタッチ・不可逆自動変換 |
| テキスト | 空白・改行正規化、区切り変換 | 長文校正、構文エディタ、自動翻訳 |
| ストレージ | セッション一時保持、タブ閉じで破棄 | 永続保存、DB同期、履歴、復元 |
| 整理 | 手動 DnD 並び、空白セル維持 | フォルダ、タグ、自動分類、全文検索 |
| UI | Space プレビュー、選択、ワンクリックコピー | 多重コンテキストメニュー、設定モーダル、常時固定ツールバー |

現行との衝突はレビューログ。Handoff と画像/PDF Peek は CASE-2026-010 で出荷済。

---

## 5. OCR 特別監査

PowerToys Text Extractor は `Windows.Media.Ocr.OcrEngine` のラッパー。Microsoft 自身が「完璧ではない、素早い校正が必要」と明記。記号欠落、フォント依存、マルチモニタ DPI、言語パック依存。モデル改善は OS 層で PowerToys 管轄外。

ブラウザ WASM（Tesseract.js 等）: 日本語モデル 15–30MB 超、CPU 占有、表組み崩壊、数字誤読（8/3, 1/l, 0/O, -/ー）、縦書き不能。

結論: 90% OCR は 100% 目視校正を強制する。Calm UX と矛盾。汎用 OCR は REJECT。5MB 以下かつ表構造・縦書き対応のオンデバイスモデルが来るまで PARK。

---

## 6. 新規プロダクト候補

| 候補 | JTBD | 既存 | 新規 HTML |
|------|------|------|-----------|
| スタンドアロン形式変換 | 表/リストを MD/JSON/TSV へ | Normalize · 仮置き | 否決 |
| 一括ファイル名整形 | 規則置換・連番 | テキスト置換 | 否決 |
| 画面余白測定 | ピクセル計測 | 画像/PDF キャンバス | 否決 |
| 独立クリップボード履歴 | 過去コピーの永続管理 | 不可（権限・管理禁止） | 却下 |

新規 HTML は **0**。吸収は 2 領域（決定論アダプター、非破壊インスペクション）。

---

## 7. Reject Architecture（5類型）

1. **憲法違反型:** Always On Top · Awake · FancyZones · Mouse utilities · Keyboard Manager（OS 責務・常駐・キーフック）
2. **認知負荷型:** PowerToys Run · Command Palette · Shortcut Guide
3. **品質不達型:** OCR · Advanced Paste の外部 AI
4. **管理 UI 型:** Workspaces · New+ · 環境変数エディタ
5. **ブラウザ分断型:** 画面全体 Color Picker（EyeDropper は Chromium 偏重）

---

## 8. Meta Findings — SUGUDASU が解く摩擦

1. **形式の非互換** — Excel / Word / PPT / メール / HTML / PDF のねじれを意識せず整流する。
2. **視認と確認の中断** — 別アプリを開いて閉じるのをやめる。置いた瞬間に構造がわかる。
3. **単純反復の摩耗** — ドロップして目的のボタンを1回。正規表現ダイアログを強いない。

---

## 9. 役員会提案（報告書。実装GOではない）

### 今すぐ（0–1ヶ月）— レビューで PARK / HOLD

- 仮置き Adapt ボタン常時表示
- テキスト/表の Space 全画面
- 画像ツールの一括リサイズプリセット（`image-trim` 等の HOW。仮置き外）

### 次四半期 — HOLD / PARK

- 非破壊矩形クロップ
- Normalize 入力自動判別

### PARK

- 軽量局所 OCR（5MB 以下・表・縦書き）

### 恒久棄却

- OS 常駐・ウィンドウ管理・設定系一式
- 生成 AI プロンプト型ペースト

---

## 10. 最終問い（報告書）

新規 HTML **0**。吸収 **2 領域**（決定論フォーマット・アダプター / 非破壊クイック・インスペクション）。

「UI を 1 ミリも肥大化させない」と Adapt 常時ボタンは両立しない。レビューは後者を今すぐ足さない。
