# UPPSC PCS 2024 Statistical Audit

## Problem
The UPPSC PCS 2024 examination results (Prelims → Mains → Final) are publicly available PDFs, but no one had run a systematic numerical analysis on the distribution of selections across roll number series. A visual scan of the data suggested an unusual concentration of final seats going to candidates with roll numbers starting with `00` and `01`.

## Solution
A two-script Python pipeline that extracts every roll number from the official UPPSC PDFs using regex, groups them by their first two digits (the series prefix), and tracks how each series group survived across all three exam stages. The output is a structured `counts.json` and a full statistical report.

## Key Findings
- **00 & 01 Series:** 4,927 candidates → 441 final seats (selection rate: **8.95%**)
- **02–05 Series:** 10,139 candidates → 492 final seats (selection rate: **4.85%**)
- Candidates from `02–05` were more than double in number but secured almost identical seats
- Statistical excess: **+136 seats** above the proportional expectation for the `00 & 01` group
- The concentration compounded at every stage: 32.7% at prelims → 41.8% at mains → 47.3% of final selections

## Features
- Fully verifiable: all scripts run directly on the official public PDFs
- Handles UPPSC-specific edge cases: 6-digit and 7-digit roll number formats, page-1 skip for mains PDF
- Outputs structured `counts.json` with per-stage, per-series breakdowns
- Includes a detailed `report.md` with stage-by-stage tables and statistical variance calculation
- Designed for public transparency — anyone can reproduce the numbers in minutes
