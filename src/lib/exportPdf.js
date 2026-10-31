import { PDFDocument, StandardFonts, rgb, PDFName, PDFString } from "pdf-lib";

// Real text PDF (not a screenshot), so applicant tracking systems can read it and links are clickable.
const A4 = { w: 595.28, h: 841.89 };
const M = 44; // page margin in points
const BLACK = rgb(0, 0, 0);
const BLUE = rgb(0.043, 0.31, 0.659);
const GREY = rgb(0.25, 0.25, 0.25);

export async function buildPdf(model) {
  const pdf = await PDFDocument.create();
  const reg = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const ital = await pdf.embedFont(StandardFonts.HelveticaOblique);
  const charset = new Set(reg.getCharacterSet());

  const clean = (s) =>
    Array.from((s || "").replace(/[\u2018\u2019]/g, "'").replace(/[\u201C\u201D]/g, '"').normalize("NFKD").replace(/[\u0300-\u036f]/g, ""))
      .map((ch) => (charset.has(ch.codePointAt(0)) ? ch : "?")).join("");

  pdf.setTitle(`${model.name || "Resume"} - Resume`);
  pdf.setAuthor(model.name || "");

  const W = A4.w - 2 * M;
  let page, y;
  const newPage = () => { page = pdf.addPage([A4.w, A4.h]); y = A4.h - M; };
  const need = (h) => { if (y - h < M) newPage(); };
  newPage();

  const link = (x, yy, w, h, url) => {
    const annot = pdf.context.obj({
      Type: "Annot", Subtype: "Link", Rect: [x, yy, x + w, yy + h], Border: [0, 0, 0],
      A: { Type: "Action", S: "URI", URI: PDFString.of(url) },
    });
    const ref = pdf.context.register(annot);
    const existing = page.node.Annots();
    if (existing) existing.push(ref); else page.node.set(PDFName.of("Annots"), pdf.context.obj([ref]));
  };

  // draw a run of {text,font,url?} segments starting at x on the current baseline
  const run = (segs, x, size) => {
    for (const s of segs) {
      const t = clean(s.text);
      const w = s.font.widthOfTextAtSize(t, size);
      page.drawText(t, { x, y, size, font: s.font, color: s.url ? BLUE : (s.color || BLACK) });
      if (s.url) {
        page.drawLine({ start: { x, y: y - 1.5 }, end: { x: x + w, y: y - 1.5 }, thickness: 0.5, color: BLUE });
        link(x, y - 3, w, size + 3, s.url);
      }
      x += w;
    }
  };
  const width = (segs, size) => segs.reduce((a, s) => a + s.font.widthOfTextAtSize(clean(s.text), size), 0);

  const wrap = (text, font, size, maxW) => {
    const out = [];
    let cur = "";
    for (const word of clean(text).split(/\s+/).filter(Boolean)) {
      const test = cur ? `${cur} ${word}` : word;
      if (font.widthOfTextAtSize(test, size) <= maxW || !cur) cur = test;
      else { out.push(cur); cur = word; }
    }
    if (cur) out.push(cur);
    return out;
  };

  // ----- header -----
  const name = model.name || "Your Name";
  const nameSize = 21;
  need(nameSize + 40);
  y -= nameSize;
  page.drawText(clean(name), { x: (A4.w - bold.widthOfTextAtSize(clean(name), nameSize)) / 2, y, size: nameSize, font: bold, color: BLACK });
  if (model.role) {
    y -= 15;
    page.drawText(clean(model.role), { x: (A4.w - reg.widthOfTextAtSize(clean(model.role), 11)) / 2, y, size: 11, font: reg, color: GREY });
  }

  // contact line(s), centred, wrapped between items; links are clickable
  const size = 9.5;
  const sep = { text: "  |  ", font: reg };
  const rows = [];
  let row = [];
  for (const c of model.contact) {
    const item = [{ text: c.text, font: reg, url: c.url }];
    const trial = row.length ? [...row, sep, ...item] : item;
    if (row.length && width(trial, size) > W) { rows.push(row); row = item; } else row = trial;
  }
  if (row.length) rows.push(row);
  for (const r of rows) {
    y -= 13;
    run(r, (A4.w - width(r, size)) / 2, size);
  }
  y -= 8;

  // ----- sections -----
  const BODY = 10, LEAD = 13.2;
  for (const sec of model.sections) {
    need(40);
    y -= 18;
    page.drawText(clean(sec.heading.toUpperCase()), { x: M, y, size: 10.5, font: bold, color: BLACK });
    y -= 4;
    page.drawLine({ start: { x: M, y }, end: { x: M + W, y }, thickness: 0.8, color: BLACK });
    y -= 3;

    const bullets = (items) => {
      for (const b of items) {
        const ls = wrap(b, reg, BODY, W - 16);
        need(ls.length * LEAD);
        ls.forEach((l, i) => {
          y -= LEAD;
          if (i === 0) page.drawText("\u2022", { x: M + 5, y, size: BODY, font: reg, color: BLACK });
          page.drawText(l, { x: M + 16, y, size: BODY, font: reg, color: BLACK });
        });
      }
    };

    if (sec.kind === "paragraph") {
      const ls = wrap(sec.text, reg, BODY, W);
      ls.forEach((l) => { need(LEAD); y -= LEAD; page.drawText(l, { x: M, y, size: BODY, font: reg, color: BLACK }); });
    } else if (sec.kind === "bullets") {
      bullets(sec.items);
    } else {
      for (const e of sec.entries) {
        const right = e.right?.text ? [{ text: e.right.text, font: reg, url: e.right.url }] : [];
        const rw = right.length ? width(right, BODY) : 0;
        const titleLines = wrap(e.title, bold, BODY, W - rw - 12);
        need(LEAD * (titleLines.length + 1));
        titleLines.forEach((l, i) => {
          y -= LEAD;
          page.drawText(l, { x: M, y, size: BODY, font: bold, color: BLACK });
          if (i === 0 && right.length) run(right, M + W - rw, BODY);
        });
        if (e.sub) { need(LEAD); y -= LEAD; page.drawText(clean(e.sub), { x: M, y, size: BODY, font: ital, color: GREY }); }
        bullets(e.bullets || []);
        y -= 3;
      }
    }
  }
  return pdf.save({ useObjectStreams: false });
}
