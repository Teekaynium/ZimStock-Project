import { createEffect, createMemo, createSignal, For } from 'solid-js';
import { Panel } from './components/Panel';
import { StatusPill } from './components/StatusPill';
import { TimeSeriesChart } from './components/TimeSeriesChart';
import { createDashboardData } from './lib/market';
import type { ChartPoint, DateRangeKey, ExchangeKey, MetricKey, SecurityObservation } from './types';

const dashboard = createDashboardData();

const exchangeOptions: Array<{ key: ExchangeKey; label: string }> = [
  { key: 'zse', label: 'ZSE' },
  { key: 'vfex', label: 'VFEX' },
];

const metricOptions: Array<{ key: MetricKey; label: string }> = [
  { key: 'close', label: 'Close' },
  { key: 'open', label: 'Open' },
  { key: 'volume', label: 'Volume' },
];

const rangeOptions: Array<{ key: DateRangeKey; label: string }> = [
  { key: '1m', label: '1M' },
  { key: '3m', label: '3M' },
  { key: '6m', label: '6M' },
  { key: 'ytd', label: 'YTD' },
  { key: 'all', label: 'All' },
];

const priceFormatter = new Intl.NumberFormat('en-US', {
  maximumFractionDigits: 2,
  minimumFractionDigits: 2,
});

const compactFormatter = new Intl.NumberFormat('en-US', {
  notation: 'compact',
  maximumFractionDigits: 2,
});

const wholeNumberFormatter = new Intl.NumberFormat('en-US', {
  maximumFractionDigits: 0,
});

const dateFormatter = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
});

function toneForStatus(status: string) {
  if (status === 'success') {
    return 'success';
  }

  if (status === 'warning') {
    return 'warning';
  }

  return 'danger';
}

function isExchangeKey(value: string): value is ExchangeKey {
  return value === 'zse' || value === 'vfex';
}

