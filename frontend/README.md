# Frontend UI Module (`/frontend/`)

This directory contains the client-side infrastructure that renders ArunCore's identity on the web. It is physically isolated from the Python backend, allowing highly decoupled deployment pipelines.

## Tech Stack
*   **Framework:** Next.js (TypeScript)
*   **Styling:** Raw CSS Global Interception (Vanilla CSS Modules)
*   **Markdown Core:** `ReactMarkdown` paired with `remark-gfm`.

## Architecture Details

### Session Architecture
To ensure users can maintain a continuous conversation stream, the frontend relies on `uuidv4` mapping to cache a unique `aruncore_session_id` in HTML5 `sessionStorage`. Upon page refresh, conversational memory context resets, ensuring data privacy across transient browser instances.

### Visual State Engine
The app (`page.tsx`) uses a responsive boolean hook (`isMobile`) mapped directly to `window.innerWidth`. Instead of fighting complex heavy-duty CSS media queries, it executes complete structural DOM swapping:
*   **Desktop Layout:** Renders split-pane architecture (Sidebar Identity Card + Chat Window).
*   **Mobile Layout:** Compresses cleanly into a unified sticky top-bar with ultra-high contrast chat elements.

### Parsing Constraints
Due to the often inconsistent generation mechanics of quantized LLMs, the Markdown renderer is decoupled and strict. It receives raw API text directly, utilizing preprocessor heuristics where necessary to ensure standard UI structures (like bolded elements) aren't broken by erratic line formatting.
