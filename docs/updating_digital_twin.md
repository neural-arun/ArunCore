# Updating the Digital Twin's Knowledge Base

As Arun completes new projects or learns new architectures, ArunCore must evolve with him. Adding new knowledge to the digital twin requires ZERO changes to the core Python logic. You simply adjust data and instruct the ingestor.

## How to Inject New Knowledge

### 1. Structure the Project Directory
Navigate to the `data/github/` directory and create a completely new folder reflecting the project's name (e.g., `data/github/quantum_trading_bot/`). 

### 2. Required Payload Files
Inside your new folder, create these necessary files so the AI can parse the context correctly:

#### A. `overview.md`
This is the narrative file. Write 2-3 paragraphs describing why you built it, the central bottleneck you solved, and the final impact. Example:
*   "I engineered this quantum trading system because..."

#### B. `metadata.json`
A rigid structured data file providing rapid context for the agent's RAG routing constraints.
```json
{
  "project_name": "Quantum Trading Bot",
  "technologies": ["Python", "TensorFlow", "Pandas"],
  "deployment": "AWS EC2",
  "status": "Archived",
  "repository": "https://github.com/neural-arun/temp"
}
```

#### C. `code_summaries.json` (Optional but highly recommended)
If you want the AI to confidently discuss the actual code structure of the project without feeding it thousands of raw `.py` lines:
```json
{
  "files": [
    {
      "path": "src/algo.py",
      "summary": "Implements the core matrix mutation algorithms used against real-time API feeds."
    }
  ]
}
```

### 3. Updating the Central Narratives
Whenever a major milestone project is completed, you should also edit:
*   `data/static/public_profile.md`: To add the skill to your top-level "Tech Skills" array.
*   `data/github/Agentic_AI_Projects/master_portfolio_summary.md`: Add a high-level bullet pointing to the new project.

### 4. Rebuilding the Brain
Once the markdown files and JSONs look correct, simply fire up the compiler:
```bash
python core/ingest.py
```
This script acts as a compiler for the LLM. It will automatically crawl the newly added folders, perform LangChain structural chunking, calculate semantic embeddings by calling the OpenAI API, and seamlessly merge the physical vector graphs inside `db/`.

**Done.** Within 30 seconds, your digital twin will permanently "remember" your new project.
