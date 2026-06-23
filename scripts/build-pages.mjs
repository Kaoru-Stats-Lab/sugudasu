#!/usr/bin/env node
/**
 * Cloudflare Pages 向け静的ビルド
 * tools/*.html + assets/ → dist/（パスを /assets/ に正規化）
 */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { execSync, spawnSync } from 'node:child_process';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const TOOLS = path.join(ROOT, 'tools');
const ASSETS = path.join(ROOT, 'assets');
const DIST = path.join(ROOT, 'dist');
const ADS_TXT = path.join(ROOT, 'ads.txt');
const SITE_ORIGIN = 'https://sugudasu.com';

/** sitemap 対象外（内部プレビュー・index と重複する hub） */
const SITEMAP_SKIP = new Set(['brand-logo-preview.html', 'hub.html']);

function escapeXml(text) {
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function readChangelogLastmod() {
  const changelogPath = path.join(ROOT, 'data', 'changelog.json');
  if (!fs.existsSync(changelogPath)) {
    return new Date().toISOString().slice(0, 10);
  }
  try {
    const data = JSON.parse(fs.readFileSync(changelogPath, 'utf8'));
    if (data.updatedAt) return String(data.updatedAt).slice(0, 10);
    const first = data.entries && data.entries[0];
    if (first && first.date) return String(first.date).slice(0, 10);
  } catch {
    // fall through
  }
  return new Date().toISOString().slice(0, 10);
}

function canonicalPathFromHtml(file) {
  const slug = file.replace(/\.html$/, '');
  return slug === 'hub' ? '/' : `/${slug}`;
}

function sitemapPriority(pathname) {
  if (pathname === '/') return '1.0';
  if (pathname === '/invoice' || pathname === '/receipt') return '0.9';
  if (pathname === '/updates') return '0.7';
  if (pathname === '/privacy' || pathname === '/terms' || pathname === '/disclaimer' || pathname === '/statements') return '0.5';
  return '0.8';
}

function writeSitemapAndRobots(htmlFiles, lastmod) {
  const paths = ['/', ...htmlFiles
    .filter((f) => !SITEMAP_SKIP.has(f))
    .map((f) => canonicalPathFromHtml(f))
    .filter((p) => p !== '/')];

  const urls = paths.map((pathname) => {
    const loc = pathname === '/' ? `${SITE_ORIGIN}/` : `${SITE_ORIGIN}${pathname}`;
    return [
      '  <url>',
      `    <loc>${escapeXml(loc)}</loc>`,
      `    <lastmod>${lastmod}</lastmod>`,
      '    <changefreq>weekly</changefreq>',
      `    <priority>${sitemapPriority(pathname)}</priority>`,
      '  </url>',
    ].join('\n');
  });

  const xml = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...urls,
    '</urlset>',
    '',
  ].join('\n');

  fs.writeFileSync(path.join(DIST, 'sitemap.xml'), xml, 'utf8');

  const robots = [
    'User-agent: *',
    'Allow: /',
    '',
    `Sitemap: ${SITE_ORIGIN}/sitemap.xml`,
    '',
  ].join('\n');
  fs.writeFileSync(path.join(DIST, 'robots.txt'), robots, 'utf8');
}

function writeRedirects(htmlFiles) {
  const lines = [
    '# Canonical: apex / · clean paths without .html',
    '/hub.html / 301',
    '/hub / 301',
  ];

  for (const file of htmlFiles) {
    if (file === 'hub.html') continue;
    const slug = file.replace(/\.html$/, '');
    lines.push(`/${file} /${slug} 301`);
  }

  lines.push('/imgconv /webp-to-jpg 301');
  lines.push('/webp-to-png /webp-to-jpg 301');

  fs.writeFileSync(path.join(DIST, '_redirects'), `${lines.join('\n')}\n`, 'utf8');
}

/** /{slug} を python http.server 等でも配信できるよう {slug}/index.html を複製 */
function writeCleanUrlDirs(htmlFiles) {
  for (const file of htmlFiles) {
    if (file === 'hub.html') continue;
    const slug = file.replace(/\.html$/, '');
    const src = path.join(DIST, file);
    const dir = path.join(DIST, slug);
    fs.mkdirSync(dir, { recursive: true });
    fs.copyFileSync(src, path.join(dir, 'index.html'));
  }
}

