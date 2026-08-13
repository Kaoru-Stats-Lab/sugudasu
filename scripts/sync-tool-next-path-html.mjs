/**
 * data/tool-next-path.json → tools/{id}.html の data-sg-next-* とインライン導線を同期。
 * from 以外のツール HTML から Next 導線を削除する。
 * SSOT: docs/notes/TOOL_NEXT_PATH_SPEC.md
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const nextDoc = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/tool-next-path.json'), 'utf8'));
const paths = nextDoc.paths || {};
const fromIds = new Set(Object.keys(paths));

const INLINE_RE =
  /\n?\s*<p\b[^>]*\bsg-tool-next-path--inline\b[^>]*>[\s\S]*?<\/p>/gi;
const CHROME_NEXT_ATTR_RE =
  /\s+data-sg-next-(?:id|label|reason)="[^"]*"/g;

/**
 * @param {string} html
 * @param {{ nextId: string, linkLabel: string, reason: string } | null} path
 */
function applyChrome(html, path) {
  return html.replace(
    /(<div\s+id="sg-chrome-top")([^>]*)(>)/i,
    function (_m, open, attrs, close) {
      let a = String(attrs).replace(CHROME_NEXT_ATTR_RE, '');
      if (path) {
        a +=
          ' data-sg-next-id="' +
          escapeAttr(path.nextId) +
          '" data-sg-next-label="' +
          escapeAttr(path.linkLabel) +
          '" data-sg-next-reason="' +
          escapeAttr(path.reason) +
          '"';
      }
      return open + a + close;
    },
  );
}

/**
 * @param {string} s
 */
function escapeAttr(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;');
}

/**
 * @param {string} s
 */
function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

/**
 * @param {string} html
 * @param {{ nextId: string, linkLabel: string, reason: string } | null} path
 */
function applyInline(html, path) {
  let out = html.replace(INLINE_RE, '');
  if (!path) return out;

  const block =
    '\n        <p class="sg-tool-next-path sg-tool-next-path--inline no-print" data-sg-tool-next>' +
    '<span class="sg-tool-next-path__reason">' +
    escapeHtml(path.reason) +
    '</span> ' +
    '<a class="sg-tool-next-path__link" href="/' +
    encodeURIComponent(path.nextId) +
    '">' +
    escapeHtml(path.linkLabel) +
    '</a></p>';

  if (/<\/header>/i.test(out) && /sg-tool-intro/i.test(out)) {
    // 最初の tool-intro 内 header の閉じ直前に挿入
    let inserted = false;
    out = out.replace(/(<header\b[^>]*\bsg-tool-intro\b[\s\S]*?)(<\/header>)/i, function (m, body, close) {
      if (inserted) return m;
      inserted = true;
      return body + block + '\n    ' + close;
    });
    if (inserted) return out;
  }

  // header が無い場合は chrome の直後
  return out.replace(
    /(<div\s+id="sg-chrome-top"[^>]*>\s*<\/div>)/i,
    '$1\n' + block,
  );
}

const toolsDir = path.join(ROOT, 'tools');
let changed = 0;
let cleared = 0;
let ensured = 0;

for (const name of fs.readdirSync(toolsDir)) {
  if (!name.endsWith('.html')) continue;
  const id = name.replace(/\.html$/i, '');
  if (id === 'hub' || id === 'index') continue;
  const file = path.join(toolsDir, name);
  let html = fs.readFileSync(file, 'utf8');
  if (!/id="sg-chrome-top"/i.test(html)) continue;

  const pathEntry = fromIds.has(id) ? paths[id] : null;
  const before = html;
  html = applyChrome(html, pathEntry);
  html = applyInline(html, pathEntry);

  if (html !== before) {
    fs.writeFileSync(file, html, 'utf8');
    changed += 1;
    if (pathEntry) ensured += 1;
    else cleared += 1;
  }
}

console.log(
  `[sync-tool-next-path-html] OK: changed=${changed} ensured=${ensured} cleared=${cleared} fromIds=${fromIds.size}`,
);
