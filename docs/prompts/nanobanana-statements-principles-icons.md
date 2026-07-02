# NanoBanana — SUGUDASU 7 Principles Icons

**用途:** `statements.html` · 7つの設計原則  
**後処理:** `node scripts/crop-principle-icons.mjs` — 中心72% crop · trim · **256×256** · WM 除去済み  
**表示:** 128px / 256px @2x · 透過 PNG または `#F1F5F9` 背景

---

## 共通（各プロンプト末尾に含め済み · 単体コピペ可）

- Canvas **1024×1024**
- **主題は中央 50–55% 以内** — 四辺 **22% 以上は空**（WM crop 用）
- Flat · minimal · 1 accent + slate line art
- **No text · no letters · no numbers · no logo · no brand name**

---

## 1 — 登録不要（No signup）

**採用:** `principle-01-signup.png` — **Prompt 1-B · 候補2**（browser + play · 2026-07-02）

**比較メモ（ドア系4案）**

| 案 | 問題 |
|----|------|
| 現行 `principle-01-signup` | フラットで P2–P7 と画風一致。**ただし「ログイン/Sign in」汎用アイコンと同型** — 「登録不要」の否定が伝わらない |
| 添付・透視 + 矢印左 | 入る方向は明確だが **3D 透視** でセットから浮く |
| 添付・透視 + 矢印右 | **Enter/Login CTA** に最も近く、P1 として最悪 |

**推奨:** ドアをやめ、**Instant start（Play / lightning）** または **No signup forms（× on login card）** で再生成。下記 Prompt **1-B（第一候補）**。

---

### Prompt 1-A — Refined flat door（ドアを続ける場合 · セット整合優先）

```
Flat minimal app icon for a Japanese business productivity tool.

Subject: a wide-open gate or doorway seen from the front (no 3D perspective, no vanishing point). The door is already open — no lock, no padlock, no keyhole, no keypad, no ID card, no user profile circle, no @ symbol, no credit card, no "sign in" form rectangle.

A single small emerald green arrow (#059669) points inward through the opening — meaning "walk in freely", NOT "log in". Do NOT use a generic login/sign-in door icon.

Style: clean vector-like illustration, 2px rounded strokes, emerald accent on the arrow only, main lines dark slate (#334155). Match the flat line-art weight of a modern SaaS icon set (Notion-like spacing, not sticker emoji).

Composition: icon occupies only the center 50% of the square canvas. Leave at least 25% empty margin on all four sides for watermark crop. Plain very light gray background (#F1F5F9).

No text, no letters, no numbers, no watermark area text, no logo, no brand name, no emoji, no 3D perspective, no photorealistic, no gradient button.
```

---

### Prompt 1-B — Instant start（★推奨 · ログイン誤読を避ける）

```
Flat minimal app icon for a Japanese business productivity tool.

Subject: instant start without registration — a simple browser window outline (minimal top bar with three small dots) containing a large emerald green play triangle (#059669) or a single lightning bolt. Conveys "open URL and use immediately in 3 minutes". No login form, no password field, no user avatar, no OAuth buttons, no credit card.

Style: clean vector-like illustration, 2px rounded strokes, emerald accent on play/lightning only, main lines dark slate (#334155). Same flat icon family as browser-with-shield and clipboard icons.

Composition: icon occupies only the center 50% of the square canvas. Leave at least 25% empty margin on all four sides for watermark crop. Plain very light gray background (#F1F5F9).

No text, no letters, no numbers, no watermark area text, no logo, no brand name, no emoji, no 3D, no photorealistic, no open door, no padlock.
```

---

### Prompt 1-C — No signup forms（否定を明示 · やや情報量多め）

```
Flat minimal app icon for a Japanese business productivity tool.

Subject: "no registration required" — a small simplified login/signup card outline (rectangle with two empty lines suggesting a form) with a bold emerald green X mark (#059669) over it, OR a prohibited slash through the form. Next to it or behind it, a simple cursor pointer or checkmark showing "skip and go". No angry red warning color — calm professional tone.

Style: clean vector-like illustration, 2px rounded strokes, emerald accent on the X or check only, main lines dark slate (#334155). Flat front view only, no 3D.

Composition: icon occupies only the center 50% of the square canvas. Leave at least 25% empty margin on all four sides for watermark crop. Plain very light gray background (#F1F5F9).

No text, no letters, no numbers, no watermark area text, no logo, no brand name, no emoji, no photorealistic, no open door.
```

---

### Legacy prompt（初回 · ドア — P1 として非推奨）

```
Flat minimal app icon for a Japanese business productivity tool.

Subject: an open door with a small welcoming arrow pointing inward. No key, no padlock, no credit card, no login form, no user avatar.

Style: clean vector-like illustration, 2px rounded strokes, soft emerald green accent (#059669) on one small detail only, main lines dark slate (#334155). Single icon centered.

Composition: icon occupies only the center 50% of the square canvas. Leave at least 22% empty margin on all four sides (top bottom left right) for post-crop. Plain very light gray background (#F1F5F9).

No text, no letters, no numbers, no watermark area text, no logo, no brand name, no emoji, no 3D, no photorealistic, no gradient CTA button.
```

