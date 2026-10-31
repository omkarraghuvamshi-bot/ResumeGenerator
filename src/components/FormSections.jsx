import Field from "./Field.jsx";
import Repeater from "./Repeater.jsx";
import { newExp, newEdu, newProj } from "../data.js";
import { TYPES } from "../types.js";

export default function FormSections({ data, setData }) {
  const set = (patch) => setData({ ...data, ...patch });
  const setP = (key, v) => set({ personal: { ...data.personal, [key]: v } });
  const P = data.personal;
  const T = TYPES[data.type];

  return (
    <>
      <div className="block">
        <h2>Resume type</h2>
        <p className="hint">Pick the one that fits you. It changes the layout, the wording and the background.</p>
        <div className="types" role="radiogroup" aria-label="Resume type">
          {Object.entries(TYPES).map(([key, t]) => (
            <button key={key} type="button" role="radio" aria-checked={data.type === key}
                    className={`type-card ${data.type === key ? "on" : ""}`} onClick={() => set({ type: key })}>
              <strong>{t.label}</strong>
              <span>{t.hint}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="block">
        <h2>Job description</h2>
        <p className="hint">Paste the job posting you’re applying for. Your resume is tailored to it.</p>
        <div className="grid2">
          <Field label="Company" value={data.company} onChange={(v) => set({ company: v })} placeholder="Infosys" />
          <Field label="Job role" value={data.jobRole} onChange={(v) => set({ jobRole: v })} placeholder="Software Engineer Trainee" />
        </div>
        <Field textarea rows={9} label="Job description" value={data.jobDescription}
               onChange={(v) => set({ jobDescription: v })} placeholder="Paste the full job description here…" />
      </div>

      <div className="block">
        <h2>Personal details</h2>
        <p className="hint">This is how employers will reach you.</p>
        <Field label="Full name" value={P.fullName} onChange={(v) => setP("fullName", v)} placeholder="Asha Rao" />
        <Field label="Target job title (optional)" value={P.title} onChange={(v) => setP("title", v)} placeholder="Full-Stack Developer" />
        <div className="grid2">
          <Field label="Email" type="email" value={P.email} onChange={(v) => setP("email", v)} />
          <Field label="Phone" value={P.phone} onChange={(v) => setP("phone", v)} />
        </div>
        <Field label="Location" value={P.location} onChange={(v) => setP("location", v)} placeholder="Bengaluru, India" />
        <div className="grid2">
          <Field label="LinkedIn" value={P.linkedin} onChange={(v) => setP("linkedin", v)} />
          <Field label="GitHub" value={P.github} onChange={(v) => setP("github", v)} />
        </div>
        <Field label="Portfolio website" value={P.website} onChange={(v) => setP("website", v)} />
      </div>

      <div className="block">
        <h2>Professional summary</h2>
        <p className="hint">Write a rough draft, or leave it empty and one is written from your details.</p>
        <Field textarea rows={5} label="About you" value={data.summary} onChange={(v) => set({ summary: v })}
               placeholder="Final-year CS student who loves building web apps…" />
        {T.showAchievements && (
          <Field textarea rows={4} label="Key achievements (one per line)" value={data.achievements}
                 onChange={(v) => set({ achievements: v })}
                 placeholder="Led a team of 8 engineers&#10;Cut page load time by 40%" />
        )}
      </div>

      <div className="block">
        <h2>{T.expHeading}</h2>
        <p className="hint">{T.expHint}</p>
        <Repeater title="Role" items={data.experience} setItems={(experience) => set({ experience })} make={newExp}
          render={(it, up) => (
            <>
              <div className="grid2">
                <Field label="Company" value={it.company} onChange={(v) => up("company", v)} />
                <Field label="Job title" value={it.role} onChange={(v) => up("role", v)} />
              </div>
              <div className="grid2">
                <Field label="Start" value={it.start} onChange={(v) => up("start", v)} placeholder="Jun 2024" />
                <Field label="End" value={it.end} onChange={(v) => up("end", v)} placeholder="Present" />
              </div>
              <Field textarea label="What did you do?" value={it.desc} onChange={(v) => up("desc", v)}
                     placeholder="Built the login page in React. Fixed 20 bugs. Worked with a team of 4." />
            </>
          )} />
      </div>

      <div className="block">
        <h2>Education</h2>
        <p className="hint">Start with your most recent.</p>
        <Repeater title="School" items={data.education} setItems={(education) => set({ education })} make={newEdu}
          render={(it, up) => (
            <>
              <Field label="School or college" value={it.school} onChange={(v) => up("school", v)} />
              <Field label="Degree" value={it.degree} onChange={(v) => up("degree", v)} placeholder="B.E. Computer Science" />
              <div className="grid2">
                <Field label="Year" value={it.year} onChange={(v) => up("year", v)} placeholder="2022 – 2026" />
                <Field label="CGPA or percentage" value={it.grade} onChange={(v) => up("grade", v)} />
              </div>
            </>
          )} />
      </div>

      <div className="block">
        <h2>Skills and certifications</h2>
        <p className="hint">Separate skills with commas.</p>
        <Field textarea rows={3} label="Skills" value={data.skills} onChange={(v) => set({ skills: v })}
               placeholder="HTML, CSS, JavaScript, React, Python, SQL, Git" />
        <Field textarea rows={3} label="Certifications (one per line)" value={data.certifications}
               onChange={(v) => set({ certifications: v })} />
      </div>

      <div className="block">
        <h2>Projects</h2>
        <p className="hint">Projects matter a lot when you have little work experience.</p>
        <Repeater title="Project" items={data.projects} setItems={(projects) => set({ projects })} make={newProj}
          render={(it, up) => (
            <>
              <div className="grid2">
                <Field label="Project name" value={it.name} onChange={(v) => up("name", v)} />
                <Field label="Link" value={it.link} onChange={(v) => up("link", v)} />
              </div>
              <Field textarea label="What does it do?" value={it.desc} onChange={(v) => up("desc", v)}
                     placeholder="A job-matching site built with React and a Python API." />
            </>
          )} />
      </div>
    </>
  );
}
