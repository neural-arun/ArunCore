# 99acres Real Estate Scraper Suite

## Problem
99acres.com is protected by Cloudflare's bot detection, which blocks direct HTTP requests with a 403. Property listing data (price, location, size, contact) is distributed across hundreds of dynamic pages, making manual collection slow and scraping technically non-trivial.

## Solution
Three independent scrapers implementing progressively more powerful extraction strategies — from free browser automation to professional-grade parallel HTTP scraping through a proxy API — all outputting the same structured CSV format.

## The 3 Scrapers

**v1 — Semantic Browser Scraper (`semantic_browser_scraper/`)**
Uses Playwright with `playwright-stealth` to launch a headless Chromium browser, navigate to 99acres search results, scroll to trigger dynamic content loading, and extract property cards by anchoring on the ₹ currency symbol. Walks up the DOM tree from each price element to its card container. Fast and free — no API key required.

**v2 — Deep Browser Scraper (`deep_browser_scraper/`)**
Also uses Playwright, but clicks into every individual listing page rather than reading cards from search results. Produces higher data quality (fewer N/A fields) at the cost of speed. Best for clean datasets where contact info and exact size matter.

**v3 — Parallel HTTP Scraper (`parallel_http_scraperapi/`)**
No browser — uses async HTTP/2 requests via `httpx` routed through ScraperAPI's residential proxy network to bypass Cloudflare. Fetches 5+ search pages simultaneously with `asyncio.gather`. Parses structured data from JSON-LD `<script>` tags embedded in the HTML (SEO data), with a text-scan fallback for any remaining N/A fields. Outputs a data quality summary report per run.

## Output
All scrapers export a CSV with columns: `City`, `Price`, `Location`, `Size (sqft)`, `Contact Info`, `URL`
