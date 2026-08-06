/**
 * Wave 1 fixture assertions A–E + Navigator smoke.
 * Run: node packages/scripts/run-wave1.mjs
 */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { matchSlir } from "../matcher/engine.mjs";
import { buildDeltaTree } from "../delta/builder.mjs";
import { buildProjection } from "../projection/builder.mjs";
import {
  navigatorNextId,
  navigatorPrevId,
  navigatorAnchor,
  visibleChanges,
} from "../navigator/state.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const fixtures = join(__dirname, "..", "fixtures");

function load(name) {
  return JSON.parse(readFileSync(join(fixtures, name), "utf8"));
}

function pipeline(oldName, newName) {
  const oldDoc = load(oldName);
  const newDoc = load(newName);
  const matchMap = matchSlir(oldDoc, newDoc);
  const delta = buildDeltaTree(oldDoc, newDoc, matchMap);
  const projection = buildProjection(delta, {
    filter: {
      content: true,
      addedDeleted: true,
      style: true,
      showModified: true,
      showAdded: true,
      showDeleted: true,
      showUnchanged: false,
    },
  });
  return { matchMap, delta, projection, children: delta.root.children };
}

function kinds(children) {
  return children.map((c) => ({
    kind: c.kind,
    detail: c.changeDetail,
    summary: c.summary,
    conf: c.confidence,
  }));
}

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

function runA() {
  const { children, matchMap } = pipeline(
    "A-text-change.old.slir.json",
    "A-text-change.new.slir.json"
  );
  assert(
    !matchMap.some((m) => m.kind),
    "A: Matcher must not emit ChangeKind"
  );
  const mod = children.filter((c) => c.kind === "modified");
  assert(mod.length >= 1, "A: expect ≥1 Modified");
  assert(
    mod.some((c) => (c.beforeText || "").includes("30") && (c.afterText || "").includes("45")),
    "A: 30→45 text change"
  );
  console.log("PASS A text-change", kinds(children));
}

function runB() {
  const { children } = pipeline(
    "B-paragraph-add.old.slir.json",
    "B-paragraph-add.new.slir.json"
  );
  const added = children.filter((c) => c.kind === "added");
  const mod = children.filter((c) => c.kind === "modified");
  assert(added.length === 1, `B: expect 1 Added, got ${added.length}`);
  assert(
    added[0].afterText === "追加条件" || added[0].summary?.includes("追加"),
    "B: Added is 追加条件"
  );
  assert(mod.length === 0, `B: no cascade Modified (got ${mod.length})`);
  const unchangedPay = children.filter(
    (c) => c.kind === "unchanged" && (c.summary === "支払条件" || c.beforeText === "支払条件")
  );
  assert(unchangedPay.length >= 1, "B: 支払条件 stays Unchanged");
  console.log("PASS B paragraph-add", kinds(children));
}

function runC() {
  const { children } = pipeline(
    "C-front-insert.old.slir.json",
    "C-front-insert.new.slir.json"
  );
  const articles = ["第1条", "第2条", "第3条"];
  for (const a of articles) {
    const hit = children.find((c) => c.summary === a);
    assert(hit, `C: missing ${a}`);
    assert(hit.kind === "unchanged", `C: ${a} must be Unchanged, got ${hit.kind}`);
  }
  const added = children.filter((c) => c.kind === "added");
  assert(
    added.some((c) => (c.afterText || c.summary || "").includes("序文")),
    "C: intro Added"
  );
  console.log("PASS C front-insert", kinds(children));
}

function runD() {
  const { children, projection } = pipeline(
    "D-style-only.old.slir.json",
    "D-style-only.new.slir.json"
  );
  const mod = children.filter((c) => c.kind === "modified");
  assert(mod.length === 1, `D: expect 1 Modified, got ${mod.length}`);
  assert(mod[0].changeDetail === "style_only", `D: style_only, got ${mod[0].changeDetail}`);
  const styled = projection.items.filter((i) => i.changeDetail === "style_only");
  assert(styled.length === 1 && styled[0].visible, "D: Projection shows style_only when filter.style");
  console.log("PASS D style-only", kinds(children));
}

function runE() {
  const { children } = pipeline(
    "E-table-atomic.old.slir.json",
    "E-table-atomic.new.slir.json"
  );
  const mod = children.filter((c) => c.kind === "modified");
  assert(mod.length === 1, `E: expect 1 Modified table`);
  assert(mod[0].changeDetail === "table_changed", `E: table_changed, got ${mod[0].changeDetail}`);
  assert(!mod[0].children?.length, "E: no cell children on Delta");
  console.log("PASS E table-atomic", kinds(children));
}

function runNavigator() {
  const { projection } = pipeline(
    "A-text-change.old.slir.json",
    "A-text-change.new.slir.json"
  );
  const items = projection.items;
  const changes = visibleChanges(items);
  assert(changes.length >= 1, "Nav: changeCount");
  assert(projection.changeCount === changes.length, "Nav: changeCount matches");
  const first = changes[0].id;
  const next = navigatorNextId(items, first);
  const prev = navigatorPrevId(items, next);
  assert(next, "Nav: next");
  assert(prev === first || changes.length === 1, "Nav: prev wraps/back");
  const anchor = navigatorAnchor(items, first);
  assert(anchor?.deltaNodeId === first, "Nav: semantic anchor");
  console.log("PASS Navigator", {
    changeCount: projection.changeCount,
    next,
    anchor,
  });
}

try {
  runA();
  runB();
  runC();
  runD();
  runE();
  runNavigator();
  console.log("\nWave 1 fixture core: ALL PASS");
} catch (e) {
  console.error("\nFAIL:", e.message);
  process.exit(1);
}
