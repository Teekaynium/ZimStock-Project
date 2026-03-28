export type ExchangeKey = 'zse' | 'vfex';

export type MetricKey = 'close' | 'open' | 'volume';

export type DateRangeKey = '1m' | '3m' | '6m' | 'ytd' | 'all';

export interface MatrixDataset {
  columns: string[];
  index: string[];
  data: Array<Array<number | string | null>>;
}

export interface RatesDataset {
  columns: string[];
  index: number[];
  data: Array<[string, number, number, number]>;
}

export interface ScrapeSourceStatus {
  status: string;
  rows_scraped: number;
  columns_found: string[];
  error: string | null;
}

export interface ScrapeRun {
  timestamp: string;
  status: string;
  sources: Record<string, ScrapeSourceStatus>;
  warnings: string[];
  errors: string[];
}

export interface StatsSnapshot {
  fileType: string;
  stats: {
    numberOfCompanies: number;
  };
}

export interface SecurityObservation {
  date: string;
  open: number | null;
  close: number | null;
  volume: number | null;
}

export interface SecuritySeries {
  key: string;
  name: string;
  observations: SecurityObservation[];
  duplicateLabels: string[];
}

export interface RankedSecurity {
  name: string;
  latestClose: number | null;
  latestVolume: number | null;
  dailyChange: number | null;
  dailyChangePct: number | null;
}

export interface ExchangeSummary {
  trackedSecurities: number;
  advancers: number;
  decliners: number;
  flat: number;
  latestVolume: number;
  strongestMover: RankedSecurity | null;
  topGainers: RankedSecurity[];
  topLosers: RankedSecurity[];
  volumeLeaders: RankedSecurity[];
  duplicateCount: number;
}

export interface ExchangeDashboard {
  key: ExchangeKey;
  label: string;
  securities: SecuritySeries[];
  summary: ExchangeSummary;
}

export interface RatePoint {
  date: string;
  official: number;
  informalLow: number;
  informalHigh: number;
}

export interface RatesSummary {
  latest: RatePoint | null;
  spreadLow: number | null;
  spreadHigh: number | null;
  spreadPctLow: number | null;
  spreadPctHigh: number | null;
}

export interface SourceHealth {
  status: string;
  rowsScraped: number;
  error: string | null;
}

export interface OpsRunSummary {
  timestamp: string;
  status: string;
  warnings: string[];
  errors: string[];
  sources: Record<string, SourceHealth>;
}

export interface OpsSummary {
  latestRunAt: string | null;
  overallStatus: string;
  warningCount: number;
  errorCount: number;
  successStreak: number;
  sources: Record<string, SourceHealth>;
  recentRuns: OpsRunSummary[];
  companyCountHistory: Array<{
    date: string;
    companyCount: number;
  }>;
}

export interface DashboardData {
  exchanges: Record<ExchangeKey, ExchangeDashboard>;
  rates: {
    points: RatePoint[];
    summary: RatesSummary;
  };
  ops: OpsSummary;
}

export interface ChartPoint {
  date: string;
  value: number;
}