function formatDateTime(value: string | null) {
  if (!value) {
    return 'No data';
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 'No data' : date.toLocaleString();
}

function formatCurrency(value: number | null) {
  if (value === null) {
    return 'N/A';
  }

  return `$${priceFormatter.format(value)}`;
}

function formatCompactValue(value: number | null) {
  if (value === null) {
    return 'N/A';
  }

  return compactFormatter.format(value);
}

function formatSignedPercent(value: number | null) {
  if (value === null) {
    return 'N/A';
  }

  const prefix = value > 0 ? '+' : '';
  return `${prefix}${value.toFixed(2)}%`;
}

function formatSignedValue(value: number | null) {
  if (value === null) {
    return 'N/A';
  }

  const prefix = value > 0 ? '+' : '';
  return `${prefix}${priceFormatter.format(value)}`;
}

function metricValue(observation: SecurityObservation, metric: MetricKey) {
  return observation[metric];
}

function buildRangeStart(range: DateRangeKey, latestDate: Date) {
  if (range === 'all') {
    return null;
  }

  if (range === 'ytd') {
    return new Date(latestDate.getFullYear(), 0, 1);
  }

  const date = new Date(latestDate);
  const monthsBack = range === '1m' ? 1 : range === '3m' ? 3 : 6;
  date.setMonth(date.getMonth() - monthsBack);
  return date;
}

function filterObservations(observations: SecurityObservation[], range: DateRangeKey) {
  if (observations.length === 0 || range === 'all') {
    return observations;
  }

  const latestObservation = observations[observations.length - 1];
  const latestDate = new Date(latestObservation.date);

  if (Number.isNaN(latestDate.getTime())) {
    return observations;
  }

  const start = buildRangeStart(range, latestDate);

  if (!start) {
    return observations;
  }

  return observations.filter((observation) => new Date(observation.date) >= start);
}

function buildChartPoints(observations: SecurityObservation[], metric: MetricKey) {
  return observations.reduce<ChartPoint[]>((points, observation) => {
    const value = metricValue(observation, metric);

    if (typeof value === 'number' && value > 0) {
      points.push({ date: observation.date, value });
    }

    return points;
  }, []);
}

function valueTone(value: number | null) {
  if (value === null || value === 0) {
    return 'text-stone-700';
  }

  return value > 0 ? 'text-emerald-600' : 'text-rose-600';
}

export default function App() {
  const [activeExchange, setActiveExchange] = createSignal<ExchangeKey>('zse');
  const [selectedSecurityKey, setSelectedSecurityKey] = createSignal('');
  const [selectedMetric, setSelectedMetric] = createSignal<MetricKey>('close');
  const [selectedRange, setSelectedRange] = createSignal<DateRangeKey>('6m');

  const activeExchangeData = createMemo(() => dashboard.exchanges[activeExchange()]);
  const securityOptions = createMemo(() => activeExchangeData().securities);

  createEffect(() => {
    const options = securityOptions();
    const current = selectedSecurityKey();

    if (options.some((entry) => entry.key === current)) {
      return;
    }

    setSelectedSecurityKey(options[0]?.key ?? '');
  });

  const selectedSecurity = createMemo(() =>
    securityOptions().find((entry) => entry.key === selectedSecurityKey()) ?? null,
  );
  const filteredObservations = createMemo(() => {
    const security = selectedSecurity();
    return security ? filterObservations(security.observations, selectedRange()) : [];
  });
  const selectedSeriesPoints = createMemo(() =>
    buildChartPoints(filteredObservations(), selectedMetric()),
  );
  const latestObservation = createMemo(() => {
    const security = selectedSecurity();
    if (!security) {
      return null;
    }

    return security.observations.findLast(
      (observation) =>
        [observation.open, observation.close, observation.volume].some(
          (value) => typeof value === 'number' && value > 0,
        ),
    ) ?? null;
  });
  const previousClose = createMemo(() => {
    const security = selectedSecurity();
    if (!security) {
      return null;
    }

    const closes = security.observations
      .map((observation) => observation.close)
      .filter((value): value is number => typeof value === 'number' && value > 0);

    return closes.length > 1 ? closes[closes.length - 2] : null;
  });
  const selectedWindowHigh = createMemo(() => {
    const values = selectedSeriesPoints().map((point) => point.value);
    return values.length > 0 ? Math.max(...values) : null;
  });
  const selectedWindowLow = createMemo(() => {
    const values = selectedSeriesPoints().map((point) => point.value);
    return values.length > 0 ? Math.min(...values) : null;
  });
  const dailyChangeValue = createMemo(() => {
    const latest = latestObservation();
    const previous = previousClose();

    if (!latest || latest.close === null || previous === null) {
      return null;
    }

    return latest.close - previous;
  });

  const ratesPoints = createMemo(() =>
    dashboard.rates.points.map((point) => ({
      date: point.date,
      value: point.informalHigh - point.official,
    })),
  );

  const companyCountPoints = createMemo(() =>
    dashboard.ops.companyCountHistory.map((point) => ({
      date: point.date,
      value: point.companyCount,
    })),
  );

  return (
    <main class="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(15,118,110,0.16),_transparent_28%),radial-gradient(circle_at_top_right,_rgba(180,83,9,0.14),_transparent_24%),linear-gradient(180deg,_#f8f5ef_0%,_#f1ece4_46%,_#ebe5db_100%)] text-stone-900">
      <div class="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-10">
        <header class="rounded-[36px] border border-stone-200/70 bg-[linear-gradient(135deg,rgba(255,255,255,0.94),rgba(247,243,236,0.88))] p-6 shadow-[0_32px_120px_-48px_rgba(41,37,36,0.45)] sm:p-8">
          <div class="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div class="max-w-3xl">
              <p class="text-[0.72rem] font-semibold uppercase tracking-[0.34em] text-stone-500">
                Zimbabwe Market Monitor
              </p>
              <h1 class="mt-4 font-display text-4xl leading-none text-stone-950 sm:text-5xl">
                Market pulse first, pipeline trust close behind.
              </h1>
              <p class="mt-4 max-w-2xl text-sm leading-7 text-stone-700 sm:text-base">
                A single dashboard for Zimbabwe market activity, exchange-rate spread, and scraper health across ZSE, VFEX, and rates.
              </p>
            </div>

            <div class="grid gap-3 sm:grid-cols-2 lg:min-w-[340px]">
              <div class="rounded-[24px] border border-stone-200 bg-white/80 p-4">
                <p class="text-[0.65rem] font-semibold uppercase tracking-[0.22em] text-stone-500">Latest successful sync</p>
                <p class="mt-3 font-display text-2xl text-stone-950">{formatDateTime(dashboard.ops.latestRunAt)}</p>
              </div>
              <div class="rounded-[24px] border border-stone-200 bg-stone-950 p-4 text-stone-50">
                <p class="text-[0.65rem] font-semibold uppercase tracking-[0.22em] text-stone-400">Current exchange</p>
                <div class="mt-3 flex gap-2">
                  <For each={exchangeOptions}>
                    {(option) => (
                      <button
                        type="button"
                        onClick={() => setActiveExchange(option.key)}
                        class={`rounded-full px-4 py-2 text-sm font-semibold transition ${activeExchange() === option.key ? 'bg-white text-stone-950' : 'bg-white/10 text-stone-300 hover:bg-white/20'}`}
                      >
                        {option.label}
                      </button>
                    )}
                  </For>
                </div>
              </div>
            </div>
          </div>

          <nav class="mt-6 flex flex-wrap gap-2 text-sm text-stone-700">
            <a href="#overview" class="rounded-full border border-stone-300 bg-white/70 px-4 py-2 transition hover:bg-white">Overview</a>
            <a href="#rates" class="rounded-full border border-stone-300 bg-white/70 px-4 py-2 transition hover:bg-white">Rates</a>
            <a href="#explorer" class="rounded-full border border-stone-300 bg-white/70 px-4 py-2 transition hover:bg-white">Explorer</a>
            <a href="#ops" class="rounded-full border border-stone-300 bg-white/70 px-4 py-2 transition hover:bg-white">Ops</a>
          </nav>
        </header>

        <section class="mt-6 rounded-[28px] border border-stone-200/80 bg-white/85 px-5 py-4 shadow-[0_24px_80px_-36px_rgba(41,37,36,0.3)] backdrop-blur">
          <div class="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div class="flex flex-wrap items-center gap-3">
              <StatusPill label={dashboard.ops.overallStatus} tone={toneForStatus(dashboard.ops.overallStatus)} />
              <span class="text-sm text-stone-700">Warnings {wholeNumberFormatter.format(dashboard.ops.warningCount)}</span>
              <span class="text-sm text-stone-700">Errors {wholeNumberFormatter.format(dashboard.ops.errorCount)}</span>
              <span class="text-sm text-stone-700">Success streak {wholeNumberFormatter.format(dashboard.ops.successStreak)}</span>
            </div>
            <div class="flex flex-wrap gap-2">
              <For each={Object.entries(dashboard.ops.sources)}>
                {([source, sourceHealth]) => (
                  <div class="rounded-full border border-stone-200 bg-stone-50 px-3 py-2 text-xs font-medium text-stone-700">
                    <span class="uppercase tracking-[0.2em] text-stone-500">{source}</span>
                    <span class={`ml-2 ${sourceHealth.status === 'success' ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {sourceHealth.status}
                    </span>
                    <span class="ml-2 text-stone-500">{wholeNumberFormatter.format(sourceHealth.rowsScraped)} rows</span>
                  </div>
                )}
              </For>
            </div>
          </div>
        </section>

        <section id="overview" class="mt-8 grid gap-6 lg:grid-cols-[1.7fr_1fr]">
          <Panel
            title={`${activeExchangeData().label} Market Pulse`}
            eyebrow="Overview"
            subtitle="A compact daily read on breadth, liquidity, and the strongest move in the active exchange."
          >
            <div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              <div class="rounded-[24px] bg-stone-950 p-5 text-stone-50">
                <p class="text-[0.7rem] font-semibold uppercase tracking-[0.22em] text-stone-400">Tracked securities</p>
                <p class="mt-3 font-display text-4xl">{wholeNumberFormatter.format(activeExchangeData().summary.trackedSecurities)}</p>
                <p class="mt-2 text-sm text-stone-300">Deduplicated for display, with casing anomalies flagged below.</p>
              </div>
              <div class="rounded-[24px] border border-stone-200 bg-stone-50 p-5">
                <p class="text-[0.7rem] font-semibold uppercase tracking-[0.22em] text-stone-500">Breadth</p>
                <div class="mt-3 grid grid-cols-3 gap-3 text-sm">
                  <div>
                    <p class="font-display text-3xl text-emerald-600">{wholeNumberFormatter.format(activeExchangeData().summary.advancers)}</p>
                    <p class="mt-1 text-stone-600">Up</p>
                  </div>
                  <div>
                    <p class="font-display text-3xl text-rose-600">{wholeNumberFormatter.format(activeExchangeData().summary.decliners)}</p>
                    <p class="mt-1 text-stone-600">Down</p>
                  </div>
                  <div>
                    <p class="font-display text-3xl text-stone-700">{wholeNumberFormatter.format(activeExchangeData().summary.flat)}</p>
                    <p class="mt-1 text-stone-600">Flat</p>
                  </div>
                </div>
              </div>
              <div class="rounded-[24px] border border-amber-200 bg-amber-50 p-5">
                <p class="text-[0.7rem] font-semibold uppercase tracking-[0.22em] text-amber-700">Latest traded volume</p>
                <p class="mt-3 font-display text-4xl text-amber-950">{formatCompactValue(activeExchangeData().summary.latestVolume)}</p>
                <p class="mt-2 text-sm text-amber-900/75">Summed from the latest valid volume observation per security.</p>
              </div>
              <div class="rounded-[24px] border border-emerald-200 bg-emerald-50 p-5 sm:col-span-2 xl:col-span-3">
                <p class="text-[0.7rem] font-semibold uppercase tracking-[0.22em] text-emerald-700">Strongest daily mover</p>
                <p class="mt-3 font-display text-3xl text-emerald-950">
                  {activeExchangeData().summary.strongestMover?.name ?? 'No movement data'}
                </p>
                <div class="mt-2 flex flex-wrap gap-4 text-sm text-emerald-950/80">
                  <span>{formatSignedPercent(activeExchangeData().summary.strongestMover?.dailyChangePct ?? null)}</span>
                  <span>Close {formatCurrency(activeExchangeData().summary.strongestMover?.latestClose ?? null)}</span>
                  <span>Volume {formatCompactValue(activeExchangeData().summary.strongestMover?.latestVolume ?? null)}</span>
                </div>
              </div>
            </div>
          </Panel>

          <Panel
            title="Top Movers"
            eyebrow="Leaders"
            subtitle="Latest close-to-close change across the active exchange."
          >
            <div class="space-y-4">
              <div>
                <p class="mb-3 text-[0.65rem] font-semibold uppercase tracking-[0.24em] text-stone-500">Gainers</p>
                <div class="space-y-2">
                  <For each={activeExchangeData().summary.topGainers}>
                    {(entry) => (
                      <div class="flex items-center justify-between rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3">
                        <div>
                          <p class="text-sm font-semibold text-stone-900">{entry.name}</p>
                          <p class="text-xs text-stone-500">Close {formatCurrency(entry.latestClose)}</p>
                        </div>
                        <p class={`text-sm font-semibold ${valueTone(entry.dailyChangePct)}`}>{formatSignedPercent(entry.dailyChangePct)}</p>
                      </div>
                    )}
                  </For>
                </div>
              </div>

              <div>
                <p class="mb-3 text-[0.65rem] font-semibold uppercase tracking-[0.24em] text-stone-500">Volume Leaders</p>
                <div class="space-y-2">
                  <For each={activeExchangeData().summary.volumeLeaders}>
                    {(entry) => (
                      <div class="flex items-center justify-between rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3">
                        <div>
                          <p class="text-sm font-semibold text-stone-900">{entry.name}</p>
                          <p class="text-xs text-stone-500">Daily move {formatSignedPercent(entry.dailyChangePct)}</p>
                        </div>
                        <p class="text-sm font-semibold text-stone-900">{formatCompactValue(entry.latestVolume)}</p>
                      </div>
                    )}
                  </For>
                </div>
              </div>
            </div>
          </Panel>
        </section>

        <section id="rates" class="mt-8">
          <Panel
            title="Rates Monitor"
            eyebrow="Macro Context"
            subtitle="Official USD to ZiG sits beside the informal band so spread is always visible from the market dashboard."
          >
            <div class="grid gap-6 lg:grid-cols-[1.35fr_1fr]">
              <div class="rounded-[28px] bg-stone-950 p-5 text-stone-50">
                <div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                  <div>
                    <p class="text-[0.65rem] uppercase tracking-[0.22em] text-stone-400">Official</p>
                    <p class="mt-2 font-display text-3xl">{dashboard.rates.summary.latest ? priceFormatter.format(dashboard.rates.summary.latest.official) : 'N/A'}</p>
                  </div>
                  <div>
                    <p class="text-[0.65rem] uppercase tracking-[0.22em] text-stone-400">Informal low</p>
                    <p class="mt-2 font-display text-3xl">{dashboard.rates.summary.latest ? priceFormatter.format(dashboard.rates.summary.latest.informalLow) : 'N/A'}</p>
                  </div>
                  <div>
                    <p class="text-[0.65rem] uppercase tracking-[0.22em] text-stone-400">Informal high</p>
                    <p class="mt-2 font-display text-3xl">{dashboard.rates.summary.latest ? priceFormatter.format(dashboard.rates.summary.latest.informalHigh) : 'N/A'}</p>
                  </div>
                  <div>
                    <p class="text-[0.65rem] uppercase tracking-[0.22em] text-stone-400">Spread high</p>
                    <p class="mt-2 font-display text-3xl text-amber-300">{dashboard.rates.summary.spreadHigh !== null ? priceFormatter.format(dashboard.rates.summary.spreadHigh) : 'N/A'}</p>
                    <p class="mt-1 text-xs text-stone-400">{formatSignedPercent(dashboard.rates.summary.spreadPctHigh)}</p>
                  </div>
                </div>

                <div class="mt-6 rounded-[24px] border border-white/10 bg-white/5 p-3">
                  <TimeSeriesChart
                    data={ratesPoints()}
                    label="Informal high spread"
                    color="#f59e0b"
                    compact
                    height={200}
                    formatValue={(value) => priceFormatter.format(value)}
                  />
                </div>
              </div>

              <div class="grid gap-4">
                <div class="rounded-[24px] border border-stone-200 bg-stone-50 p-5">
                  <p class="text-[0.65rem] font-semibold uppercase tracking-[0.22em] text-stone-500">Latest rates date</p>
                  <p class="mt-3 font-display text-3xl text-stone-950">
                    {dashboard.rates.summary.latest ? dateFormatter.format(new Date(dashboard.rates.summary.latest.date)) : 'N/A'}
                  </p>
                </div>
                <div class="rounded-[24px] border border-stone-200 bg-white p-5">
                  <p class="text-[0.65rem] font-semibold uppercase tracking-[0.22em] text-stone-500">Spread low</p>
                  <p class="mt-3 font-display text-3xl text-stone-950">
                    {dashboard.rates.summary.spreadLow !== null ? priceFormatter.format(dashboard.rates.summary.spreadLow) : 'N/A'}
                  </p>
                  <p class="mt-2 text-sm text-stone-600">{formatSignedPercent(dashboard.rates.summary.spreadPctLow)} against the official rate.</p>
                </div>
                <div class="rounded-[24px] border border-stone-200 bg-white p-5">
                  <p class="text-[0.65rem] font-semibold uppercase tracking-[0.22em] text-stone-500">Rate stance</p>
                  <p class="mt-3 text-lg leading-7 text-stone-800">
                    The informal band remains materially above the official rate, which gives macro context for daily price movement and liquidity signals.
                  </p>
                </div>
              </div>
            </div>
          </Panel>
        </section>

        <section id="explorer" class="mt-8">
          <Panel
            title="Security Explorer"
            eyebrow="Chart First"
            subtitle="Pick a security, switch metric, and inspect the selected date window without leaving the dashboard."
            actions={
              <div class="flex flex-wrap gap-2">
                <For each={metricOptions}>
                  {(option) => (
                    <button
                      type="button"
                      onClick={() => setSelectedMetric(option.key)}
                      class={`rounded-full px-4 py-2 text-sm font-semibold transition ${selectedMetric() === option.key ? 'bg-stone-950 text-white' : 'bg-stone-100 text-stone-700 hover:bg-stone-200'}`}
                    >
                      {option.label}
                    </button>
                  )}
                </For>
              </div>
            }
          >
            <div class="grid gap-6 lg:grid-cols-[1.5fr_0.72fr]">
              <div class="rounded-[28px] border border-stone-200 bg-[linear-gradient(180deg,rgba(255,255,255,0.95),rgba(245,241,234,0.9))] p-4 sm:p-5">
                <div class="mb-4 grid gap-3 md:grid-cols-[1fr_auto]">
                  <div class="grid gap-3 sm:grid-cols-2">
                    <label class="block">
                      <span class="mb-2 block text-[0.65rem] font-semibold uppercase tracking-[0.22em] text-stone-500">Security</span>
                      <select
                        value={selectedSecurityKey()}
                        onInput={(event) => setSelectedSecurityKey(event.currentTarget.value)}
                        class="w-full rounded-2xl border border-stone-300 bg-white px-4 py-3 text-sm text-stone-900 outline-none transition focus:border-stone-950"
                      >
                        <For each={securityOptions()}>
                          {(entry) => <option value={entry.key}>{entry.name}</option>}
                        </For>
                      </select>
                    </label>
                    <label class="block">
                      <span class="mb-2 block text-[0.65rem] font-semibold uppercase tracking-[0.22em] text-stone-500">Exchange</span>
                      <select
                        value={activeExchange()}
                        onInput={(event) => {
                          const nextValue = event.currentTarget.value;
                          if (isExchangeKey(nextValue)) {
                            setActiveExchange(nextValue);
                          }
                        }}
                        class="w-full rounded-2xl border border-stone-300 bg-white px-4 py-3 text-sm text-stone-900 outline-none transition focus:border-stone-950"
                      >
                        <For each={exchangeOptions}>
                          {(entry) => <option value={entry.key}>{entry.label}</option>}
                        </For>
                      </select>
                    </label>
                  </div>

                  <div class="flex flex-wrap gap-2 md:justify-end">
                    <For each={rangeOptions}>
                      {(option) => (
                        <button
                          type="button"
                          onClick={() => setSelectedRange(option.key)}
                          class={`rounded-full px-3 py-2 text-sm font-semibold transition ${selectedRange() === option.key ? 'bg-amber-500 text-amber-950' : 'bg-stone-100 text-stone-700 hover:bg-stone-200'}`}
                        >
                          {option.label}
                        </button>
                      )}
                    </For>
                  </div>
                </div>

                <div class="rounded-[24px] bg-white/80 p-2 sm:p-3">
                  <TimeSeriesChart
                    data={selectedSeriesPoints()}
                    label={selectedSecurity()?.name ?? 'Security'}
                    color={selectedMetric() === 'volume' ? '#b45309' : '#0f766e'}
                    variant={selectedMetric() === 'volume' ? 'bar' : 'line'}
                    formatValue={(value) =>
                      selectedMetric() === 'volume' ? compactFormatter.format(value) : priceFormatter.format(value)
                    }
                  />
                </div>
              </div>

              <div class="grid gap-4">
                <div class="rounded-[28px] bg-stone-950 p-5 text-stone-50">
                  <p class="text-[0.65rem] font-semibold uppercase tracking-[0.22em] text-stone-400">Selection</p>
                  <p class="mt-3 font-display text-3xl">{selectedSecurity()?.name ?? 'No security selected'}</p>
                  <p class="mt-2 text-sm text-stone-300">{activeExchangeData().label} · {selectedMetric().toUpperCase()} · {selectedRange().toUpperCase()}</p>
                </div>
                <div class="rounded-[28px] border border-stone-200 bg-white p-5">
                  <div class="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p class="text-[0.65rem] uppercase tracking-[0.22em] text-stone-500">Latest open</p>
                      <p class="mt-2 font-display text-2xl text-stone-950">{formatCurrency(latestObservation()?.open ?? null)}</p>
                    </div>
                    <div>
                      <p class="text-[0.65rem] uppercase tracking-[0.22em] text-stone-500">Latest close</p>
                      <p class="mt-2 font-display text-2xl text-stone-950">{formatCurrency(latestObservation()?.close ?? null)}</p>
                    </div>
                    <div>
                      <p class="text-[0.65rem] uppercase tracking-[0.22em] text-stone-500">Latest volume</p>
                      <p class="mt-2 font-display text-2xl text-stone-950">{formatCompactValue(latestObservation()?.volume ?? null)}</p>
                    </div>
                    <div>
                      <p class="text-[0.65rem] uppercase tracking-[0.22em] text-stone-500">Daily change</p>
                      <p class={`mt-2 font-display text-2xl ${valueTone(dailyChangeValue())}`}>
                        {formatSignedValue(dailyChangeValue())}
                      </p>
                    </div>
                  </div>
                  <div class="mt-5 grid grid-cols-2 gap-4 border-t border-stone-200 pt-5 text-sm">
                    <div>
                      <p class="text-[0.65rem] uppercase tracking-[0.22em] text-stone-500">Window high</p>
                      <p class="mt-2 font-display text-2xl text-stone-950">
                        {selectedMetric() === 'volume' ? formatCompactValue(selectedWindowHigh()) : formatCurrency(selectedWindowHigh())}
                      </p>
                    </div>
                    <div>
                      <p class="text-[0.65rem] uppercase tracking-[0.22em] text-stone-500">Window low</p>
                      <p class="mt-2 font-display text-2xl text-stone-950">
                        {selectedMetric() === 'volume' ? formatCompactValue(selectedWindowLow()) : formatCurrency(selectedWindowLow())}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Panel>
        </section>

        <section id="ops" class="mt-8 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <Panel
            title="Ops And Data Quality"
            eyebrow="Pipeline"
            subtitle="Operational context stays visible, but lower on the page so market value leads the experience."
          >
            <div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <div class="rounded-[24px] border border-stone-200 bg-stone-50 p-5">
                <p class="text-[0.65rem] uppercase tracking-[0.22em] text-stone-500">Duplicate labels</p>
                <p class="mt-3 font-display text-4xl text-stone-950">{wholeNumberFormatter.format(activeExchangeData().summary.duplicateCount)}</p>
              </div>
              <div class="rounded-[24px] border border-stone-200 bg-stone-50 p-5">
                <p class="text-[0.65rem] uppercase tracking-[0.22em] text-stone-500">Warnings</p>
                <p class="mt-3 font-display text-4xl text-stone-950">{wholeNumberFormatter.format(dashboard.ops.warningCount)}</p>
              </div>
              <div class="rounded-[24px] border border-stone-200 bg-stone-50 p-5">
                <p class="text-[0.65rem] uppercase tracking-[0.22em] text-stone-500">Errors</p>
                <p class="mt-3 font-display text-4xl text-stone-950">{wholeNumberFormatter.format(dashboard.ops.errorCount)}</p>
              </div>
              <div class="rounded-[24px] border border-stone-200 bg-stone-50 p-5">
                <p class="text-[0.65rem] uppercase tracking-[0.22em] text-stone-500">Latest scrape</p>
                <p class="mt-3 font-display text-xl text-stone-950">{formatDateTime(dashboard.ops.latestRunAt)}</p>
              </div>
            </div>
          </Panel>

          <Panel
            title="Company Count History"
            eyebrow="Integrity"
            subtitle="A lightweight trend view from archived stats snapshots."
          >
            <TimeSeriesChart
              data={companyCountPoints()}
              label="Company count"
              color="#1d4ed8"
              compact
              height={220}
              formatValue={(value) => wholeNumberFormatter.format(value)}
            />
          </Panel>
        </section>
      </div>
    </main>
  );
}
