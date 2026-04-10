# 🗄️ Database Layer: Persistent Storage

This directory contains the binary storage for the ArunCore knowledge base.

---

## 🏗️ Architecture

### 1. Vector Store (ChromaDB)
- **Technology:** [ChromaDB](https://www.trychroma.com/)
- **Embeddings:** OpenAI `text-embedding-3-small`
- **Logic:** Each markdown file is embedded into a 1536-dimensional vector space.
- **Decision: Persistent Local Storage:** We use Chroma's persistent disk mode.
    - *Why?* It allows the AI to stay fast and operational without needing a separate cloud database subscription, making the system self-contained and portable.

### 2. Metadata Index
- Every chunk in this DB is tagged with:
    - `source`: The physical file path.
    - `chunk_id`: A unique hash for deduplication.
    - `headers`: The markdown hierarchy (H1, H2, H3) the text belongs to.

---

## ⚡ Handling the Index
- **Pushing to Git:** In this project, the `db/` folder is NOT ignored (unlike standard AI apps).
    - *Decision:* We choose to push the binary DB to GitHub so that the repository is "Battery Included." Anyone who clones it can run the agent instantly without needing to run an ingestion script or pay for embedding tokens.
- **Corruption Safety:** If the DB files become corrupted, simply delete the `db/` folder and run `python core/ingest.py` to rebuild the index from the `data/` source.
