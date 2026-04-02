export interface HealthResponse {
  status: string;
  shioaji_enabled: boolean;
  timezone: string;
}

export interface StockRow {
  date: string;
  open: number | null;
  high: number | null;
  low: number | null;
  close: number | null;
  volume: number | null;
  [key: string]: number | string | null | undefined;
}

export interface StockResult {
  code: string;
  name: string | null;
  rows: StockRow[];
  error: string | null;
}

export interface AnalyzeResponse {
  results: StockResult[];
  source_used: string;
  elapsed_seconds: number;
}

export type DataSource = 'yahoo' | 'shioaji';

export interface AnalysisOptions {
  dataSource: DataSource;
  periodDays: number;
  indicators: string[];
}