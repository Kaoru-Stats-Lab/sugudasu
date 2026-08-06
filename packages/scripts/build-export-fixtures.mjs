/**
 * Wave 5 Export fixtures — Projection JSON for report tests.
 */
import { mkdirSync, writeFileSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const uiDir = join(__dirname, "..", "fixtures", "ui");
const outDir = join(__dirname, "..", "fixtures", "export");
mkdirSync(outDir, { recursive: true });

function loadUi(name) {
  return JSON.parse(readFileSync(join(uiDir, name), "utf8"));
}

// A Modified
{
  const { projection } = loadUi("A-docx-projection.json");
  projection.items = projection.items.map((i) =>
    i.kind === "modified"
      ? { ...i, candidate: false, confidence: "high" }
      : i
  );
  writeFileSync(
    join(outDir, "A-modified-projection.json"),
    JSON.stringify({ id: "A", projection }, null, 2)
  );
}

// B Added — strip to added-only if present, else synthesize
{
  const { projection } = loadUi("A-docx-projection.json");
  const added = {
    items: [
      {
        id: "delta-added-1",
        kind: "added",
        label: "序文",
        visible: true,
        afterText: "新しい序文",
        newNodeRef: "n-intro",
      },
      {
        id: "delta-unchanged-1",
        kind: "unchanged",
        label: "第1条",
        visible: false,
      },
    ],
    changeCount: 1,
    view: projection.view,
  };
  writeFileSync(
    join(outDir, "B-added-projection.json"),
    JSON.stringify({ id: "B", projection: added }, null, 2)
  );
}

// C Table
{
  const { projection } = loadUi("C-table-projection.json");
  writeFileSync(
    join(outDir, "C-table-projection.json"),
    JSON.stringify({ id: "C", projection }, null, 2)
  );
}

// D Candidate
{
  const candidate = {
    items: [
      {
        id: "delta-cand-1",
        kind: "modified",
        label: "第5条",
        visible: true,
        candidate: true,
        confidence: "candidate",
        matchScore: 72,
        beforeText: "旧文",
        afterText: "新文",
        changeDetail: "text_only",
      },
    ],
    changeCount: 1,
    view: { selectedId: null, filter: {}, activeView: "review", expandedIds: [] },
  };
  writeFileSync(
    join(outDir, "D-candidate-projection.json"),
    JSON.stringify({ id: "D", projection: candidate }, null, 2)
  );
}

console.log("Export fixtures ready");
