#!/usr/bin/env node
/**
 * OGP / Twitter Card 必須タグ検証 — note・SNS リンクプレビュー欠落の再発防止
 * 対象: tools/*.html（SSOT）· assets/og-card.png
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const TOOLS_DIR = path.join(ROOT, 'tools');
const OG_IMAGE = 'https://sugudasu.com/assets/og-card.png';
const SITE_ORIGIN = 'https://sugudasu.com';

/** 内部プレビュー · Sync ライン · sitemap 除外（build-pages SITEMAP_SKIP と同期） */
const SKIP_HTML = new Set(['brand-logo-preview.html', 'sync-index.html', 'sync-timeline.html']);

const REQUIRED_META = [
  { re: /<meta\s+name="description"\s+content="[^"]+"/, label: 'meta description' },
  { re: /<meta\s+property="og:type"\s+content="[^"]+"/, label: 'og:type' },
  { re: /<meta\s+property="og:site_name"\s+content="[^"]+"/, label: 'og:site_name' },
  { re: /<meta\s+property="og:title"\s+content="[^"]+"/, label: 'og:title' },
  { re: /<meta\s+property="og:description"\s+content="[^"]+"/, label: 'og:description' },
  { re: /<meta\s+property="og:url"\s+content="[^"]+"/, label: 'og:url' },
  {
    re: new RegExp(`<meta\\s+property="og:image"\\s+content="${OG_IMAGE.replace(/\//g, '\\/')}"`),
    label: `og:image (${OG_IMAGE})`,
  },
  { re: /<meta\s+name="twitter:card"\s+content="summary_large_image"/, label: 'twitter:card' },
  {
    re: new RegExp(`<meta\\s+name="twitter:image"\\s+content="${OG_IMAGE.replace(/\//g, '\\/')}"`),
    label: `twitter:image (${OG_IMAGE})`,
  },
];

const WARN_META = [
  { re: /<meta\s+property="og:image:width"\s+content="1200"/, label: 'og:image:width' },
  { re: /<meta\s+property="og:image:height"\s+content="630"/, label: 'og:image:height' },
  { re: /<meta\s+name="twitter:title"\s+content="[^"]+"/, label: 'twitter:title' },
  { re: /<meta\s+name="twitter:description"\s+content="[^"]+"/, label: 'twitter:description' },
];

function fail(msg) {
  console.error(`[ogp-guard] FAIL: ${msg}`);
  process.exit(1);
}

function warn(msg) {
  console.warn(`[ogp-guard] WARN: ${msg}`);
}

function canonicalOgUrl(file) {
  const slug = file.replace(/\.html$/, '');
  return slug === 'hub' ? `${SITE_ORIGIN}/` : `${SITE_ORIGIN}/${slug}`;
}

function extractMetaContent(html, prop, isName = false) {
  const attr = isName ? 'name' : 'property';
  const re = new RegExp(`<meta\\s+${attr}="${prop}"\\s+content="([^"]*)"`, 'i');
  return html.match(re)?.[1] ?? null;
}

function verifyFile(file) {
  const html = fs.readFileSync(path.join(TOOLS_DIR, file), 'utf8');

  for (const { re, label } of REQUIRED_META) {
    if (!re.test(html)) {
      fail(`${file}: 必須タグがありません — ${label}`);
    }
  }

  const ogUrl = extractMetaContent(html, 'og:url');
  const expected = canonicalOgUrl(file);
  if (ogUrl && ogUrl !== expected && ogUrl !== `${expected.slice(0, -1)}.html` && ogUrl !== `${expected}.html`) {
    warn(`${file}: og:url が正本と不一致 — 実際=${ogUrl} · 推奨=${expected}`);
  } else if (ogUrl && ogUrl.includes('.html')) {
    warn(`${file}: og:url に .html 付き — 推奨=${expected}`);
  }

  for (const { re, label } of WARN_META) {
    if (!re.test(html)) {
      warn(`${file}: 推奨タグなし — ${label}`);
    }
  }

  if (/google\.com\/search\?q=/.test(html)) {
    fail(`${file}: Google 検索経由 URL が含まれています（x_guideline 違反）`);
  }
}

function verifyOgAsset() {
  const assetPath = path.join(ROOT, 'assets', 'og-card.png');
  if (!fs.existsSync(assetPath)) {
    fail('assets/og-card.png がありません（press/README.md 参照）');
  }
  const stat = fs.statSync(assetPath);
  if (stat.size < 1024) {
    fail('assets/og-card.png が小さすぎます（破損の可能性）');
  }
}

if (!fs.existsSync(TOOLS_DIR)) {
  fail('tools/ がありません');
}

verifyOgAsset();

const files = fs.readdirSync(TOOLS_DIR).filter((f) => f.endsWith('.html')).sort();
let checked = 0;
for (const file of files) {
  if (SKIP_HTML.has(file)) continue;
  verifyFile(file);
  checked += 1;
}

console.log(`[ogp-guard] OK: ${checked} pages · og-card.png present`);
