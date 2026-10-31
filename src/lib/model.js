import { TYPES } from "../types.js";

// ---------- links ----------
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const toUrl = (raw) => {
  const s = (raw || "").trim();
  if (!s) return null;
  if (EMAIL.test(s)) return `mailto:${s}`;
  if (/^https?:\/\//i.test(s)) return s;
  if (/^[\w-]+(\.[\w-]+)+([/?#]\S*)?$/.test(s)) return `https://${s}`; // "github.com/asha" -> https://github.com/asha
  return null;
};
export const toTel = (raw) => (/^[+\d][\d\s()-]{6,}$/.test((raw || "").trim()) ? `tel:${raw.replace(/[^\d+]/g, "")}` : null);
export const shown = (s) => s.trim().replace(/^https?:\/\/(www\.)?/i, "").replace(/\/$/, "");

const lines = (t) => (t || "").split("\n").map((s) => s.trim()).filter(Boolean);
const rough = (t) => (t || "").split(/\n|(?<=[.!?])\s+/).map((s) => s.trim()).filter(Boolean);
const dates = (a, b) => [a, b].filter(Boolean).join(" – ");

// One plain description of the resume. The preview, the PDF and the Word file all draw from it,
// so they always match. Shape:
// { name, role, contact:[{text,url?}], sections:[{key,heading,kind:"paragraph"|"bullets"|"entries", ...}] }
export function buildModel(data, ai) {
  const T = TYPES[data.type] || TYPES.student;
  const P = data.personal;
  const summary = ai?.summary || data.summary;
  const skills = ai?.skills?.length ? ai.skills : data.skills.split(/[,\n;]+/).map((s) => s.trim()).filter(Boolean);
  const achievements = ai?.achievements?.length ? ai.achievements : rough(data.achievements);

  const contact = [];
  if (P.email.trim()) contact.push({ text: P.email.trim(), url: toUrl(P.email) });
  if (P.phone.trim()) contact.push({ text: P.phone.trim(), url: toTel(P.phone) });
  if (P.location.trim()) contact.push({ text: P.location.trim() });
  for (const v of [P.linkedin, P.github, P.website]) {
    if (v.trim()) contact.push({ text: shown(v), url: toUrl(v) });
  }

  const all = {
    summary: summary && { heading: T.summaryHeading, kind: "paragraph", text: summary },

    achievements: T.showAchievements && achievements.length > 0 && {
      heading: "Key Achievements", kind: "bullets", items: achievements,
    },

    education: data.education.some((e) => e.school) && {
      heading: "Education", kind: "entries",
      entries: data.education.filter((e) => e.school).map((e) => ({
        title: e.school,
        right: { text: e.year },
        sub: [e.degree, e.grade && `Grade: ${e.grade}`].filter(Boolean).join(" · "),
        bullets: [],
      })),
    },

    skills: skills.length > 0 && { heading: "Skills", kind: "paragraph", text: skills.join(", ") },

    projects: data.projects.some((p) => p.name) && {
      heading: "Projects", kind: "entries",
      entries: data.projects.map((p, i) => ({ p, i })).filter(({ p }) => p.name).map(({ p, i }) => ({
        title: p.name,
        right: p.link.trim() ? { text: shown(p.link), url: toUrl(p.link) } : { text: "" },
        bullets: ai?.projects?.[i]?.bullets?.length ? ai.projects[i].bullets : rough(p.desc),
      })),
    },

    experience: data.experience.some((e) => e.company || e.role) && {
      heading: T.expHeading, kind: "entries",
      entries: data.experience.map((e, i) => ({ e, i })).filter(({ e }) => e.company || e.role).map(({ e, i }) => ({
        title: [e.role, e.company].filter(Boolean).join(", "),
        right: { text: dates(e.start, e.end) },
        bullets: ai?.experience?.[i]?.bullets?.length ? ai.experience[i].bullets : rough(e.desc),
      })),
    },

    certs: lines(data.certifications).length > 0 && { heading: "Certifications", kind: "bullets", items: lines(data.certifications) },
  };

  return {
    name: P.fullName.trim(),
    role: P.title || data.jobRole || ai?.title || "",
    contact,
    sections: T.order.map((key) => (all[key] ? { key, ...all[key] } : null)).filter(Boolean),
  };
}

export const fileBaseName = (model) => `${(model.name || "Resume").replace(/[^\w]+/g, "_")}_Resume`;