---

## 2 — ブラウザ内処理（Client-side / local processing）

```
Flat minimal app icon for a Japanese business productivity tool.

Subject: a browser window frame with a shield symbol inside the content area. Data stays inside the browser — no upward arrow to a cloud server, no database cylinder, no upload icon.

Style: clean vector-like illustration, 2px rounded strokes, soft blue accent (#2563EB) on the shield only, main lines dark slate (#334155). Single icon centered.

Composition: icon occupies only the center 50% of the square canvas. Leave at least 22% empty margin on all four sides for post-crop. Plain very light gray background (#F1F5F9).

No text, no letters, no numbers, no watermark area text, no logo, no brand name, no emoji, no 3D, no photorealistic.
```

---

## 3 — 静的配信（Static hosting）

```
Flat minimal app icon for a Japanese business productivity tool.

Subject: a lightweight cloud above two simple static web page documents (HTML sheets). Convey static delivery — no heavy server rack, no spinning gear cluster, no WebSocket waves, no always-on dashboard.

Style: clean vector-like illustration, 2px rounded strokes, muted slate gray accent (#64748B) on the cloud only, main lines dark slate (#334155). Single icon centered.

Composition: icon occupies only the center 50% of the square canvas. Leave at least 22% empty margin on all four sides for post-crop. Plain very light gray background (#F1F5F9).

No text, no letters, no numbers, no watermark area text, no logo, no brand name, no emoji, no 3D, no photorealistic.
```

---

## 4 — 実務3分（3-minute task · one URL one job）

```
Flat minimal app icon for a Japanese business productivity tool.

Subject: a simple stopwatch or timer paired with a single wrench or single tool — meaning one quick job, one purpose. No complex settings panel, no org chart, no multi-step wizard.

Style: clean vector-like illustration, 2px rounded strokes, soft amber accent (#D97706) on the timer hand or one highlight only, main lines dark slate (#334155). Single icon centered.

Composition: icon occupies only the center 50% of the square canvas. Leave at least 22% empty margin on all four sides for post-crop. Plain very light gray background (#F1F5F9).

No text, no letters, no numbers, no watermark area text, no logo, no brand name, no emoji, no 3D, no photorealistic.
```

---

## 5 — Copy-first（Copy to Slack / Excel / PDF）

```
Flat minimal app icon for a Japanese business productivity tool.

Subject: a clipboard with a checkmark, and three small outward arrows suggesting copy to spreadsheet, chat, and document file. Emphasize export and paste workflow, not a dashboard display.

Style: clean vector-like illustration, 2px rounded strokes, soft blue accent (#2563EB) on the clipboard clip or one arrow only, main lines dark slate (#334155). Single icon centered.

Composition: icon occupies only the center 50% of the square canvas. Leave at least 22% empty margin on all four sides for post-crop. Plain very light gray background (#F1F5F9).

No text, no letters, no numbers, no watermark area text, no logo, no brand name, no emoji, no 3D, no photorealistic.
```

---

## 6 — 帳票と証跡（Print · PDF · audit trail）

```
Flat minimal app icon for a Japanese business productivity tool.

Subject: a document page with a folded corner (PDF/print sheet) and a small printer corner or print symbol. Convey paper and file artifacts, audit trail — not a generic trophy.

Style: clean vector-like illustration, 2px rounded strokes, soft emerald green accent (#059669) on the document corner or print detail only, main lines dark slate (#334155). Single icon centered.

Composition: icon occupies only the center 50% of the square canvas. Leave at least 22% empty margin on all four sides for post-crop. Plain very light gray background (#F1F5F9).

No text, no letters, no numbers, no watermark area text, no logo, no brand name, no emoji, no 3D, no photorealistic.
```

---

## 7 — 過剰な断定しない（No overclaim · disclaimer tone）

```
Flat minimal app icon for a Japanese business productivity tool.

Subject: balanced scales of justice with a small subtle question mark above — thoughtful caution, not a red prohibition sign, not a green checkmark stamp, not "approved" legal seal.

Style: clean vector-like illustration, 2px rounded strokes, cool slate accent (#475569) on the scale pans only, main lines dark slate (#334155). Single icon centered.

Composition: icon occupies only the center 50% of the square canvas. Leave at least 22% empty margin on all four sides for post-crop. Plain very light gray background (#F1F5F9).

No text, no letters, no numbers, no watermark area text, no logo, no brand name, no emoji, no 3D, no photorealistic.
```

---

## 再生成用 · 透過寄り（気に入った1枚だけ）

背景行を差し替え:

```
Background: transparent or pure white, no shadow, no floor reflection.
```

---

## Crop 手順（WM 除去）

1. 1024×1024 のまま保存
2. 中心 **768×768** に crop（上下左右各 128px 削除）
3. 必要なら **512×512** に縮小
4. `assets/icons/principles/principle-01-signup.png` … `principle-07-no-overclaim.png`

---

## 整合

- 色 SSOT: `docs/notes/DESIGN_NOTION_SUGUDASU_ADAPT.md`
- 掲載先: `tools/statements.html` §7つの設計原則
