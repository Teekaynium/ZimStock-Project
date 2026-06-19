# Comparison: older ZSE vs local archive

Reproducible build of the 5 handoff tasks in `DATA_SOURCES.md`. Source data is
the vendored repo under `../reference-data/older-zse/`; comparison target is
this repository's `../archive/` folders plus `../archive-single-file/*.json`.

## Run

```
python3 compare_older_zse.py
```

The script writes:

- `older-normalized/opening_price.json`
- `older-normalized/closing_price.json`
- `older-normalized/vol_traded.json`
- `reports/overlap_mismatch_report.csv`
- `reports/task4_review_workbook.xlsx`
- `reports/task5_reviewable_mismatches_before_archive_changes.xlsx`

## What it does

1. **Import** (task 1): reads every CSV in
   `reference-data/older-zse/csv-daily-pricesheets/` (and every XLSX in
   `xls-daily-price-sheets/`) using the brief's import window
   `2020-10-08 → 2024-11-08`.
2. **Normalize** (task 2): writes the older records into the same
   `columns / index / data` shape as `../archive-single-file/`, one JSON per
   field, under `older-normalized/`.
3. **Compare** (task 3): for every date `≥ 2024-11-09`, joins older and local
   on `(date, company, field)` and emits a row per disagreement.
4. **Flag** (task 4): each row is one of
   - `numeric_difference` — both sides have a value but they disagree
   - `missing_in_older_scraper` — local has a value, older has none, or older
     has the sentinel `0` while local has a real value
   - `missing_in_local` — older has a value, local does not
   - `missing_date_in_older_scraper` — date exists locally, not in older
   - `missing_date_in_local` — date exists in older, not locally
   - `duplicate_in_local_archive` — two folder snapshots for the same date
     disagree on a value
   - `consolidated_only_company` — company appears in the local consolidated
     file but never in any older-scraper day; safe to filter out in review
5. **Report** (task 5): `reports/overlap_mismatch_report.csv` is the flat
   audit log; the two xlsx files add a `Review List` sheet (with
   `review_status / review_decision / review_notes` columns) plus summary
   sheets. Task 4 is the live list; task 5 is the frozen snapshot to
   approve before touching `archive/`.

## Notes

- The CSVs use `MM-DD-YYYY` filenames. The XLSX subset has no embedded date
  and a few files are corrupt (`zipfile.BadZipFile`), so they are skipped.
- "Sentinel 0" in the older scraper means "no data for this field on this
  day". When local has a real value and older reports `0`, the row is
  classified as `missing_in_older_scraper` (not `numeric_difference`).
  When both sides are `0`, the row is silently skipped as a match.
- Three companies (Zimbabwe Stock Exchange Holdings, Tn Cybertech
  Investments Holdings, Ok Zimbabwe Limited Las) only appear in the local
  consolidated file, never in any older-scraper day. Every row for them
  is tagged `consolidated_only_company` so the review can filter them out.
- `duplicate_in_local_archive` is detected by reading every folder
  snapshot under `../archive/`. The three dates with duplicate folders
  (`2024-11-10`, `2025-07-01`, `2025-08-05`) are checked; only
  `2025-07-01` has actual value mismatches.
