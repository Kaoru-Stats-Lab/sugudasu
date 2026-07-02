---
name: crop-principle-icons
description: Crops SUGUDASU principle icons to remove NanoBanana watermark corners and excessive margins, normalizing them to 256x256. Use when editing assets/icons/principles, updating statements principle icons, or when the user asks to crop icon whitespace/watermarks.
disable-model-invocation: true
---

# Crop Principle Icons

## Purpose

Prepare `assets/icons/principles/principle-*.png` for web use by removing corner watermark risk areas and excess whitespace, then normalizing output size.

## When to Use

- User generated/replaced principle icons via NanoBanana or Gemini
- Icons look too small due to excessive canvas whitespace
- Need consistent icon size for `tools/statements.html`

## Command

Run from repo root:

```bash
node scripts/crop-principle-icons.mjs
```

## What the script does

1. Center-crops each icon to 72% area (cuts watermark-prone corners)
2. Trims near-background margins
3. Adds uniform padding
4. Writes back as optimized `256x256` PNG

## Preconditions

- `sharp` is installed (already in `package.json`)
- Source files exist at `assets/icons/principles/principle-*.png`

## Verification Checklist

- [ ] Script outputs `done - 7 files`
- [ ] `tools/statements.html` shows all 7 icons aligned
- [ ] `npm run build:pages` passes
- [ ] `dist/assets/icons/principles/` contains cropped files

## Notes

- Do not run this against non-principle icon sets unless user asks.
- If the crop removes meaningful icon details, lower center-crop aggressiveness in the script and rerun.
