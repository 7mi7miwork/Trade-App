import * as XLSX from 'xlsx'

export function parseExcelForCodes(file: File): Promise<string[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()

    reader.onload = (e) => {
      try {
        const data = e.target?.result as ArrayBuffer
        const workbook = XLSX.read(data, { type: 'array' })

        // Get the first sheet
        const firstSheetName = workbook.SheetNames[0]
        if (!firstSheetName) {
          resolve([])
          return
        }

        const sheet = workbook.Sheets[firstSheetName]
        const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 }) as string[][]

        const codes = new Set<string>()
        const codeRegex = /^\d{4,6}[A-Z]?$/

        for (let i = 0; i < rows.length; i++) {
          const row = rows[i]
          if (!row || row.length === 0) continue

          const value = String(row[0]).trim()

          // Skip header row: first value is not a 4-6 digit number
          if (i === 0 && !/^\d{4,6}/.test(value)) {
            continue
          }

          if (codeRegex.test(value)) {
            codes.add(value)
          }
        }

        resolve(Array.from(codes))
      } catch (err) {
        reject(new Error('Excel-Datei konnte nicht gelesen werden'))
      }
    }

    reader.onerror = () => {
      reject(new Error('Datei konnte nicht gelesen werden'))
    }

    reader.readAsArrayBuffer(file)
  })
}