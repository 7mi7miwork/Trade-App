import { useEffect, useState, useCallback, useMemo } from 'react';
import axios from 'axios';
import StockInput from './components/StockInput';
import DataSourceSelector from './components/DataSourceSelector';
import IndicatorSelector from './components/IndicatorSelector';
import StockChart from './components/StockChart';
import ResultsTable from './components/ResultsTable';
import { DownloadButton, BulkDownloadButton } from './components/DownloadButton';
import { StockResult, DataSource } from './types';
import { analyzeStocks, fetchHealth } from './api/client';

const PERIOD_OPTIONS = [
  { label: '30 Tage', value: 30 },
  { label: '60 Tage', value: 60 },
  { label: '90 Tage', value: 90 },
  { label: '180 Tage', value: 180 },
];

function App() {
  // Health state
  const [shioajiEnabled, setShioajiEnabled] = useState(false);

  // Input state
  const [manualCodes, setManualCodes] = useState<string[]>([]);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [filePreviewCodes, setFilePreviewCodes] = useState<string[]>([]);
  const [inputSource, setInputSource] = useState<'text' | 'file'>('text');

  // Options state
  const [dataSource, setDataSource] = useState<DataSource>('yahoo');
  const [periodDays, setPeriodDays] = useState(60);
  const [indicators, setIndicators] = useState<string[]>(['NATR']);

  // Loading state
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<StockResult[]>([]);
  const [hasRun, setHasRun] = useState(false);

  // Expanded stocks in accordion
  const [expandedStock, setExpandedStock] = useState<string | null>(null);

  // Fetch health on mount
  useEffect(() => {
    fetchHealth()
      .then(h => setShioajiEnabled(h.shioaji_enabled))
      .catch(() => setShioajiEnabled(false));
  }, []);

  const hasCodes = useMemo(
    () => (inputSource === 'file' ? filePreviewCodes.length > 0 : manualCodes.length > 0),
    [inputSource, filePreviewCodes, manualCodes]
  );

  const canSubmit = hasCodes && indicators.length > 0 && !isLoading;

  const handleCodesChange = (codes: string[], source: string) => {
    setManualCodes(codes);
    setInputSource('text' as const);
  };

  const handleFileChange = (file: File, codes: string[]) => {
    setUploadedFile(file);
    setFilePreviewCodes(codes);
    setInputSource('file' as const);
  };

  const handleClearFile = () => {
    setUploadedFile(null);
    setFilePreviewCodes([]);
  };

  const getStockCodesString = (): string | undefined => {
    return inputSource === 'text' ? manualCodes.join(',') : undefined;
  };

  const handleSubmit = async () => {
    setError(null);
    setIsLoading(true);
    setResults([]);
    setHasRun(false);

    try {
      const params: {
        stockCodes?: string;
        file?: File;
        dataSource: string;
        periodDays: number;
        indicators: string[];
      } = {
        dataSource,
        periodDays,
        indicators,
      };

      if (inputSource === 'text') {
        params.stockCodes = manualCodes.join(',');
      } else {
        params.file = uploadedFile || undefined;
      }

      const data = await analyzeStocks(params);
      setResults(data.results);
      setHasRun(true);

      // Expand first successful stock
      const firstSuccess = data.results.find(r => !r.error && r.rows.length > 0);
      if (firstSuccess) setExpandedStock(firstSuccess.code);
    } catch (err: any) {
      const msg = err?.response?.data?.detail || err?.message || 'Unbekannter Fehler';
      setError(typeof msg === 'string' ? msg : JSON.stringify(msg));
    } finally {
      setIsLoading(false);
    }
  };

  const toggleExpand = (code: string) => {
    setExpandedStock(prev => prev === code ? null : code);
  };

  const getTaipeiTime = () => {
    return new Date().toLocaleTimeString('zh-TW', { timeZone: 'Asia/Taipei' });
  };

  const successfulResults = useMemo(() => results.filter(r => !r.error && r.rows.length > 0), [results]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">📈</span>
            <div>
              <h1 className="text-xl font-bold text-gray-800">RoyaBot Web Edition</h1>
              <p className="text-xs text-gray-500">Taiwan Stock Market Analysis</p>
            </div>
          </div>
          <div className="text-xs text-gray-400">
            Zeit: {getTaipeiTime()}
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-6xl mx-auto px-4 py-6 space-y-6">
        {/* Input Panel */}
        <section className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <StockInput
              onCodesChange={handleCodesChange}
              onFileChange={handleFileChange}
              clearFile={handleClearFile}
            />

            <div className="space-y-5">
              <DataSourceSelector
                value={dataSource}
                onChange={setDataSource}
                shioajiEnabled={shioajiEnabled}
              />

              {/* Period selector */}
              <div className="space-y-2">
                <div className="text-sm font-medium text-gray-700">Zeitraum</div>
                <select
                  value={periodDays}
                  onChange={e => setPeriodDays(Number(e.target.value))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm
                    focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {PERIOD_OPTIONS.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>

              <IndicatorSelector selected={indicators} onChange={setIndicators} />
            </div>
          </div>

          {/* Analyze button */}
          <div className="mt-6 flex items-center gap-4">
            <button
              onClick={handleSubmit}
              disabled={!canSubmit}
              className={`flex items-center gap-2 px-6 py-2.5 text-sm font-medium rounded-lg shadow-sm
                transition-all ${
                  canSubmit
                    ? 'bg-blue-600 hover:bg-blue-700 text-white'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10"
                      stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Analysiere…
                </>
              ) : (
                '🔍 Analysieren'
              )}
            </button>

            {canSubmit && !isLoading && (
              <span className="text-xs text-gray-400">
                {inputSource === 'file'
                  ? `${filePreviewCodes.length} Codes in Datei`
                  : `${manualCodes.length} Code(s)`}
                {' · '}
                {indicators.length} Indikator{indicators.length > 1 ? 'en' : ''}
              </span>
            )}
          </div>
        </section>

        {/* Error Banner */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
            <span className="text-red-500 text-lg">⚠️</span>
            <div className="flex-1">
              <p className="text-sm text-red-700 font-medium">Fehler</p>
              <p className="text-sm text-red-600 mt-0.5">{error}</p>
            </div>
            <button
              onClick={() => setError(null)}
              className="text-red-400 hover:text-red-600 text-lg"
            >
              ✕
            </button>
          </div>
        )}

        {/* Results Panel */}
        {hasRun && (
          <section className="space-y-6">
            {/* Summary bar */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 flex flex-wrap items-center justify-between gap-4">
              <div className="flex flex-wrap items-center gap-3 text-sm text-gray-600">
                <span className="font-medium">{results.length} Aktie{results.length > 1 ? 'n' : ''} analysiert</span>
                <span className="text-gray-300">•</span>
                <span>Quelle: {dataSource === 'yahoo' ? 'Yahoo Finance' : 'Shioaji'}</span>
                <span className="text-gray-300">•</span>
                <span>
                  Taipeh-Zeit: {getTaipeiTime()}
                </span>
              </div>
              {successfulResults.length > 0 && (
                <BulkDownloadButton results={successfulResults} />
              )}
            </div>

            {/* Individual stock results */}
            {results.map(stock => (
              <div key={stock.code} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                {/* Stock header / accordion */}
                <div
                  className={`px-4 py-3 cursor-pointer flex items-center justify-between transition-colors
                    ${stock.error ? 'bg-red-50' : 'hover:bg-gray-50'}`}
                  onClick={() => !stock.error && toggleExpand(stock.code)}
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={`inline-block w-5 h-5 rounded-full text-center text-sm leading-5
                        ${stock.error ? 'bg-red-200 text-red-700' : 'bg-blue-100 text-blue-700'}`}
                    >
                      {stock.error ? '!' : expandedStock === stock.code ? '▾' : '▸'}
                    </span>
                    <span className="font-semibold text-gray-800">{stock.code}</span>
                    {stock.name && (
                      <span className="text-sm text-gray-500">- {stock.name}</span>
                    )}
                    {stock.error && (
                      <span className="text-xs text-red-600 bg-red-100 px-2 py-0.5 rounded">
                        {stock.error}
                      </span>
                    )}
                    {!stock.error && (
                      <span className="text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded">
                        {stock.rows.length} Zeilen
                      </span>
                    )}
                  </div>
                  {!stock.error && (
                    <DownloadButton stockResult={stock} />
                  )}
                </div>

                {/* Accordion content */}
                {expandedStock === stock.code && !stock.error && stock.rows.length > 0 && (
                  <div className="border-t border-gray-100">
                    <div className="p-4">
                      <StockChart
                        rows={stock.rows}
                        indicators={indicators}
                        code={stock.code}
                        name={stock.name}
                      />
                    </div>
                    <div className="border-t border-gray-100">
                      <ResultsTable rows={stock.rows} />
                    </div>
                  </div>
                )}
              </div>
            ))}
          </section>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-200 mt-12">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <p className="text-xs text-gray-400 text-center leading-relaxed">
            本工具僅供學習與研究目的，不構成投資建議。使用者應自行承擔投資風險。
            Data provided by Yahoo Finance and/or Shioaji (永豐金證券). All times shown in Asia/Taipei (UTC+8).
          </p>
        </div>
      </footer>
    </div>
  );
}

export default App;