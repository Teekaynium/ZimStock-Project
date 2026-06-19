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
   - `numeric_difference`
   - `missing_in_older_scraper`
   - `missing_in_local`
   - `missing_date_in_older_scraper`
   - `missing_date_in_local`
   - `duplicate_in_local_archive`
5. **Report** (task 5): `reports/overlap_mismatch_report.csv` is the flat
   audit log; the two xlsx files add a `Review List` sheet (with
   `review_status / review_decision / review_notes` columns) plus summary
   sheets. Task 4 is the live list; task 5 is the frozen snapshot to
   approve before touching `archive/`.

## Notes

- The CSVs use `MM-DD-YYYY` filenames. The XLSX subset has no embedded date
  and a few files are corrupt (`zipfile.BadZipFile`), so they are skipped.
- "Sentinel 0" in the older scraper means "no data for this field on this
  day". These show up as `missing_in_older_scraper`, not as `numeric_difference`.
- A handful of companies (Zimbabwe Stock Exchange Holdings, Tn Cybertech
  Investments Holdings, Ok Zimbabwe Limited Las) only appear in the local
  consolidated file, never in the older scraper. They account for the bulk
  of `missing_in_older_scraper` rows and can be filtered in the review.
- `duplicate_in_local_archive` is detected by reading every folder
  snapshot under `../archive/`. The three dates with duplicate folders
  (`2024-11-10`, `2025-07-01`, `2025-08-05`) are checked; only
  `2025-07-01` has actual value mismatches.
