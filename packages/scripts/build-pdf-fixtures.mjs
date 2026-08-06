/**
 * Build controlled PDF fixtures with pdf-lib (Wave 3 inputs).
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

const __dirname = dirname(fileURLToPath(import.meta.url));
const outDir = join(__dirname, "..", "fixtures", "pdf");

mkdirSync(outDir, { recursive: true });

async function save(name, doc) {
  const bytes = await doc.save();
  writeFileSync(join(outDir, name), bytes);
  console.log("wrote", name, bytes.length);
}

// A — 普通の契約書
{
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  const page = doc.addPage([595, 842]);
  let y = 780;
  page.drawText("Service Agreement", { x: 50, y, size: 22, font: bold });
  y -= 40;
  page.drawText("Article 1 Purpose", { x: 50, y, size: 14, font: bold });
  y -= 24;
  page.drawText("The parties agree to the terms set forth herein.", {
    x: 50,
    y,
    size: 11,
    font,
  });
  y -= 20;
  page.drawText("Payment shall be made within 30 days.", {
    x: 50,
    y,
    size: 11,
    font,
  });
  await save("A-contract.old.pdf", doc);

  const doc2 = await PDFDocument.create();
  const font2 = await doc2.embedFont(StandardFonts.Helvetica);
  const bold2 = await doc2.embedFont(StandardFonts.HelveticaBold);
  const page2 = doc2.addPage([595, 842]);
  y = 780;
  page2.drawText("Service Agreement", { x: 50, y, size: 22, font: bold2 });
  y -= 40;
  page2.drawText("Article 1 Purpose", { x: 50, y, size: 14, font: bold2 });
  y -= 24;
  page2.drawText("The parties agree to the terms set forth herein.", {
    x: 50,
    y,
    size: 11,
    font: font2,
  });
  y -= 20;
  page2.drawText("Payment shall be made within 45 days.", {
    x: 50,
    y,
    size: 11,
    font: font2,
  });
  await save("A-contract.new.pdf", doc2);
}

// B — 2段組
{
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const page = doc.addPage([595, 842]);
  const left = [
    "Left column line one about alpha.",
    "Left column line two about beta.",
    "Left column line three about gamma.",
    "Left column line four about delta.",
  ];
  const right = [
    "Right column line one about one.",
    "Right column line two about two.",
    "Right column line three about three.",
    "Right column line four about four.",
  ];
  let y = 750;
  for (const t of left) {
    page.drawText(t, { x: 40, y, size: 10, font });
    y -= 18;
  }
  y = 750;
  for (const t of right) {
    page.drawText(t, { x: 320, y, size: 10, font });
    y -= 18;
  }
  await save("B-two-column.old.pdf", doc);
  await save("B-two-column.new.pdf", doc);
}

// C — 表（格子テキスト）
{
  async function tableDoc(values) {
    const doc = await PDFDocument.create();
    const font = await doc.embedFont(StandardFonts.Helvetica);
    const page = doc.addPage([595, 842]);
    const xs = [50, 200, 350];
    let y = 700;
    for (const row of values) {
      row.forEach((cell, i) => {
        page.drawText(cell, { x: xs[i], y, size: 11, font });
      });
      y -= 20;
    }
    return doc;
  }
  await save(
    "C-table.old.pdf",
    await tableDoc([
      ["Item", "Qty", "Price"],
      ["A", "1", "100"],
      ["B", "2", "200"],
    ])
  );
  await save(
    "C-table.new.pdf",
    await tableDoc([
      ["Item", "Qty", "Price"],
      ["A", "1", "100"],
      ["B", "2", "250"],
    ])
  );
}

// D — スキャン（画像のみ · テキストなし）
{
  const doc = await PDFDocument.create();
  // 1x1 png
  const png = Buffer.from(
    "iVBORw0KGgoAAAANSUhEUgAAAAoAAAAKCAYAAACNMs+7AAAAFUlEQVR42mNk+M9Qz0AEYBxVSF+FABJADveWkH6aAAAAAElFTkSuQmCC",
    "base64"
  );
  const image = await doc.embedPng(png);
  const page = doc.addPage([400, 500]);
  page.drawImage(image, { x: 0, y: 0, width: 400, height: 500 });
  await save("D-scan.old.pdf", doc);
  await save("D-scan.new.pdf", doc);
}

// E — 改ページ（Section 禁止確認）
{
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  const p1 = doc.addPage([595, 842]);
  p1.drawText("Chapter One", { x: 50, y: 780, size: 18, font: bold });
  p1.drawText("Body on page 1.", { x: 50, y: 740, size: 11, font });
  const p2 = doc.addPage([595, 842]);
  p2.drawText("Chapter Two", { x: 50, y: 780, size: 18, font: bold });
  p2.drawText("Body on page 2.", { x: 50, y: 740, size: 11, font });
  await save("E-multipage.old.pdf", doc);

  const doc2 = await PDFDocument.create();
  const font2 = await doc2.embedFont(StandardFonts.Helvetica);
  const bold2 = await doc2.embedFont(StandardFonts.HelveticaBold);
  const q1 = doc2.addPage([595, 842]);
  q1.drawText("Chapter One", { x: 50, y: 780, size: 18, font: bold2 });
  q1.drawText("Body on page 1 revised.", { x: 50, y: 740, size: 11, font: font2 });
  const q2 = doc2.addPage([595, 842]);
  q2.drawText("Chapter Two", { x: 50, y: 780, size: 18, font: bold2 });
  q2.drawText("Body on page 2.", { x: 50, y: 740, size: 11, font: font2 });
  await save("E-multipage.new.pdf", doc2);
}

console.log("PDF fixtures ready");
