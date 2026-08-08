/**
 * Copy Smart Diff core packages into assets/ for browser (no bundler).
 * Run before build:pages / locally after package changes.
 */
import {
  copyFileSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  rmSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const outCore = join(root, "assets", "smart-diff-core");
const outJszip = join(root, "assets", "vendor", "jszip");

const FILES = [
  ["packages/parser/docx.mjs", "parser/docx.mjs"],
  ["packages/parser/pdf.mjs", "parser/pdf.mjs"],
  ["packages/normalizer/to-slir.mjs", "normalizer/to-slir.mjs"],
  ["packages/normalizer/pdf-to-slir.mjs", "normalizer/pdf-to-slir.mjs"],
  ["packages/matcher/engine.mjs", "matcher/engine.mjs"],
  ["packages/delta/builder.mjs", "delta/builder.mjs"],
  ["packages/projection/builder.mjs", "projection/builder.mjs"],
];

function ensureDir(p) {
  mkdirSync(p, { recursive: true });
}

function rewriteDocx(src) {
  return src
    .replace(
      /import JSZip from ["']jszip["'];\s*/,
      `import { loadJSZip } from "../../vendor/jszip/load.mjs";\n`
    )
    .replace(
      /export async function parseDocx\(([^)]*)\) \{/,
      `export async function parseDocx($1) {\n  const JSZip = opts?.JSZip || (await loadJSZip());`
    );
}

function rewritePdf(src) {
  // Keep parsePdfWithLib; Node parsePdf stays but unused in browser.
  return src;
}

rmSync(outCore, { recursive: true, force: true });
ensureDir(outCore);
ensureDir(outJszip);

for (const [fromRel, toRel] of FILES) {
  const from = join(root, fromRel);
  const to = join(outCore, toRel);
  ensureDir(dirname(to));
  let src = readFileSync(from, "utf8");
  if (toRel.endsWith("parser/docx.mjs")) src = rewriteDocx(src);
  if (toRel.endsWith("parser/pdf.mjs")) src = rewritePdf(src);
  writeFileSync(to, src, "utf8");
}

copyFileSync(
  join(root, "node_modules", "jszip", "dist", "jszip.min.js"),
  join(outJszip, "jszip.min.js")
);

writeFileSync(
  join(outJszip, "load.mjs"),
  `/** Load JSZip UMD once for browser modules. */
let cache = null;

export async function loadJSZip() {
  if (cache) return cache;
  if (globalThis.JSZip) {
    cache = globalThis.JSZip;
    return cache;
  }
  await new Promise((resolve, reject) => {
    const s = document.createElement("script");
    s.src = new URL("./jszip.min.js", import.meta.url).href;
    s.async = true;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error("JSZip failed to load"));
    document.head.appendChild(s);
  });
  if (!globalThis.JSZip) throw new Error("JSZip global missing after load");
  cache = globalThis.JSZip;
  return cache;
}
`,
  "utf8"
);

console.log(
  `[prepare-smart-diff-browser] OK: ${FILES.length} modules → assets/smart-diff-core + jszip`
);
