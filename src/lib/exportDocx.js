import {
  Document, Packer, Paragraph, TextRun, ExternalHyperlink, AlignmentType, BorderStyle,
  TabStopType, LevelFormat, HeadingLevel,
} from "docx";

// Word version of the same resume: real text, standard headings, real bullet lists, clickable links.
const FONT = "Arial";
const BLUE = "0B4FA8";
const CONTENT_W = 11906 - 2 * 1000; // A4 width minus left and right margins (twips)

const run = (text, o = {}) => new TextRun({ text, font: FONT, size: 20, ...o });
const linkRun = (text, url, o = {}) =>
  new ExternalHyperlink({ link: url, children: [new TextRun({ text, font: FONT, size: 20, color: BLUE, underline: {}, ...o })] });
const piece = (c, o = {}) => (c.url ? linkRun(c.text, c.url, o) : run(c.text, o));

export async function buildDocx(model) {
  const kids = [];

  kids.push(new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 20 },
    children: [run(model.name || "Your Name", { bold: true, size: 40 })] }));
  if (model.role) kids.push(new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 40 }, children: [run(model.role, { size: 22 })] }));

  const contactKids = [];
  model.contact.forEach((c, i) => {
    if (i) contactKids.push(run("  |  ", { size: 19 }));
    contactKids.push(piece(c, { size: 19 }));
  });
  if (contactKids.length) kids.push(new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 100 }, children: contactKids }));

  const bullet = (t) => new Paragraph({ numbering: { reference: "bul", level: 0 }, spacing: { after: 30 }, children: [run(t)] });

  for (const sec of model.sections) {
    kids.push(new Paragraph({
      heading: HeadingLevel.HEADING_2, keepNext: true, spacing: { before: 200, after: 80 },
      border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: "000000", space: 1 } },
      children: [run(sec.heading.toUpperCase(), { bold: true, size: 21, color: "000000" })],
    }));
    if (sec.kind === "paragraph") {
      kids.push(new Paragraph({ spacing: { after: 60 }, children: [run(sec.text)] }));
    } else if (sec.kind === "bullets") {
      sec.items.forEach((b) => kids.push(bullet(b)));
    } else {
      for (const e of sec.entries) {
        const kidsRow = [run(e.title, { bold: true })];
        if (e.right?.text) { kidsRow.push(run("\t")); kidsRow.push(piece(e.right)); }
        kids.push(new Paragraph({
          keepNext: true, spacing: { before: 60, after: 20 },
          tabStops: [{ type: TabStopType.RIGHT, position: CONTENT_W }], children: kidsRow,
        }));
        if (e.sub) kids.push(new Paragraph({ spacing: { after: 20 }, children: [run(e.sub, { italics: true })] }));
        (e.bullets || []).forEach((b) => kids.push(bullet(b)));
      }
    }
  }

  const doc = new Document({
    creator: model.name || "Resume",
    title: `${model.name || "Resume"} - Resume`,
    styles: { default: { document: { run: { font: FONT, size: 20 } } } },
    numbering: { config: [{ reference: "bul", levels: [{
      level: 0, format: LevelFormat.BULLET, text: "\u2022", alignment: AlignmentType.LEFT,
      style: { paragraph: { indent: { left: 360, hanging: 260 } } } }] }] },
    sections: [{ properties: { page: { size: { width: 11906, height: 16838 }, margin: { top: 800, bottom: 800, left: 1000, right: 1000 } } }, children: kids }],
  });
  return Packer.toBlob(doc);
}
