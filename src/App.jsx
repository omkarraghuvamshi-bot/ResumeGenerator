import { useEffect, useRef, useState } from "react";
import { initialData } from "./data.js";
import FormSections from "./components/FormSections.jsx";
import Resume from "./components/Resume.jsx";
import { generateResume } from "./lib/api.js";
import { buildModel, fileBaseName } from "./lib/model.js";

export default function App() {
  const [data, setData] = useState(initialData);
  const [resume, setResume] = useState(null); // null until the student clicks Generate
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState({ text: "", kind: "" });
  const resultRef = useRef(null);

  // The resume type decides which background image the page shows.
  useEffect(() => { document.body.dataset.type = data.type; }, [data.type]);

  async function generate() {
    if (!data.personal.fullName.trim()) {
      setStatus({ text: "Enter your full name first.", kind: "err" });
      return;
    }
    setBusy(true);
    setStatus({ text: "Writing your resume…", kind: "" });
    try {
      const { resume: out, warning } = await generateResume(data);
      setResume(out);
      setStatus(warning ? { text: warning, kind: "warn" } : { text: "Your resume is ready.", kind: "" });
      setTimeout(() => resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 50);
    } catch (err) {
      setStatus({ text: err.message || "Something went wrong. Try again.", kind: "err" });
    } finally {
      setBusy(false);
    }
  }

  function save(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 2000);
  }

  async function download(kind) {
    setBusy(true);
    try {
      const model = buildModel(data, resume);
      const base = fileBaseName(model);
      if (kind === "pdf") {
        const { buildPdf } = await import("./lib/exportPdf.js"); // loaded only when needed
        save(new Blob([await buildPdf(model)], { type: "application/pdf" }), `${base}.pdf`);
      } else {
        const { buildDocx } = await import("./lib/exportDocx.js");
        save(await buildDocx(model), `${base}.docx`);
      }
      setStatus({ text: `Downloaded ${base}.${kind}`, kind: "" });
    } catch (err) {
      setStatus({ text: "Download failed. Try again.", kind: "err" });
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="page">
      <header className="head">
        <h1>Build your career profile</h1>
        <p>Paste the job description, fill in your details, and get a resume tailored to the job.</p>
        <div className="badges">
          <span className="badge">Made for students</span>
          <span className="badge">ATS-friendly format</span>
          <span className="badge">Free PDF download</span>
        </div>
      </header>

      <div className="layout">
        <section className="panel" aria-label="Resume details">
          <FormSections data={data} setData={setData} />
          <div className="actions">
            <button type="button" className="btn primary wide" disabled={busy} onClick={generate}>
              {busy ? "Working…" : resume ? "Regenerate my resume" : "Generate my resume"}
            </button>
            <p className={`status ${status.kind}`} role="status">{status.text}</p>
          </div>
        </section>

        <section className="preview-col" ref={resultRef} aria-label="Your resume">
          {resume ? (
            <>
              <div className="toolbar">
                <button type="button" className="btn primary" disabled={busy} onClick={() => download("pdf")}>Download PDF</button>
                <button type="button" className="btn dl" disabled={busy} onClick={() => download("docx")}>Download Word (.docx)</button>
                <button type="button" className="btn dl" disabled={busy} onClick={generate}>Regenerate</button>
              </div>
              <Resume data={data} ai={resume} />
              <div className="ats-note">
                <strong>ATS-friendly:</strong> one column, standard headings, plain text, no tables or images.
                The PDF and Word files contain real text, and your links (email, LinkedIn, GitHub, website, projects) are clickable.
                Edit the form any time and click Regenerate.
              </div>
              {resume.missing_keywords?.length > 0 && (
                <div className="tip">
                  <strong>Not on your resume yet:</strong> {resume.missing_keywords.join(", ")}.
                  <br />If you really have these skills, add them to the form and regenerate.
                </div>
              )}
            </>
          ) : (
            <div className="empty">
              <h2>Your resume will appear here</h2>
              <p>Fill in the form and click “Generate my resume”.</p>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
