#!/usr/bin/env node
/**
 * favicon マスター（512px キャンバス）から各サイズを生成
 * 384px 版 → 16/32（タブ向け・余白多め）
 * 416px 版 → 48/180（ブックマーク・iOS）
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ASSETS = path.resolve(__dirname, '..', 'assets');

const MASTERS = {
  compact: path.join(ASSETS, 'favicon-master-384.png'),
  bold: path.join(ASSETS, 'favicon-master-416.png'),
};

async function resize(src, dest, size) {
  await sharp(src)
    .resize(size, size, { fit: 'contain', background: '#ffffff' })
    .png({ compressionLevel: 9 })
    .toFile(dest);
  console.log(`  ${path.basename(dest)} (${size}×${size}) ← ${path.basename(src)}`);
}

async function main() {
  for (const p of Object.values(MASTERS)) {
    if (!fs.existsSync(p)) {
      throw new Error(`マスターが見つかりません: ${p}`);
    }
  }

  console.log('generate:favicons');
  await resize(MASTERS.compact, path.join(ASSETS, 'favicon-16.png'), 16);
  await resize(MASTERS.compact, path.join(ASSETS, 'favicon-32.png'), 32);
  await resize(MASTERS.bold, path.join(ASSETS, 'favicon-48.png'), 48);
  await resize(MASTERS.bold, path.join(ASSETS, 'favicon.png'), 32);
  await resize(MASTERS.bold, path.join(ASSETS, 'apple-touch-icon.png'), 180);
  console.log('generate:favicons OK');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
