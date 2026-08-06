/**
 * Wave 4 — Change Navigator UI (Projection only) + perf smoke.
 * Run:
 *   node packages/scripts/build-ui-fixtures.mjs
 *   node packages/scripts/run-wave4.mjs
 */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  renderNavigatorHtml,
  reviewCopy,
  kindBadge,
  mountChangeNavigator,
} from "../../assets/smart-diff-navigator.js";
import { navigatorAnchor } from "../navigator/state.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const uiDir = join(__dirname, "..", "fixtures", "ui");

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

function load(name) {
  return JSON.parse(readFileSync(join(uiDir, name), "utf8"));
}

function runA() {
  const { projection } = load("A-docx-projection.json");
  const mod = projection.items.find(
    (i) =>
      i.kind === "modified" &&
      (i.beforeText || "").includes("30") &&
      (i.afterText || "").includes("45")
  );
  assert(mod, "A: modified 30→45 in projection");
  const painted = renderNavigatorHtml(projection, { selectedId: mod.id });
  assert(painted.html.includes("Changes"), "A: Changes header");
  assert(painted.html.includes("Modified") || painted.html.includes("modified"), "A: badge");
  assert(painted.html.includes("30") && painted.html.includes("45"), "A: review texts");
  assert(painted.anchor?.deltaId === mod.id, "A: deltaId anchor");
  assert(painted.anchor?.semanticNodeId, "A: semanticNodeId");
  assert(!painted.html.includes("scrollTop"), "A: no pixel anchor in UI");
  console.log("PASS A DOCX navigator", painted.anchor);
}

function runB() {
  const { projection } = load("B-pdf-projection.json");
  const withPage = projection.items.find(
    (i) => i.visible && i.kind !== "unchanged" && i.originHint?.page
  );
  assert(withPage, "B: projection item with page originHint");
  const painted = renderNavigatorHtml(projection, { selectedId: withPage.id });
  assert(painted.anchor?.originHint?.page, "B: anchor carries page");
  const na = navigatorAnchor(projection.items, withPage.id);
  assert(na.deltaId === withPage.id && na.originHint?.page, "B: navigatorAnchor page");
  console.log("PASS B PDF page anchor", painted.anchor);
}

function runC() {
  const { projection } = load("C-table-projection.json");
  const table = projection.items.find((i) => i.changeDetail === "table_changed");
  assert(table, "C: table_changed");
  const review = reviewCopy(table);
  assert(review.tableOnly && review.note === "表に変更があります", "C: table copy");
  assert(kindBadge(table).text === "Changed", "C: Changed badge");
  const painted = renderNavigatorHtml(projection, { selectedId: table.id });
  assert(painted.html.includes("表に変更があります"), "C: UI note");
  assert(!painted.html.includes("行") || !/3行|2列/.test(painted.html), "C: no cell coords");
  console.log("PASS C table UI");
}

function runBoundary() {
  const src = readFileSync(
    join(__dirname, "..", "..", "assets", "smart-diff-navigator.js"),
    "utf8"
  );
  assert(!/matchSlir|buildDeltaTree|normalizeToSlir|parseDocx|parsePdf/.test(src), "UI: no core pipeline imports");
  assert(!/from ['\"].*slir/.test(src), "UI: no SLIR import");
  console.log("PASS boundary (Projection-only module)");
}

function runPerf() {
  const items = [];
  for (let i = 0; i < 1000; i++) {
    items.push({
      id: `delta-${i}`,
      kind: i % 17 === 0 ? "added" : "modified",
      label: `変更 ${i}`,
      visible: true,
      beforeText: `before-${i}`,
      afterText: `after-${i}`,
      oldNodeRef: `o-${i}`,
      newNodeRef: `n-${i}`,
    });
  }
  const projection = {
    items,
    changeCount: 1000,
    view: {
      selectedId: "delta-0",
      filter: {
        showModified: true,
        showAdded: true,
        showDeleted: true,
        style: false,
        showUnchanged: false,
      },
      activeView: "review",
      expandedIds: [],
    },
  };
  const t0 = performance.now();
  renderNavigatorHtml(projection, { selectedId: "delta-0" });
  const renderMs = performance.now() - t0;
  const t1 = performance.now();
  renderNavigatorHtml(projection, { selectedId: "delta-500" });
  const selectMs = performance.now() - t1;
  assert(renderMs < 100, `perf render ${renderMs}ms >= 100`);
  assert(selectMs < 50, `perf select ${selectMs}ms >= 50`);
  console.log("PASS perf 1000", {
    renderMs: Number(renderMs.toFixed(2)),
    selectMs: Number(selectMs.toFixed(2)),
  });
}

function runFilterVisibility() {
  const { projection } = load("A-docx-projection.json");
  const painted = renderNavigatorHtml(projection, {});
  // all items present in HTML even if we hide via attribute after filter — initial all visible changes
  const itemCount = (painted.html.match(/data-delta-id/g) || []).length;
  assert(itemCount === projection.items.length, "Filter: all items rendered (no DOM drop of model items)");
  console.log("PASS filter model retains items", { itemCount });
}

try {
  runBoundary();
  runA();
  runB();
  runC();
  runFilterVisibility();
  runPerf();
  // mount smoke (jsdom-less): ensure export exists
  assert(typeof mountChangeNavigator === "function", "mount export");
  console.log("\nWave 4 Change Navigator UI: ALL PASS");
} catch (e) {
  console.error("\nFAIL:", e.message);
  console.error(e.stack);
  process.exit(1);
}
