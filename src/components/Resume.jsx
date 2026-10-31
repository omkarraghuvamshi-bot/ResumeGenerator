import { buildModel } from "../lib/model.js";

const Piece = ({ c }) =>
  c.url ? <a href={c.url} target="_blank" rel="noopener noreferrer">{c.text}</a> : <span>{c.text}</span>;

// Preview of the resume. ATS-friendly on purpose: one column, standard headings, plain text.
// It draws from the same model as the PDF and Word downloads, so all three always match.
export default function Resume({ data, ai }) {
  const m = buildModel(data, ai);
  return (
    <div className="paper" id="resume-paper">
      {m.name ? <h1>{m.name}</h1> : <h1 className="placeholder">Your name</h1>}
      {m.role && <div className="role">{m.role}</div>}
      {m.contact.length > 0 && (
        <div className="contact">
          {m.contact.map((c, i) => (
            <span key={i}>{i > 0 && "  |  "}<Piece c={c} /></span>
          ))}
        </div>
      )}
      {m.sections.map((s) => (
        <div key={s.key}>
          <h3>{s.heading}</h3>
          {s.kind === "paragraph" && <p>{s.text}</p>}
          {s.kind === "bullets" && <ul>{s.items.map((b, i) => <li key={i}>{b}</li>)}</ul>}
          {s.kind === "entries" && s.entries.map((e, i) => (
            <div key={i} className="entry">
              <div className="row">
                <span>{e.title}</span>
                {e.right?.text && <span className="when"><Piece c={e.right} /></span>}
              </div>
              {e.sub && <div className="sub">{e.sub}</div>}
              {e.bullets?.length > 0 && <ul>{e.bullets.map((b, j) => <li key={j}>{b}</li>)}</ul>}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
