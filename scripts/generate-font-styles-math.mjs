#!/usr/bin/env node
/**
 * data/font-styles.json の Mathematical / filledSquared dest を再生成
 * （未割当 CP・filledSquared のズレを MATH_HOLES / buildFilledSquaredDest で修正）
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  MATH_BANDS,
  MATH_SRC,
  buildMathDest,
  buildFilledSquaredDest,
} from '../assets/unicode-math-alpha.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const JSON_PATH = path.join(__dirname, '..', 'data/font-styles.json');

const styles = JSON.parse(fs.readFileSync(JSON_PATH, 'utf8'));
let patched = 0;

for (const style of styles) {
  if (style.key === 'filledSquared' && style.map) {
    style.map.src = MATH_SRC;
    style.map.dest = buildFilledSquaredDest();
    patched += 1;
    continue;
  }
  const bands = MATH_BANDS[style.key];
  if (!bands || !style.map?.src) continue;
  const [upper, lower, digit] = bands;
  style.map.dest = buildMathDest(upper, lower, digit, style.key);
  patched += 1;
}

fs.writeFileSync(JSON_PATH, `${JSON.stringify(styles, null, 2)}\n`, 'utf8');

const italic = styles.find((s) => s.key === 'serifItalic');
const hIdx = [...italic.map.src].indexOf('h');
const h = [...italic.map.dest][hIdx];
const filled = styles.find((s) => s.key === 'filledSquared');
console.log(`generate-font-styles-math: patched ${patched} styles`);
console.log('verify serifItalic h:', h.codePointAt(0).toString(16), '(expect 210e)');
console.log(
  'verify filledSquared len:',
  [...filled.map.dest].length,
  '(expect 62)'
);
