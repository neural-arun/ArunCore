# Architecture — 99acres Real Estate Scraper Suite

## System Overview
Three parallel scraper implementations sharing a common output schema. Each scraper is a self-contained module with its own strategy, tradeoffs, and use case. All produce the same structured CSV. The shared venv at the root level provides dependencies across all three.

## Scraper v1 — Semantic Browser (`semantic_browser_scraper/scraper.py`)

**Strategy:** Browser automation with semantic DOM anchoring.

1. Playwright launches a Chromium browser with `playwright-stealth` to suppress bot-detection signals
2. Navigates to the 99acres search URL with city and page parameters
3. Scrolls 8 times to trigger lazy-loaded property cards
4. Finds all elements containing the `₹` symbol (semantic anchor)
5. For each price element, walks up the DOM with XPath to the nearest ancestor `div` containing a link — this identifies the full property card
6. Extracts inner text from the card and parses it line by line using keyword matching (`BHK`, `Apartment`, `sq.ft`, `Dealer`, `Agent`, etc.)
7. Deduplicates via a `set()` of card text content before appending

**Tradeoffs:** Free, no API key needed. Slower due to browser overhead and scroll delays. Some N/A fields expected due to DOM variability.

---

## Scraper v3 — Parallel HTTP (`parallel_http_scraperapi/scraperv3.py`)

**Strategy:** Browserless async HTTP via ScraperAPI proxy + JSON-LD structured data extraction.

**Phase 1 — Parallel search page fetch:**
- Builds all search page URLs for the given city and page count
- Fires all requests simultaneously with `asyncio.gather` (no sequential waiting)
- Each response is parsed for `<script type="application/ld+json">` tags — 99acres embeds machine-readable `ItemList` JSON-LD on every search results page
- Extracts `(name, url)` pairs for every listed property and deduplicates by URL

**Phase 2 — Concurrent property detail fetch:**
- Fetches each individual property detail page concurrently, throttled by a `asyncio.Semaphore(5)` to cap at 5 parallel requests
- For each page: tries JSON-LD first (`Apartment`, `House`, `LandParcel` schema types) for clean structured fields (price, address, floor size)
- Falls back to raw text scan with regex and keyword matching for any fields still N/A after JSON-LD parsing

**Proxy routing:**
- All requests are wrapped through `https://api.scraperapi.com/?api_key=...&url=...&country_code=in`
- ScraperAPI handles IP rotation and Cloudflare bypass on their side
- If no API key is provided, requests go direct (blocked by 99acres with 403)

**Output:** Per-run data quality summary showing fill rate for each column, then CSV export.

---

## Data Flow (v3)
```
CLI args (city, pages, api-key)
        ↓
Build search page URLs
        ↓
asyncio.gather → fetch all search pages in parallel via ScraperAPI
        ↓
Parse JSON-LD ItemList → extract (name, url) for each listing
        ↓
Semaphore(5) → fetch each property detail page concurrently
        ↓
JSON-LD parse → text-scan fallback for N/A fields
        ↓
Data quality summary → CSV export
```
