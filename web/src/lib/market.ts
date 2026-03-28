import closePriceVfex from '../../../archive-single-file/close_price_vic.json';
import closePriceZse from '../../../archive-single-file/close_price_zse.json';
import openPriceVfex from '../../../archive-single-file/open_price_vic.json';
import openPriceZse from '../../../archive-single-file/open_price_zse.json';
import ratesJson from '../../../archive-single-file/rates.json';
import scrapeLogJson from '../../../logs/scrape_log.json';
import statsJson from '../../../stats.json';
import volumeVfex from '../../../archive-single-file/vol_traded_vic.json';
import volumeZse from '../../../archive-single-file/vol_traded_zse.json';
import type {
  DashboardData,
  ExchangeDashboard,
  ExchangeKey,
  MatrixDataset,
  OpsSummary,
  RankedSecurity,
  RatePoint,
  RatesDataset,
  RatesSummary,
  ScrapeRun,
  SecurityObservation,
  SecuritySeries,
  StatsSnapshot,
} from '../types';

const exchangeLabels: Record<ExchangeKey, string> = {
  zse: 'ZSE',
  vfex: 'VFEX',
};

function normalizeName(value: string) {
  return value.trim().toLowerCase();
}

function toNumber(value: number | string | null | undefined) {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === 'string') {
    const parsed = Number.parseFloat(value.replaceAll(',', ''));
    return Number.isFinite(parsed) ? parsed : null;
  }

  return null;
}

function createObservations(
  dates: string[],
  openValues: Array<number | string | null> | undefined,
  closeValues: Array<number | string | null> | undefined,
  volumeValues: Array<number | string | null> | undefined,
) {
  return dates.map<SecurityObservation>((date, index) => ({
    date,
    open: toNumber(openValues?.[index]),
    close: toNumber(closeValues?.[index]),
    volume: toNumber(volumeValues?.[index]),
  }));
}

function latestValidObservation(series: SecuritySeries, metric: 'close' | 'volume') {
  for (let index = series.observations.length - 1; index >= 0; index -= 1) {
    const observation = series.observations[index];
    const value = observation[metric];

    if (typeof value === 'number' && value > 0) {
      return observation;
    }
  }

  return null;
}

function latestCloseChange(series: SecuritySeries) {
  let latest: number | null = null;
  let previous: number | null = null;

  for (let index = series.observations.length - 1; index >= 0; index -= 1) {
    const close = series.observations[index].close;

    if (typeof close !== 'number' || close <= 0) {
      continue;
    }

    if (latest === null) {
      latest = close;
      continue;
    }

    previous = close;
    break;
  }

  if (latest === null || previous === null || previous === 0) {
    return {
      latestClose: latest,
      dailyChange: null,
      dailyChangePct: null,
    };
  }

  const dailyChange = latest - previous;

  return {
    latestClose: latest,
    dailyChange,
    dailyChangePct: (dailyChange / previous) * 100,
  };
}

function buildRankedSecurity(series: SecuritySeries): RankedSecurity {
  const latestVolumeObservation = latestValidObservation(series, 'volume');
  const closeChange = latestCloseChange(series);

  return {
    name: series.name,
    latestClose: closeChange.latestClose,
    latestVolume: latestVolumeObservation?.volume ?? null,
    dailyChange: closeChange.dailyChange,
    dailyChangePct: closeChange.dailyChangePct,
  };
}

