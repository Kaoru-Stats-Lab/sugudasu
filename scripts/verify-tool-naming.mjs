#!/usr/bin/env node
/**
 * ツール命名 3層の整合検証
 * docs/notes/TOOL_NAMING_AGENT_PLAYBOOK.md · docs/DESIGN_GUIDELINE.md §1.3
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const REGISTRY_PATH = path.join(ROOT, 'data', 'tool-registry.json');
const TOOLS_DIR = path.join(ROOT, 'tools');
const SHELL_PATH = path.join(ROOT, 'assets', 'sugudasu-shell.js');
const HUB_PATH = path.join(ROOT, 'tools', 'hub.html');

const SKIP_HTML = new Set(['brand-logo-preview.html', 'sync-index.html', 'sync-timeline.html']);

function fail(msg) {
  console.error(`[tool-naming-guard] FAIL: ${msg}`);
  process.exit(1);
}

function warn(msg) {
  console.warn(`[tool-naming-guard] WARN: ${msg}`);
}

function readChromeTop(html) {
  const m = html.match(/<div[^>]*id="sg-chrome-top"([^>]*)>/);
  if (!m) return null;
  const attrs = m[1];
  return {
    toolId: attrs.match(/data-sg-tool-id="([^"]*)"/)?.[1] ?? null,
    title: attrs.match(/data-sg-title="([^"]*)"/)?.[1] ?? null,
    subtitle: attrs.match(/data-sg-subtitle="([^"]*)"/)?.[1] ?? null,
  };
}

function parseShellTools(source) {
  const block = source.match(/const TOOLS = \[([\s\S]*?)\];/);
  if (!block) fail('sugudasu-shell.js: TOOLS 配列が見つかりません');
  const items = [];
  const re = /\{\s*id:\s*'([^']+)',\s*file:\s*'([^']+)',\s*label:\s*'([^']*)',\s*icon:\s*'([^']*)'\s*\}/g;
  let m;
  while ((m = re.exec(block[1])) !== null) {
    items.push({ id: m[1], file: m[2], label: m[3], icon: m[4] });
  }
  if (!items.length) fail('sugudasu-shell.js: TOOLS が空です');
  return items;
}

function loadRegistry() {
  if (!fs.existsSync(REGISTRY_PATH)) fail('data/tool-registry.json がありません');
  const registry = JSON.parse(fs.readFileSync(REGISTRY_PATH, 'utf8'));
  if (!registry.tools || typeof registry.tools !== 'object') {
    fail('tool-registry.json: tools オブジェクトがありません');
  }
  return registry;
}

function verifyRegistryFields(tools) {
  for (const [id, tool] of Object.entries(tools)) {
    if (id !== path.basename(tool.file || '', '.html') && tool.file) {
      warn(`${id}: registry キーと file ベース名が不一致 (${tool.file})`);
    }
    if (!tool.conceptName) fail(`${id}: conceptName がありません`);
    if (!tool.productName) fail(`${id}: productName がありません`);
    if (tool.inNav && !tool.navLabel) {
      fail(`${id}: inNav だが navLabel がありません`);
    }
    if (tool.inNav && tool.navOrder == null) {
      fail(`${id}: inNav だが navOrder がありません`);
    }
    const htmlPath = path.join(TOOLS_DIR, tool.file || `${id}.html`);
    if (!fs.existsSync(htmlPath) && !['brand-logo-preview'].includes(id)) {
      warn(`${id}: ${tool.file} が tools/ に存在しません`);
    }
  }
}

function verifyToolHtml(tools) {
  for (const [id, tool] of Object.entries(tools)) {
    const file = tool.file || `${id}.html`;
    if (SKIP_HTML.has(file)) continue;
    const htmlPath = path.join(TOOLS_DIR, file);
    if (!fs.existsSync(htmlPath)) continue;

    const html = fs.readFileSync(htmlPath, 'utf8');
    if (!html.includes('id="sg-chrome-top"')) continue;

    const chrome = readChromeTop(html);
    if (!chrome?.title) {
      fail(`${file}: data-sg-title がありません`);
    }

    const expectsToolId = tool.inNav || ['hub', 'updates', 'statements'].includes(id);
    if (expectsToolId && !chrome.toolId) {
      fail(`${file}: data-sg-tool-id="${id}" が必要です`);
    }
    if (chrome.toolId && chrome.toolId !== id) {
      fail(`${file}: data-sg-tool-id="${chrome.toolId}" !== registry キー "${id}"`);
    }

    if (chrome.toolId === id && chrome.title !== tool.productName) {
      fail(
        `${file}: data-sg-title="${chrome.title}" !== registry productName="${tool.productName}"\n` +
        `  → registry を先に直し、HTML を productName に合わせてください（PLAYBOOK §2）`
      );
    }
  }
}

function verifyShellNav(tools, shellTools) {
  const inNav = Object.entries(tools)
    .filter(([, t]) => t.inNav && t.navLabel)
    .sort((a, b) => (a[1].navOrder || 99) - (b[1].navOrder || 99));

  if (shellTools.length !== inNav.length) {
    fail(
      `sugudasu-shell.js TOOLS が ${shellTools.length} 件 · registry inNav が ${inNav.length} 件 — 件数を揃えてください`
    );
  }

  for (let i = 0; i < inNav.length; i++) {
    const [id, tool] = inNav[i];
    const shell = shellTools[i];
    if (!shell) fail(`sugudasu-shell.js: navOrder ${tool.navOrder} (${id}) に対応する TOOLS 行がありません`);
    if (shell.id !== id) {
      fail(`sugudasu-shell.js TOOLS[${i}].id="${shell.id}" !== registry "${id}"（navOrder 順を確認）`);
    }
    if (shell.file !== tool.file) {
      fail(`${id}: shell file="${shell.file}" !== registry file="${tool.file}"`);
    }
    if (shell.label !== tool.navLabel) {
      fail(
        `${id}: shell label="${shell.label}" !== registry navLabel="${tool.navLabel}"\n` +
        `  → sugudasu-shell.js TOOLS を registry に合わせてください`
      );
    }
  }
}

function verifyHubCards(tools) {
  if (!fs.existsSync(HUB_PATH)) return;
  const hub = fs.readFileSync(HUB_PATH, 'utf8');

  for (const [id, tool] of Object.entries(tools)) {
    if (id === 'hub' || !tool.inNav || !tool.file) continue;
    const hrefNeedle = `href="${tool.file}`;
    if (!hub.includes(hrefNeedle)) {
      warn(`hub.html: ${tool.file} へのカードリンクがありません`);
      continue;
    }
    const idx = hub.indexOf(hrefNeedle);
    const slice = hub.slice(idx, idx + 600);
    if (!slice.includes(tool.productName)) {
      fail(
        `hub.html ${tool.file}: カード付近に productName "${tool.productName}" がありません\n` +
        `  → <h3> を productName にしてください（PLAYBOOK §1 Step 4）`
      );
    }
  }
}

function main() {
  const registry = loadRegistry();
  const tools = registry.tools;
  verifyRegistryFields(tools);

  const shellSource = fs.readFileSync(SHELL_PATH, 'utf8');
  const shellTools = parseShellTools(shellSource);

  verifyToolHtml(tools);
  verifyShellNav(tools, shellTools);
  verifyHubCards(tools);

  const inNavCount = Object.values(tools).filter((t) => t.inNav).length;
  console.log(`[tool-naming-guard] OK: registry ${Object.keys(tools).length} tools · nav ${inNavCount} · shell TOOLS synced`);
}

main();
