/**
 * Wave 2.5 — 実務寄り DOCX スモーク fixture 生成
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import JSZip from "jszip";

const __dirname = dirname(fileURLToPath(import.meta.url));
const outDir = join(__dirname, "..", "fixtures", "docx", "smoke");

const W =
  'xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"';
const R =
  'xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"';
const WP =
  'xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing"';
const A = 'xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"';

function esc(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function contentTypes(extraOverrides = "") {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Default Extension="png" ContentType="image/png"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
  ${extraOverrides}
</Types>`;
}

const PKG_RELS = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>`;

function documentXml(bodyInner, sectExtra = "<w:sectPr/>") {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document ${W} ${R}>
  <w:body>
    ${bodyInner}
    ${sectExtra}
  </w:body>
</w:document>`;
}

function p(text, opts = {}) {
  const bits = [];
  if (opts.heading) bits.push(`<w:pStyle w:val="Heading${opts.heading}"/>`);
  if (opts.numId != null) {
    bits.push(
      `<w:numPr><w:ilvl w:val="${opts.ilvl || 0}"/><w:numId w:val="${opts.numId}"/></w:numPr>`
    );
  }
  const pPr = bits.length ? `<w:pPr>${bits.join("")}</w:pPr>` : "";
  const rPrParts = [];
  if (opts.bold) rPrParts.push("<w:b/>");
  if (opts.underline) rPrParts.push('<w:u w:val="single"/>');
  if (opts.color) rPrParts.push(`<w:color w:val="${opts.color}"/>`);
  const rPr = rPrParts.length ? `<w:rPr>${rPrParts.join("")}</w:rPr>` : "";
  const br = opts.softBreak
    ? `<w:r>${rPr}<w:t>${esc(opts.softBreak[0])}</w:t></w:r><w:r>${rPr}<w:br/><w:t>${esc(opts.softBreak[1])}</w:t></w:r>`
    : `<w:r>${rPr}<w:t xml:space="preserve">${esc(text)}</w:t></w:r>`;
  return `<w:p>${pPr}${br}</w:p>`;
}

function drawingStub(embedId = "rIdImg1", name = "図1") {
  return `<w:p>
  <w:r>
    <w:drawing>
      <wp:inline ${WP}>
        <wp:docPr id="1" name="${esc(name)}"/>
        <a:graphic ${A}>
          <a:graphicData>
            <a:blip r:embed="${embedId}"/>
          </a:graphicData>
        </a:graphic>
      </wp:inline>
    </w:drawing>
  </w:r>
</w:p>`;
}

async function writeDocx(name, { body, sectExtra, headers, footers, docRels }) {
  const zip = new JSZip();
  const overrides = [];
  if (headers?.length) {
    headers.forEach((_, i) => {
      overrides.push(
        `<Override PartName="/word/header${i + 1}.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.header+xml"/>`
      );
    });
  }
  if (footers?.length) {
    footers.forEach((_, i) => {
      overrides.push(
        `<Override PartName="/word/footer${i + 1}.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.footer+xml"/>`
      );
    });
  }
  zip.file("[Content_Types].xml", contentTypes(overrides.join("\n")));
  zip.folder("_rels").file(".rels", PKG_RELS);
  const word = zip.folder("word");
  word.file("document.xml", documentXml(body, sectExtra));
  if (docRels) {
    word.folder("_rels").file("document.xml.rels", docRels);
  }
  headers?.forEach((text, i) => {
    word.file(
      `header${i + 1}.xml`,
      `<?xml version="1.0" encoding="UTF-8"?><w:hdr ${W}><w:p><w:r><w:t>${esc(text)}</w:t></w:r></w:p></w:hdr>`
    );
  });
  footers?.forEach((text, i) => {
    word.file(
      `footer${i + 1}.xml`,
      `<?xml version="1.0" encoding="UTF-8"?><w:ftr ${W}><w:p><w:r><w:t>${esc(text)}</w:t></w:r></w:p></w:ftr>`
    );
  });
  // 1x1 png stub for image relationship (optional bytes)
  if (docRels?.includes("image")) {
    const png = Buffer.from(
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
      "base64"
    );
    word.folder("media").file("image1.png", png);
  }
  const buf = await zip.generateAsync({ type: "nodebuffer" });
  writeFileSync(join(outDir, name), buf);
  console.log("wrote", name);
}

mkdirSync(outDir, { recursive: true });

// T1 契約書型 — heading / long para / list
const long =
  "甲及び乙は、本契約の締結にあたり、法令を遵守し、相手方の秘密情報を第三者に開示しないものとする。".repeat(
    3
  );
await writeDocx("T1-contract.old.docx", {
  body: [
    p("業務委託契約書", { heading: 1 }),
    p("第1条（目的）", { heading: 2 }),
    p(long),
    p("秘密保持義務", { numId: "1", ilvl: 0 }),
    p("再委託の禁止", { numId: "1", ilvl: 0 }),
    p("第2条（期間）", { heading: 2 }),
    p("本契約の有効期間は1年とする。"),
  ].join("\n"),
});
await writeDocx("T1-contract.new.docx", {
  body: [
    p("業務委託契約書", { heading: 1 }),
    p("第1条（目的）", { heading: 2 }),
    p(long),
    p("秘密保持義務", { numId: "1", ilvl: 0 }),
    p("再委託の禁止", { numId: "1", ilvl: 0 }),
    p("監査協力", { numId: "1", ilvl: 0 }), // added list item
    p("第2条（期間）", { heading: 2 }),
    p("本契約の有効期間は2年とする。"),
  ].join("\n"),
});

// T2 社内規程 — bold / underline / color / soft break
await writeDocx("T2-policy.old.docx", {
  body: [p("重要事項"), p("通常の説明文")].join("\n"),
});
await writeDocx("T2-policy.new.docx", {
  body: [
    p("重要事項", { bold: true, underline: true, color: "FF0000" }),
    p("", { softBreak: ["一行目", "二行目"] }),
  ].join("\n"),
});

// T3 Excel貼付表 — empty cell / merge / inner breaks
function tableSmoke() {
  return `<w:tbl>
  <w:tr>
    <w:tc>
      <w:tcPr><w:gridSpan w:val="2"/></w:tcPr>
      <w:p><w:r><w:t>結合セル</w:t></w:r></w:p>
    </w:tc>
  </w:tr>
  <w:tr>
    <w:tc>
      <w:p><w:r><w:t>上段</w:t></w:r></w:p>
      <w:p><w:r><w:t>下段</w:t></w:r></w:p>
    </w:tc>
    <w:tc>
      <w:p><w:r><w:t></w:t></w:r></w:p>
    </w:tc>
  </w:tr>
</w:tbl>`;
}
await writeDocx("T3-pasted-table.old.docx", { body: tableSmoke() });
await writeDocx("T3-pasted-table.new.docx", {
  body: tableSmoke().replace("結合セル", "結合セル(改訂)"),
});

// T4 header/footer
const sectWithChrome = `<w:sectPr>
  <w:headerReference w:type="default" r:id="rIdHdr1"/>
  <w:footerReference w:type="default" r:id="rIdFtr1"/>
</w:sectPr>`;
const chromeRels = `<?xml version="1.0" encoding="UTF-8"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rIdHdr1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/header" Target="header1.xml"/>
  <Relationship Id="rIdFtr1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/footer" Target="footer1.xml"/>
</Relationships>`;
await writeDocx("T4-chrome.old.docx", {
  body: [p("本文のみ", { heading: 2 }), p("支払日は30日以内")].join("\n"),
  sectExtra: sectWithChrome,
  headers: ["社外秘 — ヘッダー"],
  footers: ["ページ番号プレースホルダ"],
  docRels: chromeRels,
});
await writeDocx("T4-chrome.new.docx", {
  body: [p("本文のみ", { heading: 2 }), p("支払日は45日以内")].join("\n"),
  sectExtra: sectWithChrome,
  headers: ["社外秘 — ヘッダー"],
  footers: ["ページ番号プレースホルダ"],
  docRels: chromeRels,
});

// T5 image
const imgRels = `<?xml version="1.0" encoding="UTF-8"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rIdImg1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="media/image1.png"/>
</Relationships>`;
await writeDocx("T5-image.old.docx", {
  body: [p("図面", { heading: 2 }), drawingStub()].join("\n"),
  docRels: imgRels,
});
await writeDocx("T5-image.new.docx", {
  body: [p("図面", { heading: 2 }), drawingStub("rIdImg1", "図1改")].join("\n"),
  docRels: imgRels,
});

console.log("Smoke DOCX fixtures ready");
