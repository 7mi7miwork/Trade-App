import axios from 'axios';
import { AnalyzeResponse, HealthResponse } from '../types';

const api = axios.create({
  baseURL: '/api',
  timeout: 120000, // 2 minutes for analysis
  headers: {
    'Content-Type': 'application/json',
  },
});

export async function fetchHealth(): Promise<HealthResponse> {
  const { data } = await api.get('/health');
  return data;
}

export interface AnalyzeParams {
  stockCodes?: string;
  file?: File;
  dataSource: string;
  periodDays: number;
  indicators: string[];
}

export async function analyzeStocks(params: AnalyzeParams): Promise<AnalyzeResponse> {
  const formData = new FormData();

  if (params.stockCodes) {
    formData.append('stock_codes', params.stockCodes);
  }

  if (params.file) {
    formData.append('file', params.file);
  }

  formData.append('data_source', params.dataSource);
  formData.append('period_days', params.periodDays.toString());
  formData.append('indicators', JSON.stringify(params.indicators));

  const { data } = await api.post('/analyze', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });

  return data;
}

export default api;