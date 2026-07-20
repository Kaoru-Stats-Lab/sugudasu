\# 修正依頼: フォント変換テーブルの未割当Unicode文字による□表示バグ



\## 対象ファイル

フォント変換マップを保持しているJSON/TSファイル

（`double`, `script`, `fraktur`, `serifItalic`, `filledSquared` などの

key を持つ配列。プロジェクト内で `data/` または `assets/` 配下、

もしくは `functions/` 内の変換ロジック付近を探してください）



\## 原因

Unicodeの「Mathematical Alphanumeric Symbols」ブロックには、

歴史的経緯で意図的に未割当になっている文字（通称 "holes"）が存在する。

本来はそれぞれ専用の代替コードポイントを使うべきだが、

現在のデータは未割当のコードポイントをそのまま埋め込んでいるため、

どの端末・フォントでも表示できず □ になっている。



\## 修正内容：以下の dest 文字列を該当箇所だけ置換してください



\### 1. serifItalic（セリフ斜体）

\- 7番目の文字（h の変換先）を `𝑕`(U+1D455) → `ℎ`(U+210E) に置換



\### 2. script（筆記体）

以下11箇所を置換：

\- e → `ℯ` (U+212F)

\- g → `ℊ` (U+210A)

\- o → `ℴ` (U+2134)

\- B → `ℬ` (U+212C)

\- E → `ℰ` (U+2130)

\- F → `ℱ` (U+2131)

\- H → `ℋ` (U+210B)

\- I → `ℐ` (U+2110)

\- L → `ℒ` (U+2112)

\- M → `ℳ` (U+2133)

\- R → `ℛ` (U+211B)



\### 3. double（白抜き文字）

以下7箇所を置換：

\- C → `ℂ` (U+2102)

\- H → `ℍ` (U+210D)

\- N → `ℕ` (U+2115)

\- P → `ℙ` (U+2119)

\- Q → `ℚ` (U+211A)

\- R → `ℝ` (U+211D)

\- Z → `ℤ` (U+2124)



\### 4. fraktur（ゴシック）

以下5箇所を置換：

\- C → `ℭ` (U+212D)

\- H → `ℌ` (U+210C)

\- I → `ℑ` (U+2111)

\- R → `ℜ` (U+211C)

\- Z → `ℨ` (U+2128)



\### 5. filledSquared（黒四角囲み文字）

`dest` 文字列に空白文字が混入しており、B以降の対応が

すべて1つずつズレて破損しています。正しい62文字（a-z, A-Z, 0-9対応）

に作り直してください：

`🅰🅱🅲🅳🅴🅵🅶🅷🅸🅹🅺🅻🅼🅽🅾🅿🆀🆁🆂🆃🆄🆅🆆🆇🆈🆉🅰🅱🅲🅳🅴🅵🅶🅷🅸🅹🅺🅻🅼🅽🅾🅿🆀🆁🆂🆃🆄🆅🆆🆇🆈🆉0123456789`



\## 再発防止：バリデーションスクリプトの追加

今回のバグは「JSON内のsrcとdestの文字数（コードポイント単位）は

一致していたが、中身の一部コードポイントが未割当だった」ため、

単純な長さチェックでは検出できませんでした。以下のようなチェックを

CI or ビルド時に追加してください（Node.js例）：



\\`\\`\\`js

function validateFontMap(styles) {

&#x20; const errors = \[];

&#x20; for (const style of styles) {

&#x20;   const { src, dest } = style.map;

&#x20;   const srcChars = Array.from(src);   // サロゲートペア対応

&#x20;   const destChars = Array.from(dest); // サロゲートペア対応



&#x20;   if (srcChars.length !== destChars.length) {

&#x20;     errors.push(`\[${style.key}] 文字数不一致: src=${srcChars.length} dest=${destChars.length}`);

&#x20;     continue;

&#x20;   }



&#x20;   destChars.forEach((ch, i) => {

&#x20;     const cp = ch.codePointAt(0);

&#x20;     // Unicode正規化で情報が失われる = 未割当/非推奨コードポイントの疑い

&#x20;     if (!/\\p{Assigned}/u.test(ch)) {

&#x20;       errors.push(`\[${style.key}] index=${i} src='${srcChars\[i]}' が未割当コードポイント U+${cp.toString(16).toUpperCase()} にマップされています`);

&#x20;     }

&#x20;   });

&#x20; }

&#x20; return errors;

}

\\`\\`\\`



このバリデーションをテストに組み込み、`npm test` や

デプロイ前チェックで自動検出できるようにしてください。



\## 期待する動作

\- 修正後、"minimal / archive" を Italic Serif で変換すると

&#x20; `𝑚𝑖𝑛𝑖𝑚𝑎𝑙 / 𝑎𝑟𝑐ℎ𝑖𝑣𝑒` のように h も正しく表示される

\- 全24種類のフォントスタイルで、a-z, A-Z, 0-9 すべてを含む

&#x20; テスト文字列を変換しても □ が一切出力されない

