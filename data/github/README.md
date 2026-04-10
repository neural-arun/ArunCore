# data/github/

The curated knowledge base for every GitHub project. This is the highest-signal section of the ArunCore dataset — it contains structured, reviewed documentation for each project that proves real engineering capability.

---

## How It Was Built
1. All repos were cloned into `temp/repos/` locally
2. Source code, READMEs, and requirements files were analysed file by file
3. Five dataset files were generated per Tier 1 project (written from code analysis, not just READMEs)
4. Arun filled in the `decisions.md` with the *why* behind each architectural choice
5. Final files were reviewed and formatted before being committed here

---

## Folder Structure
One subfolder per project:
```
github/
├── legal_RAG_system/          ← Tier 1: full 5-file treatment
├── real_state_listing_scraper/ ← Tier 1: full 5-file treatment
├── personal_ai_agent/          ← Tier 1: full 5-file treatment
├── result_anomaly/             ← Tier 1: full 5-file treatment
├── Agentic_AI_Projects/        ← Tier 2: metadata + readme only
├── web_wizard/                 ← Tier 2: metadata + readme only
└── neural_arun_labs/           ← Tier 2: metadata + readme only
```

---

## File Types Per Project

| File | Tier 1 | Tier 2 | Purpose |
|---|:---:|:---:|---|
| `metadata.json` | ✅ | ✅ | Machine-readable project facts: URL, stack, status, visibility |
| `readme.md` | ✅ | ✅ | Clean problem/solution/features (no install noise) |
| `architecture.md` | ✅ | ❌ | System design: components, data flow, design patterns used |
| `code_summaries.json` | ✅ | ❌ | Per-module summaries with GitHub file URLs |
| `decisions.md` | ✅ | ❌ | Key architectural decisions + reasoning (written by Arun) |

---

## Tiering Criteria

**Tier 1 — Full treatment:** Projects that demonstrate real, original engineering problem-solving. Flagship work. These are the projects that define Arun professionally.

**Tier 2 — Lightweight:** Projects showing breadth (multiple domains) or active learning, but not deep enough in complexity to warrant full architecture documentation.

---

## How This Dataset Is Used
During ingestion, each file is:
1. Chunked with metadata tags (`source`, `project_name`, `type`, `tech_stack`, `status`, `visibility`)
2. Embedded using OpenAI `text-embedding-3-small`
3. Stored in the vector database

When a user asks *"What RAG projects have you built?"*, the retrieval engine pulls from `legal_RAG_system/architecture.md` and `legal_RAG_system/readme.md`. When asked *"Why did you use ChromaDB?"*, it retrieves from `legal_RAG_system/decisions.md`.
