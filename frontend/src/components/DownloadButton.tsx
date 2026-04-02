import React from 'react';
import * as XLSX from 'xlsx';
import { StockRow, StockResult } from '../types';

interface DownloadButtonProps {
  stockResult: StockResult;
}

export function DownloadButton({ stockResult }: DownloadButtonProps) {
  const downloadSingleFile = () => {
    if (!stockResult.rows.length) return;

    const ws = XLSX.utils.json_to_sheet(stockResult.rows.map(row => {
      const formatted: Record<string, any> = {};
      for (const [key, val] of Object.entries(row)) {
        if (val === null || val === undefined) {
          formatted[key] = '';
        } else {
          formatted[key] = val;
        }
      }
      return formatted;
    }));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, stockResult.code);

    const today = new Date().toISOString().slice(0, 10);
    const fileName = `${stockResult.code}_${today}.xlsx`;
    XLSX.writeFile(wb, fileName);
  };

  return (
    <button
      onClick={downloadSingleFile}
      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-blue-600
        border border-blue-300 rounded-lg bg-white hover:bg-blue-50 transition-colors"
    >
      📥 Excel herunterladen
    </button>
  );
}

interface BulkDownloadButtonProps {
  results: StockResult[];
}

export function BulkDownloadButton({ results }: BulkDownloadButtonProps) {
  const downloadAll = () => {
    const wb = XLSX.utils.book_new();

    for (const stockResult of results) {
      if (!stockResult.rows.length) continue;

      const ws = XLSX.utils.json_to_sheet(stockResult.rows.map(row => {
        const formatted: Record<string, any> = {};
        for (const [key, val] of Object.entries(row)) {
          if (val === null || val === undefined) {
            formatted[key] = '';
          } else {
            formatted[key] = val;
          }
        }
        return formatted;
      }));

      const sheetName = stockResult.name
        ? `${stockResult.code}-${stockResult.name}`
        : stockResult.code;

      XLSX.utils.book_append_sheet(wb, ws, sheetName.slice(0, 31));
    }

    const today = new Date().toISOString().slice(0, 10);
    XLSX.writeFile(wb, `royabot_export_${today}.xlsx`);
  };

  return (
    <button
      onClick={downloadAll}
      className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-white
        bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
    >
      📦 Alle als Excel herunterladen
    </button>
  );
}