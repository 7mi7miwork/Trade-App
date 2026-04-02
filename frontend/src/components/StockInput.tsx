import React, { useCallback, useState, useMemo } from 'react';
import * as XLSX from 'xlsx';

interface StockInputProps {
  onCodesChange: (codes: string[], source: string) => void;
  onFileChange: (file: File, previewCodes: string[]) => void;
  clearFile: () => void;
}

const STOCK_CODE_REGEX = /^\d{4,6}$/;

function isValidCode(code: string): boolean {
  const cleaned = code.trim();
  return STOCK_CODE_REGEX.test(cleaned);
}

export default function StockInput({ onCodesChange, onFileChange, clearFile }: StockInputProps) {
  const [mode, setMode] = useState<'text' | 'file'>('text');
  const [textValue, setTextValue] = useState('');
  const [fileName, setFileName] = useState<string>('');
  const [filePreview, setFilePreview] = useState<string[]>([]);
  const [dragActive, setDragActive] = useState(false);

  const parsedCodes = useMemo(() => {
    if (mode !== 'text' || !textValue) return [];
    return textValue
      .split(/[,\s\n]+/)
      .map(c => c.trim())
      .filter(c => isValidCode(c));
  }, [textValue, mode]);

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setTextValue(value);
    onCodesChange(parsedCodes, 'text');
  };

  const handleFileUpload = useCallback(async (file: File) => {
    if (!file.name.match(/\.(xlsx|xls)$/i)) {
      alert('Bitte nur .xlsx oder .xls Dateien hochladen');
      return;
    }

    setFileName(file.name);
    const arrayBuffer = await file.arrayBuffer();
    const workbook = XLSX.read(arrayBuffer, { type: 'array' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as string[][];

    // Extract codes from first column, skip header row
    const codes: string[] = [];
    for (let i = 1; i < jsonData.length; i++) {
      const row = jsonData[i];
      if (row && row[0]) {
        const val = String(row[0]).trim();
        if (isValidCode(val)) {
          codes.push(val);
        }
      }
    }

    setFilePreview(codes);
    onFileChange(file, codes);
  }, [onFileChange]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  }, [handleFileUpload]);

  const handleClearFile = () => {
    setFileName('');
    setFilePreview([]);
    clearFile();
  };

  const downloadTemplate = () => {
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet([['Code'], ['2330'], ['0050'], ['2317']]);
    XLSX.utils.book_append_sheet(wb, ws, 'Stocks');
    XLSX.writeFile(wb, 'royabot_template.xlsx');
  };

  const codeCount = mode === 'file' ? filePreview.length : parsedCodes.length;

  return (
    <div className="space-y-3">
      <div className="text-sm font-medium text-gray-700">Aktien eingeben</div>

      {/* Tab Toggle */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-lg w-fit">
        <button
          className={`px-4 py-2 text-sm rounded-md transition-colors ${
            mode === 'file'
              ? 'bg-white shadow text-blue-600 font-medium'
              : 'text-gray-600 hover:text-gray-900'
          }`}
          onClick={() => setMode('file')}
        >
          Excel hochladen
        </button>
        <button
          className={`px-4 py-2 text-sm rounded-md transition-colors ${
            mode === 'text'
              ? 'bg-white shadow text-blue-600 font-medium'
              : 'text-gray-600 hover:text-gray-900'
          }`}
          onClick={() => setMode('text')}
        >
          Manuell eingeben
        </button>
      </div>

      {mode === 'file' ? (
        <div className="space-y-2">
          <div
            className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors cursor-pointer ${
              dragActive
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-300 hover:border-gray-400'
            }`}
            onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
            onDragLeave={() => setDragActive(false)}
            onDrop={handleDrop}
            onClick={() => document.getElementById('file-input')?.click()}
          >
            <input
              id="file-input"
              type="file"
              accept=".xlsx,.xls"
              className="hidden"
              onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])}
            />
            {fileName ? (
              <div className="flex items-center justify-center gap-3">
                <span className="text-green-600 font-medium">📎 {fileName}</span>
                <span className="text-gray-500">({filePreview.length} Codes)</span>
                <button
                  onClick={(e) => { e.stopPropagation(); handleClearFile(); }}
                  className="text-red-500 hover:text-red-700 font-medium text-sm"
                >
                  Entfernen
                </button>
              </div>
            ) : (
              <>
                <p className="text-gray-500">Drag & Drop oder klicken</p>
                <p className="text-xs text-gray-400 mt-1">.xlsx oder .xls</p>
              </>
            )}
          </div>
          <button
            onClick={downloadTemplate}
            className="text-sm text-blue-500 hover:text-blue-700 underline"
          >
            📥 Muster-Vorlage herunterladen
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          <textarea
            className="w-full border border-gray-300 rounded-lg p-3 text-sm font-mono
              focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
              resize-none h-28 placeholder:text-gray-400"
            placeholder="z.B. 2330, 0050, 2317&#10;oder pro Zeile ein Code"
            value={textValue}
            onChange={handleTextChange}
          />
        </div>
      )}

      {codeCount > 0 && (
        <div className="text-sm text-green-600 bg-green-50 px-3 py-1.5 rounded-lg">
          ✓ {codeCount} gültige{mode === 'file' ? ' erkannte' : ' '} Code{codeCount > 1 ? 's' : ''} erkannt
        </div>
      )}
    </div>
  );
}