#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { MATH_BANDS, buildMathDest } from '../assets/unicode-math-alpha.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const JSON_PATH = path.join(__dirname, '..', 'data/font-styles.json');

const styles = JSON.parse(fs.readFileSync(JSON_PATH, 'utf8'));
let patched = 0;

for (const style of styles) {
  const bands = MATH_BANDS[style.key];
  if (!bands || !style.map?.src) continue;
  const [upper, lower, digit] = bands;
  style.map.dest = buildMathDest(upper, lower, digit);
  patched += 1;
}

fs.writeFileSync(JSON_PATH, `${JSON.stringify(styles, null, 2)}\n`, 'utf8');
const j = styles.find((s) => s.key === 'double');
const h = j.map.dest[j.map.src.indexOf('H')];
console.log(`generate-font-styles-math: patched ${patched} styles`);
console.log('verify double H:', h.codePointAt(0).toString(16), '(expect 1d53f)');
