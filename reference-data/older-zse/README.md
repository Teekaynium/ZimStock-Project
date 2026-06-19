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
  csv-daily-pricesheets/
    MM-DD-YYYY.csv
    ...
```

`xls-daily-price-sheets/` from upstream was intentionally excluded to keep this
folder small; the CSVs are the canonical read-only record.
