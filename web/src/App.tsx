import { createEffect, createMemo, createSignal, onCleanup, onMount } from 'solid-js';
import { createDashboardData } from './lib/market';
import { isPageKey, type PageKey } from './lib/view';
import { OpsPage } from './pages/OpsPage';
import { OverviewPage } from './pages/OverviewPage';

const dashboard = createDashboardData();

function readPageFromHash() {
  const raw = window.location.hash.replace('#', '');
  return isPageKey(raw) ? raw : 'overview';
}

export default function App() {
  const [page, setPage] = createSignal<PageKey>(readPageFromHash());
  const [opsFocus, setOpsFocus] = createSignal('runs');
  const [selectedRunTimestamp, setSelectedRunTimestamp] = createSignal<string | null>(
    dashboard.ops.recentRuns[0]?.timestamp ?? null,
  );

  const pageTitle = createMemo(() =>
    page() === 'overview' ? 'Zimbabwe Market Monitor' : 'Zimbabwe Market Monitor · Ops',
  );

  createEffect(() => {
    document.title = pageTitle();
  });

  onMount(() => {
    const handler = () => setPage(readPageFromHash());
    window.addEventListener('hashchange', handler);
    onCleanup(() => window.removeEventListener('hashchange', handler));
  });

  const navigate = (nextPage: PageKey) => {
    window.location.hash = nextPage;
    setPage(nextPage);
  };

  const openOps = (focus: string) => {
    setOpsFocus(focus);
    navigate('ops');
  };

  return (
    <main class="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(15,118,110,0.16),_transparent_28%),radial-gradient(circle_at_top_right,_rgba(180,83,9,0.14),_transparent_24%),linear-gradient(180deg,_#f8f5ef_0%,_#f1ece4_46%,_#ebe5db_100%)] text-stone-900">
      <div class="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-10">
        <nav class="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-full border border-stone-200/80 bg-white/85 px-3 py-3 shadow-[0_24px_80px_-36px_rgba(41,37,36,0.3)] backdrop-blur">
          <div class="flex items-center gap-2">
            <button
              type="button"
              onClick={() => navigate('overview')}
              class={`rounded-full px-4 py-2 text-sm font-semibold transition ${page() === 'overview' ? 'bg-stone-950 text-white' : 'text-stone-700 hover:bg-stone-100'}`}
            >
              Overview
            </button>
            <button
              type="button"
              onClick={() => navigate('ops')}
              class={`rounded-full px-4 py-2 text-sm font-semibold transition ${page() === 'ops' ? 'bg-stone-950 text-white' : 'text-stone-700 hover:bg-stone-100'}`}
            >
              Ops
            </button>
          </div>
          <p class="px-2 text-sm text-stone-600">
            {page() === 'overview'
              ? 'Market-first view with a compact ops snapshot.'
              : 'Detailed scrape history, source statuses, warnings, and errors.'}
          </p>
        </nav>

        {page() === 'overview' ? (
          <OverviewPage dashboard={dashboard} onOpenOps={openOps} />
        ) : (
          <OpsPage
            dashboard={dashboard}
            focus={opsFocus()}
            selectedRunTimestamp={selectedRunTimestamp()}
            onSelectRun={setSelectedRunTimestamp}
          />
        )}
      </div>
    </main>
  );
}
