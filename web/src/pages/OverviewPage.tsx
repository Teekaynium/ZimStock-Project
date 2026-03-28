import { createEffect, createMemo, createSignal, For } from 'solid-js';
import { MetricButton } from '../components/MetricButton';
import { Panel } from '../components/Panel';
import { TimeSeriesChart } from '../components/TimeSeriesChart';
import {
  compactFormatter,
  dateFormatter,
  formatCompactValue,
  formatCurrency,
  formatSignedPercent,
  formatSignedValue,
  priceFormatter,
  valueTone,
} from '../lib/format';
import { buildChartPoints, exchangeOptions, filterObservations, isExchangeKey, metricOptions, rangeOptions } from '../lib/view';
import type { DashboardData, DateRangeKey, ExchangeKey, MetricKey } from '../types';

interface OverviewPageProps {
  dashboard: DashboardData;
  onOpenOps: (focus: string) => void;
}

export function OverviewPage(props: OverviewPageProps) {
  const [activeExchange, setActiveExchange] = createSignal<ExchangeKey>('zse');
  const [selectedSecurityKey, setSelectedSecurityKey] = createSignal('');
  const [selectedMetric, setSelectedMetric] = createSignal<MetricKey>('close');
  const [selectedRange, setSelectedRange] = createSignal<DateRangeKey>('6m');

  const activeExchangeData = createMemo(() => props.dashboard.exchanges[activeExchange()]);
  const securityOptions = createMemo(() => activeExchangeData().securities);
  const selectedSecurity = createMemo(() =>
    securityOptions().find((entry) => entry.key === selectedSecurityKey()) ?? securityOptions()[0] ?? null,
  );

  createEffect(() => {
    const security = selectedSecurity();
    if (security && security.key !== selectedSecurityKey()) {
      setSelectedSecurityKey(security.key);
    }
  });

  const filteredObservations = createMemo(() => {
    const security = selectedSecurity();
    return security ? filterObservations(security.observations, selectedRange()) : [];
  });
  const selectedSeriesPoints = createMemo(() => buildChartPoints(filteredObservations(), selectedMetric()));
  const latestObservation = createMemo(() => {
    const security = selectedSecurity();
    return security?.observations.findLast((observation) =>
      [observation.open, observation.close, observation.volume].some(
        (value) => typeof value === 'number' && value > 0,
      ),
    ) ?? null;
  });
  const previousClose = createMemo(() => {
    const closes =
      selectedSecurity()?.observations
        .map((observation) => observation.close)
        .filter((value): value is number => typeof value === 'number' && value > 0) ?? [];

    return closes.length > 1 ? closes[closes.length - 2] : null;
  });
  const dailyChangeValue = createMemo(() => {
    const latest = latestObservation();
    const previous = previousClose();

    if (!latest || latest.close === null || previous === null) {
      return null;
    }

    return latest.close - previous;
  });
  const selectedWindowHigh = createMemo(() => {
    const values = selectedSeriesPoints().map((point) => point.value);
    return values.length > 0 ? Math.max(...values) : null;
  });
  const selectedWindowLow = createMemo(() => {
    const values = selectedSeriesPoints().map((point) => point.value);
    return values.length > 0 ? Math.min(...values) : null;
  });
  const ratesPoints = createMemo(() =>
    props.dashboard.rates.points.map((point) => ({
      date: point.date,
      value: point.informalHigh - point.official,
    })),
  );

  return (
    <>
      <header class="rounded-[36px] border border-stone-200/70 bg-[linear-gradient(135deg,rgba(255,255,255,0.94),rgba(247,243,236,0.88))] p-6 shadow-[0_32px_120px_-48px_rgba(41,37,36,0.45)] sm:p-8">
        <div class="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div class="max-w-3xl">
            <p class="text-[0.72rem] font-semibold uppercase tracking-[0.34em] text-stone-500">
              Zimbabwe Market Monitor
            </p>
            <h1 class="mt-4 font-display text-4xl leading-none text-stone-950 sm:text-5xl">
              Market pulse first, ops one click away.
            </h1>
            <p class="mt-4 max-w-2xl text-sm leading-7 text-stone-700 sm:text-base">
              A market-first overview for ZSE, VFEX, and rates, with deeper pipeline diagnostics broken out into a dedicated ops page.
            </p>
          </div>

          <div class="grid gap-3 sm:grid-cols-2 lg:min-w-[340px]">
            <div class="rounded-[24px] border border-stone-200 bg-white/80 p-4">
              <p class="text-[0.65rem] font-semibold uppercase tracking-[0.22em] text-stone-500">Latest successful sync</p>
              <p class="mt-3 font-display text-2xl text-stone-950">{props.dashboard.ops.latestRunAt ? new Date(props.dashboard.ops.latestRunAt).toLocaleString() : 'No data'}</p>
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
      </header>

      <section class="mt-6 rounded-[28px] border border-stone-200/80 bg-white/85 px-5 py-4 shadow-[0_24px_80px_-36px_rgba(41,37,36,0.3)] backdrop-blur">
        <div class="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p class="text-[0.65rem] font-semibold uppercase tracking-[0.22em] text-stone-500">Pipeline snapshot</p>
            <div class="mt-3 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => props.onOpenOps('status')}
                class={`rounded-full px-4 py-2 text-sm font-semibold transition ${props.dashboard.ops.overallStatus === 'success' ? 'bg-emerald-600 text-emerald-50' : 'bg-rose-600 text-rose-50 hover:bg-rose-700'}`}
              >
                {props.dashboard.ops.overallStatus.toUpperCase()}
              </button>
              <button type="button" onClick={() => props.onOpenOps('warnings')} class="text-sm text-stone-700 underline-offset-4 hover:underline">
                Warnings {props.dashboard.ops.warningCount}
              </button>
              <button type="button" onClick={() => props.onOpenOps('errors')} class="text-sm text-stone-700 underline-offset-4 hover:underline">
                Errors {props.dashboard.ops.errorCount}
              </button>
              <button type="button" onClick={() => props.onOpenOps('runs')} class="text-sm text-stone-700 underline-offset-4 hover:underline">
                Success streak {props.dashboard.ops.successStreak}
              </button>
            </div>
          </div>
          <button
            type="button"
            onClick={() => props.onOpenOps('sources')}
            class="rounded-full border border-stone-300 bg-stone-50 px-4 py-2 text-sm font-semibold text-stone-800 transition hover:bg-stone-100"
          >
            View ops details
          </button>
        </div>
      </section>

      <section class="mt-8 grid gap-6 lg:grid-cols-[1.7fr_1fr]">
        <Panel
          title={`${activeExchangeData().label} Market Pulse`}
          eyebrow="Overview"
          subtitle="A compact daily read on breadth, liquidity, and the strongest move in the active exchange."
        >
          <div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            <MetricButton label="Tracked securities" value={`${activeExchangeData().summary.trackedSecurities}`}>
              Deduplicated for display.
            </MetricButton>
            <MetricButton label="Latest traded volume" value={formatCompactValue(activeExchangeData().summary.latestVolume)} tone="warning">
              Latest valid volume per security.
            </MetricButton>
            <MetricButton
              label="Duplicate labels"
              value={`${activeExchangeData().summary.duplicateCount}`}
              onClick={() => props.onOpenOps('duplicates')}
            >
              Click for data-quality context.
            </MetricButton>
            <div class="rounded-[24px] border border-stone-200 bg-stone-50 p-5 sm:col-span-2 xl:col-span-3">
              <p class="text-[0.7rem] font-semibold uppercase tracking-[0.22em] text-stone-500">Breadth</p>
              <div class="mt-3 grid grid-cols-3 gap-3 text-sm">
                <div>
                  <p class="font-display text-3xl text-emerald-600">{activeExchangeData().summary.advancers}</p>
                  <p class="mt-1 text-stone-600">Up</p>
                </div>
                <div>
                  <p class="font-display text-3xl text-rose-600">{activeExchangeData().summary.decliners}</p>
                  <p class="mt-1 text-stone-600">Down</p>
                </div>
                <div>
                  <p class="font-display text-3xl text-stone-700">{activeExchangeData().summary.flat}</p>
                  <p class="mt-1 text-stone-600">Flat</p>
                </div>
              </div>
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

        <Panel title="Leaders" eyebrow="Daily Read" subtitle="Latest close-to-close change and volume ranking.">
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

      <section class="mt-8">
        <Panel
          title="Rates Monitor"
          eyebrow="Macro Context"
          subtitle="Official USD to ZiG sits beside the informal band so spread stays visible from the market dashboard."
        >
          <div class="grid gap-6 lg:grid-cols-[1.35fr_1fr]">
            <div class="rounded-[28px] bg-stone-950 p-5 text-stone-50">
              <div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <MetricButton label="Official" value={props.dashboard.rates.summary.latest ? priceFormatter.format(props.dashboard.rates.summary.latest.official) : 'N/A'} />
                <MetricButton label="Informal low" value={props.dashboard.rates.summary.latest ? priceFormatter.format(props.dashboard.rates.summary.latest.informalLow) : 'N/A'} />
                <MetricButton label="Informal high" value={props.dashboard.rates.summary.latest ? priceFormatter.format(props.dashboard.rates.summary.latest.informalHigh) : 'N/A'} />
                <MetricButton label="Spread high" value={props.dashboard.rates.summary.spreadHigh !== null ? priceFormatter.format(props.dashboard.rates.summary.spreadHigh) : 'N/A'} tone="warning">
                  {formatSignedPercent(props.dashboard.rates.summary.spreadPctHigh)}
                </MetricButton>
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
              <MetricButton label="Latest rates date" value={props.dashboard.rates.summary.latest ? dateFormatter.format(new Date(props.dashboard.rates.summary.latest.date)) : 'N/A'} />
              <MetricButton label="Spread low" value={props.dashboard.rates.summary.spreadLow !== null ? priceFormatter.format(props.dashboard.rates.summary.spreadLow) : 'N/A'}>
                {formatSignedPercent(props.dashboard.rates.summary.spreadPctLow)} against official.
              </MetricButton>
              <div class="rounded-[24px] border border-stone-200 bg-white p-5 text-lg leading-7 text-stone-800">
                The informal band remains materially above the official rate, which gives macro context for daily price movement and liquidity signals.
              </div>
            </div>
          </div>
        </Panel>
      </section>

      <section class="mt-8">
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
                      <For each={securityOptions()}>{(entry) => <option value={entry.key}>{entry.name}</option>}</For>
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
                      <For each={exchangeOptions}>{(entry) => <option value={entry.key}>{entry.label}</option>}</For>
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
                    <p class={`mt-2 font-display text-2xl ${valueTone(dailyChangeValue())}`}>{formatSignedValue(dailyChangeValue())}</p>
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
    </>
  );
}
