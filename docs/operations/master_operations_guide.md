# Master Operations Guide: ArunCore Digital Twin

This document is the ultimate, unified operational manual for maintaining, updating, and infinitely scaling your AI Digital Twin. It covers how to inject new knowledge, push database updates, deploy UI modifications, and migrate to enterprise-grade infrastructure.

---

## Phase 1: Injecting New Knowledge (Data Layer)

Because the system uses **File Hashing** and **Deterministic Upserting**, you never have to worry about duplicating data or deleting old databases. The ingestion script will automatically detect what has changed.

### Scenario A: Adding a New GitHub Project
1. **Create the Folder**: Navigate to `d:\ArunCore\data\github\` and create a folder mapping the repository name (e.g., `new_project_name`).
2. **`metadata.json`**: Create this file inside to configure rapid RAG routing filters:
    ```json
    {
      "project_name": "New Project",
      "repo_url": "https://github.com/neural-arun/...",
      "description": "Short description of the system.",
      "tech_stack": ["python", "fastapi"],
      "status": "completed"
    }
    ```
3. **`overview.md`**: Focus entirely on the *why* (problem solved) and the *how* (architectural solution). Do not paste code.
4. **`decisions.md` (Crucial)**: Detail the exact engineering trade-offs. Why tool X over tool Y?
5. **Update Central Narratives**: Add the project briefly to your `data/static/public_profile.md` and `data/raw/all_projects_summary.md`.

### Scenario B: Updating LinkedIn Posts
1. Open `d:\ArunCore\data\linkedin\posts.md`.
2. Prepend the new post directly to the top of the file. The system will auto-detect the file hash has changed and selectively re-vectorize this specific document without double-charging you for OpenAI embeddings on other unchanged files.

---

## Phase 2: Compiling the Brain (Engine Layer)

Once your Markdown and JSON files are ready locally, you must compile them into the ChromaDB vector graph.

1. Open your terminal in the root `d:\ArunCore` directory.
2. Run the compiler:
    ```bash
    python core/ingest.py
    ```
*Within 30 seconds, your local system will permanently remember the new data inside the `db/` folder.*

---

## Phase 3: Going Live (Cloud Deployment)

Running `ingest.py` only updates your *local* machine. For your globally accessible Digital Twin to access the new knowledge, you MUST push the updated `db/` folder to the Hugging Face backend.

1. **Stage data & database chunks:**
   ```bash
   git add data/ db/
   ```
2. **Commit the knowledge update:**
   ```bash
   git commit -m "Knowledge Base Update: Ingested new projects into the core vector graph"
   ```
3. **Push to Hugging Face (The Live API Engine):**
   ```bash
   git push hf main
   ```
*Status: Once Hugging Face finishes building (usually ~60s), your AI is live with the new data.*

---

## Phase 4: Updating the Visual UI (Vercel Layer)

If you have made styling changes to `frontend/app/page.tsx` (like adding new Markdown renderers or changing colors), that code lives independently from the Python engine. 

To deploy visual UI updates:
1. Navigate into the frontend folder:
   ```bash
   cd frontend
   ```
2. Push directly using the Vercel CLI:
   ```bash
   npx vercel --prod --yes
   ```
*Status: Vercel will build the Next.js bundle and deploy the new UI globally in ~40 seconds.*

---

## Phase 5: Infinite Scaling (Future-Proofing Guide)

This outlines the upgrade path for transitioning ArunCore from a HuggingFace prototype environment to an enterprise-grade cloud-native deployment capable of handling massive traffic spikes.

### Level 1: Vector Database Migration
Currently, ArunCore relies on a local instance of **ChromaDB**. Serverless environments (like Vercel Lambdas or AWS Lambda) are ephemeral and cannot read/write persistent local files reliably.
To completely decouple the backend architecture for infinite scaling:
1.  **Select a Cloud Vector Engine:** Sign up for Pinecone or Weaviate.
2.  **Modify `ingest.py`:** Update the chunking pipeline to serialize data using standard LangChain Pinecone bindings instead of Chroma bindings.
3.  **Update `agent.py`:** Change the `$GLOBAL_VECTORSTORE` to connect to the Pinecone index instead of a local disk directory.
*(With this change, the entire `db/` folder can be deleted from the Repo, drastically lowering the repository size).*

### Level 2: Backend API Severance 
Right now, the FastAPI (`core/api.py`) runs as a persistent listener. For cost-efficiency, the Python engine should be moved to Serverless Functions using Vercel's native Python Edge support.

### Level 3: Streaming Responses
For the best UX during long LangChain loops, switch from a blocked REST request (`POST /chat`) to HTTP Streaming (`text/event-stream`). Update the `main_llm` invocation to yield tokens dynamically, passing the feeling of immediate speed to the user while backend processes crunch data in parallel.
