import React, { useState, useMemo } from 'react';
import { StockRow } from '../types';

interface ResultsTableProps {
  rows: StockRow[];
}

type SortDirection = 'asc' | 'desc' | null;

export default function ResultsTable({ rows }: ResultsTableProps) {
  const [sortKey, setSortKey] = useState<string>('date');
  const [sortDir, setSortDir] = useState<SortDirection>('asc');

  if (!rows.length) return null;

  // Get all unique column keys
  const allColumns = useMemo(() => {
    const keySet = new Set<string>();
    rows.forEach(row => {
      Object.keys(row).forEach(k => keySet.add(k));
    });
    // Always start with date
    return ['date', ...Array.from(keySet).filter(k => k !== 'date')];
  }, [rows]);

  const handleSort = (key: string) => {
    if (sortKey === key) {
      if (sortDir === 'asc') setSortDir('desc');
      else if (sortDir === 'desc') setSortDir(null);
      else setSortDir('asc');
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  };

  const sortedRows = useMemo(() => {
    if (!sortDir) return rows;
    return [...rows].sort((a: any, b: any) => {
      const aVal = a[sortKey];
      const bVal = b[sortKey];
      if (aVal == null && bVal == null) return 0;
      if (aVal == null) return sortDir === 'asc' ? -1 : 1;
      if (bVal == null) return sortDir === 'asc' ? 1 : -1;

      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return sortDir === 'asc' ? aVal - bVal : bVal - aVal;
      }
      const aStr = String(aVal);
      const bStr = String(bVal);
      return sortDir === 'asc'
        ? aStr.localeCompare(bStr)
        : bStr.localeCompare(aStr);
    });
  }, [rows, sortKey, sortDir]);

  const formatHeader = (key: string): string => {
    const headerLabels: Record<string, string> = {
      date: 'Datum',
      open: 'Open',
      high: 'High',
      low: 'Low',
      close: 'Close',
      volume: 'Volumen',
      NATR: 'NATR(14)',
      RSI: 'RSI(14)',
      MACD: 'MACD',
      MACD_signal: 'MACD Signal',
      MACD_hist: 'MACD Histogram',
      BB_upper: 'BB Upper',
      BB_middle: 'BB Middle',
      BB_lower: 'BB Lower',
    };
    return headerLabels[key] || key;
  };

  const formatValue = (key: string, value: any): string => {
    if (value == null) return '—';
    if (key === 'date') {
      try {
        return new Date(value).toLocaleDateString('zh-TW');
      } catch {
        return value;
      }
    }
    if (typeof value === 'number') {
      return value.toLocaleString('en-US', {
        minimumFractionDigits: key === 'volume' ? 0 : 2,
        maximumFractionDigits: key === 'volume' ? 0 : 2,
      });
    }
    return String(value);
  };

  const getSortIcon = (key: string): string => {
    if (sortKey !== key) return '⇅';
    if (sortDir === 'asc') return '↑';
    if (sortDir === 'desc') return '↓';
    return '⇅';
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="bg-gray-50 border-b">
            {allColumns.map(key => (
              <th
                key={key}
                className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider
                  cursor-pointer hover:bg-gray-100 select-none whitespace-nowrap"
                onClick={() => handleSort(key)}
              >
                <span className="flex items-center gap-1">
                  {formatHeader(key)}
                  <span className="text-gray-400 text-xs">{getSortIcon(key)}</span>
                </span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {sortedRows.map((row, rowIndex) => (
            <tr
              key={rowIndex}
              className="hover:bg-blue-50 transition-colors"
            >
              {allColumns.map(key => (
                <td key={key} className="px-3 py-1.5 text-gray-700 tabular-nums whitespace-nowrap">
                  {formatValue(key, (row as any)[key])}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}