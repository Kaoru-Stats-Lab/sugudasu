#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const TOOLS = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'tools');

const PAGES = {
  'reverse.html': { title: '逆引き辞典' },
  'label.html': { title: '宛名ラベル', print: true },
  'present.html': { title: 'ギフトサジェスター' },
  'report.html': { title: '議事録・報告書' },
  'warikan.html': { title: '傾斜割り勘' },
  'receipt.html': { title: '手取り逆引き・領収書', print: true },
  'invoice.html': { title: '見積・納品・請求書', print: true },
  'not-a-car.html': { title: '車ではなく書類' },
  'hub.html': { title: 'ツール一覧' },
  'shift.html': { title: 'シフト表', print: true, landscape: true },
  'sns.html': { title: 'SNSデコ文字' },
  'disclaimer.html': { title: '免責事項' },
  'updates.html': { title: '更新履歴' },
  'terms.html': { title: '利用規約' },
  'privacy.html': { title: 'プライバシーポリシー' },
};

for (const [file, cfg] of Object.entries(PAGES)) {
  const p = path.join(TOOLS, file);
  let html = fs.readFileSync(p, 'utf8');
  const attrs = [`data-sg-title="${cfg.title}"`];
  if (cfg.print) attrs.push('data-sg-print="true"');
  if (cfg.landscape) attrs.push('data-sg-landscape="true"');
  const top = `<div id="sg-chrome-top" ${attrs.join(' ')}></div>`;
  html = html.replace(/<div id="sg-chrome-top"><\/div>/, top);
  html = html.replace(/\n\s*SUGUDASU_SHELL\.mount\(\{[^}]+\}\);\s*/g, '\n');
  html = html.replace(/\n<script>\s*SUGUDASU_SHELL\.mount\(\{[^}]+\}\);\s*<\/script>\s*/g, '\n');
  fs.writeFileSync(p, html, 'utf8');
  console.log('updated', file);
}
