# Older ZSE daily pricesheets

Vendored copy of the CSV pricesheets from
[bevennyamande/Zimbabwe-Stock-Exchange-Daily-Pricesheets](https://github.com/bevennyamande/Zimbabwe-Stock-Exchange-Daily-Pricesheets)
(`csv-daily-pricesheets/`), kept here as read-only reference data for the
comparison work described in `DATA_SOURCES.md`.

## Scope per DATA_SOURCES.md

- Import window: `2020-10-08` through `2024-11-08`
- Filenames are date-stamped `MM-DD-YYYY` in this copy
- Stop before this repository's first local archive date (`2024-11-10`) to avoid
  overlap with `archive/` and `archive-single-file/`

## Note on filename date format

The upstream repository has used date-stamped filenames over time. The brief in
`DATA_SOURCES.md` calls this out explicitly. The earliest record the brief
references (`2020-10-08`) is not present under either format interpretation;
the closest is `10-10-2020.csv` (October 10, 2020) or `08-10-2020.csv` (August
10, 2020, depending on whether you read the older XLSX filenames as
`DD-MM-YYYY` or `MM-DD-YYYY`). Confirm the format before importing.

## Layout

```
reference-data/older-zse/
  csv-daily-pricesheets/   1,352 files, MM-DD-YYYY, 2022-02-25 → 2026-06-19
    MM-DD-YYYY.csv
    ...
  xls-daily-price-sheets/  1,424 files, 4 cols (Company, Open, Close, Volume)
    MM-DD-YYYY.xlsx
    ...
```

XLSX files were added on a second pass. A few XLSX files are corrupt (bad zip
headers) and will fail to open. Both folders share the same `MM-DD-YYYY`
filename convention.

The XLSX format has no embedded date and the brief warns that the older
repository has used date-stamped filenames over time. A small spot check
(`10-10-2020.xlsx` vs `11-10-2020.xlsx`) shows identical data, so the date in
the filename is not always reliable for the XLSX subset. Confirm the format
per the brief before importing.
