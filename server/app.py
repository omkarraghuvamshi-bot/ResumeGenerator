"""Build your career profile: OPTIONAL Python AI server (API only).

Local:  python app.py   ->  http://localhost:5000/api/health
Live:   gunicorn app:app   (see ../render.yaml)
The React site works without it; this adds real AI wording.
It serves the frontend folder AND exposes the API, so there are no CORS headaches.
"""
import json
import os
import re
import time
from collections import defaultdict, deque

from dotenv import load_dotenv
from flask import Flask, jsonify, request
from flask_cors import CORS

load_dotenv()

MODEL = os.getenv("ANTHROPIC_MODEL", "claude-sonnet-4-6")

app = Flask(__name__)
app.config["MAX_CONTENT_LENGTH"] = 200 * 1024  # reject huge requests
CORS(app, origins=os.getenv("ALLOWED_ORIGIN", "*"))  # set ALLOWED_ORIGIN to your site URL when live

# Basic abuse protection: max 8 generations per minute per visitor (per server worker).
_hits = defaultdict(deque)
RATE_LIMIT, RATE_WINDOW = 8, 60


def too_many_requests(ip):
    now = time.time()
    q = _hits[ip]
    while q and now - q[0] > RATE_WINDOW:
        q.popleft()
    if len(q) >= RATE_LIMIT:
        return True
    q.append(now)
    return False

SYSTEM_PROMPT = """You are an expert resume writer who writes ATS-friendly resumes.
Rewrite the candidate's raw details into polished resume content, tailored to the JOB DESCRIPTION provided.
Rules:
- Mirror the job description's important keywords and priorities, but only where the candidate's real details support them.
- "resume_type" is student, professional or experienced. Student: stress education, projects and skills. Professional: stress skills and results at work. Experienced: stress leadership, scope and impact; use numbers ONLY if the candidate gave them.
- Put the most relevant experience, projects and skills first within each item.
- If the candidate gave little detail, write sensible bullets from what exists, but do not claim anything they did not say.
- "title": a job title for the resume header taken from the job description (use the candidate's target title if given).
- "missing_keywords": up to 8 important skills or keywords in the job description that the candidate's details do NOT show. Do not add them to the resume.
- Use ONLY facts the candidate gave. Never invent employers, numbers, tools or achievements.
- Bullets: start with a strong past-tense verb (present tense for a current job), max 25 words, no first person.
- 2 to 4 bullets per experience and per project.
- Summary: 2 to 3 sentences, no first person.
- Skills: de-duplicate, fix capitalisation (e.g. "javascript" -> "JavaScript"), keep the most relevant first.
Return ONLY valid JSON, no markdown fences, in exactly this shape:
{"title": "...",
 "summary": "...",
 "missing_keywords": ["..."],
 "experience": [{"bullets": ["..."]}],
 "projects": [{"bullets": ["..."]}],
 "skills": ["..."]}
"experience" and "projects" must have the same length and order as the input lists."""


# ---------- helpers ----------
def clean_list(value):
    return [str(x).strip() for x in value if str(x).strip()] if isinstance(value, list) else []


def split_lines(text):
    parts = re.split(r"[\n•\-–]+|(?<=[.!?])\s+", text or "")
    return [p.strip(" .") for p in parts if len(p.strip(" .")) > 3]


def split_skills(text):
    seen, out = set(), []
    for s in re.split(r"[,\n;]+", text or ""):
        s = s.strip()
        if s and s.lower() not in seen:
            seen.add(s.lower())
            out.append(s)
    return out


def shape_payload(data):
    """Only send what the writer needs. Contact details never leave your server."""
    p = data.get("personal", {})
    return {
        "job_description": (data.get("jobDescription") or "")[:6000],
        "resume_type": data.get("type", "student"),
        "achievements": data.get("achievements", ""),
        "target_title": p.get("title", ""),
        "summary_draft": data.get("summary", ""),
        "experience": [
            {k: e.get(k, "") for k in ("company", "role", "start", "end", "desc")}
            for e in data.get("experience", [])
        ],
        "projects": [
            {k: x.get(k, "") for k in ("name", "desc")} for x in data.get("projects", [])
        ],
        "skills": data.get("skills", ""),
    }


