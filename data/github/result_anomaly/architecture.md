# Architecture — UPPSC PCS 2024 Statistical Audit

## System Overview
A two-script data extraction and analysis pipeline that operates entirely on official public PDFs. No external services, no API dependencies. The pipeline reads raw government PDF result files, extracts roll numbers using regex, groups by series prefix, and outputs structured counts for statistical comparison.

## Components

### Extraction Layer (`extract_counts.py` + `verify_extraction.py`)
- `extract_counts.py`: Opens each of the three PDFs (prelims, mains, final) using `pdfplumber`, extracts all text page by page, applies a regex pattern to find 7-digit roll numbers (with 6-digit fallback), groups them by their first two digits (series prefix), and writes the full breakdown to `counts.json`
- `verify_extraction.py`: A single-purpose validation script that confirms total candidate counts match the officially published figures (15,066 prelims / 2,720 mains / 933 final) — proving no candidates were missed or double-counted

### Analysis Layer (`report.md`)
- A structured markdown report containing four analysis tables:
  1. Prelims baseline distribution by series
  2. Prelims → Mains survival rate by group
  3. Mains → Final conversion rate by group
  4. End-to-end selection rate (prelims to final seats)
- Includes expected vs. actual variance calculation: +136 excess seats for the `00 & 01` group over their proportional expectation

## Data Flow
```
Official UPPSC PDFs (pre_2024.pdf, mains_result.pdf, final_result.pdf)
        ↓
  pdfplumber text extraction, page by page
        ↓
  Regex: extract all 7-digit roll numbers
        ↓
  Group by first 2 digits (series prefix)
        ↓
  counts.json: per-stage, per-series breakdown
        ↓
  report.md: stage-by-stage statistical comparison
```

## Edge Cases Handled
- Mains PDF has a cover page (non-data page 1) — skipped with `skip_page_1=True`
- Some UPPSC roll numbers are 6 digits — handled with fallback regex
- Verification script independently confirms total counts before any series analysis is run
