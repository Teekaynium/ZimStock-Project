import { createMemo, For, Show } from 'solid-js';
import { Panel } from '../components/Panel';
import { StatusPill } from '../components/StatusPill';
import { TimeSeriesChart } from '../components/TimeSeriesChart';
import { formatDateTime, toneForStatus, wholeNumberFormatter } from '../lib/format';
import type { DashboardData, OpsRunSummary } from '../types';

interface OpsPageProps {
  dashboard: DashboardData;
  focus: string;
  selectedRunTimestamp: string | null;
  onSelectRun: (timestamp: string) => void;
}

function focusTitle(focus: string) {
  if (focus === 'errors') {
    return 'Error drilldown';
  }

  if (focus === 'warnings') {
    return 'Warning drilldown';
  }

  if (focus === 'duplicates') {
    return 'Duplicate label context';
  }

  if (focus === 'sources') {
    return 'Source status details';
  }

  return 'Recent run details';
}

function companyCountPoints(dashboard: DashboardData) {
  return dashboard.ops.companyCountHistory.map((point) => ({
    date: point.date,
    value: point.companyCount,
  }));
}

export function OpsPage(props: OpsPageProps) {
  const selectedRun = createMemo<OpsRunSummary | null>(() => {
    const byTimestamp = props.dashboard.ops.recentRuns.find((run) => run.timestamp === props.selectedRunTimestamp);
    return byTimestamp ?? props.dashboard.ops.recentRuns[0] ?? null;
  });

  return (
    <>
      <header class="rounded-[36px] border border-stone-200/70 bg-[linear-gradient(135deg,rgba(255,255,255,0.94),rgba(247,243,236,0.88))] p-6 shadow-[0_32px_120px_-48px_rgba(41,37,36,0.45)] sm:p-8">
        <p class="text-[0.72rem] font-semibold uppercase tracking-[0.34em] text-stone-500">Operations</p>
        <h1 class="mt-4 font-display text-4xl leading-none text-stone-950 sm:text-5xl">Inspect failures, warnings, and source-level scrape behavior.</h1>
        <p class="mt-4 max-w-3xl text-sm leading-7 text-stone-700 sm:text-base">
          This page is the operational backroom: recent run history, per-source health, warnings, errors, and archive-integrity clues without crowding the market overview.
        </p>
      </header>

      <section class="mt-8 grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
        <Panel title="Run Summary" eyebrow="Latest" subtitle="Click any run to inspect warnings, errors, and per-source outcomes.">
          <div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <button type="button" onClick={() => props.onSelectRun(props.dashboard.ops.recentRuns[0]?.timestamp ?? '')} class="rounded-[24px] border border-stone-200 bg-white p-5 text-left">
              <p class="text-[0.65rem] uppercase tracking-[0.22em] text-stone-500">Overall status</p>
              <div class="mt-3"><StatusPill label={props.dashboard.ops.overallStatus} tone={toneForStatus(props.dashboard.ops.overallStatus)} /></div>
            </button>
            <button type="button" onClick={() => props.onSelectRun(selectedRun()?.timestamp ?? '')} class="rounded-[24px] border border-amber-200 bg-amber-50 p-5 text-left">
              <p class="text-[0.65rem] uppercase tracking-[0.22em] text-amber-700">Warnings</p>
              <p class="mt-3 font-display text-4xl text-amber-950">{wholeNumberFormatter.format(props.dashboard.ops.warningCount)}</p>
            </button>
            <button type="button" onClick={() => props.onSelectRun(selectedRun()?.timestamp ?? '')} class="rounded-[24px] border border-rose-200 bg-rose-50 p-5 text-left">
              <p class="text-[0.65rem] uppercase tracking-[0.22em] text-rose-700">Errors</p>
              <p class="mt-3 font-display text-4xl text-rose-950">{wholeNumberFormatter.format(props.dashboard.ops.errorCount)}</p>
            </button>
            <div class="rounded-[24px] border border-stone-200 bg-stone-50 p-5">
              <p class="text-[0.65rem] uppercase tracking-[0.22em] text-stone-500">Focused view</p>
              <p class="mt-3 font-display text-2xl text-stone-950">{focusTitle(props.focus)}</p>
            </div>
          </div>
        </Panel>

        <Panel title="Integrity Trend" eyebrow="Archive" subtitle="Historical company-count snapshots from `stats.json`. Useful for context, not a strict health verdict.">
          <TimeSeriesChart
            data={companyCountPoints(props.dashboard)}
            label="Company count"
            color="#1d4ed8"
            compact
            height={220}
            formatValue={(value) => wholeNumberFormatter.format(value)}
          />
        </Panel>
      </section>

      <section class="mt-8 grid gap-6 lg:grid-cols-[0.92fr_1.08fr]">
        <Panel title="Recent Runs" eyebrow="History" subtitle="Newest first. Click a run to open its diagnostics.">
          <div class="space-y-3">
            <For each={props.dashboard.ops.recentRuns}>
              {(run) => (
                <button
                  type="button"
                  onClick={() => props.onSelectRun(run.timestamp)}
                  class={`w-full rounded-[24px] border p-4 text-left transition ${selectedRun()?.timestamp === run.timestamp ? 'border-stone-950 bg-stone-950 text-stone-50' : 'border-stone-200 bg-white hover:bg-stone-50'}`}
                >
                  <div class="flex items-start justify-between gap-3">
                    <div>
                      <p class={`text-xs uppercase tracking-[0.22em] ${selectedRun()?.timestamp === run.timestamp ? 'text-stone-400' : 'text-stone-500'}`}>
                        {formatDateTime(run.timestamp)}
                      </p>
                      <div class="mt-2 flex flex-wrap gap-2">
                        <StatusPill label={run.status} tone={toneForStatus(run.status)} />
                        <span class={`text-sm ${selectedRun()?.timestamp === run.timestamp ? 'text-stone-300' : 'text-stone-600'}`}>Warnings {run.warnings.length}</span>
                        <span class={`text-sm ${selectedRun()?.timestamp === run.timestamp ? 'text-stone-300' : 'text-stone-600'}`}>Errors {run.errors.length}</span>
                      </div>
                    </div>
                    <span class={`text-xs ${selectedRun()?.timestamp === run.timestamp ? 'text-stone-400' : 'text-stone-500'}`}>
                      {Object.keys(run.sources).length} sources
                    </span>
                  </div>
                </button>
              )}
            </For>
          </div>
        </Panel>

        <Panel title="Run Diagnostics" eyebrow="Detail" subtitle="Everything underneath is based on the selected scrape-log entry.">
          <Show when={selectedRun()} keyed>
            {(run) => (
              <div class="space-y-6">
                <div class="rounded-[24px] border border-stone-200 bg-stone-50 p-5">
                  <div class="flex flex-wrap items-center gap-3">
                    <StatusPill label={run.status} tone={toneForStatus(run.status)} />
                    <p class="text-sm text-stone-700">{formatDateTime(run.timestamp)}</p>
                  </div>
                </div>

                <div class="grid gap-4 md:grid-cols-3">
                  <For each={Object.entries(run.sources)}>
                    {([source, sourceHealth]) => (
                      <div class="rounded-[24px] border border-stone-200 bg-white p-5">
                        <p class="text-[0.65rem] uppercase tracking-[0.22em] text-stone-500">{source}</p>
                        <div class="mt-3"><StatusPill label={sourceHealth.status} tone={toneForStatus(sourceHealth.status)} /></div>
                        <p class="mt-4 text-sm text-stone-700">Rows scraped {wholeNumberFormatter.format(sourceHealth.rowsScraped)}</p>
                        <p class="mt-2 text-sm text-stone-600">{sourceHealth.error ?? 'No source error recorded.'}</p>
                      </div>
                    )}
                  </For>
                </div>

                <div class="grid gap-4 md:grid-cols-2">
                  <div class="rounded-[24px] border border-amber-200 bg-amber-50 p-5">
                    <p class="text-[0.65rem] uppercase tracking-[0.22em] text-amber-700">Warnings</p>
                    <div class="mt-3 space-y-2">
                      <Show when={run.warnings.length > 0} fallback={<p class="text-sm text-amber-900/80">No warnings recorded for this run.</p>}>
                        <For each={run.warnings}>{(warning) => <p class="text-sm text-amber-950">{warning}</p>}</For>
                      </Show>
                    </div>
                  </div>
                  <div class="rounded-[24px] border border-rose-200 bg-rose-50 p-5">
                    <p class="text-[0.65rem] uppercase tracking-[0.22em] text-rose-700">Errors</p>
                    <div class="mt-3 space-y-2">
                      <Show when={run.errors.length > 0} fallback={<p class="text-sm text-rose-900/80">No errors recorded for this run.</p>}>
                        <For each={run.errors}>{(error) => <p class="text-sm text-rose-950">{error}</p>}</For>
                      </Show>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </Show>
        </Panel>
      </section>
    </>
  );
}
