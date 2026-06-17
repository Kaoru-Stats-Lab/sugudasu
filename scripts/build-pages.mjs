#!/usr/bin/env node
/**
 * Cloudflare Pages 向け静的ビルド
 * tools/*.html + assets/ → dist/（パスを /assets/ に正規化）
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const TOOLS = path.join(ROOT, 'tools');
const ASSETS = path.join(ROOT, 'assets');
const DIST = path.join(ROOT, 'dist');
const ADS_TXT = path.join(ROOT, 'ads.txt');

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

function rewriteHtml(html) {
  return html
    .replace(/\.\.\/assets\//g, '/assets/')
    .replace(/href="assets\//g, 'href="/assets/')
    .replace(/src="assets\//g, 'src="/assets/');
}

rmrf(DIST);
fs.mkdirSync(DIST, { recursive: true });
copyDir(ASSETS, path.join(DIST, 'assets'));

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

// 更新履歴 SSOT → dist/data/
const DATA_DIR = path.join(ROOT, 'data');
const DIST_DATA = path.join(DIST, 'data');
if (fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DIST_DATA, { recursive: true });
  for (const name of fs.readdirSync(DATA_DIR)) {
    const src = path.join(DATA_DIR, name);
    if (fs.statSync(src).isFile()) {
      fs.copyFileSync(src, path.join(DIST_DATA, name));
    }
  }
}

const count = htmlFiles.length;
console.log(`build:pages OK — ${count} tools + index → ${DIST}`);
console.log('  Preview: cd dist && python -m http.server 8080');
