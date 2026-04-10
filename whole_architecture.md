

# Phase 0: Core Philosophy & Answer Policy

Your agent is NOT a chatbot; it is a **Reasoning Engine** bound by strict rules. 

### The Answer Policy (Enforced via System Prompt):
1. **Never invent or inflate:** Do not hallucinate impact or make up metrics. 
2. **"I don't know" is a valid answer:** If retrieval confidence is low, the agent must ask for clarification or explicitly state it does not have that specific detail.
3. **Summarize when weak, quote when strong:** Prefer exact facts.
4. **Cite internal sources:** The backend logs must track exactly which chunks were used to form the answer.

### Source of Truth Conflict Resolution:
If data conflicts arise, the hierarchy is **absolute**:
1. **Live API Data (Highest):** Wins for *current* states (e.g., "What is Arun doing right now on GitHub?").
2. **Static Identity (Middle):** Wins for core philosophy, overall identity, and long-term facts.
3. **Vector Memory (Lowest):** Used purely for historical descriptive details and project context.

---

# Phase 1: Data Architecture & Privacy Scopes

Separate your data strictly by type and visibility. Do not dump LinkedIn data via brittle APIs; rely on manual, periodic exports.

### A. The Static Layer (The Core Identity)
* `identity/public_profile.md` (Bio, core skills, philosophies)
* `identity/rules_of_engagement.md` (System prompts and Answer Policy)
* `data/linkedin_export.json` (Periodic manual data dumps)

### B. The Dynamic Knowledge Layer (Vector DB)
*Every chunk in this DB must carry a strict enforced schema.*
**Required Metadata Schema per chunk:**
*   `source` (e.g., "markdown_note", "github_readme", "linkedin_export")
*   `project_name` (e.g., "ArunCore")
*   `date` (YYYY-MM)
*   `type` (e.g., "architecture", "draft", "deployment")
*   `tech_stack` (Array: `["python", "fastapi"]`)
*   `status` (e.g., "completed", "wip")
*   `URL` of the project if it has one.



# Phase 2: The Retrieval & Routing Pipeline

### Step 1: Hybrid Search + Re-ranking
1. Use **Hybrid Search** (Keyword/BM25 + Vector Similarity). This ensures exact framework names or project titles are caught. 
2. Fetch top 20 chunks. 
3. Run chunks through a **Cross-Encoder Re-ranker** (`bge-reranker`).
4. **Confidence Threshold:** If the Re-ranker score for the top chunk is below `X` (e.g., 0.3), abort generation and trigger the "Low Confidence fallback" (ask user for clarification).

### Step 2: The Intelligent Router
Given a query, classify the intent to fetch the right data:
*   *Intent: "Who is Arun?"* → Inject Static Layer.
*   *Intent: "How did Arun build X?"* → Trigger Hybrid Search + Re-ranking.
*   *Intent: "Show me Arun's recent commits."* → Trigger GitHub Live API.

### Step 3: Synthesis
The final prompt to the LLM guarantees truthfulness:
```markdown
[SYSTEM INSTRUCTION & ANSWER POLICY]
<Inject rules_of_engagement.md>

[RESOLVED CONTEXT] 
<Inject Live Data if applicable>
<Inject Re-ranked Vector Chunks with high confidence>
<Inject Static Profile>

[USER QUERY]
{query}
```

---

# Phase 3: The Optimized Tech Stack

*   **Backend Interface:** Python (`FastAPI`)
*   **Agent Logic / RAG:** `LlamaIndex` (Excels at enforcing metadata and handling structured RAG pipelines)
*   **Embeddings:** `nomic-embed-text` or `text-embedding-3-small`
*   **Re-ranker Core:** `bge-reranker-base`
*   **Vector DB:** `Qdrant` (Natively supports Hybrid Search + Metadata filtering).
*   **LLM Engine:** `GPT-4o-mini` / `Claude 3.5 Haiku` (for cheap, lightning-fast synthesis).

---

# Phase 4: Step-by-Step Execution Plan (Test-Driven RAG)

### Milestone 1: Clean Data Curation (Days 1-2)
*   Format your top 5 best projects and your Static Identity into clean Markdown.
*   Attach strict YAML Metadata (source, date, stack, visibility, etc.) to every file.
*   *Outcome:* You now have a complete grasp of what information the system actually holds.

### Milestone 2: The Golden Test Set (Day 3)
*Do not write a single line of application code yet.*
Based on the data you just curated, write a JSON file comprising 30-50 real questions you expect the system to answer perfectly. 
*   "What stack did you use for Project X?"
*   "What is your core philosophy on AI?"
*   "What did you learn from your worst failure?"

### Milestone 3: Ingestion & Retrieval Evaluation (Days 4-5)
*   Write an ingestion script that strictly enforces your Metadata Schema and stores data in Qdrant.
*   Run your Golden Test Set against the retrieval engine (Hybrid Search + Re-ranking).
*   *Measure*: Did the top 3 retrieved chunks actually contain the exact answer? 
*   *Adjust*: Tune chunk sizes, metadata tags, and re-ranker thresholds until the hit-rate is >90%.

### Milestone 4: Synthesis & Routing (Days 6-8)
*   Connect the LLM. 
*   Implement the Router logic and the Source-of-Truth priority rules.
*   Run the Golden Test Set through the full LLM pipeline. Verify it obeys the Answer Policy and doesn't hallucinate.

### Milestone 5: API & Deployment (Days 9+)
*   Connect the GitHub live API.
*   Wrap the application in FastAPI.

This plan guarantees you isolate the hardest problem (retrieval quality) before you ever get distracted by LLM orchestration. 

If this looks like the definitive blueprint, we can transition to execution. Let me know if you want to start building **Milestone 1 (The Test Set) or Milestone 2 (Data Ingestion)**.