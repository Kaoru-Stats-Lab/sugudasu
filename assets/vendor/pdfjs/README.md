# pdfjs-dist (vendored browser ESM)

Pinned version: **5.4.296**

Source: `node_modules/pdfjs-dist` (`npm install pdfjs-dist@5.4.296`)

## Files

| File | Source |
|------|--------|
| `pdf.mjs` | `node_modules/pdfjs-dist/build/pdf.mjs` |
| `pdf.worker.mjs` | `node_modules/pdfjs-dist/build/pdf.worker.mjs` |
| `wasm/*` | `node_modules/pdfjs-dist/wasm/` |

## Browser usage

```js
import * as pdfjsLib from "/assets/vendor/pdfjs/pdf.mjs";

pdfjsLib.GlobalWorkerOptions.workerSrc = "/assets/vendor/pdfjs/pdf.worker.mjs";

// Optional but recommended for JPX (OpenJPEG) + color management (qcms):
const loadingTask = pdfjsLib.getDocument({
  url: pdfUrl,
  wasmUrl: "/assets/vendor/pdfjs/wasm/",
});
```

## Wasm note

Version 5.4.296 ships `wasm/` (openjpeg.wasm, qcms_bg.wasm, fallback JS).
Pass `wasmUrl` pointing at this folder when you need JPEG2000 / ICC color paths.
Without `wasmUrl`, those code paths fail to load wasm; basic PDF rendering still works for many files.

Do not edit these files by hand — re-copy from `node_modules/pdfjs-dist` after upgrading the pin.
