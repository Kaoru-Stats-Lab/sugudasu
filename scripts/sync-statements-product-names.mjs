#!/usr/bin/env node
/**
 * statements-product.json の productName / file を registry から埋める
 *   node scripts/sync-statements-product-names.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const REGISTRY = path.join(ROOT, 'data', 'tool-registry.json');
const PRODUCT = path.join(ROOT, 'data', 'statements-product.json');

const reg = JSON.parse(fs.readFileSync(REGISTRY, 'utf8'));
const prod = JSON.parse(fs.readFileSync(PRODUCT, 'utf8'));

prod.tools = prod.tools.map((t) => {
  const meta = reg.tools[t.toolId];
  if (!meta) throw new Error(`registry に無い: ${t.toolId}`);
  return {
    toolId: t.toolId,
    categoryId: t.categoryId,
    productName: meta.productName,
    file: meta.file,
    inputHandling: t.inputHandling,
    promiseNote: t.promiseNote,
  };
});

fs.writeFileSync(PRODUCT, `${JSON.stringify(prod, null, 2)}\n`, 'utf8');
console.log(`[sync-statements-product-names] OK: ${prod.tools.length} tools`);