# ---------- generators ----------
def local_generate(data):
    """Rule-based fallback so the app works with no API key."""
    p = data.get("personal", {})
    skills = split_skills(data.get("skills", ""))
    exp = data.get("experience", [])
    jd = (data.get("jobDescription") or "")
    jd_words = {w.lower() for w in re.findall(r"[A-Za-z][A-Za-z+#.\-]{1,}", jd)}
    skills.sort(key=lambda s: 0 if s.lower() in jd_words else 1)  # JD matches first
    first_line = next((l.strip() for l in jd.splitlines() if l.strip()), "")
    title = p.get("title") or (first_line[:60] if len(first_line) < 60 else "") or "Professional"

    summary = (data.get("summary") or "").strip()
    if not summary:
        companies = [e["company"] for e in exp if e.get("company")]
        summary = f"{title}"
        if p.get("location"):
            summary += f" based in {p['location']}"
        if companies:
            summary += f" with hands-on experience at {', '.join(companies[:2])}"
        if skills:
            summary += f". Skilled in {', '.join(skills[:5])}"
        summary += ". Focused on delivering reliable, high-quality work."

    def bullets(text):
        return [line[0].upper() + line[1:] + "." for line in split_lines(text)[:4]]

    return {
        "title": title,
        "summary": summary,
        "missing_keywords": [],
        "experience": [{"bullets": bullets(e.get("desc", ""))} for e in exp],
        "projects": [{"bullets": bullets(x.get("desc", ""))} for x in data.get("projects", [])],
        "skills": skills,
    }


def ai_generate(data):
    import anthropic  # imported here so the app still runs if the package is missing

    client = anthropic.Anthropic()  # reads ANTHROPIC_API_KEY
    msg = client.messages.create(
        model=MODEL,
        max_tokens=2000,
        system=SYSTEM_PROMPT,
        messages=[{"role": "user", "content": json.dumps(shape_payload(data))}],
    )
    text = "".join(b.text for b in msg.content if b.type == "text").strip()
    text = re.sub(r"^```(?:json)?\s*|\s*```$", "", text)
    raw = json.loads(text)

    def fit(key, n):
        items = raw.get(key) if isinstance(raw.get(key), list) else []
        items = [
            {"bullets": clean_list(i.get("bullets", []))} if isinstance(i, dict) else {"bullets": []}
            for i in items
        ]
        return (items + [{"bullets": []}] * n)[:n]

    return {
        "title": str(raw.get("title", "")).strip(),
        "missing_keywords": clean_list(raw.get("missing_keywords", []))[:8],
        "summary": str(raw.get("summary", "")).strip(),
        "experience": fit("experience", len(data.get("experience", []))),
        "projects": fit("projects", len(data.get("projects", []))),
        "skills": clean_list(raw.get("skills", [])),
    }


# ---------- routes ----------
@app.get("/api/health")
def health():
    return jsonify(ok=True, ai_enabled=bool(os.getenv("ANTHROPIC_API_KEY")))


@app.post("/api/generate-resume")
def generate_resume():
    ip = (request.headers.get("X-Forwarded-For", request.remote_addr) or "").split(",")[0].strip()
    if too_many_requests(ip):
        return jsonify(error="Too many requests. Please wait a minute and try again."), 429
    data = request.get_json(silent=True) or {}
    p = data.get("personal", {})
    if not p.get("fullName", "").strip():
        return jsonify(error="Please enter your full name before generating."), 400

    if os.getenv("ANTHROPIC_API_KEY"):
        try:
            return jsonify(source="ai", resume=ai_generate(data))
        except Exception as exc:  # network error, bad JSON, quota...
            app.logger.warning("AI generation failed, using fallback: %s", exc)
            return jsonify(
                source="local",
                warning="AI is unavailable right now, so a basic version was generated.",
                resume=local_generate(data),
            )
    return jsonify(
        source="local",
        warning="No API key set, so a basic version was generated.",
        resume=local_generate(data),
    )


if __name__ == "__main__":
    app.run(debug=os.getenv("FLASK_DEBUG") == "1", port=int(os.getenv("PORT", 5000)))
