# Key Decisions — Legal RAG System

## Decision 1: Document-type-aware chunking instead of fixed-size chunking
**What:** Each document type (statute, constitution, judgment) has its own dedicated chunking function with different boundary detection logic.
**Why:** The structure of Indian legal documents varies significantly across types. The Constitution is organized by articles, the IPC by sections, and court judgments by numbered paragraphs. Applying a generic fixed-size chunker would cut across these natural boundaries, splitting a single section or article into multiple fragments and destroying the semantic unit. Document-specific chunking was necessary to keep each legal reference intact and retrievable as a whole.

## Decision 2: Sequential numbered scripts (01_ to 08_) instead of a monolithic pipeline
**What:** Each stage is a standalone script that reads from and writes to JSON files in a shared output directory.
**Why:** This was a deliberate choice for debuggability, similar in philosophy to Jupyter notebooks. Each stage can be re-run independently without triggering the full pipeline. If chunking produces bad output, only stage 4 needs to be re-run — not the PDF extraction or embedding stages. This also made it easy to inspect intermediate outputs at every step.

## Decision 3: ChromaDB for vector storage (local, persistent)
**What:** ChromaDB running on disk instead of a cloud vector DB like Pinecone or Weaviate.
**Why:** Local-first development was the priority here. Using ChromaDB avoided any external API dependency during early builds, which meant the system could be fully run and tested offline. Cost was also a factor — cloud vector DBs introduce per-write and per-query costs that are unnecessary when the corpus is small and the environment is a development machine.

## Decision 4: Exact reference extraction before semantic search
**What:** When a query contains "Section 302 IPC" or "Article 21", the system extracts the reference with regex and does a direct metadata filter — bypassing the vector search entirely.
**Why:** Semantic search was failing on exact section and article lookups. Embedding-based similarity works well for conceptual queries but consistently returned the wrong chunks when a user asked for a specific section number. Adding a regex extraction step that directly filters by `section_number` or `article_number` metadata solved this completely and made exact lookups 100% reliable.

## Decision 5: Groq + llama-3.3-70b-versatile for generation
**What:** Used Groq's hosted inference instead of OpenAI for the final answer generation.
**Why:** Both speed and cost. Groq's inference is significantly faster than OpenAI's API for models of comparable capability, and the cost-per-token is lower. For a system where the answer generation step runs after retrieval is already complete, fast inference creates a noticeably better user experience.

## Decision 6: Lexical fallback when ChromaDB is unavailable
**What:** If ChromaDB cannot be opened, the system falls back to a term-frequency scoring function with domain-specific keyword boosts hardcoded per legal concept.
**Why:** During development, ChromaDB occasionally failed to connect — particularly when the DB was in an inconsistent state mid-build. Rather than crashing the query interface, a lexical fallback was added so the system could still return useful results without the vector index. This also made the query module useful before embeddings had ever been generated.

## Decision 7: Validation stage before embedding
**What:** `05_validate_chunks.py` runs quality checks on chunks before any embeddings are generated.
**Why:** Early versions produced bad chunks — fragments that were too short, had malformed IDs, or had inconsistent page ranges due to edge cases in the chunking logic. These bad chunks polluted the ChromaDB index and degraded retrieval quality. Adding a dedicated validation gate before embedding enforced a quality floor and made it much easier to catch chunking bugs before they propagated downstream.
