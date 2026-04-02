import React from 'react';
import { DataSource } from '../types';

interface DataSourceSelectorProps {
  value: DataSource;
  onChange: (source: DataSource) => void;
  shioajiEnabled: boolean;
}

export default function DataSourceSelector({ value, onChange, shioajiEnabled }: DataSourceSelectorProps) {
  return (
    <div className="space-y-2">
      <div className="text-sm font-medium text-gray-700">Datenquelle</div>
      <div className="flex flex-col gap-2">
        <label className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
          value === 'yahoo' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:bg-gray-50'
        }`}>
          <input
            type="radio"
            name="dataSource"
            value="yahoo"
            checked={value === 'yahoo'}
            onChange={() => onChange('yahoo')}
            className="accent-blue-600"
          />
          <div>
            <div className="text-sm font-medium">Yahoo Finance</div>
            <div className="text-xs text-gray-500">Kostenlos, keine Anmeldung nötig</div>
          </div>
        </label>

        <label className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
          !shioajiEnabled ? 'opacity-50 cursor-not-allowed' :
          value === 'shioaji' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:bg-gray-50'
        }`} title={!shioajiEnabled ? 'Shioaji-Zugangsdaten nicht konfiguriert' : undefined}>
          <input
            type="radio"
            name="dataSource"
            value="shioaji"
            checked={value === 'shioaji'}
            onChange={() => shioajiEnabled && onChange('shioaji')}
            disabled={!shioajiEnabled}
            className="accent-blue-600"
          />
          <div>
            <div className="text-sm font-medium">Shioaji (永豐金)</div>
            <div className="text-xs text-gray-500">
              {shioajiEnabled ? '永豐金證券 API' : 'Nicht konfiguriert'}
            </div>
          </div>
        </label>
      </div>
    </div>
  );
}