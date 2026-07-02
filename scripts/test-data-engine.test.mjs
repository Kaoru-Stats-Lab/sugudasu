#!/usr/bin/env node
import assert from 'node:assert/strict';
import {
  createSeededRng,
  EMPLOYEE_HEADERS,
  EMPLOYMENT_TYPES,
  applyEmployeeHeaderTemplate,
  escapeCsvField,
  FOREIGN_EMPLOYEE_RATE,
  pickForeignEmployeeIdentity,
  pickHybridJapaneseIdentity,
  formatDiverseDisplayName,
  generateDataset,
  resolveExportHeaders,
  rowsToCsv,
  roundTo1000,
  resolveCsvQuoteKeys,
  validateGenerateOptions,
  MAX_ROWS,
  ADDRESS_MASTER,
} from '../assets/test-data-engine.js';

const REF = { referenceYear: 2026, hireYearMin: 2000, hireYearMax: 2026 };

{
  assert.equal(roundTo1000(460637), 461000);
  assert.equal(roundTo1000(20619), 21000);
  assert.equal(roundTo1000(0), 0);
  assert.deepEqual(resolveCsvQuoteKeys('employee', true), ['郵便番号']);
  assert.deepEqual(resolveCsvQuoteKeys('employee', false), []);
}

{
  const quoted = generateDataset({
    preset: 'employee',
    count: 100,
    seed: 42,
    idPrefix: 'EMP-2026',
    emailDomain: 'example.com',
    mineRate: 0,
    quoteZipInCsv: true,
    roundSalaryTo1000: true,
    ...REF,
  });
  const plain = generateDataset({
    preset: 'employee',
    count: 100,
    seed: 42,
    idPrefix: 'EMP-2026',
    emailDomain: 'example.com',
    mineRate: 0,
    quoteZipInCsv: false,
    roundSalaryTo1000: true,
    ...REF,
  });
  assert.notEqual(quoted.csv, plain.csv, 'zip quote should change csv output');
  assert.match(quoted.csv, /"0\d{2}-\d{4}"/, 'leading-zero zips should be quoted');
  assert.ok(quoted.rows.every((r) => Number(r['基本給']) % 1000 === 0), 'base salary should be 1000-yen units');
  assert.ok(quoted.rows.every((r) => Number(r['通勤手当']) % 1000 === 0), 'commute should be 1000-yen units');
}

{
  const a = generateDataset({
    preset: 'employee',
    count: 10,
    seed: 42,
    idPrefix: 'EMP-2026',
    emailDomain: 'example.com',
    mineRate: 0,
    ...REF,
  });
  const b = generateDataset({
    preset: 'employee',
    count: 10,
    seed: 42,
    idPrefix: 'EMP-2026',
    emailDomain: 'example.com',
    mineRate: 0,
    ...REF,
  });
  assert.equal(a.csv, b.csv, 'employee: same seed must reproduce csv');
  assert.deepEqual(a.headers, EMPLOYEE_HEADERS);
  assert.equal(a.rows.length, 10);
  assert.ok(a.rows[0]['社員番号'].startsWith('EMP-2026-'));
  assert.ok(String(a.rows[0]['フリガナ']).match(/^[ァ-ヶー]+$/), 'furigana should be full-width katakana');
  assert.ok(['男性', '女性'].includes(String(a.rows[0]['性別'])));
  assert.ok(String(a.rows[0]['生年月日']).includes('/'), 'birth date slash format');
  assert.ok(String(a.rows[0]['入社年月日']).includes('-'), 'hire date dash format');
  const hireYear = Number.parseInt(String(a.rows[0]['入社年月日']).slice(0, 4), 10);
  assert.ok(hireYear >= 2000 && hireYear <= 2026, 'hire year within configured range');
  assert.ok(String(a.rows[0]['メールアドレス']).endsWith('@example.com'));
  const zip = String(a.rows[0]['郵便番号']);
  const pref = ADDRESS_MASTER.find((x) => x.zip === zip);
  assert.ok(pref, 'zip must exist in address master');
  assert.ok(String(a.rows[0]['住所']).startsWith(pref.pref), 'address must match zip prefecture');
}

{
  const past = generateDataset({
    preset: 'employee',
    count: 20,
    seed: 99,
    idPrefix: 'EMP-2020',
    emailDomain: 'example.com',
    mineRate: 0,
    referenceYear: 2020,
    hireYearMin: 2010,
    hireYearMax: 2020,
  });
  for (const row of past.rows) {
    const y = Number.parseInt(String(row['入社年月日']).slice(0, 4), 10);
    assert.ok(y >= 2010 && y <= 2020, 'custom reference year caps hire dates');
  }
}

