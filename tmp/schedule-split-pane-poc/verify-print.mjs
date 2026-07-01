/**
 * 印刷スタイルの静的チェック（CI/手動）。
 * ブラウザ実機確認: ライト/ダーク各で Ctrl+P → 文字・罫線が黒であること。
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const dir = path.dirname(fileURLToPath(import.meta.url));
const css = fs.readFileSync(path.join(dir, 'poc.css'), 'utf8');
const splitPane = fs.readFileSync(path.join(dir, 'lib', 'split-pane.mjs'), 'utf8');

const checks = [
  ['poc.css に @media print', () => /@media\s+print/.test(css)],
  ['print: 文字色 #000', () => /color:\s*#000/.test(css)],
  ['print: 罫線 #000', () => /border-color:\s*#000/.test(css)],
  ['print: theme-dark 上書き', () => /\.theme-dark[\s\S]*@media print|@media print[\s\S]*\.theme-dark/.test(css)],
  ['提出用PDF: 罫線 #000', () => /border:1px solid #000/.test(splitPane)],
  ['提出用PDF: 文字 #000', () => /color:#000/.test(splitPane)],
];

let failed = 0;
for (const [label, fn] of checks) {
  const ok = fn();
  console.log(`${ok ? '✓' : '✗'} ${label}`);
  if (!ok) failed += 1;
}

if (failed) {
  console.error(`\n${failed} check(s) failed`);
  process.exit(1);
}
console.log('\n静的チェック OK — 実機はライト/ダークで Ctrl+P と「提出用PDF」を確認');
