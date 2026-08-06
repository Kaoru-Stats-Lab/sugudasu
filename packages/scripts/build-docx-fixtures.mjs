/**
 * Build controlled minimal DOCX fixtures (OOXML zip).
 * Not for production authoring — Wave 2 test inputs only.
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import JSZip from "jszip";

const __dirname = dirname(fileURLToPath(import.meta.url));
const outDir = join(__dirname, "..", "fixtures", "docx");

const CONTENT_TYPES = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
</Types>`;

const RELS = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>`;

const W =
  'xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"';

function esc(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function p(text, { heading, bold } = {}) {
  const pPr = heading
    ? `<w:pPr><w:pStyle w:val="Heading${heading}"/></w:pPr>`
    : "";
  const rPr = bold ? `<w:rPr><w:b/></w:rPr>` : "";
  return `<w:p>${pPr}<w:r>${rPr}<w:t xml:space="preserve">${esc(text)}</w:t></w:r></w:p>`;
}

function table(rows) {
  const trs = rows
    .map(
      (row) =>
        `<w:tr>${row
          .map(
            (cell) =>
              `<w:tc><w:p><w:r><w:t>${esc(cell)}</w:t></w:r></w:p></w:tc>`
          )
          .join("")}</w:tr>`
    )
    .join("");
  return `<w:tbl>${trs}</w:tbl>`;
}

function documentXml(bodyInner) {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document ${W}>
  <w:body>
    ${bodyInner}
    <w:sectPr/>
  </w:body>
</w:document>`;
}

async function writeDocx(name, bodyInner) {
  const zip = new JSZip();
  zip.file("[Content_Types].xml", CONTENT_TYPES);
  zip.folder("_rels").file(".rels", RELS);
  zip.folder("word").file("document.xml", documentXml(bodyInner));
  const buf = await zip.generateAsync({ type: "nodebuffer" });
  const path = join(outDir, name);
  writeFileSync(path, buf);
  // Also drop raw XML for inspection
  writeFileSync(path.replace(/\.docx$/, ".document.xml"), documentXml(bodyInner));
  console.log("wrote", path);
}

mkdirSync(outDir, { recursive: true });

await writeDocx(
  "A-text-change.old.docx",
  [p("第3条", { heading: 2 }), p("支払日は30日以内")].join("\n")
);
await writeDocx(
  "A-text-change.new.docx",
  [p("第3条", { heading: 2 }), p("支払日は45日以内")].join("\n")
);

await writeDocx(
  "B-front-insert.old.docx",
  [p("第1条", { heading: 2 }), p("第2条", { heading: 2 }), p("第3条", { heading: 2 })].join(
    "\n"
  )
);
await writeDocx(
  "B-front-insert.new.docx",
  [
    p("新しい序文"),
    p("第1条", { heading: 2 }),
    p("第2条", { heading: 2 }),
    p("第3条", { heading: 2 }),
  ].join("\n")
);

await writeDocx("C-style-only.old.docx", p("重要事項"));
await writeDocx("C-style-only.new.docx", p("重要事項", { bold: true }));

await writeDocx("D-table.old.docx", table([["表A", "x"], ["y", "z"]]));
await writeDocx("D-table.new.docx", table([["表A(内容変更)", "x"], ["y", "z"]]));

console.log("DOCX fixtures ready");
