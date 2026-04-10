# 📂 Data Layer: The Knowledge Base

This directory manages the source material for the ArunCore RAG Agent. It is organized into tiers of sensitivity and purpose.

---

## 📁 Sub-Directories

### 1. `raw/` (Primary Context)
- **`personal_background.md`**: The source of truth for Arun's history, motivation, and "origin story."
- **`architecture_notes.md`**: Technical documentation of the projects discussed.
- **Decision: Markdown Format:** All data is stored in `.md`.
    - *Why?* Markdown structure is natively understood by our `MarkdownHeaderTextSplitter`, allowing us to keep technical hierarchy intact during chunking.

### 2. `static/` (System Core)
- **`public_profile.md`**: The AI's "Identity Profile." Contains technical tech stacks and verified socials.
- **`rules_of_engagement.md`**: The behavioral constitution. 
- **Decision: System Prompt Injection:** These files are NOT searched in the database; they are injected directly into the **System Message** of every API call.
    - *Why?* This ensures the AI *always* remembers its name, its "Veto Rule," and its socials, regardless of what the user asks.

### 3. `test_set/` (Audit Data)
- **`eval_set.json`**: The "Golden Truth." A 30-question blueprint of expected answers and sources.
- **`evaluation_report.json`**: The automated output of the audit suite.

### 4. Domain Data (`linkedin/`, `github/`)
- Contains crawled/scraped content from social proof-of-work.
- **Decision: Domain Segregation:** We keep GitHub READMEs separate from LinkedIn posts.
    - *Why?* This allows us to add domain-specific metadata (e.g., `github_url`) during ingestion, which the AI can then use to provide direct links in its answers.

---

## 📜 Principles
- **Accuracy First:** Files are manually edited to ensure no conflicting dates or dead links.
- **Conciseness:** We optimize for "Information Density"—removing fluff to ensure the AI retrieves maximally useful facts in the smallest possible number of tokens.
