# docs/

This folder contains the internal documentation, standard operating procedures (SOPs), and operational workflows for maintaining the ArunCore system. 

Unlike the `data/` folder (which holds the knowledge base for the AI agent to read), this folder is specifically for **human developers** managing the system.

## Folder Structure

### `workflows/`
Contains step-by-step guides on how to operate and scale the system without breaking its architecture.
- `adding_new_data.md` — The exact ingestion workflow for adding new GitHub projects, updating LinkedIn posts, or modifying the core identity profile cleanly using file hashing and deterministic upserts.

*(Future additions will include deployment workflows, database reset procedures, and model evaluation protocols).*
