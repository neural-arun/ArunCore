# The Knowledge Base (`/data/`)

This directory is the absolute source of truth for the digital twin's semantic memory. The data here is strictly separated into core identity configurations and isolated architectural projects.

## Directory Breakdown

### `static/`
The files in this folder are prioritized during parsing and inserted directly into the system prompt context. 
*   **`public_profile.md`**: Defines global constants about Arun (location, high-level skills, direct links).
*   **`rules_of_engagement.md`**: The behavioral constraint matrix. This dictates formatting limits (e.g., Markdown generation behavior) and topical vetos (e.g., refusing to answer salary questions).

### `github/`
This cluster contains isolated project nodes. When `ingest.py` runs, it recursively parses these sub-folders, converting the Markdown and JSON documents into deeply dense, interconnected vector maps.
*   **Narrative Files (`overview.md`, `decisions.md`)**: Instructs the LLM on *why* certain actions were taken.
*   **Structural Files (`metadata.json`)**: Allows precise routing parameters, ensuring the RAG pipeline understands technology stacks.
*   **Master Indices (`master_portfolio_summary.md`)**: Used to seed global summary answers without requiring the LLM to process thousands of discrete vector chunks.
