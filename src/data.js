export const newExp = () => ({ company: "", role: "", start: "", end: "", desc: "" });
export const newEdu = () => ({ school: "", degree: "", year: "", grade: "" });
export const newProj = () => ({ name: "", link: "", desc: "" });

export const initialData = {
  type: "student",
  achievements: "",
  company: "",
  jobRole: "",
  jobDescription: "",
  personal: { fullName: "", title: "", email: "", phone: "", location: "", linkedin: "", github: "", website: "" },
  summary: "",
  experience: [newExp()],
  education: [newEdu()],
  skills: "",
  projects: [newProj()],
  certifications: "",
};
