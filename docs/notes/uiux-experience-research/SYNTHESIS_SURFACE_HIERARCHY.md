# SYNTHESIS — Surface / Visual Hierarchy（経営会議用）

**更新:** 2026-08-05  
**入力:** `raw-chatgpt-surface-20260805.md` · `raw-gemini-surface-20260805.md`  
**前提BRIEF:** `docs/prompts/uiux-surface-hierarchy-BRIEF.md`  
**最終決定:** 経営会議のみ（本ファイルは比較材料）

---

## 1. 総意（両AI一致）

| 論点 | 総意 | メモ |
|------|------|------|
| **Q3 規律レベル** | **B HOW**（DESIGN + Experience Implementation Contract） | 憲法級は非推奨。E-CONST と整合 |
| **カードUI廃止** | **今はやらない** | 一覧性・空間記憶のため残す |
| **色の一括再定義** | **今はやらない** | Surface 後段 |
| **多層 Elevation（影）** | **今はやらない** | Calm / 紙メタファーと衝突 |
| **「よく使うカードを核」（B）** | **非推奨〜習慣止まり** | 新規の発見性・LS依存の誤解 |
| **説明を常に出す（C）** | **非推奨** | Workspace 圧迫 |
| **ログイン/サーバー/AI前提UI** | **禁止** | ブランド根幹 |

---

## 2. 衝突（経営会議で決めるべき点）

### 2.1 Q1 — 「C案」の中身が違う（同名異物）

| | Gemini「C」 | ChatGPT「C」 |
|--|-------------|--------------|
| 中身 | **タスク文脈アコーディオン**＋動的絞り込み（カテゴリ固定段） | **Locate First**: 検索＋最近＋カテゴリを**同列** |
| 検索の地位 | 絞り込み手段として残るが、主核は文脈アコーディオン | 検索を捨てず、カード核にもしない「統合」 |
| 既存IA | カテゴリ強化寄り（検索ファーストからのシフト大） | 現行IAの再ラベル＋並列整理（シフト小） |

**会議の問い（言い換え）:**  
Hub の Locate 核は (1) **検索窓**のままか (2) **カテゴリ/文脈アコーディオン**か (3) **検索＋最近＋カテゴリの同列バンド**か。  
※「カードを核」は両AIとも弱い。

| 選択肢ID | 内容 | 粗い推奨シグナル |
|----------|------|------------------|
| Q1-A | 検索ファースト維持（現行IA文言どおり） | ChatGPT「維持」· Gemini「保留」 |
| Q1-G | Gemini C（タスク文脈アコーディオン＋絞り込み） | Gemini 最有力 |
| Q1-C | ChatGPT C（Locate First 同列バンド） | ChatGPT 統合 |
| Q1-Defer | 文言だけ「Locate」に変え、UIは触らない | 実装コスト最小 |

### 2.2 Q2 — 「初回Orient」は一致、種別割当が逆

両AIとも **一律「常に出す」は否** · **種別分岐は可** · **B（初回→折る）は有力**。

| 種別 | Gemini | ChatGPT |
|------|--------|---------|
| 帳票 | **常に折る（A）** | **初回だけ（B）** |
| 変換 | **初回Orient（B）** | **常に折る（A）** |
| キャンバス | **常に折る（A）** | **横に最小（別案）** |

**会議の問い:**  
Orient の主目的は「非送信・使い方の安心」か「提出ミス防止の注意」か。前者なら変換寄りに初回、後者なら帳票寄りに初回。

| 選択肢ID | 内容 |
|----------|------|
| Q2-B-flat | 全ツール初回Orient→以降折る（種別なし） |
| Q2-split-G | Gemini割当（帳票・キャンバス閉じ / 変換初回） |
| Q2-split-C | ChatGPT割当（帳票初回 / 変換閉じ / キャンバス横最小） |
| Q2-A-default | デフォルト常に折る＋「？」で開く（計測してから種別） |

### 2.3 モードマトリクス — Hub Orient / Product Locate が反対

| モード | Gemini Hub | ChatGPT Hub | Gemini Product | ChatGPT Product |
|--------|------------|-------------|----------------|-----------------|
| Orient | **任意** | **必須** | **必須** | **任意** |
| Locate | 必須 | 必須 | **任意** | **禁止** |
| Operate | **禁止** | **任意** | 必須 | 必須 |
| Confirm | **禁止** | **任意** | 必須 | 必須 |

**会議の問い:**  
Hub の Hero/約束文は Orient「必須」か（ChatGPT）、「あってもよい任意」か（Gemini）。  
Product 内の「関連ツール・Hubへ」は Locate「禁止」（完了優先）か「任意」。

---

## 3. 尖り（採用は慎重）

| 出典 | 尖り | 会議メモ |
|------|------|----------|
| Gemini | Hub を CUI のみ | Reject 寄り（発見性破壊） |
| Gemini | 説明完全廃止 | 帳票リスクと衝突しうる |
| Gemini | 1px 黒枠のみで階層 | 実験候補。Calm との両立は要試作 |
| ChatGPT | Hub 説明文ほぼ削除 | カード blurb SSOT と衝突 → 要別議論 |
| ChatGPT | 最近使っただけでHub | B案と同型 · 非推奨シグナルと一致 |
| ChatGPT | Hub戻る導線を極端に弱く | 完了優先 · 広告/回遊とは緊張 |

---

## 4. 経営会議 — Keep / Change / Defer（**2026-08-05 確定**）

| ID | 提案 | 結果 | 根拠要約 |
|----|------|------|----------|
| **S-Q3** | Surface / VH は HOW | **Keep** | E-CONST |
| **S-NO-COLOR** | 色一括は後段 | **Keep** | 両AI |
| **S-NO-CARD-KILL** | カード廃止しない | **Keep** | 一覧性 |
| **S-NO-ELEV** | 多層影で階層を作らない | **Keep** | Calm / 紙 |
| **S-Q1** | Hub Locate 核 | **Q1-A＋**（検索ファースト＋検索一段上げ · 同列C不採 · GはDefer） | IA維持 |
| **S-Q2** | Orient 提示 | **方針 split-C** · 実装は折る＋？から | 帳票初回価値 |
| **S-MODE** | モード必須表 | Hub Orient任意 · Locate必須 · Op/Conf禁止 · Product Op/Conf必須 · Locate任意 | ADR-0003 |
| **S-PILOT** | 試作範囲 | **Hub 検索のみ** | 画面証拠がHub |

正本議決: [`../UIUX_EXPERIENCE_SURFACE_BOARD_DISCUSSION.md`](../UIUX_EXPERIENCE_SURFACE_BOARD_DISCUSSION.md)

---

## 5. 次アクション（会議後）

1. 上表の未決に Keep/Change/Defer を記入  
2. Keep したものだけ `UIUX_EXPERIENCE_IMPLEMENTATION_CONTRACT.md` / `DESIGN_GUIDELINE.md` へ（憲法へ上げない）  
3. 色トークンは S-Q1/Q2/MODE の後  
4. 一括CTA・一括カード見た目変更は引き続き決議前禁止
