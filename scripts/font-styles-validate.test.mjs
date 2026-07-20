#!/usr/bin/env node
/**
 * font-styles.json — src/dest 長さ一致 + dest が Unicode Assigned か
 * 未割当 Mathematical holes / filledSquared ズレの再発防止
 *
 *   node scripts/font-styles-validate.test.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  MATH_SRC,
  buildFilledSquaredDest,
  buildMathDest,
  MATH_BANDS,
} from '../assets/unicode-math-alpha.js';
import { convertString } from '../assets/sns-font-engine.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const STYLES_PATH = path.join(ROOT, 'data/font-styles.json');

function validateFontMap(styles) {
  const errors = [];
  for (const style of styles) {
    if (!style.map || typeof style.map !== 'object') {
      errors.push(`[${style.key}] map がありません`);
      continue;
    }

    // Parallel string maps: { src, dest }
    if (typeof style.map.src === 'string' && typeof style.map.dest === 'string') {
      const srcChars = Array.from(style.map.src);
      const destChars = Array.from(style.map.dest);

      if (srcChars.length !== destChars.length) {
        errors.push(
          `[${style.key}] 文字数不一致: src=${srcChars.length} dest=${destChars.length}`
        );
        continue;
      }

      destChars.forEach((ch, i) => {
        const cp = ch.codePointAt(0);
        if (!/\p{Assigned}/u.test(ch)) {
          errors.push(
            `[${style.key}] index=${i} src='${srcChars[i]}' が未割当コードポイント U+${cp.toString(16).toUpperCase()} にマップされています`
          );
        }
      });
      continue;
    }

    // Char→char object maps (gal / small / hankaku 等)
    if ('src' in style.map || 'dest' in style.map) {
      errors.push(`[${style.key}] map.src / map.dest が不正です`);
      continue;
    }
    for (const [srcCh, destCh] of Object.entries(style.map)) {
      if (typeof destCh !== 'string' || !destCh) {
        errors.push(`[${style.key}] '${srcCh}' の dest が空です`);
        continue;
      }
      for (const ch of Array.from(destCh)) {
        const cp = ch.codePointAt(0);
        if (!/\p{Assigned}/u.test(ch)) {
          errors.push(
            `[${style.key}] src='${srcCh}' が未割当コードポイント U+${cp.toString(16).toUpperCase()} にマップされています`
          );
        }
      }
    }
  }
  return errors;
}

function assert(cond, msg) {
  if (!cond) {
    console.error(`[font-styles] FAIL: ${msg}`);
    process.exitCode = 1;
  }
}

const styles = JSON.parse(fs.readFileSync(STYLES_PATH, 'utf8'));
const errors = validateFontMap(styles);
if (errors.length) {
  console.error('[font-styles] validateFontMap errors:');
  for (const e of errors) console.error(' ', e);
  process.exitCode = 1;
} else {
  console.log(`[font-styles] Assigned check OK: ${styles.length} styles`);
}

// 期待値スポットチェック（実装依頼）
const byKey = Object.fromEntries(styles.map((s) => [s.key, s]));
const idx = (style, ch) => [...style.map.src].indexOf(ch);
const destCp = (style, ch) => [...style.map.dest][idx(style, ch)].codePointAt(0);

assert(destCp(byKey.serifItalic, 'h') === 0x210e, 'serifItalic h → U+210E');
assert(destCp(byKey.script, 'e') === 0x212f, 'script e → U+212F');
assert(destCp(byKey.script, 'B') === 0x212c, 'script B → U+212C');
assert(destCp(byKey.double, 'R') === 0x211d, 'double R → U+211D');
assert(destCp(byKey.fraktur, 'Z') === 0x2128, 'fraktur Z → U+2128');
assert(
  byKey.filledSquared.map.dest === buildFilledSquaredDest(),
  'filledSquared dest == buildFilledSquaredDest()'
);
assert([...byKey.filledSquared.map.dest].length === 62, 'filledSquared len 62');

// 全ラテン+数字で □ / U+FFFD が出ない（MATH + filledSquared）
const probe = MATH_SRC;
for (const style of styles) {
  if (!style.map?.src) continue;
  if (MATH_BANDS[style.key] || style.key === 'filledSquared') {
    const out = convertString(probe, style.map);
    assert(!out.includes('\uFFFD'), `${style.key} must not emit U+FFFD`);
    assert(!/[□�]/.test(out), `${style.key} must not emit tofu □`);
  }
}

// Italic Serif: minimal / archive
const italicOut = convertString('minimal / archive', byKey.serifItalic.map);
assert(
  italicOut.includes(String.fromCodePoint(0x210e)),
  'minimal/archive italic includes Planck h (U+210E)'
);
console.log('spot: serifItalic "minimal / archive" →', italicOut);

// buildMathDest 一致（再発防止）
for (const [key, bands] of Object.entries(MATH_BANDS)) {
  const style = byKey[key];
  if (!style) continue;
  const [u, l, d] = bands;
  const expect = buildMathDest(u, l, d, key);
  assert(style.map.dest === expect, `${key} JSON dest matches buildMathDest`);
}

if (process.exitCode) {
  console.error('[font-styles] 検証失敗');
  process.exit(1);
}
console.log('[font-styles] OK');
