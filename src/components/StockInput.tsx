import { useState, useCallback, useRef } from 'react'
import { parseExcelForCodes } from '../services/excelParser'

interface StockInputProps {
  onAnalyze: (codes: string[]) => void
  isLoading: boolean
}

type TabType = 'excel' | 'manual'

export function StockInput({ onAnalyze, isLoading }: StockInputProps) {
  const [activeTab, setActiveTab] = useState<TabType>('excel')
  const [manualInput, setManualInput] = useState('')
  const [excelCodes, setExcelCodes] = useState<string[]>([])
  const [excelFileName, setExcelFileName] = useState<string | null>(null)
  const [excelError, setExcelError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isDragOver, setIsDragOver] = useState(false)

  const parseManualCodes = useCallback((text: string): string[] => {
    const regex = /(\d{4,6}[A-Z]?)/g
    const matches = text.match(regex) || []
    return [...new Set(matches)]
  }, [])

  const handleExcelUpload = async (file: File) => {
    setExcelError(null)
    try {
      const codes = await parseExcelForCodes(file)
      if (codes.length === 0) {
        setExcelError('Keine gültigen Aktiencodes in der Excel-Datei gefunden.')
        setExcelCodes([])
        setExcelFileName(null)
      } else {
        setExcelCodes(codes)
        setExcelFileName(file.name)
      }
    } catch {
      setExcelError('Excel-Datei konnte nicht gelesen werden. Stellen Sie sicher, dass es sich um eine gültige .xlsx- oder .xls-Datei handelt.')
      setExcelCodes([])
      setExcelFileName(null)
    }
  }

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file && (file.name.endsWith('.xlsx') || file.name.endsWith('.xls'))) {
      handleExcelUpload(file)
    } else {
      setExcelError('Bitte eine gültige Excel-Datei (.xlsx bzw. .xls) hochladen.')
    }
  }, [])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(false)
  }, [])

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      handleExcelUpload(file)
    }
  }

  const handleSubmit = () => {
    if (activeTab === 'excel' && excelCodes.length > 0) {
      onAnalyze(excelCodes)
    } else if (activeTab === 'manual') {
      const codes = parseManualCodes(manualInput)
      if (codes.length > 0) {
        onAnalyze(codes)
      }
    }
  }

  const manualCodes = parseManualCodes(manualInput)
  const activeCodes = activeTab === 'excel' ? excelCodes : manualCodes
  const canSubmit = activeCodes.length > 0 && !isLoading

  return (
    <div>
      {/* Tabs */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setActiveTab('excel')}
          className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
            activeTab === 'excel'
              ? 'bg-blue-500 text-white'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          Excel hochladen
        </button>
        <button
          onClick={() => setActiveTab('manual')}
          className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
            activeTab === 'manual'
              ? 'bg-blue-500 text-white'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          Manuell eingeben
        </button>
      </div>

      {/* Excel Upload Tab */}
      {activeTab === 'excel' && (
        <div>
          <div
            className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors cursor-pointer ${
              isDragOver
                ? 'border-blue-400 bg-blue-50'
                : 'border-slate-300 hover:border-slate-400 hover:bg-slate-50'
            }`}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls"
              onChange={handleFileInput}
              className="hidden"
            />
            <div className="text-3xl mb-3">📊</div>
            <p className="text-slate-600 font-medium">Excel-Datei hierher ziehen</p>
            <p className="text-slate-400 text-sm mt-1">oder klicken, um eine Datei auszuwählen</p>
          </div>

          {excelFileName && (
            <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-green-700 text-sm">
                {excelCodes.length} Codes erkannt aus: {excelFileName}
              </p>
            </div>
          )}

          {excelError && (
            <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-700 text-sm">{excelError}</p>
            </div>
          )}

          <div className="mt-3">
            <a
              href="/Trade-App/template.xlsx"
              download
              className="text-sm text-blue-600 hover:text-blue-800 underline"
            >
              Muster-Vorlage herunterladen
            </a>
          </div>
        </div>
      )}

      {/* Manual Input Tab */}
      {activeTab === 'manual' && (
        <div>
          <textarea
            value={manualInput}
            onChange={(e) => setManualInput(e.target.value)}
            placeholder="z.B. 2330, 0050, 2317, 6505"
            className="w-full h-24 p-3 border border-slate-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <div className="mt-2 text-sm text-slate-500">
            {manualCodes.length > 0
              ? `${manualCodes.length} gültige Codes erkannt`
              : ''}
          </div>
        </div>
      )}

      {/* Analyze Button */}
      <div className="mt-4 flex justify-end">
        <button
          onClick={handleSubmit}
          disabled={!canSubmit}
          className={`px-6 py-2.5 rounded-lg font-medium text-sm transition-colors ${
            canSubmit
              ? 'bg-blue-500 text-white hover:bg-blue-600'
              : 'bg-slate-200 text-slate-400 cursor-not-allowed'
          }`}
        >
          {isLoading ? (
            <span className="flex items-center gap-2">
              <span className="animate-spin inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full"></span>
              Analysiere…
            </span>
          ) : (
            'Analyse starten'
          )}
        </button>
      </div>
    </div>
  )
}