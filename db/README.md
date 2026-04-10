# /db: Persistent Vector Store

This directory contains the binary database that stores the semantic embeddings of Arun's career and project history.

## 🧰 Technology
- **Engine**: ChromaDB (Serverless mode)
- **Search Type**: Hybrid (Vector + Keyword)
- **Persistance**: Binary flat-files managed via **Git LFS**.

## ⚠️ Important for Deployment
Because HuggingFace and GitHub normally reject large binary files (like `chroma.sqlite3`), we use **Git LFS (Large File Storage)** to manage this directory. 

### Why this approach?
Most RAG systems require a paid hosted database (like Pinecone). By keeping the database binary in this `/db` folder, we can host the entire system **100% for free** on HuggingFace Spaces. The application simply reads from these local binary files at runtime.

## 🛠️ Maintenance
Do not manually edit the files in this directory. They are generated and updated automatically whenever you run `core/ingest.py`.