{
  const silver = generateDataset({
    preset: 'employee',
    count: 500,
    seed: 7,
    idPrefix: 'EMP-2026',
    emailDomain: 'example.com',
    mineRate: 0,
    ...REF,
  });
  const rehire = silver.rows.filter((r) => r['雇用形態'] === '再雇用');
  assert.ok(rehire.length > 0, 'should include 再雇用 rows in 500 samples');
  for (const row of rehire) {
    const birthY = Number.parseInt(String(row['生年月日']).slice(0, 4), 10);
    assert.ok(birthY >= 1948 && birthY <= 1964, '再雇用 should use silver birth band');
    const hireY = Number.parseInt(String(row['入社年月日']).slice(0, 4), 10);
    assert.ok(hireY >= birthY + 60, '再雇用 hire should be at least 60 years after birth');
  }
  assert.ok(EMPLOYMENT_TYPES.some((e) => e.label === '再雇用' && e.silver));
}

{
  const custom = generateDataset({
    preset: 'employee',
    count: 3,
    seed: 1,
    idPrefix: 'EMP-2026',
    emailDomain: 'example.com',
    mineRate: 0,
    ...REF,
    exportHeaders: [
      '従業員番号',
      '氏名',
      'フリガナ（全角）',
      '性別',
      '生年月日',
      '入社年月日',
      '雇用形態',
      '基本給',
      '通勤手当',
      '扶養人数',
      '郵便番号',
      '住所',
      'メール',
    ],
  });
  assert.ok(custom.csv.includes('従業員番号,'), 'csv uses custom header row');
  assert.equal(custom.headers[0], '従業員番号');
  assert.ok(custom.rows[0]['社員番号'], 'row keys stay internal');
  const tpl = generateDataset({
    preset: 'employee',
    count: 2,
    seed: 5,
    idPrefix: 'EMP-2026',
    emailDomain: 'example.com',
    mineRate: 0,
    ...REF,
    exportHeaders: applyEmployeeHeaderTemplate(EMPLOYEE_HEADERS, 'jugyoin'),
  });
  assert.equal(tpl.headers[0], '従業員番号');
  assert.equal(tpl.headers[12], 'メールアドレス1');
}

{
  const a = generateDataset({ preset: 'customer', count: 10, seed: 42, idPrefix: 'CUST', emailDomain: 'test.example.co.jp', mineRate: 0 });
  const b = generateDataset({ preset: 'customer', count: 10, seed: 42, idPrefix: 'CUST', emailDomain: 'test.example.co.jp', mineRate: 0 });
  assert.equal(a.csv, b.csv, 'customer: same seed must reproduce csv');
}

{
  const rng1 = createSeededRng(99);
  const rng2 = createSeededRng(99);
  assert.deepEqual([rng1(), rng1(), rng1()], [rng2(), rng2(), rng2()]);
}

assert.equal(escapeCsvField('a,b'), '"a,b"');

assert.throws(() => resolveExportHeaders(['a', 'b'], ['only']), /2 列必要/);

{
  const compact = generateDataset({
    preset: 'employee',
    count: 5,
    seed: 11,
    idPrefix: 'EMP-2026',
    emailDomain: 'example.com',
    mineRate: 0,
    ...REF,
    birthDateFormat: 'compact',
    hireDateFormat: 'compact',
  });
  assert.match(String(compact.rows[0]['生年月日']), /^\d{8}$/, 'compact birth date');
  assert.match(String(compact.rows[0]['入社年月日']), /^\d{8}$/, 'compact hire date');
}

{
  const payroll = generateDataset({
    preset: 'payroll',
    count: 10,
    seed: 42,
    idPrefix: 'EMP-2026',
    emailDomain: 'example.com',
    mineRate: 0,
    ...REF,
  });
  assert.equal(payroll.rows.length, 30, 'payroll: 10 employees x 3 months');
  const byEmp = new Map();
  for (const row of payroll.rows) {
    const empId = String(row['社員番号']);
    if (!byEmp.has(empId)) byEmp.set(empId, []);
    byEmp.get(empId).push(row);
  }
  assert.equal(byEmp.size, 10, 'payroll: 10 unique employee ids');
  let anyMonthlyVariation = false;
  for (const [, rows] of byEmp) {
    assert.equal(rows.length, 3, 'each employee has 3 payroll lines');
    const bases = rows.map((r) => r['基本給']);
    assert.equal(new Set(bases).size, 1, 'base salary consistent per employee');
    const totals = rows.map((r) => Number(r['支給合計']));
    if (new Set(totals).size > 1) anyMonthlyVariation = true;
    assert.ok(rows.every((r) => '残業時間' in r && '源泉徴収税額' in r), 'payroll should include overtime and tax columns');
  }
  assert.ok(anyMonthlyVariation, 'payroll monthly variation should change 支給合計 for at least one employee');
  assert.ok(payroll.rows.every((r) => String(r['支給年月']).startsWith('2026-')), 'pay months use reference year');
}

