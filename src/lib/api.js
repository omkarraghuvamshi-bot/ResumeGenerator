import { generateLocal } from "./generator.js";

// Optional Python AI server. Set VITE_API_URL when you deploy it.
const API_URL = (import.meta.env?.VITE_API_URL || "").replace(/\/$/, "");

function buildPayload(data) {
  return {
    ...data,
    personal: { ...data.personal, title: data.personal.title || data.jobRole },
    jobDescription: `Company: ${data.company}\nRole: ${data.jobRole}\n\n${data.jobDescription}`,
  };
}

export async function generateResume(data) {
  if (API_URL) {
    try {
      const res = await fetch(`${API_URL}/api/generate-resume`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(buildPayload(data)),
      });
      const json = await res.json();
      if (res.status === 429) throw new Error(json.error);
      if (res.ok) return { resume: json.resume, warning: json.warning || "" };
    } catch (err) {
      if (err.message?.startsWith("Too many")) throw err;
    }
    return { resume: generateLocal(data), warning: "The AI server didn’t respond, so a basic version was made in your browser." };
  }
  return { resume: generateLocal(data), warning: "" };
}
