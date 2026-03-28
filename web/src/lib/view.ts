import type { ChartPoint, DateRangeKey, ExchangeKey, MetricKey, SecurityObservation } from '../types';

export type PageKey = 'overview' | 'ops';

export const exchangeOptions: Array<{ key: ExchangeKey; label: string }> = [
  { key: 'zse', label: 'ZSE' },
  { key: 'vfex', label: 'VFEX' },
];

export const metricOptions: Array<{ key: MetricKey; label: string }> = [
  { key: 'close', label: 'Close' },
  { key: 'open', label: 'Open' },
  { key: 'volume', label: 'Volume' },
];

export const rangeOptions: Array<{ key: DateRangeKey; label: string }> = [
  { key: '1m', label: '1M' },
  { key: '3m', label: '3M' },
  { key: '6m', label: '6M' },
  { key: 'ytd', label: 'YTD' },
  { key: 'all', label: 'All' },
];

export function isExchangeKey(value: string): value is ExchangeKey {
  return value === 'zse' || value === 'vfex';
}

export function isPageKey(value: string): value is PageKey {
  return value === 'overview' || value === 'ops';
}

export function metricValue(observation: SecurityObservation, metric: MetricKey) {
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

export function filterObservations(observations: SecurityObservation[], range: DateRangeKey) {
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

export function buildChartPoints(observations: SecurityObservation[], metric: MetricKey) {
  return observations.reduce<ChartPoint[]>((points, observation) => {
    const value = metricValue(observation, metric);

    if (typeof value === 'number' && value > 0) {
      points.push({ date: observation.date, value });
    }

    return points;
  }, []);
}
