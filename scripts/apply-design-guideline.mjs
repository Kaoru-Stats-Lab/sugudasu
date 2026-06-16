/**
 * Apply DESIGN_GUIDELINE.md shell + strip prompt comments
 * Run: node scripts/apply-design-guideline.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TOOLS_DIR = path.join(__dirname, '..', 'tools');

const CONFIG = {
  'invoice.html': { title: '見積・納品・請求書', print: true },
  'present.html': { title: 'ギフトサジェスター', print: false },
  'shift.html': { title: 'シフト表', print: true },
  'report.html': { title: '議事録・報告書', print: false },
  'reverse.html': { title: '逆引き辞典', print: false },
  'label.html': { title: '宛名ラベル', print: true },
  'warikan.html': { title: '傾斜割り勘', print: false },
  'sns.html': { title: 'SNSデコ文字', print: false },
  'hub.html': { title: 'ツール一覧', print: false }
};

function stripHeadComments(html) {
  html = html.replace(/<head>\s*[^<][\s\S]*?-->\s*/i, '<head>\n');
  html = html.replace(/<head>\s*<!--[\s\S]*?-->\s*/gi, '<head>\n');
  return html;
}

function upgradeTailwind(html) {
  return html.replace(
    /https:\/\/cdn\.tailwindcss\.com/g,
    'https://cdn.jsdelivr.net/npm/@tailwindcss/browser@4'
  );
}

function addCssLink(html) {
  if (html.includes('sugudasu.css')) return html;
  const tw = /<script src="https:\/\/cdn\.jsdelivr\.net\/npm\/@tailwindcss\/browser@4"><\/script>/;
  if (tw.test(html)) {
    return html.replace(tw, `$&\n    <link rel="stylesheet" href="../assets/sugudasu.css">`);
  }
  return html.replace(/<head>/i, `<head>\n    <link rel="stylesheet" href="../assets/sugudasu.css">`);
}

function normalizeFonts(html) {
  html = html.replace(/family=Marcellus[^&]*&?/g, '');
  html = html.replace(/family=Shippori\+Mincho[^&]*&?/g, '');
  html = html.replace(/\.serif-title\s*\{[^}]*\}/g, '');
  html = html.replace(/\.serif-font\s*\{[^}]*\}/g, '');
  return html;
}

function unifyStone(html) {
  return html
    .replace(/\bstone-/g, 'slate-')
    .replace(/#faf9f6/g, '#f1f5f9')
    .replace(/#fcfbf9/g, '#f8fafc');
}

function removePro(html) {
  return html
    .replace(/<div class="bg-indigo-600 text-white px-2\.5 py-1 rounded-md font-bold text-sm tracking-wider">PRO<\/div>\s*/g, '')
    .replace(/<div class="bg-amber-600 text-slate-900 p-2 rounded-lg font-black text-sm">逆引<\/div>\s*/g, '');
}

function removeHeaders(html) {
  const patterns = [
    /<header class="no-print bg-slate-900[\s\S]*?<\/header>\s*/i,
    /<header class="bg-slate-900[\s\S]*?<\/header>\s*/i,
    /<header class="bg-stone-900[\s\S]*?<\/header>\s*/i,
    /<header class="bg-white border-b[\s\S]*?<\/header>\s*/i,
    /<header class="no-print bg-slate-900 text-white[\s\S]*?<\/header>\s*/i
  ];
  for (const p of patterns) html = html.replace(p, '');
  return html;
}

function removeFooters(html) {
  return html.replace(/<footer class="[^"]*"[\s\S]*?<\/footer>\s*/gi, '');
}

function ensureSgBody(html) {
  return html
    .replace(/<body([^>]*)class="([^"]*)"/, (m, rest, cls) => {
      if (cls.includes('sg-body')) return m;
      return `<body${rest}class="sg-body ${cls}"`;
    })
    .replace(/<body(?![^>]*class=)/, '<body class="sg-body min-h-screen flex flex-col antialiased"');
}

function injectChrome(html, cfg) {
  if (!html.includes('id="sg-chrome-top"')) {
    html = html.replace(/<body[^>]*>/, (m) => `${m}\n<div id="sg-chrome-top"></div>\n`);
  }
  html = html.replace(
    /<script src="\.\.\/assets\/sugudasu-shell\.js"><\/script>[\s\S]*?SUGUDASU_SHELL\.mount\([^)]*\);[\s\S]*?<\/script>/g,
    ''
  );
  const mount = `SUGUDASU_SHELL.mount({ title: '${cfg.title}', print: ${cfg.print} });`;
  if (!html.includes('sg-chrome-bottom')) {
    html = html.replace(
      /<\/body>/i,
      `<div id="sg-chrome-bottom"></div>\n<script src="../assets/sugudasu-shell.js"></script>\n<script>\n${mount}\n</script>\n</body>`
    );
  } else {
    html = html.replace(/SUGUDASU_SHELL\.mount\([^)]*\);/, mount);
  }
  return html;
}

function addPrintClasses(html, file) {
  if (file === 'invoice.html') {
    html = html.replace(/class="preview-section/g, 'class="print-target preview-section');
    if (!html.includes('preview-scaler')) {
      html = html.replace(/id="preview-wrapper"/g, 'id="preview-wrapper" class="preview-scaler"');
    }
  }
  if (file === 'label.html' && html.includes('id="preview-area"')) {
    html = html.replace(/id="preview-area"(?! class)/g, 'id="preview-area" class="print-target"');
  }
  return html;
}

for (const [file, cfg] of Object.entries(CONFIG)) {
  const fp = path.join(TOOLS_DIR, file);
  if (!fs.existsSync(fp)) {
    console.warn('skip missing', file);
    continue;
  }
  let html = fs.readFileSync(fp, 'utf8');
  html = stripHeadComments(html);
  html = upgradeTailwind(html);
  html = addCssLink(html);
  html = normalizeFonts(html);
  html = unifyStone(html);
  html = removePro(html);
  html = removeHeaders(html);
  html = removeFooters(html);
  html = ensureSgBody(html);
  html = addPrintClasses(html, file);
  html = injectChrome(html, cfg);
  fs.writeFileSync(fp, html, 'utf8');
  console.log('updated', file);
}

console.log('done');
