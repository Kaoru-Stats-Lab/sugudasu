/**
 * Crop SUGUDASU principle icons — WM corners + excess margin.
 * SSOT: docs/prompts/nanobanana-statements-principles-icons.md
 *
 * Run: node scripts/crop-principle-icons.mjs
 */
import sharp from 'sharp';
import { readdirSync } from 'fs';
import { join } from 'path';

const DIR = join(process.cwd(), 'assets/icons/principles');
const OUT_SIZE = 256;
/** Center crop ratio — removes NanoBanana WM in corners */
const CENTER_CROP_RATIO = 0.72;
/** trim near-background (#F1F5F9-ish) */
const TRIM_THRESHOLD = 14;
/** Uniform padding after trim (fraction of max side) */
const PAD_RATIO = 0.06;
const BG = { r: 241, g: 245, b: 249, alpha: 1 };

const files = readdirSync(DIR)
  .filter((f) => f.startsWith('principle-') && f.endsWith('.png'))
  .sort();

if (files.length === 0) {
  console.error('[crop-principle-icons] no principle-*.png in', DIR);
  process.exit(1);
}

for (const file of files) {
  const inputPath = join(DIR, file);
  const meta = await sharp(inputPath).metadata();
  const size = Math.min(meta.width, meta.height);
  const cropSize = Math.round(size * CENTER_CROP_RATIO);
  const offset = Math.round((size - cropSize) / 2);

  const cropped = await sharp(inputPath)
    .extract({ left: offset, top: offset, width: cropSize, height: cropSize })
    .toBuffer();

  const trimmed = await sharp(cropped)
    .trim({ threshold: TRIM_THRESHOLD })
    .toBuffer({ resolveWithObject: true });

  const maxSide = Math.max(trimmed.info.width, trimmed.info.height);
  const pad = Math.max(8, Math.round(maxSide * PAD_RATIO));

  await sharp(trimmed.data)
    .extend({
      top: pad,
      bottom: pad,
      left: pad,
      right: pad,
      background: BG,
    })
    .resize(OUT_SIZE, OUT_SIZE, { fit: 'contain', background: BG })
    .png({ compressionLevel: 9 })
    .toFile(inputPath);

  console.log(
    `[crop-principle-icons] OK ${file}: ${meta.width}×${meta.height} → trim ${trimmed.info.width}×${trimmed.info.height} → ${OUT_SIZE}×${OUT_SIZE}`,
  );
}

console.log(`[crop-principle-icons] done — ${files.length} files`);
