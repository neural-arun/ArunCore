# /data: The Knowledge Base

This folder serves as the "Long-Term Memory" of ArunCore. It is partitioned based on the source of truth to ensure high-fidelity retrieval.

## 📁 Data Sources

- **/github**: Technical deep-dives. Contains summaries and architectures of key repositories (Legal RAG, Scrapers, etc.) to allow the AI to answer complex implementation questions.
- **/linkedin**: Professional history. Includes profile summaries and specific high-impact posts.
- **/static**: Behavioral rules. Contains the **Rules of Engagement (Veto Rules)** and the tech stack definitions.
- **/raw**: Personal background. Handwritten notes on career goals, education, and professional philosophy.
- **/test_set**: The evaluation data used by `evaluate.py` to audit the AI's accuracy.

## 🧠 Engineering: Metadata Enrichment
Every file in this directory is processed with specific metadata (Source, Topic, Date) during ingestion. This allows the AI to not just repeat text, but to actually **cite its sources** (e.g., "According to my LinkedIn post from April...").

## 🛠️ Update Workflow
To add new knowledge to ArunCore:
1. Drop a new `.md` file into the appropriate subfolder.
2. Run `python core/ingest.py` to update the vector database.
3. Push the `db/` folder to HuggingFace.
