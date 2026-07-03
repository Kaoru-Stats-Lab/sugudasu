#!/usr/bin/env node
/**
 * table-conv — 単体テスト
 * Run: node scripts/table-conv.test.mjs
 */
import assert from 'node:assert/strict';
import {
  parseInputTable,
  toCsvText,
  toJsonArray,
  toMarkdownTable,
  toTsvText,
  scanEncodingIssues,
} from '../assets/table-conv.js';

{
  const t = parseInputTable('名前\t年齢\n太郎\t30\n花子\t25');
  assert.equal(t.headers[0], '名前');
  assert.equal(t.rows.length, 2);
  const md = toMarkdownTable(t);
  assert.match(md, /\| 名前 \| 年齢 \|/);
  assert.match(md, /\| 太郎 \| 30 \|/);
}

{
  const csv = 'A,B\n"val,ue",2';
  const t = parseInputTable(csv);
  assert.equal(t.rows[0][0], 'val,ue');
  const json = JSON.parse(toJsonArray(t));
  assert.equal(json[0].A, 'val,ue');
}

{
  const t = parseInputTable('単一列\n行1\n行2');
  assert.equal(t.singleColumn, true);
}

assert.equal(toTsvText({ headers: ['a'], rows: [['1']], hasHeader: true }), 'a\n1');
assert.equal(toCsvText({ headers: ['a'], rows: [['1']], hasHeader: true }, true).charCodeAt(0), 0xfeff);

const enc = scanEncodingIssues('正常なテキスト');
assert.equal(enc.hasIssue, false);

console.log('table-conv.test.mjs: all passed');
