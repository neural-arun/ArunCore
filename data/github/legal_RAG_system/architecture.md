# Architecture — Legal RAG System

## System Overview
A sequential, file-based RAG pipeline where each script reads from the output of the previous stage and writes to a shared `output/` directory. There is no live orchestration — each stage is run manually in order, making it fully debuggable and reproducible.

## Pipeline Stages

| Stage | Script | Input | Output |
|---|---|---|---|
| 1 | `01_document_manifest.py` | `docs/` folder | `output/manifest.json` |
| 2 | `02_extract_text.py` | manifest.json | `output/raw_pages.json` |
| 3 | `03_clean_and_structure.py` | raw_pages.json | `output/structured_documents.json` |
| 4 | `04_chunk_documents.py` | structured_documents.json | `output/chunks.json` |
| 5 | `05_validate_chunks.py` | chunks.json | Console validation report |
| 6 | `06_embed_and_index.py` | chunks.json | `db/` (ChromaDB on disk) |
| 7 | `07_query.py` | ChromaDB + chunks.json | Retrieved chunks (CLI output) |
| 8 | `08_answer.py` | Query + retrieval results | Final LLM-generated answer |

## Components

### Document-Aware Chunker (`04_chunk_documents.py`)
The most complex module. Detects document type from the manifest and routes to one of three strategies:
- **Statute chunker**: uses regex to find section boundaries (`SECTION_START_RE`). Validates heading legitimacy (rejects illustrations, amendments, editorial notes)
- **Constitution chunker**: same approach but matches article boundaries (`ARTICLE_START_RE`) and also tracks `PART` headings as context
- **Judgment chunker**: splits at `ORDER`/`JUDGMENT` anchor → extracts paragraph blocks → applies a 3-paragraph sliding window with 1-paragraph overlap

### Retrieval Engine (`07_query.py`)
Three-tier retrieval, attempted in priority order:
1. **Exact reference match**: regex extracts section/article number from query → direct metadata filter on ChromaDB (zero vector lookup)
2. **Semantic search**: embeds query with `text-embedding-3-small` → vector similarity search from ChromaDB
3. **Lexical fallback**: term-frequency scoring with domain-specific boosts (e.g., "theft" → +15 if section_number is 378) — runs when ChromaDB is unavailable

Results are merged and deduplicated. Exact matches always come first.

### Answer Layer (`08_answer.py`)
Receives the top retrieved chunks, assembles a context window, and sends to Groq `llama-3.3-70b-versatile`. System prompt enforces: no hallucination, strict fallback message if context is insufficient.

## Data Flow
```
Raw PDFs → Text extraction → Cleaning → Document-aware chunking
         → Chunk validation → Embedding + ChromaDB indexing
         → Query → Exact ref + Semantic retrieval → LLM synthesis → Answer
```

## Storage
- `output/` — intermediate JSON files (manifest, pages, structured docs, chunks)
- `db/` — persistent ChromaDB on disk
- `docs/` — raw PDFs (gitignored)
- `.env` — API keys (gitignored)