{
  assert.equal(validateGenerateOptions(MAX_ROWS + 1, 1, { ...REF, preset: 'employee' }).ok, false);
  assert.equal(validateGenerateOptions(100, 1, { ...REF, preset: 'employee' }).ok, true);
  assert.equal(validateGenerateOptions(100, 1, { referenceYear: 2026, hireYearMin: 2027, hireYearMax: 2026 }).ok, false);
  assert.equal(validateGenerateOptions(2000, 1, { ...REF, preset: 'payroll' }).ok, false);
  assert.equal(validateGenerateOptions(1666, 1, { ...REF, preset: 'payroll' }).ok, true);
}

{
  const tx = generateDataset({ preset: 'transaction', count: 5, seed: 7, idPrefix: 'TX', emailDomain: 'x.test', mineRate: 0 });
  assert.equal(tx.headers.length, 6);
}

{
  const mined = generateDataset({
    preset: 'employee',
    count: 100,
    seed: 42,
    idPrefix: 'EMP-2026',
    emailDomain: 'example.com',
    mineRate: 0.05,
    ...REF,
  });
  const clean = generateDataset({
    preset: 'employee',
    count: 100,
    seed: 42,
    idPrefix: 'EMP-2026',
    emailDomain: 'example.com',
    mineRate: 0,
    ...REF,
  });
  assert.equal(clean.rows[1]['氏名'], mined.rows[1]['氏名'], 'mine toggle must not shift base RNG');
  assert.equal(clean.rows[1]['基本給'], mined.rows[1]['基本給'], 'mine toggle must not shift salary');
  const mineFields = new Set(['氏名', 'フリガナ', '郵便番号', '住所', 'メールアドレス', '生年月日', '入社年月日']);
  let patched = 0;
  for (let i = 0; i < clean.rows.length; i += 1) {
    const keys = Object.keys(clean.rows[i]);
    const diffs = keys.filter((k) => String(clean.rows[i][k]) !== String(mined.rows[i][k]));
    if (diffs.length === 0) continue;
    patched += 1;
    assert.ok(diffs.every((k) => mineFields.has(k)), `row ${i + 1} diffs only mine fields: ${diffs.join(',')}`);
  }
  assert.ok(patched > 0, 'mineRate=0.05 should patch some rows');
}

{
  const mined = generateDataset({
    preset: 'employee',
    count: 300,
    seed: 123,
    idPrefix: 'EMP-2026',
    emailDomain: 'example.com',
    mineRate: 1,
    ...REF,
  });
  const hasEdge = mined.rows.some(
    (r) => /[ｦ-ﾟ]/.test(String(r['フリガナ'])) || /^\d{7}$/.test(String(r['郵便番号'])) || String(r['住所']).length > 40,
  );
  assert.ok(hasEdge, 'employee mineRate=1 should produce edge-case rows');
}

function looksForeignEmployee(row) {
  const name = String(row['氏名']);
  const kana = String(row['フリガナ']);
  if (name.includes('・')) return true;
  if (name.includes(' ')) return true;
  if (/^(王|李|張|劉|金|朴|崔)/.test(name)) return true;
  if (/(ブライアン|ヘンリー|ハウスバック|マイケル|エミリー|ジェームズ|ジョン|グリーン|ローズ|ダニエル|メアリー|デビッド|ソフィア)/.test(name)) return true;
  if (/^(グエン|チャン|ファム|マリア|ジョセ|ラジュ|スニタ|ブディ|スリ|ミャン|アン|ジョン)/.test(kana)) return true;
  return false;
}

