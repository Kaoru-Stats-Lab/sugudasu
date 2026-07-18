#!/usr/bin/env node
/**
 * Cloudflare Pages 向け静的ビルド
 * tools/*.html + assets/ → dist/ または dist-sync/（--target=sync）
 */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { execSync, spawnSync } from 'node:child_process';
import { stripNonLatin1Env } from '../assets/sync-supabase-sanitize.js';
import { injectAdsenseHead, loadAdsenseConfig } from './adsense-pages.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const TOOLS = path.join(ROOT, 'tools');
const ASSETS = path.join(ROOT, 'assets');
const ADS_TXT = path.join(ROOT, 'ads.txt');

/** @type {{ enabled: boolean, client: string } | null} */
let adsenseConfig = null;

function parseBuildTarget() {
  const arg = process.argv.find((a) => a.startsWith('--target='));
  const raw = arg ? arg.slice('--target='.length) : process.env.SUGUDASU_PAGES_TARGET || 'core';
  if (raw !== 'core' && raw !== 'sync') {
    throw new Error(`build-pages: unknown target "${raw}" (core | sync)`);
  }
  return raw;
}

const BUILD_TARGET = parseBuildTarget();
const IS_SYNC = BUILD_TARGET === 'sync';
const DIST = path.join(ROOT, IS_SYNC ? 'dist-sync' : 'dist');
const SITE_ORIGIN = IS_SYNC ? 'https://sync.sugudasu.com' : 'https://sugudasu.com';

process.env.SUGUDASU_DIST = DIST;

/** sitemap 対象外（内部プレビュー・index と重複する hub / sync-index） */
const SITEMAP_SKIP = new Set(
  IS_SYNC ? ['sync-index.html', 'sync-timeline.html', 'sync-room.html'] : ['brand-logo-preview.html', 'hub.html', 'paper-schedule-research.html']
);

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
  if (IS_SYNC) {
    if (file === 'sync-index.html') return '/';
    if (file === 'sync-timeline-lp.html') return '/timeline';
    if (file === 'sync-timeline.html') return null;
    const slug = file.replace(/^sync-/, '').replace(/\.html$/, '');
    return slug === 'index' ? '/' : `/${slug}`;
  }
  if (file.startsWith('category/')) {
    return `/${file.replace(/\.html$/, '')}`;
  }
  const slug = file.replace(/\.html$/, '');
  return slug === 'hub' ? '/' : `/${slug}`;
}

function sitemapPriority(pathname) {
  if (pathname === '/') return '1.0';
  if (pathname === '/guides') return '0.85';
  if (pathname.startsWith('/guides/')) return '0.75';
  if (pathname.startsWith('/category/')) return '0.6';
  if (pathname === '/invoice' || pathname === '/receipt' || pathname === '/stamp') return '0.9';
  if (pathname === '/updates') return '0.7';
  if (pathname === '/roadmap') return '0.68';
  if (pathname === '/privacy' || pathname === '/terms' || pathname === '/disclaimer' || pathname === '/statements') return '0.5';
  return '0.8';
}

function writeSitemapAndRobots(htmlFiles, lastmod, guideSlugs = [], categoryIds = []) {
  const paths = [...new Set([
    '/',
    '/guides',
    ...guideSlugs.map((s) => `/guides/${s}`),
    ...categoryIds.map((id) => `/category/${id}`),
    ...htmlFiles
      .filter((f) => !SITEMAP_SKIP.has(f))
      .map((f) => canonicalPathFromHtml(f))
      .filter((p) => p && p !== '/' && p !== '/guides'),
  ])];

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

  // DECISION: /data/* は内部 JSON（fetch 可）· 検索インデックス対象外。ファイル増えてもパス単位で一括除外。
  const robots = [
    'User-agent: *',
    'Allow: /',
    'Disallow: /data/',
    '',
    `Sitemap: ${SITE_ORIGIN}/sitemap.xml`,
    '',
  ].join('\n');
  fs.writeFileSync(path.join(DIST, 'robots.txt'), robots, 'utf8');
}