function buildExchange(
  key: ExchangeKey,
  openDataset: MatrixDataset,
  closeDataset: MatrixDataset,
  volumeDataset: MatrixDataset,
) {
  const seriesMap = new Map<string, SecuritySeries>();

  closeDataset.columns.forEach((rawName, columnIndex) => {
    const normalizedName = normalizeName(rawName);
    const existingSeries = seriesMap.get(normalizedName);

    if (existingSeries) {
      existingSeries.duplicateLabels.push(rawName);
      return;
    }

    const openValues = openDataset.data.map((row) => row[columnIndex]);
    const closeValues = closeDataset.data.map((row) => row[columnIndex]);
    const volumeValues = volumeDataset.data.map((row) => row[columnIndex]);

    seriesMap.set(normalizedName, {
      key: normalizedName,
      name: rawName,
      observations: createObservations(
        closeDataset.index,
        openValues,
        closeValues,
        volumeValues,
      ),
      duplicateLabels: [],
    });
  });

  const securities = Array.from(seriesMap.values()).sort((left, right) =>
    left.name.localeCompare(right.name),
  );
  const ranked = securities.map(buildRankedSecurity);
  const movers = ranked.filter(
    (entry) => typeof entry.dailyChangePct === 'number' && Number.isFinite(entry.dailyChangePct),
  );
  const volumeLeaders = ranked.filter(
    (entry) => typeof entry.latestVolume === 'number' && Number.isFinite(entry.latestVolume),
  );
  const latestVolume = volumeLeaders.reduce(
    (total, entry) => total + (entry.latestVolume ?? 0),
    0,
  );

  const summary = {
    trackedSecurities: securities.length,
    advancers: movers.filter((entry) => (entry.dailyChangePct ?? 0) > 0).length,
    decliners: movers.filter((entry) => (entry.dailyChangePct ?? 0) < 0).length,
    flat: movers.filter((entry) => (entry.dailyChangePct ?? 0) === 0).length,
    latestVolume,
    strongestMover: [...movers].sort(
      (left, right) => (right.dailyChangePct ?? Number.NEGATIVE_INFINITY) - (left.dailyChangePct ?? Number.NEGATIVE_INFINITY),
    )[0] ?? null,
    topGainers: [...movers]
      .sort(
        (left, right) => (right.dailyChangePct ?? Number.NEGATIVE_INFINITY) - (left.dailyChangePct ?? Number.NEGATIVE_INFINITY),
      )
      .slice(0, 5),
    topLosers: [...movers]
      .sort(
        (left, right) => (left.dailyChangePct ?? Number.POSITIVE_INFINITY) - (right.dailyChangePct ?? Number.POSITIVE_INFINITY),
      )
      .slice(0, 5),
    volumeLeaders: [...volumeLeaders]
      .sort(
        (left, right) => (right.latestVolume ?? Number.NEGATIVE_INFINITY) - (left.latestVolume ?? Number.NEGATIVE_INFINITY),
      )
      .slice(0, 5),
    duplicateCount: securities.reduce(
      (total, entry) => total + entry.duplicateLabels.length,
      0,
    ),
  };

  return {
    key,
    label: exchangeLabels[key],
    securities,
    summary,
  } satisfies ExchangeDashboard;
}

function buildRatesSummary(points: RatePoint[]): RatesSummary {
  const latest = points.at(-1) ?? null;

  if (!latest || latest.official === 0) {
    return {
      latest,
      spreadLow: null,
      spreadHigh: null,
      spreadPctLow: null,
      spreadPctHigh: null,
    };
  }

  const spreadLow = latest.informalLow - latest.official;
  const spreadHigh = latest.informalHigh - latest.official;

  return {
    latest,
    spreadLow,
    spreadHigh,
    spreadPctLow: (spreadLow / latest.official) * 100,
    spreadPctHigh: (spreadHigh / latest.official) * 100,
  };
}

function buildRates(dataset: RatesDataset) {
  const points = dataset.data
    .map<RatePoint | null>((entry) => {
      const official = toNumber(entry[1]);
      const informalLow = toNumber(entry[2]);
      const informalHigh = toNumber(entry[3]);

      if (official === null || informalLow === null || informalHigh === null) {
        return null;
      }

      return {
        date: entry[0],
        official,
        informalLow,
        informalHigh,
      };
    })
    .filter((entry): entry is RatePoint => entry !== null);

  return {
    points,
    summary: buildRatesSummary(points),
  };
}

function buildOps(logs: ScrapeRun[], stats: Record<string, StatsSnapshot[]>) {
  const latestRun = logs.at(-1) ?? null;
  let successStreak = 0;

  for (let index = logs.length - 1; index >= 0; index -= 1) {
    if (logs[index].status !== 'success') {
      break;
    }

    successStreak += 1;
  }

  const companyCountHistory = Object.entries(stats)
    .map(([date, snapshots]) => ({
      date,
      companyCount: snapshots.reduce((highest, snapshot) => {
        if (snapshot.fileType !== 'close_price') {
          return highest;
        }

        return Math.max(highest, snapshot.stats.numberOfCompanies);
      }, 0),
    }))
    .filter((entry) => entry.companyCount > 0)
    .sort((left, right) => left.date.localeCompare(right.date));

  const sources = Object.entries(latestRun?.sources ?? {}).reduce<OpsSummary['sources']>(
    (result, [source, value]) => {
      result[source] = {
        status: value.status,
        rowsScraped: value.rows_scraped,
        error: value.error,
      };
      return result;
    },
    {},
  );

  return {
    latestRunAt: latestRun?.timestamp ?? null,
    overallStatus: latestRun?.status ?? 'unknown',
    warningCount: latestRun?.warnings.length ?? 0,
    errorCount: latestRun?.errors.length ?? 0,
    successStreak,
    sources,
    companyCountHistory,
  } satisfies OpsSummary;
}

export function createDashboardData() {
  return {
    exchanges: {
      zse: buildExchange('zse', openPriceZse, closePriceZse, volumeZse),
      vfex: buildExchange('vfex', openPriceVfex, closePriceVfex, volumeVfex),
    },
    rates: buildRates(ratesJson),
    ops: buildOps(scrapeLogJson, statsJson),
  } satisfies DashboardData;
}