{
  const rng = createSeededRng(42);
  const hybridSample = Array.from({ length: 100 }, () => pickHybridJapaneseIdentity(rng));
  assert.ok(hybridSample.some((s) => /ブライアン|マイケル|エミリー/.test(s.kanji)), 'hybrid suffix names should appear');
  assert.ok(hybridSample.some((s) => s.kanji.includes(' ')), 'hybrid spaced names should appear');
  assert.ok(hybridSample.some((s) => /ハウスバック|グリーン|ローズ/.test(s.kanji)), 'hybrid loan names should appear');
  assert.ok(hybridSample.every((s) => /^[ァ-ヶー]+$/.test(s.kana)), 'hybrid furigana should be katakana');
}

{
  const rng = createSeededRng(42);
  const sample = Array.from({ length: 200 }, () => pickForeignEmployeeIdentity(rng));
  assert.ok(sample.some((s) => /^王|李|張|劉/.test(s.kanji)), 'china han names should appear');
  assert.ok(sample.some((s) => s.kanji.includes('・')), 'katakana-style foreign names should appear');
  assert.ok(sample.some((s) => /ブライアン|ヘンリー|ハウスバック/.test(s.kanji)), 'hybrid jp names should appear in diverse pool');
  assert.ok(sample.every((s) => /^[ァ-ヶー]+$/.test(s.kana)), 'foreign furigana should be katakana');
}

{
  const withForeign = generateDataset({
    preset: 'employee',
    count: 500,
    seed: 42,
    idPrefix: 'EMP-2026',
    emailDomain: 'example.com',
    mineRate: 0,
    includeForeignNames: true,
    ...REF,
  });
  const withoutForeign = generateDataset({
    preset: 'employee',
    count: 500,
    seed: 42,
    idPrefix: 'EMP-2026',
    emailDomain: 'example.com',
    mineRate: 0,
    includeForeignNames: false,
    ...REF,
  });
  const foreignRows = withForeign.rows.filter(looksForeignEmployee);
  assert.ok(foreignRows.length >= 5 && foreignRows.length <= 50, `~4% foreign rows expected, got ${foreignRows.length}`);
  assert.equal(withoutForeign.rows.filter(looksForeignEmployee).length, 0, 'includeForeignNames=false should omit foreign names');
  assert.notEqual(withForeign.csv, withoutForeign.csv, 'foreign toggle should change output');
  for (const row of foreignRows) {
    assert.ok(String(row['フリガナ']).match(/^[ァ-ヶー]+$/), 'foreign row furigana should stay katakana');
    assert.ok(['男性', '女性'].includes(String(row['性別'])), 'foreign row gender should be set');
  }
}

{
  const flat = generateDataset({
    preset: 'payroll',
    count: 20,
    seed: 99,
    idPrefix: 'EMP-2026',
    emailDomain: 'example.com',
    mineRate: 0,
    payrollMonthlyVariation: false,
    ...REF,
  });
  for (const row of flat.rows) {
    assert.equal(row['残業時間'], '0');
    assert.equal(row['残業代'], '0');
    assert.equal(row['源泉徴収税額'], '0');
    assert.equal(
      Number(row['支給合計']),
      Number(row['基本給']) + Number(row['通勤手当']),
      'flat payroll total should be base + commute only',
    );
  }
}

{
  assert.equal(formatDiverseDisplayName('伊藤海輝マイケル', '伊藤'), '伊藤 海輝マイケル');
  assert.equal(formatDiverseDisplayName('ラジュ・タパ', null), 'ラジュ タパ');
  assert.equal(formatDiverseDisplayName('望月 ヘンリー海輝', '望月'), '望月 ヘンリー海輝');
  assert.equal(formatDiverseDisplayName('伊藤海輝マイケル', '伊藤', false), '伊藤海輝マイケル');
}

{
  const spaced = generateDataset({
    preset: 'employee',
    count: 500,
    seed: 42,
    idPrefix: 'EMP-2026',
    emailDomain: 'example.com',
    mineRate: 0,
    includeForeignNames: true,
    spaceInDiverseNames: true,
    ...REF,
  });
  const row59 = spaced.rows.find((r) => String(r['社員番号']) === 'EMP-2026-0059');
  if (row59) {
    assert.match(String(row59['氏名']), / /, 'hybrid suffix name should get surname space when enabled');
  }
  const unified = generateDataset({
    preset: 'employee',
    count: 5,
    seed: 11,
    idPrefix: 'EMP-2026',
    emailDomain: 'example.com',
    mineRate: 0,
    ...REF,
    birthDateFormat: 'dash',
    hireDateFormat: 'dash',
  });
  assert.ok(unified.rows.every((r) => String(r['生年月日']).includes('-') && String(r['入社年月日']).includes('-')));
}

console.log('test-data-engine.test.mjs: all tests passed');