function writeRedirects(htmlFiles, guideSlugs = [], categoryIds = []) {
  const lines = IS_SYNC
    ? [
        '# SUGUDASU Sync — clean paths',
        '/sync-index.html / 301',
        '/sync-timeline-lp.html /timeline 301',
        '/sync-timeline.html /timeline/app 301',
      ]
    : [
        '# Canonical: apex / · clean paths without .html',
        '/hub.html / 301',
        '/hub / 301',
      ];

  if (!IS_SYNC) {
    for (const file of htmlFiles) {
      if (file === 'hub.html') continue;
      const slug = file.replace(/\.html$/, '');
      lines.push(`/${file} /${slug} 301`);
    }
    lines.push('/imgconv /webp-to-jpg 301');
    lines.push('/webp-to-png /webp-to-jpg 301');
    lines.push('/guides.html /guides 301');
    for (const slug of guideSlugs) {
      lines.push(`/guides/${slug}.html /guides/${slug} 301`);
    }
    for (const id of categoryIds) {
      lines.push(`/category/${id}.html /category/${id} 301`);
    }
  } else {
    for (const file of htmlFiles) {
      if (file === 'sync-index.html' || file === 'sync-timeline-lp.html' || file === 'sync-timeline.html') {
        continue;
      }
      const slug = file.replace(/^sync-/, '').replace(/\.html$/, '');
      lines.push(`/${file} /${slug} 301`);
    }
  }

  fs.writeFileSync(path.join(DIST, '_redirects'), `${lines.join('\n')}\n`, 'utf8');
}

/** /category/{id} — Hub と同カード見た目 · BreadcrumbList のみ（既存ツール JSON-LD は触らない） */
function writeCategoryPages() {
  if (IS_SYNC) return [];
  const catDoc = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/categories.json'), 'utf8'));
  const registry = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/tool-registry.json'), 'utf8'));
  const hubCards = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/hub-cards.json'), 'utf8'));
  const ids = [];

  function esc(s) {
    return String(s || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  for (const cat of catDoc.categories || []) {
    ids.push(cat.id);
    const cards = (hubCards.cards || []).filter((c) => {
      const t = registry.tools[c.toolId];
      return t && t.categoryId === cat.id;
    });
    const cardHtml = cards
      .map((card) => {
        const tool = registry.tools[card.toolId];
        const title = tool.conceptName || tool.navLabel || card.toolId;
        const href = card.href;
        const parts = [
          `<a href="${esc(href)}" class="sg-hub-card sg-card p-5" data-tool-id="${esc(card.toolId)}">`,
        ];
        if (card.eyebrow) parts.push(`<p class="sg-hub-card__eyebrow">${esc(card.eyebrow)}</p>`);
        parts.push(`<h3 class="sg-hub-card__title">${esc(title)}</h3>`);
        parts.push(`<p class="text-xs text-slate-500 mt-2">${esc(card.blurb)}</p>`);
        if (card.meta) parts.push(`<p class="sg-hub-card__meta">${esc(card.meta)}</p>`);
        parts.push('</a>');
        return parts.join('\n            ');
      })
      .join('\n            ');

    const breadcrumbLd = {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'SUGUDASU', item: `${SITE_ORIGIN}/` },
        {
          '@type': 'ListItem',
          position: 2,
          name: cat.label,
          item: `${SITE_ORIGIN}/category/${cat.id}`,
        },
      ],
    };

    const html = `<!DOCTYPE html>
<html lang="ja">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="description" content="${esc(cat.description)}">
    <title>${esc(cat.label)} | SUGUDASU</title>
    <link rel="canonical" href="${SITE_ORIGIN}/category/${esc(cat.id)}">
    <script type="application/ld+json">${JSON.stringify(breadcrumbLd)}</script>
    <script src="https://cdn.jsdelivr.net/npm/@tailwindcss/browser@4"><\/script>
    <link rel="stylesheet" href="../assets/sugudasu.css">
</head>
<body class="sg-body min-h-screen flex flex-col antialiased">
<div id="sg-chrome-top" data-sg-title="${esc(cat.label)}" data-sg-tool-id="hub"></div>
<main class="sg-main-shell sg-main-shell--wide flex-1 space-y-6">
    <nav class="text-xs text-slate-500" aria-label="パンくず">
        <a href="/hub.html" class="text-blue-600 hover:underline">一覧</a>
        <span class="mx-1">/</span>
        <span>${esc(cat.label)}</span>
    </nav>
    <header class="space-y-2">
        <h1 class="text-xl font-semibold text-slate-900">${esc(cat.label)}</h1>
        <p class="text-sm text-slate-600">${esc(cat.description)}</p>
    </header>
    <section class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4" aria-label="${esc(cat.label)}のツール">
            ${cardHtml}
    </section>
    <aside class="no-print ad-slot ad-slot--result max-w-2xl">広告枠</aside>
</main>
<div id="sg-chrome-bottom"></div>
<script src="../assets/sugudasu-shell.js"><\/script>
</body>
</html>
`;
    const dir = path.join(DIST, 'category', cat.id);
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, 'index.html'), rewriteHtml(html, `category/${cat.id}.html`), 'utf8');
  }
  console.log(`  category pages: ${ids.length}`);
  return ids;
}

