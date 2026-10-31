# Build your career profile

Free ATS-friendly resume builder for students. Built with HTML, CSS and React (Vite).
An optional Python server adds AI wording.

## Run it
```bash
npm install
npm run dev          # http://localhost:5173
```

## Put it live (Vercel, free, about 5 minutes)
1. Upload this folder to a GitHub repository (not `node_modules`, not `.env`).
2. On vercel.com choose Add New > Project, pick the repository, click Deploy.
   Vercel detects Vite itself (build command `npm run build`, output folder `dist`).
3. You get a public link such as `https://your-project.vercel.app`. Netlify and Cloudflare Pages work the same way.

## How it works
1. Choose a **Resume type**: Student / Fresher, Professional or Experienced. It changes the section order and wording.
2. Paste the **job description**, then fill in everything on the one form.
3. Click **Generate my resume**. Edit the form any time and click **Regenerate**.
4. **Download PDF** or **Download Word (.docx)**. Both are real text files (ATS can read them), not screenshots.

**Links are clickable.** Email, phone, LinkedIn, GitHub, website and project links become hyperlinks in the preview, the PDF and the Word file.
Type `github.com/yourname` or a full `https://` address; `https://` is added for you.

| Type | For | Section order |
|---|---|---|
| Student / Fresher | no or little experience | Summary, Education, Skills, Projects, Internships, Certifications |
| Professional | 1 to 5 years | Summary, Skills, Experience, Projects, Education, Certifications |
| Experienced | 5+ years | Summary, Key Achievements, Skills, Experience, Education, Projects, Certifications |

## Background
`public/backgrounds/desk.svg` (a desk with resumes, laptop and coffee). To use a real photo, save it as
`public/backgrounds/desk.jpg`; it is picked up automatically. A colour tint over it changes with the resume type.

## Optional: real AI wording (Python)
Without a server, the resume is written inside the browser (cleans up your text, puts job keywords first).
For AI-written bullets, deploy `server/` (Flask) on Render using `render.yaml`:
1. Add `ANTHROPIC_API_KEY` and `ALLOWED_ORIGIN` (your Vercel link) in Render's Environment tab.
2. In Vercel > Settings > Environment Variables add `VITE_API_URL` = your Render link, then redeploy.
If the server is down, the site falls back to the browser version automatically.
Local test: `cd server && pip install -r requirements.txt && python app.py`, then put
`VITE_API_URL=http://localhost:5000` in a `.env.local` file.
