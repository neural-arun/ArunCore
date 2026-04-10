# Key Decisions — 99acres Real Estate Scraper Suite

## Decision 1: Three separate scraper implementations instead of one
**What:** The project has three distinct scrapers (v1, v2, v3) rather than a single unified tool.
**Why:** Each version was built incrementally as the previous one hit a wall. v1 worked but produced too many N/A fields from search result cards alone. v2 improved accuracy by visiting each individual listing page, but was slow due to browser overhead. v3 eliminated the browser entirely by using async HTTP and proved to be the production-grade solution. Each version solved a specific limitation of the one before it.

## Decision 2: playwright-stealth on the browser scrapers
**What:** `playwright-stealth` is applied to every browser context to suppress bot-detection fingerprints.
**Why:** 99acres is a JavaScript-heavy dynamic site with no discoverable hidden API in the network tab. Browser automation with raw Playwright was detectable — the site presented obstacles to unpatched browser instances. `playwright-stealth` patches the browser's automation fingerprints (navigator.webdriver, user-agent inconsistencies, etc.) making it appear as a real Chrome session.

## Decision 3: Semantic anchoring on ₹ symbol instead of CSS class selectors (v1)
**What:** The v1 scraper finds property cards by locating all elements containing `₹` and walking up the DOM — not by targeting specific class names.
**Why:** A robustness decision. 99acres is known to change and obfuscate its CSS class names, which makes class-selector-based scrapers brittle — they silently break the moment the site redeploys. Anchoring on the `₹` currency symbol is a semantic signal that is intrinsic to the content itself and will not change regardless of how the site's markup evolves.

## Decision 4: JSON-LD extraction as primary data source in v3
**What:** v3 reads data from `<script type="application/ld+json">` tags rather than scraping visible HTML elements.
**Why:** 99acres embeds machine-readable structured data in JSON-LD format directly in the HTML source — this is their SEO implementation. Discovered by inspecting the raw page source. JSON-LD is far more reliable than scraping rendered elements because it is structured, consistently formatted, and not affected by layout or CSS changes. It is the cleanest possible data source on any page that provides it.

## Decision 5: ScraperAPI instead of building custom proxy rotation
**What:** v3 routes all traffic through ScraperAPI's residential proxy network to bypass Cloudflare.
**Why:** Direct HTTP requests to 99acres return 403 Forbidden immediately. Free proxy lists were tried first but proved unreliable — high failure rates, inconsistent IP quality, and no CAPTCHA handling. ScraperAPI provides managed residential proxies with built-in Cloudflare bypass and CAPTCHA solving, making it the practical choice over investing time in building and maintaining a custom rotation infrastructure.

## Decision 6: asyncio.Semaphore(5) to throttle concurrent detail page fetches
**What:** v3 caps simultaneous property detail page requests at 5 using a semaphore.
**Why:** Both a reliability and a courtesy measure. Without throttling, launching hundreds of concurrent requests caused connection errors, timeouts, and increased the risk of triggering rate-limit blocks from ScraperAPI's upstream infrastructure. A semaphore of 5 kept the request volume stable, eliminated timeout errors, and reduced the chance of the scraping session being flagged.