/** /{slug} を python http.server 等でも配信できるよう {slug}/index.html を複製 */
function writeCleanUrlDirs(htmlFiles) {
  for (const file of htmlFiles) {
    if (file === 'hub.html' || file === 'sync-index.html') continue;
    if (IS_SYNC && (file === 'sync-timeline-lp.html' || file === 'sync-timeline.html')) continue;
    const slug = IS_SYNC
      ? file.replace(/^sync-/, '').replace(/\.html$/, '')
      : file.replace(/\.html$/, '');
    const src = path.join(DIST, file);
    const dir = path.join(DIST, slug);
    fs.mkdirSync(dir, { recursive: true });
    fs.copyFileSync(src, path.join(dir, 'index.html'));
  }
}

function writeHeaders() {
  const syncRoomHeaders = IS_SYNC
    ? [
        '/room',
        '  Cache-Control: no-store',
        '',
        '/room/*',
        '  Cache-Control: no-store',
        '',
      ]
    : [];
  const headers = [
    ...syncRoomHeaders,
    '/assets/*',
    '  Cache-Control: public, max-age=31536000, immutable',
    '',
    '/data/*',
    '  Cache-Control: public, max-age=3600',
    '  X-Robots-Tag: noindex, nofollow',
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
    '/ads.txt',
    '  Content-Type: text/plain; charset=utf-8',
    '  Cache-Control: public, max-age=3600',
    '',
    '/*/app/*',
    '  X-Robots-Tag: noindex, nofollow',
    '',
    '/e/*',
    '  X-Robots-Tag: noindex, nofollow',
    '',
  ].join('\n');
  fs.writeFileSync(path.join(DIST, '_headers'), headers, 'utf8');
}

function loadEnvSyncLocal() {
  const envPath = path.join(ROOT, '.env.sync.local');
  if (!fs.existsSync(envPath)) return;
  for (const line of fs.readFileSync(envPath, 'utf8').split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq < 0) continue;
    const key = trimmed.slice(0, eq).trim();
    let val = trimmed.slice(eq + 1).trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    // .env.sync.local はローカル正本 — シェルに残った古いプレースホルダーを上書きする
    process.env[key] = val;
  }
}

function assertValidSyncSupabaseEnv(url, anon, anonRaw = '') {
  if (!url && !anon) return;
  const problems = [];
  if (!url.includes('.supabase.co')) {
    problems.push('SYNC_SUPABASE_URL が Supabase URL 形式ではありません');
  }
  if (!anon.startsWith('eyJ')) {
    problems.push(
      'SYNC_SUPABASE_ANON_KEY が JWT (eyJ...) ではありません — プレースホルダー文を貼っていないか確認'
    );
  }
  if (/[\u3000-\u9fff\uff00-\uffef]/.test(anon) || /[\u3000-\u9fff\uff00-\uffef]/.test(url)) {
    problems.push('環境変数に日本語・全角が含まれています（実キーのみ貼り付け）');
  }
  if (problems.length) {
    console.error('\n[sync-build] FAIL: Sync Supabase 環境変数が不正です');
    for (const p of problems) console.error(`  - ${p}`);
    if (anonRaw && !String(anonRaw).trim().replace(/^\uFEFF/, '').startsWith('eyJ')) {
      console.error(
        '  - ヒント: PowerShell に古い値が残っている場合 → Remove-Item Env:SYNC_SUPABASE_ANON_KEY -ErrorAction SilentlyContinue'
      );
    }
    console.error('  正本: docs/notes/SYNC_ENV_KEYS.md · .env.sync.local または CF Pages env\n');
    process.exit(1);
  }
}

