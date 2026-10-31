// The three resume types. Each one changes section order, wording and the page background.
export const TYPES = {
  student: {
    label: "Student / Fresher",
    hint: "No or little work experience",
    summaryHeading: "Summary",
    expHeading: "Internships and Experience",
    expHint: "Internships, part-time jobs and training all count. Each sentence becomes a bullet point.",
    order: ["summary", "education", "skills", "projects", "experience", "certs"],
  },
  professional: {
    label: "Professional",
    hint: "1 to 5 years of experience",
    summaryHeading: "Professional Summary",
    expHeading: "Work Experience",
    expHint: "List your jobs, newest first. Describe what you did and the result.",
    order: ["summary", "skills", "experience", "projects", "education", "certs"],
  },
  experienced: {
    label: "Experienced",
    hint: "5+ years, senior roles",
    summaryHeading: "Professional Summary",
    expHeading: "Work Experience",
    expHint: "List your jobs, newest first. Focus on results, leadership and impact.",
    showAchievements: true,
    order: ["summary", "achievements", "skills", "experience", "education", "projects", "certs"],
  },
};
