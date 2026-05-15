# Zimbabwe Market Monitor V1

## Goal

Ship a market-first dashboard that proves the project data is useful at a glance while keeping scraper and data-health visibility present but secondary.

## Audience

- Internal operator validating pipeline freshness and integrity
- Public or prospective user evaluating whether the market dataset is worth following

## Product Promise

In one screen, a user should be able to understand:

- whether the data pipeline is healthy and current
- what happened most recently in the market
- how official and informal exchange rates compare
- how one selected security has behaved over time

## V1 Success Criteria

- Latest market activity is understandable within 10 seconds
- Rates and stock data both feel first-class
- Scrape health is visible without dominating the experience
- The app works well on desktop and remains usable on mobile
- The UI reads directly from the existing JSON archives without backend changes

## Data Sources

- `archive-single-file/open_price_zse.json`
- `archive-single-file/close_price_zse.json`
- `archive-single-file/vol_traded_zse.json`
- `archive-single-file/open_price_vic.json`
- `archive-single-file/close_price_vic.json`
- `archive-single-file/vol_traded_vic.json`
- `archive-single-file/rates.json`
- `logs/scrape_log.json`
- `stats.json`

## Known Data Caveats

- ZSE contains duplicate company labels with casing differences
- Rates data appears row-oriented while stock data is matrix-oriented
- Some series may contain nulls, zeros, or sparse trading days
- Existing web app currently points at legacy files and should be migrated to exchange-specific sources

## Navigation

Single-page app with section navigation and exchange tabs.

- Overview
- ZSE
- VFEX
- Rates
- Ops

V1 can ship as one long dashboard with anchor links or visible sections before introducing page-level routing.

## Layout

### 1. Header

- Product title: `Zimbabwe Market Monitor`
- Short supporting line explaining the dashboard covers market, rates, and scrape health
- Last successful update timestamp
- Quick exchange toggle: `ZSE` / `VFEX`

### 2. Health Bar

Compact top strip showing:

- overall scrape status
- source statuses for `ZSE`, `VFEX`, `Rates`
- warnings count
- latest scrape timestamp

This bar must stay compact and never visually overpower market content.

### 3. Market Pulse Row

Primary summary cards for the active exchange:

- tracked securities count
- advancers count
- decliners count
- flat count
- total latest-day traded volume
- strongest daily mover

Daily movement is based on latest valid close versus prior valid close.

### 4. Leaders Row

Two side-by-side ranked tables:

- top gainers
- volume leaders

Each row includes:

- security name
- latest close or latest volume
- daily percent move where available

Optional third card if space allows:

- top losers

### 5. Rates Row

Dedicated rates panel that remains visible from the Overview screen even when the active exchange is `ZSE` or `VFEX`.

Must show:

- official USD->ZiG rate
- informal low
- informal high
- spread against official
- recent trend chart

The spread should be the most visually emphasized derived metric.

### 6. Explorer Row

Hero chart area with controls.

Controls:

- exchange selector
- security selector with search
- metric toggle: `close`, `open`, `volume`
- date-range presets: `1M`, `3M`, `6M`, `YTD`, `All`

Chart behavior:

- line chart for price metrics
- bar or area treatment for volume
- clean tooltip with date, value, and daily move when possible
- empty-state handling for sparse or missing series

Supporting side panel:

- latest open
- latest close
- latest volume
- daily change
- range high/low for selected window

### 7. Data Quality And Ops Row

Operational context displayed lower on the page:

- duplicate company name alert count
- latest rows scraped per source
- recent success streak or failure state
- company-count history from `stats.json`

This section should feel trustworthy and diagnostic, not noisy.

## Visual Direction

- Clean financial dashboard
- Light-first theme
- Dense information design with strong whitespace discipline
- Serious, editorial typography rather than generic startup styling
- Positive and negative movement colors should be clear and restrained
- Rates panel should visually connect macro context with market activity

## Interaction Rules

- Exchange tab changes all market summaries and explorer data
- Rates panel remains globally visible
- Ops strip remains global
- Selected security persists when switching metric if available
- Search should prioritize exact and prefix matches
- Duplicate company labels should be normalized for display where safe

## Derived Metrics

For each exchange/security/date where data exists:

- `dailyChange = latestClose - previousClose`
- `dailyChangePct = ((latestClose - previousClose) / previousClose) * 100`
- `intradayGap = close - open`
- `spreadLow = informalLow - official`
- `spreadHigh = informalHigh - official`
- `spreadPctLow = (spreadLow / official) * 100`
- `spreadPctHigh = (spreadHigh / official) * 100`

## Implementation Plan

### Phase 1

- replace legacy file imports with exchange-specific datasets
- create a normalization layer for stock, rates, scrape-log, and stats data
- build the dashboard layout and cards
- build one reusable chart component for price and volume views

### Phase 2

- improve duplicate-name normalization
- add richer ops trend visuals
- add compare overlays between selected security and rates spread

## Out Of Scope For V1

- authentication
- watchlists or portfolios
- backend/API rewrite
- intraday market data
- news, alerts, or notifications
- advanced technical indicators

## Acceptance Checklist

- overview communicates value even before any interaction
- exchange toggle works for `ZSE` and `VFEX`
- rates section renders from live archived JSON
- explorer supports metric and date-range switching
- ops status is visible on first screen
- mobile layout stacks cleanly without losing critical context