function writeSyncPublicConfig(distDataDir) {
  const urlRaw = process.env.SYNC_SUPABASE_URL || '';
  const anonRaw = process.env.SYNC_SUPABASE_ANON_KEY || '';
  const url = stripNonLatin1Env(urlRaw);
  const anon = stripNonLatin1Env(anonRaw);
  if (url.length !== urlRaw.trim().replace(/^\uFEFF/, '').length || anon.length !== anonRaw.trim().replace(/^\uFEFF/, '').length) {
    console.warn('[sync-build] SYNC_SUPABASE_* から非ASCII文字を除去 — Cloudflare 環境変数を再貼り付け推奨');
  }
  assertValidSyncSupabaseEnv(url, anon, anonRaw);
  const body = {
    supabaseUrl: url,
    supabaseAnonKey: anon,
    configured: Boolean(url && anon),
  };
  fs.mkdirSync(distDataDir, { recursive: true });
  fs.writeFileSync(
    path.join(distDataDir, 'sync-public-config.json'),
    `${JSON.stringify(body, null, 2)}\n`,
    'utf8'
  );
  if (!body.configured) {
    console.warn('build:pages (sync) — SYNC_SUPABASE_* 未設定 · ログイン UI はセットアップ表示');
  }
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
  'hub-ia.js',
  'sugudasu.css',
  'sugudasu-segment.js',
  'tw-build.css',
  'sns-app.js',
  'sns-font-engine.js',
  'font-converter-app.js',
  'stamp-app.js',
  'stamp-engine.js',
  'stamp-handoff.js',
  'test-data-handoff.js',
  'mask-app.js',
  'mask-engine.js',
  'test-data-app.js',
  'test-data-engine.js',
  'unicode-math-alpha.js',
  'sg-copy-feedback.js',
  'sg-copy-disclosure.js',
  'sg-paste-scan.js',
  'sg-form-validate.js',
  'link-qr-engine.js',
  'text-normalize.js',
  'webp-to-jpg.js',
  'group-split.js',
  'group-split-columns.js',
  'group-split-constraint-form.js',
  'prize-law-eval.js',
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

/**
 * ビルド時の自己参照 canonical URL（クエリなし · apex）
 * @param {string} file
 * @param {{ guide?: boolean }} [opts]
 * @returns {string | null}
 */
function absoluteCanonicalUrl(file, opts = {}) {
  if (opts.guide) {
    const slug = file.replace(/\.html$/, '');
    return `${SITE_ORIGIN}/guides/${slug}`;
  }
  const pathname = canonicalPathFromHtml(file);
  if (!pathname) return null;
  return pathname === '/' ? `${SITE_ORIGIN}/` : `${SITE_ORIGIN}${pathname}`;
}

/**
 * DECISION: canonical / og:url は手書きドリフトを許さずビルドが正本にする。
 * 新規 tools/{id}.html 追加時も SEO 手作業を増やさない（?tab= 等のクエリ重複もここで統合）。
 * @param {string} html
 * @param {string} file
 * @param {{ guide?: boolean }} [opts]
 */
function applySeoCanonical(html, file, opts = {}) {
  const url = absoluteCanonicalUrl(file, opts);
  if (!url) return html;
  let out = html;
  out = out.replace(/\s*<link\s+rel=["']canonical["']\s+href=["'][^"']*["']\s*\/?>/gi, '');
  if (/property=["']og:url["']/i.test(out)) {
    out = out.replace(
      /<meta\s+property=["']og:url["']\s+content=["'][^"']*["']\s*\/?>/i,
      `<meta property="og:url" content="${url}">`
    );
    out = out.replace(
      /(<meta\s+property=["']og:url["']\s+content=["'][^"']*["']\s*\/?>)/i,
      `$1\n    <link rel="canonical" href="${url}">`
    );
  } else {
    out = out.replace(/<\/head>/i, `    <link rel="canonical" href="${url}">\n</head>`);
  }
  return out;
}

/**
 * 相対 *.html をクリーン URL（/slug）へ。
 * DECISION: /guides/ や誤パス配下で相対 invoice.html → /guides/invoice.html になり、
 * 未知URLが index に落ちると「トップから遷移しない」ように見える（再発防止）。
 */
function rewriteInternalHtmlHrefs(html) {
  return html.replace(
    /href=(["'])(?!https?:|\/\/|mailto:|tel:|#|\/)([^"']+?\.html)(\?[^"']*)?\1/gi,
    (match, quote, path, qs = '') => {
      const clean = String(path).replace(/^\.\//, '');
      if (clean.includes('..')) return match;
      const noExt = clean.replace(/\.html$/i, '');
      if (!noExt || noExt === 'hub' || noExt === 'index') {
        return `href=${quote}/${qs || ''}${quote}`;
      }
      return `href=${quote}/${noExt}${qs || ''}${quote}`;
    }
  );
}

/**
 * @param {string} html
 * @param {string} [file] tools 相対ファイル名（SEO 注入用）
 * @param {{ guide?: boolean }} [opts]
 */
function rewriteHtml(html, file = '', opts = {}) {
  let out = html
    .replace(/\.\.\/\.\.\/assets\//g, '/assets/')
    .replace(/\.\.\/\.\.\/data\//g, '/data/')
    .replace(/\.\.\/assets\//g, '/assets/')
    .replace(/\.\.\/data\//g, '/data/')
    .replace(/href="assets\//g, 'href="/assets/')
    .replace(/src="assets\//g, 'src="/assets/');

  out = rewriteInternalHtmlHrefs(out);
  out = out.replace(
    /<script src="https:\/\/cdn\.jsdelivr\.net\/npm\/@tailwindcss\/browser@4"><\/script>\s*/g,
    ''
  );

  if (!out.includes('Montserrat:wght@800')) {
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
    /src="\/assets\/(font-converter-app|sns-page|stamp-app)\.js"/g,
    `src="/assets/$1.js?v=${ASSET_V}"`
  );

  // ツール <script type="module"> の import — /assets/* は immutable 1年のため必須
  out = out.replace(
    /from (['"])\/assets\/([^"'?]+\.js)\1/g,
    (match, quote, assetFile) => `from ${quote}/assets/${assetFile}?v=${ASSET_V}${quote}`
  );

  // ツール module 入口（mask-app 等）— /assets/* は immutable 1年のため必須
  out = out.replace(/src="\/assets\/([^"?]+\.js)"/g, `src="/assets/$1?v=${ASSET_V}"`);

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

  out = injectAdsenseHead(out, adsenseConfig);

  if (file) {
    out = applySeoCanonical(out, file, opts);
  }

  return out;
}

/** tools/guides/*.html → dist/guides/{slug}/index.html */
function writeGuidePages() {
  const guidesDir = path.join(TOOLS, 'guides');
  if (IS_SYNC || !fs.existsSync(guidesDir)) return [];
  const slugs = [];
  const guideFiles = fs.readdirSync(guidesDir).filter((f) => f.endsWith('.html'));
  const distGuides = path.join(DIST, 'guides');
  fs.mkdirSync(distGuides, { recursive: true });
  for (const file of guideFiles) {
    const slug = file.replace(/\.html$/, '');
    slugs.push(slug);
    const raw = fs.readFileSync(path.join(guidesDir, file), 'utf8');
    const out = rewriteHtml(raw, file, { guide: true });
    fs.writeFileSync(path.join(distGuides, file), out, 'utf8');
    const slugDir = path.join(distGuides, slug);
    fs.mkdirSync(slugDir, { recursive: true });
    fs.copyFileSync(path.join(distGuides, file), path.join(slugDir, 'index.html'));
  }
  return slugs;
}

function bustJsImports() {
  const distAssets = path.join(DIST, 'assets');
  const moduleFiles = fs.readdirSync(distAssets).filter((name) => name.endsWith('-app.js'));
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
adsenseConfig = loadAdsenseConfig(IS_SYNC);
if (adsenseConfig) {
  console.log(`build:pages — AdSense auto ads (${adsenseConfig.client}) · core only`);
}
compileTailwind();
ASSET_V = computeAssetVersion();
console.log(`  asset cache-bust: ?v=${ASSET_V}`);
copyDir(ASSETS, path.join(DIST, 'assets'));
bustJsImports();

const faviconSrc = path.join(ASSETS, 'favicon.png');
if (fs.existsSync(faviconSrc)) {
  fs.copyFileSync(faviconSrc, path.join(DIST, 'favicon.png'));
}

const htmlFiles = fs
  .readdirSync(TOOLS)
  .filter((f) => f.endsWith('.html'))
  .filter((f) => (IS_SYNC ? f.startsWith('sync-') : !f.startsWith('sync-')));
for (const file of htmlFiles) {
  const raw = fs.readFileSync(path.join(TOOLS, file), 'utf8');
  fs.writeFileSync(path.join(DIST, file), rewriteHtml(raw, file), 'utf8');
}

if (IS_SYNC) {
  const syncIndex = fs.readFileSync(path.join(DIST, 'sync-index.html'), 'utf8');
  fs.writeFileSync(path.join(DIST, 'index.html'), syncIndex, 'utf8');
  const lpSrc = path.join(DIST, 'sync-timeline-lp.html');
  const appSrc = path.join(DIST, 'sync-timeline.html');
  if (fs.existsSync(lpSrc)) {
    const timelineDir = path.join(DIST, 'timeline');
    fs.mkdirSync(timelineDir, { recursive: true });
    fs.copyFileSync(lpSrc, path.join(DIST, 'timeline.html'));
    fs.copyFileSync(lpSrc, path.join(timelineDir, 'index.html'));
  }
  if (fs.existsSync(appSrc)) {
    const appDir = path.join(DIST, 'timeline', 'app');
    fs.mkdirSync(appDir, { recursive: true });
    fs.copyFileSync(appSrc, path.join(appDir, 'index.html'));
  }
} else {
  const hub = fs.readFileSync(path.join(DIST, 'hub.html'), 'utf8');
  fs.writeFileSync(path.join(DIST, 'index.html'), hub, 'utf8');
}

if (!IS_SYNC && fs.existsSync(ADS_TXT)) {
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

if (IS_SYNC) {
  loadEnvSyncLocal();
  writeSyncPublicConfig(DIST_DATA);
}

const guideSlugs = writeGuidePages();
const categoryIds = writeCategoryPages();

const lastmod = readChangelogLastmod();
writeCleanUrlDirs(htmlFiles);
writeSitemapAndRobots(htmlFiles, lastmod, guideSlugs, categoryIds);
writeRedirects(htmlFiles, guideSlugs, categoryIds);
writeHeaders();

const count = htmlFiles.length;
const label = IS_SYNC ? 'Sync' : `${count} tools + index`;
{
  const robotsTxt = fs.readFileSync(path.join(DIST, 'robots.txt'), 'utf8');
  if (!robotsTxt.includes('Disallow: /data/')) {
    throw new Error('build-pages: robots.txt に Disallow: /data/ がありません');
  }
  const headersTxt = fs.readFileSync(path.join(DIST, '_headers'), 'utf8');
  if (!/\/data\/\*[\s\S]*?X-Robots-Tag:\s*noindex/.test(headersTxt)) {
    throw new Error('build-pages: _headers の /data/* に X-Robots-Tag: noindex がありません');
  }
}

console.log(`build:pages OK (${BUILD_TARGET}) — ${label} → ${DIST}`);
console.log(`  SEO: sitemap.xml (${lastmod}) · robots.txt · _redirects · canonical inject`);
if (IS_SYNC) {
  console.log('  Preview: npm run preview:pages:sync');
} else {
  console.log('  Preview: npm run preview:pages  (or cd dist && python -m http.server 8080)');
}

const verifyChrome = spawnSync(process.execPath, [path.join(__dirname, 'verify-chrome-mount.mjs')], {
  stdio: 'inherit',
});
if (verifyChrome.status !== 0) {
  process.exit(verifyChrome.status || 1);
}

const verifyAdsense = spawnSync(
  process.execPath,
  [path.join(__dirname, 'verify-adsense-pages.mjs'), `--target=${BUILD_TARGET}`],
  { stdio: 'inherit', env: { ...process.env, SUGUDASU_DIST: DIST } }
);
if (verifyAdsense.status !== 0) {
  process.exit(verifyAdsense.status || 1);
}
