// Built-in resume writer. Runs in the browser, so the site works with no server.
// It never invents facts: it only cleans up and reorders what the student typed.

const KNOWN_SKILLS = [
  "JavaScript", "TypeScript", "React", "Node.js", "Express", "Python", "Java", "C", "C++", "C#", "SQL", "MySQL",
  "PostgreSQL", "MongoDB", "HTML", "CSS", "Git", "GitHub", "Docker", "Kubernetes", "AWS", "Azure", "REST", "API",
  "Flask", "Django", "Spring Boot", "Angular", "Vue", "Next.js", "Tailwind", "Bootstrap", "Figma", "Excel",
  "Power BI", "Tableau", "Machine Learning", "Data Analysis", "Data Structures", "Algorithms", "OOP", "Testing",
  "Selenium", "Kotlin", "Swift", "Flutter", "Firebase", "Pandas", "NumPy", "TensorFlow", "Linux", "Agile",
  "Cybersecurity", "Networking", "SEO", "Photoshop", "Communication", "Teamwork", "Problem Solving", "Leadership",
];

const VERBS = [
  [/^worked (on|in|with) (a|the|our) team/i, "Collaborated in a team"],
  [/^(made|make|created|create)\b/i, "Developed"],
  [/^(built|build)\b/i, "Built"],
  [/^(worked on|work on|worked in)\b/i, "Contributed to"],
  [/^(helped|help)\b( with)?/i, "Assisted with"],
  [/^(did|done)\b/i, "Completed"],
  [/^(fixed|fix)\b/i, "Resolved"],
  [/^(wrote|write)\b/i, "Authored"],
  [/^(used|use)\b/i, "Utilized"],
  [/^(learned|learnt|learn)\b/i, "Learned"],
  [/^(led|lead)\b/i, "Led"],
];

const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
export const has = (text, term) =>
  new RegExp(`(^|[^A-Za-z0-9+#])${esc(term)}($|[^A-Za-z0-9+#])`, "i").test(text || "");

const splitSkills = (text) => {
  const seen = new Set();
  const out = [];
  for (const raw of (text || "").split(/[,\n;]+/)) {
    const s = raw.trim();
    if (!s || seen.has(s.toLowerCase())) continue;
    seen.add(s.toLowerCase());
    out.push(KNOWN_SKILLS.find((k) => k.toLowerCase() === s.toLowerCase()) || s); // fix casing: "javascript" -> "JavaScript"
  }
  return out;
};

const sentences = (text) =>
  (text || "")
    .split(/\n|•|(?<=[.!?])\s+/)
    .map((s) => s.replace(/^[-–*\s]+/, "").replace(/[.\s]+$/, "").trim())
    .filter((s) => s.length > 3);

const toBullet = (line) => {
  let out = line;
  for (const [re, verb] of VERBS) {
    if (re.test(out)) {
      out = out.replace(re, verb);
      break;
    }
  }
  return out.charAt(0).toUpperCase() + out.slice(1) + ".";
};

const bullets = (text) => sentences(text).slice(0, 4).map(toBullet);

export function generateLocal(data) {
  const jd = data.jobDescription || "";
  const p = data.personal;
  const role = p.title || data.jobRole || "";

  // Skills: ones the job asks for go first.
  const skills = splitSkills(data.skills).sort((a, b) => Number(has(jd, b)) - Number(has(jd, a)));
  const matched = skills.filter((s) => has(jd, s));

  // Keywords the job mentions that the student did not list.
  const mine = new Set(skills.map((s) => s.toLowerCase()));
  const missing = KNOWN_SKILLS.filter((k) => has(jd, k) && !mine.has(k.toLowerCase())).slice(0, 8);

  // Summary (written from the resume type and the student's own details)
  let summary = (data.summary || "").trim();
  if (summary) {
    summary = summary.charAt(0).toUpperCase() + summary.slice(1);
    if (!/[.!?]$/.test(summary)) summary += ".";
  } else {
    const top = (matched.length ? matched : skills).slice(0, 5);
    const skillLine = top.length ? ` Skilled in ${top.join(", ")}.` : "";
    const at = data.company ? ` at ${data.company}` : "";
    const companies = [...new Set(data.experience.map((e) => e.company).filter(Boolean))].slice(0, 2).join(" and ");
    if (data.type === "experienced") {
      summary = `Experienced ${role || "professional"}${companies ? ` with a record of delivering results at ${companies}` : ""}.` +
        `${skillLine} Seeking a ${role || "senior"} position${at} to deliver measurable impact.`;
    } else if (data.type === "professional") {
      summary = `${role || "Professional"}${companies ? ` with hands-on experience at ${companies}` : ""}.` +
        `${skillLine} Looking to contribute to the team${at} and keep growing.`;
    } else {
      const degree = data.education.find((e) => e.degree)?.degree;
      const who = degree ? `${degree} student` : "Motivated student";
      summary = `${who}${role ? ` seeking a ${role} position${at}` : ""}.${skillLine}` +
        " Eager to apply academic knowledge and project experience to contribute to the team.";
    }
  }

  return {
    title: role,
    achievements: bullets(data.achievements),
    summary,
    missing_keywords: missing,
    experience: data.experience.map((e) => ({ bullets: bullets(e.desc) })),
    projects: data.projects.map((x) => ({ bullets: bullets(x.desc) })),
    skills,
  };
}
