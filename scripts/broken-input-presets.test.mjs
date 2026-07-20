#!/usr/bin/env node
/**
 * broken-input presets — 固定値・表示/コピー分離の再発防止
 *
 *   node scripts/broken-input-presets.test.mjs
 */
import {
  CATEGORIES,
  PRESETS,
  presetsForCategory,
  previewText,
  displayDiffersFromCopy,
} from '../assets/broken-input-presets.js';

let failed = 0;

function assert(cond, msg) {
  if (!cond) {
    console.error(`[broken-input] FAIL: ${msg}`);
    failed += 1;
  }
}

assert(CATEGORIES.length === 4, 'CATEGORIES length 4');
assert(
  CATEGORIES.map((c) => c.id).join(',') === 'length,i18n,chars,marks',
  'category ids order'
);

const required = ['id', 'category', 'title', 'description', 'value'];
const ids = new Set();
for (const p of PRESETS) {
  for (const k of required) {
    assert(typeof p[k] === 'string' && (k !== 'value' || p.value.length >= 0), `${p.id || '?'} missing ${k}`);
    if (k !== 'value') assert(p[k].length > 0, `${p.id} empty ${k}`);
  }
  assert(p.value.length > 0 || p.value.includes('\u0000'), `${p.id} empty value`);
  assert(!ids.has(p.id), `duplicate id ${p.id}`);
  ids.add(p.id);
  assert(
    CATEGORIES.some((c) => c.id === p.category),
    `${p.id} unknown category ${p.category}`
  );
}

assert(presetsForCategory('length').length === 4, 'length presets 4');
assert(presetsForCategory('i18n').length === 12, 'i18n presets 12');
assert(presetsForCategory('chars').length === 6, 'chars presets 6');
assert(presetsForCategory('marks').length === 4, 'marks presets 4');

const len100en = PRESETS.find((p) => p.id === 'len-100-en');
const len100ja = PRESETS.find((p) => p.id === 'len-100-ja');
const len1000 = PRESETS.find((p) => p.id === 'len-1000');
assert(len100en?.value.length === 100, 'len-100-en length');
assert([...len100ja.value].length === 100, 'len-100-ja code points');
assert(len1000?.value.length === 1000, 'len-1000 length');
assert(!previewText(len1000), 'len-1000 omits preview');
assert(len1000?.omitPreview === true, 'len-1000 omitPreview');

const zwsp = PRESETS.find((p) => p.id === 'chars-zwsp');
assert(zwsp?.value.includes('\u200B'), 'zwsp in value');
assert(zwsp?.preview === '山田太郎', 'zwsp preview looks normal');
assert(displayDiffersFromCopy(zwsp), 'zwsp display differs');
assert(!zwsp.preview.includes('ZWSP'), 'zwsp preview must not show ZWSP label');

const nfdJa = PRESETS.find((p) => p.id === 'chars-nfd-ja');
assert(nfdJa?.value === '\u304B\u3099', 'nfd が');
assert(nfdJa?.preview === 'が', 'nfd preview が');

const ar = PRESETS.find((p) => p.id === 'i18n-ar');
assert(/\d/.test(ar?.value || ''), 'arabic has digits');

const nul = PRESETS.find((p) => p.id === 'marks-null');
assert(nul?.value.includes('\u0000'), 'null char in value');
assert(nul?.preview === 'ABC…DEF', 'null preview simplified');
assert(nul?.title === 'NULL文字入り', 'null title');
assert(PRESETS.find((p) => p.id === 'marks-html')?.title === 'HTML記号', 'html title');
assert(CATEGORIES.find((c) => c.id === 'marks')?.label === '記号・制御', 'marks label');

const html = PRESETS.find((p) => p.id === 'marks-html');
assert(html?.value.includes('<') && html.value.includes('&'), 'html specials');

assert(PRESETS.some((p) => p.id === 'i18n-en'), 'english');
assert(PRESETS.some((p) => p.id === 'i18n-he'), 'hebrew');
assert(PRESETS.find((p) => p.id === 'emoji-family')?.value === '👨‍👩‍👧‍👦', 'family emoji');

if (failed) {
  console.error(`[broken-input] ${failed} assertion(s) failed`);
  process.exit(1);
}
console.log(`[broken-input] OK: ${PRESETS.length} presets · ${CATEGORIES.length} categories`);
