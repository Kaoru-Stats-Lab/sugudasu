#!/usr/bin/env node
/**
 * sg-csv-import — 単体テスト
 * Run: node scripts/sg-csv-import.test.mjs
 */
import assert from 'node:assert/strict';
import {
  DEFAULT_ROW_LIMIT,
  decodeArrayBuffer,
  extractColumnLines,
  guessDrawColumnIndex,
  isEmailColumnHeader,
  looksLikeMojibake,
  parseCsvLine,
  parseCsvText,
  readFileText,
} from '../assets/sg-csv-import.js';

// クォート付き CSV
{
  const cells = parseCsvLine('"山田,太郎",表示名', ',');
  assert.deepEqual(cells, ['山田,太郎', '表示名']);
}

// Connpass 風ヘッダー
{
  const csv = `ユーザー名,表示名,メールアドレス,受付番号
user1,太郎,taro@example.com,001
user2,花子,hanako@example.com,002`;
  const t = parseCsvText(csv);
  assert.equal(t.hasHeader, true);
  assert.deepEqual(t.headers, ['ユーザー名', '表示名', 'メールアドレス', '受付番号']);
  assert.equal(t.rows.length, 2);
  assert.equal(guessDrawColumnIndex(t.headers), 1);
  assert.equal(isEmailColumnHeader('メールアドレス'), true);
  assert.equal(isEmailColumnHeader('表示名'), false);
}

// 列抽出 · 上限
{
  const rows = Array.from({ length: 10 }, (_, i) => [`id${i}`, `名${i}`]);
  const parsed = {
    headers: ['ID', '表示名'],
    rows,
    hasHeader: true,
    delimiter: ',',
    skippedRowNumbers: [],
  };
  const { lines, truncated, sourceCount } = extractColumnLines(parsed, 1, 5);
  assert.equal(lines.length, 5);
  assert.equal(truncated, true);
  assert.equal(sourceCount, 10);
}

// 空セル行はスキップ（ヘッダーなし1列）
{
  const parsed = {
    headers: ['列1'],
    rows: [['A'], [''], ['B']],
    hasHeader: false,
    delimiter: ',',
    skippedRowNumbers: [],
  };
  const { lines } = extractColumnLines(parsed, 0);
  assert.deepEqual(lines, ['A', 'B']);
}

// UTF-8 BOM
{
  const bom = new Uint8Array([0xef, 0xbb, 0xbf, 0x61, 0x2c, 0x62]);
  const text = decodeArrayBuffer(bom.buffer, 'utf-8');
  assert.equal(text, 'a,b');
}

// 文字化けヒューリスティック（典型的な UTF-8 誤読）
assert.equal(looksLikeMojibake('縺ｿ縺ｿ縺ｿ縺ｿ縺ｿ縺ｿ'), true);
assert.equal(looksLikeMojibake('表示名,太郎,花子'), false);

assert.equal(DEFAULT_ROW_LIMIT, 5000);

console.log('sg-csv-import.test.mjs: all passed');
