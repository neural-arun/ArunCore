# Legal RAG System

## Problem
Indian legal material — IPC statutes, the Constitution, and court judgments — is dense, structurally inconsistent, and impossible to search accurately with generic text chunking. Standard RAG pipelines applied to these documents produce poor retrieval because they ignore the real structural units of legal text (sections, articles, paragraph blocks).

## Solution
An 8-stage pipeline that processes raw legal PDFs with document-type-aware chunking strategies, validates chunk quality before embedding, and retrieves answers using a hybrid exact-reference + semantic search approach.

- IPC statutes are chunked at the **section** boundary
- The Constitution is chunked at the **article** boundary
- Court judgments are chunked by **paragraph blocks** (with a sliding window of 3 paragraphs, 1 overlap)

## Key Features
- Manifest-driven pipeline: each stage reads from the output of the previous one — no skipped steps
- Document-specific regex patterns for detecting legal headings (handles amendments, illustrations, and editorial noise)
- Exact reference extraction from natural language queries (e.g., "Section 302 IPC" → direct metadata match; no vector lookup needed)
- Semantic fallback via ChromaDB + `text-embedding-3-small` for concept-level queries
- Lexical fallback if ChromaDB is unavailable — the system degrades gracefully
- Built-in retrieval evaluation suite: 10 test cases covering exact section/article lookup, semantic concept retrieval, and case-based questions
- Answer generation via Groq `llama-3.3-70b-versatile` with a strict no-hallucination policy — returns "I do not have information regarding this." when retrieval is insufficient

## Corpus
- IPC.pdf
- constitution.pdf
- case_1.PDF (New India Assurance Co. Ltd. vs Neerja Singh)
- case_2.PDF (Hira Lal Chaudhary vs State)
