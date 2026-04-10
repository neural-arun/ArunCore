# Key Decisions — UPPSC PCS 2024 Statistical Audit

## Decision 1: pdfplumber for text extraction instead of pypdf
**What:** Used pdfplumber to extract text from the UPPSC result PDFs.
**Why:** pdfplumber was the natural first choice for this type of forensic PDF work. It handles raw text extraction well from government-style PDFs where layout can be inconsistent.

## Decision 2: Regex on raw text instead of table parsing
**What:** Roll numbers were extracted using regex (`\b\d{7}\b`) on raw page text rather than trying to parse structured table data.
**Why:** The UPPSC PDFs contain a large volume of numbers beyond just roll numbers — page numbers, registration IDs, and other numeric data. Table parsing would have required precise column alignment assumptions that the PDFs do not reliably provide. Regex targeting the 7-digit roll number pattern (with a 6-digit fallback) proved to be the more robust and precise approach.

## Decision 3: Series prefix grouping by first 2 digits
**What:** Candidates are grouped by the first two digits of their roll number (`r[:2]`) to identify their series.
**Why:** The investigation started from observing that the anomaly was concentrated among candidates whose roll numbers started with `00` and `01`. Grouping by the first two digits was the natural way to isolate these series and compare their selection rates against the rest of the pool across all three exam stages.

## Decision 4: Separate verification script before analysis
**What:** A standalone `verify_extraction.py` script confirms total candidate counts before any series-level analysis is run.
**Why:** Because the source data is official government examination results, the integrity of the extraction had to be independently provable. The verification script confirms that the total counts extracted (15,066 prelims / 2,720 mains / 933 final) match the officially published figures exactly — making the entire analysis fully reproducible and publicly defensible. Anyone questioning the methodology can run the script themselves.

## Decision 5: Mains PDF page-1 skip
**What:** The mains PDF skips the first page with `skip_page_1=True`.
**Why:** Page 1 of the mains PDF did not contain any roll numbers — it was a cover or header page. Including it in the extraction loop added no data and risked pulling in stray numbers from the page layout. Skipping it explicitly kept the extraction clean.