function writeHeaders() {
  const headers = [
    '/assets/*',
    '  Cache-Control: public, max-age=31536000, immutable',
    '',
    '/data/*',
    '  Cache-Control: public, max-age=3600',
    '',
    '/*.html',
    '  Cache-Control: public, max-age=600',
    '',
    '/',
    '  Cache-Control: public, max-age=600',
    '',
    '/sitemap.xml',
    '  Content-Type: application/xml; charset=utf-8',
    '  Cache-Control: public, max-age=86400',
    '',
    '/robots.txt',
    '  Content-Type: text/plain; charset=utf-8',
    '  Cache-Control: public, max-age=86400',
    '',
  ].join('\n');
  fs.writeFileSync(path.join(DIST, '_headers'), headers, 'utf8');
}

function rmrf(dir) {
  if (fs.existsSync(dir)) {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

function copyDir(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  for (const name of fs.readdirSync(src)) {
    const s = path.join(src, name);
    const d = path.join(dest, name);
    if (fs.statSync(s).isDirectory()) {
      copyDir(s, d);
    } else {
      fs.copyFileSync(s, d);
    }
  }
}

/** ?v= バスター対象（_headers で /assets/* は immutable 1年） */
const BUST_ASSET_NAMES = [
  'sugudasu-shell.js',
  'sugudasu.css',
  'sugudasu-segment.js',
  'tw-build.css',
  'sns-app.js',
  'sns-font-engine.js',
  'font-converter-app.js',
  'unicode-math-alpha.js',
  'sg-copy-feedback.js',
];

function computeAssetVersion() {
  if (process.env.SG_ASSET_V) return process.env.SG_ASSET_V;
  const hash = crypto.createHash('sha256');
  for (const name of BUST_ASSET_NAMES) {
    const p = path.join(ASSETS, name);
    if (fs.existsSync(p)) hash.update(fs.readFileSync(p));
  }
  return hash.digest('hex').slice(0, 8);
}

/** compileTailwind 後に computeAssetVersion() で上書き */
let ASSET_V = 'pending';

const FONT_HEAD = `    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Montserrat:wght@800&family=Noto+Sans+JP:wght@400;700&display=swap">`;

function compileTailwind() {
  const entry = path.join(ASSETS, 'tailwind-entry.css');
  const out = path.join(ASSETS, 'tw-build.css');
  if (!fs.existsSync(entry)) {
    throw new Error('tailwind-entry.css not found');
  }
  console.log('build:pages — compile Tailwind (no browser CDN in dist)…');
  const cli = path.join(ROOT, 'node_modules', '@tailwindcss', 'cli', 'dist', 'index.mjs');
  execSync(`node "${cli}" -i "${entry}" -o "${out}" --minify`, { cwd: ROOT, stdio: 'inherit' });
  const kb = (fs.statSync(out).size / 1024).toFixed(1);
  console.log(`  tw-build.css ${kb} KiB`);
}

function rewriteHtml(html) {
  let out = html
    .replace(/\.\.\/assets\//g, '/assets/')
    .replace(/\.\.\/data\//g, '/data/')
    .replace(/href="assets\//g, 'href="/assets/')
    .replace(/src="assets\//g, 'src="/assets/');

  out = out.replace(
    /<script src="https:\/\/cdn\.jsdelivr\.net\/npm\/@tailwindcss\/browser@4"><\/script>\s*/g,
    ''
  );

  if (!out.includes('fonts.googleapis.com')) {
    out = out.replace(/(<meta charset="UTF-8">)/, `$1\n${FONT_HEAD}`);
  }

  out = out.replace(/\/assets\/sugudasu\.css"/g, `/assets/sugudasu.css?v=${ASSET_V}"`);

  if (!out.includes('tw-build.css')) {
    out = out.replace(
      /(<link rel="stylesheet" href="\/assets\/sugudasu\.css[^"]*">)/,
      `$1\n    <link rel="stylesheet" href="/assets/tw-build.css?v=${ASSET_V}">`
    );
  }

  out = out.replace(
    /src="\/assets\/sugudasu-shell\.js[^"]*"/g,
    `src="/assets/sugudasu-shell.js?v=${ASSET_V}"`
  );
  out = out.replace(
    /src="\/assets\/sugudasu-segment\.js"/g,
    `src="/assets/sugudasu-segment.js?v=${ASSET_V}"`
  );

  out = out.replace(
    /src="\/assets\/(font-converter-app|sns-page)\.js"/g,
    `src="/assets/$1.js?v=${ASSET_V}"`
  );

  out = out.replace(
    /from '\/assets\/sns-app\.js'/g,
    `from '/assets/sns-app.js?v=${ASSET_V}'`
  );

  // 回帰禁止: defer 付与・inline mount 復活（docs/notes/CHROME_HEADER_GUARDRAILS.md）
  if (/sugudasu-shell\.js[^"]*"\s+defer/.test(out)) {
    throw new Error('rewriteHtml: sugudasu-shell.js に defer を付けてはいけません');
  }
  if (/<script[^>]*defer[^>]*>[\s\S]*?SUGUDASU_SHELL\.mount/.test(out)) {
    throw new Error('rewriteHtml: SUGUDASU_SHELL.mount に defer を付けてはいけません');
  }
  out = out.replace(/<script defer>\s*\nSUGUDASU_SHELL\.mount/g, '<script>\nSUGUDASU_SHELL.mount');
  out = out.replace(/\n\s*SUGUDASU_SHELL\.mount\(\{[^}]+\}\);\s*/g, '\n');
  out = out.replace(/\n<script>\s*SUGUDASU_SHELL\.mount\(\{[^}]+\}\);\s*<\/script>\s*/g, '\n');

  return out;
}

function bustJsImports() {
  const distAssets = path.join(DIST, 'assets');
  const moduleFiles = ['sns-app.js', 'font-converter-app.js', 'sns-font-engine.js', 'unicode-math-alpha.js'];
  for (const name of moduleFiles) {
    const p = path.join(distAssets, name);
    if (!fs.existsSync(p)) continue;
    let src = fs.readFileSync(p, 'utf8');
    src = src.replace(/from '\.\/([^']+\.js)'/g, (match, dep) => {
      if (BUST_ASSET_NAMES.includes(dep)) return `from './${dep}?v=${ASSET_V}'`;
      return match;
    });
    fs.writeFileSync(p, src, 'utf8');
  }
}

function prepareDist() {
  try {
    rmrf(DIST);
  } catch (err) {
    if (err && err.code === 'EPERM') {
      console.warn('build:pages — dist is locked; syncing in place');
    } else {
      throw err;
    }
  }
  fs.mkdirSync(DIST, { recursive: true });
}

prepareDist();
compileTailwind();
ASSET_V = computeAssetVersion();
console.log(`  asset cache-bust: ?v=${ASSET_V}`);
copyDir(ASSETS, path.join(DIST, 'assets'));
bustJsImports();

const faviconSrc = path.join(ASSETS, 'favicon.png');
if (fs.existsSync(faviconSrc)) {
  fs.copyFileSync(faviconSrc, path.join(DIST, 'favicon.png'));
}

const htmlFiles = fs.readdirSync(TOOLS).filter((f) => f.endsWith('.html'));
for (const file of htmlFiles) {
  const raw = fs.readFileSync(path.join(TOOLS, file), 'utf8');
  fs.writeFileSync(path.join(DIST, file), rewriteHtml(raw), 'utf8');
}

// ポータルは dist/index.html（/）。請求書は invoice.html（上書きしない）。
const hub = fs.readFileSync(path.join(DIST, 'hub.html'), 'utf8');
fs.writeFileSync(path.join(DIST, 'index.html'), hub, 'utf8');

// AdSense 審査向け ads.txt を公開ルートへ配置
if (fs.existsSync(ADS_TXT)) {
  fs.copyFileSync(ADS_TXT, path.join(DIST, 'ads.txt'));
}

// 更新履歴 SSOT → dist/data/（JSON のみ · PNG 等は press/ へ）
const DATA_DIR = path.join(ROOT, 'data');
const DIST_DATA = path.join(DIST, 'data');
if (fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DIST_DATA, { recursive: true });
  for (const name of fs.readdirSync(DATA_DIR)) {
    if (!name.endsWith('.json') && !name.endsWith('.tsv')) continue;
    const src = path.join(DATA_DIR, name);
    if (fs.statSync(src).isFile()) {
      fs.copyFileSync(src, path.join(DIST_DATA, name));
    }
  }
}

const lastmod = readChangelogLastmod();
writeCleanUrlDirs(htmlFiles);
writeSitemapAndRobots(htmlFiles, lastmod);
writeRedirects(htmlFiles);
writeHeaders();

const count = htmlFiles.length;
console.log(`build:pages OK — ${count} tools + index → ${DIST}`);
console.log(`  SEO: sitemap.xml (${lastmod}) · robots.txt · _redirects`);
console.log('  Preview: npm run preview:pages  (or cd dist && python -m http.server 8080)');

const verifyChrome = spawnSync(process.execPath, [path.join(__dirname, 'verify-chrome-mount.mjs')], {
  stdio: 'inherit',
});
if (verifyChrome.status !== 0) {
  process.exit(verifyChrome.status || 1);
}
