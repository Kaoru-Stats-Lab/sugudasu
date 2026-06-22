#!/usr/bin/env node
/**
 * 未作成の tool-facts JSON を registry + lp-marketing-matrix から骨格生成
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const FACTS_DIR = path.join(ROOT, 'data', 'tool-facts');
const REGISTRY_PATH = path.join(ROOT, 'data', 'tool-registry.json');
const MATRIX_PATH = path.join(ROOT, 'data', 'lp-marketing-matrix.json');
const QUEUE_PATH = path.join(FACTS_DIR, '_queue.json');

function fail(message) {
  console.error(`[scaffold-tool-facts] FAIL: ${message}`);
  process.exit(1);
}

function loadJson(filePath, label) {
  if (!fs.existsSync(filePath)) fail(`${label} がありません: ${filePath}`);
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function matrixRow(matrix, toolId) {
  const priority = matrix.priority?.find((r) => r.tool_id === toolId);
  const delta = matrix.deltaProblems?.find((r) => r.tool_id === toolId);
  return { priority, delta };
}

function scaffoldPayload(toolId, registryTool, matrix) {
  const { priority, delta } = matrixRow(matrix, toolId);
  const isPlanned = priority?.registryStatus === 'planned' || !registryTool;

  return {
    tool_id: toolId,
    status: 'scaffold',
    updatedAt: new Date().toISOString().slice(0, 10),
    oneLiner: '',
    personas: [],
    implemented: [],
    notImplemented: isPlanned ? ['ツール未実装（planned）'] : [],
    dataHandling: {
      upload: false,
      serverSave: false,
      localStorage: '要確認',
      retention: '要確認',
    },
    trust: {
      faqStorage: '要確認（privacy / statements と突合）',
      faqEdit: '要確認',
      faqRetention: '要確認',
    },
    postCompletion: [],
    relatedTools: [],
    captainChecks: priority?.registryStatus === 'live' ? [] : ['registry 登録後に再レビュー'],
    promptNotes: delta?.typicalAsk
      ? `△相当の聞き直し例: ${delta.typicalAsk}`
      : '',
    _scaffoldMeta: {
      primaryPain: priority?.primaryPain ?? null,
      primaryType: priority?.primaryType ?? null,
      delta: delta?.delta ?? null,
      registryStatus: priority?.registryStatus ?? (registryTool ? 'live' : 'unknown'),
      productName: registryTool?.productName ?? priority?.productName ?? toolId,
    },
  };
}

function collectTargetIds(registry, matrix, queue) {
  const ids = new Set();
  for (const id of queue.order ?? []) ids.add(id);
  for (const row of matrix.priority ?? []) ids.add(row.tool_id);
  for (const [id, tool] of Object.entries(registry.tools ?? {})) {
    if (tool.inNav) ids.add(id);
  }
  return [...ids];
}

function main() {
  if (!fs.existsSync(FACTS_DIR)) fs.mkdirSync(FACTS_DIR, { recursive: true });

  const registry = loadJson(REGISTRY_PATH, 'tool-registry');
  const matrix = loadJson(MATRIX_PATH, 'lp-marketing-matrix');
  const queue = fs.existsSync(QUEUE_PATH)
    ? JSON.parse(fs.readFileSync(QUEUE_PATH, 'utf8'))
    : { order: [] };

  const targetIds = collectTargetIds(registry, matrix, queue);
  let created = 0;
  let skipped = 0;

  for (const toolId of targetIds) {
    if (toolId.startsWith('_')) continue;
    const outPath = path.join(FACTS_DIR, `${toolId}.json`);
    if (fs.existsSync(outPath)) {
      skipped += 1;
      continue;
    }
    const registryTool = registry.tools?.[toolId];
    const payload = scaffoldPayload(toolId, registryTool, matrix);
    fs.writeFileSync(outPath, `${JSON.stringify(payload, null, 2)}\n`, 'utf8');
    created += 1;
    console.log(`[scaffold-tool-facts] created ${toolId}.json`);
  }

  console.log(`[scaffold-tool-facts] OK: created=${created} skipped=${skipped}`);
}

main();
