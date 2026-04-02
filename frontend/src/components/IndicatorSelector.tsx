import React from 'react';

const AVAILABLE_INDICATORS = [
  { key: 'NATR', label: 'NATR', description: 'Normalized Average True Range' },
  { key: 'RSI', label: 'RSI', description: 'Relative Strength Index' },
  { key: 'MACD', label: 'MACD', description: 'Moving Average Convergence Divergence' },
  { key: 'BBANDS', label: 'Bollinger Bands', description: 'BBANDS' },
];

interface IndicatorSelectorProps {
  selected: string[];
  onChange: (indicators: string[]) => void;
}

export default function IndicatorSelector({ selected, onChange }: IndicatorSelectorProps) {
  const toggle = (key: string) => {
    if (selected.includes(key)) {
      onChange(selected.filter(k => k !== key));
    } else {
      onChange([...selected, key]);
    }
  };

  return (
    <div className="space-y-2">
      <div className="text-sm font-medium text-gray-700">Indikatoren</div>
      <div className="grid grid-cols-2 gap-2">
        {AVAILABLE_INDICATORS.map(ind => (
          <label
            key={ind.key}
            className={`flex items-center gap-2 p-2.5 rounded-lg border cursor-pointer transition-colors ${
              selected.includes(ind.key)
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 hover:bg-gray-50'
            }`}
          >
            <input
              type="checkbox"
              checked={selected.includes(ind.key)}
              onChange={() => toggle(ind.key)}
              className="accent-blue-600 rounded"
            />
            <div>
              <div className="text-sm font-medium">{ind.label}</div>
              <div className="text-xs text-gray-500">{ind.description}</div>
            </div>
          </label>
        ))}
      </div>
      <div className="flex items-center gap-2 text-xs text-red-500">
        {!selected.length && <span>⚠ Mindestens ein Indikator muss ausgewählt sein</span>}
      </div>
    </div>
  );
}