# Data Sources

## Earlier ZSE records

Repository: https://github.com/bevennyamande/Zimbabwe-Stock-Exchange-Daily-Pricesheets

That project contains older ZSE daily pricesheet records in `xls-daily-price-sheets/` and `csv-daily-pricesheets/`.

Observed range:

- Earliest older pricesheet record: `2020-10-08`
- This repository's consolidated ZSE archive starts: `2024-11-09`
- Import window from the older repository: `2020-10-08` through `2024-11-08`

Note: the older repository has used date-stamped filenames over time. Confirm filename date format while importing, then stop before this repository's first local archive date to avoid overlap.

## Handoff tasks

1. Import older ZSE pricesheet records from `2020-10-08` through `2024-11-08`.
2. Normalize imported records into this repository's `archive-single-file/` shape for open price, close price, and volume traded.
3. Compare the overlap between both scrapers for the period where this repository already has local records.
4. Flag inconsistencies by date, company, field, this repository's value, and the older scraper's value.
5. Keep mismatches in a reviewable report before changing existing archived values.

Comparison scope:

- Local ZSE archive starts on `2024-11-09`.
- Compare any older-repository records from `2024-11-09` onward against this repository's collected data.
- Treat exact matches as verified.
- Treat missing companies, renamed companies, numeric differences, and missing dates as inconsistencies to review.
