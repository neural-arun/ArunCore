# Neural Arun Labs

## What This Is
A personal lab repository containing small, practical utility scripts and scraping experiments. Projects here are built for real use — not tutorials.

## Projects

### 01 — File Organiser (`01_file_organiser/`)
A Python script that auto-sorts any folder into 4 subdirectories: `PDFs/`, `Videos/`, `Images/`, and `Others/`. Drop the script into any messy folder and run it — built as a genuine daily-use utility.

**Problem solved:** Downloads and project folders accumulate mixed filetypes quickly. Sorting manually is tedious.
**How it works:** Scans the current directory, detects file extensions, creates destination folders if missing, and moves each file to the appropriate one.

### 02 — Real Estate Scraping Experiment (`02_real_estate_scraping/`)
An early scraping experiment targeting real estate listing data. The foundation and research ground for the more mature `real_state_listing_scraper` project. Contains raw data CSVs and exploration scripts.

## Tech Stack
Python, pathlib, Playwright, pandas
