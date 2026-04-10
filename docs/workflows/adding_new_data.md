# Workflow: Adding New Data to ArunCore

This document outlines the exact, step-by-step process for adding new projects, updating your profile, or adding new LinkedIn posts to the ArunCore knowledge base.

Because the system uses **File Hashing** and **Deterministic Upserting**, you never have to worry about duplicating data or deleting old databases. The ingestion script will automatically detect what has changed and only process the new/modified files.

---

## Scenario A: Adding a New GitHub Project (Tier 1 - Major Project)

When you finish a major new engineering project, follow this exact workflow to teach it to your AI:

### Step 1: Create the Project Folder
Navigate to your GitHub data folder:
`d:\ArunCore\data\github\`
Create a new folder using the exact repository name (e.g., `new_awesome_project`).

### Step 2: Create `metadata.json`
Inside the new folder, create `metadata.json` and fill it out:
```json
{
  "project_name": "New Awesome Project",
  "repo_url": "https://github.com/neural-arun/new_awesome_project",
  "description": "A 1-2 sentence description of what the system does.",
  "created_at": "YYYY-MM",
  "updated_at": "YYYY-MM",
  "tech_stack": ["python", "fastapi", "tool_name"],
  "status": "completed",
  "visibility": "PUBLIC"
}
```

### Step 3: Create `readme.md`
Create `readme.md`. Do NOT copy-paste installation instructions or generic GitHub badges. Focus strictly on:
- **Problem:** What real-world issue does this solve?
- **Solution:** How did you solve it?
- **Key Features:** Bullet points of the primary capabilities.

### Step 4: Create `architecture.md`
Create `architecture.md`. Explain the data flow and system design.
- Define the major components (e.g., UI, Backend, Database).
- Explain the pipeline (e.g., *Data flows from X to Y using asyncio queues...*).

### Step 5: Create `code_summaries.json`
Create `code_summaries.json`. List out the major scripts/modules and what they do:
```json
[
  {
    "module": "main.py",
    "summary": "Entry point for the application, handles FastAPI routing.",
    "file_url": "https://github.com/neural-arun/..."
  }
]
```

### Step 6: Create `decisions.md`
Create `decisions.md`. This is the most important file for proving you are an engineer.
Format it as:
- **Decision 1: [Tool/Architecture Choice]**
- **What:** I chose X over Y.
- **Why:** (Explain the trade-off. Did Y have rate limits? Was X faster?)

### Step 7: Run Ingestion
Open your terminal in `d:\ArunCore` and run the ingestion script:
```powershell
python core/ingest.py
```
*The script will automatically detect the new folder, chunk the 5 files, and embed them into the database. Old projects will be skipped instantly.*

---

## Scenario B: Adding a Minor Project (Tier 2)

If the project is a small utility or learning lab, it doesn't need architecture docs.

1. Go to `d:\ArunCore\data\github\`.
2. Create `your_minor_project` folder.
3. Create ONLY `metadata.json` and a short `readme.md`. 
4. Run `python core/ingest.py`.

---

## Scenario C: Updating LinkedIn Posts

When you publish new content on LinkedIn that you want ArunCore to know about:

### Step 1: Open `posts.md`
Open `d:\ArunCore\data\linkedin\posts.md`.

### Step 2: Prepend the New Post
Add the new post to the **top** of the document using this exact semantic format:

```markdown
## Post: [Punchy Title About The Post]

**Date:** [Month Year]
**Topic:** [Comma separated topics]
**Links:** [Optional URL]

**Core Message**
1-2 sentences summarizing the main thesis of your post.

**Technical Deep Dive**
- Detail 1: ...
- Detail 2: ...
```

### Step 3: Run Ingestion
```powershell
python core/ingest.py
```
*The script will see that `posts.md` has been modified (its file hash changed). It will automatically delete all the old chunks for `posts.md`, divide your newly updated file into fresh chunks, and embed them. You will not pay twice for other unchanged files.*

---

## Scenario D: Updating Your Identity

If you learn a massive new skill (e.g., you master a new framework like Next.js) or change your freelance goals:

1. Open `d:\ArunCore\data\static\public_profile.md`.
2. Add the new framework to the `Core Focus & Technology Stack` lists.
3. Save the file.
4. Run `python core/ingest.py`.
